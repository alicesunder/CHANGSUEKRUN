import React from 'react';
import {
  ArrowRight,
  Calendar,
  Camera,
  CircleDollarSign,
  Crown,
  HelpCircle,
  MapPin,
  Mountain,
  Sparkles,
  Store,
  TicketCheck,
  Heart,
} from 'lucide-react';
import { motion } from 'motion/react';
import { RouteId } from '../types';
import { HeroCountdownTimer } from './HeroCountdownTimer';
import { PawIcon } from './brand/DogDecor';
import { LabradorMascot } from './brand/LabradorMascot';

interface HeroProps {
  onOpenArtworkModal: () => void;
  onOpenRegisterModal: () => void;
  onSelectDistance: (distance: RouteId) => void;
}

const BEACH = '/images/hero/beach-run.jpg';
const COASTAL_SUNSET = '/images/hero/changsuek-run-coastal.jpg';

const fadeMask: React.CSSProperties = {
  WebkitMaskImage:
    'linear-gradient(to right, transparent 0%, #000 22%), linear-gradient(to bottom, transparent 0%, #000 8%)',
  maskImage:
    'linear-gradient(to right, transparent 0%, #000 22%), linear-gradient(to bottom, transparent 0%, #000 8%)',
  WebkitMaskComposite: 'source-in',
  maskComposite: 'intersect',
};

