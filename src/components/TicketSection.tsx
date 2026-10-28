import React, { useMemo, useState, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Droplets,
  Flame,
  Headphones,
  Medal,
  Minus,
  Plus,
  RotateCw,
  ShieldCheck,
  ShoppingCart,
  Shirt,
  Sparkles,
  Ticket,
  UserPlus,
  Zap,
  Heart,
} from 'lucide-react';
import { RouteId } from '../types';
import {
  ticketCategories,
  TicketCategory,
  ticketById,
  routesData,
} from '../data/eventData';
import { PawIcon } from './brand/DogDecor';
import { LABRADOR_SVG_PATH, LabradorMascot } from './brand/LabradorMascot';

interface TicketSectionProps {
  selectedRoute: RouteId;
  onSelectRoute: (id: RouteId) => void;
  onOpenRegister: (id?: RouteId, extras?: { people: number; dogs: number }) => void;
  onOpenComparisonModal?: () => void;
}

interface CardTheme {
  grad: string;
  headerGrad: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  borderIdle: string;
  borderActive: string;
  shadowIdle: string;
  shadowActive: string;
  badgeBg: string;
  badgeText: string;
  btnGrad: string;
  btnText: string;
  btnShadow: string;
  iconColor: string;
  serialCode: string;
  bibPrefix: string;
  waveLabel: string;
  startTime: string;
  cutoff: string;
  elevationText: string;
  waterCount: number;
  sub: string;
  burstEmojis: string[];
}

