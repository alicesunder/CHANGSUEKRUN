/**
 * Browser-side API client. The server is the source of truth for prices,
 * payment status, BIB numbers and admin access.
 */
import type { AddOnSelection } from '../data/addOns';
import type { InsuranceInfo } from '../data/insurance';
import type { Shooter, ShootingInfo } from '../data/shooting';
import type { ActivityWaiverInfo, WaiverActivity, WaiverParticipant } from '../data/activityWaivers';
import type { ExtraRunner } from '../data/shirts';
import type { DogProfile } from '../data/dogProfile';
import { isTestModeOn, setTestMode } from './testMode';
import type { ParkingPlate } from '../data/vipParking';
import type { RouteId } from '../types';
import type { TicketOrder } from './runnerStorage';
import { getRunnerToken } from './runnerAuth';

export interface PublicConfig {
  promptPayId: string;
  /** the bank's own QR text; the amount is added in the browser */
  qrPayload?: string;
  accountName: string;
  bankLabel: string;
  bankAccountNo: string;
  paymentTimeoutMinutes: number;
  nextBib: Record<RouteId, string>;
  /** Wind-tunnel seats (limited) */
  windTunnelLimit?: number;
  windTunnelRemaining?: number;
  /** false until the organiser configures EasySlip — registration is closed until then */
  paymentReady: boolean;
  /** true when paid orders get their ticket by e-mail */
  emailReady?: boolean;
  /** the admin's open / close switch for ticket sales (missing = open) */
  salesOpen?: boolean;
  /** the admin's early-bird switch (lower run / concert / VIP prices) */
  earlyBird?: boolean;
  /** LINE Login is set up on the server */
  lineLoginReady?: boolean;
  /** which social sign-in buttons work */
  socialLogin?: { line: boolean; google: boolean };
}

export interface VisitStats {
  today: { visitors: number; views: number };
  total: { visitors: number; views: number };
  days: { day: string; visitors: number; views: number }[];
}

export type ServerOrder = TicketOrder & {
  /** printable A4 documents (BIB, ticket, parking, insurance, waivers) once paid */
  documentsUrl?: string;
  ticketType?: 'RUN' | 'CONCERT' | 'ADDON';
  dogProfile?: DogProfile;
  concertQty?: number;
  vipTables?: number;
  parkingPlates?: ParkingPlate[];
  /** shooters come back with masked ID numbers */
  shooting?: ShootingInfo;
  /** tower / wind tunnel waivers (ID numbers masked in the runner's view) */
  activityWaiver?: ActivityWaiverInfo;
  extraRunners?: ExtraRunner[];
  /** 1-baht test order from admin test mode */
  isTest?: boolean;
  testBy?: string;
  /** the server hid sensitive fields (ID number, health data); the full order comes from /orders/:id/full */
  masked?: boolean;
  kitCheckedInAt?: string;
  kitCheckedInBy?: string;
  /** last ticket e-mail result */
  emailStatus?: { at: string; ok: boolean; error?: string };
  /** refund recorded by an admin */
  refundedAt?: string;
  refundAmount?: number;
  refundNote?: string;
  refundBy?: string;
  /** cancelled by an admin (orders are never deleted) */
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  expiresAt: string;
  /** the runner already asked for extra payment time */
  extendedAt?: string;
  omiseChargeId?: string;
  omiseQrImageUrl?: string;
  hasSlip?: boolean;
  slipCheckedAt?: string;
  slipRef?: string;
  slipNote?: string;
  slipAttempts?: number;
  aiReview?: string;
  verificationNote?: string;
  paidAt?: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(url, init);
  } catch {
    throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่', 0);
  }
  const data: any = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new ApiError(data?.error || `เกิดข้อผิดพลาด (${resp.status})`, resp.status);
  return data as T;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

// ---------------------------------------------------------------------------
// Public / runner
// ---------------------------------------------------------------------------
let cachedConfig: PublicConfig | null = null;
let pendingConfig: Promise<PublicConfig> | null = null;

