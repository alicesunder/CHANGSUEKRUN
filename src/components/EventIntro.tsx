import React, { useState, useRef } from 'react';
import { ChevronRight, Heart, Users, Sparkles, CheckCircle2, X } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';

interface EventIntroProps {
  onOpenVideoModal?: () => void;
}

export const EventIntro: React.FC<EventIntroProps> = ({ onOpenVideoModal }) => {
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: bannerRef,
    offset: ['start end', 'end start'],
  });

  // Parallax translation for the panoramic image within its masked container
  const bannerY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const bannerScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1.04, 1.08]);

  return (
    <section id="inspiration" className="py-12 sm:py-16 bg-[#FFFFFF] border-b border-purple-50 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 2-Column Section matching mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* LEFT COLUMN: Typography & Story */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            
            {/* Main Headline: แรงบันดาลใจจากช้าง สู่เส้นทางที่ยิ่งใหญ่กว่า */}
            <h2 className="text-2xl sm:text-4xl font-black text-[#261042] tracking-tight leading-tight mb-4">
              แรงบันดาลใจจากช้าง<br />
              <span className="text-[#6C2EB9]">สู่เส้นทางที่ยิ่งใหญ่กว่า</span>
            </h2>

            {/* Paragraph body matching mockup */}
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-normal mb-6 text-justify">
              ร้อยก้าวแรกจากช้างศึก สู่การรวมพลังครั้งประวัติศาสตร์ของชุมชนและนักวิ่งทุกสายเลือด ณ ค่ายพระราม 6 ชายหาดชะอำ-เพชรบุรี ที่เชื่อมโยงมนุษย์ ธรรมชาติ และมรดกประวัติศาสตร์ไทย เราไม่ได้เพียงแค่วิ่งออกกำลังกาย แต่เรากำลังก้าวเพื่อสร้างความตระหนักรู้ ส่งต่อพลังใจ และส่งเสริมสุขภาพที่ดีร่วมกัน ทั้งคน ช้าง และสัตว์เลี้ยงคู่ใจ
            </p>

            {/* Purple Pill Button: อ่านเรื่องราวของเรา > */}
            <button
              onClick={() => setStoryModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#4A1584] hover:bg-[#5C1A9F] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>อ่านเรื่องราวของเรา</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* RIGHT COLUMN: Panoramic Visual Banner matching mockup */}
          <div className="lg:col-span-7">
            <div
              ref={bannerRef}
              className="relative rounded-3xl overflow-hidden shadow-xl border border-purple-100 bg-[#251240] aspect-[16/9] sm:aspect-[16/8] group"
            >
              
              {/* Elephant + Runner + Dog coastal sunset photograph with parallax scrolling */}
              <motion.img
                src="/images/hero/changsuek-run-coastal.jpg"
                alt="ช้าง คนวิ่ง และสุนัข วิ่งไปด้วยกันริมชายหาดยามพระอาทิตย์ตก"
                style={{
                  y: bannerY,
                  scale: bannerScale,
                }}
                className="w-full h-full object-cover select-none transition-transform duration-300"
              />

              {/* Gradient lighting overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#200E37]/80 via-[#200E37]/20 to-transparent pointer-events-none" />

              {/* Right side banner text: "คน ช้าง สุนัข ก้าวไปด้วยกัน" + 3 badges */}
              <div className="absolute inset-0 flex items-center justify-end p-4 sm:p-8">
                <div className="w-[55%] sm:w-[45%] flex flex-col items-end text-right select-none pl-2">
                  <div className="text-white text-base sm:text-2xl font-black tracking-tight drop-shadow-md mb-2 sm:mb-4">
                    คน ช้าง สุนัข<br />
                    <span className="text-[#FFC928]">ก้าวไปด้วยกัน</span>
                  </div>

                  {/* 3 Circular Badges matching mockup */}
                  <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
                    
                    {/* Badge 1: Healthier People */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981] shadow-md">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-black text-white/90 uppercase tracking-tighter mt-1 text-center">
                        HEALTHIER<br />PEOPLE
                      </span>
                    </div>

                    {/* Badge 2: Happier Pets */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#FFC928]/20 border border-[#FFC928] flex items-center justify-center text-[#FFC928] shadow-md">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-black text-white/90 uppercase tracking-tighter mt-1 text-center">
                        HAPPIER<br />PETS
                      </span>
                    </div>

                    {/* Badge 3: Stronger Communities */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#A855F7]/20 border border-[#A855F7] flex items-center justify-center text-[#C084FC] shadow-md">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-black text-white/90 uppercase tracking-tighter mt-1 text-center">
                        STRONGER<br />COMMUNITIES
                      </span>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Story Modal */}
      {storyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setStoryModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl sm:text-2xl font-black text-[#261042] mb-3">
              เรื่องราวของ CHANGSUEK RUN 2026
            </h3>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              งานวิ่ง “CHANGSUEK RUN: เห็นช้างวิ่ง วิ่งตามช้าง” เกิดขึ้นจากความร่วมมือระหว่างกองบัญชาการตำรวจตระเวนชายแดน ค่ายพระราม 6 เพชรบุรี และเครือข่ายอนุรักษ์ธรรมชาติ เพื่อส่งเสริมสุขภาพของประชาชน พร้อมเปิดพื้นที่ประวัติศาสตร์ริมหาดเจ้าสำราญและชะอำ ให้ทุกคนในครอบครัวและสัตว์เลี้ยงได้สัมผัสความงามของธรรมชาติ
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>รายได้ส่วนหนึ่งสนับสนุนการดูแลช้างและสัตว์ป่าในพื้นที่อนุรักษ์</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>เส้นทางวิ่งปลอดภัย 100% ปิดการจราจรโดยเจ้าหน้าที่ตำรวจตระเวนชายแดน</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>สัตวแพทย์อาสาและจุดให้น้ำสัตว์เลี้ยงมาตรฐานสากลตลอดเส้นทาง</span>
              </div>
            </div>

            <button
              onClick={() => setStoryModalOpen(false)}
              className="w-full bg-[#4A1584] hover:bg-[#5C1A9F] text-white font-bold py-3 rounded-full shadow-md text-sm cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
