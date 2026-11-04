import React from 'react';
import { Music } from 'lucide-react';
import { CONCERT_LINEUP, CONCERT_PASS_PRICE, VIP_TABLE_PRICE, concertPassPrice, vipTablePrice, formatBaht } from '../data/eventData';
import { EarlyBirdPrice } from './EarlyBirdPrice';
import { useEarlyBird } from '../utils/earlyBird';

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
const ARTISTS: { src: string; glow: string }[] = [
  { src: '/images/concert/artists/artist-1.webp', glow: '#FF4D6D' },
  { src: '/images/concert/artists/artist-2.webp', glow: '#22D3EE' },
  { src: '/images/concert/artists/artist-3.webp', glow: '#60A5FA' },
  { src: '/images/concert/artists/artist-4.webp', glow: '#F472B6' },
  { src: '/images/concert/artists/artist-5.webp', glow: '#3B82F6' },
  { src: '/images/concert/artists/artist-6.webp', glow: '#FBBF24' },
];
const BEAMS = [
  { left: '6%', c: '#F43F5E', d: '0s' },
  { left: '28%', c: '#22D3EE', d: '-1.5s' },
  { left: '50%', c: '#FFC928', d: '-3s' },
  { left: '72%', c: '#A855F7', d: '-4.5s' },
  { left: '92%', c: '#34D399', d: '-2s' },
];

