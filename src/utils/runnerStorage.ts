import { RouteId } from '../types';
import {
  encryptStoragePayload,
  decryptStoragePayload,
  sanitizeUserInput,
  sanitizeCsvCell,
  maskPhoneNumber,
  maskEmailAddress,
  appendSecurityAuditLog,
} from './securityShield';

export type PaymentVerificationStatus =
  | 'AWAITING_PAYMENT'
  | 'AUTO_VERIFIED'
  | 'ADMIN_APPROVED'
  | 'PENDING_REVIEW'
  | 'REJECTED';

export interface RunnerProfile {
  orderId?: string;
  fullName: string;
  phone: string;
  email: string;
  emergencyPhone: string;
  routeId: RouteId;
  routeName: string;
  bibNumber: string;
  shirtSize: string;
  runningWithDog: boolean;
  dogBreed?: string;
  dogName?: string;
  extraPeople?: number;
  extraDogs?: number;
  extraRunnerNames?: string;
  totalPrice?: number;
  paymentMethod?: 'PROMPTPAY_QR';
  paymentStatus?: 'PAID' | 'PENDING';
  paymentRef?: string;
  senderBank?: string;
  slipImageDataUrl?: string;
  slipHash?: string;
  transferDurationSec?: number;
  verificationStatus?: PaymentVerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  kitStatus?: 'PENDING_PICKUP' | 'CHECKED_IN';
  registrationStatus: 'REGISTERED' | 'CONFIRMED' | 'CHECKED_IN';
  createdAt: string;
}

export interface TicketOrder extends RunnerProfile {
  orderId: string;
  totalPrice: number;
  peopleCount: number;
  dogCount: number;
  paymentMethod: 'PROMPTPAY_QR';
  paymentStatus: 'PAID' | 'PENDING';
  paymentRef: string;
  senderBank: string;
  slipImageDataUrl?: string;
  slipHash?: string;
  transferDurationSec: number;
  verificationStatus: PaymentVerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  kitStatus: 'PENDING_PICKUP' | 'CHECKED_IN';
}

export interface PromptPayConfig {
  promptPayId: string;
  accountName: string;
  bankLabel: string;
  bankAccountNo?: string;
  paymentTimeoutMinutes: number;
  requireSlipVerification: boolean;
  adminUsername: string;
  adminPassword: string;
  adminPin: string;
  showAdminLoginHint?: boolean;
  sessionIdleTimeoutMinutes?: number;
}

export type BibCounters = Record<RouteId, number>;

export interface RunnerChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  category: 'prep' | 'kit' | 'race_day';
}

export const RUNNER_PROFILE_STORAGE_KEY = 'changsuek_runner_profile';
export const RUNNER_CHECKLIST_STORAGE_KEY = 'changsuek_runner_checklist';
export const ROUTE_SIMULATION_STORAGE_KEY = 'changsuek_route_simulation_state';
export const TICKET_ORDERS_STORAGE_KEY = 'changsuek_ticket_orders_v1';
export const BIB_COUNTERS_STORAGE_KEY = 'changsuek_bib_counters_v1';
export const PROMPTPAY_CONFIG_STORAGE_KEY = 'changsuek_promptpay_config_v1';
export const ADMIN_AUTH_SESSION_KEY = 'changsuek_admin_auth_session_v1';

export const DEFAULT_PROMPTPAY_CONFIG: PromptPayConfig = {
  promptPayId: '004999254157786',
  accountName: 'ช้างศึก รัน โดย นาย กัปปน์ณัฏฐ์ กชกรนันท์ธน และ นาย เอกพัชญ์ ตันสุวรรณรัตน์',
  bankAccountNo: '2408677648',
  bankLabel: 'ธนาคารกสิกรไทย',
  paymentTimeoutMinutes: 15,
  requireSlipVerification: true,
  adminUsername: 'admin',
  adminPassword: '',
  adminPin: '',
  showAdminLoginHint: false,
  sessionIdleTimeoutMinutes: 15,
};

