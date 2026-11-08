import React from 'react';
import { motion } from 'motion/react';

/** Overall prizes by Gun Time. Dog Run (4K / 1K) top 3 pairs get a product gift set. */
const MONEY = [
  { rank: 1, baht: 3000, ring: '#F5B800', leaf: '#D99A00', img: '/images/awards/award-gold-v1.webp' },
  { rank: 2, baht: 1500, ring: '#A9B2BF', leaf: '#8C97A6', img: '/images/awards/award-silver-v1.webp' },
  { rank: 3, baht: 1000, ring: '#CD8A4B', leaf: '#B2703A', img: '/images/awards/award-bronze-v1.webp' },
];

const MONEY_CARDS = [
  { id: '10k', title: 'วิ่ง 10 กม. (10K)' },
  { id: '5k', title: 'วิ่ง 5 กม. (5K)' },
];

const DOG_CARDS = [
  { id: 'dog4', title: 'Dog Run 4K' },
  { id: 'dog1', title: 'Dog Run 1K' },
];

const CARD = 'overflow-hidden rounded-[22px] border-[3px] border-[#FFC928] bg-white shadow-[0_8px_0_rgba(26,10,56,0.6),0_18px_30px_-12px_rgba(0,0,0,0.5)]';
const HEAD = 'relative flex items-center gap-3 border-b-[3px] border-[#E0A100] bg-gradient-to-b from-[#FFE066] via-[#FFD233] to-[#FFC11A] px-4 py-3 sm:px-5';

/** Laurel wreath that frames the rank number. */
const Laurel: React.FC<{ color: string }> = ({ color }) => (
  <svg aria-hidden="true" viewBox="0 0 100 70" className="pointer-events-none absolute inset-0 h-full w-full">
    {[0, 1, 2, 3, 4].map((i) => (
      <React.Fragment key={i}>
        <ellipse cx={9 + i * 2.5} cy={58 - i * 10} rx="3.6" ry="7" transform={`rotate(${-35 + i * 10} ${9 + i * 2.5} ${58 - i * 10})`} fill={color} />
        <ellipse cx={91 - i * 2.5} cy={58 - i * 10} rx="3.6" ry="7" transform={`rotate(${35 - i * 10} ${91 - i * 2.5} ${58 - i * 10})`} fill={color} />
      </React.Fragment>
    ))}
  </svg>
);

