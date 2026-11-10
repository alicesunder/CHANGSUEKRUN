import React, { useEffect, useState } from 'react';
import { ArrowRight, PawPrint, Sparkles, X, ZoomIn } from 'lucide-react';
import { useLang } from '../i18n/lang';
import { RaceBib } from './RaceBib';
import { SHIRT_CHART, SHIRT_SIZES } from '../data/shirts';

interface MerchShowcaseProps {
  onOpenRegister?: () => void;
  className?: string;
}

interface KitItem {
  id: string;
  name: string;
  nameEn: string;
  desc: string;
  descEn: string;
  image: string;
  /** who receives it — CONFIRM with the organiser before launch */
  group: 'all' | 'dog';
  /** extra badge on the photo */
  star?: boolean;
  /** takes two grid columns */
  wide?: boolean;
}

/** The BIB tile shows the real BIB design (the same one printed in the ticket e-mail) filled with sample data. */
const SampleBib: React.FC<{ className?: string; sampleName: string }> = ({ className = '', sampleName }) => (
  <RaceBib bib="10-0001" routeId="10km" name={sampleName} orderId="SAMPLE" gender="ชาย" age={32} shirtSize="M" className={className} />
);

export const MOCKUP_NOTICE = 'ภาพจำลองเพื่อการประชาสัมพันธ์เท่านั้น';

