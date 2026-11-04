// Extra details for the shooting activity: every shooter's name, plus the buyer's acceptance of the range's
// safety rules (consentAt / consentVersion). The national ID is no longer collected (Nov 2026); older orders
// still carry it. Shared by the form and the server (the server checks it).
import { SHOOTING_RULES_VERSION } from './shootingRules';

export interface Shooter {
  fullName: string;
  /** 13 digits, no dashes. Not collected any more; only older orders have it. */
  idCard?: string;
}

export interface ShootingInfo {
  shooters: Shooter[];
  consentAt?: string;
  consentVersion?: string;
}

/** Thai national ID: 13 digits whose last digit is the checksum of the first 12. */
export function isValidThaiId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(id[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(id[12]);
}

export const digitsOnly = (v: unknown) => (typeof v === 'string' ? v.replace(/\D/g, '') : '');

/** 1-2345-67890-12-3 */
export function formatThaiId(id: string): string {
  const d = digitsOnly(id);
  if (d.length !== 13) return d;
  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d[12]}`;
}

/** x-xxxx-xxxxx-12-3: what the runner sees back (the full number stays with the organiser). */
export function maskThaiId(id?: string): string {
  const d = digitsOnly(id);
  return d.length === 13 ? `x-xxxx-xxxxx-${d.slice(10, 12)}-${d[12]}` : '';
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) : '');

/** Cleans what the browser sent. One shooter per person on the add-on. */
export function parseShooting(
  raw: unknown,
  people: number,
  acknowledged: boolean
): { ok: true; value: ShootingInfo } | { ok: false; error: string } {
  const list = Array.isArray(raw) ? raw.slice(0, people) : [];
  const errors: string[] = [];
  const shooters: Shooter[] = [];
  for (let i = 0; i < people; i++) {
    const r = (list[i] && typeof list[i] === 'object' ? list[i] : {}) as Record<string, unknown>;
    const fullName = clip(r.fullName, 120);
    if (fullName.length < 3) errors.push(`กรุณากรอกชื่อ-นามสกุลผู้ยิงปืนคนที่ ${i + 1}`);
    shooters.push({ fullName });
  }
  if (!acknowledged) errors.push('กรุณาอ่านกฎความปลอดภัยและกดรับทราบ/ยอมรับกิจกรรมยิงปืน');
  if (errors.length) return { ok: false, error: errors.join(' · ') };
  return { ok: true, value: { shooters, consentAt: new Date().toISOString(), consentVersion: SHOOTING_RULES_VERSION } };
}
