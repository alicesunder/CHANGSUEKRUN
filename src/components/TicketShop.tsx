import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, ChevronDown, Clock, Crown, Droplets, Flame, Medal, Minus, Plus, Shirt, ShoppingBasket, Sparkles, Ticket, Trash2, Zap } from 'lucide-react';
import type { RouteId } from '../types';
import { EarlyBirdPrice } from './EarlyBirdPrice';
import { useEarlyBird, formatOpenAt } from '../utils/earlyBird';
import { useLang } from '../i18n/lang';
import { CONCERT_PASS_PRICE, MAX_VIP_TABLES, VIP_TABLE_PERKS, VIP_TABLE_PRICE, VIP_TABLE_SEATS, calcTicketTotal, concertPassPrice, runBasePrice, vipTablePrice, isDogCategory, routesData, ticketById } from '../data/eventData';
import {
  AddOnSelection,
  BASKET_MAX_ITEMS,
  BASKET_MAX_RATE,
  BASKET_TIERS,
  EMPTY_ADD_ONS,
  LONG_GUNS,
  LONG_GUN_PRICE,
  SHORT_GUNS,
  SHORT_GUN_PRICE,
  activityCount as countActivities,
  addOnLabel,
  addOnPricePerPerson,
  basketRate,
  formatBaht,
  hasAddOns,
  percentOf,
  priceBasket,
} from '../data/addOns';
import { getPublicConfig } from '../utils/api';
import { AddOnPicker } from './AddOnPicker';
import { SelectBurst } from './SelectBurst';
import { DealStrip, DiscountCelebration, SalesOpenNotice } from './PerkCelebration';
import { LABRADOR_SVG_PATH } from './brand/LabradorMascot';
import { PawIcon } from './brand/DogDecor';

// ---------------------------------------------------------------------------
// The three parts share one look: a vivid gradient header ribbon + white body
// ---------------------------------------------------------------------------
const BRAND_HEADER = 'linear-gradient(135deg, #2A1450 0%, #4C1D95 55%, #6D28D9 100%)';
const STATIONS = {
  run: { n: 1, emoji: '🏃', title: 'ตั๋ววิ่ง', titleEn: 'Run ticket', hint: 'เลือก 1 ระยะ (ไม่วิ่งก็ข้ามได้)', hintEn: 'Pick 1 distance (skip it if you are not running)', grad: BRAND_HEADER },
  concert: { n: 2, emoji: '🎶', title: 'ตั๋วคอนเสิร์ต', titleEn: 'Concert ticket', hint: 'ริมหาด Door Open 17.30 น. · เริ่ม 18.00 น. · GA หรือ VIP TABLE · ซื้อแยกได้', hintEn: 'On the beach: Doors open 17:30 · Show starts 18:00 · GA or VIP table · can be bought separately', grad: BRAND_HEADER },
  addon: { n: 3, emoji: '🎢', title: 'กิจกรรมเสริม (เฉพาะบุคคล)', titleEn: 'Activities (individuals only)', hint: 'วันอาทิตย์ที่ 10 ม.ค. 2570 · ยิงปืน + หอสูง 09.00–12.00 · อุโมงค์ลม 13.00–15.00 น.', hintEn: 'Sunday 10 Jan 2027 · shooting + high tower 09:00–12:00 · wind tunnel 13:00–15:00', grad: BRAND_HEADER },
} as const;
type StationKey = keyof typeof STATIONS;

// Ticket colours and details (same as the original collectible ticket cards)
interface TicketLook {
  grad: string;
  headerGrad: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  borderIdle: string;
  shadowIdle: string;
  shadowActive: string;
  badgeBg: string;
  badgeText: string;
  btnGrad: string;
  btnText: string;
  serialCode: string;
  bibPrefix: string;
  startTime: string;
  cutoff: string;
  elevationText: string;
  sub: string;
}

const LOOK: Record<RouteId, TicketLook> = {
  '1km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #FFF6F1 55%, #FFE6D8 100%)',
    headerGrad: 'linear-gradient(135deg, #FF7A59 0%, #FF4E88 100%)',
    accent: '#7C3AED',
    accentDark: '#4B1FA8',
    accentSoft: '#F1EAFD',
    borderIdle: 'rgba(255, 122, 89, 0.45)',
    shadowIdle: '0 18px 38px -14px rgba(255, 90, 95, 0.3)',
    shadowActive: '0 24px 48px -12px rgba(255, 90, 95, 0.5), 0 0 0 4px rgba(255, 90, 95, 0.3)',
    badgeBg: '#FFFFFF',
    badgeText: '#E11D48',
    btnGrad: 'linear-gradient(135deg, #FF7A59 0%, #FF4E88 100%)',
    btnText: '#FFFFFF',
    serialCode: 'CSR27-DOG-01K',
    bibPrefix: '01-XXXX',
    startTime: '17.30 น.',
    cutoff: '30 นาที',
    elevationText: 'เลียบหาดทราย 100%',
    sub: 'เดิน-วิ่งชิลล์ริมหาดกับน้องสุนัขตัวโปรด',
  },
  '3km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #F0FDF9 55%, #CCFBF1 100%)',
    headerGrad: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
    accent: '#7C3AED',
    accentDark: '#4B1FA8',
    accentSoft: '#F1EAFD',
    borderIdle: 'rgba(16, 185, 129, 0.45)',
    shadowIdle: '0 18px 38px -14px rgba(16, 185, 129, 0.3)',
    shadowActive: '0 24px 48px -12px rgba(16, 185, 129, 0.5), 0 0 0 4px rgba(16, 185, 129, 0.3)',
    badgeBg: '#FEF9C3',
    badgeText: '#065F46',
    btnGrad: 'linear-gradient(135deg, #10B981 0%, #0284C7 100%)',
    btnText: '#FFFFFF',
    serialCode: 'CSR27-DOG-03K',
    bibPrefix: '03-XXXX',
    startTime: '17.15 น.',
    cutoff: '60 นาที',
    elevationText: 'เลียบหาด + ทิวสนร่มรื่น',
    sub: 'วิ่งสนุกกำลังดี ไปด้วยกันทั้งคนและน้องสุนัข',
  },
  '5km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #FFFBEB 55%, #FEF08A 100%)',
    headerGrad: 'linear-gradient(135deg, #F59E0B 0%, #FF6B6B 100%)',
    accent: '#7C3AED',
    accentDark: '#4B1FA8',
    accentSoft: '#F1EAFD',
    borderIdle: 'rgba(245, 158, 11, 0.5)',
    shadowIdle: '0 18px 38px -14px rgba(245, 158, 11, 0.3)',
    shadowActive: '0 24px 48px -12px rgba(245, 158, 11, 0.5), 0 0 0 4px rgba(245, 158, 11, 0.32)',
    badgeBg: '#FFFFFF',
    badgeText: '#B45309',
    btnGrad: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
    btnText: '#261247',
    serialCode: 'CSR27-FUN-05K',
    bibPrefix: '05-XXXX',
    startTime: '17.00 น.',
    cutoff: '75 นาที',
    elevationText: 'ทางเรียบ + ชายหาด',
    sub: 'สำหรับผู้เริ่มต้น สายสุขภาพ และครอบครัว',
  },
  '10km': {
    grad: 'linear-gradient(165deg, #FFFFFF 0%, #F5F3FF 55%, #E9D5FF 100%)',
    headerGrad: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)',
    accent: '#7C3AED',
    accentDark: '#4B1FA8',
    accentSoft: '#F1EAFD',
    borderIdle: 'rgba(139, 92, 246, 0.45)',
    shadowIdle: '0 18px 38px -14px rgba(139, 92, 246, 0.3)',
    shadowActive: '0 24px 48px -12px rgba(139, 92, 246, 0.5), 0 0 0 4px rgba(139, 92, 246, 0.32)',
    badgeBg: '#FEF08A',
    badgeText: '#4C1D95',
    btnGrad: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
    btnText: '#FFFFFF',
    serialCode: 'CSR27-PRO-10K',
    bibPrefix: '10-XXXX',
    startTime: '16.30 น.',
    cutoff: '120 นาที',
    elevationText: 'รอบค่ายนเรศวรครบวง',
    sub: 'ท้าทายสถิติใหม่บนเส้นทางชายหาดประวัติศาสตร์',
  },
};

