/**
 * Ticket e-mail: sent once an order is paid (and again on request). It carries the order, the BIB /
 * concert number, what was bought, the event dates, and QR codes as attachments: one for check-in
 * and one per VIP parking pass. The event logo is attached too and shown inline (cid:event-logo).
 *
 * Sending: Brevo SMTP relay when BREVO_SMTP_LOGIN + BREVO_SMTP_KEY are set (this site's choice),
 * otherwise Resend (https://resend.com/docs/api-reference/emails/send-email) when RESEND_API_KEY is set.
 * MAIL_FROM is optional (the sender must be verified at the provider). Without either, nothing is sent
 * and the result says so, so the rest of the order flow is never blocked by e-mail.
 * SMTP is used for Brevo because it supports inline (cid:) images, which the ticket layout needs.
 */
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { eventInfo, formatBaht, routesData } from '../src/data/eventData';
import { parkingQrPayload } from '../src/data/vipParking';
import type { StoredOrder } from './store';
import { EMAIL_LOGO_PNG_BASE64 } from './emailLogo';
import { docsSignature } from './auth';
import { buildDocumentsHtml } from './documents';

const SITE = (process.env.PUBLIC_SITE_URL || 'https://www.changsuekrun.com').replace(/\/+$/, '');

const DEFAULT_FROM = 'CHANGSUEK RUN <tickets@mail.changsuekrun.com>';
const REPLY_TO = eventInfo.contactEmail;

export interface MailResult {
  ok: boolean;
  /** provider message id when sent */
  id?: string;
  error?: string;
  /** which provider handled it */
  provider?: 'brevo' | 'resend';
}

type Provider = 'brevo' | 'resend' | null;

const brevoCreds = () => ({ user: (process.env.BREVO_SMTP_LOGIN || '').trim(), pass: (process.env.BREVO_SMTP_KEY || '').trim() });

/** Brevo wins when its SMTP login + key are set; otherwise Resend; otherwise no e-mail. */
function activeProvider(): Provider {
  const b = brevoCreds();
  if (b.user && b.pass) return 'brevo';
  if ((process.env.RESEND_API_KEY || '').trim()) return 'resend';
  return null;
}

