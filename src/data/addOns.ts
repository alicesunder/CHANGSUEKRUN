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

export const formatBaht = (n: number): string => n.toLocaleString('th-TH');
