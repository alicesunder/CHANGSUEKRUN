// Personal data collected for the event's accident insurance (5 KM and 10 KM runners).
// Shared by the website (form) and the server (the server is the one that checks it).

export const INSURANCE_ROUTES = ['5km', '10km'] as const;
export const needsInsurance = (routeId: string): boolean => (INSURANCE_ROUTES as readonly string[]).includes(routeId);

export const PREFIXES = ['นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง', 'อื่นๆ'] as const;
export const GENDERS = ['ชาย', 'หญิง', 'ไม่ระบุ'] as const;
export const BLOOD_TYPES = ['A', 'B', 'AB', 'O', 'ไม่ทราบ'] as const;
export const RELATIONSHIPS = ['บิดา', 'มารดา', 'คู่สมรส', 'บุตร', 'พี่/น้อง', 'ญาติ', 'เพื่อน', 'อื่นๆ'] as const;

export interface InsuranceInfo {
  prefix: string;
  firstName: string;
  lastName: string;
  gender: string;
  /** YYYY-MM-DD, Gregorian (ค.ศ.) */
  birthDate: string;
  /** worked out from the birth date (never typed in) */
  age: number;
  bloodType: string;
  /** chronic conditions; "ไม่มี" when none */
  medicalConditions: string;
  emergencyName: string;
  relationship: string;
}

export function ageFromBirthDate(birthDate: string, today = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age -= 1;
  return age;
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) : '');
const oneOf = (v: unknown, list: readonly string[]) => (typeof v === 'string' && list.includes(v) ? v : '');

/** Cleans whatever the browser sent. Returns the clean data, or a Thai error message. */
export function parseInsurance(raw: unknown, consent: unknown): { ok: true; value: InsuranceInfo } | { ok: false; error: string } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const prefix = oneOf(r.prefix, PREFIXES);
  const firstName = clip(r.firstName, 60);
  const lastName = clip(r.lastName, 60);
  const gender = oneOf(r.gender, GENDERS);
  const birthDate = typeof r.birthDate === 'string' ? r.birthDate : '';
  const age = ageFromBirthDate(birthDate);
  const bloodType = oneOf(r.bloodType, BLOOD_TYPES);
  const medicalConditions = clip(r.medicalConditions, 200) || 'ไม่มี';
  const emergencyName = clip(r.emergencyName, 80);
  const relationship = oneOf(r.relationship, RELATIONSHIPS);

  const errors: string[] = [];
  if (!prefix) errors.push('กรุณาเลือกคำนำหน้า');
  if (firstName.length < 1) errors.push('กรุณากรอกชื่อ');
  if (lastName.length < 1) errors.push('กรุณากรอกนามสกุล');
  if (!gender) errors.push('กรุณาเลือกเพศ');
  if (age === null || age < 0 || age > 110) errors.push('วัน/เดือน/ปีเกิด (ค.ศ.) ไม่ถูกต้อง');
  if (!bloodType) errors.push('กรุณาเลือกกรุ๊ปเลือด');
  if (emergencyName.length < 2) errors.push('กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน');
  if (!relationship) errors.push('กรุณาเลือกความสัมพันธ์กับผู้ติดต่อฉุกเฉิน');
  if (consent !== true) errors.push('กรุณายินยอมให้ส่งข้อมูลสุขภาพ/ประกันให้บริษัทประกัน');
  if (errors.length) return { ok: false, error: errors.join(' · ') };

  return {
    ok: true,
    value: { prefix, firstName, lastName, gender, birthDate, age: age as number, bloodType, medicalConditions, emergencyName, relationship },
  };
}
