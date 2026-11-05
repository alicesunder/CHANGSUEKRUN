import React, { useEffect, useRef, useState } from 'react';
import { RouteId } from '../types';
import { showActivitySticker, type ActivityStickerId } from './ActivitySticker';

/**
 * Course maps (organiser's artwork). Routes are drawn as SVG so the selected distance can be
 * highlighted:
 *  - "big" map: 10 km (purple) and 5 km (red)
 *  - "camp" map: 4 km (orange) and 1 km (pink)
 */
export const ROUTE_STYLE: Record<RouteId, { label: string; color: string; shine: string }> = {
  '10km': { label: '10 กม.', color: '#8B5CF6', shine: '#BFA5FA' },
  '5km': { label: '5 กม.', color: '#FF5460', shine: '#FFA0A7' },
  '3km': { label: '4 กม.', color: '#FF8A00', shine: '#FFBE72' },
  '1km': { label: '1 กม.', color: '#EC4899', shine: '#F49AC6' },
};
const LEGEND_ORDER: RouteId[] = ['10km', '5km', '3km', '1km'];
const ROUTE_KM: Record<RouteId, number> = { '10km': 10, '5km': 5, '3km': 4, '1km': 1 };
/** how long the "survey run" takes to cover the whole line (ms) */
const SURVEY_MS: Record<RouteId, number> = { '10km': 16000, '5km': 13000, '3km': 11000, '1km': 7000 };

/**
 * A place marked on the map: a pin with its name, and optionally a sticker picture joined to the pin
 * by a dotted line. Positions are in the artwork's own pixels (approximate, from the organiser's map).
 */
interface Landmark {
  id: string;
  pin: [number, number];
  label: string;
  sub?: string;
  /** label goes above the pin instead of below */
  labelAbove?: boolean;
  /** put the label here instead (artwork pixels), left-aligned from this point unless `anchor` says otherwise */
  labelAt?: [number, number];
  anchor?: 'start' | 'middle' | 'end';
  /** label font size in artwork pixels (a long name on a narrow map) */
  fs?: number;
  color: string;
  sticker?: { id: ActivityStickerId; src: string; x: number; y: number; w: number; h: number; rotate?: number };
}

interface MapDef {
  w: number;
  h: number;
  bg: string;
  /** minimum width before the map scrolls sideways (px) */
  minW?: number;
  routes: Partial<Record<RouteId, string[]>>;
  /** the start line, the same for every distance (artwork pixels) */
  start: [number, number];
  label: string;
  landmarks?: Landmark[];
}

