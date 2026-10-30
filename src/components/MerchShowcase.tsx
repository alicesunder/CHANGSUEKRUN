import React, { useEffect, useState } from 'react';
import { ArrowRight, Images, PawPrint, Sparkles, X, ZoomIn } from 'lucide-react';

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
  /** takes two grid columns */
  wide?: boolean;
}

export const MOCKUP_NOTICE = 'ภาพจำลองเพื่อการประชาสัมพันธ์เท่านั้น';

/** Diagonal repeating watermark laid over a product picture (the photos sit on white). */
const MockupWatermark: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => (
  <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden select-none">
    <span
      className="absolute left-1/2 top-1/2 flex w-[190%] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] flex-col items-center justify-center gap-[3.4em]"
      style={{ fontSize: size === 'lg' ? 20 : 11 }}
    >
      {[0, 1, 2, 3].map((row) => (
        <span key={row} className="whitespace-nowrap font-black tracking-wide text-[#2A1450]/[0.09]">
          {Array.from({ length: 4 }, () => MOCKUP_NOTICE).join('     ·     ')}
        </span>
      ))}
    </span>
  </span>
);

// Photos are the organiser's product mock-ups; real items may differ slightly.
const KIT: KitItem[] = [
  {
    id: 'jersey',
    name: 'เสื้อวิ่ง Micro-Dry',
    desc: 'ผ้า Micro-Dry ลายพรางม่วง ใส่สบาย แห้งเร็ว สกรีนโลโก้ช้างศึกด้านหน้า',
    image: '/images/merch/kit-jersey.jpg',
    group: 'all',
    wide: true,
  },
  {
    id: 'medal',
    name: 'เหรียญ Finisher',
    desc: 'เหรียญลายช้างศึก ลงสีม่วง-ทอง พร้อมสายคล้องคอลาย Chang suek',
    image: '/images/merch/kit-medal.webp',
    group: 'all',
    star: true,
  },
  {
    id: 'bag',
    name: 'กระเป๋าหูรูด',
    desc: 'กระเป๋าสีม่วงสกรีนโลโก้งาน เชือกถักสะพายหลังได้',
    image: '/images/merch/kit-bag.webp',
    group: 'all',
  },
  {
    id: 'bib',
    name: 'ป้ายเบอร์วิ่ง (BIB)',
    desc: 'พิมพ์ชื่อและเบอร์ของคุณ มี QR ดูผลการวิ่ง และเบอร์ติดต่อฉุกเฉิน',
    image: '/images/merch/bib.webp',
    group: 'all',
    wide: true,
  },
  {
    id: 'bandana',
    name: 'ผ้าพันคอน้องสุนัข',
    desc: 'ลายช้างศึกม่วง-ทอง ผูกง่าย ใส่ถ่ายรูปคู่เจ้าของ',
    image: '/images/merch/kit-bandana.webp',
    group: 'dog',
  },
  {
    id: 'bowl',
    name: 'ชามพับเก็บได้',
    desc: 'ชามซิลิโคนพับแบน พร้อมตะขอคล้อง ให้น้ำน้องระหว่างทาง',
    image: '/images/merch/kit-bowl.webp',
    group: 'dog',
  },
];

const COLLAGE: KitItem = {
  id: 'collage',
  name: 'ภาพรวมของที่ระลึกทั้งชุด',
  desc: '',
  image: '/images/merch/kit-collage.webp',
  group: 'all',
};

