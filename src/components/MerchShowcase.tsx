import React, { useEffect, useState } from 'react';
import { ArrowRight, PawPrint, Sparkles, X, ZoomIn } from 'lucide-react';

interface MerchShowcaseProps {
  onOpenRegister?: () => void;
  className?: string;
}

interface KitItem {
  id: string;
  name: string;
  desc: string;
  image: string;
  /** who receives it — CONFIRM with the organiser before launch */
  group: 'all' | 'dog';
  /** extra badge on the photo */
  star?: boolean;
}

// Photos are the organiser's product mock-ups; real items may differ slightly.
const KIT: KitItem[] = [
  {
    id: 'jersey',
    name: 'เสื้อวิ่ง Micro-Dry',
    desc: 'ผ้า Micro-Dry พิมพ์ลายช้างศึกทั้งตัว ใส่สบาย แห้งเร็ว',
    image: '/images/merch/jersey-full.jpg',
    group: 'all',
  },
  {
    id: 'medal',
    name: 'เหรียญ Finisher',
    desc: 'เหรียญลายช้างศึก ลงสีม่วง-เหลือง ชุบสีทอง พร้อมสายคล้องคอพิมพ์ลาย Chang suek',
    image: '/images/merch/medal-full.jpg',
    group: 'all',
    star: true,
  },
  {
    id: 'bag',
    name: 'กระเป๋าหูรูด',
    desc: 'กระเป๋าสีม่วงพิมพ์โลโก้งาน เชือกสะพายถัก มีช่องซิปด้านในสำหรับโทรศัพท์',
    image: '/images/merch/kit-bag.webp',
    group: 'all',
  },
  {
    id: 'bandana',
    name: 'ผ้าพันคอน้องสุนัข',
    desc: 'ผ้าพันคอลายช้างศึกสีม่วง-ทอง ผูกง่าย ใส่ถ่ายรูปคู่เจ้าของ',
    image: '/images/merch/kit-bandana.webp',
    group: 'dog',
  },
  {
    id: 'waste',
    name: 'ตลับใส่ถุงเก็บมูล',
    desc: 'ตลับสีม่วงพร้อมห่วงคล้อง พกติดสายจูงหรือกระเป๋าได้',
    image: '/images/merch/kit-waste-bag.webp',
    group: 'dog',
  },
  {
    id: 'bowl',
    name: 'ชามพับเก็บได้',
    desc: 'ชามซิลิโคนขอบเหลือง พับแบน พร้อมตะขอคล้อง ให้น้ำน้องสุนัขระหว่างทาง',
    image: '/images/merch/kit-bowl.webp',
    group: 'dog',
  },
];

const SIZES = [
  { size: '2S', chest: '34"' },
  { size: 'S', chest: '36"' },
  { size: 'M', chest: '38"' },
  { size: 'L', chest: '40"' },
  { size: 'XL', chest: '42"' },
  { size: '2XL', chest: '44"' },
  { size: '3XL', chest: '46"' },
];

