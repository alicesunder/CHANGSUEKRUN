import React, { useState, useMemo } from 'react';
import { faqData } from '../data/eventData';
import { ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': true,
  });

  const categories = [
    { id: 'all', label: 'คำถามทั้งหมด' },
    { id: 'general', label: 'ทั่วไป & กิจกรรม' },
    { id: 'pet', label: 'การพาน้องสุนัขวิ่ง' },
    { id: 'routes', label: 'เส้นทาง & Cut-off' },
    { id: 'transport', label: 'ที่จอดรถ & การเดินทาง' },
    { id: 'race_pack', label: 'ของที่ระลึก & รับบิบ' },
  ];

  const filteredFaqs = useMemo(() => {
    return faqData.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section
      id="faq"
      className="py-12 sm:py-16 bg-gradient-to-b from-[#FAF7FF] via-white to-[#EFE6FC] border-b border-purple-100 scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border-2 border-[#2A1450] text-[#5B20A8] text-xs font-extrabold uppercase tracking-wider shadow-[0_3px_0_#2A1450]">
            <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
            <span>ถามบ่อย</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2A1450] mt-3">
            คำถามที่พบบ่อย (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-[#6B5A85] font-semibold mt-1.5">
            รวบรวมข้อสงสัยเกี่ยวกับการแข่งขัน การพาน้องสุนัขร่วมวิ่ง ที่จอดรถ และของที่ระลึก
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#2A1450] shadow-[0_10px_24px_-12px_rgba(42,20,80,0.22),0_4px_0_#2A1450] mb-6 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5A85]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาคำถาม เช่น น้องสุนัข, ที่จอดรถ, เหรียญรางวัล, เสื้อ..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 border-purple-100 bg-[#FAF8FF] text-xs sm:text-sm font-semibold text-[#2A1450] focus:outline-none focus:border-[#5B20A8]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-[#2A1450] text-[#FFC928] border-[#2A1450] shadow-xs'
                    : 'bg-[#F4ECFF] text-[#4B2D78] border-purple-200 hover:bg-[#E6D6FC]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Questions */}
        <div className="space-y-3">
          {filteredFaqs.map((item) => {
            const isOpen = !!openItems[item.id];
            return (
              <div
                key={item.id}
                className={`rounded-2xl border-2 transition-all overflow-hidden ${
                  isOpen
                    ? 'border-[#2A1450] bg-white shadow-[0_10px_22px_-12px_rgba(42,20,80,0.25),0_4px_0_#2A1450]'
                    : 'border-purple-200 bg-white/90 hover:border-[#5B20A8]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7FF] transition-colors"
                >
                  <span className="text-sm sm:text-base font-extrabold text-[#2A1450]">
                    {item.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-[#FFC928] text-[#2A1450] border-[#2A1450]'
                        : 'bg-[#F4ECFF] text-[#5B20A8] border-purple-200'
                    }`}
                  >
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 pt-2 text-xs sm:text-sm text-[#4B2D78] font-medium leading-relaxed border-t border-dashed border-purple-200 bg-[#FAF8FF]">
                    {item.answer}
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
