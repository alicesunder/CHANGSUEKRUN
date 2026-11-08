import React from 'react';
import { motion } from 'motion/react';
import { Footprints, Gift, PawPrint, Trophy } from 'lucide-react';

/** Overall prizes by Gun Time. Dog Run (4K / 1K) top 3 pairs get a product gift set. */
const MONEY = [
  { rank: 1, baht: 3000, ring: '#FFC928' },
  { rank: 2, baht: 1500, ring: '#B8C0CC' },
  { rank: 3, baht: 1000, ring: '#D9955B' },
];

const MONEY_CARDS = [
  { id: '10k', title: 'วิ่ง 10 กม. (10K)' },
  { id: '5k', title: 'วิ่ง 5 กม. (5K)' },
];

const DOG_CARDS = [
  { id: 'dog4', title: 'Dog Run 4K' },
  { id: 'dog1', title: 'Dog Run 1K' },
];

const HEAD = 'bg-gradient-to-b from-[#FFD84D] to-[#FFC928] border-b-2 border-[#E0A100]';

/** The runners' prize board (design by ChatGPT, built in HTML so the text stays sharp and editable). */
export const RunnerAwardsSection: React.FC = () => (
  <section id="runner-awards" aria-labelledby="runner-awards-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="relative overflow-hidden rounded-[28px] border-2 border-[#2A1450] bg-gradient-to-b from-[#7C3AED] via-[#4B1FA8] to-[#2A1450] p-3 shadow-[0_8px_0_#2A1450] sm:p-6">
      <span aria-hidden="true" className="pointer-events-none absolute -top-20 -left-16 h-56 w-56 rounded-full bg-[#FFC928]/25 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[#EC4899]/25 blur-3xl" />

      <div className="relative mx-auto flex w-fit max-w-full items-center gap-2 rounded-full border-2 border-[#FFC928] bg-[#2A1450] px-4 py-2 shadow-[0_0_24px_-6px_rgba(255,201,40,0.7)] sm:gap-3 sm:px-7 sm:py-3">
        <Trophy aria-hidden="true" className="h-7 w-7 shrink-0 text-[#FFC928] sm:h-10 sm:w-10" />
        <h2 id="runner-awards-heading" className="font-hero text-xl font-bold leading-tight text-white sm:text-4xl">
          รางวัลนักวิ่ง <span className="text-[#FFC928]">· OVERALL AWARD</span>
        </h2>
      </div>

      <motion.ul
        data-reveal-stagger="pop"
        className="relative mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-5"
        initial={false}
        aria-label="เงินรางวัลและรางวัลของนักวิ่ง"
      >
        {MONEY_CARDS.map((c) => (
          <li key={c.id} className="overflow-hidden rounded-2xl border-2 border-[#FFC928] bg-white shadow-[0_6px_0_rgba(42,20,80,0.55)]">
            <div className={`flex items-center gap-3 px-4 py-2.5 ${HEAD}`}>
              <Footprints aria-hidden="true" className="h-7 w-7 shrink-0 text-[#2A1450]" />
              <div className="leading-tight">
                <p className="text-lg font-black text-[#2A1450] sm:text-2xl">{c.title}</p>
                <p className="text-xs font-extrabold text-[#5B3A00] sm:text-sm">รางวัลภาพรวม (Gun Time)</p>
              </div>
            </div>
            <ul className="divide-y divide-[#EFE5FF] bg-gradient-to-b from-white to-[#F6F0FF]">
              {MONEY.map((m) => (
                <li key={m.rank} className="grid grid-cols-[auto_auto_1fr] items-center gap-3 px-3 py-2 sm:gap-4 sm:px-5 sm:py-3">
                  <span
                    className="inline-flex min-w-[88px] items-center justify-center rounded-full border-[3px] bg-white px-3 py-1 text-sm font-black text-[#2A1450] sm:text-base"
                    style={{ borderColor: m.ring }}
                  >
                    อันดับ {m.rank}
                  </span>
                  <Trophy aria-hidden="true" className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" style={{ color: m.ring, fill: m.ring, fillOpacity: 0.25 }} />
                  <span className="text-right leading-tight sm:text-left">
                    <span className="block text-[11px] font-bold text-[#6B5A85] sm:text-xs">พร้อมเงินรางวัล</span>
                    <span className="block text-lg font-black tabular-nums text-[#2A1450] sm:text-2xl">{m.baht.toLocaleString('th-TH')} บาท</span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}

        {DOG_CARDS.map((c) => (
          <li key={c.id} className="overflow-hidden rounded-2xl border-2 border-[#FFC928] bg-white shadow-[0_6px_0_rgba(42,20,80,0.55)]">
            <div className={`flex items-center gap-3 px-4 py-2.5 ${HEAD}`}>
              <PawPrint aria-hidden="true" className="h-7 w-7 shrink-0 text-[#2A1450]" />
              <div className="leading-tight">
                <p className="text-lg font-black text-[#2A1450] sm:text-2xl">{c.title}</p>
                <p className="text-xs font-extrabold text-[#5B3A00] sm:text-sm">รางวัล Top 3 คู่วิ่งกับน้องหมา (Gun Time)</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 bg-gradient-to-b from-white to-[#F6F0FF] px-4 py-5 sm:gap-6 sm:py-7">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#7C3AED] to-[#4B1FA8] shadow-[0_6px_0_#2A1450] sm:h-24 sm:w-24">
                <Gift aria-hidden="true" className="h-11 w-11 text-[#FFC928] sm:h-14 sm:w-14" />
              </span>
              <span className="text-center leading-tight">
                <span className="inline-block rounded-full bg-[#EFE5FF] px-4 py-1 text-base font-black text-[#4B1FA8] sm:text-xl">อันดับ 1 – 3</span>
                <span className="mt-1.5 block text-lg font-black text-[#2A1450] sm:text-2xl">ชุดของรางวัลสินค้า</span>
              </span>
            </div>
          </li>
        ))}
      </motion.ul>
    </div>
  </section>
);