const perks = (isDog: boolean) => [
  { Icon: Shirt, title: isDog ? 'เสื้อ + ผ้าพันคอน้อง' : 'เสื้อวิ่ง Micro-Dry' },
  { Icon: Medal, title: 'เหรียญรางวัล 3D' },
  { Icon: Ticket, title: isDog ? 'BIB คู่ คน+น้อง' : 'ป้าย BIB + ชิปเวลา' },
  { Icon: Droplets, title: isDog ? 'น้ำ & ขนมน้องหมา' : 'อาหาร & เกลือแร่' },
];

const RUN_ORDER: RouteId[] = ['1km', '3km', '5km', '10km'];
const QUICK_LABEL: Record<string, string> = { '1km': 'Dog 1K', '3km': 'Dog 4K', '5km': '5K', '10km': '10K' };

// Price per person of each activity (the basket discount is taken off the whole basket)
const PRICE_TABLE: { name: string; price: number }[] = [
  { name: 'หอสูง', price: 350 },
  { name: 'ยิงปืนสั้น + กระสุน 10 นัด', price: SHORT_GUN_PRICE },
  { name: 'ยิงปืนยาว + กระสุน 10 นัด', price: LONG_GUN_PRICE },
  { name: 'อุโมงค์ลม', price: 990 },
];

// ---------------------------------------------------------------------------
const StationCard: React.FC<{ id: string; k: StationKey; done: boolean; children: React.ReactNode; aside?: React.ReactNode }> = ({ id, k, done, children, aside }) => {
  const { t: tr } = useLang();
  const s = STATIONS[k];
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="relative scroll-mt-24 ds-card"
    >
      <header className="relative overflow-hidden flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 px-4 sm:px-5 py-3 rounded-t-[27px] text-white" style={{ background: s.grad }}>
        <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-6 w-36 h-36 rounded-full bg-white/25 blur-2xl" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
        <motion.span
          aria-hidden="true"
          animate={done ? { rotate: [0, -14, 14, 0], scale: [1, 1.18, 1] } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-11 h-11 shrink-0 rounded-2xl bg-white border border-[var(--ds-line)] flex items-center justify-center text-xl shadow-sm"
        >
          {s.emoji}
          <span
            className="absolute -top-2 -left-2 w-6 h-6 rounded-full border-2 border-[var(--ink)] text-xs font-black flex items-center justify-center"
            style={{ background: done ? '#10B981' : '#FFC928', color: done ? '#fff' : 'var(--ink)' }}
          >
            {done ? <Check className="w-3.5 h-3.5 stroke-[3.5]" /> : s.n}
          </span>
        </motion.span>
        <div className="relative min-w-0 flex-1">
          <h3 id={`${id}-title`} className="text-lg sm:text-xl font-extrabold leading-tight">
            {tr(s.title, s.titleEn)}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-white/90 leading-snug">{tr(s.hint, s.hintEn)}</p>
        </div>
        {aside && <div className="relative w-full sm:w-auto pl-14 sm:pl-0">{aside}</div>}
      </header>
      <div className="p-3.5 sm:p-5">{children}</div>
    </section>
  );
};

/** Each distance keeps the same card but gets its own accent colour, a big number mark and (10K) a premium finish. */
const TIER: Record<RouteId, { from: string; to: string; ink: string; soft: string; mark: string; premium?: boolean }> = {
  '1km': { from: '#FFB300', to: '#FF8A3D', ink: '#B45309', soft: '#FFF1CC', mark: '1' },
  '3km': { from: '#6366F1', to: '#8B5CF6', ink: '#4338CA', soft: '#E8E9FF', mark: '4' },
  '5km': { from: '#7C3AED', to: '#C026D3', ink: '#6D28D9', soft: '#F3E3FF', mark: '5' },
  '10km': { from: '#4B1FA8', to: '#FFC928', ink: '#2A1450', soft: '#EFE6FC', mark: '10', premium: true },
};