const ROUTE_BIB_PREFIX: Record<RouteId, string> = {
  '10km': '10',
  '5km': '05',
  '3km': '03',
  '1km': '01',
};

export function formatBibNumber(routeId: RouteId, sequenceNum: number): string {
  const prefix = ROUTE_BIB_PREFIX[routeId] || '05';
  return `${prefix}-${sequenceNum.toString().padStart(4, '0')}`;
}

export const INITIAL_SEED_ORDERS: TicketOrder[] = [
  {
    orderId: 'CSR27-0001',
    bibNumber: '10-0001',
    routeId: '10km',
    routeName: '10 KM วิ่งบุคคลทั่วไป',
    fullName: 'พ.ต.ท. กิตติพงศ์ วรโชติ',
    phone: '081-234-5678',
    emergencyPhone: '089-112-3344',
    email: 'kittipong.w@police.go.th',
    shirtSize: 'L',
    runningWithDog: false,
    peopleCount: 1,
    dogCount: 0,
    extraPeople: 0,
    extraDogs: 0,
    totalPrice: 890,
    paymentMethod: 'PROMPTPAY_QR',
    paymentStatus: 'PAID',
    paymentRef: 'KBANK-20270201-884192',
    senderBank: 'กสิกรไทย (K PLUS)',
    slipHash: 'SLIP-00A84F219B11',
    transferDurationSec: 48,
    verificationStatus: 'ADMIN_APPROVED',
    verifiedAt: '2026-10-18T09:16:00.000Z',
    verifiedBy: 'admin',
    kitStatus: 'CHECKED_IN',
    registrationStatus: 'CHECKED_IN',
    createdAt: '2026-10-18T09:15:00.000Z',
  },
  {
    orderId: 'CSR27-0002',
    bibNumber: '10-0002',
    routeId: '10km',
    routeName: '10 KM วิ่งบุคคลทั่วไป',
    fullName: 'ธนภัทร เจริญสุข',
    phone: '086-554-9012',
    emergencyPhone: '086-554-9013',
    email: 'thanapat.run@gmail.com',
    shirtSize: 'M',
    runningWithDog: false,
    peopleCount: 1,
    dogCount: 0,
    extraPeople: 0,
    extraDogs: 0,
    totalPrice: 890,
    paymentMethod: 'PROMPTPAY_QR',
    paymentStatus: 'PAID',
    paymentRef: 'SCB-20270201-910455',
    senderBank: 'ไทยพาณิชย์ (SCB EASY)',
    slipHash: 'SLIP-00B91E443C20',
    transferDurationSec: 65,
    verificationStatus: 'AUTO_VERIFIED',
    verifiedAt: '2026-10-18T11:40:00.000Z',
    verifiedBy: 'ระบบตรวจสลิปอัตโนมัติ',
    kitStatus: 'PENDING_PICKUP',
    registrationStatus: 'CONFIRMED',
    createdAt: '2026-10-18T11:40:00.000Z',
  },
  {
    orderId: 'CSR27-0003',
    bibNumber: '05-0001',
    routeId: '5km',
    routeName: '5 KM วิ่งบุคคลทั่วไป',
    fullName: 'พิมพ์ชนก สุวรรณรัตน์',
    phone: '089-876-5432',
    emergencyPhone: '081-998-7766',
    email: 'pimchanok.s@gmail.com',
    shirtSize: 'S',
    runningWithDog: false,
    peopleCount: 1,
    dogCount: 0,
    extraPeople: 0,
    extraDogs: 0,
    totalPrice: 690,
    paymentMethod: 'PROMPTPAY_QR',
    paymentStatus: 'PAID',
    paymentRef: 'KTB-20270202-104288',
    senderBank: 'กรุงไทย (Krungthai NEXT)',
    slipHash: 'SLIP-00C12D778A09',
    transferDurationSec: 52,
    verificationStatus: 'ADMIN_APPROVED',
    verifiedAt: '2026-10-18T14:25:00.000Z',
    verifiedBy: 'admin',
    kitStatus: 'CHECKED_IN',
    registrationStatus: 'CHECKED_IN',
    createdAt: '2026-10-18T14:22:00.000Z',
  },
  {
    orderId: 'CSR27-0004',
    bibNumber: '05-0002',
    routeId: '5km',
    routeName: '5 KM วิ่งบุคคลทั่วไป',
    fullName: 'ณัฐวุฒิ ศรีสวัสดิ์',
    phone: '092-345-6789',
    emergencyPhone: '092-345-0000',
    email: 'nattawut.sri@hotmail.com',
    shirtSize: 'XL',
    runningWithDog: false,
    peopleCount: 1,
    dogCount: 0,
    extraPeople: 0,
    extraDogs: 0,
    totalPrice: 690,
    paymentMethod: 'PROMPTPAY_QR',
    paymentStatus: 'PAID',
    paymentRef: 'BBL-20270202-331904',
    senderBank: 'กรุงเทพ (Bangkok Bank)',
    slipHash: 'SLIP-00D55F891E32',
    transferDurationSec: 94,
    verificationStatus: 'AUTO_VERIFIED',
    verifiedAt: '2026-10-19T08:05:00.000Z',
    verifiedBy: 'ระบบตรวจสลิปอัตโนมัติ',
    kitStatus: 'PENDING_PICKUP',
    registrationStatus: 'CONFIRMED',
    createdAt: '2026-10-19T08:05:00.000Z',
  },
  {
    orderId: 'CSR27-0005',
    bibNumber: '03-0001',
    routeId: '3km',
    routeName: '3 KM วิ่งคู่น้องสุนัข',
    fullName: 'ภัทรวดี อัศวเมธี',
    phone: '084-112-9988',
    emergencyPhone: '081-445-6677',
    email: 'patrawadee.dog@gmail.com',
    shirtSize: 'M',
    runningWithDog: true,
    dogName: 'กัปตัน (Captain)',
    dogBreed: 'โกลเด้น รีทริฟเวอร์',
    peopleCount: 2,
    dogCount: 1,
    extraPeople: 1,
    extraDogs: 0,
    extraRunnerNames: 'อานนท์ อัศวเมธี (ไซส์ L)',
    totalPrice: 1390,
    paymentMethod: 'PROMPTPAY_QR',
    paymentStatus: 'PAID',
    paymentRef: 'KBANK-20270203-552019',
    senderBank: 'กสิกรไทย (K PLUS)',
    slipHash: 'SLIP-00E82A114F77',
    transferDurationSec: 41,
    verificationStatus: 'ADMIN_APPROVED',
    verifiedAt: '2026-10-19T13:32:00.000Z',
    verifiedBy: 'admin',
    kitStatus: 'CHECKED_IN',
    registrationStatus: 'CHECKED_IN',
    createdAt: '2026-10-19T13:30:00.000Z',
  },
  {
    orderId: 'CSR27-0006',
    bibNumber: '03-0002',
    routeId: '3km',
    routeName: '3 KM วิ่งคู่น้องสุนัข',
    fullName: 'ศุภชัย วงศ์สว่าง',
    phone: '095-678-1234',
    emergencyPhone: '089-001-2233',
    email: 'supachai.k9@gmail.com',
    shirtSize: 'L',
    runningWithDog: true,
    dogName: 'แรมโบ้',
    dogBreed: 'เยอรมันเชพเพิร์ด',
    peopleCount: 1,
    dogCount: 1,
    extraPeople: 0,
    extraDogs: 0,
    totalPrice: 890,
    paymentMethod: 'PROMPTPAY_QR',
    paymentStatus: 'PAID',
    paymentRef: 'TTB-20270203-619044',
    senderBank: 'ทหารไทยธนชาต (ttb touch)',
    slipHash: 'SLIP-00F19C332D88',
    transferDurationSec: 73,
    verificationStatus: 'PENDING_REVIEW',
    kitStatus: 'PENDING_PICKUP',
    registrationStatus: 'CONFIRMED',
    createdAt: '2026-10-19T16:45:00.000Z',
  },
  {
    orderId: 'CSR27-0007',
    bibNumber: '01-0001',
    routeId: '1km',
    routeName: '1 KM วิ่งคู่น้องสุนัข',
    fullName: 'แพรวพรรณ ลิ้มเจริญ',
    phone: '082-990-1122',
    emergencyPhone: '081-778-9900',
    email: 'praewpan.corgi@gmail.com',
    shirtSize: 'XS',
    runningWithDog: true,
    dogName: 'มั่งมี, ศรีสุข',
    dogBreed: 'เวลช์ คอร์กี้',
    peopleCount: 1,
    dogCount: 2,
    extraPeople: 0,
    extraDogs: 1,
    totalPrice: 1040,
    paymentMethod: 'PROMPTPAY_QR',
    paymentStatus: 'PAID',
    paymentRef: 'SCB-20270204-209188',
    senderBank: 'ไทยพาณิชย์ (SCB EASY)',
    slipHash: 'SLIP-00A77B654E10',
    transferDurationSec: 37,
    verificationStatus: 'AUTO_VERIFIED',
    verifiedAt: '2026-10-20T04:10:00.000Z',
    verifiedBy: 'ระบบตรวจสลิปอัตโนมัติ',
    kitStatus: 'PENDING_PICKUP',
    registrationStatus: 'CONFIRMED',
    createdAt: '2026-10-20T04:10:00.000Z',
  },
];

