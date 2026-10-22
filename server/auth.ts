/**
 * Admin authentication — checked on the server, never in the browser.
 *
 * Credentials come from environment variables:
 *   ADMIN_USERNAME          (default: "admin")
 *   ADMIN_PASSWORD          (required; if missing a random one is generated at
 *                            startup and printed to the server log)
 *   ADMIN_SESSION_SECRET    (signs login tokens; random per boot if missing,
 *                            which simply logs admins out on restart)
 */
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = crypto.randomBytes(9).toString('base64url');
  console.warn(
    `\n[SECURITY] ADMIN_PASSWORD is not set. Generated a temporary admin password for this run:\n` +
      `           username: ${ADMIN_USERNAME}\n           password: ${ADMIN_PASSWORD}\n` +
      `           Set ADMIN_PASSWORD in the environment to make it permanent.\n`
  );
} else if (ADMIN_PASSWORD.length < 10 || ADMIN_PASSWORD === 'changsuek2027') {
  console.warn('[SECURITY] ADMIN_PASSWORD is weak. Use at least 10 characters and not the old default.');
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

export function issueToken(username: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ u: username, exp: expiresAt })).toString('base64url');
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export function verifyToken(token: string | undefined): { username: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.exp !== 'number' || Date.now() > data.exp) return null;
    return { username: String(data.u) };
  } catch {
    return null;
  }
}

// ---- Login rate limiting (per client IP) ----------------------------------
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; lockedUntil: number; first: number }>();

export function checkCredentials(
  ip: string,
  username: string,
  password: string
): { ok: true } | { ok: false; lockedSeconds?: number; remaining?: number } {
  const now = Date.now();
  const rec = failures.get(ip);
  if (rec && rec.lockedUntil > now) {
    return { ok: false, lockedSeconds: Math.ceil((rec.lockedUntil - now) / 1000) };
  }
  // Compare both fields every time so timing doesn't reveal which one was wrong.
  const userOk = safeEqual(String(username || '').trim(), ADMIN_USERNAME);
  const passOk = safeEqual(String(password || ''), ADMIN_PASSWORD);
  if (userOk && passOk) {
    failures.delete(ip);
    return { ok: true };
  }
  const cur = rec && now - rec.first < LOCK_MS ? rec : { count: 0, lockedUntil: 0, first: now };
  cur.count += 1;
  if (cur.count >= MAX_FAILS) {
    cur.lockedUntil = now + LOCK_MS;
    cur.count = 0;
    cur.first = now;
    failures.set(ip, cur);
    return { ok: false, lockedSeconds: Math.ceil(LOCK_MS / 1000) };
  }
  failures.set(ip, cur);
  return { ok: false, remaining: MAX_FAILS - cur.count };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบแอดมินใหม่' });
    return;
  }
  (req as any).admin = session;
  next();
}
