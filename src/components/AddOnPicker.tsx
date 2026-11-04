import React from 'react';
import { Check, Crosshair, ExternalLink, MapPin, Minus, Plus, Sparkles, Star, TowerControl, Wind } from 'lucide-react';
import { ACTIVITY_LOCATIONS, type ActivityLocation } from '../data/activityLocations';
import { showActivitySticker } from './ActivitySticker';
import {
  AddOnSelection,
  DiscountContext,
  GunLevel,
  MAX_ADD_ON_PEOPLE,
  WIND_TUNNEL_LIMIT,
  addOnLabel,
  addOnPricePerPerson,
  EARLY_BIRD_ACTIVITY_OFF,
  addOnSavingPerPerson,
  addOnTotal,
  formatBaht,
  hasAddOns,
} from '../data/addOns';
import { PawIcon } from './brand/DogDecor';

interface AddOnPickerProps {
  /** what else is in the order (decides the bundle discounts) */
  discountCtx?: DiscountContext;
  value: AddOnSelection;
  onChange: (next: AddOnSelection) => void;
  /** Wind-tunnel seats still free (null = unknown yet) */
  windTunnelRemaining?: number | null;
  /** Hide the built-in result bar (the page shows its own bar that includes the ticket price) */
  showResult?: boolean;
  /** 'rows' stacks the three activities full width (for narrow columns) */
  layout?: 'grid' | 'rows';
}

const baht = (n: number) => `${formatBaht(n)} บาท`;

/** One strong colour per activity: the sticker panel, the badge and the selected state all share it. */
export const ADD_ON_THEMES = {
  tower: {
    panel: 'linear-gradient(160deg, #34D399 0%, #10B981 45%, #0EA5E9 100%)',
    soft: 'linear-gradient(165deg, #FFFFFF 0%, #ECFDF5 60%, #D1FAE5 100%)',
    on: 'linear-gradient(165deg, #D1FAE5 0%, #A7F3D0 100%)',
    border: '#6EE7B7',
    borderActive: '#059669',
    ink: '#065F46',
    chip: '#D1FAE5',
    button: 'linear-gradient(180deg, #34D399, #059669)',
    glow: 'rgba(16, 185, 129, 0.5)',
    ring: 'rgba(16, 185, 129, 0.22)',
  },
  gun: {
    panel: 'linear-gradient(160deg, #818CF8 0%, #9333EA 50%, #EC4899 100%)',
    soft: 'linear-gradient(165deg, #FFFFFF 0%, #F5F3FF 60%, #EDE9FE 100%)',
    on: 'linear-gradient(165deg, #EDE9FE 0%, #DDD6FE 100%)',
    border: '#C4B5FD',
    borderActive: '#7C3AED',
    ink: '#5B21B6',
    chip: '#EDE9FE',
    button: 'linear-gradient(180deg, #A78BFA, #7C3AED)',
    glow: 'rgba(124, 58, 237, 0.45)',
    ring: 'rgba(124, 58, 237, 0.22)',
  },
  wind: {
    panel: 'linear-gradient(160deg, #7DD3FC 0%, #38BDF8 45%, #6366F1 100%)',
    soft: 'linear-gradient(165deg, #FFFFFF 0%, #F0F9FF 60%, #E0F2FE 100%)',
    on: 'linear-gradient(165deg, #E0F2FE 0%, #BAE6FD 100%)',
    border: '#7DD3FC',
    borderActive: '#0284C7',
    ink: '#075985',
    chip: '#E0F2FE',
    button: 'linear-gradient(180deg, #38BDF8, #0284C7)',
    glow: 'rgba(14, 165, 233, 0.45)',
    ring: 'rgba(14, 165, 233, 0.22)',
  },
} as const;

type ThemeKey = keyof typeof ADD_ON_THEMES;


const Gloss: React.FC = () => (
  <>
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
    <span aria-hidden="true" className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/25 blur-2xl" />
  </>
);

/** A compact activity card: a colour bar, a small icon, the text and the pick control. (The sticker only pops up when picked.) */
const Card: React.FC<{
  theme: ThemeKey;
  title: string;
  tagline: string;
  perks: string[];
  active: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}> = ({ theme, title, tagline, perks, active, disabled, icon, badge, children }) => {
  const t = ADD_ON_THEMES[theme];
  return (
    <div
      style={{
        background: active ? t.on : t.soft,
        borderColor: active ? t.borderActive : t.border,
        boxShadow: active ? `0 14px 28px -14px ${t.glow}, 0 0 0 3px ${t.ring}` : '0 8px 18px -14px rgba(42,20,80,0.4)',
      }}
      className={`relative flex h-full flex-col overflow-hidden rounded-[22px] border-[3px] transition-all duration-300 ${active ? '-translate-y-0.5' : ''} ${disabled ? 'opacity-60 grayscale' : ''}`}
    >
      <span aria-hidden="true" style={{ background: t.panel }} className="block h-2 shrink-0" />
      {active && (
        <span className="absolute top-3.5 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black shadow-md" style={{ color: t.ink }}>
          <Check className="w-3.5 h-3.5 stroke-[3.5]" aria-hidden="true" /> เลือกแล้ว
        </span>
      )}
      <div className="flex-1 p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center gap-3 pr-20">
          <span style={{ background: t.panel }} className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-[0_6px_12px_-4px_rgba(0,0,0,0.35)]">
            {icon}
          </span>
          <div className="min-w-0">
            <h4 className="text-xl leading-tight font-black" style={{ color: t.ink }}>
              {title}
            </h4>
            <p className="text-[12.5px] font-bold leading-snug text-[#4B2D78]">{tagline}</p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {perks.map((x) => (
            <li key={x} className="rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ background: t.chip, color: t.ink }}>
              {x}
            </li>
          ))}
        </ul>
        {badge}
        <div className="mt-auto">{children}</div>
      </div>
    </div>
  );
};

