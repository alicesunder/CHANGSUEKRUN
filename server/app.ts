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
import { SHIRT_SIZES as SHIRT_SIZE_LIST } from '../src/data/shirts';
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
  listOrdersByRunner,
  toRunnerView,
  toStaffView,
  tokenMatches,
  updateOrder,
  updateSponsorCode,
  windTunnelSeatsUsed,
  activitySeatsLeft,
  ACTIVITY_LIMITS,
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
  getAnnouncements,
  saveAnnouncements,
  setSalesOpen,
  setSalesOpenAt,
  isVisitorId,
  recordVisit,
  visitStats,
  recordEmailResult,
  deleteOrderPermanently,
  refreshActivityLimits,
  saveActivityLimits,
  setEarlyBirdSchedule,
} from './store';
import { billerIdFromQr, isValidQrPayload } from '../src/utils/promptPay';
import { VAT_RATE, vatOf } from '../src/data/vat';
import { WIND_TUNNEL_LIMIT, addOnCounts, addOnLabel, hasAddOns, normalizeAddOns, priceBasket, waiverPeopleCount } from '../src/data/addOns';
import { needsInsurance, parseInsurance, type InsuranceInfo } from '../src/data/insurance';
import { parseShooting, type ShootingInfo } from '../src/data/shooting';
import { parseActivityWaiver, waiversFor, type ActivityWaiverInfo } from '../src/data/activityWaivers';
import { extraRunnersText, parseExtraRunners, type ExtraRunner } from '../src/data/shirts';
import { parseParkingPlates, type ParkingPlate } from '../src/data/vipParking';
import { adminPolicy, checkCredentials, docsSignature, docsSignatureOk, issueSessionFor, requireAdmin, verifyAdminSession } from './auth';
import { ROLE_RANK, checkAdminUserPassword, createAdminUser, listAdminUsers, listAudit, signOutEveryone, updateAdminUser, validAdminPassword, writeAudit, findAdminUser, isRole } from './adminOps';
import { buildDocumentsHtml } from './documents';

/** The buyer's own view of an order, plus the link to its A4 documents once paid. */
const runnerView = (o: StoredOrder) => ({
  ...toRunnerView(o),
  documentsUrl: o.paymentStatus === 'PAID' && !o.cancelledAt ? `/api/orders/${encodeURIComponent(o.orderId)}/documents?s=${docsSignature(o.orderId)}` : undefined,
});
import { fetchVerifiedOmiseCharge, maskedAccountMatches, verifySlipWithEasySlip } from './payments';
import { SITE_URL, mailConfigured, maskEmail, sendAccountMail, sendTicketEmail } from './mailer';
import { registerRunnerRoutes } from './runnerRoutes';
import { getRunner, isRunnerDisabled, issueActionToken, listRunnersForAdmin, passwordFingerprint, publicRunner, sessionFromRequest, setRunnerDisabled } from './runners';
import { configuredProviders } from './socialLogin';

/** Must match PRIVACY_POLICY_VERSION in src/components/PrivacyNotice.tsx */
const PRIVACY_POLICY_VERSION = '2026-11-02';
/** Must match TERMS_VERSION in src/data/terms.ts */
const TERMS_VERSION = '2026-11-01';

