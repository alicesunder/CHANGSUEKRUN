// Builds email-preview/documents-sample.html: every A4 document the ticket e-mail would carry,
// filled with a made-up order (no real customer data). Run from the project folder with npx tsx.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QRCode from 'qrcode';
import { writeFileSync } from 'node:fs';
import { WaiverDocument } from '../src/components/WaiverDocument';
import type { WaiverParticipant } from '../src/data/activityWaivers';

const ROOT = 'C:/Users/nakan/Downloads/chang-suek-run-updated (5)/CHANGSUEKRUN';
const PHONES = ['084-789-4651', '097-145-1945', '095-449-9741'];

// ---------- made-up sample order ----------
const order = {
  orderId: 'CSR27-8F3K2Q',
  route: '1km',
  routeLabel: '1K',
  routeName: '1 KM วิ่งคู่น้องสุนัข',
  start: '17.30 น.',
  bib: '01-0001',
  email: 'somchai@example.com',
  phone: '081-234-5678',
  emergencyPhone: '089-876-5432',
  paidAt: '3 พ.ย. 2569 · 14:22 น.',
  total: 5_480,
  dog: { name: 'ลัคกี้', breed: 'โกลเด้น รีทรีฟเวอร์' },
  runners: [
    { prefix: 'นาย', first: 'สมชาย', last: 'ใจดี', gender: 'ชาย', birth: '1986-04-12', age: 40, blood: 'O', med: 'ไม่มี', emName: 'สมศรี ใจดี', rel: 'คู่สมรส', shirt: 'L' },
    { prefix: 'นางสาว', first: 'นภา', last: 'ใจดี', gender: 'หญิง', birth: '1998-09-03', age: 28, blood: 'A', med: 'แพ้ยาเพนิซิลลิน', emName: 'สมศรี ใจดี', rel: 'มารดา', shirt: 'S' },
  ],
  items: [
    { name: 'บัตรวิ่ง 1 KM วิ่งคู่น้องสุนัข (1 คน + น้องหมา 1 ตัว)', qty: 1, amount: 790 },
    { name: 'ผู้ร่วมวิ่งเพิ่ม', qty: 1, amount: 450 },
    { name: 'VIP TABLE คอนเสิร์ต (6 ท่าน · ที่จอดรถ 2 คัน)', qty: 1, amount: 2_990 },
    { name: 'กิจกรรมเสริม: หอสูง + อุโมงค์ลม', qty: 2, amount: 1_250 },
  ],
  cars: [
    { plate: 'กข 1234', province: 'กรุงเทพมหานคร' },
    { plate: '2กค 5678', province: 'เพชรบุรี' },
  ],
};

