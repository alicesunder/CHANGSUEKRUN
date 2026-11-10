/**
 * Persistent store (Postgres). Every function is async.
 * Orders are kept as one jsonb document plus a few indexed columns, so the admin can
 * also query them with plain SQL in Supabase.
 */
import crypto from 'crypto';
import type { RouteId } from '../src/types';
import { dbQuery, dbTx, type Q } from './db';

export type VerificationStatus =
  | 'AWAITING_PAYMENT'
  | 'PENDING_REVIEW'
  | 'AUTO_VERIFIED'
  | 'ADMIN_APPROVED'
  | 'REJECTED';

import { maskPassport, type InsuranceInfo } from '../src/data/insurance';
import type { DogProfile } from '../src/data/dogProfile';
import { maskThaiId, type ShootingInfo } from '../src/data/shooting';
import type { ActivityWaiverInfo } from '../src/data/activityWaivers';
import type { ExtraRunner } from '../src/data/shirts';
import type { ParkingPlate } from '../src/data/vipParking';

export interface StoredOrder {
  orderId: string;
  accessTokenHash: string;
  fullName: string;
  phone: string;
  email: string;
  emergencyPhone: string;
  /** 'concert' for concert-only passes (no run, no BIB) */
  routeId: RouteId;
  /** RUN = running ticket (includes the concert), CONCERT = concert/entry pass only */
  ticketType?: 'RUN' | 'CONCERT' | 'ADDON';
  /** number of concert passes (CONCERT orders only) */
  concertQty?: number;
  /** baht taken off the concert tickets by the run + concert bundle */
  /** VAT 7% added on top: amount before VAT, the VAT itself and the rate (totalPrice = subtotalPrice + vatAmount) */
  subtotalPrice?: number;
  vatAmount?: number;
  vatRate?: number;
  /** baht taken off the run ticket by the basket discount, and the rate (0.1 / 0.15 / 0.2) */
  runDiscount?: number;
  discountRate?: number;
  concertDiscount?: number;
  /** made while the admin early-bird switch was on */
  earlyBird?: boolean;
  /** VIP concert tables (6 seats each), bought in the same order */
  vipTables?: number;
  routeName: string;
  shirtSize: string;
  runningWithDog: boolean;
  dogName?: string;
  dogBreed?: string;
  dogProfile?: DogProfile;
  extraPeople: number;
  extraDogs: number;
  extraRunnerNames?: string;
  /** name + jersey size of each extra Dog Run runner (orders before Nov 2026 only have the text above) */
  extraRunners?: ExtraRunner[];
  peopleCount: number;
  dogCount: number;
  totalPrice: number;
  bibNumber: string;
  paymentMethod: 'PROMPTPAY_QR' | 'SPONSOR_CODE' | 'ADMIN_GIFT';
  /** ADMIN_GIFT = a free / gift ticket created by an admin in the admin page (no payment) */
  /** Set when the registration was made free with a sponsor code */
  sponsorCode?: string;
  sponsorName?: string;
  /** Accident-insurance details (5 km / 10 km runners only) */
  insurance?: InsuranceInfo;
  /** VIP tables: registered cars for the parking passes */
  parkingPlates?: ParkingPlate[];
  /** Shooting activity: every shooter's name + national ID, and when the consent was accepted */
  shooting?: ShootingInfo;
  /** Tower / wind tunnel: participants filled into the legal waivers, and when each was accepted */
  activityWaiver?: ActivityWaiverInfo;
  /** Optional after-run activities bought with the ticket */
  addOns?: { tower: boolean; gun: 'none' | 'standard' | 'premium'; windTunnel: boolean; people: number; persons?: { tower: boolean; gun: 'none' | 'standard' | 'premium'; windTunnel: boolean }[]; towerCount?: number; gunCount?: number; windCount?: number; pricePerPerson: number; total: number; discount?: number; label: string };
  paymentStatus: 'PAID' | 'PENDING';
  paymentRef: string;
  senderBank: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNote?: string;
  slipFile?: string;
  slipHash?: string;
  /** Last slip check: when, what EasySlip read, and why it passed or failed */
  slipCheckedAt?: string;
  slipRef?: string;
  slipNote?: string;
  slipAttempts?: number;
  aiReview?: string;
  omiseChargeId?: string;
  omiseQrImageUrl?: string;
  /** Earlier charges of this order (replaced by "new QR"); a late payment on any of them still counts */
  omisePastChargeIds?: string[];
  /** when the runner accepted the privacy notice / terms, and which versions */
  privacyConsentAt?: string;
  privacyPolicyVersion?: string;
  termsVersion?: string;
  kitStatus: 'PENDING_PICKUP' | 'CHECKED_IN';
  registrationStatus: 'REGISTERED' | 'CONFIRMED' | 'CHECKED_IN';
  createdAt: string;
  expiresAt: string;
  /** Cancelled by an admin (orders are never deleted): when, by whom and why */
  /** 1-baht test order made by an admin (admin test mode): own order/BIB numbers, never counted in sales or limits */
  isTest?: boolean;
  testBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  paidAt?: string;
  /** the runner account that bought it (set when the buyer was logged in, or an order was claimed later) */
  runnerId?: string;
  /** the runner asked for extra payment time once (+15 minutes) */
  extendedAt?: string;
  /** when the kit was handed over and by whom (ticket-checking staff or admin) */
  kitCheckedInAt?: string;
  kitCheckedInBy?: string;
  /** result of the last ticket e-mail (sent automatically after payment, or re-sent by an admin) */
  emailStatus?: { at: string; ok: boolean; error?: string };
  /** money given back to the buyer (recorded by an admin; the transfer itself is made in the bank) */
  refundedAt?: string;
  refundAmount?: number;
  refundNote?: string;
  refundBy?: string;
}

export interface PublicSettings {
  /** The bank's own QR text (bill payment / merchant); the website adds the amount to it. Empty = use the PromptPay ID. */
  qrPayload: string;
  /** PromptPay proxy used to build the QR: phone (10), citizen/tax ID (13) or K PLUS/e-wallet ref (15) */
  promptPayId: string;
  accountName: string;
  bankLabel: string;
  /** Bank account number shown to runners who transfer manually (display only) */
  bankAccountNo: string;
  paymentTimeoutMinutes: number;
}

