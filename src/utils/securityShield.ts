export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  action:
    | 'ADMIN_LOGIN_SUCCESS'
    | 'ADMIN_LOGIN_FAILED'
    | 'ADMIN_LOCKOUT'
    | 'ADMIN_LOGOUT'
    | 'PII_UNMASKED'
    | 'CSV_EXPORTED_MASKED'
    | 'CSV_EXPORTED_FULL'
    | 'SLIP_STATUS_CHANGED'
    | 'SECURITY_SETTINGS_UPDATED'
    | 'STORAGE_ENCRYPTED_MIGRATION';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  actor: string;
  detail: string;
}

export interface LoginRateLimitState {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number | null;
}

const ENCRYPTION_PREFIX = 'CSR27_ENC_V1:';
const CIPHER_KEY = 'CHANGSUEK_PDPA_SHIELD_2027_K9_SECRET_KEY_9941';
const SECURITY_AUDIT_LOG_KEY = 'changsuek_security_audit_log_v1';
const LOGIN_RATE_LIMIT_KEY = 'changsuek_admin_rate_limit_v1';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds lockout

/**
 * Computes a deterministic 32-bit FNV-1a integrity signature for tamper detection
 */
export function computeIntegritySignature(payload: string): string {
  let hash = 0x811c9dc5;
  const salted = `${CIPHER_KEY}::${payload}`;
  for (let i = 0; i < salted.length; i++) {
    hash ^= salted.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Encodes & encrypts plaintext string for localStorage at-rest protection
 */
export function encryptStoragePayload(plaintext: string): string {
  try {
    const utf8Bytes = new TextEncoder().encode(plaintext);
    const keyBytes = new TextEncoder().encode(CIPHER_KEY);
    const xored = new Uint8Array(utf8Bytes.length);

    for (let i = 0; i < utf8Bytes.length; i++) {
      xored[i] = utf8Bytes[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 31) & 0xff);
    }

    let binary = '';
    for (let i = 0; i < xored.length; i++) {
      binary += String.fromCharCode(xored[i]);
    }
    const base64 = btoa(binary);
    const sig = computeIntegritySignature(plaintext);
    return `${ENCRYPTION_PREFIX}${sig}:${base64}`;
  } catch {
    return plaintext;
  }
}

/**
 * Decrypts & verifies integrity of encrypted localStorage payload.
 * Seamlessly reads legacy unencrypted JSON if encountered.
 */
export function decryptStoragePayload(raw: string | null): {
  plaintext: string | null;
  wasEncrypted: boolean;
  integrityVerified: boolean;
} {
  if (!raw) {
    return { plaintext: null, wasEncrypted: false, integrityVerified: true };
  }

  if (!raw.startsWith(ENCRYPTION_PREFIX)) {
    // Legacy plaintext data — caller can migrate to encrypted storage
    return { plaintext: raw, wasEncrypted: false, integrityVerified: true };
  }

  try {
    const body = raw.slice(ENCRYPTION_PREFIX.length);
    const sepIdx = body.indexOf(':');
    if (sepIdx === -1) {
      return { plaintext: null, wasEncrypted: true, integrityVerified: false };
    }

    const expectedSig = body.slice(0, sepIdx);
    const base64 = body.slice(sepIdx + 1);
    const binary = atob(base64);
    const xored = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      xored[i] = binary.charCodeAt(i);
    }

    const keyBytes = new TextEncoder().encode(CIPHER_KEY);
    const utf8Bytes = new Uint8Array(xored.length);
    for (let i = 0; i < xored.length; i++) {
      utf8Bytes[i] = xored[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 31) & 0xff);
    }

    const plaintext = new TextDecoder().decode(utf8Bytes);
    const actualSig = computeIntegritySignature(plaintext);
    return {
      plaintext,
      wasEncrypted: true,
      integrityVerified: actualSig === expectedSig,
    };
  } catch {
    return { plaintext: null, wasEncrypted: true, integrityVerified: false };
  }
}

/**
 * Checks whether a given localStorage key is currently stored in encrypted format
 */
export function isStorageKeyEncrypted(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return true; // Empty key has no exposed plaintext
    return raw.startsWith(ENCRYPTION_PREFIX);
  } catch {
    return false;
  }
}

/**
 * Input Sanitization: Strips dangerous HTML/XSS payloads, script tags, and event handlers
 */
export function sanitizeUserInput(input: string | undefined | null, maxLength = 250): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Anti-CSV Formula Injection Sanitizer (prevents =CMD|, +SUM, -HYPERLINK exploits in Excel)
 */
export function sanitizeCsvCell(val: unknown): string {
  const str = val === null || val === undefined ? '' : String(val);
  const trimmed = str.trim();
  const neutralized = /^[=+\-@\t\r]/.test(trimmed) ? `'${trimmed}` : str;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

/**
 * PDPA Data Masking Helpers for Phone, National ID / Passport, and Email
 */
export function maskPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 9) {
    const prefix = digits.slice(0, 3);
    const suffix = digits.slice(-4);
    return `${prefix}-XXX-${suffix}`;
  }
  return phone.replace(/.(?=.{3})/g, 'X');
}

