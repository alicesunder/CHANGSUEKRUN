import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type TargetAndTransition } from 'motion/react';
import { CalendarDays, Check, ChevronDown, Gift, PawPrint, Route } from 'lucide-react';
import { SelectBurst } from './SelectBurst';

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
    accent: '#6D28D9',
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
    accent: '#6D28D9',
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

const CT = (n: string) => `/images/contest/${n}-v1.webp`;
const TAB_ICON: Record<ContestId, string> = { costume: 'ct-crown', healthy: 'ct-arm', obedience: 'ct-cap' };
const SPRING = { type: 'spring', stiffness: 320, damping: 14 } as const;
const GLASS_WHITE = 'rounded-[22px] border-2 border-white/80 bg-white/85 shadow-[0_12px_28px_-14px_rgba(20,8,40,0.7),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm';

/** All three dog contests (costume, healthy dog, obedience) as one beach-sunset stage, with tabs. */
export const DogContestSection: React.FC = () => {
  const [active, setActive] = useState<ContestId>('costume');
  const c = CONTESTS.find((x) => x.id === active) || CONTESTS[0];
  const reduce = useReducedMotion();
  const [burst, setBurst] = useState(false);
  const pick = (id: ContestId) => {
    if (id === active) return;
    setActive(id);
    setBurst(false);
    window.setTimeout(() => setBurst(true), 60);
  };
  const fx = (hover: TargetAndTransition) => (reduce ? {} : { whileHover: hover, whileTap: { scale: 0.97 }, transition: SPRING });
  /** gentle idle motion for loose objects */
  const idle = (anim: TargetAndTransition, dur: number, delay = 0) => (reduce ? {} : { animate: anim, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' as const, delay } });

  return (
    <section id="dog-contest" aria-labelledby="dog-contest-heading" className="mt-10 sm:mt-14 scroll-mt-24">
      {/* old link target for the costume contest */}
      <span id="costume-contest" className="block -translate-y-24" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-[40px] border-[3px] border-[#FFC928]/80 bg-gradient-to-b from-[#4B1FA8] via-[#3B1780] to-[#2A1450] shadow-[0_0_0_2px_rgba(42,20,80,0.6),0_20px_44px_-18px_rgba(42,20,80,0.8)]">
        {/* ---------- sunset beach stage header ---------- */}
        <div className="relative overflow-hidden px-4 pt-5 pb-40 sm:pt-9 sm:pb-24 min-h-[330px] sm:min-h-[400px] lg:min-h-[440px] text-center">
          <img src="/images/contest/ct-bg-v1.webp" alt="" aria-hidden="true" decoding="async" draggable={false} className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover object-[55%_center]" />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#2A1450]/45 via-transparent to-[#3B1780]" />

          {/* sun rays, sea glints, rising orbs and drifting paws */}
          <span aria-hidden="true" className="fx-rays" style={{ left: '82%', top: '52%' }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {[['40%', '58%'], ['52%', '64%'], ['64%', '60%'], ['74%', '68%'], ['30%', '70%'], ['58%', '72%'], ['86%', '64%'], ['46%', '76%']].map(([l, t], i) => (
              <i key={l + t} className="fx-seaglint" style={{ left: l, top: t, animationDelay: `${i * 0.42}s` }} />
            ))}
            {[['12%', 8, 0], ['26%', 12, 2.2], ['38%', 7, 4.5], ['50%', 10, 1.2], ['62%', 8, 6], ['72%', 12, 3.3], ['84%', 7, 5.4], ['93%', 10, 7.4]].map(([l, sz, d]) => (
              <i key={String(l)} className="fx-orb" style={{ left: l as string, width: sz as number, height: sz as number, animationDelay: `${d}s`, ['--dx' as string]: `${Number(sz) % 2 ? 20 : -20}px` }} />
            ))}
            {[['20%', 0], ['47%', 4], ['76%', 7.5]].map(([l, d]) => (
              <PawPrint key={String(l)} className="fx-paw-drift h-5 w-5" style={{ left: l as string, animationDelay: `${d}s`, ['--dx' as string]: '24px' }} />
            ))}
          </div>

          {/* fairy lights along the top */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1 flex justify-around px-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="fx-spark !static !h-2 !w-2 sm:!h-3 sm:!w-3" style={{ animationDelay: `${(i % 5) * 0.45}s`, marginTop: i % 2 ? 6 : 0 }} />
            ))}
          </div>

          {/* scenery objects */}
          <motion.img src={CT('ct-palm')} alt="" aria-hidden="true" className="fx-off pointer-events-none absolute -left-3 top-0 h-[150px] w-auto origin-bottom sm:-left-2 sm:h-[260px] lg:h-[300px]" {...idle({ rotate: [-1.5, 1.5, -1.5] }, 6)} />
          <motion.img src={CT('ct-flag')} alt="" aria-hidden="true" className="fx-off pointer-events-none absolute bottom-3 left-[22%] hidden h-[130px] w-auto origin-bottom-left sm:block lg:left-[24%] lg:h-[150px]" {...idle({ rotate: [-3, 3, -3] }, 3.2)} />
          <motion.img src={CT('ct-flag')} alt="" aria-hidden="true" className="fx-off pointer-events-none absolute bottom-3 right-[22%] hidden h-[130px] w-auto origin-bottom -scale-x-100 sm:block lg:right-[24%] lg:h-[150px]" {...idle({ rotate: [3, -3, 3] }, 3.6, 0.5)} />
          <motion.div className="pointer-events-none absolute bottom-12 left-[1%] sm:bottom-7 sm:left-[4%]" {...idle({ y: [0, -6, 0] }, 4)}>
            <span aria-hidden="true" className="fx-halo" />
            <img src={CT('ct-trophy')} alt="" aria-hidden="true" className="fx-off relative block h-[98px] w-auto drop-shadow-[0_10px_14px_rgba(20,8,40,0.55)] sm:h-[210px] lg:h-[250px]" />
            {[['42%', '8%', '0s'], ['78%', '30%', '1.1s'], ['18%', '36%', '2.0s'], ['55%', '58%', '.6s']].map(([l, t, d]) => (
              <i key={l + t} aria-hidden="true" className="fx-glint not-italic" style={{ left: l, top: t, animationDelay: d }}>✦</i>
            ))}
          </motion.div>
          <motion.div className="pointer-events-none absolute bottom-12 right-[1%] sm:bottom-7 sm:right-[4%]" {...idle({ y: [0, -6, 0] }, 4.6, 0.6)}>
            <span aria-hidden="true" className="fx-halo" />
            <img src={CT('ct-rosette')} alt="" aria-hidden="true" className="fx-off relative block h-[98px] w-auto drop-shadow-[0_10px_14px_rgba(20,8,40,0.55)] sm:h-[210px] lg:h-[250px]" />
            {[['50%', '10%', '.4s'], ['20%', '30%', '1.4s'], ['82%', '42%', '2.4s'], ['48%', '52%', '.9s']].map(([l, t, d]) => (
              <i key={l + t} aria-hidden="true" className="fx-glint not-italic" style={{ left: l, top: t, animationDelay: d }}>✦</i>
            ))}
          </motion.div>
          <motion.img src={'/images/contest/ct-lantern-v2.webp'} alt="" aria-hidden="true" className="fx-off fx-glow pointer-events-none absolute bottom-6 left-[35%] hidden h-[90px] w-auto origin-top sm:block" {...idle({ rotate: [-3, 3, -3] }, 3.4)} />
          <motion.img src={'/images/contest/ct-lantern-v2.webp'} alt="" aria-hidden="true" className="fx-off fx-glow pointer-events-none absolute bottom-6 right-[35%] hidden h-[90px] w-auto origin-top sm:block" {...idle({ rotate: [3, -3, 3] }, 3.8, 0.4)} />

          <div className="relative">
            <span className="fx-sheen inline-flex items-center gap-1.5 rounded-full border-2 border-white/70 bg-gradient-to-b from-white to-[#EFE5FF] px-3.5 py-1.5 text-xs sm:text-lg font-black text-[#4B1FA8] shadow-md">
              <PawPrint className="h-4 w-4 sm:h-5 sm:w-5 text-[#F5B800]" aria-hidden="true" />
              ประกวดน้องหมา 3 รายการ · วันเสาร์ที่ 9 ม.ค. 2570
            </span>
            <h2 id="dog-contest-heading" className="squiggle squiggle-center mt-3 font-hero text-[2rem] sm:text-5xl lg:text-[3.6rem] font-extrabold leading-[1.3] text-white [-webkit-text-stroke:6px_#3B1780] [paint-order:stroke_fill] [text-shadow:0_4px_0_rgba(42,20,80,0.9),0_10px_22px_rgba(20,8,40,0.55)]">
              เวทีประกวด <span className="fx-text-glow whitespace-nowrap text-[#FFD34D]">น้องหมา</span> สุดน่ารัก
            </h2>
            <p className="mx-auto mt-3 w-fit rounded-full border-2 border-white/60 bg-white/85 px-4 py-1.5 text-sm sm:text-xl font-black text-[#3B1780] shadow-md backdrop-blur-sm">ฟรีสำหรับคู่วิ่ง Dog Run · ลงได้ทุกรายการ</p>
          </div>
        </div>

        {/* tabs overlap the header edge */}
        <div role="tablist" aria-label="เลือกรายการประกวด" className="relative z-10 -mt-9 sm:-mt-10 mx-auto flex w-fit max-w-[94%] gap-1.5 sm:gap-2 rounded-[22px] border-2 border-white/80 bg-white/90 p-1.5 shadow-[0_10px_24px_-10px_rgba(20,8,40,0.7)] backdrop-blur overflow-x-auto [scrollbar-width:none]">
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
                onClick={() => pick(t.id)}
                className={`relative shrink-0 min-h-[48px] sm:min-h-[60px] px-2.5 min-[400px]:px-4 sm:px-9 rounded-[20px] text-[13.5px] min-[400px]:text-[15px] sm:text-lg font-extrabold cursor-pointer transition-colors ${on ? 'text-white' : 'text-[#2A1450] hover:bg-[#F3EEFB]'}`}
              >
                {on && (
                  <motion.span
                    layoutId="contest-tab-bg"
                    className="fx-glow absolute inset-0 rounded-[20px] border-2 border-[#F5B800] shadow-[0_5px_0_#2A1450,inset_0_1px_0_rgba(255,255,255,0.3)]"
                    style={{ background: 'linear-gradient(180deg,#6D3FD0,#3B1780)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative inline-flex items-center gap-1.5">
                  <motion.img src={CT(TAB_ICON[t.id])} alt="" aria-hidden="true" className="fx-off h-6 w-6 object-contain sm:h-8 sm:w-8" {...(on && !reduce ? { animate: { rotate: [-8, 8, -8], scale: [1, 1.12, 1] }, transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } } : {})} />
                  {t.tab}
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
            className="relative mx-3 mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-7 rounded-[28px] border-2 border-white/40 bg-gradient-to-br from-[#7C4FD8]/70 via-[#6D3FD0]/55 to-[#4B1FA8]/70 px-4 pb-5 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_14px_30px_-16px_rgba(20,8,40,0.8)] backdrop-blur-sm sm:mx-6 sm:px-8 sm:pb-6 items-start"
          >
            <SelectBurst active={burst} count={30} spread={1.6} className="left-1/2 top-24" />
            {/* picture side: gold ribbon frame, the artwork steps out in front of it */}
            <div className="md:col-span-5 relative mx-auto w-full max-w-[460px]">
              <div className="relative aspect-[490/464]">
                <span aria-hidden="true" className="absolute left-[9%] right-[9%] top-[24%] bottom-[16%] rounded-[34%] bg-gradient-to-b from-[#F5EDFF] to-[#D9C6F5] shadow-inner" />
                <div className="absolute left-[11%] right-[11%] top-[22%] bottom-[14%] flex items-center justify-center">
                  {c.image ? (
                    <motion.img
                      src={c.image.src}
                      alt={c.image.alt}
                      loading="lazy"
                      decoding="async"
                      className="fx-off relative z-10 max-h-[108%] max-w-[98%] w-auto h-auto object-contain drop-shadow-[0_10px_14px_rgba(42,20,80,0.4)]"
                      {...idle({ y: [0, -4, 0] }, 3.6)}
                    />
                  ) : (
                    <div className="text-[96px]">🐕</div>
                  )}
                </div>
                <span aria-hidden="true" className="fx-sweep" style={{ WebkitMaskImage: `url(${CT('ct-frame')})`, maskImage: `url(${CT('ct-frame')})` }} />
                <motion.img src={CT('ct-frame')} alt="" aria-hidden="true" loading="lazy" className="fx-off pointer-events-none select-none absolute inset-0 z-20 h-full w-full" {...fx({ scale: 1.02 })} />
                {[['8%', '30%', '0s'], ['90%', '38%', '.8s'], ['14%', '76%', '1.5s'], ['86%', '80%', '.4s'], ['50%', '4%', '1.1s'], ['30%', '16%', '2.0s'], ['72%', '14%', '.2s'], ['50%', '96%', '1.7s']].map(([l, t, d]) => (
                  <i key={l + t} aria-hidden="true" className="fx-spark z-30" style={{ left: l, top: t, animationDelay: d }} />
                ))}
              </div>
            </div>

            {/* text side */}
            <div className="md:col-span-7 space-y-3.5">
              <div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.span aria-hidden="true" {...idle({ rotate: [-6, 4, -6], scale: [1, 1.06, 1] }, 2.6)} className="relative flex h-[50px] w-[68px] sm:h-[62px] sm:w-[84px] shrink-0 items-center justify-center">
                    <img src={CT('ct-burst')} alt="" className="fx-off absolute inset-0 h-full w-full object-contain" />
                    <span className="relative -rotate-6 text-base sm:text-xl font-black text-[#7A1FA2]">ฟรี!</span>
                  </motion.span>
                  <motion.img src={CT('ct-wizard')} alt="" aria-hidden="true" className="fx-off h-9 w-auto sm:h-12" {...idle({ rotate: [-6, 6, -6] }, 3)} />
                  <h3 className="text-[20px] sm:text-[26px] font-black leading-tight text-white [text-shadow:0_2px_0_rgba(42,20,80,0.7)]">{c.title}</h3>
                </div>
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#F2C94C] bg-gradient-to-r from-[#FFF3C4] to-[#FFE07A] px-3.5 py-1 text-[13px] sm:text-[15px] font-extrabold text-[#4A1D7A] shadow-sm">
                  <img src={CT('ct-star')} alt="" aria-hidden="true" className="fx-off h-4 w-4 object-contain" /> {c.tagline}
                </p>
              </div>

              <div className={`${GLASS_WHITE} p-3.5 sm:p-4`}>
                <p className="mb-2.5 inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-[#2A1450]">
                  <img src={CT('ct-star')} alt="" aria-hidden="true" className="fx-off h-5 w-5 object-contain" /> เกณฑ์ให้คะแนน
                </p>
                <ul className="space-y-2" aria-label={`เกณฑ์ให้คะแนน ${c.title}`}>
                  {c.criteria.map((k, i) => (
                    <li key={k.label} className="flex items-center gap-2.5 text-[13px] sm:text-[15px] font-extrabold text-[#2A1450]">
                      <span className="w-[44%] sm:w-[40%] shrink-0 leading-snug">{k.label}</span>
                      <span className="flex-1 h-3 rounded-full bg-[#E7DBFA] overflow-hidden shadow-inner">
                        <motion.span
                          className="relative block h-full overflow-hidden rounded-full"
                          style={{ background: 'linear-gradient(90deg,#4B1FA8,#8B5CF6,#FFC928)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, k.pts * 2.5)}%` }}
                          transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 120, damping: 18 }}
                        >
                          <span className="fx-barshine" style={{ animationDelay: `${i * 0.35}s` }} />
                        </motion.span>
                      </span>
                      <span className="w-9 shrink-0 rounded-full bg-[#F3ECFF] py-0.5 text-center tabular-nums text-[#4B1FA8]">{k.pts}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <details className={`group ${GLASS_WHITE}`}>
                <summary className="list-none cursor-pointer min-h-[52px] px-4 py-2.5 flex items-center justify-between gap-3 text-sm sm:text-base font-extrabold text-[#2A1450]">
                  <span>📋 กติกา{' '}{c.title}</span>
                  <ChevronDown className="w-5 h-5 text-[#6D28D9] transition-transform group-open:rotate-180" aria-hidden="true" />
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
        <div className="relative mx-3 mt-4 mb-4 sm:mx-6 sm:mb-6 overflow-hidden rounded-[24px] border-2 border-[#F2DFA0] bg-gradient-to-b from-[#FFF9E6] to-[#FFEFC2] p-3.5 shadow-[0_12px_28px_-14px_rgba(20,8,40,0.7)] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
            <h3 className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-b from-[#6D3FD0] to-[#3B1780] py-2 pl-3 pr-5 text-base sm:text-lg font-black text-white shadow-[0_6px_14px_-8px_rgba(42,20,80,0.7)]">
              <PawPrint className="h-5 w-5 text-[#FFD35C]" aria-hidden="true" />
              กติการ่วมของทุกรายการ
            </h3>
            <ul className="space-y-1.5 lg:border-x lg:border-dashed lg:border-[#E3C45A] lg:px-5">
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
            <motion.p className="fx-sheen inline-flex w-fit items-center gap-2 rounded-full border-2 border-white/70 bg-gradient-to-b from-[#FFE27A] to-[#FFC928] px-4 py-2.5 text-sm sm:text-base font-black text-[#4A1D7A] shadow-[0_6px_12px_-8px_rgba(122,80,0,0.8)]" {...fx({ scale: 1.05 })}>
              <Gift className="h-5 w-5" aria-hidden="true" />
              รางวัล: ประกาศเร็วๆ นี้
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
};