export async function getPublicConfig(force = false): Promise<PublicConfig> {
  if (cachedConfig && !force) return cachedConfig;
  // components that ask at the same time share one request
  if (!pendingConfig || force) {
    pendingConfig = request<PublicConfig>('/api/public-config')
      .then((c) => (cachedConfig = c))
      .finally(() => {
        pendingConfig = null;
      });
  }
  return pendingConfig;
}

export interface CreateOrderInput {
  routeId: RouteId;
  extraPeople: number;
  extraDogs: number;
  fullName: string;
  phone: string;
  email: string;
  emergencyPhone: string;
  shirtSize: string;
  dogName?: string;
  dogBreed?: string;
  dogProfile?: DogProfile;
  extraRunnerNames?: string;
  privacyConsent: boolean;
  /** RUN (default) = running ticket incl. concert; CONCERT = concert/entry pass only (no run, no BIB) */
  ticketType?: 'RUN' | 'CONCERT' | 'ADDON';
  concertQty?: number;
  /** VIP concert tables (6 seats each) */
  vipTables?: number;
  /** Insurance details: required for 5 km / 10 km runners */
  insurance?: InsuranceInfo;
  insuranceConsent?: boolean;
  /** VIP tables: cars for the parking passes (2 per table) */
  parkingPlates?: ParkingPlate[];
  /** Shooting: one entry per person on the add-on */
  shooters?: Shooter[];
  /** the buyer read the shooting range's safety rules and accepted them */
  shootingAck?: boolean;
  /** Tower / wind tunnel: participants for the legal waivers, and which documents the buyer accepted */
  activityWaiver?: { participants: WaiverParticipant[]; accepted: Partial<Record<WaiverActivity, boolean>> };
  /** Dog Run extra runners: name + jersey size each */
  extraRunners?: ExtraRunner[];
  /** Sponsor code: makes the registration free (run + concert). The server re-checks it. */
  sponsorCode?: string;
  /** Optional after-run activities; the server works out the price and seat limits itself. */
  addOns?: AddOnSelection;
}

const PENDING_KEY = 'changsuek_pending_order_v2';

export interface PendingOrderRef {
  orderId: string;
  accessToken: string;
}

export function savePendingOrderRef(ref: PendingOrderRef | null): void {
  try {
    if (ref) localStorage.setItem(PENDING_KEY, JSON.stringify(ref));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // storage unavailable — the runner just won't be able to resume after closing the tab
  }
}

export function loadPendingOrderRef(): PendingOrderRef | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.orderId && parsed?.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

export async function createOrder(
  input: CreateOrderInput
): Promise<{ order: ServerOrder; accessToken: string; config: PublicConfig }> {
  // Admin test mode (1 baht): send the admin token so the server can check it is really an admin.
  const test = isTestModeOn();
  const adminToken = test ? getAdminToken() : null;
  const res = await request<{ order: ServerOrder; accessToken: string; config: PublicConfig }>(
    '/api/orders',
    {
      method: 'POST',
      headers: {
        ...jsonHeaders,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        // buying needs a logged-in runner; the server ties the order to this account
        ...(getRunnerToken() ? { 'x-runner-token': getRunnerToken() as string } : {}),
      },
      body: JSON.stringify(test ? { ...input, testMode: true } : input),
    }
  );
  cachedConfig = res.config;
  return res;
}

/** Asks the server whether a sponsor code can still be used (does not use it up). */
export async function checkSponsorCode(code: string): Promise<{ valid: true; sponsorName: string }> {
  return request<{ valid: true; sponsorName: string }>('/api/sponsor-code/check', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ code }),
  });
}

/** Asks the server to e-mail the ticket again (to the address on the order); needs the phone used to register. */
export async function resendTicketEmail(orderId: string, phone: string): Promise<{ ok: true; to: string }> {
  return request<{ ok: true; to: string }>(`/api/orders/${encodeURIComponent(orderId)}/resend-ticket`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ phone }),
  });
}

