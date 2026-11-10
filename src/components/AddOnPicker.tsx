import React from 'react';
import { Check, Crosshair, ExternalLink, MapPin, Plus, Sparkles, Star, TowerControl, Wind } from 'lucide-react';
import { ACTIVITY_LOCATIONS, type ActivityLocation } from '../data/activityLocations';
import { showActivitySticker } from './ActivitySticker';
import { motion } from 'motion/react';
import { SelectBurst } from './SelectBurst';
import {
  AddOnPerson,
  AddOnSelection,
  EMPTY_ADD_ONS,
  GunLevel,
  addOnCounts,
  addOnGross,
  fromPersons,
  personHasAny,
  personsOf,
  WIND_TUNNEL_LIMIT,
  addOnLabel,
  addOnPricePerPerson,
  formatBaht,
  LONG_GUN_PRICE,
  SHORT_GUN_PRICE,
  TOWER_GUN_HOURS,
  hasAddOns,
} from '../data/addOns';
import { PawIcon } from './brand/DogDecor';
import { useLang } from '../i18n/lang';

interface AddOnPickerProps {
  value: AddOnSelection;
  onChange: (next: AddOnSelection) => void;
  /** Wind-tunnel seats still free (null = unknown yet) */
  windTunnelRemaining?: number | null;
  /** Hide the built-in result bar (the page shows its own bar that includes the ticket price) */
  showResult?: boolean;
  /** 'rows' stacks the three activities full width (for narrow columns) */
  layout?: 'grid' | 'rows';
  /** the runners of the order (more than one = every runner picks their own activities) */
  runnerNames?: string[];
}

const baht = (n: number) => `${formatBaht(n)} บาท`;
const EMPTY_PERSON_LOCAL: AddOnPerson = { tower: false, gun: 'none', windTunnel: false };

