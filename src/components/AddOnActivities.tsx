import React, { useState } from 'react';
import { ChevronDown, Crosshair, Sparkles, Star, TowerControl, Wind } from 'lucide-react';
import {
  ADD_ON_ACTIVITIES,
  ADD_ON_TEASER,
  AddOnId,
  FULL_EXPERIENCE,
  GUN_NOTE,
  PREMIUM_GUNS,
  PREMIUM_UPGRADE,
  RED_DOT_UPGRADE,
  STANDARD_GUNS,
  STANDARD_PACKAGES,
  formatBaht,
} from '../data/addOns';

const ICONS: Record<AddOnId, React.ComponentType<{ className?: string }>> = {
  tower: TowerControl,
  'gun-standard': Crosshair,
  'gun-premium': Crosshair,
  'wind-tunnel': Wind,
};

const TINTS: Record<AddOnId, string> = {
  tower: 'bg-[#DFF5E8]',
  'gun-standard': 'bg-[#EEE4FA]',
  'gun-premium': 'bg-[#FFF3C4]',
  'wind-tunnel': 'bg-[#DCF1FC]',
};

interface AddOnActivitiesProps {
  onOpenRegister: () => void;
}

const Price: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <span className={`font-extrabold tabular-nums ${className}`}>
    {formatBaht(value)}
    <span className="text-[0.6em] font-bold ml-1">บาท</span>
  </span>
);