export const DEFAULT_CHECKLIST_ITEMS: RunnerChecklistItem[] = [
  { id: 'c1', label: 'ลงทะเบียนและชำระเงินผ่าน PromptPay เรียบร้อย', description: 'ยืนยันข้อมูลและได้รับหมายเลข BIB อัตโนมัติแล้ว', completed: true, category: 'prep' },
  { id: 'c2', label: 'ตรวจสอบและบันทึกภาพป้ายหมายเลข BIB', description: 'แสดงป้าย E-BIB ในวันรับเสื้อและเบอร์วิ่ง', completed: true, category: 'prep' },
  { id: 'c3', label: 'ตรวจสอบไซส์เสื้อวิ่งและจุดรับ Race Kit', description: 'จุดรับ Race Kit ณ หน้าหาดโรงแรม Sea Sand Sun', completed: false, category: 'kit' },
  { id: 'c4', label: 'ตรวจสอบจุดจอดรถและเส้นทางเดินทาง', description: 'ลานจอดรถค่ายนเรศวร 800+ คัน', completed: false, category: 'prep' },
  { id: 'c5', label: 'จำลองเส้นทางวิ่งเสมือนจริง (Start Simulation)', description: 'ศึกษาจุดบริการน้ำดื่มและทางเลี้ยวสำคัญ', completed: false, category: 'prep' },
  { id: 'c6', label: 'ตรวจสอบสภาพอากาศและทิศทางลมชายหาด', description: 'เตรียมความพร้อมก่อนปล่อยตัวช่วงเย็น 16.30 - 17.30 น.', completed: false, category: 'prep' },
  { id: 'c7', label: 'ทบทวนกำหนดการวันแข่งขัน (09.00 – 17.30+ น.)', description: 'ประกวดสุนัข กิจกรรมสถานี ปล่อยตัววิ่ง และคอนเสิร์ต', completed: false, category: 'race_day' },
  { id: 'c8', label: 'ตรวจสอบเบอร์ติดต่อฉุกเฉินและหน่วยแพทย์', description: 'เบอร์ศูนย์อำนวยการและกู้ชีพค่ายนเรศวร', completed: false, category: 'race_day' },
  { id: 'c9', label: 'เตรียมสายจูงและสมุดวัคซีนสำหรับสัตว์เลี้ยง (กรณีมีน้องสุนัข)', description: 'สายจูง ชามน้ำพับได้ ถุงเก็บมูล', completed: false, category: 'kit' },
  { id: 'c10', label: 'พร้อมวิ่งด้วยใจ เพื่อพัฒนาสุนัขตำรวจ!', description: 'พักผ่อนให้เพียงพอก่อนวันงาน', completed: false, category: 'race_day' },
];

