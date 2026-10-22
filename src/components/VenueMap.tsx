import React, { useState } from 'react';
import {
  Flag,
  UserCheck,
  Briefcase,
  HeartPulse,
  Droplets,
  Utensils,
  Camera,
  Dog,
  Bath,
  Car,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface ZoneItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  gridPos: string;
}

export const VenueMap: React.FC = () => {
  const [activeZone, setActiveZone] = useState<string>('start_finish');

  const zones: ZoneItem[] = [
    {
      id: 'start_finish',
      name: 'ซุ้มประตูปล่อยตัว & เส้นชัย (Start/Finish Arch)',
      category: 'Race Core',
      description: 'จุดเริ่มต้นและเข้าเส้นชัยริมชายหาดหน้าโรงแรม Sea Sand Sun พร้อมซุ้มถ่ายรูป นาฬิกาจับเวลาดิจิทัล และดนตรีบรรเลง',
      icon: Flag,
      color: '#7B3FC6',
      badgeBg: 'bg-[#EEE4FA] text-[#54239A]',
      gridPos: 'col-span-2 sm:col-span-3 row-span-1',
    },
    {
      id: 'registration',
      name: 'เต็นท์รับบิบ & เสื้อวิ่ง (BIB Pickup)',
      category: 'Services',
      description: 'เต็นท์ขนาดใหญ่แบ่งช่องตามเบอร์วิ่ง พร้อมจุดตรวจสอบความถูกต้องและระบบพิมพ์บิบคืนกรณีสูญหาย',
      icon: UserCheck,
      color: '#2EAD62',
      badgeBg: 'bg-[#DFF5E8] text-[#2EAD62]',
      gridPos: 'col-span-1 sm:col-span-2',
    },
    {
      id: 'bag_drop',
      name: 'จุดรับฝากสัมภาระ (Baggage Drop)',
      category: 'Services',
      description: 'เต็นท์รับฝากของมีเจ้าหน้าที่ทหาร ตชด. ดูแลตลอด 24 ชั่วโมง มีสติกเกอร์รหัสบิบคู่กับกระเป๋า',
      icon: Briefcase,
      color: '#45B9EA',
      badgeBg: 'bg-[#45B9EA]/15 text-[#169BD5]',
      gridPos: 'col-span-1 sm:col-span-1',
    },
    {
      id: 'medical_center',
      name: 'ศูนย์การแพทย์ฉุกเฉิน (Medical & Ambulance)',
      category: 'Safety',
      description: 'แพทย์สนาม พยาบาลวิชาชีพ เครื่อง AED 4 เครื่อง รถพยาบาลฉุกเฉิน 2 คัน พร้อมเตียงปฐมพยาบาล',
      icon: HeartPulse,
      color: '#EF5350',
      badgeBg: 'bg-red-50 text-red-600',
      gridPos: 'col-span-1 sm:col-span-2',
    },
    {
      id: 'pet_oasis',
      name: 'โซนพักผ่อน & จุดดื่มน้ำสุนัข (Dog Oasis)',
      category: 'Pet Care',
      description: 'จุดน้ำสะอาด ถาดน้ำสแตนเลส สวนหญ้าร่มรื่น จุดทิ้งมูลสุนัข และสัตวแพทย์อาสาคอยตรวจอาการฮีทสโตรก',
      icon: Dog,
      color: '#FFC928',
      badgeBg: 'bg-[#FFC928]/20 text-[#17151C]',
      gridPos: 'col-span-1 sm:col-span-1',
    },
    {
      id: 'food_village',
      name: 'ลานอาหาร & เครื่องดื่ม (Food Village)',
      category: 'Hospitality',
      description: 'บริการอาหารและเครื่องดื่ม ข้าวต้มทรงเครื่อง ก๋วยเตี๋ยว ผลไม้สด น้ำผลไม้ปั่น และกาแฟสดโบราณเพชรบุรี',
      icon: Utensils,
      color: '#F5B800',
      badgeBg: 'bg-amber-50 text-amber-700',
      gridPos: 'col-span-2 sm:col-span-2',
    },
    {
      id: 'photo_booths',
      name: 'ซุ้มถ่ายรูป & สปอนเซอร์ (Photo Ops)',
      category: 'Experience',
      description: 'จุดถ่ายรูปกับมาสคอตพี่ช้างศึกและน้องหมาสงคราม พร้อมป้ายเวลาและฉากทะเลจำลอง',
      icon: Camera,
      color: '#7B3FC6',
      badgeBg: 'bg-[#EEE4FA] text-[#54239A]',
      gridPos: 'col-span-1 sm:col-span-2',
    },
    {
      id: 'restrooms',
      name: 'ห้องน้ำ & สุขาเคลื่อนที่ (Restroom Block)',
      category: 'Hygiene',
      description: 'รถสุขาเคลื่อนที่ปรับอากาศและห้องน้ำในอาคารสโมสรค่าย รวมกว่า 30 ห้อง แยกชาย-หญิง',
      icon: Bath,
      color: '#169BD5',
      badgeBg: 'bg-sky-50 text-sky-700',
      gridPos: 'col-span-1 sm:col-span-1',
    },
    {
      id: 'parking_zones',
      name: 'ลานจอดรถ โซน A, B, C (Parking Hub)',
      category: 'Transport',
      description: 'ลานจอดรถรองรับ 800+ คัน พร้อมรถกอล์ฟและรถสองแถวรับส่งฟรีไปยังจุดปล่อยตัวทุก 5 นาที',
      icon: Car,
      color: '#17151C',
      badgeBg: 'bg-gray-100 text-gray-800',
      gridPos: 'col-span-2 sm:col-span-3',
    },
  ];

  const selectedZoneItem = zones.find((z) => z.id === activeZone) || zones[0];

  return (
    <div className="mt-8 bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#EEE4FA] shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#7B3FC6] bg-[#EEE4FA] px-3 py-1 rounded-full">
            EVENT VILLAGE MAP
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#17151C] mt-2">
            แผนผังพื้นที่จัดงาน & จุดบริการนักวิ่ง (ค่ายนเรศวร)
          </h3>
          <p className="text-xs sm:text-sm text-[#6F6878] font-semibold mt-1">
            คลิกเลือกจุดในแผนผังเพื่อดูรายละเอียดการให้บริการและสิ่งอำนวยความสะดวก
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#2EAD62] bg-[#DFF5E8] px-3.5 py-2 rounded-2xl">
          <CheckCircle2 className="w-4 h-4" />
          <span>จัดโซนเป็นสัดส่วน ปลอดภัย ไหลเวียนสะดวก</span>
        </div>
      </div>

      {/* Grid Blueprint Interactive Map */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        {zones.map((zone) => {
          const Icon = zone.icon;
          const isActive = activeZone === zone.id;

          return (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className={`${zone.gridPos} p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-br from-[#FAF9FC] to-white border-[#7B3FC6] shadow-lg ring-2 ring-[#7B3FC6]/20 scale-[1.01]'
                  : 'bg-[#FAF9FC] border-[#EEE4FA] hover:border-gray-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center border"
                  style={{ backgroundColor: `${zone.color}15`, borderColor: `${zone.color}40`, color: zone.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${zone.badgeBg}`}>
                  {zone.category}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-black text-[#17151C] leading-snug line-clamp-1">
                  {zone.name.split('(')[0]}
                </h4>
                <p className="text-[10px] text-gray-500 line-clamp-1 font-medium mt-0.5">
                  {zone.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Zone Detail Callout */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#EEE4FA]/60 via-[#FAF9FC] to-white border-2 border-[#EEE4FA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 flex-shrink-0"
            style={{
              backgroundColor: `${selectedZoneItem.color}20`,
              borderColor: selectedZoneItem.color,
              color: selectedZoneItem.color,
            }}
          >
            {React.createElement(selectedZoneItem.icon, { className: 'w-6 h-6' })}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedZoneItem.badgeBg}`}>
                {selectedZoneItem.category}
              </span>
              <h4 className="text-base font-black text-[#17151C]">
                {selectedZoneItem.name}
              </h4>
            </div>
            <p className="text-xs text-[#6F6878] font-medium mt-1">
              {selectedZoneItem.description}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-[#7B3FC6] whitespace-nowrap bg-white px-3 py-1.5 rounded-xl border border-[#EEE4FA] shadow-xs">
          📍 มีป้ายบอกทางชัดเจนทั่วบริเวณ
        </span>
      </div>
    </div>
  );
};
