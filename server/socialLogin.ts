/**
 * Social sign-in for runners: LINE, Google and Facebook (OAuth 2.0 authorization-code flow).
 * Each provider works only when its keys are set in the environment; until then the buttons show "coming soon".
 *
 *   LINE      LINE_CHANNEL_ID, LINE_CHANNEL_SECRET           callback  <site>/api/auth/line/callback
 *   Google    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET         callback  <site>/api/auth/google/callback
 *   Facebook  FACEBOOK_APP_ID, FACEBOOK_APP_SECRET           callback  <site>/api/auth/facebook/callback
 */
import crypto from 'crypto';

export type Provider = 'line' | 'google' | 'facebook';
export const PROVIDERS: Provider[] = ['line', 'google', 'facebook'];
export const isProvider = (v: unknown): v is Provider => typeof v === 'string' && (PROVIDERS as string[]).includes(v);

const CFG: Record<Provider, { idEnv: string; secretEnv: string; authorize: string; scope: string }> = {
  line: { idEnv: 'LINE_CHANNEL_ID', secretEnv: 'LINE_CHANNEL_SECRET', authorize: 'https://access.line.me/oauth2/v2.1/authorize', scope: 'profile openid' },
  google: { idEnv: 'GOOGLE_CLIENT_ID', secretEnv: 'GOOGLE_CLIENT_SECRET', authorize: 'https://accounts.google.com/o/oauth2/v2/auth', scope: 'openid email profile' },
  facebook: { idEnv: 'FACEBOOK_APP_ID', secretEnv: 'FACEBOOK_APP_SECRET', authorize: 'https://www.facebook.com/v19.0/dialog/oauth', scope: 'public_profile,email' },
};

export const providerConfigured = (p: Provider) => Boolean(process.env[CFG[p].idEnv] && process.env[CFG[p].secretEnv]);
export const configuredProviders = (): Record<Provider, boolean> => ({
  line: providerConfigured('line'),
  google: providerConfigured('google'),
  facebook: providerConfigured('facebook'),
});

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

export function authorizeUrl(p: Provider, redirectUri: string, state: string): string {
  const q = new URLSearchParams({ response_type: 'code', client_id: process.env[CFG[p].idEnv] || '', redirect_uri: redirectUri, state, scope: CFG[p].scope });
  if (p === 'google') q.set('prompt', 'select_account');
  return `${CFG[p].authorize}?${q.toString()}`;
}

export interface SocialProfile {
  id: string;
  name: string;
  email?: string;
  /** true only when the provider vouches for the e-mail (Google's email_verified) */
  emailVerified: boolean;
}

async function json<T>(r: Response, what: string): Promise<T> {
  if (!r.ok) throw new Error(`${what} ${r.status}`);
  return (await r.json()) as T;
}

export async function fetchProfile(p: Provider, code: string, redirectUri: string): Promise<SocialProfile> {
  const clientId = process.env[CFG[p].idEnv] || '';
  const clientSecret = process.env[CFG[p].secretEnv] || '';
  if (p === 'facebook') {
    const q = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code });
    const tok = await json<{ access_token?: string }>(await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${q.toString()}`), 'facebook token');
    if (!tok.access_token) throw new Error('facebook token missing');
    const me = await json<{ id?: string; name?: string; email?: string }>(
      await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(tok.access_token)}`),
      'facebook profile'
    );
    if (!me.id) throw new Error('facebook profile missing id');
    return { id: me.id, name: me.name || '', email: me.email, emailVerified: false };
  }
  const tokenUrl = p === 'google' ? 'https://oauth2.googleapis.com/token' : 'https://api.line.me/oauth2/v2.1/token';
  const tok = await json<{ access_token?: string }>(
    await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret }),
    }),
    `${p} token`
  );
  if (!tok.access_token) throw new Error(`${p} token missing`);
  const auth = { Authorization: `Bearer ${tok.access_token}` };
  if (p === 'google') {
    const u = await json<{ sub?: string; name?: string; email?: string; email_verified?: boolean }>(await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: auth }), 'google profile');
    if (!u.sub) throw new Error('google profile missing sub');
    return { id: u.sub, name: u.name || '', email: u.email, emailVerified: u.email_verified === true };
  }
  const l = await json<{ userId?: string; displayName?: string }>(await fetch('https://api.line.me/v2/profile', { headers: auth }), 'line profile');
  if (!l.userId) throw new Error('line profile missing userId');
  return { id: l.userId, name: l.displayName || '', emailVerified: false };
}
