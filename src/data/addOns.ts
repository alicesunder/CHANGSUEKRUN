// กิจกรรมเสริมพร้อมงานวิ่งสุนัข — ข้อมูลสำหรับหน้าเว็บรับสมัคร
// (ที่มา: เอกสาร "ข้อมูลกิจกรรมเสริม งานวิ่งสุนัข")

export type AddOnId = 'tower' | 'gun-standard' | 'gun-premium' | 'wind-tunnel';

export interface AddOnActivity {
  id: AddOnId;
  name: string;
  price: number;
  detail: string;
  /** Optional struck-through regular price */
  regularPrice?: number;
  /** Small highlighted note (e.g. participant limit) */
  badge?: string;
}

export const ADD_ON_TEASER =
  'เพิ่มความมันส์วันที่ 10 ม.ค.! ซื้อรวมกันยิ่งคุ้ม: ซื้อ 2 อย่างลด 10% · 3 อย่างลด 15% · 4–5 อย่างลด 20% (นับ ตั๋ววิ่ง / คอนเสิร์ต / หอสูง / ยิงปืน / อุโมงค์ลม อย่างละ 1) อุโมงค์ลมจำกัด 60 ท่านเท่านั้น';

export const ADD_ON_ACTIVITIES: AddOnActivity[] = [
  {
    id: 'tower',
    name: 'หอสูง',
    price: 350,
    detail: 'มีครูฝึกดูแลตลอดกิจกรรม ผู้ร่วมกิจกรรมได้รับใบประกาศ/ปีก',
    badge: 'เปิด 09.00–12.00 น.',
  },
  {
    id: 'gun-standard',
    name: 'ยิงปืนสั้น',
    price: 490,
    detail: 'ปืนสั้น + กระสุน 10 นัด เลือกได้ 1 กระบอก พร้อมครูฝึกส่วนตัว',
    badge: 'เปิด 09.00–12.00 น.',
  },
  {
    id: 'gun-premium',
    name: 'ยิงปืนยาว',
    price: 890,
    detail: 'ปืนยาว + กระสุน 10 นัด เลือกได้ 1 กระบอก พร้อมครูฝึกส่วนตัว',
    badge: 'เปิด 09.00–12.00 น.',
  },
  {
    id: 'wind-tunnel',
    name: 'อุโมงค์ลม',
    price: 990,
    detail: 'เปิดรับสมัครล่วงหน้า',
    badge: 'จำกัดสูงสุด 60 คน',
  },
];

/** Opening hours of the tower and the shooting range (shown on the cards and in the tickets). */
export const TOWER_GUN_HOURS = '09.00–12.00 น.';

export const GUN_NOTE = 'ราคาครอบคลุมอุปกรณ์และบริการทั้งหมด พร้อมครูฝึกส่วนตัวให้คำแนะนำอย่างใกล้ชิด';

export interface GunGroup {
  title: string;
  guns: string[];
}

/** Short guns (price: SHORT_GUN_PRICE with 10 rounds): choose 1. */
export const SHORT_GUNS: string[] = [
  'Glock 17 (9mm)',
  'SIG P250 (.45 ACP)',
  'Glock 19 (9mm)',
  'SIG P365 (9mm)',
  'SIG P320 (9mm)',
  'CZ 75D (9mm)',
  'CZ 97B (.45 ACP)',
  'Para-Ordnance / Dawson Jarrett (.45 ACP)',
  'Glock 21 (.45 ACP)',
  'Smith & Wesson Revolver (.22 LR)',
  'Smith & Wesson Revolver (.38 Special)',
  'Walther P22 (.22 LR)',
];

/** Long guns (price: LONG_GUN_PRICE with 10 rounds): choose 1. */
export const LONG_GUNS: string[] = [
  'HK UMP (.45 ACP) พร้อม Red dot และ Suppressor',
  'KRISS Vector Super V (.45 ACP) พร้อม Red dot',
  'HK MP5 SD (9mm) พร้อม Red dot และ Suppressor',
  'Colt M4 (.22 LR Conversion) พร้อม Red dot',
];

// ---------------------------------------------------------------------------
// Selection + pricing (shared by the website and the server — the server is the one that decides)
// ---------------------------------------------------------------------------
export type GunLevel = 'none' | 'standard' | 'premium';

