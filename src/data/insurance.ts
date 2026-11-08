// Personal data collected for the event's accident insurance (every running distance).
// Shared by the website (form) and the server (the server is the one that checks it).

import { digitsOnly, isValidThaiId } from './shooting';

export const INSURANCE_ROUTES = ['1km', '3km', '5km', '10km'] as const;
export const needsInsurance = (routeId: string): boolean => (INSURANCE_ROUTES as readonly string[]).includes(routeId);

export const PREFIXES = ['นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง', 'อื่นๆ'] as const;
export const GENDERS = ['ชาย', 'หญิง', 'ไม่ระบุ'] as const;
export const BLOOD_TYPES = ['A', 'B', 'AB', 'O', 'ไม่ทราบ'] as const;
export const RELATIONSHIPS = ['บิดา', 'มารดา', 'คู่สมรส', 'บุตร', 'พี่/น้อง', 'ญาติ', 'เพื่อน', 'อื่นๆ'] as const;

/** Nationalities offered to foreign runners (English names, sorted); "Other" lets them type their own. */
export const NATIONALITIES = [
  'American', 'Australian', 'Austrian', 'Belgian', 'British', 'Burmese', 'Cambodian', 'Canadian', 'Chinese', 'Czech', 'Danish',
  'Dutch', 'Filipino', 'Finnish', 'French', 'German', 'Greek', 'Hong Konger', 'Indian', 'Indonesian', 'Irish', 'Israeli', 'Italian',
  'Japanese', 'Korean', 'Lao', 'Malaysian', 'Nepalese', 'New Zealander', 'Norwegian', 'Pakistani', 'Polish', 'Portuguese',
  'Russian', 'Singaporean', 'South African', 'Spanish', 'Swedish', 'Swiss', 'Taiwanese', 'Turkish', 'Ukrainian', 'Vietnamese', 'Other',
] as const;

/** Passport numbers: letters and digits only (6-20 characters). */
export const normalizePassport = (v: unknown): string => (typeof v === 'string' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20) : '');
export const isValidPassport = (v: string): boolean => /^[A-Z0-9]{6,20}$/.test(v);
export const maskPassport = (v: string): string => (v.length <= 3 ? v : `${'X'.repeat(v.length - 3)}${v.slice(-3)}`);

/** True when YYYY-MM-DD is a real date that is not in the past. */
export function isFutureIsoDate(v: string, today = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (dt.getUTCFullYear() !== +m[1] || dt.getUTCMonth() !== +m[2] - 1 || dt.getUTCDate() !== +m[3]) return false;
  const t0 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return dt.getTime() >= t0 && +m[1] < 2100;
}

export interface InsuranceInfo {
  prefix: string;
  firstName: string;
  lastName: string;
  /** 13-digit national ID (the insurer needs it); orders made before it was asked have none; foreign runners use the passport instead */
  idCard?: string;
  /** a foreign runner: nationality + passport number + passport expiry replace the Thai national ID */
  foreigner?: boolean;
  nationality?: string;
  passportNo?: string;
  /** YYYY-MM-DD */
  passportExpiry?: string;
  gender: string;
  /** YYYY-MM-DD, Gregorian (ค.ศ.) */
  birthDate: string;
  /** worked out from the birth date (never typed in) */
  age: number;
  bloodType: string;
  /** chronic conditions; "ไม่มี" when none */
  medicalConditions: string;
  /** emergency contact (name, relationship to the runner, phone) */
  emergencyName: string;
  relationship: string;
  emergencyPhone?: string;
  /** insurance beneficiary (name + relationship); orders made before it was asked used the emergency contact */
  beneficiaryName?: string;
  beneficiaryRelationship?: string;
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
  const foreigner = r.foreigner === true;
  const idCard = foreigner ? '' : digitsOnly(r.idCard).slice(0, 13);
  const nationality = foreigner ? clip(r.nationality, 60) : '';
  const passportNo = foreigner ? normalizePassport(r.passportNo) : '';
  const passportExpiry = foreigner && typeof r.passportExpiry === 'string' ? r.passportExpiry : '';
  const gender = oneOf(r.gender, GENDERS);
  const birthDate = typeof r.birthDate === 'string' ? r.birthDate : '';
  const age = ageFromBirthDate(birthDate);
  const bloodType = oneOf(r.bloodType, BLOOD_TYPES);
  const medicalConditions = clip(r.medicalConditions, 200) || 'ไม่มี';
  const emergencyName = clip(r.emergencyName, 80);
  const relationship = oneOf(r.relationship, RELATIONSHIPS);
  const emergencyPhone = digitsOnly(r.emergencyPhone).slice(0, 15);
  const beneficiaryName = clip(r.beneficiaryName, 80);
  const beneficiaryRelationship = oneOf(r.beneficiaryRelationship, RELATIONSHIPS);

  const errors: string[] = [];
  if (!prefix) errors.push('กรุณาเลือกคำนำหน้า');
  if (firstName.length < 1) errors.push('กรุณากรอกชื่อ');
  if (lastName.length < 1) errors.push('กรุณากรอกนามสกุล');
  if (foreigner) {
    if (!nationality) errors.push('กรุณาเลือกสัญชาติ');
    if (!isValidPassport(passportNo)) errors.push('เลขพาสปอร์ตไม่ถูกต้อง (ตัวอักษร/ตัวเลข 6-20 ตัว)');
    if (!isFutureIsoDate(passportExpiry)) errors.push('วันหมดอายุพาสปอร์ตไม่ถูกต้อง หรือหมดอายุแล้ว');
  } else if (!isValidThaiId(idCard)) errors.push('เลขบัตรประชาชนผู้เอาประกันไม่ถูกต้อง (13 หลัก)');
  if (!gender) errors.push('กรุณาเลือกเพศ');
  if (age === null || age < 0 || age > 110) errors.push('วัน/เดือน/ปีเกิด (ค.ศ.) ไม่ถูกต้อง');
  if (!bloodType) errors.push('กรุณาเลือกกรุ๊ปเลือด');
  if (emergencyName.length < 2) errors.push('กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน');
  if (!relationship) errors.push('กรุณาเลือกความสัมพันธ์กับผู้ติดต่อฉุกเฉิน');
  if (emergencyPhone.length < 9) errors.push('เบอร์โทรผู้ติดต่อฉุกเฉินไม่ถูกต้อง');
  if (beneficiaryName.length < 2) errors.push('กรุณากรอกชื่อผู้รับผลประโยชน์');
  if (!beneficiaryRelationship) errors.push('กรุณาเลือกความสัมพันธ์กับผู้รับผลประโยชน์');
  if (consent !== true) errors.push('กรุณายินยอมให้ส่งข้อมูลสุขภาพ/ประกันให้บริษัทประกัน');
  if (errors.length) return { ok: false, error: errors.join(' · ') };

  return {
    ok: true,
    value: {
      prefix, firstName, lastName, idCard, gender, birthDate, age: age as number, bloodType, medicalConditions, emergencyName, relationship, emergencyPhone, beneficiaryName, beneficiaryRelationship,
      ...(foreigner ? { foreigner: true, nationality, passportNo, passportExpiry } : {}),
    },
  };
}
