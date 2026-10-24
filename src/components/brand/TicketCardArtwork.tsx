import React from 'react';
import { RouteId } from '../../types';
import { ElephantCharacter, DogCharacter, RunnerCharacter } from './BrandCharacters';
import { PawIcon } from './DogDecor';

/**
 * Dedicated high-resolution editorial illustration for each ticket category.
 * Each card gets its own unique visual scene rather than cropping the same image.
 */
export const TICKET_CARD_IMAGES: Record<
  RouteId,
  {
    src: string;
    objectPosition: string;
    alt: string;
    sceneTag: string;
    terrainBadge: string;
    skyGrad: string;
  }
> = {
  '5km': {
    src: '/images/distances/card-5k-editorial.jpg',
    objectPosition: '82% center',
    alt: 'บัตรวิ่ง 5 KM บุคคลทั่วไป - นักวิ่งชายหญิงวิ่งรับแสงเช้าเลียบชายหาดชะอำพร้อมช้างศึก',
    sceneTag: 'SUNRISE COASTAL RUN',
    terrainBadge: 'ทางเรียบเลียบหาด & รอบค่าย',
    skyGrad: 'linear-gradient(135deg, #FFF3B0 0%, #FFD55A 55%, #FFAE34 100%)',
  },
  '10km': {
    src: '/images/distances/card-10k-editorial.jpg',
    objectPosition: '85% center',
    alt: 'บัตรวิ่ง 10 KM มินิมาราธอน - นักวิ่งท้าทายเส้นทางถนนเลียบชายฝั่งและธรรมชาติเคียงข้างช้างศึก',
    sceneTag: 'COASTAL & MANGROVE TRAIL',
    terrainBadge: 'ถนนค่าย + สะพานไม้ป่าชายเลน',
    skyGrad: 'linear-gradient(135deg, #E2CEFF 0%, #9F65EB 55%, #4A1C88 100%)',
  },
  '1km': {
    src: '/images/hero/beach-run.jpg',
    objectPosition: '58% 45%',
    alt: 'บัตรวิ่ง 1 KM Dog Mini Run - ช้างศึกสีม่วง นักวิ่ง และน้องสุนัขวิ่งเล่นสนุกสนานริมชายหาด',
    sceneTag: 'BEACH PUPPY FUN RUN',
    terrainBadge: 'ทางเรียบชายหาด 100% (ไป-กลับ)',
    skyGrad: 'linear-gradient(135deg, #FFE0C2 0%, #FFB076 55%, #FF8442 100%)',
  },
  '3km': {
    src: '/images/distances/card-3k-editorial.jpg',
    objectPosition: '85% 38%',
    alt: 'บัตรวิ่ง 3 KM Dog Run - นักวิ่งและน้องสุนัขโกลเด้นวิ่งเคียงข้างกันบนเส้นทางเลียบหาดและทิวสน',
    sceneTag: 'SHADED PINE & BEACH LOOP',
    terrainBadge: 'เลียบหาด + ร่มสนแกนกลางค่าย',
    skyGrad: 'linear-gradient(135deg, #CCF5E1 0%, #6DD5A5 55%, #28A766 100%)',
  },
};

/**
 * Rich custom illustrated badge / miniature scene overlay for each ticket card
 * so that even on wide or compact layouts, each card has unmistakable character art.
 */
export const TicketMiniCharacterBadge: React.FC<{
  routeId: RouteId;
  className?: string;
}> = ({ routeId, className = '' }) => {
  if (routeId === '5km') {
    return (
      <div className={`relative flex items-end pointer-events-none select-none ${className}`} aria-hidden="true">
        <div className="relative z-10 -mr-3">
          <ElephantCharacter size={64} isAnimated={false} showBib={true} bibNumber="5K" />
        </div>
        <div className="relative z-20">
          <RunnerCharacter size={54} isAnimated={false} />
        </div>
      </div>
    );
  }

  if (routeId === '10km') {
    return (
      <div className={`relative flex items-end pointer-events-none select-none ${className}`} aria-hidden="true">
        <div className="relative z-10">
          <ElephantCharacter size={72} isAnimated={false} showBib={true} bibNumber="10K" mood="celebrating" />
        </div>
      </div>
    );
  }

  if (routeId === '1km') {
    return (
      <div className={`relative flex items-end pointer-events-none select-none ${className}`} aria-hidden="true">
        <div className="relative z-10 -mr-2">
          <DogCharacter size={52} isAnimated={false} />
        </div>
        <div className="relative z-20 scale-90 origin-bottom-left">
          <DogCharacter size={40} isAnimated={false} />
        </div>
      </div>
    );
  }

  // 3km Dog Run
  return (
    <div className={`relative flex items-end pointer-events-none select-none ${className}`} aria-hidden="true">
      <div className="relative z-10 -mr-3">
        <RunnerCharacter size={56} isAnimated={false} />
      </div>
      <div className="relative z-20">
        <DogCharacter size={52} isAnimated={false} />
      </div>
    </div>
  );
};

