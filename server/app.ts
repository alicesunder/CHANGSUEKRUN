/**
 * CHANG SUEK RUN 2027 — API (Express app, no listener).
 * Used by server.ts (local / any Node host) and by the Vercel function (api/index.js).
 *
 * Money rules (all enforced here, never in the browser):
 *  1. Prices come from src/data/eventData.ts on the server. The browser cannot set the amount.
 *  2. Payment is a PromptPay transfer + slip upload. An order becomes PAID only by:
 *       a) a slip that EasySlip read from the bank with the exact amount, our account as receiver,
 *          a transfer time after the order was made, and a transaction ref no other order has used, or
 *       b) an older order's Omise charge we re-fetched from api.omise.co with our secret key, or
 *       c) an authenticated admin approving it manually (e.g. a slip EasySlip couldn't decide on).
 *  3. BIB numbers are assigned by the database at the moment an order is paid.
 *  4. Admin endpoints require a signed token from /api/admin/login.
 */
import express from 'express';
import crypto from 'crypto';
import type { RouteId } from '../src/types';
import { parseDogProfile, type DogProfile } from '../src/data/dogProfile';
import { MAX_VIP_TABLES, VIP_TABLE_SEATS, calcTicketTotal, concertPassPrice, vipTablePrice, isDogCategory, ticketById, ticketCategories } from '../src/data/eventData';
import {
  rollbackNewOrder,
  restoreOrderChecked,
  getBibCounters,
  getEasySlipKey,
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
  newTestOrderId,
  normalizeSponsorCode,
  peekSponsorCode,
  rateLimited,
  redeemSponsorCode,
  releaseSponsorCode,
  saveSettings,
  setBibCounters,
  setEasySlipKey,
  RefUsedError,
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
  getSalesStatus,
  getEarlyBird,
  setEarlyBird,
  setSalesOpen,
  isVisitorId,
  recordVisit,
  visitStats,
} from './store';
import { WIND_TUNNEL_LIMIT, addOnBonusDiscount, addOnLabel, addOnPricePerPerson, addOnTotal, concertDiscountPerTicket, hasAddOns, normalizeAddOns } from '../src/data/addOns';
import { needsInsurance, parseInsurance, type InsuranceInfo } from '../src/data/insurance';
import { parseShooting, type ShootingInfo } from '../src/data/shooting';
import { parseActivityWaiver, waiversFor, type ActivityWaiverInfo } from '../src/data/activityWaivers';
import { extraRunnersText, parseExtraRunners, type ExtraRunner } from '../src/data/shirts';
import { parseParkingPlates, type ParkingPlate } from '../src/data/vipParking';
import { checkCredentials, docsSignature, docsSignatureOk, issueToken, requireAdmin, verifyToken } from './auth';
import { buildDocumentsHtml } from './documents';

/** The buyer's own view of an order, plus the link to its A4 documents once paid. */
const runnerView = (o: StoredOrder) => ({
  ...toRunnerView(o),
  documentsUrl: o.paymentStatus === 'PAID' && !o.cancelledAt ? `/api/orders/${encodeURIComponent(o.orderId)}/documents?s=${docsSignature(o.orderId)}` : undefined,
});
import { fetchVerifiedOmiseCharge, maskedAccountMatches, verifySlipWithEasySlip } from './payments';
import { mailConfigured, maskEmail, sendTicketEmail } from './mailer';

/** Must match PRIVACY_POLICY_VERSION in src/components/PrivacyNotice.tsx */
const PRIVACY_POLICY_VERSION = '2026-11-02';
/** Must match TERMS_VERSION in src/data/terms.ts */
const TERMS_VERSION = '2026-11-01';

const ROUTE_IDS: RouteId[] = ticketCategories.map((t) => t.id);
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
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

