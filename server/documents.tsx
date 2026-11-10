/**
 * The A4 documents of a paid order, as one printable HTML page (approved design, Nov 2026):
 * race BIB per runner, e-ticket, VIP parking passes and insurance details (runners + dog).
 * (The tower / wind-tunnel waivers are not part of it any more.) Served from a signed link in the ticket e-mail and attached to it.
 * National ID numbers are masked here; the organiser sees the full numbers in the admin console.
 */
import React from 'react';
import QRCode from 'qrcode';
import { VIP_TABLE_SEATS, eventInfo, formatBaht, routesData, scheduleData, ticketById } from '../src/data/eventData';
import { ACT_DAY, RACE_DAY, isRunOrder, priceLines, ticketEntitlements } from './entitlements';
import { parkingQrPayload } from '../src/data/vipParking';
import { maskPassport, type InsuranceInfo } from '../src/data/insurance';
import { maskThaiId } from '../src/data/shooting';
import { BIB_PERKS, BIB_SIZE_LABEL, BIB_SPONSOR_LOGOS } from '../src/data/bibStrip';
import type { StoredOrder } from './store';

const DIST: Record<string, { label: string; sub: string }> = {
  '10km': { label: '10K', sub: 'THAILAND' },
  '5km': { label: '5K', sub: 'THAILAND' },
  '3km': { label: '4K', sub: 'DOG RUN' },
  '1km': { label: '1K', sub: 'DOG RUN' },
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const qr = (text: string, dark = '#1E0B3D') =>
  QRCode.toDataURL(text, { margin: 1, width: 360, errorCorrectionLevel: 'M', color: { dark, light: '#FFFFFF' } });

/** BIB of runner n: runner 1 keeps the order's BIB, the others get -2, -3, ... (same as src/components/RaceBib.tsx) */
const runnerBib = (bib: string, i: number) => (i === 0 ? bib : `${bib}-${i + 1}`);

const thaiDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }) : '';

/** The images the BIB / header use, so the attached copy can carry them inside the file. */
export const DOC_IMAGES: string[] = ['/images/brand/changsuek-run-logo-v3.webp', '/images/bib/bib-base-v3.webp', ...BIB_SPONSOR_LOGOS];

