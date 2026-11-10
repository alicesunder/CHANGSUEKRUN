import React from 'react';
import { CalendarDays, Clock, Music } from 'lucide-react';
import { CONCERT_LINEUP, CONCERT_PASS_PRICE, VIP_TABLE_PRICE, concertPassPrice, vipTablePrice } from '../data/eventData';
import { EarlyBirdPrice } from './EarlyBirdPrice';
import { useEarlyBird } from '../utils/earlyBird';

const PHOTOS = [
  { src: '/images/concert/run-atmosphere.jpg', alt: 'นักวิ่งในเสื้อสีม่วงเดินผ่านซุ้มปล่อยตัวบนชายหาด ยิ้มและชูนิ้วโป้ง', cap: 'บรรยากาศงานวิ่งริมหาด ตชด. ครั้งที่ผ่านมา' },
  { src: '/images/concert/stage.webp', alt: 'เวทีคอนเสิร์ตยามเย็นพร้อมจอ LED และแสงสีม่วง มีผู้ชมถือโทรศัพท์ถ่ายภาพ', cap: 'เวทีกลางแจ้ง จอ LED และแสงสีตอนค่ำ' },
  { src: '/images/concert/crowd.webp', alt: 'ผู้ชมนั่งบนสนามหญ้าชมคอนเสิร์ตริมหาดตอนพลบค่ำ', cap: 'นั่งชิลล์ริมหาด ฟังดนตรีสดหลังจบการวิ่ง' },
];

const BEAMS = [
  { left: '20%', c: '#C084FC', d: '0s' },
  { left: '80%', c: '#22D3EE', d: '-3s' },
];