/** What ONE person does (a Dog Run ticket can have extra runners and each picks for themself). */
export interface AddOnPerson {
  tower: boolean;
  gun: GunLevel;
  windTunnel: boolean;
}

export interface AddOnSelection {
  /** tower / gun / windTunnel below are the union over everybody: "somebody does it" (gun = 'premium' when anyone takes the long gun) */
  tower: boolean;
  gun: GunLevel;
  windTunnel: boolean;
  /** how many people take part in at least one activity */
  people: number;
  /** one entry per runner (index = runner number, an empty entry = that runner takes no activity). Missing = everybody does the same set. */
  persons?: AddOnPerson[];
}

export const EMPTY_PERSON: AddOnPerson = { tower: false, gun: 'none', windTunnel: false };
export const personHasAny = (p: AddOnPerson): boolean => p.tower || p.gun !== 'none' || p.windTunnel;

/** The per-person view of a selection (old orders without `persons`: `people` persons, all with the same set). */
export function personsOf(s: AddOnSelection): AddOnPerson[] {
  if (s.persons && s.persons.length) return s.persons;
  return Array.from({ length: Math.max(1, s.people) }, () => ({ tower: s.tower, gun: s.gun, windTunnel: s.windTunnel }));
}

/** People who need a tower or wind-tunnel waiver (the shooters sign the shooting rules instead). */
export const waiverPeopleCount = (s: AddOnSelection): number => personsOf(s).filter((p) => p.tower || p.windTunnel).length;

/** Union selection from the per-person list. */
export function fromPersons(persons: AddOnPerson[]): AddOnSelection {
  const taking = persons.filter(personHasAny);
  const gun: GunLevel = taking.some((p) => p.gun === 'premium') ? 'premium' : taking.some((p) => p.gun === 'standard') ? 'standard' : 'none';
  return {
    tower: taking.some((p) => p.tower),
    gun,
    windTunnel: taking.some((p) => p.windTunnel),
    people: Math.max(1, taking.length),
    persons,
  };
}

/** How many people take each activity. */
export function addOnCounts(s: AddOnSelection): { tower: number; gunShort: number; gunLong: number; wind: number; people: number } {
  const ps = personsOf(s);
  return {
    tower: ps.filter((p) => p.tower).length,
    gunShort: ps.filter((p) => p.gun === 'standard').length,
    gunLong: ps.filter((p) => p.gun === 'premium').length,
    wind: ps.filter((p) => p.windTunnel).length,
    people: ps.filter(personHasAny).length,
  };
}

export const EMPTY_ADD_ONS: AddOnSelection = { tower: false, gun: 'none', windTunnel: false, people: 1 };
export const MAX_ADD_ON_PEOPLE = 9;
export const WIND_TUNNEL_LIMIT = 60;

export const SHORT_GUN_PRICE = 490;
export const LONG_GUN_PRICE = 890;
const SINGLE_PRICES = { tower: 350, standard: SHORT_GUN_PRICE, premium: LONG_GUN_PRICE, windTunnel: 990 };

/** Early bird (admin switch) no longer cuts the activity prices (it is 0 baht); only run / concert tickets get the early-bird price. */
export const EARLY_BIRD_ACTIVITY_OFF = 0;

export const hasAddOns = (s: AddOnSelection): boolean => s.tower || s.gun !== 'none' || s.windTunnel;

/** Per-person price: the activities simply add up (the discount comes from the basket, see priceBasket). */
export function addOnPricePerPerson(s: AddOnPerson | AddOnSelection, _earlyBird = false): number {
  return (
    (s.tower ? SINGLE_PRICES.tower : 0) +
    (s.gun === 'standard' ? SINGLE_PRICES.standard : s.gun === 'premium' ? SINGLE_PRICES.premium : 0) +
    (s.windTunnel ? SINGLE_PRICES.windTunnel : 0)
  );
}

/** Total before any discount: every person's own activities added up. */
export function addOnGross(s: AddOnSelection): number {
  return hasAddOns(s) ? personsOf(s).reduce((t, p) => t + addOnPricePerPerson(p), 0) : 0;
}