/** E-mails the ticket when an order has just become paid (not when it was already paid). Never throws. */
async function mailNewlyPaid(wasPaid: boolean, paid: StoredOrder | undefined): Promise<void> {
  if (wasPaid || !paid || paid.paymentStatus !== 'PAID') return;
  const r = await sendTicketEmail(paid);
  console.log(`[mail] ${paid.orderId}: ${r.ok ? `ticket sent (${r.id})` : `not sent (${r.error})`}`);
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
    const paid = await markOrderPaid(order.orderId, {
      status: 'AUTO_VERIFIED',
      verifiedBy: 'Omise PromptPay (ยืนยันจาก Omise API)',
      paymentRef: charge.chargeId || chargeId,
      senderBank: 'Omise PromptPay',
    });
    await mailNewlyPaid(false, paid);
    return paid || order;
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
  const [s, nextBib, key, windUsed, sales, early] = await Promise.all([getSettings(), nextBibPreview(), getEasySlipKey(), windTunnelSeatsUsed(), getSalesStatus(), getEarlyBird()]);
  return {
    /** the admin's open / close switch for ticket sales */
    salesOpen: sales.open,
    /** the admin's early-bird switch (lower run / concert / VIP prices) */
    earlyBird: early.on,
    windTunnelLimit: WIND_TUNNEL_LIMIT,
    windTunnelRemaining: Math.max(0, WIND_TUNNEL_LIMIT - windUsed),
    promptPayId: s.promptPayId,
    accountName: s.accountName,
    bankLabel: s.bankLabel,
    bankAccountNo: s.bankAccountNo,
    paymentTimeoutMinutes: s.paymentTimeoutMinutes,
    nextBib,
    /** false until an EasySlip API key is configured — registration is closed until then */
    paymentReady: Boolean(key),
    /** true when paid orders get their ticket by e-mail */
    emailReady: mailConfigured(),
  };
}

async function gatewayStatus() {
  return { hasEasySlipKey: Boolean(await getEasySlipKey()) };
}

