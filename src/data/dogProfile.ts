// Details of the dog that runs with the owner (Dog Run tickets). Shared by the form and the server.

export const DOG_GENDERS = ['ผู้', 'เมีย'] as const;
export const DOG_SIZES = ['ตัวเล็ก', 'ตัวกลาง', 'ตัวใหญ่'] as const;
export const DOG_NEUTERED = ['ทำหมันแล้ว', 'ยังไม่ได้ทำ'] as const;
export const DOG_VACCINES = ['ฉีดวัคซีนครบแล้ว', 'ถึงกำหนดฉีดกระตุ้น', 'ไม่แน่ใจ'] as const;
export const DOG_TEMPERAMENTS = ['เข้ากับทุกคนได้', 'ตื่นคนเยอะ', 'ขอพื้นที่หน่อย'] as const;

export interface DogProfile {
  name: string;
  breed: string;
  /** birth year (ค.ศ.), roughly is fine */
  birthYear: number;
  gender: string;
  weightKg: number;
  size: string;
  neutered: string;
  vaccine: string;
  /** food / medicine allergies; empty when none */
  allergies: string;
  temperament: string;
}

export const emptyDogProfile = (): DogProfile => ({
  name: '',
  breed: '',
  birthYear: 0,
  gender: '',
  weightKg: 0,
  size: '',
  neutered: '',
  vaccine: '',
  allergies: '',
  temperament: '',
});

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) : '');
const oneOf = (v: unknown, list: readonly string[]) => (typeof v === 'string' && list.includes(v) ? v : '');

/** What is still missing in the form (Thai labels), empty when complete. */
export function dogProfileProblems(d: DogProfile, thisYear = new Date().getFullYear()): string[] {
  const out: string[] = [];
  if (d.name.trim().length < 1) out.push('ชื่อน้องสุนัข');
  if (d.breed.trim().length < 1) out.push('สายพันธุ์');
  if (!Number.isInteger(d.birthYear) || d.birthYear < thisYear - 30 || d.birthYear > thisYear) out.push('ปีเกิดน้อง');
  if (!d.gender) out.push('เพศน้อง');
  if (!(d.weightKg > 0 && d.weightKg <= 120)) out.push('น้ำหนักน้อง');
  if (!d.size) out.push('ขนาดน้อง');
  if (!d.neutered) out.push('ทำหมันแล้วหรือยัง');
  if (!d.vaccine) out.push('สถานะวัคซีน');
  if (!d.temperament) out.push('นิสัยเมื่ออยู่กับน้องหมาตัวอื่น');
  return out;
}

/** Cleans whatever the browser sent. Returns the clean data, or a Thai error message. */
export function parseDogProfile(raw: unknown, thisYear = new Date().getFullYear()): { ok: true; value: DogProfile } | { ok: false; error: string } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const value: DogProfile = {
    name: clip(r.name, 80),
    breed: clip(r.breed, 80),
    birthYear: Math.floor(Number(r.birthYear) || 0),
    gender: oneOf(r.gender, DOG_GENDERS),
    weightKg: Math.round((Number(r.weightKg) || 0) * 10) / 10,
    size: oneOf(r.size, DOG_SIZES),
    neutered: oneOf(r.neutered, DOG_NEUTERED),
    vaccine: oneOf(r.vaccine, DOG_VACCINES),
    allergies: clip(r.allergies, 200),
    temperament: oneOf(r.temperament, DOG_TEMPERAMENTS),
  };
  const missing = dogProfileProblems(value, thisYear);
  if (missing.length) return { ok: false, error: `กรุณากรอกข้อมูลน้องสุนัขให้ครบ: ${missing.join(', ')}` };
  return { ok: true, value };
}
