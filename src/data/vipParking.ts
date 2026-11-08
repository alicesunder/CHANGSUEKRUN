// VIP table perk: parking for 2 cars per table. The buyer registers the plates; each plate gets a
// parking pass with a QR code that staff scan at the VIP car park.

import { isThaiProvince } from './provinces';

export const VIP_PARKING_PER_TABLE = 2;

export interface ParkingPlate {
  plate: string;
  province: string;
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n) : '');

/** Keeps the filled-in plates (at least 1, at most 2 per table). Empty rows are dropped. */
export function parseParkingPlates(raw: unknown, vipTables: number): { ok: true; value: ParkingPlate[] } | { ok: false; error: string } {
  const max = vipTables * VIP_PARKING_PER_TABLE;
  const list = Array.isArray(raw) ? raw.slice(0, max) : [];
  const plates: ParkingPlate[] = [];
  for (const item of list) {
    const r = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const plate = clip(r.plate, 16);
    const province = clip(r.province, 40);
    if (!plate && !province) continue;
    if (plate.length < 2 || province.length < 2) return { ok: false, error: 'กรุณากรอกทะเบียนรถและจังหวัดให้ครบทุกคันที่ลงทะเบียน' };
    if (!isThaiProvince(province)) return { ok: false, error: 'กรุณาเลือกจังหวัดของทะเบียนรถจากรายการ' };
    plates.push({ plate, province });
  }
  if (!plates.length) return { ok: false, error: 'กรุณากรอกทะเบียนรถอย่างน้อย 1 คัน สำหรับบัตรจอดรถ VIP' };
  const keys = plates.map((p) => `${p.plate}|${p.province}`.replace(/\s/g, ''));
  if (new Set(keys).size !== keys.length) return { ok: false, error: 'ทะเบียนรถซ้ำกัน' };
  return { ok: true, value: plates };
}

/** What staff scan at the car park gate: the order id (the scanner looks it up) and the plate. */
export function parkingQrPayload(orderId: string, p: ParkingPlate): string {
  return JSON.stringify({ orderId, type: 'VIP_PARKING', plate: `${p.plate} ${p.province}`.trim() });
}

/**
 * Adds cars to an order that already has some (a VIP table gives 2 car passes; the buyer may register the rest
 * later). Returns the full list, or a Thai error. Plates already registered are never changed or removed here.
 */
export function addParkingPlates(
  existing: ParkingPlate[],
  raw: unknown,
  vipTables: number
): { ok: true; value: ParkingPlate[]; added: ParkingPlate[] } | { ok: false; error: string } {
  const max = vipTables * VIP_PARKING_PER_TABLE;
  const room = max - existing.length;
  if (room <= 0) return { ok: false, error: 'ลงทะเบียนรถครบตามสิทธิ์แล้ว' };
  if (Array.isArray(raw) && raw.filter((x) => x && typeof x === 'object' && ((x as any).plate || (x as any).province)).length > room) return { ok: false, error: `ลงทะเบียนเพิ่มได้อีก ${room} คันเท่านั้น` };
  const list = Array.isArray(raw) ? raw.slice(0, room) : [];
  const added: ParkingPlate[] = [];
  for (const item of list) {
    const r = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const plate = clip(r.plate, 16);
    const province = clip(r.province, 40);
    if (!plate && !province) continue;
    if (plate.length < 2 || province.length < 2) return { ok: false, error: 'กรุณากรอกทะเบียนรถและจังหวัดให้ครบทุกคัน' };
    if (!isThaiProvince(province)) return { ok: false, error: 'กรุณาเลือกจังหวัดของทะเบียนรถจากรายการ' };
    added.push({ plate, province });
  }
  if (!added.length) return { ok: false, error: 'กรุณากรอกทะเบียนรถอย่างน้อย 1 คัน' };
  const key = (p: ParkingPlate) => `${p.plate}|${p.province}`.replace(/\s/g, '');
  const all = [...existing, ...added];
  if (new Set(all.map(key)).size !== all.length) return { ok: false, error: 'ทะเบียนรถซ้ำกัน' };
  return { ok: true, value: all, added };
}
