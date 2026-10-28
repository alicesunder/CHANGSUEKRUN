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

const STEPS = [
  { label: 'เลือกกิจกรรม', grad: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)' },
  { label: 'ดูราคาแพ็กเกจ', grad: 'linear-gradient(135deg, #F59E0B 0%, #FF6B6B 100%)' },
  { label: 'สมัครวิ่งได้เลย', grad: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)' },
];

const sameKind = (a: AddOnSelection, b: Omit<AddOnSelection, 'people'>) =>
  a.tower === b.tower && a.gun === b.gun && a.windTunnel === b.windTunnel;

const PANEL_SHADOW = '0 22px 46px -18px rgba(123, 63, 198, 0.3), 0 4px 14px -4px rgba(123, 63, 198, 0.1)';

/** Shown directly under the ticket cards. */
export const AddOnActivities: React.FC<AddOnActivitiesProps> = ({ onOpenRegister }) => {
  const [selection, setSelection] = useState<AddOnSelection>({ ...EMPTY_ADD_ONS });
  const [windRemaining, setWindRemaining] = useState<number | null>(null);
  const [gunsOpen, setGunsOpen] = useState(false);

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
    <div id="addons" role="region" aria-labelledby="addons-heading" className="relative scroll-mt-24 mt-12 sm:mt-16">
      {/* Glow blobs behind the block */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 -left-16 w-72 h-72 bg-[#FF7A59]/20 blob blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-1/3 -right-20 w-80 h-80 bg-[#9333EA]/15 blob blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-10 left-1/4 w-72 h-72 bg-[#38BDF8]/20 blob blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-2 right-[6%] hidden sm:block animate-bobble">
        <BoneIcon size={42} color="#FFC928" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute top-40 left-[3%] hidden md:block animate-sparkle">
        <Sparkles className="w-8 h-8 text-[#EC4899]/70" />
      </div>

      <div className="relative z-10 space-y-8 sm:space-y-10">
        {/* ------------------------------------------------ Heading */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <div className="shrink-0 -mb-2">
            <LabradorMascot size={124} speechText="สนุกต่อหลังวิ่งกัน!" glowColor="rgba(255, 201, 40, 0.6)" />
          </div>
          <div className="text-center md:text-left space-y-3 max-w-2xl">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-extrabold uppercase tracking-wider shadow-[0_10px_20px_-8px_rgba(147,51,234,0.6)]"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)' }}
            >
              <PawIcon size={14} color="#FDE68A" />
              AFTER-RUN FUN
            </span>
            <h2 id="addons-heading" className="text-3xl sm:text-5xl font-extrabold text-[#2A1450] tracking-tight leading-tight">
              กิจกรรมเสริม{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #FF7A59 0%, #EC4899 45%, #9333EA 100%)' }}
              >
                มันส์ต่อ
              </span>
              หลังวิ่ง
            </h2>
            <p className="text-sm sm:text-base font-semibold text-[#4B2D78] leading-relaxed">{ADD_ON_TEASER}</p>
            <PawTrail count={9} className="hidden md:flex" color="#C026D3" />
          </div>
        </div>

        {/* ------------------------------------------------ How it works */}
        <ol className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto md:mx-0">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
              <span
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-extrabold text-white tabular-nums shadow-[0_10px_18px_-6px_rgba(42,20,80,0.45)] ring-2 ring-white"
                style={{ background: s.grad }}
              >
                {i + 1}
              </span>
              <span className="text-[12px] sm:text-sm font-extrabold text-[#2A1450] leading-tight">{s.label}</span>
            </li>
          ))}
        </ol>

        {/* ------------------------------------------------ Builder (gradient ring) */}
        <div
          className="rounded-[36px] p-[3px]"
          style={{ background: 'linear-gradient(135deg, #FF7A59 0%, #EC4899 30%, #9333EA 62%, #0EA5E9 100%)', boxShadow: '0 30px 60px -22px rgba(147, 51, 234, 0.5)' }}
        >
          <div className="rounded-[33px] bg-gradient-to-b from-white via-[#FBF8FF] to-[#F3EBFF] p-4 sm:p-7">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg sm:text-2xl font-extrabold text-[#2A1450]">🎯 เลือกกิจกรรมที่ใช่ ได้ราคาทันที</h3>
              {picked && (
                <button
                  type="button"
                  onClick={() => setSelection({ ...EMPTY_ADD_ONS })}
                  className="text-xs sm:text-sm font-extrabold text-[#6B5A85] underline underline-offset-4 hover:text-[#2A1450] min-h-[44px] px-2 cursor-pointer"
                >
                  ล้างที่เลือก
                </button>
              )}
            </div>

            {/* Quick bundles */}
            <div className="mb-6">
              <p className="text-xs sm:text-sm font-extrabold text-[#6B5A85] mb-2.5">แตะเลือกแพ็กเกจยอดฮิตได้เลย</p>
              <div className="flex flex-wrap gap-3">
                {QUICK_BUNDLES.map((b) => {
                  const candidate = { ...b.selection, people: selection.people };
                  const price = addOnPricePerPerson(candidate);
                  const saving = addOnSavingPerPerson(candidate);
                  const on = sameKind(selection, b.selection);
                  const isFull = b.id === 'full';
                  const bg = on
                    ? 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)'
                    : isFull
                      ? 'linear-gradient(135deg, #FDE68A 0%, #FBBF24 55%, #FB923C 100%)'
                      : '#FFFFFF';
                  return (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelection(on ? { ...EMPTY_ADD_ONS, people: selection.people } : { ...b.selection, people: selection.people })}
                      style={{
                        background: bg,
                        boxShadow: on
                          ? '0 14px 26px -10px rgba(147,51,234,0.6)'
                          : isFull
                            ? '0 14px 26px -10px rgba(245,158,11,0.55)'
                            : '0 8px 18px -10px rgba(42,20,80,0.3)',
                      }}
                      className={`min-h-[54px] px-4 py-2 rounded-2xl text-left transition-all cursor-pointer border-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50 hover:-translate-y-0.5 ${
                        on ? 'text-white border-white/70' : isFull ? 'text-[#3B1D00] border-white/80' : 'text-[#2A1450] border-[#8B5CF6]/25'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-extrabold leading-tight">
                        {isFull && <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />}
                        {b.label}
                      </span>
                      <span className={`block text-xs font-bold tabular-nums ${on ? 'text-[#FDE68A]' : isFull ? 'text-[#7C3F00]' : 'text-[#7C3AED]'}`}>
                        {formatBaht(price)} บาท/คน · ประหยัด {formatBaht(saving)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AddOnPicker value={selection} onChange={setSelection} windTunnelRemaining={windRemaining} />

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onOpenRegister(picked ? selection : undefined)}
                className="btn-paw bg-[#FFC928] px-8 py-4 text-base sm:text-lg w-full sm:w-auto min-h-[56px]"
              >
                {picked ? 'สมัครวิ่งพร้อมกิจกรรมเสริมชุดนี้' : 'สมัครวิ่ง'}
              </button>
              <p className="text-xs sm:text-sm font-bold text-[#6B5A85] text-center">
                {picked ? 'ระบบจะพาเลือกระยะวิ่งต่อ และรวมยอดให้เอง' : 'เลือกกิจกรรมก่อน หรือสมัครวิ่งอย่างเดียวแล้วเพิ่มทีหลังก็ได้'}
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ FULL EXPERIENCE spotlight */}
        <button
          type="button"
          onClick={() => {
            setSelection({ tower: true, gun: 'standard', windTunnel: true, people: selection.people });
            document.getElementById('addons-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #9333EA 55%, #EC4899 100%)', boxShadow: '0 30px 56px -20px rgba(147,51,234,0.6)' }}
          className="group relative w-full text-left rounded-[30px] text-white p-5 sm:p-7 overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FDE68A]"
        >
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/70" />
          <span aria-hidden="true" className="absolute -top-12 -right-10 w-56 h-56 rounded-full bg-[#FDE68A]/35 blur-3xl" />
          <span aria-hidden="true" className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-[#38BDF8]/30 blur-3xl" />
          <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="absolute -inset-y-12 w-28 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-ticket-shimmer" />
          </span>
          <span aria-hidden="true" className="absolute top-4 right-5 animate-sparkle"><Sparkles className="w-7 h-7 text-[#FDE68A]" /></span>
          <span className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <span className="lg:col-span-8 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FDE68A] to-[#FBBF24] text-[#3B1D00] text-xs font-extrabold shadow-[0_8px_16px_-6px_rgba(0,0,0,0.4)]">
                <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> {FULL_EXPERIENCE.title}
              </span>
              <span className="block text-2xl sm:text-3xl font-extrabold drop-shadow-[0_3px_10px_rgba(0,0,0,0.25)]">{FULL_EXPERIENCE.subtitle} คุ้มที่สุด!</span>
              <span className="flex flex-wrap gap-2">
                {FULL_EXPERIENCE.includes.map((x) => (
                  <span key={x} className="px-3.5 py-1.5 rounded-full bg-white/18 backdrop-blur-sm border border-white/45 text-sm font-bold">{x}</span>
                ))}
              </span>
            </span>
            <span className="lg:col-span-4 lg:text-right">
              <span className="block text-xs sm:text-sm font-bold text-white/85">
                ซื้อแยก <span className="line-through">{formatBaht(FULL_EXPERIENCE.separatePrice)}</span> บาท
              </span>
              <span className="block text-4xl sm:text-5xl font-extrabold text-[#FDE68A] tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                {formatBaht(FULL_EXPERIENCE.price)}<span className="text-base font-bold ml-1">บาท</span>
              </span>
              <span className="inline-block mt-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white text-xs sm:text-sm font-extrabold shadow-[0_8px_16px_-6px_rgba(0,0,0,0.4)]">
                ประหยัด {formatBaht(FULL_EXPERIENCE.saving)} บาท · แตะเพื่อเลือก
              </span>
            </span>
          </span>
        </button>

        {/* ------------------------------------------------ Expandable details */}
        <div className="grid grid-cols-1 gap-4">
          <details
            className="group rounded-3xl bg-white/90 border border-white overflow-hidden"
            style={{ boxShadow: PANEL_SHADOW }}
          >
            <summary className="list-none cursor-pointer flex items-center justify-between gap-4 p-4 sm:p-5 min-h-[64px]">
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-[0_8px_14px_-6px_rgba(245,158,11,0.6)]" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FF6B6B 100%)' }} aria-hidden="true">📋</span>
                <span>
                  <span className="block text-base sm:text-lg font-extrabold text-[#2A1450]">ตารางราคาทุกแพ็กเกจ</span>
                  <span className="block text-xs sm:text-sm font-semibold text-[#6B5A85]">ดูราคาแพ็กเกจ 2 กิจกรรม และอัปเกรดเป็นปืน Premium</span>
                </span>
              </span>
              <ChevronDown className="w-6 h-6 shrink-0 text-[#7C3AED] transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 sm:px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-[#8B5CF6]/15 pt-4">
              <div>
                <h4 className="text-sm font-extrabold text-[#7C3AED] mb-2">แพ็กเกจ 2 กิจกรรม (ยิงปืน Standard)</h4>
                <ul className="divide-y divide-[#8B5CF6]/15">
                  {STANDARD_PACKAGES.map((p) => (
                    <li key={p.name} className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[#2A1450]">{p.name}</span>
                      <span className="text-right shrink-0">
                        <span className="block font-extrabold text-[#7C3AED] tabular-nums">{formatBaht(p.price)} บาท</span>
                        {p.saving && <span className="block text-[11px] font-bold text-[#047857]">ประหยัด {p.saving} บาท</span>}
                      </span>
                    </li>
                  ))}
                  <li className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#2A1450]">FULL EXPERIENCE (ครบ 3 กิจกรรม)</span>
                    <span className="text-right shrink-0">
                      <span className="block font-extrabold text-[#7C3AED] tabular-nums">{formatBaht(FULL_EXPERIENCE.price)} บาท</span>
                      <span className="block text-[11px] font-bold text-[#047857]">ประหยัด {FULL_EXPERIENCE.saving} บาท</span>
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#7C3AED] mb-2">
                  อัปเกรดเป็นปืน Premium (+{formatBaht(PREMIUM_UPGRADE.extra)} บาท)
                </h4>
                <ul className="divide-y divide-[#8B5CF6]/15">
                  {PREMIUM_UPGRADE.packages.map((p) => (
                    <li key={p.name} className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[#2A1450]">{p.name}</span>
                      <span className="font-extrabold text-[#7C3AED] tabular-nums shrink-0">{formatBaht(p.price)} บาท</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <div className="rounded-3xl bg-white/90 border border-white overflow-hidden" style={{ boxShadow: PANEL_SHADOW }}>
            <button
              type="button"
              onClick={() => setGunsOpen((v) => !v)}
              aria-expanded={gunsOpen}
              aria-controls="addon-gun-details"
              className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left min-h-[64px] cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-[0_8px_14px_-6px_rgba(147,51,234,0.6)]" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)' }}>
                  <Crosshair className="w-5 h-5 text-white" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base sm:text-lg font-extrabold text-[#2A1450]">รายละเอียดส่วนยิงปืน</span>
                  <span className="block text-xs sm:text-sm font-semibold text-[#6B5A85]">ดูรายการปืนที่เลือกได้ทั้ง Standard และ Premium</span>
                </span>
              </span>
              <ChevronDown className={`w-6 h-6 shrink-0 text-[#7C3AED] transition-transform ${gunsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {gunsOpen && (
              <div id="addon-gun-details" className="px-4 sm:px-5 pb-5 space-y-5 border-t border-[#8B5CF6]/15 pt-4">
                <p className="text-sm font-semibold text-[#4B2D78]">{GUN_NOTE}</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-2xl p-4 border border-white" style={{ background: 'linear-gradient(165deg, #FFFFFF 0%, #F5F3FF 55%, #E9D5FF 100%)', boxShadow: '0 14px 28px -16px rgba(139,92,246,0.4)' }}>
                    <h4 className="font-extrabold text-[#2A1450]">ยิงปืน Standard : {formatBaht(890)} บาท/คน (10 นัด)</h4>
                    <p className="text-xs font-bold text-[#6B5A85] mb-3">เลือกได้ 1 กระบอก</p>
                    <div className="space-y-3.5">
                      {STANDARD_GUNS.map((g) => (
                        <div key={g.title}>
                          <p className="text-sm font-extrabold text-[#7C3AED] mb-1">{g.title}</p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {g.guns.map((gun) => (
                              <li key={gun} className="text-sm font-semibold text-[#2A1450] flex gap-2">
                                <PawIcon size={12} color="#C026D3" className="mt-1 shrink-0" />
                                {gun}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3.5 text-xs sm:text-sm font-bold text-[#B45309] bg-[#FFF3C4] border border-[#F5B800]/60 rounded-xl px-3 py-2">
                      อัปเกรด Red dot sight เพิ่ม {formatBaht(RED_DOT_UPGRADE.price)} บาท (เฉพาะ {RED_DOT_UPGRADE.models})
                    </p>
                  </div>
                  <div className="rounded-2xl p-4 border border-white" style={{ background: 'linear-gradient(165deg, #FFFFFF 0%, #FFFBEB 55%, #FEF08A 100%)', boxShadow: '0 14px 28px -16px rgba(245,158,11,0.45)' }}>
                    <h4 className="font-extrabold text-[#2A1450]">ยิงปืน Premium (ปืนกลมือ) : {formatBaht(1950)} บาท/คน (10 นัด)</h4>
                    <p className="text-xs font-bold text-[#6B5A85] mb-3">
                      ปกติ <span className="line-through">{formatBaht(2200)} บาท</span> ลดเหลือ {formatBaht(1950)} บาท
                    </p>
                    <ul className="space-y-1.5">
                      {PREMIUM_GUNS.map((gun) => (
                        <li key={gun} className="text-sm font-semibold text-[#2A1450] flex gap-2">
                          <PawIcon size={12} color="#F59E0B" className="mt-1 shrink-0" />
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
    </div>
  );
};