const ROUTE_IDS: RouteId[] = ticketCategories.map((t) => t.id);
const SHIRT_SIZES: string[] = [...SHIRT_SIZE_LIST];
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
  await recordEmailResult(paid.orderId, r);
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
  const [s, nextBib, key, windUsed, sales, early, seatsLeft] = await Promise.all([getSettings(), nextBibPreview(), getEasySlipKey(), windTunnelSeatsUsed(), getSalesStatus(), getEarlyBird(), activitySeatsLeft()]);
  return {
    /** the admin's open / close switch for ticket sales */
    salesOpen: sales.open,
    /** when sales open by themselves (ISO), only while that time is still ahead */
    salesOpensAt: sales.scheduled ? sales.openAt : null,
    /** the admin's early-bird switch (lower run / concert / VIP prices) */
    earlyBird: early.on,
    windTunnelLimit: WIND_TUNNEL_LIMIT,
    windTunnelRemaining: Math.max(0, WIND_TUNNEL_LIMIT - windUsed),
    /** seats left at the tower / shooting range (null = no limit set) */
    towerRemaining: seatsLeft.tower,
    gunRemaining: seatsLeft.gun,
    promptPayId: s.promptPayId,
    qrPayload: s.qrPayload,
    accountName: s.accountName,
    bankLabel: s.bankLabel,
    bankAccountNo: s.bankAccountNo,
    paymentTimeoutMinutes: s.paymentTimeoutMinutes,
    nextBib,
    /** false until an EasySlip API key is configured — registration is closed until then */
    paymentReady: Boolean(key),
    /** true when paid orders get their ticket by e-mail */
    emailReady: mailConfigured(),
    /** true when LINE_CHANNEL_ID / LINE_CHANNEL_SECRET are set (the LINE login button works) */
    lineLoginReady: configuredProviders().line,
    /** which social sign-in buttons work (their keys are set on the server) */
    socialLogin: configuredProviders(),
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
    // a few seconds at the edge is enough to spare the database on every page view; orders re-check sales / prices on the server
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    res.json(await publicConfig());
  }));

  // Organiser announcements for the Runner Center (public read, short cache)
  app.get('/api/announcements', h(async (_req, res) => {
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.json({ announcements: (await getAnnouncements()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) });
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
      const session = await verifyAdminSession(req);
      if (!session || ROLE_RANK[session.role] < ROLE_RANK.manager) {
        res.status(401).json({ error: 'โหมดทดสอบ 1 บาทใช้ได้เฉพาะแอดมินที่ล็อกอินอยู่ กรุณาเข้าสู่ระบบแอดมินใหม่ หรือปิดโหมดทดสอบ' });
        return;
      }
      if (b.sponsorCode) {
        res.status(400).json({ error: 'โหมดทดสอบใช้ร่วมกับรหัสสปอนเซอร์ไม่ได้ กรุณาปิดโหมดทดสอบหรือเอารหัสออก' });
        return;
      }
      testAdmin = session.username;
    }
    // Buying needs a runner account (the form is pre-filled from it and the order shows up in their Runner Center).
    const buyer = sessionFromRequest(req);
    const runnerId = buyer && buyer.role === 'runner' ? buyer.sub : '';
    if (runnerId && (await isRunnerDisabled(runnerId))) {
      res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้จัดงาน' });
      return;
    }
    if (!testMode && !runnerId) {
      res.status(401).json({ error: 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนสั่งซื้อ', needLogin: true });
      return;
    }
    const salesNow = await getSalesStatus();
    if (!testMode && !salesNow.open) {
      res.status(403).json({
        error: salesNow.scheduled
          ? 'ยังไม่ถึงเวลาเปิดขาย (เปิดขาย ' + new Date(salesNow.openAt as string).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'long', timeStyle: 'short' }) + ' น.)'
          : 'ขณะนี้ปิดการขายบัตรชั่วคราว กรุณาติดตามประกาศจากผู้จัดงาน',
      });
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
    const earlyBird = (await getEarlyBird()).on;
    // A fully free sponsor registration doesn't need the payment gateway.
    if ((!sponsorCode || hasAddOns(addOns)) && !(await getEasySlipKey())) {
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
    const emergencyPhone = clean(insurance?.emergencyPhone || b.emergencyPhone, 30);
    const shirtSize = noRun ? '' : SHIRT_SIZES.includes(b.shirtSize) ? b.shirtSize : '';
    // VIP tables come with parking for 2 cars each: the buyer registers the plates.
    let parkingPlates: ParkingPlate[] | undefined;
    let parkingError = '';
    if (vipTables > 0) {
      const p = parseParkingPlates(b.parkingPlates, vipTables);
      if (p.ok) parkingPlates = p.value;
      else parkingError = p.error;
    }
    // Shooting needs every shooter's name and the buyer's acceptance of the range's safety rules.
    let shooting: ShootingInfo | undefined;
    let shootingError = '';
    if (addOns.gun !== 'none') {
      const gunCounts = addOnCounts(addOns);
      const p = parseShooting(b.shooters, gunCounts.gunShort + gunCounts.gunLong, b.shootingAck === true);
      if (p.ok) shooting = p.value;
      else shootingError = p.error;
    }
    // Tower / wind tunnel need every participant's details for the legal waivers, and each document accepted.
    let activityWaiver: ActivityWaiverInfo | undefined;
    let waiverError = '';
    const waiverActivities = waiversFor(addOns);
    if (waiverActivities.length) {
      const p = parseActivityWaiver(b.activityWaiver, waiverPeopleCount(addOns), waiverActivities);
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
    if (!insuranceError && emergencyPhone.replace(/\D/g, '').length < 9) errors.push('เบอร์ติดต่อฉุกเฉินไม่ถูกต้อง');
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

    // One basket, one discount (priceBasket in src/data/addOns.ts): 2 items 10%, 3 items 15%, 4-5 items 20%.
    const concertUnit = concertPassPrice(earlyBird);
    const runGross = noRun || sponsorCode ? 0 : calcTicketTotal(routeId, extraPeople, extraDogs, earlyBird);
    const basket = priceBasket({
      runGross,
      hasRun: !noRun,
      gaUnit: concertUnit,
      gaQty: concertQty,
      vipUnit: vipTablePrice(earlyBird),
      vipTables,
      addOns,
      sponsor: !!sponsorCode,
    });
    const concertDiscount = basket.gaOff + basket.vipOff;
    const addOnSum = basket.addGross - basket.addOff;
    // Prices are without VAT: VAT 7% is added on the amount after discounts (see src/data/vat.ts)
    const subtotal = basket.total;
    const vatAmount = testMode ? 0 : vatOf(subtotal);
    const total = testMode ? 1 : subtotal + vatAmount;
    const token = crypto.randomBytes(24).toString('base64url');
    const now = new Date();
    const settings = await getSettings();
    // The transfer window is 15 minutes at most (an admin may shorten it, never lengthen it).
    const timeoutMin = Math.min(60, Math.max(1, settings.paymentTimeoutMinutes || 30));

    const order: StoredOrder = {
      orderId: testMode ? newTestOrderId() : await nextOrderId(),
      ...(testMode ? { isTest: true, testBy: testAdmin } : {}),
      accessTokenHash: hashToken(token),
      ...(runnerId ? { runnerId } : {}),
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
      ...(basket.runOff > 0 ? { runDiscount: basket.runOff } : {}),
      ...(basket.rate > 0 ? { discountRate: basket.rate } : {}),
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
      ...(vatAmount > 0 ? { subtotalPrice: subtotal, vatAmount, vatRate: VAT_RATE } : {}),
      bibNumber: '',
      paymentMethod: sponsorCode ? 'SPONSOR_CODE' : 'PROMPTPAY_QR',
      sponsorCode: sponsorCode || undefined,
      sponsorName: sponsorName || undefined,
      addOns: hasAddOns(addOns)
        ? (() => { const c = addOnCounts(addOns); return { ...addOns, towerCount: c.tower, gunCount: c.gunShort + c.gunLong, windCount: c.wind, pricePerPerson: Math.round(basket.addGross / Math.max(1, c.people)), total: addOnSum, discount: basket.addOff, label: addOnLabel(addOns) }; })()
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
    let seats: { ok: true } | { ok: false; remaining: number; activity?: 'wind' | 'tower' | 'gun' };
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
          seats.activity === 'tower' || seats.activity === 'gun'
            ? `${seats.activity === 'tower' ? 'หอสูง' : 'ยิงปืน'}${seats.remaining > 0 ? `เหลือ ${seats.remaining} ที่ กรุณาเอากิจกรรมนี้ออกจากคำสั่งซื้อ` : `เต็มแล้ว (ครบ ${seats.activity === 'tower' ? ACTIVITY_LIMITS.tower : ACTIVITY_LIMITS.gun} ที่)`}`
            : seats.remaining > 0
              ? `อุโมงค์ลมเหลือ ${seats.remaining} ที่ กรุณาลดจำนวนคนหรือเอาอุโมงค์ลมออก`
              : `อุโมงค์ลมเต็มแล้ว (ครบ ${WIND_TUNNEL_LIMIT} ท่าน)`,
        windTunnelRemaining: seats.activity === 'wind' || !seats.activity ? seats.remaining : undefined,
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

  // Extra time to pay: once per order, +15 minutes, only while it is still open (so its wind-tunnel / activity seats are still held).
  app.post('/api/orders/:orderId/extend', smallJson, h(async (req, res) => {
    const order = await loadOwnedOrder(req, res);
    if (!order) return;
    if (order.paymentStatus === 'PAID' || order.cancelledAt || Date.parse(order.expiresAt) <= Date.now()) {
      res.status(400).json({ error: 'ขอเวลาเพิ่มไม่ได้ (คำสั่งซื้อชำระแล้ว ถูกยกเลิก หรือหมดเวลาแล้ว)' });
      return;
    }
    if (order.extendedAt) {
      res.status(400).json({ error: 'ขอเวลาเพิ่มได้ครั้งเดียวต่อคำสั่งซื้อ' });
      return;
    }
    const updated = await updateOrder(order.orderId, (o) => {
      if (o.extendedAt) return;
      o.extendedAt = new Date().toISOString();
      o.expiresAt = new Date(Math.max(Date.now(), Date.parse(o.expiresAt)) + 15 * 60 * 1000).toISOString();
    });
    res.json({ order: runnerView(updated || order) });
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
    await recordEmailResult(order.orderId, r);
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
      // a bill-payment QR pays to a biller ID, which is what the bank prints (masked) as the receiver on the slip
      problems = slipProblems(slip, order, [settings.bankAccountNo, settings.promptPayId, billerIdFromQr(settings.qrPayload || '')]);
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
  // Role rules first (viewer / manager / owner), then an audit trail of everything that changes data.
  app.use('/api/admin', adminPolicy);

  const AUDIT_BODY_KEYS = ['status', 'reason', 'action', 'on', 'open', 'amount', 'note', 'role', 'active', 'maxUses', 'sponsorName', 'autoFrom', 'autoUntil', 'tower', 'gun', 'refunded', 'displayName', 'username', 'disabled', 'clear'];
  const auditTrail: express.RequestHandler = (req, res, next) => {
    if (req.method === 'GET' || req.path === '/login') return next();
    // inside the mount req.path is relative to /api/admin; Express restores the full URL later, so capture it now
    const subPath = req.path;
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      const admin = (req as any).admin as { username: string; role: string } | undefined;
      const staff = admin ? null : sessionFromRequest(req);
      if (!admin && !(staff && staff.role === 'staff')) return;
      const pattern = subPath
        .replace(/^\/orders\/[^/]+/, '/orders/:id')
        .replace(/^\/runners\/[^/]+/, '/runners/:id')
        .replace(/^\/sponsor-codes\/[^/]+/, '/sponsor-codes/:code')
        .replace(/^\/admins\/[^/]+/, '/admins/:user');
      const target = decodeURIComponent((subPath.match(/^\/(?:orders|runners|sponsor-codes|admins)\/([^/]+)/) || [])[1] || '');
      const body: Record<string, unknown> = {};
      for (const k of AUDIT_BODY_KEYS) {
        const v = (req.body || {})[k];
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') body[k] = typeof v === 'string' ? v.slice(0, 200) : v;
      }
      void writeAudit({ username: admin ? admin.username : staff!.sub, role: admin ? admin.role : 'staff', ip: clientIp(req) }, req.method + ' ' + pattern, target, { ...(Object.keys(body).length ? { body } : {}), ...((res.locals.auditDetail as Record<string, unknown>) || {}) });
    });
    next();
  };
  app.use('/api/admin', auditTrail);
  const auditNow = (req: express.Request, action: string, target = '', detail: Record<string, unknown> = {}) => {
    const admin = (req as any).admin as { username: string; role: string } | undefined;
    void writeAudit({ username: admin?.username || 'unknown', role: admin?.role || '', ip: clientIp(req) }, action, target, detail);
  };

  app.post('/api/admin/login', smallJson, h(async (req, res) => {
    const r = await checkCredentials(clientIp(req), req.body?.username, req.body?.password);
    if (r.ok) {
      console.log(`[admin] login ok: ${r.username} (${r.role}) from ${clientIp(req)}`);
      void writeAudit({ username: r.username, role: r.role, ip: clientIp(req) }, 'LOGIN ok');
      res.json({ ...(await issueSessionFor(r.username, r.role)), username: r.username, role: r.role });
      return;
    }
    console.warn(`[admin] login failed from ${clientIp(req)}`);
    void writeAudit({ username: String(req.body?.username || '').slice(0, 60), role: '', ip: clientIp(req) }, r.lockedSeconds ? 'LOGIN locked' : 'LOGIN failed');
    res.status(r.lockedSeconds ? 429 : 401).json({
      error: r.lockedSeconds
        ? `ใส่รหัสผิดหลายครั้ง ระงับการเข้าสู่ระบบ ${Math.ceil(r.lockedSeconds / 60)} นาที`
        : `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลืออีก ${r.remaining} ครั้ง)`,
      lockedSeconds: r.lockedSeconds,
    });
  }));

  // Ticket scanner / BIB search: order id, BIB or concert-pass number
  // Ticket scanner: the admin, or ticket-checking staff (who get a reduced view without contact details).
  const adminOrStaff: express.RequestHandler = (req, res, next) => {
    verifyAdminSession(req)
      .then((admin) => {
        if (admin) {
          (req as any).admin = admin;
          (req as any).viewer = 'admin';
          return next();
        }
        const s = sessionFromRequest(req);
        if (s && s.role === 'staff') {
          (req as any).viewer = 'staff';
          return next();
        }
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบใหม่' });
      })
      .catch(next);
  };

  app.get('/api/admin/lookup', adminOrStaff, h(async (req, res) => {
    const order = await findOrderByCode(String(req.query.q || '').slice(0, 80));
    if (!order) {
      res.status(404).json({ error: 'ไม่พบตั๋ว/เลข BIB นี้ในระบบ' });
      return;
    }
    res.json({ order: (req as any).viewer === 'staff' ? toStaffView(order) : toAdminView(order) });
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
      orders: orders.map((o) => toAdminView(o)),
      bibCounters: await getBibCounters(),
      nextBib: await nextBibPreview(),
    });
  }));

  // ---- Runner accounts (back office) ---------------------------------------
  app.get('/api/admin/runners', requireAdmin, h(async (_req, res) => {
    const runners = await listRunnersForAdmin();
    const by = (m: string) => runners.filter((r) => r.methods.includes(m)).length;
    res.json({
      runners,
      totals: {
        accounts: runners.length,
        withOrders: runners.filter((r) => r.orders > 0).length,
        password: by('password'),
        google: by('google'),
        line: by('line'),
      },
    });
  }));

  app.get('/api/admin/runners/:runnerId', requireAdmin, h(async (req, res) => {
    const runner = await getRunner(String(req.params.runnerId));
    if (!runner) {
      res.status(404).json({ error: 'ไม่พบบัญชีนี้' });
      return;
    }
    const orders = await listOrdersByRunner(runner.runner_id);
    res.json({ runner: { ...publicRunner(runner), hasPassword: Boolean(runner.password_hash) }, orders: orders.map((o) => toAdminView(o)) });
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
    await recordEmailResult(order.orderId, r);
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

  // Hand-over of the kit. Scanning only ever checks a ticket IN (a second scan just reports who already took it);
  // taking it back ("undo") is for admins only. Every check-in records the time and who did it.
  app.post('/api/admin/orders/:orderId/kit', adminOrStaff, smallJson, h(async (req, res) => {
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
      res.status(400).json({ error: 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว (' + (order.cancelReason || '-') + ')' });
      return;
    }
    const viewer = (req as any).viewer as 'admin' | 'staff';
    const undo = req.body?.action === 'undo';
    if (undo && viewer !== 'admin') {
      res.status(403).json({ error: 'ยกเลิกการรับของได้เฉพาะแอดมิน' });
      return;
    }
    const who = viewer === 'admin' ? ((req as any).admin?.username as string) : (sessionFromRequest(req)?.sub as string) || 'staff';
    let already = false;
    const updated = await updateOrder(orderId, (o) => {
      if (undo) {
        o.kitStatus = 'PENDING_PICKUP';
        o.registrationStatus = 'CONFIRMED';
        delete o.kitCheckedInAt;
        delete o.kitCheckedInBy;
        return;
      }
      if (o.kitStatus === 'CHECKED_IN') {
        already = true;
        return;
      }
      o.kitStatus = 'CHECKED_IN';
      o.registrationStatus = 'CHECKED_IN';
      o.kitCheckedInAt = new Date().toISOString();
      o.kitCheckedInBy = who;
    });
    res.json({ order: viewer === 'staff' ? toStaffView(updated!) : toAdminView(updated!), alreadyCheckedIn: already });
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

  // Permanent delete (owner only, no undo). The browser must send the order id back as a typed confirmation.
  app.delete('/api/admin/orders/:orderId', requireAdmin, smallJson, h(async (req, res) => {
    const id = String(req.params.orderId);
    if (String(req.body?.confirm || '').trim().toUpperCase() !== id.toUpperCase()) {
      res.status(400).json({ error: 'ต้องพิมพ์เลขคำสั่งซื้อ ' + id + ' เพื่อยืนยันการลบ' });
      return;
    }
    const summary = await deleteOrderPermanently(id);
    if (!summary) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ (อาจถูกลบไปแล้ว)' });
      return;
    }
    // what was removed is kept in the audit log (id, name, amount, status), the rest of the order is gone for good
    res.locals.auditDetail = { deleted: summary };
    console.log('[admin] ' + (req as any).admin.username + ' DELETED order ' + id);
    res.json({ ok: true, orderId: id });
  }));

  // Admin: create a free / gift ticket by hand (a NEW order only; existing orders are never touched).
  // Paid at once (no money), gets a BIB like any paid order, and can be e-mailed to the holder. Manager role or higher.
  app.post('/api/admin/orders/manual', requireAdmin, smallJson, h(async (req, res) => {
    const b = req.body || {};
    const admin = (req as any).admin.username as string;
    const isConcert = b.ticketType === 'CONCERT';
    const routeId = (isConcert ? 'concert' : b.routeId) as RouteId;
    if (!isConcert && !ROUTE_IDS.includes(routeId)) {
      res.status(400).json({ error: 'ระยะวิ่งไม่ถูกต้อง' });
      return;
    }
    const fullName = clean(b.fullName, 120);
    const phone = clean(b.phone, 30);
    const email = clean(b.email, 120);
    const emergencyPhone = clean(b.emergencyPhone, 30) || phone;
    const reason = clean(b.reason, 300);
    const shirtSize = isConcert ? '' : SHIRT_SIZES.includes(b.shirtSize) ? b.shirtSize : '';
    const isDog = !isConcert && isDogCategory(routeId);
    const dogName = isDog ? clean(b.dogName, 80) : '';
    const concertQty = isConcert ? Math.min(9, Math.max(1, Math.floor(Number(b.concertQty) || 1))) : 0;
    const errors: string[] = [];
    if (fullName.length < 2) errors.push('กรุณากรอกชื่อ-นามสกุล');
    if (phone && phone.replace(/\D/g, '').length < 9) errors.push('เบอร์โทรศัพท์ไม่ถูกต้อง');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('อีเมลไม่ถูกต้อง');
    const sendEmail = b.sendEmail !== false;
    if (sendEmail && !email) errors.push('ต้องการส่งอีเมลตั๋ว กรุณากรอกอีเมล (หรือปิดตัวเลือกส่งอีเมล)');
    if (!isConcert && !shirtSize) errors.push('กรุณาเลือกไซซ์เสื้อ');
    if (reason.length < 3) errors.push('กรุณาระบุเหตุผล/ที่มาของตั๋ว (เช่น ผู้สนับสนุน, แขกผู้จัดงาน)');
    if (errors.length) {
      res.status(400).json({ error: errors.join(' · ') });
      return;
    }
    const token = crypto.randomBytes(24).toString('base64url');
    const now = new Date();
    const order: StoredOrder = {
      orderId: await nextOrderId(),
      accessTokenHash: hashToken(token),
      fullName,
      phone,
      email,
      emergencyPhone,
      routeId,
      routeName: isConcert ? 'ตั๋วคอนเสิร์ต / เข้างาน (ไม่วิ่ง)' : ticketById(routeId).name,
      ticketType: isConcert ? 'CONCERT' : 'RUN',
      concertQty: concertQty > 0 ? concertQty : undefined,
      shirtSize,
      runningWithDog: isDog,
      dogName: isDog ? dogName : undefined,
      extraPeople: 0,
      extraDogs: 0,
      peopleCount: isConcert ? concertQty : 1,
      dogCount: isDog ? 1 : 0,
      totalPrice: 0,
      bibNumber: '',
      paymentMethod: 'ADMIN_GIFT',
      paymentStatus: 'PENDING',
      paymentRef: '',
      senderBank: '',
      verificationStatus: 'AWAITING_PAYMENT',
      kitStatus: 'PENDING_PICKUP',
      registrationStatus: 'REGISTERED',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    };
    const ins = await insertOrderChecked(order, WIND_TUNNEL_LIMIT);
    if (!ins.ok) {
      res.status(409).json({ error: 'สร้างตั๋วไม่สำเร็จ (ที่นั่งเต็ม)' });
      return;
    }
    let paid: StoredOrder | undefined;
    try {
      paid = await markOrderPaid(order.orderId, {
        status: 'ADMIN_APPROVED',
        verifiedBy: `แอดมิน ${admin}`,
        paymentRef: '',
        senderBank: 'ADMIN',
        note: `ตั๋วมอบ/ฟรี สร้างโดยแอดมิน ${admin} — ${reason}`,
      });
    } catch (err) {
      await rollbackNewOrder(order.orderId).catch(() => {});
      throw err;
    }
    if (sendEmail) await mailNewlyPaid(false, paid);
    console.log(`[admin] ${admin} created gift ticket ${order.orderId}`);
    const done = (await getOrder(order.orderId)) || paid || order;
    res.json({ order: toAdminView(done), emailed: sendEmail && !!done.emailStatus?.ok, emailError: sendEmail && done.emailStatus && !done.emailStatus.ok ? done.emailStatus.error : undefined });
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
    const b = req.body || {};
    const hasSchedule = 'autoFrom' in b || 'autoUntil' in b;
    if (typeof b.on !== 'boolean' && !hasSchedule) {
      res.status(400).json({ error: 'on must be true or false' });
      return;
    }
    const okDate = (v: unknown) => v === null || v === '' || v === undefined || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T[0-9:.+Z-]+)?$/.test(v) && !Number.isNaN(Date.parse(v.length === 10 ? v + 'T00:00:00+07:00' : v)));
    if (hasSchedule && (!okDate(b.autoFrom) || !okDate(b.autoUntil))) {
      res.status(400).json({ error: 'รูปแบบวันที่ไม่ถูกต้อง (ใช้ ปี-เดือน-วัน เช่น 2026-11-09)' });
      return;
    }
    if (hasSchedule && b.autoFrom && b.autoUntil && String(b.autoFrom).slice(0, 10) > String(b.autoUntil).slice(0, 10)) {
      res.status(400).json({ error: 'วันเริ่มต้องไม่เกินวันสิ้นสุด' });
      return;
    }
    let state = await getEarlyBird();
    if (typeof b.on === 'boolean') state = await setEarlyBird(b.on);
    if (hasSchedule) state = await setEarlyBirdSchedule(b.autoFrom ? String(b.autoFrom) : undefined, b.autoUntil ? String(b.autoUntil) : undefined);
    res.json(state);
  }));

  app.put('/api/admin/sales', requireAdmin, smallJson, h(async (req, res) => {
    const b = req.body || {};
    const hasAt = 'openAt' in b;
    if (typeof b.open !== 'boolean' && !hasAt) {
      res.status(400).json({ error: 'open must be true or false' });
      return;
    }
    if (hasAt && b.openAt !== null && (typeof b.openAt !== 'string' || Number.isNaN(Date.parse(b.openAt)))) {
      res.status(400).json({ error: 'เวลาเปิดขายไม่ถูกต้อง' });
      return;
    }
    let state = await getSalesStatus();
    if (typeof b.open === 'boolean') state = await setSalesOpen(b.open);
    if (hasAt) state = await setSalesOpenAt(b.openAt as string | null);
    res.json(state);
  }));

  app.get('/api/admin/announcements', requireAdmin, h(async (_req, res) => {
    res.json({ announcements: await getAnnouncements() });
  }));
  app.put('/api/admin/announcements', requireAdmin, smallJson, h(async (req, res) => {
    res.json({ announcements: await saveAnnouncements((req.body || {}).announcements) });
  }));

  app.get('/api/admin/settings', requireAdmin, h(async (_req, res) => {
    res.json({ settings: await getSettings(), bibCounters: await getBibCounters() });
  }));

  app.put('/api/admin/settings', requireAdmin, smallJson, h(async (req, res) => {
    const s = req.body?.settings || {};
    const counters = req.body?.bibCounters || {};
    const promptPayId = String(s.promptPayId || '').replace(/[^0-9]/g, '');
    // PromptPay is optional: without it the page shows the bank account only (no QR)
    if (promptPayId && ![10, 13, 15].includes(promptPayId.length)) {
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
    const qrPayload = String(s.qrPayload || '').trim();
    if (qrPayload && !isValidQrPayload(qrPayload)) {
      res.status(400).json({ error: 'ข้อความ QR ไม่ถูกต้อง (ต้องเป็นข้อความที่อ่านได้จาก QR ของธนาคาร ขึ้นต้น 000201)' });
      return;
    }
    await saveSettings({
      qrPayload,
      promptPayId,
      accountName: clean(s.accountName, 150) || cur.accountName,
      bankLabel: clean(s.bankLabel, 80) || cur.bankLabel,
      bankAccountNo,
      paymentTimeoutMinutes: Math.min(60, Math.max(1, Math.floor(Number(s.paymentTimeoutMinutes) || 30))),
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

  // ---- Who am I / change my own password ----------------------------------
  app.get('/api/admin/me', requireAdmin, h(async (req, res) => {
    res.json({ username: (req as any).admin.username, role: (req as any).admin.role });
  }));

  app.post('/api/admin/me/password', requireAdmin, smallJson, h(async (req, res) => {
    const me = (req as any).admin as { username: string; role: string };
    if (me.role === 'owner') {
      res.status(400).json({ error: 'รหัสผ่านของบัญชีเจ้าของตั้งในตัวแปร ADMIN_PASSWORD บน Vercel' });
      return;
    }
    const user = await findAdminUser(me.username);
    if (!user || !(await checkAdminUserPassword(me.username, String(req.body?.current || '')))) {
      res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      return;
    }
    if (!validAdminPassword(String(req.body?.password || ''))) {
      res.status(400).json({ error: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 10 ตัวอักษร' });
      return;
    }
    await updateAdminUser(me.username, { password: String(req.body.password) });
    auditNow(req, 'POST /me/password', me.username);
    res.json({ ok: true, message: 'เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่' });
  }));

  // ---- Admin accounts (owner only) ------------------------------------------
  app.get('/api/admin/admins', requireAdmin, h(async (_req, res) => {
    res.json({ admins: await listAdminUsers() });
  }));

  app.post('/api/admin/admins', requireAdmin, smallJson, h(async (req, res) => {
    const b = req.body || {};
    const r = await createAdminUser({ username: String(b.username || ''), displayName: String(b.displayName || ''), role: isRole(b.role) ? b.role : 'viewer', password: String(b.password || '') });
    if (!r.ok) {
      res.status(400).json({ error: r.error });
      return;
    }
    res.json({ admins: await listAdminUsers() });
  }));

  // sign every admin out (use when a password or a device may be compromised)
  app.post('/api/admin/admins/sign-out-all', requireAdmin, h(async (req, res) => {
    await signOutEveryone();
    auditNow(req, 'POST /admins/sign-out-all');
    res.json({ ok: true });
  }));

  app.patch('/api/admin/admins/:username', requireAdmin, smallJson, h(async (req, res) => {
    const b = req.body || {};
    const patch: Parameters<typeof updateAdminUser>[1] = {};
    if (isRole(b.role)) patch.role = b.role;
    if (typeof b.active === 'boolean') patch.active = b.active;
    if (typeof b.displayName === 'string') patch.displayName = b.displayName;
    if (typeof b.password === 'string' && b.password) patch.password = b.password;
    if (b.signOut === true) patch.signOut = true;
    const r = await updateAdminUser(String(req.params.username), patch);
    if (!r.ok) {
      res.status(400).json({ error: r.error });
      return;
    }
    res.json({ admins: await listAdminUsers() });
  }));

  app.get('/api/admin/audit', requireAdmin, h(async (req, res) => {
    const q = req.query;
    res.json({
      rows: await listAudit({
        limit: Number(q.limit) || 100,
        before: Number(q.before) || undefined,
        action: typeof q.action === 'string' && q.action ? q.action.slice(0, 40) : undefined,
        actor: typeof q.actor === 'string' && q.actor ? q.actor.slice(0, 60) : undefined,
      }),
    });
  }));

  // ---- Full (unmasked) orders: logged every time --------------------------------
  app.get('/api/admin/orders/:orderId/full', requireAdmin, h(async (req, res) => {
    const order = await getOrder(String(req.params.orderId));
    if (!order) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    auditNow(req, 'GET /orders/:id/full', order.orderId, { reason: 'reveal sensitive fields' });
    res.json({ order: toAdminView(order, { full: true }) });
  }));

  app.get('/api/admin/export/orders', requireAdmin, h(async (req, res) => {
    const orders = await listOrders();
    auditNow(req, 'GET /export/orders', '', { count: orders.length, kind: String(req.query.kind || 'full').slice(0, 20) });
    res.json({ orders: orders.map((o) => toAdminView(o, { full: true })) });
  }));

  // ---- Refund record (the money itself is returned through the bank) -----------------
  app.post('/api/admin/orders/:orderId/refund', requireAdmin, smallJson, h(async (req, res) => {
    const id = String(req.params.orderId);
    const order = await getOrder(id);
    if (!order) {
      res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
      return;
    }
    const admin = (req as any).admin.username as string;
    if (req.body?.clear === true) {
      const cleared = await updateOrder(id, (o) => {
        delete o.refundedAt;
        delete o.refundAmount;
        delete o.refundNote;
        delete o.refundBy;
      });
      res.json({ order: toAdminView(cleared!) });
      return;
    }
    if (order.paymentStatus !== 'PAID') {
      res.status(400).json({ error: 'คำสั่งซื้อนี้ยังไม่ได้ชำระเงิน จึงไม่มีเงินให้คืน' });
      return;
    }
    const amount = Math.round(Number(req.body?.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount > order.totalPrice) {
      res.status(400).json({ error: 'ยอดคืนต้องมากกว่า 0 และไม่เกินยอดที่ชำระ (' + order.totalPrice + ' บาท)' });
      return;
    }
    const note = clean(req.body?.note, 300);
    if (note.length < 3) {
      res.status(400).json({ error: 'กรุณาระบุรายละเอียดการคืนเงิน (เช่น โอนคืนวันที่…)' });
      return;
    }
    const updated = await updateOrder(id, (o) => {
      o.refundedAt = new Date().toISOString();
      o.refundAmount = amount;
      o.refundNote = note;
      o.refundBy = admin;
    });
    res.json({ order: toAdminView(updated!) });
  }));

  // ---- Seat limits for the tower / shooting range (overrides TOWER_LIMIT / GUN_LIMIT) ------
  app.get('/api/admin/limits', requireAdmin, h(async (_req, res) => {
    const limits = await refreshActivityLimits(true);
    res.json({ limits: { tower: limits.tower, gun: limits.gun }, seatsLeft: await activitySeatsLeft() });
  }));

  app.put('/api/admin/limits', requireAdmin, smallJson, h(async (req, res) => {
    const n = (v: unknown) => Math.floor(Number(v));
    const tower = n(req.body?.tower);
    const gun = n(req.body?.gun);
    if (![tower, gun].every((x) => Number.isFinite(x) && x >= 0 && x <= 10000)) {
      res.status(400).json({ error: 'จำนวนที่นั่งต้องเป็นตัวเลข 0 ขึ้นไป (0 = ไม่จำกัด)' });
      return;
    }
    const limits = await saveActivityLimits({ tower, gun });
    res.json({ limits: { tower: limits.tower, gun: limits.gun }, seatsLeft: await activitySeatsLeft() });
  }));

  // ---- Runner accounts: switch off / on, send a password-reset e-mail ---------------
  app.post('/api/admin/runners/:runnerId/disable', requireAdmin, smallJson, h(async (req, res) => {
    const ok = await setRunnerDisabled(String(req.params.runnerId), req.body?.disabled !== false);
    if (!ok) {
      res.status(404).json({ error: 'ไม่พบบัญชีนี้' });
      return;
    }
    res.json({ ok: true, disabled: req.body?.disabled !== false });
  }));

  app.post('/api/admin/runners/:runnerId/reset-email', requireAdmin, h(async (req, res) => {
    const runner = await getRunner(String(req.params.runnerId));
    if (!runner) {
      res.status(404).json({ error: 'ไม่พบบัญชีนี้' });
      return;
    }
    if (!runner.email) {
      res.status(400).json({ error: 'บัญชีนี้ไม่มีอีเมล (สมัครผ่าน LINE) จึงส่งลิงก์ตั้งรหัสผ่านไม่ได้' });
      return;
    }
    if (!runner.password_hash) {
      res.status(400).json({ error: 'บัญชีนี้เข้าสู่ระบบด้วย Google/LINE ไม่มีรหัสผ่านให้ตั้งใหม่' });
      return;
    }
    const token = issueActionToken('reset', runner.runner_id, passwordFingerprint(runner.password_hash));
    const r = await sendAccountMail(runner.email, 'ตั้งรหัสผ่านใหม่ · CHANGSUEK RUN', 'ตั้งรหัสผ่านใหม่', 'ผู้จัดงานส่งลิงก์ตั้งรหัสผ่านใหม่ให้บัญชีนักวิ่งของคุณ กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์ใช้ได้ 1 ชั่วโมงและใช้ได้ครั้งเดียว', 'ตั้งรหัสผ่านใหม่', SITE_URL + '/#reset=' + token);
    if (!r.ok) {
      res.status(r.error === 'MAIL_NOT_CONFIGURED' ? 503 : 502).json({ error: 'ส่งอีเมลไม่สำเร็จ: ' + r.error });
      return;
    }
    res.json({ ok: true, to: maskEmail(runner.email) });
  }));

  registerRunnerRoutes(app, h, clientIp);

  // Any other /api path is a 404 (prevents the SPA fallback from answering API calls).
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
