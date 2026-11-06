import React from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Clock, MapPin, PawPrint, Stethoscope, Ticket } from 'lucide-react';

/** The three facts people look for first, as big tiles. */
const FACTS = [
  { icon: CalendarDays, label: 'วัน', big: 'เสาร์ 9 ม.ค.', small: '2570', color: '#7C3AED', tint: '#F3EEFF' },
  { icon: Clock, label: 'เวลา', big: '09.00–14.00', small: 'น.', color: '#0369A1', tint: '#E6F4FF' },
  { icon: Ticket, label: 'ค่าใช้จ่าย', big: 'ฟรี', small: 'ไม่มีค่าใช้จ่าย', color: '#047857', tint: '#E3FBEF' },
];

const STEPS = [
  { n: 1, emoji: '🎟️', text: 'ซื้อบัตร Dog Run (1K หรือ 4K)' },
  { n: 2, emoji: '🐶', text: 'พาน้องหมามาที่จุดตรวจสุขภาพ ระหว่าง 09.00–14.00 น.' },
  { n: 3, emoji: '🩺', text: 'ทีมสัตวแพทย์ตรวจสุขภาพน้องหมาให้โดยไม่มีค่าใช้จ่าย' },
];

/** Free vet check by Thonglor Pet Hospital for the Dog Run (1K / 4K) runners, 09.00–14.00 on run day. */
export const DogHealthCheckSection: React.FC = () => (
  <section id="dog-health-check" aria-labelledby="dog-health-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="relative sticker overflow-hidden bg-gradient-to-br from-[#E8FFF3] via-white to-[#EAF6FF]">
      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 p-4 sm:p-6 items-start">
        {/* left: picture + the hospital, big */}
        <motion.div
          className="md:col-span-5 mx-auto w-full max-w-[440px] space-y-4"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
        >
          <div className="relative">
            <div className="relative">
              <img
                src="/images/contest/healthcheck-2027.webp"
                alt="สัตวแพทย์ใช้หูฟังตรวจหัวใจน้องชิบะบนโต๊ะตรวจ เจ้าของกอดให้อุ่นใจ ผู้ช่วยตรวจฟันน้องโกลเด้น และน้องบีเกิ้ลยืนชั่งน้ำหนักข้างแบบตรวจสุขภาพ"
                loading="lazy"
                decoding="async"
                className="block w-full h-auto drop-shadow-[0_10px_14px_rgba(42,20,80,0.28)]"
              />
            </div>
            <motion.span
              aria-hidden="true"
              animate={{ y: [0, -6, 0], rotate: [-8, 8, -8] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-2 px-3.5 py-1.5 rounded-full bg-[#FFC928] border-[3px] border-[var(--ink)] text-base font-black text-[var(--ink)] shadow-[0_3px_0_var(--ink)]"
            >
              ฟรี!
            </motion.span>
          </div>

          {/* hospital: a proper card with a large logo */}
          <div className="rounded-[22px] bg-white border-[3px] border-[var(--ink)] shadow-[0_5px_0_var(--ink)] p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <img
              src="/images/sponsors/thonglor-pet-hospital.webp"
              alt="Thonglor Pet Hospital รพ.สัตว์ทองหล่อ"
              loading="lazy"
              decoding="async"
              className="h-[84px] sm:h-[104px] w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-[#6B5A85]">ตรวจสุขภาพโดย</p>
              <p className="text-lg sm:text-xl font-black leading-tight text-[var(--ink)]">รพ.สัตว์ทองหล่อ</p>
              <p className="text-xs font-bold text-[#047857]">Thonglor Pet Hospital</p>
            </div>
          </div>
        </motion.div>

        {/* right: what, who, when, how */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-[var(--ink)] text-xs font-extrabold text-[#047857]">
              <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" /> บริการพิเศษสำหรับคู่วิ่ง Dog Run
            </span>
            <h2 id="dog-health-heading" className="squiggle mt-2 font-hero text-2xl sm:text-3xl font-bold text-[var(--ink)] leading-[1.35]">
              ตรวจสุขภาพสุนัข <span className="text-[#10B981]">ไม่มีค่าใช้จ่าย</span>
            </h2>
            <p className="mt-1 text-sm sm:text-base font-semibold text-[#4B2D78] leading-relaxed">พาน้องหมามาให้คุณหมอตรวจสุขภาพ ไม่ต้องเสียค่าใช้จ่ายเพิ่ม</p>
          </div>

          {/* who */}
          <div className="rounded-2xl bg-[#FFF8E1] border-2 border-[var(--ink)]/20 p-3 sm:p-4">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#8A5A00]">
              <PawPrint className="w-4 h-4" aria-hidden="true" /> ใครใช้บริการได้
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-3.5 py-2 rounded-xl bg-white border-2 border-[var(--ink)] text-sm font-black text-[var(--ink)] shadow-[0_3px_0_var(--ink)]">🐕 Dog Run 1K</span>
              <span className="px-3.5 py-2 rounded-xl bg-white border-2 border-[var(--ink)] text-sm font-black text-[var(--ink)] shadow-[0_3px_0_var(--ink)]">🐕 Dog Run 4K</span>
            </div>
            <p className="mt-2 text-xs sm:text-sm font-semibold text-[#6B4A10]">ผู้สมัครวิ่งทั้ง 2 ระยะนี้ พาน้องหมามาตรวจได้เลย</p>
          </div>

          {/* when / cost */}
          <ul className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="รายละเอียดการตรวจสุขภาพสุนัข">
            {FACTS.map((f) => (
              <li key={f.label} className="rounded-2xl border-2 border-[var(--ink)]/20 p-2.5 sm:p-3 text-center" style={{ background: f.tint }}>
                <f.icon className="w-5 h-5 mx-auto" style={{ color: f.color }} aria-hidden="true" />
                <p className="mt-1 text-[11px] font-extrabold text-[#6B5A85]">{f.label}</p>
                <p className="text-[15px] sm:text-lg font-black leading-tight" style={{ color: f.color }}>{f.big}</p>
                <p className="text-[11px] sm:text-xs font-bold text-[#4B2D78]">{f.small}</p>
              </li>
            ))}
          </ul>

          {/* where */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/90 border-2 border-[var(--ink)]/15 p-3">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-[#D1FAE5] border-2 border-[var(--ink)] flex items-center justify-center" aria-hidden="true">
              <MapPin className="w-5 h-5 text-[#047857]" />
            </span>
            <p className="text-sm font-bold text-[var(--ink)] leading-snug">
              จุดตรวจสุขภาพสุนัข ภายในงาน <span className="text-[#047857]">ค่ายนเรศวร ชะอำ-หัวหิน</span>
            </p>
          </div>

          {/* how */}
          <div>
            <p className="text-xs font-extrabold text-[#6B5A85] mb-1.5">วิธีใช้บริการ 3 ขั้นตอน</p>
            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {STEPS.map((s) => (
                <li key={s.n} className="flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1.5 rounded-2xl bg-white border-2 border-[var(--ink)]/15 p-2.5 sm:p-3">
                  <span className="w-8 h-8 shrink-0 rounded-full bg-[#10B981] text-white text-sm font-black flex items-center justify-center border-2 border-[var(--ink)]" aria-hidden="true">
                    {s.n}
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-[var(--ink)] leading-snug">
                    <span aria-hidden="true" className="mr-1">{s.emoji}</span>
                    {s.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  </section>
);