/** One run ticket: one calm card style; when picked the whole card turns royal purple with gold. */
const RunTicket: React.FC<{ id: RouteId; on: boolean; onPick: () => void; extra?: number; onAddExtra?: () => void; onRemoveExtra?: () => void }> = ({ id, on, onPick, extra = 0, onAddExtra, onRemoveExtra }) => {
  const earlyBird = useEarlyBird();
  const { t: tr } = useLang();
  const t = ticketById(id);
  const l = LOOK[id];
  const isDog = isDogCategory(id);
  const tier = TIER[id];
  const headDark = on;
  const sub = on ? 'text-white/75' : 'text-[#766A85]';
  return (
    <motion.article
      whileHover={{ y: -4 }}
      animate={on ? { y: -6, rotate: -0.6 } : { y: 0, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 20 }}
      id={`run-ticket-${id}`}
      className="group relative flex flex-col ds-card shrink-0 w-[88%] snap-start sm:w-auto transition-colors duration-300"
      style={
        on
          ? { background: 'linear-gradient(165deg, #2A1450 0%, #4B1FA8 60%, #6D28D9 100%)', borderColor: '#FFC928', boxShadow: '0 0 0 3px rgba(255,201,40,0.55), 0 22px 44px -14px rgba(75,31,168,0.65)' }
          : tier.premium
            ? { borderColor: '#FFC928', borderWidth: 2, boxShadow: '0 0 0 1px rgba(255,201,40,0.4), 0 16px 32px -14px rgba(255,179,0,0.55)' }
            : { borderColor: tier.from + '66' }
      }
    >
      {t.badge && (
        <span className="absolute left-0 top-3 z-10 inline-flex items-center gap-1 rounded-r-full bg-gradient-to-r from-[#FFC928] to-[#FFE268] pl-2.5 pr-3 py-0.5 text-[11px] font-black text-[#2A1450] shadow-sm">
          <Sparkles className="w-3 h-3" />
          {t.badge}
        </span>
      )}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 z-20 h-1.5 rounded-t-[19px]" style={{ background: `linear-gradient(90deg, ${tier.from}, ${tier.to})` }} />
      {tier.premium && !on && (
        <>
          <span className="absolute right-2.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#FFC928] px-2.5 py-0.5 text-[11px] font-black text-[#2A1450] shadow-sm">
            🏅 ท้าทายสุด
          </span>
        </>
      )}

      <div
          className={`relative isolate overflow-hidden rounded-t-[19px] px-4 pt-10 pb-3 text-center ${on ? 'bg-white/5' : ''}`}
          style={on ? undefined : { background: tier.premium ? 'linear-gradient(180deg, #EBDDFB 0%, #FFF2C9 100%)' : `linear-gradient(180deg, ${tier.soft} 0%, #ffffff 100%)` }}
        >
        <span aria-hidden="true" className={`pointer-events-none absolute -right-1 bottom-[-0.35em] -z-10 select-none font-display font-black leading-none ${tier.mark.length > 1 ? 'text-[6.5rem]' : 'text-[8.5rem]'}`} style={{ color: headDark ? '#FFFFFF' : tier.from, opacity: headDark ? 0.09 : 0.12 }}>{tier.mark}</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 shadow-sm ${headDark ? 'bg-[#FFC928] text-[#2A1450]' : tier.premium ? 'text-[#FFC928]' : 'text-white'}`} style={headDark ? undefined : { background: tier.premium ? 'linear-gradient(90deg, #2A1450, #4B1FA8)' : `linear-gradient(90deg, ${tier.from}, ${tier.to})` }}>
          {isDog ? <PawIcon size={14} color={headDark ? '#2A1450' : '#FFFFFF'} /> : <Zap className={`w-3.5 h-3.5 ${headDark ? 'fill-[#2A1450] text-[#2A1450]' : tier.premium ? 'fill-[#FFC928] text-[#FFC928]' : 'fill-white text-white'}`} />}
          <span className="font-display text-2xl font-black leading-none">{t.distanceLabel}</span>
        </span>
        <h4 className={`mt-2.5 font-display text-lg font-black leading-tight break-words ${headDark ? 'text-white' : 'text-[#2A1450]'}`}>{t.name}</h4>
        <p className={`mt-1 text-xs font-semibold leading-snug ${headDark ? 'text-white/75' : 'text-[#766A85]'}`}>{l.sub}</p>
      </div>

      <div className={`flex flex-col items-center gap-1.5 px-4 pt-1 text-sm font-bold ${on ? 'text-white' : 'text-[#281A3B]'}`}>
        <span className="inline-flex items-center gap-2"><Clock className={`w-4 h-4 ${on ? 'text-[#FFC928]' : 'text-[#7C3AED]'}`} />{tr('ปล่อยตัว', 'Start')} {l.startTime}</span>
        <span className="inline-flex items-center gap-2"><Flame className={`w-4 h-4 ${on ? 'text-[#FFC928]' : 'text-[#7C3AED]'}`} />{tr('เวลาจำกัด', 'Cut-off')} {l.cutoff}</span>
        <span className="inline-flex items-center gap-2"><Droplets className={`w-4 h-4 ${on ? 'text-[#FFC928]' : 'text-[#7C3AED]'}`} />{tr('น้ำ', 'Water')} {routesData[id].waterStationCount} {tr('จุด', 'stops')}</span>
      </div>

      <div className="flex-1 px-4 pt-3">
        <div className={`grid ${isDog ? 'grid-cols-3' : 'grid-cols-2'} divide-x rounded-xl py-2.5 ${on ? 'divide-white/15 bg-white/10' : 'divide-[#EDE7F6] bg-gradient-to-b from-[#F6F1FD] to-[#FFF8E1]'}`}>
          {(isDog
            ? [
                { title: 'เสื้อวิ่ง', src: '/images/shop/shirt-v3.webp' },
                { title: 'ผ้าพันคอน้อง', src: '/images/shop/bandana-v3.webp' },
                { title: 'เหรียญ Finisher', src: '/images/shop/medal-v3.webp' },
              ]
            : [
                { title: 'เสื้อวิ่ง Micro-Dry', src: '/images/shop/shirt-v3.webp' },
                { title: 'เหรียญ Finisher', src: '/images/shop/medal-v3.webp' },
              ]
          ).map(({ title, src }, i) => (
            <div key={title} className="flex flex-col items-center gap-1 px-1.5 text-center">
              <motion.img
                src={src}
                alt=""
                loading="lazy"
                animate={on ? { y: [0, -16, 0], rotate: [0, i % 2 ? 14 : -14, 0], scale: [1, 1.35, 1.12] } : { y: 0, rotate: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.12 + i * 0.1, type: 'spring', stiffness: 260, damping: 11 }}
                className={`h-16 w-16 object-contain drop-shadow-[0_4px_5px_rgba(42,20,80,0.3)] ${on ? 'rounded-xl bg-white/90 p-1' : ''}`}
              />
              <span className={`text-[11px] font-extrabold leading-tight ${on ? 'text-white' : 'text-[#281A3B]'}`}>{title}</span>
            </div>
          ))}
        </div>
        <div className={`mt-2 flex items-center justify-between gap-2 rounded-xl border border-dashed px-3 py-1.5 text-xs font-extrabold ${on ? 'border-white/35 bg-white/10 text-white' : 'border-[#D9C9EF] bg-[#FFFCF7] text-[#4B2D78]'}`}>
          {isDog ? (
            <>
              <span>{extra > 0 ? `✓ มีคนที่ 2 (+${t.addPersonPrice}฿)` : 'ไปวิ่งกันหลายคน?'}</span>
              {extra > 0 ? (
                <button type="button" onClick={onRemoveExtra} className="min-h-[34px] cursor-pointer rounded-full border-2 border-white/60 bg-white/15 px-3 py-1 text-xs font-black text-inherit">− เอาออก</button>
              ) : (
                <motion.button
                  type="button"
                  onClick={onAddExtra}
                  animate={{ boxShadow: ['0 0 0 0 rgba(255,201,40,0.65)', '0 0 0 9px rgba(255,201,40,0)'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="min-h-[36px] cursor-pointer rounded-full border-2 border-[#2A1450] bg-gradient-to-b from-[#FFE268] to-[#FFC928] px-3 py-1 text-xs font-black text-[#2A1450]"
                >
                  + เพิ่มคนที่ 2 <span className="tabular-nums">(+{t.addPersonPrice}฿)</span>
                </motion.button>
              )}
            </>
          ) : id === '10km' ? (
            <>
              <span>⏱️ ติดชิปจับเวลา (Timing Chip)</span>
              <span className={on ? 'text-[#FFE268]' : 'text-[#4B1FA8]'}>ทุกคน</span>
            </>
          ) : (
            <>
              <span>เส้นทาง</span>
              <span className={on ? 'text-[#FFE268]' : 'text-[#4B1FA8]'}>{l.elevationText}</span>
            </>
          )}
        </div>
      </div>

      <div className={`mt-3 border-t px-4 pb-4 pt-3 ${on ? 'border-white/20' : 'border-[#EDE7F6]'}`}>
        <div className="mb-2.5 flex items-end justify-between gap-2">
          <span>
            <span className={`block text-xs font-bold ${sub}`}>{tr('ราคาบัตร', 'Ticket price')} ({t.baseLabel})</span>
            <span className={`font-display text-3xl font-black tabular-nums leading-none ${on ? 'text-[#FFE268]' : ''}`} style={on ? undefined : { color: tier.ink }}>
              <EarlyBirdPrice list={t.basePrice} now={runBasePrice(id, earlyBird)} />
            </span>
            <span className={`ml-1 text-xs font-extrabold ${on ? 'text-white' : 'text-[#281A3B]'}`}>{tr('บาท', 'THB')}</span>
          </span>
          <span className={`shrink-0 whitespace-nowrap text-[10px] font-mono font-bold tracking-wider ${on ? 'text-white/50' : 'text-[#766A85]/70'}`}>{l.serialCode}</span>
        </div>
        <motion.button
          type="button"
          role="radio"
          aria-checked={on}
          onClick={onPick}
          whileTap={{ scale: 0.95 }}
          animate={on ? { scale: [1, 1.1, 0.97, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`w-full min-h-[48px] rounded-full px-4 flex items-center justify-center gap-2 font-extrabold text-sm cursor-pointer ${on ? 'bg-white text-[#2A1450] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)]' : 'bg-gradient-to-b from-[#FFD84D] to-[#FFB300] text-[#261247] shadow-[0_6px_14px_-6px_rgba(255,179,0,0.7)]'}`}
        >
          {on ? <Check className="w-4 h-4 stroke-[3]" /> : <Ticket className="w-4 h-4" />}
          <span>{on ? `${tr('เลือกแล้ว', 'Selected')} · ${t.distanceLabel}` : `${tr('เลือกบัตร', 'Pick')} ${t.distanceLabel}`}</span>
        </motion.button>
      </div>

      <SelectBurst active={on} className="left-1/2 bottom-14" />

      <AnimatePresence>
        {on && (
          <motion.span
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: -8 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
            className="absolute right-3 top-3 z-30 px-2.5 py-1 rounded-full bg-[#FFE268] text-xs font-black text-[#2A1450] shadow-lg"
            aria-hidden="true"
          >
            ✓ ปั๊มแล้ว!
          </motion.span>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

const QtyStepper: React.FC<{ value: number; onChange: (n: number) => void; label: string; max?: number }> = ({ value, onChange, label, max = 9 }) => (
  <div className="inline-flex items-center gap-1.5" role="group" aria-label={label}>
    <button
      type="button"
      onClick={() => onChange(Math.max(0, value - 1))}
      disabled={value <= 0}
      aria-label={`ลด${label}`}
      className="w-12 h-12 rounded-2xl border border-[var(--ds-line)] bg-white text-[var(--ink)] flex items-center justify-center shadow-sm active:translate-y-0.5 active:shadow-none disabled:opacity-40 cursor-pointer"
    >
      <Minus className="w-5 h-5 stroke-[3]" />
    </button>
    <motion.span
      key={value}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className="w-12 text-center text-3xl font-black tabular-nums text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]"
      aria-live="polite"
    >
      {value}
    </motion.span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      aria-label={`เพิ่ม${label}`}
      className="w-12 h-12 rounded-2xl border-[3px] border-[var(--ink)] bg-[#FFC928] text-[var(--ink)] flex items-center justify-center shadow-[0_3px_0_var(--ink)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 cursor-pointer"
    >
      <Plus className="w-5 h-5 stroke-[3]" />
    </button>
  </div>
);

const Equaliser: React.FC<{ on: boolean }> = ({ on }) => (
  <span aria-hidden="true" className="inline-flex items-end gap-[3px] h-7">
    {['#FFC928', '#FF6B6B', '#EC4899', '#A78BFA', '#38BDF8'].map((c, i) => (
      <span key={c} className={`w-[5px] rounded-full ${on ? 'eq-bar' : ''}`} style={{ background: c, height: on ? undefined : 8 + (i % 3) * 5, animationDelay: `${i * 0.12}s` }} />
    ))}
  </span>
);

// ---------------------------------------------------------------------------
interface TicketShopProps {
  run: RouteId | null;
  onRunChange: (r: RouteId | null) => void;
  concertQty: number;
  onConcertQtyChange: (n: number) => void;
  vipTables: number;
  onVipTablesChange: (n: number) => void;
  /** extra runners on a Dog Run ticket (the 2nd person…) */
  extraPeople: number;
  onExtraPeopleChange: (n: number) => void;
  addOns: AddOnSelection;
  onAddOnsChange: (s: AddOnSelection) => void;
  /** Opens the form with everything chosen here */
  onCheckout: () => void;
  onOpenComparison?: () => void;
  onOpenPace?: () => void;
  onShowMap?: () => void;
}

/** Lights, colour and music notes that switch on while a concert ticket (GA or VIP) is in the basket. */
const NOTES = [['♪', '8%', '0s', '14px'], ['♫', '24%', '.9s', '-18px'], ['♬', '42%', '1.8s', '10px'], ['♪', '60%', '.4s', '-12px'], ['♫', '78%', '1.3s', '20px'], ['♬', '90%', '2.4s', '-10px']];
const LiveStage: React.FC<{ active: boolean; vip?: boolean }> = ({ active, vip }) => (
  <>
    <SelectBurst active={active} count={34} spread={1.5} className="left-1/2 top-1/2" />
    {active && (
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <span className="fx-aurora" />
        <span className="fx-stagebeam" style={{ left: '4%', background: 'linear-gradient(to bottom, rgba(255,226,104,.8), transparent 80%)' }} />
        <span className="fx-stagebeam" style={{ right: '4%', background: `linear-gradient(to bottom, ${vip ? 'rgba(255,201,40,.8)' : 'rgba(34,211,238,.8)'}, transparent 80%)`, animationDelay: '-1.6s', animationDirection: 'alternate-reverse' }} />
        {NOTES.map(([n, l, d, dx]) => (
          <i key={l} className="fx-note not-italic" style={{ left: l, animationDelay: d, ['--dx' as string]: dx }}>{n}</i>
        ))}
      </span>
    )}
  </>
);

/** The ticket shop: run, concert and activities — any one, or any mix — with one basket. */
export const TicketShop: React.FC<TicketShopProps> = ({
  run,
  onRunChange,
  concertQty,
  onConcertQtyChange,
  vipTables,
  onVipTablesChange,
  extraPeople,
  onExtraPeopleChange,
  addOns,
  onAddOnsChange,
  onCheckout,
  onOpenComparison,
  onOpenPace,
  onShowMap,
}) => {
  const [windRemaining, setWindRemaining] = useState<number | null>(null);
  // the admin's open / close switch (see SalesSwitchCard)
  const [salesClosed, setSalesClosed] = useState(false);
  // "clear the basket" asks twice: the first tap arms it for a few seconds, the second one empties everything
  const [clearArmed, setClearArmed] = useState(false);
  // the pop-up that tells the buyer the 2nd person can pick their own activities
  const [extraTip, setExtraTip] = useState(false);
  useEffect(() => {
    if (!extraTip) return;
    const id = window.setTimeout(() => setExtraTip(false), 10000);
    return () => window.clearTimeout(id);
  }, [extraTip]);
  useEffect(() => {
    if (!clearArmed) return;
    const id = window.setTimeout(() => setClearArmed(false), 4000);
    return () => window.clearTimeout(id);
  }, [clearArmed]);
  const [opensAt, setOpensAt] = useState<string | null>(null);
  const earlyBird = useEarlyBird();
  const { t: tr } = useLang();
  useEffect(() => {
    let alive = true;
    getPublicConfig()
      .then((c) => {
        if (!alive) return;
        setWindRemaining(typeof c.windTunnelRemaining === 'number' ? c.windTunnelRemaining : null);
        setSalesClosed(c.salesOpen === false);
        setOpensAt(c.salesOpensAt || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const picked = hasAddOns(addOns);
  const eligible = !!run;
  const dogRun = !!run && isDogCategory(run);
  const extra = dogRun ? extraPeople : 0;
  useEffect(() => {
    if (!dogRun && extraPeople > 0) onExtraPeopleChange(0);
  }, [dogRun, extraPeople, onExtraPeopleChange]);
  const hasConcert = concertQty > 0 || vipTables > 0;
  const activityCount = countActivities(addOns);
  const concertUnit = concertPassPrice(earlyBird);
  const vipUnit = vipTablePrice(earlyBird);
  // One basket discount: 2 items 10%, 3 items 15%, 4-5 items 20% (data/addOns.ts; the server charges the same)
  const basket = priceBasket({
    runGross: run ? calcTicketTotal(run, extra, 0, earlyBird) : 0,
    hasRun: eligible,
    gaUnit: concertUnit,
    gaQty: concertQty,
    vipUnit,
    vipTables,
    addOns,
  });
  const rate = basket.rate;
  const runPrice = basket.runGross - basket.runOff;
  const concertOff = basket.gaOff;
  const concertUnitOff = concertQty > 0 ? Math.round(concertOff / concertQty) : 0;
  const concertPrice = basket.gaGross - basket.gaOff;
  const vipOff = basket.vipOff;
  const vipUnitOff = vipTables > 0 ? Math.round(vipOff / vipTables) : 0;
  const vipPrice = basket.vipGross - basket.vipOff;
  const bonus = basket.addOff;
  const addOnPrice = basket.addGross - basket.addOff;
  const total = basket.total;
  const totalSaved = basket.saved;
  const count = (run ? 1 : 0) + (hasConcert ? 1 : 0) + (picked ? 1 : 0);
  const items = basket.items;
  const nextTier = BASKET_TIERS.find((t) => t.items > items);
  // what to do next to unlock a better price
  const nudge =
    items === 0
      ? ''
      : nextTier
        ? `เพิ่มอีก ${nextTier.items - items} อย่าง ลด ${percentOf(nextTier.rate)}% ทั้งตะกร้า! 🎁`
        : `ลด ${percentOf(BASKET_MAX_RATE)}% สูงสุดแล้ว! สุดคุ้ม 🎉`;

  const lines: { key: string; emoji: string; tint: string; label: string; sub?: string; price: number; onRemove: () => void }[] = [];
  if (run) {
    const t = ticketById(run);
    lines.push({ key: 'run', emoji: '🏃', tint: LOOK[run].accentSoft, label: `วิ่ง ${t.distanceLabel}`, sub: `${t.name}${extra > 0 ? ` · วิ่ง ${1 + extra} คน` : ''}${basket.runOff > 0 ? ` · ลด ${percentOf(rate)}% (−${formatBaht(basket.runOff)})` : ''}`, price: runPrice, onRemove: () => onRunChange(null) });
  }
  if (concertQty > 0) {
    lines.push({ key: 'concert', emoji: '🎶', tint: '#FEF3C7', label: `คอนเสิร์ต GA × ${concertQty}`, sub: concertOff > 0 ? `ลด ${percentOf(rate)}% เหลือ ${formatBaht(concertUnit - concertUnitOff)} บาท/ใบ (−${formatBaht(concertOff)})` : `${formatBaht(concertUnit)} บาท/ใบ${earlyBird ? ` (Early Bird · ปกติ ${formatBaht(CONCERT_PASS_PRICE)})` : ''}`, price: concertPrice, onRemove: () => onConcertQtyChange(0) });
  }
  if (vipTables > 0) {
    lines.push({ key: 'vip', emoji: '👑', tint: '#FEF3C7', label: `VIP TABLE × ${vipTables}`, sub: `${vipTables * VIP_TABLE_SEATS} ท่าน · ${vipOff > 0 ? `ลด ${percentOf(rate)}% เหลือ ${formatBaht(vipUnit - vipUnitOff)}` : formatBaht(vipUnit)} บาท/โต๊ะ${earlyBird ? ` (Early Bird · ปกติ ${formatBaht(VIP_TABLE_PRICE)})` : ''}`, price: vipPrice, onRemove: () => onVipTablesChange(0) });
  }
  if (picked) {
    lines.push({
      key: 'addon',
      emoji: '🎢',
      tint: '#E0F7FA',
      label: `${addOnLabel(addOns)} × ${addOns.people}`,
      sub: bonus > 0 ? `ลด ${percentOf(rate)}% แล้ว (−${formatBaht(bonus)})` : `${formatBaht(addOnPricePerPerson(addOns, earlyBird))} บาท/คน`,      price: addOnPrice,
      onRemove: () => onAddOnsChange({ ...EMPTY_ADD_ONS }),
    });
  }

  const clearBasket = () => {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }
    setClearArmed(false);
    onRunChange(null);
    onExtraPeopleChange(0);
    onConcertQtyChange(0);
    onVipTablesChange(0);
    onAddOnsChange({ ...EMPTY_ADD_ONS });
  };

  const checkoutBtn = (compact = false) => (
    <button
      type="button"
      onClick={onCheckout}
      disabled={count === 0}
      className={`btn-paw bg-[#FFC928] text-[var(--ink)] flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed ${
        compact ? 'px-4 py-2.5 text-sm min-h-[48px]' : 'w-full px-5 py-3.5 text-base min-h-[56px]'
      }`}
    >
      {count === 0 ? tr('เลือกอย่างน้อย 1 อย่าง', 'Pick at least 1 item') : compact ? tr('ไปต่อ', 'Continue') : tr('ไปกรอกข้อมูล & ชำระเงิน', 'Continue to details & payment')}
      {count > 0 && <ArrowRight className="w-5 h-5 stroke-[2.5]" />}
    </button>
  );

  return (
    <div className="relative rounded-[40px] p-[3px] shadow-[0_30px_70px_-30px_rgba(76,29,149,0.5)]" style={{ background: 'linear-gradient(120deg, #7C3AED, #EC4899 55%, #FFC928)' }}>
      <div className="relative rounded-[36px] px-3 sm:px-6 lg:px-8 py-8 sm:py-10" style={{ background: 'linear-gradient(165deg, #FFFBF1 0%, #FAF5FF 60%, #F5F0FF 100%)' }}>
        {/* party lights (clipped to the frame; the frame itself stays unclipped so the basket can stick) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]">
          <span className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#FFC928]/35 blur-3xl" />
          <span className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-[#7C3AED]/12 blur-3xl" />
          <span className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-[#FFC928]/20 blur-3xl" />
        </div>

        {/* ---------- Heading + deals ---------- */}
        <div className="relative mb-5 sm:mb-6 space-y-3">
          <div className="text-center">
            <h2 className="squiggle squiggle-center font-hero text-4xl sm:text-6xl font-extrabold leading-[1.4]">
              <span className="inline-block px-1 pt-2 pb-1 text-[#1E0B3D] [text-shadow:0_4px_0_#FFC928,0_8px_18px_rgba(42,20,80,0.25)]">{tr('ซื้อบัตรงานวิ่ง', 'Buy tickets')}</span>
            </h2>
            <p className="mt-2 text-sm font-bold text-[#4B2D78]">
              {tr('เลือกได้ 1, 2 หรือครบ 3 อย่าง', 'Pick 1, 2 or all 3')} <span className="text-[#7C3AED]">{tr('แล้วจ่ายทีเดียวจบ', 'and pay once')}</span>
            </p>
          </div>
          <DealStrip chosen={{ run: !!run, concert: hasConcert, tower: addOns.tower, gun: addOns.gun !== 'none', wind: addOns.windTunnel }} />
        </div>
        {salesClosed && (
          <SalesOpenNotice
            opensAt={opensAt}
            en={tr('th', 'en') === 'en'}
            dateText={opensAt ? formatOpenAt(opensAt, tr('th', 'en') === 'en') : ''}
          />
        )}

        <div className="relative grid grid-cols-1 gap-5 lg:gap-7 items-start">
          {/* ---------- The three parts ---------- */}
          <div className="space-y-6">
            {/* 1. Run */}
            <StationCard
              id="shop-run"
              k="run"
              done={!!run}
              aside={
                run ? (
                  <button type="button" onClick={() => onRunChange(null)} className="shrink-0 px-3 min-h-[40px] rounded-full bg-white/25 border-2 border-white/60 text-xs font-extrabold text-white cursor-pointer">
                    ไม่วิ่ง
                  </button>
                ) : null
              }
            >
              <span id="ticket-cards" className="block h-0 scroll-mt-28" aria-hidden="true" />
              <div className="sm:hidden mt-3 grid grid-cols-4 gap-1.5" role="group" aria-label={tr('เลือกระยะอย่างเร็ว', 'Quick pick')}>
                {RUN_ORDER.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onRunChange(run === id ? null : id);
                      requestAnimationFrame(() => document.getElementById('run-ticket-' + id)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }));
                    }}
                    aria-pressed={run === id}
                    className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-center leading-tight cursor-pointer ${run === id ? 'bg-[#FFC928] border-[var(--ink)] text-[var(--ink)]' : 'bg-white border-[var(--ink)]/25 text-[var(--ink)]'}`}
                  >
                    <span className="text-sm font-black">{QUICK_LABEL[id]}</span>
                    <span className="text-[11px] font-extrabold tabular-nums">{runBasePrice(id, earlyBird)}฿</span>
                  </button>
                ))}
              </div>
              <div
                role="radiogroup"
                aria-label="เลือกระยะวิ่ง"
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-3.5 px-3.5 pt-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:pt-2 sm:pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible"
              >
                {RUN_ORDER.map((id) => (
                  <RunTicket
                    key={id}
                    id={id}
                    on={run === id}
                    onPick={() => onRunChange(run === id ? null : id)}
                    extra={run === id ? extra : 0}
                    onAddExtra={() => {
                      if (run !== id) onRunChange(id);
                      onExtraPeopleChange(1);
                      setExtraTip(true);
                    }}
                    onRemoveExtra={() => {
                      onExtraPeopleChange(0);
                      setExtraTip(false);
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[#6B5A85]">
                <span className="sm:hidden">ปัดดูบัตรอื่น →</span>
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
            <StationCard id="shop-concert" k="concert" done={hasConcert}>
              <span id="concert-pass" className="block h-0 scroll-mt-28" aria-hidden="true" />
              <div className="relative lg:grid lg:grid-cols-2 lg:gap-4">
              <DiscountCelebration active={rate > 0 && hasConcert} burstKey={`concert-${items}`} kicker={`ซื้อ ${items} อย่าง 🎁`} headline={`ลดทันที ${percentOf(rate)}%!!!`} discount={totalSaved} pieces={rate >= BASKET_MAX_RATE ? 110 : 60} />
              <div className={`relative overflow-hidden ds-frame-dark bg-gradient-to-br from-[#241047] via-[#341866] to-[#4A1F8F] text-white p-4 sm:p-5 lg:flex lg:flex-col ${concertQty > 0 ? 'fx-live' : ''}`}>
                <LiveStage active={concertQty > 0} />
                <span aria-hidden="true" className="pointer-events-none absolute -top-14 -left-10 w-48 h-48 rounded-full bg-[#FFC928]/30 blur-3xl" />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-[#EC4899]/35 blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-stretch lg:justify-between lg:flex-1 gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-none">
                    <span className="w-24 h-24 shrink-0 flex items-center justify-center">
                      <img src="/images/shop/concert.webp" alt="" loading="lazy" className={`fx-off relative z-10 h-full w-full object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)] ${concertQty > 0 ? 'fx-dance' : ''}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg font-extrabold leading-tight">บัตร GA · คอนเสิร์ตริมหาด</p>
                      <p className="text-xs sm:text-sm font-semibold text-white/85 leading-snug">ไม่ต้องวิ่งก็มาได้ · ซื้อให้ทั้งครอบครัวได้</p>
                      <p className="mt-1 text-2xl font-black text-[#FFD84D] tabular-nums leading-none">
                        {(concertUnitOff > 0 || earlyBird) && <span className="mr-1.5 text-base font-bold text-white/60 line-through">{formatBaht(CONCERT_PASS_PRICE)}</span>}
                        {formatBaht(concertUnit - concertUnitOff)} <span className="text-xs font-bold text-white/85">บาท / ใบ</span>
                        {concertUnitOff > 0 && (
                          <span aria-hidden="true" className="deal-sticker ml-2 align-middle inline-block px-2.5 py-1 rounded-full border-2 border-[var(--ink)] bg-[#FFE268] text-[var(--ink)] text-xs font-black shadow-[0_3px_0_var(--ink)]">
                            ลด {percentOf(rate)}%!
                          </span>
                        )}
                      </p>
                      {rate < BASKET_MAX_RATE && (
                        <p className="mt-1.5 inline-block rounded-full bg-[#FFE268] px-2.5 py-1 text-xs font-extrabold text-[var(--ink)]">
                          🎁 ซื้อหลายอย่างยิ่งลด: 2 อย่าง {percentOf(BASKET_TIERS[0].rate)}% · 3 อย่าง {percentOf(BASKET_TIERS[1].rate)}% · 4–5 อย่าง {percentOf(BASKET_TIERS[2].rate)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 lg:border-t lg:border-white/15 lg:pt-3">
                    <span className="text-xs font-extrabold text-white/80 sm:hidden lg:inline">จำนวนตั๋ว</span>
                    <QtyStepper value={concertQty} onChange={onConcertQtyChange} label="ตั๋วคอนเสิร์ต GA" />
                  </div>
                </div>
              </div>

              {/* VIP table */}
              <div className={`relative mt-3 lg:mt-0 overflow-hidden ds-frame-dark bg-gradient-to-br from-[#1A0B33] via-[#2A1450] to-[#5B2A0E] text-white p-4 sm:p-5 ${vipTables > 0 ? 'fx-live' : ''}`}>
                <LiveStage active={vipTables > 0} vip />
                <span aria-hidden="true" className="pointer-events-none absolute -top-14 -right-10 w-48 h-48 rounded-full bg-[#FFC928]/25 blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-start lg:flex-col lg:items-stretch gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="w-16 h-16 shrink-0 rounded-2xl bg-[#FFC928] border-2 border-[var(--ink)] flex items-center justify-center text-[var(--ink)]" aria-hidden="true">
                      <Crown className="w-8 h-8" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg font-extrabold leading-tight">VIP TABLE</p>
                      <p className="mt-1 text-2xl font-black text-[#FFD84D] tabular-nums leading-none">
                        {(earlyBird || vipUnitOff > 0) && <span className="mr-1.5 text-base font-bold text-white/60 line-through">{formatBaht(VIP_TABLE_PRICE)}</span>}
                        {formatBaht(vipUnit - vipUnitOff)} <span className="text-xs font-bold text-white/85">บาท / โต๊ะ ({VIP_TABLE_SEATS} ท่าน)</span>
                        {vipUnitOff > 0 && (
                          <span aria-hidden="true" className="deal-sticker ml-2 align-middle inline-block px-2.5 py-1 rounded-full border-2 border-[var(--ink)] bg-[#FFE268] text-[var(--ink)] text-xs font-black shadow-[0_3px_0_var(--ink)]">
                            ลด {percentOf(rate)}%!
                          </span>
                        )}
                        {rate < BASKET_MAX_RATE && (
                          <span className="mt-1.5 block w-fit rounded-full bg-[#FFE268] px-2.5 py-1 text-xs font-extrabold leading-snug text-[var(--ink)]">
                            🎁 ซื้อหลายอย่างยิ่งลด: ซื้อเพิ่มอีกอย่างลดทั้งตะกร้า
                          </span>
                        )}
                      </p>
                      <ul className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:text-sm font-semibold leading-snug text-white">
                        {VIP_TABLE_PERKS.map((p) => (
                          <li key={p} className="flex items-start gap-1.5">
                            <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#FFC928] stroke-[3]" aria-hidden="true" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:self-center lg:self-stretch lg:border-t lg:border-white/15 lg:pt-3">
                    <span className="text-xs font-extrabold text-white/80 sm:hidden lg:inline">จำนวนโต๊ะ</span>
                    <QtyStepper value={vipTables} onChange={onVipTablesChange} label="โต๊ะ VIP" max={MAX_VIP_TABLES} />
                  </div>
                </div>
              </div>
              </div>
            </StationCard>

            {/* 3. Activities */}
            <div className="relative">
              <DiscountCelebration active={rate > 0 && picked} burstKey={`addon-${items}`} kicker={`ซื้อ ${items} อย่าง 🎁`} headline={`ลดทันที ${percentOf(rate)}%!!!`} discount={totalSaved} pieces={rate >= BASKET_MAX_RATE ? 110 : 60} />
              <div className={`rounded-[34px] p-[3px] transition-all ${rate > 0 && picked ? 'addon-celebrate' : ''}`}>
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
                          className={`w-7 h-7 rounded-full border-2 border-[var(--ink)] flex items-center justify-center text-sm ${i < activityCount ? 'bg-[#FFC928]' : 'bg-white/80'}`}
                          aria-hidden="true"
                        >
                          {i < activityCount ? '🐾' : ''}
                        </motion.span>
                      ))}
                    </span>
                  }
                >
                  <span id="addons" className="block h-0 scroll-mt-28" aria-hidden="true" />
                  {items >= 1 && <p className={`mb-3 rounded-2xl px-3 py-2 text-sm font-extrabold text-center border-2 ${rate > 0 ? 'bg-[#FFE268] border-[var(--ink)] text-[var(--ink)]' : 'bg-gradient-to-r from-[#E0F7FA] to-[#ECFDF5] border-[#0EA5E9]/30 text-[#0369A1]'}`}>
                    {rate >= BASKET_MAX_RATE
                      ? `🎉🎉 ซื้อ ${items} อย่าง ลด ${percentOf(rate)}% สูงสุดแล้ว! สุดคุ้ม!!!`
                      : rate > 0
                        ? `🎉 ซื้อ ${items} อย่าง ลด ${percentOf(rate)}% แล้ว! ${nudge}`
                        : `เลือกเพิ่มอีกอย่าง ลดทันที ${percentOf(BASKET_TIERS[0].rate)}% ทั้งตะกร้า (3 อย่าง ${percentOf(BASKET_TIERS[1].rate)}% · 4–5 อย่าง ${percentOf(BASKET_TIERS[2].rate)}%) 🎁`}
                  </p>}
                  <AddOnPicker
                    value={addOns}
                    onChange={onAddOnsChange}
                    windTunnelRemaining={windRemaining}
                    showResult={false}
                    layout="grid"
                    runnerNames={extra > 0 ? Array.from({ length: 1 + extra }, (_, i) => `คนที่ ${i + 1}`) : undefined}
                  />
                  <details className="group mt-3 rounded-2xl bg-[#FAF7FF] border-2 border-[var(--ink)]/10">
                    <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-2.5 min-h-[48px] text-sm font-extrabold text-[var(--ink)]">
                      <span>ราคากิจกรรม & รายชื่อปืนที่เลือกได้</span>
                      <ChevronDown className="w-5 h-5 shrink-0 text-[#0EA5E9] transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-extrabold text-[#0369A1] mb-1">ราคาต่อคน (บาท)</p>
                        <table className="w-full font-semibold text-[var(--ink)]">
                          <tbody className="tabular-nums">
                            {PRICE_TABLE.map((p) => (
                              <tr key={p.name}>
                                <td className="py-0.5 pr-2">{p.name}</td>
                                <td className="py-0.5 text-right">{formatBaht(p.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="mt-1.5 text-xs font-bold text-[#6B5A85]">
                          ซื้อ 2 อย่างลด {percentOf(BASKET_TIERS[0].rate)}% · 3 อย่างลด {percentOf(BASKET_TIERS[1].rate)}% · 4–5 อย่างลด {percentOf(BASKET_TIERS[2].rate)}% ทั้งตะกร้า (นับ ตั๋ววิ่ง / คอนเสิร์ต / หอสูง / ยิงปืน / อุโมงค์ลม อย่างละ 1 อย่าง)
                        </p>
                      </div>
                      <div>
                        <p className="font-extrabold text-[#0369A1] mb-1">ปืนสั้น + กระสุน 10 นัด ({formatBaht(SHORT_GUN_PRICE)} บาท · เลือก 1 กระบอก)</p>
                        <p className="font-semibold text-[#4B2D78] leading-relaxed">{SHORT_GUNS.join(' · ')}</p>
                        <p className="font-extrabold text-[#0369A1] mt-2 mb-1">ปืนยาว + กระสุน 10 นัด ({formatBaht(LONG_GUN_PRICE)} บาท · เลือก 1 กระบอก)</p>
                        <p className="font-semibold text-[#4B2D78] leading-relaxed">{LONG_GUNS.join(' · ')}</p>
                        <p className="mt-2 rounded-xl bg-[#FFF7DB] border border-[#FFC928]/60 px-2.5 py-1.5 text-xs font-extrabold text-[#7A4B00]">หมายเหตุ : แพ็กเกจเริ่มต้น 10 นัด สามารถซื้อกระสุนเพิ่มเติมได้ ณ สนามยิงปืน</p>
                      </div>
                    </div>
                  </details>
                </StationCard>
              </div>
            </div>
          </div>

          {/* ---------- pop-up: the 2nd person can choose activities ---------- */}
          <AnimatePresence>
            {extraTip && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="fixed bottom-[96px] left-3 right-3 z-[60] mx-auto max-w-md overflow-hidden rounded-3xl border-[3px] border-[#FFC928] bg-gradient-to-br from-[#2A1450] via-[#4B1FA8] to-[#6D28D9] p-4 text-white shadow-[0_18px_40px_-10px_rgba(20,8,40,0.8)] lg:bottom-24"
              >
                <button type="button" aria-label="ปิด" onClick={() => setExtraTip(false)} className="absolute right-2 top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/15 text-lg font-black">×</button>
                <p className="pr-8 text-lg font-black leading-tight text-[#FFE268]">🎉 เพิ่มคนที่ 2 แล้ว!</p>
                <p className="mt-1 text-sm font-bold leading-snug text-white/95">คนที่ 2 เลือกกิจกรรมของตัวเองได้ ไม่ต้องเหมือนคนแรก — <span className="text-[#FFE268]">หอสูง · ยิงปืน · อุโมงค์ลม</span></p>
                <button
                  type="button"
                  onClick={() => {
                    setExtraTip(false);
                    document.getElementById('shop-addon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="mt-3 inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#2A1450] bg-gradient-to-b from-[#FFE268] to-[#FFC928] px-4 text-sm font-black text-[#2A1450] shadow-[0_4px_0_#2A1450]"
                >
                  เลือกกิจกรรมให้คนที่ 2 <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- Basket: one sticky summary bar on every screen ---------- */}
          <AnimatePresence>
          {count > 0 && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="sticky bottom-[76px] lg:bottom-4 z-30 mx-auto w-full lg:max-w-3xl"
          >
            <div className="ds-card px-3.5 py-2.5 flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6D28D9, #EC4899)' }}>
                <ShoppingBasket className="w-5 h-5 text-[#FFC928]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-[#6B5A85] whitespace-nowrap overflow-hidden text-ellipsis">
                  {nudge && <span className="hidden lg:block text-[#6D28D9]">{nudge}</span>}
                  {lines.length ? (<><span className="hidden min-[460px]:inline">{lines.map((l) => l.emoji).join(' ')} · </span>{count} {tr('อย่าง', 'item(s)')}</>) : tr('ตะกร้ายังว่าง', 'Basket is empty')}
                </span>
                <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="block origin-left whitespace-nowrap text-xl font-black text-[var(--ink)] tabular-nums leading-tight">
                  {formatBaht(total)} <span className="text-xs font-bold">บาท</span>
                  <span className="block text-[10px] font-bold leading-tight text-[#6B5A85] min-[460px]:ml-1 min-[460px]:inline"><span className="min-[460px]:hidden">ไม่รวม VAT 7%</span><span className="hidden min-[460px]:inline">(ยังไม่รวม VAT 7%)</span></span>
                  {totalSaved > 0 && <span className="mt-0.5 block w-fit whitespace-nowrap rounded-full bg-[#FFE268] border-2 border-[var(--ink)] px-2 py-0.5 text-[11px] font-black min-[460px]:ml-2 min-[460px]:mt-0 min-[460px]:inline-block min-[460px]:align-middle">ประหยัด {formatBaht(totalSaved)} 🎉</span>}
                </motion.span>
              </span>
              <button
                type="button"
                onClick={clearBasket}
                aria-label={tr('ล้างตะกร้า', 'Clear basket')}
                className={`shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full border-2 px-3 min-h-[48px] text-xs font-black cursor-pointer transition-colors ${
                  clearArmed ? 'border-rose-600 bg-rose-600 text-white' : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className={clearArmed ? '' : 'max-[420px]:sr-only'}>{clearArmed ? tr('แน่ใจไหม? กดอีกครั้ง', 'Sure? Tap again') : tr('ล้างตะกร้า', 'Clear')}</span>
              </button>
              {checkoutBtn(true)}
            </div>
          </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
