/**
 * CHANG SUEK RUN 2027 — web server.
 *
 * Money rules (all enforced here, never in the browser):
 *  1. Prices come from src/data/eventData.ts on the server. The browser cannot set the amount.
 *  2. Payment is Omise PromptPay only (no slip upload). An order becomes PAID only by:
 *       a) an Omise charge we re-fetched from api.omise.co with our secret key, or
 *       b) an authenticated admin approving it manually (e.g. cash paid on site).
 *  3. BIB numbers are assigned by the server at the moment an order is paid.
 *  4. Admin endpoints require a signed token from /api/admin/login.
 */
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import type { RouteId } from './src/types';
import { calcTicketTotal, isDogCategory, ticketById, ticketCategories } from './src/data/eventData';
import {
  DATA_DIR,
  SLIP_DIR,
  getEffectiveSlipApiKeys,
  getOrder,
  hashToken,
  isTransRefUsed,
  markOrderPaid,
  mutate,
  nextBibPreview,
  read,
  toAdminView,
  toRunnerView,
  tokenMatches,
  type StoredOrder,
} from './server/store';
import { checkCredentials, issueToken, requireAdmin } from './server/auth';
import { createOmiseCharge, fetchOmiseQrImage, fetchVerifiedOmiseCharge, omiseKeyMode } from './server/payments';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Must match PRIVACY_POLICY_VERSION in src/components/PrivacyNotice.tsx */
const PRIVACY_POLICY_VERSION = '2026-10-22';
/** Must match TERMS_VERSION in src/data/terms.ts */
const TERMS_VERSION = '2026-10-22';

const ROUTE_IDS: RouteId[] = ticketCategories.map((t) => t.id);
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const MAX_EXTRA = 9;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function clean(input: unknown, max: number): string {
  return String(input ?? '')
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .trim()
    .slice(0, max);
}

function clientIp(req: express.Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

const hits = new Map<string, number[]>();
function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > limit;
}

function orderToken(req: express.Request): string | undefined {
  const h = req.headers['x-order-token'];
  return typeof h === 'string' ? h : undefined;
}

function loadOwnedOrder(req: express.Request, res: express.Response): StoredOrder | null {
  const order = getOrder(String(req.params.orderId));
  if (!order || !tokenMatches(order, orderToken(req))) {
    res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
    return null;
  }
  return order;
}

/** Re-checks an Omise charge and marks the order paid if (and only if) Omise confirms it. */
async function settleFromOmise(order: StoredOrder, chargeId = order.omiseChargeId): Promise<StoredOrder> {
  if (!chargeId || order.paymentStatus === 'PAID') return order;
  const known = chargeId === order.omiseChargeId || (order.omisePastChargeIds || []).includes(chargeId);
  if (!known) return order;
  const charge = await fetchVerifiedOmiseCharge(chargeId);
  if (
    charge?.paid &&
    charge.orderId === order.orderId &&
    charge.currency === 'THB' &&
    charge.amountSatang === Math.round(order.totalPrice * 100)
  ) {
    return (
      markOrderPaid(order.orderId, {
        status: 'AUTO_VERIFIED',
        verifiedBy: 'Omise PromptPay (ยืนยันจาก Omise API)',
        paymentRef: charge.chargeId || chargeId,
        senderBank: 'Omise PromptPay',
      }) || order
    );
  }
  return order;
}

/** Checks the current charge and the two most recent replaced ones. */
async function settleAll(order: StoredOrder): Promise<StoredOrder> {
  for (const id of [order.omiseChargeId, ...(order.omisePastChargeIds || []).slice(-2)]) {
    if (order.paymentStatus === 'PAID') break;
    order = await settleFromOmise(order, id);
  }
  return order;
}

function publicConfig() {
  const s = read().settings;
  return {
    promptPayId: s.promptPayId,
    accountName: s.accountName,
    bankLabel: s.bankLabel,
    bankAccountNo: s.bankAccountNo,
    paymentTimeoutMinutes: s.paymentTimeoutMinutes,
    nextBib: Object.fromEntries(ROUTE_IDS.map((r) => [r, nextBibPreview(r)])),
    /** false until an Omise secret key is configured — registration is closed until then */
    paymentReady: Boolean(getEffectiveSlipApiKeys().omiseSecretKey),
  };
}

