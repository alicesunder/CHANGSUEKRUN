import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  Award,
  CalendarDays,
  CircleCheck,
  Circle,
  Car,
  CloudSun,
  ExternalLink,
  FileText,
  House,
  LogOut,
  Map as MapIcon,
  Maximize2,
  MapPin,
  Megaphone,
  Navigation,
  PawPrint,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingCart,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { LangSwitch, useLang } from '../i18n/lang';
import { authApi, clearSession, type Session } from '../utils/runnerAuth';
import { fetchAnnouncements, type Announcement, type ServerOrder } from '../utils/api';
import { RaceBib, runnerBib } from './RaceBib';
import { ParkingPasses } from './ParkingPass';
import { ACTIVITY_LOCATIONS } from '../data/activityLocations';
import { SHIRT_SIZES } from '../data/shirts';
import { BLOOD_TYPES, GENDERS, RELATIONSHIPS } from '../data/insurance';
import { VIP_PARKING_PER_TABLE } from '../data/vipParking';
import { eventInfo, formatBaht } from '../data/eventData';
import { addOnCounts, type AddOnSelection } from '../data/addOns';

type HubOrder = ServerOrder & { docsUrl?: string };
type Tab = 'overview' | 'tickets' | 'activities' | 'guide' | 'profile' | 'buy';
export type BuyKind = 'RUN' | 'ADDON' | 'CONCERT';

/** Race day, Sat 9 Jan 2027 (Bangkok time): midnight, and the end of the evening for the "after the event" things. */
const RACE_DAY_START = new Date('2027-01-09T00:00:00+07:00').getTime();
const RACE_DAY_END = new Date('2027-01-09T23:59:00+07:00').getTime();

function statusOf(o: HubOrder): { key: 'cancelled' | 'paid' | 'checked' | 'expired' | 'pending'; th: string; en: string; cls: string } {
  if (o.cancelledAt) return { key: 'cancelled', th: 'ยกเลิกแล้ว', en: 'Cancelled', cls: 'bg-slate-200 text-slate-700 border-slate-300' };
  if (o.paymentStatus === 'PAID') {
    return o.kitStatus === 'CHECKED_IN'
      ? { key: 'checked', th: 'รับของแล้ว', en: 'Kit collected', cls: 'bg-sky-100 text-sky-800 border-sky-300' }
      : { key: 'paid', th: 'ชำระแล้ว', en: 'Paid', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }
  if (Date.parse(o.expiresAt) < Date.now()) return { key: 'expired', th: 'หมดเวลาชำระ', en: 'Payment expired', cls: 'bg-rose-100 text-rose-800 border-rose-300' };
  return { key: 'pending', th: 'รอชำระเงิน', en: 'Awaiting payment', cls: 'bg-amber-100 text-amber-900 border-amber-300' };
}

const kindOf = (o: HubOrder): BuyKind => (o.ticketType === 'ADDON' ? 'ADDON' : o.ticketType === 'CONCERT' ? 'CONCERT' : 'RUN');
const KIND_STYLE: Record<BuyKind, { emoji: string; grad: string; th: string; en: string }> = {
  RUN: { emoji: '🏃', grad: 'linear-gradient(135deg,#4B1FA8,#7C3AED)', th: 'ตั๋ววิ่ง', en: 'Run ticket' },
  ADDON: { emoji: '🎢', grad: 'linear-gradient(135deg,#6D28D9,#A78BFA)', th: 'กิจกรรมเสริม', en: 'Activities' },
  CONCERT: { emoji: '🎶', grad: 'linear-gradient(135deg,#2A1450,#6D28D9)', th: 'คอนเสิร์ต', en: 'Concert' },
};

const ROUTE_LABEL: Record<string, string> = { '1km': '1K Dog Run', '3km': '4K Dog Run', '5km': '5K Runner', '10km': '10K Runner' };

const isPaidLive = (o: HubOrder) => o.paymentStatus === 'PAID' && !o.cancelledAt;

/** Small white card used all over the center. */
const Box: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => <section className={`ds-card p-3.5 sm:p-4 ${className}`}>{children}</section>;

const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }> = ({ icon, children, aside }) => (
  <div className="mb-2.5 flex items-center justify-between gap-2">
    <h3 className="flex items-center gap-2 text-base font-black text-[#2A1450] sm:text-lg">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F1EAFD] text-[#6D28D9]" aria-hidden="true">{icon}</span>
      {children}
    </h3>
    {aside}
  </div>
);

const GoldButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...p }) => (
  <button
    type="button"
    {...p}
    className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFB300] px-5 text-sm font-black text-[#2A1450] shadow-[0_8px_18px_-8px_rgba(255,179,0,0.85)] active:translate-y-0.5 disabled:opacity-60 ${className}`}
  >
    {children}
  </button>
);

/** QR for a paid order: the same payload as the BIB card ({ orderId, bib }), so the staff scanner reads it. */
function useQr(orderId: string, bib: string | undefined, size = 320) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let off = false;
    QRCode.toDataURL(JSON.stringify(bib ? { orderId, bib } : { orderId }), { margin: 1, width: size, errorCorrectionLevel: 'M', color: { dark: '#1E0B3D', light: '#FFFFFF' } })
      .then((u) => !off && setSrc(u))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [orderId, bib, size]);
  return src;
}

/** The ticket as a full screen white QR (easy to scan in the sun). Keeps the screen awake while open when the browser allows. */
const QrFullscreen: React.FC<{ order: HubOrder; name: string; onClose: () => void }> = ({ order, name, onClose }) => {
  const { t } = useLang();
  const qr = useQr(order.orderId, order.bibNumber || undefined, 640);
  const [awake, setAwake] = useState(false);
  const lock = useRef<{ release: () => Promise<void> } | null>(null);
  const wake = (typeof navigator !== 'undefined' ? (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock : undefined) || null;
  useEffect(() => () => void lock.current?.release().catch(() => {}), []);
  const toggleAwake = async () => {
    if (awake) {
      await lock.current?.release().catch(() => {});
      lock.current = null;
      setAwake(false);
      return;
    }
    try {
      lock.current = (await wake?.request('screen')) || null;
      setAwake(!!lock.current);
    } catch {
      setAwake(false);
    }
  };
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t('QR ตั๋วเข้างาน', 'Entry QR ticket')} className="fixed inset-0 z-[10200] flex flex-col items-center overflow-y-auto bg-white px-5 py-6 text-[#2A1450]">
      <img src="/images/brand/changsuek-run-logo.webp" alt="CHANG SUEK RUN 2027" className="h-16 w-auto object-contain" />
      <p className="mt-2 text-sm font-extrabold text-[#6D28D9]">{t('ตั๋วเข้างาน (QR Code)', 'Entry ticket (QR code)')}</p>
      <div className="mt-3 w-full max-w-[420px] rounded-3xl border-2 border-[#D9C9EF] bg-white p-3 shadow-lg">
        {qr ? <img src={qr} alt={`QR ${order.orderId}`} className="block h-auto w-full" /> : <div className="aspect-square w-full animate-pulse rounded-2xl bg-[#F1EAFD]" />}
      </div>
      <div className="mt-4 grid w-full max-w-[420px] grid-cols-2 gap-2 text-center">
        {order.bibNumber && (
          <div className="col-span-2 rounded-2xl bg-gradient-to-r from-[#FFE268] to-[#FFC928] py-2">
            <p className="text-[11px] font-extrabold">BIB</p>
            <p className="font-mono text-3xl font-black tracking-wider">{order.bibNumber}</p>
          </div>
        )}
        <div className="rounded-2xl bg-[#F6F1FD] p-2"><p className="text-[11px] font-extrabold text-[#766A85]">{t('ชื่อ', 'Name')}</p><p className="text-sm font-black leading-tight">{name}</p></div>
        <div className="rounded-2xl bg-[#F6F1FD] p-2"><p className="text-[11px] font-extrabold text-[#766A85]">{t('ระยะ', 'Race')}</p><p className="text-sm font-black leading-tight">{ROUTE_LABEL[order.routeId] || order.routeName}</p></div>
        {order.shirtSize && <div className="rounded-2xl bg-[#F6F1FD] p-2"><p className="text-[11px] font-extrabold text-[#766A85]">{t('ไซซ์เสื้อ', 'Shirt')}</p><p className="text-sm font-black">{order.shirtSize}</p></div>}
        <div className="rounded-2xl bg-[#F6F1FD] p-2"><p className="text-[11px] font-extrabold text-[#766A85]">{t('คำสั่งซื้อ', 'Order')}</p><p className="font-mono text-xs font-black">{order.orderId}</p></div>
      </div>
      <p className="mt-3 max-w-[420px] text-center text-xs font-bold text-[#766A85]">{t('แนะนำให้ปรับความสว่างหน้าจอเป็นสูงสุดก่อนสแกน', 'Turn your screen brightness up to the maximum before scanning')}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {wake && (
          <button type="button" onClick={toggleAwake} aria-pressed={awake} className={`min-h-[44px] cursor-pointer rounded-full border-2 px-5 text-sm font-black ${awake ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-[#7C3AED] bg-white text-[#4B1FA8]'}`}>
            {awake ? t('✓ เปิดหน้าจอค้างไว้', '✓ Screen kept on') : t('เปิดหน้าจอค้างไว้', 'Keep screen on')}
          </button>
        )}
        <GoldButton onClick={onClose}><X className="h-4 w-4" /> {t('ปิด', 'Close')}</GoldButton>
      </div>
    </div>,
    document.body
  );
};