export function getPromptPayConfig(): PromptPayConfig {
  try {
    const raw = localStorage.getItem(PROMPTPAY_CONFIG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        PROMPTPAY_CONFIG_STORAGE_KEY,
        encryptStoragePayload(JSON.stringify(DEFAULT_PROMPTPAY_CONFIG))
      );
      return DEFAULT_PROMPTPAY_CONFIG;
    }
    const { plaintext, wasEncrypted, integrityVerified } = decryptStoragePayload(raw);
    if (!plaintext || !integrityVerified) return DEFAULT_PROMPTPAY_CONFIG;
    const merged = { ...DEFAULT_PROMPTPAY_CONFIG, ...JSON.parse(plaintext) };
    if (!wasEncrypted) {
      localStorage.setItem(
        PROMPTPAY_CONFIG_STORAGE_KEY,
        encryptStoragePayload(JSON.stringify(merged))
      );
    }
    return merged;
  } catch {
    return DEFAULT_PROMPTPAY_CONFIG;
  }
}

export function savePromptPayConfig(config: PromptPayConfig): void {
  try {
    const sanitizedConfig: PromptPayConfig = {
      ...config,
      promptPayId: sanitizeUserInput(config.promptPayId, 30),
      accountName: sanitizeUserInput(config.accountName, 160),
      bankLabel: sanitizeUserInput(config.bankLabel, 100),
      adminUsername: sanitizeUserInput(config.adminUsername, 60) || 'admin',
      adminPassword: '',
    };
    localStorage.setItem(
      PROMPTPAY_CONFIG_STORAGE_KEY,
      encryptStoragePayload(JSON.stringify(sanitizedConfig))
    );
    window.dispatchEvent(new Event('changsuek_orders_updated'));
  } catch {
    // ignore
  }
}

