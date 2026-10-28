import React, { useEffect, useState } from 'react';
import { ChevronDown, Crosshair, Sparkles, Star } from 'lucide-react';
import {
  ADD_ON_TEASER,
  AddOnSelection,
  EMPTY_ADD_ONS,
  GUN_NOTE,
  PREMIUM_GUNS,
  PREMIUM_UPGRADE,
  QUICK_BUNDLES,
  RED_DOT_UPGRADE,
  STANDARD_GUNS,
  STANDARD_PACKAGES,
  FULL_EXPERIENCE,
  addOnPricePerPerson,
  addOnSavingPerPerson,
  formatBaht,
  hasAddOns,
} from '../data/addOns';
import { getPublicConfig } from '../utils/api';
import { AddOnPicker } from './AddOnPicker';
import { BoneIcon, PawIcon, PawTrail } from './brand/DogDecor';
import { LabradorMascot } from './brand/LabradorMascot';

interface AddOnActivitiesProps {
  /** Opens the registration form; the chosen activities are carried over. */
  onOpenRegister: (addOns?: AddOnSelection) => void;
}

const STEPS = ['เลือกกิจกรรม', 'ดูราคาแพ็กเกจ', 'สมัครวิ่งได้เลย'];

const sameKind = (a: AddOnSelection, b: Omit<AddOnSelection, 'people'>) =>
  a.tower === b.tower && a.gun === b.gun && a.windTunnel === b.windTunnel;