/** The runners' prize board (design by ChatGPT, built in HTML so the text stays sharp and editable). */
export const RunnerAwardsSection: React.FC = () => (
  <section id="runner-awards" aria-labelledby="runner-awards-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="relative isolate overflow-hidden rounded-[30px] border-[3px] border-[#2A1450] bg-[#2A1450] shadow-[0_10px_0_#2A1450]">
      <img src="/images/awards/awards-bg-v1.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[#2A1450]/30 via-[#2A1450]/10 to-[#2A1450]/55" />

      <div className="px-3 pb-6 pt-5 sm:px-8 sm:pb-9 sm:pt-7">
        <img src="/images/brand/changsuek-run-logo.webp" alt="CHANGSUEK RUN 2027" className="mx-auto h-16 w-auto object-contain drop-shadow-[0_4px_10px_rgba(20,8,38,0.7)] sm:h-24" loading="lazy" />

        <div className="relative mx-auto mt-3 flex w-fit max-w-full items-center gap-2 rounded-full border-[3px] border-[#FFC928] bg-gradient-to-b from-[#3B1780] to-[#2A1450] py-2 pl-3 pr-5 shadow-[0_0_28px_-4px_rgba(255,201,40,0.75)] sm:gap-3 sm:py-3 sm:pl-5 sm:pr-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white sm:h-14 sm:w-14"><img src="/images/awards/award-gold-v1.webp" alt="" aria-hidden="true" className="h-8 w-auto mix-blend-multiply sm:h-11" /></span>
          <h2 id="runner-awards-heading" className="font-hero text-xl font-bold leading-tight text-white sm:text-4xl">
            รางวัลนักวิ่ง <span className="text-[#FFC928]">· OVERALL AWARD</span>
          </h2>
        </div>

        <motion.ul
          data-reveal-stagger="pop"
          className="relative mt-5 grid grid-cols-1 gap-4 sm:mt-7 sm:grid-cols-2 sm:gap-6"
          initial={false}
          aria-label="เงินรางวัลและรางวัลของนักวิ่ง"
        >
          {MONEY_CARDS.map((c) => (
            <li key={c.id} className={CARD}>
              <div className={HEAD}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 ring-2 ring-[#E0A100]/60 sm:h-14 sm:w-14">
                  <img src="/images/awards/award-runner-v1.webp" alt="" aria-hidden="true" className="h-8 w-auto mix-blend-multiply sm:h-10" />
                </span>
                <div className="leading-tight">
                  <p className="text-xl font-black text-[#2A1450] sm:text-[1.7rem]">{c.title}</p>
                  <p className="text-xs font-extrabold text-[#5B3A00] sm:text-sm">รางวัลภาพรวม (Gun Time)</p>
                </div>
              </div>
              <ul className="bg-gradient-to-b from-white to-[#F3ECFF]">
                {MONEY.map((m) => (
                  <li key={m.rank} className="grid grid-cols-[auto_auto_1fr] items-center gap-2 border-b border-[#E7DCFA] px-2.5 py-2 last:border-b-0 sm:gap-4 sm:px-5 sm:py-2.5">
                    <span className="relative flex h-[58px] w-[104px] shrink-0 items-center justify-center sm:h-[66px] sm:w-[120px]">
                      <Laurel color={m.leaf} />
                      <span className="relative text-center leading-none">
                        <span className="block text-[11px] font-black text-[#2A1450] sm:text-xs">อันดับ</span>
                        <span className="block font-hero text-3xl font-black text-[#2A1450] sm:text-4xl">{m.rank}</span>
                      </span>
                    </span>
                    <img src={m.img} alt="" aria-hidden="true" className="h-12 w-auto mix-blend-multiply sm:h-14" loading="lazy" />
                    <span className="text-right leading-tight sm:text-left">
                      <span className="block text-[11px] font-bold text-[#6B5A85] sm:text-sm">พร้อมเงินรางวัล</span>
                      <span className="block text-xl font-black tabular-nums text-[#2A1450] sm:text-[1.7rem]">{m.baht.toLocaleString('th-TH')} บาท</span>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}

          {DOG_CARDS.map((c) => (
            <li key={c.id} className={CARD}>
              <div className={HEAD}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 ring-2 ring-[#E0A100]/60 sm:h-14 sm:w-14">
                  <img src="/images/awards/award-runner-dog-v1.webp" alt="" aria-hidden="true" className="h-8 w-auto mix-blend-multiply sm:h-10" />
                </span>
                <div className="leading-tight">
                  <p className="text-xl font-black text-[#2A1450] sm:text-[1.7rem]">{c.title}</p>
                  <p className="text-xs font-extrabold text-[#5B3A00] sm:text-sm">รางวัล Top 3 คู่วิ่งกับน้องหมา (Gun Time)</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 bg-gradient-to-b from-white to-[#F3ECFF] px-4 py-5 sm:gap-8 sm:py-7">
                <span className="relative shrink-0">
                  <span aria-hidden="true" className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(255,201,40,0.55),transparent_65%)]" />
                  <img src="/images/awards/award-gift-v1.webp" alt="" aria-hidden="true" className="relative h-24 w-auto mix-blend-multiply sm:h-32" loading="lazy" />
                </span>
                <span className="text-center leading-tight">
                  <span className="inline-block rounded-full bg-gradient-to-b from-[#EFE5FF] to-[#DCCBFA] px-5 py-1 text-lg font-black text-[#4B1FA8] sm:text-2xl">อันดับ 1 – 3</span>
                  <span className="mt-2 block text-xl font-black text-[#2A1450] sm:text-[1.7rem]">ชุดของรางวัลสินค้า</span>
                </span>
              </div>
            </li>
          ))}
        </motion.ul>
      </div>
    </div>
  </section>
);
