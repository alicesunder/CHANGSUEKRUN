import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Hourglass, Info, Lock } from 'lucide-react';
import { BASKET_MAX_ITEMS, BASKET_MAX_RATE, BASKET_TIERS, formatBaht, percentOf } from '../data/addOns';
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
  /** which kinds of items are in the basket (each counts as 1 item) */
  chosen: { run: boolean; concert: boolean; tower: boolean; gun: boolean; wind: boolean };
}

const ICON_CLS = 'h-5 w-5 sm:h-[30px] sm:w-[30px] object-contain mix-blend-multiply';

const ITEM_ICONS: { key: keyof DealStripProps['chosen']; src: string; label: string }[] = [
  { key: 'run', src: '/images/shop/deals-ic-run.png', label: 'ตั๋ววิ่ง' },
  { key: 'concert', src: '/images/shop/deals-ic-music.png', label: 'คอนเสิร์ต / VIP' },
  { key: 'tower', src: '/images/shop/deals-ic-tower.png', label: 'หอสูง' },
  { key: 'gun', src: '/images/shop/deals-ic-target.png', label: 'ยิงปืน' },
  { key: 'wind', src: '/images/shop/deals-ic-fan.png', label: 'อุโมงค์ลม' },
];

/**
 * "The more you buy, the more you save": every kind of item counts as one (run, concert / VIP, tower, shooting,
 * wind tunnel). 2 items -10%, 3 items -15%, 4-5 items -20%, taken off the whole basket. The step the basket has
 * reached lights up with a "ได้แล้ว!" stamp.
 */
