import React from 'react';
import { HeartHandshake, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { PawIcon } from './brand/DogDecor';
import { LabradorMascot } from './brand/LabradorMascot';

export const EventObjectiveSection: React.FC = () => {
  const pillars = [
    {
      title: 'พัฒนาศูนย์ฝึกสุนัขตำรวจ',
      subtitle: 'ค่ายพระรามหก อ.ชะอำ จ.เพชรบุรี',
      Icon: ShieldCheck,
      bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
      color: '#6D28D9',
      border: '#D8B4FE',
    },
    {
      title: 'ส่งเสริมสุขภาพคน & สัตว์เลี้ยง',
      subtitle: 'ออกกำลังกายเคียงข้างเพื่อนสี่ขา',
      Icon: HeartHandshake,
      bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      color: '#B45309',
      border: '#FDE68A',
    },
    {
      title: 'สานสัมพันธ์ ตชด. กับประชาชน',
      subtitle: 'ผ่านกิจกรรมสร้างสรรค์เพื่อสังคม',
      Icon: Users,
      bg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
      color: '#166534',
      border: '#BBF7D0',
    },
  ];

  return (
    <section
      id="objective"
      className="py-8 sm:py-12 bg-gradient-to-b from-[#FAF8FF] via-[#F7F3FF] to-[#F5F0FF] relative overflow-hidden scroll-mt-20"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-[32px] bg-gradient-to-br from-[#2B1052] via-[#3F1975] to-[#210A3E] text-white border border-white/20 shadow-[0_28px_60px_-16px_rgba(45,16,82,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] overflow-hidden"
        >
          {/* Top Golden Luminous Ribbon */}
          <div className="h-2 w-full bg-gradient-to-r from-[#FFE268] via-[#FF7A59] to-[#FFE268]" />

          {/* Ambient Glows & Decorative Paw Prints */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#FFC928]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#C084FC]/25 blur-3xl pointer-events-none" />
          <PawIcon
            size={90}
            color="#FFFFFF"
            className="absolute right-8 top-8 opacity-[0.05] rotate-12 pointer-events-none"
          />

          <div className="p-6 sm:p-9 lg:p-11 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-center">
              {/* Left Column: Eyebrow + Headline + Core Paragraphs + Labrador Mascot (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FFE268] to-[#FFC928] text-[#261247] shadow-md text-xs font-extrabold tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>วัตถุประสงค์ของการจัดงาน</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                      วิ่งด้วยใจ เพื่อพัฒนาสุนัขตำรวจ{' '}
                      <span className="text-[#FFE268]">สร้างความปลอดภัยให้สังคม</span>
                    </h2>
                  </div>
                  <div className="shrink-0 self-center sm:self-auto">
                    <LabradorMascot
                      size={82}
                      badgeText="K9 ค่ายพระรามหก"
                      glowColor="rgba(255, 226, 104, 0.38)"
                    />
                  </div>
                </div>

                <div className="space-y-3 text-sm sm:text-base text-purple-100/95 leading-relaxed font-medium pt-1">
                  <p>
                    การจัดงาน{' '}
                    <strong className="text-[#FFE28A] font-extrabold">
                      CHANGSUEK RUN – เห็นช้างวิ่ง วิ่งตามช้าง
                    </strong>{' '}
                    มีวัตถุประสงค์เพื่อระดมทุนและส่งเสริมการมีส่วนร่วมของประชาชนในการสนับสนุนการพัฒนา{' '}
                    <span className="underline decoration-[#FFC928]/80 decoration-2 underline-offset-4 font-bold text-white">
                      ศูนย์ฝึกสุนัขตำรวจ ค่ายพระรามหก อำเภอชะอำ จังหวัดเพชรบุรี
                    </span>{' '}
                    ให้มีความพร้อมด้านสถานที่ อุปกรณ์ และขีดความสามารถในการฝึกสุนัขตำรวจ
                    เพื่อเพิ่มประสิทธิภาพการปฏิบัติภารกิจด้านการรักษาความปลอดภัยและการให้บริการประชาชนอย่างยั่งยืน
                  </p>
                  <p>
                    พร้อมทั้งส่งเสริมการออกกำลังกาย การดูแลสุขภาพสัตว์เลี้ยง
                    และสร้างความสัมพันธ์อันดีระหว่างตำรวจตระเวนชายแดนกับประชาชน
                    ผ่านกิจกรรมสร้างสรรค์ที่ทุกคนสามารถมีส่วนร่วมได้
                  </p>
                </div>
              </div>

              {/* Right Column: 3 Key Mission Pillars (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                {pillars.map((pillar) => {
                  const Icon = pillar.Icon;
                  return (
                    <div
                      key={pillar.title}
                      className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-white shadow-[0_14px_30px_-10px_rgba(0,0,0,0.35)] flex items-center gap-3.5 transition-transform hover:-translate-y-0.5"
                    >
                      <span
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
                        style={{
                          background: pillar.bg,
                          color: pillar.color,
                          borderColor: pillar.border,
                        }}
                      >
                        <Icon className="w-6 h-6 stroke-[2.3]" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-[#261247] leading-snug">
                          {pillar.title}
                        </h3>
                        <p className="text-xs font-bold text-[#6B5A85] mt-0.5">
                          {pillar.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
