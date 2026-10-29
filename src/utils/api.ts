/**
 * Browser-side API client. The server is the source of truth for prices,
 * payment status, BIB numbers and admin access.
 */
import type { AddOnSelection } from '../data/addOns';
import type { InsuranceInfo } from '../data/insurance';
import type { RouteId } from '../types';
import type { TicketOrder } from './runnerStorage';

export interface PublicConfig {
  promptPayId: string;
  accountName: string;
  bankLabel: string;
  bankAccountNo: string;
  paymentTimeoutMinutes: number;
  nextBib: Record<RouteId, string>;
  /** Wind-tunnel seats (limited) */
  windTunnelLimit?: number;
  windTunnelRemaining?: number;
  /** false until the organiser configures Omise — registration is closed until then */
  paymentReady: boolean;
}

export type ServerOrder = TicketOrder & {
  ticketType?: 'RUN' | 'CONCERT' | 'ADDON';
  concertQty?: number;
  expiresAt: string;
  omiseChargeId?: string;
  omiseQrImageUrl?: string;
  hasSlip?: boolean;
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

export async function getPublicConfig(force = false): Promise<PublicConfig> {
  if (cachedConfig && !force) return cachedConfig;
  cachedConfig = await request<PublicConfig>('/api/public-config');
  return cachedConfig;
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
  extraRunnerNames?: string;
  privacyConsent: boolean;
  /** RUN (default) = running ticket incl. concert; CONCERT = concert/entry pass only (no run, no BIB) */
  ticketType?: 'RUN' | 'CONCERT' | 'ADDON';
  concertQty?: number;
  /** Insurance details: required for 5 KM / 10 KM runners */
  insurance?: InsuranceInfo;
  insuranceConsent?: boolean;
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
  const res = await request<{ order: ServerOrder; accessToken: string; config: PublicConfig }>(
    '/api/orders',
    { method: 'POST', headers: jsonHeaders, body: JSON.stringify(input) }
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

export async function fetchOrder(ref: PendingOrderRef): Promise<ServerOrder> {
  const res = await request<{ order: ServerOrder }>(`/api/orders/${encodeURIComponent(ref.orderId)}`, {
    headers: { 'x-order-token': ref.accessToken },
  });
  return res.order;
}

/** Loads the Omise QR through our server and returns a same-origin object URL (savable on phones). */
export async function fetchQrObjectUrl(ref: PendingOrderRef): Promise<string> {
  const resp = await fetch(`/api/orders/${encodeURIComponent(ref.orderId)}/qr`, {
    headers: { 'x-order-token': ref.accessToken },
  });
  if (!resp.ok) throw new ApiError('โหลด QR ไม่สำเร็จ', resp.status);
  return URL.createObjectURL(await resp.blob());
}

export async function renewQr(ref: PendingOrderRef): Promise<ServerOrder> {
  const res = await request<{ order: ServerOrder }>(`/api/orders/${encodeURIComponent(ref.orderId)}/renew-qr`, {
    method: 'POST',
    headers: { 'x-order-token': ref.accessToken },
  });
  return res.order;
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

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await request<{ token: string; expiresAt: number; username: string }>('/api/admin/login', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ username, password }),
  });
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify({ token: res.token, expiresAt: res.expiresAt }));
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
  lookup: (q: string) => adminFetch<{ order: ServerOrder }>(`/api/admin/lookup?q=${encodeURIComponent(q)}`),
  getWinners: () => adminFetch<{ winners: Winner[] }>('/api/admin/winners'),
  saveWinners: (winners: Winner[]) =>
    adminFetch<{ winners: Winner[] }>('/api/admin/winners', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ winners }),
    }),
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
  toggleKit: (orderId: string) =>
    adminFetch<{ order: ServerOrder }>(`/api/admin/orders/${encodeURIComponent(orderId)}/kit`, { method: 'POST' }),
  deleteOrder: (orderId: string) =>
    adminFetch<{ ok: true }>(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' }),
  getSettings: () =>
    adminFetch<{ settings: AdminSettings; bibCounters: Record<RouteId, number> }>('/api/admin/settings'),
  saveSettings: (settings: AdminSettings, bibCounters: Record<RouteId, number>) =>
    adminFetch<{ settings: AdminSettings; bibCounters: Record<RouteId, number> }>('/api/admin/settings', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ settings, bibCounters }),
    }),
  gatewayStatus: () =>
    adminFetch<GatewayStatus>('/api/admin/payment-gateway'),
  setOmiseKey: (secretKey: string) =>
    adminFetch<GatewayStatus>('/api/admin/payment-gateway', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ secretKey }),
    }),
  clearOmiseKey: () =>
    adminFetch<GatewayStatus>('/api/admin/payment-gateway', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ clear: true }),
    }),
};

export interface GatewayStatus {
  hasOmiseKey: boolean;
  mode: 'live' | 'test' | null;
  webhookPath: string;
}