const BIG: MapDef = {
  w: 2830,
  h: 855,
  start: [1672, 167],
  bg: '/images/route/route-map-bg.webp',
  minW: 880,
  label: 'แผนที่เส้นทางวิ่ง 5 กม. (แดง) และ 10 กม. (ม่วง)',
  landmarks: [
    {
      id: 'mangrove',
      pin: [440, 172],
      label: 'หอดูนก · ป่าชายเลน',
      sub: 'อุทยานสิ่งแวดล้อมนานาชาติสิรินธร',
      color: '#16A34A',
      sticker: { id: 'mangrove', src: '/images/map/sticker-mangrove.webp', x: 6, y: 280, w: 320, h: 320, rotate: -5 },
    },
    { id: 'palace', pin: [1040, 300], label: 'พระราชนิเวศน์มฤคทายวัน', labelAbove: true, color: '#B45309' },
    {
      id: 'resort',
      pin: [1560, 250],
      label: 'Sea Sand Sun Hua Hin Resort',
      labelAbove: true,
      color: '#0284C7',
      sticker: { id: 'resort', src: '/images/map/sticker-resort.webp', x: 1110, y: -95, w: 400, h: 267, rotate: 4 },
    },
    {
      id: 'camp',
      pin: [1730, 470],
      label: 'ค่ายนเรศวร',
      sub: 'กองบัญชาการตำรวจตระเวนชายแดน',
      color: '#7C3AED',
      sticker: { id: 'camp', src: '/images/map/sticker-bpp-school.webp', x: 1645, y: 628, w: 196, h: 199, rotate: -4 },
    },
    {
      id: 'statue',
      pin: [2105, 748],
      label: 'พระบรมราชานุสาวรีย์',
      sub: 'สมเด็จพระนเรศวรมหาราช',
      color: '#D97706',
      sticker: { id: 'statue', src: '/images/map/sticker-statue.webp', x: 2470, y: 480, w: 330, h: 330, rotate: -4 },
    },
  ],
  routes: {
  "10km": [
    "M1672,167 L1677,164 L1733,161 L1752,161 L2120,231 L2127,234 L2130,241 L2134,293 L2137,300 L2142,304 L2430,361 L2436,363 L2442,368 L2446,372 L2460,396 L2464,407 L2466,424 L2470,501 L2469,508 L2465,518 L2453,539 L2451,546 L2449,563 L2445,570 L2440,573 L2370,592 L2362,595 L2346,605 L2309,633 L2305,638 L2301,645 L2300,650 L2296,725 L2293,731 L2289,734 L2284,735 L2228,735 L2213,740 L2196,750 L2187,754 L2177,757 L2168,758 L2158,758 L2146,755 L2141,751 L2132,742 L2124,738 L2118,737 L2087,737 L2081,738 L2076,741 L2072,748 L2057,802 L2054,806 L2047,810 L2041,810 L2032,808 L2026,804 L2017,796 L2012,794 L2007,792 L1890,791 L1876,788 L1838,772 L1830,767 L1828,762 L1828,757 L1867,638 L1867,633 L1866,630 L1864,629 L1860,628 L1585,614 L1580,612 L1577,610 L1575,603 L1575,375 L1577,367 L1583,357",
    "M1575,365 L1561,365 L1555,366 L1548,372 L1542,382 L1537,388 L1530,391 L1522,391 L1488,385 L1432,382 L1420,377 L1402,365 L1390,360 L1218,335",
    "M1218,335 L862,522",
    "M862,522 L475,518 L470,518 L466,516 L465,512 L465,509 L473,488 L474,476 L472,470 L455,442 L452,432 L451,422 L454,384 L458,372 L470,347 L475,335 L480,294 L483,288 L489,283 L516,272 L529,264 L536,258 L541,253 L542,250 L543,245 L541,240 L522,220 L517,216 L506,214 L488,215 L479,215 L472,213 L466,210 L459,203 L452,193 L439,165 L436,161 L432,160 L426,161 L420,165 L392,182 L386,187 L380,197 L375,216 L370,225 L365,230 L340,249 L338,251 L335,256 L335,258 L337,263 L361,290 L364,296 L365,303 L365,307 L356,326 L355,334 L354,341 L367,397 L368,403 L367,408 L365,413 L347,435 L341,443 L332,464 L330,476 L331,481 L336,483 L462,497 L465,500 L466,503 L466,507 L460,518",
    "M475,518 L862,522",
    "M862,522 L876,480 L878,470 L878,464 L877,457 L862,402 L858,392 L847,372 L843,360 L844,353 L846,345 L849,339 L855,334 L860,332 L866,332 L1218,335",
    "M1218,335 L1390,360 L1402,365 L1420,377 L1432,382 L1488,385 L1522,391 L1530,391 L1537,388 L1542,382 L1548,372 L1555,366 L1561,365 L1575,365",
    "M1575,365 L1583,357",
    "M1583,357 L1612,327 L1624,313 L1631,302 L1634,294 L1635,286 L1635,247 L1637,242 L1639,240 L1643,238 L1646,238 L1749,244 L1753,244 L1755,242 L1752,238 L1673,172 L1671,169 L1671,166"
  ],
  "5km": [
    "M1672,167 L1724,178 L1740,178 L1754,179 L2104,246 L2111,249 L2114,255 L2118,307 L2121,314 L2126,318 L2422,377 L2430,383 L2438,392 L2444,404 L2448,414 L2449,424 L2452,500 L2448,513 L2438,529 L2435,535 L2432,552 L2427,558 L2421,560 L2364,576 L2354,580 L2342,587 L2294,624 L2289,628 L2284,637 L2283,644 L2279,708 L2276,714 L2271,717 L2265,718 L2229,718 L2221,719 L2208,723 L2183,737 L2175,740 L2168,741 L2162,741 L2154,738 L2149,734 L2141,725 L2136,722 L2131,720 L2073,720 L2068,721 L2063,724 L2059,731 L2044,785 L2040,793 L2036,790 L2025,779 L2021,777 L2016,775 L1893,775 L1882,772 L1855,761 L1851,758 L1849,752 L1849,747 L1890,623 L1890,618 L1890,616 L1887,613 L1883,612 L1602,597 L1597,596 L1594,593",
    "M1592,597 L1551,818 L1544,837 L1530,862",
    "M1530,862 L1544,837 L1551,818 L1592,597",
    "M1594,593 L1592,587 L1592,382 L1593,376 L1599,366 L1627,336 L1646,314 L1649,309 L1652,298 L1652,264 L1654,259 L1657,257 L1662,256 L1792,264 L1807,264 L1801,258 L1716,185 L1715,183 L1716,180 L1724,178 L1672,167"
  ]
},
};