export function mailConfigured(): boolean {
  return activeProvider() !== null;
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
  `<tr><td style="padding:9px 12px;color:#6B5A85;font-size:13px;width:40%;vertical-align:top;border-bottom:1px solid #EEE7F8">${esc(label)}</td><td style="padding:9px 12px;color:#2A1450;font-size:14px;font-weight:700;border-bottom:1px solid #EEE7F8">${value}</td></tr>`;

const chip = (icon: string, text: string) =>
  `<td style="padding:4px;vertical-align:top"><div style="background:#F4EEFF;border:2px solid #E2D5F8;border-radius:12px;padding:8px 10px;font-size:12px;font-weight:700;color:#2A1450;text-align:center">${icon}<br/>${text}</div></td>`;

/** Builds the e-mail (subject, HTML, attachments) for a paid order. */
export async function buildTicketEmail(o: StoredOrder) {
  const isRun = o.ticketType !== 'CONCERT' && o.ticketType !== 'ADDON';
  const start = isRun ? routesData[o.routeId as keyof typeof routesData]?.startTime : '';
  const numberLabel = isRun ? 'BIB NUMBER' : o.ticketType === 'CONCERT' ? 'CONCERT TICKET' : 'TICKET NO.';
  const title = isRun ? `บัตรวิ่ง & BIB #${o.bibNumber}` : `บัตร #${o.bibNumber}`;
  const subject = `${o.isTest ? '[ทดสอบ] ' : ''}[CHANGSUEK RUN] ชำระเงินสำเร็จ · ${title} · คำสั่งซื้อ ${o.orderId}`;
  // an add-on-only order happens on the activity day; everything else on run day
  const mainDate = !isRun && o.addOns && !o.concertQty && !o.vipTables ? eventInfo.activityDateNotice : eventInfo.dateNotice;

  const attachments: { filename: string; content: string; content_id?: string }[] = [
    { filename: 'changsuek-run-logo.png', content: EMAIL_LOGO_PNG_BASE64, content_id: 'event-logo' },
  ];
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
    row('คำสั่งซื้อ', `<span style="font-family:Consolas,monospace">${esc(o.orderId)}</span>`),
    row('ชื่อ', esc(o.fullName)),
    row('รายการ', esc(o.routeName)),
  ];
  if (isRun) {
    rows.push(row('วันวิ่ง', `${esc(eventInfo.dateNotice)}${start ? ` · ปล่อยตัว ${esc(start)}` : ''}`));
    if (o.shirtSize) rows.push(row('ไซส์เสื้อ', esc(o.shirtSize)));
    if (o.runningWithDog) rows.push(row('น้องสุนัข', `🐶 ${esc(o.dogName || '-')}`));
  }
  if (o.concertQty) rows.push(row('ตั๋วคอนเสิร์ต GA', `🎶 ${o.concertQty} ใบ · ${esc(eventInfo.dateNotice)} Door Open 17.30 น. · เริ่ม 18.00 น.`));
  if (o.vipTables) rows.push(row('VIP TABLE', `⭐ ${o.vipTables} โต๊ะ`));
  if (o.addOns)
    rows.push(
      row('กิจกรรมเสริม', `${esc(o.addOns.label)} × ${o.addOns.people} คน<br/><span style="color:#6B5A85;font-weight:600">${esc(eventInfo.activityDateNotice)}</span>`)
    );
  rows.push(row('ยอดชำระ', `<span style="color:#15803D">${formatBaht(o.totalPrice)} บาท ✓</span>`));

  const chips = [
    chip('📅', esc(mainDate)),
    isRun && start ? chip('⏱️', `ปล่อยตัว ${esc(start)}`) : '',
    chip('📍', esc(eventInfo.venueShort)),
  ].join('');

  const parkingHtml = parking
    .map(
      (p, i) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0;border-collapse:separate;border:3px solid #2A1450;border-radius:18px;background:#FFF6D6">
        <tr>
          <td style="padding:14px 16px;vertical-align:middle">
            <div style="display:inline-block;background:#2A1450;color:#FFC928;font-size:11px;font-weight:900;letter-spacing:1px;border-radius:999px;padding:4px 10px">🚗 VIP PARKING · คันที่ ${i + 1}</div>
            <div style="font-size:28px;font-weight:900;color:#111;margin-top:8px;line-height:1.1">${esc(p.plate)}</div>
            <div style="font-size:15px;font-weight:700;color:#3B1270">${esc(p.province)}</div>
            <div style="font-size:12px;color:#6B5A85;margin-top:8px">แสดง QR นี้ให้เจ้าหน้าที่สแกนที่ทางเข้าลานจอด VIP</div>
          </td>
          <td width="140" style="padding:12px;text-align:center;vertical-align:middle;border-left:2px dashed #2A1450">
            <img src="cid:parking-${i + 1}" width="120" height="120" alt="QR บัตรจอดรถ ${esc(p.plate)}" style="display:block;margin:0 auto;border-radius:8px;background:#fff" />
          </td>
        </tr>
      </table>`
    )
    .join('');

  // The A4 documents: a signed link, and the same page attached (images load from the site)
  const docsUrl = `${SITE}/api/orders/${encodeURIComponent(o.orderId)}/documents?s=${docsSignature(o.orderId)}`;
  const docsList = [
    isRun ? 'ป้าย BIB' : '',
    'บัตรเข้างาน',
    parking.length ? 'บัตรจอดรถ VIP' : '',
    o.insurance ? (o.runningWithDog ? 'ข้อมูลประกันนักวิ่งและน้องสุนัข' : 'ข้อมูลประกัน') : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const docsHtml = await buildDocumentsHtml(o, { assetBase: SITE });
  attachments.push({ filename: `CHANGSUEK_RUN_A4_${o.orderId}.html`, content: Buffer.from(docsHtml, 'utf8').toString('base64') });

  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/></head>
<body style="margin:0;padding:0;background:#EFE7FF;font-family:Tahoma,'Leelawadee UI','Noto Sans Thai',sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">ตั๋วของคุณพร้อมแล้ว ${esc(title)} · แสดง QR ในอีเมลนี้ที่จุดเช็กอิน</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFE7FF">
  <tr><td align="center" style="padding:20px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">

    <tr><td style="background:#2A1450;background-image:linear-gradient(135deg,#2A1450 0%,#5B20A8 60%,#7C3AED 100%);border-radius:24px 24px 0 0;padding:22px 20px 18px;text-align:center">
      <div style="background:#ffffff;border-radius:20px;display:inline-block;padding:8px 16px">
        <img src="cid:event-logo" width="220" height="110" alt="CHANGSUEK RUN เห็นช้างวิ่ง วิ่งตามช้าง" style="display:block;border:0" />
      </div>
      <div style="color:#FFC928;font-weight:900;font-size:12px;letter-spacing:2px;margin-top:14px">CHANGSUEK RUN 2027 · RUN TOGETHER</div>
      <div style="color:#ffffff;font-weight:900;font-size:24px;margin-top:4px">ชำระเงินสำเร็จ 🎉 ตั๋วมาแล้ว!</div>
    </td></tr>
    <tr><td style="height:10px;background:#FFC928;background-image:repeating-linear-gradient(135deg,#FFC928 0 12px,#2A1450 12px 24px);font-size:0;line-height:0">&nbsp;</td></tr>

    <tr><td style="background:#ffffff;border-left:3px solid #2A1450;border-right:3px solid #2A1450;padding:20px">
      <p style="margin:0 0 14px;color:#2A1450;font-size:15px;line-height:1.6">สวัสดีคุณ <b>${esc(o.fullName)}</b> 🐾<br/>ขอบคุณที่มาร่วมสนุกกับ CHANGSUEK RUN นี่คือตั๋วของคุณ เก็บอีเมลนี้ไว้แสดงที่จุดเช็กอินได้เลย</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:3px solid #2A1450;border-radius:20px;background:#FBF8FF">
        <tr>
          <td style="padding:16px;vertical-align:middle">
            <div style="font-size:11px;font-weight:900;letter-spacing:2px;color:#7C3AED">${numberLabel}</div>
            <div style="display:inline-block;margin-top:6px;background:#FFC928;border:3px solid #2A1450;border-radius:14px;padding:6px 14px;font-size:34px;font-weight:900;color:#2A1450;line-height:1">#${esc(o.bibNumber)}</div>
            <div style="font-size:15px;font-weight:900;color:#2A1450;margin-top:10px">${esc(o.routeName)}</div>
            <div style="font-size:12px;color:#6B5A85;margin-top:2px">${esc(o.fullName)}</div>
          </td>
          <td width="170" style="padding:12px;text-align:center;vertical-align:middle;border-left:3px dashed #C4B1E6">
            <img src="cid:ticket-qr" width="146" height="146" alt="QR เช็กอิน ${esc(o.orderId)}" style="display:block;margin:0 auto;border-radius:10px" />
            <div style="font-size:11px;font-weight:700;color:#6B5A85;margin-top:6px">สแกนเช็กอิน &amp; รับอุปกรณ์</div>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px"><tr>${chips}</tr></table>

      <div style="margin-top:16px;font-size:13px;font-weight:900;color:#2A1450">🧾 รายละเอียดคำสั่งซื้อ</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;border-collapse:collapse;background:#ffffff;border:2px solid #EEE7F8">${rows.join('')}</table>

      ${parkingHtml}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:separate;border:3px solid #2A1450;border-radius:18px;background:#FFF7DB">
        <tr><td style="padding:14px 16px;text-align:center">
          <div style="font-size:15px;font-weight:900;color:#2A1450">📄 เอกสาร A4 สำหรับพิมพ์</div>
          <div style="font-size:12px;color:#6B5A85;margin-top:4px;line-height:1.6">${esc(docsList)}</div>
          <a href="${esc(docsUrl)}" style="display:inline-block;margin-top:10px;background:#7C3AED;color:#ffffff;text-decoration:none;font-weight:900;font-size:15px;border-radius:12px;padding:12px 20px;border:2px solid #2A1450">เปิด / พิมพ์เอกสาร A4</a>
          <div style="font-size:11px;color:#6B5A85;margin-top:8px">มีไฟล์เดียวกันแนบมากับอีเมลนี้ด้วย (CHANGSUEK_RUN_A4_…html)</div>
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#F0FDF4;border:2px solid #BBF7D0;border-radius:14px">
        <tr><td style="padding:12px 14px;font-size:13px;color:#14532D;line-height:1.7">
          <b>✅ วันงานเตรียมตัวแบบนี้</b><br/>
          • เปิดอีเมลนี้ (หรือรูป QR ในไฟล์แนบ) ให้เจ้าหน้าที่สแกนที่จุดเช็กอิน<br/>
          • ดูตั๋ว ขอส่งตั๋วซ้ำ และข่าวล่าสุดได้ที่ <a href="https://www.changsuekrun.com" style="color:#15803D;font-weight:700">changsuekrun.com</a>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="background:#2A1450;border-radius:0 0 24px 24px;padding:18px 20px;text-align:center">
      <a href="${esc(eventInfo.facebookUrl)}" style="display:inline-block;background:#1877F2;color:#ffffff;text-decoration:none;font-weight:900;font-size:14px;border-radius:12px;padding:10px 18px">f&nbsp; ติดตามข่าวสารที่เพจ Facebook</a>
      <div style="color:#D8C8F5;font-size:12px;line-height:1.7;margin-top:12px">
        สถานที่: ${esc(eventInfo.venueShort)} · ติดต่อผู้จัดงาน: <a href="mailto:${esc(eventInfo.contactEmail)}" style="color:#FFC928">${esc(eventInfo.contactEmail)}</a> · ${esc(eventInfo.contactPhone)}<br/>
        ถ้ารูป QR ไม่ขึ้นในอีเมล เปิดไฟล์แนบ (PNG) ได้เลย
      </div>
      <div style="color:#FFC928;font-size:16px;margin-top:8px;letter-spacing:6px">🐾🐘🐾</div>
    </td></tr>

  </table>
  </td></tr></table>
</body></html>`;

  return { subject, html, attachments };
}

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type MailParts = Awaited<ReturnType<typeof buildTicketEmail>>;

async function sendViaResend(to: string, mail: MailParts, apiKey: string): Promise<MailResult> {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: (process.env.MAIL_FROM || DEFAULT_FROM).trim(),
      to: [to],
      reply_to: REPLY_TO,
      subject: mail.subject,
      html: mail.html,
      attachments: mail.attachments,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const json: any = await resp.json().catch(() => ({}));
  if (!resp.ok) return { ok: false, provider: 'resend', error: String(json?.message || json?.name || `HTTP_${resp.status}`).slice(0, 200) };
  return { ok: true, provider: 'resend', id: json?.id };
}

async function sendViaBrevo(to: string, mail: MailParts): Promise<MailResult> {
  const { user, pass } = brevoCreds();
  // host / port can be overridden for local tests only; the real relay is always used with TLS
  const host = (process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com').trim();
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.BREVO_SMTP_PORT) || 587,
    secure: false,
    requireTLS: !process.env.BREVO_SMTP_HOST,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 25_000,
  });
  try {
    const info = await transport.sendMail({
      from: (process.env.MAIL_FROM || DEFAULT_FROM).trim(),
      to,
      replyTo: REPLY_TO,
      subject: mail.subject,
      html: mail.html,
      attachments: mail.attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, 'base64'),
        ...(a.content_id ? { cid: a.content_id, contentDisposition: 'inline' as const } : {}),
      })),
    });
    return { ok: true, provider: 'brevo', id: String(info.messageId || '') };
  } finally {
    transport.close();
  }
}

