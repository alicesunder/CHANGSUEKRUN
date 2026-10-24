/**
 * Server-side persistent store for CHANG SUEK RUN.
 *
 * Everything that decides money or tickets lives here, never in the browser:
 * orders, BIB counters, used transaction refs (anti-replay), PromptPay settings
 * and slip-verification API keys.
 *
 * Storage is a single JSON file written atomically (temp file + rename) after
 * every change. Slip images are stored as separate files under DATA_DIR/slips.
 *
 * IMPORTANT FOR DEPLOYMENT: DATA_DIR must be on persistent storage and the app
 * must run as a single instance. On Cloud Run the container filesystem is wiped
 * on every restart — mount a volume (e.g. Cloud Storage FUSE) and set DATA_DIR.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { RouteId } from '../src/types';

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
  /** when the runner accepted the privacy notice, and which version */
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

export interface SlipApiKeys {
  easySlipKey: string;
  thunderKey: string;
  slipOkKey: string;
  slipOkBranch: string;
  omiseSecretKey: string;
}

interface DbShape {
  version: 1;
  orderSeq: number;
  orders: StoredOrder[];
  bibCounters: Record<RouteId, number>;
  usedTransRefs: string[];
  usedSlipHashes: string[];
  settings: PublicSettings;
  slipApi: Partial<SlipApiKeys>;
}

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
export const SLIP_DIR = path.join(DATA_DIR, 'slips');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_SETTINGS: PublicSettings = {
  promptPayId: process.env.PROMPTPAY_ID || '004999254157786',
  accountName:
    process.env.PROMPTPAY_ACCOUNT_NAME ||
    'ช้างศึก รัน โดย นาย กัปปน์ณัฏฐ์ กชกรนันท์ธน และ นาย เอกพัชญ์ ตันสุวรรณรัตน์',
  bankLabel: process.env.BANK_LABEL || 'ธนาคารกสิกรไทย',
  bankAccountNo: process.env.BANK_ACCOUNT_NO || '2408677648',
  paymentTimeoutMinutes: 15,
};

function emptyDb(): DbShape {
  return {
    version: 1,
    orderSeq: 0,
    orders: [],
    bibCounters: { '10km': 0, '5km': 0, '3km': 0, '1km': 0 },
    usedTransRefs: [],
    usedSlipHashes: [],
    settings: { ...DEFAULT_SETTINGS },
    slipApi: {},
  };
}

function load(): DbShape {
  fs.mkdirSync(SLIP_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) return emptyDb();
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const parsed = JSON.parse(raw) as DbShape; // fail loudly on corruption rather than silently wiping data
  const base = emptyDb();
  return {
    ...base,
    ...parsed,
    bibCounters: { ...base.bibCounters, ...(parsed.bibCounters || {}) },
    settings: { ...base.settings, ...(parsed.settings || {}) },
  };
}

const db: DbShape = load();

// We no longer collect national ID / passport numbers. Remove any left from older versions.
if (db.orders.some((o) => 'idCardOrPassport' in (o as object))) {
  for (const o of db.orders) delete (o as { idCardOrPassport?: string }).idCardOrPassport;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 1), 'utf8');
}

function persist(): void {
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 1), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

/** All mutations go through here so every change is written to disk immediately. */
export function mutate<T>(fn: (d: DbShape) => T): T {
  const result = fn(db);
  persist();
  return result;
}

export function read(): Readonly<DbShape> {
  return db;
}

export function getOrder(orderId: string): StoredOrder | undefined {
  return db.orders.find((o) => o.orderId === orderId);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function tokenMatches(order: StoredOrder, token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(order.accessTokenHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const BIB_PREFIX: Record<RouteId, string> = { '10km': '10', '5km': '05', '3km': '03', '1km': '01' };

export function formatBib(routeId: RouteId, seq: number): string {
  return `${BIB_PREFIX[routeId] || '05'}-${String(seq).padStart(4, '0')}`;
}

export function nextBibPreview(routeId: RouteId): string {
  return formatBib(routeId, (db.bibCounters[routeId] || 0) + 1);
}

/**
 * Marks an order as paid and assigns its BIB. Idempotent: calling it twice on the
 * same order never consumes a second BIB number.
 */
export function markOrderPaid(
  orderId: string,
  info: {
    status: 'AUTO_VERIFIED' | 'ADMIN_APPROVED';
    verifiedBy: string;
    paymentRef: string;
    senderBank: string;
    note?: string;
  }
): StoredOrder | undefined {
  return mutate((d) => {
    const order = d.orders.find((o) => o.orderId === orderId);
    if (!order) return undefined;
    const now = new Date().toISOString();
    if (!order.bibNumber) {
      const seq = (d.bibCounters[order.routeId] || 0) + 1;
      d.bibCounters[order.routeId] = seq;
      order.bibNumber = formatBib(order.routeId, seq);
    }
    order.verificationStatus = info.status;
    order.paymentStatus = 'PAID';
    order.registrationStatus = 'CONFIRMED';
    order.verifiedAt = now;
    order.verifiedBy = info.verifiedBy;
    order.paidAt = order.paidAt || now;
    if (info.paymentRef) {
      order.paymentRef = info.paymentRef;
      const ref = info.paymentRef.toUpperCase();
      if (!d.usedTransRefs.includes(ref)) d.usedTransRefs.push(ref);
    }
    if (info.senderBank) order.senderBank = info.senderBank;
    if (info.note) order.verificationNote = info.note;
    return order;
  });
}

export function isTransRefUsed(ref: string): boolean {
  return Boolean(ref) && db.usedTransRefs.includes(ref.toUpperCase());
}

export function isSlipHashUsed(hash: string): boolean {
  return db.usedSlipHashes.includes(hash);
}

export function getEffectiveSlipApiKeys(): SlipApiKeys {
  const s = db.slipApi || {};
  const env = (k: string) => (process.env[k] || '').trim();
  return {
    easySlipKey: s.easySlipKey ?? env('EASYSLIP_API_KEY'),
    thunderKey: s.thunderKey ?? env('THUNDER_API_KEY'),
    slipOkKey: s.slipOkKey ?? env('SLIPOK_API_KEY'),
    slipOkBranch: s.slipOkBranch ?? env('SLIPOK_BRANCH_ID'),
    omiseSecretKey: s.omiseSecretKey ?? env('OMISE_SECRET_KEY'),
  };
}

export function hasBankSlipApi(): boolean {
  const k = getEffectiveSlipApiKeys();
  return Boolean(k.easySlipKey || k.thunderKey || (k.slipOkKey && k.slipOkBranch));
}

/** What the runner (owner of the order) is allowed to see. */
export function toRunnerView(o: StoredOrder) {
  const { accessTokenHash, slipFile, slipHash, aiReview, omisePastChargeIds, omiseQrImageUrl, ...rest } = o;
  void omiseQrImageUrl;
  return rest;
}

/** What an authenticated admin sees (no token hash; slip fetched separately). */
export function toAdminView(o: StoredOrder) {
  const { accessTokenHash, slipFile, ...rest } = o;
  return { ...rest, hasSlip: Boolean(slipFile) };
}
