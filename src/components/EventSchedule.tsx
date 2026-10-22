import React, { useState } from 'react';
import { scheduleData } from '../data/eventData';
import { Clock, AlertCircle, Calendar, Sparkles, Flag, Music, Utensils, Award } from 'lucide-react';
import { ElephantCharacter } from './brand/BrandCharacters';

export const EventSchedule: React.FC = () => {
  const [activeDay, setActiveDay] = useState<'day_before' | 'race_day'>('race_day');

  const activeDayIndex = activeDay === 'day_before' ? 0 : 1;
  const currentDay = scheduleData[activeDayIndex];
  const items = currentDay ? currentDay.items : [];

  const getEventIcon = (title: string) => {
    if (title.includes('ปล่อยตัว')) return <Flag className="w-4 h-4 text-[#EF5350]" />;
    if (title.includes('อาหาร') || title.includes('เสิร์ฟ')) return <Utensils className="w-4 h-4 text-[#FFC928]" />;
    if (title.includes('รางวัล') || title.includes('เหรียญ')) return <Award className="w-4 h-4 text-[#F5B800]" />;
    if (title.includes('ดนตรี') || title.includes('การแสดง')) return <Music className="w-4 h-4 text-[#7B3FC6]" />;
    return <Clock className="w-4 h-4 text-[#7B3FC6]" />;
  };

  return (
    <section id="schedule" className="py-16 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEE4FA] text-[#7B3FC6] text-xs font-black uppercase tracking-wider mb-3">
            <Calendar className="w-3.5 h-3.5 text-[#FFC928]" />
            <span>กำหนดการแข่งขัน (RACE SCHEDULE)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#17151C] mb-3">
            ตารางเวลาและกิจกรรมตลอดงาน
          </h2>
          <p className="text-sm sm:text-base text-[#6F6878] font-semibold">
            {currentDay ? `${currentDay.title} — ${currentDay.description}` : 'กำหนดการรับเบอร์วิ่ง วอร์มอัพ ปล่อยตัว และฉลองชัยริมหาด'}
          </p>

          {/* Day Toggle Tabs */}
          <div className="inline-flex p-1.5 bg-[#FAF9FC] border-2 border-[#EEE4FA] rounded-2xl mt-6 shadow-xs">
            <button
              onClick={() => setActiveDay('day_before')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeDay === 'day_before'
                  ? 'bg-[#7B3FC6] text-white shadow-md'
                  : 'text-[#6F6878] hover:text-[#17151C]'
              }`}
            >
              วันก่อนแข่งขัน (รับเบอร์วิ่ง & เสื้อ)
            </button>
            <button
              onClick={() => setActiveDay('race_day')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeDay === 'race_day'
                  ? 'bg-[#7B3FC6] text-white shadow-md'
                  : 'text-[#6F6878] hover:text-[#17151C]'
              }`}
            >
              วันแข่งขันจริง (RACE DAY)
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="relative border-l-2 border-[#EEE4FA] ml-4 sm:ml-32 pl-6 sm:pl-10 space-y-6">
          {items.map((item, idx) => {
            return (
              <div key={idx} className="relative group">
                {/* Time Indicator on Left (Desktop) */}
                <div className="sm:absolute sm:-left-36 sm:top-2 text-xs sm:text-sm font-black text-[#7B3FC6] flex items-center gap-1.5 mb-1 sm:mb-0">
                  <div className="p-1 rounded-md bg-[#EEE4FA]">
                    {getEventIcon(item.title)}
                  </div>
                  <span>{item.time}</span>
                </div>

                {/* Timeline Bullet Node */}
                <div
                  className={`absolute -left-[31px] sm:-left-[47px] top-2.5 w-4 h-4 rounded-full border-4 border-white transition-all ${
                    item.highlight ? 'bg-[#FFC928] ring-4 ring-[#FFC928]/30 scale-125' : 'bg-[#7B3FC6]'
                  }`}
                />

                {/* Content Card */}
                <div
                  className={`p-5 rounded-3xl border-2 transition-all ${
                    item.highlight
                      ? 'bg-gradient-to-r from-[#FFFBEA] to-white border-[#FFC928] shadow-md'
                      : 'bg-[#FAF9FC] border-[#EEE4FA] hover:border-[#7B3FC6]/40 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-base font-black text-[#17151C]">
                      {item.title}
                    </h4>
                    {item.highlight && (
                      <span className="bg-[#FFC928] text-[#17151C] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                        ไฮไลต์สำคัญ
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#6F6878] leading-relaxed font-semibold">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Schedule Footnote with Elephant Mascot */}
        <div className="mt-10 p-5 rounded-3xl bg-[#EEE4FA]/60 border-2 border-[#EEE4FA] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[#54239A] font-bold">
            <AlertCircle className="w-5 h-5 text-[#7B3FC6] flex-shrink-0" />
            <span>
              <strong>คำแนะนำ:</strong> เผื่อเวลาเดินทางมาถึงบริเวณงานก่อนเวลาปล่อยตัวอย่างน้อย 45-60 นาที เพื่ออบอุ่นร่างกายและเตรียมตัว
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-[#7B3FC6]">ตื่นเช้ามาวิ่งด้วยกันนะ!</span>
            <ElephantCharacter size={40} mood="running" isAnimated={true} />
          </div>
        </div>
      </div>
    </section>
  );
};
