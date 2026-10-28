import React from 'react';
import { motion } from 'motion/react';
import { Crown, Heart, Palette, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

const CRITERIA = [
  { label: 'ความคิดสร้างสรรค์', pts: 40, color: '#EC4899' },
  { label: 'เข้ากับธีมม่วง-ทอง', pts: 25, color: '#9333EA' },
  { label: 'น้องหมามีความสุข', pts: 20, color: '#10B981' },
  { label: 'ความเข้ากันของคู่หู', pts: 15, color: '#0EA5E9' },
];

const STEPS = [
  { emoji: '📝', title: 'ลงชื่อหน้างาน', text: 'ที่จุดลงทะเบียน ฟรี ไม่เสียเพิ่ม' },
  { emoji: '📸', title: 'โชว์ตัวบนเวที', text: 'เดินแฟชั่นโชว์คู่หู + ถ่ายภาพ' },
  { emoji: '⭐', title: 'กรรมการให้คะแนน', text: 'ตามเกณฑ์ 100 คะแนน' },
  { emoji: '🏆', title: 'ประกาศผล', text: 'ผู้ชนะขึ้นบอร์ดบนเว็บนี้' },
];

/** Costume contest for Dog Run pairs. Sits right above the souvenirs. Date/prizes are announced later. */
export const CostumeContestSection: React.FC = () => (
  <section id="costume-contest" aria-labelledby="costume-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div
      className="rounded-[36px] p-[3px]"
      style={{ background: 'linear-gradient(135deg, #FFC928 0%, #EC4899 35%, #9333EA 70%, #0EA5E9 100%)', boxShadow: '0 30px 60px -24px rgba(147, 51, 234, 0.55)' }}
    >
      <div className="relative overflow-hidden rounded-[33px] bg-gradient-to-br from-[#241047] via-[#341866] to-[#4A1F8F] text-white">
        <span aria-hidden="true" className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-[#FFC928]/20 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#EC4899]/25 blur-3xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-5 sm:p-8 items-center">
          {/* picture */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="lg:col-span-6 relative"
          >
            <div className="rounded-[28px] bg-white/95 p-3 sm:p-4 border-[3px] border-[#FFC928] shadow-[0_10px_0_#FFC928]">
              <img
                src="/images/costume/dog-squad.webp"
                alt="น้องสุนัข 8 ตัวแต่งชุดธีมม่วงทอง มีทั้งมงกุฎ หมวกพ่อมด เกราะอัศวิน และแว่นนักบิน"
                loading="lazy"
                decoding="async"
                className="block w-full h-auto"
              />
            </div>
            <motion.span
              aria-hidden="true"
              animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -left-2 sm:-left-4 w-14 h-14 rounded-full bg-[#FFC928] border-[3px] border-[#2A1450] flex items-center justify-center text-2xl shadow-[0_5px_0_#2A1450]"
            >
              👑
            </motion.span>
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="absolute -bottom-3 -right-1 sm:-right-3 w-12 h-12 rounded-full bg-[#EC4899] border-[3px] border-[#2A1450] flex items-center justify-center text-xl shadow-[0_5px_0_#2A1450]"
            >
              💜
            </motion.span>
          </motion.div>

          {/* text */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC928] text-[#2A1450] text-xs sm:text-sm font-extrabold px-3.5 py-1.5">
                <Sparkles className="w-4 h-4" aria-hidden="true" /> กิจกรรมพิเศษ · สำหรับคู่วิ่ง Dog Run
              </span>
              <h2 id="costume-heading" className="mt-3 font-hero text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-[1.25]">
                ประกวดแต่งตัว <span className="text-[#FFD84D]">น้องสุนัข &amp; เจ้าของ</span>
              </h2>
              <p className="mt-2 text-sm sm:text-base font-semibold text-white/90">
                แต่งชุดธีม <strong className="text-[#FFD84D]">ผจญภัยม่วง–ทอง</strong> จะเป็นฮีโร่ ช้างศึก พ่อมด เจ้าหญิง หรือนักบิน ก็ได้ทั้งนั้น! ให้น้องหมามีความสุขที่สุดคือชนะใจเรา
              </p>
            </div>

            <ol className="grid grid-cols-2 gap-2.5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-2xl bg-white/10 border border-white/20 p-3">
                  <span className="flex items-center gap-2 text-sm font-extrabold">
                    <span aria-hidden="true" className="text-xl">{s.emoji}</span>
                    <span><span className="text-[#FFD84D]">{i + 1}.</span> {s.title}</span>
                  </span>
                  <span className="block mt-0.5 text-xs font-semibold text-white/80">{s.text}</span>
                </li>
              ))}
            </ol>

            <div className="rounded-2xl bg-white/10 border border-white/20 p-3.5">
              <p className="flex items-center gap-2 text-sm font-extrabold mb-2">
                <Palette className="w-4 h-4 text-[#FFD84D]" aria-hidden="true" /> เกณฑ์ให้คะแนน (เต็ม 100)
              </p>
              <ul className="space-y-1.5">
                {CRITERIA.map((c) => (
                  <li key={c.label} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
                    <span className="w-28 sm:w-40 shrink-0">{c.label}</span>
                    <span className="flex-1 h-3 rounded-full bg-black/25 overflow-hidden">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: c.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${c.pts}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                      />
                    </span>
                    <span className="tabular-nums w-8 text-right text-[#FFD84D]">{c.pts}</span>
                  </li>
                ))}
              </ul>
            </div>

            <details className="group rounded-2xl bg-white/10 border border-white/20">
              <summary className="list-none cursor-pointer min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-sm font-extrabold">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#10B981]" aria-hidden="true" /> กติกา &amp; ความปลอดภัยของน้องหมา</span>
                <span className="text-[#FFD84D] group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
              </summary>
              <ul className="px-4 pb-4 space-y-1.5 text-xs sm:text-sm font-semibold text-white/90 list-disc list-inside">
                <li>ร่วมได้เฉพาะผู้ถือตั๋ว Dog Run (1K / 3.8K) ลงชื่อ 1 คู่ต่อ 1 ตั๋ว</li>
                <li>ชุดต้องไม่ร้อน ไม่อึดอัด และไม่ขัดขวางการเดิน การหายใจ หรือการมองเห็นของน้องหมา</li>
                <li>ห้ามใช้สีย้อม สเปรย์ น้ำหอม หรือสารที่ไม่ปลอดภัยกับสัตว์</li>
                <li>หากน้องหมาเครียดหรือไม่สบายใจ ขอให้ถอดชุดและพักได้ทันที ทีมงานขอให้ถอดชุดได้หากเห็นว่าไม่ปลอดภัย</li>
                <li>ต้องมีสายจูง/อุปกรณ์ควบคุมตลอดเวลา และเจ้าของดูแลน้องหมาตลอดการแสดง</li>
                <li>การตัดสินของคณะกรรมการถือเป็นที่สิ้นสุด</li>
              </ul>
            </details>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-white/85">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5"><Trophy className="w-3.5 h-3.5 text-[#FFD84D]" aria-hidden="true" /> รางวัล: ประกาศเร็วๆ นี้</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5"><Crown className="w-3.5 h-3.5 text-[#FFD84D]" aria-hidden="true" /> เวลาประกวด: ประกาศตามกำหนดการวันงาน</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5"><Heart className="w-3.5 h-3.5 text-[#EC4899]" aria-hidden="true" /> ฟรี สำหรับผู้ถือตั๋ว Dog Run</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
