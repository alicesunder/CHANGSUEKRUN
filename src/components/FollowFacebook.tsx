import React from 'react';
import { ExternalLink } from 'lucide-react';
import { eventInfo } from '../data/eventData';

/** Bright banner that sends people to the official Facebook page for news. */
export const FollowFacebook: React.FC = () => (
  <section aria-labelledby="follow-fb-heading" className="py-6 sm:py-8">
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
      <div
        data-reveal="pop"
        className="relative overflow-hidden ds-frame-dark bg-gradient-to-r from-[#1B4FB8] via-[#4B1FA8] to-[#7C3AED] text-white px-5 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
      >
        <span aria-hidden="true" className="absolute -right-6 -top-8 text-[120px] opacity-15 rotate-12 select-none">🐾</span>
        <span
          aria-hidden="true"
          className="shrink-0 w-16 h-16 rounded-2xl bg-white text-[#1877F2] flex items-center justify-center text-4xl font-black shadow-lg animate-bobble"
        >
          f
        </span>
        <div className="relative flex-1 text-center sm:text-left">
          <h2 id="follow-fb-heading" className="font-hero text-xl sm:text-2xl font-black leading-tight">
            ติดตามข่าวสารล่าสุดที่เพจ Facebook
          </h2>
          <p className="mt-1 text-sm font-semibold text-white/85">
            ประกาศศิลปิน รายชื่อผู้ชนะ ภาพบรรยากาศ และข่าวด่วนก่อนวันงาน ไม่พลาดทุกอัปเดต
          </p>
        </div>
        <a
          href={eventInfo.facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative shrink-0 inline-flex items-center gap-2 min-h-[52px] px-6 rounded-2xl bg-[#FFC928] text-[#2A1450] text-base font-extrabold border-[3px] border-[#140826] shadow-[0_5px_0_#140826] active:translate-y-0.5"
        >
          กดติดตามเพจ <ExternalLink className="w-4 h-4" />
        </a>
        <a
          href={eventInfo.lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative shrink-0 inline-flex items-center gap-2 min-h-[52px] px-6 rounded-2xl bg-[#06C755] text-white text-base font-extrabold border-[3px] border-[#140826] shadow-[0_5px_0_#140826] active:translate-y-0.5"
        >
          แอดไลน์ <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  </section>
);
