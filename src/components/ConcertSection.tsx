import React from 'react';
import { Music } from 'lucide-react';

const PHOTOS = [
  { src: '/images/concert/stage.webp', alt: 'เวทีคอนเสิร์ตยามเย็นพร้อมจอ LED และแสงสีม่วง มีผู้ชมถือโทรศัพท์ถ่ายภาพ', cap: 'เวทีกลางแจ้ง จอ LED และแสงสีตอนค่ำ' },
  { src: '/images/concert/crowd.webp', alt: 'ผู้ชมนั่งบนสนามหญ้าชมคอนเสิร์ตริมหาดตอนพลบค่ำ', cap: 'นั่งชิลล์ริมหาด ฟังดนตรีสดหลังจบการวิ่ง' },
];

/** Atmosphere photos of the evening concert, shown below the schedule & GPS section. */
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
            <h2 id="concert-heading" className="mt-3 font-hero text-3xl sm:text-4xl font-bold text-white">
              บรรยากาศคอนเสิร์ต
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-white/85">
              จบการวิ่งแล้วมาผ่อนคลายกับดนตรีสดริมหาด ทั้งครอบครัวและน้องสุนัข
            </p>
          </div>

          <ul className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {PHOTOS.map((p) => (
              <li key={p.src} className="rounded-3xl overflow-hidden bg-white/[0.07] border-2 border-[#FFC928]/35">
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
          <p className="mt-4 text-center text-xs font-medium text-white/70">
            ภาพบรรยากาศประกอบ รายชื่อศิลปินและการแสดงจะประกาศอีกครั้งผ่านช่องทางทางการ
          </p>
        </div>
      </div>
    </div>
  </section>
);
