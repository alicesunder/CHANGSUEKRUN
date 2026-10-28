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
  /** Hide the built-in result bar (the page shows its own bar that includes the ticket price) */
  showResult?: boolean;
}

const baht = (n: number) => `${formatBaht(n)} บาท`;

/** Same colour family as the ticket cards: vivid gradient, pastel body, tinted glow. */
export const ADD_ON_THEMES = {
  tower: {
    header: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
    body: 'linear-gradient(165deg, #FFFFFF 0%, #F0FDF9 55%, #CCFBF1 100%)',
    border: 'rgba(16, 185, 129, 0.38)',
    borderActive: '#10B981',
    shadow: '0 14px 28px -14px rgba(16, 185, 129, 0.3), 0 3px 10px -2px rgba(14, 165, 233, 0.1)',
    shadowActive: '0 20px 38px -12px rgba(16, 185, 129, 0.55), 0 0 0 3px rgba(16, 185, 129, 0.25)',
    ink: '#047857',
  },
  gun: {
    header: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)',
    body: 'linear-gradient(165deg, #FFFFFF 0%, #F5F3FF 55%, #E9D5FF 100%)',
    border: 'rgba(139, 92, 246, 0.36)',
    borderActive: '#8B5CF6',
    shadow: '0 14px 28px -14px rgba(139, 92, 246, 0.32), 0 3px 10px -2px rgba(236, 72, 153, 0.1)',
    shadowActive: '0 20px 38px -12px rgba(139, 92, 246, 0.58), 0 0 0 3px rgba(139, 92, 246, 0.25)',
    ink: '#6D28D9',
  },
  wind: {
    header: 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)',
    body: 'linear-gradient(165deg, #FFFFFF 0%, #F0F9FF 55%, #BAE6FD 100%)',
    border: 'rgba(56, 189, 248, 0.42)',
    borderActive: '#0EA5E9',
    shadow: '0 14px 28px -14px rgba(14, 165, 233, 0.32), 0 3px 10px -2px rgba(99, 102, 241, 0.1)',
    shadowActive: '0 20px 38px -12px rgba(14, 165, 233, 0.55), 0 0 0 3px rgba(14, 165, 233, 0.25)',
    ink: '#0369A1',
  },
} as const;

type ThemeKey = keyof typeof ADD_ON_THEMES;

const Gloss: React.FC = () => (
  <>
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
    <span aria-hidden="true" className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/25 blur-2xl" />
  </>
);

const Shimmer: React.FC = () => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
  >
    <span className="absolute -inset-y-12 w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-ticket-shimmer" />
  </span>
);

const TickDot: React.FC<{ on: boolean; ink: string }> = ({ on, ink }) => (
  <span
    aria-hidden="true"
    className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
      on ? 'bg-white scale-110 animate-pop shadow-[0_6px_12px_-2px_rgba(0,0,0,0.3)]' : 'bg-white/60 border-2 border-white'
    }`}
  >
    {on && <Check className="w-3.5 h-3.5 stroke-[3.5]" style={{ color: ink }} />}
  </span>
);

const IconBubble: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="relative z-10 w-11 h-11 shrink-0 rounded-2xl bg-white/95 border-2 border-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)] flex items-center justify-center">
    {children}
  </span>
);

interface ChipProps {
  theme: ThemeKey;
  title: string;
  sub: string;
  price: number;
  icon: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  note?: React.ReactNode;
  onToggle: () => void;
}

/** One tap-to-toggle activity: lights up in its own colour when chosen. */
const Chip: React.FC<ChipProps> = ({ theme, title, sub, price, icon, active, disabled, note, onToggle }) => {
  const t = ADD_ON_THEMES[theme];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={onToggle}
      style={active ? { background: t.header, borderColor: t.borderActive, boxShadow: t.shadowActive } : { background: t.body, borderColor: t.border, boxShadow: t.shadow }}
      className={`group relative text-left rounded-[22px] border-2 overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50 ${
        active ? '-translate-y-0.5' : 'hover:-translate-y-0.5'
      } ${disabled ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
    >
      <Shimmer />
      {active && <Gloss />}
      <TickDot on={active} ink={t.ink} />
      <span className="relative flex items-center gap-3 p-3 pr-10">
        <IconBubble>{icon}</IconBubble>
        <span className="min-w-0 flex-1">
          <span className={`block text-base font-extrabold leading-tight ${active ? 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]' : 'text-[#2A1450]'}`}>{title}</span>
          <span className={`block text-[11.5px] font-semibold leading-snug ${active ? 'text-white/90' : 'text-[#4B2D78]/85'}`}>{sub}</span>
          {note}
        </span>
        <span className="text-right shrink-0">
          <span className={`block text-xl font-extrabold tabular-nums leading-none ${active ? 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]' : ''}`} style={active ? undefined : { color: t.ink }}>
            {formatBaht(price)}
          </span>
          <span className={`block text-[10px] font-bold ${active ? 'text-white/85' : 'text-[#6B5A85]'}`}>บาท / คน</span>
        </span>
      </span>
    </button>
  );
};

