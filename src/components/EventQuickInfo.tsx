import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Footprints, Clock, Hotel, ChevronDown, ChevronUp, Sun, Droplets, Wind, BellRing } from 'lucide-react';

export const EventQuickInfo: React.FC = () => {
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 428,
    hours: 5,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCalendar = () => {
    const title = encodeURIComponent('CHANG SUEK RUN 2027 (เห็นช้างวิ่ง วิ่งตามช้าง)');
    const details = encodeURIComponent('งานวิ่งเพื่อสุขภาพและครอบครัว ค่ายนเรศวร ชะอำ-หัวหิน ระยะ 10KM, 5KM และวิ่งคู่น้องสุนัข 3.8KM, 1KM');
    const location = encodeURIComponent('ค่ายนเรศวร กองบัญชาการตำรวจตระเวนชายแดน ชะอำ เพชรบุรี');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <section className="relative z-20 -mt-6 sm:-mt-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Floating 5-Item Quick Info Bar (Strictly matching screenshot) */}
      <div className="bg-white rounded-3xl shadow-xl shadow-purple-950/5 border border-purple-100/80 p-4 sm:p-5 transition-all">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          {/* 1. วันจัดงาน (Green Circle) */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3 first:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-[#DFF5E8] flex items-center justify-center text-[#2EAD62] flex-shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500">วันจัดงาน</div>
              <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                15 มีนาคม 2567
              </div>
            </div>
          </div>

          {/* 2. สถานที่จัดงาน (Purple Circle) */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEE4FA] flex items-center justify-center text-[#7B3FC6] flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500">สถานที่จัดงาน</div>
              <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                ค่ายนเรศวร ตชด.
              </div>
              <div className="text-[10px] text-gray-400 font-medium">ชะอำ - หัวหิน</div>
            </div>
          </div>

          {/* 3. ระยะวิ่ง (Sky Blue Circle) */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-[#169BD5] flex-shrink-0">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500">ระยะวิ่ง</div>
              <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight whitespace-nowrap">
                10 / 5 KM + Dog 3 / 1 KM
              </div>
              <div className="text-[10px] text-gray-400 font-medium">เหมาะสำหรับทุกคน</div>
            </div>
          </div>

          {/* 4. เวลาเริ่มวิ่ง (Yellow Circle) */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-[#B45309] flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500">เวลาเริ่มวิ่ง</div>
              <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                06:00 น.
              </div>
              <div className="text-[10px] text-gray-400 font-medium">(ตามระยะ)</div>
            </div>
          </div>

          {/* 5. ที่พักใกล้งาน (Rose Red Circle) */}
          <a
            href="#hotels"
            className="flex items-center gap-3 pt-2 md:pt-0 md:px-3 col-span-2 md:col-span-1 group cursor-pointer hover:bg-rose-50/40 p-1.5 rounded-2xl transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 group-hover:scale-105 transition-transform flex items-center justify-center text-rose-600 flex-shrink-0">
              <Hotel className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500">ที่พักใกล้งาน</div>
              <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight group-hover:text-rose-600 transition-colors">
                แนะนำโรงแรม
              </div>
              <div className="text-[10px] text-rose-500 font-bold">ภายใน 10 กม. ➔</div>
            </div>
          </a>

        </div>

        {/* Expandable Sub-bar: Countdown timer, weather radar, add to calendar */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setShowExtraDetails(!showExtraDetails)}
            className="text-xs font-bold text-[#7B3FC6] hover:text-[#54239A] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{showExtraDetails ? 'ซ่อนการนับถอยหลัง & สภาพอากาศ' : 'ดูเวลานับถอยหลัง & สภาพอากาศชะอำ-หัวหิน'}</span>
            {showExtraDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={handleAddToCalendar}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition-all cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5 text-[#FFC928]" />
            <span>เพิ่มลงปฏิทิน (Google Calendar)</span>
          </button>
        </div>

        {/* Collapsible Details Drawer */}
        {showExtraDetails && (
          <div className="mt-4 p-4 rounded-2xl bg-[#FAF9FC] border border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
            {/* Countdown */}
            <div className="flex flex-col items-center sm:items-start justify-center">
              <span className="text-xs font-bold text-gray-500 mb-1">
                ⏳ นับถอยหลังสู่วันแข่งขัน CHANG SUEK RUN:
              </span>
              <div className="flex items-center gap-2">
                <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-gray-200 text-center min-w-[50px]">
                  <div className="text-base sm:text-lg font-black text-[#7B3FC6]">{timeLeft.days}</div>
                  <div className="text-[9px] text-gray-400 font-bold">วัน</div>
                </div>
                <span className="font-black text-gray-400">:</span>
                <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-gray-200 text-center min-w-[50px]">
                  <div className="text-base sm:text-lg font-black text-gray-800">{timeLeft.hours}</div>
                  <div className="text-[9px] text-gray-400 font-bold">ชั่วโมง</div>
                </div>
                <span className="font-black text-gray-400">:</span>
                <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-gray-200 text-center min-w-[50px]">
                  <div className="text-base sm:text-lg font-black text-gray-800">{timeLeft.minutes}</div>
                  <div className="text-[9px] text-gray-400 font-bold">นาที</div>
                </div>
                <span className="font-black text-gray-400">:</span>
                <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-gray-200 text-center min-w-[50px]">
                  <div className="text-base sm:text-lg font-black text-[#2EAD62]">{timeLeft.seconds}</div>
                  <div className="text-[9px] text-gray-400 font-bold">วินาที</div>
                </div>
              </div>
            </div>

            {/* Coastal Weather */}
            <div className="flex items-center justify-around bg-white p-3 rounded-xl border border-gray-100 shadow-xs text-xs">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="font-bold text-gray-800">อุณหภูมิ 24°C - 27°C</div>
                  <div className="text-[10px] text-gray-500">อากาศเช้าเย็นสบาย</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-sky-500" />
                <div>
                  <div className="font-bold text-gray-800">ลมทะเล 12 กม./ชม.</div>
                  <div className="text-[10px] text-gray-500">โปร่ง โล่ง สดชื่น</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