const look: Record<RouteId, CardTheme> = {
  '1km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #FFF6F1 55%, #FFE6D8 100%)',
    headerGrad: 'linear-gradient(135deg, #FF7A59 0%, #FF4E88 100%)',
    accent: '#FF5A5F',
    accentDark: '#C2410C',
    accentSoft: '#FFF0E8',
    borderIdle: 'rgba(255, 122, 89, 0.35)',
    borderActive: '#FF5A5F',
    shadowIdle: '0 18px 38px -14px rgba(255, 90, 95, 0.24), 0 4px 12px -2px rgba(255, 90, 95, 0.1)',
    shadowActive: '0 24px 48px -12px rgba(255, 90, 95, 0.42), 0 0 0 3px rgba(255, 90, 95, 0.25)',
    badgeBg: '#FFFFFF',
    badgeText: '#E11D48',
    btnGrad: 'linear-gradient(135deg, #FF7A59 0%, #FF4E88 100%)',
    btnText: '#FFFFFF',
    btnShadow: '0 10px 22px -6px rgba(255, 78, 136, 0.5)',
    iconColor: '#F43F5E',
    serialCode: 'CSR27-DOG-01K',
    bibPrefix: '01-XXXX',
    waveLabel: 'DOG MINI BEACH · 1K',
    startTime: '17.30 น.',
    cutoff: '45 นาที',
    elevationText: 'เลียบหาดทราย 100%',
    waterCount: 2,
    sub: 'เดิน-วิ่งชิลล์ริมหาดกับน้องสุนัขตัวโปรด',
    burstEmojis: ['🐶', '🐾', '💖', '🦴', '✨', '🎉'],
  },
  '3km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #F0FDF9 55%, #CCFBF1 100%)',
    headerGrad: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
    accent: '#0D9488',
    accentDark: '#0F766E',
    accentSoft: '#E6FFFA',
    borderIdle: 'rgba(16, 185, 129, 0.35)',
    borderActive: '#10B981',
    shadowIdle: '0 18px 38px -14px rgba(16, 185, 129, 0.24), 0 4px 12px -2px rgba(14, 165, 233, 0.1)',
    shadowActive: '0 24px 48px -12px rgba(16, 185, 129, 0.42), 0 0 0 3px rgba(16, 185, 129, 0.25)',
    badgeBg: '#FEF9C3',
    badgeText: '#065F46',
    btnGrad: 'linear-gradient(135deg, #10B981 0%, #0284C7 100%)',
    btnText: '#FFFFFF',
    btnShadow: '0 10px 22px -6px rgba(16, 185, 129, 0.48)',
    iconColor: '#0F766E',
    serialCode: 'CSR27-DOG-03K',
    bibPrefix: '03-XXXX',
    waveLabel: 'DOG BUDDY RUN · 3.8K',
    startTime: '17.15 น.',
    cutoff: '60 นาที',
    elevationText: 'เลียบหาด + ทิวสนร่มรื่น',
    waterCount: 3,
    sub: 'วิ่งสนุกกำลังดี ไปด้วยกันทั้งคนและน้องสุนัข',
    burstEmojis: ['🐕', '🐾', '💚', '🏅', '✨', '🌊'],
  },
  '5km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #FFFBEB 55%, #FEF08A 100%)',
    headerGrad: 'linear-gradient(135deg, #F59E0B 0%, #FF6B6B 100%)',
    accent: '#B45309',
    accentDark: '#B45309',
    accentSoft: '#FEF3C7',
    borderIdle: 'rgba(245, 158, 11, 0.38)',
    borderActive: '#F59E0B',
    shadowIdle: '0 18px 38px -14px rgba(245, 158, 11, 0.24), 0 4px 12px -2px rgba(245, 158, 11, 0.1)',
    shadowActive: '0 24px 48px -12px rgba(245, 158, 11, 0.42), 0 0 0 3px rgba(245, 158, 11, 0.28)',
    badgeBg: '#FFFFFF',
    badgeText: '#B45309',
    btnGrad: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
    btnText: '#261247',
    btnShadow: '0 10px 22px -6px rgba(245, 158, 11, 0.5)',
    iconColor: '#B45309',
    serialCode: 'CSR27-FUN-05K',
    bibPrefix: '05-XXXX',
    waveLabel: 'FUN & MASS RUN · 5K',
    startTime: '17.00 น.',
    cutoff: '75 นาที',
    elevationText: 'ทางเรียบ + ชายหาด',
    waterCount: 3,
    sub: 'สำหรับผู้เริ่มต้น สายสุขภาพ และครอบครัว',
    burstEmojis: ['👟', '✨', '🏅', '⚡', '🌟', '🎉'],
  },
  '10km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #F5F3FF 55%, #E9D5FF 100%)',
    headerGrad: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)',
    accent: '#8B5CF6',
    accentDark: '#5B21B6',
    accentSoft: '#F3E8FF',
    borderIdle: 'rgba(139, 92, 246, 0.35)',
    borderActive: '#8B5CF6',
    shadowIdle: '0 18px 38px -14px rgba(139, 92, 246, 0.25), 0 4px 12px -2px rgba(236, 72, 153, 0.1)',
    shadowActive: '0 24px 48px -12px rgba(139, 92, 246, 0.44), 0 0 0 3px rgba(139, 92, 246, 0.28)',
    badgeBg: '#FEF08A',
    badgeText: '#4C1D95',
    btnGrad: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
    btnText: '#FFFFFF',
    btnShadow: '0 10px 22px -6px rgba(147, 51, 234, 0.5)',
    iconColor: '#7C3AED',
    serialCode: 'CSR27-PRO-10K',
    bibPrefix: '10-XXXX',
    waveLabel: 'MINI MARATHON · 10K',
    startTime: '16.30 น.',
    cutoff: '120 นาที',
    elevationText: 'รอบค่ายนเรศวรครบวง',
    waterCount: 5,
    sub: 'ท้าทายสถิติใหม่บนเส้นทางชายหาดประวัติศาสตร์',
    burstEmojis: ['🏃', '🔥', '🏆', '⚡', '✨', '💜'],
  },
};

const BURST_VECTORS = [
  { dx: -56, dy: -52, rot: -24 },
  { dx: 0, dy: -68, rot: 10 },
  { dx: 56, dy: -50, rot: 26 },
  { dx: -68, dy: 4, rot: -30 },
  { dx: 68, dy: 8, rot: 30 },
  { dx: -44, dy: 52, rot: -18 },
  { dx: 46, dy: 52, rot: 20 },
];

const compactPerks = (isDog: boolean) => [
  {
    Icon: Shirt,
    title: isDog ? 'เสื้อคน + ผ้าพันคอน้องสุนัข' : 'เสื้อวิ่ง Micro-Dry',
  },
  {
    Icon: Medal,
    title: 'เหรียญรางวัล 3D',
  },
  {
    Icon: Ticket,
    title: isDog ? 'BIB คู่ คน+น้องสุนัข' : 'ป้าย BIB + ชิปเวลา',
  },
  {
    Icon: Droplets,
    title: isDog ? 'น้ำดื่ม & ขนมน้องสุนัข' : 'อาหาร & เกลือแร่',
  },
];

