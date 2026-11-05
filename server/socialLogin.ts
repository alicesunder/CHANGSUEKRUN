/**
 * Google sign-in for runners (OAuth 2.0 authorization-code flow). Works only when GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET are set; callback address: <site>/api/auth/google/callback.
 * (LINE and Facebook sign-in were removed on request.)
 */
import crypto from 'crypto';

export type Provider = 'google';
export const PROVIDERS: Provider[] = ['google'];
export const isProvider = (v: unknown): v is Provider => typeof v === 'string' && (PROVIDERS as string[]).includes(v);

const CFG = { idEnv: 'GOOGLE_CLIENT_ID', secretEnv: 'GOOGLE_CLIENT_SECRET', authorize: 'https://accounts.google.com/o/oauth2/v2/auth', scope: 'openid email profile' };

export const providerConfigured = (_p: Provider = 'google') => Boolean(process.env[CFG.idEnv] && process.env[CFG.secretEnv]);
export const configuredProviders = (): { google: boolean } => ({ google: providerConfigured('google') });

const KEY = crypto
  .createHash('sha256')
  .update(`csr-oauth-state|${process.env.RUNNER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex')}`)
  .digest();
const hmac = (s: string) => crypto.createHmac('sha256', KEY).update(s).digest('base64url');
const same = (a: string, b: string) => {
  const x = crypto.createHash('sha256').update(a).digest();
  const y = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(x, y);
};

/** A signed, 10-minute `state` plus a nonce that is also kept in a cookie (so a stranger's link cannot log you in). */
export function newState(p: Provider): { state: string; nonce: string } {
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = Buffer.from(JSON.stringify({ p, n: nonce, exp: Date.now() + 10 * 60 * 1000 })).toString('base64url');
  return { state: `${payload}.${hmac(`oauth|${payload}`)}`, nonce };
}

export function stateOk(p: Provider, state: string, nonceCookie: string): boolean {
  const [payload, sig] = String(state || '').split('.');
  if (!payload || !sig || !nonceCookie || !same(sig, hmac(`oauth|${payload}`))) return false;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return d.p === p && typeof d.exp === 'number' && Date.now() < d.exp && typeof d.n === 'string' && same(d.n, nonceCookie);
  } catch {
    return false;
  }
}

export function authorizeUrl(_p: Provider, redirectUri: string, state: string): string {
  const q = new URLSearchParams({ response_type: 'code', client_id: process.env[CFG.idEnv] || '', redirect_uri: redirectUri, state, scope: CFG.scope, prompt: 'select_account' });
  return `${CFG.authorize}?${q.toString()}`;
}

export interface SocialProfile {
  id: string;
  name: string;
  email?: string;
  /** true only when Google vouches for the e-mail (email_verified) */
  emailVerified: boolean;
}

export async function fetchProfile(_p: Provider, code: string, redirectUri: string): Promise<SocialProfile> {
  const tokRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: process.env[CFG.idEnv] || '', client_secret: process.env[CFG.secretEnv] || '' }),
  });
  if (!tokRes.ok) throw new Error(`google token ${tokRes.status}`);
  const tok = (await tokRes.json()) as { access_token?: string };
  if (!tok.access_token) throw new Error('google token missing');
  const uRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tok.access_token}` } });
  if (!uRes.ok) throw new Error(`google profile ${uRes.status}`);
  const u = (await uRes.json()) as { sub?: string; name?: string; email?: string; email_verified?: boolean };
  if (!u.sub) throw new Error('google profile missing sub');
  return { id: u.sub, name: u.name || '', email: u.email, emailVerified: u.email_verified === true };
}
