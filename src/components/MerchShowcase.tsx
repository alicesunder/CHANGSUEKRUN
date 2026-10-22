import React, { useState } from 'react';
import {
  Sparkles,
  Shirt,
  Award,
  Check,
  ZoomIn,
  CreditCard,
  Gift,
  ShieldCheck,
} from 'lucide-react';

interface MerchShowcaseProps {
  onOpenRegister?: () => void;
  className?: string;
}

export const MerchShowcase: React.FC<MerchShowcaseProps> = ({
  onOpenRegister,
  className = '',
}) => {
  const [activeItem, setActiveItem] = useState<'shirt' | 'medal'>('shirt');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const sizes = [
    { size: '2S', chest: '34"' },
    { size: 'S', chest: '36"' },
    { size: 'M', chest: '38"' },
    { size: 'L', chest: '40"' },
    { size: 'XL', chest: '42"' },
    { size: '2XL', chest: '44"' },
    { size: '3XL', chest: '46"' },
  ];

  const racePackPerks = [
    {
      icon: Shirt,
      title: 'เสื้อวิ่ง Micro-Dry',
      desc: 'พิมพ์ลาย Sublimation ระบายอากาศ 360°',
      tag: 'ได้รับทุกคน',
      accent: '#5B20A8',
      bg: '#F3E8FF',
    },
    {
      icon: Award,
      title: 'เหรียญรางวัล Finisher 3D',
      desc: 'โลหะผสม Zinc Alloy พร้อมสายคล้องทอพิเศษ',
      tag: 'เมื่อเข้าเส้นชัย',
      accent: '#B45309',
      bg: '#FEF3C7',
    },
    {
      icon: CreditCard,
      title: 'ป้ายหมายเลข BIB + RFID',
      desc: 'พิมพ์ชื่อเฉพาะบุคคล พร้อมชิปจับเวลามาตรฐาน',
      tag: 'Official Timing',
      accent: '#0369A1',
      bg: '#E0F2FE',
    },
    {
      icon: Gift,
      title: 'กระเป๋าผ้า & ประกันอุบัติเหตุ',
      desc: 'พร้อมอาหารว่าง เครื่องดื่ม และขนมสำหรับน้องหมา',
      tag: 'คุ้มครองตลอดงาน',
      accent: '#15803D',
      bg: '#DCFCE7',
    },
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Unified Single Race Pack & Souvenir Showcase Card */}
      <div className="bg-white rounded-[32px] border-[3px] border-[#2A1450] shadow-[0_20px_44px_-16px_rgba(42,20,80,0.28),0_7px_0_#2A1450] overflow-hidden">
        {/* Top Gold & Purple Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#5B20A8] via-[#FFC928] to-[#DB2777]" />

        <div className="p-6 sm:p-8 lg:p-9">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFC928]/25 border border-[#D97706]/40 text-[#2A1450] text-xs font-extrabold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                <span>รวมอยู่ในค่าสมัคร</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2A1450] tracking-tight">
                เสื้อวิ่ง เหรียญรางวัล & สิทธิประโยชน์ที่ได้รับ
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5A85] font-semibold mt-1">
                รวมอยู่ในค่าสมัครทุกระยะการวิ่ง ออกแบบพิเศษสำหรับนักวิ่ง CHANGSUEK RUN 2027
              </p>
            </div>

            {/* Selector Tab for Quick highlight */}
            <div className="flex items-center gap-1.5 p-1 bg-[#FAF7FF] rounded-2xl border-2 border-[#2A1450]/15 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveItem('shirt')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeItem === 'shirt'
                    ? 'bg-[#2A1450] text-[#FFC928] shadow-xs'
                    : 'text-[#4B2D78] hover:text-[#2A1450]'
                }`}
              >
                <Shirt className="w-4 h-4" />
                <span>เสื้อวิ่ง Micro-Dry</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveItem('medal')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeItem === 'medal'
                    ? 'bg-[#2A1450] text-[#FFC928] shadow-xs'
                    : 'text-[#4B2D78] hover:text-[#2A1450]'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>เหรียญรางวัล 3D</span>
              </button>
            </div>
          </div>

          {/* 4 Compact Included Race Pack Perks Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
            {racePackPerks.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  className="rounded-2xl p-3.5 bg-[#FAF8FF] border border-purple-100 flex items-start gap-3"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white shadow-xs"
                    style={{ background: perk.bg, color: perk.accent }}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1"
                      style={{ background: perk.bg, color: perk.accent }}
                    >
                      {perk.tag}
                    </span>
                    <div className="text-xs sm:text-sm font-extrabold text-[#2A1450] leading-snug">
                      {perk.title}
                    </div>
                    <div className="text-[11px] text-[#6B5A85] font-medium mt-0.5 leading-snug">
                      {perk.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Large 2-Column Visual Showcase (Shirt + Medal) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* 1. SHIRT CARD */}
            <div
              className={`rounded-3xl border-2 p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between ${
                activeItem === 'shirt'
                  ? 'border-[#2A1450] bg-gradient-to-b from-[#FAF6FF] to-white shadow-[0_8px_0_#2A1450]'
                  : 'border-purple-100 bg-white hover:border-purple-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#2A1450] text-[#FFC928] flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5" />
                    <span>เสื้อวิ่งที่ระลึก (Official Jersey)</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#5B20A8] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    ได้รับทุกคน ทุกระยะ
                  </span>
                </div>

                <div
                  onClick={() => setZoomedImage('/images/merch/jersey-full.jpg')}
                  className="relative group rounded-2xl overflow-hidden border-2 border-purple-100 bg-purple-50/50 mb-4 cursor-pointer aspect-4/3 flex items-center justify-center"
                >
                  <img loading="lazy" decoding="async"
                    src="/images/merch/jersey-full.jpg"
                    alt="เสื้อวิ่ง CHANGSUEK RUN 2027 Micro-Dry Sublimation"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-bold flex items-center gap-1.5">
                      <ZoomIn className="w-4 h-4 text-[#FFD633]" />
                      คลิกเพื่อดูภาพขยาย
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/95 text-[#2A1450] text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
                    ลายพิมพ์ Full Sublimation
                  </div>
                </div>

                <h4 className="text-lg font-extrabold text-[#2A1450]">
                  เสื้อวิ่งผ้าไมโครโพลีเอสเตอร์ Micro-Dry
                </h4>
                <p className="text-xs sm:text-sm text-[#6B5A85] font-medium mt-1 leading-relaxed">
                  เนื้อผ้านุ่มลื่น สัมผัสเบาสบาย ระบายอากาศดีเยี่ยม แห้งเร็ว ไม่อมเหงื่อ เหมาะกับอากาศริมชายหาดชะอำ
                </p>

                {/* Size guide badges */}
                <div className="mt-4 pt-3 border-t border-purple-100">
                  <div className="text-[11px] font-extrabold text-[#2A1450] mb-1.5">
                    ตารางขนาดรอบอก (นิ้ว):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((s) => (
                      <span
                        key={s.size}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF7FF] border border-purple-200 text-[11px] font-mono font-extrabold text-[#2A1450]"
                      >
                        {s.size}: <span className="text-[#6D28D9]">{s.chest}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {onOpenRegister && (
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="mt-5 w-full py-2.5 rounded-xl bg-[#2A1450] hover:bg-[#3F1D74] text-[#FFC928] text-xs sm:text-sm font-extrabold tracking-wide transition-all cursor-pointer"
                >
                  เลือกไซส์เสื้อตอนสมัครวิ่ง →
                </button>
              )}
            </div>

            {/* 2. MEDAL CARD */}
            <div
              className={`rounded-3xl border-2 p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between ${
                activeItem === 'medal'
                  ? 'border-[#2A1450] bg-gradient-to-b from-[#FFFDF5] to-white shadow-[0_8px_0_#2A1450]'
                  : 'border-amber-200 bg-white hover:border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] text-white flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#FFF9EA]" />
                    <span>เหรียญรางวัล Finisher (Official Medal)</span>
                  </span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    เมื่อเข้าเส้นชัย
                  </span>
                </div>

                <div
                  onClick={() => setZoomedImage('/images/merch/medal-full.jpg')}
                  className="relative group rounded-2xl overflow-hidden border-2 border-amber-100 bg-amber-50/40 mb-4 cursor-pointer aspect-4/3 flex items-center justify-center"
                >
                  <img loading="lazy" decoding="async"
                    src="/images/merch/medal-full.jpg"
                    alt="เหรียญรางวัล Finisher CHANGSUEK RUN 2027 Zinc Alloy 3D"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-bold flex items-center gap-1.5">
                      <ZoomIn className="w-4 h-4 text-[#FFD633]" />
                      คลิกเพื่อดูภาพขยาย
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-[#B45309] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
                    หล่อนูน 3 มิติ Zinc Alloy
                  </div>
                </div>

                <h4 className="text-lg font-extrabold text-[#2A1450]">
                  เหรียญ Finisher สลักลายช้างศึกคู่ธรรมชาติ
                </h4>
                <p className="text-xs sm:text-sm text-[#6B5A85] font-medium mt-1 leading-relaxed">
                  โลหะผสม Zinc Alloy ชุบผิวพรีเมียม ออกแบบลายช้างศึกเดินเคียงคู่สายลมหาดชะอำ พร้อมสายคล้องคอผ้าซาตินทอพิเศษแยกสีตามระยะ
                </p>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-bold text-[#2A1450]">
                  <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-200 p-2.5 rounded-xl">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>หล่อนูน 3 มิติ คมชัดสูง</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-200 p-2.5 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>สลักชื่อและระยะวิ่งเฉพาะรุ่น</span>
                  </div>
                </div>
              </div>

              {onOpenRegister && (
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FFD633] to-[#FFC928] hover:from-[#FFE066] hover:to-[#FFD633] text-[#2A1450] border-2 border-[#2A1450] text-xs sm:text-sm font-extrabold tracking-wide transition-all cursor-pointer"
                >
                  สมัครวิ่งเพื่อพิชิตเหรียญรางวัลนี้ →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full flex flex-col items-center">
            <img loading="lazy" decoding="async"
              src={zoomedImage}
              alt="ภาพขยายของรางวัล CHANGSUEK RUN"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border-2 border-white/20"
              referrerPolicy="no-referrer"
            />
            <div className="mt-3 text-white/80 text-xs font-bold bg-black/50 px-4 py-1.5 rounded-full">
              คลิกที่ใดก็ได้เพื่อปิด
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