const CAMP: MapDef = {
  w: 1482,
  h: 1470,
  start: [144, 319],
  bg: '/images/route/route-map-camp.webp',
  label: 'แผนที่เส้นทางวิ่ง 1 กม. (ชมพู) และ 4 กม. (ส้ม)',
  landmarks: [
    {
      id: 'resort',
      pin: [96, 410],
      label: 'Sea Sand Sun Resort',
      labelAt: [58, 470],
      color: '#0284C7',
      sticker: { id: 'resort', src: '/images/map/sticker-resort.webp', x: 330, y: -70, w: 420, h: 280, rotate: 4 },
    },
    {
      id: 'camp',
      pin: [900, 840],
      label: 'ค่ายนเรศวร',
      sub: 'กองบัญชาการ ตชด.',
      labelAt: [900, 925],
      anchor: 'middle',
      color: '#7C3AED',
      sticker: { id: 'camp', src: '/images/map/sticker-bpp-school.webp', x: 1010, y: 650, w: 240, h: 243, rotate: -4 },
    },
    {
      id: 'statue',
      pin: [968, 1352],
      label: 'พระบรมราชานุสาวรีย์',
      sub: 'สมเด็จพระนเรศวรมหาราช',
      labelAt: [1468, 1196],
      anchor: 'end',
      fs: 32,
      color: '#D97706',
      sticker: { id: 'statue', src: '/images/map/sticker-statue.webp', x: 1236, y: 1236, w: 230, h: 230, rotate: -4 },
    },
  ],
  routes: {
  // 4 km: traced from the organiser's hand-drawn red line over the camp map (Nov 2026)
  "3km": [
    "M144,319 L235,332 L307,325 L342,328 L401,345 L574,374 L666,398 L714,412 L772,436 L814,447 L824,453 L830,462 L833,477 L835,542 L846,556 L859,564 L916,583 L1027,603 L1059,614 L1150,631 L1248,657 L1318,662 L1337,667 L1351,679 L1388,725 L1398,747 L1394,765 L1365,831 L1351,925 L1343,1030 L1320,1045 L1223,1086 L1168,1121 L1135,1176 L1123,1225 L1122,1281 L1115,1302 L1085,1317 L1064,1332 L1016,1339 L998,1363 L990,1368 L953,1374 L912,1342 L874,1339 L845,1330 L820,1327 L798,1334 L764,1366 L745,1392 L712,1397 L670,1411 L601,1407 L570,1398 L542,1395 L488,1399 L459,1392 L420,1366 L395,1339 L390,1321 L392,1294 L415,1254 L422,1227 L431,1149 L431,1047 L445,958 L451,936 L465,916 L509,874 L566,830 L571,819 L570,809 L519,734 L455,656 L436,627 L423,594 L419,536 L412,515 L386,503 L307,489 L258,471 L211,422 L188,379 L165,349 L144,319"
  ],
  "1km": [
    "M144,319 L686,407 L144,319"
  ]
},
};

/** Little arrowheads along a route (every `step` px of its polyline), pointing the way the runners go. */
function arrowsAlong(paths: string[], step: number): { x: number; y: number; a: number }[] {
  const out: { x: number; y: number; a: number }[] = [];
  let carry = step / 2;
  for (const d of paths) {
    const pts = [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (!len) continue;
      const a = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
      let t = carry;
      while (t <= len) {
        out.push({ x: x0 + ((x1 - x0) * t) / len, y: y0 + ((y1 - y0) * t) / len, a });
        t += step;
      }
      carry = t - len;
    }
  }
  return out;
}