/** Slip checks that can't be fixed by trying again with the same slip; the runner gets these as the reason. */
function slipProblems(slip: Awaited<ReturnType<typeof verifySlipWithEasySlip>>, order: StoredOrder, ours: string[]): string[] {
  const out: string[] = [];
  if (Math.round((slip.amount ?? -1) * 100) !== Math.round(order.totalPrice * 100)) {
    out.push(`ยอดในสลิป ${slip.amount ?? '-'} บาท ไม่ตรงกับยอดที่ต้องชำระ ${order.totalPrice} บาท`);
  }
  const paidAt = Date.parse(slip.date || '');
  // 10 minutes of slack for clock differences between the bank and us
  if (!Number.isFinite(paidAt) || paidAt < Date.parse(order.createdAt) - 10 * 60 * 1000) {
    out.push('สลิปนี้โอนก่อนสร้างคำสั่งซื้อ กรุณาใช้สลิปที่โอนสำหรับคำสั่งซื้อนี้');
  }
  const receiverOk = slip.matchedAccount || slip.receiverAccounts.some((p) => ours.some((a) => a && maskedAccountMatches(p, a)));
  if (!receiverOk) out.push('บัญชีผู้รับในสลิปไม่ใช่บัญชีของงาน');
  return out;
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
  // A4 documents of a paid order (BIB, ticket, parking, insurance, waivers): signed link from the e-mail.
  app.get('/api/orders/:id/documents', h(async (req, res) => {
    const id = String(req.params.id);
    if (await rateLimited(`docs:${clientIp(req)}`, 60, 10 * 60 * 1000)) {
      res.status(429).type('text/plain; charset=utf-8').send('เปิดเอกสารบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่');
      return;
    }
    const order = docsSignatureOk(id, req.query.s) ? await getOrder(id) : undefined;
    if (!order || order.paymentStatus !== 'PAID' || order.cancelledAt) {
      res.status(404).type('text/plain; charset=utf-8').send('ไม่พบเอกสาร หรือลิงก์ไม่ถูกต้อง');
      return;
    }
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.type('text/html; charset=utf-8').send(await buildDocumentsHtml(order));
  }));

  // Visitor counter: one anonymous page load. Rate limited so one script cannot inflate it.
  app.post('/api/visit', smallJson, h(async (req, res) => {
    const vid = req.body?.vid;
    if (!isVisitorId(vid)) {
      res.status(400).json({ error: 'invalid visitor id' });
      return;
    }
    if (await rateLimited(`visit:${clientIp(req)}`, 60, 10 * 60 * 1000)) {
      res.status(204).end();
      return;
    }
    await recordVisit(vid);
    res.status(204).end();
  }));

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
    // Admin test mode: the order total is 1 baht. Only a valid admin login may ask for it (never a visitor).
    const testMode = b.testMode === true;
    let testAdmin = '';
    if (testMode) {
      const header = req.headers.authorization || '';
      const session = verifyToken(header.startsWith('Bearer ') ? header.slice(7) : undefined);
      if (!session) {
        res.status(401).json({ error: 'โหมดทดสอบ 1 บาทใช้ได้เฉพาะแอดมินที่ล็อกอินอยู่ กรุณาเข้าสู่ระบบแอดมินใหม่ หรือปิดโหมดทดสอบ' });
        return;
      }
      if (b.sponsorCode) {
        res.status(400).json({ error: 'โหมดทดสอบใช้ร่วมกับรหัสสปอนเซอร์ไม่ได้ กรุณาปิดโหมดทดสอบหรือเอารหัสออก' });
        return;
      }
      testAdmin = session.username;
    }
    if (!testMode && !(await getSalesStatus()).open) {
      res.status(403).json({ error: 'ขณะนี้ปิดการขายบัตรชั่วคราว กรุณาติดตามประกาศจากผู้จัดงาน' });
      return;
    }
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
    // Concert-only pass: no run, no BIB, no shirt (the run ticket already includes the concert)
    const routeId = (isConcert ? 'concert' : isAddonOnly ? 'addon' : b.routeId) as RouteId;
    // Concert tickets (GA and VIP tables) are sold separately: alone, or together with a run ticket and/or activities.
    // (A sponsor code already covers the run + one concert entry, so no extra concert tickets are charged with it.)
    const concertAllowed = !isAddonOnly && !sponsorCode;
    const wantedConcert = Math.min(9, Math.max(0, Math.floor(Number(b.concertQty) || 0)));
    const vipTables = concertAllowed ? Math.min(MAX_VIP_TABLES, Math.max(0, Math.floor(Number(b.vipTables) || 0))) : 0;
    const concertQty = isConcert ? (vipTables > 0 ? wantedConcert : Math.max(1, wantedConcert)) : concertAllowed ? wantedConcert : 0;
    // Bundle discounts never stack with a sponsor code; see src/data/addOns.ts for the rules.
    const discountCtx = { hasRun: !noRun, hasConcert: concertQty > 0 || vipTables > 0, sponsor: !!sponsorCode };
    const addOnSum = addOnTotal(addOns, discountCtx);
    // A fully free sponsor registration doesn't need the payment gateway.
    if ((!sponsorCode || addOnSum > 0) && !(await getEasySlipKey())) {
      res.status(503).json({ error: 'ระบบชำระเงินยังไม่เปิดใช้งาน กรุณาติดต่อผู้จัดงาน' });
      return;
    }
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
    // Each extra runner gets a jersey (size per person) and, like runner 1, the insurance details.
    let extraRunners: ExtraRunner[] | undefined;
    let extraRunnersError = '';
    if (extraPeople > 0) {
      const p = parseExtraRunners(b.extraRunners, extraPeople, needsInsurance(routeId));
      if (p.ok) extraRunners = p.value;
      else extraRunnersError = p.error;
    }

    // The dog's details (the form sends them as one object; an older open page may still send only name + breed)
    let dogProfile: DogProfile | undefined;
    let dogError = '';
    if (isDog && b.dogProfile) {
      const p = parseDogProfile(b.dogProfile);
      if (p.ok) dogProfile = p.value;
      else dogError = p.error;
    }

    // Runners of every distance are insured: the insurer needs their details (the name comes from these fields)
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
    // VIP tables come with parking for 2 cars each: the buyer registers the plates.
    let parkingPlates: ParkingPlate[] | undefined;
    let parkingError = '';
    if (vipTables > 0) {
      const p = parseParkingPlates(b.parkingPlates, vipTables);
      if (p.ok) parkingPlates = p.value;
      else parkingError = p.error;
    }
    // Shooting needs every shooter's name + national ID (the range registers them).
    let shooting: ShootingInfo | undefined;
    let shootingError = '';
    if (addOns.gun !== 'none') {
      const p = parseShooting(b.shooters, addOns.people);
      if (p.ok) shooting = p.value;
      else shootingError = p.error;
    }
    // Tower / wind tunnel need every participant's details for the legal waivers, and each document accepted.
    let activityWaiver: ActivityWaiverInfo | undefined;
    let waiverError = '';
    const waiverActivities = waiversFor(addOns);
    if (waiverActivities.length) {
      const p = parseActivityWaiver(b.activityWaiver, addOns.people, waiverActivities);
      if (p.ok) activityWaiver = p.value;
      else waiverError = p.error;
    }
    const errors: string[] = [];
    if (insuranceError) errors.push(insuranceError);
    if (dogError) errors.push(dogError);
    if (waiverError) errors.push(waiverError);
    if (extraRunnersError) errors.push(extraRunnersError);
    if (parkingError) errors.push(parkingError);
    if (shootingError) errors.push(shootingError);
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

    const earlyBird = (await getEarlyBird()).on;
    const concertUnit = concertPassPrice(earlyBird);
    const concertDiscount = concertQty * concertDiscountPerTicket(concertUnit, !noRun && !sponsorCode);
    const vipTotal = vipTablePrice(earlyBird) * vipTables;
    const ticketTotal = isAddonOnly
      ? 0
      : isConcert
        ? concertUnit * concertQty + vipTotal
        : sponsorCode
          ? 0
          : calcTicketTotal(routeId, extraPeople, extraDogs, earlyBird) + concertUnit * concertQty - concertDiscount + vipTotal;
    const total = testMode ? 1 : ticketTotal + addOnSum;
    const token = crypto.randomBytes(24).toString('base64url');
    const now = new Date();
    const settings = await getSettings();
    const timeoutMin = Math.max(1, settings.paymentTimeoutMinutes || 15);

    const order: StoredOrder = {
      orderId: testMode ? newTestOrderId() : await nextOrderId(),
      ...(testMode ? { isTest: true, testBy: testAdmin } : {}),
      accessTokenHash: hashToken(token),
      fullName,
      phone,
      email,
      emergencyPhone,
      routeId,
      // The VIP tables go into the name too, so the admin list, scanner and e-ticket all show them.
      routeName:
        (isAddonOnly ? 'กิจกรรมเสริมอย่างเดียว (ไม่วิ่ง)' : isConcert ? 'ตั๋วคอนเสิร์ต / เข้างาน (ไม่วิ่ง)' : ticketById(routeId).name) +
        (vipTables > 0 ? ` + VIP TABLE × ${vipTables} โต๊ะ (${vipTables * VIP_TABLE_SEATS} ท่าน)` : ''),
      ticketType: isAddonOnly ? 'ADDON' : isConcert ? 'CONCERT' : 'RUN',
      concertQty: concertQty > 0 ? concertQty : undefined,
      concertDiscount: concertDiscount > 0 ? concertDiscount : undefined,
      ...(earlyBird ? { earlyBird: true } : {}),
      vipTables: vipTables > 0 ? vipTables : undefined,
      parkingPlates,
      shooting,
      activityWaiver,
      insurance,
      shirtSize,
      runningWithDog: isDog,
      dogName: isDog ? dogProfile?.name || clean(b.dogName, 80) : undefined,
      dogBreed: isDog ? dogProfile?.breed || clean(b.dogBreed, 80) : undefined,
      dogProfile,
      extraPeople,
      extraDogs,
      extraRunners,
      extraRunnerNames: extraRunners ? extraRunnersText(extraRunners).slice(0, 600) : undefined,
      peopleCount: isAddonOnly ? addOns.people : isConcert ? concertQty + vipTables * VIP_TABLE_SEATS : isDog ? 1 + extraPeople : 1,
      dogCount: isDog ? 1 + extraDogs : 0,
      totalPrice: total,
      bibNumber: '',
      paymentMethod: sponsorCode ? 'SPONSOR_CODE' : 'PROMPTPAY_QR',
      sponsorCode: sponsorCode || undefined,
      sponsorName: sponsorName || undefined,
      addOns: hasAddOns(addOns)
        ? { ...addOns, pricePerPerson: addOnPricePerPerson(addOns), total: addOnSum, discount: addOnBonusDiscount(addOns, discountCtx), label: addOnLabel(addOns) }
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
        await rollbackNewOrder(order.orderId).catch(() => {});
        await releaseSponsorCode(sponsorCode).catch(() => {});
        throw err;
      }
      await mailNewlyPaid(false, paid);
      res.json({ order: runnerView(paid || order), accessToken: token, config: await publicConfig() });
      return;
    }

    // The runner now transfers by PromptPay and uploads the slip (POST /api/orders/:orderId/slip).
    res.json({ order: runnerView(order), accessToken: token, config: await publicConfig() });
  }));

  // Order status for the runner who created it (requires the order's access token).
  app.get('/api/orders/:orderId', h(async (req, res) => {
    let order = await loadOwnedOrder(req, res);
    if (!order) return;
    order = await settleAll(order);
    res.json({ order: runnerView(order) });
  }));

  // A buyer who lost their ticket asks for the e-mail again: order id + the phone number on the order.
  // It only ever goes to the e-mail address on the order, and the answer never says which part was wrong.
  app.post('/api/orders/:orderId/resend-ticket', smallJson, h(async (req, res) => {
    if ((await rateLimited(`resend-ip:${clientIp(req)}`, 10, 60 * 60 * 1000)) || (await rateLimited(`resend:${String(req.params.orderId).slice(0, 40)}`, 3, 60 * 60 * 1000))) {
      res.status(429).json({ error: 'ขอส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' });
      return;
    }
    const order = await getOrder(String(req.params.orderId));
    const phone = String(req.body?.phone || '').replace(/\D/g, '');
    const match = order && phone.length >= 9 && order.phone.replace(/\D/g, '').slice(-9) === phone.slice(-9);
    if (!order || !match || order.paymentStatus !== 'PAID' || order.cancelledAt) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อที่ชำระแล้ว หรือเบอร์โทรไม่ตรงกับที่ลงทะเบียน' });
      return;
    }
    const r = await sendTicketEmail(order);
    if (!r.ok) {
      res.status(503).json({ error: 'ส่งอีเมลไม่สำเร็จในขณะนี้ กรุณาติดต่อผู้จัดงาน' });
      return;
    }
    res.json({ ok: true, to: maskEmail(order.email) });
  }));

  // Slip upload. EasySlip reads the transfer from the bank; we check amount, receiver, time and reuse.
  // A slip EasySlip can't decide on (service down, seen before but not used here) goes to an admin.
  app.post('/api/orders/:orderId/slip', express.json({ limit: '5mb' }), h(async (req, res) => {
    let order = await loadOwnedOrder(req, res);
    if (!order) return;
    order = await settleAll(order);
    if (order.paymentStatus === 'PAID') {
      res.json({ order: runnerView(order) });
      return;
    }
    if (order.verificationStatus === 'REJECTED' || order.cancelledAt) {
      res.status(400).json({ error: 'คำสั่งซื้อนี้ถูกยกเลิกโดยเจ้าหน้าที่ กรุณาติดต่อผู้จัดงาน' });
      return;
    }
    if ((await rateLimited(`slip:${order.orderId}`, 8, 60 * 60 * 1000)) || (await rateLimited(`slip-ip:${clientIp(req)}`, 20, 60 * 60 * 1000))) {
      res.status(429).json({ error: 'ส่งสลิปบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' });
      return;
    }
    const image = typeof req.body?.image === 'string' ? req.body.image : '';
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image) || image.length > 4_000_000) {
      res.status(400).json({ error: 'ไฟล์สลิปไม่ถูกต้อง กรุณาแนบรูปสลิป (JPG / PNG)' });
      return;
    }
    if (!(await getEasySlipKey())) {
      res.status(503).json({ error: 'ระบบตรวจสลิปยังไม่เปิดใช้งาน กรุณาติดต่อผู้จัดงาน' });
      return;
    }

    const slip = await verifySlipWithEasySlip(image, order.totalPrice, order.orderId);
    const settings = await getSettings();
    let problems: string[] = [];
    let review = '';
    if (!slip.ok) {
      const code = slip.errorCode || '';
      if (code === 'SLIP_NOT_FOUND' || code === 'VALIDATION_ERROR' || code === 'IMAGE_SIZE_TOO_LARGE') {
        problems = ['อ่านสลิปไม่ได้หรือไม่พบรายการนี้ในระบบธนาคาร กรุณาแนบรูปสลิปตัวจริงที่เห็น QR ชัด ๆ'];
      } else if (code === 'SLIP_PENDING') {
        problems = ['ธนาคารยังไม่ยืนยันรายการนี้ กรุณาลองส่งสลิปอีกครั้งใน 2–3 นาที'];
      } else {
        console.warn(`[slip] EasySlip error for ${order.orderId}: ${code}`);
        review = `ตรวจสลิปอัตโนมัติไม่ได้ (${code}) รอเจ้าหน้าที่ตรวจ`;
      }
    } else {
      problems = slipProblems(slip, order, [settings.bankAccountNo, settings.promptPayId]);
      if (!problems.length && (await isRefUsed(slip.transRef || ''))) problems = ['สลิปนี้ถูกใช้ชำระคำสั่งซื้ออื่นไปแล้ว'];
      if (!problems.length && !slip.transRef) review = 'สลิปไม่มีเลขที่รายการ รอเจ้าหน้าที่ตรวจ';
      if (!problems.length && !review && slip.isDuplicate) review = 'EasySlip แจ้งว่าเคยตรวจสลิปนี้แล้ว รอเจ้าหน้าที่ตรวจ';
    }

    const readout = slip.ok
      ? `EasySlip: ${slip.amount} บาท · ${slip.senderBank} ${slip.senderName} → ${slip.receiverName} (${slip.receiverAccounts.join(', ')}) · ${slip.date} · ref ${slip.transRef}`
      : `EasySlip: ${slip.errorCode}`;
    const note = [readout, ...problems, review].filter(Boolean).join(' · ');
    await updateOrder(order.orderId, (o) => {
      o.slipAttempts = (o.slipAttempts || 0) + 1;
      // A failed retry must not replace a slip that is waiting for an admin.
      if (problems.length && o.verificationStatus === 'PENDING_REVIEW') return;
      o.slipFile = image;
      o.slipHash = crypto.createHash('sha256').update(image).digest('hex');
      o.slipCheckedAt = new Date().toISOString();
      o.slipRef = slip.transRef || undefined;
      o.slipNote = note.slice(0, 600);
      if (review) o.verificationStatus = 'PENDING_REVIEW';
      if (slip.senderBank) o.senderBank = slip.senderBank;
    });

    if (!problems.length && !review) {
      try {
        const paid = await markOrderPaid(order.orderId, {
          status: 'AUTO_VERIFIED',
          verifiedBy: 'EasySlip (ตรวจสลิปอัตโนมัติ)',
          paymentRef: slip.transRef!,
          senderBank: slip.senderBank || '',
          note,
          exclusiveRef: true,
        });
        console.log(`[slip] ${order.orderId} paid by slip ${slip.transRef}`);
        await mailNewlyPaid(false, paid);
        res.json({ order: runnerView(paid!) });
        return;
      } catch (err) {
        if (!(err instanceof RefUsedError)) throw err;
        problems = ['สลิปนี้ถูกใช้ชำระคำสั่งซื้ออื่นไปแล้ว'];
      }
    }
    const latest = (await getOrder(order.orderId))!;
    if (review) {
      res.json({ order: runnerView(latest), review: true, message: 'ได้รับสลิปแล้ว ระบบตรวจอัตโนมัติไม่ได้ เจ้าหน้าที่จะตรวจและยืนยันให้' });
      return;
    }
    res.status(400).json({ error: `สลิปไม่ผ่าน: ${problems.join(' · ')}`, order: runnerView(latest) });
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
    if (order.cancelledAt) {
      res.status(400).json({ error: 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว กรุณากู้คืนก่อนเปลี่ยนสถานะ' });
      return;
    }
    if (status === 'ADMIN_APPROVED') {
      const ref = clean(req.body?.paymentRef, 60) || order.paymentRef || order.slipRef || `MANUAL-${order.orderId}`;
      if (ref !== order.paymentRef && (await isRefUsed(ref))) {
        res.status(400).json({ error: `เลขที่รายการ ${ref} ถูกใช้กับคำสั่งซื้ออื่นแล้ว` });
        return;
      }
      const paid = await markOrderPaid(orderId, {
        status: 'ADMIN_APPROVED',
        verifiedBy: admin,
        paymentRef: ref,
        senderBank: clean(req.body?.senderBank, 80) || order.senderBank,
      });
      await mailNewlyPaid(order.paymentStatus === 'PAID', paid);
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

  // Send the ticket e-mail again (to the address on the order).
  app.post('/api/admin/orders/:orderId/email', requireAdmin, h(async (req, res) => {
    const order = await getOrder(String(req.params.orderId));
    if (!order) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    if (order.cancelledAt) {
      res.status(400).json({ error: 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว ไม่ส่งตั๋ว' });
      return;
    }
    if (order.paymentStatus !== 'PAID') {
      res.status(400).json({ error: 'คำสั่งซื้อนี้ยังไม่ได้ชำระเงิน' });
      return;
    }
    const r = await sendTicketEmail(order);
    console.log(`[mail] ${(req as any).admin.username} resent ${order.orderId}: ${r.ok ? 'sent' : r.error}`);
    if (!r.ok) {
      res.status(r.error === 'MAIL_NOT_CONFIGURED' ? 503 : 502).json({ error: r.error === 'MAIL_NOT_CONFIGURED' ? 'ยังไม่ได้ตั้งค่าระบบส่งอีเมล (RESEND_API_KEY)' : `ส่งอีเมลไม่สำเร็จ: ${r.error}` });
      return;
    }
    res.json({ ok: true, to: maskEmail(order.email) });
  }));

  // The slip image the runner uploaded (kept out of the order list to keep it small).
  app.get('/api/admin/orders/:orderId/slip', requireAdmin, h(async (req, res) => {
    const order = await getOrder(String(req.params.orderId));
    if (!order?.slipFile) {
      res.status(404).json({ error: 'คำสั่งซื้อนี้ยังไม่มีสลิป' });
      return;
    }
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ image: order.slipFile });
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
    if (order.cancelledAt) {
      res.status(400).json({ error: `คำสั่งซื้อนี้ถูกยกเลิกแล้ว (${order.cancelReason || '-'})` });
      return;
    }
    const updated = await updateOrder(orderId, (o) => {
      o.kitStatus = o.kitStatus === 'CHECKED_IN' ? 'PENDING_PICKUP' : 'CHECKED_IN';
      o.registrationStatus = o.kitStatus === 'CHECKED_IN' ? 'CHECKED_IN' : 'CONFIRMED';
    });
    res.json({ order: toAdminView(updated!) });
  }));

  // Orders are never deleted. Cancelling keeps the buyer's data, frees any wind-tunnel seats and
  // blocks payment, check-in and ticket e-mails; it can be undone.
  app.post('/api/admin/orders/:orderId/cancel', requireAdmin, smallJson, h(async (req, res) => {
    const id = String(req.params.orderId);
    const reason = clean(req.body?.reason, 300);
    if (reason.length < 3) {
      res.status(400).json({ error: 'กรุณาระบุเหตุผลที่ยกเลิก' });
      return;
    }
    const admin = (req as any).admin.username as string;
    const updated = await updateOrder(id, (o) => {
      if (o.cancelledAt) return;
      o.cancelledAt = new Date().toISOString();
      o.cancelledBy = admin;
      o.cancelReason = reason;
    });
    if (!updated) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    console.log(`[admin] ${admin} cancelled ${id}`);
    res.json({ order: toAdminView(updated) });
  }));

  app.post('/api/admin/orders/:orderId/restore', requireAdmin, h(async (req, res) => {
    const id = String(req.params.orderId);
    const r = await restoreOrderChecked(id, WIND_TUNNEL_LIMIT);
    if (!r.ok) {
      res.status(400).json({ error: r.error });
      return;
    }
    console.log(`[admin] ${(req as any).admin.username} restored ${id}`);
    res.json({ order: toAdminView(r.order) });
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

  app.get('/api/admin/visits', requireAdmin, h(async (_req, res) => {
    res.json(await visitStats());
  }));

  app.get('/api/admin/sales', requireAdmin, h(async (_req, res) => {
    res.json(await getSalesStatus());
  }));

  app.get('/api/admin/early-bird', requireAdmin, h(async (_req, res) => {
    res.json(await getEarlyBird());
  }));

  app.put('/api/admin/early-bird', requireAdmin, smallJson, h(async (req, res) => {
    if (typeof req.body?.on !== 'boolean') {
      res.status(400).json({ error: 'on must be true or false' });
      return;
    }
    res.json(await setEarlyBird(req.body.on));
  }));

  app.put('/api/admin/sales', requireAdmin, smallJson, h(async (req, res) => {
    if (typeof req.body?.open !== 'boolean') {
      res.status(400).json({ error: 'open must be true or false' });
      return;
    }
    res.json(await setSalesOpen(req.body.open));
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
      await setEasySlipKey('');
      console.log(`[admin] ${admin} removed the EasySlip key`);
      res.json(await gatewayStatus());
      return;
    }
    const key = String(req.body?.apiKey || '').trim();
    if (!/^[A-Za-z0-9._-]{16,200}$/.test(key)) {
      res.status(400).json({ error: 'EasySlip API Key ไม่ถูกต้อง กรุณาคัดลอกจาก EasySlip Dashboard มาวางใหม่' });
      return;
    }
    await setEasySlipKey(key);
    console.log(`[admin] ${admin} set the EasySlip key`);
    res.json(await gatewayStatus());
  }));

  // Any other /api path is a 404 (prevents the SPA fallback from answering API calls).
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
