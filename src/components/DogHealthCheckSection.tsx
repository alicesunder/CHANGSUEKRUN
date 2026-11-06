import React from 'react';
import { motion } from 'motion/react';
import { CalendarDays, ChevronRight, Clock, MapPin, PawPrint, Stethoscope, Ticket, Users } from 'lucide-react';

/** The three facts people look for first, as big tiles. */
const FACTS = [
  { icon: CalendarDays, label: 'วัน', big: 'เสาร์ 9 ม.ค.', small: '2570', free: false },
  { icon: Clock, label: 'เวลา', big: '09.00–14.00', small: 'น.', free: false },
  { icon: PawPrint, label: 'ค่าใช้จ่าย', big: 'ฟรี', small: 'ไม่มีค่าใช้จ่าย', free: true },
];

const STEPS = [
  { n: 1, icon: Ticket, text: 'ซื้อบัตร Dog Run (1K หรือ 4K)' },
  { n: 2, icon: PawPrint, text: 'พาน้องหมามาที่จุดตรวจสุขภาพ ระหว่าง 09.00–14.00 น.' },
  { n: 3, icon: Stethoscope, text: 'ทีมสัตวแพทย์ตรวจสุขภาพน้องหมาให้โดยไม่มีค่าใช้จ่าย' },
];