const PriceTag: React.FC<{ price: number; listPrice?: number; ink: string }> = ({ price, listPrice, ink }) => (
  <span className="flex items-baseline gap-1.5 flex-wrap">
    {listPrice !== undefined && <s className="text-sm font-bold text-[#6B5A85]/80 decoration-2 decoration-rose-500">{formatBaht(listPrice)}</s>}
    <span className="text-[26px] leading-none font-black tabular-nums" style={{ color: listPrice !== undefined ? '#E11D48' : ink }}>
      {formatBaht(price)}
    </span>
    <span className="text-xs font-extrabold text-[#6B5A85]">บาท / คน</span>
  </span>
);

/** The big tap target of an activity: says what a tap will do. */
const PickButton: React.FC<{ theme: ThemeKey; active: boolean; disabled?: boolean; label: string; onClick: () => void }> = ({ theme, active, disabled, label, onClick }) => {
  const t = ADD_ON_THEMES[theme];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${active ? 'ยกเลิก' : 'เลือก'}${label}`}
      disabled={disabled}
      onClick={onClick}
      style={active ? { background: '#fff', color: t.ink, borderColor: t.borderActive } : { background: t.button, color: '#fff', borderColor: '#2A1450', boxShadow: '0 4px 0 #2A1450' }}
      className="flex-1 min-w-[170px] min-h-[48px] px-3 rounded-2xl border-[2.5px] text-[15px] font-black flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50"
    >
      {active ? (
        <>
          <Check className="w-5 h-5 stroke-[3.5]" aria-hidden="true" /> เลือกแล้ว · แตะเพื่อยกเลิก
        </>
      ) : (
        <>
          <Plus className="w-5 h-5 stroke-[3.5]" aria-hidden="true" /> เลือกกิจกรรมนี้
        </>
      )}
    </button>
  );
};

// Tap a level to pick it, tap the picked level again to cancel (same as the other activities).
const GUN_SEGMENTS: { id: Exclude<GunLevel, 'none'>; label: string; price: number; note: string }[] = [
  { id: 'standard', label: 'Standard', price: 890, note: 'เลือกได้ 1 กระบอก' },
  { id: 'premium', label: 'Premium', price: 1950, note: 'HK UMP / KRISS / MP5 SD' },
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

const NO_BUNDLE: DiscountContext = { hasRun: false, hasConcert: false };

/** Opens the activity's pin in Google Maps. Sits under the card, not inside it (a link can't live inside the card's button). */
const PinLink: React.FC<{ id: ActivityLocation['id'] }> = ({ id }) => {
  const loc = ACTIVITY_LOCATIONS.find((a) => a.id === id);
  if (!loc) return null;
  return (
    <a
      href={loc.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="self-start inline-flex items-center gap-1 min-h-[32px] px-1 text-[12px] font-extrabold text-[#5B20A8] underline underline-offset-2 hover:text-[#2A1450]"
    >
      <MapPin className="w-3.5 h-3.5" style={{ color: loc.color }} aria-hidden="true" />
      ดูตำแหน่ง{loc.name}
      <ExternalLink className="w-3 h-3" aria-hidden="true" />
    </a>
  );
};

export const AddOnPicker: React.FC<AddOnPickerProps> = ({ value, onChange, windTunnelRemaining = null, showResult = true, layout = 'grid', discountCtx = NO_BUNDLE }) => {
  const set = (patch: Partial<AddOnSelection>) => onChange({ ...value, ...patch });
  const picked = hasAddOns(value);
  const off = discountCtx.earlyBird ? EARLY_BIRD_ACTIVITY_OFF : 0;
  const perPerson = addOnPricePerPerson(value, discountCtx.earlyBird);
  const saving = addOnSavingPerPerson(value);
  const total = addOnTotal(value, discountCtx);
  const isFull = value.tower && value.gun === 'standard' && value.windTunnel;
  const gunOn = value.gun !== 'none';

  const windFull = windTunnelRemaining !== null && windTunnelRemaining <= 0;
  const windShort = windTunnelRemaining !== null && value.windTunnel && value.people > windTunnelRemaining && !windFull;
  const windLow = windTunnelRemaining !== null && windTunnelRemaining > 0 && windTunnelRemaining <= 10;

  return (
    <div className="space-y-3 @container">
      {/* three columns only when the box itself is wide enough (the box is narrow inside the booking window) */}
      <div className={layout === 'rows' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 @[620px]:grid-cols-3 gap-3 sm:gap-4'}>
        <div className="flex flex-col gap-1">
          <Card theme="tower" title="หอสูง" tagline="มีครูฝึกดูแลตลอดกิจกรรม" perks={['🧑‍🏫 ครูฝึกดูแล', '📜 ได้ใบประกาศ / ปีก']} active={value.tower} icon={<TowerControl className="w-6 h-6" aria-hidden="true" />}>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <PriceTag price={350 - off} listPrice={off ? 350 : undefined} ink={ADD_ON_THEMES.tower.ink} />
            <PickButton
              theme="tower"
              label="หอสูง"
              active={value.tower}
              onClick={() => {
                if (!value.tower) showActivitySticker('tower');
                set({ tower: !value.tower });
              }}
            />
            </div>
          </Card>
          <PinLink id="tower" />
        </div>

        {/* ยิงปืน: choose a level */}
        <div className="flex flex-col gap-1">
          <Card
            theme="gun"
            title="ยิงปืน"
            tagline="ครูฝึกส่วนตัวดูแลใกล้ชิด"
            perks={['🎯 ยิง 10 นัด', '🧑‍🏫 ครูฝึกส่วนตัว']}
            active={gunOn}
            icon={<Crosshair className="w-6 h-6" aria-hidden="true" />}
          >
            <div role="radiogroup" aria-label="ยิงปืน" className="grid grid-cols-1 gap-2">
              {GUN_SEGMENTS.map((o) => {
                const on = value.gun === o.id;
                const g = ADD_ON_THEMES.gun;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={on ? `ยิงปืน ${o.label} (แตะอีกครั้งเพื่อยกเลิก)` : `ยิงปืน ${o.label}`}
                    onClick={() => {
                      if (!on) showActivitySticker(o.id === 'premium' ? 'gunPremium' : 'gun', `ยิงปืน ${o.label} · เลือกแล้ว!`);
                      set({ gun: on ? 'none' : o.id });
                    }}
                    style={on ? { background: g.button, color: '#fff', borderColor: '#2A1450', boxShadow: '0 4px 0 #2A1450' } : { background: '#fff', color: g.ink, borderColor: g.border }}
                    className="min-h-[56px] px-3 py-1.5 rounded-2xl border-[2.5px] flex items-center justify-between gap-2 text-left cursor-pointer active:translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50"
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-black leading-tight">
                        {on && '✓ '}
                        {o.label}
                      </span>
                      <span className={`block text-[11.5px] font-bold leading-tight ${on ? 'text-white/90' : 'text-[#6B5A85]'}`}>{o.note}</span>
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      {off > 0 && <s className={`block text-[11px] font-bold ${on ? 'text-white/70' : 'text-[#6B5A85]/70'}`}>{formatBaht(o.price)}</s>}
                      {off === 0 && o.id === 'premium' && <s className={`block text-[11px] font-bold ${on ? 'text-white/70' : 'text-[#6B5A85]/70'}`}>2,200</s>}
                      <span className="block text-xl font-black leading-none">{formatBaht(o.price - off)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-extrabold text-[#6B5A85]">{gunOn ? 'แตะระดับที่เลือกอีกครั้งเพื่อยกเลิก' : 'เลือกระดับการยิง · ราคาต่อคน (บาท)'}</p>
          </Card>
          <PinLink id="gun" />
        </div>

        <div className="flex flex-col gap-1">
          <Card
            theme="wind"
            title="อุโมงค์ลม"
            tagline="ลอยตัวกลางอุโมงค์ลม · เปิดรับสมัครล่วงหน้า"
            perks={['🌪️ ลอยตัวในอุโมงค์ลม']}
            active={value.windTunnel && !windFull}
            disabled={windFull}
            icon={<Wind className="w-6 h-6" aria-hidden="true" />}
            badge={
              <span
                className={`self-start inline-block px-3 py-1 rounded-full text-xs font-black shadow-[0_4px_10px_-4px_rgba(0,0,0,0.35)] ${
                  windFull ? 'bg-slate-300 text-slate-700' : windLow ? 'bg-gradient-to-r from-[#FF7A59] to-[#FF4E88] text-white' : 'bg-white text-[#075985] border-2 border-[#7DD3FC]'
                }`}
              >
                {windFull ? 'เต็มแล้ว' : windTunnelRemaining === null ? `จำกัด ${WIND_TUNNEL_LIMIT} ท่าน` : `เหลือ ${windTunnelRemaining} / ${WIND_TUNNEL_LIMIT} ที่`}
              </span>
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <PriceTag price={990 - off} listPrice={off ? 990 : undefined} ink={ADD_ON_THEMES.wind.ink} />
            <PickButton
              theme="wind"
              label="อุโมงค์ลม"
              active={value.windTunnel && !windFull}
              disabled={windFull}
              onClick={() => {
                if (!value.windTunnel) showActivitySticker('wind');
                set({ windTunnel: !value.windTunnel });
              }}
            />
            </div>
          </Card>
          <PinLink id="wind" />
        </div>
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