export const AddOnActivities: React.FC<AddOnActivitiesProps> = ({ onOpenRegister }) => {
  const [gunsOpen, setGunsOpen] = useState(false);

  return (
    <section
      id="addons"
      className="py-10 sm:py-14 lg:py-16 bg-gradient-to-b from-[#EFE6FC] via-[#FAF7FF] to-white relative overflow-hidden scroll-mt-20"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 sm:space-y-10">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border-2 border-[#2A1450] text-[#5B20A8] text-xs font-extrabold uppercase tracking-wider shadow-[0_3px_0_#2A1450]">
            <Sparkles className="w-3.5 h-3.5 text-[#B45309]" aria-hidden="true" />
            <span>AFTER-RUN ACTIVITIES</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A1450] tracking-tight">
            กิจกรรมเสริมพร้อมงานวิ่งสุนัข
          </h2>
          <p className="text-sm sm:text-base font-semibold text-[#4B2D78] leading-relaxed">
            {ADD_ON_TEASER}
          </p>
        </div>

        {/* 1. Individual activities */}
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#2A1450] mb-4">
            1. กิจกรรมเสริม <span className="text-sm font-bold text-[#6F6878]">(ซื้อแยก ราคาต่อคน)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {ADD_ON_ACTIVITIES.map((a) => {
              const Icon = ICONS[a.id];
              return (
                <article
                  key={a.id}
                  className={`relative rounded-3xl border-2 border-[#2A1450] ${TINTS[a.id]} p-5 shadow-[0_5px_0_#2A1450] flex flex-col gap-3`}
                >
                  {a.badge && (
                    <span className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-[#EF5350] text-white text-[11px] font-extrabold border-2 border-[#2A1450]">
                      {a.badge}
                    </span>
                  )}
                  <span className="w-12 h-12 rounded-2xl bg-white border-2 border-[#2A1450] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#54239A]" aria-hidden="true" />
                  </span>
                  <h4 className="text-lg font-extrabold text-[#2A1450] leading-snug">{a.name}</h4>
                  <p className="text-sm font-semibold text-[#4B2D78] leading-relaxed flex-1">{a.detail}</p>
                  <div className="pt-1 border-t-2 border-dashed border-[#2A1450]/25">
                    {a.regularPrice && (
                      <p className="text-xs font-bold text-[#6F6878]">
                        ปกติ <span className="line-through">{formatBaht(a.regularPrice)} บาท</span>
                      </p>
                    )}
                    <p className="text-2xl text-[#54239A]">
                      <Price value={a.price} />
                      <span className="text-xs font-bold text-[#6F6878] ml-1">/ คน</span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* 2. Packages */}
        <div className="space-y-5">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#2A1450]">
            2. แพ็กเกจสุดคุ้ม <span className="text-sm font-bold text-[#6F6878]">(แพ็กเกจ 2 กิจกรรม ยิงปืน Standard)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {STANDARD_PACKAGES.map((p) => (
              <article
                key={p.name}
                className="rounded-3xl border-2 border-[#2A1450] bg-white p-5 shadow-[0_5px_0_#2A1450] flex flex-col gap-2"
              >
                <h4 className="text-base sm:text-lg font-extrabold text-[#2A1450] leading-snug">{p.name}</h4>
                <p className="text-3xl text-[#54239A]">
                  <Price value={p.price} />
                </p>
                {p.saving && (
                  <span className="self-start px-3 py-1 rounded-full bg-[#DFF5E8] border-2 border-[#2EAD62] text-[#166534] text-xs font-extrabold">
                    ประหยัด {formatBaht(p.saving)} บาท
                  </span>
                )}
              </article>
            ))}
          </div>

          {/* FULL EXPERIENCE */}
          <article className="relative rounded-[2rem] border-[3px] border-[#2A1450] bg-gradient-to-br from-[#54239A] via-[#6D2FC4] to-[#2A1450] text-white p-6 sm:p-8 shadow-[0_7px_0_#2A1450] overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#FFC928]/25 blur-2xl pointer-events-none" aria-hidden="true" />
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-7 space-y-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFC928] text-[#2A1450] text-xs font-extrabold border-2 border-[#2A1450]">
                  <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  {FULL_EXPERIENCE.title}
                </span>
                <h4 className="text-2xl sm:text-3xl font-extrabold">{FULL_EXPERIENCE.subtitle}</h4>
                <ul className="flex flex-wrap gap-2">
                  {FULL_EXPERIENCE.includes.map((item) => (
                    <li
                      key={item}
                      className="px-3 py-1.5 rounded-full bg-white/15 border border-white/40 text-sm font-bold"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-span-5 lg:text-right space-y-1">
                <p className="text-xs sm:text-sm font-bold text-white/80">
                  ราคาซื้อแยก <span className="line-through">{formatBaht(FULL_EXPERIENCE.separatePrice)} บาท</span>
                </p>
                <p className="text-4xl sm:text-5xl text-[#FFC928]">
                  <Price value={FULL_EXPERIENCE.price} />
                </p>
                <p className="inline-block px-3 py-1 rounded-full bg-[#2EAD62] text-white text-xs sm:text-sm font-extrabold border-2 border-white/60">
                  ประหยัด {formatBaht(FULL_EXPERIENCE.saving)} บาท
                </p>
              </div>
            </div>
          </article>

          {/* Premium upgrade */}
          <div className="rounded-3xl border-2 border-[#2A1450] bg-[#FFF8DC] p-5 sm:p-6 shadow-[0_5px_0_#2A1450]">
            <h4 className="text-base sm:text-lg font-extrabold text-[#2A1450] mb-1">
              อัปเกรดเป็นปืน Premium : เพิ่ม {formatBaht(PREMIUM_UPGRADE.extra)} บาท
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-[#6F6878] mb-4">
              สลับยิงปืน Standard เป็นปืนกลมือ Premium ในแพ็กเกจที่ต้องการ
            </p>
            <ul className="divide-y-2 divide-dashed divide-[#2A1450]/20">
              {PREMIUM_UPGRADE.packages.map((p) => (
                <li key={p.name} className="py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="text-sm sm:text-base font-extrabold text-[#2A1450]">{p.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#B45309]">+{formatBaht(p.upgradeDiff ?? 0)} บาท</span>
                    <Price value={p.price} className="text-lg sm:text-xl text-[#54239A]" />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Shooting details */}
        <div className="rounded-3xl border-2 border-[#2A1450] bg-white shadow-[0_5px_0_#2A1450] overflow-hidden">
          <button
            type="button"
            onClick={() => setGunsOpen((v) => !v)}
            aria-expanded={gunsOpen}
            aria-controls="addon-gun-details"
            className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left min-h-[64px]"
          >
            <span>
              <span className="block text-lg sm:text-xl font-extrabold text-[#2A1450]">
                3. รายละเอียดส่วนยิงปืน
              </span>
              <span className="block text-xs sm:text-sm font-semibold text-[#6F6878] mt-0.5">
                ดูรายการปืนที่เลือกได้ทั้ง Standard และ Premium
              </span>
            </span>
            <ChevronDown
              className={`w-6 h-6 shrink-0 text-[#54239A] transition-transform ${gunsOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {gunsOpen && (
            <div id="addon-gun-details" className="px-5 sm:px-6 pb-6 space-y-6 border-t-2 border-dashed border-[#2A1450]/25 pt-5">
              <p className="text-sm font-semibold text-[#4B2D78]">{GUN_NOTE}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-[#F4EEFD] border-2 border-[#2A1450]/30 p-4 sm:p-5">
                  <h4 className="font-extrabold text-[#2A1450]">
                    ยิงปืน Standard : {formatBaht(890)} บาท/คน (10 นัด)
                  </h4>
                  <p className="text-xs font-bold text-[#6F6878] mb-3">เลือกได้ 1 กระบอก</p>
                  <div className="space-y-4">
                    {STANDARD_GUNS.map((g) => (
                      <div key={g.title}>
                        <p className="text-sm font-extrabold text-[#54239A] mb-1.5">{g.title}</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {g.guns.map((gun) => (
                            <li key={gun} className="text-sm font-semibold text-[#2A1450] flex gap-2">
                              <span aria-hidden="true" className="text-[#B45309]">•</span>
                              {gun}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs sm:text-sm font-bold text-[#B45309] bg-[#FFF3C4] border-2 border-[#F5B800]/60 rounded-xl px-3 py-2">
                    อัปเกรด Red dot sight เพิ่ม {formatBaht(RED_DOT_UPGRADE.price)} บาท (เฉพาะ {RED_DOT_UPGRADE.models})
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FFF8DC] border-2 border-[#2A1450]/30 p-4 sm:p-5">
                  <h4 className="font-extrabold text-[#2A1450]">
                    ยิงปืน Premium (ปืนกลมือ) : {formatBaht(1950)} บาท/คน (10 นัด)
                  </h4>
                  <p className="text-xs font-bold text-[#6F6878] mb-3">
                    ปกติ <span className="line-through">{formatBaht(2200)} บาท</span> ลดเหลือ {formatBaht(1950)} บาท
                  </p>
                  <ul className="space-y-1.5">
                    {PREMIUM_GUNS.map((gun) => (
                      <li key={gun} className="text-sm font-semibold text-[#2A1450] flex gap-2">
                        <span aria-hidden="true" className="text-[#B45309]">•</span>
                        {gun}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            type="button"
            onClick={onOpenRegister}
            className="btn-paw bg-[#FFC928] px-7 py-3.5 text-base sm:text-lg w-full sm:w-auto"
          >
            สมัครวิ่ง
          </button>
        </div>
      </div>
    </section>
  );
};
