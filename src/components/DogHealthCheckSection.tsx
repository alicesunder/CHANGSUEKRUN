import React from 'react';
import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react';
import { ChevronRight, PawPrint, Users } from 'lucide-react';

/**
 * Free vet check by Thonglor Pet Hospital for Dog Run (1K / 4K) runners, 09.00–14.00 on run day.
 * Built from the artwork ChatGPT made (separate transparent icons and scene pieces in /images/health) with live text,
 * in one lavender / purple / gold look, and every piece reacts to the mouse.
 */
const H = (n: string) => `/images/health/${n}-v1.webp`;

const SPRING = { type: 'spring', stiffness: 320, damping: 14 } as const;
const fx = (reduce: boolean | null, hover: TargetAndTransition) => (reduce ? {} : { whileHover: hover, whileTap: { scale: 0.96 }, transition: SPRING });

const GLASS = 'relative overflow-hidden rounded-[22px] border-2 border-white/80 bg-gradient-to-br shadow-[0_10px_26px_-12px_rgba(75,31,168,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm';

/** The three facts people look for first. */
const FACTS = [
  { icon: 'ic-calendar', label: 'วัน', big: 'เสาร์ 9 ม.ค.', small: '2570', card: 'from-white/90 to-[#E6D8FB]', big_c: 'text-[#2A1450]' },
  { icon: 'ic-clock', label: 'เวลา', big: '09.00–14.00 น.', small: '', card: 'from-white/90 to-[#FFEBA6]', big_c: 'text-[#2A1450]' },
  { icon: 'ic-tag', label: 'ค่าใช้จ่าย', big: 'ไม่มีค่าใช้จ่าย', small: 'โดย รพ.สัตว์ทองหล่อ', card: 'from-white/90 to-[#BDF1D8]', big_c: 'text-[#047857]' },
] as const;

const STEPS = [
  { n: 1, icon: 'ic-ticket', text: <>ซื้อบัตร Dog Run (1K หรือ 4K)</> },
  { n: 2, icon: 'ic-steth', text: <>พาน้องหมามาที่จุดตรวจสุขภาพ <span className="whitespace-nowrap rounded-full bg-[#4B1FA8] px-2 py-0.5 text-white">09.00–14.00 น.</span></> },
  { n: 3, icon: 'ic-clip', text: <>ทีมสัตวแพทย์ตรวจสุขภาพน้องหมาให้ <span className="whitespace-nowrap rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFC928] px-2 py-0.5 text-[#2A1450]">“ไม่มีค่าใช้จ่าย”</span></> },
];

