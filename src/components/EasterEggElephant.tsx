import React, { useEffect, useState } from 'react';
import { ElephantCharacter } from './brand/BrandCharacters';

interface EasterEggElephantProps {
  isActive: boolean;
  onClose: () => void;
}

export const EasterEggElephant: React.FC<EasterEggElephantProps> = ({ isActive, onClose }) => {
  const [posX, setPosX] = useState(-200);

  useEffect(() => {
    if (!isActive) {
      setPosX(-200);
      return;
    }

    // Animate across screen
    const startTime = performance.now();
    const duration = 2800; // 2.8s across screen

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentX = -200 + progress * (window.innerWidth + 400);

      setPosX(currentX);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(onClose, 200);
      }
    };

    requestAnimationFrame(animate);
  }, [isActive, onClose]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
      {/* Floating cheer message box */}
      <div
        className="absolute bottom-24 flex items-center gap-3 bg-[#FFC928] text-[#17151C] px-5 py-3 rounded-full shadow-2xl border-2 border-[#17151C] font-black text-sm md:text-base animate-bounce"
        style={{ left: `${Math.max(20, Math.min(posX - 40, window.innerWidth - 320))}px` }}
      >
        <span>🐘 วิ่งตามช้าง! RUN TOGETHER 2027 🎉</span>
      </div>

      {/* Elephant running */}
      <div
        className="absolute bottom-8 will-change-transform"
        style={{ transform: `translateX(${posX}px)` }}
      >
        <ElephantCharacter size={160} mood="celebrating" isAnimated={true} />
      </div>
    </div>
  );
};
