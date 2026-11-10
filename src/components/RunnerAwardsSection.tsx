import React from 'react';
import { motion } from 'motion/react';

/** Podium order (2nd, 1st, 3rd) with the trophy artwork. No prize money is shown (removed on purpose). */
const PODIUM = [
  { rank: 2, img: '/images/awards/award-silver-v4.webp', h: 'h-12 sm:h-16', trophy: 'h-20 sm:h-28', color: 'from-[#8C97A6] to-[#5B6577]' },
  { rank: 1, img: '/images/awards/award-gold-v4.webp', h: 'h-[4.5rem] sm:h-24', trophy: 'h-24 sm:h-36', color: 'from-[#F5B800] to-[#B47A00]' },
  { rank: 3, img: '/images/awards/award-bronze-v4.webp', h: 'h-9 sm:h-12', trophy: 'h-[4.5rem] sm:h-24', color: 'from-[#CD8A4B] to-[#8A4F22]' },
];

const PANEL = 'relative rounded-[26px] border-[3px] border-[#FFC928]/90 bg-gradient-to-b from-[#4B1FA8]/90 to-[#2A1450]/95 px-3 pb-4 pt-9 shadow-[0_10px_0_rgba(20,8,40,0.55),0_0_32px_-6px_rgba(255,201,40,0.45)] sm:px-5 sm:pb-5 sm:pt-11 backdrop-blur-[2px]';
const TAB = 'absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border-[3px] border-[#2A1450] bg-gradient-to-b from-[#FFE268] to-[#FFC928] px-5 py-1.5 text-lg font-black text-[#2A1450] shadow-[0_4px_0_rgba(20,8,40,0.6)] sm:px-8 sm:text-3xl';
const FOOT = 'mt-3 flex items-center justify-center gap-2 rounded-full border-2 border-[#FFC928] bg-[#2A1450]/80 px-3 py-2 text-center text-sm font-black text-white sm:mt-4 sm:text-xl';

/** The runners' prize board: trophies for 10K / 5K, a product gift set for Dog Run (designed with ChatGPT, built in HTML). */
export const RunnerAwardsSection: React.FC = () => (
  <section id="runner-awards" aria-labelledby="runner-awards-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="relative isolate overflow-hidden rounded-[30px] border-[3px] border-[#2A1450] bg-[#2A1450] shadow-[0_10px_0_#2A1450]">
      <img src="/images/awards/awards-bg-v1.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[#2A1450]/25 via-[#2A1450]/10 to-[#2A1450]/55" />

      <div className="px-3 pb-6 pt-5 sm:px-8 sm:pb-9 sm:pt-7">
        <img src="/images/brand/changsuek-run-logo-v2.webp" alt="CHANGSUEK RUN 2027" className="mx-auto h-16 w-auto object-contain sm:h-24" loading="lazy" />

        <h2 id="runner-awards-heading" className="mt-2 text-center font-hero text-4xl font-bold leading-tight text-[#FFE268] drop-shadow-[0_4px_0_rgba(42,20,80,0.9)] sm:text-6xl">
          <span aria-hidden="true" className="mr-2 text-[#FFC928]">❦</span>รางวัลนักวิ่ง<span aria-hidden="true" className="ml-2 inline-block -scale-x-100 text-[#FFC928]">❦</span>
        </h2>

        <motion.div data-reveal-stagger="pop" className="relative mt-8 grid grid-cols-1 gap-9 sm:mt-10 sm:grid-cols-2 sm:gap-7" initial={false}>
          {/* 10K & 5K: trophies on a podium */}
          <div className={PANEL}>
            <span className={TAB}>10K &amp; 5K</span>
            <div className="flex items-end justify-center gap-1.5 sm:gap-3" role="img" aria-label="ถ้วยรางวัลอันดับ 1 2 3">
              {PODIUM.map((p) => (
                <div key={p.rank} className="flex flex-1 flex-col items-center">
                  <img src={p.img} alt="" aria-hidden="true" loading="lazy" className={`${p.trophy} w-auto drop-shadow-[0_6px_8px_rgba(0,0,0,0.45)]`} />
                  <div className={`${p.h} mt-1 flex w-full items-center justify-center rounded-t-xl border-2 border-b-0 border-white/25 bg-gradient-to-b ${p.color} font-hero text-3xl font-black text-white drop-shadow sm:text-5xl`}>{p.rank}</div>
                </div>
              ))}
            </div>
            <p className={FOOT}>รางวัลภาพรวม (Gun Time)</p>
          </div>

          {/* Dog Run: gift set of product */}
          <div className={PANEL}>
            <span className={TAB}>Dog Run 4K &amp; 1K</span>
            <div className="flex items-center justify-center gap-3 sm:gap-5">
              <span className="relative shrink-0">
                <span aria-hidden="true" className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(255,201,40,0.5),transparent_65%)]" />
                <img src="/images/awards/award-gift-v4.webp" alt="" aria-hidden="true" loading="lazy" className="relative h-28 w-auto drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)] sm:h-40" />
              </span>
              <span className="min-w-0 rounded-2xl border-2 border-[#FFC928] bg-gradient-to-b from-[#FFE268] to-[#FFC928] px-3 py-2 text-center leading-tight shadow-[0_4px_0_rgba(20,8,40,0.55)] sm:px-5 sm:py-3">
                <span className="block text-lg font-black tracking-tight text-[#2A1450] sm:text-3xl">GIFT SET OF PRODUCT</span>
                <span className="mt-1 block rounded-full bg-[#2A1450] px-3 py-1 text-sm font-black text-white sm:text-xl">ชุดผลิตภัณฑ์ของขวัญ</span>
              </span>
            </div>
            <p className={FOOT}>
              <img src="/images/awards/icon-runner-dog-v3.webp" alt="" aria-hidden="true" className="h-7 w-7 sm:h-9 sm:w-9" /> Top 3 คู่วิ่งกับน้องหมา
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);
