import React, { useState } from 'react';
import {
  Compass,
  UserPlus,
  CheckCircle2,
  MapPin,
  Flame,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { RouteId } from '../types';
import { PawIcon } from './brand/DogDecor';

interface ChangsuekRunExperienceProps {
  onOpenRegister: (routeId?: RouteId) => void;
  onOpenRunnerCenter: () => void;
  onOpenSimulation?: (routeId?: RouteId) => void;
  onSelectRoute: (routeId: RouteId) => void;
}

interface CompactStep {
  step: string;
  tag: string;
  headline: string;
  summary: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  actionLabel: string;
  onAction: () => void;
  accent: string;
  softBg: string;
  cardGrad: string;
}

export const ChangsuekRunExperience: React.FC<ChangsuekRunExperienceProps> = ({
  onOpenRegister,
  onOpenRunnerCenter,
  onOpenSimulation,
  onSelectRoute,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const steps: CompactStep[] = [
    {
      step: '01',
      tag: 'DISCOVER',
      headline: 'เลือกระยะที่ใช่',
      summary: 'เลือกวิ่ง 5K / 10K หรือวิ่งคู่กับน้องสุนัข 1K / 3K ริมหาดชะอำ',
      badge: '4 ระยะแข่งขัน',
      icon: Compass,
      actionLabel: 'เลือกบัตรวิ่ง',
      onAction: () => {
        const el = document.getElementById('distances');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      accent: '#15803D',
      softBg: '#DCFCE7',
      cardGrad: 'linear-gradient(160deg, #FFFFFF 0%, #ECFEF3 100%)',
    },
    {
      step: '02',
      tag: 'REGISTER',
      headline: 'สมัคร & รับ BIB',
      summary: 'ลงทะเบียนออนไลน์ใน 1 นาที รับป้าย Digital BIB ประจำตัวทันที',
      badge: 'ออนไลน์ 1 นาที',
      icon: UserPlus,
      actionLabel: 'สมัครรับ BIB',
      onAction: () => onOpenRegister(),
      accent: '#6D28D9',
      softBg: '#EDE9FE',
      cardGrad: 'linear-gradient(160deg, #FFFFFF 0%, #F4EEFF 100%)',
    },
    {
      step: '03',
      tag: 'PREPARE',
      headline: 'เตรียมตัวก่อนงาน',
      summary: 'ตรวจเช็กลิสต์อุปกรณ์ สภาพอากาศ และกติกาพาน้องสุนัขร่วมวิ่ง',
      badge: 'พร้อมครบ 100%',
      icon: CheckCircle2,
      actionLabel: 'เปิดศูนย์นักวิ่ง',
      onAction: () => onOpenRunnerCenter(),
      accent: '#0369A1',
      softBg: '#E0F2FE',
      cardGrad: 'linear-gradient(160deg, #FFFFFF 0%, #EDF8FF 100%)',
    },
    {
      step: '04',
      tag: 'PREVIEW',
      headline: 'สำรวจจุดให้น้ำ',
      summary: 'ดูพิกัดจุดกลับตัว จุดบริการน้ำดื่ม และเต็นท์พยาบาลบนแผนที่ GPS',
      badge: 'พิกัด GPS จริง',
      icon: MapPin,
      actionLabel: 'จำลองเส้นทาง',
      onAction: () => {
        if (onOpenSimulation) {
          onOpenSimulation('3km');
        } else {
          onSelectRoute('3km');
          const el = document.getElementById('schedule-and-map');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      },
      accent: '#B45309',
      softBg: '#FEF3C7',
      cardGrad: 'linear-gradient(160deg, #FFFFFF 0%, #FFFBEB 100%)',
    },
    {
      step: '05',
      tag: 'RACE DAY',
      headline: 'ออกสตาร์ทยามเย็น',
      summary: 'วอร์มอัพพร้อมกันและปล่อยตัวแยกตามระยะ รับลมทะเลยามเย็นริมหาดชะอำ',
      badge: 'ปล่อยตัว 16:30 น.',
      icon: Flame,
      actionLabel: 'ดูกำหนดการ',
      onAction: () => {
        const el = document.getElementById('schedule-and-map');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      accent: '#C2410C',
      softBg: '#FFEDD5',
      cardGrad: 'linear-gradient(160deg, #FFFFFF 0%, #FFF4EB 100%)',
    },
    {
      step: '06',
      tag: 'FINISH',
      headline: 'รับเหรียญเส้นชัย',
      summary: 'เข้าเส้นชัยรับเหรียญช้างศึก 3 มิติ พร้อมอาหารว่างและเกียรติบัตร',
      badge: 'Finisher Medal',
      icon: Award,
      actionLabel: 'ดูของที่ระลึก',
      onAction: () => {
        const el = document.getElementById('merch-showcase');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      accent: '#BE185D',
      softBg: '#FCE7F3',
      cardGrad: 'linear-gradient(160deg, #FFFFFF 0%, #FFF0F7 100%)',
    },
  ];

  return (
    <section
      id="experience"
      className="py-12 sm:py-16 relative overflow-hidden scroll-mt-20"
      style={{
        background:
          'linear-gradient(135deg, #240B44 0%, #3E1672 52%, #200A3C 100%)',
      }}
    >
      {/* Ambient Golden & Lavender Glows */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[#FFC928]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-[#9B59FF]/25 rounded-full blur-3xl pointer-events-none" />
      <PawIcon
        size={140}
        color="#FFFFFF"
        className="absolute top-6 right-10 opacity-5 rotate-12 pointer-events-none"
      />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Vibrant Header on Deep Purple Backdrop */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFC928] text-[#2A1450] border-2 border-white/40 text-[11px] font-extrabold uppercase tracking-wider mb-2.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#2A1450]" />
              <span>6 ขั้นตอนสู่เส้นชัย</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A1450] tracking-tight leading-tight">
              การเดินทางของนักวิ่งช้างศึก
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#4B2D78] font-medium max-w-md">
            6 ขั้นตอนกระชับเข้าใจง่าย ตั้งแต่เลือกระยะวิ่ง รับป้าย Digital BIB ไปจนถึงการพิชิตเหรียญรางวัลริมหาดชะอำ
          </p>
        </div>

        {/* Connected 6-Step Horizontal Roadmap */}
        <div className="relative">
          {/* Glowing Golden Track Line behind step cards on Desktop */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-8 right-8 h-1.5 bg-gradient-to-r from-[#22C55E] via-[#FFC928] to-[#EC4899] rounded-full opacity-50 pointer-events-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4 relative z-10">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              const isActive = activeIndex === idx;

              return (
                <motion.div
                  key={st.step}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    setActiveIndex(idx);
                    st.onAction();
                  }}
                  style={{ background: st.cardGrad }}
                  className={`group relative rounded-[24px] p-4 sm:p-4.5 flex flex-col justify-between transition-all duration-200 cursor-pointer border-2 overflow-hidden ${
                    isActive
                      ? 'border-[#FFC928] shadow-[0_18px_36px_-10px_rgba(0,0,0,0.45),0_5px_0_#FFC928]'
                      : 'border-white/90 hover:border-[#FFC928] shadow-[0_12px_24px_-10px_rgba(0,0,0,0.35),0_4px_0_rgba(255,255,255,0.25)]'
                  }`}
                >
                  {/* Top Color Bar */}
                  <div
                    className="absolute top-0 inset-x-0 h-1.5"
                    style={{ background: st.accent }}
                  />

                  <div>
                    {/* Top Row: Step Number Badge + Icon */}
                    <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-8 h-8 rounded-xl font-display font-black text-xs text-white flex items-center justify-center border-2 border-[#2A1450] shadow-[2px_2px_0_#2A1450] transition-transform group-hover:scale-105"
                          style={{ background: st.accent }}
                        >
                          {st.step}
                        </span>
                        <span
                          className="text-[10px] font-mono font-extrabold uppercase tracking-wider"
                          style={{ color: st.accent }}
                        >
                          {st.tag}
                        </span>
                      </div>

                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-black/10 transition-transform group-hover:rotate-6"
                        style={{ background: st.softBg, color: st.accent }}
                      >
                        <Icon className="w-4 h-4 stroke-[2.4]" />
                      </span>
                    </div>

                    {/* Badge Pill */}
                    <span
                      className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mb-2 border border-black/5"
                      style={{ background: st.softBg, color: st.accent }}
                    >
                      {st.badge}
                    </span>

                    {/* Step Title */}
                    <h3 className="text-base font-extrabold text-[#2A1450] leading-snug group-hover:text-[#5B20A8] transition-colors">
                      {st.headline}
                    </h3>

                    {/* Concise 2-Line Description */}
                    <p className="mt-1 text-xs text-[#4B2D78] font-semibold leading-relaxed line-clamp-2">
                      {st.summary}
                    </p>
                  </div>

                  {/* Compact Tactile Action Pill */}
                  <div className="mt-4 pt-2.5 border-t border-[#2A1450]/10 flex items-center justify-between text-xs font-extrabold text-[#2A1450] group-hover:text-[#5B20A8]">
                    <span>{st.actionLabel}</span>
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white transition-transform group-hover:translate-x-1 shadow-xs"
                      style={{ background: st.accent }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
