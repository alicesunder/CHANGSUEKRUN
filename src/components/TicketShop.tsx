import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, ChevronDown, Clock, Droplets, Flame, Medal, Minus, Plus, Shirt, ShoppingBasket, Sparkles, Ticket, Zap } from 'lucide-react';
import type { RouteId } from '../types';
import { CONCERT_PASS_PRICE, calcTicketTotal, isDogCategory, ticketById } from '../data/eventData';
import {
  AddOnSelection,
  EMPTY_ADD_ONS,
  FULL_EXPERIENCE,
  PREMIUM_GUNS,
  STANDARD_GUNS,
  addOnBonusDiscount,
  addOnLabel,
  addOnPricePerPerson,
  addOnTotal,
  formatBaht,
  hasAddOns,
  hasAllThree,
} from '../data/addOns';
import { getPublicConfig } from '../utils/api';
import { AddOnPicker, PeopleStepper } from './AddOnPicker';
import { DiscountCelebration } from './PerkCelebration';
import { LABRADOR_SVG_PATH } from './brand/LabradorMascot';
import { PawIcon } from './brand/DogDecor';

// ---------------------------------------------------------------------------
// The three parts share one look: a vivid gradient header ribbon + white body
// ---------------------------------------------------------------------------
const STATIONS = {
  run: { n: 1, emoji: '🏃', title: 'ตั๋ววิ่ง', hint: 'เลือก 1 ระยะ (ไม่วิ่งก็ข้ามได้)', grad: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)' },
  concert: { n: 2, emoji: '🎶', title: 'ตั๋วคอนเสิร์ต', hint: 'ริมหาด หลัง 17.30 น. · ซื้อแยกได้', grad: 'linear-gradient(135deg, #F59E0B 0%, #FF6B6B 100%)' },
  addon: { n: 3, emoji: '🎢', title: 'กิจกรรมเสริม', hint: 'ครบ 3 อย่าง ลดทันที 10%', grad: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)' },
} as const;
type StationKey = keyof typeof STATIONS;

// Ticket colours and details (same as the original collectible ticket cards)
interface TicketLook {
  grad: string;
  headerGrad: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  borderIdle: string;
  shadowIdle: string;
  shadowActive: string;
  badgeBg: string;
  badgeText: string;
  btnGrad: string;
  btnText: string;
  serialCode: string;
  bibPrefix: string;
  startTime: string;
  cutoff: string;
  elevationText: string;
  waterCount: number;
  sub: string;
}

