import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const STEPS = [
  { emoji: '📝', text: 'ลงชื่อหน้างาน' },
  { emoji: '💃', text: 'เดินโชว์บนเวที' },
  { emoji: '⭐', text: 'กรรมการให้คะแนน' },
  { emoji: '🏆', text: 'ประกาศผลบนเว็บ' },
];

const CRITERIA = [
  { label: 'ความคิดสร้างสรรค์', pts: 40, color: '#EC4899' },
  { label: 'เข้ากับธีมม่วง–ทอง', pts: 25, color: '#7C3AED' },
  { label: 'น้องหมามีความสุข', pts: 20, color: '#10B981' },
  { label: 'ความเข้ากันของคู่หู', pts: 15, color: '#0EA5E9' },
];

const SPARKS = [
  { top: '8%', left: '6%', d: 0 },
  { top: '18%', left: '88%', d: 0.6 },
  { top: '78%', left: '10%', d: 1.1 },
  { top: '70%', left: '92%', d: 0.3 },
];

/** Costume contest for Dog Run pairs — a compact, bright card above the souvenirs. */
export const CostumeContestSection: React.FC = () => (
  <section id="costume-contest" aria-labelledby="costume-heading" className="mt-10 sm:mt-14 scroll-mt-24">
    <div className="relative sticker overflow-hidden bg-gradient-to-br from-[#FFF4D2] via-[#FFEFF7] to-[#F3EEFF]">
      {SPARKS.map((s, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute text-xl"
          style={{ top: s.top, left: s.left }}
          animate={{ scale: [0.6, 1.1, 0.6], rotate: [0, 20, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: s.d }}
        >
          ✨
        </motion.span>
      ))}

      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 p-4 sm:p-6 items-center">
        {/* picture */}
        <motion.div
          className="md:col-span-5 relative mx-auto w-full max-w-[420px]"
          initial={{ rotate: -3, opacity: 0, y: 12 }}
          whileInView={{ rotate: -2, opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14 }}
        >
          <div className="rounded-[24px] bg-white border-[3px] border-[var(--ink)] shadow-[5px_6px_0_var(--ink)] p-2.5">
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
            animate={{ y: [0, -6, 0], rotate: [-8, 8, -8] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-4 -right-3 px-3 py-1.5 rounded-full bg-[#FFC928] border-[3px] border-[var(--ink)] text-sm font-black text-[var(--ink)] shadow-[0_3px_0_var(--ink)]"
          >
            👑 ฟรี!
          </motion.span>
        </motion.div>

        {/* text */}
        <div className="md:col-span-7 space-y-3.5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-[var(--ink)] text-xs font-extrabold text-[#BE185D]">
              🐾 กิจกรรมพิเศษสำหรับคู่วิ่ง Dog Run
            </span>
            <h2 id="costume-heading" className="mt-2 font-hero text-2xl sm:text-3xl font-bold text-[var(--ink)] leading-[1.35]">
              ประกวดแต่งตัว <span className="text-[#EC4899]">น้องหมา</span> &amp; <span className="text-[#7C3AED]">เจ้าของ</span>
            </h2>
            <p className="mt-1 text-sm sm:text-base font-semibold text-[#4B2D78] leading-relaxed">
              แต่งธีม <strong className="text-[#B45309]">ผจญภัยม่วง–ทอง</strong> จะเป็นอัศวิน พ่อมด เจ้าหญิง หรือนักบินก็ได้ ขอให้น้องหมาแฮปปี้ที่สุด!
            </p>
          </div>

          <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label="ขั้นตอนการประกวด">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.text}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl bg-white/90 border-2 border-[var(--ink)]/15 px-2.5 py-2 text-center"
              >
                <span className="block text-2xl" aria-hidden="true">{s.emoji}</span>
                <span className="block text-xs font-extrabold text-[var(--ink)] leading-snug">
                  <span className="text-[#EC4899]">{i + 1}.</span> {s.text}
                </span>
              </motion.li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2 text-xs font-extrabold">
            <span className="px-3 py-1.5 rounded-full bg-[#FFC928] text-[var(--ink)] border-2 border-[var(--ink)]">🎁 รางวัล: ประกาศเร็วๆ นี้</span>
            <span className="px-3 py-1.5 rounded-full bg-white text-[var(--ink)] border-2 border-[var(--ink)]/20">🕒 เวลา: ตามกำหนดการวันงาน</span>
          </div>

          <details className="group rounded-2xl bg-white/90 border-2 border-[var(--ink)]/15">
            <summary className="list-none cursor-pointer min-h-[48px] px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-extrabold text-[var(--ink)]">
              <span>📋 เกณฑ์ให้คะแนน &amp; กติกา</span>
              <ChevronDown className="w-5 h-5 text-[#EC4899] transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4 space-y-3">
              <ul className="space-y-1.5">
                {CRITERIA.map((c) => (
                  <li key={c.label} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[var(--ink)]">
                    <span className="w-32 sm:w-40 shrink-0">{c.label}</span>
                    <span className="flex-1 h-2.5 rounded-full bg-[#EEE7F8] overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: `${c.pts}%`, background: c.color }} />
                    </span>
                    <span className="w-7 text-right tabular-nums" style={{ color: c.color }}>{c.pts}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-1 text-xs sm:text-sm font-semibold text-[#4B2D78] list-disc pl-5">
                <li>ร่วมได้เฉพาะผู้ถือตั๋ว Dog Run (1K / 3.8K) · 1 ตั๋ว 1 คู่ · ไม่เสียค่าสมัครเพิ่ม</li>
                <li>ชุดต้องไม่ร้อน ไม่อึดอัด ไม่บังตาหรือขัดขวางการเดินและหายใจของน้องหมา</li>
                <li>ห้ามใช้สีย้อม สเปรย์ หรือสารที่ไม่ปลอดภัยกับสัตว์</li>
                <li>ถ้าน้องหมาเครียด ถอดชุดและพักได้ทันที · ต้องจูงสายตลอดเวลา</li>
                <li>คำตัดสินของคณะกรรมการถือเป็นที่สิ้นสุด</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  </section>
);