export const Hero: React.FC<HeroProps> = ({
  onOpenArtworkModal,
  onOpenRegisterModal,
  onSelectDistance,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const mobileDistancePills: { id: RouteId; label: string; tag: string; color: string; bg: string }[] = [
    { id: '1km', label: '1 KM', tag: 'Dog Mini', color: '#C2410C', bg: '#FFF7ED' },
    { id: '3km', label: '3 KM', tag: 'Dog Run', color: '#0F766E', bg: '#F0FDFA' },
    { id: '5km', label: '5 KM', tag: 'Fun Run', color: '#B45309', bg: '#FFFBEB' },
    { id: '10km', label: '10 KM', tag: 'Mini Marathon', color: '#7C3AED', bg: '#FAF5FF' },
  ];


  return (
    <>
      {/* ================================================================= */}
      {/* 1. HERO SECTION (REDESIGNED MOBILE SHOWCASE + LUMINOUS DESKTOP)   */}
      {/* ================================================================= */}
      <section
        id="hero"
        className="relative overflow-hidden text-[#261247]"
        style={{
          background:
            'linear-gradient(180deg, #6BC8F5 0%, #B4E6FC 32%, #EAF7FC 64%, #FDE6AD 100%)',
        }}
      >
        {/* Multi-Layered Ambient Sunbeams & Light Orbs */}
        <div
          aria-hidden="true"
          className="absolute -top-20 left-1/2 -translate-x-1/2 lg:left-1/4 w-80 h-80 sm:w-[460px] sm:h-[460px] rounded-full bg-white/55 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-28 -left-16 w-64 h-64 rounded-full bg-[#FFE28A]/45 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#C084FC]/20 blur-3xl pointer-events-none"
        />

        {/* Desktop Beach Artwork Anchored Right */}
        <img
          src={BEACH}
          alt="ช้างศึก นักวิ่ง และน้องหมาโกลเด้น วิ่งริมชายหาด"
          className="hidden lg:block absolute bottom-0 right-0 w-[82%] max-w-[1340px] h-auto pointer-events-none select-none"
          style={fadeMask}
          loading="eager"
          referrerPolicy="no-referrer"
        />

        {/* Desktop Right Script Slogan Overlay ("Run with Your Best Friend") */}
        <motion.div
          aria-hidden="true"
          animate={{ y: [0, -6, 0], rotate: [-6, -4, -6] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden xl:block absolute right-10 top-28 z-10 text-right pointer-events-none select-none"
        >
          <div className="font-display italic font-extrabold text-3xl text-white drop-shadow-[0_4px_10px_rgba(25,55,95,0.45)] leading-none">
            Run
          </div>
          <div className="font-display italic font-bold text-lg text-white/95 drop-shadow-[0_2px_6px_rgba(25,55,95,0.45)] -mt-0.5">
            — with —
          </div>
          <div className="font-display italic font-extrabold text-3xl text-[#FFE885] drop-shadow-[0_4px_10px_rgba(25,55,95,0.5)] leading-tight">
            Your Best
            <br />
            Friend
          </div>
        </motion.div>

        {/* Desktop Floating Interactive Labrador Mascot Companion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="hidden lg:flex absolute bottom-16 right-8 xl:right-14 z-20 items-center gap-3 bg-white/85 backdrop-blur-xl rounded-3xl p-3 pr-5 border border-white shadow-[0_20px_45px_-12px_rgba(42,20,80,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]"
        >
          <LabradorMascot
            size={78}
            interactive={true}
            glowColor="rgba(251, 191, 36, 0.5)"
          />
          <div className="text-left">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-900 text-[10px] font-extrabold">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>มาสคอตน้องหมา</span>
            </div>
            <div className="text-sm font-black text-[#261247] mt-0.5">
              พาน้องหมามาวิ่งด้วยกันนะ!
            </div>
            <button
              type="button"
              onClick={() => onSelectDistance('1km')}
              className="mt-1 inline-flex items-center gap-1 min-h-[28px] text-xs font-extrabold text-[#6D28D9] hover:text-[#4C1D95] cursor-pointer"
            >
              <span>ดูบัตร Dog Run 1K & 3K</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-8 pt-20 sm:pt-24 lg:pt-28 pb-12 sm:pb-16 lg:pb-28 lg:min-h-[700px]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[580px] text-center lg:text-left mx-auto lg:mx-0"
          >
            {/* Mobile-First Top Glass Event Pill */}
            <div className="lg:hidden inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-white shadow-[0_8px_20px_-6px_rgba(42,20,80,0.18)] text-[11px] font-extrabold text-[#3B1870] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
              <span>15 ก.พ. 2570</span>
              <span className="text-[#7B3FC6]/40">·</span>
              <span>หาดชะอำ (ค่ายนเรศวร)</span>
            </div>

            {/* Brand Logo Lockup */}
            <div className="flex flex-col items-center lg:items-start">
              <img
                src="/images/brand/changsuek-run-logo.webp"
                alt="CHANGSUEK RUN - เห็นช้างวิ่ง วิ่งตามช้าง"
                className="h-22 sm:h-28 lg:h-32 w-auto object-contain drop-shadow-[0_8px_16px_rgba(42,20,80,0.2)]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Main Headline with Animated Paw Accents */}
            <div className="relative inline-block mt-1 sm:mt-2">
              <motion.div
                animate={{ y: [0, -5, 0], rotate: [12, 20, 12] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-2 -right-6 sm:-top-3 sm:-right-8 opacity-90 pointer-events-none"
              >
                <PawIcon size={22} color="#8B4FD8" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 4, 0], rotate: [12, 4, 12] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                className="absolute bottom-1 -right-7 sm:-right-9 opacity-90 pointer-events-none"
              >
                <PawIcon size={20} color="#5B20A8" />
              </motion.div>
              {/* Thai needs generous line-height for upper/lower vowel & tone marks; the
                  gradient line gets vertical padding so bg-clip-text doesn't cut them off. */}
              <h1 className="font-hero text-[38px] sm:text-[56px] lg:text-[62px] font-semibold leading-[1.28] text-[#2D1052] drop-shadow-[0_2px_0_rgba(255,255,255,0.95)]">
                <span className="block">วิ่งสนุกไปกับ</span>
                <span className="inline-block pt-1 pb-2 -mt-1 font-bold bg-gradient-to-r from-[#5B20A8] via-[#7C3AED] to-[#C026D3] bg-clip-text text-transparent drop-shadow-none">
                  เพื่อนสี่ขาคู่ใจ
                </span>
              </h1>
            </div>

            <p className="mt-2 sm:mt-3 text-xs sm:text-base font-bold text-[#3A1F5D] max-w-[360px] sm:max-w-[520px] mx-auto lg:mx-0 leading-relaxed text-balance">
              งานวิ่งการกุศลรักษ์ช้างและพัฒนาศูนย์ฝึกสุนัขตำรวจ{' '}
              <span className="whitespace-nowrap">ค่ายพระรามหก</span>
              <br className="hidden sm:inline" /> ริมชายหาด
              <span className="whitespace-nowrap">ชะอำ-หัวหิน</span> บรรยากาศอบอุ่นสำหรับทุกครอบครัว
            </p>

            {/* ============================================================= */}
            {/* REDESIGNED MOBILE-ONLY HERO SHOWCASE CARD WITH LABRADOR       */}
            {/* ============================================================= */}
            <div className="lg:hidden mt-4 mb-5 relative mx-auto max-w-[430px]">
              {/* Main Glassmorphic Hero Frame */}
              <div className="relative rounded-[30px] p-2 bg-white/75 backdrop-blur-xl border-2 border-white shadow-[0_24px_48px_-12px_rgba(42,20,80,0.32),0_6px_16px_-4px_rgba(42,20,80,0.14)]">
                <div
                  onClick={onOpenArtworkModal}
                  className="group relative rounded-[22px] overflow-hidden bg-[#BCE9FC] cursor-pointer"
                >
                  <img
                    src={BEACH}
                    alt="ช้างศึก นักวิ่ง และน้องหมาโกลเด้น วิ่งริมชายหาด"
                    className="w-full h-56 sm:h-64 object-cover object-[66%_center] block transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  {/* Luminous Sunset Vignette Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E0B38]/85 via-[#1E0B38]/20 to-transparent pointer-events-none" />

                  {/* Top-Left Live Badge */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[10px] font-extrabold text-[#2A1450] shadow-md">
                    <Sparkles className="w-3 h-3 text-[#B45309]" />
                    <span>เปิดรับสมัครออนไลน์แล้ว</span>
                  </div>

                  {/* Bottom Left Headline & Venue inside Mobile Artwork */}
                  <div className="absolute bottom-3 left-3.5 right-28 text-left pointer-events-none">
                    <span className="inline-block font-display italic font-black text-xs text-[#FFE28A] drop-shadow">
                      Run with Your Best Friend
                    </span>
                    <div className="text-white font-extrabold text-sm sm:text-base leading-tight drop-shadow-md">
                      ชายหาดค่ายนเรศวร ชะอำ-หัวหิน
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#FFC928] shrink-0" />
                      <span className="truncate">จ.เพชรบุรี · แตะเพื่อดูภาพเต็ม</span>
                    </div>
                  </div>
                </div>

                {/* Floating Animated Labrador Mascot on Mobile Hero Card */}
                <div className="absolute -bottom-3 right-2.5 z-20">
                  <LabradorMascot
                    size={86}
                    speechText="มาวิ่งกันนะ!"
                    interactive={true}
                    glowColor="rgba(255, 201, 40, 0.65)"
                  />
                </div>

                {/* Interactive 4-Distance Quick Tap Strip inside Mobile Hero */}
                <div className="mt-2.5 pt-1 pr-20 grid grid-cols-4 gap-1.5">
                  {mobileDistancePills.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onSelectDistance(d.id)}
                      style={{ backgroundColor: d.bg }}
                      className="rounded-2xl py-1.5 px-1 border border-[#2A1450]/10 shadow-2xs flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer"
                    >
                      <span
                        className="font-display text-xs font-black leading-none"
                        style={{ color: d.color }}
                      >
                        {d.label}
                      </span>
                      <span className="text-[9px] font-bold text-[#4B2D78] mt-0.5 truncate max-w-full">
                        {d.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Date & Venue Glass Pills */}
            <div className="hidden lg:flex mt-6 flex-wrap gap-2.5 justify-start text-xs sm:text-[13px] font-bold text-[#2A1450]">
              <span className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-[0_8px_20px_-6px_rgba(42,20,80,0.18)] border border-white">
                <Calendar className="w-4 h-4 text-[#6D28D9]" />
                <span>15 ก.พ. 2570</span>
              </span>
              <span className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-[0_8px_20px_-6px_rgba(42,20,80,0.18)] border border-white">
                <MapPin className="w-4 h-4 text-[#C2410C]" />
                <span>หาดชะอำ (ค่ายนเรศวร) จ.เพชรบุรี</span>
              </span>
            </div>

            {/* 2 Action CTA Buttons (With Modern Light & Shadow Elevation) */}
            <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3.5 justify-center lg:justify-start max-w-[430px] sm:max-w-none mx-auto lg:mx-0">
              <button
                type="button"
                onClick={onOpenRegisterModal}
                className="relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-7 py-3.5 text-xs sm:text-base font-extrabold text-[#261247] bg-gradient-to-b from-[#FFE268] via-[#FFC928] to-[#F59E0B] border-2 border-[#261247] luminous-pill-btn hover:scale-[1.03] active:scale-95 transition-transform cursor-pointer sm:min-w-[190px]"
              >
                <span className="absolute inset-0 ticket-foil-shimmer opacity-55 pointer-events-none" />
                <PawIcon size={16} color="#261247" className="relative z-10" />
                <span className="relative z-10">สมัครวิ่งตอนนี้</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('distances')}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full px-4 sm:px-6 py-3.5 text-xs sm:text-base font-extrabold bg-white/95 hover:bg-white text-[#261247] border-2 border-[#261247]/80 shadow-[0_10px_24px_-8px_rgba(42,20,80,0.28),0_4px_0_#261247] hover:scale-[1.03] active:scale-95 transition-transform cursor-pointer sm:min-w-[185px]"
              >
                <span>ดูบัตรวิ่งโฉมใหม่</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Top Wave Curve transitioning into Countdown Banner */}
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-8 sm:h-14 z-20 pointer-events-none"
          aria-hidden="true"
        >
          <path
            d="M0 52 C 360 82 920 10 1440 24 L1440 80 L0 80 Z"
            fill="#FFC928"
          />
          <path
            d="M0 60 C 360 88 920 18 1440 32 L1440 80 L0 80 Z"
            fill="#2E1157"
          />
        </svg>
      </section>

      {/* ================================================================= */}
      {/* 2. CURVED PURPLE COUNTDOWN & SUNSET QUOTE WAVE BANNER             */}
      {/* ================================================================= */}
      <div className="relative bg-gradient-to-r from-[#2A0E4F] via-[#3D176E] to-[#2B1052] text-white overflow-hidden">
        {/* Sunset Coastal Runner & Dog Background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 md:inset-y-0 md:left-auto md:right-0 md:w-[52%] opacity-30 md:opacity-100 pointer-events-none"
          style={{
            backgroundImage: `url(${COASTAL_SUNSET})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 55%',
            WebkitMaskImage:
              'linear-gradient(to left, rgba(0,0,0,0.85) 45%, transparent 100%)',
            maskImage:
              'linear-gradient(to left, rgba(0,0,0,0.85) 45%, transparent 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="hidden md:block absolute inset-y-0 right-0 w-[52%] bg-gradient-to-r from-[#3A1668] via-[#3A1668]/45 to-amber-900/30 pointer-events-none"
        />

        {/* Decorative Paw Prints */}
        <PawIcon
          size={44}
          color="#FFC928"
          className="absolute left-4 top-4 opacity-20 -rotate-12 pointer-events-none"
        />
        <PawIcon
          size={36}
          color="#FFC928"
          className="absolute right-6 bottom-10 lg:left-20 lg:bottom-8 opacity-20 rotate-12 pointer-events-none"
        />

        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-8 py-5 sm:py-8 pb-11 sm:pb-14 grid grid-cols-1 lg:grid-cols-12 items-center gap-5 sm:gap-6">
          {/* Left: Countdown Timer (6 cols) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-start">
            <HeroCountdownTimer targetDate="2027-02-15T06:00:00+07:00" />
          </div>

          {/* Right: Slanted Inspirational Quote (6 cols) */}
          <div className="lg:col-span-6 text-center lg:text-left lg:pl-8 pt-2 lg:pt-0 border-t border-white/15 lg:border-t-0">
            <div className="inline-block -rotate-1 sm:-rotate-2">
              <p className="font-display text-xl sm:text-4xl font-bold text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.45)] leading-snug">
                “ มากกว่างานวิ่ง คือ{' '}
                <span className="text-[#FFE28A] block sm:inline">การวิ่งไปด้วยกัน ”</span>
              </p>
              <p className="mt-1 text-[9px] sm:text-xs font-mono font-extrabold tracking-[0.24em] text-[#FFC928] uppercase drop-shadow">
                MORE THAN A RUN · A BIGGER FAMILY
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Wave Curve transitioning into the 9 Quick-Nav Icon Cards */}
        <svg
          viewBox="0 0 1440 70"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-7 sm:h-12 z-20 pointer-events-none"
          aria-hidden="true"
        >
          <path
            d="M0 18 C 420 68 980 64 1440 12 L1440 70 L0 70 Z"
            fill="#FFC928"
          />
          <path
            d="M0 28 C 420 74 980 70 1440 22 L1440 70 L0 70 Z"
            fill="#FAF8FF"
          />
        </svg>
      </div>

    </>
  );
};