export async function buildDocumentsHtml(
  o: StoredOrder,
  /** assetBase: where images load from. inline: image path -> data: URI; when given the file needs no network (e-mail attachment viewers block outside images). */
  opts: { assetBase?: string; inline?: Record<string, string> } = {}
): Promise<string> {
  const A = opts.assetBase || '';
  const inl = opts.inline;
  const picVar = (path: string) => `--pic-${DOC_IMAGES.indexOf(path)}`;
  /** One picture: an <img> from the site, or (inline mode) a box whose background is a data: URI declared once in :root. */
  const pic = (path: string, cls: string) =>
    inl && inl[path]
      ? `<span class="${cls} pic" style="background-image:var(${picVar(path)})" role="img" aria-hidden="true"></span>`
      : `<img src="${A}${path}" alt="" class="${cls}" />`;
  const inlineVars = inl ? `:root{${DOC_IMAGES.filter((p) => inl[p]).map((p) => `${picVar(p)}:url(${inl[p]})`).join(';')}}` : '';
  const isRun = o.ticketType !== 'CONCERT' && o.ticketType !== 'ADDON' && Boolean(DIST[o.routeId]);
  const start = isRun ? routesData[o.routeId as keyof typeof routesData]?.startTime || '' : '';
  const phones = eventInfo.contactPhones;
  const runners: { name: string; ins?: InsuranceInfo; shirt: string }[] = isRun
    ? [{ name: o.fullName, ins: o.insurance, shirt: o.shirtSize }, ...(o.extraRunners || []).map((r) => ({ name: r.name, ins: r.insurance, shirt: r.shirtSize }))]
    : [];
  const dog = isRun && o.runningWithDog ? o.dogName || '' : '';

  const head = (kicker: string, title: string, color: string) => `
    <header class="band" style="--c:${color}">
      ${pic('/images/brand/changsuek-run-logo-v3.webp', 'logo')}
      <div><p class="kicker">${kicker}</p><h1>${title}</h1></div>
      <div class="band-id"><small>เลขคำสั่งซื้อ</small><b>${esc(o.orderId)}</b></div>
    </header>`;
  const foot = `<footer class="foot">ติดต่อผู้จัดงาน (กองบัญชาการตำรวจตระเวนชายแดน): ${phones.join(' · ')} · ${esc(eventInfo.contactEmail)} · www.changsuekrun.com</footer>`;
  const pages: string[] = [];

  // ---- 1. BIB: two per A4 page
  if (isRun && o.bibNumber) {
    const d = DIST[o.routeId];
    const bibs = await Promise.all(
      runners.map(async (r, i) => {
        const bib = runnerBib(o.bibNumber, i);
        const age = r.ins?.age;
        const hasAge = typeof age === 'number' && age > 0 && age < 111;
        const decade = hasAge ? Math.floor(age / 10) : null;
        const letter = r.ins?.gender === 'หญิง' ? 'F' : r.ins?.gender === 'ชาย' ? 'M' : '•';
        const size = Math.min(17.6, 64 / (Math.max(bib.length, 4) * 0.62)).toFixed(2);
        const code = await qr(JSON.stringify({ orderId: o.orderId, bib }));
        return `
        <div class="bib">
          ${pic('/images/bib/bib-base-v3.webp', 'bib-bg')}
          <div class="bib-dist"><b>${d.label}</b><span>${d.sub}</span></div>
          <div class="bib-age">
            <div class="bib-age-box"><b>${letter}</b><i></i><b>${decade ?? '•'}</b></div>
            <small>AGE GROUP</small><strong>${decade !== null ? `${decade * 10}-${decade * 10 + 9}` : '—'}</strong>
          </div>
          <div class="bib-num" style="font-size:${size}cqw">${esc(bib)}</div>
          <div class="bib-line"></div>
          <div class="bib-name">${esc(r.name)}${dog ? `<span style="color:#0F766E;font-size:.8em"> · 🐶 ${esc(dog)}</span>` : ''}</div>
          <div class="bib-qr"><img src="${code}" alt="QR" /><small>CHECK-IN · RACE RESULT</small></div>
          <div class="bib-strip">
            <div class="bib-logos">${BIB_SPONSOR_LOGOS.map((s) => pic(s, 'bib-logo')).join('')}</div>
            <div class="bib-perks">
              ${BIB_PERKS.map((p) => `<div class="bib-perk"><span class="bib-perk-ic">${p.icon}</span><small>${p.label}</small></div>`).join('')}
              <div class="bib-perk"><span class="bib-perk-size">${esc(r.shirt || '')}</span><small>${BIB_SIZE_LABEL}</small></div>
            </div>
          </div>
          <div class="bib-sos"><small>EMERGENCY CONTACT</small>${phones.map((p) => `<b>${p}</b>`).join('')}</div>
        </div>`;
      })
    );
    for (let i = 0; i < bibs.length; i += 2) {
      pages.push(`<section class="page">
  ${head('OFFICIAL RACE BIB', 'ป้ายหมายเลขวิ่ง (BIB)', '#5B21B6')}
  <div class="body">
    <h2 class="sec">🏃 พิมพ์แนวตั้ง A4 · ตัดตามเส้น · ติดหน้าอกด้วยเข็มกลัด 4 มุม</h2>
    ${bibs.slice(i, i + 2).join('<hr class="cut" />')}
    <p class="hint">BIB ตัวจริงพร้อมชิปจับเวลารับได้ที่จุดรับอุปกรณ์ · ใบนี้ใช้ยืนยันตัวตนและสแกน QR เช็กอิน</p>
  </div>
  ${foot}
</section>`);
    }
  }

  // ---- 2. E-ticket: what was bought, one numbered row per entitlement, then the event details
  const ticketQr = await qr(JSON.stringify({ orderId: o.orderId, bib: o.bibNumber }));
  const mapQr = await qr(eventInfo.googleMapsUrl);
  const pickup = scheduleData[0];
  const pickupItem = pickup?.items[0];
  const names = runners.length ? runners.map((r) => esc(r.name)).join(' · ') : esc(o.fullName);
  const ents = ticketEntitlements(o);
  const lines = priceLines(o);
  const showLines = lines !== null;

  const entHtml = ents
    .map(
      (e, i) => `<div class="ent">
        <div class="n">${i + 1}</div>
        <div class="ic" style="background:${e.bg}">${e.icon}</div>
        <div class="t"><b>${esc(e.title)}</b><small>${esc(e.sub)}</small></div>
        <div class="q"><small>จำนวน</small><b>${e.qty.map(esc).join('<br/>')}</b></div>
        <div class="w"><span>📅 ${esc(e.date)}</span>${e.time ? `<span>⏰ ${esc(e.time)}</span>` : ''}<span>📍 ${esc(e.place)}</span></div>
        <div class="ck">✓</div>
      </div>`
    )
    .join('');

  const hasRaceDay = isRun || o.concertQty || o.vipTables;
  const dayLines = [
    hasRaceDay ? `<b>📅 ${RACE_DAY} (เสาร์)</b> ${isRun ? `วิ่ง${start ? ` ปล่อยตัว ${esc(start)}` : ''}` : ''}${isRun && (o.concertQty || o.vipTables) ? ' · ' : ''}${o.concertQty || o.vipTables ? 'คอนเสิร์ต 18.00–24.00 น.' : ''}` : '',
    o.addOns ? `<b>📅 ${ACT_DAY} (อาทิตย์)</b> กิจกรรมเสริม · ดูเวลาแต่ละสถานีบนเว็บไซต์` : '',
  ].filter(Boolean);
  const dayCards = `<div class="day">${dayLines.map((l) => `<small>${l}</small>`).join('')}</div>`;

  pages.push(`<section class="page">
  ${head('E-TICKET · RACE KIT PASS', 'บัตรเข้างาน & ใบยืนยันการชำระเงิน', '#7C3AED')}
  <div class="body">
    <div class="hero-ticket">
      <div class="l">
        <span class="tag">ชำระเงินแล้ว ✓</span>
        <div class="who2"><small>ชื่อผู้สมัคร</small><b>${names}</b></div>
        ${dog ? `<div class="who2"><small>ชื่อน้องหมา</small><b>🐶 ${esc(dog)}</b></div>` : ''}
        <div class="bibbox"><small>${isRun ? 'เลข BIB' : 'เลขบัตร'}</small><b>${esc(o.bibNumber)}</b></div>
        <div class="paid">ชำระเมื่อ ${esc(thaiDateTime(o.paidAt || o.verifiedAt))}</div>
      </div>
      <div class="r"><img src="${ticketQr}" alt="QR เช็กอิน" /><div class="r-t">QR เช็กอินหน้างาน</div><div class="r-s">แสดงต่อเจ้าหน้าที่</div></div>
    </div>

    <h2 class="sec" style="margin-top:16px">🎫 สิทธิ์ที่คุณได้รับ</h2>
    <div class="ents">${entHtml}</div>

    <div class="sum">
      ${lines ? `<ul>${lines.map((l) => `<li><span>${esc(l.name)}</span><b>${l.amount < 0 ? '− ' : ''}${formatBaht(Math.abs(l.amount))} บาท</b></li>`).join('')}</ul>` : '<div></div>'}
      <div class="total"><span>${o.paymentMethod === 'SPONSOR_CODE' ? `ยอดชำระ (สิทธิ์สปอนเซอร์${o.sponsorName ? ` ${esc(o.sponsorName)}` : ''})` : 'ยอดชำระสุทธิ'}</span><b>${formatBaht(o.totalPrice)} บาท</b></div>
    </div>

    <h2 class="sec" style="margin-top:14px">📍 รายละเอียดงาน</h2>
    <div class="detail">
      <div class="dcol">${dayCards}
        ${isRun && pickupItem ? `<div class="day" style="background:#F5F0FF;border-color:#C4B5FD"><b>🎽 รับอุปกรณ์ Race Kit</b><small>วันเสาร์ที่ ${RACE_DAY} ตั้งแต่ 09.00 น.<br />${esc(pickup.description.replace(/^กิจกรรมทั้งหมด\s*/, '').replace(/^ณ\s*/, 'ณ '))}<br />สิ่งที่ต้องใช้: QR บัตรนี้ + บัตรประชาชน (ชาวต่างชาติ: หนังสือเดินทาง)</small></div>` : ''}
      </div>
      <div class="dcol">
        <div class="day" style="background:#ECFDF5;border-color:#86EFAC"><b>📍 สถานที่จัดงาน</b><small>${esc(eventInfo.venue)}<br />${esc(eventInfo.locationProvince)}</small></div>
        <div class="day map"><img src="${mapQr}" alt="QR แผนที่" /><div><b>🗺️ แผนที่</b><small>สแกนเพื่อเปิด Google Maps · เผื่อเวลาเดินทางมาถึงก่อนเวลา</small></div></div>
      </div>
    </div>
  </div>
  ${foot}
</section>`);

  // ---- 3. VIP parking passes, two per page
  const plates = o.parkingPlates || [];
  if (plates.length) {
    const passes = await Promise.all(
      plates.map(async (p, i) => {
        const code = await qr(parkingQrPayload(o.orderId, p), '#7A4B00');
        return `<div class="park">
      <div class="l">
        <div class="park-k">CHANGSUEK RUN 2027 · CONCERT</div>
        <div class="vip">VIP <span>PARKING</span></div>
        <div class="park-d">คันที่ ${i + 1} / ${plates.length} · ${esc(eventInfo.dateNotice)}</div>
        <div class="plate">${esc(p.plate)}<small>${esc(p.province)}</small></div>
        <div class="park-n">ผู้ซื้อ: ${esc(o.fullName)} · VIP TABLE ${o.vipTables || 1} โต๊ะ</div>
      </div>
      <div class="r"><img src="${code}" alt="QR บัตรจอดรถ" /><div class="r-t">สแกนที่ทางเข้าลานจอด VIP</div><div class="r-s">ตรงกับทะเบียนนี้เท่านั้น</div></div>
    </div>`;
      })
    );
    for (let i = 0; i < passes.length; i += 2) {
      pages.push(`<section class="page">
  ${head('VIP PARKING PASS', 'บัตรจอดรถ VIP', '#B45309')}
  <div class="body">
    <h2 class="sec">🚗 วางบัตรไว้หน้ารถให้เจ้าหน้าที่เห็นชัด · 1 ใบต่อรถ 1 คัน</h2>
    ${passes.slice(i, i + 2).join('<hr class="cut" />')}
  </div>
  ${foot}
</section>`);
    }
  }

  // ---- 4. Insurance (runners + dog)
  const insured = runners.map((r, i) => ({ ...r, i })).filter((r) => r.ins);
  if (insured.length) {
    const colors = ['#7C3AED', '#EC4899', '#0EA5E9', '#F59E0B', '#10B981', '#EF4444'];
    const cards = insured.map((r) => {
      const n = r.ins!;
      const c = colors[r.i % colors.length];
      return `<div class="ins" style="border-color:${c}">
      <header style="background:linear-gradient(90deg,${c},#1E0B3D)"><span>🛡️ ผู้เอาประกันคนที่ ${r.i + 1}: ${esc(n.prefix)}${/^[A-Za-z]/.test(n.firstName) ? ' ' : ''}${esc(n.firstName)} ${esc(n.lastName)}</span><span>BIB #${esc(runnerBib(o.bibNumber, r.i))}</span></header>
      <div class="grid">
        ${n.foreigner ? `<div class="s2"><small>พาสปอร์ต (${esc(n.nationality || '')})</small><b>${esc(maskPassport(n.passportNo || ''))} · หมดอายุ ${esc(n.passportExpiry || '-')}</b></div>` : `<div class="s2"><small>เลขบัตรประชาชน</small><b>${esc(n.idCard ? maskThaiId(n.idCard) : '-')}</b></div>`}<div><small>เพศ</small><b>${esc(n.gender)}</b></div><div><small>วันเกิด (ค.ศ.)</small><b>${esc(n.birthDate)}</b></div><div><small>อายุ</small><b>${n.age} ปี</b></div><div><small>กรุ๊ปเลือด</small><b>${esc(n.bloodType)}</b></div>
        <div class="s2"><small>โรคประจำตัว / แพ้ยา</small><b>${esc(n.medicalConditions)}</b></div><div><small>ระยะวิ่ง</small><b>${esc(ticketById(o.routeId).name)}</b></div><div><small>ไซส์เสื้อ</small><b>${esc(r.shirt)}</b></div>
        <div class="s2"><small>ผู้ติดต่อฉุกเฉิน</small><b>${esc(n.emergencyName)} (${esc(n.relationship)})</b></div><div class="s2"><small>เบอร์ผู้ติดต่อฉุกเฉิน</small><b>${esc(n.emergencyPhone || o.emergencyPhone)}</b></div>
        <div class="s4"><small>ผู้รับผลประโยชน์ (ประกัน)</small><b>${esc(n.beneficiaryName ? `${n.beneficiaryName} (${n.beneficiaryRelationship || ''})` : `${n.emergencyName} (${n.relationship}) · ตามผู้ติดต่อฉุกเฉิน`)}</b></div>
      </div></div>`;
    });
    const dogCard = dog
      ? `<div class="ins" style="border-color:#10B981">
      <header style="background:linear-gradient(90deg,#10B981,#0F766E)"><span>🐶 น้องสุนัขผู้ร่วมวิ่ง: ${esc(dog)}</span><span>Dog Pass #${esc(o.bibNumber)}</span></header>
      <div class="grid">
        <div><small>ชื่อน้อง</small><b>${esc(dog)}</b></div><div><small>สายพันธุ์</small><b>${esc(o.dogBreed || '-')}</b></div>${o.dogProfile ? `<div><small>เพศ / ขนาด</small><b>${esc(o.dogProfile.gender)} · ${esc(o.dogProfile.size)}</b></div><div><small>ปีเกิด / น้ำหนัก</small><b>${o.dogProfile.birthYear} · ${o.dogProfile.weightKg} กก.</b></div><div><small>ทำหมัน</small><b>${esc(o.dogProfile.neutered)}</b></div><div><small>วัคซีน</small><b>${esc(o.dogProfile.vaccine)}</b></div><div class="s2"><small>ภูมิแพ้</small><b>${esc(o.dogProfile.allergies || 'ไม่มี')}</b></div><div class="s2"><small>นิสัยเมื่ออยู่กับน้องหมาตัวอื่น</small><b>${esc(o.dogProfile.temperament)}</b></div>` : ''}<div><small>เจ้าของ</small><b>${esc(o.fullName)}</b></div><div><small>เบอร์เจ้าของ</small><b>${esc(o.phone)}</b></div>
        <div class="s4"><small>เงื่อนไข</small><b>ต้องมีสมุดวัคซีนพิษสุนัขบ้า + วัคซีนรวม (ไม่เกิน 1 ปี) · สัตวแพทย์ตรวจคัดกรองก่อนลงวิ่ง</b></div>
      </div>
    </div>`
      : '';
    pages.push(`<section class="page">
  ${head('ACCIDENT INSURANCE', dog ? 'ข้อมูลประกันอุบัติเหตุ (นักวิ่ง & น้องสุนัข)' : 'ข้อมูลประกันอุบัติเหตุ', '#0F766E')}
  <div class="body">
    <p class="lead">ข้อมูลนี้ส่งให้บริษัทประกันภัยเพื่อทำประกันอุบัติเหตุสำหรับกิจกรรมนี้เท่านั้น กรุณาตรวจสอบ หากข้อมูลไม่ถูกต้องแจ้งผู้จัดงานโดยเร็ว</p>
    ${cards.join('')}
    ${dogCard}
  </div>
  ${foot}
</section>`);
  }

  return `<!doctype html><html lang="th"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>เอกสาร A4 · ${esc(o.orderId)} · CHANGSUEK RUN 2027</title>
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Mitr:wght@400;500;600;700&family=Sarabun:wght@400;600;700;800&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
<style>${inlineVars}${CSS}</style></head><body>
<div class="bar"><div><b>เอกสาร A4 ของคำสั่งซื้อ ${esc(o.orderId)}</b><span>${pages.length} หน้า · พิมพ์แนวตั้ง หรือบันทึกเป็น PDF</span></div><button type="button" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
<div class="pages">${pages.join('\n')}</div>
<script>(function(){function f(){document.documentElement.style.setProperty('--z',String(Math.min(1,(window.innerWidth-16)/794)))}f();window.addEventListener('resize',f)})()</script>
</body></html>`;
}

