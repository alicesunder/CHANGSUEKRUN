import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Clock, Footprints, Hourglass, Info, Music, Ticket } from 'lucide-react';
import { ADDON_CONCERT_RATE, ADDON_MAX_RATE, ADDON_THREE_RATE, ADDON_TWO_RATE, CONCERT_BUNDLE_RATE, formatBaht, percentOf } from '../data/addOns';
import { concertPassPrice } from '../data/eventData';
import { useEarlyBird } from '../utils/earlyBird';

const COLORS = ['#FFC928', '#EC4899', '#9333EA', '#0EA5E9', '#10B981', '#FB923C', '#FFFFFF'];
const EMOJIS = ['🎉', '🐾', '⭐', '🐶', '✨', '🎊', '💰', '🔥'];

interface Piece {
  id: number;
  x: number;
  y: number;
  r: number;
  s: number;
  color: string;
  delay: number;
  shape: 'rect' | 'dot' | 'emoji';
  emoji: string;
}

const makePieces = (n: number): Piece[] =>
  Array.from({ length: n }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 280;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.8 - 50,
      r: Math.random() * 720 - 360,
      s: 0.7 + Math.random() * 1,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.15,
      shape: i % 6 === 0 ? 'emoji' : i % 3 === 0 ? 'dot' : 'rect',
      emoji: EMOJIS[i % EMOJIS.length],
    };
  });

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface CelebrationProps {
  active: boolean;
  /** changes whenever a new, better deal unlocks, so the show plays again */
  burstKey: string;
  kicker: string;
  headline: string;
  /** baht saved, shown under the headline */
  discount: number;
  /** how big the confetti shower is */
  pieces?: number;
}

/** How long the price-tag sign stays up; it sits over the card, so it must not linger over the buttons. */
const SIGN_MS = 2600;