export function getAllTicketOrders(): TicketOrder[] {
  try {
    const raw = localStorage.getItem(TICKET_ORDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        TICKET_ORDERS_STORAGE_KEY,
        encryptStoragePayload(JSON.stringify(INITIAL_SEED_ORDERS))
      );
      return INITIAL_SEED_ORDERS;
    }
    const { plaintext, wasEncrypted, integrityVerified } = decryptStoragePayload(raw);
    if (!plaintext || !integrityVerified) {
      return INITIAL_SEED_ORDERS;
    }
    const parsed = JSON.parse(plaintext);
    if (Array.isArray(parsed)) {
      const normalized = parsed.map((o: TicketOrder) => ({
        ...o,
        senderBank: o.senderBank || 'กสิกรไทย (K PLUS)',
        transferDurationSec:
          typeof o.transferDurationSec === 'number' ? o.transferDurationSec : 55,
        verificationStatus: o.verificationStatus || 'AUTO_VERIFIED',
      }));
      if (!wasEncrypted) {
        localStorage.setItem(
          TICKET_ORDERS_STORAGE_KEY,
          encryptStoragePayload(JSON.stringify(normalized))
        );
      }
      return normalized;
    }
    return INITIAL_SEED_ORDERS;
  } catch {
    return INITIAL_SEED_ORDERS;
  }
}

export function saveAllTicketOrders(orders: TicketOrder[]): void {
  try {
    localStorage.setItem(
      TICKET_ORDERS_STORAGE_KEY,
      encryptStoragePayload(JSON.stringify(orders))
    );
    window.dispatchEvent(new Event('changsuek_orders_updated'));
  } catch {
    // ignore
  }
}