/**
 * Full ticket artwork header component used in TicketSection, RegistrationModal, and ComparisonModal.
 */
export const TicketCardImageBanner: React.FC<{
  routeId: RouteId;
  distanceLabel: string;
  badge?: string;
  isDog?: boolean;
  accentColor: string;
  heightClass?: string;
  showMiniCharacters?: boolean;
}> = ({
  routeId,
  distanceLabel,
  badge,
  isDog = false,
  accentColor,
  heightClass = 'h-44 sm:h-48',
  showMiniCharacters = true,
}) => {
  const meta = TICKET_CARD_IMAGES[routeId];

  return (
    <div
      className={`relative w-full ${heightClass} overflow-hidden rounded-t-[23px] select-none group/banner`}
      style={{ background: meta.skyGrad }}
    >
      {/* Main High-Res Editorial Illustration */}
      <img
        src={meta.src}
        alt={meta.alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/banner:scale-105 group-hover:scale-105"
        style={{ objectPosition: meta.objectPosition }}
      />

      {/* Soft left & bottom gradient scrims for high-contrast badge & title legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(23,15,38,0.28) 0%, rgba(23,15,38,0.02) 45%, rgba(23,15,38,0.55) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(23,15,38,0.45) 0%, rgba(23,15,38,0.12) 45%, transparent 80%)',
        }}
      />

      {/* Top Row: Category Badge & Popular/Highlight Chip */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1 rounded-full shadow-md border border-white/40 backdrop-blur-xs whitespace-nowrap"
          style={{ background: isDog ? '#2EAD62' : '#5B20A8' }}
        >
          {isDog ? <PawIcon size={13} color="#FFF" /> : <span className="w-2 h-2 rounded-full bg-[#FFC928]" />}
          <span>{isDog ? 'Dog Run · วิ่งคู่น้องสุนัข' : 'Individual · บุคคลทั่วไป'}</span>
        </span>

        {badge && (
          <span
            className="text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md border border-[#2A1450]/20 whitespace-nowrap"
            style={{
              background: '#FFC928',
              color: '#2A1450',
            }}
          >
            ★ {badge}
          </span>
        )}
      </div>

      {/* Bottom Left: Big Distance Emblem + Terrain Subtitle */}
      <div className="absolute bottom-2.5 left-3.5 z-10 flex items-end gap-2.5">
        <div
          className="px-3 py-1 rounded-2xl border-2 border-white shadow-lg backdrop-blur-xs flex items-baseline gap-1"
          style={{ background: accentColor }}
        >
          <span
            className={`font-display text-3xl sm:text-4xl font-bold leading-none tracking-tight ${
              routeId === '5km' ? 'text-[#2A1450]' : 'text-white'
            }`}
          >
            {distanceLabel}
          </span>
        </div>
        <div className="pb-0.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFC928] drop-shadow">
            {meta.sceneTag}
          </div>
          <div className="text-xs font-bold text-white drop-shadow leading-tight">
            {meta.terrainBadge}
          </div>
        </div>
      </div>

      {/* Bottom Right: Custom Mini Character Art */}
      {showMiniCharacters && (
        <div className="absolute -bottom-1 right-1.5 z-10 opacity-95 drop-shadow-md transform group-hover:scale-105 transition-transform">
          <TicketMiniCharacterBadge routeId={routeId} />
        </div>
      )}
    </div>
  );
};

/**
 * Custom SVG illustrations for the 4 Official Race Pack cards in RaceDistances.tsx
 * (1. Jersey, 2. Finisher Medal, 3. Personalised RFID BIB, 4. Souvenir Tote & Insurance)
 */
export const RacePackCardVisual: React.FC<{
  type: 'shirt' | 'medal' | 'bib' | 'souvenir';
}> = ({ type }) => {
  if (type === 'shirt') {
    return (
      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#3D106B] via-[#5B20A8] to-[#8C4AE2] border border-purple-200/80 mb-3 group-hover:shadow-md transition-all">
        <img loading="lazy" decoding="async"
          src="/images/merch/jersey-front.jpg"
          alt="เสื้อวิ่ง CHANGSUEK Micro-Dry Sublimation"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#25183B]/70 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2.5 text-[10px] font-bold text-white bg-[#5B20A8]/90 px-2.5 py-0.5 rounded-full border border-white/30">
          OFFICIAL JERSEY 2027
        </span>
      </div>
    );
  }

  if (type === 'medal') {
    return (
      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#4A2500] via-[#9E6B00] to-[#F5B800] border border-amber-200/80 mb-3 group-hover:shadow-md transition-all">
        <img loading="lazy" decoding="async"
          src="/images/merch/medal-front.jpg"
          alt="เหรียญที่ระลึก Finisher 3D Zinc Alloy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#25183B]/70 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2.5 text-[10px] font-bold text-[#25183B] bg-[#FFC928] px-2.5 py-0.5 rounded-full border border-white/50">
          3D ZINC ALLOY MEDAL
        </span>
      </div>
    );
  }

  if (type === 'bib') {
    return (
      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#EAE0FC] via-[#F4ECFD] to-[#FFF6D6] border border-purple-200/80 mb-3 flex items-center justify-center p-3">
        {/* Decorative background rays */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#FFC928]/30 blur-md" />
        <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-[#7B3FC6]/20 blur-md" />

        {/* Illustrated Official BIB Card */}
        <div className="relative w-48 bg-white rounded-xl border-2 border-[#3D106B] shadow-md p-2.5 transform -rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between border-b border-purple-200 pb-1 mb-1">
            <span className="text-[8px] font-black tracking-wider text-[#5B20A8]">CHANGSUEK RUN</span>
            <span className="text-[8px] font-black bg-[#FFC928] text-[#25183B] px-1.5 py-0.2 rounded">10K / 5K / DOG</span>
          </div>
          <div className="text-center py-1 bg-[#FAF7FD] rounded-lg border border-purple-100">
            <div className="text-[7px] font-bold text-gray-400 tracking-widest">RFID TIMING BIB</div>
            <div className="font-mono text-2xl font-black text-[#25183B] leading-none my-0.5">2027</div>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[8px] font-bold text-[#5B20A8]">
            <span>RUNNER NAME</span>
            <span className="text-emerald-600">● CHIP ACTIVE</span>
          </div>
        </div>
      </div>
    );
  }

  // souvenir & insurance
  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#DDF7EA] via-[#EEFCF5] to-[#FFF5D6] border border-emerald-200/80 mb-3 flex items-center justify-center p-3">
      <svg viewBox="0 0 220 120" className="w-44 h-28 overflow-visible transform group-hover:scale-105 transition-transform duration-300">
        {/* Tote Bag */}
        <g transform="translate(22, 12)">
          <path
            d="M 28,28 C 28,6 56,6 56,28"
            fill="none"
            stroke="#3D106B"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect
            x="10"
            y="26"
            width="64"
            height="72"
            rx="10"
            fill="#FFFFFF"
            stroke="#3D106B"
            strokeWidth="3.5"
          />
          <rect x="18" y="36" width="48" height="22" rx="5" fill="#F4ECFD" />
          <text x="42" y="49" fontSize="8" fontWeight="900" fill="#5B20A8" textAnchor="middle">
            CHANGSUEK
          </text>
          <circle cx="42" cy="74" r="12" fill="#FFC928" />
          <text x="42" y="78" fontSize="12" textAnchor="middle">🐘</text>
        </g>

        {/* Insurance Shield Badge */}
        <g transform="translate(115, 22)">
          <path
            d="M 36,6 L 68,18 L 68,46 C 68,70 36,86 36,86 C 36,86 4,70 4,46 L 4,18 Z"
            fill="#2EAD62"
            stroke="#FFFFFF"
            strokeWidth="4"
          />
          <path
            d="M 24,46 L 33,55 L 50,36"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="8" y="76" width="56" height="16" rx="8" fill="#3D106B" />
          <text x="36" y="87" fontSize="7.5" fontWeight="800" fill="#FFC928" textAnchor="middle">
            SAFE 100%
          </text>
        </g>
      </svg>
    </div>
  );
};