const TicketCard: React.FC<{
  t: TicketCategory;
  selected: boolean;
  index: number;
  onSelect: () => void;
  onRegister: () => void;
}> = ({ t, selected, index, onSelect, onRegister }) => {
  const l = look[t.id];
  const isDog = t.group === 'dog';
  const routeInfo = routesData[t.id];
  const [burstKey, setBurstKey] = useState(0);
  const [isPopping, setIsPopping] = useState(false);
  const [stubTorn, setStubTorn] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Interactive 3D tilt motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 260, damping: 24 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleCardClick = () => {
    setBurstKey((prev) => prev + 1);
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 160);
    onSelect();
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStubTorn(true);
    setBurstKey((prev) => prev + 1);
    setTimeout(() => {
      setStubTorn(false);
      onRegister();
    }, 220);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 22,
        delay: index * 0.06,
      }}
      className="perspective-1200 h-full relative"
    >
      {/* ============================================================ */}
      {/* PLAYFUL CLICK PARTICLE BURST                                 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {burstKey > 0 && (
          <div
            key={burstKey}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-visible"
          >
            {BURST_VECTORS.map((vec, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.4, rotate: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  x: vec.dx,
                  y: vec.dy,
                  scale: [0.5, 1.25, 0.85],
                  rotate: vec.rot,
                }}
                exit={{ opacity: 0 }}
                transition={{ type: 'tween', duration: 0.6, ease: 'easeOut' }}
                className="absolute text-xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)] select-none"
              >
                {l.burstEmojis[i % l.burstEmojis.length]}
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
        }}
        animate={{
          scale: isPopping ? 0.97 : selected ? 1.015 : 1,
          y: isPopping ? -2 : selected ? -6 : 0,
        }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        onClick={handleCardClick}
        className="relative h-full w-full preserve-3d cursor-pointer select-none group"
      >
        {/* ============================================================ */}
        {/* FRONT OF MODERN COMPACT FESTIVAL PASS                        */}
        {/* ============================================================ */}
        <article
          className="relative flex flex-col h-full rounded-[28px] overflow-hidden backface-hidden transition-all duration-300"
          style={{
            background: l.grad,
            border: selected ? `2.5px solid ${l.borderActive}` : `1.5px solid ${l.borderIdle}`,
            boxShadow: selected ? l.shadowActive : l.shadowIdle,
          }}
        >
          {/* Soft Iridescent Foil Sheen on Hover */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          >
            <div className="absolute -inset-y-12 w-28 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-ticket-shimmer" />
          </div>

          {/* Interactive Specular Pointer Light Glare */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-50 transition-opacity duration-300"
            style={{
              background: useTransform(
                [glareX, glareY],
                ([x, y]) =>
                  `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.92) 0%, transparent 58%)`
              ),
            }}
          />

          {/* 1. COMPACT LUMINOUS HEADER WITH ANIMATED LABRADOR / MEDALLION */}
          <div
            className="relative px-4 pt-3.5 pb-4 text-white overflow-hidden"
            style={{ background: l.headerGrad }}
          >
            {/* Top Specular Highlight Rim */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-white/60 pointer-events-none"
            />
            {/* Soft Ambient Glow Circle */}
            <div
              aria-hidden="true"
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/25 blur-2xl pointer-events-none"
            />

            {/* Top Row: Category Pill + 3D BIB Flip Button */}
            <div className="relative z-10 flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs"
                  style={{ background: l.badgeBg, color: l.badgeText }}
                >
                  {isDog ? (
                    <>
                      <PawIcon size={10} color="currentColor" />
                      <span>DOG RUN</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 fill-current" />
                      <span>RUNNER</span>
                    </>
                  )}
                </span>

                {t.badge && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black/25 text-white backdrop-blur-md border border-white/25">
                    <Sparkles className="w-2.5 h-2.5 text-[#FFE28A]" />
                    <span>{t.badge}</span>
                  </span>
                )}
              </div>

            </div>

            {/* Distance Title + Cute Mascot Avatar */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl sm:text-[42px] font-black leading-none tracking-tight text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.22)]">
                    {t.distanceLabel}
                  </span>
                  <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-black/25 text-white/95 border border-white/20">
                    BIB {l.bibPrefix}
                  </span>
                </div>
                <h4 className="mt-1 text-sm font-extrabold text-white/95 truncate">
                  {t.name}
                </h4>
              </div>

              {/* Cute Floating Mascot: Animated Labrador for Dog Runs, Glowing Medallion for 5K/10K */}
              <motion.div
                animate={
                  selected || isPopping
                    ? { y: [0, -5, 0], scale: [1, 1.1, 1] }
                    : { y: 0, scale: 1 }
                }
                transition={{ type: 'tween', duration: 0.45, ease: 'easeOut' }}
                className="relative w-14 h-14 rounded-2xl bg-white/95 border-2 border-white shadow-[0_10px_20px_-6px_rgba(0,0,0,0.28)] flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-110 group-hover:-rotate-3 transition-transform"
              >
                {isDog ? (
                  <img loading="lazy" decoding="async"
                    src={LABRADOR_SVG_PATH}
                    alt="Labrador Mascot"
                    className="w-13 h-13 object-contain translate-y-0.5"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl">{t.emoji}</span>
                )}
              </motion.div>
            </div>

            {/* Compact Inline Telemetry Strip inside Header Bottom */}
            <div className="relative z-10 mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-bold text-white/95">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#FFE28A]" />
                <span>ปล่อยตัว {l.startTime}</span>
              </span>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#FFE28A]" />
                <span>{l.cutoff}</span>
              </span>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Droplets className="w-3 h-3 text-[#FFE28A]" />
                <span>น้ำ {l.waterCount} จุด</span>
              </span>
            </div>
          </div>

          {/* 2. COMPACT BODY: SUBTITLE, STAMP GIMMICK & 2x2 PERK GRID */}
          <div className="p-4 pb-3 flex-1 flex flex-col justify-between relative z-10">
            <div>
              {/* Subtitle + Interactive Paw Stamp Indicator */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <p className="text-[11px] font-bold text-[#4B2D78] leading-snug line-clamp-1">
                  {l.sub}
                </p>
                <AnimatePresence mode="wait">
                  {selected ? (
                    <motion.span
                      key="stamped"
                      initial={{ scale: 1.7, rotate: -14, opacity: 0 }}
                      animate={{ scale: 1, rotate: -4, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 15 }}
                      className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-xs shrink-0"
                      style={{ background: l.accent }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>ปั๊มเลือกแล้ว</span>
                    </motion.span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#6B5A85] bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/80 shrink-0">
                      แตะเพื่อเลือก
                    </span>
                  )}
                </AnimatePresence>
              </div>

              {/* Compact 2x2 Grid of Included Perks */}
              <div className="grid grid-cols-2 gap-1.5">
                {compactPerks(isDog).map(({ Icon, title }) => (
                  <div
                    key={title}
                    className="flex items-center gap-1.5 bg-white/90 rounded-xl px-2.5 py-2 border border-white shadow-[0_2px_8px_-2px_rgba(42,20,80,0.08)]"
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: l.accentSoft, color: l.iconColor }}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2.3]" />
                    </span>
                    <span className="text-[11px] font-extrabold text-[#261247] leading-tight line-clamp-2">
                      {title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dog Run Add-on Pill */}
            {isDog ? (
              <div
                className="mt-2.5 px-3 py-1.5 rounded-xl bg-white/90 border border-dashed flex items-center justify-between text-[11px] font-extrabold"
                style={{ borderColor: l.accent }}
              >
                <span className="text-[#4B2D78] flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span>เพิ่มคนวิ่งได้ (น้องสุนัข 1 ตัวรวมในตั๋ว):</span>
                </span>
                <span className="tabular-nums font-black" style={{ color: l.accentDark }}>
                  +{t.addPersonPrice}฿/คน
                </span>
              </div>
            ) : (
              <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-white/75 border border-slate-200/70 flex items-center justify-between text-[11px] font-bold text-[#6B5A85]">
                <span>เส้นทางมาตรฐาน:</span>
                <span className="font-extrabold text-[#261247]">{l.elevationText}</span>
              </div>
            )}
            {t.id === '10km' && (
              <div className="mt-2 px-3 py-2 rounded-xl bg-[#FFF4D2] border-2 border-[#2A1450] text-xs font-extrabold text-[#2A1450] flex items-center gap-2">
                <span aria-hidden="true" className="text-base">⏱️</span>
                <span>ระยะ 10 กม. ติดชิปจับเวลา (Timing Chip) ทุกคน</span>
              </div>
            )}
          </div>

          {/* 3. PERFORATED TEAR-OFF NOTCH DIVIDER */}
          <div className="relative flex items-center justify-between px-2" aria-hidden="true">
            <div
              className="-ml-4 w-5 h-5 rounded-full bg-[#F5F0FF] shrink-0"
              style={{
                borderRight: selected ? `2.5px solid ${l.borderActive}` : `1.5px solid ${l.borderIdle}`,
              }}
            />
            <div className="w-full border-t-2 border-dashed border-[#261247]/15 mx-1.5" />
            <span
              className="text-[9px] font-mono font-extrabold tracking-widest uppercase shrink-0 px-2 py-0.5 rounded-full border border-white shadow-2xs flex items-center gap-1"
              style={{ background: l.accentSoft, color: l.accentDark }}
            >
              <Ticket className="w-2.5 h-2.5" />
              <span>{l.serialCode}</span>
            </span>
            <div className="w-full border-t-2 border-dashed border-[#261247]/15 mx-1.5" />
            <div
              className="-mr-4 w-5 h-5 rounded-full bg-[#F5F0FF] shrink-0"
              style={{
                borderLeft: selected ? `2.5px solid ${l.borderActive}` : `1.5px solid ${l.borderIdle}`,
              }}
            />
          </div>

          {/* 4. INTERACTIVE TEAR-STUB FOOTER: PRICE & 1-CLICK REGISTER */}
          <motion.div
            animate={stubTorn ? { y: 6, rotate: 1.5 } : { y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="p-4 pt-2.5 bg-white/90 backdrop-blur-md relative z-10"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="block text-[10px] font-bold text-[#6B5A85]">
                  ราคาบัตร ({t.baseLabel})
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className="font-display text-3xl font-black tabular-nums leading-none"
                    style={{ color: l.accentDark }}
                  >
                    {t.basePrice.toLocaleString('th-TH')}
                  </span>
                  <span className="text-xs font-extrabold text-[#261247]">บาท</span>
                </div>
              </div>

              {/* Cute Interactive Barcode + Labrador Paw Stamp */}
              <div className="text-right flex items-center gap-2" aria-hidden="true">
                <div>
                  <div className="inline-flex items-end gap-[2px] h-5 opacity-65">
                    {[2, 3.5, 1.5, 3, 1.5, 3.5, 2, 1.5, 3, 2].map((w, idx) => (
                      <span
                        key={idx}
                        className="bg-[#261247] rounded-full inline-block"
                        style={{
                          width: `${w}px`,
                          height: idx % 2 === 0 ? '100%' : '75%',
                        }}
                      />
                    ))}
                  </div>
                  <span className="block text-[8px] font-mono font-extrabold text-[#6B5A85] tracking-widest">
                    E-PASS
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRegisterClick}
              className="relative overflow-hidden w-full rounded-2xl py-2.5 px-4 flex items-center justify-center gap-2 font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
              style={{
                background: l.btnGrad,
                color: l.btnText,
                boxShadow: l.btnShadow,
              }}
            >
              <span className="absolute inset-0 ticket-foil-shimmer opacity-40 pointer-events-none" />
              <Ticket className="w-4 h-4 shrink-0 relative z-10" />
              <span className="relative z-10">สมัครวิ่งระยะ {t.distanceLabel}</span>
              <ArrowRight className="w-4 h-4 ml-auto relative z-10 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </motion.div>
        </article>
      </motion.div>
    </motion.div>
  );
};

/** Calculator state: one registration at a time (1 KM or 3.8 KM). */
type Dist = '1km' | '3km';
type Counts = Record<Dist, { base: number; people: number; dogs: number }>;
const emptyCounts: Counts = {
  '1km': { base: 1, people: 0, dogs: 0 },
  '3km': { base: 0, people: 0, dogs: 0 },
};

const Qty: React.FC<{
  value: number;
  onChange: (n: number) => void;
  max: number;
  label: string;
}> = ({ value, onChange, max, label }) => (
  <div className="flex items-center rounded-full bg-[#F5F0FF] border border-[#7B3FC6]/20 overflow-hidden shadow-2xs">
    <button
      type="button"
      aria-label={`ลด ${label}`}
      disabled={value <= 0}
      onClick={() => onChange(value - 1)}
      className="w-7 h-7 flex items-center justify-center text-[#261247] disabled:opacity-30 hover:bg-[#E9D5FF] active:scale-90 transition cursor-pointer"
    >
      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
    </button>
    <span className="w-6 text-center text-xs font-extrabold text-[#261247] tabular-nums">
      {value}
    </span>
    <button
      type="button"
      aria-label={`เพิ่ม ${label}`}
      disabled={value >= max}
      onClick={() => onChange(value + 1)}
      className="w-7 h-7 flex items-center justify-center text-[#261247] disabled:opacity-30 hover:bg-[#FFC928] active:scale-90 transition cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
    </button>
  </div>
);

export const TicketSection: React.FC<TicketSectionProps> = ({
  selectedRoute,
  onSelectRoute,
  onOpenRegister,
  onOpenComparisonModal,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'individual' | 'dog'>('all');
  const [counts, setCounts] = useState<Counts>(emptyCounts);

  const individual = ticketCategories.filter((t) => t.group === 'individual');
  const dog = ticketCategories.filter((t) => t.group === 'dog');

  const t5k = ticketById('5km');
  const t10k = ticketById('10km');
  const t1k = ticketById('1km');
  const t3k = ticketById('3km');


  const update = (d: Dist, field: 'base' | 'people' | 'dogs', value: number) => {
    const other: Dist = d === '1km' ? '3km' : '1km';
    setCounts((c) => {
      const cur = { ...c[d], [field]: value };
      if (field === 'base' && value === 0) {
        cur.people = 0;
        cur.dogs = 0;
      }
      if (field !== 'base' && value > 0) cur.base = 1;
      return { [d]: cur, [other]: { base: 0, people: 0, dogs: 0 } } as Counts;
    });
  };

  const calc = useMemo(() => {
    const active: Dist = counts['3km'].base > 0 ? '3km' : '1km';
    const c = counts[active];
    const t = ticketById(active);
    const total =
      c.base * t.basePrice +
      c.people * (t.addPersonPrice ?? 0);
    return {
      active,
      total,
      c,
      totalPeople: c.base > 0 ? 1 + c.people : 0,
      totalDogs: c.base > 0 ? 1 : 0,
    };
  }, [counts]);

  const calcRows: {
    d: Dist;
    field: 'base' | 'people' | 'dogs';
    label: string;
    price: number;
    max: number;
    Icon: any;
    color: string;
  }[] = [];

  (['1km', '3km'] as Dist[]).forEach((d) => {
    const t = ticketById(d);
    const km = d === '1km' ? '1' : '3';
    calcRows.push(
      {
        d,
        field: 'base',
        label: `Dog ${km} กม. (1 คน + 1 น้องสุนัข)`,
        price: t.basePrice,
        max: 1,
        Icon: PawIcon,
        color: '#F43F5E',
      },
      {
        d,
        field: 'people',
        label: `Dog ${km} กม. เพิ่มคน`,
        price: t.addPersonPrice ?? 0,
        max: 9,
        Icon: UserPlus,
        color: '#7C3AED',
      }
    );
  });

  return (
    <div>
      {/* ---------- 1. EVENT CATEGORY HEADER WITH LABRADOR MASCOT ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <LabradorMascot size={66} interactive={true} />
          </div>
          <div>
            <span className="block text-[11px] font-mono font-extrabold uppercase text-[#7B3FC6]">
              บัตรวิ่งโฉมใหม่
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-[#261247] leading-tight">
              ซื้อบัตรของคุณ
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#6B5A85] mt-0.5">
              มี 3 ส่วน เลือกอย่างเดียวหรือครบทั้งหมดก็ได้ ไม่จำเป็นต้องวิ่ง
            </p>
            <ol className="mt-2 flex flex-wrap gap-1.5 text-xs font-extrabold" aria-label="3 ส่วนของการซื้อบัตร">
              {[
                { n: 1, label: '🏃 วิ่ง', href: '#ticket-cards', bg: '#7B3FC6', fg: '#fff' },
                { n: 2, label: '🎶 คอนเสิร์ต', href: '#concert-pass', bg: '#FFC928', fg: '#2A1450' },
                { n: 3, label: '🎢 กิจกรรมเสริม', href: '#addons', bg: '#EC4899', fg: '#fff' },
              ].map((c) => (
                <li key={c.n}>
                  <a href={c.href} className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full border-2 border-[#2A1450] shadow-[0_3px_0_#2A1450]" style={{ background: c.bg, color: c.fg }}>
                    <span className="tabular-nums">{c.n}.</span> {c.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Interactive Category Filter Segmented Control */}
          <div
            role="tablist"
            aria-label="กรองประเภทบัตรวิ่ง"
            className="inline-flex items-center gap-1 p-1 rounded-full bg-white/90 backdrop-blur-md border border-[#7B3FC6]/20 shadow-[0_8px_20px_-6px_rgba(91,32,168,0.15)]"
          >
            {[
              { id: 'all', label: 'ทั้งหมด (4 ระยะ)' },
              { id: 'dog', label: '🐾 วิ่งกับน้องสุนัข (1K/3.8K)' },
              { id: 'individual', label: '🏃 วิ่งบุคคล (5K/10K)' },
            ].map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilterTab(tab.id as 'all' | 'individual' | 'dog')}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-colors whitespace-nowrap cursor-pointer ${
                    active ? 'text-[#261247]' : 'text-[#6B5A85] hover:text-[#261247]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="ticketFilterPill"
                      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFE268] to-[#FFC928] shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {onOpenComparisonModal && (
            <button
              type="button"
              onClick={onOpenComparisonModal}
              className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-[#FAF7FF] text-[#261247] border border-[#7B3FC6]/30 px-4 py-2 text-xs sm:text-sm font-extrabold shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <span>เปรียบเทียบระยะวิ่ง</span>
              <ArrowRight className="w-4 h-4 text-[#7B3FC6]" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ---------- 2. COMPACT LUMINOUS TICKET PASSES GRID (4-CARD ROW) ---------- */}
      <AnimatePresence mode="wait">
        <span id="ticket-cards" className="block scroll-mt-24" aria-hidden="true" />
        {filterTab === 'all' ? (
          <motion.div
            key="all-4-cards"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-3 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-5 mb-3 sm:mb-9"
          >
            {ticketCategories.map((t, i) => (
              <div key={t.id} className="shrink-0 w-[84%] snap-center sm:w-auto">
                <TicketCard
                  t={t}
                  index={i}
                  selected={selectedRoute === t.id}
                  onSelect={() => onSelectRoute(t.id)}
                  onRegister={() => onOpenRegister(t.id)}
                />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={filterTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-3 sm:mx-auto sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 sm:gap-5 max-w-3xl mb-3 sm:mb-9"
          >
            {(filterTab === 'individual' ? individual : dog).map((t, i) => (
              <div key={t.id} className="shrink-0 w-[84%] snap-center sm:w-auto">
                <TicketCard
                  t={t}
                  index={i}
                  selected={selectedRoute === t.id}
                  onSelect={() => onSelectRoute(t.id)}
                  onRegister={() => onOpenRegister(t.id)}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="sm:hidden text-center text-xs font-bold text-[#6B5A85] mb-7" aria-hidden="true">
        ← ปัดเพื่อดูบัตรระยะอื่น →
      </p>

      {/* ---------- 3. PRICE TABLE + INTERACTIVE LIVE PASS BUILDER ---------- */}
      <div id="ticket-pricing" className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-7 scroll-mt-24">
        {/* Dog Run Pass Builder & price calculator (full width) */}
        <div className="lg:col-span-12 lg:max-w-5xl lg:mx-auto lg:w-full rounded-[28px] overflow-hidden bg-white/95 backdrop-blur-md border border-[#7B3FC6]/20 shadow-[0_20px_45px_-16px_rgba(75,45,120,0.18)] flex flex-col justify-between">
          <div className="px-6 py-4 bg-gradient-to-r from-[#FFF7ED] via-[#FAF5FF] to-[#F0FDFA] border-b border-[#7B3FC6]/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFE268] to-[#F59E0B] flex items-center justify-center shrink-0 shadow-sm">
                <ShoppingCart className="w-5 h-5 text-[#261247]" />
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#261247] leading-tight">
                  จำลองแพ็กเกจบัตรวิ่ง Dog Run & คำนวณราคา
                </h3>
                <p className="text-xs font-semibold text-[#6B5A85]">
                  ปรับจำนวนคนและน้องสุนัข แล้วดูราคารวมของกลุ่มคุณ
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center flex-1">
            {/* Stepper Controls (7 of 12 cols) */}
            <ul className="md:col-span-7 divide-y divide-[#F3ECFF]">
              {calcRows.map((r) => {
                const isSelectedDist = calc.active === r.d;
                return (
                  <li
                    key={r.d + r.field}
                    className={`flex items-center gap-2.5 py-2.5 px-2 rounded-xl transition-colors ${
                      isSelectedDist ? 'bg-[#FAF8FF]' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-lg bg-white border border-[#E9D5FF] flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ color: r.color }}
                    >
                      <r.Icon
                        {...(r.Icon === PawIcon
                          ? { size: 15, color: r.color }
                          : { className: 'w-4 h-4' })}
                      />
                    </span>
                    <span className="flex-1 text-xs sm:text-[13px] font-bold text-[#261247] leading-tight">
                      {r.label}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#261247] w-14 text-right tabular-nums">
                      {r.price.toLocaleString('th-TH')}.-
                    </span>
                    <Qty
                      value={counts[r.d][r.field]}
                      max={r.max}
                      label={r.label}
                      onChange={(n) => update(r.d, r.field, n)}
                    />
                  </li>
                );
              })}
            </ul>

            {/* Live Animated Mini Ticket Stub Preview with Labrador Mascot (5 of 12 cols) */}
            <div className="md:col-span-5">
              <motion.div
                key={`${calc.active}-${calc.totalPeople}-${calc.totalDogs}`}
                initial={{ scale: 0.96, opacity: 0.85 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="rounded-3xl p-4 relative overflow-hidden"
                style={{
                  background: look[calc.active].grad,
                  border: `2px solid ${look[calc.active].borderActive}`,
                  boxShadow: look[calc.active].shadowIdle,
                }}
              >
                <div className="flex items-center justify-between border-b border-dashed border-[#261247]/15 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <img loading="lazy" decoding="async"
                      src={LABRADOR_SVG_PATH}
                      alt="Labrador"
                      className="w-7 h-7 object-contain"
                    />
                    <span className="text-[10px] font-black uppercase text-[#261247]">
                      แพ็กเกจ Dog Run ของคุณ
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-black px-2.5 py-0.5 rounded-full text-white"
                    style={{ background: look[calc.active].headerGrad }}
                  >
                    {calc.active.toUpperCase()} DOG RUN
                  </span>
                </div>

                {/* Animated Participant Icons */}
                <div className="my-2.5">
                  <div className="text-[11px] font-bold text-[#4B2D78] mb-1.5">
                    ผู้เข้าร่วม ({calc.totalPeople} คน + {calc.totalDogs} น้องสุนัข):
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] p-2 rounded-2xl bg-white/85 border border-white shadow-2xs">
                    {Array.from({ length: Math.min(calc.totalPeople, 6) }).map((_, idx) => (
                      <motion.span
                        key={`p-${idx}`}
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[11px] font-bold shadow-2xs"
                        title="นักวิ่ง"
                      >
                        🏃
                      </motion.span>
                    ))}
                    {calc.totalPeople > 6 && (
                      <span className="text-[11px] font-extrabold text-[#7C3AED]">
                        +{calc.totalPeople - 6}
                      </span>
                    )}
                    <span className="text-xs font-black text-[#261247]/40 mx-0.5">+</span>
                    {Array.from({ length: Math.min(calc.totalDogs, 6) }).map((_, idx) => (
                      <motion.span
                        key={`d-${idx}`}
                        initial={{ scale: 0, rotate: 15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-6 h-6 rounded-full bg-[#FF7A59] text-white flex items-center justify-center text-[11px] font-bold shadow-2xs"
                        title="น้องสุนัข"
                      >
                        🐶
                      </motion.span>
                    ))}
                    {calc.totalDogs > 6 && (
                      <span className="text-[11px] font-extrabold text-[#C2410C]">
                        +{calc.totalDogs - 6}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-[#261247]/15 flex items-baseline justify-between">
                  <span className="text-xs font-extrabold text-[#261247]">ยอดรวมสุทธิ</span>
                  <div className="text-right">
                    <span
                      className="font-display text-2xl sm:text-3xl font-black tabular-nums"
                      style={{ color: look[calc.active].accentDark }}
                    >
                      {calc.total.toLocaleString('th-TH')}
                    </span>
                    <span className="text-xs font-extrabold text-[#261247] ml-1">บาท</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onOpenRegister(calc.active, {
                      people: calc.c.people,
                      dogs: calc.c.dogs,
                    })
                  }
                  className="mt-3 w-full rounded-2xl py-2.5 px-4 flex items-center justify-center gap-1.5 text-white font-extrabold text-xs sm:text-sm hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer"
                  style={{
                    background: look[calc.active].btnGrad,
                    boxShadow: look[calc.active].btnShadow,
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>สมัครแพ็กเกจนี้เลย</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 4. TRUST & SUPPORT FOOTER STRIP ---------- */}
      <div className="flex flex-wrap justify-center gap-3">
        {[
          { Icon: ShieldCheck, text: 'ได้ Digital BIB หลังยืนยันการชำระเงิน' },
          { Icon: Headphones, text: 'ทีมสัตวแพทย์อาสาและพยาบาลดูแลตลอดเส้นทาง' },
        ].map(({ Icon, text }) => (
          <span
            key={text}
            className="inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md rounded-full pl-2.5 pr-5 py-2 text-xs sm:text-sm font-bold text-[#261247] shadow-[0_10px_25px_-10px_rgba(75,45,120,0.22)] border border-[#7B3FC6]/15"
          >
            <span className="w-7 h-7 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </span>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};
