import React, { useEffect, useState } from 'react';
import { ChevronDown, Sparkles, Star } from 'lucide-react';
import { RouteId } from '../types';
import { calcTicketTotal, isDogCategory, ticketById } from '../data/eventData';
import {
  AddOnSelection,
  EMPTY_ADD_ONS,
  FULL_EXPERIENCE,
  GUN_NOTE,
  PREMIUM_GUNS,
  PREMIUM_UPGRADE,
  QUICK_BUNDLES,
  RED_DOT_UPGRADE,
  STANDARD_GUNS,
  STANDARD_PACKAGES,
  addOnLabel,
  addOnPricePerPerson,
  addOnSavingPerPerson,
  addOnTotal,
  formatBaht,
  hasAddOns,
} from '../data/addOns';
import { getPublicConfig } from '../utils/api';
import { AddOnPicker, PeopleStepper } from './AddOnPicker';
import { LABRADOR_SVG_PATH } from './brand/LabradorMascot';
import { PawIcon } from './brand/DogDecor';

interface AddOnActivitiesProps {
  /** The ticket currently chosen in the cards above */
  selectedRoute: RouteId;
  value: AddOnSelection;
  onChange: (next: AddOnSelection) => void;
  /** Opens the registration form with the chosen ticket + activities */
  onOpenRegister: () => void;
}

const sameKind = (a: AddOnSelection, b: Omit<AddOnSelection, 'people'>) =>
  a.tower === b.tower && a.gun === b.gun && a.windTunnel === b.windTunnel;

/**
 * Step 2 of buying a ticket: optional add-on activities, right under the ticket cards.
 * One compact block: tap activities, see the combined total, register.
 */
