import React from 'react';
import { Music } from 'lucide-react';
import { CONCERT_PASS_PRICE, VIP_TABLE_PRICE, formatBaht } from '../data/eventData';

const PHOTOS = [
  { src: '/images/concert/run-atmosphere.jpg', alt: 'นักวิ่งในเสื้อสีม่วงเดินผ่านซุ้มปล่อยตัวบนชายหาด ยิ้มและชูนิ้วโป้ง', cap: 'บรรยากาศงานวิ่งริมหาด ตชด. ครั้งที่ผ่านมา' },
  { src: '/images/concert/stage.webp', alt: 'เวทีคอนเสิร์ตยามเย็นพร้อมจอ LED และแสงสีม่วง มีผู้ชมถือโทรศัพท์ถ่ายภาพ', cap: 'เวทีกลางแจ้ง จอ LED และแสงสีตอนค่ำ' },
  { src: '/images/concert/crowd.webp', alt: 'ผู้ชมนั่งบนสนามหญ้าชมคอนเสิร์ตริมหาดตอนพลบค่ำ', cap: 'นั่งชิลล์ริมหาด ฟังดนตรีสดหลังจบการวิ่ง' },
];

/**
 * Photos of the artists on stage at last year's festival (no names shown).
 */
const PAST_FESTIVAL = {
  name: 'HUAHIN BEACH CROSS COUNTRY & MUSIC FESTIVAL 2026',
  date: '2 พฤษภาคม 2026',
};
const ARTISTS: { src: string; tile: string; glow: string }[] = [
  { src: '/images/concert/artists/artist-1.webp', tile: 'col-span-2 row-span-2', glow: '#FF4D6D' },
  { src: '/images/concert/artists/artist-2.webp', tile: 'row-span-2', glow: '#22D3EE' },
  { src: '/images/concert/artists/artist-3.webp', tile: '', glow: '#60A5FA' },
  { src: '/images/concert/artists/artist-4.webp', tile: '', glow: '#F472B6' },
  { src: '/images/concert/artists/artist-5.webp', tile: 'col-span-2', glow: '#3B82F6' },
  { src: '/images/concert/artists/artist-6.webp', tile: 'col-span-2', glow: '#FBBF24' },
];

