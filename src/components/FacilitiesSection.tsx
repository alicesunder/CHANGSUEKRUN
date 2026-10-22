import React from 'react';
import { facilitiesData } from '../data/eventData';
import {
  Bath,
  Droplets,
  Utensils,
  HeartPulse,
  Luggage,
  Car,
  Info,
  Camera,
  Smile,
  PawPrint,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

export const FacilitiesSection: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'toilet':
        return Bath;
      case 'water':
        return Droplets;
      case 'food':
        return Utensils;
      case 'medical':
        return HeartPulse;
      case 'baggage':
        return Luggage;
      case 'parking':
        return Car;
      case 'info':
        return Info;
      case 'photo':
        return Camera;
      case 'family':
        return Smile;
      case 'pet':
        return PawPrint;
      default:
        return Sparkles;
    }
  };

  return (
    <section id="facilities" className="py-16 bg-white border-b border-[#ECEAF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-[#6F35B5] uppercase bg-[#F3EDF9] px-3.5 py-1 rounded-full">
            Event Village & Services
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#18151D] mt-2">
            สิ่งอำนวยความสะดวกในพื้นที่จัดงาน
          </h2>
          <p className="text-sm sm:text-base text-[#6F6A76] mt-2">
            ครบครันด้วยจุดบริการนักวิ่ง ห้องสุขา จุดรับฝากของ จุดปฐมพยาบาล และโซนพักผ่อนสำหรับสัตว์เลี้ยง
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilitiesData.map((fac) => {
            const Icon = getIcon(fac.type);
            return (
              <div
                key={fac.id}
                className="bg-[#FAF9FC] border border-[#ECEAF0] hover:border-[#8C4DDB]/40 rounded-3xl p-5 transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-[#ECEAF0] text-[#6F35B5] flex items-center justify-center shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#6F6A76] bg-white border border-[#ECEAF0] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#8C4DDB]" />
                      <span>{fac.operatingHours}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#18151D]">
                    {fac.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6F35B5] mt-1 mb-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{fac.location}</span>
                  </div>

                  <p className="text-xs text-[#6F6A76] leading-relaxed">
                    {fac.description}
                  </p>
                </div>

                {fac.notes && (
                  <div className="mt-3 pt-3 border-t border-[#ECEAF0] text-[11px] font-medium text-[#2EAA59] bg-[#E8F7ED]/40 p-2 rounded-xl">
                    💡 {fac.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
