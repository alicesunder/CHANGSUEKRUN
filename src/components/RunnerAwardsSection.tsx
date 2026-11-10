import React from 'react';
import { motion } from 'motion/react';

/**
 * The runners' prize board, built from the artwork ChatGPT made (background, podium with trophies, dog with the gift
 * box, laurel branches) with real HTML text on top. No prize money is shown on purpose.
 */
const PANEL =
  'relative rounded-[28px] border-[3px] border-[#FFC928] bg-gradient-to-b from-[#5B21B6]/80 via-[#3B1780]/85 to-[#2A1450]/90 px-3 pb-4 pt-9 shadow-[0_0_0_2px_rgba(42,20,80,0.7),0_0_36px_-4px_rgba(255,201,40,0.55),0_14px_0_-2px_rgba(20,8,40,0.5)] backdrop-blur-[3px] sm:px-6 sm:pb-6 sm:pt-12';
const TAB =
  'absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border-[3px] border-[#FFC928] bg-gradient-to-b from-[#FFE9A0] via-[#FFD34D] to-[#F5B800] px-6 py-1.5 font-hero text-xl font-black text-[#2A1450] shadow-[0_5px_0_rgba(20,8,40,0.6),0_0_22px_rgba(255,201,40,0.55)] sm:px-10 sm:py-2 sm:text-4xl';
const FOOT =
  'mx-auto mt-3 flex w-full items-center justify-between gap-2 rounded-full border-[3px] border-[#FFC928] bg-gradient-to-b from-[#4B1FA8] to-[#2A1450] px-3 py-2 text-center text-base font-black text-white shadow-[0_0_18px_-4px_rgba(255,201,40,0.6)] sm:mt-5 sm:px-6 sm:py-3 sm:text-2xl';

const Laurel: React.FC<{ side: 'l' | 'r'; className: string }> = ({ side, className }) => (
  <img src={`/images/awards/part-laurel-${side}-v5.webp`} alt="" aria-hidden="true" loading="lazy" className={`${className} w-auto shrink-0`} />
);

export const RunnerAwardsSection: React.FC = () => (
  <section id="runner-awards" aria-labelledby="runner-awards-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="relative isolate overflow-hidden rounded-[30px] border-[3px] border-[#2A1450] bg-[#2A1450] shadow-[0_10px_0_#2A1450]">
      <img src="/images/awards/awards-bg-v5.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[#2A1450]/10 via-transparent to-[#2A1450]/35" />

      <div className="px-3 pb-7 pt-5 sm:px-9 sm:pb-10 sm:pt-7">
        <img src="/images/brand/changsuek-run-logo-v2.webp" alt="CHANGSUEK RUN 2027" className="mx-auto h-16 w-auto object-contain sm:h-24" loading="lazy" />

        <div className="mt-1 flex items-center justify-center gap-2 sm:gap-5">
          <Laurel side="l" className="h-12 sm:h-24" />
          <h2 id="runner-awards-heading" className="whitespace-nowrap font-hero text-[2.6rem] font-black leading-tight text-transparent drop-shadow-[0_4px_0_rgba(42,20,80,0.95)] sm:text-8xl [-webkit-text-stroke:2px_#2A1450] bg-gradient-to-b from-[#FFF2B8] via-[#FFD34D] to-[#F5A300] bg-clip-text">
            รางวัลนักวิ่ง
          </h2>
          <Laurel side="r" className="h-12 sm:h-24" />
        </div>

        <motion.div data-reveal-stagger="pop" className="relative mt-9 grid grid-cols-1 gap-11 sm:mt-14 sm:grid-cols-2 sm:gap-8" initial={false}>
          {/* 10K & 5K: trophies on the podium */}
          <div className={PANEL}>
            <span className={TAB}>10K &amp; 5K</span>
            <div className="flex justify-center">
              <img src="/images/awards/part-podium-v5.webp" alt="โพเดียมถ้วยรางวัลอันดับ 1 2 3" loading="lazy" className="h-44 w-auto drop-shadow-[0_10px_12px_rgba(0,0,0,0.4)] sm:h-72" />
            </div>
            <p className={FOOT}>
              <Laurel side="l" className="h-8 sm:h-12" />
              <span>รางวัลภาพรวม (Gun Time)</span>
              <Laurel side="r" className="h-8 sm:h-12" />
            </p>
          </div>

          {/* Dog Run: gift set of product */}
          <div className={PANEL}>
            <span className={TAB}>Dog Run 4K &amp; 1K</span>
            <div className="relative flex items-center justify-center">
              <img src="/images/awards/part-dog-gift-v5.webp" alt="น้องหมานอนข้างกล่องของขวัญ" loading="lazy" className="-ml-3 h-36 w-auto shrink-0 drop-shadow-[0_10px_12px_rgba(0,0,0,0.4)] sm:-ml-10 sm:h-56" />
              <span className="absolute -right-1 top-1/2 w-[46%] -translate-y-1/2 -rotate-3 sm:right-0 sm:w-[44%]">
                <span className="block rounded-xl border-[3px] border-[#FFC928] bg-gradient-to-b from-[#FFE9A0] via-[#FFD34D] to-[#F5B800] px-2 py-1.5 text-center text-sm font-black leading-tight tracking-tight text-[#2A1450] shadow-[0_5px_0_rgba(20,8,40,0.6)] sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-3xl">
                  GIFT SET OF PRODUCT
                </span>
                <span className="mt-1.5 block rounded-lg border-2 border-[#FFC928] bg-gradient-to-b from-[#4B1FA8] to-[#2A1450] whitespace-nowrap px-1.5 py-1 text-center text-[11px] font-black text-white shadow-[0_4px_0_rgba(20,8,40,0.55)] sm:mt-2 sm:rounded-xl sm:px-2 sm:py-1.5 sm:text-lg">ชุดผลิตภัณฑ์ของขวัญ</span>
              </span>
            </div>
            <p className={FOOT}>
              <Laurel side="l" className="h-8 sm:h-12" />
              <span>Top 3 คู่วิ่งกับน้องหมา</span>
              <Laurel side="r" className="h-8 sm:h-12" />
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);
