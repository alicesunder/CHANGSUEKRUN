import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, ChevronDown, Minus, Plus, ShoppingBasket } from 'lucide-react';
import type { RouteId } from '../types';
import { CONCERT_PASS_PRICE, calcTicketTotal, ticketById } from '../data/eventData';
import {
  AddOnSelection,
  EMPTY_ADD_ONS,
  FULL_EXPERIENCE,
  PREMIUM_GUNS,
  STANDARD_GUNS,
  addOnBonusDiscount,
  addOnLabel,
  addOnPricePerPerson,
  addOnTotal,
  formatBaht,
  hasAddOns,
  hasAllThree,
} from '../data/addOns';
import { getPublicConfig } from '../utils/api';
import { AddOnPicker, PeopleStepper } from './AddOnPicker';
import { DiscountCelebration } from './PerkCelebration';
import { LABRADOR_SVG_PATH } from './brand/LabradorMascot';

// ---------------------------------------------------------------------------
// Look & feel shared by the three parts
// ---------------------------------------------------------------------------
const STATIONS = {
  run: { n: 1, emoji: '🏃', title: 'ตั๋ววิ่ง', hint: 'เลือก 1 ระยะ (หรือไม่วิ่งก็ได้)', color: '#7C3AED', soft: '#F3EEFF' },
  concert: { n: 2, emoji: '🎶', title: 'ตั๋วคอนเสิร์ต', hint: 'ริมหาด หลัง 17.30 น.', color: '#F59E0B', soft: '#FFF7DB' },
  addon: { n: 3, emoji: '🎢', title: 'กิจกรรมเสริม', hint: 'ครบ 3 อย่าง ลด 10%', color: '#EC4899', soft: '#FFEFF7' },
} as const;
type StationKey = keyof typeof STATIONS;

const RUN_ORDER: RouteId[] = ['1km', '3km', '5km', '10km'];
const RUN_LOOK: Record<RouteId, { color: string; soft: string; kind: string; perk: string }> = {
  '1km': { color: '#EC4899', soft: '#FFEFF7', kind: 'วิ่งคู่น้องหมา', perk: '🐶 1 คน + 1 น้อง' },
  '3km': { color: '#0D9488', soft: '#E6FBF7', kind: 'วิ่งคู่น้องหมา', perk: '🐶 1 คน + 1 น้อง' },
  '5km': { color: '#0284C7', soft: '#E8F6FF', kind: 'วิ่งบุคคล', perk: '👕 เสื้อ + เหรียญ' },
  '10km': { color: '#7C3AED', soft: '#F3EEFF', kind: 'วิ่งบุคคล', perk: '⏱️ ติดชิปจับเวลา' },
};

