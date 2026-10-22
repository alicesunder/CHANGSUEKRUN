import React, { useState } from 'react';
import { Camera, X, Sparkles, Filter, Heart, Eye } from 'lucide-react';

interface GalleryItem {
  id: string;
  category: 'beach' | 'trail' | 'dogs' | 'family' | 'vibe';
  title: string;
  location: string;
  description: string;
  accent: string;
  tag: string;
  gradient: string;
}

export const EventGallery: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'beach' | 'trail' | 'dogs' | 'family' | 'vibe'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  const galleryItems: GalleryItem[] = [
    {
      id: 'g1',
      category: 'beach',
      title: 'แสงอาทิตย์ยามเย็นริมหาดค่ายนเรศวร',
      location: 'หาดทรายหน้าโรงแรม Sea Sand Sun',
      description: 'ทัศนียภาพพระอาทิตย์ขึ้นเหนือผืนน้ำอ่าวไทย ขณะขบวนนักวิ่งเริ่มออกตัวรับลมทะเลสดชื่น',
      accent: '#FFC928',
      tag: 'Sunrise Beach',
      gradient: 'from-amber-400 via-rose-300 to-sky-400',
    },
    {
      id: 'g2',
      category: 'dogs',
      title: 'สุนัขทหารสงคราม & น้องหมานักวิ่ง',
      location: 'จุดปล่อยตัวค่ายนเรศวร',
      description: 'มิตรภาพของเพื่อนสี่ขาที่มาร่วมวิ่งเคียงข้างเจ้าของ พร้อมสายจูงและผ้าพันคอหมายเลขบิบสุดเท่',
      accent: '#2EAD62',
      tag: 'War Dog & Pets',
      gradient: 'from-emerald-400 via-teal-300 to-amber-200',
    },
    {
      id: 'g3',
      category: 'trail',
      title: 'อุโมงค์ทิวสน & สวนป่าชายเลน',
      location: 'เส้นทาง 10 KM ป่าชายเลนทูลกระหม่อม',
      description: 'สะพานไม้ยกระดับพาดผ่านป่าชายเลนอันสมบูรณ์ ร่มรื่นด้วยไอหมอกและเสียงนกนานาชนิด',
      accent: '#7B3FC6',
      tag: 'Mangrove Trail',
      gradient: 'from-purple-500 via-indigo-400 to-emerald-400',
    },
    {
      id: 'g4',
      category: 'family',
      title: 'รอยยิ้มครอบครัวและเด็กๆ',
      location: 'เส้นทาง 3 KM Dog Run',
      description: 'คุณพ่อคุณแม่จูงมือลูกๆ วิ่งและเดินเก็บสะสมความทรงจำอันแสนอบอุ่นในเช้าวันหยุด',
      accent: '#EF5350',
      tag: 'Family Fun',
      gradient: 'from-rose-400 via-orange-300 to-yellow-200',
    },
    {
      id: 'g5',
      category: 'vibe',
      title: 'ซุ้มฉลองชัย & เหรียญที่ระลึกช้างศึก',
      location: 'Event Village ริมหาด',
      description: 'ช่วงเวลาแห่งความภาคภูมิใจเมื่อก้าวข้ามเส้นชัย รับเหรียญรางวัลลงยาเคลือบทองสุดประณีต',
      accent: '#F5B800',
      tag: 'Finishers',
      gradient: 'from-amber-500 via-yellow-400 to-purple-600',
    },
    {
      id: 'g6',
      category: 'beach',
      title: 'ลานอาหารและกาแฟโบราณเพชรบุรี',
      location: 'โซนอาหาร Food Village',
      description: 'ชิมขนมหม้อแกงเมืองเพชร ข้าวต้มปลาอินทรีสดๆ และน้ำตาลสดแท้จากสวนตาลโตนด',
      accent: '#45B9EA',
      tag: 'Local Gastronomy',
      gradient: 'from-sky-400 via-cyan-300 to-blue-500',
    },
  ];

  const filteredItems = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <section id="gallery" className="py-16 bg-[#FAF9FC] border-b border-[#EEE4FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEE4FA] text-xs font-black text-[#7B3FC6] uppercase tracking-wider mb-3">
            <Camera className="w-3.5 h-3.5 text-[#FFC928]" />
            <span>ATMOSPHERE & PREVIEW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#17151C] tracking-tight mb-3">
            ภาพบรรยากาศและความประทับใจ
          </h2>
          <p className="text-sm sm:text-base text-[#6F6878] font-semibold">
            สัมผัสเสน่ห์อันน่าหลงใหลของหาดทรายขาว ทิวสนเขียวขจี รอยยิ้มนักวิ่ง และเพื่อนสี่ขาคู่ใจ
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {[
              { id: 'all', label: 'ทั้งหมด (All)' },
              { id: 'beach', label: '🌊 ชายหาด & ทะเล' },
              { id: 'trail', label: '🌲 ป่าสน & เทรล' },
              { id: 'dogs', label: '🐕 น้องหมา & ช้างศึก' },
              { id: 'family', label: '👨‍👩‍👧‍👦 ครอบครัว' },
              { id: 'vibe', label: '🎉 ฉลองชัย & อาหาร' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#7B3FC6] text-white shadow-md'
                    : 'bg-white text-[#6F6878] hover:text-[#17151C] border border-[#EEE4FA]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="group relative rounded-3xl overflow-hidden bg-white border-2 border-[#EEE4FA] shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              {/* Image / Gradient Artistic Container */}
              <div className={`relative h-56 w-full bg-gradient-to-br ${item.gradient} p-6 flex flex-col justify-between overflow-hidden`}>
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-xs uppercase tracking-wider">
                    {item.tag}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>

                {/* Decorative Overlay */}
                <div className="relative z-10 text-white">
                  <span className="text-[11px] font-bold text-white/90">📍 {item.location}</span>
                  <h4 className="text-xl font-black drop-shadow-md mt-0.5 leading-snug">
                    {item.title}
                  </h4>
                </div>
              </div>

              {/* Card Bottom Meta */}
              <div className="p-5 bg-white">
                <p className="text-xs text-[#6F6878] font-medium line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-[11px] font-bold text-[#7B3FC6]">
                  <span>คลิกเพื่อดูรายละเอียด</span>
                  <span>➔</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20">
              <div className={`h-64 bg-gradient-to-br ${selectedPhoto.gradient} p-6 flex flex-col justify-between text-white relative`}>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-xs font-black uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full w-fit">
                  {selectedPhoto.tag}
                </span>
                <div>
                  <span className="text-xs font-bold text-white/80">📍 {selectedPhoto.location}</span>
                  <h3 className="text-2xl font-black mt-1 leading-tight">{selectedPhoto.title}</h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-[#6F6878] leading-relaxed font-semibold">
                  {selectedPhoto.description}
                </p>
                <div className="p-3.5 rounded-2xl bg-[#FAF9FC] border border-[#EEE4FA] text-xs text-[#54239A] font-bold">
                  🌟 ร่วมเป็นส่วนหนึ่งของภาพความทรงจำนี้ใน CHANG SUEK RUN 2027 ค่ายนเรศวร ชะอำ-หัวหิน
                </div>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="w-full py-3 rounded-2xl bg-[#7B3FC6] text-white text-xs font-black shadow hover:bg-[#54239A] transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
