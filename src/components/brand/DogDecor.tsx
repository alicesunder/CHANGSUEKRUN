import React from 'react';
import { DogCharacter } from './BrandCharacters';

export const PawIcon: React.FC<{
  className?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ className = '', size = 24, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    style={style}
    fill={color}
    aria-hidden="true"
  >
    <ellipse cx="14" cy="26" rx="7" ry="9" transform="rotate(-18 14 26)" />
    <ellipse cx="27" cy="14" rx="6.5" ry="9" transform="rotate(-6 27 14)" />
    <ellipse cx="42" cy="14" rx="6.5" ry="9" transform="rotate(6 42 14)" />
    <ellipse cx="54" cy="26" rx="7" ry="9" transform="rotate(18 54 26)" />
    <path d="M32 28c-9 0-17 9-15 17 1.5 6 7 7 11 6 2.5-.6 5.5-.6 8 0 4 1 9.500 0 11-6 2-8-6-17-15-17z" />
  </svg>
);

export const BoneIcon: React.FC<{ className?: string; size?: number; color?: string }> = ({
  className = '',
  size = 40,
  color = '#FFC928',
}) => (
  <svg viewBox="0 0 64 32" width={size} height={size / 2} className={className} aria-hidden="true">
    <path
      d="M14 4a7 7 0 0 0-6 10.500A7 7 0 1 0 14 28a7 7 0 0 0 6-5h24a7 7 0 1 0 6 5 7 7 0 1 0 6-13.500A7 7 0 0 0 50 4a7 7 0 0 0-6 5H20a7 7 0 0 0-6-5z"
      fill={color}
      stroke="#2A1450"
      strokeWidth="3"
      strokeLinejoin="round"
      transform="scale(.94) translate(2 1)"
    />
  </svg>
);

export const BallIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 36,
}) => (
  <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true">
    <circle cx="20" cy="20" r="16" fill="#FF8A3D" stroke="#2A1450" strokeWidth="3" />
    <path d="M6 15c8 3 20 3 28 0M6 26c8-3 20-3 28 0" fill="none" stroke="#2A1450" strokeWidth="2.500" />
    <circle cx="14" cy="13" r="3" fill="#fff" opacity=".6" />
  </svg>
);

export const CloudIcon: React.FC<{ className?: string; width?: number }> = ({
  className = '',
  width = 120,
}) => (
  <svg viewBox="0 0 120 60" width={width} height={width / 2} className={className} aria-hidden="true">
    <path
      d="M28 52a20 20 0 0 1-2-39.800A26 26 0 0 1 76 14a22 22 0 0 1 18 38z"
      fill="#fff"
      stroke="#2A1450"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

/** A row of paw prints that light up one after the other. */
export const PawTrail: React.FC<{ count?: number; className?: string; color?: string }> = ({
  count = 8,
  className = '',
  color = '#7B3FC6',
}) => (
  <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <PawIcon
        key={i}
        size={22}
        color={color}
        className="opacity-0"
        style={{
          animation: 'pawFade 3.2s ease-in-out infinite',
          animationDelay: `${i * 0.25}s`,
          ['--r' as string]: i % 2 ? '14deg' : '-14deg',
          marginTop: i % 2 ? 10 : 0,
        }}
      />
    ))}
  </div>
);

/** A dog that trots across the full width of its parent forever. */
export const TrottingDog: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 96,
}) => (
  <div className={`pointer-events-none absolute left-0 ${className}`} aria-hidden="true">
    <div className="animate-trot">
      <DogCharacter size={size} isAnimated={false} />
    </div>
  </div>
);

/** Scalloped wave divider for the bottom of a section. */
export const WaveDivider: React.FC<{ fill?: string; className?: string }> = ({
  fill = '#ffffff',
  className = '',
}) => (
  <svg
    viewBox="0 0 1440 60"
    preserveAspectRatio="none"
    className={`block w-full h-8 sm:h-12 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M0 30 Q 60 0 120 30 T 240 30 T 360 30 T 480 30 T 600 30 T 720 30 T 840 30 T 960 30 T 1080 30 T 1200 30 T 1320 30 T 1440 30 V60 H0 Z"
      fill={fill}
    />
  </svg>
);
