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
  /** Used inside the registration form (3 columns from the sm breakpoint) */
  compact?: boolean;
}

const baht = (n: number) => `${formatBaht(n)} บาท`;

/** Colour themes in the same family as the ticket cards: vivid gradient header, pastel body, tinted glow. */
export const ADD_ON_THEMES = {
  tower: {
    header: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
    body: 'linear-gradient(165deg, #FFFFFF 0%, #F0FDF9 55%, #CCFBF1 100%)',
    border: 'rgba(16, 185, 129, 0.38)',
    borderActive: '#10B981',
    shadow: '0 18px 38px -14px rgba(16, 185, 129, 0.26), 0 4px 12px -2px rgba(14, 165, 233, 0.1)',
    shadowActive: '0 26px 50px -12px rgba(16, 185, 129, 0.5), 0 0 0 3px rgba(16, 185, 129, 0.28)',
    ink: '#047857',
  },
  gun: {
    header: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)',
    body: 'linear-gradient(165deg, #FFFFFF 0%, #F5F3FF 55%, #E9D5FF 100%)',
    border: 'rgba(139, 92, 246, 0.36)',
    borderActive: '#8B5CF6',
    shadow: '0 18px 38px -14px rgba(139, 92, 246, 0.27), 0 4px 12px -2px rgba(236, 72, 153, 0.1)',
    shadowActive: '0 26px 50px -12px rgba(139, 92, 246, 0.52), 0 0 0 3px rgba(139, 92, 246, 0.28)',
    ink: '#6D28D9',
  },
  wind: {
    header: 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)',
    body: 'linear-gradient(165deg, #FFFFFF 0%, #F0F9FF 55%, #BAE6FD 100%)',
    border: 'rgba(56, 189, 248, 0.42)',
    borderActive: '#0EA5E9',
    shadow: '0 18px 38px -14px rgba(14, 165, 233, 0.27), 0 4px 12px -2px rgba(99, 102, 241, 0.1)',
    shadowActive: '0 26px 50px -12px rgba(14, 165, 233, 0.5), 0 0 0 3px rgba(14, 165, 233, 0.28)',
    ink: '#0369A1',
  },
} as const;

type ThemeKey = keyof typeof ADD_ON_THEMES;

/** Glossy light on a coloured header: thin highlight, soft glow, optional hover shimmer */
const HeaderShine: React.FC = () => (
  <>
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
    <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
    <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-white/15 blur-2xl" />
  </>
);

const Shimmer: React.FC = () => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
  >
    <span className="absolute -inset-y-12 w-28 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-ticket-shimmer" />
  </span>
);

