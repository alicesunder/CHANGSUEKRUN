import React from 'react';
import { Music, Check } from 'lucide-react';
import { CONCERT_PASS_PRICE } from '../data/eventData';
import { formatBaht } from '../data/addOns';

interface ConcertPassCardProps {
  onBuy: () => void;
}

/** Step 2 of the buying block: the concert. Included in every run ticket; sold alone for those who don't run. */
export const ConcertPassCard: React.FC<ConcertPassCardProps> = ({ onBuy }) => (
  <div id="concert-pass" className="relative scroll-mt-24 mt-8 sm:mt-10">
    <div
      className="rounded-[32px] p-[3px]"
      style={{ background: 'linear-gradient(135deg, #FFC928 0%, #FB923C 35%, #EC4899 70%, #9333EA 100%)', boxShadow: '0 28px 56px -22px rgba(236, 72, 153, 0.5)' }}
    >
      <div className="relative overflow-hidden rounded-[29px] bg-gradient-to-br from-[#241047] via-[#341866] to-[#4A1F8F] text-white p-4 sm:p-6">
        {/* stage lights */}
        <span aria-hidden="true" className="pointer-events-none absolute -top-16 -left-10 w-56 h-56 rounded-full bg-[#FFC928]/25 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-[#EC4899]/30 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span
              className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-extrabold text-[#2A1450] ring-2 ring-white shadow-[0_10px_18px_-6px_rgba(255,201,40,0.7)]"
              style={{ background: 'linear-gradient(135deg, #FFE268 0%, #FFC928 55%, #FB923C 100%)' }}
              aria-hidden="true"
            >
              2
            </span>
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl font-extrabold leading-tight flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <Music className="w-6 h-6 text-[#FFC928] shrink-0" aria-hidden="true" />
                คอนเสิร์ตริมหาด
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFC928] text-[#2A1450] text-xs font-extrabold">หลัง 17.30 น.</span>
              </h3>
              <ul className="mt-2 space-y-1 text-sm font-semibold text-white/90">
                <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 text-[#10B981] shrink-0" aria-hidden="true" /><span><strong>ตั๋ววิ่งทุกระยะ</strong> ได้เข้าคอนเสิร์ตฟรีอยู่แล้ว</span></li>
                <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 text-[#10B981] shrink-0" aria-hidden="true" /><span>ไม่วิ่งก็มาได้ · ซื้อตั๋วคอนเสิร์ตอย่างเดียว หรือมาเล่นกิจกรรมเสริมอย่างเดียว</span></li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0">
            <span className="text-right">
              <span className="block text-[11px] font-bold text-white/75">ไม่วิ่ง · ตั๋วเข้างาน</span>
              <span className="block text-4xl font-extrabold tabular-nums leading-none text-[#FFD84D] whitespace-nowrap">
                {formatBaht(CONCERT_PASS_PRICE)}
                <span className="text-sm font-bold ml-1 whitespace-nowrap">บาท/คน</span>
              </span>
            </span>
            <button
              type="button"
              onClick={onBuy}
              className="btn-paw bg-[#FFC928] px-5 sm:px-7 py-3 text-sm sm:text-base min-h-[52px] text-[#2A1450] whitespace-nowrap"
            >
              🎶 ซื้อตั๋วคอนเสิร์ต
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
