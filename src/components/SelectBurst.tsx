import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/**
 * A short celebration when something gets picked: a gold ring, a spray of stars / paws / dots and a
 * light sweep. Mount it inside a `relative` card; it only plays on the moment `active` turns true.
 * (Skipped when the visitor prefers reduced motion.)
 */
const SHAPES = ['★', '✦', '🐾', '●', '★', '✦'];
const COLORS = ['#FFC928', '#FFE268', '#FFFFFF', '#C4B5FD', '#FF8A3D', '#FFC928'];

export const SelectBurst: React.FC<{ active: boolean; count?: number; className?: string; spread?: number }> = ({
  active,
  count = 22,
  className = 'left-1/2 bottom-10',
  spread = 1,
}) => {
  const reduce = useReducedMotion();
  const [shot, setShot] = useState(0);
  const was = useRef(active);

  useEffect(() => {
    if (active && !was.current && !reduce) {
      setShot((n) => n + 1);
      const id = window.setTimeout(() => setShot(0), 1400);
      was.current = active;
      return () => window.clearTimeout(id);
    }
    was.current = active;
  }, [active, reduce]);

  return (
    <AnimatePresence>
      {shot > 0 && (
        <motion.div key={shot} aria-hidden="true" className="pointer-events-none absolute inset-0 z-40" exit={{ opacity: 0 }}>
          {/* ring */}
          <motion.span
            className="absolute inset-0 rounded-[inherit] border-4 border-[#FFC928]"
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.12 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
          {/* light sweep */}
          <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
            <motion.span
              className="absolute -inset-y-6 w-24 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
              initial={{ left: '-30%' }}
              animate={{ left: '130%' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </span>
          {/* confetti */}
          <span className={`absolute ${className}`}>
            {Array.from({ length: count }).map((_, i) => {
              const a = (i / count) * Math.PI * 2 + (i % 3) * 0.21;
              const d = (70 + ((i * 37) % 70)) * spread;
              const x = Math.cos(a) * d;
              const y = Math.sin(a) * d * 0.9 - 40 * spread;
              return (
                <motion.span
                  key={i}
                  className="absolute left-0 top-0 -ml-2 -mt-2 text-base font-black leading-none"
                  style={{ color: COLORS[i % COLORS.length], textShadow: '0 1px 2px rgba(42,20,80,0.35)' }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                  animate={{ x, y: [0, y, y + 46 * spread], scale: [0, 1.3, 0.7], opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * (120 + i * 17) }}
                  transition={{ duration: 1.05 + (i % 4) * 0.08, ease: 'easeOut' }}
                >
                  {SHAPES[i % SHAPES.length]}
                </motion.span>
              );
            })}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
