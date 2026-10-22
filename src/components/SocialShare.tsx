import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { RouteId } from '../types';

interface SocialShareProps {
  selectedDistance?: RouteId | string;
  daysRemaining?: number;
  variant?: 'hero' | 'card' | 'floating';
  className?: string;
}

export const SocialShare: React.FC<SocialShareProps> = ({
  selectedDistance = '10km',
  daysRemaining,
  variant = 'hero',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // Normalize distance display
  const distanceLabel =
    selectedDistance === '1km'
      ? 'Dog Run 1K (วิ่งคู่น้องหมา)'
      : selectedDistance === '3km'
      ? 'Dog Run 3K (วิ่งคู่น้องหมา)'
      : selectedDistance === '5km'
      ? '5K'
      : selectedDistance === '10km'
      ? '10K'
      : selectedDistance;

  // Prepare pre-filled message
  const countdownText =
    daysRemaining !== undefined && daysRemaining > 0
      ? ` อีกเพียง ${daysRemaining} วันสู่วันแข่งขัน!`
      : '';

  const shareMessage = `🐘 มาร่วมวิ่งด้วยกันในงาน CHANGSUEK RUN 2027 (เห็นช้างวิ่ง วิ่งตามช้าง) 🏃‍♂️💨 ผมเลือกลงระยะ ${distanceLabel}!${countdownText} มาวิ่งสัมผัสสายลมทะเลชะอำ-หัวหินไปด้วยกันนะ #CHANGSUEKRUN #เห็นช้างวิ่งวิ่งตามช้าง #ชะอำหัวหิน`;

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://changsuekrun.com';
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    const quote = encodeURIComponent(shareMessage);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`;
    window.open(fbUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
  };

  const handleShareX = () => {
    const text = encodeURIComponent(shareMessage);
    const url = encodeURIComponent(getShareUrl());
    const xUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(xUrl, '_blank', 'width=600,height=450,noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = getShareUrl();
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (variant === 'card') {
    return (
      <div className={`flex items-center justify-between gap-2 pt-2 border-t border-purple-100/60 ${className}`}>
        <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5 text-[#2A0E4E]" />
          แชร์ระยะนี้:
        </span>
        <div className="flex items-center gap-1.5">
          {/* Facebook */}
          <button
            onClick={handleShareFacebook}
            className="w-7 h-7 rounded-full bg-[#2A0E4E]/10 hover:bg-[#2A0E4E] text-[#2A0E4E] hover:text-[#FFD633] flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer border border-[#2A0E4E]/15"
            title="แชร์ระยะนี้ไปยัง Facebook"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          {/* X (Twitter) */}
          <button
            onClick={handleShareX}
            className="w-7 h-7 rounded-full bg-[#2A0E4E]/10 hover:bg-[#1E0938] text-[#2A0E4E] hover:text-[#FFD633] flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer border border-[#2A0E4E]/15"
            title="แชร์ระยะนี้ไปยัง X"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>

          {/* Copy Message */}
          <button
            onClick={handleCopyLink}
            className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
              copied
                ? 'bg-amber-100/90 text-[#2A0E4E] border-amber-300'
                : 'bg-purple-50/80 hover:bg-purple-100 text-[#2A0E4E] border-purple-200/70'
            }`}
            title="คัดลอกข้อความชวนเพื่อนวิ่ง"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#2A0E4E]" />
                <span>คัดลอกแล้ว</span>
              </>
            ) : (
              <span>คัดลอก</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Default / Hero Variant: Harmonized with deep royal purple & gold brand colors
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#2A0E4E]/70 via-[#1F0A3A]/75 to-[#16062A]/80 border border-[#6B28B8]/40 backdrop-blur-md shadow-inner ${className}`}
    >
      {/* Label with brand elephant/runner icon and gold accent */}
      <div className="flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-white/85">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFD633]/15 text-[#FFD633]">
          <Share2 className="w-3 h-3" />
        </span>
        <span className="tracking-wide">แชร์ความพร้อม & เวลานับถอยหลัง</span>
      </div>

      {/* Action Buttons in purple-gold brand theme */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Facebook Share Button */}
        <button
          onClick={handleShareFacebook}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-[#FFD633] text-white hover:text-[#18062F] text-xs font-bold border border-white/15 hover:border-[#FFD633] transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm cursor-pointer group"
          title="แชร์เวลานับถอยหลังสู่วันแข่งขันไปยัง Facebook"
        >
          <svg className="w-3.5 h-3.5 fill-white/80 group-hover:fill-[#18062F] transition-colors" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </button>

        {/* X (Twitter) Share Button */}
        <button
          onClick={handleShareX}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-[#FFD633] text-white hover:text-[#18062F] text-xs font-bold border border-white/15 hover:border-[#FFD633] transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm cursor-pointer group"
          title="แชร์เวลานับถอยหลังสู่วันแข่งขันไปยัง X"
        >
          <svg className="w-3 h-3 fill-white/80 group-hover:fill-[#18062F] transition-colors" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span>X</span>
        </button>

        {/* Copy Share Message Button */}
        <button
          onClick={handleCopyLink}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
            copied
              ? 'bg-[#FFD633] text-[#18062F] border border-[#FFD633] shadow-[0_0_12px_rgba(255,214,51,0.4)]'
              : 'bg-white/[0.08] hover:bg-[#FFD633] text-white/90 hover:text-[#18062F] border border-white/15 hover:border-[#FFD633]'
          }`}
          title="คัดลอกข้อความพร้อมลิงก์"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>คัดลอกแล้ว</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>คัดลอก</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
