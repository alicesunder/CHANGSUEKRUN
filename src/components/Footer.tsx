import React from 'react';
import { useLang } from '../i18n/lang';
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
  const { t } = useLang();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="bg-[#17092B] text-white pt-20 pb-10 relative overflow-hidden">
      {/* Scalloped top edge */}
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute top-0 left-0 w-full h-8 sm:h-12 text-[#FAF7FF]"
      >
        <path d="M0 0 H1440 V18 Q1380 46 1320 18 T1200 18 T1080 18 T960 18 T840 18 T720 18 T600 18 T480 18 T360 18 T240 18 T120 18 T0 18 Z" fill="currentColor" />
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#7B3FC6]/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 right-0 w-64 h-64 rounded-full bg-[#FFC928]/10 blur-3xl" />
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
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
              {t('งานวิ่งริมทะเลชะอำ-หัวหิน ณ หาดชะอำ (ค่ายนเรศวร) จ.เพชรบุรี วันที่ 9 มกราคม 2570 ก้าวไปด้วยกันเพื่อสุขภาพ รอยยิ้ม และเพื่อนสี่ขา', 'A seaside run in Cha-am – Hua Hin at Cha-am Beach (Naresuan Camp), Phetchaburi, on 9 January 2027. Stepping together for health, smiles and our four-legged friends.')}
            </p>

            {/* Handwritten sign-off */}
            <div className="font-comic text-base font-bold text-[#FFCC00] mt-1 -rotate-2 inline-flex items-center gap-1.5">
              “Run Together a Brighter Tomorrow”
              <span className="animate-bounce-subtle inline-block">💛</span>
            </div>
          </div>

          {/* Column 2: ลิงก์ด่วน (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
              {t('ลิงก์ด่วน', 'Quick links')}
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-semibold">
              <li>
                <a href="#hero" className="inline-block py-1.5 hover:text-[#FFCC00] hover:translate-x-1.5 transition-all before:content-['🐾'] before:mr-1.5 before:opacity-0 hover:before:opacity-100 before:transition-opacity">{t('หน้าแรก', 'Home')}</a>
              </li>
              <li>
                <a href="#objective" className="inline-block py-1.5 hover:text-[#FFCC00] hover:translate-x-1.5 transition-all before:content-['🐾'] before:mr-1.5 before:opacity-0 hover:before:opacity-100 before:transition-opacity">{t('รายละเอียดงาน', 'About the event')}</a>
              </li>
              <li>
                <a href="#distances" className="inline-block py-1.5 hover:text-[#FFCC00] hover:translate-x-1.5 transition-all before:content-['🐾'] before:mr-1.5 before:opacity-0 hover:before:opacity-100 before:transition-opacity">{t('ระยะวิ่ง', 'Distances')} (10K / 5K / Dog 4K / Dog 1K)</a>
              </li>
              <li>
                <a href="#schedule-and-map" className="inline-block py-1.5 hover:text-[#FFCC00] hover:translate-x-1.5 transition-all before:content-['🐾'] before:mr-1.5 before:opacity-0 hover:before:opacity-100 before:transition-opacity">{t('เส้นทางวิ่ง & กำหนดการแข่งขัน', 'Route & schedule')}</a>
              </li>
              <li>
                <a href="#hotels" className="inline-block py-1.5 hover:text-[#FFCC00] hover:translate-x-1.5 transition-all before:content-['🐾'] before:mr-1.5 before:opacity-0 hover:before:opacity-100 before:transition-opacity">{t('ที่พักใกล้สถานที่จัดงาน', 'Hotels near the venue')}</a>
              </li>
              <li>
                <a href="#faq" className="inline-block py-1.5 hover:text-[#FFCC00] hover:translate-x-1.5 transition-all before:content-['🐾'] before:mr-1.5 before:opacity-0 hover:before:opacity-100 before:transition-opacity">{t('คำถามที่พบบ่อย (FAQ)', 'FAQ')}</a>
              </li>
            </ul>
          </div>

          {/* Column 3: ติดต่อเรา (2.5 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-black text-white uppercase mb-4">
              {t('กองบัญชาการตำรวจตระเวนชายแดน', 'Border Patrol Police Headquarters')}
            </h4>
            <div className="space-y-3 text-xs text-white/70">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FFCC00] flex-shrink-0 mt-0.5" />
                <span>{t('หาดชะอำ (ค่ายนเรศวร) อ.ชะอำ จ.เพชรบุรี', 'Cha-am Beach (Naresuan Camp), Cha-am, Phetchaburi')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-[#FFCC00] flex-shrink-0 mt-2" />
                <div className="flex flex-col">
                  {eventInfo.contactPhones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/[^0-9]/g, '')}`} className="inline-block py-1 hover:text-[#FFCC00]">{p}</a>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FFCC00] flex-shrink-0" />
                <a href={`mailto:${eventInfo.contactEmail}`} className="inline-block py-1 hover:text-[#FFCC00]">{eventInfo.contactEmail}</a>
              </div>

            </div>
          </div>

          {/* Column 4: follow + privacy */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-black text-white uppercase mb-2">
              {t('ติดตามข่าวสาร', 'Follow us')}
            </h4>
            <div className="mb-3 flex items-center gap-3">
              <a
                href={eventInfo.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-[#06C755] text-white text-sm font-extrabold hover:brightness-110"
              >
                <span aria-hidden="true" className="w-5 h-5 rounded-md bg-white text-[#06C755] flex items-center justify-center font-black text-[9px] leading-none">LINE</span>
                {t('แอดไลน์ทีมงาน', 'Add us on LINE')}
              </a>
              <a href={eventInfo.lineUrl} target="_blank" rel="noopener noreferrer" aria-label={t('สแกน QR เพื่อแอดไลน์', 'Scan the QR code to add us on LINE')} className="shrink-0 rounded-lg bg-white p-1">
                <img src={eventInfo.lineQr} alt={t('QR code แอดไลน์ CHANGSUEK RUN', 'LINE QR code for CHANGSUEK RUN')} width={72} height={72} loading="lazy" className="h-[72px] w-[72px] rounded" />
              </a>
            </div>
            <a
              href={eventInfo.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-[#1877F2] text-white text-sm font-extrabold hover:brightness-110"
            >
              <span aria-hidden="true" className="w-5 h-5 rounded-full bg-white text-[#1877F2] flex items-center justify-center font-black text-sm leading-none">f</span>
              เพจ Facebook {eventInfo.contactFacebook}
            </a>
            <button
              type="button"
              onClick={openPrivacyNotice}
              className="flex items-center gap-1.5 min-h-[44px] text-xs font-bold text-white/85 hover:text-[#FFCC00] underline underline-offset-2 cursor-pointer"
            >
              {t('ประกาศความเป็นส่วนตัว', 'Privacy notice')}
            </button>
            <a
              href="#terms"
              className="flex items-center min-h-[44px] text-xs font-bold text-white/85 hover:text-[#FFCC00] underline underline-offset-2"
            >
              {t('ข้อกำหนดและเงื่อนไข', 'Terms & conditions')}
            </a>
            <div className="mt-2 text-xs font-black text-[#FFCC00]">
              #CHANGSUEKRUN #เห็นช้างวิ่งวิ่งตามช้าง
            </div>
          </div>

        </div>

        {/* Bottom copyright row matching mockup */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              © 2027 CHANGSUEK RUN. All rights reserved. |{' '}
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
            <span>{t('กลับขึ้นด้านบน', 'Back to top')}</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
