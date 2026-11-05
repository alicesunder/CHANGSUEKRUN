/**
 * Runner / staff login in the browser (server side: server/runners.ts).
 * A runner's token is kept on this device (localStorage); a staff token only for this browser session.
 * The token goes to the API in the `x-runner-token` header (the admin keeps the Authorization header).
 */
import { useSyncExternalStore } from 'react';
import type { ServerOrder } from './api';

export interface RunnerProfileData {
  firstName?: string;
  lastName?: string;
  shirtSize?: string;
  gender?: string;
  birthDate?: string;
  bloodType?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  relationship?: string;
}

export interface RunnerUser {
  id: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  lineLinked?: boolean;
  /** social sign-ins linked to this account: 'line' | 'google' | 'facebook' */
  social?: string[];
  profile?: RunnerProfileData;
}

export interface Session {
  token: string;
  role: 'runner' | 'staff';
  user: RunnerUser;
  expiresAt: number;
}

const KEY = 'csr_session_v1';
const EVENT = 'csr-session-changed';

let cached: Session | null | undefined;

function read(): Session | null {
  for (const store of [() => localStorage, () => sessionStorage]) {
    try {
      const raw = store().getItem(KEY);
      if (!raw) continue;
      const s = JSON.parse(raw) as Session;
      if (s?.token && Date.now() < s.expiresAt) return s;
    } catch {
      /* storage blocked or bad json */
    }
  }
  return null;
}

export function getSession(): Session | null {
  if (cached === undefined) cached = read();
  return cached;
}

export const getRunnerToken = (): string | null => getSession()?.token ?? null;

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

export function saveSession(s: Session): void {
  cached = s;
  try {
    // staff stay logged in only until the tab closes (shared phones at the check-in desk)
    (s.role === 'staff' ? sessionStorage : localStorage).setItem(KEY, JSON.stringify(s));
    (s.role === 'staff' ? localStorage : sessionStorage).removeItem(KEY);
  } catch {
    /* the page still works for this visit */
  }
  emit();
}

export function clearSession(): void {
  cached = null;
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
};

/** The logged-in session (or null), re-rendering when it changes. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

export class AuthError extends Error {
  status: number;
  needLogin: boolean;
  constructor(message: string, status: number, needLogin = false) {
    super(message);
    this.status = status;
    this.needLogin = needLogin;
  }
}

async function call<T>(url: string, init: RequestInit = {}, token: string | null = getRunnerToken()): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}), ...(token ? { 'x-runner-token': token } : {}) },
    });
  } catch {
    throw new AuthError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่', 0);
  }
  const data: any = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    // a token the server no longer accepts: forget it so the page asks to log in again
    if (resp.status === 401 && token && data?.needLogin) clearSession();
    throw new AuthError(data?.error || `เกิดข้อผิดพลาด (${resp.status})`, resp.status, Boolean(data?.needLogin));
  }
  return data as T;
}

type LoginResult = { token: string; expiresAt: number; role: 'runner' | 'staff'; user: RunnerUser };

const toSession = (r: LoginResult): Session => ({ token: r.token, expiresAt: r.expiresAt, role: r.role, user: r.user });

export const authApi = {
  async register(input: { name: string; email?: string; username?: string; password: string; phone?: string }): Promise<Session> {
    const s = toSession(await call<LoginResult>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }, null));
    saveSession(s);
    return s;
  },
  /** Runners (e-mail or username) and ticket-checking staff share this form. */
  async login(identifier: string, password: string): Promise<Session> {
    const s = toSession(await call<LoginResult>('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }, null));
    saveSession(s);
    return s;
  },
  /** Refreshes the account details from the server (and drops the session if the server does not know it). */
  async refresh(): Promise<Session | null> {
    const cur = getSession();
    if (!cur) return null;
    try {
      const r = await call<{ role: 'runner' | 'staff'; user: RunnerUser }>('/api/auth/me');
      const next = { ...cur, role: r.role, user: r.user };
      saveSession(next);
      return next;
    } catch (err) {
      if (err instanceof AuthError && err.status === 401) clearSession();
      return null;
    }
  },
  async saveProfile(patch: { name?: string; phone?: string; email?: string; profile?: RunnerProfileData }): Promise<RunnerUser> {
    const r = await call<{ user: RunnerUser }>('/api/me', { method: 'PATCH', body: JSON.stringify(patch) });
    const cur = getSession();
    if (cur) saveSession({ ...cur, user: r.user });
    return r.user;
  },
  async myOrders(): Promise<(ServerOrder & { docsUrl?: string })[]> {
    return (await call<{ orders: (ServerOrder & { docsUrl?: string })[] }>('/api/me/orders')).orders;
  },
  async claim(orderId: string, email: string): Promise<ServerOrder> {
    return (await call<{ order: ServerOrder }>('/api/me/claim', { method: 'POST', body: JSON.stringify({ orderId, email }) })).order;
  },
};

/** Ticket scanner calls for staff (reduced view, no contact details). */
export const staffApi = {
  lookup: (q: string) => call<{ order: ServerOrder }>(`/api/admin/lookup?q=${encodeURIComponent(q)}`),
  toggleKit: (orderId: string) => call<{ order: ServerOrder }>(`/api/admin/orders/${encodeURIComponent(orderId)}/kit`, { method: 'POST' }),
};

/**
 * Back from a social sign-in (LINE / Google / Facebook) the server sends us to /#runner-auth=<token> (or /#login-error=...).
 * Call once at start-up: it signs the runner in and tidies the address bar. Returns an error code for the page to show.
 */
export async function consumeLineLogin(): Promise<'ok' | 'error' | null> {
  const m = /^#(runner-auth|login-error|line-error)=(.*)$/.exec(window.location.hash);
  if (!m) return null;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  if (m[1] !== 'runner-auth') return 'error';
  try {
    const r = await call<{ role: 'runner' | 'staff'; user: RunnerUser }>('/api/auth/me', {}, m[2]);
    saveSession({ token: m[2], role: r.role, user: r.user, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
    return 'ok';
  } catch {
    return 'error';
  }
}
