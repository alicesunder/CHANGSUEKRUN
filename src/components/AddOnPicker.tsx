import React from 'react';
import { Check, Crosshair, Minus, Plus, Sparkles, Star, TowerControl, Wind } from 'lucide-react';
import {
  AddOnSelection,
  GunLevel,
  MAX_ADD_ON_PEOPLE,
  WIND_TUNNEL_LIMIT,
  addOnLabel,
  addOnPricePerPerson,
  addOnSavingPerPerson,
  addOnTotal,
  formatBaht,
  hasAddOns,
} from '../data/addOns';
import { PawIcon } from './brand/DogDecor';

interface AddOnPickerProps {
  value: AddOnSelection;
  onChange: (next: AddOnSelection) => void;
  /** Wind-tunnel seats still free (null = unknown yet) */
  windTunnelRemaining?: number | null;
  /** Smaller paddings for use inside the registration form */
  compact?: boolean;
}

const baht = (n: number) => `${formatBaht(n)} บาท`;

/** The "check mark" bubble shown on a chosen card */
const Tick: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    aria-hidden="true"
    className={`absolute top-3 right-3 w-8 h-8 rounded-full border-[3px] border-[#2A1450] flex items-center justify-center transition-all ${
      on ? 'bg-[#FFC928] scale-110 animate-pop' : 'bg-white'
    }`}
  >
    {on && <Check className="w-4 h-4 text-[#2A1450] stroke-[3.5]" />}
  </span>
);

interface ToggleCardProps {
  title: string;
  desc: string;
  price: number;
  icon: React.ReactNode;
  tint: string;
  active: boolean;
  disabled?: boolean;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  onToggle: () => void;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ title, desc, price, icon, tint, active, disabled, badge, footer, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    disabled={disabled}
    onClick={onToggle}
    className={`relative text-left rounded-[26px] border-[3px] p-4 pt-5 min-h-[168px] flex flex-col gap-2 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50 ${tint} ${
      active
        ? 'border-[#2A1450] shadow-[0_6px_0_#2A1450] -translate-y-1'
        : 'border-[#2A1450]/35 shadow-[0_3px_0_rgba(42,20,80,0.25)] hover:-translate-y-0.5 hover:border-[#2A1450]'
    } ${disabled ? 'opacity-55 cursor-not-allowed grayscale' : 'cursor-pointer active:translate-y-0.5'}`}
  >
    <Tick on={active} />
    <span className="w-12 h-12 rounded-2xl bg-white border-[3px] border-[#2A1450] flex items-center justify-center shadow-[0_3px_0_#2A1450]">
      {icon}
    </span>
    <span className="text-lg font-extrabold text-[#2A1450] leading-tight pr-8">{title}</span>
    <span className="text-xs sm:text-[13px] font-semibold text-[#4B2D78] leading-snug flex-1">{desc}</span>
    {badge}
    <span className="mt-1 inline-flex items-baseline gap-1 self-start px-3 py-1 rounded-full bg-white border-2 border-[#2A1450] text-[#54239A] font-extrabold tabular-nums">
      {formatBaht(price)} <span className="text-[11px] font-bold text-[#6F6878]">บาท / คน</span>
    </span>
    {footer}
  </button>
);

const GUN_OPTIONS: { id: GunLevel; label: string; sub: string; price?: number }[] = [
  { id: 'none', label: 'ไม่เล่น', sub: 'ข้ามไปก่อน' },
  { id: 'standard', label: 'Standard', sub: 'ปืนพก / ปืน .22 · 10 นัด', price: 890 },
  { id: 'premium', label: 'Premium', sub: 'ปืนกลมือ · 10 นัด', price: 1950 },
];

