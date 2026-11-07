import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RouteId } from '../types';
import { RouteIllustratedMap } from './RouteIllustratedMap';
import { ActivityMap } from './ActivityMap';
import { ACTIVITY_LOCATIONS } from '../data/activityLocations';
import { eventInfo, routesData } from '../data/eventData';
import {
  ArrowRight,
  Award,
  Calendar,
  Clock,
  Crosshair,
  Droplets,
  Flag,
  MapPin,
  Mountain,
  Package,
  Music,
  Play,
  Printer,
  Sparkles,
  Stethoscope,
  Trophy,
  Wind,
  X,
} from 'lucide-react';
import { PawIcon } from './brand/DogDecor';
import { useLang } from '../i18n/lang';

interface RouteAndScheduleProps {
  selectedRoute?: RouteId;
  onSelectRoute?: (id: RouteId) => void;
  onOpenArtworkModal?: () => void;
  onOpenSimulation?: (id?: RouteId) => void;
}

export const RouteAndScheduleSection: React.FC<RouteAndScheduleProps> = ({
  selectedRoute = '5km',
  onSelectRoute,
  onOpenSimulation,
}) => {
  const { t } = useLang();
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [scheduleDay, setScheduleDay] = useState<'run' | 'activity'>('run');
  const [showActMap, setShowActMap] = useState(false);
  /** one-line names for the timeline (the full names stay in the tooltip and in the PDF) */
  const shortTitle: Record<string, [string, string]> = {
    'race-kit': ['รับอุปกรณ์ Race Kit (BIB · เสื้อ)', 'Race Kit pick-up (BIB · shirt)'],
    'dog-contest': ['การแข่งขันประกวดน้องสุนัข', 'Dog contests'],
    'dog-health-check': ['ตรวจสุขภาพสุนัข (ไม่มีค่าใช้จ่าย)', 'Dog health check (free of charge)'],
    'dog-awards': ['พิธีมอบรางวัลการประกวดน้องสุนัข', 'Dog contest awards'],
    'start-10k': ['ปล่อยตัวนักวิ่ง 10 กิโลเมตร', '10 km start'],
    'start-5k': ['ปล่อยตัว 5 กิโลเมตร', '5 km start'],
    'start-3k': ['ปล่อยตัว 4 กิโลเมตร (วิ่งกับน้องสุนัข)', '4 km start (with your dog)'],
    'start-1k': ['ปล่อยตัว 1 กิโลเมตร (วิ่งกับน้องสุนัข)', '1 km start (with your dog)'],
    'door-open': ['Door Open', 'Door Open'],
    concert: ['การแสดงดนตรีและคอนเสิร์ต', 'Music show & concert'],
    'station-1': ['สถานีที่ 1 ยิงปืน', 'Station 1 · Shooting'],
    'station-2': ['สถานีที่ 2 หอสูง', 'Station 2 · High tower'],
    'station-3': ['สถานีที่ 3 อุโมงค์ลม', 'Station 3 · Wind tunnel'],
  };
  const activeRouteData = routesData[selectedRoute] || routesData['5km'];

  const timelineRows = [
    {
      id: 'race-kit',
      time: 'ตั้งแต่ 09.00 น.',
      title: 'รับอุปกรณ์ Race Kit (เบอร์วิ่ง BIB · เสื้อ)',
      desc: 'ที่ Sea Sand Sun Hua Hin Resort · แสดง QR ของตั๋วพร้อมบัตรประชาชน',
      badge: 'RACE KIT',
      iconBg: '#FEF9C3',
      iconColor: '#A16207',
      Icon: Package,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
    {
      id: 'dog-contest',
      time: '09.00–14.00 น.',
      title: 'การแข่งขันประกวดน้องสุนัข',
      desc: 'แต่งตัวธีมผจญภัยม่วง–ทอง • น้องสุนัขสุขภาพดี • น้องสุนัขเชื่อฟังคำสั่ง',
      badge: 'DOG CONTEST',
      iconBg: '#FCE7F3',
      iconColor: '#BE185D',
      Icon: Trophy,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
    {
      id: 'dog-health-check',
      time: '09.00–14.00 น.',
      title: 'ตรวจสุขภาพสุนัข (ไม่มีค่าใช้จ่าย)',
      desc: 'โดย รพ.สัตว์ทองหล่อ • สำหรับผู้สมัครวิ่ง Dog Run ทั้ง 2 ระยะ (1K / 4K)',
      badge: 'FREE VET CHECK',
      iconBg: '#D1FAE5',
      iconColor: '#047857',
      Icon: Stethoscope,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
    {
      id: 'dog-awards',
      time: '15.00–17.00 น.',
      title: 'พิธีมอบรางวัลการประกวดน้องสุนัข',
      desc: 'ประกาศผลและมอบรางวัลแก่ผู้ชนะการแข่งขัน',
      badge: 'AWARDS',
      iconBg: '#FEF3C7',
      iconColor: '#B45309',
      Icon: Award,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
    {
      id: 'start-10k',
      time: '16.30 น.',
      title: 'ปล่อยตัวนักวิ่ง 10 กิโลเมตร',
      desc: 'ประเภทบุคคลทั่วไป',
      badge: '10 km RUN',
      iconBg: '#F3E8FF',
      iconColor: '#7B3FC6',
      Icon: Flag,
      routeId: '10km' as RouteId,
      isGoldDot: true,
    },
    {
      id: 'start-5k',
      time: '17.00 น.',
      title: 'ปล่อยตัวนักวิ่ง 5 กิโลเมตร',
      desc: 'ประเภทบุคคลทั่วไป',
      badge: '5 km RUN',
      iconBg: '#FEF3C7',
      iconColor: '#B45309',
      Icon: Flag,
      routeId: '5km' as RouteId,
      isGoldDot: true,
    },
    {
      id: 'start-3k',
      time: '17.15 น.',
      title: 'ปล่อยตัวนักวิ่ง 4 กิโลเมตร',
      desc: 'ประเภทวิ่งร่วมกับน้องสุนัข',
      badge: '4 km DOG RUN',
      iconBg: '#DCFCE7',
      iconColor: '#166534',
      Icon: Flag,
      routeId: '3km' as RouteId,
      isGoldDot: true,
    },
    {
      id: 'start-1k',
      time: '17.30 น.',
      title: 'ปล่อยตัวนักวิ่ง 1 กิโลเมตร',
      desc: 'ประเภทวิ่งร่วมกับน้องสุนัข',
      badge: '1 km DOG RUN',
      iconBg: '#FFEDD5',
      iconColor: '#C2410C',
      Icon: Flag,
      routeId: '1km' as RouteId,
      isGoldDot: true,
    },
    {
      id: 'door-open',
      time: '17.30 น.',
      title: 'Door Open',
      desc: 'เปิดประตูเข้าชมคอนเสิร์ต',
      badge: 'DOOR OPEN',
      iconBg: '#EDE9FE',
      iconColor: '#6D28D9',
      Icon: Music,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
    {
      id: 'concert',
      time: '18.00 น.',
      title: 'การแสดงดนตรีและคอนเสิร์ต',
      desc: 'เปิดการแสดงโดยวงดนตรีตำรวจตระเวนชายแดน และการแสดงอื่น ๆ',
      badge: 'CONCERT',
      iconBg: '#EDE9FE',
      iconColor: '#6D28D9',
      Icon: Music,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
    {
      id: 'station-1',
      time: '09.00–11.00 น.',
      title: 'กิจกรรมสถานีที่ 1 กิจกรรมยิงปืน',
      desc: '',
      badge: 'STATION 1',
      iconBg: '#E0F2FE',
      iconColor: '#0369A1',
      Icon: Crosshair,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
    {
      id: 'station-2',
      time: '10.00–12.00 น.',
      title: 'กิจกรรมสถานีที่ 2 กิจกรรมหอสูง',
      desc: '',
      badge: 'STATION 2',
      iconBg: '#E0E7FF',
      iconColor: '#4F46E5',
      Icon: Mountain,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
    {
      id: 'station-3',
      time: '13.00–15.00 น.',
      title: 'กิจกรรมสถานีที่ 3 กิจกรรมอุโมงค์ลม',
      desc: '',
      badge: 'STATION 3',
      iconBg: '#CCFBF1',
      iconColor: '#0F766E',
      Icon: Wind,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
  ];

  /** The add-on activities (stations) are the day after the run. */
  const dayOf = (id: string) => (id.startsWith('station-') ? 'activity' : 'run');
  const dayHeading = (day: string) =>
    day === 'run'
      ? t('วันเสาร์ที่ 9 ม.ค. 2570 (วันวิ่ง & คอนเสิร์ต)', 'Saturday 9 Jan 2027 (run day & concert)')
      : t('วันอาทิตย์ที่ 10 ม.ค. 2570 (กิจกรรมเสริม)', 'Sunday 10 Jan 2027 (add-on activities)');

  const routePills: {
    id: RouteId;
    label: string;
    activeBg: string;
    activeText: string;
    idleBg: string;
    idleText: string;
  }[] = [
    {
      id: '10km',
      label: '10K บุคคลทั่วไป (16.30 น.)',
      activeBg: '#6D28D9',
      activeText: '#FFFFFF',
      idleBg: '#EDE9FE',
      idleText: '#5B21B6',
    },
    {
      id: '5km',
      label: '5K บุคคลทั่วไป (17.00 น.)',
      activeBg: '#DC2626',
      activeText: '#FFFFFF',
      idleBg: '#FEE2E2',
      idleText: '#B91C1C',
    },
    {
      id: '3km',
      label: '4K วิ่งกับน้องสุนัข (17.15 น.)',
      activeBg: '#C2410C',
      activeText: '#FFFFFF',
      idleBg: '#FFEDD5',
      idleText: '#9A3412',
    },
    {
      id: '1km',
      label: '1K วิ่งกับน้องสุนัข (17.30 น.)',
      activeBg: '#BE185D',
      activeText: '#FFFFFF',
      idleBg: '#FCE7F3',
      idleText: '#9D174D',
    },
  ];


  const routeTabs: { id: RouteId; big: string; sub: string; time: string; dog: boolean }[] = [
    { id: '10km', big: '10K', sub: t('บุคคลทั่วไป', 'General'), time: t('16.30 น.', '16:30'), dog: false },
    { id: '5km', big: '5K', sub: t('บุคคลทั่วไป', 'General'), time: t('17.00 น.', '17:00'), dog: false },
    { id: '3km', big: '4K', sub: t('วิ่งกับน้องสุนัข', 'With your dog'), time: t('17.15 น.', '17:15'), dog: true },
    { id: '1km', big: '1K', sub: t('วิ่งกับน้องสุนัข', 'With your dog'), time: t('17.30 น.', '17:30'), dog: true },
  ];
  const activeTab = routeTabs.find((x) => x.id === selectedRoute);

  const [mapFull, setMapFull] = useState(false);
  useEffect(() => {
    if (!mapFull) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMapFull(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapFull]);
  const scrollToFullMap = () => setMapFull(true);

  return (
    <section id="schedule-and-map" className="relative overflow-hidden scroll-mt-20 py-8 sm:py-12" style={{ background: 'linear-gradient(180deg, #EFE6FC 0%, #F5F0FF 100%)' }}>
      <div id="schedule-section" className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className="relative isolate overflow-hidden rounded-[32px] border border-[#E4D6F7] text-[#2A1450] shadow-[0_26px_56px_-24px_rgba(45,16,82,0.35)]"
          style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF6FF 60%, #F3EBFF 100%)' }}
        >
          {/* ================== header banner (light sunset) ================== */}
          <div
            className="relative overflow-hidden px-5 pt-7 pb-24 sm:px-8 sm:pt-9 sm:pb-28 lg:pb-32 lg:px-10 text-center"
            style={{ background: '#E9DDFB' }}
          >
            <img
              src="/images/schedule/header-route.webp"
              alt=""
              aria-hidden="true"
              decoding="async"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover object-[center_bottom] pointer-events-none select-none"
            />
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/45 via-white/25 to-[#F3EBFF]/85 sm:from-white/10 sm:via-transparent sm:to-[#F3EBFF]/80" />
            <div className="relative">
              <h2 className="font-hero font-bold leading-[1.2] text-[#3B1780] text-[1.7rem] sm:text-[2.5rem] lg:text-[3rem] [text-shadow:0_2px_0_rgba(255,255,255,0.85),0_0_18px_rgba(255,255,255,0.8)]">
                <span className="flex items-center justify-center gap-2.5 sm:gap-3">
                  <Calendar className="hidden sm:block w-9 h-9 text-[#F5B800] shrink-0" aria-hidden="true" />
                  <span>{t('กำหนดการ & เส้นทางวิ่ง', 'Schedule & running routes')}</span>
                </span>
                <span className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#4B1FA8] to-[#2A1450] px-5 sm:px-8 py-0.5 text-[#FFD35C] [text-shadow:none] shadow-[0_8px_18px_-8px_rgba(42,20,80,0.7)]">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" aria-hidden="true" />
                  <span>{t('มาตรฐาน GPS', 'GPS-surveyed')}</span>
                </span>
              </h2>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-2.5 rounded-full border border-white/80 bg-white/90 px-4 sm:px-6 py-2 sm:py-2.5 text-[13px] sm:text-lg font-black text-[#2A1450] shadow-[0_10px_22px_-10px_rgba(42,20,80,0.45)] backdrop-blur">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#6D28D9] shrink-0" aria-hidden="true" />
                {t('วันเสาร์ที่ 9 ม.ค. 2570 · กิจกรรมเสริม 10 ม.ค. 2570', 'Saturday 9 Jan 2027 · Activities 10 Jan 2027')}
              </div>
              <p className="mt-3 text-[12.5px] sm:text-base font-extrabold text-[#2A1450] [text-shadow:0_1px_0_rgba(255,255,255,0.9)]">
                <span aria-hidden="true">👆 </span>
                {t('คลิกที่ช่วงเวลาปล่อยตัว ', 'Tap a start time ')}
                <span className="text-[#B45309] font-black">{t('(16.30 - 17.30 น.)', '(16:30 - 17:30)')}</span>
                {t(' เพื่อดูพิกัดเส้นทางวิ่งแต่ละระยะได้ทันที', ' to see the course of each distance right away')}
              </p>
            </div>
          </div>

          {/* ================== the two panels ================== */}
          <div className="px-3 pb-5 sm:px-6 sm:pb-7 lg:px-8 lg:pb-9 grid grid-cols-1 lg:grid-cols-[minmax(0,4.8fr)_minmax(0,7.2fr)] gap-4 sm:gap-5 items-start">
            {/* ---------- schedule ---------- */}
            <div id="schedule" className="rounded-[26px] border border-[#E4D6F7] bg-white p-3 sm:p-4 shadow-[0_14px_34px_-20px_rgba(42,20,80,0.3)]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-1 pb-3">
                <span className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-b from-[#FFD35C] to-[#F5B800] flex items-center justify-center text-[#2A1450] shadow-md">
                  <Calendar className="w-7 h-7" aria-hidden="true" />
                </span>
                <h3 className="text-2xl sm:text-3xl font-black leading-none">{t('กำหนดการ', 'Schedule')}</h3>
                <div className="ml-auto rounded-2xl bg-[#F3ECFF] px-3.5 py-2 text-[#2A1450] text-[11.5px] sm:text-[12.5px] font-extrabold leading-snug">
                  <span className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 text-[#6D28D9] shrink-0" aria-hidden="true" />{t('ทุกกิจกรรม ณ Sea Sand Sun Hua Hin Resort', 'All activities at Sea Sand Sun Hua Hin Resort')}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" aria-hidden="true" />{t('เวลา 09.00 – 24.00 น.', '09:00 – 24:00')}</span>
                </div>
              </div>

              {/* the two days are tabs, so only one day is on screen */}
              <div role="tablist" aria-label={t('เลือกวัน', 'Choose a day')} className="grid grid-cols-2 gap-2 mb-3">
                {(['run', 'activity'] as const).map((d) => {
                  const on = scheduleDay === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setScheduleDay(d)}
                      className={`rounded-2xl px-2.5 py-2 text-center leading-tight cursor-pointer border-2 transition-all ${
                        on ? 'border-[#2A1450] bg-gradient-to-b from-[#6D3FD0] to-[#4B1FA8] text-white shadow-[0_5px_0_#2A1450] -translate-y-0.5' : 'border-[#D9C9EF] bg-[#F6F0FF] text-[#4B1FA8] hover:border-[#B79AE8]'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5 text-[13px] sm:text-[15px] font-black">
                        <Calendar className={`w-4 h-4 shrink-0 ${on ? 'text-[#FFD35C]' : 'text-[#7C3AED]'}`} aria-hidden="true" />
                        {d === 'run' ? t('เสาร์ที่ 9 ม.ค. 2570', 'Sat 9 Jan 2027') : t('อาทิตย์ที่ 10 ม.ค. 2570', 'Sun 10 Jan 2027')}
                      </span>
                      <span className={`block text-[11px] sm:text-xs font-extrabold ${on ? 'text-white/85' : 'text-[#6B5A85]'}`}>{d === 'run' ? t('วันวิ่ง & คอนเสิร์ต', 'Run day & concert') : t('กิจกรรมเสริม', 'Add-on activities')}</span>
                    </button>
                  );
                })}
              </div>

              <div role="tabpanel" className="rounded-[20px] bg-[#FBF8FF] border border-[#EDE3FB] p-2 sm:p-3 text-[#2A1450]">
                {timelineRows
                  .filter((row) => dayOf(row.id) === scheduleDay)
                  .map((row) => {
                    const Icon = row.Icon;
                    const isSelectedRouteRow = row.routeId && row.routeId === selectedRoute;
                    const short = shortTitle[row.id];
                    return (
                      <div
                        key={row.id}
                        onClick={() => {
                          if (row.routeId && onSelectRoute) onSelectRoute(row.routeId);
                        }}
                        className={`my-1 grid grid-cols-[104px_26px_minmax(0,1fr)] sm:grid-cols-[116px_28px_minmax(0,1fr)] items-center gap-2 sm:gap-2.5 rounded-xl px-1.5 min-h-[42px] transition-all ${row.routeId ? 'cursor-pointer hover:brightness-95' : ''} ${
                          isSelectedRouteRow ? 'bg-gradient-to-r from-[#FFE27A] to-[#FFF1B8] ring-2 ring-[#2A1450]/70' : row.isGoldDot ? 'bg-gradient-to-r from-[#FFEFB3] to-[#FFF8DE]' : ''
                        }`}
                      >
                        <span
                          className={`rounded-full px-2 py-1 text-center font-mono text-[11.5px] sm:text-[13px] font-black tabular-nums whitespace-nowrap ${
                            row.isGoldDot || isSelectedRouteRow ? 'bg-gradient-to-b from-[#FFD35C] to-[#F5B800] text-[#2A1450]' : 'bg-[#EFE7FF] text-[#4B1FA8]'
                          }`}
                        >
                          {row.time}
                        </span>
                        <span className="flex items-center justify-center" style={{ color: row.iconColor }}>
                          <Icon className="w-[22px] h-[22px] stroke-[2.2]" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] sm:text-[14.5px] font-extrabold leading-snug" title={row.title}>
                            {short ? t(short[0], short[1]) : row.title}
                          </div>
                          {row.id === 'race-kit' && row.desc && <div className="text-[11px] text-[#5B4878] font-semibold leading-snug">{row.desc}</div>}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex justify-center pt-4 pb-1">
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(true)}
                  className="inline-flex items-center gap-2.5 min-h-[52px] rounded-full border-2 border-[#B8860B] bg-gradient-to-b from-[#FFE27A] to-[#FFC928] px-7 text-[15px] sm:text-base font-black text-[#2A1450] shadow-[0_6px_0_#2A1450] hover:brightness-105 active:translate-y-0.5 cursor-pointer"
                >
                  <Printer className="w-5 h-5" aria-hidden="true" />
                  {t('ดูตารางฉบับเต็ม (PDF)', 'Full schedule (PDF)')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* ---------- GPS survey ---------- */}
            <div className="rounded-[26px] border border-[#E4D6F7] bg-white p-3 sm:p-4 shadow-[0_14px_34px_-20px_rgba(42,20,80,0.3)] space-y-3">
              <div className="flex items-center gap-3 px-1">
                <span className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-b from-[#FFD35C] to-[#F5B800] flex items-center justify-center text-[#2A1450] shadow-md">
                  <MapPin className="w-7 h-7" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-3xl font-black leading-tight">{t('เส้นทางวิ่ง (GPS Survey)', 'Running route (GPS Survey)')}</h3>
                  <p className="text-[11.5px] sm:text-[13px] font-bold text-[#6B5A85]">{t('เลียบชายหาด – ค่ายนเรศวร (ปล่อยตัวยามเย็น 16.30 - 17.30 น.)', 'Along the beach to the Naresuan camp (evening start 16:30 - 17:30)')}</p>
                </div>
              </div>

              <div className="rounded-[20px] bg-[#FBF8FF] border border-[#EDE3FB] p-2.5 sm:p-3.5 text-[#2A1450] space-y-3">
                {/* distance tabs */}
                <div role="tablist" aria-label={t('เลือกระยะวิ่ง', 'Choose a distance')} className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {routeTabs.map((tab) => {
                    const on = selectedRoute === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onSelectRoute && onSelectRoute(tab.id)}
                        className={`rounded-2xl border-2 px-2 py-2 text-center leading-tight cursor-pointer transition-all ${
                          on ? 'border-[#B8860B] bg-gradient-to-b from-[#FFE27A] to-[#FFC928] shadow-[0_6px_0_#2A1450] -translate-y-0.5' : 'border-[#D9C9EF] bg-gradient-to-b from-[#FFFFFF] to-[#F1E8FF] hover:border-[#B79AE8]'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5 text-xl sm:text-2xl font-black">
                          {tab.dog ? <PawIcon size={18} color={on ? '#2A1450' : '#6D28D9'} /> : <span aria-hidden="true" className="text-base">🏃</span>}
                          {tab.big}
                        </span>
                        <span className="block text-[11.5px] sm:text-xs font-extrabold text-[#4B2D78]">{tab.sub}</span>
                        <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11.5px] sm:text-xs font-black tabular-nums ${on ? 'bg-[#2A1450] text-[#FFD35C]' : 'bg-[#EDE3FB] text-[#4B1FA8]'}`}>{tab.time}</span>
                      </button>
                    );
                  })}
                </div>

                {/* the map takes the whole width; the summary sits under it */}
                <div className="space-y-3">
                  <RouteIllustratedMap selectedRoute={selectedRoute} onSelectRoute={onSelectRoute} showLegend={false} />
                  <div className="rounded-2xl border border-[#E4D6F7] bg-white p-2.5 sm:p-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2.5 rounded-xl bg-[#F6F0FF] px-3 py-2">
                      <Flag className="w-5 h-5 text-[#6D28D9] shrink-0" aria-hidden="true" />
                      <div className="leading-tight">
                        <div className="text-[11px] font-extrabold text-[#6B5A85]">{t('ระยะทาง', 'Distance')} {activeTab?.big}</div>
                        <div className="text-base font-black tabular-nums">{activeRouteData.distanceKm} {t('กม.', 'km')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-[#F6F0FF] px-3 py-2">
                      <Clock className="w-5 h-5 text-[#6D28D9] shrink-0" aria-hidden="true" />
                      <div className="leading-tight">
                        <div className="text-[11px] font-extrabold text-[#6B5A85]">{t('เวลาตัดตัว', 'Cut-off')}</div>
                        <div className="text-[13px] font-black">{activeRouteData.cutoffTime}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-[#F6F0FF] px-3 py-2">
                      <Droplets className="w-5 h-5 text-[#0369A1] shrink-0" aria-hidden="true" />
                      <div className="leading-tight">
                        <div className="text-[11px] font-extrabold text-[#6B5A85]">{t('จุดน้ำ', 'Water stops')}</div>
                        <div className="text-base font-black tabular-nums">{activeRouteData.waterStationCount} {t('จุด', 'stops')}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={scrollToFullMap}
                      className="col-span-2 lg:col-span-1 min-h-[48px] rounded-xl border-2 border-[#D9C9EF] bg-[#F3ECFF] text-[#4B1FA8] text-[13px] font-black inline-flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#E9DDFB]"
                    >
                      {t('ดูเส้นทางเต็มจอ', 'Full-screen map')} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* activity locations: three links; the real map opens only when asked */}
                <div className="rounded-2xl border border-[#E4D6F7] bg-white p-2.5 sm:p-3.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="flex items-center gap-2 mr-auto">
                      <span className="w-9 h-9 rounded-full bg-[#F3ECFF] flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-[#6D28D9]" aria-hidden="true" /></span>
                      <div className="leading-tight">
                        <div className="text-[15px] font-black">{t('ตำแหน่งกิจกรรมเสริม', 'Add-on activity locations')}</div>
                        <div className="text-[11.5px] font-bold text-[#6B5A85]">{t('วันอาทิตย์ที่ 10 ม.ค. 2570', 'Sunday 10 Jan 2027')}</div>
                      </div>
                    </div>
                    {ACTIVITY_LOCATIONS.filter((a) => a.id !== 'resort').map((a) => (
                      <a
                        key={a.id}
                        href={a.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 min-h-[44px] rounded-xl border-2 border-[#E4D6F7] bg-[#FBF8FF] px-3 text-[13px] font-extrabold text-[#2A1450] hover:border-[#B79AE8]"
                      >
                        <img src={a.id === 'tower' ? '/images/shop/tower-v2.webp' : a.id === 'gun' ? '/images/shop/shoot-v2.webp' : '/images/shop/wind-v2.webp'} alt="" className="w-8 h-8 object-contain mix-blend-multiply" loading="lazy" />
                        {a.id === 'tower' ? t('หอสูง', 'High tower') : a.id === 'gun' ? t('ยิงปืน', 'Shooting') : t('อุโมงค์ลม', 'Wind tunnel')}
                        <ArrowRight className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
                      </a>
                    ))}
                    <button
                      type="button"
                      aria-expanded={showActMap}
                      onClick={() => setShowActMap((v) => !v)}
                      className="inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border-2 border-[#D9C9EF] bg-[#F3ECFF] px-3 text-[13px] font-black text-[#4B1FA8] cursor-pointer hover:bg-[#E9DDFB]"
                    >
                      {showActMap ? t('ซ่อนแผนที่', 'Hide map') : t('ดูบนแผนที่', 'Show on map')}
                    </button>
                  </div>
                  {showActMap && <ActivityMap className="mt-3" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mapFull && (
        <div
          className="fixed inset-0 z-[9000] bg-[#140826]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setMapFull(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="แผนที่เส้นทางวิ่ง"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[1400px] max-h-[92vh] overflow-auto ds-modal p-3 sm:p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-base sm:text-lg font-black text-[#2A1450]">แผนที่เส้นทางวิ่ง</h3>
              <button
                type="button"
                onClick={() => setMapFull(false)}
                aria-label="ปิด"
                className="w-11 h-11 rounded-full bg-[#F3EEFB] hover:bg-[#E6DBF7] text-[#2A1450] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <RouteIllustratedMap selectedRoute={selectedRoute} onSelectRoute={onSelectRoute} />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PRINTER-FRIENDLY PDF SCHEDULE MODAL                          */}
      {/* ============================================================ */}
      {printModalOpen && createPortal(
        <div className="schedule-print-portal fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm print:bg-white print:p-0">
          <div className="sheet-card bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#2A1450] overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:rounded-none">
            <div className="print-hide flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-[#FAF8FD]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5B20A8] text-white flex items-center justify-center shadow-xs">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1F1035]">
                    กำหนดการ (PDF)
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    CHANGSUEK RUN 2027 • วิ่ง 9 มกราคม 2570 · กิจกรรมเสริม 10 มกราคม 2570 ณ ค่ายนเรศวร อ.ชะอำ จ.เพชรบุรี
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer border border-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 printable-schedule-sheet text-[#111827] space-y-2.5">
              <div className="hidden print:block sched-print-title">
                <h1>CHANGSUEK RUN 2027 · กำหนดการ</h1>
                <p>กิจกรรมทั้งหมด ณ Sea Sand Sun Hua Hin Resort · วิ่ง 9 มกราคม 2570 · กิจกรรมเสริม 10 มกราคม 2570</p>
              </div>
              {timelineRows.map((item, idx) => (
                <React.Fragment key={item.id}>
                {(idx === 0 || dayOf(item.id) !== dayOf(timelineRows[idx - 1].id)) && (
                  <div className="sched-day pt-2 text-sm font-black text-[#5B20A8]">{dayHeading(dayOf(item.id))}</div>
                )}
                <div
                  className="sched-row flex items-start gap-4 p-3.5 rounded-xl border border-purple-100 bg-[#FAF7FF]/50"
                >
                  <div className="w-32 font-mono font-black text-xs sm:text-sm text-[#5B20A8] shrink-0">
                    {item.time}
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#1F1035]">{item.title}</div>
                    {item.desc && (
                      <div className="text-xs text-gray-600 font-medium mt-0.5">{item.desc}</div>
                    )}
                  </div>
                </div>
                </React.Fragment>
              ))}
            </div>

            <div className="print-hide p-4 sm:p-5 border-t border-gray-100 bg-[#FAF8FD] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="print-keep inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B20A8] hover:bg-[#471587] text-white text-xs sm:text-sm font-black shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ / บันทึกเป็น PDF</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};
