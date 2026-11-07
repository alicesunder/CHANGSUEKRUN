import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Check, ChevronDown, Gift, PawPrint, Route } from 'lucide-react';

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
  src: '/images/contest/costume-2027.webp',
  alt: 'น้องหมา 6 ตัวในชุดผจญภัยม่วงทอง ทั้งอัศวิน พ่อมด เจ้าหญิง นักบิน และนักสำรวจ กับเจ้าของที่กอดน้องอยู่',
};

const HEALTHY_IMG = {
  src: '/images/contest/healthy-2027.webp',
  alt: 'สัตวแพทย์ใช้หูฟังตรวจน้องชิบะที่เจ้าของกอดอยู่ ข้าง ๆ มีน้องซามอยด์และบีเกิ้ลผูกผ้าพันคอสีม่วง',
};
const OBEDIENCE_IMG = {
  src: '/images/contest/obedience-2027.webp',
  alt: 'เจ้าหน้าที่ K-9 ให้สัญญาณมือกับน้องโกลเด้นที่นั่งตรง และเจ้าของสั่งน้องบอร์เดอร์คอลลี่ให้หมอบ',
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


/** The small checklist under the stage (each line = icon + short text). */
const SHARED_ICONS = [PawPrint, CalendarDays, Route, Check];
const SHARED_SHORT = [
  'ร่วมได้เฉพาะผู้ถือตั๋ว Dog Run 1K / 4K ไม่เสียค่าสมัครเพิ่ม · 1 ตั๋ว ส่งน้องหมาได้ 1 ตัว ลงได้ทั้ง 3 รายการ',
  'ลงทะเบียนที่เต็นท์ประกวด 9 ม.ค. 2570 เวลา 08.00–09.30 น. (ประกวด 09.00–14.00 น. · มอบรางวัล 15.00–17.00 น.)',
  'จูงสายตลอดเวลาและเก็บมูลทุกครั้ง · ถ้าน้องเครียดหรือร้อน ขอพักหรือถอนตัวได้ทันที',
  'คำตัดสินของคณะกรรมการและสัตวแพทย์ถือเป็นที่สิ้นสุด',
];

/** All three dog contests (costume, healthy dog, obedience) as one stage, with tabs. */
export const DogContestSection: React.FC = () => {
  const [active, setActive] = useState<ContestId>('costume');
  const c = CONTESTS.find((x) => x.id === active) || CONTESTS[0];

  return (
    <section id="dog-contest" aria-labelledby="dog-contest-heading" className="mt-10 sm:mt-14 scroll-mt-24">
      {/* old link target for the costume contest */}
      <span id="costume-contest" className="block -translate-y-24" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-[40px] border border-[#E4D6F7] bg-[#FBF8FF] shadow-[0_14px_34px_-20px_rgba(42,20,80,0.35)]">
        {/* ---------- stage header: curtains, spotlights, trophy ---------- */}
        <div className="relative overflow-hidden px-4 pt-5 pb-14 sm:pt-9 sm:pb-20 min-h-[270px] sm:min-h-[340px] lg:min-h-[390px] text-center bg-gradient-to-b from-[#EFE5FF] via-[#F6EFFF] to-[#FBF8FF]">
          <img
            src="/images/contest/stage-header.webp"
            alt=""
            aria-hidden="true"
            decoding="async"
            draggable={false}
            className="pointer-events-none select-none absolute inset-x-0 top-0 h-full w-full object-cover object-center sm:object-bottom"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#4B1FA8]/60 bg-white/95 px-3.5 py-1.5 text-xs sm:text-lg font-black text-[#4B1FA8] shadow-md">
              <PawPrint className="h-4 w-4 sm:h-5 sm:w-5 text-[#F5B800]" aria-hidden="true" />
              ประกวดน้องหมา 3 รายการ · วันเสาร์ที่ 9 ม.ค. 2570
            </span>
            <h2 id="dog-contest-heading" className="squiggle squiggle-center mt-3 font-hero text-[2rem] sm:text-5xl lg:text-[3.6rem] font-extrabold text-[#2A1450] leading-[1.3] [-webkit-text-stroke:7px_#fff] [paint-order:stroke_fill] [text-shadow:0_4px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(75,31,168,0.3)]">
              เวทีประกวด <span className="whitespace-nowrap text-[#E0268F]">น้องหมา</span> สุดน่ารัก
            </h2>
            <p className="mt-2 text-base sm:text-2xl font-black text-[#3B1780] [-webkit-text-stroke:5px_#fff] [paint-order:stroke_fill]">ฟรีสำหรับคู่วิ่ง Dog Run · ลงได้ทุกรายการ</p>
          </div>
        </div>

        {/* tabs overlap the header edge */}
        <div role="tablist" aria-label="เลือกรายการประกวด" className="relative z-10 -mt-9 sm:-mt-10 mx-auto flex w-fit max-w-[94%] gap-1.5 sm:gap-2 rounded-[20px] border border-[#E4D6F7] bg-white/95 p-1.5 shadow-[0_8px_20px_-10px_rgba(65,30,120,0.4)] overflow-x-auto [scrollbar-width:none]">
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
                className={`relative shrink-0 min-h-[48px] sm:min-h-[60px] px-2.5 min-[400px]:px-4 sm:px-9 rounded-[20px] text-[13.5px] min-[400px]:text-[15px] sm:text-lg font-extrabold cursor-pointer transition-colors ${on ? 'text-white' : 'text-[#2A1450] hover:bg-[#F3EEFB]'}`}
              >
                {on && (
                  <motion.span
                    layoutId="contest-tab-bg"
                    className="absolute inset-0 rounded-[20px] border-2 border-[#F5B800] shadow-[0_5px_0_#2A1450,inset_0_1px_0_rgba(255,255,255,0.3)]"
                    style={{ background: 'linear-gradient(180deg,#6D3FD0,#3B1780)' }}
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
            className="relative grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-7 px-4 pb-5 pt-5 sm:px-8 sm:pb-6 items-start"
          >
            {/* picture side: gold arch frame with ribbon + paw medal; the photo steps out in front of it */}
            <div className="md:col-span-5 relative mx-auto w-full max-w-[460px]">
              <div className="relative aspect-[774/648]">
                <img
                  src="/images/contest/dog-frame.webp"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="pointer-events-none select-none absolute inset-0 h-full w-full mix-blend-multiply"
                />
                <div className="absolute left-[11%] right-[11%] top-[24%] bottom-[14%] flex items-center justify-center">
                  {c.image ? (
                    <img
                      src={c.image.src}
                      alt={c.image.alt}
                      loading="lazy"
                      decoding="async"
                      className="relative z-10 max-h-[106%] max-w-[96%] w-auto h-auto object-contain drop-shadow-[0_10px_14px_rgba(42,20,80,0.3)]"
                    />
                  ) : (
                    <div className="text-[96px]">🐕</div>
                  )}
                </div>
              </div>
            </div>

            {/* text side */}
            <div className="md:col-span-7 space-y-3.5">
              <div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.span
                    aria-hidden="true"
                    animate={{ rotate: [-6, 4, -6] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative flex h-[50px] w-[68px] sm:h-[62px] sm:w-[84px] shrink-0 items-center justify-center"
                  >
                    <img src="/images/contest/dog-cloud.webp" alt="" className="absolute inset-0 h-full w-full object-contain mix-blend-multiply [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
                    <span className="relative -rotate-6 text-base sm:text-xl font-black text-[#7A1FA2]">ฟรี!</span>
                  </motion.span>
                  <img src="/images/contest/dog-hat.webp" alt="" aria-hidden="true" className="h-9 w-auto sm:h-11 mix-blend-multiply [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
                  <h3 className="text-[20px] sm:text-[26px] font-black text-[#2A1450] leading-tight">
                    {c.title}
                  </h3>
                </div>
                <p className="mt-2.5 inline-block rounded-full bg-gradient-to-r from-[#FFE3F1] to-[#FFF0F7] px-3.5 py-1 text-[13px] sm:text-[15px] font-extrabold" style={{ color: c.accent === '#EC4899' ? '#C2186E' : c.accent }}>
                  ✦ {c.tagline}
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E4D6F7] bg-white p-3.5 sm:p-4 shadow-[0_8px_18px_-12px_rgba(65,30,120,0.3)]">
                <p className="text-sm sm:text-base font-black text-[#2A1450] mb-2.5">⭐ เกณฑ์ให้คะแนน</p>
                <ul className="space-y-2" aria-label={`เกณฑ์ให้คะแนน ${c.title}`}>
                  {c.criteria.map((k, i) => (
                    <li key={k.label} className="flex items-center gap-2.5 text-[13px] sm:text-[15px] font-extrabold text-[#2A1450]">
                      <span className="w-[44%] sm:w-[40%] shrink-0 leading-snug">{k.label}</span>
                      <span className="flex-1 h-3 rounded-full bg-[#EDE3FB] overflow-hidden">
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.accent}CC)` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, k.pts * 2.5)}%` }}
                          transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 120, damping: 18 }}
                        />
                      </span>
                      <span className="w-9 shrink-0 rounded-full bg-[#F3ECFF] py-0.5 text-center tabular-nums" style={{ color: c.accent }}>
                        {k.pts}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <details className="group rounded-[18px] border-2 border-[#D9C9EF] bg-white">
                <summary className="list-none cursor-pointer min-h-[52px] px-4 py-2.5 flex items-center justify-between gap-3 text-sm sm:text-base font-extrabold text-[#2A1450]">
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

        {/* ---------- shared rules ---------- */}
        <div className="mx-3 sm:mx-6 mb-4 sm:mb-6 rounded-[24px] border border-[#F2DFA0] bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D0] p-3.5 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <h3 className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-b from-[#6D3FD0] to-[#3B1780] py-2 pl-3 pr-5 text-base sm:text-lg font-black text-white shadow-[0_6px_14px_-8px_rgba(42,20,80,0.7)]">
              <PawPrint className="h-5 w-5 text-[#FFD35C]" aria-hidden="true" />
              กติการ่วมของทุกรายการ
            </h3>
            <ul className="space-y-1.5 md:border-x md:border-dashed md:border-[#E3C45A] md:px-5">
              {SHARED_SHORT.map((r, i) => {
                const Icon = SHARED_ICONS[i];
                return (
                  <li key={r} className="flex items-start gap-2 text-[12.5px] sm:text-sm font-bold leading-snug text-[#3B1780]">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#6D28D9]" aria-hidden="true" />
                    <span>{r}</span>
                  </li>
                );
              })}
            </ul>
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-b from-[#FFE27A] to-[#FFC928] px-4 py-2.5 text-sm sm:text-base font-black text-[#4A1D7A] shadow-[0_6px_12px_-8px_rgba(122,80,0,0.8)]">
              <Gift className="h-5 w-5" aria-hidden="true" />
              รางวัล: ประกาศเร็วๆ นี้
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
