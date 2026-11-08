/**
 * What an order includes, one entry per thing bought (run, GA ticket, VIP table, each add-on activity),
 * with when / where. Used by the A4 e-ticket (documents.tsx) and by the ticket e-mail (mailer.ts) so both say the same.
 * Texts are plain (not HTML-escaped); callers escape them.
 */
import { VIP_TABLE_SEATS, calcTicketTotal, concertPassPrice, eventInfo, formatBaht, routesData, ticketById, vipTablePrice } from '../src/data/eventData';
import { TOWER_GUN_HOURS } from '../src/data/addOns';
import { ACTIVITY_LOCATIONS, locationTitle } from '../src/data/activityLocations';
import { VIP_PARKING_PER_TABLE } from '../src/data/vipParking';
import type { RouteId } from '../src/types';
import type { StoredOrder } from './store';

export const RACE_DAY = '9 ม.ค. 2570';
export const ACT_DAY = '10 ม.ค. 2570';

export interface Entitlement {
  icon: string;
  /** icon tile colour */
  bg: string;
  title: string;
  sub: string;
  /** quantity lines (joined with a line break by the caller) */
  qty: string[];
  date: string;
  time?: string;
  place: string;
}

export interface PriceLine {
  name: string;
  amount: number;
}

const RUN_ROUTES = new Set(['10km', '5km', '3km', '1km']);

export function isRunOrder(o: StoredOrder): boolean {
  return o.ticketType !== 'CONCERT' && o.ticketType !== 'ADDON' && RUN_ROUTES.has(o.routeId);
}

export function ticketEntitlements(o: StoredOrder): Entitlement[] {
  const isRun = isRunOrder(o);
  const start = isRun ? routesData[o.routeId as keyof typeof routesData]?.startTime || '' : '';
  const dog = isRun && o.runningWithDog ? o.dogName || '' : '';
  const shirts = (isRun ? [o.shirtSize, ...(o.extraRunners || []).map((r) => r.shirtSize)] : []).filter(Boolean);
  const out: Entitlement[] = [];
  if (isRun) {
    const people = o.peopleCount || 1;
    out.push({
      icon: dog ? '🐶' : '🏃',
      bg: '#FFE9A6',
      title: `วิ่ง ${ticketById(o.routeId).name}`,
      sub: `${people} คน${o.runningWithDog ? ` + น้องหมา ${o.dogCount || 1} ตัว` : ''}${shirts.length ? ` · ไซส์เสื้อ ${shirts.join(', ')}` : ''}`,
      qty: [`${people} คน`, ...(o.runningWithDog ? [`+ น้องหมา ${o.dogCount || 1} ตัว`] : [])],
      date: RACE_DAY,
      time: start ? `ปล่อยตัว ${start}` : undefined,
      place: eventInfo.venueShort,
    });
  }
  if (o.concertQty) {
    out.push({ icon: '🎤', bg: '#E9D5FF', title: 'ตั๋วคอนเสิร์ต (GA)', sub: 'ยืนชมคอนเสิร์ต', qty: [`${o.concertQty} ใบ`], date: RACE_DAY, time: '18.00–24.00 น.', place: eventInfo.venueShort });
  }
  if (o.vipTables) {
    const passes = o.vipTables * VIP_PARKING_PER_TABLE;
    const placed = (o.parkingPlates || []).length;
    out.push({
      icon: '👑',
      bg: '#2A1450',
      title: 'VIP TABLE',
      sub: `โต๊ะวีไอพีชมคอนเสิร์ต · บัตรจอดรถ VIP ${passes} ใบ (ลงทะเบียนรถแล้ว ${placed})`,
      qty: [`${o.vipTables} โต๊ะ`, `(${o.vipTables * VIP_TABLE_SEATS} ท่าน)`],
      date: RACE_DAY,
      time: '18.00–24.00 น.',
      place: eventInfo.venueShort,
    });
  }
  if (o.addOns) {
    const acts = [
      o.addOns.tower ? { key: 'tower', icon: '🗼', bg: '#DDD6FE', title: 'หอสูง', sub: 'กิจกรรมโดดหอสูง 34 ฟุต', time: TOWER_GUN_HOURS } : null,
      o.addOns.gun && o.addOns.gun !== 'none' ? { key: 'gun', icon: '🔫', bg: '#FDE68A', title: o.addOns.gun === 'premium' ? 'ยิงปืนยาว' : 'ยิงปืนสั้น', sub: 'ปืน + กระสุน 10 นัด ที่สนามยิงปืน', time: TOWER_GUN_HOURS } : null,
      o.addOns.windTunnel ? { key: 'wind', icon: '🌪️', bg: '#BAE6FD', title: 'อุโมงค์ลม', sub: 'อุโมงค์ลมชัยจินดา (Wind Tunnel)' } : null,
    ].filter(Boolean) as { key: 'tower' | 'gun' | 'wind'; icon: string; bg: string; title: string; sub: string; time?: string }[];
    if (!acts.length) acts.push({ key: 'tower', icon: '⭐', bg: '#DDD6FE', title: o.addOns.label, sub: '' });
    for (const a of acts) {
      const loc = ACTIVITY_LOCATIONS.find((l) => l.id === a.key);
      out.push({ icon: a.icon, bg: a.bg, title: a.title, sub: a.sub, qty: [`${o.addOns.people} คน`], date: ACT_DAY, time: a.time, place: loc ? locationTitle(loc) : eventInfo.venueShort });
    }
  }
  return out;
}

/** Price lines, only when they add up to exactly what was charged (sponsor / test / older orders: null → show just the total). */
export function priceLines(o: StoredOrder): PriceLine[] | null {
  const isRun = isRunOrder(o);
  const earlyBird = Boolean(o.earlyBird);
  const lines: PriceLine[] = [];
  if (isRun) lines.push({ name: `ค่าสมัครวิ่ง ${ticketById(o.routeId).name}${o.runningWithDog ? ` (น้องหมา ${o.dogCount || 1} ตัว)` : ''}`, amount: calcTicketTotal(o.routeId as RouteId, o.extraPeople || 0, o.extraDogs || 0, earlyBird) });
  if (o.concertQty) lines.push({ name: `ตั๋วคอนเสิร์ต GA × ${o.concertQty}`, amount: concertPassPrice(earlyBird) * o.concertQty });
  if (o.vipTables) lines.push({ name: `VIP TABLE × ${o.vipTables} โต๊ะ (${o.vipTables * VIP_TABLE_SEATS} ท่าน)`, amount: vipTablePrice(earlyBird) * o.vipTables });
  const off = (o.concertDiscount || 0) + (o.runDiscount || 0) + (o.addOns?.discount || 0);
  if (o.addOns) lines.push({ name: `กิจกรรมเสริม: ${o.addOns.label} × ${o.addOns.people} คน`, amount: o.addOns.total + (o.addOns.discount || 0) });
  if (off > 0) lines.push({ name: `ส่วนลดซื้อหลายอย่าง${o.discountRate ? ` ${Math.round(o.discountRate * 100)}%` : ''}`, amount: -off });
  const sum = lines.reduce((t, l) => t + l.amount, 0);
  return o.paymentMethod !== 'SPONSOR_CODE' && !o.isTest && lines.length > 0 && sum === o.totalPrice ? lines : null;
}