const LOOK: Record<RouteId, TicketLook> = {
  '1km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #FFF6F1 55%, #FFE6D8 100%)',
    headerGrad: 'linear-gradient(135deg, #FF7A59 0%, #FF4E88 100%)',
    accent: '#FF5A5F',
    accentDark: '#C2410C',
    accentSoft: '#FFF0E8',
    borderIdle: 'rgba(255, 122, 89, 0.45)',
    shadowIdle: '0 18px 38px -14px rgba(255, 90, 95, 0.3)',
    shadowActive: '0 24px 48px -12px rgba(255, 90, 95, 0.5), 0 0 0 4px rgba(255, 90, 95, 0.3)',
    badgeBg: '#FFFFFF',
    badgeText: '#E11D48',
    btnGrad: 'linear-gradient(135deg, #FF7A59 0%, #FF4E88 100%)',
    btnText: '#FFFFFF',
    serialCode: 'CSR27-DOG-01K',
    bibPrefix: '01-XXXX',
    startTime: '17.30 น.',
    cutoff: '45 นาที',
    elevationText: 'เลียบหาดทราย 100%',
    waterCount: 2,
    sub: 'เดิน-วิ่งชิลล์ริมหาดกับน้องสุนัขตัวโปรด',
  },
  '3km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #F0FDF9 55%, #CCFBF1 100%)',
    headerGrad: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
    accent: '#0D9488',
    accentDark: '#0F766E',
    accentSoft: '#E6FFFA',
    borderIdle: 'rgba(16, 185, 129, 0.45)',
    shadowIdle: '0 18px 38px -14px rgba(16, 185, 129, 0.3)',
    shadowActive: '0 24px 48px -12px rgba(16, 185, 129, 0.5), 0 0 0 4px rgba(16, 185, 129, 0.3)',
    badgeBg: '#FEF9C3',
    badgeText: '#065F46',
    btnGrad: 'linear-gradient(135deg, #10B981 0%, #0284C7 100%)',
    btnText: '#FFFFFF',
    serialCode: 'CSR27-DOG-03K',
    bibPrefix: '03-XXXX',
    startTime: '17.15 น.',
    cutoff: '60 นาที',
    elevationText: 'เลียบหาด + ทิวสนร่มรื่น',
    waterCount: 3,
    sub: 'วิ่งสนุกกำลังดี ไปด้วยกันทั้งคนและน้องสุนัข',
  },
  '5km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #FFFBEB 55%, #FEF08A 100%)',
    headerGrad: 'linear-gradient(135deg, #F59E0B 0%, #FF6B6B 100%)',
    accent: '#B45309',
    accentDark: '#B45309',
    accentSoft: '#FEF3C7',
    borderIdle: 'rgba(245, 158, 11, 0.5)',
    shadowIdle: '0 18px 38px -14px rgba(245, 158, 11, 0.3)',
    shadowActive: '0 24px 48px -12px rgba(245, 158, 11, 0.5), 0 0 0 4px rgba(245, 158, 11, 0.32)',
    badgeBg: '#FFFFFF',
    badgeText: '#B45309',
    btnGrad: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
    btnText: '#261247',
    serialCode: 'CSR27-FUN-05K',
    bibPrefix: '05-XXXX',
    startTime: '17.00 น.',
    cutoff: '75 นาที',
    elevationText: 'ทางเรียบ + ชายหาด',
    waterCount: 3,
    sub: 'สำหรับผู้เริ่มต้น สายสุขภาพ และครอบครัว',
  },
  '10km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #F5F3FF 55%, #E9D5FF 100%)',
    headerGrad: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)',
    accent: '#8B5CF6',
    accentDark: '#5B21B6',
    accentSoft: '#F3E8FF',
    borderIdle: 'rgba(139, 92, 246, 0.45)',
    shadowIdle: '0 18px 38px -14px rgba(139, 92, 246, 0.3)',
    shadowActive: '0 24px 48px -12px rgba(139, 92, 246, 0.5), 0 0 0 4px rgba(139, 92, 246, 0.32)',
    badgeBg: '#FEF08A',
    badgeText: '#4C1D95',
    btnGrad: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
    btnText: '#FFFFFF',
    serialCode: 'CSR27-PRO-10K',
    bibPrefix: '10-XXXX',
    startTime: '16.30 น.',
    cutoff: '120 นาที',
    elevationText: 'รอบค่ายนเรศวรครบวง',
    waterCount: 5,
    sub: 'ท้าทายสถิติใหม่บนเส้นทางชายหาดประวัติศาสตร์',
  },
};

const perks = (isDog: boolean) => [
  { Icon: Shirt, title: isDog ? 'เสื้อ + ผ้าพันคอน้อง' : 'เสื้อวิ่ง Micro-Dry' },
  { Icon: Medal, title: 'เหรียญรางวัล 3D' },
  { Icon: Ticket, title: isDog ? 'BIB คู่ คน+น้อง' : 'ป้าย BIB + ชิปเวลา' },
  { Icon: Droplets, title: isDog ? 'น้ำ & ขนมน้องหมา' : 'อาหาร & เกลือแร่' },
];

const RUN_ORDER: RouteId[] = ['1km', '3km', '5km', '10km'];

// ---------------------------------------------------------------------------
const StationCard: React.FC<{ id: string; k: StationKey; done: boolean; children: React.ReactNode; aside?: React.ReactNode }> = ({ id, k, done, children, aside }) => {
  const s = STATIONS[k];
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="relative scroll-mt-24 rounded-[30px] bg-white border-[3px] border-[var(--ink)] shadow-[6px_7px_0_var(--ink)]"
    >
      <header className="relative overflow-hidden flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-t-[27px] text-white" style={{ background: s.grad }}>
        <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-6 w-36 h-36 rounded-full bg-white/25 blur-2xl" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
        <motion.span
          aria-hidden="true"
          animate={done ? { rotate: [0, -14, 14, 0], scale: [1, 1.18, 1] } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-12 h-12 shrink-0 rounded-2xl bg-white border-[3px] border-[var(--ink)] flex items-center justify-center text-2xl shadow-[0_3px_0_var(--ink)]"
        >
          {s.emoji}
          <span
            className="absolute -top-2 -left-2 w-6 h-6 rounded-full border-2 border-[var(--ink)] text-xs font-black flex items-center justify-center"
            style={{ background: done ? '#10B981' : '#FFC928', color: done ? '#fff' : 'var(--ink)' }}
          >
            {done ? <Check className="w-3.5 h-3.5 stroke-[3.5]" /> : s.n}
          </span>
        </motion.span>
        <div className="relative min-w-0 flex-1">
          <h3 id={`${id}-title`} className="text-xl sm:text-2xl font-extrabold leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
            {s.title}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-white/90 leading-snug">{s.hint}</p>
        </div>
        {aside && <div className="relative">{aside}</div>}
      </header>
      <div className="p-3.5 sm:p-5">{children}</div>
    </section>
  );
};