/** Small branded e-mail for account actions (verify address, reset password). Never throws. */
export async function sendAccountMail(to: string, subject: string, heading: string, text: string, buttonLabel: string, url: string): Promise<MailResult> {
  const provider = activeProvider();
  if (!provider) return { ok: false, error: 'MAIL_NOT_CONFIGURED' };
  if (!VALID_EMAIL.test(to)) return { ok: false, provider, error: 'NO_EMAIL' };
  const html = `<!doctype html><html lang="th"><body style="margin:0;background:#F4EEFF;font-family:Arial,'Noto Sans Thai',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:24px;border:3px solid #2A1450;overflow:hidden">
    <tr><td style="background:#2A1450;padding:18px 22px;color:#FFC928;font-weight:900;font-size:13px;letter-spacing:2px">CHANGSUEK RUN 2027</td></tr>
    <tr><td style="padding:26px 24px;color:#2A1450">
      <h1 style="margin:0 0 10px;font-size:22px">${esc(heading)}</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7">${esc(text)}</p>
      <a href="${esc(url)}" style="display:inline-block;background:#FFC928;color:#2A1450;text-decoration:none;font-weight:900;font-size:16px;border-radius:14px;padding:14px 26px;border:3px solid #140826">${esc(buttonLabel)}</a>
      <p style="margin:20px 0 0;font-size:12px;color:#6B5A85;line-height:1.6">ถ้าปุ่มกดไม่ได้ ให้คัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:<br/><span style="word-break:break-all">${esc(url)}</span><br/>หากคุณไม่ได้เป็นผู้ขอ ไม่ต้องทำอะไร อีเมลนี้จะหมดอายุเอง</p>
    </td></tr>
  </table></td></tr></table></body></html>`;
  const mail = { subject, html, attachments: [] } as unknown as MailParts;
  try {
    if (provider === 'brevo') return await sendViaBrevo(to, mail);
    return await sendViaResend(to, mail, (process.env.RESEND_API_KEY || '').trim());
  } catch (err: any) {
    return { ok: false, provider, error: String(err?.message || 'NETWORK').slice(0, 200) };
  }
}

export const SITE_URL = SITE;

/** Sends the ticket e-mail to the address on the order. Never throws. */
export async function sendTicketEmail(o: StoredOrder): Promise<MailResult> {
  const provider = activeProvider();
  if (!provider) return { ok: false, error: 'MAIL_NOT_CONFIGURED' };
  if (!o.email || !VALID_EMAIL.test(o.email)) return { ok: false, provider, error: 'NO_EMAIL' };
  try {
    const mail = await buildTicketEmail(o);
    if (provider === 'brevo') return await sendViaBrevo(o.email, mail);
    return await sendViaResend(o.email, mail, (process.env.RESEND_API_KEY || '').trim());
  } catch (err: any) {
    const text = String(err?.response || err?.message || 'NETWORK').replace(/\s+/g, ' ').slice(0, 200);
    return { ok: false, provider, error: err?.name === 'TimeoutError' || err?.code === 'ETIMEDOUT' ? 'TIMEOUT' : text };
  }
}
