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
  'เพิ่มความมันส์หลังวิ่ง! สมัครกิจกรรมเสริมพร้อมงานวิ่งสุนัข ซื้อเป็นแพ็กเกจคุ้มกว่า เริ่มต้น 1,190 บาท หรือครบทุกกิจกรรมเพียง 1,990 บาท อุโมงค์ลมจำกัด 60 ท่านเท่านั้น';

export const ADD_ON_ACTIVITIES: AddOnActivity[] = [
  {
    id: 'tower',
    name: 'หอสูง',
    price: 350,
    detail: 'มีครูฝึกดูแลตลอดกิจกรรม ผู้ร่วมกิจกรรมได้รับใบประกาศ/ปีก',
  },
  {
    id: 'gun-standard',
    name: 'ยิงปืน Standard',
    price: 890,
    detail: 'ยิง 10 นัด เลือกได้ 1 กระบอก พร้อมครูฝึกส่วนตัว',
  },
  {
    id: 'gun-premium',
    name: 'ยิงปืน Premium',
    price: 1950,
    regularPrice: 2200,
    detail: 'เลือกสัมผัสปืน HK UMP / KRISS / MP5 SD ยิง 10 นัด',
  },
  {
    id: 'wind-tunnel',
    name: 'อุโมงค์ลม',
    price: 990,
    detail: 'เปิดรับสมัครล่วงหน้า',
    badge: 'จำกัดสูงสุด 60 คน',
  },
];

export interface AddOnPackage {
  name: string;
  price: number;
  /** Savings vs. buying separately, in baht */
  saving?: number;
  /** Difference from the Standard version of the same package */
  upgradeDiff?: number;
}

export const STANDARD_PACKAGES: AddOnPackage[] = [
  { name: 'หอสูง + ยิงปืน Standard', price: 1190, saving: 50 },
  { name: 'หอสูง + อุโมงค์ลม', price: 1190, saving: 150 },
  { name: 'ยิงปืน Standard + อุโมงค์ลม', price: 1690, saving: 190 },
];

export const FULL_EXPERIENCE = {
  title: 'FULL EXPERIENCE',
  subtitle: 'ครบ 3 กิจกรรม',
  includes: ['หอสูง', 'ยิงปืน Standard 10 นัด', 'อุโมงค์ลม'],
  price: 1990,
  saving: 240,
  separatePrice: 2230,
};

export const PREMIUM_UPGRADE = {
  extra: 1060,
  packages: [
    { name: 'หอสูง + ยิงปืน Premium', price: 2250, upgradeDiff: 1060 },
    { name: 'ยิงปืน Premium + อุโมงค์ลม', price: 2750, upgradeDiff: 1060 },
    { name: 'ครบ 3 กิจกรรม + ยิงปืน Premium', price: 3050, upgradeDiff: 1060 },
  ] as AddOnPackage[],
};

export const GUN_NOTE = 'ราคาครอบคลุมอุปกรณ์และบริการทั้งหมด พร้อมครูฝึกส่วนตัวให้คำแนะนำอย่างใกล้ชิด';

export interface GunGroup {
  title: string;
  guns: string[];
}

export const STANDARD_GUNS: GunGroup[] = [
  {
    title: 'ปืนพก',
    guns: [
      'Glock 17 (9mm)',
      'SIG P250 (.45 ACP)',
      'Glock 19 (9mm)',
      'SIG P365 (9mm)',
      'SIG P320 (9mm)',
      'CZ 75D (9mm)',
      'CZ 97B (.45 ACP)',
      'Para-Ordnance / Dawson Jarrett (.45 ACP)',
      'Glock 21 (.45 ACP)',
    ],
  },
  {
    title: 'ปืนลูกโม่และปืน .22',
    guns: [
      'Smith & Wesson Revolver (.22 LR)',
      'Smith & Wesson Revolver (.38 Special)',
      'Walther P22 (.22 LR)',
    ],
  },
  {
    title: 'ปืนยาว',
    guns: ['Colt M4 (.22 LR Conversion) พร้อม Red dot'],
  },
];

export const RED_DOT_UPGRADE = {
  price: 100,
  models: 'Glock 19 และ SIG P320',
};

export const PREMIUM_GUNS: string[] = [
  'HK UMP (.45 ACP) พร้อม Red dot และ Suppressor',
  'KRISS Vector Super V (.45 ACP) พร้อม Red dot',
  'HK MP5 SD (9mm) พร้อม Red dot และ Suppressor',
];

