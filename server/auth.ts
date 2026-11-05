/**
 * Admin authentication — checked on the server, never in the browser.
 *
 * Environment variables:
 *   ADMIN_USERNAME          (default: "admin")
 *   ADMIN_PASSWORD          (required on a hosted server; locally a random one is printed)
 *   ADMIN_SESSION_SECRET    (signs login tokens; must be the same on every server instance)
 */
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { dbTx } from './db';
import { ROLE_RANK, checkAdminUserPassword, currentVersion, isRole, sessionStillValid, touchAdminLogin, type AdminRole } from './adminOps';

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const hosted = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
let adminEnabled = true;

if (!ADMIN_PASSWORD) {
  if (process.env.VERCEL) {
    adminEnabled = false;
    console.error('[SECURITY] ADMIN_PASSWORD is not set — admin login is disabled until it is set.');
  } else {
    ADMIN_PASSWORD = crypto.randomBytes(9).toString('base64url');
    console.warn(
      `\n[SECURITY] ADMIN_PASSWORD is not set. Generated a temporary admin password for this run:\n` +
        `           username: ${ADMIN_USERNAME}\n           password: ${ADMIN_PASSWORD}\n` +
        `           Set ADMIN_PASSWORD in the environment to make it permanent.\n`
    );
  }
} else if (ADMIN_PASSWORD.length < 10 || ADMIN_PASSWORD === 'changsuek2027') {
  console.warn('[SECURITY] ADMIN_PASSWORD is weak. Use at least 10 characters.');
}

// Login tokens must verify on every server instance, so the secret can't be random per start.
let SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || '';
if (!SESSION_SECRET) {
  SESSION_SECRET = crypto.createHash('sha256').update(`csr-session|${ADMIN_USERNAME}|${ADMIN_PASSWORD}`).digest('hex');
  if (hosted) console.warn('[SECURITY] ADMIN_SESSION_SECRET is not set; derived from the admin password. Set it explicitly.');
}
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

/**
 * Link to an order's A4 documents (sent in the ticket e-mail): HMAC of the order id. DOCS_LINK_SECRET
 * keeps the links working if the admin password changes; without it the session secret is used.
 */
const DOCS_SECRET = process.env.DOCS_LINK_SECRET || SESSION_SECRET;
export function docsSignature(orderId: string): string {
  return crypto.createHmac('sha256', DOCS_SECRET).update(`docs|${orderId}`).digest('base64url').slice(0, 32);
}
export function docsSignatureOk(orderId: string, sig: unknown): boolean {
  return typeof sig === 'string' && sig.length === 32 && safeEqual(sig, docsSignature(orderId));
}

export function issueToken(username: string, role: AdminRole = 'owner', version = 0): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ u: username, r: role, v: version, exp: expiresAt })).toString('base64url');
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

/** Signature + expiry only (no database). Use verifyAdminSession / requireAdmin to also honour "sign out everywhere". */
export function verifyToken(token: string | undefined): { username: string; role: AdminRole; version: number } | null {
  if (!token || !adminEnabled) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.exp !== 'number' || Date.now() > data.exp) return null;
    // tokens issued before roles existed carry no role: they belonged to the owner account
    return { username: String(data.u), role: isRole(data.r) ? data.r : 'owner', version: Number(data.v) || 0 };
  } catch {
    return null;
  }
}

