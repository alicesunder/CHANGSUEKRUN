import React from 'react';
import { MapPin, Sparkles, Heart, Waves } from 'lucide-react';

interface HeroBeachRunnerVisualProps {
  onOpenVideo?: () => void;
}

export const HeroBeachRunnerVisual: React.FC<HeroBeachRunnerVisualProps> = ({ onOpenVideo }) => {
  return (
    <div className="relative w-full max-w-[560px] mx-auto select-none">
      {/* Decorative Sky Seagulls */}
      <div className="absolute -top-6 left-12 z-10 pointer-events-none opacity-80">
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
          <path d="M5 20 Q15 5 25 15 Q35 5 45 20" stroke="#7B3FC6" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M35 12 Q42 2 49 10 Q56 2 63 12" stroke="#54239A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Main Photographic & Running Scene Card */}
      <div className="relative rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/90 bg-gradient-to-tr from-sky-200 via-sky-100 to-amber-50 group">
        {/* Coastal Beach Background Photo */}
        <div className="relative aspect-[4/3] sm:aspect-[16/13] w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
            alt="หาดชะอำ - หัวหิน เส้นทางวิ่งริมทะเล"
            className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

          {/* Tropical Palm Fronds on Right Edge */}
          <div className="absolute top-0 right-0 w-36 sm:w-44 h-full pointer-events-none opacity-90">
            <svg viewBox="0 0 160 280" className="w-full h-full" fill="none">
              <path d="M160 0 C120 40 100 90 90 150 C80 200 95 240 110 280" stroke="#166534" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
              {/* Palm leaves */}
              <path d="M110 50 Q60 60 40 90 Q80 80 115 65" fill="#15803D" opacity="0.85" />
              <path d="M100 90 Q45 110 30 145 Q75 130 105 105" fill="#166534" opacity="0.9" />
              <path d="M95 130 Q35 160 20 200 Q70 180 98 145" fill="#15803D" opacity="0.85" />
              <path d="M92 170 Q40 210 35 250 Q75 225 96 185" fill="#14532D" opacity="0.9" />
            </svg>
          </div>

          {/* Realistic Runner in Purple Shirt on Shoreline */}
          <div className="absolute bottom-2 right-12 sm:right-20 w-44 sm:w-56 pointer-events-none drop-shadow-2xl">
            {/* Artistic Vector & Silhouette of Runner in Chang Suek Run Shirt */}
            <svg viewBox="0 0 160 220" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="runnerShirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8340D4" />
                  <stop offset="100%" stopColor="#5B249D" />
                </linearGradient>
                <linearGradient id="skinTone" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5CBA7" />
                  <stop offset="100%" stopColor="#E59866" />
                </linearGradient>
              </defs>

              {/* Runner Shadow on wet beach sand */}
              <ellipse cx="80" cy="208" rx="42" ry="7" fill="#000000" opacity="0.25" />

              {/* Legs in dynamic running stride */}
              {/* Back leg */}
              <path d="M 68,145 L 45,178 L 30,172" stroke="url(#skinTone)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 30,172 L 20,185" stroke="#17151C" strokeWidth="10" strokeLinecap="round" />
              
              {/* Front leg */}
              <path d="M 92,145 L 115,175 L 125,202" stroke="url(#skinTone)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              {/* Running shoe with lime green/yellow accent */}
              <path d="M 125,202 L 142,206 L 136,212 L 120,210 Z" fill="#FFC928" stroke="#17151C" strokeWidth="2" />

              {/* Running Shorts */}
              <path d="M 60,132 L 100,132 L 104,152 L 86,152 L 80,144 L 74,152 L 56,152 Z" fill="#1F2937" />

              {/* Torso & Purple Chang Suek Running Jersey */}
              <path d="M 62,68 L 98,68 L 102,135 L 58,135 Z" fill="url(#runnerShirtGrad)" />
              {/* Jersey Graphic Logo on Back */}
              <circle cx="80" cy="94" r="14" fill="#FFFFFF" opacity="0.9" />
              <text x="80" y="93" fontSize="5.5" fontWeight="900" textAnchor="middle" fill="#5B249D">CHANG SUEK</text>
              <text x="80" y="100" fontSize="6" fontWeight="900" textAnchor="middle" fill="#FFC928">2027</text>

              {/* Arms */}
              {/* Left arm swinging back */}
              <path d="M 62,72 L 40,94 L 38,118" stroke="url(#skinTone)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              {/* Right arm bent forward */}
              <path d="M 98,72 L 122,88 L 118,108" stroke="url(#skinTone)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

              {/* Head & Ponytail */}
              <circle cx="80" cy="46" r="14" fill="url(#skinTone)" />
              {/* Hair / Ponytail tied back */}
              <path d="M 72,44 C 70,30 90,30 90,44 C 90,48 85,54 75,54 Z" fill="#4A3728" />
              <path d="M 86,40 Q 106,42 108,58 Q 102,62 88,50" fill="#4A3728" />
            </svg>
          </div>

          {/* Secondary Runners & Running Dog in background along surf */}
          <div className="absolute bottom-16 right-36 sm:right-48 w-28 sm:w-36 pointer-events-none opacity-85">
            <svg viewBox="0 0 120 70" className="w-full h-auto">
              {/* Background runner 1 */}
              <circle cx="35" cy="18" r="4" fill="#3B1270" />
              <path d="M35,22 L35,38 L28,52 M35,38 L42,50 M30,30 L40,32" stroke="#3B1270" strokeWidth="3" strokeLinecap="round" />
              
              {/* Background runner 2 */}
              <circle cx="55" cy="16" r="4" fill="#1D4ED8" />
              <path d="M55,20 L55,36 L48,50 M55,36 L62,48 M50,28 L60,30" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />

              {/* Running Golden/War Dog beside runners */}
              <ellipse cx="80" cy="42" rx="10" ry="6" fill="#C2410C" />
              <circle cx="92" cy="36" r="4.5" fill="#C2410C" />
              <path d="M72,42 Q68,36 66,34" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M75,46 L73,54 M85,46 L87,54 M82,46 L80,54" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Floating Playful Beach Badge Sticker matching mockup */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 transform rotate-3 hover:rotate-0 transition-transform">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border-2 border-[#7B3FC6]/30 flex items-center gap-2">
              <span className="text-lg">🌊</span>
              <div>
                <div className="text-[11px] sm:text-xs font-black text-[#54239A] leading-tight">
                  ชะอำ - หัวหิน
                </div>
                <div className="text-[12px] sm:text-sm font-comic font-black text-[#00665A] leading-tight">
                  เส้นทางสวย วิ่งทะเล! 🏃‍♀️
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