export function getBibCounters(): BibCounters {
  const orders = getAllTicketOrders();
  const computed: BibCounters = { '10km': 0, '5km': 0, '3km': 0, '1km': 0 };

  orders.forEach((o) => {
    const parts = o.bibNumber.split('-');
    const num = parseInt(parts[1] || parts[0], 10);
    if (!isNaN(num) && num > (computed[o.routeId] || 0)) {
      computed[o.routeId] = num;
    }
  });

  try {
    const raw = localStorage.getItem(BIB_COUNTERS_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<BibCounters>;
      (['10km', '5km', '3km', '1km'] as RouteId[]).forEach((r) => {
        if (typeof stored[r] === 'number' && stored[r]! > computed[r]) {
          computed[r] = stored[r]!;
        }
      });
    }
  } catch {
    // ignore
  }

  return computed;
}

export function previewNextBibNumber(routeId: RouteId): string {
  const counters = getBibCounters();
  const nextSeq = (counters[routeId] || 0) + 1;
  return formatBibNumber(routeId, nextSeq);
}

export function createTicketOrderWithAutoBib(
  input: Omit<
    TicketOrder,
    | 'orderId'
    | 'bibNumber'
    | 'createdAt'
    | 'paymentMethod'
    | 'paymentStatus'
    | 'kitStatus'
    | 'senderBank'
    | 'transferDurationSec'
    | 'verificationStatus'
  > & {
    paymentRef?: string;
    senderBank?: string;
    slipImageDataUrl?: string;
    slipHash?: string;
    transferDurationSec?: number;
    verificationStatus?: PaymentVerificationStatus;
  }
): TicketOrder {
  const orders = getAllTicketOrders();
  const counters = getBibCounters();
  const nextSeq = (counters[input.routeId] || 0) + 1;
  const bibNumber = formatBibNumber(input.routeId, nextSeq);

  const updatedCounters: BibCounters = {
    ...counters,
    [input.routeId]: nextSeq,
  };
  try {
    localStorage.setItem(BIB_COUNTERS_STORAGE_KEY, JSON.stringify(updatedCounters));
  } catch {
    // ignore
  }

  const orderSeq = orders.length + 1;
  const now = new Date();
  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);

  const verificationStatus = input.verificationStatus || 'AUTO_VERIFIED';

  const newOrder: TicketOrder = {
    ...input,
    fullName: sanitizeUserInput(input.fullName, 120),
    phone: sanitizeUserInput(input.phone, 35),
    emergencyPhone: sanitizeUserInput(input.emergencyPhone, 35),
    email: sanitizeUserInput(input.email, 120),
    dogName: sanitizeUserInput(input.dogName, 80),
    dogBreed: sanitizeUserInput(input.dogBreed, 80),
    extraRunnerNames: sanitizeUserInput(input.extraRunnerNames, 240),
    orderId: `CSR27-${orderSeq.toString().padStart(4, '0')}`,
    bibNumber,
    paymentMethod: 'PROMPTPAY_QR',
    paymentStatus: 'PAID',
    paymentRef:
      sanitizeUserInput(input.paymentRef, 60) || `PP-${dateStamp}-${randomSuffix}`,
    senderBank: sanitizeUserInput(input.senderBank, 80) || 'กสิกรไทย (K PLUS)',
    slipImageDataUrl: input.slipImageDataUrl,
    slipHash: input.slipHash,
    transferDurationSec: input.transferDurationSec ?? 45,
    verificationStatus,
    verifiedAt: now.toISOString(),
    verifiedBy:
      verificationStatus === 'AUTO_VERIFIED' ? 'ระบบตรวจสลิปอัตโนมัติ (e-Slip Verifier)' : undefined,
    kitStatus: 'PENDING_PICKUP',
    registrationStatus: 'CONFIRMED',
    createdAt: now.toISOString(),
  };

  const nextOrders = [newOrder, ...orders];
  saveAllTicketOrders(nextOrders);
  saveRunnerProfile(newOrder);

  return newOrder;
}