const StationCard: React.FC<{ id: string; k: StationKey; done: boolean; children: React.ReactNode; aside?: React.ReactNode }> = ({ id, k, done, children, aside }) => {
  const s = STATIONS[k];
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative scroll-mt-24 sticker bg-white overflow-visible">
      <header
        className="flex items-center gap-3 px-4 sm:px-5 py-3 rounded-t-[25px] border-b-[3px] border-[var(--ink)]"
        style={{ background: `linear-gradient(90deg, ${s.soft} 0%, #FFFFFF 85%)` }}
      >
        <motion.span
          aria-hidden="true"
          animate={done ? { rotate: [0, -12, 12, 0], scale: [1, 1.15, 1] } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-11 h-11 shrink-0 rounded-2xl border-[3px] border-[var(--ink)] flex items-center justify-center text-xl shadow-[0_3px_0_var(--ink)]"
          style={{ background: s.color }}
        >
          {s.emoji}
          <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white border-2 border-[var(--ink)] text-[var(--ink)] text-xs font-black flex items-center justify-center">
            {done ? <Check className="w-3.5 h-3.5 stroke-[3.5] text-emerald-600" /> : s.n}
          </span>
        </motion.span>
        <div className="min-w-0 flex-1">
          <h3 id={`${id}-title`} className="text-lg sm:text-xl font-extrabold text-[var(--ink)] leading-tight">
            {s.title}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-[#6B5A85] leading-snug">{s.hint}</p>
        </div>
        {aside}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
};

const QtyStepper: React.FC<{ value: number; onChange: (n: number) => void; min?: number; max?: number; color: string; label: string }> = ({
  value,
  onChange,
  min = 0,
  max = 9,
  color,
  label,
}) => (
  <div className="inline-flex items-center gap-1.5" role="group" aria-label={label}>
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      aria-label={`ลด${label}`}
      className="w-11 h-11 rounded-2xl border-[3px] border-[var(--ink)] bg-white text-[var(--ink)] flex items-center justify-center shadow-[0_3px_0_var(--ink)] active:translate-y-0.5 active:shadow-none disabled:opacity-35 cursor-pointer"
    >
      <Minus className="w-5 h-5 stroke-[3]" />
    </button>
    <motion.span
      key={value}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className="w-12 text-center text-2xl font-black tabular-nums"
      style={{ color: value > 0 ? 'var(--ink)' : '#9C8FB0' }}
      aria-live="polite"
    >
      {value}
    </motion.span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      aria-label={`เพิ่ม${label}`}
      className="w-11 h-11 rounded-2xl border-[3px] border-[var(--ink)] text-[var(--ink)] flex items-center justify-center shadow-[0_3px_0_var(--ink)] active:translate-y-0.5 active:shadow-none disabled:opacity-35 cursor-pointer"
      style={{ background: color }}
    >
      <Plus className="w-5 h-5 stroke-[3]" />
    </button>
  </div>
);

/** Little dancing equaliser for the concert part. */
const Equaliser: React.FC<{ on: boolean }> = ({ on }) => (
  <span aria-hidden="true" className="inline-flex items-end gap-[3px] h-7">
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className={`w-[5px] rounded-full bg-[#F59E0B] ${on ? 'eq-bar' : ''}`}
        style={{ height: on ? undefined : 8 + (i % 3) * 5, animationDelay: `${i * 0.12}s` }}
      />
    ))}
  </span>
);

// ---------------------------------------------------------------------------
interface TicketShopProps {
  run: RouteId | null;
  onRunChange: (r: RouteId | null) => void;
  concertQty: number;
  onConcertQtyChange: (n: number) => void;
  addOns: AddOnSelection;
  onAddOnsChange: (s: AddOnSelection) => void;
  /** Opens the form with everything chosen here */
  onCheckout: () => void;
  onOpenComparison?: () => void;
  onOpenPace?: () => void;
  onShowMap?: () => void;
}