/** One landmark: dotted leader line, bobbing sticker (tap = big sticker pop), pin and name. */
const MapLandmark: React.FC<{ lm: Landmark; big: boolean; index: number }> = ({ lm, big, index }) => {
  const [px, py] = lm.pin;
  const fs = lm.fs ?? (big ? 44 : 46);
  const st = lm.sticker;
  const labelY = lm.labelAt ? lm.labelAt[1] : lm.labelAbove ? py - 92 : py + fs + 6;
  const labelX = lm.labelAt ? lm.labelAt[0] : px;
  const anchor = lm.anchor ?? (lm.labelAt ? 'start' : 'middle');
  const pop = () => st && showActivitySticker(st.id, lm.sub ? `${lm.label} · ${lm.sub}` : lm.label);
  return (
    <g className="map-landmark" style={{ ['--i' as string]: index }}>
      {st && (
        <>
          <path
            d={`M${st.x + st.w / 2},${st.y + st.h / 2} L${px},${py - 40}`}
            stroke="#2A1450"
            strokeWidth={5}
            strokeDasharray="4 14"
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
          />
          <g
            className="map-sticker"
            role="button"
            tabIndex={0}
            aria-label={`ดูสติกเกอร์ ${lm.label}`}
            onClick={pop}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pop())}
            // CSS rotate turns it around its own centre (.map-sticker: transform-box fill-box); an SVG
            // transform attribute here would be shifted by that transform-origin as well
            style={{ rotate: `${st.rotate ?? 0}deg` }}
          >
            <image href={st.src} x={st.x} y={st.y} width={st.w} height={st.h} preserveAspectRatio="xMidYMid meet" />
          </g>
        </>
      )}
      <g className="map-pin" transform={`translate(${px} ${py})`}>
        <ellipse cx={0} cy={2} rx={16} ry={6} fill="#000" opacity={0.25} />
        <path d="M0,0 C-10,-18 -24,-30 -24,-50 A24,24 0 1 1 24,-50 C24,-30 10,-18 0,0 Z" fill={lm.color} stroke="#FFFFFF" strokeWidth={5} />
        <circle cx={0} cy={-50} r={9} fill="#FFFFFF" />
      </g>
      <text
        x={labelX}
        y={labelY}
        textAnchor={anchor}
        fontSize={fs}
        fontWeight={900}
        fill="#2A1450"
        stroke="#FFFFFF"
        strokeWidth={10}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: 'inherit' }}
      >
        {lm.label}
        {lm.sub && (
          <tspan x={labelX} dy={fs * 0.95} fontSize={fs * 0.72} fontWeight={800} fill={lm.color}>
            {lm.sub}
          </tspan>
        )}
      </text>
    </g>
  );
};

/** Horizontal centre of each route on the wide map (for auto-scrolling on narrow screens) */
const CENTER_X: Partial<Record<RouteId, number>> = { '10km': 1400, '5km': 1990 };