export function updateOrderVerificationStatus(
  orderId: string,
  status: PaymentVerificationStatus,
  verifiedBy = 'admin'
): TicketOrder[] {
  const orders = getAllTicketOrders();
  const updated = orders.map((order) => {
    if (order.orderId !== orderId) return order;
    return {
      ...order,
      verificationStatus: status,
      paymentStatus: status === 'REJECTED' ? ('PENDING' as const) : ('PAID' as const),
      verifiedAt: new Date().toISOString(),
      verifiedBy,
    };
  });
  saveAllTicketOrders(updated);
  appendSecurityAuditLog({
    action: 'SLIP_STATUS_CHANGED',
    severity: status === 'REJECTED' ? 'WARNING' : 'INFO',
    actor: verifiedBy,
    detail: `เปลี่ยนสถานะสลิปคำสั่งซื้อ ${orderId} เป็น ${status}`,
  });
  return updated;
}

export function toggleOrderKitStatus(orderId: string): TicketOrder[] {
  const orders = getAllTicketOrders();
  const updated = orders.map((order) => {
    if (order.orderId !== orderId) return order;
    const nextKit: 'PENDING_PICKUP' | 'CHECKED_IN' =
      order.kitStatus === 'CHECKED_IN' ? 'PENDING_PICKUP' : 'CHECKED_IN';
    return {
      ...order,
      kitStatus: nextKit,
      registrationStatus: nextKit === 'CHECKED_IN' ? ('CHECKED_IN' as const) : ('CONFIRMED' as const),
    };
  });
  saveAllTicketOrders(updated);
  return updated;
}

export function deleteTicketOrder(orderId: string): TicketOrder[] {
  const orders = getAllTicketOrders().filter((o) => o.orderId !== orderId);
  saveAllTicketOrders(orders);
  return orders;
}

export function resetTicketOrdersToSeed(): TicketOrder[] {
  saveAllTicketOrders(INITIAL_SEED_ORDERS);
  localStorage.removeItem(BIB_COUNTERS_STORAGE_KEY);
  return INITIAL_SEED_ORDERS;
}

