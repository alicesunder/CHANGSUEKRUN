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
  routeName: string;
  shirtSize: string;
  runningWithDog: boolean;
  dogName?: string;
  dogBreed?: string;
  extraPeople: number;
  extraDogs: number;
  extraRunnerNames?: string;
  peopleCount: number;
  dogCount: number;
  totalPrice: number;
  bibNumber: string;
  paymentMethod: 'PROMPTPAY_QR' | 'SPONSOR_CODE';
  /** Set when the registration was made free with a sponsor code */
  sponsorCode?: string;
  sponsorName?: string;
  /** Optional after-run activities bought with the ticket */
  addOns?: { tower: boolean; gun: 'none' | 'standard' | 'premium'; windTunnel: boolean; people: number; pricePerPerson: number; total: number; discount?: number; label: string };
  paymentStatus: 'PAID' | 'PENDING';
  paymentRef: string;
  senderBank: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNote?: string;
  slipFile?: string;
  slipHash?: string;
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
  paidAt?: string;
}

export interface PublicSettings {
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
  promptPayId: process.env.PROMPTPAY_ID || '004999254157786',
  accountName:
    process.env.PROMPTPAY_ACCOUNT_NAME ||
    'ช้างศึก รัน โดย นาย กัปปน์ณัฏฐ์ กชกรนันท์ธน และ นาย เอกพัชญ์ ตันสุวรรณรัตน์',
  bankLabel: process.env.BANK_LABEL || 'ธนาคารกสิกรไทย',
  bankAccountNo: process.env.BANK_ACCOUNT_NO || '2408677648',
  paymentTimeoutMinutes: 15,
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
const WIND_TUNNEL_USED_SQL = `select coalesce(sum((data->'addOns'->>'people')::int), 0)::text as n from csr.orders
  where data->'addOns'->>'windTunnel' = 'true'
    and (payment_status = 'PAID' or (data->>'expiresAt')::timestamptz > now())`;

export async function windTunnelSeatsUsed(): Promise<number> {
  const rows = await dbQuery<{ n: string }>(WIND_TUNNEL_USED_SQL);
  return Number(rows[0]?.n ?? 0);
}

/** Inserts the order; if it takes wind-tunnel seats, checks the limit under a lock so two buyers can't both take the last seat. */
export async function insertOrderChecked(
  o: StoredOrder,
  windTunnelLimit: number
): Promise<{ ok: true } | { ok: false; remaining: number }> {
  return dbTx(async (q) => {
    if (o.addOns?.windTunnel) {
      await q('select pg_advisory_xact_lock(727001)');
      const rows = await q<{ n: string }>(WIND_TUNNEL_USED_SQL);
      const used = Number(rows[0]?.n ?? 0);
      if (used + o.addOns.people > windTunnelLimit) return { ok: false as const, remaining: Math.max(0, windTunnelLimit - used) };
    }
    await q(INSERT_ORDER_SQL, orderParams(o));
    return { ok: true as const };
  });
}

export async function getOrder(orderId: string): Promise<StoredOrder | undefined> {
  const rows = await dbQuery<{ data: unknown }>('select data from csr.orders where order_id = $1', [orderId]);
  return rows[0] ? rowToOrder(rows[0]) : undefined;
}

export async function listOrders(): Promise<StoredOrder[]> {
  const rows = await dbQuery<{ data: unknown }>('select data from csr.orders order by created_at desc, order_id desc');
  return rows.map(rowToOrder);
}

export async function deleteOrder(orderId: string): Promise<void> {
  await dbQuery('delete from csr.orders where order_id = $1', [orderId]);
}

/** Read-modify-write under a row lock, so two requests can't overwrite each other. */
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

/**
 * Marks an order paid and assigns its BIB, atomically. Idempotent: an order that is already
 * paid is returned unchanged, so a repeated webhook never consumes a second BIB number.
 */
export async function markOrderPaid(
  orderId: string,
  info: { status: 'AUTO_VERIFIED' | 'ADMIN_APPROVED'; verifiedBy: string; paymentRef: string; senderBank: string; note?: string }
): Promise<StoredOrder | undefined> {
  return dbTx(async (q) => {
    const rows = await q<{ data: unknown }>('select data from csr.orders where order_id = $1 for update', [orderId]);
    if (!rows[0]) return undefined;
    const order = rowToOrder(rows[0]);
    if (order.paymentStatus === 'PAID' && order.bibNumber) return order;

    const now = new Date().toISOString();
    if (!order.bibNumber) {
      const c = await q<{ last_seq: number }>(
        `insert into csr.bib_counters (route_id, last_seq) values ($1, 1)
         on conflict (route_id) do update set last_seq = csr.bib_counters.last_seq + 1
         returning last_seq`,
        [order.routeId]
      );
      order.bibNumber = formatBib(order.routeId, Number(c[0].last_seq));
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
  const { accessTokenHash, slipFile, slipHash, aiReview, omisePastChargeIds, omiseQrImageUrl, ...rest } = o;
  void omiseQrImageUrl;
  return rest;
}

/** What an authenticated admin sees (no token hash). */
export function toAdminView(o: StoredOrder) {
  const { accessTokenHash, slipFile, ...rest } = o;
  return { ...rest, hasSlip: Boolean(slipFile) };
}

// ---------------------------------------------------------------------------
// Winners board (shown on the site; filled in by the admin after the race)
// ---------------------------------------------------------------------------
export interface Winner {
  id: string;
  /** e.g. "5 KM ชาย อันดับ 1", "ประกวดแต่งตัว ชนะเลิศ" */
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
