/**
 * Payments.
 *
 * New orders: the runner transfers by PromptPay and uploads the slip; EasySlip reads the slip
 * from the bank's own record (not from the picture), and app.ts checks amount, receiver, date and reuse.
 *
 * Omise (old orders only): a charge counts as paid only after we fetch it from api.omise.co
 * with our own secret key. Webhook bodies are treated as a hint, never as proof.
 */
import { getEasySlipKey, getOmiseKey } from './store';

// ---------------------------------------------------------------------------
// EasySlip (https://document.easyslip.com/en/v2/verify/bank/base64)
// ---------------------------------------------------------------------------
export interface EasySlipResult {
  /** false when EasySlip gave no slip data; errorCode then says why */
  ok: boolean;
  errorCode?: string;
  transRef?: string;
  date?: string;
  amount?: number;
  senderBank?: string;
  senderName?: string;
  receiverName?: string;
  /** Receiver bank account / PromptPay numbers as printed (usually masked, e.g. xxx-x-x7764-x) */
  receiverAccounts: string[];
  /** EasySlip matched the receiver to an account registered in its dashboard */
  matchedAccount: boolean;
  /** EasySlip has seen this slip before (on any request with our key) */
  isDuplicate: boolean;
}

export async function verifySlipWithEasySlip(imageDataUrl: string, amountBaht: number, remark: string): Promise<EasySlipResult> {
  const apiKey = await getEasySlipKey();
  const empty: EasySlipResult = { ok: false, receiverAccounts: [], matchedAccount: false, isDuplicate: false };
  if (!apiKey) return { ...empty, errorCode: 'MISSING_API_KEY' };
  try {
    const resp = await fetch('https://api.easyslip.com/v2/verify/bank', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64: imageDataUrl, remark, matchAccount: true, matchAmount: amountBaht, checkDuplicate: true }),
      signal: AbortSignal.timeout(20_000),
    });
    const json: any = await resp.json().catch(() => ({}));
    const raw = json?.data?.rawSlip;
    if (!resp.ok || json?.success !== true || !raw) {
      return { ...empty, errorCode: String(json?.error?.code || `HTTP_${resp.status}`) };
    }
    const acc = raw.receiver?.account || {};
    return {
      ok: true,
      transRef: String(raw.transRef || ''),
      date: String(raw.date || ''),
      amount: Number(raw.amount?.amount),
      senderBank: String(raw.sender?.bank?.short || raw.sender?.bank?.name || ''),
      senderName: String(raw.sender?.account?.name?.th || raw.sender?.account?.name?.en || ''),
      receiverName: String(acc.name?.th || acc.name?.en || ''),
      receiverAccounts: [acc.bank?.account, acc.proxy?.account].filter((a): a is string => typeof a === 'string' && a.length > 0),
      matchedAccount: Boolean(json.data.matchedAccount),
      isDuplicate: json.data.isDuplicate === true,
    };
  } catch (err: any) {
    return { ...empty, errorCode: err?.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK' };
  }
}

/** True when a printed (masked) account number fits ours: same length, every visible digit equal, at least 3 visible. */
export function maskedAccountMatches(printed: string, ours: string): boolean {
  const p = printed.replace(/[^0-9xX*]/g, '');
  const d = ours.replace(/[^0-9]/g, '');
  if (!p || p.length !== d.length) return false;
  let seen = 0;
  for (let i = 0; i < p.length; i++) {
    if (/[0-9]/.test(p[i])) {
      if (p[i] !== d[i]) return false;
      seen++;
    }
  }
  return seen >= 3;
}

// ---------------------------------------------------------------------------
// Omise
// ---------------------------------------------------------------------------
const OMISE_MIN_SATANG = 2000; // Omise PromptPay minimum is 20 THB

function omiseAuth(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export async function createOmiseCharge(params: {
  amountBaht: number;
  orderId: string;
}): Promise<{ chargeId?: string; qrImageUrl?: string; expiresAt?: string; error?: string }> {
  const secretKey = await getOmiseKey();
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
  const secretKey = await getOmiseKey();
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

export async function omiseKeyMode(): Promise<'live' | 'test' | null> {
  const key = await getOmiseKey();
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
  const secretKey = await getOmiseKey();
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