/** One strong colour per activity: the sticker panel, the badge and the selected state all share it. */
const ADD_ON_PALETTE = {
  panel: 'linear-gradient(160deg, #8B5CF6 0%, #6D28D9 55%, #4B1FA8 100%)',
  soft: '#FFFFFF',
  on: 'linear-gradient(165deg, #FFF8DC 0%, #FFE9A6 100%)',
  border: '#D9C9EF',
  borderActive: '#FFB300',
  ink: '#4B1FA8',
  chip: '#F1EAFD',
  button: 'linear-gradient(180deg, #FFD84D, #FFB300)',
  glow: 'rgba(255, 179, 0, 0.55)',
  ring: 'rgba(255, 179, 0, 0.30)',
} as const;
export const ADD_ON_THEMES = { tower: ADD_ON_PALETTE, gun: ADD_ON_PALETTE, wind: ADD_ON_PALETTE } as const;

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
  const { t: tr } = useLang();
  const t = ADD_ON_THEMES[theme];
  return (
    <div
      style={{
        background: active ? t.on : t.soft,
        borderColor: active ? t.borderActive : t.border,
        boxShadow: active ? `0 14px 28px -14px ${t.glow}, 0 0 0 3px ${t.ring}` : '0 8px 28px rgba(42,20,80,0.10)',
      }}
      className={`relative flex h-full flex-col rounded-[20px] border transition-all duration-300 ${active ? '-translate-y-0.5' : ''} ${disabled ? 'opacity-60 grayscale' : ''}`}
    >
      <SelectBurst active={active} count={16} className="left-1/2 top-1/2" spread={0.8} />
      <span aria-hidden="true" className="block h-1.5 shrink-0 rounded-t-[19px] bg-gradient-to-r from-[#4B1FA8] via-[#7C3AED] to-[#FFC928]" />
      {active && (
        <span className="absolute top-3.5 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black shadow-md" style={{ color: t.ink }}>
          <Check className="w-3.5 h-3.5 stroke-[3.5]" aria-hidden="true" /> {tr('เลือกแล้ว', 'Selected')}
        </span>
      )}
      <div className="flex-1 p-3.5 flex flex-col gap-2.5">
        <div className={`flex items-center gap-3 ${active ? "pr-20" : ""}`}>
          <motion.span
            animate={active ? { y: [0, -14, 0], rotate: [0, -10, 8, 0], scale: [1, 1.25, 1] } : { y: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 0.7, type: 'spring', stiffness: 260, damping: 11 }}
            className="shrink-0 w-[76px] h-[76px] sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-[#F1EAFD] to-[#FFF4D1] flex items-center justify-center p-1"
          >
            {icon}
          </motion.span>
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

const PriceTag: React.FC<{ price: number; listPrice?: number; ink: string }> = ({ price, listPrice, ink }) => {
  const { t: tr } = useLang();
  return (
  <span className="flex items-baseline gap-1.5 flex-wrap">
    {listPrice !== undefined && <s className="text-sm font-bold text-[#6B5A85]/80 decoration-2 decoration-rose-500">{formatBaht(listPrice)}</s>}
    <span className="text-[26px] leading-none font-black tabular-nums" style={{ color: listPrice !== undefined ? '#E11D48' : ink }}>
      {formatBaht(price)}
    </span>
    <span className="text-xs font-extrabold text-[#6B5A85]">{tr('บาท / คน', 'THB / person')}</span>
  </span>
  );
};

/** The big tap target of an activity: says what a tap will do. */
const PickButton: React.FC<{ theme: ThemeKey; active: boolean; disabled?: boolean; label: string; onClick: () => void }> = ({ theme, active, disabled, label, onClick }) => {
  const { t: tr } = useLang();
  const t = ADD_ON_THEMES[theme];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${active ? tr('ยกเลิก', 'Remove') : tr('เลือก', 'Pick')} ${label}`}
      disabled={disabled}
      onClick={onClick}
      style={active ? { background: '#fff', color: t.ink, borderColor: t.borderActive } : { background: t.button, color: '#261247', borderColor: 'transparent', boxShadow: '0 6px 14px -6px rgba(255,179,0,0.7)' }}
      className="flex-1 min-w-[170px] min-h-[48px] px-3 rounded-full border-2 text-[15px] font-black flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50"
    >
      {active ? (
        <>
          <Check className="w-5 h-5 stroke-[3.5]" aria-hidden="true" /> {tr('เลือกแล้ว · แตะเพื่อยกเลิก', 'Selected · tap to remove')}
        </>
      ) : (
        <>
          <Plus className="w-5 h-5 stroke-[3.5]" aria-hidden="true" /> {tr('เลือกกิจกรรมนี้', 'Pick this activity')}
        </>
      )}
    </button>
  );
};

// Tap a level to pick it, tap the picked level again to cancel (same as the other activities).
const GUN_SEGMENTS: { id: Exclude<GunLevel, 'none'>; label: string; price: number; note: string; noteEn: string }[] = [
  { id: 'standard', label: 'ปืนสั้น', price: SHORT_GUN_PRICE, note: 'ปืนสั้น + กระสุน 10 นัด · เลือก 1 กระบอก', noteEn: 'Short gun + 10 rounds · choose 1' },
  { id: 'premium', label: 'ปืนยาว', price: LONG_GUN_PRICE, note: 'ปืนยาว + กระสุน 10 นัด · เลือก 1 กระบอก', noteEn: 'Long gun + 10 rounds · choose 1' },
];


/** Opens the activity's pin in Google Maps. Sits under the card, not inside it (a link can't live inside the card's button). */
const PinLink: React.FC<{ id: ActivityLocation['id'] }> = ({ id }) => {
  const { t: tr } = useLang();
  const loc = ACTIVITY_LOCATIONS.find((a) => a.id === id);
  if (!loc) return null;
  return (
    <a
      href={loc.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="self-start inline-flex items-center gap-1 min-h-[44px] px-1 text-[12px] font-extrabold text-[#5B20A8] underline underline-offset-2 hover:text-[#2A1450]"
    >
      <MapPin className="w-3.5 h-3.5" style={{ color: loc.color }} aria-hidden="true" />
      {tr('ดูตำแหน่ง', 'Directions to')} {tr(loc.name, ({ gun: 'the shooting range', tower: 'the high tower', wind: 'the wind tunnel', resort: 'the resort' } as Record<string, string>)[loc.id] || loc.name)}
      <ExternalLink className="w-3 h-3" aria-hidden="true" />
    </a>
  );
};

export const AddOnPicker: React.FC<AddOnPickerProps> = ({ value, onChange, windTunnelRemaining = null, showResult = true, layout = 'grid', runnerNames }) => {
  const { t: tr } = useLang();
  const n = runnerNames && runnerNames.length > 1 ? runnerNames.length : 1;
  const multi = n > 1;
  const [activeRaw, setActive] = React.useState(0);
  const active = Math.min(activeRaw, n - 1);
  // one entry per runner; an order picked before the extra runners were added only has the first
  const ps: AddOnPerson[] = Array.from({ length: n }, (_, i) => personsOf(value)[i] ?? { ...EMPTY_PERSON_LOCAL });
  const cur: AddOnPerson = multi ? ps[active] : { tower: value.tower, gun: value.gun, windTunnel: value.windTunnel };
  // activities are per person; with one runner the count stays 1
  const set = (patch: Partial<AddOnPerson>) => {
    if (!multi) {
      onChange({ ...value, ...patch, people: 1, persons: undefined });
      return;
    }
    const next = ps.map((p, i) => (i === active ? { ...p, ...patch } : p));
    onChange(next.some(personHasAny) ? fromPersons(next) : { ...EMPTY_ADD_ONS });
  };
  const picked = hasAddOns(value);
  const off = 0;
  const perPerson = addOnPricePerPerson(cur);
  const total = addOnGross(value);
  const counts = addOnCounts(value);
  const isFull = value.tower && value.gun !== 'none' && value.windTunnel;
  const gunOn = cur.gun !== 'none';

  const windFull = windTunnelRemaining !== null && windTunnelRemaining <= 0;
  const windShort = windTunnelRemaining !== null && counts.wind > windTunnelRemaining && !windFull;
  const windLow = windTunnelRemaining !== null && windTunnelRemaining > 0 && windTunnelRemaining <= 10;

  return (
    <div className="space-y-3 @container">
      {multi && (
        <div className="fx-live-soft relative overflow-hidden rounded-3xl border-[3px] border-[#2A1450] bg-gradient-to-br from-[#FFF3C4] via-[#FFE9A6] to-[#FFD34D] p-3 shadow-[0_5px_0_#2A1450] sm:p-4">
          {/* notice sign */}
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="fx-ring relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#2A1450] bg-[#7C3AED] text-2xl shadow-[0_3px_0_#2A1450]">
              👥
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#2A1450] bg-[#EF4444] text-[11px] font-black text-white">!</span>
            </span>
            <div className="min-w-0">
              <p className="text-base font-black leading-tight text-[#2A1450] sm:text-xl">{tr('📢 เลือกกิจกรรมให้ "แต่ละคน" ได้แยกกัน!', '📢 Each runner can pick their own activities!')}</p>
              <p className="mt-0.5 text-xs font-bold leading-snug text-[#4B2D78] sm:text-sm">{tr('แตะชื่อด้านล่างเพื่อสลับคน แล้วเลือกหอสูง · ยิงปืน · อุโมงค์ลม ให้คนนั้น (ไม่ต้องเหมือนกัน)', 'Tap a name below to switch runner, then pick tower · shooting · wind tunnel for them (they can differ)')}</p>
            </div>
          </div>
          <div role="tablist" aria-label={tr('ผู้วิ่งแต่ละคน', 'Each runner')} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ps.map((p, i) => {
              const on = i === active;
              const chosen = (p.tower ? 1 : 0) + (p.gun !== 'none' ? 1 : 0) + (p.windTunnel ? 1 : 0);
              const label = runnerNames![i] || `${tr('คนที่', 'Runner')} ${i + 1}`;
              // nudge: somebody has nothing yet and is not the one being edited
              const nudge = !on && !chosen;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  className={`relative flex min-h-[56px] cursor-pointer items-center justify-between gap-2 rounded-2xl border-[3px] px-3.5 py-2 text-left font-black transition-transform active:scale-[0.98] ${on ? 'border-[#2A1450] bg-[#7C3AED] text-white shadow-[0_4px_0_#2A1450]' : 'border-[#2A1450]/70 bg-white text-[#4B2D78] hover:-translate-y-0.5'}`}
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-extrabold opacity-80">{on ? tr('✏️ กำลังเลือกให้', '✏️ Choosing for') : tr('แตะเพื่อเลือกให้', 'Tap to choose for')}</span>
                    <span className="block truncate text-base sm:text-lg">👤 {label}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${chosen ? 'bg-emerald-600 text-white' : nudge ? 'bg-[#EF4444] text-white' : 'bg-[#EFE5FF] text-[#6B5A85]'}`}>{chosen ? `✓ ${chosen} ${tr('อย่าง', 'item(s)')}` : nudge ? tr('ยังไม่ได้เลือก', 'not chosen') : tr('ไม่เล่น', 'none')}</span>
                  {nudge && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 w-4"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EF4444] opacity-75" /><span className="relative inline-flex h-4 w-4 rounded-full bg-[#EF4444]" /></span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* three columns only when the box itself is wide enough (the box is narrow inside the booking window) */}
      <div className={layout === 'rows' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 @[620px]:grid-cols-3 gap-3 sm:gap-4'}>
        <div className="flex flex-col gap-1">
          <Card theme="tower" title={tr('หอสูง', 'High tower')} tagline={tr('มีครูฝึกดูแลตลอดกิจกรรม', 'An instructor looks after you throughout')} perks={[tr('🧑‍🏫 ครูฝึกดูแล', '🧑‍🏫 Instructor'), tr('📜 ได้ใบประกาศ / ปีก', '📜 Certificate / wings'), tr('🕘 ' + TOWER_GUN_HOURS, '🕘 09.00–12.00')]} active={cur.tower} icon={<img src="/images/shop/tower-v2.webp" alt="" loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />}>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <PriceTag price={350 - off} listPrice={off ? 350 : undefined} ink={ADD_ON_THEMES.tower.ink} />
            <PickButton
              theme="tower"
              label={tr('หอสูง', 'High tower')}
              active={cur.tower}
              onClick={() => {
                if (!cur.tower) showActivitySticker('tower');
                set({ tower: !cur.tower });
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
            title={tr('ยิงปืน', 'Shooting')}
            tagline={tr('ครูฝึกส่วนตัวดูแลใกล้ชิด', 'A personal instructor by your side')}
            perks={[tr('🎯 กระสุน 10 นัด', '🎯 10 rounds'), tr('🕘 ' + TOWER_GUN_HOURS, '🕘 09.00–12.00')]}
            active={gunOn}
            icon={<img src="/images/shop/shoot-v2.webp" alt="" loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />}
          >
            <div role="radiogroup" aria-label={tr('ยิงปืน', 'Shooting')} className="grid grid-cols-1 gap-2">
              {GUN_SEGMENTS.map((o) => {
                const on = cur.gun === o.id;
                const g = ADD_ON_THEMES.gun;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={on ? `ยิง${o.label} (แตะอีกครั้งเพื่อยกเลิก)` : `ยิง${o.label}`}
                    onClick={() => {
                      if (!on) showActivitySticker(o.id === 'premium' ? 'gunPremium' : 'gun', `ยิง${o.label} · เลือกแล้ว!`);
                      set({ gun: on ? 'none' : o.id });
                    }}
                    style={on ? { background: g.button, color: '#261247', borderColor: 'transparent', boxShadow: '0 4px 10px -4px rgba(255,179,0,0.7)' } : { background: '#fff', color: g.ink, borderColor: g.border }}
                    className="min-h-[56px] px-3 py-1.5 rounded-2xl border-[2.5px] flex items-center justify-between gap-2 text-left cursor-pointer active:translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7B3FC6]/50"
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-black leading-tight">
                        {on && '✓ '}
                        {o.label}
                      </span>
                      <span className={`block text-[11.5px] font-bold leading-tight ${on ? 'text-white/90' : 'text-[#6B5A85]'}`}>{tr(o.note, o.noteEn)}</span>
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      {off > 0 && <s className={`block text-[11px] font-bold ${on ? 'text-white/70' : 'text-[#6B5A85]/70'}`}>{formatBaht(o.price)}</s>}
                                            <span className="block text-xl font-black leading-none">{formatBaht(o.price - off)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="rounded-xl bg-[#FFF7DB] border border-[#FFC928]/60 px-2.5 py-1.5 text-[11.5px] font-extrabold leading-snug text-[#7A4B00]">{tr('หมายเหตุ : แพ็กเกจเริ่มต้น 10 นัด สามารถซื้อกระสุนเพิ่มเติมได้ ณ สนามยิงปืน', 'Note: the starter package is 10 rounds; extra ammunition can be bought at the shooting range')}</p>
            <p className="text-xs font-extrabold text-[#6B5A85]">{gunOn ? tr('แตะที่เลือกอีกครั้งเพื่อยกเลิก', 'Tap the selected option again to remove it') : tr('เลือกปืนสั้นหรือปืนยาว · ราคาต่อคน (บาท)', 'Choose short or long gun · price per person (THB)')}</p>
          </Card>
          <PinLink id="gun" />
        </div>

        <div className="flex flex-col gap-1">
          <Card
            theme="wind"
            title={tr('อุโมงค์ลม', 'Wind tunnel')}
            tagline={tr('ลอยตัวกลางอุโมงค์ลม · เปิดรับสมัครล่วงหน้า', 'Float in the wind tunnel · early registration')}
            perks={[tr('🌪️ ลอยตัวในอุโมงค์ลม', '🌪️ Fly in the wind tunnel')]}
            active={cur.windTunnel && !windFull}
            disabled={windFull}
            icon={<img src="/images/shop/wind-v2.webp" alt="" loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />}
            badge={
              <span
                className={`self-start inline-block px-3 py-1 rounded-full text-xs font-black shadow-[0_4px_10px_-4px_rgba(0,0,0,0.35)] ${
                  windFull ? 'bg-slate-300 text-slate-700' : windLow ? 'bg-gradient-to-r from-[#FF7A59] to-[#FF4E88] text-white' : 'bg-white text-[#075985] border-2 border-[#7DD3FC]'
                }`}
              >
                {windFull ? tr('เต็มแล้ว', 'Full') : windTunnelRemaining === null ? tr(`จำกัด ${WIND_TUNNEL_LIMIT} ท่าน`, `Limited to ${WIND_TUNNEL_LIMIT} people`) : tr(`เหลือ ${windTunnelRemaining} / ${WIND_TUNNEL_LIMIT} ที่`, `${windTunnelRemaining} / ${WIND_TUNNEL_LIMIT} seats left`)}
              </span>
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <PriceTag price={990 - off} listPrice={off ? 990 : undefined} ink={ADD_ON_THEMES.wind.ink} />
            <PickButton
              theme="wind"
              label={tr('อุโมงค์ลม', 'Wind tunnel')}
              active={cur.windTunnel && !windFull}
              disabled={windFull}
              onClick={() => {
                if (!cur.windTunnel) showActivitySticker('wind');
                set({ windTunnel: !cur.windTunnel });
              }}
            />
            </div>
          </Card>
          <PinLink id="wind" />
        </div>
      </div>

      {windShort && (
        <p role="alert" className="text-sm font-bold text-rose-700 bg-rose-50 border-2 border-rose-300 rounded-xl px-3 py-2">
          {tr(`อุโมงค์ลมเหลือเพียง ${windTunnelRemaining} ที่ กรุณาเอาอุโมงค์ลมออก`, `Only ${windTunnelRemaining} wind-tunnel seats left — please remove the wind tunnel`)}
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
              {tr('แตะเลือกกิจกรรมที่สนใจ ซื้อ 2 อย่างลด 10% · 3 อย่างลด 15% · 4–5 อย่างลด 20%', 'Tap the activities you like — 2 items 10% off, 3 items 15%, 4–5 items 20%')}
            </p>
          ) : (
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-extrabold leading-snug flex flex-wrap items-center gap-2">
                  {isFull && <Star className="w-4 h-4 fill-current" aria-hidden="true" />}
                  {addOnLabel(value)}
                </p>
                <p className={`text-xs font-bold ${isFull ? 'text-white/85' : 'text-[#7C3F00]'}`}>{multi ? `${tr('รวม', 'Total for')} ${counts.people} ${tr('คน', 'people')}` : `${tr('ราคาต่อคน', 'Price per person')} ${baht(perPerson)}`}</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                                <span className="text-right">
                  <span className={`block text-3xl font-extrabold tabular-nums leading-none ${isFull ? 'text-[#FDE68A]' : ''}`}>{formatBaht(total)}</span>
                  <span className="block text-[11px] font-bold opacity-80">{tr('บาท · กิจกรรมเสริม', 'THB · activities')}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
