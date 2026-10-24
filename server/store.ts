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
  routeId: RouteId;
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
  paymentMethod: 'PROMPTPAY_QR';
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

export async function insertOrder(o: StoredOrder): Promise<void> {
  await dbQuery(
    `insert into csr.orders (order_id, token_hash, route_id, payment_status, verification_status, bib_number, omise_charge_id, created_at, data)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
    [o.orderId, o.accessTokenHash, o.routeId, o.paymentStatus, o.verificationStatus, o.bibNumber || '', o.omiseChargeId || null, o.createdAt, JSON.stringify(o)]
  );
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

const BIB_PREFIX: Record<RouteId, string> = { '10km': '10', '5km': '05', '3km': '03', '1km': '01' };
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
