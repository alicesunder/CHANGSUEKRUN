import React from 'react';

const WORDS = [
  '🐾 วิ่งกับน้องหมา',
  'วิ่ง 9 ม.ค. 2570',
  'กิจกรรมเสริม 10 ม.ค.',
  '🏖️ หาดชะอำ ค่ายนเรศวร',
  '🎤 คอนเสิร์ตริมหาด',
  '🪂 หอสูง',
  '🎯 ยิงปืน',
  '🌪️ อุโมงค์ลม',
  '🐶 ประกวดแต่งตัวน้องหมา',
  '🏅 เหรียญสวยทุกระยะ',
];

/** Two crossed, slightly tilted marquee ribbons: a cheerful seam between the hero and the shop. */
export const FunRibbon: React.FC = () => {
  const line = (words: string[], key: string) =>
    [0, 1].map((copy) =>
      words.map((w, i) => (
        <span key={`${key}${copy}-${i}`} className="flex items-center gap-4 px-4 whitespace-nowrap" aria-hidden={copy === 1}>
          {w}
          <span className="text-[0.8em] opacity-80">✦</span>
        </span>
      ))
    );

  return (
    <div className="fun-ribbon relative h-[110px] sm:h-[120px] overflow-hidden bg-[#FAF7FF]" aria-hidden="true">
      {/* Both ribbons share a centre line and tilt opposite ways, so they cross like an X */}
      <div className="absolute inset-x-[-6%] top-1/2 -translate-y-1/2 -rotate-[5deg] sm:-rotate-2 bg-[#7B3FC6] text-white border-y-[3px] border-[#2A1450] py-2 shadow-[0_6px_0_rgba(42,20,80,0.25)]">
        <div className="fun-ribbon-track reverse font-display text-sm sm:text-base font-bold">{line([...WORDS].reverse(), 'b')}</div>
      </div>
      <div className="absolute inset-x-[-6%] top-1/2 -translate-y-1/2 rotate-[4deg] sm:rotate-[1.6deg] bg-[#FFC928] text-[#2A1450] border-y-[3px] border-[#2A1450] py-2 shadow-[0_6px_0_rgba(42,20,80,0.25)]">
        <div className="fun-ribbon-track font-display text-sm sm:text-base font-bold">{line(WORDS, 'a')}</div>
      </div>
    </div>
  );
};
