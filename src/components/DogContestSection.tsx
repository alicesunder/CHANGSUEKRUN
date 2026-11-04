import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

type ContestId = 'costume' | 'healthy' | 'obedience';

interface Contest {
  id: ContestId;
  emoji: string;
  tab: string;
  title: string;
  tagline: string;
  accent: string;
  tint: string;
  /** what the judges score, out of 100 */
  criteria: { label: string; pts: number }[];
  rules: string[];
  /** big floating emojis on the picture side */
  props: string[];
  /** contest artwork; without one, a framed placeholder is shown until the organiser sends a picture */
  image?: { src: string; alt: string; /** tall picture: shown at a fixed height instead of full width */ tall?: boolean };
}

/** One picture for all three contests (organiser's artwork). */
const DOG_SQUAD = {
  src: '/images/costume/dog-squad.webp',
  alt: 'น้องสุนัข 8 ตัวแต่งชุดธีมม่วงทอง มีทั้งมงกุฎ หมวกพ่อมด เกราะอัศวิน และแว่นนักบิน',
};

const HEALTHY_IMG = {
  src: '/images/contest/healthy-vet.webp',
  alt: 'สัตวแพทย์สวมหน้ากากกำลังพันผ้าให้น้องชิบะที่เจ้าของกอดไว้ มีทีมงานชุดม่วงทองยืนดูอยู่',
};
const OBEDIENCE_IMG = {
  src: '/images/contest/obedience.webp',
  alt: 'เจ้าหน้าที่ ตชด. K-9 ยื่นมือสั่งน้องหมาโกลเด้นที่นั่งเชื่อฟังอยู่ข้างตัว',
  tall: true,
};

/**
 * Three dog contests on run day (Sat 9 Jan 2570, judging 09.00–14.00, awards 15.00–17.00),
 * shown together in one card with tabs. The rules are a first draft for the organiser to confirm.
 */