export async function fetchOrder(ref: PendingOrderRef): Promise<ServerOrder> {
  const res = await request<{ order: ServerOrder }>(`/api/orders/${encodeURIComponent(ref.orderId)}`, {
    headers: { 'x-order-token': ref.accessToken },
  });
  return res.order;
}

/** Asks for 15 more minutes to pay (once per order). */
export async function extendPaymentTime(ref: PendingOrderRef): Promise<ServerOrder> {
  const res = await request<{ order: ServerOrder }>(`/api/orders/${encodeURIComponent(ref.orderId)}/extend`, {
    method: 'POST',
    headers: { ...jsonHeaders, 'x-order-token': ref.accessToken },
    body: '{}',
  });
  return res.order;
}

/** Sends the transfer slip; the server checks it with EasySlip. A slip that fails comes back as an ApiError with the reason. */
export async function uploadSlip(
  ref: PendingOrderRef,
  image: string
): Promise<{ order: ServerOrder; review?: boolean; message?: string }> {
  return request<{ order: ServerOrder; review?: boolean; message?: string }>(
    `/api/orders/${encodeURIComponent(ref.orderId)}/slip`,
    { method: 'POST', headers: { ...jsonHeaders, 'x-order-token': ref.accessToken }, body: JSON.stringify({ image }) }
  );
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
const ADMIN_TOKEN_KEY = 'changsuek_admin_token_v2';

export function getAdminToken(): string | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw);
    if (!token || Date.now() > expiresAt) return null;
    return token;
  } catch {
    return null;
  }
}

export type AdminRole = 'owner' | 'manager' | 'viewer';

/** Role of the signed-in admin (the server decides what each role may do; this only hides buttons). */
export function getAdminRole(): AdminRole {
  try {
    const raw = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    const r = raw ? JSON.parse(raw).role : '';
    return r === 'manager' || r === 'viewer' ? r : 'owner';
  } catch {
    return 'owner';
  }
}

export function clearAdminToken(): void {
  setTestMode(false); // logging out always ends test mode
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await request<{ token: string; expiresAt: number; username: string; role?: AdminRole }>('/api/admin/login', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ username, password }),
  });
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify({ token: res.token, expiresAt: res.expiresAt, role: res.role || 'owner' }));
  } catch {
    // ignore
  }
  return res.username;
}