export const AddOnPicker: React.FC<AddOnPickerProps> = ({ value, onChange, windTunnelRemaining = null, compact = false }) => {
  const set = (patch: Partial<AddOnSelection>) => onChange({ ...value, ...patch });
  const picked = hasAddOns(value);
  const perPerson = addOnPricePerPerson(value);
  const saving = addOnSavingPerPerson(value);
  const total = addOnTotal(value);
  const isFull = value.tower && value.gun === 'standard' && value.windTunnel;

  const windFull = windTunnelRemaining !== null && windTunnelRemaining <= 0;
  const windShort = windTunnelRemaining !== null && value.windTunnel && value.people > windTunnelRemaining && !windFull;
  const windLow = windTunnelRemaining !== null && windTunnelRemaining > 0 && windTunnelRemaining <= 10;
  const windPct = windTunnelRemaining === null ? 0 : Math.round(((WIND_TUNNEL_LIMIT - windTunnelRemaining) / WIND_TUNNEL_LIMIT) * 100);

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-3' : 'md:grid-cols-3'} gap-4`}>
        {/* หอสูง */}
        <ToggleCard
          title="หอสูง"
          desc="มีครูฝึกดูแลตลอดกิจกรรม ได้ใบประกาศ/ปีกกลับบ้าน"
          price={350}
          tint="bg-[#DFF5E8]"
          active={value.tower}
          onToggle={() => set({ tower: !value.tower })}
          icon={<TowerControl className="w-6 h-6 text-[#166534]" aria-hidden="true" />}
        />

        {/* ยิงปืน */}
        <div
          role="radiogroup"
          aria-label="ยิงปืน"
          className={`relative rounded-[26px] border-[3px] p-4 pt-5 bg-[#EEE4FA] flex flex-col gap-2 transition-all ${
            value.gun !== 'none' ? 'border-[#2A1450] shadow-[0_6px_0_#2A1450] -translate-y-1' : 'border-[#2A1450]/35 shadow-[0_3px_0_rgba(42,20,80,0.25)]'
          }`}
        >
          <Tick on={value.gun !== 'none'} />
          <span className="w-12 h-12 rounded-2xl bg-white border-[3px] border-[#2A1450] flex items-center justify-center shadow-[0_3px_0_#2A1450]">
            <Crosshair className="w-6 h-6 text-[#54239A]" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold text-[#2A1450] leading-tight pr-8">ยิงปืน</span>
          <span className="text-xs sm:text-[13px] font-semibold text-[#4B2D78] leading-snug">มีครูฝึกส่วนตัวดูแลใกล้ชิด · เลือกระดับที่ชอบ</span>
          <div className="grid gap-2 mt-1">
            {GUN_OPTIONS.map((o) => {
              const on = value.gun === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set({ gun: o.id })}
                  className={`min-h-[52px] px-3 py-2 rounded-2xl border-[3px] text-left flex items-center justify-between gap-2 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50 cursor-pointer ${
                    on ? 'bg-[#FFC928] border-[#2A1450] shadow-[0_3px_0_#2A1450]' : 'bg-white border-[#2A1450]/25 hover:border-[#2A1450]'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-extrabold text-[#2A1450] leading-tight">{o.label}</span>
                    <span className="block text-[11px] font-semibold text-[#4B2D78]/80 leading-tight">{o.sub}</span>
                  </span>
                  {o.price && (
                    <span className="text-sm font-extrabold text-[#54239A] tabular-nums shrink-0">
                      {formatBaht(o.price)}
                      {o.id === 'premium' && <span className="block text-[10px] font-bold text-[#6F6878] line-through text-right">2,200</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* อุโมงค์ลม */}
        <ToggleCard
          title="อุโมงค์ลม"
          desc="ลอยตัวกลางสายลม สนุกทั้งครอบครัว (เปิดรับล่วงหน้า)"
          price={990}
          tint="bg-[#DCF1FC]"
          active={value.windTunnel && !windFull}
          disabled={windFull}
          onToggle={() => set({ windTunnel: !value.windTunnel })}
          icon={<Wind className="w-6 h-6 text-[#0E7490]" aria-hidden="true" />}
          badge={
            <span
              className={`self-start px-2.5 py-0.5 rounded-full border-2 border-[#2A1450] text-[11px] font-extrabold ${
                windFull ? 'bg-slate-300 text-slate-700' : windLow ? 'bg-[#EF5350] text-white' : 'bg-white text-[#2A1450]'
              }`}
            >
              {windFull
                ? 'เต็มแล้ว'
                : windTunnelRemaining === null
                  ? `จำกัด ${WIND_TUNNEL_LIMIT} ท่านเท่านั้น`
                  : `เหลือ ${windTunnelRemaining} / ${WIND_TUNNEL_LIMIT} ที่`}
            </span>
          }
          footer={
            windTunnelRemaining !== null && (
              <span aria-hidden="true" className="mt-1 h-2.5 rounded-full bg-white border-2 border-[#2A1450] overflow-hidden">
                <span className="block h-full bg-gradient-to-r from-[#45B9EA] to-[#7B3FC6]" style={{ width: `${windPct}%` }} />
              </span>
            )
          }
        />
      </div>

      {windShort && (
        <p role="alert" className="text-sm font-bold text-rose-700 bg-rose-50 border-2 border-rose-300 rounded-xl px-3 py-2">
          อุโมงค์ลมเหลือเพียง {windTunnelRemaining} ที่ กรุณาลดจำนวนคนหรือเอาอุโมงค์ลมออก
        </p>
      )}

      {/* Result */}
      <div
        aria-live="polite"
        className={`relative overflow-hidden rounded-[26px] border-[3px] border-[#2A1450] p-4 sm:p-5 transition-colors ${
          picked ? (isFull ? 'bg-gradient-to-br from-[#54239A] via-[#6D2FC4] to-[#2A1450] text-white' : 'bg-[#FFF3C4]') : 'bg-white border-dashed'
        }`}
      >
        {!picked ? (
          <p className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#6F6878]">
            <PawIcon size={18} color="#7B3FC6" />
            แตะการ์ดด้านบนเพื่อเลือกกิจกรรม ยิ่งเลือกหลายอย่างยิ่งคุ้ม!
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              {isFull && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC928] text-[#2A1450] text-xs font-extrabold border-2 border-[#2A1450]">
                  <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> FULL EXPERIENCE ครบ 3 กิจกรรม
                </span>
              )}
              <p className={`text-base sm:text-lg font-extrabold leading-snug ${isFull ? 'text-white' : 'text-[#2A1450]'}`}>{addOnLabel(value)}</p>
              <p className={`text-xs sm:text-sm font-bold ${isFull ? 'text-white/80' : 'text-[#6F6878]'}`}>
                ราคาต่อคน {baht(perPerson)}
                {saving > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2EAD62] text-white text-[11px] font-extrabold border-2 border-[#2A1450]">
                    <Sparkles className="w-3 h-3" aria-hidden="true" /> ประหยัด {baht(saving)}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="flex items-center gap-1.5" role="group" aria-label="จำนวนคนที่ร่วมกิจกรรม">
                <button
                  type="button"
                  aria-label="ลดจำนวนคน"
                  disabled={value.people <= 1}
                  onClick={() => set({ people: Math.max(1, value.people - 1) })}
                  className="w-11 h-11 rounded-full bg-white border-[3px] border-[#2A1450] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-4 h-4 text-[#2A1450]" />
                </button>
                <span className="min-w-[64px] text-center">
                  <span className={`block text-xl font-extrabold tabular-nums leading-none ${isFull ? 'text-white' : 'text-[#2A1450]'}`}>{value.people}</span>
                  <span className={`block text-[11px] font-bold ${isFull ? 'text-white/80' : 'text-[#6F6878]'}`}>คน</span>
                </span>
                <button
                  type="button"
                  aria-label="เพิ่มจำนวนคน"
                  disabled={value.people >= MAX_ADD_ON_PEOPLE}
                  onClick={() => set({ people: Math.min(MAX_ADD_ON_PEOPLE, value.people + 1) })}
                  className="w-11 h-11 rounded-full bg-[#FFC928] border-[3px] border-[#2A1450] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#2A1450]" />
                </button>
              </div>
              <div className="text-right">
                <span className={`block text-[11px] font-bold ${isFull ? 'text-white/80' : 'text-[#6F6878]'}`}>รวมกิจกรรมเสริม</span>
                <span className={`block text-3xl font-extrabold tabular-nums leading-none ${isFull ? 'text-[#FFC928]' : 'text-[#54239A]'}`}>
                  {formatBaht(total)}
                  <span className="text-sm font-bold ml-1">บาท</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
