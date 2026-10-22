import React from 'react';
import { parkingZonesData } from '../data/eventData';
import { Car, Clock, MapPin, CheckCircle2, AlertCircle, Navigation } from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/geo';
import { venueInfo } from '../data/eventData';

export const ParkingSection: React.FC = () => {
  return (
    <section id="parking" className="py-16 bg-white border-b border-[#ECEAF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-[#6F35B5] uppercase bg-[#F3EDF9] px-3.5 py-1 rounded-full">
            Parking & Traffic Plan
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#18151D] mt-2">
            จุดจอดรถและแผนการจราจรภายในค่าย
          </h2>
          <p className="text-sm sm:text-base text-[#6F6A76] mt-2">
            พื้นที่จอดรถรองรับกว่า 800+ คัน พร้อมเจ้าหน้าที่อำนวยความสะดวกตลอดการจัดงาน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {parkingZonesData.map((zone) => {
            const isAvailable = zone.status === 'AVAILABLE';
            return (
              <div
                key={zone.id}
                className="bg-[#FAF9FC] rounded-3xl border border-[#ECEAF0] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-[#6F35B5] text-white">
                      {zone.name}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                        isAvailable
                          ? 'bg-[#E8F7ED] text-[#2EAA59]'
                          : 'bg-[#FFF4D6] text-[#A66D00]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{isAvailable ? 'พร้อมรองรับ' : 'พื้นที่จำกัด'}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#18151D]">
                    {zone.description}
                  </h3>

                  <div className="space-y-2 mt-4 text-xs text-[#6F6A76]">
                    <div className="flex items-center justify-between py-1 border-b border-[#ECEAF0]">
                      <span>ความจุ:</span>
                      <span className="font-extrabold text-[#18151D]">{zone.capacity}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#ECEAF0]">
                      <span>เวลาเปิด:</span>
                      <span className="font-bold text-[#18151D]">{zone.openingTime}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>ระยะถึงจุดปล่อยตัว:</span>
                      <span className="font-bold text-[#6F35B5]">{zone.distanceToStart}</span>
                    </div>
                  </div>
                </div>

                {zone.shuttleService && (
                  <div className="mt-4 pt-3 border-t border-[#ECEAF0] text-[11px] font-semibold text-[#2EAA59] bg-[#E8F7ED]/50 p-2 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>มีรถกอล์ฟรับ-ส่งฟรีสู่งาน</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Traffic Advice Card */}
        <div className="mt-8 p-5 rounded-3xl bg-[#FAF9FC] border border-[#ECEAF0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#8C4DDB] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#6F6A76] leading-relaxed">
              <span className="font-bold text-[#18151D] block">คำแนะนำการจราจรในวันแข่งขัน:</span>
              ประตูค่ายเปิดตั้งแต่เวลา 04:00 น. เส้นทางหน้าค่ายจะมีการจัดระเบียบการจราจรแบบ One-way โปรดปฏิบัติตามสัญญาณของเจ้าหน้าที่สารวัตรทหารอย่างเคร่งครัด
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