/** Atmosphere photos of the run and the evening concert, shown below the schedule & GPS section. */
export const ConcertSection: React.FC = () => (
  <section id="concert" aria-labelledby="concert-heading" className="py-10 sm:py-14 scroll-mt-20">
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
      <div className="rounded-[32px] border-[3px] border-[#2A1450] shadow-[0_10px_0_#2A1450] bg-gradient-to-br from-[#241047] via-[#341866] to-[#4A1F8F] text-white overflow-hidden">
        <div
          aria-hidden="true"
          className="h-3 w-full"
          style={{ background: 'repeating-linear-gradient(135deg, #FFC928 0 14px, #2A1450 14px 28px)' }}
        />
        <div className="px-4 sm:px-8 py-8 sm:py-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC928] text-[#2A1450] text-xs sm:text-sm font-bold px-3.5 py-1.5">
              <Music className="w-4 h-4" /> หลังปล่อยตัว 17.30 น. เป็นต้นไป
            </span>
            <h2 id="concert-heading" className="squiggle squiggle-center mt-3 font-hero text-3xl sm:text-4xl font-bold text-white">
              บรรยากาศงานวิ่ง & คอนเสิร์ต
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-white/85">
              วิ่งริมหาดกับเพื่อนสี่ขา แล้วต่อด้วยดนตรีสดริมหาด ทั้งครอบครัวและน้องสุนัข
            </p>
          </div>

          {/* Last year's line-up */}
          <div className="mt-7 relative rounded-[26px] bg-[#0E0620] border-2 border-[#FFC928]/40 p-3 sm:p-5 overflow-clip">
            <span aria-hidden="true" className="concert-beam left-[12%]" style={{ ['--beam' as string]: '#C084FC' }} />
            <span aria-hidden="true" className="concert-beam left-[55%] [animation-delay:-2s]" style={{ ['--beam' as string]: '#FFC928' }} />
            <span aria-hidden="true" className="concert-beam left-[85%] [animation-delay:-4s]" style={{ ['--beam' as string]: '#22D3EE' }} />
            <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/25 px-3 py-1 text-[11px] sm:text-xs font-extrabold tracking-wide text-[#FFE28A]">
                  <span className="w-2 h-2 rounded-full bg-[#FF4D6D] animate-pulse" aria-hidden="true" /> ย้อนบรรยากาศปีที่แล้ว
                </span>
                <h3 className="mt-2 font-hero text-lg sm:text-2xl font-black leading-tight text-white">
                  ศิลปินบนเวที <span className="text-[#FFC928]">{PAST_FESTIVAL.name}</span>
                </h3>
              </div>
              <span className="self-start sm:self-auto shrink-0 rounded-xl bg-[#FFC928] text-[#2A1450] text-xs sm:text-sm font-black px-3 py-1.5 border-2 border-[#140826] shadow-[0_3px_0_#140826]">
                📅 {PAST_FESTIVAL.date}
              </span>
            </div>
            <ul
              data-reveal-stagger="pop"
              className="relative grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] sm:auto-rows-[150px] md:auto-rows-[170px] [grid-auto-flow:dense] gap-2.5 sm:gap-3"
              aria-label={`ภาพศิลปินจากงาน ${PAST_FESTIVAL.name}`}
            >
              {ARTISTS.map((a, i) => (
                <li
                  key={a.src}
                  className={`artist-tile group relative overflow-hidden rounded-2xl border-2 border-white/15 ${a.tile}`}
                  style={{ ['--glow' as string]: a.glow }}
                >
                  <img
                    src={a.src}
                    alt={`ศิลปินบนเวที ${PAST_FESTIVAL.name} ภาพที่ ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0E0620]/85 via-transparent to-transparent" />
                </li>
              ))}
            </ul>
            <p className="relative mt-3 text-center text-[11px] sm:text-xs font-semibold text-white/60">
              ภาพจากงาน {PAST_FESTIVAL.name} · {PAST_FESTIVAL.date} · ศิลปินปีนี้จะประกาศเร็วๆ นี้
            </p>
          </div>

          <ul data-reveal-stagger="" className="mt-7 flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-3 sm:gap-5 md:overflow-visible">
            {PHOTOS.map((p) => (
              <li key={p.src} className="shrink-0 w-[85%] snap-start md:w-auto rounded-3xl overflow-hidden bg-white/[0.07] border-2 border-[#FFC928]/35">
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                  className="block w-full aspect-[4/3] object-cover"
                />
                <p className="px-4 py-3 text-sm font-semibold text-white/90">{p.cap}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-center">
            <a
              href="#shop-concert"
              className="inline-flex items-center gap-2 min-h-[52px] px-7 rounded-2xl bg-[#FFC928] text-[#2A1450] text-base font-extrabold border-[3px] border-[#140826] shadow-[0_6px_0_#140826] active:translate-y-0.5"
            >
              🎶 ซื้อตั๋วคอนเสิร์ต GA {formatBaht(CONCERT_PASS_PRICE)} บาท
            </a>
          </div>
          <p className="mt-3 text-center text-sm font-bold text-[#FFE28A]">
            หรือจอง VIP TABLE {formatBaht(VIP_TABLE_PRICE)} บาท/โต๊ะ (6 ท่าน)
          </p>
          <p className="mt-4 text-center text-xs font-medium text-white/70">
            ภาพบรรยากาศประกอบ รายชื่อศิลปินและการแสดงจะประกาศอีกครั้งผ่านช่องทางทางการ
          </p>
        </div>
      </div>
    </div>
  </section>
);
