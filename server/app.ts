/**
 * CHANG SUEK RUN 2027 — API (Express app, no listener).
 * Used by server.ts (local / any Node host) and by the Vercel function (api/index.js).
 *
 * Money rules (all enforced here, never in the browser):
 *  1. Prices come from src/data/eventData.ts on the server. The browser cannot set the amount.
 *  2. Payment is Omise PromptPay only (no slip upload). An order becomes PAID only by:
 *       a) an Omise charge we re-fetched from api.omise.co with our secret key, or
 *       b) an authenticated admin approving it manually (e.g. cash paid on site).
 *  3. BIB numbers are assigned by the database at the moment an order is paid.
 *  4. Admin endpoints require a signed token from /api/admin/login.
 */
import express from 'express';
import crypto from 'crypto';
import type { RouteId } from '../src/types';
import { CONCERT_PASS_PRICE, calcTicketTotal, isDogCategory, ticketById, ticketCategories } from '../src/data/eventData';
import {
  deleteOrder,
  getBibCounters,
  getOmiseKey,
  getOrder,
  getSettings,
  createSponsorCode,
  deleteUnusedSponsorCode,
  generateSponsorCode,
  hashToken,
  insertOrderChecked,
  isRefUsed,
  listOrders,
  listSponsorCodes,
  markOrderPaid,
  nextOrderId,
  normalizeSponsorCode,
  peekSponsorCode,
  rateLimited,
  redeemSponsorCode,
  releaseSponsorCode,
  saveSettings,
  setBibCounters,
  setOmiseKey,
  toAdminView,
  toRunnerView,
  tokenMatches,
  updateOrder,
  updateSponsorCode,
  windTunnelSeatsUsed,
  formatBib,
  findOrderByCode,
  getWinners,
  saveWinners,
  type Winner,
  ROUTES,
  type StoredOrder,
} from './store';
import { WIND_TUNNEL_LIMIT, addOnBonusDiscount, addOnLabel, addOnPricePerPerson, addOnTotal, concertDiscountPerTicket, hasAddOns, normalizeAddOns } from '../src/data/addOns';
import { needsInsurance, parseInsurance, type InsuranceInfo } from '../src/data/insurance';
import { checkCredentials, issueToken, requireAdmin } from './auth';
import { createOmiseCharge, fetchOmiseQrImage, fetchVerifiedOmiseCharge, omiseKeyMode } from './payments';

/** Must match PRIVACY_POLICY_VERSION in src/components/PrivacyNotice.tsx */
const PRIVACY_POLICY_VERSION = '2026-10-22';
/** Must match TERMS_VERSION in src/data/terms.ts */
const TERMS_VERSION = '2026-10-22';

const ROUTE_IDS: RouteId[] = ticketCategories.map((t) => t.id);
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const MAX_EXTRA = 9;
const SPONSOR_INVALID_MSG = 'รหัสสปอนเซอร์ไม่ถูกต้อง หรือถูกใช้ครบสิทธิ์แล้ว';

// ---------------------------------------------------------------------------
// Helpers
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

function orderToken(req: express.Request): string | undefined {
  const h = req.headers['x-order-token'];
  return typeof h === 'string' ? h : undefined;
}

