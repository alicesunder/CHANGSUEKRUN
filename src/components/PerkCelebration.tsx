import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ADDON_CONCERT_RATE, ADDON_MAX_RATE, ADDON_THREE_RATE, ADDON_TWO_RATE, CONCERT_BUNDLE_RATE, formatBaht, percentOf } from '../data/addOns';
import { CONCERT_PASS_PRICE } from '../data/eventData';

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

/**
 * The bundle deals as four tear-off coupons. A coupon lights up (and gets a "ได้แล้ว" stamp) as soon
 * as the basket qualifies, and the progress line shows how many deals the basket has unlocked.
 */
export const DealStrip: React.FC<DealStripProps> = ({ hasRun, hasGaConcert, hasConcert, activities }) => {
  const concertNet = CONCERT_PASS_PRICE - Math.round(CONCERT_PASS_PRICE * CONCERT_BUNDLE_RATE);
  const deals = [
    { key: 'concert', icon: '🏃🎶', label: 'วิ่ง + คอนเสิร์ต GA', big: `-${percentOf(CONCERT_BUNDLE_RATE)}%`, note: `เหลือ ${formatBaht(concertNet)} บาท/ใบ`, how: 'ซื้อตั๋ววิ่ง + ตั๋วคอนเสิร์ต GA', color: '#EC4899', on: hasRun && hasGaConcert },
    { key: 'two', icon: '✌️', label: '2 กิจกรรมขึ้นไป', big: `-${percentOf(ADDON_TWO_RATE)}%`, note: 'ค่ากิจกรรมเสริม', how: 'เลือกกิจกรรมเสริม 2 อย่าง', color: '#0EA5E9', on: activities >= 2 },
    { key: 'three', icon: '🏆', label: 'วิ่ง + ครบ 3 กิจกรรม', big: `-${percentOf(ADDON_THREE_RATE)}%`, note: 'แทนส่วนลด 10%', how: 'ตั๋ววิ่ง + ครบ 3 กิจกรรม', color: '#10B981', on: hasRun && activities >= 3 },
    { key: 'concert-addon', icon: '🎤✨', label: 'คอนเสิร์ต + กิจกรรม', big: `+${percentOf(ADDON_CONCERT_RATE)}%`, note: 'ลดเพิ่มค่ากิจกรรม', how: 'มีตั๋วคอนเสิร์ต + กิจกรรม', color: '#F59E0B', on: hasConcert && activities >= 1 },
  ];
  const unlocked = deals.filter((d) => d.on).length;

  return (
    <div className="relative rounded-[22px] border-[2.5px] border-[#2A1450] bg-gradient-to-br from-[#FFF7DA] via-[#FFF0F7] to-[#EFE6FF] p-3 sm:p-4 shadow-[0_5px_0_#2A1450] overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute -right-3 -top-4 text-6xl opacity-20 rotate-12 select-none">🎁</span>
      <div className="relative flex flex-wrap items-center justify-between gap-2 pb-3">
        <p className="text-sm sm:text-base font-black text-[#2A1450] leading-tight">
          🎁 ยิ่งซื้อคู่ ยิ่งลด!
          <span className="block sm:inline sm:ml-2 text-xs font-bold text-[#6B5A85]">ส่วนลดกิจกรรมรวมสูงสุด {percentOf(ADDON_MAX_RATE)}%</span>
        </p>
        <div className="flex items-center gap-2" aria-label={`ปลดล็อกแล้ว ${unlocked} จาก ${deals.length} ดีล`}>
          <span className="flex gap-1" aria-hidden="true">
            {deals.map((d) => (
              <span key={d.key} className="w-5 h-2.5 rounded-full border border-[#2A1450]/30 transition-colors duration-300" style={{ background: d.on ? d.color : '#FFFFFF' }} />
            ))}
          </span>
          <span className="text-xs font-black text-[#2A1450] tabular-nums">{unlocked}/{deals.length}</span>
        </div>
      </div>
      <ul data-reveal-stagger="pop" className="relative grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3" aria-label="โปรโมชั่นส่วนลด">
        {deals.map((d) => (
          <motion.li
            key={d.key}
            animate={d.on ? { scale: [1, 1.08, 1], rotate: [0, -2, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.5 }}
            className={`deal-coupon relative flex flex-col rounded-2xl border-2 text-center leading-tight overflow-hidden ${d.on ? 'is-on border-[#2A1450] shadow-[0_4px_0_#2A1450]' : 'border-[#2A1450]/15 bg-white'}`}
            style={{ ['--deal' as string]: d.color }}
          >
            <span className="block px-2 pt-2.5 text-[11px] sm:text-xs font-extrabold text-[#2A1450]">
              <span aria-hidden="true" className="mr-1">{d.icon}</span>
              {d.label}
            </span>
            <span className="block px-2 pb-2 text-2xl sm:text-[28px] font-black tracking-tight" style={{ color: d.on ? '#2A1450' : d.color }}>
              {d.big}
            </span>
            <span className="deal-perf mt-auto block border-t-2 border-dashed px-2 py-1.5 text-[10.5px] sm:text-[11px] font-bold">
              {d.on ? '✓ ได้ส่วนลดนี้แล้ว!' : d.note}
            </span>
            <span className="sr-only">{d.on ? 'ได้ส่วนลดนี้แล้ว' : `เงื่อนไข: ${d.how}`}</span>
            <AnimatePresence>
              {d.on && (
                <motion.span
                  aria-hidden="true"
                  initial={{ scale: 2.4, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: -14 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                  className="absolute -right-1 top-1 rounded-md border-2 border-[#B91C1C] bg-white/90 px-1.5 py-0.5 text-[10px] font-black text-[#B91C1C]"
                >
                  ได้แล้ว!
                </motion.span>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>
      {unlocked === 0 && (
        <p className="relative mt-2.5 text-center text-[11px] sm:text-xs font-bold text-[#6B5A85]">
          เคล็ดลับ: เพิ่มตั๋วคอนเสิร์ตหรือกิจกรรมเสริมคู่กับตั๋ววิ่ง ส่วนลดจะเด้งขึ้นเองอัตโนมัติ ✨
        </p>
      )}
    </div>
  );
};
