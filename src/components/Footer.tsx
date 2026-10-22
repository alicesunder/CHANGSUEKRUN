import React from 'react';
import { Mail, Phone, MapPin, ArrowUp, ShieldCheck } from 'lucide-react';
import { eventInfo } from '../data/eventData';
import { openPrivacyNotice } from './PrivacyNotice';

interface FooterProps {
  onOpenArtworkModal: () => void;
  onOpenRegisterModal: () => void;
  onOpenAdminModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenArtworkModal,
  onOpenRegisterModal,
  onOpenAdminModal,
}) => {

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="bg-[#17092B] text-white pt-16 pb-10 border-t border-white/10 relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4 Columns matching mockup */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/10">
          
          {/* Column 1: Brand & Cursive Signature (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <img loading="lazy" decoding="async"
              src="/images/brand/changsuek-run-logo.webp"
              alt="CHANGSUEK RUN"
              className="h-16 w-auto object-contain mb-4 select-none"
              referrerPolicy="no-referrer"
            />
            
            <p className="text-xs text-purple-200/80 leading-relaxed mb-4 max-w-sm">
              งานวิ่งริมทะเลชะอำ-หัวหิน ณ หาดชะอำ (ค่ายนเรศวร - ค่ายพระราม 6) จ.เพชรบุรี วันที่ 15 กุมภาพันธ์ 2570 ก้าวไปด้วยกันเพื่อสุขภาพ รอยยิ้ม และเพื่อนสี่ขา
            </p>

            {/* Handwritten cursive script matching mockup */}
            <div className="text-sm font-serif italic text-[#FFCC00] tracking-wider mt-1">
              “Run Together a Brighter Tomorrow”
            </div>
          </div>

          {/* Column 2: ลิงก์ด่วน (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
              ลิงก์ด่วน
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-semibold">
              <li>
                <a href="#hero" className="inline-block py-1.5 hover:text-[#FFCC00] transition-colors">หน้าแรก</a>
              </li>
              <li>
                <a href="#experience" className="inline-block py-1.5 hover:text-[#FFCC00] transition-colors">รายละเอียดงาน</a>
              </li>
              <li>
                <a href="#distances" className="inline-block py-1.5 hover:text-[#FFCC00] transition-colors">ระยะวิ่ง (10K / 5K / Dog 3K / Dog 1K)</a>
              </li>
              <li>
                <a href="#schedule-and-map" className="inline-block py-1.5 hover:text-[#FFCC00] transition-colors">เส้นทางวิ่ง & กำหนดการแข่งขัน</a>
              </li>
              <li>
                <a href="#hotels" className="inline-block py-1.5 hover:text-[#FFCC00] transition-colors">ที่พักใกล้สถานที่จัดงาน</a>
              </li>
              <li>
                <a href="#faq" className="inline-block py-1.5 hover:text-[#FFCC00] transition-colors">คำถามที่พบบ่อย (FAQ)</a>
              </li>
            </ul>
          </div>

          {/* Column 3: ติดต่อเรา (2.5 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
              ติดต่อเรา
            </h4>
            <div className="space-y-3 text-xs text-white/70">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FFCC00] flex-shrink-0 mt-0.5" />
                <span>หาดชะอำ (ค่ายนเรศวร - ค่ายพระราม 6) อ.ชะอำ จ.เพชรบุรี</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#FFCC00] flex-shrink-0" />
                <a href={`tel:${eventInfo.contactPhone.split('/')[0].replace(/[^0-9]/g, '')}`} className="inline-block py-1 hover:text-[#FFCC00]">{eventInfo.contactPhone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FFCC00] flex-shrink-0" />
                <a href={`mailto:${eventInfo.contactEmail}`} className="inline-block py-1 hover:text-[#FFCC00]">{eventInfo.contactEmail}</a>
              </div>

            </div>
          </div>

          {/* Column 4: follow + privacy */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">
              ติดตามข่าวสาร
            </h4>
            <a
              href={`https://${eventInfo.contactFacebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[44px] text-xs font-bold text-white/85 hover:text-[#FFCC00]"
            >
              Facebook: {eventInfo.contactFacebook}
            </a>
            <button
              type="button"
              onClick={openPrivacyNotice}
              className="flex items-center gap-1.5 min-h-[44px] text-xs font-bold text-white/85 hover:text-[#FFCC00] underline underline-offset-2 cursor-pointer"
            >
              ประกาศความเป็นส่วนตัว
            </button>
            <a
              href="#terms"
              className="flex items-center min-h-[44px] text-xs font-bold text-white/85 hover:text-[#FFCC00] underline underline-offset-2"
            >
              ข้อกำหนดและเงื่อนไข
            </a>
            <div className="mt-2 text-xs font-black text-[#FFCC00] tracking-wider">
              #CHANGSUEKRUN #เห็นช้างวิ่งวิ่งตามช้าง
            </div>
          </div>

        </div>

        {/* Bottom copyright row matching mockup */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              © 2026 CHANGSUEK RUN. All rights reserved. |{' '}
              <span className="text-white/70">เห็นช้างวิ่ง วิ่งตามช้าง</span>
            </span>
            {onOpenAdminModal && (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-[#FFC928] text-[#FFC928] hover:text-[#17092B] font-extrabold text-[11px] border border-[#FFC928]/40 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ระบบจัดการตั๋ว & เลข BIB (สำหรับแอดมิน)</span>
              </button>
            )}
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 min-h-[32px] text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <span>กลับขึ้นด้านบน</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