const GUN_SEGMENTS: { id: GunLevel; label: string; price?: number }[] = [
  { id: 'none', label: 'ไม่เล่น' },
  { id: 'standard', label: 'Standard', price: 890 },
  { id: 'premium', label: 'Premium', price: 1950 },
];

export const PeopleStepper: React.FC<{ value: number; onChange: (n: number) => void; dark?: boolean }> = ({ value, onChange, dark }) => (
  <div className="flex items-center gap-1.5" role="group" aria-label="จำนวนคนที่ร่วมกิจกรรมเสริม">
    <button
      type="button"
      aria-label="ลดจำนวนคน"
      disabled={value <= 1}
      onClick={() => onChange(Math.max(1, value - 1))}
      className="w-11 h-11 rounded-full bg-white/95 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.35)] flex items-center justify-center disabled:opacity-40 cursor-pointer"
    >
      <Minus className="w-4 h-4 text-[#2A1450]" />
    </button>
    <span className="min-w-[52px] text-center">
      <span className="block text-2xl font-extrabold tabular-nums leading-none">{value}</span>
      <span className={`block text-[11px] font-bold ${dark ? 'text-white/80' : 'text-[#7C3F00]'}`}>คน</span>
    </span>
    <button
      type="button"
      aria-label="เพิ่มจำนวนคน"
      disabled={value >= MAX_ADD_ON_PEOPLE}
      onClick={() => onChange(Math.min(MAX_ADD_ON_PEOPLE, value + 1))}
      className="w-11 h-11 rounded-full bg-white/95 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.35)] flex items-center justify-center disabled:opacity-40 cursor-pointer"
    >
      <Plus className="w-4 h-4 text-[#2A1450]" />
    </button>
  </div>
);