const CONTESTS: Contest[] = [
  {
    id: 'costume',
    emoji: '👑',
    tab: 'แต่งตัว',
    title: 'ประกวดแต่งตัว น้องหมา & เจ้าของ',
    tagline: 'ธีมผจญภัยม่วง–ทอง อัศวิน พ่อมด เจ้าหญิง นักบิน จัดเต็มได้เลย!',
    accent: '#EC4899',
    tint: '#FFF0F7',
    criteria: [
      { label: 'ความคิดสร้างสรรค์', pts: 40 },
      { label: 'เข้ากับธีมม่วง–ทอง', pts: 25 },
      { label: 'น้องหมามีความสุข', pts: 20 },
      { label: 'ความเข้ากันของคู่หู', pts: 15 },
    ],
    rules: [
      'ชุดต้องไม่ร้อน ไม่อึดอัด ไม่บังตาหรือขัดขวางการเดินและหายใจของน้องหมา',
      'ห้ามใช้สีย้อม สเปรย์ หรือสารที่ไม่ปลอดภัยกับสัตว์',
      'ขั้นตอน: ลงชื่อหน้างาน → เดินโชว์บนเวที → กรรมการให้คะแนน → ประกาศผลบนเว็บ',
      'ถ้าน้องหมาเครียด ถอดชุดและพักได้ทันที',
    ],
    props: ['👑', '🎩', '✨'],
    image: DOG_SQUAD,
  },
  {
    id: 'healthy',
    emoji: '💪',
    tab: 'สุขภาพดี',
    title: 'ประกวดสุนัขสุขภาพดี',
    tagline: 'ใครดูแลน้องดีที่สุด สัตวแพทย์ร่วมตัดสิน!',
    accent: '#10B981',
    tint: '#ECFDF5',
    criteria: [
      { label: 'รูปร่างและน้ำหนัก', pts: 40 },
      { label: 'ขนและผิวหนัง', pts: 20 },
      { label: 'ช่องปากและฟัน', pts: 20 },
      { label: 'ตา หู สะอาด สุขภาพดี', pts: 10 },
      { label: 'การเคลื่อนไหวและความคล่องตัว', pts: 10 },
    ],
    rules: [
      'น้องหมาอายุ 1 ปีขึ้นไป แสดงสมุดวัคซีน (พิษสุนัขบ้า + วัคซีนรวม) ที่ฉีดไม่เกิน 1 ปี',
      'สัตวแพทย์ตรวจคัดกรองก่อนขึ้นเวที น้องที่ป่วย ตั้งท้อง หรือมีแผลเปิด ขอให้งดประกวดเพื่อความปลอดภัย',
      'ไม่ตัดสินจากสายพันธุ์หรือความสวย ดูที่สุขภาพและการดูแลของเจ้าของเท่านั้น',
      'กรรมการขอจับตัวน้องหมาได้ เจ้าของต้องอยู่ข้างน้องตลอดเวลา',
    ],
    props: ['🩺', '🦴', '💚'],
    image: HEALTHY_IMG,
  },
  {
    id: 'obedience',
    emoji: '🎓',
    tab: 'เชื่อฟังคำสั่ง',
    title: 'ประกวดสุนัขเชื่อฟังคำสั่ง',
    tagline: '4 ท่า คะแนนเต็ม 100 · ท่า "คอย" คิดถึง 40 คะแนน',
    accent: '#7C3AED',
    tint: '#F5F3FF',
    criteria: [
      { label: 'ชิด (Heel)', pts: 20 },
      { label: 'นั่ง (Sit) ภายใน 2 วิ', pts: 20 },
      { label: 'หมอบ (Down) ภายใน 2 วิ', pts: 20 },
      { label: 'คอย (Stay) · เดินออก 5 ก้าว', pts: 40 },
    ],
    rules: [
      'ชิด (Heel): สุนัขต้องเดินชิดผู้ควบคุมตามคำสั่ง โดยไม่ดึงสายจูงหรือออกนอกตำแหน่งที่กำหนด',
      'นั่ง (Sit): สุนัขต้องนั่งตามคำสั่งภายใน 2 วินาที โดยไม่ต้องออกคำสั่งซ้ำ',
      'หมอบ (Down): สุนัขต้องหมอบตามคำสั่งภายใน 2 วินาที โดยไม่ต้องออกคำสั่งซ้ำ',
      'คอย (Stay): ผู้ควบคุมออกคำสั่งให้สุนัขคอย กรรมการตรวจการตอบสนองภายใน 2 วินาที จากนั้นผู้ควบคุมเดินออกไปข้างหน้า 5 ก้าว สุนัขต้องอยู่ท่าคอยที่ตำแหน่งเดิมจนผู้ควบคุมเดินครบ 5 ก้าว',
      'ถ้าสุนัขลุก เปลี่ยนตำแหน่ง หรือเดินตามก่อนครบระยะ จะถูกหักคะแนนตามเกณฑ์ของกรรมการ',
      'ออกคำสั่งได้ด้วยเสียงหรือสัญญาณมือ ท่าละ 1 ครั้ง · กรรมการพิจารณาการตอบสนองภายใน 2 วินาทีหลังออกคำสั่ง',
      'ห้ามใช้อาหาร ของเล่น หรืออุปกรณ์ล่อระหว่างการแข่งขัน · ห้ามกระตุกสายจูงหรือใช้ความรุนแรงบังคับสุนัข',
      'คะแนนเท่ากัน ให้ดูคะแนนท่า "คอย" เป็นลำดับแรก · คำตัดสินของคณะกรรมการถือเป็นที่สิ้นสุด',
    ],
    props: ['🎓', '🐾', '⭐'],
    image: OBEDIENCE_IMG,
  },
];