function gatewayStatus() {
  return {
    hasOmiseKey: Boolean(getEffectiveSlipApiKeys().omiseSecretKey),
    mode: omiseKeyMode(),
    webhookPath: '/api/payment-webhook',
  };
}

// ---------------------------------------------------------------------------
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  const smallJson = express.json({ limit: '200kb' });

  // ---------------- Public ----------------
  app.get('/api/public-config', (_req, res) => {
    res.json(publicConfig());
  });

  // Create an order. The server computes the price; the browser only sends runner details.
  app.post('/api/orders', smallJson, async (req, res) => {
    if (rateLimited(`order:${clientIp(req)}`, 15, 10 * 60 * 1000)) {
      res.status(429).json({ error: 'สร้างคำสั่งซื้อบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' });
      return;
    }
    if (!getEffectiveSlipApiKeys().omiseSecretKey) {
      res.status(503).json({ error: 'ระบบชำระเงินยังไม่เปิดใช้งาน กรุณาติดต่อผู้จัดงาน' });
      return;
    }
    const b = req.body || {};
    const routeId = b.routeId as RouteId;
    if (!ROUTE_IDS.includes(routeId)) {
      res.status(400).json({ error: 'ระยะวิ่งไม่ถูกต้อง' });
      return;
    }
    const isDog = isDogCategory(routeId);
    const extraPeople = isDog ? Math.min(MAX_EXTRA, Math.max(0, Math.floor(Number(b.extraPeople) || 0))) : 0;
    const extraDogs = isDog ? Math.min(MAX_EXTRA, Math.max(0, Math.floor(Number(b.extraDogs) || 0))) : 0;

    const fullName = clean(b.fullName, 120);
    const phone = clean(b.phone, 30);
    const email = clean(b.email, 120);
    const emergencyPhone = clean(b.emergencyPhone, 30);
    const shirtSize = SHIRT_SIZES.includes(b.shirtSize) ? b.shirtSize : '';
    const errors: string[] = [];
    if (fullName.length < 2) errors.push('กรุณากรอกชื่อ-นามสกุล');
    if (phone.replace(/\D/g, '').length < 9) errors.push('เบอร์โทรศัพท์ไม่ถูกต้อง');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('อีเมลไม่ถูกต้อง');
    if (emergencyPhone.replace(/\D/g, '').length < 9) errors.push('เบอร์ติดต่อฉุกเฉินไม่ถูกต้อง');
    if (!shirtSize) errors.push('กรุณาเลือกไซซ์เสื้อ');
    if (b.privacyConsent !== true) errors.push('กรุณายอมรับข้อกำหนดและเงื่อนไขและประกาศความเป็นส่วนตัว');
    if (errors.length) {
      res.status(400).json({ error: errors.join(' · ') });
      return;
    }

    const total = calcTicketTotal(routeId, extraPeople, extraDogs);
    const token = crypto.randomBytes(24).toString('base64url');
    const now = new Date();
    const timeoutMin = Math.max(1, read().settings.paymentTimeoutMinutes || 15);

    const order = mutate((d) => {
      d.orderSeq += 1;
      const o: StoredOrder = {
        orderId: `CSR27-${String(d.orderSeq).padStart(5, '0')}`,
        accessTokenHash: hashToken(token),
        fullName,
        phone,
        email,
        emergencyPhone,
        routeId,
        routeName: ticketById(routeId).name,
        shirtSize,
        runningWithDog: isDog,
        dogName: isDog ? clean(b.dogName, 80) : undefined,
        dogBreed: isDog ? clean(b.dogBreed, 80) : undefined,
        extraPeople,
        extraDogs,
        extraRunnerNames: extraPeople > 0 ? clean(b.extraRunnerNames, 240) : undefined,
        peopleCount: isDog ? 1 + extraPeople : 1,
        dogCount: isDog ? 1 + extraDogs : 0,
        totalPrice: total,
        bibNumber: '',
        paymentMethod: 'PROMPTPAY_QR',
        paymentStatus: 'PENDING',
        paymentRef: '',
        senderBank: '',
        verificationStatus: 'AWAITING_PAYMENT',
        kitStatus: 'PENDING_PICKUP',
        registrationStatus: 'REGISTERED',
        privacyConsentAt: now.toISOString(),
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        termsVersion: TERMS_VERSION,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + timeoutMin * 60 * 1000).toISOString(),
      };
      d.orders.unshift(o);
      return o;
    });

    const charge = await createOmiseCharge({ amountBaht: total, orderId: order.orderId });
    if (!charge.chargeId || !charge.qrImageUrl) {
      console.warn(`[omise] charge create failed for ${order.orderId}: ${charge.error}`);
      mutate((d) => {
        d.orders = d.orders.filter((o) => o.orderId !== order.orderId);
      });
      res.status(502).json({ error: 'สร้าง QR ชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' });
      return;
    }
    mutate(() => {
      order.omiseChargeId = charge.chargeId;
      order.omiseQrImageUrl = charge.qrImageUrl;
      if (charge.expiresAt) order.expiresAt = charge.expiresAt;
    });

    res.json({ order: toRunnerView(order), accessToken: token, config: publicConfig() });
  });

  // Order status for the runner who created it (requires the order's access token).
  app.get('/api/orders/:orderId', async (req, res) => {
    let order = loadOwnedOrder(req, res);
    if (!order) return;
    order = await settleAll(order);
    res.json({ order: toRunnerView(order) });
  });

  // QR image for the runner's own order, served same-origin so it can be saved on a phone.
  app.get('/api/orders/:orderId/qr', async (req, res) => {
    const order = loadOwnedOrder(req, res);
    if (!order) return;
    const img = order.omiseQrImageUrl ? await fetchOmiseQrImage(order.omiseQrImageUrl) : null;
    if (!img) {
      res.status(502).json({ error: 'โหลด QR ไม่สำเร็จ' });
      return;
    }
    res.setHeader('Content-Type', img.type);
    res.setHeader('Cache-Control', 'private, max-age=300');
    // The image comes from Omise; never let it run scripts if opened directly.
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.send(img.body);
  });

  // New QR for an unpaid order whose Omise charge expired (same order, same price).
  app.post('/api/orders/:orderId/renew-qr', async (req, res) => {
    let order = loadOwnedOrder(req, res);
    if (!order) return;
    if (rateLimited(`renew:${order.orderId}`, 6, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'ขอ QR ใหม่บ่อยเกินไป กรุณารอสักครู่' });
      return;
    }
    order = await settleAll(order);
    if (order.paymentStatus === 'PAID') {
      res.json({ order: toRunnerView(order) });
      return;
    }
    const charge = await createOmiseCharge({ amountBaht: order.totalPrice, orderId: order.orderId });
    if (!charge.chargeId || !charge.qrImageUrl) {
      res.status(502).json({ error: 'สร้าง QR ใหม่ไม่สำเร็จ กรุณาลองใหม่' });
      return;
    }
    const timeoutMin = Math.max(1, read().settings.paymentTimeoutMinutes || 15);
    const o = order;
    mutate(() => {
      if (o.omiseChargeId) o.omisePastChargeIds = [...(o.omisePastChargeIds || []), o.omiseChargeId].slice(-10);
      o.omiseChargeId = charge.chargeId;
      o.omiseQrImageUrl = charge.qrImageUrl;
      o.expiresAt = charge.expiresAt || new Date(Date.now() + timeoutMin * 60 * 1000).toISOString();
    });
    res.json({ order: toRunnerView(o) });
  });

  // Omise webhook. The body is only a hint — we always re-fetch the charge from Omise.
  app.post('/api/payment-webhook', smallJson, async (req, res) => {
    const chargeId = req.body?.data?.object === 'charge' ? String(req.body.data.id || '') : '';
    if (chargeId) {
      const charge = await fetchVerifiedOmiseCharge(chargeId);
      const order = charge?.orderId ? getOrder(charge.orderId) : undefined;
      if (order) await settleFromOmise(order, chargeId);
    }
    res.json({ received: true });
  });

  // ---------------- Admin ----------------
  app.post('/api/admin/login', smallJson, (req, res) => {
    const r = checkCredentials(clientIp(req), req.body?.username, req.body?.password);
    if (r.ok) {
      const username = String(req.body.username).trim();
      console.log(`[admin] login ok: ${username} from ${clientIp(req)}`);
      res.json({ ...issueToken(username), username });
      return;
    }
    console.warn(`[admin] login failed from ${clientIp(req)}`);
    res.status(r.lockedSeconds ? 429 : 401).json({
      error: r.lockedSeconds
        ? `ใส่รหัสผิดหลายครั้ง ระงับการเข้าสู่ระบบ ${Math.ceil(r.lockedSeconds / 60)} นาที`
        : `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลืออีก ${r.remaining} ครั้ง)`,
      lockedSeconds: r.lockedSeconds,
    });
  });

  app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
    // Settle any Omise orders still waiting (covers missed webhooks).
    const waiting = read().orders.filter((o) => o.omiseChargeId && o.paymentStatus !== 'PAID').slice(0, 20);
    for (const o of waiting) await settleAll(o);
    res.json({
      orders: read().orders.map(toAdminView),
      bibCounters: read().bibCounters,
      nextBib: publicConfig().nextBib,
    });
  });

  app.post('/api/admin/orders/:orderId/verification', requireAdmin, smallJson, (req, res) => {
    const order = getOrder(String(req.params.orderId));
    if (!order) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    const admin = (req as any).admin.username as string;
    const status = req.body?.status;
    if (status === 'ADMIN_APPROVED') {
      const ref = clean(req.body?.paymentRef, 60) || order.paymentRef || `MANUAL-${order.orderId}`;
      if (ref !== order.paymentRef && isTransRefUsed(ref)) {
        res.status(400).json({ error: `เลขที่รายการ ${ref} ถูกใช้กับคำสั่งซื้ออื่นแล้ว` });
        return;
      }
      markOrderPaid(order.orderId, {
        status: 'ADMIN_APPROVED',
        verifiedBy: admin,
        paymentRef: ref,
        senderBank: clean(req.body?.senderBank, 80) || order.senderBank,
      });
    } else if (status === 'REJECTED' || status === 'PENDING_REVIEW') {
      mutate(() => {
        order.verificationStatus = status;
        order.paymentStatus = 'PENDING';
        order.registrationStatus = 'REGISTERED';
        order.verifiedAt = new Date().toISOString();
        order.verifiedBy = admin;
      });
    } else {
      res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
      return;
    }
    console.log(`[admin] ${admin} set ${order.orderId} -> ${status}`);
    res.json({ order: toAdminView(getOrder(order.orderId)!) });
  });

  app.post('/api/admin/orders/:orderId/kit', requireAdmin, (req, res) => {
    const order = getOrder(String(req.params.orderId));
    if (!order) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    if (order.paymentStatus !== 'PAID') {
      res.status(400).json({ error: 'คำสั่งซื้อนี้ยังไม่ได้ชำระเงิน' });
      return;
    }
    mutate(() => {
      order.kitStatus = order.kitStatus === 'CHECKED_IN' ? 'PENDING_PICKUP' : 'CHECKED_IN';
      order.registrationStatus = order.kitStatus === 'CHECKED_IN' ? 'CHECKED_IN' : 'CONFIRMED';
    });
    res.json({ order: toAdminView(order) });
  });

  app.delete('/api/admin/orders/:orderId', requireAdmin, (req, res) => {
    const id = String(req.params.orderId);
    const order = getOrder(id);
    if (!order) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    mutate((d) => {
      d.orders = d.orders.filter((o) => o.orderId !== id);
    });
    if (order.slipFile) fs.rm(path.join(SLIP_DIR, order.slipFile), { force: true }, () => {});
    console.log(`[admin] ${(req as any).admin.username} deleted ${id}`);
    res.json({ ok: true });
  });

  app.get('/api/admin/settings', requireAdmin, (_req, res) => {
    res.json({ settings: read().settings, bibCounters: read().bibCounters });
  });

  app.put('/api/admin/settings', requireAdmin, smallJson, (req, res) => {
    const s = req.body?.settings || {};
    const counters = req.body?.bibCounters || {};
    const promptPayId = String(s.promptPayId || '').replace(/[^0-9]/g, '');
    if (![10, 13, 15].includes(promptPayId.length)) {
      res.status(400).json({ error: 'รหัสพร้อมเพย์ต้องเป็นเบอร์โทร 10 หลัก, เลขบัตร/เลขผู้เสียภาษี 13 หลัก หรือเลขอ้างอิง K PLUS 15 หลัก' });
      return;
    }
    const bankAccountNo = String(s.bankAccountNo || '').replace(/[^0-9]/g, '');
    if (bankAccountNo && (bankAccountNo.length < 10 || bankAccountNo.length > 15)) {
      res.status(400).json({ error: 'เลขบัญชีธนาคารต้องมี 10–15 หลัก' });
      return;
    }
    const current = read().bibCounters;
    for (const r of ROUTE_IDS) {
      const v = counters[r];
      if (v !== undefined && (!Number.isInteger(v) || v < current[r] || v > 9999)) {
        res.status(400).json({ error: `ลำดับ BIB ของ ${r} ต้องไม่น้อยกว่าที่ออกไปแล้ว (${current[r]})` });
        return;
      }
    }
    mutate((d) => {
      d.settings = {
        promptPayId,
        accountName: clean(s.accountName, 150) || d.settings.accountName,
        bankLabel: clean(s.bankLabel, 80) || d.settings.bankLabel,
        bankAccountNo,
        paymentTimeoutMinutes: Math.min(120, Math.max(5, Math.floor(Number(s.paymentTimeoutMinutes) || 15))),
      };
      for (const r of ROUTE_IDS) if (counters[r] !== undefined) d.bibCounters[r] = counters[r];
    });
    console.log(`[admin] ${(req as any).admin.username} updated settings`);
    res.json({ settings: read().settings, bibCounters: read().bibCounters });
  });

  app.get('/api/admin/payment-gateway', requireAdmin, (_req, res) => {
    res.json(gatewayStatus());
  });

  app.post('/api/admin/payment-gateway', requireAdmin, smallJson, (req, res) => {
    const admin = (req as any).admin.username as string;
    if (req.body?.clear === true) {
      mutate((d) => {
        d.slipApi = { ...d.slipApi, omiseSecretKey: '' };
      });
      console.log(`[admin] ${admin} removed the Omise key`);
      res.json(gatewayStatus());
      return;
    }
    const key = String(req.body?.secretKey || '').trim();
    if (!/^skey_(test_)?[A-Za-z0-9]{10,}$/.test(key)) {
      res.status(400).json({ error: 'Omise Secret Key ต้องขึ้นต้นด้วย skey_ หรือ skey_test_' });
      return;
    }
    mutate((d) => {
      d.slipApi = { ...d.slipApi, omiseSecretKey: key };
    });
    console.log(`[admin] ${admin} set the Omise key (${key.startsWith('skey_test_') ? 'test' : 'live'})`);
    res.json(gatewayStatus());
  });

  // Any other /api path is a 404 (prevents the SPA fallback from answering API calls).
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
    const renderIndex = (req: express.Request) => {
      // LINE / Facebook link previews need absolute URLs for og:image
      const origin = (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
      return indexHtml.split('__SITE_ORIGIN__').join(origin.replace(/[<>"']/g, ''));
    };
    app.get(['/', '/index.html'], (req, res) => {
      res.type('html').send(renderIndex(req));
    });
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      res.type('html').send(renderIndex(req));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}  (data: ${DATA_DIR})`);
  });
}

startServer();
