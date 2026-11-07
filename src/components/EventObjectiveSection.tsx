import React from 'react';
import { HandHeart } from 'lucide-react';
import { motion } from 'motion/react';
import { PawIcon } from './brand/DogDecor';
import { useLang } from '../i18n/lang';

/** Soft fade so the picture melts into the purple card (the picture already ends in the card's purple). */
const fadeScene = 'linear-gradient(90deg, #000 0%, #000 52%, transparent 96%), linear-gradient(180deg, transparent 0%, #000 14%, #000 100%)';
const fadeSceneMask = { WebkitMaskImage: fadeScene, maskImage: fadeScene, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' } as React.CSSProperties;

const Heart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 48 44" className={className} fill="none" aria-hidden="true">
    <path
      d="M24 40C8 28 3 20 3 13.5 3 8 7.2 4 12.5 4c4.3 0 8.2 2.7 11.5 7.7C27.300 6.700 31.200 4 35.500 4 40.800 4 45 8 45 13.500 45 20 40 28 24 40Z"
      stroke="url(#obj-heart)"
      strokeWidth="3.4"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="obj-heart" x1="0" y1="0" x2="48" y2="44">
        <stop stopColor="#FFF1B8" />
        <stop offset="1" stopColor="#F5B800" />
      </linearGradient>
    </defs>
  </svg>
);

const PillarCard: React.FC<{ icon: string; lead: string; rest: string }> = ({ icon, lead, rest }) => (
  <div className="relative flex items-center gap-3.5 sm:gap-4 rounded-[26px] border-[2.5px] border-[#F3CB62] bg-gradient-to-br from-[#FFFFFF] via-[#F6EEFF] to-[#E9DBFB] px-3.5 py-3.5 sm:px-5 sm:py-4 shadow-[0_18px_34px_-16px_rgba(10,0,40,0.65),inset_0_1px_0_rgba(255,255,255,0.9)]">
    <img src={icon} alt="" loading="lazy" decoding="async" draggable={false} className="shrink-0 w-[68px] sm:w-[92px] h-auto object-contain" style={{ WebkitMaskImage: 'radial-gradient(ellipse 62% 62% at 50% 50%, #000 74%, transparent 100%)', maskImage: 'radial-gradient(ellipse 62% 62% at 50% 50%, #000 74%, transparent 100%)' }} />
    <span aria-hidden="true" className="self-stretch w-px bg-gradient-to-b from-transparent via-[#C9A24A]/70 to-transparent" />
    <p className="min-w-0 text-[13.5px] sm:text-[15px] leading-[1.55] text-[#4B2D78] font-semibold">
      <strong className="block text-[#2A1450] font-black text-[14.5px] sm:text-[16.5px]">{lead}</strong>
      {rest}
    </p>
  </div>
);