export const ROUTES: RouteId[] = ['10km', '5km', '3km', '1km'];
export type BibCounters = Record<RouteId, number>;

const DEFAULT_SETTINGS: PublicSettings = {
  qrPayload: process.env.QR_PAYLOAD || '00020101021130780016A00000067701011201150107537000882050219YV099400ZK0159200FN0312CHANGSUEKRUN53037645802TH62080704000063043D85',
  promptPayId: process.env.PROMPTPAY_ID || '',
  accountName:
    process.env.PROMPTPAY_ACCOUNT_NAME ||
    'โครงการช้างศึกรันเห็นช้างวิ่งวิ่งตามช้าง (CHANGSUEK RUN 2026)',
  bankLabel: process.env.BANK_LABEL || 'ธนาคารกรุงไทย',
  bankAccountNo: process.env.BANK_ACCOUNT_NO || '0340291354',
  paymentTimeoutMinutes: 30,
};

const asObj = <T>(v: unknown): T => (typeof v === 'string' ? JSON.parse(v) : (v as T));

// ---------------------------------------------------------------------------
// Settings & gateway key
// ---------------------------------------------------------------------------
export async function getSettings(): Promise<PublicSettings> {
  const rows = await dbQuery<{ value: unknown }>("select value from csr.settings where key = 'public'");
  return { ...DEFAULT_SETTINGS, ...(rows[0] ? asObj<Partial<PublicSettings>>(rows[0].value) : {}) };
}

export async function saveSettings(s: PublicSettings): Promise<void> {
  await dbQuery(
    `insert into csr.settings (key, value) values ('public', $1::jsonb)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(s)]
  );
}

/** Ticket sales switch (admin): when closed, no new orders; orders already made can still be paid. */
/**
 * Defaults from the organiser's registration plan (Nov 2026): sales open on 9 Nov 2569 at 09.00 (Bangkok), and the
 * early-bird prices run 9–19 Nov. They apply until an admin saves something else in the back office
 * (saving "no schedule" stores an explicit null, which switches the default off).
 */
export const DEFAULT_SALES_OPEN_AT = '2026-11-09T09:00:00+07:00';
export const DEFAULT_EARLY_BIRD_FROM = '2026-11-09';
export const DEFAULT_EARLY_BIRD_UNTIL = '2026-11-19';

export interface SalesState {
  /** effective: orders are accepted right now */
  open: boolean;
  /** the manual switch (false = closed by an admin) */
  manualOpen: boolean;
  /** automatic opening time (ISO); undefined = none */
  openAt?: string;
  /** the manual switch is on but the opening time has not come yet */
  scheduled: boolean;
  updatedAt?: string;
}

export async function getSalesStatus(): Promise<SalesState> {
  const rows = await dbQuery<{ value: unknown }>("select value from csr.settings where key = 'sales'");
  const v = rows[0] ? asObj<{ open?: boolean; openAt?: string | null; updatedAt?: string }>(rows[0].value) : {};
  const openAt = v.openAt === null ? undefined : typeof v.openAt === 'string' && v.openAt ? v.openAt : DEFAULT_SALES_OPEN_AT;
  const manualOpen = v.open !== false;
  const timeOk = !openAt || Number.isNaN(Date.parse(openAt)) || Date.now() >= Date.parse(openAt);
  return { open: manualOpen && timeOk, manualOpen, openAt, scheduled: manualOpen && !timeOk, updatedAt: v.updatedAt };
}

async function writeSales(v: { open: boolean; openAt: string | null }): Promise<SalesState> {
  const value = { open: v.open, openAt: v.openAt, updatedAt: new Date().toISOString() };
  await dbQuery(
    `insert into csr.settings (key, value) values ('sales', $1::jsonb)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(value)]
  );
  return getSalesStatus();
}

/** Opening by hand opens NOW (it clears the automatic opening time); closing keeps the time for later. */
export async function setSalesOpen(open: boolean): Promise<SalesState> {
  const cur = await getSalesStatus();
  return writeSales({ open, openAt: open ? null : cur.openAt ?? null });
}

/** Sets (or, with null, removes) the automatic opening time. */
export async function setSalesOpenAt(openAt: string | null): Promise<SalesState> {
  const cur = await getSalesStatus();
  return writeSales({ open: cur.manualOpen, openAt });
}

/**
 * Early-bird prices. They are on when the admin switch is on, or while today falls inside the optional schedule
 * (autoFrom..autoUntil, ISO date-times; a date alone means the whole Bangkok day).
 */
