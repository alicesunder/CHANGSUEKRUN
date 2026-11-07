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
    <div className="relative overflow-hidden ds-card rounded-[28px]! bg-[#EFE6FC]">
      {/* ---------- banner: dusk beach scene, text on the left, characters on the right ---------- */}
      <div className="relative overflow-hidden">
        <img
          src="/images/contest/vet-banner.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[78%_center] md:object-[center_center]"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#2A1450]/55 via-[#2A1450]/10 to-transparent" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#EFE6FC]" />

        <div className="relative grid grid-cols-1 items-end gap-0 px-4 pt-6 sm:px-8 sm:pt-8 md:grid-cols-12 lg:px-10">
          <div className="order-2 pb-14 md:order-1 md:col-span-6 md:pb-16 lg:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFC928] to-[#FFE268] px-4 py-1.5 text-xs sm:text-base font-extrabold text-[#2A1450] shadow-md">
              <PawPrint className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /> บริการพิเศษสำหรับคู่วิ่ง Dog Run
            </span>
            <h2 id="dog-health-heading" className="mt-3 font-hero text-[2.6rem] leading-[1.15] font-bold text-white drop-shadow-[0_4px_10px_rgba(20,8,38,0.55)] sm:text-6xl lg:text-7xl">
              ตรวจสุขภาพสุนัข
            </h2>
            <div className="relative mt-1.5 inline-flex items-center">
              <PawPrint aria-hidden="true" className="mr-2 h-8 w-8 shrink-0 -rotate-12 text-[#FFC928] drop-shadow sm:h-11 sm:w-11" />
              <span className="inline-block -skew-x-6 rounded-xl bg-gradient-to-r from-[#FFC928] via-[#FFE268] to-[#FFC928] px-5 py-1 shadow-[0_10px_22px_-8px_rgba(255,179,0,0.95)] sm:px-8 sm:py-1.5">
                <span className="block skew-x-6 font-hero text-3xl font-bold text-[#2A1450] sm:text-5xl lg:text-6xl">ไม่มีค่าใช้จ่าย</span>
              </span>
            </div>
            <p className="mt-4 max-w-lg text-sm font-semibold leading-relaxed text-white sm:text-lg">
              พาน้องหมามาให้คุณหมอตรวจสุขภาพ ไม่ต้องเสียค่าใช้จ่ายเพิ่ม
            </p>
          </div>

          <motion.div
            className="relative order-1 mx-auto w-full max-w-[470px] md:order-2 md:col-span-6 md:max-w-none md:translate-y-8 lg:translate-y-10"
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
            {/* speech bubble */}
            <motion.span
              aria-hidden="true"
              animate={{ y: [0, -6, 0], rotate: [-6, -1, -6] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-2 right-0 sm:right-2"
            >
              <span className="relative block rounded-[28px] bg-gradient-to-b from-[#FFE268] to-[#FFB300] px-6 py-2 font-hero text-3xl font-black text-[#2A1450] shadow-[0_12px_22px_-8px_rgba(255,179,0,0.85)] ring-4 ring-white/70 sm:px-8 sm:text-5xl">
                ฟรี!
                <span className="absolute -bottom-2 left-6 h-5 w-5 rotate-45 bg-[#FFB300] ring-white/70" />
              </span>
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* ---------- body ---------- */}
      <div className="relative z-10 -mt-8 px-3 pb-2 sm:px-5 lg:px-6">
        {/* facts */}
        <ul className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="รายละเอียดการตรวจสุขภาพสุนัข">
          {FACTS.map((f) => (
            <li
              key={f.label}
              className={`ds-card flex flex-col items-center gap-1 p-2.5 text-center sm:flex-row sm:gap-5 sm:p-5 sm:text-left ${f.free ? 'bg-gradient-to-r from-white to-[#E6FBF1]' : 'bg-gradient-to-r from-white to-[#F6F1FD]'}`}
            >
              <span className={`flex h-10 w-10 sm:h-[72px] sm:w-[72px] shrink-0 items-center justify-center rounded-full shadow-inner ${f.free ? 'bg-gradient-to-b from-[#D1FAE5] to-[#A7F3D0] text-[#047857]' : 'bg-gradient-to-b from-[#F1EAFD] to-[#DDD0F7] text-[#6D28D9]'}`} aria-hidden="true">
                <f.icon className="h-5 w-5 sm:h-9 sm:w-9" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] sm:text-lg font-extrabold text-[#2A1450]">{f.label}</span>
                <span className={`block text-[14px] sm:text-[2rem] font-black leading-tight ${f.free ? 'text-[#047857]' : 'text-[#2A1450]'}`}>{f.big}</span>
                {f.small && <span className="block text-[11px] sm:text-lg font-bold text-[#4B2D78]">{f.small}</span>}
              </span>
            </li>
          ))}
        </ul>

        {/* who + where */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 md:grid-cols-5">
          <div className="ds-card relative overflow-hidden p-3.5 sm:p-6 md:col-span-3">
            <PawPrint aria-hidden="true" className="pointer-events-none absolute -bottom-3 right-6 h-20 w-20 rotate-12 text-[#7C3AED]/10" />
            <PawPrint aria-hidden="true" className="pointer-events-none absolute right-24 top-3 h-10 w-10 -rotate-12 text-[#7C3AED]/10" />
            <p className="relative flex items-center gap-2 text-lg font-extrabold text-[#2A1450] sm:text-2xl">
              <PawPrint className="h-6 w-6 text-[#2A1450]" aria-hidden="true" /> ใครใช้บริการได้
            </p>
            <div className="relative mt-3 flex flex-wrap gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4B5FD] bg-[#F1EAFD] px-4 py-2 text-sm font-black text-[#4B1FA8] sm:text-lg"><Users className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /> Dog Run 1K</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE9A6] px-4 py-2 text-sm font-black text-[#6B4A10] sm:text-lg"><Users className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /> Dog Run 4K</span>
            </div>
            <p className="relative mt-3 text-xs font-semibold text-[#4B2D78] sm:text-base">ผู้สมัครวิ่งทั้ง 2 ระยะนี้ พาน้องหมามาตรวจได้เลย</p>
          </div>
          <div className="ds-card relative flex items-center gap-3 overflow-hidden p-3.5 sm:gap-5 sm:p-6 md:col-span-2">
            <img
              src="/images/contest/vet-tent.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute bottom-0 right-0 h-full w-auto max-w-[70%] object-cover object-left opacity-70 [mask-image:linear-gradient(to_left,black_35%,transparent)]"
            />
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#F1EAFD] to-[#DDD0F7] text-[#6D28D9] sm:h-[72px] sm:w-[72px]" aria-hidden="true">
              <MapPin className="h-7 w-7 sm:h-9 sm:w-9" />
            </span>
            <p className="relative text-sm font-bold leading-snug text-[#2A1450] sm:text-lg">
              <span className="block text-lg font-black sm:text-2xl">จุดตรวจสุขภาพสุนัข</span>
              ภายในงาน <span className="text-[#4B1FA8]">ค่ายนเรศวร ชะอำ-หัวหิน</span>
            </p>
          </div>
        </div>

        {/* how */}
        <div className="ds-card relative mt-6 p-3 pt-6 sm:mt-7 sm:p-5 sm:pt-8">
          <p className="absolute -top-4 left-0 inline-flex items-center gap-2 rounded-r-full rounded-tl-2xl bg-gradient-to-r from-[#2A1450] to-[#4B1FA8] py-2 pl-4 pr-8 text-base font-extrabold text-white shadow-md sm:text-2xl">
            <Stethoscope className="h-5 w-5 text-[#FFC928] sm:h-7 sm:w-7" aria-hidden="true" /> วิธีใช้บริการ 3 ขั้นตอน
          </p>
          <ol className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <li className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#F1EAFD] to-[#F8F4FE] p-2.5 sm:p-4">
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white to-[#E9DFFA] text-[#6D28D9] shadow-sm sm:h-16 sm:w-16" aria-hidden="true">
                    <s.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFB300] text-xs font-black text-[#2A1450] ring-2 ring-white sm:h-7 sm:w-7 sm:text-sm">{s.n}</span>
                  </span>
                  <span className="text-xs font-extrabold leading-snug text-[#2A1450] sm:text-base">{s.text}</span>
                </li>
                {i < STEPS.length - 1 && <ChevronRight className="hidden h-8 w-8 self-center text-[#FFB300] md:block" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </ol>
        </div>
      </div>

      {/* ---------- partner on a purple wave ---------- */}
      <div className="relative mt-2 overflow-hidden bg-gradient-to-b from-[#EFE6FC] via-[#B79CF0] to-[#4B1FA8] px-3 pb-8 pt-8 sm:px-5 sm:pb-10">
        <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full sm:h-20" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0 70 C 240 10, 520 120, 820 60 S 1280 10, 1440 70 L1440 120 L0 120 Z" fill="#2A1450" opacity=".85" />
          <path d="M0 70 C 240 10, 520 120, 820 60 S 1280 10, 1440 70" fill="none" stroke="#FFC928" strokeWidth="3" />
          <path d="M0 84 C 260 30, 540 130, 840 76 S 1290 28, 1440 86" fill="none" stroke="#FFE268" strokeWidth="1.5" opacity=".6" />
        </svg>
        <PawPrint aria-hidden="true" className="pointer-events-none absolute left-6 top-6 h-12 w-12 -rotate-12 text-white/30" />
        <PawPrint aria-hidden="true" className="pointer-events-none absolute right-8 bottom-16 h-10 w-10 rotate-12 text-white/25" />
        <div className="relative mx-auto max-w-4xl rounded-[22px] bg-white/85 p-3 shadow-[0_14px_30px_-14px_rgba(42,20,80,0.55)] ring-1 ring-white/70 backdrop-blur sm:p-4">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#4B1FA8] px-3.5 py-1.5 text-[11px] font-extrabold text-white sm:text-sm">ตรวจสุขภาพโดย</span>
              <div className="min-w-0">
                <p className="text-lg font-black leading-tight text-[#2A1450] sm:text-3xl">รพ.สัตว์ทองหล่อ</p>
                <p className="text-xs font-bold text-[#047857] sm:text-base">Thonglor Pet Hospital</p>
              </div>
            </div>
            <span aria-hidden="true" className="hidden h-14 w-px bg-[#D9C9EF] sm:block" />
            <img
              src="/images/sponsors/thonglor-pet-hospital.webp"
              alt="Thonglor Pet Hospital รพ.สัตว์ทองหล่อ"
              loading="lazy"
              decoding="async"
              className="h-[64px] w-auto shrink-0 object-contain sm:h-[92px]"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);
