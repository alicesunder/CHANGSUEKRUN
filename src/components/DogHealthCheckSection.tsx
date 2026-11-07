import React from 'react';
import { motion } from 'motion/react';
import { CalendarDays, ChevronRight, Clock, MapPin, PawPrint, Stethoscope, Tag, Ticket, Users } from 'lucide-react';

/** The three facts people look for first, as big tiles. */
const FACTS = [
  { icon: CalendarDays, label: 'วัน', big: 'เสาร์ 9 ม.ค.', small: '2570', free: false },
  { icon: Clock, label: 'เวลา', big: '09.00–14.00 น.', small: '', free: false },
  { icon: Tag, label: 'ค่าใช้จ่าย', big: 'ฟรี', small: 'ไม่มีค่าใช้จ่าย', free: true },
];

const STEPS = [
  { n: 1, icon: Ticket, text: 'ซื้อบัตร Dog Run (1K หรือ 4K)' },
  { n: 2, icon: PawPrint, text: 'พาน้องหมามาที่จุดตรวจสุขภาพ ระหว่าง 09.00–14.00 น.' },
  { n: 3, icon: Stethoscope, text: 'ทีมสัตวแพทย์ตรวจสุขภาพน้องหมาให้โดยไม่มีค่าใช้จ่าย' },
];

