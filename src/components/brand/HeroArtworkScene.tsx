import React, { useState } from 'react';

interface HeroArtworkSceneProps {
  onMascotClick?: (name: string) => void;
  className?: string;
}

export const HeroArtworkScene: React.FC<HeroArtworkSceneProps> = ({
  onMascotClick,
  className = '',
}) => {
  const [activeReaction, setActiveReaction] = useState<string | null>('ทุกก้าวมีความหมาย');
  const [wiggleTarget, setWiggleTarget] = useState<string | null>(null);

  const triggerReaction = (target: string, message: string) => {
    setWiggleTarget(target);
    setActiveReaction(message);
    if (onMascotClick) onMascotClick(target);

    setTimeout(() => {
      setWiggleTarget(null);
    }, 1200);
  };

  return (
    <div className={`relative w-full max-w-[620px] mx-auto select-none ${className}`}>
      {/* Interactive Floating Speech Bubble */}
      {activeReaction && (
        <div className="absolute top-2 right-4 sm:right-12 z-20 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border-2 border-[#7B3FC6]/30 text-xs sm:text-sm font-comic font-black text-[#54239A] animate-bounce-subtle flex items-center gap-2">
          <span>💬</span>
          <span>{activeReaction}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveReaction(null);
            }}
            className="text-gray-400 hover:text-gray-600 text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main SVG Scene matching logo event.png & user mockup */}
      <svg
        viewBox="0 0 950 640"
        className="w-full h-auto overflow-visible drop-shadow-2xl transition-transform duration-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="heroElephantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A86FF3" />
            <stop offset="50%" stopColor="#8340D4" />
            <stop offset="100%" stopColor="#5B249D" />
          </linearGradient>
          <linearGradient id="heroSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE57F" />
            <stop offset="100%" stopColor="#FFC928" />
          </linearGradient>
          <linearGradient id="heroWoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E4A054" />
            <stop offset="100%" stopColor="#C47D32" />
          </linearGradient>
          <filter id="heroDropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#18151D" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* 1. SCENIC BACKGROUND: Sun, Clouds, Ocean, Sailboat, Palm Tree */}
        {/* Sun */}
        <circle cx="680" cy="150" r="75" fill="url(#heroSunGrad)" />

        {/* Clouds */}
        <g fill="#FFFFFF" opacity="0.95" filter="url(#heroDropShadow)">
          <path d="M 540,165 Q 560,135 590,140 Q 620,120 655,140 Q 675,145 680,170 Z" />
          <path d="M 720,110 Q 735,90 760,95 Q 780,80 805,95 Q 820,100 825,120 Z" opacity="0.8" />
        </g>

        {/* Sea Waves & Coastal Ripples */}
        <path d="M 460,210 Q 540,195 620,210 T 780,210 T 920,210" fill="none" stroke="#25A5F5" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M 485,230 Q 565,218 645,230 T 805,230 T 940,230" fill="none" stroke="#72CCFA" strokeWidth="3.5" strokeLinecap="round" />

        {/* Sailboat */}
        <g transform="translate(615, 175)" className="cursor-pointer hover:opacity-80 transition-opacity">
          <polygon points="15,25 35,0 35,25" fill="#FFC928" />
          <polygon points="37,25 37,5 52,25" fill="#2EAD62" />
          <rect x="10" y="25" width="48" height="7" rx="3.5" fill="#54239A" />
        </g>

        {/* Beach Coconut Palm Tree */}
        <g id="palmTree">
          {/* Trunk */}
          <path d="M 535,265 Q 540,205 525,160" fill="none" stroke="#7A4E26" strokeWidth="11" strokeLinecap="round" />
          {/* Fronds */}
          <path d="M 525,160 Q 485,150 470,175" fill="none" stroke="#2EAD62" strokeWidth="7" strokeLinecap="round" />
          <path d="M 525,160 Q 515,120 495,128" fill="none" stroke="#2EAD62" strokeWidth="7" strokeLinecap="round" />
          <path d="M 525,160 Q 555,125 575,145" fill="none" stroke="#2EAD62" strokeWidth="7" strokeLinecap="round" />
          <path d="M 525,160 Q 565,160 580,185" fill="none" stroke="#2EAD62" strokeWidth="7" strokeLinecap="round" />
          {/* Coconuts */}
          <circle cx="522" cy="164" r="5" fill="#5C3818" />
          <circle cx="530" cy="166" r="4.5" fill="#5C3818" />
        </g>

        {/* Wooden Road Signpost "ชะอำ - หัวหิน" (from user mockup!) */}
        <g id="woodSign" transform="translate(800, 110)" filter="url(#heroDropShadow)" className="cursor-pointer hover:scale-105 transition-transform" onClick={() => triggerReaction('sign', 'ยินดีต้อนรับสู่ ชะอำ - หัวหิน! 🌴')}>
          {/* Post */}
          <rect x="42" y="40" width="16" height="150" rx="4" fill="#8D5524" stroke="#18151D" strokeWidth="4" />
          
          {/* Top Wooden Board: ชะอำ */}
          <g transform="rotate(-3 50 45)">
            <rect x="0" y="20" width="100" height="38" rx="6" fill="url(#heroWoodGrad)" stroke="#18151D" strokeWidth="4.5" />
            <circle cx="10" cy="39" r="2.5" fill="#18151D" />
            <circle cx="90" cy="39" r="2.5" fill="#18151D" />
            <text x="50" y="47" fontFamily="'Prompt', sans-serif" fontWeight="900" fontSize="19" fill="#18151D" textAnchor="middle">
              ชะอำ
            </text>
          </g>

          {/* Bottom Wooden Board: หัวหิน */}
          <g transform="rotate(2 50 85)">
            <rect x="0" y="65" width="100" height="38" rx="6" fill="url(#heroWoodGrad)" stroke="#18151D" strokeWidth="4.5" />
            <circle cx="10" cy="84" r="2.5" fill="#18151D" />
            <circle cx="90" cy="84" r="2.5" fill="#18151D" />
            <text x="50" y="92" fontFamily="'Prompt', sans-serif" fontWeight="900" fontSize="19" fill="#18151D" textAnchor="middle">
              หัวหิน
            </text>
          </g>
        </g>

        {/* Hand-drawn Text Speech Tag: "ทุกก้าวมีความหมาย" */}
        <g transform="translate(810, 80)">
          <path d="M 0,0 Q 20,-15 50,-5" fill="none" stroke="#18151D" strokeWidth="2.5" strokeLinecap="round" />
          <text x="35" y="-14" fontFamily="'Mali', cursive, sans-serif" fontWeight="800" fontSize="20" fill="#18151D" textAnchor="middle" transform="rotate(-5 35 -14)">
            ทุกก้าว
          </text>
          <text x="35" y="10" fontFamily="'Mali', cursive, sans-serif" fontWeight="800" fontSize="20" fill="#18151D" textAnchor="middle" transform="rotate(-5 35 10)">
            มีความหมาย
          </text>
        </g>

        {/* Motion/Speed Streaks */}
        <rect x="420" y="95" width="45" height="7" rx="3.5" fill="#FFC928" />
        <rect x="445" y="112" width="38" height="7" rx="3.5" fill="#8C4DDB" />
        <rect x="410" y="130" width="50" height="7" rx="3.5" fill="#2EAD62" />

        {/* Beach Confetti / Ground Particles */}
        <g opacity="0.9">
          <ellipse cx="170" cy="360" rx="16" ry="5" fill="#FFC928" />
          <ellipse cx="270" cy="370" rx="18" ry="5.5" fill="#2EAD62" />
          <ellipse cx="360" cy="365" rx="14" ry="4.5" fill="#8C4DDB" />
          <ellipse cx="460" cy="355" rx="12" ry="4" fill="#45B9EA" />
          <ellipse cx="560" cy="368" rx="16" ry="5" fill="#FFC928" />
          <ellipse cx="670" cy="372" rx="20" ry="6" fill="#2EAD62" />
          <ellipse cx="780" cy="365" rx="16" ry="5" fill="#8C4DDB" />
        </g>

        {/* 2. RUNNING CHARACTERS (From official logo event.png) */}
        
        {/* CHARACTER 1: THE PURPLE RUNNING ELEPHANT (with Bib 2027) */}
        <g
          id="heroElephant"
          filter="url(#heroDropShadow)"
          className={`cursor-pointer transition-transform duration-300 ${wiggleTarget === 'elephant' ? 'animate-wiggle scale-105' : 'hover:scale-102'}`}
          onClick={() => triggerReaction('elephant', 'แป๋นๆ! พี่ช้างพร้อมวิ่งไปด้วยกันแล้ว! 🐘')}
        >
          {/* Tail */}
          <path d="M 430,225 Q 460,240 465,268" fill="none" stroke="#54239A" strokeWidth="9" strokeLinecap="round" />
          <circle cx="465" cy="268" r="6" fill="#3D176C" />

          {/* Rear Leg 2 (back) */}
          <path d="M 350,240 L 340,305 L 375,305 L 382,240 Z" fill="#5B249D" stroke="#18151D" strokeWidth="4.5" strokeLinejoin="round" />
          {/* Front Leg 2 (back) */}
          <path d="M 195,245 L 180,305 L 215,305 L 225,245 Z" fill="#5B249D" stroke="#18151D" strokeWidth="4.5" strokeLinejoin="round" />

          {/* Main Elephant Body */}
          <ellipse cx="295" cy="210" rx="128" ry="98" fill="url(#heroElephantGrad)" stroke="#18151D" strokeWidth="5.5" />

          {/* 2027 Sports BIB on Elephant Back */}
          <g transform="rotate(12 385 175)">
            <rect x="355" y="150" width="70" height="48" rx="8" fill="#FFFFFF" stroke="#18151D" strokeWidth="4" />
            <path d="M 345,145 L 375,153" stroke="#FFC928" strokeWidth="7" strokeLinecap="round" />
            <text x="390" y="184" fontFamily="'Prompt', sans-serif" fontWeight="900" fontSize="24" fill="#18151D" textAnchor="middle">
              2027
            </text>
          </g>

          {/* Rear Leg 1 (Front - lifted running stride) */}
          <path d="M 390,225 Q 415,275 442,280 Q 430,298 408,298 Q 385,270 372,225 Z" fill="url(#heroElephantGrad)" stroke="#18151D" strokeWidth="5" />
          <circle cx="430" cy="292" r="4.5" fill="#FFFFFF" stroke="#18151D" strokeWidth="2.5" />
          <circle cx="418" cy="294" r="4.5" fill="#FFFFFF" stroke="#18151D" strokeWidth="2.5" />

          {/* Front Leg 1 (Front - forward running stride) */}
          <path d="M 240,245 Q 270,305 298,305 Q 280,322 252,322 Q 222,295 218,245 Z" fill="url(#heroElephantGrad)" stroke="#18151D" strokeWidth="5" />
          <circle cx="282" cy="315" r="4.5" fill="#FFFFFF" stroke="#18151D" strokeWidth="2.5" />
          <circle cx="268" cy="317" r="4.5" fill="#FFFFFF" stroke="#18151D" strokeWidth="2.5" />

          {/* Elephant Head */}
          <circle cx="170" cy="160" r="70" fill="url(#heroElephantGrad)" stroke="#18151D" strokeWidth="5.5" />

          {/* White & Green Headband */}
          <path d="M 115,125 Q 170,105 218,130" fill="none" stroke="#FFFFFF" strokeWidth="17" strokeLinecap="round" />
          <path d="M 118,125 Q 170,105 215,130" fill="none" stroke="#2EAD62" strokeWidth="7.5" strokeLinecap="round" />

          {/* Big Elephant Ear */}
          <path d="M 200,140 Q 275,150 262,235 Q 228,272 188,228 Z" fill="#803DDC" stroke="#18151D" strokeWidth="5" />

          {/* Joyful Trunk curled upwards */}
          <path
            d="M 125,190 Q 55,215 50,172 Q 45,125 90,132 Q 102,140 96,155 Q 72,150 72,170 Q 78,190 130,178 Z"
            fill="url(#heroElephantGrad)"
            stroke="#18151D"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* White Tusk */}
          <path d="M 110,190 Q 135,194 142,206 Q 124,210 108,198 Z" fill="#FFFFFF" stroke="#18151D" strokeWidth="3.5" />

          {/* Cheerful Eye & Smile */}
          <ellipse cx="138" cy="155" rx="6.5" ry="9.5" fill="#18151D" />
          <circle cx="140" cy="152" r="3" fill="#FFFFFF" />
          <path d="M 122,170 Q 134,182 146,174" fill="none" stroke="#18151D" strokeWidth="3.5" strokeLinecap="round" />
          {/* Pink Cheeks */}
          <ellipse cx="152" cy="172" rx="11" ry="7" fill="#FF8BA7" opacity="0.85" />
        </g>

        {/* CHARACTER 2: THE RUNNING GOLDEN DOG */}
        <g
          id="heroDog"
          filter="url(#heroDropShadow)"
          className={`cursor-pointer transition-transform duration-300 ${wiggleTarget === 'dog' ? 'animate-wiggle scale-110' : 'hover:scale-105'}`}
          onClick={() => triggerReaction('dog', 'โฮ่งๆ! น้องหมาก็มีสิทธิ์วิ่งเทรลนะ! 🐕')}
        >
          {/* Body */}
          <ellipse cx="550" cy="265" rx="46" ry="26" fill="#FFC928" stroke="#18151D" strokeWidth="4.5" />
          {/* Wagging Tail */}
          <path d="M 592,255 Q 632,238 642,250" fill="none" stroke="#FFC928" strokeWidth="10" strokeLinecap="round" />
          <path d="M 592,255 Q 632,238 642,250" fill="none" stroke="#18151D" strokeWidth="3.5" strokeLinecap="round" />
          {/* Rear Legs */}
          <path d="M 570,278 Q 610,305 632,298" fill="none" stroke="#FFC928" strokeWidth="9" strokeLinecap="round" />
          <path d="M 570,278 Q 610,305 632,298" fill="none" stroke="#18151D" strokeWidth="3.5" strokeLinecap="round" />
          {/* Front Legs running */}
          <path d="M 522,278 Q 495,300 472,295" fill="none" stroke="#FFC928" strokeWidth="9" strokeLinecap="round" />
          <path d="M 522,278 Q 495,300 472,295" fill="none" stroke="#18151D" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 532,278 Q 515,310 492,318" fill="none" stroke="#E6B01C" strokeWidth="8" strokeLinecap="round" />
          
          {/* Dog Head */}
          <ellipse cx="504" cy="242" rx="24" ry="21" fill="#FFC928" stroke="#18151D" strokeWidth="4.5" />
          {/* Floppy Ear */}
          <path d="M 512,232 Q 540,238 534,260 Q 518,264 512,242 Z" fill="#D99B16" stroke="#18151D" strokeWidth="3.5" />
          {/* Snout & Nose */}
          <ellipse cx="486" cy="247" rx="11" ry="8" fill="#FFC928" stroke="#18151D" strokeWidth="3.5" />
          <circle cx="482" cy="245" r="4" fill="#18151D" />
          {/* Happy Tongue */}
          <path d="M 484,251 Q 486,262 495,259" fill="#FF5E7E" stroke="#18151D" strokeWidth="3" />
          {/* Eye */}
          <circle cx="498" cy="238" r="4" fill="#18151D" />
          {/* Green Bandana around neck */}
          <polygon points="508,255 530,255 522,272" fill="#2EAD62" stroke="#18151D" strokeWidth="3" />
        </g>

        {/* CHARACTER 3: BOY RUNNER (Yellow Shirt & Green Shorts) */}
        <g
          id="heroBoyRunner"
          filter="url(#heroDropShadow)"
          className={`cursor-pointer transition-transform duration-300 ${wiggleTarget === 'runner' ? 'animate-wiggle scale-105' : 'hover:scale-103'}`}
          onClick={() => triggerReaction('runner', 'สู้ๆ ครับทุกคน! วิวริมหาดสวยสุดยอด! 🏃')}
        >
          {/* Back Leg */}
          <path d="M 720,255 L 755,295 L 778,290" fill="none" stroke="#E59866" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="765" y="284" width="20" height="11" rx="4.5" fill="#FFFFFF" stroke="#18151D" strokeWidth="3" />
          {/* Front Leg */}
          <path d="M 702,255 L 670,295 L 658,312" fill="none" stroke="#E59866" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="646" y="304" width="22" height="11" rx="4.5" fill="#FFFFFF" stroke="#18151D" strokeWidth="3" />
          {/* Green Shorts */}
          <path d="M 688,236 L 728,236 L 722,264 L 684,264 Z" fill="#2EAD62" stroke="#18151D" strokeWidth="4" />
          {/* Torso / Yellow Running Tee */}
          <path d="M 690,190 L 725,190 L 720,238 L 686,238 Z" fill="#FFC928" stroke="#18151D" strokeWidth="4.5" />
          {/* Left Arm forward */}
          <path d="M 696,198 L 662,216 L 650,208" fill="none" stroke="#E59866" strokeWidth="7" strokeLinecap="round" />
          {/* Right Arm back */}
          <path d="M 720,200 L 748,212 L 760,202" fill="none" stroke="#E59866" strokeWidth="7" strokeLinecap="round" />
          {/* Head & Green Cap */}
          <circle cx="700" cy="168" r="16" fill="#FAD7A0" stroke="#18151D" strokeWidth="3.5" />
          <path d="M 684,165 Q 700,150 718,162 L 677,165 Z" fill="#2EAD62" stroke="#18151D" strokeWidth="3" />
          <path d="M 677,165 L 664,168" stroke="#2EAD62" strokeWidth="5.5" strokeLinecap="round" />
        </g>

        {/* CHARACTER 4: ROCK / STONE HEAD MASCOT RUNNER */}
        <g
          id="heroRockRunner"
          filter="url(#heroDropShadow)"
          className={`cursor-pointer transition-transform duration-300 ${wiggleTarget === 'rock' ? 'animate-wiggle scale-105' : 'hover:scale-103'}`}
          onClick={() => triggerReaction('rock', 'หัวใจแกร่งดั่งหินผา! วิ่ง 10KM ได้สบาย! 🪨')}
        >
          {/* Back Leg */}
          <path d="M 835,268 L 862,302 L 880,296" fill="none" stroke="#FAD7A0" strokeWidth="7" strokeLinecap="round" />
          <rect x="870" y="290" width="18" height="10" rx="4" fill="#2EAD62" stroke="#18151D" strokeWidth="2.5" />
          {/* Front Leg */}
          <path d="M 818,268 L 795,308 L 784,322" fill="none" stroke="#FAD7A0" strokeWidth="7" strokeLinecap="round" />
          <rect x="772" y="315" width="20" height="10" rx="4" fill="#FFC928" stroke="#18151D" strokeWidth="2.5" />
          {/* Green Shorts */}
          <path d="M 808,250 L 844,250 L 838,274 L 804,274 Z" fill="#2EAD62" stroke="#18151D" strokeWidth="3.5" />
          {/* Purple Running Tank */}
          <path d="M 810,208 L 840,208 L 836,252 L 808,252 Z" fill="#803DDC" stroke="#18151D" strokeWidth="4" />
          {/* Stone Head Mascot */}
          <polygon points="826,145 852,180 845,218 810,218 800,180" fill="#95A5A6" stroke="#18151D" strokeWidth="4.5" strokeLinejoin="round" />
          <polygon points="826,145 852,180 832,202" fill="#BDC3C7" />
        </g>

        {/* Bottom Tagline Banner: RUN TOGETHER */}
        <g transform="translate(860, 220)">
          <rect x="-40" y="-12" width="110" height="24" rx="12" fill="#18151D" />
          <text x="15" y="4" fontFamily="'Prompt', sans-serif" fontWeight="900" fontSize="11" fill="#FFC928" textAnchor="middle" letterSpacing="2">
            RUN TOGETHER
          </text>
        </g>
      </svg>
    </div>
  );
};