const SHARED_RULES = [
  'ร่วมได้เฉพาะผู้ถือตั๋ว Dog Run (1K / 3.8K) ไม่เสียค่าสมัครเพิ่ม · 1 ตั๋ว ส่งน้องหมาได้ 1 ตัว และลงได้ทั้ง 3 รายการ',
  'ลงทะเบียนที่เต็นท์ประกวด วันเสาร์ที่ 9 ม.ค. 2570 เวลา 08.00–09.30 น. (ประกวด 09.00–14.00 น. · มอบรางวัล 15.00–17.00 น.)',
  'จูงสายตลอดเวลา และเก็บมูลน้องหมาทุกครั้ง · ถ้าน้องเครียดหรือร้อน ขอพักหรือถอนตัวได้ทันที',
  'คำตัดสินของคณะกรรมการและสัตวแพทย์ถือเป็นที่สิ้นสุด',
];

/** All three dog contests (costume, healthy dog, obedience) in one card with tabs. */
export const DogContestSection: React.FC = () => {
  const [active, setActive] = useState<ContestId>('costume');
  const c = CONTESTS.find((x) => x.id === active) || CONTESTS[0];

  return (
    <section id="dog-contest" aria-labelledby="dog-contest-heading" className="mt-10 sm:mt-14 scroll-mt-24">
      {/* old link target for the costume contest */}
      <span id="costume-contest" className="block -translate-y-24" aria-hidden="true" />
      <div className="relative sticker overflow-hidden bg-gradient-to-br from-[#FFF4D2] via-[#FFF0F7] to-[#F1EBFF]">
        <div className="text-center px-4 pt-5 sm:pt-7">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-[var(--ink)] text-xs font-extrabold text-[#BE185D]">
            🐶 ประกวดน้องหมา 3 รายการ · วันเสาร์ที่ 9 ม.ค. 2570
          </span>
          <h2 id="dog-contest-heading" className="squiggle squiggle-center mt-2 font-hero text-2xl sm:text-3xl font-bold text-[var(--ink)] leading-[1.35]">
            เวทีประกวด <span className="text-[#EC4899]">น้องหมา</span> สุดน่ารัก
          </h2>
          <p className="mt-1 text-sm sm:text-base font-semibold text-[#4B2D78]">ฟรีสำหรับคู่วิ่ง Dog Run · ลงได้ทุกรายการ</p>
        </div>

        {/* tabs */}
        <div role="tablist" aria-label="เลือกรายการประกวด" className="mt-4 mx-auto flex w-fit max-w-full gap-1.5 sm:gap-2 rounded-2xl bg-white/80 border-2 border-[var(--ink)]/15 p-1.5 overflow-x-auto [scrollbar-width:none]">
          {CONTESTS.map((t) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`contest-tab-${t.id}`}
                aria-selected={on}
                aria-controls="contest-panel"
                onClick={() => setActive(t.id)}
                className={`relative shrink-0 min-h-[44px] px-3 sm:px-4 rounded-xl text-sm font-extrabold cursor-pointer transition-colors ${on ? 'text-white' : 'text-[var(--ink)] hover:bg-[#F3EEFB]'}`}
              >
                {on && (
                  <motion.span
                    layoutId="contest-tab-bg"
                    className="absolute inset-0 rounded-xl border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)]"
                    style={{ background: t.accent }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">
                  {t.emoji} {t.tab}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={c.id}
            id="contest-panel"
            role="tabpanel"
            aria-labelledby={`contest-tab-${c.id}`}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.28 }}
            className="relative grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 p-4 sm:p-6 items-start"
          >
            {/* picture side */}
            <div className="md:col-span-5 relative mx-auto w-full max-w-[400px]">
              <div className={`rounded-[24px] bg-white border-[3px] border-[var(--ink)] shadow-[5px_6px_0_var(--ink)] p-2.5 ${c.id === 'healthy' ? 'rotate-1' : '-rotate-2'}`}>
                {c.image ? (
                  <img
                    src={c.image.src}
                    alt={c.image.alt}
                    loading="lazy"
                    decoding="async"
                    className={c.image.tall ? 'block w-full h-[320px] sm:h-[380px] object-contain rounded-[14px]' : 'block w-full h-auto rounded-[14px]'}
                  />
                ) : (
                  <div
                    className="relative aspect-[4/3] rounded-[14px] flex items-center justify-center overflow-hidden"
                    style={{ background: `radial-gradient(circle at 50% 45%, #FFFFFF 0%, ${c.tint} 55%, ${c.accent}33 100%)` }}
                  >
                    <span aria-hidden="true" className="text-[96px] sm:text-[120px] leading-none drop-shadow-[0_6px_0_rgba(42,20,80,0.2)]">
                      🐕
                    </span>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white border-2 border-[var(--ink)] px-3 py-1 text-xs font-black" style={{ color: c.accent }}>
                      เต็ม 100 คะแนน
                    </span>
                  </div>
                )}
              </div>
              {c.props.map((p, i) => (
                <motion.span
                  key={p}
                  aria-hidden="true"
                  className="pointer-events-none absolute text-2xl sm:text-3xl"
                  style={{ top: ['-6%', '10%', '78%'][i], left: ['-4%', '90%', '-2%'][i] }}
                  animate={{ y: [0, -8, 0], rotate: [-10, 10, -10] }}
                  transition={{ duration: 2.4 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {p}
                </motion.span>
              ))}
              <motion.span
                aria-hidden="true"
                animate={{ y: [0, -6, 0], rotate: [-8, 8, -8] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-3 px-3 py-1.5 rounded-full bg-[#FFC928] border-[3px] border-[var(--ink)] text-sm font-black text-[var(--ink)] shadow-[0_3px_0_var(--ink)]"
              >
                ฟรี!
              </motion.span>
            </div>

            {/* text side */}
            <div className="md:col-span-7 space-y-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--ink)] leading-tight">
                  {c.emoji} {c.title}
                </h3>
                <p className="mt-0.5 text-sm font-bold" style={{ color: c.accent }}>
                  {c.tagline}
                </p>
              </div>

              <div className="rounded-2xl bg-white/90 border-2 border-[var(--ink)]/15 p-3 sm:p-4">
                <p className="text-xs font-extrabold text-[#6B5A85] mb-2">⭐ เกณฑ์ให้คะแนน</p>
                <ul className="space-y-1.5" aria-label={`เกณฑ์ให้คะแนน ${c.title}`}>
                  {c.criteria.map((k, i) => (
                    <li key={k.label} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[var(--ink)]">
                      <span className="w-[46%] sm:w-[42%] shrink-0 leading-snug">{k.label}</span>
                      <span className="flex-1 h-3 rounded-full bg-[#EEE7F8] overflow-hidden">
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ background: c.accent }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, k.pts * 2.5)}%` }}
                          transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 120, damping: 18 }}
                        />
                      </span>
                      <span className="w-7 text-right tabular-nums" style={{ color: c.accent }}>
                        {k.pts}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <details className="group rounded-2xl bg-white/90 border-2 border-[var(--ink)]/15">
                <summary className="list-none cursor-pointer min-h-[48px] px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-extrabold text-[var(--ink)]">
                  <span>📋 กติกา{c.title}</span>
                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" style={{ color: c.accent }} aria-hidden="true" />
                </summary>
                <ul className="px-4 pb-4 space-y-1.5 text-xs sm:text-sm font-semibold text-[#4B2D78] list-disc pl-8">
                  {c.rules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </details>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mx-4 sm:mx-6 mb-4 sm:mb-6 rounded-2xl bg-[#FFF8E1] border-2 border-[var(--ink)]/15 p-4">
          <h3 className="text-sm sm:text-base font-extrabold text-[var(--ink)] mb-1.5">📌 กติการ่วมของทุกรายการ</h3>
          <ul className="space-y-1 text-xs sm:text-sm font-semibold text-[#4B2D78] list-disc pl-5">
            {SHARED_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs font-bold text-[#8A5A00]">🎁 รางวัล: ประกาศเร็วๆ นี้</p>
        </div>
      </div>
    </section>
  );
};