export function maskNationalId(idCard: string | undefined | null): string {
  if (!idCard || idCard === '-') return '-';
  const clean = idCard.replace(/\s+/g, '');
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 13) {
    return `${digits[0]}-${digits.slice(1, 5)}-XXXXX-${digits.slice(10, 12)}-X`;
  }
  if (clean.length > 4) {
    return `${clean.slice(0, 2)}${'X'.repeat(Math.max(2, clean.length - 4))}${clean.slice(-2)}`;
  }
  return 'XXXX';
}

export function maskEmailAddress(email: string | undefined | null): string {
  if (!email || !email.includes('@')) return '-';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visibleLocal = local.length <= 2 ? local[0] || '*' : local.slice(0, 2);
  return `${visibleLocal}***@${domain}`;
}

/**
 * Admin Login Brute-Force Rate Limiting
 */
export function getLoginRateLimitState(): LoginRateLimitState {
  try {
    const raw = sessionStorage.getItem(LOGIN_RATE_LIMIT_KEY);
    if (!raw) {
      return { failedAttempts: 0, lockedUntil: null, lastAttemptAt: null };
    }
    const parsed = JSON.parse(raw) as LoginRateLimitState;
    if (parsed.lockedUntil && Date.now() >= parsed.lockedUntil) {
      const resetState: LoginRateLimitState = {
        failedAttempts: 0,
        lockedUntil: null,
        lastAttemptAt: null,
      };
      sessionStorage.setItem(LOGIN_RATE_LIMIT_KEY, JSON.stringify(resetState));
      return resetState;
    }
    return parsed;
  } catch {
    return { failedAttempts: 0, lockedUntil: null, lastAttemptAt: null };
  }
}

export function recordFailedLoginAttempt(usernameAttempt: string): LoginRateLimitState {
  const current = getLoginRateLimitState();
  const nextAttempts = current.failedAttempts + 1;
  const isNowLocked = nextAttempts >= MAX_LOGIN_ATTEMPTS;
  const lockedUntil = isNowLocked ? Date.now() + LOCKOUT_DURATION_MS : null;

  const nextState: LoginRateLimitState = {
    failedAttempts: nextAttempts,
    lockedUntil,
    lastAttemptAt: Date.now(),
  };

  try {
    sessionStorage.setItem(LOGIN_RATE_LIMIT_KEY, JSON.stringify(nextState));
  } catch {
    // ignore
  }

  if (isNowLocked) {
    appendSecurityAuditLog({
      action: 'ADMIN_LOCKOUT',
      severity: 'CRITICAL',
      actor: usernameAttempt || 'unknown',
      detail: `ระงับการเข้าสู่ระบบชั่วคราว 60 วินาที เนื่องจากกรอกรหัสผ่านผิดครบ ${MAX_LOGIN_ATTEMPTS} ครั้ง`,
    });
  } else {
    appendSecurityAuditLog({
      action: 'ADMIN_LOGIN_FAILED',
      severity: 'WARNING',
      actor: usernameAttempt || 'unknown',
      detail: `พยายามเข้าสู่ระบบแอดมินไม่สำเร็จ (ครั้งที่ ${nextAttempts}/${MAX_LOGIN_ATTEMPTS})`,
    });
  }

  return nextState;
}

export function clearLoginRateLimit(): void {
  try {
    sessionStorage.removeItem(LOGIN_RATE_LIMIT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Security Audit Log Management
 */
export function getSecurityAuditLogs(): SecurityAuditEvent[] {
  try {
    const raw = localStorage.getItem(SECURITY_AUDIT_LOG_KEY);
    const { plaintext } = decryptStoragePayload(raw);
    if (!plaintext) return [];
    const parsed = JSON.parse(plaintext);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendSecurityAuditLog(
  entry: Omit<SecurityAuditEvent, 'id' | 'timestamp'>
): SecurityAuditEvent[] {
  try {
    const current = getSecurityAuditLogs();
    const newEvent: SecurityAuditEvent = {
      ...entry,
      id: `SEC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEvent, ...current].slice(0, 80);
    localStorage.setItem(SECURITY_AUDIT_LOG_KEY, encryptStoragePayload(JSON.stringify(updated)));
    return updated;
  } catch {
    return [];
  }
}

export function clearSecurityAuditLogs(actor = 'admin'): SecurityAuditEvent[] {
  const initialEvent: SecurityAuditEvent = {
    id: `SEC-${Date.now().toString(36).toUpperCase()}-CLR`,
    timestamp: new Date().toISOString(),
    action: 'SECURITY_SETTINGS_UPDATED',
    severity: 'INFO',
    actor,
    detail: 'ล้างประวัติบันทึกความปลอดภัย (Audit Log Reset) โดยผู้ดูแลระบบ',
  };
  try {
    localStorage.setItem(
      SECURITY_AUDIT_LOG_KEY,
      encryptStoragePayload(JSON.stringify([initialEvent]))
    );
  } catch {
    // ignore
  }
  return [initialEvent];
}