/** This year's line-up (group photo on the stage + timetable), then last year's festival and the run atmosphere. */
export const ConcertSection: React.FC = () => {
  const earlyBird = useEarlyBird();
  return (
    <section id="concert" aria-labelledby="concert-heading" className="py-10 sm:py-14 scroll-mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        <div className="ds-frame-dark relative overflow-hidden bg-[#2A1450] text-white">
          {/* ---------- header scene ---------- */}
          <div className="relative overflow-hidden bg-[#2A1450]">
            <img src="/images/concert/conc-header.webp" alt="" aria-hidden="true" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[30%_center] sm:object-center" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#2A1450]/30 via-transparent to-[#2A1450]/40" />
            <div className="relative px-4 pb-8 pt-8 text-center sm:px-8 sm:pb-12 sm:pt-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFC928] to-[#FFE268] px-4 py-1.5 text-xs font-extrabold text-[#2A1450] shadow-lg sm:text-base">
                <Music className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /> คอนเสิร์ตริมชายหาด 18.00–24.00 น. • 9 ม.ค. 2570
              </span>
              <h2 id="concert-heading" className="mt-3 font-hero text-[1.9rem] font-bold italic leading-[1.25] text-white drop-shadow-[0_4px_10px_rgba(20,8,38,0.6)] sm:text-5xl lg:text-6xl">
                บรรยากาศงานวิ่ง <span className="text-[#FFC928]">&</span> คอนเสิร์ต
              </h2>
              <svg aria-hidden="true" className="mx-auto mt-1 h-3 w-40 sm:w-56" viewBox="0 0 220 12" fill="none">
                <path d="M2 8 C 40 -2, 70 14, 110 6 S 180 -2, 218 8" stroke="#FFC928" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-white/90 sm:text-lg">
                วิ่งรับลมทะเลริมชายหาด แล้วต่อด้วยคอนเสิร์ตเต็มอิ่มตลอดค่ำคืน
                <br className="hidden sm:block" /> ทั้งครอบครัวและน้องสุนัขสามารถเข้าร่วมได้
              </p>
            </div>
          </div>

          <div className="px-3 pb-6 sm:px-6 sm:pb-8">
            {/* ---------- this year's line-up: the real stage photo, big and clear, with moving light ---------- */}
            <div className="relative -mt-3 overflow-hidden rounded-[26px] border-2 border-[#FFC928] bg-[#1B0B3A] shadow-[0_0_0_4px_rgba(255,201,40,0.18),0_0_40px_-4px_rgba(255,201,40,0.4),0_24px_60px_-18px_rgba(168,85,247,0.55)]">
              <div className="relative flex flex-col gap-2 px-4 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-7 sm:pt-6">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#4B1FA8] px-4 py-1.5 text-xs font-black tracking-wider text-[#FFE268] ring-1 ring-[#FFC928]/70 shadow-[0_0_18px_rgba(168,85,247,0.7)] sm:text-sm">
                    <span aria-hidden="true" className="flex h-4 items-end gap-[2px]">
                      {[0, 0.2, 0.4].map((d) => <i key={d} className="eq-bar block w-[3px] rounded-sm bg-[#FFE268]" style={{ animation: 'eqBounce .9s ease-in-out infinite', animationDelay: `${d}s` }} />)}
                    </span>
                    LINE-UP 2027
                  </span>
                  <h3 className="mt-2 font-hero text-[1.75rem] font-black italic leading-[1.2] sm:text-4xl lg:text-5xl">
                    <span className="bg-gradient-to-b from-white via-[#FFE268] to-[#FFC928] bg-clip-text text-transparent [filter:drop-shadow(0_3px_6px_rgba(20,8,38,0.8))]">ศิลปินชั้นนำ จัดเต็มริมชายหาด!</span>
                  </h3>
                  <svg aria-hidden="true" className="mt-0.5 h-3 w-44 sm:w-72" viewBox="0 0 300 12" fill="none">
                    <path d="M2 9 C 80 0, 160 12, 298 2" stroke="#FFC928" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#FFC928] to-[#FFE268] px-4 py-2 text-xs font-black text-[#2A1450] shadow-lg sm:text-sm">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /> 9 ม.ค. 2570 <span aria-hidden="true">·</span> <Clock className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /> 18.00–24.00 น.
                </span>
              </div>

              {/* the real photo of last year's stage, shown clearly (no blur) */}
              <div className="relative mx-3 h-[300px] overflow-hidden rounded-2xl border border-[#FFC928]/60 shadow-[0_0_30px_-6px_rgba(168,85,247,0.8)] sm:mx-6 sm:h-[440px] lg:h-[520px]">
                <img
                  src="/images/concert/concert-real-v2.webp"
                  alt="เวทีคอนเสิร์ตจริงของงาน Hua Hin Beach Cross Country & Music Festival พร้อมจอ LED และไฟสปอตไลต์"
                  decoding="async"
                  loading="lazy"
                  className="fx-off fx-kenburns absolute inset-0 h-full w-full object-cover object-[center_42%]"
                />
                {/* moving spotlight beams + twinkles on top of the photo */}
                <span aria-hidden="true" className="fx-beam" style={{ left: '-6%', background: 'linear-gradient(to top, rgba(192,132,252,.7), transparent 75%)', clipPath: 'polygon(46% 100%, 54% 100%, 100% 0, 0 0)' }} />
                <span aria-hidden="true" className="fx-beam" style={{ right: '-6%', background: 'linear-gradient(to top, rgba(34,211,238,.6), transparent 75%)', clipPath: 'polygon(46% 100%, 54% 100%, 100% 0, 0 0)', animationDelay: '-3.5s', animationDirection: 'alternate-reverse' }} />
                {[['14%', '22%', '0s'], ['78%', '16%', '.7s'], ['58%', '38%', '1.4s'], ['30%', '56%', '2.1s'], ['90%', '60%', '.3s']].map(([l, t, d]) => (
                  <i key={l + t} aria-hidden="true" className="fx-spark" style={{ left: l, top: t, animationDelay: d }} />
                ))}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(27,11,58,0.7)_100%)]" />
                <span className="absolute right-3 top-3 rounded-full bg-[#1B0B3A]/80 px-3 py-1 text-[11px] font-bold text-[#FFE28A] ring-1 ring-[#FFC928]/60 backdrop-blur sm:text-sm">📸 ภาพจริงจากเวทีคอนเสิร์ต</span>
              </div>

              {/* time table */}
              <ol data-reveal-stagger="pop" className="relative z-[4] grid grid-cols-1 gap-2.5 p-3 sm:-mt-10 sm:grid-cols-2 sm:gap-3.5 sm:px-8 sm:pb-6 lg:grid-cols-4" aria-label="ตารางการแสดง">
                {CONCERT_LINEUP.map((a) => (
                  <li
                    key={a.artist}
                    className="lineup-slot rounded-2xl border-2 bg-[#1B0B3A]/90 backdrop-blur-sm px-3 py-3 text-center sm:px-4 sm:py-4"
                    style={{ ['--glow' as string]: a.color, borderColor: a.color }}
                  >
                    {a.time && (
                      <span className="mb-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-black tracking-tight text-[#0B0418] sm:px-2.5 sm:text-sm" style={{ background: a.color }}>
                        {a.time}
                      </span>
                    )}
                    <p className="text-base font-black leading-tight text-white sm:text-xl">{a.artist}</p>
                    {a.tba && <p className="mt-1 text-xs font-bold text-[#FFE28A] sm:text-sm">พบกับเซอร์ไพรส์สุดพิเศษ! 🎁</p>}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-5 flex justify-center">
              <a
                href="#schedule"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border-2 border-[#FFC928] bg-white/5 px-6 text-sm font-extrabold text-[#FFE28A] shadow-[0_0_18px_-4px_rgba(255,201,40,0.5)] sm:text-base"
              >
                📅 ดูตารางกิจกรรมทั้งหมด <span aria-hidden="true">▾</span>
              </a>
            </div>

            <details className="group mt-6">
              <summary className="mx-auto flex w-fit min-h-[48px] cursor-pointer list-none items-center gap-2 rounded-2xl border-2 border-[#FFC928]/60 bg-white/10 px-5 text-sm font-extrabold text-[#FFE28A] [&::-webkit-details-marker]:hidden">
                🎞️ ดูภาพบรรยากาศงานวิ่งและคอนเสิร์ต <span className="group-open:hidden">▾</span><span className="hidden group-open:inline">▴</span>
              </summary>
              <ul data-reveal-stagger="" className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 max-w-[820px] mx-auto">
                {PHOTOS.map((p) => (
                  <li key={p.src} className="rounded-2xl overflow-hidden bg-white/[0.07] border-2 border-[#FFC928]/35">
                    <img src={p.src} alt={p.alt} loading="lazy" decoding="async" className="block w-full aspect-[4/3] object-cover" />
                    <p className="px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white/85 leading-snug">{p.cap}</p>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {/* ---------- footer scene with the ticket buttons ---------- */}
          <div className="relative overflow-hidden bg-[#2A1450] px-4 pb-8 pt-10 text-center sm:pb-10 sm:pt-14">
            <img src="/images/concert/conc-footer.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-bottom" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#2A1450] via-[#2A1450]/30 to-[#2A1450]/10" />
            <div className="relative">
              <a
                href="#shop-concert"
                className="fx-sheen inline-flex min-h-[56px] w-full max-w-xl items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFB300] px-7 text-base font-extrabold text-[#2A1450] shadow-[0_12px_26px_-8px_rgba(255,179,0,0.8)] ring-2 ring-[#FFE268]/60 active:translate-y-0.5 sm:text-xl"
              >
                🎶 ซื้อตั๋วคอนเสิร์ต GA <EarlyBirdPrice list={CONCERT_PASS_PRICE} now={concertPassPrice(earlyBird)} /> บาท
              </a>
              <p className="mt-3 text-sm font-bold text-[#FFE28A] sm:text-lg">
                👑 หรืออัปเกรดเป็น <span className="font-black text-white">VIP TABLE</span> <EarlyBirdPrice list={VIP_TABLE_PRICE} now={vipTablePrice(earlyBird)} /> บาท/โต๊ะ (6 ที่นั่ง)
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-center text-xs font-medium text-white/80 sm:text-sm">
                ภาพบรรยากาศเป็นภาพประกอบ รายชื่อศิลปินและเวลาอาจมีการเปลี่ยนแปลง ติดตามประกาศทางการของงาน
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
