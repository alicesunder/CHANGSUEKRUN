// VIP table perk: parking for 2 cars per table. The buyer registers the plates; each plate gets a
// parking pass with a QR code that staff scan at the VIP car park.

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
