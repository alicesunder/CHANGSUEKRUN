import React from 'react';
import { UserCheck, Ticket, UserPlus, Calendar, HelpCircle } from 'lucide-react';
import { getStoredRunnerProfile } from '../utils/runnerStorage';

interface MobileBottomNavProps {
  onOpenRegisterModal: () => void;
  onOpenRunnerCenter: () => void;
  onOpenSimulation?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenRegisterModal,
  onOpenRunnerCenter,
}) => {
  const profile = getStoredRunnerProfile();

  return (
    <nav
      id="mobile-bottom-bar"
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-[#2A1450]/15 shadow-[0_-6px_24px_rgba(42,20,80,0.12)] py-1 px-2 safe-bottom"
    >
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        {/* 1. Center / BIB Dashboard */}
        <button
          type="button"
          onClick={onOpenRunnerCenter}
          className="flex flex-col items-center justify-center p-1.5 text-[#2A1450] hover:text-[#5B20A8] transition-colors relative min-h-[48px] cursor-pointer"
        >
          <div className="relative">
            <UserCheck className="w-5 h-5 text-[#5B20A8]" />
            {profile && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <span className="text-xs font-extrabold mt-0.5 leading-none">
            {profile ? 'BIB ของฉัน' : 'ศูนย์นักวิ่ง'}
          </span>
        </button>

        {/* 2. Map & Landmarks (Fixed link to #schedule-and-map) */}
        <a
          href="#distances"
          className="flex flex-col items-center justify-center p-1.5 text-[#2A1450] hover:text-[#5B20A8] transition-colors min-h-[48px]"
        >
          <Ticket className="w-5 h-5 text-[#C2410C]" />
          <span className="text-xs font-extrabold mt-0.5 leading-none">ตั๋ว&ราคา</span>
        </a>

        {/* 3. Center CTA: Register or BIB */}
        <button
          type="button"
          onClick={profile ? onOpenRunnerCenter : onOpenRegisterModal}
          className="flex flex-col items-center justify-center -mt-5 p-2 rounded-2xl border-2 border-[#2A1450] shadow-[0_4px_0_#2A1450] transition-all transform active:scale-95 cursor-pointer bg-gradient-to-b from-[#FFD84D] to-[#F5B800] text-[#2A1450] min-w-[56px] min-h-[56px]"
          aria-label={profile ? 'ดู BIB และศูนย์นักวิ่ง' : 'ซื้อบัตร'}
        >
          {profile ? (
            <>
              <span className="text-xl leading-none">🐘</span>
              <span className="text-xs font-black tracking-tight mt-0.5">
                BIB #{profile.bibNumber.slice(-4)}
              </span>
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5 text-[#2A1450]" />
              <span className="text-xs font-black tracking-tight mt-0.5">
                ซื้อบัตร
              </span>
            </>
          )}
        </button>

        {/* 4. Start Simulation */}
        <a
          href="#faq"
          className="flex flex-col items-center justify-center p-1.5 text-[#2A1450] hover:text-[#5B20A8] transition-colors min-h-[48px]"
        >
          <HelpCircle className="w-5 h-5 text-[#B45309]" />
          <span className="text-xs font-extrabold mt-0.5 leading-none">คำถาม</span>
        </a>

        {/* 5. Schedule (Fixed link to #schedule-and-map) */}
        <a
          href="#schedule-and-map"
          className="flex flex-col items-center justify-center p-1.5 text-[#2A1450] hover:text-[#5B20A8] transition-colors min-h-[48px]"
        >
          <Calendar className="w-5 h-5 text-[#15803D]" />
          <span className="text-xs font-extrabold mt-0.5 leading-none">กำหนดการ</span>
        </a>
      </div>
    </nav>
  );
};