export const RouteIllustratedMap: React.FC<{
  selectedRoute: RouteId;
  onSelectRoute?: (id: RouteId) => void;
  /** colour-key buttons under the map (hide when route pills sit right above) */
  showLegend?: boolean;
  className?: string;
}> = ({ selectedRoute, onSelectRoute, showLegend = true, className = '' }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const map = selectedRoute === '10km' || selectedRoute === '5km' ? BIG : CAMP;
  const ids = (Object.keys(map.routes) as RouteId[]).filter((r) => r !== selectedRoute).concat(selectedRoute);

  // "Survey run": a runner + dog marker travels the selected line from start to finish.
  const measureRefs = useRef<(SVGPathElement | null)[]>([]);
  const [survey, setSurvey] = useState<{ route: RouteId; p: number; x: number; y: number; seg: number; segP: number } | null>(null);
  const surveyOn = survey?.route === selectedRoute;
  const startSurvey = () => setSurvey({ route: selectedRoute, p: 0, x: 0, y: 0, seg: 0, segP: 0 });
  const stopSurvey = () => setSurvey(null);

  useEffect(() => {
    if (!survey || survey.route !== selectedRoute) return;
    const paths = measureRefs.current.slice(0, (map.routes[selectedRoute] || []).length).filter(Boolean) as SVGPathElement[];
    if (!paths.length) return;
    const lens = paths.map((p) => p.getTotalLength());
    const total = lens.reduce((a, b) => a + b, 0);
    const popped = new Set<string>();
    const dur = SURVEY_MS[selectedRoute];
    let raf = 0;
    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / dur);
      let d = p * total;
      let seg = 0;
      while (seg < lens.length - 1 && d > lens[seg]) d -= lens[seg++];
      const pt = paths[seg].getPointAtLength(Math.min(d, lens[seg]));
      setSurvey((s) => (s && s.route === selectedRoute ? { ...s, p, x: pt.x, y: pt.y, seg, segP: lens[seg] ? d / lens[seg] : 1 } : s));
      // pop the landmark sticker as the runner passes it
      for (const lm of map.landmarks || []) {
        if (lm.sticker && !popped.has(lm.id) && Math.hypot(lm.pin[0] - pt.x, lm.pin[1] - pt.y) < 150) {
          popped.add(lm.id);
          showActivitySticker(lm.sticker.id, lm.sub ? `${lm.label} · ${lm.sub}` : lm.label);
        }
      }
      // keep the runner in view on narrow screens
      const el = scrollRef.current;
      if (el && el.scrollWidth > el.clientWidth) {
        const want = (pt.x / map.w) * el.scrollWidth - el.clientWidth / 2;
        if (Math.abs(el.scrollLeft - want) > el.clientWidth * 0.25) el.scrollLeft = want;
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [survey?.route, selectedRoute, map]);

  useEffect(() => {
    const el = scrollRef.current;
    const cx = CENTER_X[selectedRoute];
    if (!el || map !== BIG || !cx || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: (cx / BIG.w) * el.scrollWidth - el.clientWidth / 2, behavior: 'smooth' });
  }, [selectedRoute, map]);

  return (
    <div className={`relative ${className}`}>
      {/* survey-run progress: outside the sideways scroller so it stays in view */}
      {surveyOn && survey && (
        <div className="absolute left-3 top-12 z-10 pointer-events-none rounded-2xl bg-[#2A1450]/90 text-white px-3 py-2 text-xs sm:text-sm font-extrabold shadow-lg backdrop-blur" role="status" aria-live="polite">
          {survey.p < 1 ? '🏃 กำลังวิ่งสำรวจ' : '🏁 ถึงเส้นชัย!'} {ROUTE_STYLE[selectedRoute].label}
          <span className="block font-mono text-[#FFE268] text-base sm:text-lg leading-tight">
            {(survey.p * ROUTE_KM[selectedRoute]).toFixed(1)} / {ROUTE_KM[selectedRoute]} กม.
          </span>
          <span className="mt-1 block h-1.5 w-32 rounded-full bg-white/20 overflow-hidden">
            <span className="block h-full rounded-full bg-[#FFE268]" style={{ width: `${survey.p * 100}%` }} />
          </span>
        </div>
      )}
      <div
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label={`${map.label} เลื่อนซ้ายขวาเพื่อดูได้`}
        className="overflow-x-auto overflow-y-hidden pt-10"
      >
        {/* stickers may stick out above the frame, into the padding of the scroller */}
        <div className={`relative rounded-2xl border-[2.5px] border-[#2A1450] bg-[#7FCDEB] ${map.minW ? 'min-w-[880px] lg:min-w-0' : ''}`}>
        <svg
          viewBox={`0 0 ${map.w} ${map.h}`}
          className="block w-full h-auto overflow-visible"
          role="img"
          aria-label={map.label}
        >
          <defs>
            <filter id="route-shadow" x="-5%" y="-5%" width="110%" height="115%">
              <feDropShadow dx="4" dy="7" stdDeviation="6" floodColor="#283c28" floodOpacity="0.45" />
            </filter>
            <clipPath id={`map-clip-${map === BIG ? 'big' : 'camp'}`}>
              <rect width={map.w} height={map.h} rx={36} />
            </clipPath>
          </defs>
          <g clipPath={`url(#map-clip-${map === BIG ? 'big' : 'camp'})`}>
          <image href={map.bg} width={map.w} height={map.h} preserveAspectRatio="none" />
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#route-shadow)">
            {ids.map((r) => {
              const dim = r !== selectedRoute;
              const st = ROUTE_STYLE[r];
              const paths = map.routes[r] || [];
              return (
                <g key={r} opacity={dim ? 0.3 : 1} style={{ transition: 'opacity .3s' }}>
                  {paths.map((d, i) => (
                    <path key={`w${i}`} d={d} stroke="#FFFFFF" strokeWidth={map === BIG ? 23 : 22} />
                  ))}
                  {paths.map((d, i) => (
                    <path key={`c${i}`} d={d} stroke={st.color} strokeWidth={map === BIG ? 13 : 12} />
                  ))}
                  {paths.map((d, i) => (
                    <path key={`s${i}`} d={d} stroke={st.shine} strokeWidth={3.6} transform="translate(0,-2.2)" />
                  ))}
                </g>
              );
            })}
          </g>
          </g>
          {/* invisible copies of the selected line, used to measure the survey run */}
          <g fill="none" stroke="none" aria-hidden="true">
            {(map.routes[selectedRoute] || []).map((d, i) => (
              <path key={`${selectedRoute}-m${i}`} d={d} ref={(el) => { measureRefs.current[i] = el; }} />
            ))}
          </g>
          {surveyOn && survey && (
            <g aria-hidden="true" pointerEvents="none">
              {/* the part already covered glows gold */}
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {(map.routes[selectedRoute] || []).map((d, i) =>
                  i > survey.seg ? null : (
                    <path
                      key={`t${i}`}
                      d={d}
                      pathLength={1}
                      stroke="#FFE268"
                      strokeWidth={map === BIG ? 10 : 9}
                      strokeDasharray={i < survey.seg ? '1 0' : `${survey.segP} 1`}
                    />
                  )
                )}
              </g>
              <g transform={`translate(${survey.x} ${survey.y})`}>
                <circle r={70} fill={ROUTE_STYLE[selectedRoute].color} opacity={0.25} className="survey-ping" />
                <circle r={42} fill="#FFFFFF" stroke="#2A1450" strokeWidth={7} />
                <text y={16} textAnchor="middle" fontSize={46}>
                  🏃
                </text>
                <text x={44} y={30} textAnchor="middle" fontSize={40}>
                  🐕
                </text>
              </g>
            </g>
          )}
          {/* direction of travel of the selected distance */}
          <g aria-hidden="true" pointerEvents="none">
            {arrowsAlong(map.routes[selectedRoute] || [], map === BIG ? 150 : 110).map((ar, i) => (
              <path
                key={i}
                d="M-13,-11 L13,0 L-13,11 L-6,0 Z"
                transform={`translate(${ar.x} ${ar.y}) rotate(${ar.a}) scale(${map === BIG ? 1.15 : 1.05})`}
                fill="#FFFFFF"
                stroke={ROUTE_STYLE[selectedRoute].color}
                strokeWidth={3.5}
                strokeLinejoin="round"
              />
            ))}
          </g>
          {map.landmarks?.map((lm, i) => (
            <MapLandmark key={lm.id} lm={lm} big={map === BIG} index={i} />
          ))}
          {/* the start line, the same place for every distance */}
          <g transform={`translate(${map.start[0]} ${map.start[1]})`} aria-label="จุดสตาร์ท">
            <circle r={map === BIG ? 20 : 18} fill="#16A34A" stroke="#FFFFFF" strokeWidth={6} />
            <text x={26} y={map === BIG ? -16 : -22} textAnchor="start" fontSize={map === BIG ? 46 : 44} fontWeight={900} fill="#14532D" stroke="#FFFFFF" strokeWidth={10} strokeLinejoin="round" paintOrder="stroke">
              🏁 START
            </text>
          </g>
        </svg>
        </div>
      </div>

      {/* Legend doubles as a route selector */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={surveyOn && survey && survey.p < 1 ? stopSurvey : startSurvey}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full text-xs sm:text-sm font-black text-white border-2 border-[#2A1450] shadow-[0_3px_0_#2A1450] cursor-pointer active:translate-y-0.5"
          style={{ background: `linear-gradient(135deg, ${ROUTE_STYLE[selectedRoute].color}, #2A1450)` }}
        >
          {surveyOn && survey && survey.p < 1 ? '⏹ หยุด' : surveyOn ? '🔁 วิ่งสำรวจอีกครั้ง' : `▶ วิ่งสำรวจเส้นทาง ${ROUTE_STYLE[selectedRoute].label}`}
        </button>
        {showLegend &&
          LEGEND_ORDER.map((r) => {
            const st = ROUTE_STYLE[r];
            const active = selectedRoute === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onSelectRoute?.(r)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 min-h-[36px] px-3 rounded-full bg-white text-xs font-extrabold text-[#2A1450] border-2 cursor-pointer ${
                  active ? 'border-[#2A1450] shadow-[0_3px_0_#2A1450]' : 'border-[#2A1450]/15'
                }`}
              >
                <span className="w-6 h-2.5 rounded-full" style={{ background: st.color }} />
                {st.label}
              </button>
            );
          })}
        {map === BIG && <span className="lg:hidden text-xs font-semibold text-[#6B5A85]">← ปัดเพื่อดูแผนที่ →</span>}
      </div>
    </div>
  );
};