export function exportTicketOrdersToCsv(
  orders: TicketOrder[],
  options?: { maskSensitiveData?: boolean; actor?: string }
): void {
  const maskPii = options?.maskSensitiveData ?? false;
  const actor = options?.actor || 'admin';

  const headers = [
    'รหัสคำสั่งซื้อ (Order ID)',
    'หมายเลข BIB',
    'ระยะทาง',
    'ชื่อ-นามสกุล',
    'เบอร์โทรศัพท์',
    'เบอร์ติดต่อฉุกเฉิน',
    'อีเมล',
    'ไซส์เสื้อหลัก',
    'จำนวนคนรวม',
    'ผู้ร่วมวิ่งเพิ่ม',
    'ร่วมวิ่งกับสุนัข',
    'จำนวนสุนัขรวม',
    'ชื่อสุนัข',
    'สายพันธุ์สุนัข',
    'ยอดชำระสุทธิ (บาท)',
    'ธนาคารที่โอน',
    'รหัสอ้างอิงสลิป PromptPay',
    'ลายนิ้วมือสลิป (Slip Hash)',
    'เวลาที่ใช้โอน (วินาที)',
    'สถานะตรวจสอบการโอน',
    'สถานะรับเสื้อ/BIB',
    'วันเวลาที่ซื้อตั๋ว',
  ];

  const verificationLabel = (st: PaymentVerificationStatus) => {
    if (st === 'ADMIN_APPROVED') return 'แอดมินอนุมัติแล้ว';
    if (st === 'AUTO_VERIFIED') return 'ตรวจสลิปผ่านอัตโนมัติ';
    if (st === 'REJECTED') return 'สลิปไม่ผ่าน/ปฏิเสธ';
    return 'รอตรวจสอบสลิป';
  };

  const rows = orders.map((o) => [
    o.orderId,
    o.bibNumber,
    o.routeName,
    o.fullName,
    maskPii ? maskPhoneNumber(o.phone) : o.phone,
    maskPii ? maskPhoneNumber(o.emergencyPhone) : o.emergencyPhone,
    maskPii ? maskEmailAddress(o.email) : o.email,
    o.shirtSize,
    o.peopleCount,
    o.extraRunnerNames || '-',
    o.runningWithDog ? 'ใช่' : 'ไม่ใช่',
    o.dogCount,
    o.dogName || '-',
    o.dogBreed || '-',
    o.totalPrice,
    o.senderBank || 'PromptPay QR',
    o.paymentRef,
    o.slipHash || '-',
    o.transferDurationSec || 0,
    verificationLabel(o.verificationStatus),
    o.kitStatus === 'CHECKED_IN' ? 'รับ BIB แล้ว' : 'รอรับ BIB',
    new Date(o.createdAt).toLocaleString('th-TH'),
  ]);

  const csvBody = [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((r) => r.map(sanitizeCsvCell).join(',')),
  ].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const suffix = maskPii ? 'PDPA_MASKED' : 'FULL_AUTHORIZED';
  link.download = `CHANGSUEK_RUN_2027_BIB_ORDERS_${suffix}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  appendSecurityAuditLog({
    action: maskPii ? 'CSV_EXPORTED_MASKED' : 'CSV_EXPORTED_FULL',
    severity: maskPii ? 'INFO' : 'WARNING',
    actor,
    detail: maskPii
      ? `ส่งออกไฟล์ CSV แบบปิดบังข้อมูลส่วนบุคคล (PDPA Masked) จำนวน ${orders.length} รายการ`
      : `ส่งออกไฟล์ CSV ข้อมูลเต็ม (Unmasked Full PII) จำนวน ${orders.length} รายการ`,
  });
}

export function getStoredRunnerProfile(): RunnerProfile | null {
  try {
    const raw = localStorage.getItem(RUNNER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const { plaintext, wasEncrypted, integrityVerified } = decryptStoragePayload(raw);
    if (!plaintext || !integrityVerified) return null;
    const parsed = JSON.parse(plaintext) as RunnerProfile;
    if (!wasEncrypted) {
      localStorage.setItem(
        RUNNER_PROFILE_STORAGE_KEY,
        encryptStoragePayload(JSON.stringify(parsed))
      );
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveRunnerProfile(profile: RunnerProfile): void {
  try {
    const sanitized: RunnerProfile = {
      ...profile,
      fullName: sanitizeUserInput(profile.fullName, 120),
      phone: sanitizeUserInput(profile.phone, 35),
      emergencyPhone: sanitizeUserInput(profile.emergencyPhone, 35),
      email: sanitizeUserInput(profile.email, 120),
      dogName: sanitizeUserInput(profile.dogName, 80),
      dogBreed: sanitizeUserInput(profile.dogBreed, 80),
      extraRunnerNames: sanitizeUserInput(profile.extraRunnerNames, 240),
    };
    localStorage.setItem(
      RUNNER_PROFILE_STORAGE_KEY,
      encryptStoragePayload(JSON.stringify(sanitized))
    );
  } catch {
    // ignore
  }
}

export function clearStoredRunnerProfile(): void {
  try {
    localStorage.removeItem(RUNNER_PROFILE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getStoredChecklist(): RunnerChecklistItem[] {
  try {
    const raw = localStorage.getItem(RUNNER_CHECKLIST_STORAGE_KEY);
    if (!raw) return DEFAULT_CHECKLIST_ITEMS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_CHECKLIST_ITEMS;
  } catch {
    return DEFAULT_CHECKLIST_ITEMS;
  }
}

export function saveChecklist(items: RunnerChecklistItem[]): void {
  try {
    localStorage.setItem(RUNNER_CHECKLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}