// ---- Login rate limiting (per client IP, stored in the database) ----------
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function checkCredentials(
  ip: string,
  username: string,
  password: string
): Promise<{ ok: true; username: string; role: AdminRole } | { ok: false; lockedSeconds?: number; remaining?: number }> {
  if (!adminEnabled) return { ok: false, remaining: 0 };
  // Compare both fields every time so timing doesn't reveal which one was wrong.
  const userOk = safeEqual(String(username || '').trim(), ADMIN_USERNAME);
  const passOk = safeEqual(String(password || ''), ADMIN_PASSWORD);
  let who: { username: string; role: AdminRole } | null = userOk && passOk ? { username: ADMIN_USERNAME, role: 'owner' } : null;
  if (!who) {
    const u = await checkAdminUserPassword(String(username || ''), String(password || ''));
    if (u) who = { username: u.username, role: u.role };
  }

  return dbTx(async (q) => {
    const now = Date.now();
    const rows = await q<{ fails: number; first_at: string; locked_until: string | null }>(
      'select fails, first_at, locked_until from csr.login_failures where ip = $1 for update',
      [ip]
    );
    const rec = rows[0];
    if (rec?.locked_until && new Date(rec.locked_until).getTime() > now) {
      return { ok: false as const, lockedSeconds: Math.ceil((new Date(rec.locked_until).getTime() - now) / 1000) };
    }
    if (who) {
      await q('delete from csr.login_failures where ip = $1', [ip]);
      return { ok: true as const, username: who.username, role: who.role };
    }
    const inWindow = rec && now - new Date(rec.first_at).getTime() < LOCK_MS;
    const fails = inWindow ? rec.fails + 1 : 1;
    const firstAt = inWindow ? new Date(rec.first_at) : new Date(now);
    if (fails >= MAX_FAILS) {
      await q(
        `insert into csr.login_failures (ip, fails, first_at, locked_until) values ($1, 0, now(), $2)
         on conflict (ip) do update set fails = 0, first_at = now(), locked_until = excluded.locked_until`,
        [ip, new Date(now + LOCK_MS)]
      );
      return { ok: false as const, lockedSeconds: Math.ceil(LOCK_MS / 1000) };
    }
    await q(
      `insert into csr.login_failures (ip, fails, first_at, locked_until) values ($1, $2, $3, null)
       on conflict (ip) do update set fails = excluded.fails, first_at = excluded.first_at, locked_until = null`,
      [ip, fails, firstAt]
    );
    return { ok: false as const, remaining: MAX_FAILS - fails };
  });
}

/** Reads the Bearer token and checks it is still valid (not signed out, account not switched off). */
export async function verifyAdminSession(req: Request): Promise<{ username: string; role: AdminRole } | null> {
  const header = req.headers.authorization || '';
  const t = verifyToken(header.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!t) return null;
  const v = await sessionStillValid(t.username, t.role, t.version);
  return v.ok ? { username: t.username, role: v.role } : null;
}

export async function issueSessionFor(username: string, role: AdminRole) {
  await touchAdminLogin(username);
  return issueToken(username, role, await currentVersion(username, role));
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  verifyAdminSession(req)
    .then((session) => {
      if (!session) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบแอดมินใหม่' });
        return;
      }
      (req as any).admin = session;
      next();
    })
    .catch(next);
}

/**
 * Role rules for everything under /api/admin, applied before the routes (a route's own requireAdmin still proves who is calling).
 *   viewer   read-only pages (orders with sensitive fields masked, accounts, visits)
 *   manager  everything about orders and runner accounts, exports, sponsor codes, winners
 *   owner    money and configuration: settings, payment gateway, sales / early-bird switches, limits, admin accounts, audit log
 * Staff tokens (ticket scanner) are not admin tokens and pass through to their own routes.
 */
export function minRoleFor(method: string, path: string): AdminRole | null {
  const p = path.replace(/\/+$/, '');
  if (p === '/login' || p === '/lookup') return null;
  if (/^\/(admins|audit|payment-gateway|settings|limits)(\/|$)/.test(p)) return 'owner';
  if (method !== 'GET' && /^\/(early-bird|sales)$/.test(p)) return 'owner';
  // deleting an order for good cannot be undone: owner only
  if (method === 'DELETE' && /^\/orders\/[^/]+$/.test(p)) return 'owner';
  if (/^\/me(\/|$)/.test(p)) return 'viewer';
  if (method !== 'GET') return 'manager';
  if (/^\/export(\/|$)/.test(p) || /^\/orders\/[^/]+\/(full|slip)$/.test(p)) return 'manager';
  return 'viewer';
}

export function adminPolicy(req: Request, res: Response, next: NextFunction) {
  const need = minRoleFor(req.method, req.path);
  const header = req.headers.authorization || '';
  if (!need || !verifyToken(header.startsWith('Bearer ') ? header.slice(7) : undefined)) return next();
  verifyAdminSession(req)
    .then((session) => {
      if (!session) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบแอดมินใหม่' });
        return;
      }
      if (ROLE_RANK[session.role] < ROLE_RANK[need]) {
        res.status(403).json({ error: 'บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้' });
        return;
      }
      next();
    })
    .catch(next);
}