export const AddOnActivities: React.FC<AddOnActivitiesProps> = ({ onOpenRegister }) => {
  const [selection, setSelection] = useState<AddOnSelection>({ ...EMPTY_ADD_ONS });
  const [windRemaining, setWindRemaining] = useState<number | null>(null);
  const [gunsOpen, setGunsOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    getPublicConfig()
      .then((c) => alive && setWindRemaining(typeof c.windTunnelRemaining === 'number' ? c.windTunnelRemaining : null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const picked = hasAddOns(selection);

  return (
    <section
      id="addons"
      aria-labelledby="addons-heading"
      className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#FFF8DC] via-[#FAF7FF] to-[#EFE6FC] paw-bg relative overflow-hidden scroll-mt-20"
    >
      {/* Soft colour blobs + floating bits */}
      <div aria-hidden="true" className="absolute -top-20 -left-24 w-80 h-80 bg-[#FFC928]/30 blob pointer-events-none" />
      <div aria-hidden="true" className="absolute top-1/2 -right-28 w-96 h-96 bg-[#8ED8F8]/30 blob pointer-events-none" />
      <div aria-hidden="true" className="absolute top-24 right-[8%] hidden sm:block animate-bobble pointer-events-none">
        <BoneIcon size={44} color="#FFC928" />
      </div>
      <div aria-hidden="true" className="absolute bottom-40 left-[5%] hidden md:block animate-sparkle pointer-events-none">
        <Sparkles className="w-8 h-8 text-[#7B3FC6]/60" />
      </div>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10 sm:space-y-12">
        {/* ------------------------------------------------ Heading */}
        <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8">
          <div className="shrink-0 -mb-2">
            <LabradorMascot size={132} speechText="สนุกต่อหลังวิ่งกัน!" glowColor="rgba(255, 201, 40, 0.55)" />
          </div>
          <div className="text-center md:text-left space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border-[3px] border-[#2A1450] text-[#5B20A8] text-xs font-extrabold uppercase tracking-wider shadow-[0_3px_0_#2A1450] -rotate-1">
              <PawIcon size={14} color="#B45309" />
              AFTER-RUN FUN
            </span>
            <h2 id="addons-heading" className="text-3xl sm:text-5xl font-extrabold text-[#2A1450] tracking-tight leading-tight">
              กิจกรรมเสริม <span className="text-[#7B3FC6]">มันส์ต่อ</span>หลังวิ่ง
            </h2>
            <p className="text-sm sm:text-base font-semibold text-[#4B2D78] leading-relaxed">{ADD_ON_TEASER}</p>
            <PawTrail count={9} className="hidden md:flex" color="#C9A45C" />
          </div>
        </div>

        {/* ------------------------------------------------ How it works */}
        <ol className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto md:mx-0">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
              <span className="w-9 h-9 shrink-0 rounded-full bg-[#FFC928] border-[3px] border-[#2A1450] shadow-[0_3px_0_#2A1450] flex items-center justify-center font-extrabold text-[#2A1450] tabular-nums">
                {i + 1}
              </span>
              <span className="text-[12px] sm:text-sm font-extrabold text-[#2A1450] leading-tight">{s}</span>
            </li>
          ))}
        </ol>

        {/* ------------------------------------------------ Builder */}
        <div className="rounded-[34px] border-[3px] border-[#2A1450] bg-white/90 backdrop-blur-sm p-4 sm:p-7 shadow-[0_8px_0_#2A1450]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg sm:text-2xl font-extrabold text-[#2A1450]">🎯 เลือกกิจกรรมที่ใช่ ได้ราคาทันที</h3>
            {picked && (
              <button
                type="button"
                onClick={() => setSelection({ ...EMPTY_ADD_ONS })}
                className="text-xs sm:text-sm font-extrabold text-[#6F6878] underline underline-offset-4 hover:text-[#2A1450] min-h-[44px] px-2 cursor-pointer"
              >
                ล้างที่เลือก
              </button>
            )}
          </div>

          {/* Quick bundles */}
          <div className="mb-5">
            <p className="text-xs sm:text-sm font-extrabold text-[#6F6878] mb-2">แตะเลือกแพ็กเกจยอดฮิตได้เลย</p>
            <div className="flex flex-wrap gap-2.5">
              {QUICK_BUNDLES.map((b) => {
                const candidate = { ...b.selection, people: selection.people };
                const price = addOnPricePerPerson(candidate);
                const saving = addOnSavingPerPerson(candidate);
                const on = sameKind(selection, b.selection);
                const isFull = b.id === 'full';
                return (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSelection(on ? { ...EMPTY_ADD_ONS, people: selection.people } : { ...b.selection, people: selection.people })}
                    className={`min-h-[52px] px-4 py-2 rounded-2xl border-[3px] text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50 ${
                      on
                        ? 'bg-[#2A1450] border-[#2A1450] text-white shadow-[0_4px_0_#7B3FC6] -translate-y-0.5'
                        : isFull
                          ? 'bg-[#FFC928] border-[#2A1450] text-[#2A1450] shadow-[0_4px_0_#2A1450] hover:-translate-y-0.5'
                          : 'bg-white border-[#2A1450]/40 text-[#2A1450] hover:border-[#2A1450] hover:-translate-y-0.5'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-extrabold leading-tight">
                      {isFull && <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />}
                      {b.label}
                    </span>
                    <span className={`block text-xs font-bold tabular-nums ${on ? 'text-[#FFC928]' : 'text-[#54239A]'}`}>
                      {formatBaht(price)} บาท/คน · ประหยัด {formatBaht(saving)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AddOnPicker value={selection} onChange={setSelection} windTunnelRemaining={windRemaining} />

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenRegister(picked ? selection : undefined)}
              className="btn-paw bg-[#FFC928] px-8 py-4 text-base sm:text-lg w-full sm:w-auto min-h-[56px]"
            >
              {picked ? 'สมัครวิ่งพร้อมกิจกรรมเสริมชุดนี้' : 'สมัครวิ่ง'}
            </button>
            <p className="text-xs sm:text-sm font-bold text-[#6F6878] text-center">
              {picked ? 'ระบบจะพาเลือกระยะวิ่งต่อ และรวมยอดให้เอง' : 'เลือกกิจกรรมก่อน หรือสมัครวิ่งอย่างเดียวแล้วเพิ่มทีหลังก็ได้'}
            </p>
          </div>
        </div>

        {/* ------------------------------------------------ FULL EXPERIENCE spotlight */}
        <button
          type="button"
          onClick={() => {
            setSelection({ tower: true, gun: 'standard', windTunnel: true, people: selection.people });
            document.getElementById('addons-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="relative w-full text-left rounded-[30px] border-[3px] border-[#2A1450] bg-gradient-to-br from-[#54239A] via-[#6D2FC4] to-[#2A1450] text-white p-5 sm:p-7 shadow-[0_7px_0_#2A1450] overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFC928]"
        >
          <span aria-hidden="true" className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-[#FFC928]/25 blur-2xl" />
          <span aria-hidden="true" className="absolute top-4 right-5 animate-sparkle"><Sparkles className="w-7 h-7 text-[#FFC928]" /></span>
          <span className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <span className="lg:col-span-8 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC928] text-[#2A1450] text-xs font-extrabold border-2 border-[#2A1450]">
                <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> {FULL_EXPERIENCE.title}
              </span>
              <span className="block text-2xl sm:text-3xl font-extrabold">{FULL_EXPERIENCE.subtitle} คุ้มที่สุด!</span>
              <span className="flex flex-wrap gap-2">
                {FULL_EXPERIENCE.includes.map((x) => (
                  <span key={x} className="px-3 py-1.5 rounded-full bg-white/15 border border-white/40 text-sm font-bold">{x}</span>
                ))}
              </span>
            </span>
            <span className="lg:col-span-4 lg:text-right">
              <span className="block text-xs sm:text-sm font-bold text-white/80">
                ซื้อแยก <span className="line-through">{formatBaht(FULL_EXPERIENCE.separatePrice)}</span> บาท
              </span>
              <span className="block text-4xl sm:text-5xl font-extrabold text-[#FFC928] tabular-nums">
                {formatBaht(FULL_EXPERIENCE.price)}<span className="text-base font-bold ml-1">บาท</span>
              </span>
              <span className="inline-block mt-1 px-3 py-1 rounded-full bg-[#2EAD62] text-white text-xs sm:text-sm font-extrabold border-2 border-white/60">
                ประหยัด {formatBaht(FULL_EXPERIENCE.saving)} บาท · แตะเพื่อเลือก
              </span>
            </span>
          </span>
        </button>

        {/* ------------------------------------------------ Expandable details */}
        <div className="grid grid-cols-1 gap-4">
          <details
            open={tableOpen}
            onToggle={(e) => setTableOpen((e.target as HTMLDetailsElement).open)}
            className="group rounded-3xl border-[3px] border-[#2A1450] bg-white shadow-[0_5px_0_#2A1450] overflow-hidden"
          >
            <summary className="list-none cursor-pointer flex items-center justify-between gap-4 p-4 sm:p-5 min-h-[64px]">
              <span>
                <span className="block text-base sm:text-lg font-extrabold text-[#2A1450]">📋 ตารางราคาทุกแพ็กเกจ</span>
                <span className="block text-xs sm:text-sm font-semibold text-[#6F6878]">ดูราคาแพ็กเกจ 2 กิจกรรม และอัปเกรดเป็นปืน Premium</span>
              </span>
              <ChevronDown className="w-6 h-6 shrink-0 text-[#54239A] transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 sm:px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-t-2 border-dashed border-[#2A1450]/20 pt-4">
              <div>
                <h4 className="text-sm font-extrabold text-[#54239A] mb-2">แพ็กเกจ 2 กิจกรรม (ยิงปืน Standard)</h4>
                <ul className="divide-y-2 divide-dashed divide-[#2A1450]/15">
                  {STANDARD_PACKAGES.map((p) => (
                    <li key={p.name} className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[#2A1450]">{p.name}</span>
                      <span className="text-right shrink-0">
                        <span className="block font-extrabold text-[#54239A] tabular-nums">{formatBaht(p.price)} บาท</span>
                        {p.saving && <span className="block text-[11px] font-bold text-[#166534]">ประหยัด {p.saving} บาท</span>}
                      </span>
                    </li>
                  ))}
                  <li className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#2A1450]">FULL EXPERIENCE (ครบ 3 กิจกรรม)</span>
                    <span className="text-right shrink-0">
                      <span className="block font-extrabold text-[#54239A] tabular-nums">{formatBaht(FULL_EXPERIENCE.price)} บาท</span>
                      <span className="block text-[11px] font-bold text-[#166534]">ประหยัด {FULL_EXPERIENCE.saving} บาท</span>
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#54239A] mb-2">
                  อัปเกรดเป็นปืน Premium (+{formatBaht(PREMIUM_UPGRADE.extra)} บาท)
                </h4>
                <ul className="divide-y-2 divide-dashed divide-[#2A1450]/15">
                  {PREMIUM_UPGRADE.packages.map((p) => (
                    <li key={p.name} className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[#2A1450]">{p.name}</span>
                      <span className="font-extrabold text-[#54239A] tabular-nums shrink-0">{formatBaht(p.price)} บาท</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <div className="rounded-3xl border-[3px] border-[#2A1450] bg-white shadow-[0_5px_0_#2A1450] overflow-hidden">
            <button
              type="button"
              onClick={() => setGunsOpen((v) => !v)}
              aria-expanded={gunsOpen}
              aria-controls="addon-gun-details"
              className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left min-h-[64px] cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#EEE4FA] border-2 border-[#2A1450] flex items-center justify-center shrink-0">
                  <Crosshair className="w-5 h-5 text-[#54239A]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base sm:text-lg font-extrabold text-[#2A1450]">รายละเอียดส่วนยิงปืน</span>
                  <span className="block text-xs sm:text-sm font-semibold text-[#6F6878]">ดูรายการปืนที่เลือกได้ทั้ง Standard และ Premium</span>
                </span>
              </span>
              <ChevronDown className={`w-6 h-6 shrink-0 text-[#54239A] transition-transform ${gunsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {gunsOpen && (
              <div id="addon-gun-details" className="px-4 sm:px-5 pb-5 space-y-5 border-t-2 border-dashed border-[#2A1450]/20 pt-4">
                <p className="text-sm font-semibold text-[#4B2D78]">{GUN_NOTE}</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-2xl bg-[#F4EEFD] border-2 border-[#2A1450]/25 p-4">
                    <h4 className="font-extrabold text-[#2A1450]">ยิงปืน Standard : {formatBaht(890)} บาท/คน (10 นัด)</h4>
                    <p className="text-xs font-bold text-[#6F6878] mb-3">เลือกได้ 1 กระบอก</p>
                    <div className="space-y-3.5">
                      {STANDARD_GUNS.map((g) => (
                        <div key={g.title}>
                          <p className="text-sm font-extrabold text-[#54239A] mb-1">{g.title}</p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {g.guns.map((gun) => (
                              <li key={gun} className="text-sm font-semibold text-[#2A1450] flex gap-2">
                                <PawIcon size={12} color="#B45309" className="mt-1 shrink-0" />
                                {gun}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3.5 text-xs sm:text-sm font-bold text-[#B45309] bg-[#FFF3C4] border-2 border-[#F5B800]/60 rounded-xl px-3 py-2">
                      อัปเกรด Red dot sight เพิ่ม {formatBaht(RED_DOT_UPGRADE.price)} บาท (เฉพาะ {RED_DOT_UPGRADE.models})
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FFF8DC] border-2 border-[#2A1450]/25 p-4">
                    <h4 className="font-extrabold text-[#2A1450]">ยิงปืน Premium (ปืนกลมือ) : {formatBaht(1950)} บาท/คน (10 นัด)</h4>
                    <p className="text-xs font-bold text-[#6F6878] mb-3">
                      ปกติ <span className="line-through">{formatBaht(2200)} บาท</span> ลดเหลือ {formatBaht(1950)} บาท
                    </p>
                    <ul className="space-y-1.5">
                      {PREMIUM_GUNS.map((gun) => (
                        <li key={gun} className="text-sm font-semibold text-[#2A1450] flex gap-2">
                          <PawIcon size={12} color="#B45309" className="mt-1 shrink-0" />
                          {gun}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