const SIZES = [
  { size: 'XS', chest: '34"' },
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

  const allItems = KIT.filter((k) => k.group === 'all');
  const dogItems = KIT.filter((k) => k.group === 'dog');

  /** White product tile; `row` lays the text beside the photo on large screens. */
  const renderTile = (item: KitItem, n: number, row: boolean) => (
    <li
      key={item.id}
      className={`group relative flex flex-col overflow-hidden rounded-[24px] bg-white border-[3px] border-[#140826] shadow-[0_6px_0_#140826] transition-transform duration-300 hover:-translate-y-1 ${
        item.wide ? 'col-span-2' : ''
      } ${row ? 'lg:flex-row lg:items-center' : ''}`}
    >
      <button
        type="button"
        onClick={() => setZoom(item)}
        aria-label={`ดูภาพ${item.name}ขนาดใหญ่`}
        className={`relative block w-full overflow-hidden cursor-zoom-in ${row ? 'lg:w-[58%] lg:shrink-0' : ''}`}
      >
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="block w-full aspect-[3/2] object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <MockupWatermark />
        <span className="absolute top-2.5 left-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#FFC928] border-2 border-[#140826] text-[13px] font-black text-[#2A1450]">
          {String(n).padStart(2, '0')}
        </span>
        {item.star && (
          <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#2A1450] text-[#FFC928] text-[11px] font-extrabold px-2.5 py-1">
            <Sparkles className="w-3 h-3" />
            <span className="sm:hidden">เส้นชัย</span>
            <span className="hidden sm:inline">ของที่ระลึกเส้นชัย</span>
          </span>
        )}
        <span className="absolute bottom-2.5 right-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#F3ECFF] text-[#4C1D95] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4" />
        </span>
      </button>

      <div className={`flex-1 border-t-2 border-dashed border-[#2A1450]/15 px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4 ${row ? 'lg:border-t-0 lg:border-l-2 lg:py-5' : ''}`}>
        <h4 className="font-hero text-[15px] sm:text-lg font-bold leading-snug text-[#2A1450]">{item.name}</h4>
        <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-[#5B4A78]">{item.desc}</p>
        {item.id === 'jersey' && (
          <div className="mt-2.5">
            <p className="text-[11px] font-extrabold tracking-wide text-[#7C3AED]">ไซซ์ (รอบอก)</p>
            <ul className="mt-1 grid grid-cols-7 gap-1">
              {SIZES.map((sz) => (
                <li key={sz.size} className="rounded-lg bg-[#F3ECFF] py-1 text-center leading-none">
                  <span className="block text-[11px] font-black text-[#2A1450]">{sz.size}</span>
                  <span className="block mt-0.5 text-[10px] font-semibold text-[#6D28D9]">{sz.chest}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );

  return (
    <section
      id="race-kit"
      aria-labelledby="race-kit-heading"
      className={`relative overflow-hidden rounded-[32px] border-[3px] border-[#2A1450] shadow-[0_10px_0_#2A1450] bg-gradient-to-br from-[#241047] via-[#341866] to-[#4A1F8F] text-white ${className}`}
    >
      {/* race-tape edge + soft spotlight */}
      <div
        aria-hidden="true"
        className="h-3 w-full"
        style={{ background: 'repeating-linear-gradient(135deg, #FFC928 0 14px, #2A1450 14px 28px)' }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-32 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[#8B5CF6]/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FFC928]/15 blur-3xl" />

      <div className="relative px-4 sm:px-8 lg:px-12 py-8 sm:py-11">
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
          <button
            type="button"
            onClick={() => setZoom(COLLAGE)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-white/30 px-4 py-1.5 text-xs sm:text-sm font-bold text-white hover:border-[#FFC928] hover:text-[#FFC928] transition cursor-pointer"
          >
            <Images className="w-4 h-4" /> ดูภาพรวมทั้งชุด
          </button>
        </div>

        {/* Every runner */}
        <div className="mt-8 flex items-center gap-3">
          <h4 className="font-hero text-lg sm:text-xl font-semibold text-[#FFC928]">รวมในค่าสมัครทุกระยะ</h4>
          <span aria-hidden="true" className="h-px flex-1 bg-[#FFC928]/30" />
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/85">{allItems.length} ชิ้น</span>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {allItems.map((k, i) => renderTile(k, i + 1, !!k.wide))}
        </ul>

        {/* Dog Run extras */}
        <div className="mt-10 flex items-center gap-3">
          <h4 className="font-hero text-lg sm:text-xl font-semibold text-[#FFC928]">🐶 เพิ่มให้น้องสุนัข</h4>
          <span aria-hidden="true" className="h-px flex-1 bg-[#FFC928]/30" />
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/85">Dog Run · {dogItems.length} ชิ้น</span>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5">
          {dogItems.map((k, i) => renderTile(k, allItems.length + i + 1, true))}
        </ul>

        <div className="mt-9 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onOpenRegister}
            className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-2xl bg-[#FFC928] hover:bg-[#FFD65A] text-[#2A1450] font-hero text-lg font-bold border-[3px] border-[#140826] shadow-[0_6px_0_#140826] active:translate-y-0.5 active:shadow-[0_4px_0_#140826] transition cursor-pointer"
          >
            ซื้อบัตรวิ่งเพื่อรับของที่ระลึก <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs font-medium text-white/70 text-center">
            {MOCKUP_NOTICE} · สี รายละเอียด และวัสดุของจริงอาจแตกต่างจากภาพเล็กน้อย
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
            <div className="relative overflow-hidden rounded-2xl bg-white">
              <img src={zoom.image} alt={zoom.name} className="w-full max-h-[80vh] object-contain" />
              <MockupWatermark size="lg" />
            </div>
            <p className="mt-2 text-center font-hero text-lg text-white">{zoom.name}</p>
            <p className="text-center text-xs font-semibold text-white/75">{MOCKUP_NOTICE} ของจริงอาจแตกต่างจากภาพ</p>
          </div>
        </div>
      )}
    </section>
  );
};