const CSS = `
  :root { --ink:#1E0B3D; --purple:#5B21B6; --gold:#FFC928; --pink:#EC4899; --z:1; }
  * { box-sizing: border-box; }
  body { margin:0; background:#E9E4F5; font-family:'Sarabun',Tahoma,sans-serif; color:var(--ink); }
  .bar { position:sticky; top:0; z-index:5; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 16px; background:#1E0B3D; color:#fff; font-family:'Mitr',Tahoma,sans-serif; }
  .bar b { display:block; font-weight:600; font-size:15px } .bar span { font-size:12px; opacity:.8 }
  .bar button { min-height:44px; padding:0 18px; border-radius:12px; border:2px solid #fff; background:#FFC928; color:#1E0B3D; font:700 15px 'Mitr',Tahoma,sans-serif; cursor:pointer; }
  .pages { padding:8px 0 24px; }
  .page { zoom:var(--z); width:210mm; min-height:297mm; margin:16px auto; background:#fff; position:relative; overflow:hidden; box-shadow:0 10px 40px rgba(30,11,61,.18); padding:0 0 14mm; }
  .band { display:flex; align-items:center; gap:14px; padding:14px 18mm; color:#fff; background:linear-gradient(115deg, var(--ink), var(--c) 70%, var(--pink)); position:relative; }
  .band::after { content:''; position:absolute; left:0; right:0; bottom:-6px; height:6px; background:repeating-linear-gradient(135deg, var(--gold) 0 12px, var(--ink) 12px 24px); }
  .band .logo { width:64px; height:64px; object-fit:contain; background:#fff center / contain no-repeat; border-radius:16px; padding:4px; border:3px solid var(--gold); }
  .band h1 { margin:0; font:700 24px/1.2 'Mitr',sans-serif; }
  .band .kicker { margin:0; font:800 11px/1 'Montserrat',sans-serif; letter-spacing:.2em; color:var(--gold); }
  .band-id { margin-left:auto; text-align:right; } .band-id small { display:block; font-size:11px; opacity:.8 } .band-id b { font:800 15px 'Montserrat',sans-serif; }
  .body { padding:9mm 18mm 0; }
  .foot { position:absolute; left:0; right:0; bottom:0; padding:8px 18mm; font-size:11px; font-weight:700; color:#5B4A7A; background:#F5F0FF; border-top:2px solid #E4D9FB; }
  h2.sec { font:600 17px 'Mitr',sans-serif; margin:0 0 8px; display:flex; align-items:center; gap:8px; }
  h2.sec::after { content:''; flex:1; height:3px; border-radius:3px; background:linear-gradient(90deg, var(--gold), transparent); }
  .hint { margin:10px 0 0; font-size:12.5px; color:#5B4A7A; font-weight:600; } .lead { margin:0 0 10px; font-size:13.5px; font-weight:600; color:#3F3358; }
  .cut { border:0; border-top:2px dashed #B9A8DA; margin:7mm 0; position:relative; } .cut::before { content:'✂ ตัดตามเส้น'; position:absolute; left:0; top:-11px; background:#fff; padding:0 6px; font-size:11px; color:#7C6A9C; font-weight:700; }
  .bib { position:relative; width:90%; margin:0 auto; aspect-ratio:1536/1024; container-type:inline-size; border-radius:10px; overflow:hidden; box-shadow:0 4px 18px rgba(30,11,61,.18); }
  .bib-bg { position:absolute; inset:0; width:100%; height:100%; }
  .bib-dist { position:absolute; left:64%; top:8.6%; width:17.6%; height:17.8%; border-radius:2cqw; background:linear-gradient(160deg,#2A1260,#3B1883); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; }
  .bib-dist b { font:900 9.6cqw/0.95 'Montserrat',sans-serif; letter-spacing:-.04em; }
  .bib-dist span { margin-top:.5cqw; padding-top:.4cqw; border-top:.35cqw solid var(--gold); font:800 1.55cqw 'Montserrat',sans-serif; letter-spacing:.12em; }
  .bib-age { position:absolute; left:2.7%; top:38.9%; width:9.9%; text-align:center; }
  .bib-age-box { background:#3B1883; border-radius:.9cqw; color:#fff; padding:.6cqw 0; }
  .bib-age-box b { display:block; font:900 4.9cqw/1.05 'Montserrat',sans-serif; } .bib-age-box i { display:block; height:.35cqw; margin:.2cqw .6cqw; background:var(--gold); }
  .bib-age small { display:block; margin-top:.9cqw; font:800 1.2cqw 'Montserrat',sans-serif; color:#3B1883; } .bib-age strong { font:800 2.2cqw 'Montserrat',sans-serif; color:#3B1883; }
  .bib-num { position:absolute; left:15.4%; width:68%; top:38.5%; height:31%; display:flex; align-items:center; justify-content:center; font-family:'Montserrat',sans-serif; font-weight:900; line-height:1; letter-spacing:-.05em; color:#160A2E; white-space:nowrap; }
  .bib-line { position:absolute; left:16.2%; width:66.2%; top:70.4%; height:.35cqw; background:var(--gold); }
  .bib-name { position:absolute; left:15.4%; width:68%; top:71.6%; text-align:center; font:700 3.6cqw/1.25 'Mitr',sans-serif; color:#2A1450; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bib-qr { position:absolute; left:85.2%; top:39%; width:12.6%; text-align:center; }
  .bib-qr img { width:100%; border:.35cqw solid #160A2E; border-radius:.8cqw; display:block; }
  .bib-qr small { display:block; margin-top:.5cqw; font:800 .95cqw 'Montserrat',sans-serif; color:#2A1450; }
  .bib-sos { position:absolute; left:84.8%; top:64.2%; width:13.4%; text-align:center; border-top:.3cqw solid var(--gold); padding-top:.5cqw; }
  .bib-strip { position:absolute; left:2.73%; top:81.84%; width:94.4%; height:12.6%; background:#fff; border-radius:1cqw; display:flex; align-items:stretch; }
  .bib-logos { flex:0 0 57%; min-height:0; overflow:hidden; display:grid; grid-template-columns:repeat(18,minmax(0,1fr)); grid-template-rows:repeat(2,minmax(0,1fr)); gap:.2cqw .45cqw; padding:.7cqw 1cqw; box-sizing:border-box; }
  .pic { display:block; background-repeat:no-repeat; background-position:center; background-size:contain; -webkit-print-color-adjust:exact; print-color-adjust:exact }
  .bib-bg.pic { background-size:100% 100% }
  .bib-logos .bib-logo { grid-column:span 2; width:100%; height:100%; min-height:0; object-fit:contain }
  .bib-logos img { grid-column:span 2; width:100%; height:100%; min-height:0; object-fit:contain; }
  .bib-logos .bib-logo:nth-child(10), .bib-logos img:nth-child(10) { grid-column:2 / span 2; }
  .bib-perks { flex:1; display:flex; border-left:.25cqw solid #E4DAF5; margin:.8cqw 0; }
  .bib-perk { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.35cqw; }
  .bib-perk-ic { width:4.2cqw; height:4.2cqw; border-radius:50%; border:.3cqw dashed #3B1883; display:flex; align-items:center; justify-content:center; padding:.55cqw; box-sizing:border-box; }
  .bib-perk-ic svg { width:100%; height:100%; display:block; }
  .bib-perk-size { min-width:5cqw; height:4.2cqw; padding:0 .8cqw; border-radius:1cqw; border:.3cqw solid #3B1883; display:flex; align-items:center; justify-content:center; font:900 2.2cqw 'Montserrat',sans-serif; color:#3B1883; box-sizing:border-box; }
  .bib-perk small { font:700 1.2cqw 'Mitr',sans-serif; color:#2A1450; white-space:nowrap; }
  .bib-sos small { display:block; font:800 .9cqw 'Montserrat',sans-serif; color:#2A1450; } .bib-sos b { display:block; font:800 1.45cqw/1.3 'Montserrat',sans-serif; color:#160A2E; }
  .hero-ticket { display:grid; grid-template-columns:1fr 54mm; border-radius:18px; overflow:hidden; border:3px solid var(--ink); box-shadow:0 6px 0 var(--ink); }
  .hero-ticket .l { padding:12px 16px; background:linear-gradient(135deg,#F5F0FF,#FFF7DB 60%,#FCE7F3); }
  .hero-ticket .r { padding:10px; background:var(--ink); color:#fff; text-align:center; border-left:3px dashed var(--gold); }
  .hero-ticket .r img, .park .r img { width:100%; border-radius:12px; background:#fff; padding:6px; }
  .r-t { margin-top:6px; font:600 13px 'Mitr',sans-serif } .r-s { font-size:11px; opacity:.75 }
  .tag { display:inline-block; padding:3px 12px; border-radius:99px; font:700 12px 'Mitr',sans-serif; color:#fff; background:var(--pink); }
  .big { font:700 28px/1.15 'Mitr',sans-serif; margin:6px 0 2px; } .who { font-weight:700; color:#5B4A7A }
  .facts { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:12px; }
  .fact { background:#fff; border:2px solid #E4D9FB; border-radius:12px; padding:7px 10px; } .fact small { display:block; font-size:11px; color:#6B5A85; font-weight:700 } .fact b { font:600 15px 'Mitr',sans-serif } .fact b.sm { font-size:12.5px }
  .hero-ticket .l { display:grid; grid-template-columns:1fr 1fr; gap:6px 14px; align-content:start; }
  .hero-ticket .tag { grid-column:1 / -1; justify-self:start; background:#16A34A; }
  .who2 { background:#fff; border:2px solid #E4D9FB; border-radius:12px; padding:6px 10px; } .who2 small { display:block; font-size:11px; color:#6B5A85; font-weight:700 } .who2 b { font:600 15px 'Mitr',sans-serif; color:var(--ink); word-break:break-word }
  .bibbox { grid-column:1 / -1; border-radius:12px; padding:3px 14px; background:linear-gradient(135deg,#FFE9A6,#FFC928); border:2px solid var(--ink); } .bibbox small { font:800 11px 'Montserrat',sans-serif; letter-spacing:.15em } .bibbox b { display:block; font:900 28px/1.1 'Montserrat',sans-serif; color:var(--ink); letter-spacing:-.02em; word-break:break-all }
  .paid { grid-column:1 / -1; font-size:11.5px; font-weight:700; color:#5B4A7A }
  .ents { display:flex; flex-direction:column; gap:4px; }
  .ent { display:grid; grid-template-columns:24px 34px minmax(0,1fr) 74px 168px 22px; gap:8px; align-items:center; padding:4px 8px; border-radius:12px; border:2px solid #E4D9FB; background:#FBF9FF; }
  .ent .n { width:22px; height:22px; border-radius:50%; background:var(--ink); color:#fff; font:700 12px/22px 'Montserrat',sans-serif; text-align:center }
  .ent .ic { width:34px; height:34px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; }
  .ent .t b { display:block; font:600 14.5px/1.2 'Mitr',sans-serif; color:var(--ink) } .ent .t small { display:block; font-size:11px; color:#6B5A85; font-weight:600; line-height:1.35 }
  .ent .q { text-align:center; background:#EDE6FB; border-radius:10px; padding:3px 4px } .ent .q small { display:block; font-size:10px; color:#6B5A85; font-weight:700 } .ent .q b { font:600 12px/1.25 'Mitr',sans-serif; color:var(--ink) }
  .ent .w { display:flex; flex-direction:column; gap:1px; font-size:11px; font-weight:700; color:#3F3358; line-height:1.3 }
  .ent .ck { width:22px; height:22px; border-radius:6px; background:#16A34A; color:#fff; font-weight:900; text-align:center; line-height:22px; font-size:14px }
  .sum { display:grid; grid-template-columns:1fr 62mm; gap:12px; margin-top:10px; align-items:end }
  .sum ul { list-style:none; margin:0; padding:0; font-size:12.5px } .sum li { display:flex; justify-content:space-between; gap:10px; padding:2px 0; border-bottom:1px dashed #E4D9FB } .sum li b { white-space:nowrap }
  .sum .total { margin-top:0; flex-direction:column; align-items:flex-start; gap:2px; } .sum .total span { font-size:13px }
  .detail { display:grid; grid-template-columns:1fr 1fr; gap:10px } .dcol { display:flex; flex-direction:column; gap:8px }
  .day { border:2px solid #FDE68A; background:#FFF7DB; border-radius:14px; padding:8px 12px; } .day b { display:block; font:600 14px 'Mitr',sans-serif; color:var(--ink) } .day small { display:block; font-size:11.5px; line-height:1.45; font-weight:600; color:#3F3358 } .day small b { display:inline; font:700 12px 'Mitr',sans-serif }
  .day.map { display:flex; gap:10px; align-items:center; background:#EFF6FF; border-color:#93C5FD } .day.map img { width:74px; height:74px; border-radius:8px; background:#fff; padding:3px }
  table.items { width:100%; border-collapse:separate; border-spacing:0 6px; font-size:14px; } .items td { padding:8px 10px; background:#FAF7FF; } .items td.q { text-align:center; width:80px } .items td:first-child { border-radius:10px 0 0 10px } .items td:last-child { border-radius:0 10px 10px 0; text-align:right; font-weight:800 }
  .total { display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding:12px 16px; border-radius:14px; color:#fff; background:linear-gradient(90deg,var(--ink),var(--purple)); font:600 17px 'Mitr',sans-serif; } .total b { color:var(--gold); font:800 24px 'Montserrat',sans-serif }
  .cards3 { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; } .card { border-radius:14px; padding:10px 12px; border:2px solid; font-size:13px; line-height:1.55; } .card b { font:600 15px 'Mitr',sans-serif; display:block; margin-bottom:2px }
  .park { border-radius:22px; border:4px solid #7A4B00; overflow:hidden; display:grid; grid-template-columns:1fr 62mm; box-shadow:0 7px 0 #7A4B00; }
  .park .l { padding:16px 20px; background:linear-gradient(135deg,#FFF3C4,#FFE08A 50%,#FFC928); }
  .park .r { background:#2A1450; color:#fff; padding:14px; text-align:center; }
  .park-k { font:800 12px 'Montserrat',sans-serif; letter-spacing:.2em; color:#7A4B00 } .park-d { font:600 15px 'Mitr',sans-serif; margin-top:4px } .park-n { margin-top:10px; font-size:13px; font-weight:700; color:#5B3A00 }
  .park .vip { font:900 46px/1 'Montserrat',sans-serif; color:#3B1F00; letter-spacing:-.02em; } .park .vip span { color:#B45309 }
  .plate { display:inline-block; margin-top:10px; padding:6px 16px; border-radius:10px; background:#fff; border:3px solid #111; font:700 26px/1.2 'Mitr',sans-serif; text-align:center; } .plate small { display:block; font-size:12px; font-weight:600 }
  .ins { border-radius:16px; border:2.5px solid; overflow:hidden; margin-bottom:10px; }
  .ins header { padding:8px 14px; color:#fff; font:600 16px 'Mitr',sans-serif; display:flex; justify-content:space-between; gap:8px }
  .ins .grid { display:grid; grid-template-columns:repeat(4,1fr); } .ins .grid div { padding:7px 12px; border-top:1px solid #EEE7FB; border-right:1px solid #EEE7FB; font-size:13px } .ins .grid small { display:block; color:#6B5A85; font-size:11px; font-weight:700 } .ins .grid b { font-weight:800; font-size:14px }
  .ins .grid .s2 { grid-column:span 2 } .ins .grid .s4 { grid-column:span 4 }
  .doc { padding:14mm 18mm 18mm; } .doc-tag { display:inline-block; margin-bottom:8px; padding:4px 12px; border-radius:99px; background:#F0FDFA; border:2px solid #0F766E; font:600 12px 'Mitr',sans-serif; color:#0F766E; }
  @page { size:A4; margin:0 }
  @media print { .page { overflow:visible } body { background:#fff } .bar { display:none } .pages { padding:0 } .page { zoom:1; margin:0; box-shadow:none; page-break-after:always } }
`;
