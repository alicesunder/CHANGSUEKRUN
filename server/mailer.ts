/**
 * Ticket e-mail: sent once an order is paid (and again on request). It carries the order, the BIB /
 * concert number, what was bought, the event dates, and QR codes as attachments: one for check-in
 * and one per VIP parking pass.
 *
 * Sending goes through Resend (https://resend.com/docs/api-reference/emails/send-email).
 * Needs RESEND_API_KEY (and optionally MAIL_FROM) in the environment; without a key nothing is sent
 * and the result says so, so the rest of the order flow is never blocked by e-mail.
 */
import QRCode from 'qrcode';
import { eventInfo, formatBaht, routesData } from '../src/data/eventData';
import { parkingQrPayload } from '../src/data/vipParking';
import type { StoredOrder } from './store';

const DEFAULT_FROM = 'CHANGSUEK RUN <tickets@mail.changsuekrun.com>';
const REPLY_TO = eventInfo.contactEmail;

export interface MailResult {
  ok: boolean;
  /** Resend message id when sent */
  id?: string;
  error?: string;
}

export function mailConfigured(): boolean {
  return Boolean((process.env.RESEND_API_KEY || '').trim());
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** xx***@gmail.com — for showing where a ticket went without printing the whole address. */
export function maskEmail(email: string): string {
  const [u, d] = email.split('@');
  if (!u || !d) return '';
  return `${u.slice(0, 2)}${'*'.repeat(Math.max(1, Math.min(6, u.length - 2)))}@${d}`;
}

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 0;color:#6B5A85;font-size:14px;width:42%;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;color:#2A1450;font-size:14px;font-weight:700">${value}</td></tr>`;

/** Builds the e-mail (subject, HTML, attachments) for a paid order. */
export async function buildTicketEmail(o: StoredOrder) {
  const isRun = o.ticketType !== 'CONCERT' && o.ticketType !== 'ADDON';
  const start = isRun ? routesData[o.routeId as keyof typeof routesData]?.startTime : '';
  const numberLabel = isRun ? 'เลข BIB' : o.ticketType === 'CONCERT' ? 'เลขบัตรคอนเสิร์ต' : 'เลขบัตร';
  const title = isRun ? `บัตรวิ่ง & BIB #${o.bibNumber}` : `บัตร #${o.bibNumber}`;
  const subject = `[CHANGSUEK RUN] ชำระเงินสำเร็จ · ${title} · คำสั่งซื้อ ${o.orderId}`;

  const attachments: { filename: string; content: string; content_id: string }[] = [];
  const qrOpts = { width: 360, margin: 1, errorCorrectionLevel: 'M' as const, color: { dark: '#2A1450', light: '#FFFFFF' } };
  // The check-in QR only needs the order id (the scanner looks the rest up).
  const ticketQr = await QRCode.toBuffer(JSON.stringify({ orderId: o.orderId, bib: o.bibNumber }), qrOpts);
  attachments.push({ filename: `TICKET_${o.orderId}.png`, content: ticketQr.toString('base64'), content_id: 'ticket-qr' });

  const parking = o.vipTables && o.parkingPlates?.length ? o.parkingPlates : [];
  for (let i = 0; i < parking.length; i++) {
    const buf = await QRCode.toBuffer(parkingQrPayload(o.orderId, parking[i]), qrOpts);
    attachments.push({ filename: `VIP_PARKING_${o.orderId}_${i + 1}.png`, content: buf.toString('base64'), content_id: `parking-${i + 1}` });
  }

  const rows: string[] = [
    row('คำสั่งซื้อ', `<span style="font-family:monospace">${esc(o.orderId)}</span>`),
    row(numberLabel, `<span style="font-size:22px;color:#5B20A8">#${esc(o.bibNumber)}</span>`),
    row('ชื่อ', esc(o.fullName)),
    row('รายการ', esc(o.routeName)),
  ];
  if (isRun) {
    rows.push(row('วันวิ่ง', `${esc(eventInfo.dateNotice)}${start ? ` · ปล่อยตัว ${esc(start)}` : ''}`));
    if (o.shirtSize) rows.push(row('ไซส์เสื้อ', esc(o.shirtSize)));
    if (o.runningWithDog) rows.push(row('น้องสุนัข', esc(o.dogName || '-')));
  }
  if (o.concertQty) rows.push(row('ตั๋วคอนเสิร์ต GA', `${o.concertQty} ใบ · ${esc(eventInfo.dateNotice)} หลัง 17.30 น.`));
  if (o.vipTables) rows.push(row('VIP TABLE', `${o.vipTables} โต๊ะ`));
  if (o.addOns) rows.push(row('กิจกรรมเสริม', `${esc(o.addOns.label)} × ${o.addOns.people} คน · ${esc(eventInfo.activityDateNotice)}`));
  rows.push(row('ยอดชำระ', `${formatBaht(o.totalPrice)} บาท`));

  const parkingHtml = parking
    .map(
      (p, i) => `
      <div style="border:3px solid #2A1450;border-radius:16px;padding:14px;margin:12px 0;background:#FFFBEA">
        <div style="font-weight:900;color:#3B1270;font-size:18px">🚗 VIP PARKING PASS · คันที่ ${i + 1}</div>
        <div style="font-size:26px;font-weight:900;color:#111;margin-top:6px">${esc(p.plate)}</div>
        <div style="font-size:15px;font-weight:700;color:#111">${esc(p.province)}</div>
        <img src="cid:parking-${i + 1}" width="170" height="170" alt="QR บัตรจอดรถ ${esc(p.plate)}" style="display:block;margin-top:8px;border:2px solid #5B20A8;border-radius:8px" />
        <div style="font-size:12px;color:#6B5A85;margin-top:6px">แสดง QR นี้ให้เจ้าหน้าที่สแกนที่ทางเข้าลานจอด VIP</div>
      </div>`
    )
    .join('');

  const html = `<!doctype html><html lang="th"><body style="margin:0;background:#F4EEFF;font-family:Tahoma,'Leelawadee UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:20px">
    <div style="background:#2A1450;border-radius:20px 20px 0 0;padding:20px;text-align:center">
      <div style="color:#FFC928;font-weight:900;font-size:13px;letter-spacing:1px">CHANGSUEK RUN 2026 · เห็นช้างวิ่ง วิ่งตามช้าง</div>
      <div style="color:#fff;font-weight:900;font-size:22px;margin-top:6px">ชำระเงินสำเร็จ 🎉</div>
    </div>
    <div style="background:#fff;border:3px solid #2A1450;border-top:0;border-radius:0 0 20px 20px;padding:20px">
      <p style="margin:0 0 12px;color:#2A1450;font-size:15px">สวัสดีคุณ ${esc(o.fullName)} ขอบคุณที่ร่วมงาน CHANGSUEK RUN นี่คือตั๋วของคุณ กรุณาเก็บอีเมลนี้ไว้</p>
      <table style="width:100%;border-collapse:collapse">${rows.join('')}</table>
      <div style="text-align:center;margin:18px 0 6px">
        <img src="cid:ticket-qr" width="200" height="200" alt="QR เช็กอิน ${esc(o.orderId)}" style="border:3px solid #2A1450;border-radius:12px" />
        <div style="font-size:13px;color:#6B5A85;margin-top:6px">QR สำหรับเช็กอินและรับอุปกรณ์หน้างาน</div>
      </div>
      ${parkingHtml}
      <p style="font-size:12px;color:#6B5A85;margin:16px 0 0">สถานที่: ${esc(eventInfo.venueShort)} · ติดต่อผู้จัดงาน: ${esc(eventInfo.contactEmail)} · ${esc(eventInfo.contactPhone)}<br/>
      ถ้ารูป QR ไม่ขึ้นในอีเมล เปิดไฟล์แนบ (PNG) ได้เลย</p>
    </div>
  </div></body></html>`;

  return { subject, html, attachments };
}

/** Sends the ticket e-mail to the address on the order. Never throws. */
export async function sendTicketEmail(o: StoredOrder): Promise<MailResult> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return { ok: false, error: 'MAIL_NOT_CONFIGURED' };
  if (!o.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email)) return { ok: false, error: 'NO_EMAIL' };
  try {
    const { subject, html, attachments } = await buildTicketEmail(o);
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: (process.env.MAIL_FROM || DEFAULT_FROM).trim(),
        to: [o.email],
        reply_to: REPLY_TO,
        subject,
        html,
        attachments,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok) return { ok: false, error: String(json?.message || json?.name || `HTTP_${resp.status}`).slice(0, 200) };
    return { ok: true, id: json?.id };
  } catch (err: any) {
    return { ok: false, error: err?.name === 'TimeoutError' ? 'TIMEOUT' : String(err?.message || 'NETWORK').slice(0, 200) };
  }
}
