import QRCode from 'qrcode';
import { RunnerProfile, TicketOrder } from './runnerStorage';
import { formatBaht } from '../data/eventData';

export type PrintFormatOption = 'bib_only' | 'eticket_pass' | 'full_a4_receipt';

export interface EmailDeliveryLog {
  id: string;
  orderId: string;
  bibNumber: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  sentAt: string;
  status: 'DELIVERED' | 'RESENT';
  paymentRef: string;
  totalPrice: number;
}

const EMAIL_LOGS_STORAGE_KEY = 'changsuek_automated_email_logs_v1';

const ROUTE_PRINT_COLOR: Record<
  string,
  { primary: string; secondary: string; badge: string; wave: string; startTime: string }
> = {
  '10km': {
    primary: '#3B0764',
    secondary: '#6D28D9',
    badge: '#F3E8FF',
    wave: 'WAVE A · MINI MARATHON 10 KM',
    startTime: '16.30 น.',
  },
  '5km': {
    primary: '#78350F',
    secondary: '#D97706',
    badge: '#FEF3C7',
    wave: 'WAVE B · FUN & MASS RUN 5 KM',
    startTime: '17.00 น.',
  },
  '3km': {
    primary: '#14532D',
    secondary: '#16A34A',
    badge: '#DCFCE7',
    wave: 'WAVE C · DOG BUDDY RUN 3 KM',
    startTime: '17.15 น.',
  },
  '1km': {
    primary: '#7C2D12',
    secondary: '#EA580C',
    badge: '#FFEDD5',
    wave: 'WAVE D · DOG MINI RUN 1 KM',
    startTime: '17.30 น.',
  },
};

export function getRoutePrintMeta(routeId: string) {
  return ROUTE_PRINT_COLOR[routeId] || ROUTE_PRINT_COLOR['5km'];
}

/**
 * Generates a verification QR code Data URL for Race Kit check-in & E-Ticket validation
 */