/** Compact weather card. The forecast service only looks ~2 weeks ahead, so until then we say so honestly. */
const HubWeather: React.FC<{ daysLeft: number }> = ({ daysLeft }) => {
  const { t } = useLang();
  const [w, setW] = useState<{ max: number; min: number; rain: number } | null>(null);
  useEffect(() => {
    if (daysLeft > 14 || daysLeft < 0) return;
    const [lat, lon] = eventInfo.venueCoordinates;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FBangkok&start_date=${eventInfo.date}&end_date=${eventInfo.date}`)
      .then((r) => r.json())
      .then((d) => {
        const max = d?.daily?.temperature_2m_max?.[0];
        const min = d?.daily?.temperature_2m_min?.[0];
        const rain = d?.daily?.precipitation_probability_max?.[0];
        if (typeof max === 'number' && typeof min === 'number') setW({ max: Math.round(max), min: Math.round(min), rain: typeof rain === 'number' ? rain : 0 });
      })
      .catch(() => {});
  }, [daysLeft]);
  return (
    <Box>
      <SectionTitle icon={<CloudSun className="h-4 w-4" />}>{t('สภาพอากาศวันงาน', 'Race-day weather')}</SectionTitle>
      {w ? (
        <p className="text-sm font-bold text-[#2A1450]">
          <span className="text-3xl font-black">{w.max}°C</span> <span className="text-[#766A85]">({w.min}–{w.max}°C)</span>
          <span className="ml-2 inline-block rounded-full bg-[#F1EAFD] px-2.5 py-0.5 text-xs font-extrabold text-[#4B1FA8]">{t('โอกาสฝน', 'Rain')} {w.rain}%</span>
        </p>
      ) : (
        <p className="text-sm font-semibold leading-relaxed text-[#4B2D78]">
          {t('พยากรณ์อากาศจะแสดงที่นี่ก่อนวันงานประมาณ 2 สัปดาห์ ช่วงต้นเดือนมกราคมที่ชะอำ-หัวหิน โดยทั่วไปอากาศแห้งและมีลมทะเลพัดเย็นในช่วงเย็น', 'The forecast appears here about 2 weeks before the event. In early January Cha-am / Hua Hin is usually dry with a cool sea breeze in the evening.')}
        </p>
      )}
    </Box>
  );
};

/** Certificate of participation: opens once the event day is over, for runners who collected their kit. */
function printCertificate(o: HubOrder, name: string) {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>Certificate - ${esc(name)}</title>
<style>
@page{size:A4 landscape;margin:0}
body{margin:0;font-family:'Noto Sans Thai','Sarabun',sans-serif;background:#fff;color:#2A1450}
.c{width:297mm;height:210mm;box-sizing:border-box;padding:14mm;position:relative;background:linear-gradient(135deg,#FBF8FF,#EFE6FC)}
.f{height:100%;border:3mm double #FFC928;border-radius:6mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:#fff}
h1{margin:0;font-size:15mm;color:#4B1FA8}p{margin:2mm 0}.n{font-size:17mm;font-weight:800;color:#2A1450;margin:6mm 0}
.s{font-size:6mm;color:#4B2D78}.g{margin-top:8mm;padding:2mm 8mm;border-radius:99px;background:#FFC928;font-weight:800;font-size:6mm}
</style></head><body><div class="c"><div class="f">
<img src="${location.origin}/images/brand/changsuek-run-logo.webp" style="height:28mm" alt="">
<h1>ใบรับรองการเข้าร่วม</h1><p class="s">Certificate of Participation</p>
<p class="s">ขอมอบใบรับรองนี้ให้แก่</p><div class="n">${esc(name)}</div>
<p class="s">ผู้เข้าร่วมงาน CHANGSUEK RUN 2027 ระยะ ${esc(ROUTE_LABEL[o.routeId] || o.routeName)}${o.bibNumber ? ` · BIB ${esc(o.bibNumber)}` : ''}</p>
<p class="s">วันเสาร์ที่ 9 มกราคม 2570 · ${esc(eventInfo.venueShort)}</p>
<div class="g">CHANGSUEK RUN 2027</div></div></div>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`);
  win.document.close();
}

const Stat: React.FC<{ icon: React.ReactNode; value: React.ReactNode; label: string }> = ({ icon, value, label }) => (
  <div className="ds-card flex items-center gap-2.5 p-2.5 sm:p-3">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F1EAFD] text-[#6D28D9] sm:h-10 sm:w-10" aria-hidden="true">{icon}</span>
    <div className="min-w-0">
      <div className="text-xl font-black leading-none text-[#2A1450] tabular-nums sm:text-2xl">{value}</div>
      <div className="mt-0.5 truncate text-[11px] font-extrabold text-[#766A85] sm:text-xs">{label}</div>
    </div>
  </div>
);

export const RunnerHub: React.FC<{
  isOpen: boolean;
  session: Session;
  onClose: () => void;
  /** start buying: the hub closes and the ticket form / shop opens */
  onBuy: (kind: BuyKind, preset?: AddOnSelection) => void;
}> = ({ isOpen, session, onClose, onBuy }) => {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<HubOrder[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [qrOrder, setQrOrder] = useState<HubOrder | null>(null);
  const user = session.user;

  const load = useCallback(() => {
    setLoadError(null);
    authApi
      .myOrders()
      .then(setOrders)
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'error'));
    fetchAnnouncements().then(setAnnouncements).catch(() => {});
  }, []);

  // The parent passes a new onClose on every render; keeping it in a ref means the tab (and a just-saved
  // message) is only reset when the center is opened, not each time the page re-renders (e.g. after saving).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    setTab('overview');
    load();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, load]);

  const live = useMemo(() => (orders || []).filter((o) => !o.cancelledAt), [orders]);
  const paid = useMemo(() => live.filter((o) => o.paymentStatus === 'PAID'), [live]);
  const stats = useMemo(
    () => ({
      tickets: paid.filter((o) => kindOf(o) === 'RUN').length,
      activities: paid.filter((o) => o.addOns).length,
      concerts: paid.reduce((n, o) => n + (o.concertQty || 0) + (o.vipTables || 0), 0),
      parking: paid.reduce((n, o) => n + (o.vipTables || 0) * VIP_PARKING_PER_TABLE, 0),
      pending: live.filter((o) => o.paymentStatus !== 'PAID' && Date.parse(o.expiresAt) > Date.now()).length,
    }),
    [paid, live]
  );
  // the ticket shown first on the overview: a paid run ticket, else any paid order
  const mainOrder = useMemo(() => paid.find((o) => kindOf(o) === 'RUN') || paid[0], [paid]);
  const dogOrders = useMemo(() => paid.filter((o) => o.dogProfile), [paid]);

  if (!isOpen) return null;

  const now = Date.now();
  const daysLeft = Math.ceil((RACE_DAY_START - now) / 86400000);
  const eventOver = now > RACE_DAY_END;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const displayName = user.name || user.username || user.email;

  const tabs: { id: Exclude<Tab, 'buy'>; icon: React.ReactNode; th: string; en: string }[] = [
    { id: 'overview', icon: <House className="h-5 w-5" />, th: 'ภาพรวม', en: 'Overview' },
    { id: 'tickets', icon: <Ticket className="h-5 w-5" />, th: 'ตั๋วของฉัน', en: 'My tickets' },
    { id: 'activities', icon: <PawPrint className="h-5 w-5" />, th: 'กิจกรรม', en: 'Activities' },
    { id: 'guide', icon: <MapIcon className="h-5 w-5" />, th: 'คู่มือวันงาน', en: 'Event guide' },
    { id: 'profile', icon: <User className="h-5 w-5" />, th: 'โปรไฟล์', en: 'Profile' },
  ];

  // ---- race ready checklist (only things we can really know) ----
  const p = user.profile || {};
  const profileDone = !!(p.firstName && (user.phone || p.emergencyPhone) && p.emergencyName);
  const checklist: { ok: boolean | null; th: string; en: string; hint?: string }[] = [
    { ok: profileDone, th: 'กรอกข้อมูลโปรไฟล์ครบ', en: 'Profile completed', hint: profileDone ? undefined : t('เพิ่มชื่อ เบอร์ และผู้ติดต่อฉุกเฉิน', 'Add name, phone and emergency contact') },
    { ok: user.email ? !!user.emailVerified : false, th: 'ยืนยันอีเมล', en: 'E-mail confirmed' },
    ...(paid.some((o) => kindOf(o) === 'RUN')
      ? [
          { ok: paid.some((o) => kindOf(o) === 'RUN' && !!o.insurance), th: 'ข้อมูลประกันอุบัติเหตุ', en: 'Accident-insurance details' },
          { ok: paid.some((o) => kindOf(o) === 'RUN' && o.kitStatus === 'CHECKED_IN'), th: 'รับ Race Kit', en: 'Collect Race Kit', hint: t('รับได้วันงาน 9 ม.ค. ตั้งแต่ 09.00 น.', 'On race day, 9 Jan, from 09:00') },
        ]
      : []),
    ...(paid.some((o) => o.runningWithDog) ? [{ ok: dogOrders.length > 0, th: 'ลงทะเบียนข้อมูลน้องหมา', en: 'Dog details registered' }] : []),
  ];
  const doneCount = checklist.filter((c) => c.ok).length;

  const orderCards = (list: HubOrder[]) =>
    list.map((o) => {
      const k = kindOf(o);
      const st = statusOf(o);
      const ks = KIND_STYLE[k];
      const isOpen2 = open === o.orderId;
      const runners = [
        { name: o.fullName, ins: o.insurance, shirt: o.shirtSize },
        ...(o.extraRunners || []).map((r) => ({ name: r.name, ins: r.insurance, shirt: r.shirtSize })),
      ];
      return (
        <article key={o.orderId} className="overflow-hidden ds-card">
          <button type="button" onClick={() => setOpen(isOpen2 ? null : o.orderId)} aria-expanded={isOpen2} className="flex w-full items-center gap-3 p-3 text-left cursor-pointer sm:p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl text-white" style={{ background: ks.grad }} aria-hidden="true">{ks.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-base font-black leading-tight">{o.routeName}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${st.cls}`}>{t(st.th, st.en)}</span>
              </span>
              <span className="block text-xs font-bold text-[#766A85]">
                #{o.orderId} · {fmtDate(o.createdAt)} · {formatBaht(o.totalPrice)} {t('บาท', 'THB')}
              </span>
              {isPaidLive(o) && o.bibNumber && k === 'RUN' && <span className="mt-1 inline-block rounded-lg bg-[#FFE268] px-2 py-0.5 font-mono text-sm font-black">BIB {o.bibNumber}</span>}
            </span>
            <span className="text-xs font-black text-[#7C3AED]">{isOpen2 ? '▲' : '▼'}</span>
          </button>

          {isOpen2 && (
            <div className="space-y-3 border-t border-dashed border-[#D9C9EF] p-3 sm:p-4">
              <ul className="flex flex-wrap gap-1.5 text-xs font-extrabold">
                {k === 'RUN' && <li className="rounded-full bg-[#F1EAFD] px-2.5 py-1">👥 {o.peopleCount} {t('คน', 'runner(s)')}{o.runningWithDog ? ` · 🐶 ${o.dogName || ''}` : ''}</li>}
                {k === 'RUN' && o.shirtSize && <li className="rounded-full bg-[#F1EAFD] px-2.5 py-1">👕 {t('ไซซ์', 'Size')} {o.shirtSize}</li>}
                {o.addOns && <li className="rounded-full bg-[#F1EAFD] px-2.5 py-1">🎢 {o.addOns.label}</li>}
                {!!o.concertQty && <li className="rounded-full bg-[#FFF1C2] px-2.5 py-1">🎶 GA × {o.concertQty}</li>}
                {!!o.vipTables && <li className="rounded-full bg-[#FFF1C2] px-2.5 py-1">👑 VIP × {o.vipTables}</li>}
              </ul>

              {isPaidLive(o) && (
                <GoldButton onClick={() => setQrOrder(o)}>
                  <QrCode className="h-4 w-4" /> {t('เปิด QR เต็มจอ', 'Open full-screen QR')}
                </GoldButton>
              )}

              {isPaidLive(o) && k === 'RUN' && o.bibNumber && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {runners.map((r, i) => (
                    <RaceBib key={i} bib={runnerBib(o.bibNumber, i)} routeId={o.routeId} name={r.name} orderId={o.orderId} gender={r.ins?.gender} age={r.ins?.age} shirtSize={r.shirt} dogName={o.runningWithDog ? o.dogName : undefined} />
                  ))}
                </div>
              )}
              {isPaidLive(o) && !!o.vipTables && <ParkingPasses orderId={o.orderId} vipTables={o.vipTables} plates={o.parkingPlates} paid canAdd />}
              {st.key === 'pending' && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                  {t('ยังไม่ได้ชำระเงิน — ชำระภายใน', 'Not paid yet — pay before')} {new Date(o.expiresAt).toLocaleString(lang === 'en' ? 'en-GB' : 'th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
              {o.cancelledAt && <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{t('ยกเลิกแล้ว', 'Cancelled')}: {o.cancelReason || '-'}</p>}
              {isPaidLive(o) && <ResendTicket orderId={o.orderId} />}
              {o.docsUrl && (
                <a href={o.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-[#7C3AED] bg-white px-5 text-sm font-black text-[#4B1FA8] hover:bg-[#F6F1FD]">
                  <FileText className="h-4 w-4" /> {t('เปิด/พิมพ์เอกสาร A4 (BIB · ตั๋ว · ใบยืนยัน)', 'Open / print A4 documents (BIB · ticket · confirmation)')}
                </a>
              )}
            </div>
          )}
        </article>
      );
    });

  const loadingOrError = (
    <>
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
          {loadError}
          <button type="button" onClick={load} className="inline-flex items-center gap-1 rounded-lg border-2 border-rose-300 bg-white px-2.5 py-1 text-xs font-extrabold cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" /> {t('ลองใหม่', 'Retry')}
          </button>
        </div>
      )}
      {!orders && !loadError && <p className="py-10 text-center text-sm font-bold text-[#766A85]">{t('กำลังโหลด…', 'Loading…')}</p>}
    </>
  );

  const emptyState = orders && orders.length === 0 && (
    <div className="rounded-3xl border-2 border-dashed border-[#7C3AED]/40 bg-white p-8 text-center">
      <div className="text-5xl" aria-hidden="true">🐾</div>
      <p className="mt-2 text-lg font-black">{t('ยังไม่มีรายการสั่งซื้อ', 'No orders yet')}</p>
      <p className="text-sm font-semibold text-[#766A85]">{t('เริ่มจากซื้อตั๋ววิ่ง กิจกรรมเสริม หรือตั๋วคอนเสิร์ตได้เลย', 'Start with a run ticket, an activity or a concert ticket')}</p>
      <GoldButton onClick={() => setTab('buy')} className="mt-4">{t('ไปซื้อตั๋ว', 'Go to shop')}</GoldButton>
    </div>
  );

  // ============================ overview ============================
  const overview = (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A1450] via-[#4B1FA8] to-[#7C3AED] p-4 text-white sm:p-5">
        <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#FFC928]/30 blur-3xl" />
        <p className="relative text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#FFE268]">CHANGSUEK RUN 2027</p>
        <h3 className="relative mt-0.5 text-xl font-black leading-tight sm:text-2xl">{t('สวัสดี', 'Hello')}, {displayName} 👋</h3>
        <div className="relative mt-3 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-[#FFC928]/60 bg-white/10 px-4 py-2">
          <CalendarDays className="h-6 w-6 text-[#FFC928]" aria-hidden="true" />
          {eventOver ? (
            <span className="text-base font-black">{t('จบงานแล้ว ขอบคุณที่ร่วมวิ่งกับเรา 🐘', 'The event is over — thank you for running with us 🐘')}</span>
          ) : daysLeft <= 0 ? (
            <span className="text-base font-black text-[#FFE268]">{t('วันนี้วันงาน! 9 ม.ค. 2570', 'Race day is today! 9 Jan 2027')}</span>
          ) : (
            <span className="text-base font-bold">
              {t('เหลืออีก', 'Only')} <span className="text-3xl font-black text-[#FFC928] tabular-nums">{daysLeft}</span> {t('วัน ถึง 9 ม.ค. 2570', 'days to 9 Jan 2027')}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5 sm:gap-4">
        <div className="space-y-3 sm:space-y-4 lg:col-span-3">
          {/* digital ticket */}
          {mainOrder ? <OverviewTicket order={mainOrder} name={mainOrder.fullName || displayName} onQr={() => setQrOrder(mainOrder)} onAll={() => setTab('tickets')} /> : (
            <Box>
              <SectionTitle icon={<Ticket className="h-4 w-4" />}>{t('ตั๋วดิจิทัล', 'Digital ticket')}</SectionTitle>
              {orders ? (
                <p className="text-sm font-semibold text-[#4B2D78]">
                  {stats.pending > 0 ? t('คุณมีรายการรอชำระเงิน เมื่อชำระแล้ว QR ตั๋วจะแสดงที่นี่', 'You have an order awaiting payment — your QR appears here once it is paid') : t('ยังไม่มีตั๋วที่ชำระแล้ว', 'No paid ticket yet')}
                </p>
              ) : (
                <p className="text-sm font-bold text-[#766A85]">{t('กำลังโหลด…', 'Loading…')}</p>
              )}
              <GoldButton onClick={() => setTab('buy')} className="mt-3"><ShoppingCart className="h-4 w-4" /> {t('ซื้อตั๋ว', 'Buy tickets')}</GoldButton>
            </Box>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Stat icon={<Ticket className="h-5 w-5" />} value={stats.tickets} label={t('ตั๋ววิ่ง', 'Run tickets')} />
            <Stat icon={<PawPrint className="h-5 w-5" />} value={stats.activities} label={t('กิจกรรมเสริม', 'Activities')} />
            <Stat icon={<Megaphone className="h-5 w-5" />} value={stats.concerts} label={t('คอนเสิร์ต/VIP', 'Concert / VIP')} />
            <Stat icon={<Car className="h-5 w-5" />} value={stats.parking} label={t('บัตรจอดรถ', 'Parking')} />
          </div>

          {/* checklist */}
          <Box>
            <SectionTitle icon={<ShieldCheck className="h-4 w-4" />} aside={<span className="rounded-full bg-[#FFF1C2] px-2.5 py-0.5 text-xs font-black text-[#6B4A10]">{doneCount}/{checklist.length}</span>}>
              Race Ready Checklist
            </SectionTitle>
            <div className="mb-2.5 h-2 overflow-hidden rounded-full bg-[#EDE7F6]" aria-hidden="true">
              <div className="h-full rounded-full bg-gradient-to-r from-[#FFC928] to-[#FFB300] transition-all" style={{ width: `${checklist.length ? (doneCount / checklist.length) * 100 : 0}%` }} />
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {checklist.map((c) => (
                <li key={c.th} className="flex items-start gap-2 rounded-xl bg-[#F8F4FE] px-3 py-2">
                  {c.ok ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#B9A5DE]" aria-hidden="true" />}
                  <span>
                    <span className="block text-sm font-extrabold text-[#2A1450]">{t(c.th, c.en)}</span>
                    {!c.ok && c.hint && <span className="block text-xs font-semibold text-[#766A85]">{c.hint}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Box>
        </div>

        <div className="space-y-3 sm:space-y-4 lg:col-span-2">
          <Box>
            <SectionTitle icon={<Megaphone className="h-4 w-4" />}>{t('ประกาศจากผู้จัด', 'Organiser announcements')}</SectionTitle>
            {announcements.length === 0 ? (
              <p className="text-sm font-semibold text-[#766A85]">{t('ยังไม่มีประกาศใหม่ ผู้จัดจะแจ้งที่นี่', 'No announcements yet — the organiser will post here')}</p>
            ) : (
              <ul className="space-y-2">
                {announcements.slice(0, 4).map((a) => (
                  <li key={a.id} className={`rounded-2xl p-3 ${a.level === 'important' ? 'border border-[#FFC928] bg-[#FFF8DC]' : 'bg-[#F8F4FE]'}`}>
                    <p className="text-sm font-black text-[#2A1450]">{a.level === 'important' && <span className="mr-1">⚠️</span>}{a.title}</p>
                    {a.body && <p className="mt-0.5 whitespace-pre-line text-xs font-semibold leading-relaxed text-[#4B2D78]">{a.body}</p>}
                    <p className="mt-1 text-[11px] font-bold text-[#9A8DB0]">{fmtDate(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Box>

          <HubWeather daysLeft={daysLeft} />

          <Box className="bg-gradient-to-br from-[#2A1450] to-[#4B1FA8] text-white">
            <p className="flex items-center gap-2 text-base font-black"><Phone className="h-5 w-5 text-[#FFC928]" aria-hidden="true" /> {t('ติดต่อทีมงาน', 'Contact the team')}</p>
            <p className="mt-1 text-xs font-semibold text-white/80">{t('มีปัญหาเรื่องตั๋วหรือวันงาน โทรหาทีมงานได้เลย', 'Problem with a ticket or on race day? Call the team')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {eventInfo.contactPhones.map((ph) => (
                <a key={ph} href={`tel:${ph.replace(/[^0-9]/g, '')}`} className="inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFB300] px-4 text-sm font-black text-[#2A1450]">{ph}</a>
              ))}
              {eventInfo.lineUrl && (
                <a href={eventInfo.lineUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-full border border-white/40 bg-white/10 px-4 text-sm font-black text-white">LINE {eventInfo.contactLine}</a>
              )}
            </div>
          </Box>
        </div>
      </div>
    </div>
  );

  // ============================ tickets ============================
  const raceKit = (
    <Box>
      <SectionTitle icon={<ShieldCheck className="h-4 w-4" />}>{t('ขั้นตอนรับ Race Kit', 'Race Kit pick-up')}</SectionTitle>
      <ol className="grid gap-2 sm:grid-cols-3">
        {[
          { th: 'ตรวจสอบสิทธิ์', en: 'Check your entry', sub: t('เปิด QR ตั๋วที่จุดรับ', 'Show your ticket QR at the desk') },
          { th: 'รับ Race Kit', en: 'Collect your kit', sub: t('วันงาน 9 ม.ค. ตั้งแต่ 09.00 น.', 'Race day, 9 Jan, from 09:00') },
          { th: 'ตรวจของ', en: 'Check your items', sub: t('เสื้อ · BIB · ของที่ระลึก', 'Shirt · BIB · souvenirs') },
        ].map((s, i) => (
          <li key={s.th} className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#F1EAFD] to-[#F8F4FE] p-3">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white font-black text-[#6D28D9] shadow-sm" aria-hidden="true">
              {i + 1}
            </span>
            <span><span className="block text-sm font-extrabold text-[#2A1450]">{t(s.th, s.en)}</span><span className="block text-xs font-semibold text-[#766A85]">{s.sub}</span></span>
          </li>
        ))}
      </ol>
    </Box>
  );

  const ticketsView = (
    <div className="space-y-3">
      {loadingOrError}
      {emptyState}
      {orders && orders.length > 0 && (
        <>
          {paid.some((o) => kindOf(o) === 'RUN') && raceKit}
          {orderCards(orders.filter((o) => kindOf(o) !== 'ADDON' || !o.addOns))}
          {paid.filter((o) => kindOf(o) === 'RUN').map((o) => (
            <Box key={`cert-${o.orderId}`}>
              <SectionTitle icon={<Award className="h-4 w-4" />}>{t('ใบรับรองการเข้าร่วม', 'Certificate of participation')} <span className="text-xs font-bold text-[#766A85]">· #{o.orderId}</span></SectionTitle>
              {eventOver && o.kitStatus === 'CHECKED_IN' ? (
                <GoldButton onClick={() => printCertificate(o, o.fullName || displayName)}><Award className="h-4 w-4" /> {t('เปิด/พิมพ์ใบรับรอง', 'Open / print certificate')}</GoldButton>
              ) : (
                <p className="text-sm font-semibold text-[#766A85]">
                  {eventOver ? t('ใบรับรองสำหรับผู้ที่รับ Race Kit แล้ว ถ้าคุณร่วมงานแต่ระบบยังไม่บันทึก ติดต่อทีมงานได้', 'The certificate is for runners who collected their kit — contact the team if you took part but are not recorded') : t('ดาวน์โหลดได้หลังจบงานวันที่ 9 ม.ค. 2570 (สำหรับผู้ที่รับ Race Kit แล้ว)', 'Available after the event on 9 Jan 2027 (for runners who collected their kit)')}
                </p>
              )}
            </Box>
          ))}
        </>
      )}
    </div>
  );

  // ============================ activities ============================
  const activityOrders = live.filter((o) => o.addOns);
  const concertOrders = live.filter((o) => (o.concertQty || o.vipTables) && o.paymentStatus === 'PAID');
  const activitiesView = (
    <div className="space-y-3">
      {loadingOrError}
      {orders && activityOrders.length === 0 && concertOrders.length === 0 && dogOrders.length === 0 && (
        <Box>
          <p className="text-sm font-semibold text-[#4B2D78]">{t('ยังไม่ได้ซื้อกิจกรรมเสริมหรือตั๋วคอนเสิร์ต', 'No activities or concert tickets yet')}</p>
          <GoldButton onClick={() => setTab('buy')} className="mt-3"><ShoppingCart className="h-4 w-4" /> {t('ซื้อเพิ่ม', 'Buy more')}</GoldButton>
        </Box>
      )}

      {activityOrders.map((o) => {
        const st = statusOf(o);
        const picks = [
          addOnCounts(o.addOns!).tower > 0 && { id: 'tower' as const, emoji: '🪂', th: 'หอสูง', en: 'High tower', time: '09.00–12.00' },
          o.addOns!.gun !== 'none' && { id: 'gun' as const, emoji: '🎯', th: `ยิง${addOnCounts(o.addOns!).gunLong > 0 && addOnCounts(o.addOns!).gunShort > 0 ? 'ปืนสั้น+ยาว' : o.addOns!.gun === 'premium' ? 'ปืนยาว' : 'ปืนสั้น'}`, en: `Shooting (${addOnCounts(o.addOns!).gunLong > 0 && addOnCounts(o.addOns!).gunShort > 0 ? 'short + long gun' : o.addOns!.gun === 'premium' ? 'long gun' : 'short gun'})`, time: '09.00–12.00' },
          o.addOns!.windTunnel && { id: 'wind' as const, emoji: '🌪️', th: 'อุโมงค์ลม', en: 'Wind tunnel', time: '13.00–15.00' },
        ].filter(Boolean) as { id: 'tower' | 'gun' | 'wind'; emoji: string; th: string; en: string; time: string }[];
        return (
          <article key={o.orderId} className="ds-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-black"><CalendarDays className="h-4 w-4 text-[#7C3AED]" /> {t('วันอาทิตย์ที่ 10 ม.ค. 2570', 'Sunday 10 Jan 2027')}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${st.cls}`}>{t(st.th, st.en)}</span>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {picks.map((pk) => {
                const loc = ACTIVITY_LOCATIONS.find((a) => a.id === pk.id);
                return (
                  <li key={pk.id} className="rounded-2xl border border-[#D9C9EF] bg-gradient-to-b from-[#F8F4FE] to-white p-3">
                    <div className="text-3xl" aria-hidden="true">{pk.emoji}</div>
                    <div className="text-sm font-black">{t(pk.th, pk.en)}</div>
                    <div className="text-xs font-bold text-[#766A85]">{t('รอบ', 'Slot')} {pk.time} {t('น.', '')}</div>
                    {loc && (
                      <a href={loc.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-extrabold text-[#5B20A8] underline underline-offset-2">
                        <MapPin className="h-3.5 w-3.5" /> {t('ดูตำแหน่ง', 'Directions')} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs font-bold text-[#766A85]">#{o.orderId} · {formatBaht(o.addOns!.total)} {t('บาท', 'THB')}</p>
            <button
              type="button"
              onClick={() => onBuy('ADDON', { tower: o.addOns!.tower, gun: o.addOns!.gun, windTunnel: o.addOns!.windTunnel, people: 1 })}
              className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-[#7C3AED] bg-white px-4 text-xs font-black text-[#4B1FA8] cursor-pointer hover:bg-[#F6F1FD]"
            >
              <Plus className="h-3.5 w-3.5" /> {t('สั่งชุดเดียวกันให้อีกคน (เพื่อน/ครอบครัว)', 'Order the same activities for someone else')}
            </button>
          </article>
        );
      })}

      {concertOrders.map((o) => (
        <Box key={`c-${o.orderId}`}>
          <SectionTitle icon={<Megaphone className="h-4 w-4" />}>{t('คอนเสิร์ต', 'Concert')}</SectionTitle>
          <p className="text-sm font-bold text-[#2A1450]">
            {!!o.concertQty && <span className="mr-2 rounded-full bg-[#FFF1C2] px-2.5 py-1 text-xs font-extrabold">🎶 GA × {o.concertQty}</span>}
            {!!o.vipTables && <span className="rounded-full bg-[#FFF1C2] px-2.5 py-1 text-xs font-extrabold">👑 VIP TABLE × {o.vipTables}</span>}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#766A85]">{t('9 ม.ค. 2570 · ประตูเปิด 17.30 น. · เริ่ม 18.00 น.', '9 Jan 2027 · doors 17:30 · show from 18:00')} · #{o.orderId}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <GoldButton onClick={() => setQrOrder(o)}><QrCode className="h-4 w-4" /> {t('เปิด QR เต็มจอ', 'Open full-screen QR')}</GoldButton>
          </div>
          {!!o.vipTables && !o.cancelledAt && <div className="mt-3"><ParkingPasses orderId={o.orderId} vipTables={o.vipTables} plates={o.parkingPlates} paid canAdd /></div>}
        </Box>
      ))}

      {dogOrders.map((o) => {
        const d = o.dogProfile!;
        const age = d.birthYear ? new Date().getFullYear() - d.birthYear : 0;
        return (
          <Box key={`d-${o.orderId}`}>
            <SectionTitle icon={<PawPrint className="h-4 w-4" />}>{t('ข้อมูลน้องหมา', 'Dog details')}: {d.name}</SectionTitle>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm sm:grid-cols-3">
              {[
                [t('สายพันธุ์', 'Breed'), d.breed],
                [t('อายุ', 'Age'), age > 0 ? `${age} ${t('ปี', 'yr')}` : ''],
                [t('น้ำหนัก', 'Weight'), d.weightKg ? `${d.weightKg} kg` : ''],
                [t('เพศ', 'Gender'), d.gender],
                [t('วัคซีน', 'Vaccines'), d.vaccine],
                [t('ภูมิแพ้', 'Allergies'), d.allergies || t('ไม่มี', 'None')],
              ].map(([k, v]) => (
                v ? <div key={k as string}><dt className="text-[11px] font-extrabold text-[#766A85]">{k}</dt><dd className="font-black text-[#2A1450]">{v}</dd></div> : null
              ))}
            </dl>
            <p className="mt-2 rounded-xl bg-[#E6FBF1] px-3 py-2 text-xs font-bold text-[#047857]">
              🩺 {t('ตรวจสุขภาพสุนัข (ไม่มีค่าใช้จ่าย) วันงาน 9 ม.ค. 09.00–14.00 น. โดยรพ.สัตว์ทองหล่อ (สำหรับผู้สมัคร Dog Run 1K / 4K)', 'Dog health check on race day, 9 Jan, 09:00–14:00 by Thonglor Pet Hospital (Dog Run 1K / 4K runners)')}
            </p>
          </Box>
        );
      })}

      {paid.some((o) => kindOf(o) === 'RUN' && o.insurance) && (
        <Box>
          <SectionTitle icon={<ShieldCheck className="h-4 w-4" />}>{t('ประกันอุบัติเหตุ', 'Accident insurance')}</SectionTitle>
          <p className="text-sm font-semibold text-[#4B2D78]">{t('นักวิ่งทุกระยะมีประกันอุบัติเหตุตลอดงาน ข้อมูลที่กรอกไว้ถูกส่งให้บริษัทประกันแล้ว (เลขบัตรประชาชนและข้อมูลสุขภาพไม่แสดงในหน้านี้)', 'Every runner is covered by accident insurance during the event. The details you entered go to the insurer (ID number and health data are not shown here).')}</p>
        </Box>
      )}
    </div>
  );

  // ============================ event guide ============================
  const timeline: { time: string; th: string; en: string; hot?: boolean }[] = [
    { time: '09.00', th: 'เปิดรับ Race Kit (BIB · เสื้อ · ชิป) และงาน Expo', en: 'Race Kit pick-up (BIB · shirt · chip) and Expo open' },
    { time: '09.00–14.00', th: 'จุดตรวจสุขภาพสุนัข (ไม่มีค่าใช้จ่าย) สำหรับ Dog Run 1K / 4K', en: 'Dog health check (no charge) for Dog Run 1K / 4K' },
    { time: '16.30', th: 'ปล่อยตัว 10K Runner', en: '10K Runner start', hot: true },
    { time: '17.00', th: 'ปล่อยตัว 5K Runner', en: '5K Runner start', hot: true },
    { time: '17.15', th: 'ปล่อยตัว 4K Dog Run', en: '4K Dog Run start', hot: true },
    { time: '17.30', th: 'ปล่อยตัว 1K Dog Run · ประตูคอนเสิร์ตเปิด', en: '1K Dog Run start · concert doors open', hot: true },
    { time: '18.00–24.00', th: 'คอนเสิร์ตริมชายหาด', en: 'Beach concert' },
  ];
  const guideView = (
    <div className="space-y-3">
      <Box>
        <SectionTitle icon={<CalendarDays className="h-4 w-4" />}>{t('กำหนดการวันเสาร์ที่ 9 ม.ค. 2570', 'Schedule — Sat 9 Jan 2027')}</SectionTitle>
        <ol className="space-y-1.5">
          {timeline.map((r) => (
            <li key={r.time + r.th} className="flex items-center gap-3 rounded-xl bg-[#F8F4FE] px-3 py-2">
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black ${r.hot ? 'bg-gradient-to-r from-[#4B1FA8] to-[#7C3AED] text-[#FFE268]' : 'bg-[#FFE9A6] text-[#6B4A10]'}`}>{r.time}</span>
              <span className="text-sm font-bold text-[#2A1450]">{t(r.th, r.en)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 flex items-center gap-1.5 text-sm font-black text-[#2A1450]"><CalendarDays className="h-4 w-4 text-[#7C3AED]" /> {t('วันอาทิตย์ที่ 10 ม.ค. 2570 · กิจกรรมเสริม', 'Sunday 10 Jan 2027 · activities')}</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-extrabold">
          <li className="rounded-full bg-[#F1EAFD] px-3 py-1">🎯 {t('ยิงปืน 09.00–12.00', 'Shooting 09:00–12:00')}</li>
          <li className="rounded-full bg-[#F1EAFD] px-3 py-1">🪂 {t('หอสูง 09.00–12.00', 'High tower 09:00–12:00')}</li>
          <li className="rounded-full bg-[#F1EAFD] px-3 py-1">🌪️ {t('อุโมงค์ลม 13.00–15.00', 'Wind tunnel 13:00–15:00')}</li>
        </ul>
      </Box>

      <Box>
        <SectionTitle icon={<MapPin className="h-4 w-4" />}>{t('สถานที่และการเดินทาง', 'Venue and directions')}</SectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li className="rounded-2xl border border-[#D9C9EF] bg-gradient-to-b from-[#F8F4FE] to-white p-3">
            <p className="text-sm font-black text-[#2A1450]">{eventInfo.venueShort}</p>
            <p className="text-xs font-semibold text-[#766A85]">{t('จุดปล่อยตัว รับ Race Kit และคอนเสิร์ต', 'Start, Race Kit pick-up and concert')}</p>
            <a href={eventInfo.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFB300] px-4 text-xs font-black text-[#2A1450]"><Navigation className="h-3.5 w-3.5" /> {t('นำทาง', 'Navigate')}</a>
          </li>
          {ACTIVITY_LOCATIONS.filter((a) => a.id !== 'resort').map((a) => (
            <li key={a.id} className="rounded-2xl border border-[#D9C9EF] bg-gradient-to-b from-[#F8F4FE] to-white p-3">
              <p className="text-sm font-black text-[#2A1450]">{a.name}</p>
              <p className="text-xs font-semibold text-[#766A85]">{t('กิจกรรมเสริม · 10 ม.ค. 2570', 'Activity · 10 Jan 2027')}</p>
              <a href={a.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border-2 border-[#7C3AED] bg-white px-4 text-xs font-black text-[#4B1FA8]"><Navigation className="h-3.5 w-3.5" /> {t('นำทาง', 'Navigate')}</a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs font-semibold text-[#766A85]">{t('จุดจอดรถ ปฐมพยาบาล และผังงานละเอียด จะประกาศอีกครั้งในหน้าประกาศก่อนวันงาน', 'Parking, first-aid points and the site plan will be announced here before race day')}</p>
      </Box>

      <HubWeather daysLeft={daysLeft} />
    </div>
  );

  // ============================ buy more ============================
  const buyView = (
    <div className="grid gap-3 sm:grid-cols-3">
      {(['RUN', 'ADDON', 'CONCERT'] as const).map((k) => {
        const ks = KIND_STYLE[k];
        const sub = {
          RUN: t('10 km · 5 km · Dog Run 4 km / 1 km', '10 km · 5 km · Dog Run 4 km / 1 km'),
          ADDON: t('หอสูง · ยิงปืน · อุโมงค์ลม (เฉพาะบุคคล)', 'High tower · shooting · wind tunnel (individuals)'),
          CONCERT: t('GA หรือ VIP TABLE', 'GA or VIP table'),
        }[k];
        return (
          <button key={k} type="button" onClick={() => onBuy(k)} className="group cursor-pointer rounded-3xl border border-white/20 p-4 text-left text-white shadow-lg transition hover:-translate-y-0.5" style={{ background: ks.grad }}>
            <span className="text-4xl" aria-hidden="true">{ks.emoji}</span>
            <span className="mt-2 block text-lg font-black">{t(ks.th, ks.en)}</span>
            <span className="block text-xs font-bold text-white/90">{sub}</span>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFB300] px-3 py-1 text-xs font-black text-[#2A1450]"><Plus className="h-3.5 w-3.5" /> {t('ซื้อเลย', 'Buy now')}</span>
          </button>
        );
      })}
    </div>
  );

  const titleOf = tab === 'buy' ? t('ซื้อเพิ่ม', 'Buy more') : t(tabs.find((x) => x.id === tab)!.th, tabs.find((x) => x.id === tab)!.en);

  return createPortal(
    <div className="fixed inset-0 z-[10090] flex items-center justify-center bg-[#140826]/80 p-2 backdrop-blur-md sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('ศูนย์นักวิ่ง', 'Runner Center')}
        onClick={(e) => e.stopPropagation()}
        className="ds-modal flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden text-[#2A1450] md:h-[88vh] md:flex-row"
      >
        {/* sidebar (tablet / desktop) */}
        <aside className="relative hidden w-[220px] shrink-0 flex-col bg-gradient-to-b from-[#2A1450] via-[#3B1A78] to-[#4B1FA8] p-4 text-white md:flex">
          <img src="/images/brand/changsuek-run-logo.webp" alt="CHANG SUEK RUN 2027" className="mx-auto h-16 w-auto object-contain" />
          <p className="mt-2 text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FFE268]">Runner Center</p>
          <nav className="mt-4 flex flex-1 flex-col gap-1.5" aria-label={t('เมนูศูนย์นักวิ่ง', 'Runner Center menu')}>
            {tabs.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setTab(x.id)}
                aria-current={tab === x.id ? 'page' : undefined}
                className={`flex min-h-[46px] cursor-pointer items-center gap-3 rounded-2xl px-3 text-sm font-black transition ${tab === x.id ? 'bg-gradient-to-r from-[#FFE268] to-[#FFC928] text-[#2A1450] shadow-lg' : 'text-white/90 hover:bg-white/10'}`}
              >
                {x.icon} {t(x.th, x.en)}
              </button>
            ))}
          </nav>
          <GoldButton onClick={() => setTab('buy')} className="w-full"><ShoppingCart className="h-4 w-4" /> {t('ซื้อเพิ่ม', 'Buy more')}</GoldButton>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-[#EDE7F6] bg-white px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <img src="/images/brand/changsuek-run-logo.webp" alt="" aria-hidden="true" className="h-9 w-auto shrink-0 object-contain md:hidden" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black leading-tight sm:text-xl">{t('ศูนย์นักวิ่ง', 'Runner Center')}<span className="hidden text-[#7C3AED] sm:inline"> · {titleOf}</span></h2>
                <p className="truncate text-xs font-bold text-[#766A85]"><span className="font-black text-[#7C3AED] sm:hidden">{titleOf} · </span>{displayName}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LangSwitch className="hidden sm:inline-flex" />
              <button type="button" onClick={onClose} aria-label={t('ปิด', 'Close')} className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-[#F1EAFD] text-[#4B1FA8] hover:bg-[#E4D8FA]">
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-[#F6F1FD] to-[#FBF8FF] px-3 py-3 sm:px-6 sm:py-4">
            <VerifyBanner user={user} onGoProfile={() => setTab('profile')} />
            {tab === 'overview' && (
              <>
                {loadingOrError}
                {overview}
              </>
            )}
            {tab === 'tickets' && ticketsView}
            {tab === 'activities' && activitiesView}
            {tab === 'guide' && guideView}
            {tab === 'buy' && buyView}
            {tab === 'profile' && <ProfileForm session={session} onLogout={() => { clearSession(); onClose(); }} />}
          </main>

          {/* bottom navigation (phones) */}
          <nav className="grid shrink-0 grid-cols-5 gap-0.5 border-t border-[#EDE7F6] bg-white px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 md:hidden" aria-label={t('เมนูศูนย์นักวิ่ง', 'Runner Center menu')}>
            {tabs.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setTab(x.id)}
                aria-current={tab === x.id ? 'page' : undefined}
                className={`flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl text-[10.5px] font-black ${tab === x.id ? 'bg-[#FFF1C2] text-[#4B1FA8]' : 'text-[#766A85]'}`}
              >
                {x.icon}
                <span className="leading-none">{t(x.th, x.en)}</span>
              </button>
            ))}
          </nav>
          {tab !== 'buy' && (
            <GoldButton onClick={() => setTab('buy')} className="absolute bottom-[72px] right-3 shadow-lg md:hidden" aria-label={t('ซื้อเพิ่ม', 'Buy more')}>
              <ShoppingCart className="h-4 w-4" /> {t('ซื้อเพิ่ม', 'Buy more')}
            </GoldButton>
          )}
        </div>
      </div>
      {qrOrder && <QrFullscreen order={qrOrder} name={qrOrder.fullName || displayName} onClose={() => setQrOrder(null)} />}
    </div>,
    document.body
  );
};

/** The big digital-ticket card on the overview: QR, BIB, race, shirt size and kit status. */
const OverviewTicket: React.FC<{ order: HubOrder; name: string; onQr: () => void; onAll: () => void }> = ({ order, name, onQr, onAll }) => {
  const { t } = useLang();
  const qr = useQr(order.orderId, order.bibNumber || undefined, 360);
  const isRun = kindOf(order) === 'RUN';
  const kitDone = order.kitStatus === 'CHECKED_IN';
  return (
    <Box>
      <SectionTitle icon={<Ticket className="h-4 w-4" />} aside={<button type="button" onClick={onAll} className="shrink-0 cursor-pointer whitespace-nowrap text-xs font-black text-[#6D28D9] underline underline-offset-2">{t('ดูตั๋วทั้งหมด', 'All tickets')}</button>}>
        <span className="whitespace-nowrap">{t('ตั๋วดิจิทัล', 'Digital ticket')}</span> <span className="hidden text-xs font-bold text-[#766A85] sm:inline">({t('เข้างาน / รับ Race Kit', 'entry / Race Kit')})</span>
      </SectionTitle>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={onQr} aria-label={t('เปิด QR เต็มจอ', 'Open full-screen QR')} className="mx-auto w-[168px] shrink-0 cursor-pointer rounded-2xl border border-[#D9C9EF] bg-white p-2 shadow-sm sm:mx-0">
          {qr ? <img src={qr} alt={`QR ${order.orderId}`} className="block h-auto w-full" /> : <div className="aspect-square w-full animate-pulse rounded-xl bg-[#F1EAFD]" />}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          {isRun && order.bibNumber && (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFE268] to-[#FFC928] px-3 py-1.5">
              <span className="text-[11px] font-extrabold">BIB</span>
              <span className="font-mono text-2xl font-black tracking-wider">{order.bibNumber}</span>
            </div>
          )}
          <p className="text-sm font-black text-[#2A1450]">{name}</p>
          <ul className="flex flex-wrap gap-1.5 text-xs font-extrabold">
            <li className="rounded-full bg-[#F1EAFD] px-2.5 py-1 text-[#4B1FA8]">{ROUTE_LABEL[order.routeId] || order.routeName}</li>
            {order.shirtSize && <li className="rounded-full bg-[#F1EAFD] px-2.5 py-1 text-[#4B1FA8]">👕 {t('ไซซ์', 'Size')} {order.shirtSize}</li>}
            {isRun && <li className={`rounded-full px-2.5 py-1 ${kitDone ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>{kitDone ? t('รับ Race Kit แล้ว', 'Kit collected') : t('ยังไม่ได้รับ Race Kit', 'Kit not collected yet')}</li>}
          </ul>
          <GoldButton onClick={onQr} className="w-full sm:w-auto"><Maximize2 className="h-4 w-4" /> {t('เปิด QR เต็มจอ', 'Open full-screen QR')}</GoldButton>
        </div>
      </div>
    </Box>
  );
};

/** Reminds the runner to confirm the e-mail (needed to claim older orders) or to add one (tickets are e-mailed). */
const VerifyBanner: React.FC<{ user: Session['user']; onGoProfile: () => void }> = ({ user, onGoProfile }) => {
  const { t } = useLang();
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (user.email && user.emailVerified) return null;
  if (!user.email) {
    return (
      <div role="note" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
        <span>📧 {t('ยังไม่มีอีเมลในบัญชี — ตั๋วและใบเสร็จจะส่งทางอีเมล', 'No e-mail on your account yet — tickets and receipts are sent by e-mail')}</span>
        <button type="button" onClick={onGoProfile} className="rounded-lg border-2 border-amber-400 bg-white px-3 py-1 text-xs font-extrabold cursor-pointer">{t('เพิ่มอีเมล', 'Add e-mail')}</button>
      </div>
    );
  }
  return (
    <div role="note" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
      <span>📧 {t('อีเมลของคุณยังไม่ได้ยืนยัน', 'Your e-mail is not confirmed yet')} ({user.email})</span>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setState(null);
          try {
            await authApi.resendVerification();
            setState({ ok: true, text: t('ส่งลิงก์ยืนยันแล้ว ตรวจกล่องอีเมล (รวมถึงสแปม)', 'Link sent — check your inbox (and spam)') });
          } catch (e) {
            setState({ ok: false, text: e instanceof Error ? e.message : 'error' });
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-lg border-2 border-amber-400 bg-white px-3 py-1 text-xs font-extrabold cursor-pointer disabled:opacity-60"
      >
        {t('ส่งลิงก์ยืนยัน', 'Send confirmation link')}
      </button>
      {state && <span role="status" className={`w-full text-xs ${state.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{state.text}</span>}
    </div>
  );
};

/** "Send my ticket e-mail again" for a paid order. */
const ResendTicket: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { t } = useLang();
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setState(null);
          try {
            const to = await authApi.resendTicket(orderId);
            setState({ ok: true, text: `${t('ส่งอีเมลตั๋วไปที่', 'Ticket e-mail sent to')} ${to}` });
          } catch (e) {
            setState({ ok: false, text: e instanceof Error ? e.message : 'error' });
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-[#7C3AED] bg-white px-5 text-sm font-black text-[#4B1FA8] hover:bg-[#F6F1FD] disabled:opacity-60 cursor-pointer"
      >
        ✉️ {busy ? t('กำลังส่ง…', 'Sending…') : t('ส่งอีเมลตั๋วอีกครั้ง', 'Send my ticket e-mail again')}
      </button>
      {state && <p role="status" className={`mt-1 text-xs font-bold ${state.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{state.text}</p>}
    </div>
  );
};

const Pills: React.FC<{ label: string; options: readonly string[]; value: string; onPick: (v: string) => void }> = ({ label, options, value, onPick }) => (
  <div>
    <span className="mb-1 block text-xs font-extrabold">{label}</span>
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onPick(value === o ? '' : o)} className={`min-h-[40px] min-w-[48px] rounded-xl border-2 px-3 text-sm font-black cursor-pointer ${value === o ? 'border-[#2A1450] bg-[#2A1450] text-white' : 'border-[#2A1450]/20 bg-white'}`}>
          {o}
        </button>
      ))}
    </div>
  </div>
);

/** Everything the runner can change about themselves; it also pre-fills the next order form. */
const ProfileForm: React.FC<{ session: Session; onLogout: () => void }> = ({ session, onLogout }) => {
  const { t } = useLang();
  const u = session.user;
  const p = u.profile || {};
  const [firstDefault = '', ...restDefault] = (u.name || '').trim().split(/\s+/);
  const [firstName, setFirstName] = useState(p.firstName ?? firstDefault);
  const [lastName, setLastName] = useState(p.lastName ?? restDefault.join(' '));
  const [phone, setPhone] = useState(u.phone);
  const [email, setEmail] = useState(u.email);
  const [gender, setGender] = useState(p.gender || '');
  const [birthDate, setBirthDate] = useState(p.birthDate || '');
  const [bloodType, setBloodType] = useState(p.bloodType || '');
  const [shirt, setShirt] = useState(p.shirtSize || '');
  const [emName, setEmName] = useState(p.emergencyName || '');
  const [relationship, setRelationship] = useState(p.relationship || '');
  const [emPhone, setEmPhone] = useState(p.emergencyPhone || '');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const box = 'min-h-[46px] w-full rounded-xl border-2 border-[#2A1450]/20 bg-white px-3 text-sm font-semibold text-[#2A1450] focus:border-[#7C3AED] outline-none';
  const lab = 'mb-1 block text-xs font-extrabold';
  const today = new Date().toISOString().slice(0, 10);
  // No save button: every change is saved by itself a moment after the last keystroke.
  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      await authApi.saveProfile({
        name,
        phone,
        email,
        profile: { firstName: firstName.trim(), lastName: lastName.trim(), gender, birthDate, bloodType, shirtSize: shirt, emergencyName: emName, relationship, emergencyPhone: emPhone },
      });
      setMsg({ ok: true, text: t('บันทึกให้อัตโนมัติแล้ว ✓ ครั้งหน้าระบบจะเติมข้อมูลนี้ให้ในฟอร์มสั่งซื้อ', 'Saved automatically ✓ we will pre-fill these details in your next order') });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : t('บันทึกไม่สำเร็จ', 'Could not save') });
    } finally {
      setBusy(false);
    }
  };
  const firstRun = useRef(true);
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!firstName.trim()) return;
    const id = window.setTimeout(() => void saveRef.current(), 1200);
    return () => window.clearTimeout(id);
  }, [firstName, lastName, phone, email, gender, birthDate, bloodType, shirt, emName, relationship, emPhone]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-4 ds-card p-4 sm:p-5"
    >
      <p className="rounded-xl bg-[#F3E8FF] px-3 py-2 text-xs font-bold text-[#4B2D78]">
        {t('แก้ไขข้อมูลส่วนตัวได้ที่นี่ ใช้เติมในฟอร์มสั่งซื้ออัตโนมัติ (ไม่เก็บเลขบัตรประชาชน — ต้องกรอกใหม่ทุกครั้งที่ซื้อตั๋ววิ่ง เพื่อทำประกัน)', 'Edit your personal details here — they pre-fill the order form (your national ID is not stored; it is asked each time you buy a run ticket, for the accident insurance)')}
        {u.username && <span className="mt-1 block text-[#6B5A85]">{t('ชื่อผู้ใช้ (เปลี่ยนไม่ได้)', 'Username (cannot be changed)')}: @{u.username}</span>}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={lab}>{t('ชื่อ', 'First name')}</label><input className={box} value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={40} autoComplete="given-name" /></div>
        <div><label className={lab}>{t('นามสกุล', 'Last name')}</label><input className={box} value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={40} autoComplete="family-name" /></div>
        <div><label className={lab}>{t('เบอร์โทรศัพท์', 'Phone')}</label><input className={box} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></div>
        <div><label className={lab}>{t('อีเมล (รับตั๋วและใบเสร็จ)', 'Email (for tickets and receipts)')}</label><input className={box} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        <div><label className={lab}>{t('วันเกิด', 'Date of birth')}</label><input className={box} type="date" min="1900-01-01" max={today} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Pills label={t('เพศ', 'Gender')} options={GENDERS} value={gender} onPick={setGender} />
        <Pills label={t('หมู่เลือด', 'Blood type')} options={BLOOD_TYPES} value={bloodType} onPick={setBloodType} />
      </div>
      <Pills label={t('ไซซ์เสื้อวิ่ง', 'Jersey size')} options={SHIRT_SIZES} value={shirt} onPick={setShirt} />
      <div className="rounded-2xl border-2 border-dashed border-[#7C3AED]/40 p-3 space-y-3">
        <p className="text-xs font-black">{t('ผู้ติดต่อฉุกเฉิน', 'Emergency contact')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={lab}>{t('ชื่อ-นามสกุล', 'Full name')}</label><input className={box} value={emName} onChange={(e) => setEmName(e.target.value)} maxLength={80} /></div>
          <div><label className={lab}>{t('เบอร์โทร', 'Phone')}</label><input className={box} type="tel" value={emPhone} onChange={(e) => setEmPhone(e.target.value)} /></div>
        </div>
        <Pills label={t('ความสัมพันธ์', 'Relationship')} options={RELATIONSHIPS} value={relationship} onPick={setRelationship} />
      </div>
      {msg && <p role="status" className={`rounded-xl px-3 py-2 text-sm font-bold ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span aria-live="polite" className="text-xs font-bold text-[#6B5A85]">{busy ? t('กำลังบันทึก…', 'Saving…') : t('แก้แล้วบันทึกให้เอง', 'Changes save automatically')}</span>
        <button type="button" onClick={onLogout} className="inline-flex min-h-[48px] items-center gap-2 rounded-full border-2 border-[#7C3AED] bg-white px-5 text-sm font-black text-[#4B1FA8] hover:bg-[#F6F1FD] cursor-pointer"><LogOut className="h-4 w-4" /> {t('ออกจากระบบ', 'Log out')}</button>
      </div>
    </form>
  );
};