/** Confetti shower + a bouncing price-tag sign. Plays every time a deal unlocks (or improves). */
export const DiscountCelebration: React.FC<CelebrationProps> = ({ active, burstKey, kicker, headline, discount, pieces = 70 }) => {
  const [burst, setBurst] = useState(0);
  const [signUp, setSignUp] = useState(false);
  const prev = useRef('');
  const reduced = useMemo(prefersReducedMotion, []);

  useEffect(() => {
    const key = active ? burstKey : '';
    if (key && key !== prev.current) setBurst((b) => b + 1);
    prev.current = key;
  }, [active, burstKey]);

  useEffect(() => {
    if (!burst) return;
    setSignUp(true);
    const t = window.setTimeout(() => setSignUp(false), SIGN_MS);
    return () => window.clearTimeout(t);
  }, [burst]);

  const list = useMemo(() => (burst ? makePieces(reduced ? 0 : pieces) : []), [burst, reduced, pieces]);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24 z-30 w-0 h-0">
        {list.map((p) => (
          <motion.span
            key={`${burst}-${p.id}`}
            className="absolute block"
            style={{
              width: p.shape === 'emoji' ? 'auto' : p.shape === 'dot' ? 9 : 8,
              height: p.shape === 'emoji' ? 'auto' : p.shape === 'dot' ? 9 : 14,
              borderRadius: p.shape === 'dot' ? 9 : 2,
              background: p.shape === 'emoji' ? 'transparent' : p.color,
              fontSize: p.shape === 'emoji' ? 22 : undefined,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.2, rotate: 0 }}
            animate={{ x: p.x, y: [0, p.y, p.y + 200], opacity: [1, 1, 0], scale: p.s, rotate: p.r }}
            transition={{ duration: 1.9, delay: p.delay, ease: 'easeOut' }}
          >
            {p.shape === 'emoji' ? p.emoji : null}
          </motion.span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {active && signUp && (
          <motion.div
            key={`sign-${burstKey}`}
            role="status"
            aria-live="polite"
            initial={{ scale: 0, rotate: -30, y: 30, opacity: 0 }}
            animate={{ scale: 1, rotate: -4, y: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 14, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 10 }}
            className="pointer-events-none absolute -top-7 right-1 sm:right-6 z-40 origin-bottom-left max-w-[88%]"
          >
            <motion.div
              animate={{ rotate: [-4, 3, -4], y: [0, -6, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="relative overflow-hidden rounded-[22px] border-[3px] border-[#2A1450] px-4 py-2.5 text-center shadow-[0_8px_0_#2A1450,0_20px_44px_-8px_rgba(236,72,153,0.8)]"
              style={{ background: 'linear-gradient(135deg, #FFE268 0%, #FFC928 40%, #FF7A59 80%, #EC4899 100%)' }}
            >
              <span aria-hidden="true" className="perk-shine absolute inset-y-0 -left-1/3 w-1/3 bg-white/60 skew-x-[-20deg]" />
              <span className="relative block text-[11px] font-extrabold tracking-wide text-[#2A1450]">{kicker}</span>
              <span className="relative block text-2xl sm:text-3xl font-black leading-none text-[#2A1450] drop-shadow-[0_2px_0_rgba(255,255,255,0.7)]">{headline}</span>
              {discount > 0 && <span className="relative block mt-1 text-xs font-extrabold text-[#7C2D12]">ประหยัดไปเลย {formatBaht(discount)} บาท 💰</span>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface DealStripProps {
  hasRun: boolean;
  /** GA concert tickets in the basket (the run + concert deal is on GA only) */
  hasGaConcert: boolean;
  /** GA or VIP concert in the basket */
  hasConcert: boolean;
  activities: number;
}

const ACT_ICONS = ['/images/shop/shoot-v2.webp', '/images/shop/tower-v2.webp', '/images/shop/wind-v2.webp'];

/** Small round icon chip used on the coupons. */
const Chip: React.FC<{ children: React.ReactNode; tone: 'gold' | 'violet' }> = ({ children, tone }) => (
  <span
    aria-hidden="true"
    className={`inline-flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-md sm:rounded-lg border-2 ${
      tone === 'gold' ? 'border-[#E0A100] bg-white text-[#4B1FA8]' : 'border-[#B79AE8] bg-white text-[#4B1FA8]'
    }`}
  >
    {children}
  </span>
);

const ThreeActs: React.FC = () => (
  <>
    {ACT_ICONS.map((src) => (
      <span key={src} aria-hidden="true" className="inline-flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-md sm:rounded-lg border-2 border-[#D9C9EF] bg-white">
        <img src={src} alt="" className="h-[18px] w-[18px] sm:h-6 sm:w-6 object-contain mix-blend-multiply" loading="lazy" />
      </span>
    ))}
  </>
);

/**
 * The bundle deals as four collectable coupons (perforated edges, big discount pill). A coupon lights up
 * with a "ได้แล้ว!" stamp as soon as the basket qualifies; the progress pill counts the unlocked deals.
 */
export const DealStrip: React.FC<DealStripProps> = ({ hasRun, hasGaConcert, hasConcert, activities }) => {
  const concertUnit = concertPassPrice(useEarlyBird());
  const concertNet = concertUnit - Math.round(concertUnit * CONCERT_BUNDLE_RATE);
  const deals = [
    { key: 'concert', icons: 'run+music', label: 'วิ่ง + คอนเสิร์ต GA/VIP', big: `-${percentOf(CONCERT_BUNDLE_RATE)}%`, note: `GA เหลือ ${formatBaht(concertNet)} บาท/ใบ`, how: 'ซื้อตั๋ววิ่ง + ตั๋วคอนเสิร์ต GA หรือ VIP', tone: 'gold' as const, on: hasRun && hasGaConcert },
    { key: 'two', icons: 'acts', label: 'ครบ 3 กิจกรรม', big: `-${percentOf(ADDON_TWO_RATE)}%`, note: 'ค่ากิจกรรมเสริม', how: 'เลือกกิจกรรมเสริมให้ครบ 3 อย่าง', tone: 'violet' as const, on: activities >= 3 },
    { key: 'three', icons: 'run+acts', label: 'วิ่ง + ครบ 3 กิจกรรม', big: `-${percentOf(ADDON_THREE_RATE)}%`, note: 'แทนส่วนลด 10%', how: 'ตั๋ววิ่ง + ครบ 3 กิจกรรม', tone: 'gold' as const, on: hasRun && activities >= 3 },
    { key: 'concert-addon', icons: 'music+acts', label: 'คอนเสิร์ต + ครบ 3', big: `+${percentOf(ADDON_CONCERT_RATE)}%`, note: 'ลดเพิ่มค่ากิจกรรม', how: 'มีตั๋วคอนเสิร์ต + ครบ 3 กิจกรรม', tone: 'violet' as const, on: hasConcert && activities >= 3 },
  ];
  const unlocked = deals.filter((d) => d.on).length;

  const renderIcons = (kind: string, tone: 'gold' | 'violet') => {
    const run = <Chip tone={tone}><Footprints className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} /></Chip>;
    const music = <Chip tone={tone}><Music className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} /></Chip>;
    const plus = <span aria-hidden="true" className="text-base font-black text-[#4B1FA8]">+</span>;
    if (kind === 'run+music') return <>{run}{plus}{music}</>;
    if (kind === 'acts') return <ThreeActs />;
    if (kind === 'run+acts') return <>{run}{plus}<ThreeActs /></>;
    return <>{music}{plus}<ThreeActs /></>;
  };

  return (
    <div className="relative rounded-[24px] border border-[#E4D6F7] bg-gradient-to-b from-[#FFFDF6] via-[#FBF7FF] to-[#F3ECFF] p-3 sm:p-4 shadow-[0_14px_30px_-20px_rgba(42,20,80,0.35)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-3">
        <h3 className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#6D3FD0] to-[#3B1780] pl-2 pr-4 py-1 text-lg sm:text-2xl font-black leading-tight text-white shadow-[0_6px_14px_-8px_rgba(42,20,80,0.7)]">
          <span aria-hidden="true" className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#FFE27A] to-[#FFC928] text-[#2A1450]">
            <Ticket className="h-5 w-5" strokeWidth={2.4} />
          </span>
          ยิ่งซื้อคู่ <span className="text-[#FFD35C]">ยิ่งลด!</span>
        </h3>
        <p className="rounded-full bg-[#EFE5FF] px-3.5 py-1.5 text-[12.5px] sm:text-sm font-extrabold text-[#2A1450]">
          ส่วนลดกิจกรรมรวมสูงสุด <span className="text-lg sm:text-xl font-black text-[#4B1FA8]">{percentOf(ADDON_MAX_RATE)}%</span>
        </p>
        <div
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#D9C9EF] bg-white px-3 py-1.5"
          aria-label={`ปลดล็อกแล้ว ${unlocked} จาก ${deals.length} ดีล`}
        >
          <span className="text-[11.5px] sm:text-xs font-extrabold text-[#4B2D78]">ความคืบหน้า</span>
          <span className="rounded-full bg-[#4B1FA8] px-2.5 py-0.5 text-xs font-black text-white tabular-nums">{unlocked}/{deals.length}</span>
          <span className="hidden sm:flex items-center gap-1.5" aria-hidden="true">
            {deals.map((d) => (
              <span key={d.key} className={`h-3.5 w-3.5 rounded-full border-2 transition-colors duration-300 ${d.on ? 'border-[#B8860B] bg-[#FFC928]' : 'border-[#D9C9EF] bg-[#F3ECFF]'}`} />
            ))}
          </span>
        </div>
      </div>

      <ul data-reveal-stagger="pop" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3" aria-label="โปรโมชั่นส่วนลด">
        {deals.map((d) => (
          <motion.li
            key={d.key}
            animate={d.on ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 pb-2.5 pt-3 text-center leading-tight ${
              d.tone === 'gold' ? 'bg-gradient-to-b from-[#FFF3C4] to-[#FFFBEA]' : 'bg-gradient-to-b from-[#EFE5FF] to-[#FAF6FF]'
            } ${d.on ? 'border-[#2A1450] shadow-[0_4px_0_#2A1450]' : d.tone === 'gold' ? 'border-[#F2D27A] border-dashed' : 'border-[#D9C9EF] border-dashed'}`}
          >
            {/* ticket notches */}
            <span aria-hidden="true" className="absolute -left-[9px] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-inherit bg-[#F9F5FF] [clip-path:inset(0_0_0_50%)]" />
            <span aria-hidden="true" className="absolute -right-[9px] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-inherit bg-[#F9F5FF] [clip-path:inset(0_50%_0_0)]" />
            <span className="flex flex-nowrap items-center justify-center gap-0.5 sm:gap-1">{renderIcons(d.icons, d.tone)}</span>
            <span className="text-[13px] sm:text-[15px] font-black text-[#2A1450]">{d.label}</span>
            <span className="rounded-full bg-gradient-to-b from-[#5B2BC0] to-[#3B1780] px-5 py-0.5 text-2xl sm:text-[28px] font-black tracking-tight text-[#FFD35C] shadow-[0_5px_10px_-6px_rgba(42,20,80,0.8)]">
              {d.big}
            </span>
            <span className="text-[11.5px] sm:text-xs font-extrabold text-[#5B4878]">{d.on ? '✓ ได้ส่วนลดนี้แล้ว!' : `(${d.note})`}</span>
            <span className="sr-only">{d.on ? 'ได้ส่วนลดนี้แล้ว' : `เงื่อนไข: ${d.how}`}</span>
            <AnimatePresence>
              {d.on && (
                <motion.span
                  aria-hidden="true"
                  initial={{ scale: 2.4, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: -12 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                  className="absolute -right-1.5 -top-2 rounded-md border-2 border-[#B91C1C] bg-white px-1.5 py-px text-xs font-black text-[#B91C1C]"
                >
                  ได้แล้ว!
                </motion.span>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, '0');

/**
 * The "tickets go on sale" banner with a live countdown (days / hours / minutes). `opensAt` is an ISO time;
 * without it the banner just says that sales are paused.
 */
export const SalesOpenNotice: React.FC<{ opensAt: string | null; dateText: string; en?: boolean }> = ({ opensAt, dateText, en = false }) => {
  const target = opensAt ? new Date(opensAt).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (Number.isNaN(target)) return;
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, [target]);

  if (Number.isNaN(target)) {
    return (
      <div role="status" className="mx-auto mt-5 max-w-2xl rounded-2xl border border-[#D9C9EF] bg-[#F3ECFF] px-4 py-3 text-center">
        <p className="text-base sm:text-lg font-black text-[#3B1780]">{en ? 'Ticket sales are paused for now' : 'ขณะนี้ปิดการขายบัตรชั่วคราว'}</p>
        <p className="text-xs sm:text-sm font-bold text-[#4B2D78]">{en ? 'Ticket details stay visible · follow the organiser for the reopening' : 'ดูรายละเอียดบัตรได้ตามปกติ · ติดตามประกาศเปิดขายจากผู้จัดงาน'}</p>
      </div>
    );
  }

  const left = Math.max(0, target - now);
  const days = Math.floor(left / 86400000);
  const hours = Math.floor((left % 86400000) / 3600000);
  const mins = Math.floor((left % 3600000) / 60000);
  const [datePart, timePart] = dateText.split(en ? ', ' : ' เวลา ');
  const units: [number, string][] = [
    [days, en ? 'days' : 'วัน'],
    [hours, en ? 'hrs' : 'ชม.'],
    [mins, en ? 'min' : 'นาที'],
  ];

  return (
    <div
      role="status"
      className="relative mx-auto mt-5 overflow-hidden rounded-[24px] border-2 border-[#E0A100] bg-gradient-to-br from-[#5B2BC0] via-[#4B1FA8] to-[#2A1450] p-4 sm:p-5 text-white shadow-[0_16px_34px_-18px_rgba(42,20,80,0.7)]"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FFC928]/15 blur-2xl" />
      <div className="relative grid items-center gap-4 sm:gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex items-center gap-3 sm:gap-4 md:border-r md:border-white/20 md:pr-6">
          <span aria-hidden="true" className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#FFE27A] to-[#FFC928] text-[#2A1450] shadow-md">
            <CalendarDays className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 text-left leading-tight">
            <p className="text-lg sm:text-2xl font-black">{en ? 'Tickets on sale' : 'เปิดขายบัตร'}</p>
            <p className="text-2xl sm:text-4xl font-black text-[#FFD35C]">{datePart}</p>
            {timePart && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border-2 border-[#FFC928] px-3 py-0.5 text-sm sm:text-base font-extrabold text-[#FFD35C]">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {en ? timePart : `เวลา ${timePart}`}
              </p>
            )}
          </div>
        </div>
        <div className="text-center">
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-extrabold text-white/90">
            <Hourglass className="h-4 w-4 text-[#FFD35C]" aria-hidden="true" />
            {left > 0 ? (en ? 'Time left' : 'เหลือเวลาอีก') : en ? 'Opening now' : 'ถึงเวลาเปิดขายแล้ว'}
          </p>
          <div className="flex items-start justify-center gap-1.5 sm:gap-2" aria-label={`${days} ${units[0][1]} ${hours} ${units[1][1]} ${mins} ${units[2][1]}`}>
            {units.map(([v, label], i) => (
              <React.Fragment key={label}>
                {i > 0 && <span aria-hidden="true" className="pt-2 text-2xl font-black text-white/80">:</span>}
                <div className="w-[68px] sm:w-[84px] overflow-hidden rounded-xl bg-white text-[#2A1450] shadow-md">
                  <div className="py-1.5 text-3xl sm:text-4xl font-black tabular-nums leading-none">{pad2(v)}</div>
                  <div className="bg-gradient-to-b from-[#FFE27A] to-[#FFC928] py-0.5 text-[12px] font-black">{label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <p className="relative mt-4 rounded-full bg-white px-4 py-2 text-center text-[12.5px] sm:text-sm font-extrabold text-[#3B1780]">
        <Info className="mr-1.5 inline h-4 w-4 align-[-3px] text-[#6D28D9]" aria-hidden="true" />
        {en ? 'Browse tickets and prices now · buying unlocks when sales open' : 'ดูรายละเอียดบัตรและราคาได้ก่อน · ปุ่มซื้อจะใช้งานได้เมื่อถึงเวลาเปิดขาย'}
      </p>
    </div>
  );
};
