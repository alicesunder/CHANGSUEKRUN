import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ExternalLink, FileText, LogOut, MapPin, Plus, RefreshCw, Save, Ticket, X } from 'lucide-react';
import { LangSwitch, useLang } from '../i18n/lang';
import { authApi, clearSession, type Session } from '../utils/runnerAuth';
import type { ServerOrder } from '../utils/api';
import { RaceBib, runnerBib } from './RaceBib';
import { ParkingPasses } from './ParkingPass';
import { ACTIVITY_LOCATIONS } from '../data/activityLocations';
import { SHIRT_SIZES } from '../data/shirts';
import { BLOOD_TYPES, GENDERS, RELATIONSHIPS } from '../data/insurance';
import { formatBaht } from '../data/eventData';
import type { AddOnSelection } from '../data/addOns';

type HubOrder = ServerOrder & { docsUrl?: string };
type Tab = 'tickets' | 'activities' | 'buy' | 'profile';
export type BuyKind = 'RUN' | 'ADDON' | 'CONCERT';

const RACE_DAY = new Date('2027-01-09T16:30:00+07:00').getTime();

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
  RUN: { emoji: '🏃', grad: 'linear-gradient(135deg,#6366F1,#9333EA 55%,#EC4899)', th: 'ตั๋ววิ่ง', en: 'Run ticket' },
  ADDON: { emoji: '🎢', grad: 'linear-gradient(135deg,#FF7A59,#EC4899 55%,#9333EA)', th: 'กิจกรรมเสริม', en: 'Activities' },
  CONCERT: { emoji: '🎶', grad: 'linear-gradient(135deg,#F59E0B,#EF4444 55%,#EC4899)', th: 'คอนเสิร์ต', en: 'Concert' },
};