export const EventObjectiveSection: React.FC = () => {
  const { t } = useLang();

  return (
    <section id="objective" className="py-8 sm:py-12 bg-gradient-to-b from-[#FAF8FF] via-[#F7F3FF] to-[#F5F0FF] relative overflow-hidden scroll-mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5 }}
          className="relative isolate overflow-hidden rounded-[32px] border border-[#FFC928]/45 text-white shadow-[0_30px_64px_-20px_rgba(45,16,82,0.55)]"
          style={{ background: 'linear-gradient(115deg, #4B1FA8 0%, #3A1580 38%, #2A1450 100%)' }}
        >
          {/* glows + gold waves (all decoration) */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-28 left-[38%] w-[520px] h-[300px] rounded-full bg-[#9B5CF0]/30 blur-3xl" />
            <div className="absolute -bottom-24 right-[8%] w-[460px] h-[260px] rounded-full bg-[#FFC928]/14 blur-3xl" />
            <PawIcon size={120} color="#FFFFFF" className="absolute right-10 top-6 opacity-[0.05] rotate-12" />
            <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-[70px] sm:h-[96px]">
              <defs>
                <linearGradient id="obj-wave" x1="0" x2="1">
                  <stop offset="0" stopColor="#FFE9A8" stopOpacity="0" />
                  <stop offset="0.25" stopColor="#FFD35C" />
                  <stop offset="0.7" stopColor="#F5B800" />
                  <stop offset="1" stopColor="#FFE9A8" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path d="M0 96 C 240 40, 420 130, 700 84 S 1060 30, 1200 70 L1200 140 L0 140Z" fill="#2A1450" fillOpacity="0.55" />
              <path d="M0 96 C 240 40, 420 130, 700 84 S 1060 30, 1200 70" stroke="url(#obj-wave)" strokeWidth="3.5" fill="none" />
              <path d="M0 112 C 260 64, 460 140, 720 100 S 1080 52, 1200 90" stroke="url(#obj-wave)" strokeWidth="1.6" fill="none" opacity="0.6" />
            </svg>
          </div>

          {/* the picture of the elephant, runners and dog on the beach */}
          <img
            src="/images/objective/scene.webp"
            alt={t('ช้างม่วง นักวิ่ง และน้องหมาวิ่งริมชายหาดยามเย็น', 'The purple elephant, runners and a dog running on the beach at dusk')}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="hidden lg:block absolute -left-[2%] bottom-0 h-[92%] w-auto max-w-none pointer-events-none select-none"
            style={fadeSceneMask}
          />

          <div className="relative px-5 pt-5 pb-8 sm:px-8 sm:pt-6 lg:px-10 lg:pb-12">
            {/* badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2.5 rounded-full border-[2.5px] border-[#F3CB62] bg-gradient-to-b from-[#4A1E8C] to-[#2E1058] px-5 sm:px-7 py-2 sm:py-2.5 text-base sm:text-xl font-black shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.25)]">
                <PawIcon size={22} color="#FFC928" />
                <span className="bg-gradient-to-b from-white to-[#E9DBFF] bg-clip-text text-transparent">{t('วัตถุประสงค์ของการจัดงาน', 'Purpose of the event')}</span>
              </span>
            </div>

            <div className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-center lg:pl-[24%]">
              {/* headline + the one-line promise */}
              <div className="space-y-5">
                <h2 className="font-hero font-bold leading-[1.28] text-[1.7rem] sm:text-[2.2rem] lg:text-[clamp(1.6rem,2.35vw,2.35rem)]">
                  <span className="block bg-gradient-to-b from-white to-[#E4D4FF] bg-clip-text text-transparent">{t('วิ่งด้วยใจ เพื่อพัฒนาสุนัขตำรวจ', 'Run with heart, to develop police dogs')}</span>
                  <span className="mt-1 block">
                    <span className="bg-gradient-to-b from-[#FFF1B8] to-[#F5B800] bg-clip-text text-transparent">{t('และดูแลครอบครัว ตชด.', 'and look after BPP families')}</span>
                    <Heart className="inline-block align-middle ml-2 w-7 h-7 sm:w-10 sm:h-10 -translate-y-0.5" />
                  </span>
                  <svg viewBox="0 0 420 18" className="mt-1 w-[78%] max-w-[420px] h-4" fill="none" aria-hidden="true">
                    <path d="M2 11 C 70 2, 130 16, 210 9 S 350 4, 418 9" stroke="url(#obj-wave)" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </h2>

                <div className="inline-flex items-center gap-3.5 rounded-full border-2 border-[#F3CB62]/55 bg-gradient-to-r from-[#2A1060]/90 to-[#43198A]/80 pl-3 pr-6 sm:pr-8 py-3 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.18)]">
                  <span className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-b from-[#5B2BB8] to-[#35127A] border-2 border-[#F3CB62]/70 flex items-center justify-center">
                    <HandHeart className="w-8 h-8 text-[#FFD35C]" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <p className="text-[15px] sm:text-lg lg:text-[1.15rem] font-extrabold leading-snug">
                    {t('รายได้ทั้งหมดหลังหักค่าใช้จ่าย', 'All proceeds after expenses')}
                    <span className="block">
                      {t('นำไปใช้ใน ', 'go to ')}
                      <span className="text-[1.15em] font-black text-[#FFD35C]">{t('2 เรื่องสำคัญ', '2 important causes')}</span>
                    </span>
                  </p>
                </div>
                {/* the full sentence stays for screen readers and search */}
                <p className="sr-only">
                  {t(
                    'การจัดกิจกรรม ช้างศึก รัน เห็นช้างวิ่ง วิ่งตามช้าง (CHANGSUEK RUN 2027) มีวัตถุประสงค์เพื่อนำรายได้ทั้งหมดหลังหักค่าใช้จ่าย ไปใช้ใน 2 เรื่อง',
                    'CHANGSUEK RUN 2027 is held to use all proceeds after expenses for 2 purposes'
                  )}
                </p>
              </div>

              {/* the two purposes */}
              <ol className="space-y-4 sm:space-y-5">
                <li>
                  <PillarCard
                    icon="/images/objective/icon-shield.webp"
                    lead={t('พัฒนาและยกระดับ', 'Developing and raising')}
                    rest={t(
                      'ขีดความสามารถของกองกำกับการศูนย์ฝึกสุนัขตำรวจ กองบังคับการฝึกพิเศษ กองบัญชาการตำรวจตระเวนชายแดน',
                      'the capability of the Police K-9 Training Center, Special Training Division, Border Patrol Police Bureau'
                    )}
                  />
                </li>
                <li>
                  <PillarCard
                    icon="/images/objective/icon-hands.webp"
                    lead={t('เป็นกองทุนสวัสดิการช่วยเหลือ', 'A welfare fund supporting')}
                    rest={t(
                      'ข้าราชการตำรวจตระเวนชายแดน ครอบครัว ครูและนักเรียนโรงเรียนตำรวจตระเวนชายแดน',
                      'Border Patrol Police officers, their families, and teachers and students of Border Patrol Police schools'
                    )}
                  />
                </li>
              </ol>
            </div>

            {/* phones: the same picture as a strip under the cards */}
            <img
              src="/images/objective/scene.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              draggable={false}
              className="lg:hidden mt-4 -mx-5 sm:-mx-8 w-[calc(100%+2.5rem)] sm:w-[calc(100%+4rem)] h-52 sm:h-72 object-cover object-[0%_58%] pointer-events-none select-none"
              style={fadeSceneMask}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