export function adminFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  return request<T>(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token || ''}` },
  }).catch((err) => {
    if (err instanceof ApiError && err.status === 401) {
      clearAdminToken();
      window.dispatchEvent(new Event('changsuek_admin_logged_out'));
    }
    throw err;
  });
}

export interface AdminSettings {
  promptPayId: string;
  qrPayload?: string;
  accountName: string;
  bankLabel: string;
  bankAccountNo: string;
  paymentTimeoutMinutes: number;
}

export interface SponsorCodeRow {
  code: string;
  sponsorName: string;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  note: string;
  createdAt: string;
}

export interface EarlyBirdState {
  on: boolean;
  manual: boolean;
  autoFrom?: string;
  autoUntil?: string;
  byTimer: boolean;
  updatedAt?: string;
}

export interface AdminAccountRow {
  username: string;
  displayName: string;
  role: 'manager' | 'viewer';
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuditRow {
  id: number;
  at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  detail: { body?: Record<string, unknown>; deleted?: Record<string, unknown>; [k: string]: unknown };
  ip: string;
}

export interface AdminRunnerSummary {
  id: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  emailVerified: boolean;
  disabled?: boolean;
  methods: string[];
  createdAt: string;
  orders: number;
  paidOrders: number;
  paidTotal: number;
  lastOrderAt: string | null;
}

export interface Winner {
  id: string;
  title: string;
  name: string;
  photo?: string;
  note?: string;
}

export async function getWinners(): Promise<Winner[]> {
  const res = await request<{ winners: Winner[] }>('/api/winners');
  return res.winners;
}

export const adminApi = {
  visits: () => adminFetch<VisitStats>('/api/admin/visits'),
  getSales: () => adminFetch<{ open: boolean; updatedAt?: string }>('/api/admin/sales'),
  setSales: (open: boolean) =>
    adminFetch<{ open: boolean; updatedAt?: string }>('/api/admin/sales', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ open }) }),
  getEarlyBird: () => adminFetch<EarlyBirdState>('/api/admin/early-bird'),
  setEarlyBirdSchedule: (autoFrom: string | null, autoUntil: string | null) =>
    adminFetch<EarlyBirdState>('/api/admin/early-bird', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ autoFrom, autoUntil }) }),
  setEarlyBird: (on: boolean) =>
    adminFetch<EarlyBirdState>('/api/admin/early-bird', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ on }) }),
  lookup: (q: string) => adminFetch<{ order: ServerOrder }>(`/api/admin/lookup?q=${encodeURIComponent(q)}`),
  getWinners: () => adminFetch<{ winners: Winner[] }>('/api/admin/winners'),
  saveWinners: (winners: Winner[]) =>
    adminFetch<{ winners: Winner[] }>('/api/admin/winners', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ winners }),
    }),
  listRunners: () =>
    adminFetch<{ runners: AdminRunnerSummary[]; totals: { accounts: number; withOrders: number; password: number; google: number; line: number } }>('/api/admin/runners'),
  getRunner: (id: string) =>
    adminFetch<{ runner: { id: string; name: string; email: string; username: string; phone: string; emailVerified: boolean; social: string[]; hasPassword: boolean; disabled?: boolean; createdAt: string }; orders: ServerOrder[] }>(
      `/api/admin/runners/${encodeURIComponent(id)}`
    ),
  listSponsorCodes: () => adminFetch<{ codes: SponsorCodeRow[] }>('/api/admin/sponsor-codes'),
  createSponsorCode: (input: { sponsorName: string; maxUses: number | null; code?: string; note?: string }) =>
    adminFetch<{ code: SponsorCodeRow }>('/api/admin/sponsor-codes', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(input),
    }),
  updateSponsorCode: (code: string, patch: { active?: boolean; maxUses?: number | null }) =>
    adminFetch<{ code: SponsorCodeRow }>(`/api/admin/sponsor-codes/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify(patch),
    }),
  deleteSponsorCode: (code: string) =>
    adminFetch<{ ok: true }>(`/api/admin/sponsor-codes/${encodeURIComponent(code)}`, { method: 'DELETE' }),
  listOrders: () =>
    adminFetch<{ orders: ServerOrder[]; bibCounters: Record<RouteId, number>; nextBib: Record<RouteId, string> }>(
      '/api/admin/orders'
    ),
  setVerification: (orderId: string, status: 'ADMIN_APPROVED' | 'REJECTED' | 'PENDING_REVIEW') =>
    adminFetch<{ order: ServerOrder }>(`/api/admin/orders/${encodeURIComponent(orderId)}/verification`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ status }),
    }),
  /** action 'checkin' (default) only ever checks a ticket in; 'undo' (admins) takes the kit hand-over back */
  toggleKit: (orderId: string, action: 'checkin' | 'undo' = 'checkin') =>
    adminFetch<{ order: ServerOrder; alreadyCheckedIn?: boolean }>(`/api/admin/orders/${encodeURIComponent(orderId)}/kit`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ action }),
    }),
  /** permanent delete (owner only). `confirm` must be the order id, typed by the admin */
  deleteOrder: (orderId: string, confirm: string) =>
    adminFetch<{ ok: true; orderId: string }>(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE', headers: jsonHeaders, body: JSON.stringify({ confirm }) }),
  /** the order with ID number / health data unmasked (written to the audit log) */
  getFullOrder: (orderId: string) => adminFetch<{ order: ServerOrder }>(`/api/admin/orders/${encodeURIComponent(orderId)}/full`),
  /** every order unmasked, for the full CSV and the insurance CSV (written to the audit log) */
  exportOrders: (kind: string) => adminFetch<{ orders: ServerOrder[] }>(`/api/admin/export/orders?kind=${encodeURIComponent(kind)}`),
  refundOrder: (orderId: string, input: { amount: number; note: string } | { clear: true }) =>
    adminFetch<{ order: ServerOrder }>(`/api/admin/orders/${encodeURIComponent(orderId)}/refund`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(input),
    }),
  me: () => adminFetch<{ username: string; role: AdminRole }>('/api/admin/me'),
  changeMyPassword: (current: string, password: string) =>
    adminFetch<{ ok: true; message: string }>('/api/admin/me/password', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ current, password }) }),
  listAdmins: () => adminFetch<{ admins: AdminAccountRow[] }>('/api/admin/admins'),
  createAdmin: (input: { username: string; displayName: string; role: 'manager' | 'viewer'; password: string }) =>
    adminFetch<{ admins: AdminAccountRow[] }>('/api/admin/admins', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(input) }),
  updateAdmin: (username: string, patch: { role?: 'manager' | 'viewer'; active?: boolean; password?: string; displayName?: string; signOut?: boolean }) =>
    adminFetch<{ admins: AdminAccountRow[] }>(`/api/admin/admins/${encodeURIComponent(username)}`, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(patch) }),
  signOutAll: () => adminFetch<{ ok: true }>('/api/admin/admins/sign-out-all', { method: 'POST' }),
  listAudit: (q: { before?: number; action?: string; actor?: string; limit?: number } = {}) => {
    const p = new URLSearchParams();
    if (q.before) p.set('before', String(q.before));
    if (q.action) p.set('action', q.action);
    if (q.actor) p.set('actor', q.actor);
    p.set('limit', String(q.limit || 100));
    return adminFetch<{ rows: AuditRow[] }>(`/api/admin/audit?${p.toString()}`);
  },
  getLimits: () => adminFetch<{ limits: { tower: number; gun: number }; seatsLeft: { tower: number | null; gun: number | null } }>('/api/admin/limits'),
  setLimits: (limits: { tower: number; gun: number }) =>
    adminFetch<{ limits: { tower: number; gun: number }; seatsLeft: { tower: number | null; gun: number | null } }>('/api/admin/limits', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(limits),
    }),
  setRunnerDisabled: (runnerId: string, disabled: boolean) =>
    adminFetch<{ ok: true; disabled: boolean }>(`/api/admin/runners/${encodeURIComponent(runnerId)}/disable`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ disabled }) }),
  sendRunnerResetEmail: (runnerId: string) =>
    adminFetch<{ ok: true; to: string }>(`/api/admin/runners/${encodeURIComponent(runnerId)}/reset-email`, { method: 'POST' }),
  cancelOrder: (orderId: string, reason: string) =>
    adminFetch<{ order: ServerOrder }>(`/api/admin/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ reason }),
    }),
  restoreOrder: (orderId: string) =>
    adminFetch<{ order: ServerOrder }>(`/api/admin/orders/${encodeURIComponent(orderId)}/restore`, { method: 'POST' }),
  getSettings: () =>
    adminFetch<{ settings: AdminSettings; bibCounters: Record<RouteId, number> }>('/api/admin/settings'),
  saveSettings: (settings: AdminSettings, bibCounters: Record<RouteId, number>) =>
    adminFetch<{ settings: AdminSettings; bibCounters: Record<RouteId, number> }>('/api/admin/settings', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ settings, bibCounters }),
    }),
  resendTicketEmail: (orderId: string) =>
    adminFetch<{ ok: true; to: string }>(`/api/admin/orders/${encodeURIComponent(orderId)}/email`, { method: 'POST' }),
  getSlip: (orderId: string) =>
    adminFetch<{ image: string }>(`/api/admin/orders/${encodeURIComponent(orderId)}/slip`),
  gatewayStatus: () =>
    adminFetch<GatewayStatus>('/api/admin/payment-gateway'),
  setEasySlipKey: (apiKey: string) =>
    adminFetch<GatewayStatus>('/api/admin/payment-gateway', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ apiKey }),
    }),
  clearEasySlipKey: () =>
    adminFetch<GatewayStatus>('/api/admin/payment-gateway', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ clear: true }),
    }),
};

export interface GatewayStatus {
  hasEasySlipKey: boolean;
}
