import React from 'react';
import {
  IdCard,
  MapPin,
  Play,
  Calendar,
  CloudSun,
  Car,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { RouteId } from '../types';

interface RunnerQuickActionsProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenSimulation: () => void;
  onViewBib: () => void;
}

export const RunnerQuickActions: React.FC<RunnerQuickActionsProps> = ({
  onNavigateSection,
  onOpenSimulation,
  onViewBib,
}) => {
  const actions = [
    {
      id: 'bib',
      title: 'MY BIB',
      sub: 'หมายเลขประจำตัว',
      icon: IdCard,
      color: 'text-[#5B20A8] bg-purple-50 border-purple-200',
      action: onViewBib,
    },
    {
      id: 'route',
      title: 'MY ROUTE',
      sub: 'แผนที่เส้นทาง GPS',
      icon: MapPin,
      color: 'text-[#EF5350] bg-red-50 border-red-200',
      action: () => onNavigateSection('routes'),
    },
    {
      id: 'simulation',
      title: 'SIMULATION',
      sub: 'จำลองเส้นทางเสมือนจริง',
      icon: Play,
      color: 'text-[#17151C] bg-[#FFC928]/30 border-amber-300 font-black',
      action: onOpenSimulation,
      badge: 'HOT',
    },
    {
      id: 'schedule',
      title: 'SCHEDULE',
      sub: 'กำหนดการแข่งขัน',
      icon: Calendar,
      color: 'text-[#2EAD62] bg-emerald-50 border-emerald-200',
      action: () => onNavigateSection('schedule'),
    },
    {
      id: 'weather',
      title: 'WEATHER',
      sub: 'พยากรณ์อากาศริมหาด',
      icon: CloudSun,
      color: 'text-[#45B9EA] bg-sky-50 border-sky-200',
      action: () => onNavigateSection('weather-forecast'),
    },
    {
      id: 'parking',
      title: 'PARKING',
      sub: 'จุดจอดรถ & การเดินทาง',
      icon: Car,
      color: 'text-[#54239A] bg-purple-50 border-purple-200',
      action: () => onNavigateSection('faq'),
    },
    {
      id: 'safety',
      title: 'SAFETY',
      sub: 'การปฐมพยาบาล & ความปลอดภัย',
      icon: ShieldCheck,
      color: 'text-[#EF5350] bg-rose-50 border-rose-200',
      action: () => onNavigateSection('faq'),
    },
    {
      id: 'hotels',
      title: 'HOTELS',
      sub: '41 ที่พักสัตว์เลี้ยงพักได้',
      icon: Building,
      color: 'text-[#169BD5] bg-cyan-50 border-cyan-200',
      action: () => onNavigateSection('hotels'),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            type="button"
            onClick={act.action}
            className="p-3 sm:p-3.5 rounded-2xl bg-white hover:bg-[#FCFAFF] border border-purple-100 hover:border-purple-300 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${act.color} group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
              {act.badge && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FFC928] text-[#17151C]">
                  {act.badge}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs font-black text-[#1F1035] group-hover:text-[#5B20A8] transition-colors">
                {act.title}
              </div>
              <div className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                {act.sub}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