async function loadOwnedOrder(req: express.Request, res: express.Response): Promise<StoredOrder | null> {
  const order = await getOrder(String(req.params.orderId));
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
      (await markOrderPaid(order.orderId, {
        status: 'AUTO_VERIFIED',
        verifiedBy: 'Omise PromptPay (ยืนยันจาก Omise API)',
        paymentRef: charge.chargeId || chargeId,
        senderBank: 'Omise PromptPay',
      })) || order
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

async function nextBibPreview() {
  const counters = await getBibCounters();
  return Object.fromEntries(ROUTE_IDS.map((r) => [r, formatBib(r, (counters[r] || 0) + 1)]));
}

async function publicConfig() {
  const [s, nextBib, key, windUsed] = await Promise.all([getSettings(), nextBibPreview(), getOmiseKey(), windTunnelSeatsUsed()]);
  return {
    windTunnelLimit: WIND_TUNNEL_LIMIT,
    windTunnelRemaining: Math.max(0, WIND_TUNNEL_LIMIT - windUsed),
    promptPayId: s.promptPayId,
    accountName: s.accountName,
    bankLabel: s.bankLabel,
    bankAccountNo: s.bankAccountNo,
    paymentTimeoutMinutes: s.paymentTimeoutMinutes,
    nextBib,
    /** false until an Omise secret key is configured — registration is closed until then */
    paymentReady: Boolean(key),
  };
}

async function gatewayStatus() {
  return {
    hasOmiseKey: Boolean(await getOmiseKey()),
    mode: await omiseKeyMode(),
    webhookPath: '/api/payment-webhook',
  };
}

type Handler = (req: express.Request, res: express.Response) => Promise<void>;
/** Express 4 doesn't catch rejected promises; this turns them into a clean 500. */
const h =
  (fn: Handler): express.RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch((err) => {
      console.error(`[error] ${req.method} ${req.path}:`, err?.message || err);
      if (!res.headersSent) res.status(500).json({ error: 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง' });
      else next(err);
    });
  };

// ---------------------------------------------------------------------------
export function createApp(): express.Express {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  const smallJson = express.json({ limit: '200kb' });

  // ---------------- Public ----------------
  app.get('/api/public-config', h(async (_req, res) => {
    res.json(await publicConfig());
  }));

  // Winners board (public read)
  app.get('/api/winners', h(async (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ winners: await getWinners() });
  }));

  // Is this sponsor code usable? (Does not use it up.) Heavily rate limited against guessing.
  app.post('/api/sponsor-code/check', smallJson, h(async (req, res) => {
    if (await rateLimited(`sponsor-check:${clientIp(req)}`, 12, 10 * 60 * 1000)) {
      res.status(429).json({ error: 'ตรวจรหัสบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' });
      return;
    }
    const code = normalizeSponsorCode(req.body?.code);
    const found = code ? await peekSponsorCode(code) : undefined;
    if (!found) {
      res.status(404).json({ error: SPONSOR_INVALID_MSG });
      return;
    }
    res.json({ valid: true, sponsorName: found.sponsorName });
  }));

  // Create an order. The server computes the price; the browser only sends runner details.
  app.post('/api/orders', smallJson, h(async (req, res) => {
    if (await rateLimited(`order:${clientIp(req)}`, 15, 10 * 60 * 1000)) {
      res.status(429).json({ error: 'สร้างคำสั่งซื้อบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' });
      return;
    }
    const b = req.body || {};
    const isConcert = b.ticketType === 'CONCERT';
    // Add-on activities only: no run ticket and no concert ticket
    const isAddonOnly = b.ticketType === 'ADDON';
    const noRun = isConcert || isAddonOnly;
    const sponsorCode = !noRun && b.sponsorCode ? normalizeSponsorCode(b.sponsorCode) : '';
    if (b.sponsorCode && !sponsorCode) {
      res.status(400).json({ error: SPONSOR_INVALID_MSG });
      return;
    }
    // Add-on activities are always paid (a sponsor code only covers the run + concert).
    const addOns = normalizeAddOns(b.addOns);
    // Bundle discounts need a run ticket in the same order and never stack with a sponsor code.
    const discountEligible = !noRun && !sponsorCode;
    const addOnSum = addOnTotal(addOns, discountEligible);
    // A fully free sponsor registration doesn't need the payment gateway.
    if ((!sponsorCode || addOnSum > 0) && !(await getOmiseKey())) {
      res.status(503).json({ error: 'ระบบชำระเงินยังไม่เปิดใช้งาน กรุณาติดต่อผู้จัดงาน' });
      return;
    }
    // Concert-only pass: no run, no BIB, no shirt (the run ticket already includes the concert)
    const routeId = (isConcert ? 'concert' : isAddonOnly ? 'addon' : b.routeId) as RouteId;
    // Concert tickets are sold separately: alone, or together with a run ticket and/or activities.
    // (A sponsor code already covers the run + one concert entry, so no extra concert tickets are charged with it.)
    const wantedConcert = Math.min(9, Math.max(0, Math.floor(Number(b.concertQty) || 0)));
    const concertQty = isConcert ? Math.max(1, wantedConcert) : !isAddonOnly && !sponsorCode ? wantedConcert : 0;
    if (isAddonOnly && !hasAddOns(addOns)) {
      res.status(400).json({ error: 'กรุณาเลือกกิจกรรมเสริมอย่างน้อย 1 อย่าง' });
      return;
    }
    if (!noRun && !ROUTE_IDS.includes(routeId)) {
      res.status(400).json({ error: 'ระยะวิ่งไม่ถูกต้อง' });
      return;
    }
    const isDog = !noRun && isDogCategory(routeId);
    // A sponsor code covers one runner (plus the dog); extra people / dogs are not part of it.
    const extraPeople = isDog && !sponsorCode ? Math.min(MAX_EXTRA, Math.max(0, Math.floor(Number(b.extraPeople) || 0))) : 0;
    // Extra dogs are no longer sold: a Dog Run ticket is 1 runner + 1 dog.
    const extraDogs = 0;

    // 5 KM / 10 KM runners are insured: the insurer needs their details (the name comes from these fields)
    let insurance: InsuranceInfo | undefined;
    let insuranceError = '';
    if (!noRun && needsInsurance(routeId)) {
      const parsed = parseInsurance(b.insurance, b.insuranceConsent);
      if (parsed.ok) insurance = parsed.value;
      else insuranceError = parsed.error;
    }
    const fullName = insurance ? `${insurance.firstName} ${insurance.lastName}`.slice(0, 120) : clean(b.fullName, 120);
    const phone = clean(b.phone, 30);
    const email = clean(b.email, 120);
    const emergencyPhone = clean(b.emergencyPhone, 30);
    const shirtSize = noRun ? '' : SHIRT_SIZES.includes(b.shirtSize) ? b.shirtSize : '';
    const errors: string[] = [];
    if (insuranceError) errors.push(insuranceError);
    if (!insuranceError && fullName.length < 2) errors.push('กรุณากรอกชื่อ-นามสกุล');
    if (phone.replace(/\D/g, '').length < 9) errors.push('เบอร์โทรศัพท์ไม่ถูกต้อง');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('อีเมลไม่ถูกต้อง');
    if (emergencyPhone.replace(/\D/g, '').length < 9) errors.push('เบอร์ติดต่อฉุกเฉินไม่ถูกต้อง');
    if (!noRun && !shirtSize) errors.push('กรุณาเลือกไซซ์เสื้อ');
    if (b.privacyConsent !== true) errors.push('กรุณายอมรับข้อกำหนดและเงื่อนไขและประกาศความเป็นส่วนตัว');
    if (errors.length) {
      res.status(400).json({ error: errors.join(' · ') });
      return;
    }

    // Use the sponsor code only after the form passed validation, so a typo doesn't burn a use.
    let sponsorName = '';
    if (sponsorCode) {
      const used = await redeemSponsorCode(sponsorCode);
      if (!used) {
        res.status(400).json({ error: SPONSOR_INVALID_MSG });
        return;
      }
      sponsorName = used.sponsorName;
    }

    const concertDiscount = concertQty * concertDiscountPerTicket(CONCERT_PASS_PRICE, discountEligible);
    const ticketTotal = isAddonOnly
      ? 0
      : isConcert
        ? CONCERT_PASS_PRICE * concertQty
        : sponsorCode
          ? 0
          : calcTicketTotal(routeId, extraPeople, extraDogs) + CONCERT_PASS_PRICE * concertQty - concertDiscount;
    const total = ticketTotal + addOnSum;
    const token = crypto.randomBytes(24).toString('base64url');
    const now = new Date();
    const settings = await getSettings();
    const timeoutMin = Math.max(1, settings.paymentTimeoutMinutes || 15);

    const order: StoredOrder = {
      orderId: await nextOrderId(),
      accessTokenHash: hashToken(token),
      fullName,
      phone,
      email,
      emergencyPhone,
      routeId,
      routeName: isAddonOnly ? 'กิจกรรมเสริมอย่างเดียว (ไม่วิ่ง)' : isConcert ? 'ตั๋วคอนเสิร์ต / เข้างาน (ไม่วิ่ง)' : ticketById(routeId).name,
      ticketType: isAddonOnly ? 'ADDON' : isConcert ? 'CONCERT' : 'RUN',
      concertQty: concertQty > 0 ? concertQty : undefined,
      concertDiscount: concertDiscount > 0 ? concertDiscount : undefined,
      insurance,
      shirtSize,
      runningWithDog: isDog,
      dogName: isDog ? clean(b.dogName, 80) : undefined,
      dogBreed: isDog ? clean(b.dogBreed, 80) : undefined,
      extraPeople,
      extraDogs,
      extraRunnerNames: extraPeople > 0 ? clean(b.extraRunnerNames, 240) : undefined,
      peopleCount: isAddonOnly ? addOns.people : isConcert ? concertQty : isDog ? 1 + extraPeople : 1,
      dogCount: isDog ? 1 + extraDogs : 0,
      totalPrice: total,
      bibNumber: '',
      paymentMethod: sponsorCode ? 'SPONSOR_CODE' : 'PROMPTPAY_QR',
      sponsorCode: sponsorCode || undefined,
      sponsorName: sponsorName || undefined,
      addOns: hasAddOns(addOns)
        ? { ...addOns, pricePerPerson: addOnPricePerPerson(addOns), total: addOnSum, discount: addOnBonusDiscount(addOns, discountEligible), label: addOnLabel(addOns) }
        : undefined,
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
    let seats: { ok: true } | { ok: false; remaining: number };
    try {
      seats = await insertOrderChecked(order, WIND_TUNNEL_LIMIT);
    } catch (err) {
      if (sponsorCode) await releaseSponsorCode(sponsorCode).catch(() => {});
      throw err;
    }
    if (!seats.ok) {
      if (sponsorCode) await releaseSponsorCode(sponsorCode).catch(() => {});
      res.status(409).json({
        error:
          seats.remaining > 0
            ? `อุโมงค์ลมเหลือ ${seats.remaining} ที่ กรุณาลดจำนวนคนหรือเอาอุโมงค์ลมออก`
            : `อุโมงค์ลมเต็มแล้ว (ครบ ${WIND_TUNNEL_LIMIT} ท่าน)`,
        windTunnelRemaining: seats.remaining,
      });
      return;
    }

    if (sponsorCode && total === 0) {
      // Free registration: confirm immediately (the BIB is assigned here, like a paid order).
      let paid: StoredOrder | undefined;
      try {
        paid = await markOrderPaid(order.orderId, {
          status: 'AUTO_VERIFIED',
          verifiedBy: `รหัสสปอนเซอร์: ${sponsorName}`,
          paymentRef: '',
          senderBank: 'SPONSOR',
          note: `ใช้รหัสสปอนเซอร์ ${sponsorCode} (${sponsorName}) — วิ่ง + คอนเสิร์ต ไม่คิดค่าสมัคร`,
        });
      } catch (err) {
        await deleteOrder(order.orderId).catch(() => {});
        await releaseSponsorCode(sponsorCode).catch(() => {});
        throw err;
      }
      res.json({ order: toRunnerView(paid || order), accessToken: token, config: await publicConfig() });
      return;
    }

    const charge = await createOmiseCharge({ amountBaht: total, orderId: order.orderId });
    if (!charge.chargeId || !charge.qrImageUrl) {
      console.warn(`[omise] charge create failed for ${order.orderId}: ${charge.error}`);
      await deleteOrder(order.orderId);
      res.status(502).json({ error: 'สร้าง QR ชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' });
      return;
    }
    const saved = await updateOrder(order.orderId, (o) => {
      o.omiseChargeId = charge.chargeId;
      o.omiseQrImageUrl = charge.qrImageUrl;
      if (charge.expiresAt) o.expiresAt = charge.expiresAt;
    });

    res.json({ order: toRunnerView(saved || order), accessToken: token, config: await publicConfig() });
  }));

  // Order status for the runner who created it (requires the order's access token).
  app.get('/api/orders/:orderId', h(async (req, res) => {
    let order = await loadOwnedOrder(req, res);
    if (!order) return;
    order = await settleAll(order);
    res.json({ order: toRunnerView(order) });
  }));

  // QR image for the runner's own order, served same-origin so it can be saved on a phone.
  app.get('/api/orders/:orderId/qr', h(async (req, res) => {
    const order = await loadOwnedOrder(req, res);
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
  }));

  // New QR for an unpaid order whose Omise charge expired (same order, same price).
  app.post('/api/orders/:orderId/renew-qr', h(async (req, res) => {
    let order = await loadOwnedOrder(req, res);
    if (!order) return;
    if (await rateLimited(`renew:${order.orderId}`, 6, 60 * 60 * 1000)) {
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
    const timeoutMin = Math.max(1, (await getSettings()).paymentTimeoutMinutes || 15);
    const saved = await updateOrder(order.orderId, (o) => {
      if (o.omiseChargeId) o.omisePastChargeIds = [...(o.omisePastChargeIds || []), o.omiseChargeId].slice(-10);
      o.omiseChargeId = charge.chargeId;
      o.omiseQrImageUrl = charge.qrImageUrl;
      o.expiresAt = charge.expiresAt || new Date(Date.now() + timeoutMin * 60 * 1000).toISOString();
    });
    res.json({ order: toRunnerView(saved || order) });
  }));

  // Omise webhook. The body is only a hint — we always re-fetch the charge from Omise.
  app.post('/api/payment-webhook', smallJson, h(async (req, res) => {
    const chargeId = req.body?.data?.object === 'charge' ? String(req.body.data.id || '') : '';
    if (chargeId) {
      const charge = await fetchVerifiedOmiseCharge(chargeId);
      const order = charge?.orderId ? await getOrder(charge.orderId) : undefined;
      if (order) await settleFromOmise(order, chargeId);
    }
    res.json({ received: true });
  }));

  // ---------------- Admin ----------------
  app.post('/api/admin/login', smallJson, h(async (req, res) => {
    const r = await checkCredentials(clientIp(req), req.body?.username, req.body?.password);
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
  }));

  // Ticket scanner / BIB search: order id, BIB or concert-pass number
  app.get('/api/admin/lookup', requireAdmin, h(async (req, res) => {
    const order = await findOrderByCode(String(req.query.q || '').slice(0, 80));
    if (!order) {
      res.status(404).json({ error: 'ไม่พบตั๋ว/เลข BIB นี้ในระบบ' });
      return;
    }
    res.json({ order: toAdminView(order) });
  }));

  app.get('/api/admin/winners', requireAdmin, h(async (_req, res) => {
    res.json({ winners: await getWinners() });
  }));

  app.put('/api/admin/winners', requireAdmin, express.json({ limit: '4mb' }), h(async (req, res) => {
    const raw = Array.isArray(req.body?.winners) ? req.body.winners.slice(0, 24) : [];
    const list: Winner[] = [];
    for (const w of raw) {
      const photo = typeof w?.photo === 'string' && ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'].some((p) => w.photo.startsWith(p)) && w.photo.length <= 260_000 ? w.photo : undefined;
      const name = clean(w?.name, 120);
      if (!name) continue;
      list.push({
        id: clean(w?.id, 40) || crypto.randomBytes(6).toString('hex'),
        title: clean(w?.title, 120),
        name,
        photo,
        note: clean(w?.note, 200) || undefined,
      });
    }
    await saveWinners(list);
    res.json({ winners: list });
  }));

  app.get('/api/admin/orders', requireAdmin, h(async (_req, res) => {
    // Settle any Omise orders still waiting (covers missed webhooks).
    let orders = await listOrders();
    const waiting = orders.filter((o) => o.omiseChargeId && o.paymentStatus !== 'PAID').slice(0, 10);
    if (waiting.length) {
      await Promise.all(waiting.map(settleAll));
      orders = await listOrders();
    }
    res.json({
      orders: orders.map(toAdminView),
      bibCounters: await getBibCounters(),
      nextBib: await nextBibPreview(),
    });
  }));

  app.post('/api/admin/orders/:orderId/verification', requireAdmin, smallJson, h(async (req, res) => {
    const orderId = String(req.params.orderId);
    const order = await getOrder(orderId);
    if (!order) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    const admin = (req as any).admin.username as string;
    const status = req.body?.status;
    if (status === 'ADMIN_APPROVED') {
      const ref = clean(req.body?.paymentRef, 60) || order.paymentRef || `MANUAL-${order.orderId}`;
      if (ref !== order.paymentRef && (await isRefUsed(ref))) {
        res.status(400).json({ error: `เลขที่รายการ ${ref} ถูกใช้กับคำสั่งซื้ออื่นแล้ว` });
        return;
      }
      await markOrderPaid(orderId, {
        status: 'ADMIN_APPROVED',
        verifiedBy: admin,
        paymentRef: ref,
        senderBank: clean(req.body?.senderBank, 80) || order.senderBank,
      });
    } else if (status === 'REJECTED' || status === 'PENDING_REVIEW') {
      await updateOrder(orderId, (o) => {
        o.verificationStatus = status;
        o.paymentStatus = 'PENDING';
        o.registrationStatus = 'REGISTERED';
        o.verifiedAt = new Date().toISOString();
        o.verifiedBy = admin;
      });
    } else {
      res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
      return;
    }
    console.log(`[admin] ${admin} set ${orderId} -> ${status}`);
    res.json({ order: toAdminView((await getOrder(orderId))!) });
  }));

  app.post('/api/admin/orders/:orderId/kit', requireAdmin, h(async (req, res) => {
    const orderId = String(req.params.orderId);
    const order = await getOrder(orderId);
    if (!order) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    if (order.paymentStatus !== 'PAID') {
      res.status(400).json({ error: 'คำสั่งซื้อนี้ยังไม่ได้ชำระเงิน' });
      return;
    }
    const updated = await updateOrder(orderId, (o) => {
      o.kitStatus = o.kitStatus === 'CHECKED_IN' ? 'PENDING_PICKUP' : 'CHECKED_IN';
      o.registrationStatus = o.kitStatus === 'CHECKED_IN' ? 'CHECKED_IN' : 'CONFIRMED';
    });
    res.json({ order: toAdminView(updated!) });
  }));

  app.delete('/api/admin/orders/:orderId', requireAdmin, h(async (req, res) => {
    const id = String(req.params.orderId);
    if (!(await getOrder(id))) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    await deleteOrder(id);
    console.log(`[admin] ${(req as any).admin.username} deleted ${id}`);
    res.json({ ok: true });
  }));

  // ---- Sponsor codes (admin) ----
  app.get('/api/admin/sponsor-codes', requireAdmin, h(async (_req, res) => {
    res.json({ codes: await listSponsorCodes() });
  }));

  app.post('/api/admin/sponsor-codes', requireAdmin, smallJson, h(async (req, res) => {
    const b = req.body || {};
    const sponsorName = clean(b.sponsorName, 120);
    if (sponsorName.length < 2) {
      res.status(400).json({ error: 'กรุณาระบุชื่อสปอนเซอร์' });
      return;
    }
    const maxRaw = b.maxUses === null || b.maxUses === '' || b.maxUses === undefined ? null : Math.floor(Number(b.maxUses));
    if (maxRaw !== null && (!Number.isFinite(maxRaw) || maxRaw < 1 || maxRaw > 100000)) {
      res.status(400).json({ error: 'จำนวนสิทธิ์ต้องเป็นจำนวนเต็ม 1 ขึ้นไป (หรือเว้นว่างเพื่อไม่จำกัด)' });
      return;
    }
    const custom = b.code ? normalizeSponsorCode(b.code) : '';
    if (b.code && !custom) {
      res.status(400).json({ error: 'รหัสต้องเป็น A-Z ตัวเลข หรือ - ยาว 4-32 ตัวอักษร' });
      return;
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const created = await createSponsorCode({
        code: custom || generateSponsorCode(),
        sponsorName,
        maxUses: maxRaw,
        note: clean(b.note, 240),
      });
      if (created) {
        res.json({ code: created });
        return;
      }
      if (custom) {
        res.status(409).json({ error: 'มีรหัสนี้อยู่แล้ว' });
        return;
      }
    }
    res.status(500).json({ error: 'สร้างรหัสไม่สำเร็จ กรุณาลองใหม่' });
  }));

  app.patch('/api/admin/sponsor-codes/:code', requireAdmin, smallJson, h(async (req, res) => {
    const code = normalizeSponsorCode(req.params.code);
    const b = req.body || {};
    const patch: { active?: boolean; maxUses?: number | null; sponsorName?: string; note?: string } = {};
    if (typeof b.active === 'boolean') patch.active = b.active;
    if ('maxUses' in b) {
      const m = b.maxUses === null || b.maxUses === '' ? null : Math.floor(Number(b.maxUses));
      if (m !== null && (!Number.isFinite(m) || m < 1 || m > 100000)) {
        res.status(400).json({ error: 'จำนวนสิทธิ์ไม่ถูกต้อง' });
        return;
      }
      patch.maxUses = m;
    }
    if (typeof b.sponsorName === 'string' && clean(b.sponsorName, 120).length >= 2) patch.sponsorName = clean(b.sponsorName, 120);
    if (typeof b.note === 'string') patch.note = clean(b.note, 240);
    const updated = code ? await updateSponsorCode(code, patch) : undefined;
    if (!updated) {
      res.status(404).json({ error: 'ไม่พบรหัสนี้' });
      return;
    }
    res.json({ code: updated });
  }));

  app.delete('/api/admin/sponsor-codes/:code', requireAdmin, h(async (req, res) => {
    const code = normalizeSponsorCode(req.params.code);
    if (!code || !(await deleteUnusedSponsorCode(code))) {
      res.status(409).json({ error: 'ลบไม่ได้ (ไม่พบรหัส หรือมีคนใช้แล้ว ให้ปิดการใช้งานแทน)' });
      return;
    }
    res.json({ ok: true });
  }));

  app.get('/api/admin/settings', requireAdmin, h(async (_req, res) => {
    res.json({ settings: await getSettings(), bibCounters: await getBibCounters() });
  }));

  app.put('/api/admin/settings', requireAdmin, smallJson, h(async (req, res) => {
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
    const wanted: Record<string, number> = {};
    for (const r of ROUTES) {
      const v = counters[r];
      if (v === undefined) continue;
      if (!Number.isInteger(v) || v < 0 || v > 9999) {
        res.status(400).json({ error: `ลำดับ BIB ของ ${r} ไม่ถูกต้อง` });
        return;
      }
      wanted[r] = v;
    }
    const result = await setBibCounters(wanted);
    if (!result.ok) {
      res.status(400).json({ error: `ลำดับ BIB ของ ${result.route} ต้องไม่น้อยกว่าที่ออกไปแล้ว (${result.current})` });
      return;
    }
    const cur = await getSettings();
    await saveSettings({
      promptPayId,
      accountName: clean(s.accountName, 150) || cur.accountName,
      bankLabel: clean(s.bankLabel, 80) || cur.bankLabel,
      bankAccountNo,
      paymentTimeoutMinutes: Math.min(120, Math.max(5, Math.floor(Number(s.paymentTimeoutMinutes) || 15))),
    });
    console.log(`[admin] ${(req as any).admin.username} updated settings`);
    res.json({ settings: await getSettings(), bibCounters: await getBibCounters() });
  }));

  app.get('/api/admin/payment-gateway', requireAdmin, h(async (_req, res) => {
    res.json(await gatewayStatus());
  }));

  app.post('/api/admin/payment-gateway', requireAdmin, smallJson, h(async (req, res) => {
    const admin = (req as any).admin.username as string;
    if (req.body?.clear === true) {
      await setOmiseKey('');
      console.log(`[admin] ${admin} removed the Omise key`);
      res.json(await gatewayStatus());
      return;
    }
    const key = String(req.body?.secretKey || '').trim();
    if (!/^skey_(test_)?[A-Za-z0-9]{10,}$/.test(key)) {
      res.status(400).json({ error: 'Omise Secret Key ต้องขึ้นต้นด้วย skey_ หรือ skey_test_' });
      return;
    }
    await setOmiseKey(key);
    console.log(`[admin] ${admin} set the Omise key (${key.startsWith('skey_test_') ? 'test' : 'live'})`);
    res.json(await gatewayStatus());
  }));

  // Any other /api path is a 404 (prevents the SPA fallback from answering API calls).
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
