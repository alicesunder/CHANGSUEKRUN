import React from 'react';

export interface ChangsuekLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero' | number;
  showSubtitle?: boolean;
  theme?: 'dark' | 'light' | 'white-card';
  variant?: 'full' | 'horizontal' | 'badge-only' | 'wordmark-only';
  asImg?: boolean;
}

/**
 * ChangsuekLogo - Official Brand Logo
 * Uses the official changsuek-run-logo.png image asset.
 */
export const ChangsuekLogo: React.FC<ChangsuekLogoProps> = ({
  className = '',
  size = 'md',
  theme = 'light',
}) => {
  // Height calculation
  const heightPx =
    typeof size === 'number'
      ? size
      : size === 'xs'
      ? 32
      : size === 'sm'
      ? 48
      : size === 'md'
      ? 64
      : size === 'lg'
      ? 96
      : 140; // hero

  const isWhiteCard = theme === 'white-card';

  if (isWhiteCard) {
    return (
      <div className={`inline-flex items-center justify-center p-2.5 sm:p-3 bg-white rounded-2xl shadow-md border border-purple-100 ${className}`}>
        <img
          src="/images/brand/changsuek-run-logo.webp"
          alt="CHANGSUEK RUN - เห็นช้างวิ่ง วิ่งตามช้าง"
          style={{ height: heightPx, width: 'auto' }}
          className="object-contain select-none"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <img
      src="/images/brand/changsuek-run-logo.webp"
      alt="CHANGSUEK RUN - เห็นช้างวิ่ง วิ่งตามช้าง"
      style={{ height: heightPx, width: 'auto' }}
      className={`object-contain select-none ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
