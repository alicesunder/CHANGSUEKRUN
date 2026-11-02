// Extra details for the shooting activity: every shooter's name + Thai national ID, and a consent
// the buyer accepts for the group. Shared by the form and the server (the server checks it).

/** Bump when CONSENT_LINES change, so stored orders show which wording was accepted. */
export const SHOOTING_CONSENT_VERSION = '2026-11-02';

/** Draft wording for the organiser to confirm. */
export const SHOOTING_CONSENT_LINES = [
  'ผู้เข้าร่วมอายุ 15 ปีขึ้นไป ผู้ที่อายุต่ำกว่า 18 ปีต้องมีผู้ปกครองลงชื่อยินยอมหน้าสนาม',
  'แสดงบัตรประจำตัวประชาชนตัวจริงที่จุดลงทะเบียน ชื่อและเลขบัตรต้องตรงกับที่กรอกไว้',
  'ปฏิบัติตามคำสั่งครูฝึกตลอดเวลา สวมแว่นตาและที่ครอบหูนิรภัยที่จัดให้ และไม่หันปากกระบอกปืนออกนอกเป้า',
  'งดเครื่องดื่มแอลกอฮอล์และสารเสพติดก่อนร่วมกิจกรรม ครูฝึกมีสิทธิ์ไม่ให้ร่วมกิจกรรมหากเห็นว่าไม่ปลอดภัย',
  'ข้าพเจ้ารับทราบความเสี่ยงของกิจกรรมยิงปืน และยินยอมให้ผู้จัดงานใช้ชื่อและเลขบัตรประชาชนเพื่อลงทะเบียนกับสนามยิงปืนเท่านั้น',
];

export interface Shooter {
  fullName: string;
  /** 13 digits, no dashes */
  idCard: string;
}

export interface ShootingInfo {
  shooters: Shooter[];
  consentAt: string;
  consentVersion: string;
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
export function maskThaiId(id: string): string {
  const d = digitsOnly(id);
  return d.length === 13 ? `x-xxxx-xxxxx-${d.slice(10, 12)}-${d[12]}` : '';
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) : '');

/** Cleans what the browser sent. One shooter per person on the add-on. */
export function parseShooting(
  raw: unknown,
  people: number,
  consent: unknown
): { ok: true; value: ShootingInfo } | { ok: false; error: string } {
  const list = Array.isArray(raw) ? raw.slice(0, people) : [];
  const errors: string[] = [];
  const shooters: Shooter[] = [];
  for (let i = 0; i < people; i++) {
    const r = (list[i] && typeof list[i] === 'object' ? list[i] : {}) as Record<string, unknown>;
    const fullName = clip(r.fullName, 120);
    const idCard = digitsOnly(r.idCard);
    if (fullName.length < 3) errors.push(`กรุณากรอกชื่อ-นามสกุลผู้ยิงปืนคนที่ ${i + 1}`);
    if (!isValidThaiId(idCard)) errors.push(`เลขบัตรประชาชนผู้ยิงปืนคนที่ ${i + 1} ไม่ถูกต้อง`);
    shooters.push({ fullName, idCard });
  }
  const ids = shooters.map((s) => s.idCard).filter(Boolean);
  if (new Set(ids).size !== ids.length) errors.push('เลขบัตรประชาชนผู้ยิงปืนซ้ำกัน');
  if (consent !== true) errors.push('กรุณายอมรับใบยินยอมเข้าร่วมกิจกรรมยิงปืน');
  if (errors.length) return { ok: false, error: errors.join(' · ') };
  return { ok: true, value: { shooters, consentAt: new Date().toISOString(), consentVersion: SHOOTING_CONSENT_VERSION } };
}