/** This year's line-up (group photo + timetable), then last year's festival and the run atmosphere. */
export const ConcertSection: React.FC = () => {
  const earlyBird = useEarlyBird();
  return (
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
              <Music className="w-4 h-4" /> คอนเสิร์ตริมหาด 18.00–24.00 น. · 9 ม.ค. 2570
            </span>
            <h2 id="concert-heading" className="squiggle squiggle-center mt-3 font-hero text-3xl sm:text-4xl font-bold text-white">
              บรรยากาศงานวิ่ง & คอนเสิร์ต
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-white/85">
              วิ่งริมหาดกับเพื่อนสี่ขา แล้วต่อด้วยดนตรีสดริมหาด ทั้งครอบครัวและน้องสุนัขมาสนุกด้วยกันได้
            </p>
          </div>

          {/* This year's line-up */}
          <div className="lineup-stage mt-7 relative rounded-[28px] border-[3px] border-[#FFC928] bg-[#0B0418] overflow-clip shadow-[0_0_0_4px_rgba(255,201,40,0.18),0_24px_60px_-18px_rgba(236,72,153,0.55)]">
            {BEAMS.map((b) => (
              <span key={b.left} aria-hidden="true" className="concert-beam z-[1]" style={{ left: b.left, animationDelay: b.d, ['--beam' as string]: b.c }} />
            ))}
            <span aria-hidden="true" className="lineup-glow" />
            <div className="relative z-[2] px-4 sm:px-6 pt-5 sm:pt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F43F5E] via-[#A855F7] to-[#22D3EE] px-4 py-1.5 text-xs sm:text-sm font-black tracking-wider text-white shadow-[0_0_18px_rgba(168,85,247,0.7)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" aria-hidden="true" /> LINE-UP 2027
                </span>
                <h3 className="mt-2 font-hero text-2xl sm:text-4xl font-black leading-tight">
                  <span className="lineup-title">ศิลปินปีนี้ จัดเต็มริมหาด!</span>
                </h3>
              </div>
              <span className="self-start sm:self-auto shrink-0 rounded-xl bg-[#FFC928] text-[#2A1450] text-xs sm:text-sm font-black px-3 py-1.5 border-2 border-[#140826] shadow-[0_3px_0_#140826]">
                📅 9 ม.ค. 2570 · 18.00–24.00 น.
              </span>
            </div>
            <figure className="relative z-[2] mt-4 mx-3 sm:mx-5 rounded-2xl overflow-hidden border-2 border-white/20">
              <img
                src="/images/concert/lineup-2027.webp"
                alt="ศิลปินคอนเสิร์ต CHANGSUEK RUN 2027: LomoSonic, ดาเอนโดฟิน, จ่ะ อาร์สยาม และศิลปินรับเชิญพิเศษ"
                width={1400}
                height={813}
                loading="lazy"
                decoding="async"
                className="block w-full h-auto"
              />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#0B0418] to-transparent" />
            </figure>
            <ol data-reveal-stagger="pop" className="relative z-[2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 p-3 sm:p-5" aria-label="ตารางการแสดง">
              {CONCERT_LINEUP.map((a) => (
                <li
                  key={a.time}
                  className="lineup-slot rounded-2xl bg-white/[0.06] border-2 px-3.5 py-3"
                  style={{ ['--glow' as string]: a.color, borderColor: a.color }}
                >
                  <span className="inline-block rounded-lg px-2 py-0.5 text-xs font-black text-[#0B0418]" style={{ background: a.color }}>
                    {a.time}
                  </span>
                  <p className="mt-1.5 text-lg sm:text-xl font-black leading-tight text-white">{a.artist}</p>
                  {a.tba && <p className="text-xs font-bold text-[#FFE28A]">รอประกาศชื่อเร็ว ๆ นี้ 🤫</p>}
                </li>
              ))}
            </ol>
          </div>

          {/* Last year's line-up: smaller photos */}
          <div className="mt-8 relative rounded-[26px] bg-[#0E0620] border-2 border-[#FFC928]/40 p-3 sm:p-5 overflow-clip">
            <span aria-hidden="true" className="concert-beam left-[20%]" style={{ ['--beam' as string]: '#C084FC' }} />
            <span aria-hidden="true" className="concert-beam left-[80%] [animation-delay:-3s]" style={{ ['--beam' as string]: '#22D3EE' }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF4D6D] to-[#A855F7] border-2 border-white/40 px-4 py-2 text-lg sm:text-2xl font-black text-white shadow-[0_0_20px_rgba(255,77,109,0.45)]">
                  <span className="w-3 h-3 rounded-full bg-white animate-pulse" aria-hidden="true" /> ย้อนบรรยากาศปีที่แล้ว
                </span>
                <p className="mt-2 text-sm sm:text-base font-black leading-tight text-white/90">
                  ศิลปินบนเวที <span className="text-[#FFC928]">{PAST_FESTIVAL.name}</span>
                </p>
              </div>
              <span className="self-start sm:self-auto shrink-0 rounded-xl bg-white/10 text-[#FFE28A] text-xs sm:text-sm font-black px-3 py-1.5 border border-white/25">
                📅 {PAST_FESTIVAL.date}
              </span>
            </div>
            <ul
              data-reveal-stagger="pop"
              className="relative grid grid-cols-3 md:grid-cols-6 auto-rows-[78px] sm:auto-rows-[100px] gap-2"
              aria-label={`ภาพศิลปินจากงาน ${PAST_FESTIVAL.name}`}
            >
              {ARTISTS.map((a, i) => (
                <li
                  key={a.src}
                  className="artist-tile group relative overflow-hidden rounded-xl border-2 border-white/15"
                  style={{ ['--glow' as string]: a.glow }}
                >
                  <img
                    src={a.src}
                    alt={`ศิลปินบนเวที ${PAST_FESTIVAL.name} ภาพที่ ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                </li>
              ))}
            </ul>
          </div>

          <ul data-reveal-stagger="" className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 max-w-[820px] mx-auto">
            {PHOTOS.map((p) => (
              <li key={p.src} className="rounded-2xl overflow-hidden bg-white/[0.07] border-2 border-[#FFC928]/35">
                <img src={p.src} alt={p.alt} loading="lazy" decoding="async" className="block w-full aspect-[4/3] object-cover" />
                <p className="px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white/85 leading-snug">{p.cap}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-center">
            <a
              href="#shop-concert"
              className="inline-flex items-center gap-2 min-h-[52px] px-7 rounded-2xl bg-[#FFC928] text-[#2A1450] text-base font-extrabold border-[3px] border-[#140826] shadow-[0_6px_0_#140826] active:translate-y-0.5"
            >
              🎶 ซื้อตั๋วคอนเสิร์ต GA <EarlyBirdPrice list={CONCERT_PASS_PRICE} now={concertPassPrice(earlyBird)} /> บาท
            </a>
          </div>
          <p className="mt-3 text-center text-sm font-bold text-[#FFE28A]">
            หรือจอง VIP TABLE <EarlyBirdPrice list={VIP_TABLE_PRICE} now={vipTablePrice(earlyBird)} /> บาท/โต๊ะ (6 ท่าน)
          </p>
          <p className="mt-4 text-center text-xs font-medium text-white/70">
            ภาพปีที่แล้วเป็นภาพบรรยากาศประกอบ ชื่อศิลปินวงปิดจะประกาศอีกครั้งผ่านช่องทางทางการของงาน
          </p>
        </div>
      </div>
    </div>
  </section>
  );
};
