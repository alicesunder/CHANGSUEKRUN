import React from 'react';
import { venueInfo } from '../data/eventData';
import { ShieldCheck, Trees, Sun, Camera, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/geo';
import { VenueMap } from './VenueMap';

export const VenueSection: React.FC = () => {
  return (
    <section id="venue" className="py-16 bg-[#FAF9FC] border-b border-[#EEE4FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Venue Story & Features (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEE4FA] border border-[#7B3FC6]/30 text-xs font-black text-[#54239A] uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#FFC928]" />
              <span>สถานที่จัดงาน (EVENT VENUE)</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-[#17151C] tracking-tight">
              {venueInfo.name}
            </h2>

            <p className="text-base text-[#6F6878] leading-relaxed font-semibold">
              {venueInfo.description}
            </p>

            {/* Unique Venue Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {venueInfo.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-white border-2 border-[#EEE4FA] shadow-sm hover:border-[#7B3FC6]/30 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#EEE4FA] text-[#7B3FC6] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#17151C]">เอกลักษณ์พื้นที่</h4>
                    <p className="text-xs text-[#6F6878] mt-0.5 font-medium leading-snug">{h}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Venue Rules & Guidelines */}
            <div className="p-4 rounded-2xl bg-[#FFFBEA] border-2 border-[#FFC928]/50 shadow-sm">
              <h4 className="text-xs font-black text-[#17151C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#F5B800]" />
                <span>ข้อควรปฏิบัติในเขตพื้นที่ค่ายทหารและแนวชายหาด</span>
              </h4>
              <ul className="text-xs text-[#6F6878] space-y-1.5 list-disc list-inside font-semibold">
                {venueInfo.rules.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed">{rule}</li>
                ))}
              </ul>
            </div>

            {/* Google Maps Link */}
            <div className="pt-2">
              <a
                href={getGoogleMapsUrl(venueInfo.name, venueInfo.latitude, venueInfo.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#7B3FC6] hover:bg-[#54239A] text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all hover:shadow-lg"
              >
                <Navigation className="w-4 h-4 text-[#FFC928]" />
                <span>เปิดแผนที่นำทางสู่ค่ายนเรศวร (Google Maps)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right: Visual Card with Scenic Overview (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 border-2 border-[#EEE4FA] shadow-xl space-y-5">
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-[#24172F] via-[#54239A] to-[#7B3FC6] p-6 text-white text-center">
                <div className="text-xs font-black text-[#FFC928] uppercase tracking-wider mb-1">
                  LANDMARK ATMOSPHERE
                </div>
                <h3 className="text-2xl font-black mb-2">
                  ค่ายนเรศวร & ชายหาดชะอำ
                </h3>
                <p className="text-xs text-white/80 leading-relaxed max-w-sm mx-auto font-medium">
                  วิ่งรับสายลมทะเล สัมผัสเงาไม้สนร่มรื่น และชื่นชมทัศนียภาพอันสง่างามของพระราชนิเวศน์มฤคทายวัน
                </p>

                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/20 text-center">
                  <div>
                    <div className="text-lg font-black text-[#FFC928]">300+</div>
                    <div className="text-[10px] text-white/70 font-bold">ไร่ พื้นที่สีเขียว</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-[#FFC928]">1.5 KM</div>
                    <div className="text-[10px] text-white/70 font-bold">หาดทรายขาว</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-[#FFC928]">100%</div>
                    <div className="text-[10px] text-white/70 font-bold">อากาศบริสุทธิ์</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#FAF9FC] border border-[#EEE4FA]">
                  <span className="text-[#6F6878] font-bold">จุดปล่อยตัว & เส้นชัย:</span>
                  <span className="font-black text-[#17151C] text-right">หาดหน้า รร. Sea Sand Sun</span>
                </div>
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#FAF9FC] border border-[#EEE4FA]">
                  <span className="text-[#6F6878] font-bold">จุดสังเกตหลัก:</span>
                  <span className="font-black text-[#17151C] text-right">ถ.เพชรเกษม กม. 219 ชะอำ</span>
                </div>
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#FAF9FC] border border-[#EEE4FA]">
                  <span className="text-[#6F6878] font-bold">ที่จอดรถส่วนกลาง:</span>
                  <span className="font-black text-[#2EAD62] text-right">ลานจอดรองรับ 800+ คัน</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 21: VENUE MAP — Interactive Event Village Map */}
        <VenueMap />
      </div>
    </section>
  );
};