export const AddOnPicker: React.FC<AddOnPickerProps> = ({ value, onChange, windTunnelRemaining = null, showResult = true }) => {
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Chip
          theme="tower"
          title="หอสูง"
          sub="มีครูฝึกดูแล · ได้ใบประกาศ/ปีก"
          price={350}
          active={value.tower}
          onToggle={() => set({ tower: !value.tower })}
          icon={<TowerControl className="w-5 h-5 text-[#047857]" aria-hidden="true" />}
        />

        {/* ยิงปืน: choose a level */}
        <div
          role="radiogroup"
          aria-label="ยิงปืน"
          style={gunOn ? { background: gun.header, borderColor: gun.borderActive, boxShadow: gun.shadowActive } : { background: gun.body, borderColor: gun.border, boxShadow: gun.shadow }}
          className={`group relative rounded-[22px] border-2 overflow-hidden transition-all duration-300 ${gunOn ? '-translate-y-0.5' : 'hover:-translate-y-0.5'}`}
        >
          <Shimmer />
          {gunOn && <Gloss />}
          <TickDot on={gunOn} ink={gun.ink} />
          <div className="relative flex items-center gap-3 p-3 pb-2 pr-10">
            <IconBubble>
              <Crosshair className="w-5 h-5" style={{ color: gun.ink }} aria-hidden="true" />
            </IconBubble>
            <span className="min-w-0 flex-1">
              <span className={`block text-base font-extrabold leading-tight ${gunOn ? 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]' : 'text-[#2A1450]'}`}>ยิงปืน</span>
              <span className={`block text-[11.5px] font-semibold leading-snug ${gunOn ? 'text-white/90' : 'text-[#4B2D78]/85'}`}>ครูฝึกส่วนตัวดูแลใกล้ชิด · 10 นัด</span>
            </span>
          </div>
          <div className="relative grid grid-cols-3 gap-1.5 px-3 pb-3">
            {GUN_SEGMENTS.map((o) => {
              const on = value.gun === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set({ gun: o.id })}
                  className={`min-h-[46px] px-1.5 py-1 rounded-xl text-center leading-tight transition-all border-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50 cursor-pointer ${
                    on
                      ? 'bg-white text-[#2A1450] border-white shadow-[0_8px_14px_-6px_rgba(0,0,0,0.4)]'
                      : gunOn
                        ? 'bg-white/20 text-white border-white/40 hover:bg-white/30'
                        : 'bg-white/80 text-[#2A1450] border-[#8B5CF6]/20 hover:border-[#8B5CF6]/60'
                  }`}
                >
                  <span className="block text-[12.5px] font-extrabold">{o.label}</span>
                  {o.price && (
                    <span className={`block text-[11px] font-bold tabular-nums ${on ? 'text-[#7C3AED]' : ''}`}>
                      {formatBaht(o.price)}
                      {o.id === 'premium' && <span className="ml-1 text-[9.5px] line-through opacity-70">2,200</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Chip
          theme="wind"
          title="อุโมงค์ลม"
          sub="เปิดรับสมัครล่วงหน้า"
          price={990}
          active={value.windTunnel && !windFull}
          disabled={windFull}
          onToggle={() => set({ windTunnel: !value.windTunnel })}
          icon={<Wind className="w-5 h-5 text-[#0369A1]" aria-hidden="true" />}
          note={
            <span
              className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold shadow-[0_4px_10px_-4px_rgba(0,0,0,0.35)] ${
                windFull ? 'bg-slate-300 text-slate-700' : windLow ? 'bg-gradient-to-r from-[#FF7A59] to-[#FF4E88] text-white' : 'bg-white/95 text-[#0369A1]'
              }`}
            >
              {windFull ? 'เต็มแล้ว' : windTunnelRemaining === null ? `จำกัด ${WIND_TUNNEL_LIMIT} ท่าน` : `เหลือ ${windTunnelRemaining} / ${WIND_TUNNEL_LIMIT} ที่`}
            </span>
          }
        />
      </div>

      {windShort && (
        <p role="alert" className="text-sm font-bold text-rose-700 bg-rose-50 border-2 border-rose-300 rounded-xl px-3 py-2">
          อุโมงค์ลมเหลือเพียง {windTunnelRemaining} ที่ กรุณาลดจำนวนคนหรือเอาอุโมงค์ลมออก
        </p>
      )}

      {showResult && (
        <div
          aria-live="polite"
          style={
            picked
              ? isFull
                ? { background: 'linear-gradient(135deg, #4F46E5 0%, #9333EA 55%, #EC4899 100%)', boxShadow: '0 22px 44px -16px rgba(147,51,234,0.55)' }
                : { background: 'linear-gradient(135deg, #FDE68A 0%, #FBBF24 55%, #FB923C 100%)', boxShadow: '0 18px 36px -16px rgba(245,158,11,0.5)' }
              : undefined
          }
          className={`relative overflow-hidden rounded-[22px] p-3.5 sm:p-4 transition-all ${
            picked ? (isFull ? 'text-white' : 'text-[#3B1D00]') : 'bg-white/80 border-2 border-dashed border-[#8B5CF6]/40'
          }`}
        >
          {picked && <Gloss />}
          {!picked ? (
            <p className="flex items-center gap-2 text-sm font-extrabold text-[#6B5A85]">
              <PawIcon size={16} color="#8B5CF6" />
              แตะเลือกกิจกรรมที่สนใจ ยิ่งเลือกหลายอย่างยิ่งคุ้ม!
            </p>
          ) : (
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-extrabold leading-snug flex flex-wrap items-center gap-2">
                  {isFull && <Star className="w-4 h-4 fill-current" aria-hidden="true" />}
                  {addOnLabel(value)}
                  {saving > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white text-[11px] font-extrabold">
                      <Sparkles className="w-3 h-3" aria-hidden="true" /> ประหยัด {baht(saving)}
                    </span>
                  )}
                </p>
                <p className={`text-xs font-bold ${isFull ? 'text-white/85' : 'text-[#7C3F00]'}`}>ราคาต่อคน {baht(perPerson)}</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <PeopleStepper value={value.people} onChange={(n) => set({ people: n })} dark={isFull} />
                <span className="text-right">
                  <span className={`block text-3xl font-extrabold tabular-nums leading-none ${isFull ? 'text-[#FDE68A]' : ''}`}>{formatBaht(total)}</span>
                  <span className="block text-[11px] font-bold opacity-80">บาท · กิจกรรมเสริม</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