/** Free vet check by Thonglor Pet Hospital for the Dog Run (1K / 4K) runners, 09.00–14.00 on run day. */
export const DogHealthCheckSection: React.FC = () => (
  <section id="dog-health-check" aria-labelledby="dog-health-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="relative overflow-hidden ds-card rounded-[28px]! bg-gradient-to-br from-[#F1EAFD] via-[#FBF8FF] to-[#FFF6E0] p-4 sm:p-6 lg:p-8">
      <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#FFC928]/25 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-[#7C3AED]/15 blur-3xl" />

      {/* hero: headline + illustration */}
      <div className="relative grid grid-cols-1 md:grid-cols-12 items-center gap-4 md:gap-6">
        <div className="md:col-span-7 order-2 md:order-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1C2] px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-[#6B4A10] shadow-sm">
            <PawPrint className="h-4 w-4" aria-hidden="true" /> บริการพิเศษสำหรับคู่วิ่ง Dog Run
          </span>
          <h2 id="dog-health-heading" className="mt-3 font-hero text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.25] text-[#2A1450]">
            ตรวจสุขภาพสุนัข
            <span className="mt-1 block w-fit rounded-xl bg-gradient-to-r from-[#BFF3DA] to-[#E6FBF1] px-3 text-[#047857]">ไม่มีค่าใช้จ่าย</span>
          </h2>
          <p className="mt-3 max-w-md text-sm sm:text-base font-semibold leading-relaxed text-[#4B2D78]">
            พาน้องหมามาให้คุณหมอตรวจสุขภาพ ไม่ต้องเสียค่าใช้จ่ายเพิ่ม
          </p>
        </div>

        <motion.div
          className="md:col-span-5 order-1 md:order-2 relative mx-auto w-full max-w-[400px]"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
        >
          <img
            src="/images/contest/healthcheck-2027.webp"
            alt="สัตวแพทย์ใช้หูฟังตรวจหัวใจน้องชิบะบนโต๊ะตรวจ เจ้าของกอดให้อุ่นใจ ผู้ช่วยตรวจฟันน้องโกลเด้น และน้องบีเกิ้ลยืนชั่งน้ำหนักข้างแบบตรวจสุขภาพ"
            loading="lazy"
            decoding="async"
            className="block h-auto w-full drop-shadow-[0_12px_16px_rgba(42,20,80,0.28)]"
          />
          <motion.span
            aria-hidden="true"
            animate={{ y: [0, -6, 0], rotate: [-8, 8, -8] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-3 -right-1 sm:right-2 flex h-[72px] w-[72px] sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFB300] text-xl sm:text-2xl font-black text-[#2A1450] shadow-[0_8px_18px_-6px_rgba(255,179,0,0.8)] ring-4 ring-white/80"
          >
            ฟรี!
          </motion.span>
        </motion.div>
      </div>

      {/* facts */}
      <ul className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3" aria-label="รายละเอียดการตรวจสุขภาพสุนัข">
        {FACTS.map((f) => (
          <li key={f.label} className="ds-card flex flex-col items-center gap-1 p-2.5 text-center sm:flex-row sm:gap-3 sm:p-4 sm:text-left">
            <span className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${f.free ? 'bg-[#D1FAE5] text-[#047857]' : 'bg-[#F1EAFD] text-[#7C3AED]'}`} aria-hidden="true">
              <f.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] sm:text-xs font-extrabold text-[#766A85]">{f.label}</span>
              <span className={`block text-[14px] sm:text-xl font-black leading-tight ${f.free ? 'text-[#047857]' : 'text-[#2A1450]'}`}>{f.big}</span>
              <span className="block text-[11px] sm:text-xs font-bold text-[#4B2D78]">{f.small}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* who + where */}
      <div className="relative mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="ds-card p-3.5 sm:p-4">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#4B1FA8]">
            <Users className="h-4 w-4" aria-hidden="true" /> ใครใช้บริการได้
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EAFD] px-3.5 py-1.5 text-sm font-black text-[#4B1FA8]"><PawPrint className="h-4 w-4" aria-hidden="true" /> Dog Run 1K</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1C2] px-3.5 py-1.5 text-sm font-black text-[#6B4A10]"><PawPrint className="h-4 w-4" aria-hidden="true" /> Dog Run 4K</span>
          </div>
          <p className="mt-2 text-xs sm:text-sm font-semibold text-[#4B2D78]">ผู้สมัครวิ่งทั้ง 2 ระยะนี้ พาน้องหมามาตรวจได้เลย</p>
        </div>
        <div className="ds-card flex items-center gap-3 p-3.5 sm:p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1EAFD] text-[#7C3AED]" aria-hidden="true">
            <MapPin className="h-6 w-6" />
          </span>
          <p className="text-sm sm:text-base font-bold leading-snug text-[#2A1450]">
            จุดตรวจสุขภาพสุนัข ภายในงาน <span className="text-[#4B1FA8]">ค่ายนเรศวร ชะอำ-หัวหิน</span>
          </p>
        </div>
      </div>

      {/* how */}
      <div className="ds-card relative mt-3 p-3.5 sm:p-4">
        <p className="mb-2 text-sm font-extrabold text-[#4B1FA8]">วิธีใช้บริการ 3 ขั้นตอน</p>
        <ol className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <li className="flex items-center gap-3 rounded-2xl bg-[#FBF8FF] p-2.5 sm:p-3">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F1EAFD] text-[#7C3AED]" aria-hidden="true">
                  <s.icon className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFC928] text-[11px] font-black text-[#2A1450] ring-2 ring-white">{s.n}</span>
                </span>
                <span className="text-xs sm:text-sm font-bold leading-snug text-[#2A1450]">{s.text}</span>
              </li>
              {i < STEPS.length - 1 && <ChevronRight className="hidden h-6 w-6 self-center text-[#FFB300] md:block" aria-hidden="true" />}
            </React.Fragment>
          ))}
        </ol>
      </div>

      {/* partner */}
      <div className="ds-card relative mt-3 flex items-center justify-center gap-3 p-3 sm:gap-6 sm:p-4">
        <div className="min-w-0 text-right">
          <p className="text-[11px] sm:text-xs font-extrabold text-[#766A85]">ตรวจสุขภาพโดย</p>
          <p className="text-base sm:text-xl font-black leading-tight text-[#2A1450]">รพ.สัตว์ทองหล่อ</p>
          <p className="text-xs font-bold text-[#047857]">Thonglor Pet Hospital</p>
        </div>
        <span aria-hidden="true" className="h-12 w-px bg-[#D9C9EF]" />
        <img
          src="/images/sponsors/thonglor-pet-hospital.webp"
          alt="Thonglor Pet Hospital รพ.สัตว์ทองหล่อ"
          loading="lazy"
          decoding="async"
          className="h-[64px] sm:h-[88px] w-auto shrink-0 object-contain"
        />
      </div>
    </div>
  </section>
);