/** Diagonal repeating watermark laid over a product picture (the photos sit on white). */
const MockupWatermark: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => (
  <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden select-none">
    <span
      className="absolute left-1/2 top-1/2 flex w-[190%] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] flex-col items-center justify-center gap-[3.4em]"
      style={{ fontSize: size === 'lg' ? 20 : 11 }}
    >
      {[0, 1, 2].map((row) => (
        <span key={row} className="whitespace-nowrap font-black tracking-wide text-[#2A1450]/[0.09]">
          {Array.from({ length: 2 }, () => MOCKUP_NOTICE).join('     ·     ')}
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
    nameEn: 'Micro-Dry running shirt',
    desc: 'สีม่วงไล่เฉดแต่งลายทอง ด้านหน้าลายหัวน้องสุนัขสีขาวขอบทอง โลโก้ ตชด. ที่อกซ้าย ด้านหลังพิมพ์ DOG RUN CHANGSUEK RUN เห็นช้างวิ่ง วิ่งตามช้าง',
    descEn: 'Shaded purple with gold accents, a white-and-gold dog-head design on the front and the Border Patrol Police logo on the chest. The back reads DOG RUN CHANGSUEK RUN.',
    image: '/images/merch/kit-jersey-v3.webp',
    group: 'all',
    wide: true,
  },
  {
    id: 'medal',
    name: 'เหรียญ Finisher',
    nameEn: 'Finisher medal',
    desc: 'เหรียญทองรูปน้องสุนัขลาบราดอร์กระโดดพร้อมป้าย CHANGSUEK RUN ด้านหลังโลโก้ ตชด. สายคล้องคอสีม่วง-ทองพิมพ์ DOG RUN · CHANGSUEK RUN',
    descEn: 'Gold medal shaped as a leaping Labrador with the CHANGSUEK RUN banner, the Border Patrol Police logo on the back, and a purple-and-gold DOG RUN · CHANGSUEK RUN ribbon.',
    image: '/images/merch/kit-medal-v3.webp',
    group: 'all',
    star: true,
  },
  {
    id: 'bag',
    name: 'กระเป๋าหูรูด',
    nameEn: 'Drawstring bag',
    desc: 'กระเป๋าสีม่วงสกรีนโลโก้งาน เชือกถักสะพายหลังได้',
    descEn: 'Purple bag printed with the event logo, with braided rope straps to carry on your back.',
    image: '/images/merch/kit-bag-v3.webp',
    group: 'all',
  },
  {
    id: 'bib',
    name: 'ป้ายเบอร์วิ่ง (BIB)',
    nameEn: 'Race bib (BIB)',
    desc: 'พิมพ์ชื่อและเบอร์ของคุณ มี QR ดูผลการวิ่ง และเบอร์ติดต่อฉุกเฉิน',
    descEn: 'Printed with your name and number, a QR code for results and an emergency contact number.',
    image: '/images/merch/bib-v4.webp',
    group: 'all',
    wide: true,
  },
  {
    id: 'bandana',
    name: 'ผ้าพันคอน้องสุนัข',
    nameEn: 'Dog bandana',
    desc: 'ผ้าพันคอสีม่วง-ทอง ลายหัวน้องสุนัขและรอยอุ้งเท้า โลโก้ ตชด. ผูกง่าย ใส่ถ่ายรูปคู่เจ้าของ (หมายเหตุ : สำหรับ Dog Run ระยะ 1 km และ 4 km)',
    descEn: 'Purple-and-gold bandana with a dog-head design and paw prints plus the Border Patrol Police logo, easy to tie (note: for Dog Run 1 km and 4 km).',
    image: '/images/merch/kit-bandana-v3.webp',
    group: 'dog',
  },
  {
    id: 'pet-pack',
    name: 'Pet Sponsor Gift Pack',
    nameEn: 'Pet Sponsor Gift Pack',
    desc: 'รวมผลิตภัณฑ์สำหรับน้องสุนัขจากผู้สนับสนุนภายในงาน (หมายเหตุ : สำหรับ Dog Run ระยะ 1 km และ 4 km)',
    descEn: 'A bundle of dog products from the event sponsors (note: for Dog Run 1 km and 4 km).',
    image: '/images/merch/kit-pet-sponsor-pack-v4.webp',
    group: 'dog',
  },
];

const SIZE_ROWS = [
  { special: false, sizes: SHIRT_SIZES.slice(0, 7) },
  { special: true, sizes: SHIRT_SIZES.slice(7) },
];

export const MerchShowcase: React.FC<MerchShowcaseProps> = ({ onOpenRegister, className = '' }) => {
  const { t } = useLang();
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
      className={`group relative flex flex-col overflow-hidden ds-tile-on-dark transition-transform duration-300 hover:-translate-y-1 ${
        item.wide ? 'col-span-2' : ''
      } ${row ? 'lg:flex-row lg:items-center' : ''}`}
    >
      <button
        type="button"
        onClick={() => setZoom(item)}
        aria-label={`${t('ดูภาพ', 'View')} ${t(item.name, item.nameEn)} ${t('ขนาดใหญ่', 'larger')}`}
        className={`relative block w-full overflow-hidden cursor-zoom-in ${row ? 'lg:w-[58%] lg:shrink-0' : ''}`}
      >
        {item.id === 'bib' ? (
          <div className="p-2" role="img" aria-label={t(item.name, item.nameEn)}>
            <SampleBib sampleName={t('ชื่อ นามสกุล', 'First Last')} />
          </div>
        ) : (
          <img
            src={item.image}
            alt={t(item.name, item.nameEn)}
            loading="lazy"
            decoding="async"
            className="block w-full aspect-[3/2] object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <MockupWatermark />
        <span className="absolute top-2.5 left-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#FFC928] border-2 border-[#140826] text-[13px] font-black text-[#2A1450]">
          {String(n).padStart(2, '0')}
        </span>
        {item.star && (
          <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#2A1450] text-[#FFC928] text-[11px] font-extrabold px-2.5 py-1">
            <Sparkles className="w-3 h-3" />
            <span className="sm:hidden">{t('เส้นชัย', 'Finish')}</span>
            <span className="hidden sm:inline">{t('ของที่ระลึกเส้นชัย', 'Finish-line keepsake')}</span>
          </span>
        )}
        <span className="absolute bottom-2.5 right-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#F3ECFF] text-[#4C1D95] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4" />
        </span>
      </button>

      <div className={`flex-1 border-t-2 border-dashed border-[#2A1450]/15 px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4 ${row ? 'lg:border-t-0 lg:border-l-2 lg:py-5' : ''}`}>
        <h4 className="font-hero text-[15px] sm:text-lg font-bold leading-snug text-[#2A1450]">{t(item.name, item.nameEn)}</h4>
        <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-[#5B4A78]">{t(item.desc, item.descEn)}</p>
        {item.id === 'jersey' && (
          <div className="mt-2.5">
            <p className="text-[11px] font-extrabold tracking-wide text-[#7C3AED]">
              {t('ตารางไซส์เสื้อ (นิ้ว): รอบอก / ความยาว', 'Shirt size chart (inches): chest / length')}
            </p>
            {SIZE_ROWS.map((row) => (
              <div key={row.special ? 'special' : 'regular'} className="mt-1.5">
                {row.special && <p className="mb-1 text-[11px] font-extrabold text-[#6B5A85]">{t('*ไซส์พิเศษ*', '*Special sizes*')}</p>}
                <ul className="grid grid-cols-7 gap-1">
                  {row.sizes.map((size) => (
                    <li key={size} className={`rounded-lg py-1 text-center leading-none ${row.special ? 'bg-[#E5E1EC]' : 'bg-[#F3ECFF]'}`}>
                      <span className="block text-[11px] font-black text-[#2A1450]">{size}</span>
                      <span className="block mt-0.5 text-[11px] font-semibold text-[#6D28D9]">{SHIRT_CHART[size].chest}"</span>
                      <span className="block mt-0.5 text-[11px] font-semibold text-[#4B2D78]">{SHIRT_CHART[size].length}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </li>
  );

  return (
    <section
      id="race-kit"
      aria-labelledby="race-kit-heading"
      className={`relative overflow-hidden ds-frame-dark bg-gradient-to-br from-[#21113F] via-[#341866] to-[#4A1F8F] text-white ${className}`}
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
            <PawPrint className="w-4 h-4" /> {t('ของที่คุณจะได้รับ', 'What you will receive')}
          </span>
          <h3 id="race-kit-heading" data-reveal="pop" className="squiggle squiggle-center mt-3 font-hero text-3xl sm:text-4xl font-bold text-white">
            Race Pack
          </h3>
          <p className="mt-2 text-sm sm:text-base font-medium text-white/85">
            {t('ออกแบบพิเศษเฉพาะงานนี้ ในธีมม่วง-ทองของช้างศึก', 'Designed just for this event in the purple-and-gold elephant theme')}
          </p>
        </div>

        {/* Every runner */}
        <div className="mt-8 flex items-center gap-3">
          <h4 className="font-hero text-lg sm:text-xl font-semibold text-[#FFC928]">{t('รวมในค่าสมัครทุกระยะ', 'Included with every distance')}</h4>
          <span aria-hidden="true" className="h-px flex-1 bg-[#FFC928]/30" />
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/85">{allItems.length} {t('ชิ้น', 'items')}</span>
        </div>
        <ul data-reveal-stagger="tilt" className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {allItems.map((k, i) => renderTile(k, i + 1, !!k.wide))}
        </ul>

        {/* Dog Run extras */}
        <div className="mt-10 flex items-center gap-3">
          <h4 className="font-hero text-lg sm:text-xl font-semibold text-[#FFC928]">{t('🐶 เพิ่มให้น้องสุนัข', '🐶 Extras for your dog')}</h4>
          <span aria-hidden="true" className="h-px flex-1 bg-[#FFC928]/30" />
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/85">Dog Run · {dogItems.length} {t('ชิ้น', 'items')}</span>
        </div>
        <ul data-reveal-stagger="tilt" className="mt-4 grid grid-cols-2 gap-3 sm:gap-5">
          {dogItems.map((k, i) => renderTile(k, allItems.length + i + 1, true))}
        </ul>

        <div className="mt-9 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onOpenRegister}
            className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-2xl bg-[#FFC928] hover:bg-[#FFD65A] text-[#2A1450] font-hero text-lg font-bold border-[3px] border-[#140826] shadow-[0_6px_0_#140826] active:translate-y-0.5 active:shadow-[0_4px_0_#140826] transition cursor-pointer"
          >
            {t('ซื้อบัตรวิ่งเพื่อรับของที่ระลึก', 'Buy a run ticket to get your Race Pack')} <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs font-medium text-white/70 text-center">
            {t(MOCKUP_NOTICE, 'Illustration for promotion only')} · {t('สี รายละเอียด และวัสดุของจริงอาจแตกต่างจากภาพเล็กน้อย', 'Actual colours, details and materials may differ slightly from the pictures')}
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
              {zoom.id === 'bib' ? (
                <div className="p-3 sm:p-6">
                  <SampleBib sampleName={t('ชื่อ นามสกุล', 'First Last')} />
                </div>
              ) : (
                <img src={zoom.image} alt={zoom.name} className="w-full max-h-[80vh] object-contain" />
              )}
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