export const MerchShowcase: React.FC<MerchShowcaseProps> = ({ onOpenRegister, className = '' }) => {
  const [zoom, setZoom] = useState<KitItem | null>(null);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  const renderCard = (item: KitItem, n: number) => (
    <li
      key={item.id}
      className="group flex flex-col rounded-3xl bg-white/[0.07] border-2 border-[#FFC928]/35 hover:border-[#FFC928] overflow-hidden transition-colors"
    >
      <button
        type="button"
        onClick={() => setZoom(item)}
        aria-label={`ดูภาพ${item.name}ขนาดใหญ่`}
        className="relative block aspect-[4/3] overflow-hidden bg-[#1B0B38] cursor-zoom-in"
      >
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 w-9 h-9 rounded-full bg-[#FFC928] text-[#2A1450] font-black text-sm flex items-center justify-center shadow-md">
          {String(n).padStart(2, '0')}
        </span>
        {item.star && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[#2A1450]/90 text-[#FFC928] text-xs font-bold px-2.5 py-1">
            <Sparkles className="w-3.5 h-3.5" /> ของที่ระลึกเส้นชัย
          </span>
        )}
        <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 text-[#2A1450] flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4" />
        </span>
      </button>
      <div className="p-4 sm:p-5">
        <h4 className="font-hero text-lg sm:text-xl font-semibold text-white leading-snug">{item.name}</h4>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-white/85">{item.desc}</p>
      </div>
    </li>
  );

  const allItems = KIT.filter((k) => k.group === 'all');
  const dogItems = KIT.filter((k) => k.group === 'dog');

  return (
    <section
      id="race-kit"
      aria-labelledby="race-kit-heading"
      className={`relative overflow-hidden rounded-[32px] border-[3px] border-[#2A1450] shadow-[0_10px_0_#2A1450] bg-gradient-to-br from-[#241047] via-[#341866] to-[#4A1F8F] text-white ${className}`}
    >
      {/* race-tape edge + soft gold glow */}
      <div
        aria-hidden="true"
        className="h-3 w-full"
        style={{ background: 'repeating-linear-gradient(135deg, #FFC928 0 14px, #2A1450 14px 28px)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#FFC928]/15 blur-3xl"
      />

      <div className="relative px-4 sm:px-8 lg:px-10 py-8 sm:py-11">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC928] text-[#2A1450] text-xs sm:text-sm font-bold px-3.5 py-1.5">
            <PawPrint className="w-4 h-4" /> ของที่คุณจะได้รับ
          </span>
          <h3 id="race-kit-heading" className="mt-3 font-hero text-3xl sm:text-4xl font-bold text-white">
            ของที่ระลึกสำหรับนักวิ่งช้างศึก
          </h3>
          <p className="mt-2 text-sm sm:text-base font-medium text-white/85">
            ออกแบบพิเศษเฉพาะงานนี้ ในธีมม่วง-ทองของช้างศึก
          </p>
        </div>

        {/* All runners */}
        <div className="mt-8 flex items-center gap-3">
          <h4 className="font-hero text-lg sm:text-xl font-semibold text-[#FFC928]">รวมในค่าสมัครทุกระยะ</h4>
          <span aria-hidden="true" className="h-px flex-1 bg-[#FFC928]/30" />
        </div>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {allItems.map((k, i) => renderCard(k, i + 1))}
        </ul>

        {/* Dog Run */}
        <div className="mt-9 flex items-center gap-3">
          <h4 className="font-hero text-lg sm:text-xl font-semibold text-[#FFC928]">
            สำหรับผู้สมัคร Dog Run (วิ่งกับน้องสุนัข)
          </h4>
          <span aria-hidden="true" className="h-px flex-1 bg-[#FFC928]/30" />
        </div>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {dogItems.map((k, i) => renderCard(k, allItems.length + i + 1))}
        </ul>

        {/* Size chart */}
        <div className="mt-9 rounded-3xl bg-white/[0.07] border border-white/20 p-4 sm:p-5">
          <h4 className="font-hero text-base sm:text-lg font-semibold text-white">ตารางไซซ์เสื้อ (รอบอก)</h4>
          <ul className="mt-3 grid grid-cols-4 sm:grid-cols-7 gap-2">
            {SIZES.map((s) => (
              <li key={s.size} className="rounded-xl bg-white text-[#2A1450] text-center py-2">
                <div className="font-black text-sm">{s.size}</div>
                <div className="text-xs font-semibold text-[#5B3A8C]">{s.chest}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onOpenRegister}
            className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-2xl bg-[#FFC928] hover:bg-[#FFD65A] text-[#2A1450] font-hero text-lg font-bold border-[3px] border-[#140826] shadow-[0_6px_0_#140826] active:translate-y-0.5 active:shadow-[0_4px_0_#140826] transition cursor-pointer"
          >
            สมัครวิ่งเพื่อรับของที่ระลึก <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs font-medium text-white/70 text-center">
            ภาพประกอบเป็นแบบร่างผลิตภัณฑ์ ของจริงอาจแตกต่างเล็กน้อย
          </p>
        </div>
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-[9500] bg-[#140826]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-8"
          onClick={() => setZoom(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={zoom.name}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl"
          >
            <button
              type="button"
              onClick={() => setZoom(null)}
              aria-label="ปิด"
              className="absolute -top-3 -right-1 sm:-right-3 w-11 h-11 rounded-full bg-[#FFC928] text-[#2A1450] flex items-center justify-center shadow-lg cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoom.image} alt={zoom.name} className="w-full max-h-[80vh] object-contain rounded-2xl bg-[#1B0B38]" />
            <p className="mt-2 text-center font-hero text-lg text-white">{zoom.name}</p>
          </div>
        </div>
      )}
    </section>
  );
};