export const DogHealthCheckSection: React.FC = () => {
  const reduce = useReducedMotion();
  const bob = (d: number, y = 6) => (reduce ? {} : { animate: { y: [0, -y, 0] }, transition: { duration: 3.2 + d, repeat: Infinity, ease: 'easeInOut' as const, delay: d } });
  return (
    <section id="dog-health-check" aria-labelledby="dog-health-heading" className="mt-10 sm:mt-14 scroll-mt-24">
      <div className="relative overflow-hidden rounded-[30px] border-[3px] border-white/90 bg-gradient-to-b from-[#EADCFD] via-[#DDCBFA] to-[#C9B3F4] shadow-[0_0_0_2px_rgba(124,58,237,0.25),0_24px_50px_-20px_rgba(75,31,168,0.6)]">
        {/* ---------- banner: dusk beach scene, text on the left, characters on the right ---------- */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#7C3AED] via-[#4B1FA8] to-[#2A1450] md:bg-none">
          <img
            src="/images/contest/vet-scene-v2.webp"
            alt="สัตวแพทย์ใช้หูฟังตรวจน้องชิบะที่เต็นท์ริมชายหาดยามเย็น ผู้ช่วยในหมวกม่วงกอดน้องไว้ น้องโกลเด้นและน้องบีเกิ้ลนั่งรอตรวจ"
            decoding="async"
            className="fx-off fx-kenburns absolute inset-0 hidden h-full w-full object-cover object-[center_45%] md:block"
          />
          <span aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-[#2A1450]/80 via-[#2A1450]/30 to-transparent md:block" />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-[#EADCFD] md:h-24" />

          <div className="relative grid grid-cols-1 items-end gap-0 px-4 pt-6 sm:px-8 sm:pt-8 md:grid-cols-12 lg:px-10">
            <div className="order-2 pb-14 md:order-1 md:col-span-6 md:pb-20">
              <span className="fx-sheen inline-flex items-center gap-1.5 rounded-full border-2 border-white/70 bg-gradient-to-r from-[#FFC928] to-[#FFE268] px-4 py-1.5 text-xs font-extrabold text-[#2A1450] shadow-md sm:text-base">
                <PawPrint className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /> บริการพิเศษสำหรับผู้วิ่ง Dog Run
              </span>
              <h2 id="dog-health-heading" className="mt-3 font-hero text-[2.6rem] font-bold leading-[1.15] text-white drop-shadow-[0_4px_10px_rgba(20,8,38,0.55)] sm:text-6xl lg:text-7xl">
                ตรวจสุขภาพสุนัข
              </h2>
              <svg aria-hidden="true" className="mt-1 h-8 w-56 sm:h-10 sm:w-80" viewBox="0 0 260 40" fill="none">
                <path d="M0 22 H70 L82 22 L92 4 L104 36 L114 14 L122 22 H260" stroke="#FFE268" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="fx-ecg" />
              </svg>
              <div className="relative mt-2 inline-flex items-center">
                <motion.img
                  src={H('ob-gold-paw')}
                  alt=""
                  aria-hidden="true"
                  className="fx-off relative z-10 -mr-5 h-14 w-14 shrink-0 drop-shadow-[0_6px_8px_rgba(42,20,80,0.45)] sm:h-[72px] sm:w-[72px]"
                  {...(reduce ? {} : { animate: { rotate: [-8, 8, -8], scale: [1, 1.08, 1] }, transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } })}
                />
                <span className="fx-sheen fx-glow inline-block -skew-x-6 rounded-2xl border-2 border-white/70 bg-gradient-to-r from-[#FFC928] via-[#FFE268] to-[#FFC928] py-1 pl-8 pr-5 shadow-[0_10px_22px_-8px_rgba(255,179,0,0.95)] sm:py-1.5 sm:pl-11 sm:pr-8">
                  <span className="block skew-x-6 font-hero text-3xl font-bold text-[#2A1450] sm:text-5xl lg:text-6xl">ไม่มีค่าใช้จ่าย</span>
                </span>
              </div>
              <p className="mt-4 max-w-lg text-sm font-semibold leading-relaxed text-white sm:text-lg">
                โดย รพ.สัตว์ทองหล่อ พาน้องหมามาตรวจเช็กความพร้อมก่อนวิ่ง ไม่ต้องเสียค่าใช้จ่ายเพิ่ม
              </p>
            </div>

            <motion.div
              className="relative order-1 mx-auto w-full max-w-[470px] max-md:pt-4 md:order-2 md:col-span-6 md:max-w-none"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: 'spring', stiffness: 140, damping: 16 }}
            >
              {/* phones: the scene sits only behind the characters, the text below stays on plain purple */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -inset-x-4 overflow-hidden sm:-inset-x-8 md:hidden">
                <img src="/images/contest/vet-scene-v2.webp" alt="" decoding="async" className="h-full w-full object-cover object-[78%_center] [mask-image:linear-gradient(to_bottom,black_78%,transparent)]" />
              </span>
              <span aria-hidden="true" className="block h-56 sm:h-72 md:h-[360px] lg:h-[420px]" />
            </motion.div>
          </div>
        </div>

        {/* ---------- body ---------- */}
        <div className="relative z-10 -mt-10 px-3 pb-3 sm:px-5 lg:px-6">
          {/* floating paw prints for life */}
          <motion.img src={H('ob-paws')} alt="" aria-hidden="true" loading="lazy" className="fx-off pointer-events-none absolute -left-2 top-[46%] hidden h-20 w-20 opacity-60 lg:block" {...bob(0.4, 8)} />

          {/* facts */}
          <ul className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="รายละเอียดการตรวจสุขภาพสุนัข">
            {FACTS.map((f, i) => (
              <motion.li key={f.label} className={`${GLASS} ${f.card} flex flex-col items-center gap-1 p-2.5 text-center sm:flex-row sm:gap-4 sm:p-5 sm:text-left`} {...fx(reduce, { y: -6, scale: 1.02 })}>
                <motion.img
                  src={H(f.icon)}
                  alt=""
                  aria-hidden="true"
                  className="fx-off h-11 w-11 shrink-0 drop-shadow-[0_6px_8px_rgba(75,31,168,0.35)] sm:h-[72px] sm:w-[72px]"
                  whileHover={reduce ? undefined : { rotate: [0, -12, 12, 0], scale: 1.12, transition: { duration: 0.5 } }}
                  {...bob(i * 0.35, 3)}
                />
                <span className="min-w-0">
                  <span className="block text-[11px] font-extrabold text-[#4B2D78] sm:text-lg">{f.label}</span>
                  <span className={`block text-[14px] font-black leading-tight sm:text-[2rem] ${f.big_c}`}>{f.big}</span>
                  {f.small && <span className="block text-[11px] font-bold text-[#4B2D78] sm:text-lg">{f.small}</span>}
                </span>
              </motion.li>
            ))}
          </ul>

          {/* who + where */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 md:grid-cols-2">
            <motion.div className={`${GLASS} from-white/90 to-[#E9DDFB] p-3.5 sm:p-6`} {...fx(reduce, { y: -5 })}>
              <p className="relative flex items-center gap-2 text-lg font-extrabold text-[#2A1450] sm:text-2xl">
                <PawPrint className="h-6 w-6 text-[#6D28D9]" aria-hidden="true" /> ใครใช้บริการได้
              </p>
              <div className="relative mt-3 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-2 sm:max-w-none sm:gap-3">
                <motion.span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#4B1FA8] py-1.5 pl-3 pr-4 text-sm font-black text-white shadow-[0_5px_0_#2A1450] sm:text-lg" {...fx(reduce, { y: -3, scale: 1.05 })}>
                  <img src={H('ob-dog-white')} alt="" aria-hidden="true" className="fx-off h-6 w-auto sm:h-7" /> Dog Run 1K
                </motion.span>
                <motion.span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFB300] py-1.5 pl-3 pr-4 text-sm font-black text-[#2A1450] shadow-[0_5px_0_#7A4A00] sm:text-lg" {...fx(reduce, { y: -3, scale: 1.05 })}>
                  <img src={H('ob-dog-brown')} alt="" aria-hidden="true" className="fx-off h-6 w-auto sm:h-7" /> Dog Run 4K
                </motion.span>
              </div>
              <p className="relative mt-3 flex items-center gap-2 pr-16 text-xs font-semibold text-[#4B2D78] sm:pr-36 sm:text-base">
                <Users className="h-4 w-4 shrink-0 text-[#6D28D9] sm:h-5 sm:w-5" aria-hidden="true" /> ผู้สมัครวิ่งทั้ง 2 ระยะนี้ พาน้องหมามาตรวจได้เลย
              </p>
              <motion.img
                src={H('ob-dogs-bubble')}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="fx-off pointer-events-none absolute -bottom-2 -right-2 h-[76px] w-auto sm:h-32"
                {...bob(0.2, 5)}
              />
            </motion.div>

            <motion.div className={`${GLASS} from-white/90 to-[#E9DDFB] p-3.5 sm:p-6`} {...fx(reduce, { y: -5 })}>
              <div className="relative flex items-center gap-3 pr-24 sm:gap-4 sm:pr-40">
                <motion.img src={H('ic-pin')} alt="" aria-hidden="true" className="fx-off h-14 w-14 shrink-0 drop-shadow-[0_6px_8px_rgba(75,31,168,0.35)] sm:h-[72px] sm:w-[72px]" {...(reduce ? {} : { animate: { y: [0, -7, 0] }, transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } })} />
                <p className="text-sm font-bold leading-snug text-[#2A1450] sm:text-lg">
                  <span className="block text-lg font-black sm:text-2xl">จุดตรวจสุขภาพสุนัข</span>
                  ภายในงาน <span className="text-[#4B1FA8]">ค่ายนเรศวร ชะอำ-หัวหิน</span>
                </p>
              </div>
              <motion.img
                src={H('ob-tent-island')}
                alt="จุดตรวจสุขภาพสุนัข เต็นท์ม่วงพร้อมกล่องปฐมพยาบาล"
                loading="lazy"
                className="fx-off absolute -bottom-3 -right-2 h-28 w-auto drop-shadow-[0_8px_8px_rgba(75,31,168,0.35)] sm:h-40"
                style={{ transformOrigin: '50% 90%' }}
                {...(reduce ? {} : { animate: { rotate: [-1.5, 1.5, -1.5] }, transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }, whileHover: { scale: 1.08, rotate: 0 } })}
              />
            </motion.div>
          </div>

          {/* how */}
          <div className={`${GLASS} mt-7 from-white/80 to-[#EADFFB] p-3 pt-7 sm:mt-8 sm:p-5 sm:pt-9`}>
            <p className="absolute -top-px left-0 inline-flex items-center gap-2 rounded-br-3xl rounded-tl-[20px] bg-gradient-to-r from-[#2A1450] to-[#6D28D9] py-2 pl-3 pr-8 text-base font-extrabold text-white shadow-md sm:text-2xl">
              <img src={H('ic-steth')} alt="" aria-hidden="true" className="fx-off h-6 w-6 object-contain brightness-0 invert sm:h-8 sm:w-8" /> วิธีใช้บริการ 3 ขั้นตอน
            </p>
            <ol className="mt-3 grid grid-cols-1 items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.n}>
                  <motion.li className="flex items-center gap-3 rounded-2xl border border-white/80 bg-gradient-to-r from-white/90 to-[#F1EAFD] p-2.5 shadow-sm sm:p-4" {...fx(reduce, { y: -4, scale: 1.02 })}>
                    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-[72px] sm:w-[72px]" aria-hidden="true">
                      <motion.img src={H(s.icon)} alt="" className="fx-off max-h-full max-w-full object-contain drop-shadow-[0_6px_6px_rgba(75,31,168,0.3)]" {...bob(i * 0.4, 3)} />
                      <span className="fx-ring absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFB300] text-xs font-black text-[#2A1450] ring-2 ring-white sm:h-7 sm:w-7 sm:text-sm" style={{ animationDelay: `${i * 0.5}s` }}>{s.n}</span>
                    </span>
                    <span className="text-xs font-extrabold leading-relaxed text-[#2A1450] sm:text-base">{s.text}</span>
                  </motion.li>
                  {i < STEPS.length - 1 && <ChevronRight className="fx-nudge hidden h-8 w-8 self-center text-[#FFB300] md:block" aria-hidden="true" />}
                </React.Fragment>
              ))}
            </ol>
          </div>
        </div>

        {/* ---------- partner on a purple wave ---------- */}
        <div className="relative mt-2 overflow-hidden px-3 pb-10 pt-5 sm:px-5 sm:pb-12">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full sm:h-20" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0 70 C 240 10, 520 120, 820 60 S 1280 10, 1440 70 L1440 120 L0 120 Z" fill="#4B1FA8" opacity=".9" />
            <path d="M0 70 C 240 10, 520 120, 820 60 S 1280 10, 1440 70" fill="none" stroke="#FFC928" strokeWidth="3" />
            <path d="M0 84 C 260 30, 540 130, 840 76 S 1290 28, 1440 86" fill="none" stroke="#FFE268" strokeWidth="1.5" opacity=".6" />
          </svg>
          <motion.img src={H('ob-paws')} alt="" aria-hidden="true" loading="lazy" className="fx-off pointer-events-none absolute right-4 top-2 hidden h-16 w-16 opacity-60 sm:block" {...bob(0.9, 6)} />
          <motion.div className={`${GLASS} relative mx-auto max-w-4xl from-white/95 to-[#EFE6FC] p-3 sm:p-4`} {...fx(reduce, { y: -4, scale: 1.01 })}>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8">
              <div className="flex items-center gap-3">
                <motion.img src={H('ic-shield')} alt="" aria-hidden="true" className="fx-off h-14 w-auto sm:h-[84px]" {...bob(0.3, 4)} />
                <div className="min-w-0">
                  <span className="inline-block rounded-full bg-gradient-to-r from-[#4B1FA8] to-[#7C3AED] px-3.5 py-1 text-[11px] font-extrabold text-white sm:text-sm">ตรวจสุขภาพโดย</span>
                  <p className="mt-1 text-lg font-black leading-tight text-[#2A1450] sm:text-3xl">รพ.สัตว์ทองหล่อ</p>
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
          </motion.div>
        </div>
      </div>
    </section>
  );
};
