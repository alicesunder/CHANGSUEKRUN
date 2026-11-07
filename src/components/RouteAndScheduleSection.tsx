import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RouteId } from '../types';
import { RouteIllustratedMap } from './RouteIllustratedMap';
import { ActivityMap } from './ActivityMap';
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
          {/* ================== header banner ================== */}
          <div className="relative overflow-hidden px-5 pt-6 pb-6 sm:px-8 sm:pt-8 lg:px-10 text-center text-white" style={{ background: 'linear-gradient(180deg, #5E2FBA 0%, #4A1F9B 100%)' }}>
            <div aria-hidden="true" className="pointer-events-none absolute -top-16 right-[6%] w-[420px] h-[240px] rounded-full bg-[#FF9A5A]/35 blur-3xl" />
            <img
              src="/images/objective/scene.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              draggable={false}
              className="hidden lg:block absolute -left-[1%] top-0 h-[250px] w-auto max-w-none pointer-events-none select-none"
              style={{ WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 55%, transparent 100%), linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)', maskImage: 'linear-gradient(90deg, #000 0%, #000 55%, transparent 100%), linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)', WebkitMaskComposite: 'source-in', maskComposite: 'intersect' } as React.CSSProperties}
            />
            <div className="relative">
              <h2 className="font-hero font-bold leading-[1.25] text-[1.9rem] sm:text-[2.6rem] lg:text-[3.1rem]">
                <span className="flex items-center justify-center gap-2.5 sm:gap-3 bg-gradient-to-b from-white to-[#E4D4FF] bg-clip-text text-transparent">
                  <Calendar className="hidden sm:block w-10 h-10 text-[#FFC928] shrink-0" aria-hidden="true" />
                  <span>{t('กำหนดการ & เส้นทางวิ่ง', 'Schedule & running routes')}</span>
                </span>
                <span className="flex items-center justify-center gap-2.5 sm:gap-3 bg-gradient-to-b from-[#FFF1B8] to-[#F5B800] bg-clip-text text-transparent">
                  <MapPin className="w-6 h-6 sm:w-10 sm:h-10 text-[#FFC928] shrink-0" aria-hidden="true" />
                  <span>{t('มาตรฐาน GPS', 'GPS-surveyed')}</span>
                </span>
              </h2>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-2.5 rounded-full border-2 border-[#F3CB62]/70 bg-gradient-to-r from-[#F6EFFF] to-[#E6D8FA] px-4 sm:px-6 py-2 sm:py-2.5 text-[13px] sm:text-lg font-black text-[#2A1450] shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)]">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#6D28D9] shrink-0" aria-hidden="true" />
                {t('วันเสาร์ที่ 9 ม.ค. 2570 · กิจกรรมเสริม 10 ม.ค. 2570', 'Saturday 9 Jan 2027 · Activities 10 Jan 2027')}
              </div>
              <p className="mt-3 text-[12.5px] sm:text-base font-bold text-white/95">
                <span aria-hidden="true">👆 </span>
                {t('คลิกที่ช่วงเวลาปล่อยตัว ', 'Tap a start time ')}
                <span className="text-[#FFD35C] font-black">{t('(16.30 - 17.30 น.)', '(16:30 - 17:30)')}</span>
                {t(' เพื่อดูพิกัดเส้นทางวิ่งแต่ละระยะได้ทันที', ' to see the course of each distance right away')}
              </p>
            </div>
          </div>

          {/* ================== the two panels ================== */}
          <div className="px-3 pb-5 sm:px-6 sm:pb-7 lg:px-8 lg:pb-9 grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-4 sm:gap-5 items-start">
            {/* ---------- schedule ---------- */}
            <div id="schedule" className="rounded-[26px] border border-[#E4D6F7] bg-white p-3 sm:p-4 shadow-[0_14px_34px_-20px_rgba(42,20,80,0.3)]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-1 pb-3">
                <span className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-b from-[#FFD35C] to-[#F5B800] flex items-center justify-center text-[#2A1450] shadow-md">
                  <Calendar className="w-7 h-7" aria-hidden="true" />
                </span>
                <h3 className="text-2xl sm:text-3xl font-black leading-none">{t('กำหนดการ', 'Schedule')}</h3>
                <div className="ml-auto rounded-2xl bg-gradient-to-r from-[#F6EFFF] to-[#E4D6F8] px-3.5 py-2 text-[#2A1450] text-[11.5px] sm:text-[13px] font-extrabold leading-snug">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" aria-hidden="true" />{t('ทุกกิจกรรม ณ Sea Sand Sun Hua Hin Resort', 'All activities at Sea Sand Sun Hua Hin Resort')}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" aria-hidden="true" />{t('เวลา 09.00 – 24.00 น.', '09:00 – 24:00')}</span>
                </div>
              </div>

              <div className="rounded-[20px] bg-[#FBF8FF] border border-[#EDE3FB] p-2.5 sm:p-3.5 text-[#2A1450] space-y-1.5">
                {timelineRows.map((row, idx) => {
                  const Icon = row.Icon;
                  const isSelectedRouteRow = row.routeId && row.routeId === selectedRoute;
                  const day = dayOf(row.id);
                  const newDay = idx === 0 || day !== dayOf(timelineRows[idx - 1].id);
                  return (
                    <React.Fragment key={row.id}>
                      {newDay && (
                        <div className={`flex items-center gap-2 rounded-full bg-[#EFE7FF] border border-[#D9C9EF] px-3.5 py-1.5 text-[#4B1FA8] text-[12.5px] sm:text-sm font-black ${idx > 0 ? 'mt-3' : ''}`}>
                          <Calendar className="w-4 h-4 text-[#7C3AED] shrink-0" aria-hidden="true" /> {dayHeading(day)}
                        </div>
                      )}
                      <div
                        onClick={() => {
                          if (row.routeId && onSelectRoute) onSelectRoute(row.routeId);
                        }}
                        className={`flex items-center gap-2.5 sm:gap-3 rounded-xl px-2 py-1.5 transition-all ${row.routeId ? 'cursor-pointer hover:brightness-95' : ''} ${
                          isSelectedRouteRow
                            ? 'bg-gradient-to-r from-[#FFE27A] to-[#FFF1B8] ring-2 ring-[#2A1450]/70'
                            : row.isGoldDot
                              ? 'bg-gradient-to-r from-[#FFEFB3] to-[#FFF8DE]'
                              : 'border-b border-[#2A1450]/8'
                        }`}
                      >
                        <span
                          className={`shrink-0 min-w-[92px] sm:min-w-[108px] rounded-full px-2.5 py-1 text-center font-mono text-[11.5px] sm:text-[13px] font-black tabular-nums ${
                            row.isGoldDot || isSelectedRouteRow ? 'bg-gradient-to-b from-[#FFD35C] to-[#F5B800] text-[#2A1450]' : 'bg-[#EFE7FF] text-[#4B1FA8]'
                          }`}
                        >
                          {row.time}
                        </span>
                        <span className="shrink-0 w-7 h-7 flex items-center justify-center" style={{ color: row.iconColor }}>
                          <Icon className="w-[22px] h-[22px] stroke-[2.2]" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] sm:text-[14px] font-extrabold leading-snug">{row.title}</div>
                          {row.desc && <div className="text-[11px] text-[#5B4878] font-semibold leading-snug">{row.desc}</div>}
                        </div>
                      </div>
                    </React.Fragment>
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
                <div role="tablist" aria-label={t('เลือกระยะวิ่ง', 'Choose a distance')} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                {/* activity map */}
                <div className="rounded-2xl border-2 border-[#D9C9EF] bg-white p-2.5 sm:p-3.5">
                  <ActivityMap />
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
