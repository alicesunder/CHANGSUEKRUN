import React from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, Stethoscope, Ticket } from 'lucide-react';

const POINTS = [
  { icon: Ticket, title: 'สำหรับใคร', text: 'ผู้สมัครวิ่ง Dog Run ทั้ง 2 ระยะ (1K และ 3.8K) พาน้องหมามาตรวจได้เลย' },
  { icon: Clock, title: 'เวลา', text: 'วันเสาร์ที่ 9 ม.ค. 2570 เวลา 09.00–14.00 น.' },
  { icon: MapPin, title: 'สถานที่', text: 'จุดตรวจสุขภาพสุนัข ภายในงาน ค่ายนเรศวร ชะอำ-หัวหิน' },
];

/** Free vet check by Thonglor Pet Hospital for the Dog Run (1K / 3.8K) runners, 09.00–14.00 on run day. */
export const DogHealthCheckSection: React.FC = () => (
  <section id="dog-health-check" aria-labelledby="dog-health-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="relative sticker overflow-hidden bg-gradient-to-br from-[#E8FFF3] via-white to-[#EAF6FF]">
      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 p-4 sm:p-6 items-center">
        <motion.div
          className="md:col-span-5 relative mx-auto w-full max-w-[420px]"
          initial={{ opacity: 0, y: 14, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: -1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
        >
          <div className="rounded-[24px] bg-white border-[3px] border-[var(--ink)] shadow-[5px_6px_0_var(--ink)] p-2.5">
            <img
              src="/images/contest/healthy.webp"
              alt="สัตวแพทย์ใช้หูฟังตรวจหัวใจน้องหมาชิบะที่เจ้าของกอดไว้อย่างอารมณ์ดี"
              loading="lazy"
              decoding="async"
              className="block w-full h-auto rounded-[14px]"
            />
          </div>
          <motion.span
            aria-hidden="true"
            animate={{ y: [0, -6, 0], rotate: [-8, 8, -8] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-4 -right-2 px-3 py-1.5 rounded-full bg-[#FFC928] border-[3px] border-[var(--ink)] text-sm font-black text-[var(--ink)] shadow-[0_3px_0_var(--ink)]"
          >
            ฟรี!
          </motion.span>
        </motion.div>

        <div className="md:col-span-7 space-y-3.5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-[var(--ink)] text-xs font-extrabold text-[#047857]">
              <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" /> บริการพิเศษสำหรับคู่วิ่ง Dog Run
            </span>
            <h2 id="dog-health-heading" className="squiggle mt-2 font-hero text-2xl sm:text-3xl font-bold text-[var(--ink)] leading-[1.35]">
              ตรวจสุขภาพสุนัข <span className="text-[#10B981]">ไม่มีค่าใช้จ่าย</span>
            </h2>
            <p className="mt-1 text-sm sm:text-base font-semibold text-[#4B2D78] leading-relaxed">
              พาน้องหมามาให้คุณหมอตรวจสุขภาพฟรี โดยทีมสัตวแพทย์จาก <strong className="text-[#047857]">รพ.สัตว์ทองหล่อ</strong>
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-2.5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex items-start gap-3 rounded-2xl bg-white/90 border-2 border-[var(--ink)]/15 p-3">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-[#D1FAE5] border-2 border-[var(--ink)] flex items-center justify-center" aria-hidden="true">
                  <p.icon className="w-5 h-5 text-[#047857]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-[var(--ink)]">{p.title}</span>
                  <span className="block text-xs sm:text-sm font-semibold text-[#4B2D78] leading-snug">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 rounded-2xl bg-white border-2 border-[var(--ink)]/15 px-3 py-2">
            <img src="/images/sponsors/thonglor-pet-hospital.webp" alt="Thonglor Pet Hospital" loading="lazy" decoding="async" className="h-10 w-auto object-contain" />
            <span className="text-xs font-bold text-[#6B5A85]">ตรวจโดย รพ.สัตว์ทองหล่อ (Thonglor Pet Hospital)</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);
