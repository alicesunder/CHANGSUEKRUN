/**
 * Runner accounts + staff logins (separate from the single admin login in auth.ts).
 *
 *  - A runner signs up with an e-mail, a username of their own, or LINE, and must be logged in to buy.
 *  - Staff (ticket checking) log in with an account listed in STAFF_ACCOUNTS (below / env). A staff token can
 *    only use the two scanner endpoints; it is never accepted as an admin login.
 *  - Tokens are signed with their own key (not the admin one) and carry a role, so a runner or staff token can
 *    never pass requireAdmin, and an admin token can never pass as a runner.
 *
 * Passwords are stored only as scrypt hashes. The tables are created on first use (additive, existing data is untouched).
 */
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { dbQuery } from './db';

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
const SECRET_SOURCE =
  process.env.RUNNER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || crypto.randomBytes(24).toString('hex');
const KEY = crypto.createHash('sha256').update(`csr-runner-session|${SECRET_SOURCE}`).digest();

export type SessionRole = 'runner' | 'staff';
export interface RunnerSession {
  role: SessionRole;
  /** runner id, or the staff username */
  sub: string;
}

const RUNNER_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const STAFF_TTL_MS = 12 * 60 * 60 * 1000;

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const hmac = (s: string) => crypto.createHmac('sha256', KEY).update(s).digest('base64url');

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function issueSession(role: SessionRole, sub: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + (role === 'staff' ? STAFF_TTL_MS : RUNNER_TTL_MS);
  const payload = b64(JSON.stringify({ k: role, s: sub, exp: expiresAt }));
  return { token: `r1.${payload}.${hmac(`r1.${payload}`)}`, expiresAt };
}

export function verifySession(token: string | undefined): RunnerSession | null {
  if (!token) return null;
  const [v, payload, sig] = token.split('.');
  if (v !== 'r1' || !payload || !sig || !safeEqual(sig, hmac(`r1.${payload}`))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof d.exp !== 'number' || Date.now() > d.exp) return null;
    if ((d.k !== 'runner' && d.k !== 'staff') || typeof d.s !== 'string' || !d.s) return null;
    return { role: d.k, sub: d.s };
  } catch {
    return null;
  }
}

/** The token sent as the `x-runner-token` header (the Authorization header stays for the admin). */
export function sessionFromRequest(req: Request): RunnerSession | null {
  const raw = req.headers['x-runner-token'];
  return verifySession(typeof raw === 'string' ? raw : undefined);
}