// ---------------------------------------------------------------------------
// Selection + pricing (shared by the website and the server — the server is the one that decides)
// ---------------------------------------------------------------------------
export type GunLevel = 'none' | 'standard' | 'premium';

export interface AddOnSelection {
  tower: boolean;
  gun: GunLevel;
  windTunnel: boolean;
  /** how many people join the add-on activities (price is per person) */
  people: number;
}

export const EMPTY_ADD_ONS: AddOnSelection = { tower: false, gun: 'none', windTunnel: false, people: 1 };
export const MAX_ADD_ON_PEOPLE = 9;
export const WIND_TUNNEL_LIMIT = 60;

/** Per-person price of every allowed combination (T = tower, S/P = shooting Standard/Premium, W = wind tunnel). */
const COMBO_PRICES: Record<string, number> = {
  T: 350,
  S: 890,
  P: 1950,
  W: 990,
  TS: 1190,
  TW: 1190,
  SW: 1690,
  TSW: 1990,
  TP: 2250,
  PW: 2750,
  TPW: 3050,
};

const SINGLE_PRICES = { tower: 350, standard: 890, premium: 1950, windTunnel: 990 };

export const hasAddOns = (s: AddOnSelection): boolean => s.tower || s.gun !== 'none' || s.windTunnel;

function comboKey(s: AddOnSelection): string {
  return (s.tower ? 'T' : '') + (s.gun === 'standard' ? 'S' : s.gun === 'premium' ? 'P' : '') + (s.windTunnel ? 'W' : '');
}

/** Per-person price (package price when the combination has one). */
export function addOnPricePerPerson(s: AddOnSelection): number {
  return COMBO_PRICES[comboKey(s)] ?? 0;
}

/** What the same activities would cost bought one by one, per person. */
export function addOnSeparatePerPerson(s: AddOnSelection): number {
  return (
    (s.tower ? SINGLE_PRICES.tower : 0) +
    (s.gun === 'standard' ? SINGLE_PRICES.standard : s.gun === 'premium' ? SINGLE_PRICES.premium : 0) +
    (s.windTunnel ? SINGLE_PRICES.windTunnel : 0)
  );
}

export function addOnSavingPerPerson(s: AddOnSelection): number {
  return Math.max(0, addOnSeparatePerPerson(s) - addOnPricePerPerson(s));
}

export function addOnTotal(s: AddOnSelection): number {
  return hasAddOns(s) ? addOnPricePerPerson(s) * s.people : 0;
}

export function addOnLabel(s: AddOnSelection): string {
  const parts: string[] = [];
  if (s.tower) parts.push('หอสูง');
  if (s.gun === 'standard') parts.push('ยิงปืน Standard');
  if (s.gun === 'premium') parts.push('ยิงปืน Premium');
  if (s.windTunnel) parts.push('อุโมงค์ลม');
  return parts.join(' + ');
}

/** Cleans whatever the browser sent into a valid selection (never trusts it). */
export function normalizeAddOns(raw: unknown): AddOnSelection {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const gun: GunLevel = r.gun === 'standard' || r.gun === 'premium' ? r.gun : 'none';
  const sel: AddOnSelection = {
    tower: r.tower === true,
    gun,
    windTunnel: r.windTunnel === true,
    people: Math.min(MAX_ADD_ON_PEOPLE, Math.max(1, Math.floor(Number(r.people) || 1))),
  };
  return hasAddOns(sel) ? sel : { ...EMPTY_ADD_ONS };
}

/** One-tap bundles shown on the page (they just fill in the selection). */
export const QUICK_BUNDLES: { id: string; label: string; selection: Omit<AddOnSelection, 'people'> }[] = [
  { id: 'tower-std', label: 'หอสูง + ยิงปืน Standard', selection: { tower: true, gun: 'standard', windTunnel: false } },
  { id: 'tower-wind', label: 'หอสูง + อุโมงค์ลม', selection: { tower: true, gun: 'none', windTunnel: true } },
  { id: 'std-wind', label: 'ยิงปืน Standard + อุโมงค์ลม', selection: { tower: false, gun: 'standard', windTunnel: true } },
  { id: 'full', label: 'FULL EXPERIENCE ครบ 3 กิจกรรม', selection: { tower: true, gun: 'standard', windTunnel: true } },
];

export const formatBaht = (n: number): string => n.toLocaleString('th-TH');