export interface EarlyBirdState {
  /** effective: the prices in use right now */
  on: boolean;
  /** the manual switch */
  manual: boolean;
  autoFrom?: string;
  autoUntil?: string;
  /** true when the schedule (not the switch) is what turned it on */
  byTimer: boolean;
  updatedAt?: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const bkkStart = (d: string) => (DATE_ONLY.test(d) ? `${d}T00:00:00+07:00` : d);
const bkkEnd = (d: string) => (DATE_ONLY.test(d) ? `${d}T23:59:59.999+07:00` : d);

export function earlyBirdWindowActive(autoFrom?: string, autoUntil?: string, now = Date.now()): boolean {
  if (!autoFrom && !autoUntil) return false;
  const from = autoFrom ? Date.parse(bkkStart(autoFrom)) : -Infinity;
  const until = autoUntil ? Date.parse(bkkEnd(autoUntil)) : Infinity;
  if (Number.isNaN(from) || Number.isNaN(until)) return false;
  return now >= from && now <= until;
}

async function readEarlyBird(): Promise<{ manual: boolean; autoFrom?: string; autoUntil?: string; updatedAt?: string }> {
  const rows = await dbQuery<{ value: unknown }>("select value from csr.settings where key = 'early_bird'");
  const v = rows[0] ? asObj<{ on?: boolean; updatedAt?: string; autoFrom?: string; autoUntil?: string }>(rows[0].value) : {};
  // missing = the organiser's default window; an explicit null (saved from the back office) = no schedule
  const pick = (x: string | null | undefined, d: string) => (x === null ? undefined : x || d);
  return { manual: v.on === true, autoFrom: pick(v.autoFrom as string | null | undefined, DEFAULT_EARLY_BIRD_FROM), autoUntil: pick(v.autoUntil as string | null | undefined, DEFAULT_EARLY_BIRD_UNTIL), updatedAt: v.updatedAt };
}

export async function getEarlyBird(): Promise<EarlyBirdState> {
  const v = await readEarlyBird();
  const inWindow = earlyBirdWindowActive(v.autoFrom, v.autoUntil);
  return { on: v.manual || inWindow, manual: v.manual, autoFrom: v.autoFrom, autoUntil: v.autoUntil, byTimer: !v.manual && inWindow, updatedAt: v.updatedAt };
}

async function writeEarlyBird(v: { manual: boolean; autoFrom?: string; autoUntil?: string }): Promise<EarlyBirdState> {
  const value = { on: v.manual, autoFrom: v.autoFrom || null, autoUntil: v.autoUntil || null, updatedAt: new Date().toISOString() };
  await dbQuery(
    `insert into csr.settings (key, value) values ('early_bird', $1::jsonb)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(value)]
  );
  return getEarlyBird();
}

export async function setEarlyBird(on: boolean): Promise<EarlyBirdState> {
  const cur = await readEarlyBird();
  return writeEarlyBird({ manual: on, autoFrom: cur.autoFrom, autoUntil: cur.autoUntil });
}

export async function setEarlyBirdSchedule(autoFrom: string | undefined, autoUntil: string | undefined): Promise<EarlyBirdState> {
  const cur = await readEarlyBird();
  return writeEarlyBird({ manual: cur.manual, autoFrom, autoUntil });
}

/** Omise secret key: a key saved from the admin page wins; otherwise the OMISE_SECRET_KEY env var. */
export async function getOmiseKey(): Promise<string> {
  const rows = await dbQuery<{ value: unknown }>("select value from csr.settings where key = 'gateway'");
  const saved = rows[0] ? asObj<{ omiseSecretKey?: string }>(rows[0].value).omiseSecretKey : undefined;
  return (saved ?? (process.env.OMISE_SECRET_KEY || '')).trim();
}

export async function setOmiseKey(key: string): Promise<void> {
  await dbQuery(
    `insert into csr.settings (key, value) values ('gateway', $1::jsonb)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify({ omiseSecretKey: key })]
  );
}

/** EasySlip API key: a key saved from the admin page wins; otherwise the EASYSLIP_API_KEY env var. */
export async function getEasySlipKey(): Promise<string> {
  const rows = await dbQuery<{ value: unknown }>("select value from csr.settings where key = 'easyslip'");
  const saved = rows[0] ? asObj<{ apiKey?: string }>(rows[0].value).apiKey : undefined;
  return (saved || process.env.EASYSLIP_API_KEY || '').trim();
}

