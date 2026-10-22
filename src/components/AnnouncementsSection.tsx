import React from 'react';
import { announcementsData } from '../data/eventData';
import { Bell, Calendar, Tag, ChevronRight, Sparkles } from 'lucide-react';

export const AnnouncementsSection: React.FC = () => {
  return (
    <section id="announcements" className="py-16 bg-[#FAF9FC] border-b border-[#ECEAF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-[#6F35B5] uppercase bg-[#F3EDF9] px-3 py-1 rounded-full">
                News & Bulletin
              </span>
              <span className="text-xs font-bold text-[#2EAA59] bg-[#E8F7ED] px-2.5 py-0.5 rounded-full">
                อัปเดตล่าสุด
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#18151D] mt-2">
              ข่าวสารและประกาศสำคัญ
            </h2>
          </div>
          <span className="text-xs text-[#6F6A76]">
            ติดตามข่าวสารอัปเดตต่อเนื่องก่อนถึงวันจัดงาน
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {announcementsData.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-[#ECEAF0] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6F35B5] bg-[#F3EDF9] px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-[#6F6A76]">
                    <Calendar className="w-3 h-3 text-[#8C4DDB]" />
                    <span>{item.date}</span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-[#18151D] mb-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-[#6F6A76] leading-relaxed">
                  {item.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#ECEAF0] flex items-center justify-between text-xs font-bold text-[#6F35B5]">
                <span>ประกาศทางการ</span>
                <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
