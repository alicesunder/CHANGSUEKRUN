import React, { useState, useEffect, useRef } from 'react';
import { RouteId } from '../types';
import { RouteIllustratedMap } from './RouteIllustratedMap';
import { routesData } from '../data/eventData';
import {
  ArrowRight,
  Award,
  Clock,
  Crosshair,
  Droplets,
  Flag,
  MapPin,
  Mountain,
  Music,
  Play,
  Printer,
  Sparkles,
  Trophy,
  Wind,
  X,
} from 'lucide-react';
import { PawIcon } from './brand/DogDecor';

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
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const activeRouteData = routesData[selectedRoute] || routesData['5km'];

  const timelineRows = [
    {
      id: 'dog-contest',
      time: '09.00–14.00 น.',
      title: 'การแข่งขันประกวดน้องสุนัข',
      desc: 'สุนัขแฟนซีธีม War Dog • น้องสุนัขสุขภาพดี • น้องสุนัขเชื่อฟังคำสั่ง',
      badge: 'DOG CONTEST',
      iconBg: '#FCE7F3',
      iconColor: '#BE185D',
      Icon: Trophy,
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
      badge: '10 KM RUN',
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
      badge: '5 KM RUN',
      iconBg: '#FEF3C7',
      iconColor: '#B45309',
      Icon: Flag,
      routeId: '5km' as RouteId,
      isGoldDot: true,
    },
    {
      id: 'start-3k',
      time: '17.15 น.',
      title: 'ปล่อยตัวนักวิ่ง 3.8 กิโลเมตร',
      desc: 'ประเภทวิ่งร่วมกับน้องสุนัข',
      badge: '3.8 KM DOG RUN',
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
      badge: '1 KM DOG RUN',
      iconBg: '#FFEDD5',
      iconColor: '#C2410C',
      Icon: Flag,
      routeId: '1km' as RouteId,
      isGoldDot: true,
    },
    {
      id: 'concert',
      time: '17.30 น. เป็นต้นไป',
      title: 'การแสดงดนตรีและคอนเสิร์ต',
      desc: 'เปิดการแสดงโดยวงดนตรีตำรวจตระเวนชายแดน และการแสดงอื่น ๆ',
      badge: 'CONCERT',
      iconBg: '#EDE9FE',
      iconColor: '#6D28D9',
      Icon: Music,
      routeId: undefined as RouteId | undefined,
      isGoldDot: false,
    },
  ];

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
      label: '3.8K วิ่งกับน้องสุนัข (17.15 น.)',
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


  const [mapFull, setMapFull] = useState(false);
  useEffect(() => {
    if (!mapFull) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMapFull(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapFull]);
  const scrollToFullMap = () => setMapFull(true);

  return (
    <section
      id="schedule-and-map"
      className="py-12 sm:py-16 relative overflow-hidden scroll-mt-20"
      style={{
        background:
          'linear-gradient(180deg, #EFE6FC 0%, #E0F2FE 48%, #FFF4D2 100%)',
      }}
    >
      {/* Ambient Coastal Sun & Ocean Orbs */}
      <div className="absolute -top-20 left-10 w-80 h-80 bg-[#7B3FC6]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#FFC928]/25 rounded-full blur-3xl pointer-events-none" />

      <div
        id="schedule-section"
        className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        {/* Section Eyebrow Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border-2 border-[#2A1450] text-[#5B20A8] text-xs font-extrabold uppercase shadow-[0_3px_0_#2A1450] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
              <span>วันงาน 9 ม.ค. 2570</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A1450]">
              กำหนดการ & เส้นทางวิ่งมาตรฐาน GPS
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#4B2D78]">
            คลิกที่ช่วงเวลาปล่อยตัว (16.30 - 17.30 น.) เพื่อดูพิกัดเส้นทางวิ่งแต่ละระยะได้ทันที
          </p>
        </div>

        {/* ================================================================ */}
        {/* 2-COLUMN SIDE-BY-SIDE: SCHEDULE (LEFT) & GPS SURVEY MAP (RIGHT) */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-start">
          {/* -------------------------------------------------------------- */}
          {/* LEFT CARD: กำหนดการ (OFFICIAL SCHEDULE)                        */}
          {/* -------------------------------------------------------------- */}
          <div
            id="schedule"
            className="lg:col-span-5 bg-white rounded-[32px] border-[3px] border-[#2A1450] shadow-[0_20px_42px_-16px_rgba(42,20,80,0.32),0_7px_0_#2A1450] flex flex-col justify-between overflow-hidden relative"
          >
            {/* Top Colorful Accent Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-[#5B20A8] via-[#FFC928] to-[#DB2777]" />

            <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between">
              <div>
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-dashed border-[#2A1450]/15">
                  <div className="flex items-center gap-3.5">
                    <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#5B20A8] to-[#3A1564] text-[#FFC928] border-2 border-[#2A1450] shadow-[2px_3px_0_#2A1450] flex items-center justify-center shrink-0">
                      <PawIcon size={22} color="#FFC928" />
                    </span>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#2A1450] leading-tight">
                        กำหนดการ
                      </h3>
                      <span className="block text-[11px] font-mono font-extrabold text-[#7B3FC6] uppercase mt-0.5">
                        09.00 – 17.30 น. เป็นต้นไป
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPrintModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC928] hover:bg-[#F5B800] text-[#2A1450] border-2 border-[#2A1450] shadow-[0_3px_0_#2A1450] px-4 py-2 text-xs font-extrabold transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>ดูตารางฉบับเต็ม (PDF)</span>
                  </button>
                </div>

                {/* Timeline List with Bold Time Pills & Interactive Highlighting */}
                <div className="mt-4 relative space-y-2">
                  {/* Continuous Vertical Line */}
                  <div
                    aria-hidden="true"
                    className="absolute left-[13px] top-4 bottom-4 w-[3px] bg-gradient-to-b from-[#7B3FC6] via-[#FFC928] to-[#16A34A] rounded-full"
                  />

                  {timelineRows.map((row) => {
                    const Icon = row.Icon;
                    const isSelectedRouteRow = row.routeId && row.routeId === selectedRoute;
                    return (
                      <div
                        key={row.id}
                        onClick={() => {
                          if (row.routeId && onSelectRoute) {
                            onSelectRoute(row.routeId);
                          }
                        }}
                        className={`group relative flex items-start sm:items-center gap-2.5 sm:gap-3 py-2 px-2.5 rounded-2xl transition-all border ${
                          row.routeId ? 'cursor-pointer' : ''
                        } ${
                          isSelectedRouteRow
                            ? 'bg-gradient-to-r from-[#FFF9E5] to-[#F3E8FF] border-[#2A1450] shadow-[0_4px_0_#2A1450] -translate-y-0.5'
                            : 'bg-[#FAF8FF]/90 hover:bg-white border-purple-100/80 hover:border-purple-300'
                        }`}
                      >
                        {/* Timeline Node Ring */}
                        <div
                          className={`relative z-10 w-5 h-5 mt-1 sm:mt-0 rounded-full bg-white flex items-center justify-center shrink-0 border-2 ${
                            row.isGoldDot
                              ? 'border-[#D97706] shadow-[0_0_0_3px_rgba(245,184,0,0.28)]'
                              : 'border-[#6D28D9]'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              row.isGoldDot ? 'bg-[#F59E0B]' : 'bg-[#6D2FC4]'
                            }`}
                          />
                        </div>

                        {/* Bold Time Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-xl font-mono text-[11px] sm:text-xs font-black tabular-nums shrink-0 border min-w-[88px] sm:min-w-[118px] text-center ${
                            isSelectedRouteRow
                              ? 'bg-[#2A1450] text-[#FFC928] border-[#2A1450]'
                              : row.isGoldDot
                              ? 'bg-[#FFF7D6] text-[#2A1450] border-[#F59E0B]/50'
                              : 'bg-white text-[#2A1450] border-purple-200'
                          }`}
                        >
                          {row.time}
                        </span>

                        {/* Pastel Icon Box */}
                        <span
                          className="hidden sm:flex w-8 h-8 rounded-xl items-center justify-center shrink-0 border border-white shadow-xs"
                          style={{ background: row.iconBg, color: row.iconColor }}
                        >
                          <Icon className="w-4 h-4 stroke-[2.4]" />
                        </span>

                        {/* Activity Title & Subtitle */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-extrabold text-[#2A1450] leading-snug">
                            {row.title}
                          </div>
                          {row.desc && (
                            <div className="text-[11px] text-[#5B4878] font-semibold leading-snug mt-0.5">
                              {row.desc}
                            </div>
                          )}
                        </div>

                        {/* Right Wave Tag */}
                        <span
                          className="hidden xl:inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0"
                          style={{ background: row.iconBg, color: row.iconColor }}
                        >
                          {row.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* RIGHT CARD: เส้นทางวิ่ง (GPS Survey)                            */}
          {/* -------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] border-[3px] border-[#2A1450] shadow-[0_20px_42px_-16px_rgba(42,20,80,0.32),0_7px_0_#2A1450] flex flex-col justify-between overflow-hidden relative">
            {/* Top Colorful Accent Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-[#0284C7] via-[#16A34A] to-[#FFC928]" />

            <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-dashed border-[#2A1450]/15">
                  <div className="flex items-center gap-3.5">
                    <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white border-2 border-[#2A1450] shadow-[2px_3px_0_#2A1450] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#2A1450] leading-tight">
                        เส้นทางวิ่ง (GPS Survey)
                      </h3>
                      <span className="block text-xs font-bold text-[#6B5A85] mt-0.5">
                        เลียบชายหาดชะอำ – ค่ายนเรศวร (ปล่อยตัวยามเย็น 16.30 - 17.30 น.)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={scrollToFullMap}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F3ECFF] hover:bg-[#E6D6FC] text-[#4B1C8C] border-2 border-[#2A1450] shadow-[0_3px_0_#2A1450] px-4 py-2 text-xs font-extrabold transition-transform hover:scale-105 cursor-pointer"
                  >
                    <span>ดูเส้นทางเต็มจอ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4 Route Selector Pills + Simulator CTA */}
                <div className="flex flex-wrap items-center gap-2 my-4">
                  {routePills.map((pill) => {
                    const isSelected = selectedRoute === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => onSelectRoute && onSelectRoute(pill.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border-2 ${
                          isSelected
                            ? 'border-[#2A1450] shadow-[0_3px_0_#2A1450] -translate-y-0.5'
                            : 'border-transparent hover:border-[#2A1450]/30'
                        }`}
                        style={{
                          background: isSelected ? pill.activeBg : pill.idleBg,
                          color: isSelected ? pill.activeText : pill.idleText,
                        }}
                      >
                        {pill.label}
                      </button>
                    );
                  })}

                </div>

                {/* Illustrated course map (organiser's artwork) */}
                <RouteIllustratedMap
                  selectedRoute={selectedRoute}
                  onSelectRoute={onSelectRoute}
                  showLegend={false}
                  className="mb-3.5"
                />

                {/* Active Route Mini Telemetry Strip */}
                <div className="grid grid-cols-3 gap-2.5 mb-3.5 bg-[#FAF7FF] rounded-2xl p-2.5 border border-purple-100">
                  <div className="bg-white rounded-xl px-3 py-1.5 border border-purple-100 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-[#7B3FC6] shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-[#6B5A85]">ระยะทางจริง</div>
                      <div className="text-xs sm:text-sm font-black text-[#2A1450] tabular-nums">
                        {activeRouteData.distanceKm} กม.
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl px-3 py-1.5 border border-purple-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C2410C] shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-[#6B5A85]">เวลาปล่อยตัว</div>
                      <div className="text-xs sm:text-sm font-black text-[#2A1450] tabular-nums">
                        {activeRouteData.startTime}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl px-3 py-1.5 border border-purple-100 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-[#0369A1] shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-[#6B5A85]">จุดบริการน้ำ</div>
                      <div className="text-xs sm:text-sm font-black text-[#2A1450] tabular-nums">
                        {activeRouteData.waterStationCount} จุดตลอดสาย
                      </div>
                    </div>
                  </div>
                </div>
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
            className="w-full max-w-[1400px] max-h-[92vh] overflow-auto rounded-[24px] bg-white border-[3px] border-[#2A1450] p-3 sm:p-5"
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
      {printModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#2A1450] overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:rounded-none">
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
                    CHANGSUEK RUN 2027 • 9 มกราคม 2570 ณ หาดชะอำ ค่ายนเรศวร
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
              {timelineRows.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-3.5 rounded-xl border border-purple-100 bg-[#FAF7FF]/50"
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
        </div>
      )}
    </section>
  );
};