// ---------------------------------------------------------------------------
// Basket discount (none applies with a sponsor code). Every kind of thing in the basket counts as ONE item:
//   run ticket · concert (GA and / or VIP table) · tower · shooting · wind tunnel   → at most 5 items
//   2 items → 10% off · 3 items → 15% off · 4 or 5 items → 20% off — taken off the whole basket.
// ---------------------------------------------------------------------------
export const BASKET_TIERS: { items: number; rate: number }[] = [
  { items: 2, rate: 0.1 },
  { items: 3, rate: 0.15 },
  { items: 4, rate: 0.2 },
];
export const BASKET_MAX_RATE = 0.2;
export const BASKET_MAX_ITEMS = 5;

export const percentOf = (rate: number): number => Math.round(rate * 100);

/** How many of the three activities are chosen (tower, shooting, wind tunnel). */
export function activityCount(s: AddOnSelection): number {
  return (s.tower ? 1 : 0) + (s.gun !== 'none' ? 1 : 0) + (s.windTunnel ? 1 : 0);
}

export function basketRate(items: number): number {
  let rate = 0;
  for (const t of BASKET_TIERS) if (items >= t.items) rate = t.rate;
  return rate;
}

export interface BasketInput {
  /** price of the run ticket(s) incl. extra runners; 0 when there is no run */
  runGross: number;
  hasRun: boolean;
  gaUnit: number;
  gaQty: number;
  vipUnit: number;
  vipTables: number;
  addOns: AddOnSelection;
  /** a sponsor code turns the discount off */
  sponsor?: boolean;
}

export interface BasketPrice {
  items: number;
  rate: number;
  runGross: number;
  runOff: number;
  gaGross: number;
  gaOff: number;
  vipGross: number;
  vipOff: number;
  addGross: number;
  addOff: number;
  /** after discount */
  total: number;
  saved: number;
}

/** The one place that prices a basket (the website shows it, the server charges it). Each part is rounded to whole baht. */
export function priceBasket(i: BasketInput): BasketPrice {
  const hasConcert = i.gaQty > 0 || i.vipTables > 0;
  const items = (i.hasRun ? 1 : 0) + (hasConcert ? 1 : 0) + activityCount(i.addOns);
  const rate = i.sponsor ? 0 : basketRate(items);
  const off = (n: number) => Math.round(n * rate);
  const gaGross = i.gaUnit * i.gaQty;
  const vipGross = i.vipUnit * i.vipTables;
  const addGross = addOnGross(i.addOns);
  const runOff = off(i.runGross);
  const gaOff = off(gaGross);
  const vipOff = off(vipGross);
  const addOff = off(addGross);
  const saved = runOff + gaOff + vipOff + addOff;
  return { items, rate, runGross: i.runGross, runOff, gaGross, gaOff, vipGross, vipOff, addGross, addOff, total: i.runGross + gaGross + vipGross + addGross - saved, saved };
}

export function addOnLabel(s: AddOnSelection): string {
  const parts: string[] = [];
  if (s.tower) parts.push('หอสูง');
  if (s.gun === 'standard') parts.push('ยิงปืนสั้น');
  if (s.gun === 'premium') parts.push('ยิงปืนยาว');
  if (s.windTunnel) parts.push('อุโมงค์ลม');
  return parts.join(' + ');
}

/** Cleans whatever the browser sent into a valid selection (never trusts it). */
export function normalizeAddOns(raw: unknown): AddOnSelection {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const cleanPerson = (x: unknown): AddOnPerson => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    return { tower: o.tower === true, gun: o.gun === 'standard' || o.gun === 'premium' ? o.gun : 'none', windTunnel: o.windTunnel === true };
  };
  if (Array.isArray(r.persons) && r.persons.length) {
    const persons = r.persons.slice(0, MAX_ADD_ON_PEOPLE).map(cleanPerson);
    const sel = fromPersons(persons);
    return personHasAnyList(persons) ? sel : { ...EMPTY_ADD_ONS };
  }
  const gun: GunLevel = r.gun === 'standard' || r.gun === 'premium' ? r.gun : 'none';
  const sel: AddOnSelection = {
    tower: r.tower === true,
    gun,
    windTunnel: r.windTunnel === true,
    people: Math.min(MAX_ADD_ON_PEOPLE, Math.max(1, Math.floor(Number(r.people) || 1))),
  };
  return hasAddOns(sel) ? sel : { ...EMPTY_ADD_ONS };
}

const personHasAnyList = (ps: AddOnPerson[]): boolean => ps.some(personHasAny);

export const formatBaht = (n: number): string => n.toLocaleString('th-TH');
