import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PawIcon } from './brand/DogDecor';
import { LabradorMascot } from './brand/LabradorMascot';

interface EventCtaBannerProps {
  onOpenRegisterModal: () => void;
}

export const EventCtaBanner: React.FC<EventCtaBannerProps> = ({ onOpenRegisterModal }) => {
  return (
    <section className="bg-gradient-to-r from-[#260F48] via-[#3A1668] to-[#1E0B38] py-12 sm:py-14 text-white relative overflow-hidden">
      {/* Ambient Light Orbs */}
      <div className="absolute -top-20 left-1/4 w-72 h-72 rounded-full bg-[#FFC928]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full bg-[#EC4899]/15 blur-3xl pointer-events-none" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 bg-white/10 border border-white/25 rounded-[32px] p-6 sm:p-9 backdrop-blur-xl shadow-[0_24px_54px_-16px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]">
          {/* Left Mascot + Text */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <LabradorMascot
              size={88}
              speechText="เจอกันที่ชะอำนะ!"
              glowColor="rgba(255, 201, 40, 0.45)"
            />
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#FFE268] uppercase tracking-wider mb-1">
                <PawIcon size={16} color="#FFE268" />
                <span>พร้อมออกวิ่งไปกับเพื่อนสี่ขาหรือยัง?</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                มาร่วมเป็นส่วนหนึ่งของ <span className="text-[#FFE268]">CHANGSUEK RUN 2027</span>
              </h2>
              <p className="text-xs sm:text-sm text-purple-100 font-medium mt-2">
                ก้าวไปด้วยกัน เพื่อสุขภาพ ครอบครัว ชุมชน และเพื่อนสี่ขา · วันที่ 15 กุมภาพันธ์ 2570 ณ หาดชะอำ (ค่ายนเรศวร - ค่ายพระราม 6) จ.เพชรบุรี
              </p>
            </div>
          </div>

          {/* Right Yellow Pill Button */}
          <button
            type="button"
            onClick={onOpenRegisterModal}
            className="relative overflow-hidden bg-gradient-to-b from-[#FFE268] via-[#FFC928] to-[#F59E0B] text-[#261247] border-2 border-[#261247] luminous-pill-btn font-extrabold text-sm sm:text-base px-8 py-3.5 rounded-full transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span className="absolute inset-0 ticket-foil-shimmer opacity-50 pointer-events-none" />
            <PawIcon size={18} color="#261247" className="relative z-10" />
            <span className="relative z-10">สมัครวิ่งตอนนี้</span>
            <ArrowRight className="w-5 h-5 relative z-10" />
          </button>
        </div>
      </div>
    </section>
  );
};
