import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatBaht } from '../data/addOns';

const COLORS = ['#FFC928', '#EC4899', '#9333EA', '#0EA5E9', '#10B981', '#FB923C', '#FFFFFF'];
const EMOJIS = ['🎉', '🐾', '⭐', '🐶', '✨', '🎊'];

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
    const dist = 90 + Math.random() * 230;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.8 - 40,
      r: Math.random() * 720 - 360,
      s: 0.7 + Math.random() * 0.9,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.12,
      shape: i % 7 === 0 ? 'emoji' : i % 3 === 0 ? 'dot' : 'rect',
      emoji: EMOJIS[i % EMOJIS.length],
    };
  });

/** Confetti + a bouncing "10% off" sign. Plays every time `active` flips on. */
export const DiscountCelebration: React.FC<{ active: boolean; discount: number }> = ({ active, discount }) => {
  const [burst, setBurst] = useState(0);
  const prev = useRef(false);
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    if (active && !prev.current) setBurst((b) => b + 1);
    prev.current = active;
  }, [active]);

  const pieces = useMemo(() => (burst ? makePieces(reduced ? 0 : 46) : []), [burst, reduced]);

  return (
    <>
      {/* confetti from the centre of the block */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24 z-30 w-0 h-0">
        {pieces.map((p) => (
          <motion.span
            key={`${burst}-${p.id}`}
            className="absolute block"
            style={{
              width: p.shape === 'emoji' ? 'auto' : p.shape === 'dot' ? 9 : 8,
              height: p.shape === 'emoji' ? 'auto' : p.shape === 'dot' ? 9 : 14,
              borderRadius: p.shape === 'dot' ? 9 : 2,
              background: p.shape === 'emoji' ? 'transparent' : p.color,
              fontSize: p.shape === 'emoji' ? 20 : undefined,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.2, rotate: 0 }}
            animate={{ x: p.x, y: [0, p.y, p.y + 180], opacity: [1, 1, 0], scale: p.s, rotate: p.r }}
            transition={{ duration: 1.7, delay: p.delay, ease: 'easeOut' }}
          >
            {p.shape === 'emoji' ? p.emoji : null}
          </motion.span>
        ))}
      </div>

      {/* the sign that pops out */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="discount-sign"
            role="status"
            aria-live="polite"
            initial={{ scale: 0, rotate: -24, y: 30, opacity: 0 }}
            animate={{ scale: 1, rotate: -4, y: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 11 }}
            className="absolute -top-6 right-2 sm:right-6 z-40 origin-bottom-left"
          >
            <motion.div
              animate={{ rotate: [-4, 3, -4], y: [0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative overflow-hidden rounded-[22px] border-[3px] border-[#2A1450] px-4 py-2.5 text-center shadow-[0_8px_0_#2A1450,0_20px_40px_-8px_rgba(147,51,234,0.7)]"
              style={{ background: 'linear-gradient(135deg, #FFE268 0%, #FFC928 45%, #FF7A59 100%)' }}
            >
              <span aria-hidden="true" className="perk-shine absolute inset-y-0 -left-1/3 w-1/3 bg-white/60 skew-x-[-20deg]" />
              <span className="relative block text-[11px] font-extrabold tracking-wide text-[#2A1450]">ครบ 3 กิจกรรม 🎉</span>
              <span className="relative block text-2xl sm:text-3xl font-black leading-none text-[#2A1450] drop-shadow-[0_2px_0_rgba(255,255,255,0.7)]">
                ลดทันที 10%!!!
              </span>
              {discount > 0 && (
                <span className="relative block mt-1 text-xs font-extrabold text-[#7C2D12]">ประหยัดเพิ่ม {formatBaht(discount)} บาท</span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
