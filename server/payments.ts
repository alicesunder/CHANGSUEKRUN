/**
 * Omise PromptPay — the only payment method.
 *
 * Trust model: a charge counts as paid only after we fetch it from api.omise.co
 * with our own secret key. Webhook bodies are treated as a hint, never as proof.
 */
import { getEffectiveSlipApiKeys } from './store';

// ---------------------------------------------------------------------------
// Omise
// ---------------------------------------------------------------------------
const OMISE_MIN_SATANG = 2000; // Omise PromptPay minimum is 20 THB

function omiseAuth(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export function omiseEnabledFor(amountBaht: number): boolean {
  const key = getEffectiveSlipApiKeys().omiseSecretKey;
  return Boolean(key) && Math.round(amountBaht * 100) >= OMISE_MIN_SATANG;
}

export async function createOmiseCharge(params: {
  amountBaht: number;
  orderId: string;
}): Promise<{ chargeId?: string; qrImageUrl?: string; expiresAt?: string; error?: string }> {
  const secretKey = getEffectiveSlipApiKeys().omiseSecretKey;
  if (!secretKey) return { error: 'Omise not configured' };
  const body = new URLSearchParams();
  body.append('amount', String(Math.round(params.amountBaht * 100)));
  body.append('currency', 'THB');
  body.append('source[type]', 'promptpay');
  body.append('metadata[orderId]', params.orderId);
  try {
    const resp = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: {
        Authorization: omiseAuth(secretKey),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (resp.ok && json?.id) {
      return {
        chargeId: json.id,
        qrImageUrl: json?.source?.scannable_code?.image?.download_uri || '',
        expiresAt: typeof json?.expires_at === 'string' ? json.expires_at : undefined,
      };
    }
    return { error: json?.message || `Omise HTTP ${resp.status}` };
  } catch (err: any) {
    return { error: err?.message || 'Cannot reach api.omise.co' };
  }
}

/** Fetches a charge from Omise with our secret key. This is the only proof of payment we accept from Omise. */
export async function fetchVerifiedOmiseCharge(chargeId: string): Promise<{
  paid: boolean;
  status?: string;
  orderId?: string;
  amountSatang?: number;
  currency?: string;
  chargeId?: string;
} | null> {
  const secretKey = getEffectiveSlipApiKeys().omiseSecretKey;
  if (!secretKey || !/^chrg_[A-Za-z0-9_]+$/.test(chargeId)) return null;
  try {
    const resp = await fetch(`https://api.omise.co/charges/${encodeURIComponent(chargeId)}`, {
      headers: { Authorization: omiseAuth(secretKey) },
    });
    if (!resp.ok) return null;
    const c: any = await resp.json();
    return {
      paid: c?.status === 'successful' && c?.paid === true,
      status: String(c?.status || ''),
      orderId: c?.metadata?.orderId,
      amountSatang: Number(c?.amount),
      currency: String(c?.currency || '').toUpperCase(),
      chargeId: c?.id,
    };
  } catch {
    return null;
  }
}

export function omiseKeyMode(): 'live' | 'test' | null {
  const key = getEffectiveSlipApiKeys().omiseSecretKey;
  if (!key) return null;
  return key.startsWith('skey_test_') ? 'test' : 'live';
}

/** Downloads the QR image of a charge so we can serve it same-origin (lets runners save it on mobile). */
export async function fetchOmiseQrImage(url: string): Promise<{ type: string; body: Buffer } | null> {
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (!(host === 'omise.co' || host.endsWith('.omise.co'))) return null;
  const secretKey = getEffectiveSlipApiKeys().omiseSecretKey;
  try {
    const resp = await fetch(url, secretKey ? { headers: { Authorization: omiseAuth(secretKey) } } : {});
    if (!resp.ok) return null;
    const type = resp.headers.get('content-type') || 'image/svg+xml';
    if (!type.startsWith('image/')) return null;
    return { type, body: Buffer.from(await resp.arrayBuffer()) };
  } catch {
    return null;
  }
}