/** Free vet check by Thonglor Pet Hospital for the Dog Run (1K / 4K) runners, 09.00–14.00 on run day. */
export const DogHealthCheckSection: React.FC = () => (
  <section id="dog-health-check" aria-labelledby="dog-health-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="relative overflow-hidden ds-card rounded-[28px]! bg-gradient-to-b from-[#EFE6FC] via-[#F6F1FD] to-[#FBF8FF]">
      {/* ---------- purple banner ---------- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2A1450] via-[#4B1FA8] to-[#7C3AED] px-4 pt-6 sm:px-8 sm:pt-8 lg:px-10">
        <span aria-hidden="true" className="pointer-events-none absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-[#C4B5FD]/25 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-[#FFC928]/20 blur-3xl" />
        {/* gold swooshes */}
        <svg aria-hidden="true" className="pointer-events-none absolute -left-10 top-0 h-full w-72 opacity-70" viewBox="0 0 280 300" preserveAspectRatio="none">
          <path d="M0 40 C 80 10, 150 60, 280 0" fill="none" stroke="#FFC928" strokeWidth="3" strokeLinecap="round" />
          <path d="M0 70 C 90 40, 160 90, 280 30" fill="none" stroke="#FFE268" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
        </svg>

        <div className="relative grid grid-cols-1 items-end gap-2 md:grid-cols-12 md:gap-4">
          <div className="order-2 pb-6 md:order-1 md:col-span-6 md:pb-9 lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFC928] to-[#FFE268] px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-[#2A1450] shadow-md">
              <PawPrint className="h-4 w-4" aria-hidden="true" /> บริการพิเศษสำหรับคู่วิ่ง Dog Run
            </span>
            <h2 id="dog-health-heading" className="mt-3 font-hero text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.2] text-white drop-shadow-[0_3px_8px_rgba(20,8,38,0.45)]">
              ตรวจสุขภาพสุนัข
            </h2>
            <span className="relative mt-2 inline-block -skew-x-6 rounded-md bg-gradient-to-r from-[#FFC928] via-[#FFE268] to-[#FFC928] px-5 py-1 shadow-[0_8px_18px_-8px_rgba(255,179,0,0.9)]">
              <span className="block skew-x-6 font-hero text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2A1450]">ไม่มีค่าใช้จ่าย</span>
            </span>
            <p className="mt-4 max-w-md text-sm sm:text-base font-semibold leading-relaxed text-white/90">
              พาน้องหมามาให้คุณหมอตรวจสุขภาพ ไม่ต้องเสียค่าใช้จ่ายเพิ่ม
            </p>
          </div>

          <motion.div
            className="relative order-1 mx-auto w-full max-w-[460px] md:order-2 md:col-span-6 md:max-w-none lg:col-span-5"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          >
            <img
              src="/images/contest/vet-group.webp"
              alt="สัตวแพทย์ใช้หูฟังตรวจหัวใจน้องชิบะ ผู้ช่วยในหมวกม่วงกอดน้องชิบะ น้องโกลเด้นและน้องบีเกิ้ลนั่งรอตรวจ มีโล่เครื่องหมายกากบาทสีเขียวและคลิปบอร์ดรายการตรวจ"
              loading="lazy"
              decoding="async"
              className="mx-auto block h-auto w-full drop-shadow-[0_14px_18px_rgba(10,4,26,0.45)]"
            />
            <motion.span
              aria-hidden="true"
              animate={{ y: [0, -6, 0], rotate: [-8, -2, -8] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-1 right-0 rounded-[999px] rounded-bl-md bg-gradient-to-b from-[#FFE268] to-[#FFB300] px-5 py-2 text-2xl sm:text-3xl font-black text-[#2A1450] shadow-[0_10px_20px_-6px_rgba(255,179,0,0.8)] ring-4 ring-white/70"
            >
              ฟรี!
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* ---------- body ---------- */}
      <div className="relative p-3 sm:p-5 lg:p-6">
        {/* facts */}
        <ul className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="รายละเอียดการตรวจสุขภาพสุนัข">
          {FACTS.map((f) => (
            <li
              key={f.label}
              className={`ds-card flex flex-col items-center gap-1 p-2.5 text-center sm:flex-row sm:gap-4 sm:p-4 sm:text-left ${f.free ? 'bg-gradient-to-r from-white to-[#E6FBF1]' : ''}`}
            >
              <span className={`flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full ${f.free ? 'bg-[#D1FAE5] text-[#047857]' : 'bg-[#F1EAFD] text-[#7C3AED]'}`} aria-hidden="true">
                <f.icon className="h-5 w-5 sm:h-7 sm:w-7" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] sm:text-sm font-extrabold text-[#766A85]">{f.label}</span>
                <span className={`block text-[14px] sm:text-2xl font-black leading-tight ${f.free ? 'text-[#047857]' : 'text-[#2A1450]'}`}>{f.big}</span>
                {f.small && <span className="block text-[11px] sm:text-sm font-bold text-[#4B2D78]">{f.small}</span>}
              </span>
            </li>
          ))}
        </ul>

        {/* who + where */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="ds-card p-3.5 sm:p-5 md:col-span-3">
            <p className="flex items-center gap-2 text-base font-extrabold text-[#2A1450]">
              <Users className="h-5 w-5 text-[#7C3AED]" aria-hidden="true" /> ใครใช้บริการได้
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4B5FD] bg-[#F1EAFD] px-4 py-1.5 text-sm font-black text-[#4B1FA8]"><PawPrint className="h-4 w-4" aria-hidden="true" /> Dog Run 1K</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE9A6] px-4 py-1.5 text-sm font-black text-[#6B4A10]"><PawPrint className="h-4 w-4" aria-hidden="true" /> Dog Run 4K</span>
            </div>
            <p className="mt-2.5 text-xs sm:text-sm font-semibold text-[#4B2D78]">ผู้สมัครวิ่งทั้ง 2 ระยะนี้ พาน้องหมามาตรวจได้เลย</p>
          </div>
          <div className="ds-card flex items-center gap-3 p-3.5 sm:gap-4 sm:p-5 md:col-span-2">
            <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-[#F1EAFD] text-[#7C3AED]" aria-hidden="true">
              <MapPin className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <p className="text-sm sm:text-base font-bold leading-snug text-[#2A1450]">
              <span className="block text-base sm:text-lg font-black">จุดตรวจสุขภาพสุนัข</span>
              ภายในงาน <span className="text-[#4B1FA8]">ค่ายนเรศวร ชะอำ-หัวหิน</span>
            </p>
          </div>
        </div>

        {/* how */}
        <div className="ds-card relative mt-4 p-3 pt-6 sm:p-4 sm:pt-7">
          <p className="absolute -top-3 left-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2A1450] to-[#4B1FA8] px-4 py-1.5 text-sm sm:text-base font-extrabold text-white shadow-md">
            <Stethoscope className="h-4 w-4 text-[#FFC928]" aria-hidden="true" /> วิธีใช้บริการ 3 ขั้นตอน
          </p>
          <ol className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <li className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#F1EAFD] to-[#F8F4FE] p-2.5 sm:p-3.5">
                  <span className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#7C3AED] shadow-sm" aria-hidden="true">
                    <s.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFC928] text-xs font-black text-[#2A1450] ring-2 ring-white">{s.n}</span>
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold leading-snug text-[#2A1450]">{s.text}</span>
                </li>
                {i < STEPS.length - 1 && <ChevronRight className="hidden h-7 w-7 self-center text-[#FFB300] md:block" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </ol>
        </div>

        {/* partner */}
        <div className="relative mt-4 overflow-hidden rounded-[22px] bg-gradient-to-r from-[#EDE3FB] via-white to-[#EDE3FB] p-3 sm:p-4 ring-1 ring-[#D9C9EF]">
          <PawPrint aria-hidden="true" className="pointer-events-none absolute -left-2 bottom-0 h-16 w-16 -rotate-12 text-[#7C3AED]/10" />
          <PawPrint aria-hidden="true" className="pointer-events-none absolute -right-2 top-0 h-16 w-16 rotate-12 text-[#7C3AED]/10" />
          <div className="relative flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#4B1FA8] px-3 py-1 text-[11px] sm:text-xs font-extrabold text-white">ตรวจสุขภาพโดย</span>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-black leading-tight text-[#2A1450]">รพ.สัตว์ทองหล่อ</p>
                <p className="text-xs sm:text-sm font-bold text-[#047857]">Thonglor Pet Hospital</p>
              </div>
            </div>
            <span aria-hidden="true" className="hidden h-12 w-px bg-[#D9C9EF] sm:block" />
            <img
              src="/images/sponsors/thonglor-pet-hospital.webp"
              alt="Thonglor Pet Hospital รพ.สัตว์ทองหล่อ"
              loading="lazy"
              decoding="async"
              className="h-[64px] sm:h-[88px] w-auto shrink-0 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);