export const AddOnActivities: React.FC<AddOnActivitiesProps> = ({ selectedRoute, value, onChange, onOpenRegister }) => {
  const [windRemaining, setWindRemaining] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    getPublicConfig()
      .then((c) => alive && setWindRemaining(typeof c.windTunnelRemaining === 'number' ? c.windTunnelRemaining : null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const ticket = ticketById(selectedRoute);
  const ticketPrice = calcTicketTotal(selectedRoute, 0, 0);
  const isDog = isDogCategory(selectedRoute);
  const picked = hasAddOns(value);
  const addOnSum = addOnTotal(value);
  const grand = ticketPrice + addOnSum;
  const isFull = value.tower && value.gun === 'standard' && value.windTunnel;
  const saving = addOnSavingPerPerson(value);

  return (
    <div id="addons" role="region" aria-labelledby="addons-heading" className="relative scroll-mt-24 mt-8 sm:mt-10">
      <div
        className="rounded-[32px] p-[3px]"
        style={{ background: 'linear-gradient(135deg, #FF7A59 0%, #EC4899 30%, #9333EA 62%, #0EA5E9 100%)', boxShadow: '0 28px 56px -22px rgba(147, 51, 234, 0.5)' }}
      >
        <div className="rounded-[29px] bg-gradient-to-b from-white via-[#FBF8FF] to-[#F3EBFF] p-4 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-extrabold text-white ring-2 ring-white shadow-[0_10px_18px_-6px_rgba(147,51,234,0.6)]"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)' }}
                aria-hidden="true"
              >
                2
              </span>
              <div className="min-w-0">
                <h3 id="addons-heading" className="text-xl sm:text-2xl font-extrabold text-[#2A1450] leading-tight flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  เพิ่มความมันส์หลังวิ่ง
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EEE4FA] text-[#6D28D9] text-xs font-extrabold">ไม่บังคับ</span>
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[#4B2D78] leading-snug mt-0.5">
                  ซื้อเป็นแพ็กเกจคุ้มกว่า เริ่มต้น 1,190 บาท · ครบทุกกิจกรรมเพียง {formatBaht(FULL_EXPERIENCE.price)} บาท
                </p>
              </div>
            </div>
            <img
              src={LABRADOR_SVG_PATH}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="hidden sm:block w-16 h-[70px] object-contain shrink-0 animate-bobble drop-shadow-[0_8px_12px_rgba(42,20,80,0.2)]"
            />
          </div>

          {/* Popular bundles: one tap */}
          <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-xs font-extrabold text-[#6B5A85] mr-1 shrink-0">ทางลัด:</span>
            {QUICK_BUNDLES.map((b) => {
              const candidate = { ...b.selection, people: value.people };
              const on = sameKind(value, b.selection);
              const isFullBundle = b.id === 'full';
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(on ? { ...EMPTY_ADD_ONS, people: value.people } : { ...b.selection, people: value.people })}
                  style={{
                    background: on
                      ? 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)'
                      : isFullBundle
                        ? 'linear-gradient(135deg, #FDE68A 0%, #FBBF24 55%, #FB923C 100%)'
                        : '#FFFFFF',
                    boxShadow: on ? '0 10px 20px -8px rgba(147,51,234,0.6)' : isFullBundle ? '0 10px 20px -8px rgba(245,158,11,0.55)' : '0 6px 14px -8px rgba(42,20,80,0.3)',
                  }}
                  className={`shrink-0 whitespace-nowrap min-h-[40px] px-3 py-1.5 rounded-full text-xs font-extrabold border-2 transition-all cursor-pointer hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50 ${
                    on ? 'text-white border-white/70' : isFullBundle ? 'text-[#3B1D00] border-white/80' : 'text-[#2A1450] border-[#8B5CF6]/25'
                  }`}
                >
                  {isFullBundle && <Star className="inline w-3 h-3 fill-current mr-1 -mt-0.5" aria-hidden="true" />}
                  {b.label.replace(' ครบ 3 กิจกรรม', '')}{' '}
                  <span className={`tabular-nums font-bold ${on ? 'text-[#FDE68A]' : isFullBundle ? 'text-[#7C3F00]' : 'text-[#7C3AED]'}`}>{formatBaht(addOnPricePerPerson(candidate))}</span>
                </button>
              );
            })}
            {picked && (
              <button
                type="button"
                onClick={() => onChange({ ...EMPTY_ADD_ONS })}
                className="shrink-0 text-xs font-extrabold text-[#6B5A85] underline underline-offset-4 hover:text-[#2A1450] min-h-[40px] px-2 cursor-pointer"
              >
                ล้าง
              </button>
            )}
          </div>

          <AddOnPicker value={value} onChange={onChange} windTunnelRemaining={windRemaining} showResult={false} />

          {/* Combined total: ticket + activities */}
          <div
            aria-live="polite"
            className={`relative overflow-hidden rounded-[22px] p-3.5 sm:p-4 transition-all ${picked ? (isFull ? 'text-white' : 'text-[#3B1D00]') : 'text-[#2A1450] border-2 border-dashed border-[#8B5CF6]/40 bg-white/80'}`}
            style={
              picked
                ? isFull
                  ? { background: 'linear-gradient(135deg, #4F46E5 0%, #9333EA 55%, #EC4899 100%)', boxShadow: '0 22px 44px -16px rgba(147,51,234,0.55)' }
                  : { background: 'linear-gradient(135deg, #FDE68A 0%, #FBBF24 55%, #FB923C 100%)', boxShadow: '0 18px 36px -16px rgba(245,158,11,0.5)' }
                : undefined
            }
          >
            {picked && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />}
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              <div className="lg:col-span-7 space-y-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-extrabold">
                  <span>บัตร {ticket.name}</span>
                  <span className="tabular-nums">{formatBaht(ticketPrice)} บาท</span>
                  {isDog && <span className="text-[11px] font-bold opacity-75">(ผู้วิ่ง 1 คน + น้องสุนัข 1 ตัว · เพิ่มคน/ตัวได้ในหน้าสมัคร)</span>}
                </p>
                {picked ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <p className="text-sm font-extrabold flex flex-wrap items-center gap-2">
                      <span>+ {addOnLabel(value)}</span>
                      {saving > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white text-[11px] font-extrabold">
                          <Sparkles className="w-3 h-3" aria-hidden="true" /> ประหยัด {formatBaht(saving)}/คน
                        </span>
                      )}
                    </p>
                    <PeopleStepper value={value.people} onChange={(n) => onChange({ ...value, people: n })} dark={isFull} />
                    <span className="text-sm font-extrabold tabular-nums">= {formatBaht(addOnSum)} บาท</span>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-xs font-bold opacity-80">
                    <PawIcon size={14} color="#8B5CF6" />
                    ยังไม่ได้เลือกกิจกรรมเสริม สมัครวิ่งอย่างเดียวได้เลย
                  </p>
                )}
              </div>
              <div className="lg:col-span-5 flex items-center justify-between lg:justify-end gap-4">
                <span className="text-right">
                  <span className="block text-[11px] font-bold opacity-80">รวมทั้งหมด</span>
                  <span className={`block text-3xl sm:text-4xl font-extrabold tabular-nums leading-none ${isFull ? 'text-[#FDE68A]' : ''}`}>
                    {formatBaht(grand)}
                    <span className="text-sm font-bold ml-1">บาท</span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="btn-paw bg-[#FFC928] px-5 sm:px-7 py-3 text-sm sm:text-base min-h-[52px] text-[#2A1450] whitespace-nowrap"
                >
                  {picked ? 'สมัครต่อเลย' : `สมัคร ${ticket.distanceLabel}`}
                </button>
              </div>
            </div>
          </div>

          {/* Details, folded away */}
          <details className="group rounded-2xl bg-white/80 border border-[#8B5CF6]/15">
            <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-3 min-h-[48px] text-sm font-extrabold text-[#2A1450]">
              <span>ดูรายละเอียด · ตารางราคาแพ็กเกจ · รายการปืนที่เลือกได้</span>
              <ChevronDown className="w-5 h-5 shrink-0 text-[#7C3AED] transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4 space-y-5 border-t border-[#8B5CF6]/15 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-sm font-extrabold text-[#7C3AED] mb-1.5">แพ็กเกจ 2 กิจกรรม (ยิงปืน Standard)</h4>
                  <ul className="divide-y divide-[#8B5CF6]/15">
                    {STANDARD_PACKAGES.map((p) => (
                      <li key={p.name} className="py-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-[#2A1450]">{p.name}</span>
                        <span className="text-right shrink-0">
                          <span className="block font-extrabold text-[#7C3AED] tabular-nums">{formatBaht(p.price)} บาท</span>
                          {p.saving && <span className="block text-[11px] font-bold text-[#047857]">ประหยัด {p.saving} บาท</span>}
                        </span>
                      </li>
                    ))}
                    <li className="py-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-[#2A1450]">FULL EXPERIENCE (ครบ 3 กิจกรรม)</span>
                      <span className="text-right shrink-0">
                        <span className="block font-extrabold text-[#7C3AED] tabular-nums">{formatBaht(FULL_EXPERIENCE.price)} บาท</span>
                        <span className="block text-[11px] font-bold text-[#047857]">ประหยัด {FULL_EXPERIENCE.saving} บาท</span>
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#7C3AED] mb-1.5">อัปเกรดเป็นปืน Premium (+{formatBaht(PREMIUM_UPGRADE.extra)} บาท)</h4>
                  <ul className="divide-y divide-[#8B5CF6]/15">
                    {PREMIUM_UPGRADE.packages.map((p) => (
                      <li key={p.name} className="py-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-[#2A1450]">{p.name}</span>
                        <span className="font-extrabold text-[#7C3AED] tabular-nums shrink-0">{formatBaht(p.price)} บาท</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#4B2D78] mb-3">{GUN_NOTE}</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl p-4 border border-white" style={{ background: 'linear-gradient(165deg, #FFFFFF 0%, #F5F3FF 55%, #E9D5FF 100%)', boxShadow: '0 14px 28px -16px rgba(139,92,246,0.4)' }}>
                    <h4 className="font-extrabold text-[#2A1450]">ยิงปืน Standard : {formatBaht(890)} บาท/คน (10 นัด)</h4>
                    <p className="text-xs font-bold text-[#6B5A85] mb-2.5">เลือกได้ 1 กระบอก</p>
                    <div className="space-y-3">
                      {STANDARD_GUNS.map((g) => (
                        <div key={g.title}>
                          <p className="text-sm font-extrabold text-[#7C3AED] mb-1">{g.title}</p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {g.guns.map((gun) => (
                              <li key={gun} className="text-[13px] font-semibold text-[#2A1450] flex gap-2">
                                <PawIcon size={11} color="#C026D3" className="mt-1 shrink-0" />
                                {gun}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs font-bold text-[#B45309] bg-[#FFF3C4] border border-[#F5B800]/60 rounded-xl px-3 py-2">
                      อัปเกรด Red dot sight เพิ่ม {formatBaht(RED_DOT_UPGRADE.price)} บาท (เฉพาะ {RED_DOT_UPGRADE.models})
                    </p>
                  </div>
                  <div className="rounded-2xl p-4 border border-white" style={{ background: 'linear-gradient(165deg, #FFFFFF 0%, #FFFBEB 55%, #FEF08A 100%)', boxShadow: '0 14px 28px -16px rgba(245,158,11,0.45)' }}>
                    <h4 className="font-extrabold text-[#2A1450]">ยิงปืน Premium (ปืนกลมือ) : {formatBaht(1950)} บาท/คน (10 นัด)</h4>
                    <p className="text-xs font-bold text-[#6B5A85] mb-2.5">
                      ปกติ <span className="line-through">{formatBaht(2200)} บาท</span> ลดเหลือ {formatBaht(1950)} บาท
                    </p>
                    <ul className="space-y-1.5">
                      {PREMIUM_GUNS.map((gun) => (
                        <li key={gun} className="text-[13px] font-semibold text-[#2A1450] flex gap-2">
                          <PawIcon size={11} color="#F59E0B" className="mt-1 shrink-0" />
                          {gun}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