/** One collectible run ticket (colours + details from the original ticket cards). */
const RunTicket: React.FC<{ id: RouteId; on: boolean; onPick: () => void }> = ({ id, on, onPick }) => {
  const t = ticketById(id);
  const l = LOOK[id];
  const isDog = isDogCategory(id);
  return (
    <motion.article
      whileHover={{ y: -4 }}
      animate={on ? { y: -6, rotate: -0.6 } : { y: 0, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 20 }}
      className="group relative flex flex-col rounded-[26px] overflow-hidden shrink-0 w-[88%] snap-start sm:w-auto"
      style={{ background: l.grad, border: on ? '3px solid var(--ink)' : `2px solid ${l.borderIdle}`, boxShadow: on ? l.shadowActive : l.shadowIdle }}
    >
      {/* foil sheen on hover */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -inset-y-12 w-28 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-ticket-shimmer" />
      </div>

      {/* header */}
      <div className="relative px-4 pt-3.5 pb-3.5 text-white overflow-hidden" style={{ background: l.headerGrad }}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/60" />
        <div aria-hidden="true" className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/25 blur-2xl" />
        <div className="relative z-10 flex items-center gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: l.badgeBg, color: l.badgeText }}>
            {isDog ? <PawIcon size={11} color="currentColor" /> : <Zap className="w-3 h-3 fill-current" />}
            {isDog ? 'DOG RUN' : 'RUNNER'}
          </span>
          {t.badge && (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-black/25 border border-white/25">
              <Sparkles className="w-3 h-3 text-[#FFE28A]" />
              {t.badge}
            </span>
          )}
        </div>
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display text-4xl font-black leading-none tracking-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.22)]">{t.distanceLabel}</span>
              <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-black/25 border border-white/20">BIB {l.bibPrefix}</span>
            </div>
            <h4 className="mt-1 text-sm font-extrabold text-white/95 break-words">{t.name}</h4>
          </div>
          <motion.span
            animate={on ? { y: [0, -6, 0], rotate: [0, -8, 8, 0] } : { y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-14 h-14 shrink-0 rounded-2xl bg-white/95 border-2 border-white shadow-[0_10px_20px_-6px_rgba(0,0,0,0.28)] flex items-center justify-center overflow-hidden"
            aria-hidden="true"
          >
            {isDog ? <img src={LABRADOR_SVG_PATH} alt="" loading="lazy" className="w-12 h-12 object-contain translate-y-0.5" /> : <span className="text-3xl">{t.emoji}</span>}
          </motion.span>
        </div>
        <div className="relative z-10 mt-3 pt-2 border-t border-white/25 flex items-center justify-between gap-1 text-xs font-bold text-white/95">
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#FFE28A]" />{l.startTime}</span>
          <span className="inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-[#FFE28A]" />{l.cutoff}</span>
          <span className="inline-flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-[#FFE28A]" />น้ำ {l.waterCount} จุด</span>
        </div>
      </div>

      {/* body */}
      <div className="relative z-10 p-3.5 flex-1">
        <p className="text-xs font-bold text-[#4B2D78] leading-snug mb-2.5">{l.sub}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {perks(isDog).map(({ Icon, title }) => (
            <div key={title} className="flex items-center gap-1.5 bg-white/90 rounded-xl px-2 py-1.5 border border-white shadow-[0_2px_8px_-2px_rgba(42,20,80,0.08)]">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: l.accentSoft, color: l.accent }}>
                <Icon className="w-3.5 h-3.5 stroke-[2.3]" />
              </span>
              <span className="text-xs font-extrabold text-[#261247] leading-tight">{title}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-white/90 border border-dashed flex items-center justify-between gap-2 text-xs font-extrabold" style={{ borderColor: l.accent }}>
          {isDog ? (
            <>
              <span className="text-[#4B2D78]">เพิ่มผู้ร่วมวิ่ง</span>
              <span className="tabular-nums" style={{ color: l.accentDark }}>+{t.addPersonPrice}฿/คน</span>
            </>
          ) : id === '10km' ? (
            <>
              <span className="text-[#4B2D78]">⏱️ ติดชิปจับเวลา (Timing Chip)</span>
              <span style={{ color: l.accentDark }}>ทุกคน</span>
            </>
          ) : (
            <>
              <span className="text-[#4B2D78]">เส้นทาง</span>
              <span style={{ color: l.accentDark }}>{l.elevationText}</span>
            </>
          )}
        </div>
      </div>

      {/* perforation */}
      <div className="relative z-10 flex items-center px-2" aria-hidden="true">
        <span className="-ml-4 w-5 h-5 rounded-full bg-[#FBF3FF] shrink-0" />
        <span className="w-full border-t-2 border-dashed border-[#261247]/15 mx-1.5" />
        <span className="text-[11px] font-mono font-extrabold tracking-widest px-2 py-0.5 rounded-full shrink-0" style={{ background: l.accentSoft, color: l.accentDark }}>
          {l.serialCode}
        </span>
        <span className="w-full border-t-2 border-dashed border-[#261247]/15 mx-1.5" />
        <span className="-mr-4 w-5 h-5 rounded-full bg-[#FBF3FF] shrink-0" />
      </div>

      {/* stub: price + pick */}
      <div className="relative z-10 p-3.5 pt-2.5 bg-white/90">
        <div className="flex items-end justify-between mb-2.5">
          <span>
            <span className="block text-xs font-bold text-[#6B5A85]">ราคาบัตร ({t.baseLabel})</span>
            <span className="font-display text-3xl font-black tabular-nums leading-none" style={{ color: l.accentDark }}>
              {formatBaht(t.basePrice)}
            </span>
            <span className="ml-1 text-xs font-extrabold text-[#261247]">บาท</span>
          </span>
          <span aria-hidden="true" className="inline-flex items-end gap-[2px] h-5 opacity-60">
            {[2, 3.5, 1.5, 3, 1.5, 3.5, 2, 1.5, 3, 2].map((w, i) => (
              <span key={i} className="bg-[#261247] rounded-full" style={{ width: w, height: i % 2 ? '75%' : '100%' }} />
            ))}
          </span>
        </div>
        <motion.button
          type="button"
          role="radio"
          aria-checked={on}
          onClick={onPick}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden w-full min-h-[48px] rounded-2xl px-4 flex items-center justify-center gap-2 font-extrabold text-sm cursor-pointer border-2"
          style={on ? { background: 'var(--ink)', color: '#FFE268', borderColor: 'var(--ink)' } : { background: l.btnGrad, color: l.btnText, borderColor: 'transparent' }}
        >
          <span className="absolute inset-0 ticket-foil-shimmer opacity-40 pointer-events-none" />
          {on ? <Check className="w-4 h-4 stroke-[3] relative" /> : <Ticket className="w-4 h-4 relative" />}
          <span className="relative">{on ? `เลือกแล้ว · ${t.distanceLabel}` : `เลือกบัตร ${t.distanceLabel}`}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {on && (
          <motion.span
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: -8 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
            className="absolute right-3 bottom-[76px] z-30 px-2.5 py-1 rounded-full bg-[#FFE268] border-2 border-[var(--ink)] text-xs font-black text-[var(--ink)] shadow-[0_3px_0_var(--ink)]"
            aria-hidden="true"
          >
            ✓ ปั๊มแล้ว!
          </motion.span>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

const QtyStepper: React.FC<{ value: number; onChange: (n: number) => void; label: string }> = ({ value, onChange, label }) => (
  <div className="inline-flex items-center gap-1.5" role="group" aria-label={label}>
    <button
      type="button"
      onClick={() => onChange(Math.max(0, value - 1))}
      disabled={value <= 0}
      aria-label={`ลด${label}`}
      className="w-12 h-12 rounded-2xl border-[3px] border-[var(--ink)] bg-white text-[var(--ink)] flex items-center justify-center shadow-[0_3px_0_var(--ink)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 cursor-pointer"
    >
      <Minus className="w-5 h-5 stroke-[3]" />
    </button>
    <motion.span
      key={value}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className="w-12 text-center text-3xl font-black tabular-nums text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]"
      aria-live="polite"
    >
      {value}
    </motion.span>
    <button
      type="button"
      onClick={() => onChange(Math.min(9, value + 1))}
      disabled={value >= 9}
      aria-label={`เพิ่ม${label}`}
      className="w-12 h-12 rounded-2xl border-[3px] border-[var(--ink)] bg-[#FFC928] text-[var(--ink)] flex items-center justify-center shadow-[0_3px_0_var(--ink)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 cursor-pointer"
    >
      <Plus className="w-5 h-5 stroke-[3]" />
    </button>
  </div>
);

const Equaliser: React.FC<{ on: boolean }> = ({ on }) => (
  <span aria-hidden="true" className="inline-flex items-end gap-[3px] h-7">
    {['#FFC928', '#FF6B6B', '#EC4899', '#A78BFA', '#38BDF8'].map((c, i) => (
      <span key={c} className={`w-[5px] rounded-full ${on ? 'eq-bar' : ''}`} style={{ background: c, height: on ? undefined : 8 + (i % 3) * 5, animationDelay: `${i * 0.12}s` }} />
    ))}
  </span>
);

// ---------------------------------------------------------------------------
interface TicketShopProps {
  run: RouteId | null;
  onRunChange: (r: RouteId | null) => void;
  concertQty: number;
  onConcertQtyChange: (n: number) => void;
  addOns: AddOnSelection;
  onAddOnsChange: (s: AddOnSelection) => void;
  /** Opens the form with everything chosen here */
  onCheckout: () => void;
  onOpenComparison?: () => void;
  onOpenPace?: () => void;
  onShowMap?: () => void;
}

/** The ticket shop: run, concert and activities — any one, or any mix — with one basket. */
export const TicketShop: React.FC<TicketShopProps> = ({
  run,
  onRunChange,
  concertQty,
  onConcertQtyChange,
  addOns,
  onAddOnsChange,
  onCheckout,
  onOpenComparison,
  onOpenPace,
  onShowMap,
}) => {
  const [windRemaining, setWindRemaining] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    getPublicConfig()
      .then((c) => alive && setWindRemaining(typeof c.windTunnelRemaining === 'number' ? c.windTunnelRemaining : null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const picked = hasAddOns(addOns);
  const allThree = picked && hasAllThree(addOns);
  const runPrice = run ? calcTicketTotal(run, 0, 0) : 0;
  const concertPrice = CONCERT_PASS_PRICE * concertQty;
  const bonus = addOnBonusDiscount(addOns);
  const addOnPrice = addOnTotal(addOns);
  const total = runPrice + concertPrice + addOnPrice;
  const count = (run ? 1 : 0) + (concertQty > 0 ? 1 : 0) + (picked ? 1 : 0);
  const activityCount = (addOns.tower ? 1 : 0) + (addOns.gun !== 'none' ? 1 : 0) + (addOns.windTunnel ? 1 : 0);

  const lines: { key: string; emoji: string; tint: string; label: string; sub?: string; price: number; onRemove: () => void }[] = [];
  if (run) {
    const t = ticketById(run);
    lines.push({ key: 'run', emoji: '🏃', tint: LOOK[run].accentSoft, label: `วิ่ง ${t.distanceLabel}`, sub: t.name, price: runPrice, onRemove: () => onRunChange(null) });
  }
  if (concertQty > 0) {
    lines.push({ key: 'concert', emoji: '🎶', tint: '#FEF3C7', label: `คอนเสิร์ต × ${concertQty}`, sub: `${formatBaht(CONCERT_PASS_PRICE)} บาท/ใบ`, price: concertPrice, onRemove: () => onConcertQtyChange(0) });
  }
  if (picked) {
    lines.push({
      key: 'addon',
      emoji: '🎢',
      tint: '#E0F7FA',
      label: `${addOnLabel(addOns)} × ${addOns.people}`,
      sub: bonus > 0 ? `รวมส่วนลด 10% แล้ว (−${formatBaht(bonus)})` : `${formatBaht(addOnPricePerPerson(addOns))} บาท/คน`,
      price: addOnPrice,
      onRemove: () => onAddOnsChange({ ...EMPTY_ADD_ONS }),
    });
  }

  const checkoutBtn = (compact = false) => (
    <button
      type="button"
      onClick={onCheckout}
      disabled={count === 0}
      className={`btn-paw bg-[#FFC928] text-[var(--ink)] flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed ${
        compact ? 'px-4 py-2.5 text-sm min-h-[48px]' : 'w-full px-5 py-3.5 text-base min-h-[56px]'
      }`}
    >
      {count === 0 ? 'เลือกอย่างน้อย 1 อย่าง' : compact ? 'ไปต่อ' : 'ไปกรอกข้อมูล & ชำระเงิน'}
      {count > 0 && <ArrowRight className="w-5 h-5 stroke-[2.5]" />}
    </button>
  );

  return (
    <div className="relative rounded-[40px] p-[4px] shadow-[0_40px_90px_-30px_rgba(147,51,234,0.55)]" style={{ background: 'linear-gradient(120deg, #FF7A59, #FFC928, #10B981, #0EA5E9, #9333EA, #EC4899)' }}>
      <div className="relative rounded-[36px] px-3 sm:px-6 lg:px-8 py-8 sm:py-10" style={{ background: 'linear-gradient(160deg, #FFF7E6 0%, #FDF0FF 40%, #EEF4FF 75%, #E9FBF5 100%)' }}>
        {/* party lights (clipped to the frame; the frame itself stays unclipped so the basket can stick) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]">
          <span className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#FFC928]/35 blur-3xl" />
          <span className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-[#EC4899]/20 blur-3xl" />
          <span className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-[#0EA5E9]/20 blur-3xl" />
          {['🎉', '🐾', '✨', '🎈', '⭐'].map((e, i) => (
            <motion.span
              key={e}
              className="absolute text-2xl hidden sm:block"
              style={{ top: `${[3, 8, 3, 9, 6][i]}%`, left: `${[6, 18, 80, 90, 66][i]}%` }}
              animate={{ y: [0, -10, 0], rotate: [-10, 10, -10] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {e}
            </motion.span>
          ))}
        </div>

        {/* ---------- Heading ---------- */}
        <div className="relative text-center max-w-2xl mx-auto mb-7 sm:mb-9">
          <motion.img
            src={LABRADOR_SVG_PATH}
            alt=""
            aria-hidden="true"
            className="mx-auto w-16 h-[70px] object-contain"
            animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="inline-block mt-1 px-4 py-1 rounded-full text-white text-xs font-extrabold tracking-[0.2em] border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)]" style={{ background: 'linear-gradient(90deg, #FF4E88, #9333EA, #0EA5E9)' }}>
            TICKET SHOP
          </span>
          <h2 className="mt-3 font-hero text-3xl sm:text-5xl font-bold leading-[1.35]">
            <span className="inline-block bg-gradient-to-r from-[#FF4E88] via-[#9333EA] to-[#0EA5E9] bg-clip-text text-transparent px-1 pt-2 pb-1">ซื้อบัตรงานวิ่ง</span>
          </h2>
          <p className="mt-1 text-sm sm:text-base font-bold text-[#4B2D78]">
            เลือกได้ 1, 2 หรือครบ 3 อย่าง <span className="text-[#EC4899]">แล้วจ่ายทีเดียวจบ</span>
          </p>
          <ol className="mt-4 flex flex-wrap justify-center gap-2" aria-label="3 ส่วนของร้าน">
            {(Object.keys(STATIONS) as StationKey[]).map((k) => {
              const s = STATIONS[k];
              const done = k === 'run' ? !!run : k === 'concert' ? concertQty > 0 : picked;
              return (
                <li key={k}>
                  <a
                    href={`#shop-${k}`}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full border-[3px] border-[var(--ink)] text-sm font-extrabold text-white shadow-[0_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5"
                    style={{ background: s.grad }}
                  >
                    <span aria-hidden="true" className="w-5 h-5 rounded-full bg-white text-[var(--ink)] text-xs font-black flex items-center justify-center">
                      {done ? '✓' : s.n}
                    </span>
                    <span aria-hidden="true">{s.emoji}</span>
                    {s.title}
                  </a>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start">
          {/* ---------- The three parts ---------- */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Run */}
            <StationCard
              id="shop-run"
              k="run"
              done={!!run}
              aside={
                run ? (
                  <button type="button" onClick={() => onRunChange(null)} className="shrink-0 px-3 min-h-[40px] rounded-full bg-white/25 border-2 border-white/60 text-xs font-extrabold text-white cursor-pointer">
                    ไม่วิ่ง
                  </button>
                ) : null
              }
            >
              <span id="ticket-cards" className="block h-0 scroll-mt-28" aria-hidden="true" />
              <div
                role="radiogroup"
                aria-label="เลือกระยะวิ่ง"
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-3.5 px-3.5 pt-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:pt-2 sm:pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible"
              >
                {RUN_ORDER.map((id) => (
                  <RunTicket key={id} id={id} on={run === id} onPick={() => onRunChange(run === id ? null : id)} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[#6B5A85]">
                <span className="sm:hidden">ปัดดูบัตรอื่น →</span>
                {onOpenComparison && (
                  <button type="button" onClick={onOpenComparison} className="underline underline-offset-4 text-[#7C3AED] min-h-[44px] cursor-pointer">
                    เปรียบเทียบระยะ
                  </button>
                )}
                {onOpenPace && (
                  <button type="button" onClick={onOpenPace} className="underline underline-offset-4 text-[#7C3AED] min-h-[44px] cursor-pointer">
                    คำนวณเพซ
                  </button>
                )}
                {onShowMap && (
                  <button type="button" onClick={onShowMap} className="underline underline-offset-4 text-[#7C3AED] min-h-[44px] cursor-pointer">
                    ดูเส้นทาง
                  </button>
                )}
              </div>
            </StationCard>

            {/* 2. Concert */}
            <StationCard id="shop-concert" k="concert" done={concertQty > 0}>
              <span id="concert-pass" className="block h-0 scroll-mt-28" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[24px] border-[3px] border-[var(--ink)] bg-gradient-to-br from-[#241047] via-[#341866] to-[#4A1F8F] text-white p-4 sm:p-5">
                <span aria-hidden="true" className="pointer-events-none absolute -top-14 -left-10 w-48 h-48 rounded-full bg-[#FFC928]/30 blur-3xl" />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-[#EC4899]/35 blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-16 h-16 shrink-0 rounded-2xl bg-black/30 border-2 border-white/25 flex items-center justify-center">
                      <Equaliser on={concertQty > 0} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg font-extrabold leading-tight">คอนเสิร์ตริมหาดชะอำ</p>
                      <p className="text-xs sm:text-sm font-semibold text-white/85 leading-snug">ไม่ต้องวิ่งก็มาได้ · ซื้อให้ทั้งครอบครัวได้</p>
                      <p className="mt-1 text-2xl font-black text-[#FFD84D] tabular-nums leading-none">
                        {formatBaht(CONCERT_PASS_PRICE)} <span className="text-xs font-bold text-white/85">บาท / ใบ</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-xs font-extrabold text-white/80 sm:hidden">จำนวนตั๋ว</span>
                    <QtyStepper value={concertQty} onChange={onConcertQtyChange} label="ตั๋วคอนเสิร์ต" />
                  </div>
                </div>
              </div>
            </StationCard>

            {/* 3. Activities */}
            <div className="relative">
              <DiscountCelebration active={allThree} discount={bonus} />
              <div className={`rounded-[34px] p-[3px] transition-all ${allThree ? 'addon-celebrate' : ''}`}>
                <StationCard
                  id="shop-addon"
                  k="addon"
                  done={picked}
                  aside={
                    <span className="shrink-0 flex items-center gap-1" aria-label={`เลือกแล้ว ${activityCount} จาก 3 กิจกรรม`}>
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          animate={i < activityCount ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                          className={`w-7 h-7 rounded-full border-2 border-[var(--ink)] flex items-center justify-center text-sm ${i < activityCount ? 'bg-[#FFC928]' : 'bg-white/80'}`}
                          aria-hidden="true"
                        >
                          {i < activityCount ? '🐾' : ''}
                        </motion.span>
                      ))}
                    </span>
                  }
                >
                  <span id="addons" className="block h-0 scroll-mt-28" aria-hidden="true" />
                  <p className={`mb-3 rounded-2xl px-3 py-2 text-sm font-extrabold text-center border-2 ${allThree ? 'bg-[#FFE268] border-[var(--ink)] text-[var(--ink)]' : 'bg-gradient-to-r from-[#E0F7FA] to-[#ECFDF5] border-[#0EA5E9]/30 text-[#0369A1]'}`}>
                    {allThree ? '🎉 ครบ 3 กิจกรรมแล้ว! ลดทันที 10%' : activityCount === 2 ? 'อีกแค่ 1 กิจกรรม ได้ส่วนลด 10% ทันที!' : 'เลือกครบ 3 กิจกรรม ลดทันที 10% 🎁'}
                  </p>
                  <AddOnPicker value={addOns} onChange={onAddOnsChange} windTunnelRemaining={windRemaining} showResult={false} layout="rows" />
                  <AnimatePresence>
                    {picked && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#E0F7FA] border-2 border-[#0EA5E9]/30 px-3.5 py-2.5">
                          <span className="text-sm font-extrabold text-[var(--ink)]">จำนวนคนที่เล่น</span>
                          <PeopleStepper value={addOns.people} onChange={(n) => onAddOnsChange({ ...addOns, people: n })} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <details className="group mt-3 rounded-2xl bg-[#FAF7FF] border-2 border-[var(--ink)]/10">
                    <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-2.5 min-h-[48px] text-sm font-extrabold text-[var(--ink)]">
                      <span>ราคาแพ็กเกจ & รายชื่อปืนที่เลือกได้</span>
                      <ChevronDown className="w-5 h-5 shrink-0 text-[#0EA5E9] transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-extrabold text-[#0369A1] mb-1">แพ็กเกจ (ต่อคน)</p>
                        <ul className="space-y-1 font-semibold text-[var(--ink)]">
                          <li className="flex justify-between gap-2"><span>หอสูง + ยิงปืน Standard</span><span className="tabular-nums">1,190</span></li>
                          <li className="flex justify-between gap-2"><span>หอสูง + อุโมงค์ลม</span><span className="tabular-nums">1,190</span></li>
                          <li className="flex justify-between gap-2"><span>ยิงปืน Standard + อุโมงค์ลม</span><span className="tabular-nums">1,690</span></li>
                          <li className="flex justify-between gap-2 font-extrabold"><span>ครบ 3 กิจกรรม</span><span className="tabular-nums">{formatBaht(FULL_EXPERIENCE.price)} → {formatBaht(Math.round(FULL_EXPERIENCE.price * 0.9))}</span></li>
                          <li className="flex justify-between gap-2"><span>ครบ 3 + ยิงปืน Premium</span><span className="tabular-nums">3,050 → 2,745</span></li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-extrabold text-[#0369A1] mb-1">ปืน Standard (เลือก 1 กระบอก · 10 นัด)</p>
                        <p className="font-semibold text-[#4B2D78] leading-relaxed">{STANDARD_GUNS.flatMap((g) => g.guns).join(' · ')}</p>
                        <p className="font-extrabold text-[#0369A1] mt-2 mb-1">ปืน Premium</p>
                        <p className="font-semibold text-[#4B2D78] leading-relaxed">{PREMIUM_GUNS.join(' · ')}</p>
                      </div>
                    </div>
                  </details>
                </StationCard>
              </div>
            </div>
          </div>

          {/* ---------- Basket: side card on desktop, sticky bar on phones ---------- */}
          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24" aria-label="ตะกร้า">
            <div className="rounded-[30px] bg-white border-[3px] border-[var(--ink)] shadow-[6px_7px_0_var(--ink)] overflow-hidden">
              <div className="relative overflow-hidden px-5 py-4 text-white flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #2A1450 0%, #6D28D9 60%, #EC4899 100%)' }}>
                <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
                <ShoppingBasket className="relative w-6 h-6 text-[#FFC928]" aria-hidden="true" />
                <h3 className="relative text-lg font-extrabold">ตะกร้าของคุณ</h3>
                <span className="relative ml-auto px-2.5 py-0.5 rounded-full bg-[#FFC928] text-[var(--ink)] text-xs font-black">{count}/3</span>
              </div>
              <div className="p-5">
                {lines.length === 0 ? (
                  <div className="text-center py-6">
                    <motion.span className="inline-block text-5xl" animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 2.2, repeat: Infinity }} aria-hidden="true">
                      🐶
                    </motion.span>
                    <p className="mt-2 text-sm font-extrabold text-[var(--ink)]">ตะกร้ายังว่างอยู่</p>
                    <p className="text-xs font-bold text-[#6B5A85]">แตะเลือกตั๋วทางซ้ายได้เลย</p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    <AnimatePresence initial={false}>
                      {lines.map((l) => (
                        <motion.li key={l.key} layout initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="flex items-start gap-2.5">
                          <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-lg border-2 border-[var(--ink)]/10" style={{ background: l.tint }} aria-hidden="true">
                            {l.emoji}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-extrabold text-[var(--ink)] break-words">{l.label}</span>
                            {l.sub && <span className="block text-xs font-bold text-[#6B5A85] break-words">{l.sub}</span>}
                          </span>
                          <span className="text-right shrink-0">
                            <span className="block text-sm font-black text-[var(--ink)] tabular-nums">{formatBaht(l.price)}</span>
                            <button type="button" onClick={l.onRemove} className="text-xs font-bold text-rose-500 underline underline-offset-2 cursor-pointer min-h-[28px]">
                              เอาออก
                            </button>
                          </span>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
                <div className="my-4 border-t-[3px] border-dashed border-[var(--ink)]/15" />
                <div className="flex items-end justify-between mb-4">
                  <span className="text-sm font-extrabold text-[#6B5A85]">ยอดรวม</span>
                  <motion.span
                    key={total}
                    initial={{ scale: 1.25, color: '#EC4899' }}
                    animate={{ scale: 1, color: '#2A1450' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="text-4xl font-black tabular-nums leading-none"
                  >
                    {formatBaht(total)}
                    <span className="text-base font-bold ml-1">บาท</span>
                  </motion.span>
                </div>
                {checkoutBtn()}
                <p className="mt-2.5 text-center text-xs font-bold text-[#6B5A85]">ชำระผ่าน PromptPay QR · ได้ตั๋วทันที</p>
              </div>
            </div>
          </aside>

          <AnimatePresence>
          {count > 0 && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="lg:hidden sticky bottom-[76px] z-30"
          >
            <div className="rounded-[24px] bg-white border-[3px] border-[var(--ink)] shadow-[4px_5px_0_var(--ink)] px-3.5 py-2.5 flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6D28D9, #EC4899)' }}>
                <ShoppingBasket className="w-5 h-5 text-[#FFC928]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-[#6B5A85] break-words">
                  {lines.length ? lines.map((l) => l.emoji).join(' ') + ` · ${count} อย่าง` : 'ตะกร้ายังว่าง'}
                </span>
                <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="block origin-left text-xl font-black text-[var(--ink)] tabular-nums leading-tight">
                  {formatBaht(total)} <span className="text-xs font-bold">บาท</span>
                </motion.span>
              </span>
              {checkoutBtn(true)}
            </div>
          </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