export const DealStrip: React.FC<DealStripProps> = ({ chosen }) => {
  const items = ITEM_ICONS.filter((i) => chosen[i.key]).length;
  const steps = [
    { key: 's1', n: 1, label: 'ซื้อ 1 อย่าง', big: 'ราคาปกติ', small: true, min: 0, max: 1, tone: 'gold' as const },
    ...BASKET_TIERS.map((t, i) => ({
      key: `s${t.items}`,
      n: i + 2,
      label: i === BASKET_TIERS.length - 1 ? `ซื้อ ${t.items}–${BASKET_MAX_ITEMS} อย่าง` : `ซื้อ ${t.items} อย่าง`,
      big: `-${percentOf(t.rate)}%${i === BASKET_TIERS.length - 1 ? ' สูงสุด' : ''}`,
      small: false,
      min: t.items,
      max: i === BASKET_TIERS.length - 1 ? BASKET_MAX_ITEMS : t.items,
      tone: 'violet' as const,
    })),
  ];
  const current = steps.findIndex((st) => items >= st.min && items <= st.max);

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[#E4D6F7] bg-gradient-to-b from-[#FFFDF6] via-[#FBF7FF] to-[#F3ECFF] p-3.5 sm:px-[18px] sm:py-5 shadow-[0_8px_20px_rgba(65,30,120,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 pb-3 sm:pb-4">
        <img src="/images/shop/deals-percent.png" alt="" aria-hidden="true" className="-mr-1 h-14 w-auto sm:h-[72px] -rotate-6 mix-blend-multiply" />
        <h3 className="relative inline-flex items-center rounded-full bg-gradient-to-b from-[#6D3FD0] to-[#3B1780] py-1.5 sm:py-2 pl-5 sm:pl-7 pr-5 sm:pr-7 text-xl sm:text-[25px] font-black leading-tight text-white shadow-[0_8px_16px_-8px_rgba(42,20,80,0.75),inset_0_1px_0_rgba(255,255,255,0.25)]">
          ยิ่งซื้อเพิ่ม&nbsp;<span className="text-[#FFD35C]">ยิ่งลด!</span>
        </h3>
        <p className="rounded-full bg-[#EFE5FF] px-4 py-2 text-[13px] sm:text-base font-extrabold text-[#2A1450]">
          ลดสูงสุด <span className="text-xl sm:text-3xl align-middle font-black text-[#4B1FA8]">{percentOf(BASKET_MAX_RATE)}%</span>
        </p>
        <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#D9C9EF] bg-white px-3 py-1.5" aria-label={`เลือกแล้ว ${items} จาก ${BASKET_MAX_ITEMS} อย่าง`}>
          <span className="text-[11.5px] sm:text-xs font-extrabold text-[#4B2D78]">เลือกแล้ว</span>
          <span className="rounded-full bg-[#4B1FA8] px-2.5 py-0.5 text-xs font-black text-white tabular-nums">{items}/{BASKET_MAX_ITEMS}</span>
          <span className="hidden sm:flex items-center gap-1" aria-hidden="true">
            {ITEM_ICONS.map((it, i) => (
              <span key={it.key} className={`h-2 w-6 rounded-full transition-colors duration-300 ${i < items ? 'bg-gradient-to-b from-[#FFE27A] to-[#FFC928]' : 'bg-[#E4D6F7]'}`} />
            ))}
          </span>
        </div>
      </div>

      {/* the 5 kinds of items, each counts as 1 */}
      <div className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-2 rounded-2xl bg-white/70 border border-[#E4D6F7] px-3 py-2.5 mb-3 sm:mb-4">
        <span className="basis-full sm:basis-auto text-center text-sm sm:text-base font-black text-[#2A1450]">เลือกสินค้าได้ {BASKET_MAX_ITEMS} อย่าง</span>
        {ITEM_ICONS.map((it, i) => (
          <React.Fragment key={it.key}>
            {i > 0 && <span aria-hidden="true" className="text-base font-black text-[#4B1FA8]">+</span>}
            <span className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-2 py-1 transition-colors ${chosen[it.key] ? 'border-[#2A1450] bg-[#FFE27A]' : 'border-[#E0A100]/60 bg-white'}`}>
              <img src={it.src} alt="" aria-hidden="true" className={ICON_CLS} loading="lazy" />
              <span className="text-[11.5px] sm:text-[13px] font-extrabold text-[#2A1450] leading-none">{it.label}</span>
              {chosen[it.key] && <span aria-hidden="true" className="text-[#15803D] font-black text-sm leading-none">✓</span>}
            </span>
          </React.Fragment>
        ))}
        <span className="rounded-2xl bg-gradient-to-b from-[#FFE27A] to-[#FFC928] px-3 py-1 text-center text-[11.5px] sm:text-[13px] font-black leading-tight text-[#2A1450] sm:ml-2">
          เลือกกี่อย่างก็ได้<br />นับอย่างละ 1
        </span>
      </div>

      <ul data-reveal-stagger="pop" className="relative grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5" aria-label="ส่วนลดตามจำนวนอย่าง">
        {steps.map((st, i) => {
          const on = items >= 1 && i === current;
          const reached = items >= 1 && i <= current;
          return (
            <motion.li
              key={st.key}
              animate={on ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`relative flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 rounded-2xl border-2 px-2 pb-3 pt-3.5 text-center leading-tight shadow-[0_8px_18px_-10px_rgba(65,30,120,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] ${
                st.tone === 'gold' ? 'bg-gradient-to-b from-[#FFF3C4] to-[#FFFBEA]' : 'bg-gradient-to-b from-[#EFE5FF] to-[#FAF6FF]'
              } ${on ? 'border-[#2A1450] shadow-[0_4px_0_#2A1450]' : reached ? 'border-[#E0A100]' : st.tone === 'gold' ? 'border-[#F2D27A] border-dashed' : 'border-[#D9C9EF] border-dashed'}`}
            >
              <span aria-hidden="true" className="absolute -left-[11px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-inherit bg-[#F9F5FF] [clip-path:inset(0_0_0_50%)]" />
              <span aria-hidden="true" className="absolute -right-[11px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-inherit bg-[#F9F5FF] [clip-path:inset(0_50%_0_0)]" />
              {!reached && i > 0 && <Lock aria-hidden="true" className="hidden sm:block absolute right-2.5 top-2.5 h-4 w-4 text-[#9C8BBD]" />}
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#3B1780] text-xs font-black text-white">{st.n}</span>
                <span className="text-[13px] sm:text-base font-black text-[#2A1450]">{st.label}</span>
              </span>
              <span className={`rounded-full bg-gradient-to-b from-[#5B2BC0] to-[#3B1780] px-5 py-0.5 sm:py-1 font-black tracking-tight text-[#FFD35C] shadow-[0_6px_10px_-5px_rgba(42,20,80,0.85),inset_0_1px_0_rgba(255,255,255,0.3)] whitespace-nowrap ${st.small ? 'text-lg sm:text-2xl' : st.big.length > 5 ? 'px-3 text-base sm:px-5 sm:text-[30px]' : 'text-2xl sm:text-[34px]'}`}>
                {st.big}
              </span>
              <span className="sr-only">{on ? 'ได้ส่วนลดนี้แล้ว' : `เงื่อนไข: ${st.label}`}</span>
              <AnimatePresence>
                {on && (
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
          );
        })}
      </ul>
      <p className="relative mt-3 mx-auto w-fit rounded-full bg-[#EFE5FF] px-4 py-1.5 text-center text-[12px] sm:text-sm font-extrabold text-[#4B2D78]">ส่วนลดคำนวณจากยอดรวมทั้งตะกร้า</p>
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
      className="relative mx-auto mt-5 overflow-hidden rounded-[24px] border-2 border-[#E0A100] bg-gradient-to-br from-[#5B2BC0] via-[#4B1FA8] to-[#2A1450] p-4 sm:p-6 md:min-h-[220px] text-white shadow-[0_16px_34px_-18px_rgba(42,20,80,0.7)]"
    >
      <img src="/images/shop/deals-bg.png" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-left min-[1100px]:block" />
      <div className="relative grid items-center gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex items-center gap-3 sm:gap-4 lg:border-r lg:border-white/20 lg:pr-6 min-[1100px]:pl-[330px] min-[1100px]:whitespace-nowrap">
          <span aria-hidden="true" className="hidden sm:flex min-[1100px]:!hidden h-[150px] w-[170px] shrink-0 items-center justify-center rounded-3xl bg-gradient-to-b from-[#FFFDF6] to-[#EFE5FF] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]">
            <img src="/images/shop/deals-tickets.png" alt="" className="h-[130px] w-auto mix-blend-multiply" />
          </span>
          <span aria-hidden="true" className="sm:hidden flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#FFFDF6] to-[#EFE5FF]">
            <img src="/images/shop/deals-tickets.png" alt="" className="h-12 w-auto mix-blend-multiply" />
          </span>
          <div className="min-w-0 text-left leading-tight">
            <p className="text-xl sm:text-4xl font-black">{en ? 'Tickets on sale' : 'เปิดขายบัตร'}</p>
            <p className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#FFD35C]">{datePart}</p>
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
          <div className="flex items-start justify-center gap-1.5 sm:gap-3" aria-label={`${days} ${units[0][1]} ${hours} ${units[1][1]} ${mins} ${units[2][1]}`}>
            {units.map(([v, label], i) => (
              <React.Fragment key={label}>
                {i > 0 && <span aria-hidden="true" className="pt-2 text-2xl font-black text-white/80">:</span>}
                <div className="w-[68px] sm:w-[92px] overflow-hidden rounded-xl bg-[#FFFBF0] text-[#2A1450] shadow-[0_8px_14px_-6px_rgba(0,0,0,0.55)]">
                  <div className="py-1.5 sm:py-3 text-3xl sm:text-5xl font-black tabular-nums leading-none">{pad2(v)}</div>
                  <div className="bg-gradient-to-b from-[#FFE27A] to-[#FFC928] py-0.5 sm:py-1 text-[12px] sm:text-sm font-black">{label}</div>
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