export async function setEasySlipKey(key: string): Promise<void> {
  await dbQuery(
    `insert into csr.settings (key, value) values ('easyslip', $1::jsonb)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify({ apiKey: key })]
  );
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function tokenMatches(order: StoredOrder, token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(order.accessTokenHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Test orders get their own ids (TEST-XXXXXX) so the real order numbers and BIB numbers are never used up. */
export function newTestOrderId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let id = '';
  for (const b of bytes) id += alphabet[b % alphabet.length];
  return `TEST-${id}`;
}

export async function nextOrderId(): Promise<string> {
  const rows = await dbQuery<{ n: string }>("select nextval('csr.order_seq')::text as n");
  return `CSR27-${String(rows[0].n).padStart(5, '0')}`;
}

const rowToOrder = (row: { data: unknown }): StoredOrder => asObj<StoredOrder>(row.data);

async function writeOrder(q: Q, o: StoredOrder): Promise<void> {
  await q(
    `update csr.orders set token_hash = $2, route_id = $3, payment_status = $4, verification_status = $5,
       bib_number = $6, omise_charge_id = $7, data = $8::jsonb where order_id = $1`,
    [o.orderId, o.accessTokenHash, o.routeId, o.paymentStatus, o.verificationStatus, o.bibNumber || '', o.omiseChargeId || null, JSON.stringify(o)]
  );
}

const INSERT_ORDER_SQL = `insert into csr.orders (order_id, token_hash, route_id, payment_status, verification_status, bib_number, omise_charge_id, created_at, data)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`;
const orderParams = (o: StoredOrder) => [o.orderId, o.accessTokenHash, o.routeId, o.paymentStatus, o.verificationStatus, o.bibNumber || '', o.omiseChargeId || null, o.createdAt, JSON.stringify(o)];

export async function insertOrder(o: StoredOrder): Promise<void> {
  await dbQuery(INSERT_ORDER_SQL, orderParams(o));
}

// Wind-tunnel seats are limited. An order holds seats while it is paid, or unpaid but still within its payment window.
const WIND_TUNNEL_USED_SQL = `select coalesce(sum(coalesce((data->'addOns'->>'windCount')::int, (data->'addOns'->>'people')::int)), 0)::text as n from csr.orders
  where data->'addOns'->>'windTunnel' = 'true'
    and not (data ? 'cancelledAt')
    and not (data ? 'isTest')
    and (payment_status = 'PAID' or (data->>'expiresAt')::timestamptz > now())`;

export async function windTunnelSeatsUsed(): Promise<number> {
  const rows = await dbQuery<{ n: string }>(WIND_TUNNEL_USED_SQL);
  return Number(rows[0]?.n ?? 0);
}

/** Un-cancels an order; refuses when its wind-tunnel seats have been taken by others in the meantime. */
export async function restoreOrderChecked(orderId: string, windTunnelLimit: number): Promise<{ ok: true; order: StoredOrder } | { ok: false; error: string }> {
  return dbTx(async (q) => {
    await q('select pg_advisory_xact_lock(727001)');
    const rows = await q<{ data: unknown }>('select data from csr.orders where order_id = $1 for update', [orderId]);
    if (!rows[0]) return { ok: false as const, error: 'ไม่พบคำสั่งซื้อ' };
    const o = rowToOrder(rows[0]);
    const holdsSeat = o.paymentStatus === 'PAID' || new Date(o.expiresAt).getTime() > Date.now();
    if (o.cancelledAt && o.addOns?.windTunnel && holdsSeat) {
      const used = Number((await q<{ n: string }>(WIND_TUNNEL_USED_SQL))[0]?.n ?? 0);
      if (used + (o.addOns.windCount ?? o.addOns.people) > windTunnelLimit) return { ok: false as const, error: `อุโมงค์ลมเหลือไม่พอ (เหลือ ${Math.max(0, windTunnelLimit - used)} ที่)` };
    }
    delete o.cancelledAt;
    delete o.cancelledBy;
    delete o.cancelReason;
    await writeOrder(q, o);
    return { ok: true as const, order: o };
  });
}

/** Inserts the order; if it takes wind-tunnel seats, checks the limit under a lock so two buyers can't both take the last seat. */
const TOWER_USED_SQL = `select coalesce(sum(coalesce((data->'addOns'->>'towerCount')::int, (data->'addOns'->>'people')::int)), 0)::text as n from csr.orders
  where data->'addOns'->>'tower' = 'true' and not (data ? 'cancelledAt') and not (data ? 'isTest')
    and (payment_status = 'PAID' or (data->>'expiresAt')::timestamptz > now())`;
const GUN_USED_SQL = `select coalesce(sum(coalesce((data->'addOns'->>'gunCount')::int, (data->'addOns'->>'people')::int)), 0)::text as n from csr.orders
  where data->'addOns'->>'gun' in ('standard', 'premium') and not (data ? 'cancelledAt') and not (data ? 'isTest')
    and (payment_status = 'PAID' or (data->>'expiresAt')::timestamptz > now())`;

/** Optional seat limits for the tower and the shooting range (env TOWER_LIMIT / GUN_LIMIT; 0 or unset = no limit). */
const ENV_LIMITS = {
  tower: Math.max(0, Math.floor(Number(process.env.TOWER_LIMIT) || 0)),
  gun: Math.max(0, Math.floor(Number(process.env.GUN_LIMIT) || 0)),
};
/** Mutable on purpose: the admin can override the env values from the back office (see refreshActivityLimits). */
export const ACTIVITY_LIMITS = { ...ENV_LIMITS };

let limitsAt = 0;
/** Loads the admin's saved limits (settings key 'activity_limits'); the env values apply when nothing is saved. */
export async function refreshActivityLimits(force = false): Promise<typeof ACTIVITY_LIMITS> {
  if (!force && Date.now() - limitsAt < 5000) return ACTIVITY_LIMITS;
  const rows = await dbQuery<{ value: unknown }>("select value from csr.settings where key = 'activity_limits'");
  const v = rows[0] ? asObj<{ tower?: number; gun?: number }>(rows[0].value) : {};
  const n = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.floor(x)) : d);
  ACTIVITY_LIMITS.tower = n(v.tower, ENV_LIMITS.tower);
  ACTIVITY_LIMITS.gun = n(v.gun, ENV_LIMITS.gun);
  limitsAt = Date.now();
  return ACTIVITY_LIMITS;
}

export async function saveActivityLimits(limits: { tower: number; gun: number }): Promise<typeof ACTIVITY_LIMITS> {
  await dbQuery(
    "insert into csr.settings (key, value) values ('activity_limits', $1::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now()",
    [JSON.stringify({ tower: Math.max(0, Math.floor(limits.tower)), gun: Math.max(0, Math.floor(limits.gun)) })]
  );
  return refreshActivityLimits(true);
}

export async function activitySeatsLeft(): Promise<{ tower: number | null; gun: number | null }> {
  await refreshActivityLimits();
  const [t, g] = await Promise.all([
    ACTIVITY_LIMITS.tower ? dbQuery<{ n: string }>(TOWER_USED_SQL) : Promise.resolve(null),
    ACTIVITY_LIMITS.gun ? dbQuery<{ n: string }>(GUN_USED_SQL) : Promise.resolve(null),
  ]);
  return {
    tower: t ? Math.max(0, ACTIVITY_LIMITS.tower - Number(t[0]?.n ?? 0)) : null,
    gun: g ? Math.max(0, ACTIVITY_LIMITS.gun - Number(g[0]?.n ?? 0)) : null,
  };
}

export async function insertOrderChecked(
  o: StoredOrder,
  windTunnelLimit: number
): Promise<{ ok: true } | { ok: false; remaining: number; activity?: 'wind' | 'tower' | 'gun' }> {
  await refreshActivityLimits();
  return dbTx(async (q) => {
    const wantsTower = o.addOns?.tower && ACTIVITY_LIMITS.tower > 0 && !o.isTest;
    const wantsGun = o.addOns && o.addOns.gun !== 'none' && ACTIVITY_LIMITS.gun > 0 && !o.isTest;
    if (wantsTower || wantsGun) {
      await q('select pg_advisory_xact_lock(727002)');
      if (wantsTower) {
        const used = Number((await q<{ n: string }>(TOWER_USED_SQL))[0]?.n ?? 0);
        if (used + (o.addOns!.towerCount ?? o.addOns!.people) > ACTIVITY_LIMITS.tower) return { ok: false as const, remaining: Math.max(0, ACTIVITY_LIMITS.tower - used), activity: 'tower' as const };
      }
      if (wantsGun) {
        const used = Number((await q<{ n: string }>(GUN_USED_SQL))[0]?.n ?? 0);
        if (used + (o.addOns!.gunCount ?? o.addOns!.people) > ACTIVITY_LIMITS.gun) return { ok: false as const, remaining: Math.max(0, ACTIVITY_LIMITS.gun - used), activity: 'gun' as const };
      }
    }
    if (o.addOns?.windTunnel && !o.isTest) {
      await q('select pg_advisory_xact_lock(727001)');
      const rows = await q<{ n: string }>(WIND_TUNNEL_USED_SQL);
      const used = Number(rows[0]?.n ?? 0);
      if (used + (o.addOns.windCount ?? o.addOns.people) > windTunnelLimit) return { ok: false as const, remaining: Math.max(0, windTunnelLimit - used), activity: 'wind' as const };
    }
    await q(INSERT_ORDER_SQL, orderParams(o));
    return { ok: true as const };
  });
}

export async function getOrder(orderId: string): Promise<StoredOrder | undefined> {
  const rows = await dbQuery<{ data: unknown }>('select data from csr.orders where order_id = $1', [orderId]);
  return rows[0] ? rowToOrder(rows[0]) : undefined;
}

/** All orders, newest first. Slip images are left out (slipFile is just 'stored' when there is one). */
export async function listOrders(): Promise<StoredOrder[]> {
  const rows = await dbQuery<{ data: unknown }>(
    `select case when data ? 'slipFile' then (data - 'slipFile') || '{"slipFile":"stored"}'::jsonb else data end as data
     from csr.orders order by created_at desc, order_id desc`
  );
  return rows.map(rowToOrder);
}

/**
 * Removes an order that was created a moment ago in the SAME request and could not be completed
 * (e.g. a free sponsor order whose confirmation failed). Customer orders are never deleted:
 * admins cancel them instead (cancelledAt).
 */
export async function rollbackNewOrder(orderId: string): Promise<void> {
  await dbQuery("delete from csr.orders where order_id = $1 and payment_status <> 'PAID'", [orderId]);
}

/**
 * Permanently removes an order (admin "delete", no undo). Gives back the sponsor-code use it consumed.
 * The slip's transfer reference stays in csr.used_refs on purpose, so the same slip can never pay another order.
 * Returns a short summary for the audit log, or undefined when there is no such order.
 */
export async function deleteOrderPermanently(orderId: string): Promise<Record<string, unknown> | undefined> {
  return dbTx(async (q) => {
    const rows = await q<{ data: unknown }>('select data from csr.orders where order_id = $1 for update', [orderId]);
    if (!rows[0]) return undefined;
    const o = rowToOrder(rows[0]);
    await q('delete from csr.orders where order_id = $1', [orderId]);
    if (o.sponsorCode) await q('update csr.sponsor_codes set used_count = greatest(used_count - 1, 0) where code = $1', [o.sponsorCode]);
    return {
      orderId: o.orderId,
      fullName: o.fullName,
      routeName: o.routeName,
      totalPrice: o.totalPrice,
      paymentStatus: o.paymentStatus,
      bibNumber: o.bibNumber,
      cancelled: Boolean(o.cancelledAt),
      test: Boolean(o.isTest),
      refunded: o.refundAmount || 0,
      runnerId: o.runnerId || '',
      createdAt: o.createdAt,
    };
  });
}

/** Read-modify-write under a row lock, so two requests can't overwrite each other. */
/** Remembers whether the last ticket e-mail went out (shown in the back office; never throws). */
export async function recordEmailResult(orderId: string, r: { ok: boolean; error?: string }): Promise<void> {
  try {
    await updateOrder(orderId, (o) => {
      o.emailStatus = { at: new Date().toISOString(), ok: r.ok, ...(r.ok ? {} : { error: String(r.error || 'unknown').slice(0, 200) }) };
    });
  } catch (err) {
    console.error('[mail] could not record the result for', orderId, err instanceof Error ? err.message : err);
  }
}

export async function updateOrder(orderId: string, mutator: (o: StoredOrder) => void): Promise<StoredOrder | undefined> {
  return dbTx(async (q) => {
    const rows = await q<{ data: unknown }>('select data from csr.orders where order_id = $1 for update', [orderId]);
    if (!rows[0]) return undefined;
    const o = rowToOrder(rows[0]);
    mutator(o);
    await writeOrder(q, o);
    return o;
  });
}

const BIB_PREFIX: Record<string, string> = { '10km': '10', '5km': '05', '3km': '03', '1km': '01', concert: 'CN', addon: 'AD' };
export function formatBib(routeId: RouteId, seq: number): string {
  return `${BIB_PREFIX[routeId] || '05'}-${String(seq).padStart(4, '0')}`;
}

const RUN_BIB_ROUTES = new Set<string>(['10km', '5km', '3km', '1km']);

async function randomFreeBib(q: Q, routeId: RouteId): Promise<string | null> {
  for (let i = 0; i < 200; i++) {
    const bib = formatBib(routeId, crypto.randomInt(1000, 10000));
    const taken = await q('select 1 from csr.orders where bib_number = $1 limit 1', [bib]);
    if (taken.length === 0) return bib;
  }
  return null;
}

export async function getBibCounters(): Promise<BibCounters> {
  const rows = await dbQuery<{ route_id: RouteId; last_seq: number }>('select route_id, last_seq from csr.bib_counters');
  const out = { '10km': 0, '5km': 0, '3km': 0, '1km': 0 } as BibCounters;
  for (const r of rows) out[r.route_id] = Number(r.last_seq);
  return out;
}

/** Raise counters (never lower them). Returns the route that was refused, if any. */
export async function setBibCounters(next: Partial<BibCounters>): Promise<{ ok: true } | { ok: false; route: RouteId; current: number }> {
  return dbTx(async (q) => {
    for (const r of ROUTES) {
      const v = next[r];
      if (v === undefined) continue;
      const cur = await q<{ last_seq: number }>('select last_seq from csr.bib_counters where route_id = $1 for update', [r]);
      const current = Number(cur[0]?.last_seq ?? 0);
      if (v < current) return { ok: false as const, route: r, current };
      await q(
        `insert into csr.bib_counters (route_id, last_seq) values ($1, $2)
         on conflict (route_id) do update set last_seq = excluded.last_seq`,
        [r, v]
      );
    }
    return { ok: true as const };
  });
}

export async function isRefUsed(ref: string): Promise<boolean> {
  if (!ref) return false;
  const rows = await dbQuery('select 1 from csr.used_refs where ref = $1', [ref.toUpperCase()]);
  return rows.length > 0;
}

/** Thrown by markOrderPaid when an exclusive payment ref (a slip) already paid another order. */
export class RefUsedError extends Error {}

/**
 * Marks an order paid and assigns its BIB, atomically. Idempotent: an order that is already
 * paid is returned unchanged, so a repeated webhook never consumes a second BIB number.
 * With exclusiveRef, the ref is claimed first and the whole thing rolls back if another order owns it.
 */
export async function markOrderPaid(
  orderId: string,
  info: { status: 'AUTO_VERIFIED' | 'ADMIN_APPROVED'; verifiedBy: string; paymentRef: string; senderBank: string; note?: string; exclusiveRef?: boolean }
): Promise<StoredOrder | undefined> {
  return dbTx(async (q) => {
    const rows = await q<{ data: unknown }>('select data from csr.orders where order_id = $1 for update', [orderId]);
    if (!rows[0]) return undefined;
    const order = rowToOrder(rows[0]);
    if (order.paymentStatus === 'PAID' && order.bibNumber) return order;
    if (info.exclusiveRef && info.paymentRef) {
      await q('insert into csr.used_refs (ref, order_id) values ($1, $2) on conflict (ref) do nothing', [info.paymentRef.toUpperCase(), orderId]);
      const owner = await q<{ order_id: string }>('select order_id from csr.used_refs where ref = $1', [info.paymentRef.toUpperCase()]);
      if (owner[0]?.order_id !== orderId) throw new RefUsedError(info.paymentRef);
    }

    const now = new Date().toISOString();
    if (!order.bibNumber && order.isTest) {
      order.bibNumber = order.orderId; // test orders never take a real BIB number
    }
    if (!order.bibNumber) {
      const c = await q<{ last_seq: number }>(
        `insert into csr.bib_counters (route_id, last_seq) values ($1, 1)
         on conflict (route_id) do update set last_seq = csr.bib_counters.last_seq + 1
         returning last_seq`,
        [order.routeId]
      );
      // Runners get a random free number (1000-9999) so BIBs do not reveal who registered first;
      // the counter row stays locked until commit, so two payments of one route never pick together.
      order.bibNumber = RUN_BIB_ROUTES.has(order.routeId)
        ? (await randomFreeBib(q, order.routeId)) || formatBib(order.routeId, Number(c[0].last_seq))
        : formatBib(order.routeId, Number(c[0].last_seq));
    }
    order.verificationStatus = info.status;
    order.paymentStatus = 'PAID';
    order.registrationStatus = 'CONFIRMED';
    order.verifiedAt = now;
    order.verifiedBy = info.verifiedBy;
    order.paidAt = order.paidAt || now;
    if (info.paymentRef) {
      order.paymentRef = info.paymentRef;
      await q('insert into csr.used_refs (ref, order_id) values ($1, $2) on conflict (ref) do nothing', [
        info.paymentRef.toUpperCase(),
        orderId,
      ]);
    }
    if (info.senderBank) order.senderBank = info.senderBank;
    if (info.note) order.verificationNote = info.note;
    await writeOrder(q, order);
    return order;
  });
}

// ---------------------------------------------------------------------------
// Sponsor codes (free registration for run + concert)
// ---------------------------------------------------------------------------
export interface SponsorCodeRow {
  code: string;
  sponsorName: string;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  note: string;
  createdAt: string;
}

const SPONSOR_CODE_RE = /^[A-Z0-9-]{4,32}$/;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

/** Upper-cases and strips spaces; returns '' when the text can't be a code. */
export function normalizeSponsorCode(input: unknown): string {
  const c = String(input ?? '').toUpperCase().replace(/\s+/g, '');
  return SPONSOR_CODE_RE.test(c) ? c : '';
}

export function generateSponsorCode(): string {
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `CSR-${out}`;
}

type RawSponsorRow = {
  code: string;
  sponsor_name: string;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  note: string;
  created_at: string | Date;
};
const toSponsorRow = (r: RawSponsorRow): SponsorCodeRow => ({
  code: r.code,
  sponsorName: r.sponsor_name,
  maxUses: r.max_uses === null || r.max_uses === undefined ? null : Number(r.max_uses),
  usedCount: Number(r.used_count),
  active: Boolean(r.active),
  note: r.note || '',
  createdAt: new Date(r.created_at).toISOString(),
});

/** Looks a code up without using it. Only returns a code that can still be redeemed. */
export async function peekSponsorCode(code: string): Promise<{ sponsorName: string } | undefined> {
  const rows = await dbQuery<RawSponsorRow>(
    'select * from csr.sponsor_codes where code = $1 and active and (max_uses is null or used_count < max_uses)',
    [code]
  );
  return rows[0] ? { sponsorName: rows[0].sponsor_name } : undefined;
}

/** Uses one redemption atomically (a single UPDATE, so two runners can't both take the last use). */
export async function redeemSponsorCode(code: string): Promise<{ sponsorName: string } | undefined> {
  const rows = await dbQuery<{ sponsor_name: string }>(
    `update csr.sponsor_codes set used_count = used_count + 1
     where code = $1 and active and (max_uses is null or used_count < max_uses)
     returning sponsor_name`,
    [code]
  );
  return rows[0] ? { sponsorName: rows[0].sponsor_name } : undefined;
}

/** Gives a redemption back (the order could not be created). */
export async function releaseSponsorCode(code: string): Promise<void> {
  await dbQuery('update csr.sponsor_codes set used_count = greatest(used_count - 1, 0) where code = $1', [code]);
}

export async function listSponsorCodes(): Promise<SponsorCodeRow[]> {
  const rows = await dbQuery<RawSponsorRow>('select * from csr.sponsor_codes order by created_at desc, code');
  return rows.map(toSponsorRow);
}

export async function createSponsorCode(input: {
  code: string;
  sponsorName: string;
  maxUses: number | null;
  note: string;
}): Promise<SponsorCodeRow | undefined> {
  const rows = await dbQuery<RawSponsorRow>(
    `insert into csr.sponsor_codes (code, sponsor_name, max_uses, note) values ($1, $2, $3, $4)
     on conflict (code) do nothing returning *`,
    [input.code, input.sponsorName, input.maxUses, input.note]
  );
  return rows[0] ? toSponsorRow(rows[0]) : undefined;
}

export async function updateSponsorCode(
  code: string,
  patch: { active?: boolean; maxUses?: number | null; sponsorName?: string; note?: string }
): Promise<SponsorCodeRow | undefined> {
  const rows = await dbQuery<RawSponsorRow>(
    `update csr.sponsor_codes set
       active = coalesce($2, active),
       max_uses = case when $3::boolean then $4 else max_uses end,
       sponsor_name = coalesce($5, sponsor_name),
       note = coalesce($6, note)
     where code = $1 returning *`,
    [
      code,
      patch.active ?? null,
      patch.maxUses !== undefined,
      patch.maxUses === undefined ? null : patch.maxUses,
      patch.sponsorName ?? null,
      patch.note ?? null,
    ]
  );
  return rows[0] ? toSponsorRow(rows[0]) : undefined;
}

/** Only a code nobody has used can be deleted (so the record of who used it is never lost). */
export async function deleteUnusedSponsorCode(code: string): Promise<boolean> {
  const rows = await dbQuery('delete from csr.sponsor_codes where code = $1 and used_count = 0 returning code', [code]);
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Rate limiting (shared across serverless instances)
// ---------------------------------------------------------------------------
/** Records a hit and returns true when `key` has exceeded `limit` hits within `windowMs`. */
export async function rateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const rows = await dbTx(async (q) => {
    await q('insert into csr.rate_hits (key) values ($1)', [key]);
    if (Math.random() < 0.02) await q("delete from csr.rate_hits where at < now() - interval '1 day'");
    return q<{ n: string }>(
      "select count(*)::text as n from csr.rate_hits where key = $1 and at > now() - ($2::int * interval '1 millisecond')",
      [key, windowMs]
    );
  });
  return Number(rows[0].n) > limit;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------
/** What the runner (owner of the order) is allowed to see. */
export function toRunnerView(o: StoredOrder) {
  const { accessTokenHash, slipFile, slipHash, aiReview, omisePastChargeIds, omiseQrImageUrl, shooting, activityWaiver, ...rest } = o;
  void omiseQrImageUrl;
  // National ID numbers go back to the browser masked (they are only needed by the organiser).
  const shootingView = shooting
    ? { ...shooting, shooters: shooting.shooters.map((s) => ({ fullName: s.fullName, idCard: maskThaiId(s.idCard) })) }
    : undefined;
  const waiverView = activityWaiver
    ? { ...activityWaiver, participants: activityWaiver.participants.map((p) => ({ ...p, idCard: maskThaiId(p.idCard), ...(p.passportNo ? { passportNo: maskPassport(p.passportNo) } : {}) })) }
    : undefined;
  return { ...rest, shooting: shootingView, activityWaiver: waiverView, hasSlip: Boolean(slipFile) };
}

/** Orders bought by one runner account, newest first (slip images left out). */
export async function listOrdersByRunner(runnerId: string): Promise<StoredOrder[]> {
  const rows = await dbQuery<{ data: unknown }>(
    `select case when data ? 'slipFile' then (data - 'slipFile') || '{"slipFile":"stored"}'::jsonb else data end as data
     from csr.orders where data->>'runnerId' = $1 order by created_at desc, order_id desc`,
    [runnerId]
  );
  return rows.map(rowToOrder);
}

/**
 * What ticket-checking staff see: who the ticket is for and what it includes, enough to hand over a kit.
 * No phone, e-mail, emergency contact, insurance / waiver details or prices.
 */
export function toStaffView(o: StoredOrder) {
  return {
    orderId: o.orderId,
    fullName: o.fullName,
    routeId: o.routeId,
    routeName: o.routeName,
    ticketType: o.ticketType,
    bibNumber: o.bibNumber,
    shirtSize: o.shirtSize,
    runningWithDog: o.runningWithDog,
    dogName: o.dogName,
    peopleCount: o.peopleCount,
    dogCount: o.dogCount,
    extraRunnerNames: o.extraRunnerNames,
    concertQty: o.concertQty,
    vipTables: o.vipTables,
    parkingPlates: o.parkingPlates,
    shooting: o.shooting ? { shooters: o.shooting.shooters.map((s) => ({ fullName: s.fullName })) } : undefined,
    addOns: o.addOns ? { label: o.addOns.label, people: o.addOns.people, persons: o.addOns.persons, towerCount: o.addOns.towerCount, gunCount: o.addOns.gunCount, windCount: o.addOns.windCount, total: 0, tower: o.addOns.tower, gun: o.addOns.gun, windTunnel: o.addOns.windTunnel } : undefined,
    paymentStatus: o.paymentStatus,
    verificationStatus: o.verificationStatus,
    kitStatus: o.kitStatus,
    kitCheckedInAt: o.kitCheckedInAt,
    kitCheckedInBy: o.kitCheckedInBy,
    registrationStatus: o.registrationStatus,
    cancelledAt: o.cancelledAt,
    cancelReason: o.cancelReason,
    createdAt: o.createdAt,
    expiresAt: o.expiresAt,
  };
}

/** What an authenticated admin sees (no token hash). */
export function toAdminView(o: StoredOrder, opts: { full?: boolean } = {}) {
  const { accessTokenHash, slipFile, ...rest } = o;
  if (opts.full) return { ...rest, hasSlip: Boolean(slipFile) };
  // Sensitive fields are masked by the server unless the admin explicitly asks for the full order
  // (GET /api/admin/orders/:id/full, or the full exports) — and every such request is written to the audit log.
  const hidden = '••• (กดแสดงข้อมูลเต็ม)';
  const insurance = o.insurance
    ? {
        ...o.insurance,
        idCard: o.insurance.idCard ? maskThaiId(o.insurance.idCard) : o.insurance.idCard,
        passportNo: o.insurance.passportNo ? maskPassport(o.insurance.passportNo) : o.insurance.passportNo,
        bloodType: o.insurance.bloodType ? hidden : o.insurance.bloodType,
        medicalConditions: o.insurance.medicalConditions ? hidden : o.insurance.medicalConditions,
      }
    : undefined;
  const shooting = o.shooting ? { ...o.shooting, shooters: o.shooting.shooters.map((x) => ({ ...x, idCard: maskThaiId(x.idCard) })) } : undefined;
  const activityWaiver = o.activityWaiver
    ? { ...o.activityWaiver, participants: o.activityWaiver.participants.map((x) => ({ ...x, idCard: maskThaiId(x.idCard), ...(x.passportNo ? { passportNo: maskPassport(x.passportNo) } : {}) })) }
    : undefined;
  return { ...rest, insurance, shooting, activityWaiver, masked: true, hasSlip: Boolean(slipFile) };
}

// ---------------------------------------------------------------------------
// Winners board (shown on the site; filled in by the admin after the race)
// ---------------------------------------------------------------------------
export interface Winner {
  id: string;
  /** e.g. "5 km ชาย อันดับ 1", "ประกวดแต่งตัว ชนะเลิศ" */
  title: string;
  name: string;
  /** small data: URL (resized in the browser) */
  photo?: string;
  note?: string;
}

export async function getWinners(): Promise<Winner[]> {
  const rows = await dbQuery<{ value: unknown }>("select value from csr.settings where key = 'winners'");
  const v = rows[0] ? asObj<{ list?: Winner[] }>(rows[0].value) : {};
  return Array.isArray(v.list) ? v.list : [];
}

export async function saveWinners(list: Winner[]): Promise<void> {
  await dbQuery(
    "insert into csr.settings (key, value) values ('winners', $1::jsonb) on conflict (key) do update set value = excluded.value",
    [JSON.stringify({ list })]
  );
}

/** Finds an order by order id (CSR27-...) or by BIB / concert-pass number (e.g. 05-0012). */
export async function findOrderByCode(code: string): Promise<StoredOrder | undefined> {
  const c = code.trim();
  if (!c) return undefined;
  const rows = await dbQuery<{ data: unknown }>(
    'select data from csr.orders where upper(order_id) = upper($1) or upper(bib_number) = upper($1) limit 1',
    [c]
  );
  return rows[0] ? rowToOrder(rows[0]) : undefined;
}

// ---------------------------------------------------------------------------
// Visitor counting (anonymous random id per browser; no personal data)
// ---------------------------------------------------------------------------
const BKK_DAY = "(now() at time zone 'Asia/Bangkok')::date";

export const isVisitorId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(v);

export async function recordVisit(vid: string): Promise<void> {
  await dbQuery(
    `insert into csr.visits (day, vid) values (${BKK_DAY}, $1)
     on conflict (day, vid) do update set views = csr.visits.views + 1`,
    [vid]
  );
}

export interface VisitStats {
  today: { visitors: number; views: number };
  total: { visitors: number; views: number };
  /** The last 14 days, oldest first, including days without visits */
  days: { day: string; visitors: number; views: number }[];
}

export async function visitStats(): Promise<VisitStats> {
  const [sum] = await dbQuery<Record<string, number>>(
    `select
       (select count(*) from csr.visits where day = ${BKK_DAY})::int as today_visitors,
       (select coalesce(sum(views), 0) from csr.visits where day = ${BKK_DAY})::int as today_views,
       (select count(distinct vid) from csr.visits)::int as total_visitors,
       (select coalesce(sum(views), 0) from csr.visits)::int as total_views`
  );
  const rows = await dbQuery<{ day: string; visitors: number; views: number }>(
    `select to_char(day, 'YYYY-MM-DD') as day, count(*)::int as visitors, sum(views)::int as views
     from csr.visits where day > ${BKK_DAY} - 14 group by day`
  );
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const end = new Date(`${today}T00:00:00Z`).getTime();
  const days: VisitStats['days'] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(end - i * 86_400_000).toISOString().slice(0, 10);
    const r = byDay.get(day);
    days.push({ day, visitors: Number(r?.visitors ?? 0), views: Number(r?.views ?? 0) });
  }
  return {
    today: { visitors: Number(sum.today_visitors), views: Number(sum.today_views) },
    total: { visitors: Number(sum.total_visitors), views: Number(sum.total_views) },
    days,
  };
}


// ---------------------------------------------------------------------------
// Organiser announcements shown in the Runner Center (settings key 'announcements')
// ---------------------------------------------------------------------------
export interface Announcement {
  id: string;
  title: string;
  body: string;
  level: 'info' | 'important';
  createdAt: string;
}

const MAX_ANNOUNCEMENTS = 20;

function cleanAnnouncements(raw: unknown): Announcement[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: Announcement[] = [];
  const seen = new Set<string>();
  for (const x of list.slice(0, MAX_ANNOUNCEMENTS)) {
    const r = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const title = typeof r.title === 'string' ? r.title.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 120) : '';
    const body = typeof r.body === 'string' ? r.body.replace(/[\u0000-\u0008\u000b-\u001f<>]/g, ' ').trim().slice(0, 600) : '';
    if (!title) continue;
    let id = typeof r.id === 'string' && /^[A-Za-z0-9_-]{4,40}$/.test(r.id) ? r.id : crypto.randomBytes(6).toString('hex');
    while (seen.has(id)) id = crypto.randomBytes(6).toString('hex');
    seen.add(id);
    const created = typeof r.createdAt === 'string' && !Number.isNaN(Date.parse(r.createdAt)) ? r.createdAt : new Date().toISOString();
    out.push({ id, title, body, level: r.level === 'important' ? 'important' : 'info', createdAt: created });
  }
  return out;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const rows = await dbQuery<{ value: unknown }>("select value from csr.settings where key = 'announcements'");
  if (!rows[0]) return [];
  return cleanAnnouncements(asObj<unknown>(rows[0].value));
}

export async function saveAnnouncements(raw: unknown): Promise<Announcement[]> {
  const list = cleanAnnouncements(raw);
  await dbQuery(
    `insert into csr.settings (key, value) values ('announcements', $1::jsonb)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(list)]
  );
  return list;
}