const Stat: React.FC<{ emoji: string; value: React.ReactNode; label: string; tint: string }> = ({ emoji, value, label, tint }) => (
  <div className="rounded-2xl border border-[#D9C9EF] px-3 py-2.5 shadow-sm" style={{ background: tint }}>
    <div className="text-xl" aria-hidden="true">{emoji}</div>
    <div className="text-2xl font-black leading-none text-[#2A1450] tabular-nums">{value}</div>
    <div className="mt-0.5 text-[11px] font-extrabold text-[#4B2D78]">{label}</div>
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
  const [tab, setTab] = useState<Tab>('tickets');
  const [orders, setOrders] = useState<HubOrder[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const user = session.user;

  const load = useCallback(() => {
    setLoadError(null);
    authApi
      .myOrders()
      .then(setOrders)
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'error'));
  }, []);

  // The parent passes a new onClose on every render; keeping it in a ref means the tab (and a just-saved
  // message) is only reset when the center is opened, not each time the page re-renders (e.g. after saving).
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    setTab('tickets');
    load();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, load]);

  const stats = useMemo(() => {
    const live = (orders || []).filter((o) => !o.cancelledAt);
    const paid = live.filter((o) => o.paymentStatus === 'PAID');
    return {
      tickets: paid.filter((o) => kindOf(o) === 'RUN').length,
      activities: paid.filter((o) => o.addOns).length,
      concerts: paid.reduce((n, o) => n + (o.concertQty || 0) + (o.vipTables || 0), 0),
      pending: live.filter((o) => o.paymentStatus !== 'PAID' && Date.parse(o.expiresAt) > Date.now()).length,
    };
  }, [orders]);

  if (!isOpen) return null;

  const daysLeft = Math.max(0, Math.ceil((RACE_DAY - Date.now()) / 86400000));
  const tabs: { id: Tab; emoji: string; th: string; en: string }[] = [
    { id: 'tickets', emoji: '🎟️', th: 'ตั๋วของฉัน', en: 'My tickets' },
    { id: 'activities', emoji: '🎢', th: 'กิจกรรมของฉัน', en: 'My activities' },
    { id: 'buy', emoji: '🛒', th: 'ซื้อเพิ่ม', en: 'Buy more' },
    { id: 'profile', emoji: '👤', th: 'ข้อมูลของฉัน', en: 'My details' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10090] flex items-start justify-center overflow-y-auto bg-[#140826]/80 p-2 backdrop-blur-md sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('ศูนย์นักวิ่ง', 'Runner Center')}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-4xl overflow-hidden ds-modal text-[#2A1450]"
      >
        {/* header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2D1052] via-[#4C1D95] to-[#7C3AED] px-4 pb-5 pt-4 text-white sm:px-6">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-[#FFC928]/35 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#EC4899]/35 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-[#FFE268] bg-white/95 text-3xl shadow-lg" aria-hidden="true">🐘</span>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FFE268]">RUNNER CENTER · CHANGSUEK RUN 2027</p>
                <h2 className="truncate text-xl font-black leading-tight sm:text-2xl">{t('สวัสดี', 'Hello')}, {user.name || user.username || user.email} 👋</h2>
                <p className="truncate text-xs font-bold text-white/80">{user.email || (user.username && `@${user.username}`) || (user.social?.length ? user.social.map((s) => s[0].toUpperCase() + s.slice(1)).join(' · ') : '')}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LangSwitch className="hidden sm:inline-flex" />
              <button type="button" onClick={onClose} aria-label={t('ปิด', 'Close')} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 hover:bg-white/25 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Stat emoji="⏳" value={daysLeft} label={t('วันก่อนวันวิ่ง (9 ม.ค.)', 'days to race day (9 Jan)')} tint="#FFE268" />
            <Stat emoji="🎟️" value={stats.tickets} label={t('ตั๋ววิ่งที่ชำระแล้ว', 'run tickets paid')} tint="#DDD6FE" />
            <Stat emoji="🎢" value={stats.activities} label={t('รายการกิจกรรมเสริม', 'activity bookings')} tint="#FBCFE8" />
            <Stat emoji="🎶" value={stats.concerts} label={t('ตั๋วคอนเสิร์ต/โต๊ะ VIP', 'concert tickets / VIP')} tint="#BAE6FD" />
          </div>
        </div>

        {/* tabs */}
        <div role="tablist" className="flex gap-2 overflow-x-auto px-4 pt-4 sm:px-6">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => setTab(x.id)}
              className={`min-h-[46px] shrink-0 rounded-2xl border-[3px] px-4 text-sm font-black cursor-pointer transition ${
                tab === x.id ? 'border-[#2A1450] bg-[#FFC928] shadow-[0_4px_0_#2A1450]' : 'border-[#2A1450]/20 bg-white text-[#4B2D78] hover:border-[#2A1450]/50'
              }`}
            >
              <span aria-hidden="true">{x.emoji}</span> {t(x.th, x.en)}
            </button>
          ))}
        </div>

        <div className="space-y-4 px-4 pb-6 pt-4 sm:px-6">
          <VerifyBanner user={user} onGoProfile={() => setTab('profile')} />

          {tab !== 'buy' && tab !== 'profile' && (
            <>
              {loadError && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                  {loadError}
                  <button type="button" onClick={load} className="inline-flex items-center gap-1 rounded-lg border-2 border-rose-300 bg-white px-2.5 py-1 text-xs font-extrabold cursor-pointer">
                    <RefreshCw className="h-3.5 w-3.5" /> {t('ลองใหม่', 'Retry')}
                  </button>
                </div>
              )}
              {!orders && !loadError && <p className="py-10 text-center text-sm font-bold text-[#6B5A85]">{t('กำลังโหลด…', 'Loading…')}</p>}
              {orders && orders.length === 0 && (
                <div className="rounded-3xl border-[3px] border-dashed border-[#7C3AED]/40 bg-white p-8 text-center">
                  <div className="text-5xl" aria-hidden="true">🐾</div>
                  <p className="mt-2 text-lg font-black">{t('ยังไม่มีรายการสั่งซื้อ', 'No orders yet')}</p>
                  <p className="text-sm font-semibold text-[#6B5A85]">{t('เริ่มจากซื้อตั๋ววิ่ง กิจกรรมเสริม หรือตั๋วคอนเสิร์ตได้เลย', 'Start with a run ticket, an activity or a concert ticket')}</p>
                  <button type="button" onClick={() => setTab('buy')} className="mt-4 min-h-[48px] rounded-2xl border-[3px] border-[#140826] bg-[#FFC928] px-6 text-sm font-black shadow-[0_4px_0_#140826] cursor-pointer">
                    {t('ไปซื้อตั๋ว', 'Go to shop')}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ---------- tickets ---------- */}
          {tab === 'tickets' &&
            orders?.map((o) => {
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
                      <span className="block text-xs font-bold text-[#6B5A85]">
                        #{o.orderId} · {new Date(o.createdAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} · {formatBaht(o.totalPrice)} {t('บาท', 'THB')}
                      </span>
                      {o.paymentStatus === 'PAID' && o.bibNumber && k === 'RUN' && (
                        <span className="mt-1 inline-block rounded-lg bg-[#FFE268] px-2 py-0.5 font-mono text-sm font-black">BIB {o.bibNumber}</span>
                      )}
                    </span>
                    <span className="text-xs font-black text-[#7C3AED]">{isOpen2 ? '▲' : '▼'}</span>
                  </button>

                  {isOpen2 && (
                    <div className="space-y-3 border-t-2 border-dashed border-[#2A1450]/15 p-3 sm:p-4">
                      <ul className="flex flex-wrap gap-1.5 text-xs font-extrabold">
                        {k === 'RUN' && <li className="rounded-full bg-[#F3E8FF] px-2.5 py-1">👥 {o.peopleCount} {t('คน', 'runner(s)')}{o.runningWithDog ? ` · 🐶 ${o.dogName || ''}` : ''}</li>}
                        {k === 'RUN' && o.shirtSize && <li className="rounded-full bg-[#F3E8FF] px-2.5 py-1">👕 {t('ไซซ์', 'Size')} {o.shirtSize}</li>}
                        {o.addOns && <li className="rounded-full bg-[#FCE7F3] px-2.5 py-1">🎢 {o.addOns.label}</li>}
                        {!!o.concertQty && <li className="rounded-full bg-[#FEF3C7] px-2.5 py-1">🎶 GA × {o.concertQty}</li>}
                        {!!o.vipTables && <li className="rounded-full bg-[#FEF3C7] px-2.5 py-1">👑 VIP × {o.vipTables}</li>}
                      </ul>

                      {o.paymentStatus === 'PAID' && !o.cancelledAt && k === 'RUN' && o.bibNumber && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {runners.map((r, i) => (
                            <RaceBib key={i} bib={runnerBib(o.bibNumber, i)} routeId={o.routeId} name={r.name} orderId={o.orderId} gender={r.ins?.gender} age={r.ins?.age} shirtSize={r.shirt} dogName={o.runningWithDog ? o.dogName : undefined} />
                          ))}
                        </div>
                      )}
                      {o.paymentStatus === 'PAID' && !o.cancelledAt && !!o.vipTables && (
                        <ParkingPasses orderId={o.orderId} vipTables={o.vipTables} plates={o.parkingPlates} paid />
                      )}
                      {st.key === 'pending' && (
                        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                          {t('ยังไม่ได้ชำระเงิน — ชำระภายใน', 'Not paid yet — pay before')} {new Date(o.expiresAt).toLocaleString(lang === 'en' ? 'en-GB' : 'th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      )}
                      {o.cancelledAt && <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{t('ยกเลิกแล้ว', 'Cancelled')}: {o.cancelReason || '-'}</p>}
                      {o.paymentStatus === 'PAID' && !o.cancelledAt && <ResendTicket orderId={o.orderId} />}
                      {o.docsUrl && (
                        <a href={o.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border-[3px] border-[#140826] bg-[#FFC928] px-5 text-sm font-black shadow-[0_4px_0_#140826] hover:brightness-105">
                          <FileText className="h-4 w-4" /> {t('เปิด/พิมพ์เอกสาร A4 (BIB · ตั๋ว · ใบยืนยัน)', 'Open / print A4 documents (BIB · ticket · confirmation)')}
                        </a>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

          {/* ---------- activities ---------- */}
          {tab === 'activities' && orders && (
            <>
              {orders.filter((o) => o.addOns && !o.cancelledAt).length === 0 && orders.length > 0 && (
                <p className="rounded-2xl bg-white p-6 text-center text-sm font-bold text-[#6B5A85]">{t('ยังไม่ได้ซื้อกิจกรรมเสริม', 'No activities bought yet')}</p>
              )}
              {orders
                .filter((o) => o.addOns && !o.cancelledAt)
                .map((o) => {
                  const st = statusOf(o);
                  const picks = [
                    o.addOns!.tower && { id: 'tower' as const, emoji: '🪂', th: 'หอสูง', en: 'High tower' },
                    o.addOns!.gun !== 'none' && { id: 'gun' as const, emoji: '🎯', th: `ยิงปืน ${o.addOns!.gun === 'premium' ? 'Premium' : 'Standard'}`, en: `Shooting ${o.addOns!.gun === 'premium' ? 'Premium' : 'Standard'}` },
                    o.addOns!.windTunnel && { id: 'wind' as const, emoji: '🌪️', th: 'อุโมงค์ลม', en: 'Wind tunnel' },
                  ].filter(Boolean) as { id: 'tower' | 'gun' | 'wind'; emoji: string; th: string; en: string }[];
                  return (
                    <article key={o.orderId} className="ds-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-black"><CalendarDays className="h-4 w-4 text-[#7C3AED]" /> {t('วันอาทิตย์ที่ 10 ม.ค. 2570', 'Sunday 10 Jan 2027')}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${st.cls}`}>{t(st.th, st.en)}</span>
                      </div>
                      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                        {picks.map((p) => {
                          const loc = ACTIVITY_LOCATIONS.find((a) => a.id === p.id);
                          return (
                            <li key={p.id} className="rounded-2xl border-2 p-3" style={{ borderColor: loc?.color, background: `${loc?.color}12` }}>
                              <div className="text-3xl" aria-hidden="true">{p.emoji}</div>
                              <div className="text-sm font-black">{t(p.th, p.en)}</div>
                              {loc && (
                                <a href={loc.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-extrabold text-[#5B20A8] underline underline-offset-2">
                                  <MapPin className="h-3.5 w-3.5" /> {t('ดูตำแหน่ง', 'Directions')} <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <p className="mt-2 text-xs font-bold text-[#6B5A85]">#{o.orderId} · {formatBaht(o.addOns!.total)} {t('บาท', 'THB')}</p>
                      <button
                        type="button"
                        onClick={() => onBuy('ADDON', { tower: o.addOns!.tower, gun: o.addOns!.gun, windTunnel: o.addOns!.windTunnel, people: 1 })}
                        className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#2A1450] bg-[#FFC928] px-4 text-xs font-black cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> {t('สั่งชุดเดียวกันให้อีกคน (เพื่อน/ครอบครัว)', 'Order the same activities for another person')}
                      </button>
                    </article>
                  );
                })}
              {orders.some((o) => (o.concertQty || o.vipTables) && !o.cancelledAt) && (
                <p className="rounded-2xl bg-[#FEF3C7] px-4 py-3 text-sm font-bold text-[#92400E]">🎶 {t('ตั๋วคอนเสิร์ตของคุณอยู่ในแท็บ "ตั๋วของฉัน"', 'Your concert tickets are in the "My tickets" tab')}</p>
              )}
            </>
          )}

          {/* ---------- buy more ---------- */}
          {tab === 'buy' && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['RUN', 'ADDON', 'CONCERT'] as const).map((k) => {
                  const ks = KIND_STYLE[k];
                  const sub = {
                    RUN: t('10 km · 5 km · Dog Run 4 km / 1 km', '10 km · 5 km · Dog Run 4 km / 1 km'),
                    ADDON: t('หอสูง · ยิงปืน · อุโมงค์ลม (เฉพาะบุคคล)', 'High tower · shooting · wind tunnel (individuals)'),
                    CONCERT: t('GA หรือ VIP TABLE', 'GA or VIP table'),
                  }[k];
                  return (
                    <button key={k} type="button" onClick={() => onBuy(k)} className="group rounded-3xl border border-white/20 p-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 cursor-pointer" style={{ background: ks.grad }}>
                      <span className="text-4xl" aria-hidden="true">{ks.emoji}</span>
                      <span className="mt-2 block text-lg font-black">{t(ks.th, ks.en)}</span>
                      <span className="block text-xs font-bold text-white/90">{sub}</span>
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[#2A1450]"><Plus className="h-3.5 w-3.5" /> {t('ซื้อเลย', 'Buy now')}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ---------- profile ---------- */}
          {tab === 'profile' && <ProfileForm session={session} onLogout={() => { clearSession(); onClose(); }} />}
        </div>
      </div>
    </div>,
    document.body
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
        className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border-[3px] border-[#2A1450]/30 bg-white px-4 text-sm font-black text-[#4B2D78] hover:border-[#2A1450] disabled:opacity-60 cursor-pointer"
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
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
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
          setMsg({ ok: true, text: t('บันทึกข้อมูลแล้ว ✓ ครั้งหน้าระบบจะเติมข้อมูลนี้ให้ในฟอร์มสั่งซื้อ', 'Saved ✓ we will pre-fill these details in your next order') });
        } catch (err) {
          setMsg({ ok: false, text: err instanceof Error ? err.message : t('บันทึกไม่สำเร็จ', 'Could not save') });
        } finally {
          setBusy(false);
        }
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
        <button disabled={busy} className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border-[3px] border-[#140826] bg-[#FFC928] px-6 text-sm font-black shadow-[0_4px_0_#140826] disabled:opacity-60 cursor-pointer"><Save className="h-4 w-4" /> {busy ? t('กำลังบันทึก…', 'Saving…') : t('บันทึก', 'Save')}</button>
        <button type="button" onClick={onLogout} className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border-[3px] border-[#2A1450]/30 bg-white px-5 text-sm font-black text-[#4B2D78] hover:border-[#2A1450] cursor-pointer"><LogOut className="h-4 w-4" /> {t('ออกจากระบบ', 'Log out')}</button>
      </div>
    </form>
  );
};
