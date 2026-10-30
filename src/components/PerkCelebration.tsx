import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ADDON_THREE_RATE, ADDON_TWO_RATE, CONCERT_BUNDLE_RATE, formatBaht, percentOf } from '../data/addOns';
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

/** Confetti shower + a bouncing price-tag sign. Plays every time a deal unlocks (or improves). */
export const DiscountCelebration: React.FC<CelebrationProps> = ({ active, burstKey, kicker, headline, discount, pieces = 70 }) => {
  const [burst, setBurst] = useState(0);
  const prev = useRef('');
  const reduced = useMemo(prefersReducedMotion, []);

  useEffect(() => {
    const key = active ? burstKey : '';
    if (key && key !== prev.current) setBurst((b) => b + 1);
    prev.current = key;
  }, [active, burstKey]);

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
        {active && (
          <motion.div
            key={`sign-${burstKey}`}
            role="status"
            aria-live="polite"
            initial={{ scale: 0, rotate: -30, y: 30, opacity: 0 }}
            animate={{ scale: 1, rotate: -4, y: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 14, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 10 }}
            className="absolute -top-7 right-1 sm:right-6 z-40 origin-bottom-left max-w-[88%]"
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
  hasConcert: boolean;
  activities: number;
}

/** One slim row that shows the three bundle deals and lights each one up when the basket qualifies. */
export const DealStrip: React.FC<DealStripProps> = ({ hasRun, hasConcert, activities }) => {
  const concertNet = CONCERT_PASS_PRICE - Math.round(CONCERT_PASS_PRICE * CONCERT_BUNDLE_RATE);
  const deals = [
    { key: 'concert', label: 'วิ่ง + คอนเสิร์ต', big: `ลด ${percentOf(CONCERT_BUNDLE_RATE)}%`, note: `เหลือ ${formatBaht(concertNet)} บาท/ใบ`, on: hasRun && hasConcert },
    { key: 'two', label: 'วิ่ง + 2 กิจกรรม', big: `ลด ${percentOf(ADDON_TWO_RATE)}%`, note: 'ค่ากิจกรรมเสริม', on: hasRun && activities >= 2 },
    { key: 'three', label: 'วิ่ง + ครบ 3 กิจกรรม', big: `ลด ${percentOf(ADDON_THREE_RATE)}%`, note: 'สุดคุ้ม!', on: hasRun && activities >= 3 },
  ];
  return (
    <div className="rounded-2xl border-2 border-[#7C3AED]/20 bg-white/80 p-2.5 sm:p-3">
      <p className="px-1 pb-2 text-xs sm:text-sm font-extrabold text-[#2A1450]">
        🎁 ซื้อคู่ตั๋ววิ่ง รับส่วนลดทันที
        {!hasRun && <span className="ml-1.5 font-bold text-[#6B5A85]">· เลือกตั๋ววิ่งก่อนเพื่อปลดล็อก</span>}
      </p>
      <ul className="grid grid-cols-3 gap-2" aria-label="โปรโมชั่นส่วนลด">
        {deals.map((d) => (
          <motion.li
            key={d.key}
            animate={d.on ? { scale: [1, 1.07, 1] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
            className={`rounded-xl border-2 px-1.5 py-2 text-center leading-tight ${
              d.on ? 'bg-[#FFC928] border-[#2A1450] shadow-[0_3px_0_#2A1450]' : 'bg-[#F7F2FF] border-[#7C3AED]/20'
            }`}
          >
            <span className="block text-[10.5px] sm:text-xs font-bold text-[#2A1450]">{d.label}</span>
            <span className={`block text-lg sm:text-xl font-black ${d.on ? 'text-[#2A1450]' : 'text-[#7C3AED]'}`}>{d.big}</span>
            <span className={`block text-[10px] sm:text-[11px] font-bold ${d.on ? 'text-[#2A1450]' : 'text-[#6B5A85]'}`}>{d.on ? '✓ ได้แล้ว!' : d.note}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};