export function requireRunner(req: Request, res: Response, next: NextFunction) {
  const s = sessionFromRequest(req);
  if (!s || s.role !== 'runner') {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน', needLogin: true });
    return;
  }
  (req as any).runner = s;
  next();
}

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------
const SCRYPT_N = 16384;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32, { N: SCRYPT_N, r: 8, p: 1 });
  return `scrypt$${SCRYPT_N}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [alg, n, saltHex, hashHex] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !n || !saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, 'hex');
    const got = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: Number(n), r: 8, p: 1 });
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Staff (ticket-checking) accounts: only a scrypt hash is kept, never the password.
// Add more with the STAFF_ACCOUNTS env var: [{"username":"...","hash":"scrypt$..."}]
// ---------------------------------------------------------------------------
interface StaffAccount {
  username: string;
  hash: string;
}
const STAFF_DEFAULT: StaffAccount[] = [{ username: 'chr27', hash: 'scrypt$16384$a3209a2451591de5ec28d883098e4081$881ce08021687007749a09f11df239e1573e75362c3abeb19f6eb3c74c6c4b4e' }];

function staffAccounts(): StaffAccount[] {
  const raw = process.env.STAFF_ACCOUNTS;
  if (!raw) return STAFF_DEFAULT;
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      const ok = list.filter((a) => a && typeof a.username === 'string' && typeof a.hash === 'string');
      return [...STAFF_DEFAULT, ...ok];
    }
  } catch {
    console.error('[runners] STAFF_ACCOUNTS is not valid JSON; using the built-in staff account only');
  }
  return STAFF_DEFAULT;
}

const DUMMY_HASH = hashPassword(crypto.randomBytes(8).toString('hex'));

export function checkStaff(username: string, password: string): string | null {
  const name = String(username || '').trim().toLowerCase();
  const acc = staffAccounts().find((a) => a.username.toLowerCase() === name);
  // always run a hash comparison so the time does not reveal whether the username exists
  const ok = verifyPassword(String(password || ''), acc ? acc.hash : DUMMY_HASH);
  return acc && ok ? acc.username : null;
}

// ---------------------------------------------------------------------------
// Runner accounts (database)
// ---------------------------------------------------------------------------
export interface RunnerRow {
  runner_id: string;
  email: string | null;
  username: string | null;
  name: string;
  phone: string;
  password_hash: string | null;
  line_user_id: string | null;
  profile: Record<string, unknown>;
  created_at: string;
}

let tablesReady: Promise<void> | null = null;
export function ensureRunnerTables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      await dbQuery(`create table if not exists csr.runners (
        runner_id     text primary key,
        email         text,
        username      text,
        name          text not null default '',
        phone         text not null default '',
        password_hash text,
        line_user_id  text,
        profile       jsonb not null default '{}'::jsonb,
        created_at    timestamptz not null default now(),
        last_login_at timestamptz
      )`);
      await dbQuery('create unique index if not exists runners_email_uidx on csr.runners (email) where email is not null');
      await dbQuery('create unique index if not exists runners_username_uidx on csr.runners (username) where username is not null');
      await dbQuery('create unique index if not exists runners_line_uidx on csr.runners (line_user_id) where line_user_id is not null');
      await dbQuery("create index if not exists orders_runner_idx on csr.orders ((data->>'runnerId')) where data ? 'runnerId'");
      await dbQuery('alter table csr.runners enable row level security');
    })().catch((err) => {
      tablesReady = null;
      throw err;
    });
  }
  return tablesReady;
}

const cleanText = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) : '');
export const normEmail = (v: unknown) => cleanText(v, 120).toLowerCase();
export const normUsername = (v: unknown) => cleanText(v, 30).toLowerCase();
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isUsername = (v: string) => /^[a-z0-9._-]{4,30}$/.test(v);

function newRunnerId(): string {
  return `R${crypto.randomBytes(7).toString('base64url').replace(/[-_]/g, 'x').slice(0, 10).toUpperCase()}`;
}

export type CreateRunnerResult = { ok: true; runner: RunnerRow } | { ok: false; error: string };

export async function createRunner(input: { name: string; email?: string; username?: string; password: string; phone?: string }): Promise<CreateRunnerResult> {
  await ensureRunnerTables();
  const name = cleanText(input.name, 80);
  const email = input.email ? normEmail(input.email) : '';
  const username = input.username ? normUsername(input.username) : '';
  const phone = cleanText(input.phone, 20).replace(/[^\d+\-\s]/g, '');
  if (name.length < 2) return { ok: false, error: 'กรุณากรอกชื่อ-นามสกุล' };
  if (!email && !username) return { ok: false, error: 'กรุณากรอกอีเมล หรือตั้งชื่อผู้ใช้' };
  if (email && !isEmail(email)) return { ok: false, error: 'อีเมลไม่ถูกต้อง' };
  if (username && !isUsername(username)) return { ok: false, error: 'ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - ยาว 4–30 ตัวอักษร' };
  if (username && staffAccounts().some((a) => a.username.toLowerCase() === username)) return { ok: false, error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' };
  if (String(input.password || '').length < 8) return { ok: false, error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' };
  if (String(input.password).length > 200) return { ok: false, error: 'รหัสผ่านยาวเกินไป' };

  if (email && (await dbQuery('select 1 from csr.runners where email = $1', [email])).length) return { ok: false, error: 'อีเมลนี้สมัครไว้แล้ว กรุณาเข้าสู่ระบบ' };
  if (username && (await dbQuery('select 1 from csr.runners where username = $1', [username])).length) return { ok: false, error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' };

  const id = newRunnerId();
  try {
    const rows = await dbQuery<RunnerRow>(
      `insert into csr.runners (runner_id, email, username, name, phone, password_hash) values ($1, $2, $3, $4, $5, $6) returning *`,
      [id, email || null, username || null, name, phone, hashPassword(String(input.password))]
    );
    return { ok: true, runner: rows[0] };
  } catch (err: any) {
    if (String(err?.message || '').includes('duplicate')) return { ok: false, error: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้แล้ว' };
    throw err;
  }
}

export async function loginRunner(identifier: string, password: string): Promise<RunnerRow | null> {
  await ensureRunnerTables();
  const id = cleanText(identifier, 120).toLowerCase();
  const rows = await dbQuery<RunnerRow>('select * from csr.runners where email = $1 or username = $1', [id]);
  const row = rows[0];
  // compare against a dummy hash when the account does not exist (constant-ish time)
  const ok = verifyPassword(String(password || ''), row?.password_hash || DUMMY_HASH);
  if (!row || !row.password_hash || !ok) return null;
  await dbQuery('update csr.runners set last_login_at = now() where runner_id = $1', [row.runner_id]);
  return row;
}

export async function getRunner(runnerId: string): Promise<RunnerRow | undefined> {
  await ensureRunnerTables();
  const rows = await dbQuery<RunnerRow>('select * from csr.runners where runner_id = $1', [runnerId]);
  return rows[0];
}

const PROFILE_KEYS = ['firstName', 'lastName', 'shirtSize', 'gender', 'birthDate', 'bloodType', 'emergencyName', 'emergencyPhone', 'relationship'] as const;

/** Name / phone / e-mail and a small profile used to pre-fill the booking form. National ID numbers are never stored here. */
export async function updateRunnerProfile(
  runnerId: string,
  patch: { name?: unknown; phone?: unknown; email?: unknown; profile?: unknown }
): Promise<{ ok: true; runner: RunnerRow } | { ok: false; error: string }> {
  const row = await getRunner(runnerId);
  if (!row) return { ok: false, error: 'ไม่พบบัญชี' };
  const name = patch.name !== undefined ? cleanText(patch.name, 80) : row.name;
  const phone = patch.phone !== undefined ? cleanText(patch.phone, 20).replace(/[^\d+\-\s]/g, '') : row.phone;
  let email = row.email;
  if (patch.email !== undefined) {
    const e = normEmail(patch.email);
    if (e && !isEmail(e)) return { ok: false, error: 'อีเมลไม่ถูกต้อง' };
    if (e && e !== row.email && (await dbQuery('select 1 from csr.runners where email = $1 and runner_id <> $2', [e, runnerId])).length) {
      return { ok: false, error: 'อีเมลนี้ถูกใช้โดยบัญชีอื่นแล้ว' };
    }
    email = e || null;
  }
  const profile = { ...(row.profile || {}) } as Record<string, unknown>;
  if (patch.profile && typeof patch.profile === 'object') {
    for (const k of PROFILE_KEYS) {
      const v = (patch.profile as Record<string, unknown>)[k];
      if (typeof v === 'string') profile[k] = cleanText(v, 80);
    }
  }
  if (name.length < 2) return { ok: false, error: 'กรุณากรอกชื่อ' };
  const rows = await dbQuery<RunnerRow>(
    'update csr.runners set name = $2, phone = $3, email = $4, profile = $5::jsonb where runner_id = $1 returning *',
    [runnerId, name, phone, email, JSON.stringify(profile)]
  );
  return { ok: true, runner: rows[0] };
}

export async function upsertLineRunner(lineUserId: string, displayName: string): Promise<RunnerRow> {
  await ensureRunnerTables();
  const existing = await dbQuery<RunnerRow>('select * from csr.runners where line_user_id = $1', [lineUserId]);
  if (existing[0]) {
    await dbQuery('update csr.runners set last_login_at = now() where runner_id = $1', [existing[0].runner_id]);
    return existing[0];
  }
  const rows = await dbQuery<RunnerRow>(
    'insert into csr.runners (runner_id, name, line_user_id, last_login_at) values ($1, $2, $3, now()) returning *',
    [newRunnerId(), cleanText(displayName, 80) || 'นักวิ่ง LINE', lineUserId]
  );
  return rows[0];
}

/** What the browser may see of an account. */
export function publicRunner(r: RunnerRow) {
  return {
    id: r.runner_id,
    name: r.name,
    email: r.email || '',
    username: r.username || '',
    phone: r.phone || '',
    lineLinked: Boolean(r.line_user_id),
    profile: r.profile || {},
    createdAt: r.created_at,
  };
}

// ---------------------------------------------------------------------------
// LINE Login (needs LINE_CHANNEL_ID and LINE_CHANNEL_SECRET; the callback URL is set in the LINE Developers console)
// ---------------------------------------------------------------------------
export const lineConfigured = () => Boolean(process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET);

export function lineState(): { state: string; nonce: string } {
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = b64(JSON.stringify({ n: nonce, exp: Date.now() + 10 * 60 * 1000 }));
  return { state: `${payload}.${hmac(`line|${payload}`)}`, nonce };
}

export function lineStateOk(state: string, nonceCookie: string): boolean {
  const [payload, sig] = String(state || '').split('.');
  if (!payload || !sig || !safeEqual(sig, hmac(`line|${payload}`))) return false;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof d.exp === 'number' && Date.now() < d.exp && typeof d.n === 'string' && safeEqual(d.n, nonceCookie);
  } catch {
    return false;
  }
}

export function lineAuthorizeUrl(redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CHANNEL_ID || '',
    redirect_uri: redirectUri,
    state,
    scope: 'profile openid',
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${q.toString()}`;
}

export async function lineProfile(code: string, redirectUri: string): Promise<{ userId: string; displayName: string }> {
  const tok = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_CHANNEL_ID || '',
      client_secret: process.env.LINE_CHANNEL_SECRET || '',
    }),
  });
  if (!tok.ok) throw new Error(`LINE token ${tok.status}`);
  const { access_token } = (await tok.json()) as { access_token?: string };
  if (!access_token) throw new Error('LINE token missing');
  const prof = await fetch('https://api.line.me/v2/profile', { headers: { Authorization: `Bearer ${access_token}` } });
  if (!prof.ok) throw new Error(`LINE profile ${prof.status}`);
  const p = (await prof.json()) as { userId?: string; displayName?: string };
  if (!p.userId) throw new Error('LINE profile missing userId');
  return { userId: p.userId, displayName: p.displayName || '' };
}
