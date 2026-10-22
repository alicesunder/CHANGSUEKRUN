import React from 'react';

/**
 * CHANG SUEK RUN 2027 Brand Characters & Graphic Motifs
 * Perfectly crafted vector art capturing:
 * - The Joyful Purple Elephant (#7B3FC6, #54239A, #9F65EB) with yellow ears (#FFC928) & sports bib
 * - The Cheerful Golden Dog (#E6A854, #F5B800) with red bandana (#EF5350)
 * - The Friendly Runner in energetic stride
 * - Coastal Palm Tree, Golden Sun, Waves & Clouds
 * - Animated SVG Running Trail
 */

export interface CharacterProps {
  className?: string;
  size?: number | string;
  isAnimated?: boolean;
}

// 1. The Main Character: Joyful Purple Elephant
export const ElephantCharacter: React.FC<CharacterProps & { showBib?: boolean; bibNumber?: string; mood?: 'running' | 'celebrating' | 'waving' }> = ({
  className = '',
  size = 140,
  isAnimated = true,
  showBib = true,
  bibNumber = '2027',
  mood = 'running',
}) => {
  return (
    <svg
      viewBox="0 0 240 220"
      width={size}
      height={size}
      className={`overflow-visible ${className} ${isAnimated ? 'animate-bounce-subtle' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ช้างศึกสีม่วง - สัญลักษณ์หลัก CHANG SUEK RUN"
    >
      <defs>
        <linearGradient id="charElephantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9F65EB" />
          <stop offset="50%" stopColor="#7B3FC6" />
          <stop offset="100%" stopColor="#54239A" />
        </linearGradient>
        <linearGradient id="charEarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="100%" stopColor="#FFC928" />
        </linearGradient>
        <filter id="charDropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#17151C" floodOpacity="0.15" />
        </filter>
      </defs>

      <g filter="url(#charDropShadow)">
        {/* Tail */}
        <path
          d="M 50,130 Q 30,140 28,160"
          fill="none"
          stroke="#54239A"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="28" cy="160" r="5" fill="#24172F" />

        {/* Back Leg (Far side) */}
        <path
          d="M 68,140 Q 60,175 58,190 Q 64,196 74,194 Q 78,182 82,145"
          fill="#54239A"
          stroke="#17151C"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Front Leg (Far side) */}
        <path
          d="M 148,138 Q 158,168 170,180 Q 180,182 182,174 Q 172,158 162,132"
          fill="#54239A"
          stroke="#17151C"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Elephant Main Body */}
        <ellipse
          cx="110"
          cy="125"
          rx="58"
          ry="46"
          fill="url(#charElephantGrad)"
          stroke="#17151C"
          strokeWidth="4"
        />

        {/* Race Bib on Body */}
        {showBib && (
          <g transform="translate(90, 105)">
            <rect
              x="0"
              y="0"
              width="44"
              height="34"
              rx="6"
              fill="#FFFFFF"
              stroke="#17151C"
              strokeWidth="2.5"
            />
            {/* Bib safety pins / holes */}
            <circle cx="5" cy="5" r="1.5" fill="#FFC928" />
            <circle cx="39" cy="5" r="1.5" fill="#FFC928" />
            <circle cx="5" cy="29" r="1.5" fill="#FFC928" />
            <circle cx="39" cy="29" r="1.5" fill="#FFC928" />
            <rect x="7" y="5" width="30" height="4" rx="2" fill="#7B3FC6" />
            <text
              x="22"
              y="23"
              fontSize="12"
              fontWeight="bold"
              fontFamily="Prompt, sans-serif"
              fill="#17151C"
              textAnchor="middle"
            >
              {bibNumber}
            </text>
            <text
              x="22"
              y="30"
              fontSize="5.5"
              fontWeight="bold"
              fontFamily="Prompt, sans-serif"
              fill="#2EAD62"
              textAnchor="middle"
            >
              RUNNER
            </text>
          </g>
        )}

        {/* Back Leg (Near side - Stride) */}
        <path
          d="M 85,145 Q 92,180 96,200 Q 108,202 112,194 Q 106,175 102,145"
          fill="url(#charElephantGrad)"
          stroke="#17151C"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Near Shoe (Yellow & Green Sport Sneaker) */}
        <ellipse cx="106" cy="198" rx="14" ry="6" fill="#FFC928" stroke="#17151C" strokeWidth="2.5" />
        <rect x="94" y="194" width="10" height="4" rx="2" fill="#2EAD62" />

        {/* Front Leg (Near side - Lifted) */}
        <path
          d="M 132,145 Q 126,175 120,192 Q 130,198 138,192 Q 142,172 146,145"
          fill="url(#charElephantGrad)"
          stroke="#17151C"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Front Shoe */}
        <ellipse cx="128" cy="194" rx="13" ry="6" fill="#FFC928" stroke="#17151C" strokeWidth="2.5" />
        <rect x="117" y="190" width="10" height="4" rx="2" fill="#2EAD62" />

        {/* Head */}
        <circle
          cx="160"
          cy="85"
          r="38"
          fill="url(#charElephantGrad)"
          stroke="#17151C"
          strokeWidth="4"
        />

        {/* Big Round Yellow Ear (Behind Head) */}
        <path
          d="M 138,60 C 105,48 100,105 132,118 Z"
          fill="url(#charEarGrad)"
          stroke="#17151C"
          strokeWidth="3.5"
        />
        <path
          d="M 134,68 C 112,60 110,98 130,108"
          fill="none"
          stroke="#F5B800"
          strokeWidth="3"
        />

        {/* Energetic Sports Headband */}
        <path
          d="M 135,68 Q 165,58 190,74"
          fill="none"
          stroke="#FFC928"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 137,68 Q 165,60 188,74"
          fill="none"
          stroke="#EF5350"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Big Happy Eye */}
        <ellipse cx="172" cy="80" rx="7" ry="9" fill="#FFFFFF" stroke="#17151C" strokeWidth="2.5" />
        <ellipse cx="174" cy="79" rx="4" ry="5.5" fill="#17151C" />
        <circle cx="176" cy="77" r="1.8" fill="#FFFFFF" />
        {/* Happy eyebrow */}
        <path d="M 166,68 Q 174,63 182,69" fill="none" stroke="#17151C" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cheerful Rosy Blush */}
        <ellipse cx="160" cy="96" rx="7" ry="4" fill="#EF5350" opacity="0.45" />

        {/* Happy Raised Trunk (Blowing excitement!) */}
        {mood === 'celebrating' || mood === 'running' ? (
          <path
            d="M 185,96 Q 212,105 218,80 Q 224,55 205,52 Q 194,54 196,62 Q 202,66 208,62"
            fill="none"
            stroke="url(#charElephantGrad)"
            strokeWidth="15"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M 185,96 Q 208,110 216,92 Q 220,78 208,74"
            fill="none"
            stroke="url(#charElephantGrad)"
            strokeWidth="15"
            strokeLinecap="round"
          />
        )}
        <path
          d="M 185,96 Q 212,105 218,80 Q 224,55 205,52"
          fill="none"
          stroke="#17151C"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Smiling Mouth */}
        <path
          d="M 174,102 Q 182,112 192,104"
          fill="none"
          stroke="#17151C"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Celebration Water / Sparkles from trunk */}
        <g className="animate-pulse">
          <circle cx="218" cy="42" r="3.5" fill="#45B9EA" />
          <circle cx="230" cy="50" r="2.5" fill="#FFC928" />
          <circle cx="210" cy="34" r="2" fill="#2EAD62" />
        </g>
      </g>
    </svg>
  );
};

// 2. Supporting Character: The Cheerful War Dog
export const DogCharacter: React.FC<CharacterProps> = ({
  className = '',
  size = 90,
  isAnimated = true,
}) => {
  return (
    <svg
      viewBox="0 0 160 140"
      width={size}
      height={size}
      className={`overflow-visible ${className} ${isAnimated ? 'animate-bounce-gentle' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="สุนัขคู่ใจ - เพื่อนซี้สี่ขา WAR DOG"
    >
      <defs>
        <linearGradient id="dogGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5C06A" />
          <stop offset="100%" stopColor="#D98A2B" />
        </linearGradient>
      </defs>

      <g>
        {/* Happy Wagging Tail */}
        <path
          d="M 32,75 Q 15,60 12,45"
          fill="none"
          stroke="#D98A2B"
          strokeWidth="7"
          strokeLinecap="round"
          className={isAnimated ? 'animate-wiggle origin-bottom-right' : ''}
        />
        <path
          d="M 32,75 Q 15,60 12,45"
          fill="none"
          stroke="#17151C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Back Running Legs */}
        <path
          d="M 40,82 L 32,112 Q 38,118 46,114 L 52,86"
          fill="#C47820"
          stroke="#17151C"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Front Running Legs (Stretching forward) */}
        <path
          d="M 88,82 L 102,112 Q 110,115 114,108 L 100,82"
          fill="#D98A2B"
          stroke="#17151C"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Dog Body */}
        <ellipse
          cx="68"
          cy="78"
          rx="36"
          ry="24"
          fill="url(#dogGrad)"
          stroke="#17151C"
          strokeWidth="3.5"
        />

        {/* Red Runner Bandana */}
        <polygon points="90,62 108,76 86,84" fill="#EF5350" stroke="#17151C" strokeWidth="2.5" />
        <circle cx="102" cy="74" r="2" fill="#FFC928" />

        {/* Dog Head */}
        <circle cx="108" cy="52" r="22" fill="url(#dogGrad)" stroke="#17151C" strokeWidth="3.5" />

        {/* Floppy Ear */}
        <path
          d="M 98,42 C 86,34 84,60 96,65 Z"
          fill="#B56715"
          stroke="#17151C"
          strokeWidth="3"
        />

        {/* Happy Dog Eye */}
        <ellipse cx="116" cy="48" rx="4" ry="5.5" fill="#FFFFFF" stroke="#17151C" strokeWidth="2" />
        <circle cx="117" cy="48" r="2.8" fill="#17151C" />
        <circle cx="118" cy="46" r="1" fill="#FFFFFF" />

        {/* Snout & Nose */}
        <ellipse cx="126" cy="56" rx="10" ry="8" fill="#FFE2B8" stroke="#17151C" strokeWidth="2" />
        <ellipse cx="132" cy="54" rx="3.5" ry="2.5" fill="#17151C" />

        {/* Happy Tongue Panting */}
        <path
          d="M 124,62 Q 128,72 133,70 Q 136,66 130,61 Z"
          fill="#EF5350"
          stroke="#17151C"
          strokeWidth="1.5"
        />

        {/* Little Motion Wind Streaks */}
        <line x1="135" y1="42" x2="145" y2="40" stroke="#FFC928" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="138" y1="50" x2="150" y2="48" stroke="#2EAD62" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// 3. Human Element: Energetic Runner
export const RunnerCharacter: React.FC<CharacterProps> = ({
  className = '',
  size = 110,
  isAnimated = true,
}) => {
  return (
    <svg
      viewBox="0 0 140 180"
      width={size}
      height={size}
      className={`overflow-visible ${className} ${isAnimated ? 'animate-bounce-subtle' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="นักวิ่งไฟแรง - สัญลักษณ์ความแอคทีฟ"
    >
      <defs>
        <linearGradient id="jerseyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#45B9EA" />
          <stop offset="100%" stopColor="#169BD5" />
        </linearGradient>
      </defs>

      <g>
        {/* Runner Head */}
        <circle cx="70" cy="36" r="18" fill="#FBD5B5" stroke="#17151C" strokeWidth="3.5" />
        {/* Hair */}
        <path
          d="M 54,32 Q 65,16 86,24 Q 88,38 86,40 Q 75,34 60,38 Z"
          fill="#4A2E18"
          stroke="#17151C"
          strokeWidth="2.5"
        />
        {/* Headband */}
        <path d="M 54,32 Q 70,26 86,34" fill="none" stroke="#FFC928" strokeWidth="5" strokeLinecap="round" />
        {/* Friendly Face */}
        <circle cx="76" cy="36" r="2.5" fill="#17151C" />
        <path d="M 72,42 Q 76,46 80,42" fill="none" stroke="#17151C" strokeWidth="2" strokeLinecap="round" />

        {/* Torso & Athletic Jersey */}
        <path
          d="M 60,54 L 84,54 L 80,95 L 56,95 Z"
          fill="url(#jerseyGrad)"
          stroke="#17151C"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Race number stripe */}
        <rect x="62" y="66" width="16" height="14" rx="2" fill="#FFFFFF" stroke="#17151C" strokeWidth="1.5" />
        <text x="70" y="77" fontSize="8" fontWeight="bold" fill="#7B3FC6" textAnchor="middle" fontFamily="Prompt">27</text>

        {/* Arms (Pumping running rhythm) */}
        {/* Back Arm */}
        <path
          d="M 60,58 L 44,72 L 52,86"
          fill="none"
          stroke="#FBD5B5"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 60,58 L 44,72 L 52,86"
          fill="none"
          stroke="#17151C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Running Shorts */}
        <path
          d="M 56,95 L 80,95 L 84,116 L 72,116 L 68,104 L 64,116 L 52,116 Z"
          fill="#24172F"
          stroke="#17151C"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Back Leg (Knee bent backwards) */}
        <path
          d="M 60,116 L 46,140 L 32,136"
          fill="none"
          stroke="#FBD5B5"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Back Shoe */}
        <ellipse cx="28" cy="135" rx="8" ry="5" fill="#EF5350" stroke="#17151C" strokeWidth="2" />

        {/* Front Leg (Forward stride) */}
        <path
          d="M 76,116 L 88,142 L 108,158"
          fill="none"
          stroke="#FBD5B5"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Front Shoe */}
        <ellipse cx="112" cy="162" rx="10" ry="6" fill="#EF5350" stroke="#17151C" strokeWidth="2" />
        <rect x="106" y="158" width="6" height="3" rx="1" fill="#FFC928" />

        {/* Front Arm (Thumbs up cheer!) */}
        <path
          d="M 84,58 L 98,72 L 92,86"
          fill="none"
          stroke="#FBD5B5"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 84,58 L 98,72 L 92,86"
          fill="none"
          stroke="#17151C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

// 4. Coastal Palm Tree & Sun Motif
export const CoastalNatureMotif: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 160 160"
      className={`overflow-visible ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Radiant Sun */}
      <circle cx="110" cy="50" r="32" fill="#FFC928" />
      <circle cx="110" cy="50" r="26" fill="#FFE066" />
      {/* Sun Ray Accents */}
      <line x1="110" y1="10" x2="110" y2="4" stroke="#FFC928" strokeWidth="3" strokeLinecap="round" />
      <line x1="145" y1="26" x2="150" y2="22" stroke="#FFC928" strokeWidth="3" strokeLinecap="round" />
      <line x1="150" y1="50" x2="156" y2="50" stroke="#FFC928" strokeWidth="3" strokeLinecap="round" />

      {/* Palm Trunk */}
      <path
        d="M 45,150 Q 52,110 38,70"
        fill="none"
        stroke="#87582A"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Green Palm Fronds */}
      <path d="M 38,70 Q 15,62 8,78" fill="none" stroke="#2EAD62" strokeWidth="5" strokeLinecap="round" />
      <path d="M 38,70 Q 30,42 16,46" fill="none" stroke="#2EAD62" strokeWidth="5" strokeLinecap="round" />
      <path d="M 38,70 Q 56,44 68,58" fill="none" stroke="#2EAD62" strokeWidth="5" strokeLinecap="round" />
      <path d="M 38,70 Q 65,72 74,86" fill="none" stroke="#2EAD62" strokeWidth="5" strokeLinecap="round" />
      {/* Coconuts */}
      <circle cx="36" cy="74" r="3.5" fill="#5A3A1A" />
      <circle cx="42" cy="73" r="3" fill="#5A3A1A" />

      {/* Coastal Ocean Wave */}
      <path
        d="M 0,146 Q 30,138 60,146 T 120,146 T 160,146"
        fill="none"
        stroke="#45B9EA"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 15,154 Q 45,148 75,154 T 135,154"
        fill="none"
        stroke="#169BD5"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

// 5. Continuous Running Trail Motif with Travelling Energy Pulse
export const RunningTrailGraphic: React.FC<{ className?: string; color?: string }> = ({
  className = '',
  color = '#7B3FC6',
}) => {
  return (
    <div className={`w-full overflow-hidden pointer-events-none py-2 ${className}`}>
      <svg
        viewBox="0 0 1200 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-8 opacity-70"
        preserveAspectRatio="none"
      >
        {/* Background track line */}
        <path
          d="M 0,24 C 200,6 400,42 600,24 C 800,6 1000,42 1200,24"
          stroke="#E5E0EE"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Animated Dashed Colorful Trail */}
        <path
          d="M 0,24 C 200,6 400,42 600,24 C 800,6 1000,42 1200,24"
          stroke={color}
          strokeWidth="3"
          strokeDasharray="10 12"
          strokeLinecap="round"
          className="animate-dash"
        />
        {/* Mini running marker icon */}
        <circle cx="300" cy="18" r="5" fill="#FFC928" stroke="#17151C" strokeWidth="1.5" />
        <circle cx="900" cy="30" r="5" fill="#2EAD62" stroke="#17151C" strokeWidth="1.5" />
      </svg>
    </div>
  );
};