/** The ticket shop: run, concert and activities — any one, or any mix — with one basket. */
export const TicketShop: React.FC<TicketShopProps> = ({
  run,
  onRunChange,
  concertQty,
  onConcertQtyChange,
  addOns,
  onAddOnsChange,
  onCheckout,
  onOpenComparison,
  onOpenPace,
  onShowMap,
}) => {
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

  const picked = hasAddOns(addOns);
  const allThree = picked && hasAllThree(addOns);
  const runPrice = run ? calcTicketTotal(run, 0, 0) : 0;
  const concertPrice = CONCERT_PASS_PRICE * concertQty;
  const bonus = addOnBonusDiscount(addOns);
  const addOnPrice = addOnTotal(addOns);
  const total = runPrice + concertPrice + addOnPrice;
  const count = (run ? 1 : 0) + (concertQty > 0 ? 1 : 0) + (picked ? 1 : 0);
  const activityCount = (addOns.tower ? 1 : 0) + (addOns.gun !== 'none' ? 1 : 0) + (addOns.windTunnel ? 1 : 0);

  const lines: { key: string; emoji: string; label: string; sub?: string; price: number; onRemove: () => void }[] = [];
  if (run) {
    const t = ticketById(run);
    lines.push({ key: 'run', emoji: '🏃', label: `วิ่ง ${t.distanceLabel}`, sub: RUN_LOOK[run].kind, price: runPrice, onRemove: () => onRunChange(null) });
  }
  if (concertQty > 0) {
    lines.push({ key: 'concert', emoji: '🎶', label: `คอนเสิร์ต × ${concertQty}`, sub: `${formatBaht(CONCERT_PASS_PRICE)} บาท/ใบ`, price: concertPrice, onRemove: () => onConcertQtyChange(0) });
  }
  if (picked) {
    lines.push({
      key: 'addon',
      emoji: '🎢',
      label: `${addOnLabel(addOns)} × ${addOns.people}`,
      sub: bonus > 0 ? `รวมส่วนลด 10% แล้ว (−${formatBaht(bonus)})` : `${formatBaht(addOnPricePerPerson(addOns))} บาท/คน`,
      price: addOnPrice,
      onRemove: () => onAddOnsChange({ ...EMPTY_ADD_ONS }),
    });
  }

  const checkoutBtn = (compact = false) => (
    <button
      type="button"
      onClick={onCheckout}
      disabled={count === 0}
      className={`btn-paw bg-[#FFC928] text-[var(--ink)] flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed ${
        compact ? 'px-4 py-2.5 text-sm min-h-[48px]' : 'w-full px-5 py-3.5 text-base min-h-[56px]'
      }`}
    >
      {count === 0 ? 'เลือกอย่างน้อย 1 อย่าง' : compact ? 'ไปต่อ' : 'ไปกรอกข้อมูล & ชำระเงิน'}
      {count > 0 && <ArrowRight className="w-5 h-5 stroke-[2.5]" />}
    </button>
  );

  return (
    <div className="relative">
      {/* ---------- Heading ---------- */}
      <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-9">
        <motion.img
          src={LABRADOR_SVG_PATH}
          alt=""
          aria-hidden="true"
          className="mx-auto w-16 h-[70px] object-contain"
          animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="inline-block mt-1 px-3 py-1 rounded-full bg-white border-2 border-[var(--ink)] text-xs font-extrabold text-[#7C3AED] tracking-wider shadow-[0_3px_0_var(--ink)]">
          TICKET SHOP
        </span>
        <h2 className="mt-3 font-hero text-3xl sm:text-5xl font-bold text-[var(--ink)] leading-[1.3]">ซื้อบัตรงานวิ่ง</h2>
        <p className="mt-1 text-sm sm:text-base font-bold text-[#4B2D78]">
          เลือกได้ 1, 2 หรือครบ 3 อย่าง <span className="text-[#EC4899]">แล้วจ่ายทีเดียวจบ</span>
        </p>
        <ol className="mt-4 flex flex-wrap justify-center gap-2" aria-label="3 ส่วนของร้าน">
          {(Object.keys(STATIONS) as StationKey[]).map((k) => {
            const s = STATIONS[k];
            const done = k === 'run' ? !!run : k === 'concert' ? concertQty > 0 : picked;
            return (
              <li key={k}>
                <a
                  href={`#shop-${k}`}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full border-[3px] border-[var(--ink)] text-sm font-extrabold shadow-[0_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5"
                  style={{ background: done ? s.color : '#fff', color: done ? '#fff' : 'var(--ink)' }}
                >
                  <span aria-hidden="true">{done ? '✓' : s.n}</span>
                  <span aria-hidden="true">{s.emoji}</span>
                  {s.title}
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start">
        {/* ---------- The three parts ---------- */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          {/* 1. Run */}
          <StationCard
            id="shop-run"
            k="run"
            done={!!run}
            aside={
              run ? (
                <button type="button" onClick={() => onRunChange(null)} className="shrink-0 text-xs font-extrabold text-[#6B5A85] underline underline-offset-4 min-h-[44px] px-2 cursor-pointer">
                  ไม่วิ่ง
                </button>
              ) : null
            }
          >
            <span id="ticket-cards" className="block h-0 scroll-mt-28" aria-hidden="true" />
            <div role="radiogroup" aria-label="เลือกระยะวิ่ง" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {RUN_ORDER.map((id) => {
                const t = ticketById(id);
                const look = RUN_LOOK[id];
                const on = run === id;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onRunChange(on ? null : id)}
                    whileTap={{ scale: 0.94 }}
                    animate={on ? { y: -4 } : { y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="relative text-left rounded-[22px] border-[3px] p-3 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7C3AED]/40"
                    style={{
                      background: on ? look.color : look.soft,
                      borderColor: on ? 'var(--ink)' : `${look.color}55`,
                      boxShadow: on ? '0 5px 0 var(--ink)' : '0 3px 0 rgba(42,20,80,0.12)',
                      color: on ? '#fff' : 'var(--ink)',
                    }}
                  >
                    <AnimatePresence>
                      {on && (
                        <motion.span
                          initial={{ scale: 0, rotate: -40 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-3 -right-2 w-8 h-8 rounded-full bg-[#FFC928] border-[3px] border-[var(--ink)] flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <Check className="w-4 h-4 stroke-[3.5] text-[var(--ink)]" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="flex items-center justify-between gap-1">
                      <span className="text-2xl" aria-hidden="true">{t.emoji}</span>
                      {t.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${on ? 'bg-white/25 text-white' : 'bg-white text-[#6B5A85]'}`}>{t.badge}</span>
                      )}
                    </span>
                    <span className="block mt-1 font-display text-3xl font-black leading-none tabular-nums">{t.distanceLabel}</span>
                    <span className={`block mt-1 text-xs font-extrabold ${on ? 'text-white/90' : ''}`} style={on ? undefined : { color: look.color }}>
                      {look.kind}
                    </span>
                    <span className={`block text-xs font-bold leading-snug ${on ? 'text-white/85' : 'text-[#6B5A85]'}`}>{look.perk}</span>
                    <span className="block mt-2 text-xl font-black tabular-nums">
                      {formatBaht(t.basePrice)}
                      <span className="text-xs font-bold ml-0.5">฿</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[#6B5A85]">
              <span>🐾 Dog Run เพิ่มผู้ร่วมวิ่งได้ในขั้นถัดไป</span>
              {onOpenComparison && (
                <button type="button" onClick={onOpenComparison} className="underline underline-offset-4 text-[#7C3AED] min-h-[44px] cursor-pointer">
                  เปรียบเทียบระยะ
                </button>
              )}
              {onOpenPace && (
                <button type="button" onClick={onOpenPace} className="underline underline-offset-4 text-[#7C3AED] min-h-[44px] cursor-pointer">
                  คำนวณเพซ
                </button>
              )}
              {onShowMap && (
                <button type="button" onClick={onShowMap} className="underline underline-offset-4 text-[#7C3AED] min-h-[44px] cursor-pointer">
                  ดูเส้นทาง
                </button>
              )}
            </div>
          </StationCard>

          {/* 2. Concert */}
          <StationCard id="shop-concert" k="concert" done={concertQty > 0}>
            <span id="concert-pass" className="block h-0 scroll-mt-28" aria-hidden="true" />
            <div
              className="rounded-[22px] border-[3px] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 transition-colors"
              style={{ background: concertQty > 0 ? '#FFF1C2' : '#FFFBEB', borderColor: concertQty > 0 ? 'var(--ink)' : '#F59E0B55' }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-14 h-14 shrink-0 rounded-2xl bg-[var(--ink)] flex items-center justify-center">
                  <Equaliser on={concertQty > 0} />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-extrabold text-[var(--ink)] leading-tight">คอนเสิร์ตริมหาดชะอำ</p>
                  <p className="text-xs sm:text-sm font-bold text-[#6B5A85] leading-snug">ซื้อแยกได้ ไม่ต้องวิ่งก็มาได้ · ซื้อให้ทั้งครอบครัวได้</p>
                  <p className="mt-0.5 text-lg font-black text-[#B45309] tabular-nums">
                    {formatBaht(CONCERT_PASS_PRICE)} <span className="text-xs font-bold">บาท / ใบ</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-xs font-extrabold text-[#6B5A85] sm:hidden">จำนวน</span>
                <QtyStepper value={concertQty} onChange={onConcertQtyChange} color="#FFC928" label="ตั๋วคอนเสิร์ต" />
              </div>
            </div>
          </StationCard>

          {/* 3. Activities */}
          <div className="relative">
            <DiscountCelebration active={allThree} discount={bonus} />
            <div className={`rounded-[31px] p-[3px] transition-all ${allThree ? 'addon-celebrate' : ''}`}>
              <StationCard
                id="shop-addon"
                k="addon"
                done={picked}
                aside={
                  <span className="shrink-0 flex items-center gap-1" aria-label={`เลือกแล้ว ${activityCount} จาก 3 กิจกรรม`}>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={i < activityCount ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                        className={`w-7 h-7 rounded-full border-2 border-[var(--ink)] flex items-center justify-center text-sm ${i < activityCount ? 'bg-[#EC4899]' : 'bg-white'}`}
                        aria-hidden="true"
                      >
                        {i < activityCount ? '🐾' : ''}
                      </motion.span>
                    ))}
                  </span>
                }
              >
                <span id="addons" className="block h-0 scroll-mt-28" aria-hidden="true" />
                <p className={`mb-3 rounded-2xl px-3 py-2 text-sm font-extrabold text-center border-2 ${allThree ? 'bg-[#FFE268] border-[var(--ink)] text-[var(--ink)]' : 'bg-[#FFEFF7] border-[#EC4899]/30 text-[#BE185D]'}`}>
                  {allThree
                    ? '🎉 ครบ 3 กิจกรรมแล้ว! ลดทันที 10%'
                    : activityCount === 2
                      ? 'อีกแค่ 1 กิจกรรม ได้ส่วนลด 10% ทันที!'
                      : 'เลือกครบ 3 กิจกรรม ลดทันที 10% 🎁'}
                </p>
                <AddOnPicker value={addOns} onChange={onAddOnsChange} windTunnelRemaining={windRemaining} showResult={false} layout="rows" />
                <AnimatePresence>
                  {picked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FFEFF7] border-2 border-[#EC4899]/30 px-3.5 py-2.5">
                        <span className="text-sm font-extrabold text-[var(--ink)]">จำนวนคนที่เล่น</span>
                        <PeopleStepper value={addOns.people} onChange={(n) => onAddOnsChange({ ...addOns, people: n })} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <details className="group mt-3 rounded-2xl bg-[#FAF7FF] border-2 border-[var(--ink)]/10">
                  <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-2.5 min-h-[48px] text-sm font-extrabold text-[var(--ink)]">
                    <span>ราคาแพ็กเกจ & รายชื่อปืนที่เลือกได้</span>
                    <ChevronDown className="w-5 h-5 shrink-0 text-[#EC4899] transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-extrabold text-[#BE185D] mb-1">แพ็กเกจ (ต่อคน)</p>
                      <ul className="space-y-1 font-semibold text-[var(--ink)]">
                        <li className="flex justify-between gap-2"><span>หอสูง + ยิงปืน Standard</span><span className="tabular-nums">1,190</span></li>
                        <li className="flex justify-between gap-2"><span>หอสูง + อุโมงค์ลม</span><span className="tabular-nums">1,190</span></li>
                        <li className="flex justify-between gap-2"><span>ยิงปืน Standard + อุโมงค์ลม</span><span className="tabular-nums">1,690</span></li>
                        <li className="flex justify-between gap-2 font-extrabold"><span>ครบ 3 กิจกรรม</span><span className="tabular-nums">{formatBaht(FULL_EXPERIENCE.price)} → {formatBaht(Math.round(FULL_EXPERIENCE.price * 0.9))}</span></li>
                        <li className="flex justify-between gap-2"><span>ครบ 3 + ยิงปืน Premium</span><span className="tabular-nums">3,050 → 2,745</span></li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-extrabold text-[#BE185D] mb-1">ปืน Standard (เลือก 1 กระบอก · 10 นัด)</p>
                      <p className="font-semibold text-[#4B2D78] leading-relaxed">{STANDARD_GUNS.flatMap((g) => g.guns).join(' · ')}</p>
                      <p className="font-extrabold text-[#BE185D] mt-2 mb-1">ปืน Premium</p>
                      <p className="font-semibold text-[#4B2D78] leading-relaxed">{PREMIUM_GUNS.join(' · ')}</p>
                    </div>
                  </div>
                </details>
              </StationCard>
            </div>
          </div>
        </div>

        {/* ---------- Basket: side card on desktop, sticky bar on phones ---------- */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24" aria-label="ตะกร้า">
          <div className="sticker bg-white overflow-hidden">
            <div className="px-5 py-4 bg-[var(--ink)] text-white flex items-center gap-2.5">
              <ShoppingBasket className="w-6 h-6 text-[#FFC928]" aria-hidden="true" />
              <h3 className="text-lg font-extrabold">ตะกร้าของคุณ</h3>
              <span className="ml-auto px-2.5 py-0.5 rounded-full bg-[#FFC928] text-[var(--ink)] text-xs font-black">{count}/3</span>
            </div>
            <div className="p-5">
              {lines.length === 0 ? (
                <div className="text-center py-6">
                  <motion.span
                    className="inline-block text-5xl"
                    animate={{ rotate: [-8, 8, -8] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    aria-hidden="true"
                  >
                    🐶
                  </motion.span>
                  <p className="mt-2 text-sm font-extrabold text-[var(--ink)]">ตะกร้ายังว่างอยู่</p>
                  <p className="text-xs font-bold text-[#6B5A85]">แตะเลือกตั๋วทางซ้ายได้เลย</p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <motion.li
                        key={l.key}
                        layout
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        className="flex items-start gap-2.5"
                      >
                        <span className="w-9 h-9 shrink-0 rounded-xl bg-[#F3EEFF] flex items-center justify-center text-lg" aria-hidden="true">{l.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-[var(--ink)] break-words">{l.label}</span>
                          {l.sub && <span className="block text-xs font-bold text-[#6B5A85]">{l.sub}</span>}
                        </span>
                        <span className="text-right shrink-0">
                          <span className="block text-sm font-black text-[var(--ink)] tabular-nums">{formatBaht(l.price)}</span>
                          <button type="button" onClick={l.onRemove} className="text-xs font-bold text-rose-500 underline underline-offset-2 cursor-pointer min-h-[28px]">
                            เอาออก
                          </button>
                        </span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
              <div className="my-4 border-t-[3px] border-dashed border-[var(--ink)]/15" />
              <div className="flex items-end justify-between mb-4">
                <span className="text-sm font-extrabold text-[#6B5A85]">ยอดรวม</span>
                <motion.span
                  key={total}
                  initial={{ scale: 1.25, color: '#EC4899' }}
                  animate={{ scale: 1, color: '#2A1450' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="text-4xl font-black tabular-nums leading-none"
                >
                  {formatBaht(total)}
                  <span className="text-base font-bold ml-1">บาท</span>
                </motion.span>
              </div>
              {checkoutBtn()}
              <p className="mt-2.5 text-center text-xs font-bold text-[#6B5A85]">ชำระผ่าน PromptPay QR · ได้ตั๋วทันที</p>
            </div>
          </div>
        </aside>

        <div className="lg:hidden sticky bottom-[76px] z-30 -mx-1">
          <div className="sticker bg-white px-3.5 py-2.5 flex items-center gap-3">
            <ShoppingBasket className="w-6 h-6 shrink-0 text-[#7C3AED]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold text-[#6B5A85] break-words">
                {lines.length ? lines.map((l) => l.emoji).join(' ') + ` · ${count} อย่าง` : 'ตะกร้ายังว่าง'}
              </span>
              <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="block origin-left text-xl font-black text-[var(--ink)] tabular-nums leading-tight">
                {formatBaht(total)} <span className="text-xs font-bold">บาท</span>
              </motion.span>
            </span>
            {checkoutBtn(true)}
          </div>
        </div>
      </div>
    </div>
  );
};