const Tick: React.FC<{ on: boolean; color: string }> = ({ on, color }) => (
  <span
    aria-hidden="true"
    className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
      on ? 'bg-white scale-110 animate-pop shadow-[0_6px_14px_-2px_rgba(0,0,0,0.3)]' : 'bg-white/25 border-2 border-white/80'
    }`}
  >
    {on && <Check className="w-4 h-4 stroke-[3.5]" style={{ color }} />}
  </span>
);

interface ToggleCardProps {
  theme: ThemeKey;
  title: string;
  desc: string;
  price: number;
  icon: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  /** Short facts shown as a tick list (only things from the official info sheet) */
  perks?: string[];
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  onToggle: () => void;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ theme, title, desc, price, icon, active, disabled, perks, badge, footer, onToggle }) => {
  const t = ADD_ON_THEMES[theme];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={onToggle}
      style={{ background: t.body, borderColor: active ? t.borderActive : t.border, boxShadow: active ? t.shadowActive : t.shadow }}
      className={`group relative text-left rounded-[26px] border-2 overflow-hidden flex flex-col transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50 ${
        active ? '-translate-y-1.5' : 'hover:-translate-y-1'
      } ${disabled ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer active:translate-y-0'}`}
    >
      <Shimmer />
      <span style={{ background: t.header }} className="relative flex items-center gap-3 px-4 pt-4 pb-4 text-white">
        <HeaderShine />
        <Tick on={active} color={t.ink} />
        <span className="relative z-10 w-12 h-12 shrink-0 rounded-2xl bg-white/95 border-2 border-white shadow-[0_10px_20px_-6px_rgba(0,0,0,0.3)] flex items-center justify-center">
          {icon}
        </span>
        <span className="relative z-10 text-xl font-extrabold leading-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.22)] pr-9">{title}</span>
      </span>
      <span className="relative z-10 flex flex-col gap-2.5 p-4 flex-1">
        <span className="text-[13px] font-semibold text-[#4B2D78] leading-snug">{desc}</span>
        {perks && (
          <span className="flex flex-col gap-1.5 flex-1">
            {perks.map((perk) => (
              <span key={perk} className="flex items-start gap-2 text-[13px] font-bold text-[#2A1450] leading-snug">
                <span
                  aria-hidden="true"
                  className="mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-white shadow-[0_4px_8px_-3px_rgba(0,0,0,0.35)]"
                  style={{ background: t.header }}
                >
                  <Check className="w-3 h-3 stroke-[3.5]" />
                </span>
                {perk}
              </span>
            ))}
          </span>
        )}
        {!perks && <span className="flex-1" />}
        {badge}
        <span
          className="self-start inline-flex items-baseline gap-1 px-3.5 py-1.5 rounded-full bg-white/95 border border-white shadow-[0_6px_14px_-6px_rgba(42,20,80,0.25)] font-extrabold tabular-nums"
          style={{ color: t.ink }}
        >
          <span className="text-lg">{formatBaht(price)}</span>
          <span className="text-[11px] font-bold text-[#6B5A85]">บาท / คน</span>
        </span>
        {footer}
      </span>
    </button>
  );
};

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
  const gunOn = value.gun !== 'none';
  const gun = ADD_ON_THEMES.gun;

  const windFull = windTunnelRemaining !== null && windTunnelRemaining <= 0;
  const windShort = windTunnelRemaining !== null && value.windTunnel && value.people > windTunnelRemaining && !windFull;
  const windLow = windTunnelRemaining !== null && windTunnelRemaining > 0 && windTunnelRemaining <= 10;
  const windPct = windTunnelRemaining === null ? 0 : Math.round(((WIND_TUNNEL_LIMIT - windTunnelRemaining) / WIND_TUNNEL_LIMIT) * 100);

  return (
    <div className="space-y-5">
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-3' : 'md:grid-cols-3'} gap-4 sm:gap-5`}>
        {/* หอสูง */}
        <ToggleCard
          theme="tower"
          title="หอสูง"
          desc="กิจกรรมความสูง ภายใต้การดูแลของครูฝึก"
          perks={['มีครูฝึกดูแลตลอดกิจกรรม', 'ผู้ร่วมกิจกรรมได้รับใบประกาศ / ปีก']}
          price={350}
          active={value.tower}
          onToggle={() => set({ tower: !value.tower })}
          icon={<TowerControl className="w-6 h-6 text-[#047857]" aria-hidden="true" />}
        />

        {/* ยิงปืน */}
        <div
          role="radiogroup"
          aria-label="ยิงปืน"
          style={{ background: gun.body, borderColor: gunOn ? gun.borderActive : gun.border, boxShadow: gunOn ? gun.shadowActive : gun.shadow }}
          className={`group relative rounded-[26px] border-2 overflow-hidden flex flex-col transition-all duration-300 ${gunOn ? '-translate-y-1.5' : 'hover:-translate-y-1'}`}
        >
          <Shimmer />
          <div style={{ background: gun.header }} className="relative flex items-center gap-3 px-4 pt-4 pb-4 text-white">
            <HeaderShine />
            <Tick on={gunOn} color={gun.ink} />
            <span className="relative z-10 w-12 h-12 shrink-0 rounded-2xl bg-white/95 border-2 border-white shadow-[0_10px_20px_-6px_rgba(0,0,0,0.3)] flex items-center justify-center">
              <Crosshair className="w-6 h-6" style={{ color: gun.ink }} aria-hidden="true" />
            </span>
            <span className="relative z-10 text-xl font-extrabold leading-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.22)] pr-9">ยิงปืน</span>
          </div>
          <div className="relative z-10 p-4 flex flex-col gap-2.5 flex-1">
            <span className="text-[13px] font-semibold text-[#4B2D78] leading-snug">มีครูฝึกส่วนตัวดูแลใกล้ชิด · เลือกระดับที่ชอบ</span>
            <div className="grid gap-2">
              {GUN_OPTIONS.map((o) => {
                const on = value.gun === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set({ gun: o.id })}
                    style={on ? { background: o.id === 'none' ? '#FFFFFF' : gun.header, borderColor: gun.borderActive, boxShadow: '0 10px 20px -8px rgba(139,92,246,0.55)' } : undefined}
                    className={`min-h-[52px] px-3.5 py-2 rounded-2xl border-2 text-left flex items-center justify-between gap-2 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50 cursor-pointer ${
                      on ? (o.id === 'none' ? 'text-[#2A1450]' : 'text-white') : 'bg-white/90 border-white hover:border-[#8B5CF6]/60 text-[#2A1450]'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-extrabold leading-tight">{o.label}</span>
                      <span className={`block text-[11px] font-semibold leading-tight ${on && o.id !== 'none' ? 'text-white/85' : 'text-[#4B2D78]/75'}`}>{o.sub}</span>
                    </span>
                    {o.price && (
                      <span className={`text-sm font-extrabold tabular-nums shrink-0 text-right ${on ? 'text-white' : ''}`} style={on ? undefined : { color: gun.ink }}>
                        {formatBaht(o.price)}
                        {o.id === 'premium' && (
                          <span className={`block text-[10px] font-bold line-through ${on ? 'text-white/70' : 'text-[#6F6878]'}`}>2,200</span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* อุโมงค์ลม */}
        <ToggleCard
          theme="wind"
          title="อุโมงค์ลม"
          desc="ลอยตัวกลางสายลมในอุโมงค์ลม"
          perks={['เปิดรับสมัครล่วงหน้า', `รับจำกัดสูงสุด ${WIND_TUNNEL_LIMIT} คน`]}
          price={990}
          active={value.windTunnel && !windFull}
          disabled={windFull}
          onToggle={() => set({ windTunnel: !value.windTunnel })}
          icon={<Wind className="w-6 h-6 text-[#0369A1]" aria-hidden="true" />}
          badge={
            <span
              className={`self-start px-3 py-1 rounded-full text-[11px] font-extrabold shadow-[0_6px_12px_-6px_rgba(0,0,0,0.3)] ${
                windFull
                  ? 'bg-slate-300 text-slate-700'
                  : windLow
                    ? 'bg-gradient-to-r from-[#FF7A59] to-[#FF4E88] text-white'
                    : 'bg-white/95 text-[#0369A1] border border-white'
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
              <span aria-hidden="true" className="h-2.5 rounded-full bg-white/90 shadow-inner overflow-hidden">
                <span className="block h-full rounded-full bg-gradient-to-r from-[#38BDF8] via-[#6366F1] to-[#EC4899]" style={{ width: `${windPct}%` }} />
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
        style={
          picked
            ? isFull
              ? { background: 'linear-gradient(135deg, #4F46E5 0%, #9333EA 55%, #EC4899 100%)', boxShadow: '0 26px 50px -16px rgba(147,51,234,0.55)' }
              : { background: 'linear-gradient(135deg, #FDE68A 0%, #FBBF24 55%, #FB923C 100%)', boxShadow: '0 22px 44px -16px rgba(245,158,11,0.5)' }
            : undefined
        }
        className={`relative overflow-hidden rounded-[26px] p-4 sm:p-5 transition-all ${
          picked ? (isFull ? 'text-white' : 'text-[#3B1D00]') : 'bg-white/80 border-2 border-dashed border-[#8B5CF6]/40'
        }`}
      >
        {picked && <HeaderShine />}
        {!picked ? (
          <p className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#6B5A85]">
            <PawIcon size={18} color="#8B5CF6" />
            แตะการ์ดด้านบนเพื่อเลือกกิจกรรม ยิ่งเลือกหลายอย่างยิ่งคุ้ม!
          </p>
        ) : (
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              {isFull && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FDE68A] to-[#FBBF24] text-[#3B1D00] text-xs font-extrabold shadow-[0_6px_14px_-4px_rgba(0,0,0,0.35)]">
                  <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> FULL EXPERIENCE ครบ 3 กิจกรรม
                </span>
              )}
              <p className="text-base sm:text-lg font-extrabold leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]">{addOnLabel(value)}</p>
              <p className={`text-xs sm:text-sm font-bold ${isFull ? 'text-white/85' : 'text-[#7C3F00]'}`}>
                ราคาต่อคน {baht(perPerson)}
                {saving > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white text-[11px] font-extrabold shadow-[0_6px_12px_-4px_rgba(0,0,0,0.3)]">
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
                  className="w-11 h-11 rounded-full bg-white/95 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.35)] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-4 h-4 text-[#2A1450]" />
                </button>
                <span className="min-w-[60px] text-center">
                  <span className="block text-2xl font-extrabold tabular-nums leading-none">{value.people}</span>
                  <span className={`block text-[11px] font-bold ${isFull ? 'text-white/80' : 'text-[#7C3F00]'}`}>คน</span>
                </span>
                <button
                  type="button"
                  aria-label="เพิ่มจำนวนคน"
                  disabled={value.people >= MAX_ADD_ON_PEOPLE}
                  onClick={() => set({ people: Math.min(MAX_ADD_ON_PEOPLE, value.people + 1) })}
                  className="w-11 h-11 rounded-full bg-white/95 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.35)] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#2A1450]" />
                </button>
              </div>
              <div className="text-right">
                <span className={`block text-[11px] font-bold ${isFull ? 'text-white/80' : 'text-[#7C3F00]'}`}>รวมกิจกรรมเสริม</span>
                <span className={`block text-3xl sm:text-4xl font-extrabold tabular-nums leading-none drop-shadow-[0_3px_8px_rgba(0,0,0,0.2)] ${isFull ? 'text-[#FDE68A]' : 'text-[#3B1D00]'}`}>
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
