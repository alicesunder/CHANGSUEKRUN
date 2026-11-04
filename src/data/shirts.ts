// Jersey sizes, the extra Dog Run runners (name + size + insurance each), and the shirt count for the admin.
// Shared by the form, the server and the admin console.
import { parseInsurance, type InsuranceInfo } from './insurance';

export const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'] as const;
export type ShirtSize = (typeof SHIRT_SIZES)[number];

export interface ExtraRunner {
  name: string;
  shirtSize: ShirtSize;
  /** same details as runner 1 (orders before Nov 2026 have none) */
  insurance?: InsuranceInfo;
}

const isSize = (v: unknown): v is ShirtSize => typeof v === 'string' && (SHIRT_SIZES as readonly string[]).includes(v);
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) : '');

/** "นภา ใจดี (ไซส์ M), กานต์ ใจดี (ไซส์ XL)": the readable text kept on the order. */
export const extraRunnersText = (list: ExtraRunner[]) => list.map((r) => `${r.name} (ไซส์ ${r.shirtSize})`).join(', ');

/**
 * Cleans what the browser sent: name + size per extra runner, and (insured distances) the same
 * insurance details as runner 1. The name then comes from the insurance first + last name.
 */
export function parseExtraRunners(
  raw: unknown,
  count: number,
  withInsurance = false
): { ok: true; value: ExtraRunner[] } | { ok: false; error: string } {
  const list = Array.isArray(raw) ? raw.slice(0, count) : [];
  const out: ExtraRunner[] = [];
  const errors: string[] = [];
  for (let i = 0; i < count; i++) {
    const r = (list[i] && typeof list[i] === 'object' ? list[i] : {}) as Record<string, unknown>;
    let insurance: InsuranceInfo | undefined;
    if (withInsurance) {
      const p = parseInsurance(r.insurance, true);
      if (p.ok) insurance = p.value;
      else errors.push(`ผู้ร่วมวิ่งคนที่ ${i + 2}: ${p.error}`);
    }
    const name = insurance ? `${insurance.firstName} ${insurance.lastName}`.slice(0, 80) : clip(r.name, 80);
    if (!withInsurance && name.length < 2) errors.push(`กรุณากรอกชื่อผู้ร่วมวิ่งเพิ่มคนที่ ${i + 1}`);
    if (!isSize(r.shirtSize)) errors.push(`กรุณาเลือกไซส์เสื้อผู้ร่วมวิ่งคนที่ ${i + 2}`);
    out.push({ name, shirtSize: isSize(r.shirtSize) ? r.shirtSize : 'M', insurance });
  }
  if (errors.length) return { ok: false, error: errors.join(' · ') };
  return { ok: true, value: out };
}

export interface ShirtCountOrder {
  shirtSize?: string;
  extraPeople?: number;
  extraRunners?: ExtraRunner[];
  extraRunnerNames?: string;
}

export interface ShirtCount {
  bySize: Record<ShirtSize, number>;
  total: number;
  /** extra runners from older orders whose size could not be read from the free text */
  unknown: number;
  /** sizes read from the free text of older orders (counted in bySize, worth a check) */
  fromText: number;
}

/**
 * Counts jerseys: the main runner of every run order + each extra Dog Run runner.
 * Concert / add-on-only orders have no shirt and are not counted.
 * Older orders typed the extra runners as free text: sizes like "ไซส์ M" are read from it.
 */
export function countShirts(orders: ShirtCountOrder[]): ShirtCount {
  const bySize = Object.fromEntries(SHIRT_SIZES.map((s) => [s, 0])) as Record<ShirtSize, number>;
  let unknown = 0;
  let fromText = 0;
  for (const o of orders) {
    if (isSize(o.shirtSize)) bySize[o.shirtSize]++;
    const extra = o.extraPeople || 0;
    if (!extra) continue;
    if (o.extraRunners?.length) {
      for (const r of o.extraRunners) if (isSize(r.shirtSize)) bySize[r.shirtSize]++;
      unknown += Math.max(0, extra - o.extraRunners.length);
      continue;
    }
    const found = [...(o.extraRunnerNames || '').toUpperCase().matchAll(/(?:ไซส์|ไซซ์|SIZE)\s*:?\s*(5XL|4XL|3XL|2XL|XXXL|XXL|XS|XL|S|M|L)\b/g)]
      .map((m) => (m[1] === 'XXL' ? '2XL' : m[1] === 'XXXL' ? '3XL' : m[1]))
      .filter(isSize)
      .slice(0, extra);
    for (const s of found) bySize[s]++;
    fromText += found.length;
    unknown += extra - found.length;
  }
  const total = Object.values(bySize).reduce((a, b) => a + b, 0);
  return { bySize, total, unknown, fromText };
}
