import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Footprints,
  Tag,
  Droplets,
  Sun,
  RefreshCw,
  Shirt,
  Smartphone,
  Watch,
  HeartPulse,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultChecked?: boolean;
}

const CHECKLIST_STORAGE_KEY = 'changsuek_runner_checklist_v1';

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: 'running-shoes',
    name: 'รองเท้าวิ่งคู่ใจที่ซ้อมจนชินเท้า',
    description: 'ผูกเชือก 2 ทบป้องกันเชือกหลุดระหว่างวิ่ง',
    icon: Footprints,
    defaultChecked: true,
  },
  {
    id: 'bib-number',
    name: 'ป้ายหมายเลข BIB + ชิปจับเวลา RFID',
    description: 'ติดที่หน้าอกเสื้อให้ชัดเจน พร้อมกรอกเบอร์ฉุกเฉินด้านหลัง',
    icon: Tag,
    defaultChecked: true,
  },
  {
    id: 'official-jersey',
    name: 'เสื้อวิ่ง Micro-Dry CHANGSUEK',
    description: 'ระบายเหงื่อแห้งไว เหมาะกับอากาศริมชายหาด',
    icon: Shirt,
  },
  {
    id: 'hydration-pack',
    name: 'สายจูง / สมุดวัคซีน & ถุงเก็บมูล (สำหรับ Dog Run)',
    description: 'ความยาวสายจูงไม่เกิน 1.5 เมตร เพื่อความปลอดภัยตลอดเส้นทาง',
    icon: Droplets,
  },
  {
    id: 'sun-protection',
    name: 'ครีมกันแดด SPF50+ & หมวกวิ่ง/แว่นกันแดด',
    description: 'ป้องกันแสงแดดช่วงบ่ายถึงเย็นบริเวณชายหาดเปิดโล่ง',
    icon: Sun,
  },
  {
    id: 'gps-watch',
    name: 'นาฬิกาวิ่ง GPS / โทรศัพท์ชาร์จแบตเต็ม 100%',
    description: 'สำหรับดูเพซ ถ่ายภาพที่ระลึก และสแกนรับเหรียญ',
    icon: Watch,
  },
];

export const EssentialRunnerChecklist: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const initial: { [key: string]: boolean } = {};
    DEFAULT_CHECKLIST.forEach((item) => {
      if (item.defaultChecked) initial[item.id] = true;
    });
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checkedItems));
    } catch {
      // ignore
    }
  }, [checkedItems]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetChecklist = () => {
    const initial: { [key: string]: boolean } = {};
    DEFAULT_CHECKLIST.forEach((item) => {
      if (item.defaultChecked) initial[item.id] = true;
    });
    setCheckedItems(initial);
  };

  const completedCount = DEFAULT_CHECKLIST.filter((i) => checkedItems[i.id]).length;
  const totalCount = DEFAULT_CHECKLIST.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div
      id="runner-checklist"
      className="h-full bg-white rounded-[32px] border-[3px] border-[#2A1450] shadow-[0_18px_38px_-14px_rgba(42,20,80,0.28),0_6px_0_#2A1450] overflow-hidden flex flex-col justify-between"
    >
      {/* Top Accent Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-[#16A34A] via-[#FFC928] to-[#7B3FC6]" />

      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-dashed border-[#2A1450]/15">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-[#DCFCE7] text-[#166534] border-2 border-[#2A1450] shadow-[2px_2px_0_#2A1450] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#2A1450] leading-tight">
                  เช็กลิสต์เตรียมตัวก่อนวันวิ่ง
                </h3>
                <span className="block text-xs font-bold text-[#6B5A85]">
                  ติ๊กเช็กความพร้อมส่วนตัวและอุปกรณ์น้องหมา ({completedCount}/{totalCount} รายการ)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#2A1450] text-[#FFC928] text-xs font-extrabold tabular-nums">
                พร้อม {progressPercent}%
              </span>
              <button
                type="button"
                onClick={resetChecklist}
                title="รีเซ็ตเช็กลิสต์"
                className="p-2 rounded-full bg-[#FAF7FF] hover:bg-purple-100 text-[#5B20A8] border border-purple-200 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3.5 h-2.5 w-full rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#16A34A] via-[#7B3FC6] to-[#F59E0B] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Compact 2-Column Checklist Grid */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEFAULT_CHECKLIST.map((item) => {
              const Icon = item.icon;
              const isChecked = !!checkedItems[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`text-left rounded-2xl p-3 border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                    isChecked
                      ? 'bg-[#F0FDF4] border-[#16A34A] shadow-2xs'
                      : 'bg-[#FAF8FF] hover:bg-white border-purple-100 hover:border-purple-300'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-[#15803D] fill-[#DCFCE7]" />
                    ) : (
                      <Circle className="w-5 h-5 text-purple-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs sm:text-[13px] font-extrabold leading-snug ${
                        isChecked ? 'text-[#14532D]' : 'text-[#2A1450]'
                      }`}
                    >
                      {item.name}
                    </div>
                    <div className="text-[11px] text-[#6B5A85] font-medium mt-0.5 line-clamp-1">
                      {item.description}
                    </div>
                  </div>
                  <Icon className="w-4 h-4 text-[#7B3FC6]/60 shrink-0 mt-0.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