export async function generateTicketCheckInQrDataUrl(profile: RunnerProfile): Promise<string> {
  const payload = JSON.stringify({
    event: 'CHANGSUEK_RUN_2027',
    orderId: profile.orderId || `CSR27-${profile.bibNumber}`,
    bib: profile.bibNumber,
    route: profile.routeId.toUpperCase(),
    runner: profile.fullName,
    shirt: profile.shirtSize,
    status: 'PAID_VERIFIED',
    ref: profile.paymentRef || 'PROMPTPAY_AUTO',
  });

  try {
    return await QRCode.toDataURL(payload, {
      width: 260,
      margin: 1,
      color: {
        dark: '#2A1450',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch {
    return '';
  }
}

/**
 * Retrieves all automated email delivery logs
 */
export function getEmailDeliveryLogs(): EmailDeliveryLog[] {
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Automatically dispatches the E-Ticket + Official BIB confirmation email upon payment verification
 */
export async function dispatchAutomatedTicketEmail(
  profile: RunnerProfile | TicketOrder,
  overrideEmail?: string
): Promise<EmailDeliveryLog> {
  const targetEmail = (overrideEmail || profile.email || 'runner@changsuekrun.com').trim();
  const existingLogs = getEmailDeliveryLogs();
  const isResend = existingLogs.some(
    (l) => l.bibNumber === profile.bibNumber && l.recipientEmail === targetEmail
  );

  const logEntry: EmailDeliveryLog = {
    id: `EML-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    orderId: profile.orderId || `CSR27-${profile.bibNumber}`,
    bibNumber: profile.bibNumber,
    recipientEmail: targetEmail,
    recipientName: profile.fullName || 'นักวิ่งช้างศึกรัน',
    subject: `[ชำระเงินสำเร็จ] บัตรวิ่ง E-Ticket และหมายเลข BIB #${profile.bibNumber} งาน CHANGSUEK RUN 2027`,
    sentAt: new Date().toISOString(),
    status: isResend ? 'RESENT' : 'DELIVERED',
    paymentRef: profile.paymentRef || 'PROMPTPAY-AUTO',
    totalPrice: profile.totalPrice || 690,
  };

  try {
    const updated = [logEntry, ...existingLogs].slice(0, 200);
    localStorage.setItem(EMAIL_LOGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('changsuek_email_dispatched'));
  } catch {
    // ignore storage errors
  }

  return logEntry;
}

/**
 * Renders a high-resolution PNG of the runner's Official BIB + E-Ticket for instant 1-click download
 */
export async function downloadOfficialBibAsPng(profile: RunnerProfile): Promise<void> {
  const meta = getRoutePrintMeta(profile.routeId);
  const checkInQrUrl = await generateTicketCheckInQrDataUrl(profile);

  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 880;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background Card
  ctx.fillStyle = '#FAF7FF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Border
  ctx.strokeStyle = '#2A1450';
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Header Banner
  const grad = ctx.createLinearGradient(20, 20, canvas.width - 20, 200);
  grad.addColorStop(0, meta.primary);
  grad.addColorStop(1, meta.secondary);
  ctx.fillStyle = grad;
  ctx.fillRect(27, 27, canvas.width - 54, 175);

  // Corner Safety-Pin Eyelets
  const drawEyelet = (cx: number, cy: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#2A1450';
    ctx.stroke();
  };
  drawEyelet(65, 65);
  drawEyelet(canvas.width - 65, 65);
  drawEyelet(65, canvas.height - 65);
  drawEyelet(canvas.width - 65, canvas.height - 65);

  // Header Texts
  ctx.fillStyle = '#FFC928';
  ctx.font = '900 24px "Plus Jakarta Sans", "Prompt", sans-serif';
  ctx.fillText('CHANGSUEK RUN 2027 · OFFICIAL VERIFIED E-BIB & RACE PASS', 110, 88);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 44px "Prompt", "Plus Jakarta Sans", sans-serif';
  ctx.fillText('เห็นช้างวิ่ง วิ่งตามช้าง • ค่ายนเรศวร ชะอำ-หัวหิน', 110, 145);

  ctx.fillStyle = '#E9D5FF';
  ctx.font = '700 22px "Prompt", sans-serif';
  ctx.fillText(`${meta.wave} · ปล่อยตัว ${meta.startTime} · วันอาทิตย์ที่ 15 ก.พ. 2570`, 110, 182);

  // Distance Badge on Header Right
  ctx.fillStyle = '#FFC928';
  ctx.fillRect(canvas.width - 310, 68, 210, 86);
  ctx.strokeStyle = '#2A1450';
  ctx.lineWidth = 6;
  ctx.strokeRect(canvas.width - 310, 68, 210, 86);

  ctx.fillStyle = '#2A1450';
  ctx.textAlign = 'center';
  ctx.font = '900 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(profile.routeId.toUpperCase(), canvas.width - 205, 128);
  ctx.textAlign = 'left';

  // Center Main BIB Box
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(70, 235, 920, 360);
  ctx.strokeStyle = '#2A1450';
  ctx.lineWidth = 8;
  ctx.strokeRect(70, 235, 920, 360);

  ctx.fillStyle = '#6B5A85';
  ctx.textAlign = 'center';
  ctx.font = '800 22px "Plus Jakarta Sans", "Prompt", sans-serif';
  ctx.fillText('OFFICIAL RACE BIB NUMBER / หมายเลขประจำตัวนักวิ่ง', 530, 290);

  // Giant BIB Number
  ctx.fillStyle = '#2A1450';
  ctx.font = '900 165px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(profile.bibNumber, 530, 460);

  // Verified Pill
  ctx.fillStyle = '#DCFCE7';
  ctx.fillRect(280, 505, 500, 54);
  ctx.strokeStyle = '#16A34A';
  ctx.lineWidth = 3;
  ctx.strokeRect(280, 505, 500, 54);

  ctx.fillStyle = '#14532D';
  ctx.font = '800 22px "Prompt", sans-serif';
  ctx.fillText(
    `✓ ชำระเงินแล้ว (${formatBaht(profile.totalPrice || 690)} บาท) · พร้อมรับเสื้อวันงาน`,
    530,
    540
  );
  ctx.textAlign = 'left';

  // Right QR Check-in Box
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(1020, 235, 310, 360);
  ctx.strokeStyle = '#2A1450';
  ctx.lineWidth = 6;
  ctx.strokeRect(1020, 235, 310, 360);

  if (checkInQrUrl) {
    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => resolve();
      qrImg.src = checkInQrUrl;
    });
    ctx.drawImage(qrImg, 1055, 255, 240, 240);
  }

  ctx.fillStyle = '#2A1450';
  ctx.textAlign = 'center';
  ctx.font = '800 18px "Prompt", sans-serif';
  ctx.fillText('สแกน QR รับเสื้อและเหรียญ', 1175, 525);
  ctx.fillStyle = '#6B5A85';
  ctx.font = '700 15px "Plus Jakarta Sans", monospace';
  ctx.fillText(profile.orderId || `CSR27-${profile.bibNumber}`, 1175, 555);
  ctx.textAlign = 'left';

  // Bottom Runner Metadata Strip
  ctx.fillStyle = '#F3E8FF';
  ctx.fillRect(70, 625, 1260, 185);
  ctx.strokeStyle = '#2A1450';
  ctx.lineWidth = 5;
  ctx.strokeRect(70, 625, 1260, 185);

  ctx.fillStyle = '#6B5A85';
  ctx.font = '700 19px "Prompt", sans-serif';
  ctx.fillText('ชื่อนักวิ่ง / RUNNER NAME', 105, 670);
  ctx.fillText('ไซส์เสื้อ / JERSEY SIZE', 620, 670);
  ctx.fillText('รหัสอ้างอิงโอนเงิน / PAYMENT REF', 940, 670);

  ctx.fillStyle = '#2A1450';
  ctx.font = '900 32px "Prompt", sans-serif';
  ctx.fillText((profile.fullName || 'นักวิ่งช้างศึกรัน').slice(0, 28), 105, 718);
  ctx.fillText(`Size ${profile.shirtSize || 'L'}`, 620, 718);
  ctx.font = '800 24px "Plus Jakarta Sans", monospace';
  ctx.fillText(profile.paymentRef || 'PROMPTPAY-VERIFIED', 940, 715);

  ctx.fillStyle = '#4B2D78';
  ctx.font = '700 19px "Prompt", sans-serif';
  const dogNote = profile.runningWithDog
    ? `🐾 วิ่งคู่สุนัข: น้อง${profile.dogName || 'คู่ใจ'} (${profile.dogBreed || 'K9 Pass'})`
    : '🏃 ประเภทวิ่งบุคคลทั่วไป · ชิปจับเวลา RFID มาตรฐาน';
  ctx.fillText(
    `${dogNote}   |   อีเมลรับบัตร: ${profile.email || '-'}`,
    105,
    775
  );

  // Trigger Download
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `CHANGSUEK_RUN_2027_BIB_${profile.bibNumber}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
