import React from 'react';
import { UserCheck, Ticket, UserPlus, Calendar, HelpCircle } from 'lucide-react';
import { useLang } from '../i18n/lang';
import { useSession } from '../utils/runnerAuth';

interface MobileBottomNavProps {
  onOpenRegisterModal: () => void;
  onOpenRunnerCenter: () => void;
  onOpenSimulation?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenRegisterModal, onOpenRunnerCenter }) => {
  const { t } = useLang();
  const session = useSession();
  const first = session?.user.name?.trim().split(/\s+/)[0] || '';

  return (
    <nav
      id="mobile-bottom-bar"
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-[#2A1450]/15 shadow-[0_-6px_24px_rgba(42,20,80,0.12)] py-1 px-2 safe-bottom"
    >
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        {/* 1. Runner Center / login */}
        <button
          type="button"
          onClick={onOpenRunnerCenter}
          className="flex flex-col items-center justify-center p-1.5 text-[#2A1450] hover:text-[#5B20A8] transition-colors relative min-h-[48px] cursor-pointer"
        >
          <div className="relative">
            <UserCheck className="w-5 h-5 text-[#5B20A8]" />
            {session && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          </div>
          <span className="text-xs font-extrabold mt-0.5 leading-none max-w-[64px] truncate">
            {session ? (session.role === 'staff' ? t('เจ้าหน้าที่', 'Staff') : first || t('ศูนย์นักวิ่ง', 'My center')) : t('เข้าสู่ระบบ', 'Log in')}
          </span>
        </button>

        {/* 2. Tickets & prices */}
        <a href="#distances" className="flex flex-col items-center justify-center p-1.5 text-[#2A1450] hover:text-[#5B20A8] transition-colors min-h-[48px]">
          <Ticket className="w-5 h-5 text-[#C2410C]" />
          <span className="text-xs font-extrabold mt-0.5 leading-none">{t('ตั๋ว&ราคา', 'Tickets')}</span>
        </a>

        {/* 3. Centre CTA: buy tickets */}
        <button
          type="button"
          onClick={onOpenRegisterModal}
          className="flex flex-col items-center justify-center -mt-5 p-2 rounded-2xl border-2 border-[#2A1450] shadow-[0_4px_0_#2A1450] transition-all transform active:scale-95 cursor-pointer bg-gradient-to-b from-[#FFD84D] to-[#F5B800] text-[#2A1450] min-w-[56px] min-h-[56px]"
          aria-label={t('ซื้อบัตร', 'Buy tickets')}
        >
          <UserPlus className="w-5 h-5 text-[#2A1450]" />
          <span className="text-xs font-black tracking-tight mt-0.5">{t('ซื้อบัตร', 'Buy')}</span>
        </button>

        {/* 4. FAQ */}
        <a href="#faq" className="flex flex-col items-center justify-center p-1.5 text-[#2A1450] hover:text-[#5B20A8] transition-colors min-h-[48px]">
          <HelpCircle className="w-5 h-5 text-[#B45309]" />
          <span className="text-xs font-extrabold mt-0.5 leading-none">{t('คำถาม', 'FAQ')}</span>
        </a>

        {/* 5. Schedule */}
        <a href="#schedule-and-map" className="flex flex-col items-center justify-center p-1.5 text-[#2A1450] hover:text-[#5B20A8] transition-colors min-h-[48px]">
          <Calendar className="w-5 h-5 text-[#15803D]" />
          <span className="text-xs font-extrabold mt-0.5 leading-none">{t('กำหนดการ', 'Schedule')}</span>
        </a>
      </div>
    </nav>
  );
};
