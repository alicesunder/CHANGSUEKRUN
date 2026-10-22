import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const LABRADOR_SVG_PATH = '/assets/aistudio/labrador-animation_6748150f.svg';

interface LabradorMascotProps {
  size?: number;
  className?: string;
  speechText?: string;
  badgeText?: string;
  interactive?: boolean;
  flipHorizontal?: boolean;
  glowColor?: string;
}

export const LabradorMascot: React.FC<LabradorMascotProps> = ({
  size = 96,
  className = '',
  speechText,
  badgeText,
  interactive = true,
  flipHorizontal = false,
  glowColor = 'rgba(255, 201, 40, 0.45)',
}) => {
  const [petCount, setPetCount] = useState(0);

  const handlePet = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    setPetCount((c) => c + 1);
  };

  return (
    <div
      onClick={handlePet}
      className={`relative inline-flex flex-col items-center select-none ${
        interactive ? 'cursor-pointer group' : 'pointer-events-none'
      } ${className}`}
      title={interactive ? 'คลิกเพื่อทักทายน้องลาบราดอร์!' : undefined}
    >
      {/* Floating Speech Bubble */}
      {speechText && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.92 }}
          animate={{ opacity: 1, y: [0, -3, 0], scale: 1 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-1 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-[#E9D5FF] text-[#3B1870] text-[11px] font-extrabold shadow-[0_8px_20px_-6px_rgba(91,32,168,0.28)] whitespace-nowrap z-20 flex items-center gap-1"
        >
          <span>🐾</span>
          <span>{speechText}</span>
        </motion.div>
      )}

      {/* Interactive Heart Burst when clicked/petted */}
      <AnimatePresence>
        {petCount > 0 && (
          <motion.div
            key={petCount}
            initial={{ opacity: 1, y: 0, scale: 0.6 }}
            animate={{ opacity: 0, y: -42, scale: 1.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="pointer-events-none absolute -top-4 z-30 flex items-center gap-1 text-base"
          >
            <span>💖</span>
            <span className="text-xs font-black text-rose-500 bg-white/90 px-2 py-0.5 rounded-full shadow-sm border border-rose-200">
              โฮ่ง!
            </span>
            <span>✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Backlight Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-1 rounded-full blur-xl opacity-75 transition-transform duration-500 group-hover:scale-125"
        style={{ background: glowColor }}
      />

      {/* Animated Labrador SVG from User Attachment */}
      <motion.div
        whileHover={interactive ? { scale: 1.08, rotate: -3 } : undefined}
        whileTap={interactive ? { scale: 0.94 } : undefined}
        style={{ width: size, height: Math.round(size * 1.1) }}
        className="relative z-10 flex items-center justify-center"
      >
        <img loading="lazy" decoding="async"
          src={LABRADOR_SVG_PATH}
          alt="น้องหมาลาบราดอร์สีทองกระดิกหาง"
          style={{
            width: '100%',
            height: '100%',
            transform: flipHorizontal ? 'scaleX(-1)' : undefined,
          }}
          className="object-contain drop-shadow-[0_10px_18px_rgba(42,20,80,0.22)]"
        />
      </motion.div>

      {/* Optional Bottom Pill Caption */}
      {badgeText && (
        <span className="-mt-1.5 relative z-20 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-amber-300 text-[#92400E] text-[10px] font-extrabold shadow-xs whitespace-nowrap">
          {badgeText}
        </span>
      )}
    </div>
  );
};
