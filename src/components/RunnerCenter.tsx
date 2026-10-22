import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Calendar,
  Clock,
  Sparkles,
  Award,
  IdCard,
  UserPlus,
  Play,
  RotateCcw,
} from 'lucide-react';
import { RouteId } from '../types';
import {
  RunnerProfile,
  getStoredRunnerProfile,
  clearStoredRunnerProfile,
} from '../utils/runnerStorage';
import { RunnerBibCard } from './RunnerBibCard';
import { RunnerChecklist } from './RunnerChecklist';
import { RunnerQuickActions } from './RunnerQuickActions';

interface RunnerCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterModal: () => void;
  onOpenSimulation: (routeId?: RouteId) => void;
  onSelectRoute?: (routeId: RouteId) => void;
}

export const RunnerCenter: React.FC<RunnerCenterProps> = ({
  isOpen,
  onClose,
  onOpenRegisterModal,
  onOpenSimulation,
  onSelectRoute,
}) => {
  const [profile, setProfile] = useState<RunnerProfile | null>(getStoredRunnerProfile());
  const [activeTab, setActiveTab] = useState<'overview' | 'bib' | 'checklist'>('overview');

  // Sync profile when opened
  useEffect(() => {
    if (isOpen) {
      setProfile(getStoredRunnerProfile());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNavigateSection = (sectionId: string) => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleClearDemoProfile = () => {
    clearStoredRunnerProfile();
    setProfile(null);
  };

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#17151C]/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-[#FAF9FC] text-[#17151C] rounded-[32px] shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header Bar */}
        <div className="relative px-6 py-4 sm:py-5 bg-gradient-to-r from-[#3D106B] via-[#5B20A8] to-[#261042] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <span className="text-xl">🐘</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFC928]">
                  CHANGSUEK RUN 2027
                </span>
                <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                  RUNNER CENTER
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black leading-tight">
                ศูนย์นักวิ่ง (Runner Center)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile && (
              <button
                onClick={handleClearDemoProfile}
                title="รีเซ็ตโปรไฟล์จำลอง"
                className="hidden sm:flex items-center gap-1 text-[11px] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ต Demo</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {profile ? (
            /* ============================================================== */
            /* 1. REGISTERED RUNNER DASHBOARD (DESKTOP 2-COL / MOBILE STACK) */
            /* ============================================================== */
            <>
              {/* Welcome Runner Banner */}
              <div className="bg-gradient-to-r from-purple-100 via-white to-amber-50 rounded-3xl p-5 sm:p-6 border border-purple-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B20A8]">
                    <Sparkles className="w-4 h-4 text-[#F5B800]" />
                    <span>ยินดีต้อนรับกลับสู่สนามวิ่ง</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#1F1035]">
                    คุณ {profile.fullName || 'นักวิ่งช้างศึก'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    ลงทะเบียนระยะ <strong className="text-[#5B20A8]">{profile.routeName}</strong> • หมายเลข BIB #{profile.bibNumber}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSimulation(profile.routeId);
                    }}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#5B20A8] hover:bg-[#4A188A] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>จำลองเส้นทางวิ่งของคุณ</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Official BIB Card & Print */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-[#1F1035] uppercase tracking-wider flex items-center gap-1.5">
                      <IdCard className="w-4 h-4 text-[#5B20A8]" />
                      <span>บัตรประจำตัวนักวิ่ง (Digital BIB)</span>
                    </h4>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ พร้อมใช้งาน
                    </span>
                  </div>

                  <RunnerBibCard
                    profile={profile}
                    onOpenSimulation={() => {
                      onClose();
                      onOpenSimulation(profile.routeId);
                    }}
                  />
                </div>

                {/* Right Column: Race Ready Checklist & Schedule Reminder */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Checklist */}
                  <RunnerChecklist />

                  {/* Race Day Schedule Reminder Card */}
                  <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-sm text-[#1F1035]">
                        <Calendar className="w-4 h-4 text-[#5B20A8]" />
                        <span>กำหนดการสำคัญวันแข่งขัน</span>
                      </div>
                      <span className="text-xs font-bold text-[#5B20A8]">15 ก.พ. 2570</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-100">
                        <div className="text-[10px] text-gray-500 font-bold uppercase">ประกวด & กิจกรรม</div>
                        <div className="text-sm font-black text-[#5B20A8] mt-0.5">09.00 - 15.00 น.</div>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
                        <div className="text-[10px] text-gray-500 font-bold uppercase">ปล่อยตัววิ่ง 4 ระยะ</div>
                        <div className="text-sm font-black text-[#B26A00] mt-0.5">16.30 - 17.30 น.</div>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <div className="text-[10px] text-gray-500 font-bold uppercase">ดนตรี & คอนเสิร์ต</div>
                        <div className="text-sm font-black text-emerald-700 mt-0.5">17.30 น. เป็นต้นไป</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="pt-2">
                <h4 className="text-sm font-black text-[#1F1035] uppercase tracking-wider mb-3">
                  ทางลัดข้อมูลการแข่งขัน (Quick Actions)
                </h4>
                <RunnerQuickActions
                  onNavigateSection={handleNavigateSection}
                  onOpenSimulation={() => {
                    onClose();
                    onOpenSimulation(profile.routeId);
                  }}
                  onViewBib={() => {
                    const el = document.querySelector('.printable-bib');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              </div>
            </>
          ) : (
            /* ============================================================== */
            /* 2. EMPTY STATE: NO REGISTRATION FOUND YET                     */
            /* ============================================================== */
            <div className="text-center py-10 sm:py-14 max-w-xl mx-auto space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-100 text-[#5B20A8] flex items-center justify-center shadow-lg border border-purple-200">
                <span className="text-4xl">🐘</span>
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-[#B26A00]">
                  START YOUR RACE JOURNEY
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1F1035]">
                  การเดินทางของคุณเริ่มต้นที่นี่
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                  ยังไม่พบข้อมูลการลงทะเบียนในอุปกรณ์นี้ สมัครเข้าร่วมงานช้างศึกรัน 2027 เพื่อรับหมายเลข BIB, ตรวจสอบเช็กลิสต์ความพร้อม และจำลองเส้นทางวิ่งของคุณได้ทันที!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenRegisterModal();
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#FFC928] hover:bg-[#F5B800] text-[#17151C] font-black text-sm shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>สมัครวิ่งเลย</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSimulation('3km');
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-purple-50 text-[#5B20A8] font-bold text-sm border border-purple-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>ทดลองจำลองเส้นทาง (Simulation)</span>
                </button>
              </div>

              {/* Informative Perks Grid */}
              <div className="pt-8 border-t border-purple-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-purple-100">
                  <div className="font-bold text-[#1F1035] mb-1">✓ Digital BIB ประจำตัว</div>
                  <div className="text-gray-500">รับหมายเลขวิ่งพร้อมดาวน์โหลดหรือพิมพ์เก็บไว้ได้ทันที</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-purple-100">
                  <div className="font-bold text-[#1F1035] mb-1">✓ Route Simulator</div>
                  <div className="text-gray-500">ซ้อมวิ่งผ่านพิกัด GPS จริง พร้อมระบบแจ้งเตือนจุดน้ำและพยาบาล</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-purple-100">
                  <div className="font-bold text-[#1F1035] mb-1">✓ Race Companion</div>
                  <div className="text-gray-500">เช็กลิสต์ความพร้อม ข้อมูลที่พัก โรงแรม Pet-Friendly ครบครัน</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