const ageGroup = (age: number) => {
  const lo = Math.floor(age / 10) * 10;
  return { idx: Math.floor(age / 10), range: `${lo}-${lo + 9}` };
};
const qr = (text: string, dark = '#1E0B3D') => QRCode.toDataURL(text, { margin: 1, width: 360, errorCorrectionLevel: 'M', color: { dark, light: '#FFFFFF' } });

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function main() {
  const bibs = await Promise.all(
    order.runners.map(async (r, i) => {
      const bib = i === 0 ? order.bib : `${order.bib}-${i + 1}`;
      const g = ageGroup(r.age);
      const code = await qr(JSON.stringify({ orderId: order.orderId, bib }));
      return `
      <div class="bib">
        <img class="bib-bg" src="/images/bib/bib-base.webp" alt="" />
        <div class="bib-dist"><b>${order.routeLabel}</b><span>DOG RUN</span></div>
        <div class="bib-age">
          <div class="bib-age-box"><b>${r.gender === 'หญิง' ? 'F' : 'M'}</b><i></i><b>${g.idx}</b></div>
          <small>AGE GROUP</small><strong>${g.range}</strong>
        </div>
        <div class="bib-num" style="font-size:${Math.min(17.6, 64 / (bib.length * 0.62)).toFixed(2)}cqw">${bib}</div>
        <div class="bib-line"></div>
        <div class="bib-name">${esc(r.first)} ${esc(r.last)}<span style="color:#0F766E;font-size:.8em"> · 🐶 ${esc(order.dog.name)}</span></div>
        <div class="bib-qr"><img src="${code}" alt="QR" /><small>CHECK-IN · RACE RESULT</small></div>
        <div class="bib-sos"><small>EMERGENCY CONTACT</small>${PHONES.map((p) => `<b>${p}</b>`).join('')}</div>
      </div>`;
    })
  );

  const ticketQr = await qr(JSON.stringify({ orderId: order.orderId, bib: order.bib }));
  const parkQr = await Promise.all(order.cars.map((c) => qr(JSON.stringify({ orderId: order.orderId, type: 'VIP_PARKING', plate: `${c.plate} ${c.province}` }), '#7A4B00')));

  const waiverPeople: WaiverParticipant[] = order.runners.map((r, i) => ({
    fullName: `${r.first} ${r.last}`,
    birthDate: r.birth,
    phone: i === 0 ? '0812345678' : '0823456789',
    idCard: i === 0 ? '1101700207030' : '1103700012345',
    guardianName: '',
    windHealth: { medical: 'ok', weight: 'ok', shoulder: 'ok', pregnant: 'ok', cast: 'ok' },
  }));
  const waivers = (['tower', 'wind'] as const).flatMap((a) =>
    waiverPeople.map(
      (p) => `<section class="page doc"><div class="doc-tag">📜 เอกสารแนบ · ${a === 'tower' ? 'กิจกรรมโดดหอสูง' : 'กิจกรรมอุโมงค์ลม'}</div>${renderToStaticMarkup(
        <WaiverDocument activity={a} participant={p} orderId={order.orderId} acceptedAt="2026-11-03T07:22:00.000Z" />
      )}</section>`
    )
  );

  const head = (kicker: string, title: string, color: string) => `
    <header class="band" style="--c:${color}">
      <img src="/images/brand/changsuek-run-logo.webp" alt="CHANGSUEK RUN" class="logo" />
      <div><p class="kicker">${kicker}</p><h1>${title}</h1></div>
      <div class="band-id"><small>เลขคำสั่งซื้อ</small><b>${order.orderId}</b></div>
    </header>`;
  const foot = `<footer class="foot">ติดต่อผู้จัดงาน (กองบัญชาการตำรวจตระเวนชายแดน): ${PHONES.join(' · ')} · contact@changsuekrun.com · www.changsuekrun.com</footer>`;

  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ตัวอย่างเอกสารแนบอีเมล · CHANGSUEK RUN 2027</title>
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Mitr:wght@400;500;600;700&family=Sarabun:wght@400;600;700;800&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
<style>
  :root { --ink:#1E0B3D; --purple:#5B21B6; --gold:#FFC928; --pink:#EC4899; --sky:#0EA5E9; --mint:#10B981; }
  * { box-sizing: border-box; }
  body { margin:0; background:#E9E4F5; font-family:'Sarabun',sans-serif; color:var(--ink); }
  .note { max-width:210mm; margin:18px auto 0; padding:12px 16px; border-radius:14px; background:#FFF7DB; border:2px dashed #E0A800; font:600 14px/1.5 'Sarabun',sans-serif; }
  .page { width:210mm; min-height:297mm; margin:18px auto; background:#fff; position:relative; overflow:hidden; box-shadow:0 10px 40px rgba(30,11,61,.18); padding:0 0 18mm; }
  .band { display:flex; align-items:center; gap:14px; padding:14px 18mm; color:#fff; background:linear-gradient(115deg, var(--ink), var(--c) 70%, var(--pink)); position:relative; }
  .band::after { content:''; position:absolute; left:0; right:0; bottom:-6px; height:6px; background:repeating-linear-gradient(135deg, var(--gold) 0 12px, var(--ink) 12px 24px); }
  .band .logo { width:64px; height:64px; object-fit:contain; background:#fff; border-radius:16px; padding:4px; border:3px solid var(--gold); }
  .band h1 { margin:0; font:700 24px/1.2 'Mitr',sans-serif; }
  .band .kicker { margin:0; font:800 11px/1 'Montserrat',sans-serif; letter-spacing:.2em; color:var(--gold); }
  .band-id { margin-left:auto; text-align:right; } .band-id small { display:block; font-size:11px; opacity:.8 } .band-id b { font:800 15px 'Montserrat',sans-serif; }
  .body { padding:12mm 18mm 0; }
  .foot { position:absolute; left:0; right:0; bottom:0; padding:8px 18mm; font-size:11px; font-weight:700; color:#5B4A7A; background:#F5F0FF; border-top:2px solid #E4D9FB; }
  h2.sec { font:600 17px 'Mitr',sans-serif; margin:0 0 8px; display:flex; align-items:center; gap:8px; }
  h2.sec::after { content:''; flex:1; height:3px; border-radius:3px; background:linear-gradient(90deg, var(--gold), transparent); }
  .cut { border:0; border-top:2px dashed #B9A8DA; margin:7mm 0; position:relative; } .cut::before { content:'✂ ตัดตามเส้น'; position:absolute; left:0; top:-11px; background:#fff; padding:0 6px; font-size:11px; color:#7C6A9C; font-weight:700; }

  /* BIB: positions are % of the 1536 x 1024 artwork */
  .bib { position:relative; width:90%; margin:0 auto; aspect-ratio:1536/1024; container-type:inline-size; border-radius:10px; overflow:hidden; box-shadow:0 4px 18px rgba(30,11,61,.18); }
  .bib-bg { position:absolute; inset:0; width:100%; height:100%; }
  .bib-dist { position:absolute; left:64%; top:8.6%; width:17.6%; height:17.8%; border-radius:2cqw; background:linear-gradient(160deg,#2A1260,#3B1883); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; }
  .bib-dist b { font:900 9.6cqw/0.95 'Montserrat',sans-serif; letter-spacing:-.04em; }
  .bib-dist span { margin-top:.5cqw; padding-top:.4cqw; border-top:.35cqw solid var(--gold); font:800 1.55cqw 'Montserrat',sans-serif; letter-spacing:.12em; }
  .bib-age { position:absolute; left:2.7%; top:38.9%; width:9.9%; text-align:center; }
  .bib-age-box { background:#3B1883; border-radius:.9cqw; color:#fff; padding:.6cqw 0; }
  .bib-age-box b { display:block; font:900 4.9cqw/1.05 'Montserrat',sans-serif; } .bib-age-box i { display:block; height:.35cqw; margin:.2cqw .6cqw; background:var(--gold); }
  .bib-age small { display:block; margin-top:.9cqw; font:800 1.2cqw 'Montserrat',sans-serif; color:#3B1883; } .bib-age strong { font:800 2.2cqw 'Montserrat',sans-serif; color:#3B1883; }
  .bib-num { position:absolute; left:15.4%; width:68%; top:38.5%; height:31%; display:flex; align-items:center; justify-content:center; font:900 17.6cqw/1 'Montserrat',sans-serif; letter-spacing:-.05em; color:#160A2E; white-space:nowrap; }
  .bib-line { position:absolute; left:16.2%; width:66.2%; top:70.4%; height:.35cqw; background:var(--gold); }
  .bib-name { position:absolute; left:15.4%; width:68%; top:71.6%; text-align:center; font:700 3.6cqw/1.25 'Mitr',sans-serif; color:#2A1450; letter-spacing:.02em; }
  .bib-qr { position:absolute; left:85.2%; top:39%; width:12.6%; text-align:center; }
  .bib-qr img { width:100%; border:.35cqw solid #160A2E; border-radius:.8cqw; display:block; }
  .bib-qr small { display:block; margin-top:.5cqw; font:800 .95cqw 'Montserrat',sans-serif; color:#2A1450; }
  .bib-sos { position:absolute; left:84.8%; top:64.2%; width:13.4%; text-align:center; border-top:.3cqw solid var(--gold); padding-top:.5cqw; }
  .bib-sos small { display:block; font:800 .9cqw 'Montserrat',sans-serif; color:#2A1450; } .bib-sos b { display:block; font:800 1.45cqw/1.3 'Montserrat',sans-serif; color:#160A2E; }
  .bib-strip { position:absolute; left:3.4%; width:93.2%; top:82.2%; height:12%; display:flex; align-items:center; justify-content:space-between; gap:1cqw; padding:0 2cqw; font:600 2cqw 'Mitr',sans-serif; color:#2A1450; }
  .bib-strip .chip { background:#F3ECFF; border:.25cqw solid #C4B5FD; border-radius:99px; padding:.3cqw 1.4cqw; white-space:nowrap; }

  /* ticket */
  .hero-ticket { display:grid; grid-template-columns:1fr 54mm; border-radius:18px; overflow:hidden; border:3px solid var(--ink); box-shadow:0 6px 0 var(--ink); }
  .hero-ticket .l { padding:16px 18px; background:linear-gradient(135deg,#F5F0FF,#FFF7DB 60%,#FCE7F3); }
  .hero-ticket .r { padding:14px; background:var(--ink); color:#fff; text-align:center; border-left:3px dashed var(--gold); }
  .hero-ticket .r img { width:100%; border-radius:12px; background:#fff; padding:6px; }
  .tag { display:inline-block; padding:3px 12px; border-radius:99px; font:700 12px 'Mitr'; color:#fff; background:var(--pink); }
  .big { font:700 30px/1.15 'Mitr'; margin:6px 0 2px; }
  .facts { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:12px; }
  .fact { background:#fff; border:2px solid #E4D9FB; border-radius:12px; padding:7px 10px; } .fact small { display:block; font-size:11px; color:#6B5A85; font-weight:700 } .fact b { font:600 15px 'Mitr' }
  table.items { width:100%; border-collapse:separate; border-spacing:0 6px; font-size:14px; } .items td { padding:8px 10px; background:#FAF7FF; } .items td:first-child { border-radius:10px 0 0 10px } .items td:last-child { border-radius:0 10px 10px 0; text-align:right; font-weight:800 }
  .total { display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding:12px 16px; border-radius:14px; color:#fff; background:linear-gradient(90deg,var(--ink),var(--purple)); font:600 18px 'Mitr'; } .total b { color:var(--gold); font:800 24px 'Montserrat' }
  .cards3 { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; } .card { border-radius:14px; padding:10px 12px; border:2px solid; font-size:13px; line-height:1.55; } .card b { font:600 15px 'Mitr'; display:block; margin-bottom:2px }

  /* parking */
  .park { border-radius:22px; border:4px solid #7A4B00; overflow:hidden; display:grid; grid-template-columns:1fr 62mm; box-shadow:0 7px 0 #7A4B00; }
  .park .l { padding:16px 20px; background:linear-gradient(135deg,#FFF3C4,#FFE08A 50%,#FFC928); }
  .park .r { background:#2A1450; color:#fff; padding:14px; text-align:center; } .park .r img { width:100%; border-radius:12px; padding:6px; background:#fff; }
  .park .vip { font:900 46px/1 'Montserrat'; color:#3B1F00; letter-spacing:-.02em; } .park .vip span { color:#B45309 }
  .plate { display:inline-block; margin-top:10px; padding:6px 16px; border-radius:10px; background:#fff; border:3px solid #111; font:700 26px/1.2 'Mitr'; text-align:center; } .plate small { display:block; font-size:12px; font-weight:600 }

  /* insurance */
  .ins { border-radius:16px; border:2.5px solid; overflow:hidden; margin-bottom:10px; }
  .ins header { padding:8px 14px; color:#fff; font:600 16px 'Mitr'; display:flex; justify-content:space-between; }
  .ins .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:0; } .ins .grid div { padding:7px 12px; border-top:1px solid #EEE7FB; border-right:1px solid #EEE7FB; font-size:13px } .ins .grid small { display:block; color:#6B5A85; font-size:11px; font-weight:700 } .ins .grid b { font-weight:800; font-size:14px }
  .doc { padding:14mm 18mm 18mm; } .doc-tag { display:inline-block; margin-bottom:8px; padding:4px 12px; border-radius:99px; background:#F0FDFA; border:2px solid #0F766E; font:600 12px 'Mitr'; color:#0F766E; }
  @page { size:A4; margin:0 } @media print { body { background:#fff } .note { display:none } .page { margin:0; box-shadow:none; page-break-after:always } }
</style></head><body>
<div class="note">🧪 <b>ตัวอย่างเอกสาร A4 ที่จะแนบในอีเมลหลังชำระเงิน</b> (ข้อมูลสมมุติ ไม่ใช่ลูกค้าจริง) · ตัวอย่างเป็นคำสั่งซื้อ 1K วิ่งคู่น้องสุนัข 2 คน + VIP TABLE + หอสูง/อุโมงค์ลม 2 คน จึงเห็นเอกสารครบทุกแบบ</div>

<section class="page">
  ${head('OFFICIAL RACE BIB', 'ป้ายหมายเลขวิ่ง (BIB)', '#5B21B6')}
  <div class="body">
    <h2 class="sec">🏃 พิมพ์แนวตั้ง A4 · ตัดตามเส้น · ติดหน้าอกด้วยเข็มกลัด 4 มุม</h2>
    ${bibs.join('<hr class="cut" />')}
    <p style="margin:10px 0 0;font-size:12.5px;color:#5B4A7A;font-weight:600">BIB ตัวจริงพร้อมชิปจับเวลารับได้ที่จุดรับอุปกรณ์ · ใบนี้ใช้ยืนยันตัวตนและสแกน QR เช็กอิน</p>
  </div>
  ${foot}
</section>

<section class="page">
  ${head('E-TICKET · RACE KIT PASS', 'บัตรเข้างาน & ใบยืนยันการชำระเงิน', '#7C3AED')}
  <div class="body">
    <div class="hero-ticket">
      <div class="l">
        <span class="tag">ชำระเงินแล้ว ✓</span>
        <div class="big">${order.routeName}</div>
        <div style="font-weight:700;color:#5B4A7A">${order.runners.map((r) => `${r.prefix}${r.first} ${r.last}`).join(' · ')} · 🐶 ${order.dog.name}</div>
        <div class="facts">
          <div class="fact"><small>วันแข่งขัน</small><b>9 ม.ค. 2570</b></div>
          <div class="fact"><small>ปล่อยตัว</small><b>${order.start}</b></div>
          <div class="fact"><small>BIB</small><b>#${order.bib}</b></div>
          <div class="fact"><small>กิจกรรมเสริม</small><b>10 ม.ค. 2570</b></div>
          <div class="fact"><small>คอนเสิร์ต</small><b>19.00–23.00 น.</b></div>
          <div class="fact"><small>ชำระเมื่อ</small><b style="font-size:13px">${order.paidAt}</b></div>
        </div>
      </div>
      <div class="r"><img src="${ticketQr}" alt="QR เช็กอิน" /><div style="margin-top:6px;font:600 13px 'Mitr'">QR เช็กอิน / รับอุปกรณ์</div><div style="font-size:11px;opacity:.75">แสดงที่จุดรับอุปกรณ์</div></div>
    </div>
    <h2 class="sec" style="margin-top:16px">🧾 รายการที่ซื้อ</h2>
    <table class="items">${order.items.map((it) => `<tr><td>${it.name}</td><td style="text-align:center;width:50px">×${it.qty}</td><td>${it.amount.toLocaleString('th-TH')} บาท</td></tr>`).join('')}</table>
    <div class="total"><span>ยอดชำระสุทธิ (PromptPay)</span><b>${order.total.toLocaleString('th-TH')} บาท</b></div>
    <h2 class="sec" style="margin-top:16px">📍 วันงานต้องทำอะไรบ้าง</h2>
    <div class="cards3">
      <div class="card" style="border-color:#C4B5FD;background:#F5F0FF"><b>1. รับอุปกรณ์</b>8 ม.ค. 2570 · 10.00–18.00 น.<br />ลานกิจกรรม ค่ายนเรศวร<br />แสดง QR นี้ + บัตรประชาชน</div>
      <div class="card" style="border-color:#7DD3FC;background:#E0F2FE"><b>2. วันแข่ง</b>9 ม.ค. 2570 · ปล่อยตัว ${order.start}<br />หน้าโรงแรม Sea Sand Sun<br />มาก่อนเวลา 45 นาที</div>
      <div class="card" style="border-color:#86EFAC;background:#ECFDF5"><b>3. น้องหมา</b>นำสมุดวัคซีน สายจูง ถุงเก็บมูล<br />มีน้ำดื่มสำหรับน้องที่จุดกลับตัว</div>
    </div>
  </div>
  ${foot}
</section>

<section class="page">
  ${head('VIP PARKING PASS', 'บัตรจอดรถ VIP (เฉพาะผู้ซื้อ VIP TABLE)', '#B45309')}
  <div class="body">
    <h2 class="sec">🚗 วางบัตรไว้หน้ารถให้เจ้าหน้าที่เห็นชัด · 1 ใบต่อรถ 1 คัน</h2>
    ${order.cars
      .map(
        (c, i) => `<div class="park">
      <div class="l">
        <div style="font:800 12px 'Montserrat';letter-spacing:.2em;color:#7A4B00">CHANGSUEK RUN 2027 · CONCERT</div>
        <div class="vip">VIP <span>PARKING</span></div>
        <div style="font:600 15px 'Mitr';margin-top:4px">คันที่ ${i + 1} / ${order.cars.length} · 9 ม.ค. 2570 · 16.00–23.30 น.</div>
        <div class="plate">${esc(c.plate)}<small>${esc(c.province)}</small></div>
        <div style="margin-top:10px;font-size:13px;font-weight:700;color:#5B3A00">ลานจอด VIP ข้างเวทีคอนเสิร์ต · ผู้ซื้อ: ${order.runners[0].first} ${order.runners[0].last}</div>
      </div>
      <div class="r"><img src="${parkQr[i]}" alt="QR บัตรจอดรถ" /><div style="margin-top:6px;font:600 13px 'Mitr'">สแกนที่ทางเข้าลานจอด</div><div style="font-size:11px;opacity:.75">ใช้ได้ 1 ครั้ง · ตรงกับทะเบียนนี้เท่านั้น</div></div>
    </div>`
      )
      .join('<hr class="cut" />')}
  </div>
  ${foot}
</section>

<section class="page">
  ${head('ACCIDENT INSURANCE', 'ข้อมูลประกันอุบัติเหตุ (นักวิ่ง & น้องสุนัข)', '#0F766E')}
  <div class="body">
    <p style="margin:0 0 10px;font-size:13.5px;font-weight:600;color:#3F3358">ข้อมูลนี้ส่งให้บริษัทประกันภัยเพื่อทำประกันอุบัติเหตุสำหรับกิจกรรมนี้เท่านั้น ตรวจสอบความถูกต้อง หากผิดให้แจ้งผู้จัดงานก่อน 31 ธ.ค. 2569</p>
    ${order.runners
      .map(
        (r, i) => `<div class="ins" style="border-color:${i ? '#EC4899' : '#7C3AED'}">
      <header style="background:linear-gradient(90deg,${i ? '#EC4899' : '#7C3AED'},#1E0B3D)"><span>🛡️ ผู้เอาประกันคนที่ ${i + 1}: ${r.prefix}${r.first} ${r.last}</span><span>BIB #${i ? `${order.bib}-${i + 1}` : order.bib}</span></header>
      <div class="grid">
        <div><small>เพศ</small><b>${r.gender}</b></div><div><small>วันเกิด (ค.ศ.)</small><b>${r.birth}</b></div><div><small>อายุ</small><b>${r.age} ปี</b></div><div><small>กรุ๊ปเลือด</small><b>${r.blood}</b></div>
        <div style="grid-column:span 2"><small>โรคประจำตัว / แพ้ยา</small><b>${esc(r.med)}</b></div><div><small>ระยะวิ่ง</small><b>${order.routeName}</b></div><div><small>ไซส์เสื้อ</small><b>${r.shirt}</b></div>
        <div style="grid-column:span 2"><small>ผู้ติดต่อฉุกเฉิน</small><b>${esc(r.emName)} (${r.rel})</b></div><div style="grid-column:span 2"><small>เบอร์ผู้ติดต่อฉุกเฉิน</small><b>${order.emergencyPhone}</b></div>
      </div></div>`
      )
      .join('')}
    <div class="ins" style="border-color:#10B981">
      <header style="background:linear-gradient(90deg,#10B981,#0F766E)"><span>🐶 น้องสุนัขผู้ร่วมวิ่ง: ${order.dog.name}</span><span>Dog Pass #${order.bib}</span></header>
      <div class="grid">
        <div><small>ชื่อน้อง</small><b>${order.dog.name}</b></div><div><small>สายพันธุ์</small><b>${order.dog.breed}</b></div><div><small>เจ้าของ</small><b>${order.runners[0].first} ${order.runners[0].last}</b></div><div><small>เบอร์เจ้าของ</small><b>${order.phone}</b></div>
        <div style="grid-column:span 4"><small>เงื่อนไข</small><b>ต้องมีสมุดวัคซีนพิษสุนัขบ้า + วัคซีนรวม (ไม่เกิน 1 ปี) · สัตวแพทย์อาสาประจำงานตลอดเส้นทาง</b></div>
      </div>
    </div>
  </div>
  ${foot}
</section>
${waivers.join('\n')}
<script>const m=/^#p([0-9]+)$/.exec(location.hash);if(m){document.querySelector('.note').remove();document.querySelectorAll('.page').forEach((p,i)=>{if(i!==+m[1]-1)p.remove();else p.style.margin='0'});document.body.style.background='#fff'}</script></body></html>`;
  writeFileSync(`${ROOT}/email-preview/documents-sample.html`, html);
  console.log('written', html.length);
}
main();
