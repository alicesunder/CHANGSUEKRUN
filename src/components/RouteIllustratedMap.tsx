import React, { useEffect, useRef } from 'react';
import { RouteId } from '../types';

/**
 * Illustrated course map (organiser's artwork): background image + the three routes
 * drawn as SVG so the selected distance can be highlighted.
 * Colours: 10K purple, 5K red, 3K green. Path data simplified from run_route_map.svg.
 */
const W = 2830;
const H = 855;

type MapRoute = '10km' | '5km' | '3km';
export const ROUTE_STYLE: Record<MapRoute, { label: string; color: string; shine: string }> = {
  '10km': { label: '10 กม.', color: '#8B5CF6', shine: '#BFA5FA' },
  '5km': { label: '5 กม.', color: '#FF5460', shine: '#FFA0A7' },
  '3km': { label: '3 กม.', color: '#2EC468', shine: '#8CDEAB' },
};
const DRAW_ORDER: MapRoute[] = ['10km', '5km', '3km'];
const PATHS: Record<MapRoute, string[]> = {
  "10km": [
    "M1583,357 L1612,327 L1624,313 L1631,302 L1634,294 L1635,286 L1635,247 L1637,242 L1639,240 L1643,238 L1646,238 L1749,244 L1753,244 L1755,242 L1752,238 L1673,172 L1671,169 L1671,166 L1677,164 L1733,161 L1752,161 L2120,231 L2127,234 L2130,241 L2134,293 L2137,300 L2142,304 L2430,361 L2436,363 L2442,368 L2446,372 L2460,396 L2464,407 L2466,424 L2470,501 L2469,508 L2465,518 L2453,539 L2451,546 L2449,563 L2445,570 L2440,573 L2370,592 L2362,595 L2346,605 L2309,633 L2305,638 L2301,645 L2300,650 L2296,725 L2293,731 L2289,734 L2284,735 L2228,735 L2213,740 L2196,750 L2187,754 L2177,757 L2168,758 L2158,758 L2146,755 L2141,751 L2132,742 L2124,738 L2118,737 L2087,737 L2081,738 L2076,741 L2072,748 L2057,802 L2054,806 L2047,810 L2041,810 L2032,808 L2026,804 L2017,796 L2012,794 L2007,792 L1890,791 L1876,788 L1838,772 L1830,767 L1828,762 L1828,757 L1867,638 L1867,633 L1866,630 L1864,629 L1860,628 L1585,614 L1580,612 L1577,610 L1575,603 L1575,375 L1577,367 L1583,357",
    "M1575,365 L1561,365 L1555,366 L1548,372 L1542,382 L1537,388 L1530,391 L1522,391 L1488,385 L1432,382 L1420,377 L1402,365 L1390,360 L1218,335",
    "M1218,335 L866,332 L860,332 L855,334 L849,339 L846,345 L844,353 L843,360 L847,372 L858,392 L862,402 L877,457 L878,464 L878,470 L876,480 L862,522",
    "M1218,335 L862,522",
    "M862,522 L475,518 L470,518 L466,516 L465,512 L465,509 L473,488 L474,476 L472,470 L455,442 L452,432 L451,422 L454,384 L458,372 L470,347 L475,335 L480,294 L483,288 L489,283 L516,272 L529,264 L536,258 L541,253 L542,250 L543,245 L541,240 L522,220 L517,216 L506,214 L488,215 L479,215 L472,213 L466,210 L459,203 L452,193 L439,165 L436,161 L432,160 L426,161 L420,165 L392,182 L386,187 L380,197 L375,216 L370,225 L365,230 L340,249 L338,251 L335,256 L335,258 L337,263 L361,290 L364,296 L365,303 L365,307 L356,326 L355,334 L354,341 L367,397 L368,403 L367,408 L365,413 L347,435 L341,443 L332,464 L330,476 L331,481 L336,483 L462,497 L465,500 L466,503 L466,507 L460,518"
  ],
  "5km": [
    "M1592,382 L1592,587 L1594,593 L1597,596 L1602,597 L1883,612 L1887,613 L1890,616 L1890,618 L1890,623 L1849,747 L1849,752 L1851,758 L1855,761 L1882,772 L1893,775 L2016,775 L2021,777 L2025,779 L2036,790 L2040,793 L2044,785 L2059,731 L2063,724 L2068,721 L2073,720 L2131,720 L2136,722 L2141,725 L2149,734 L2154,738 L2162,741 L2168,741 L2175,740 L2183,737 L2208,723 L2221,719 L2229,718 L2265,718 L2271,717 L2276,714 L2279,708 L2283,644 L2284,637 L2289,628 L2294,624 L2342,587 L2354,580 L2364,576 L2421,560 L2427,558 L2432,552 L2435,535 L2438,529 L2448,513 L2452,500 L2449,424 L2448,414 L2444,404 L2438,392 L2430,383 L2422,377 L2126,318 L2121,314 L2118,307 L2114,255 L2111,249 L2104,246 L1754,179 L1740,178 L1724,178 L1716,180 L1715,183 L1716,185 L1801,258 L1807,264 L1792,264 L1662,256 L1657,257 L1654,259 L1652,264 L1652,298 L1649,309 L1646,314 L1627,336 L1599,366 L1593,376 L1592,382",
    "M1592,597 L1551,818 L1544,837 L1530,862"
  ],
  "3km": [
    "M1777,207 L1795,225 L1803,229 L1902,234 L1908,237 L1909,240 L1909,244 L1900,292 L1901,300 L1906,308 L1921,321 L1929,331 L1999,456 L1999,460 L1995,467 L1923,519 L1914,528 L1907,541 L1903,552 L1902,559 L1902,604 L1900,621 L1868,738 L1868,742 L1870,747 L1877,752 L1890,756 L1902,758 L2023,758 L2030,759 L2032,760 L2035,754 L2047,712 L2050,708 L2057,704 L2140,703 L2145,705 L2150,708 L2161,721 L2166,724 L2169,724 L2179,720 L2203,706 L2214,702 L2221,701 L2251,701 L2257,700 L2260,697 L2263,692 L2267,631 L2270,622 L2273,618 L2336,570 L2344,566 L2355,561 L2408,546 L2412,544 L2415,541 L2417,531 L2419,526 L2429,511 L2432,504 L2434,497 L2435,490 L2432,428 L2430,418 L2428,411 L2424,403 L2420,398 L2414,393 L2406,391 L2110,332 L2105,328 L2102,321 L2098,269 L2095,263 L2088,260 L1778,201 L1775,201 L1774,202 L1777,207"
  ]
};
/** Horizontal centre of each route (for auto-scrolling on narrow screens) */
const CENTER_X: Record<MapRoute, number> = { '10km': 1400, '5km': 1990, '3km': 2105 };

export const RouteIllustratedMap: React.FC<{
  selectedRoute: RouteId;
  onSelectRoute?: (id: RouteId) => void;
  /** colour-key buttons under the map (hide when route pills sit right above) */
  showLegend?: boolean;
  className?: string;
}> = ({ selectedRoute, onSelectRoute, showLegend = true, className = '' }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const onMap = selectedRoute in ROUTE_STYLE;

  // On narrow screens the map scrolls sideways; bring the selected route into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const cx = onMap ? CENTER_X[selectedRoute as MapRoute] : 2000;
    el.scrollTo({ left: (cx / W) * el.scrollWidth - el.clientWidth / 2, behavior: 'smooth' });
  }, [selectedRoute, onMap]);

  return (
    <div className={className}>
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-2xl border-[2.5px] border-[#2A1450] bg-[#7FCDEB]"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full min-w-[880px] lg:min-w-0 h-auto"
          role="img"
          aria-label="แผนที่เส้นทางวิ่ง 3 กม. (เขียว) 5 กม. (แดง) และ 10 กม. (ม่วง)"
        >
          <defs>
            <filter id="route-shadow" x="-5%" y="-5%" width="110%" height="115%">
              <feDropShadow dx="4" dy="7" stdDeviation="6" floodColor="#283c28" floodOpacity="0.45" />
            </filter>
          </defs>
          <image href="/images/route/route-map-bg.webp" width={W} height={H} preserveAspectRatio="none" />
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#route-shadow)">
            {DRAW_ORDER.filter((r) => r !== selectedRoute)
              .concat(onMap ? [selectedRoute as MapRoute] : [])
              .map((r) => {
                const dim = onMap && r !== selectedRoute;
                const st = ROUTE_STYLE[r];
                return (
                  <g key={r} opacity={dim ? 0.3 : 1} style={{ transition: 'opacity .3s' }}>
                    {PATHS[r].map((d, i) => (
                      <path key={`w${i}`} d={d} stroke="#FFFFFF" strokeWidth={23} />
                    ))}
                    {PATHS[r].map((d, i) => (
                      <path key={`c${i}`} d={d} stroke={st.color} strokeWidth={13} />
                    ))}
                    {PATHS[r].map((d, i) => (
                      <path key={`s${i}`} d={d} stroke={st.shine} strokeWidth={3.6} transform="translate(0,-2.2)" />
                    ))}
                  </g>
                );
              })}
          </g>
        </svg>
      </div>

      {/* Legend doubles as a route selector */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {showLegend &&
          DRAW_ORDER.map((r) => {
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
        {!onMap && (
          <span className="text-xs font-semibold text-[#6B5A85]">
            แผนที่นี้แสดงเส้นทาง 3 / 5 / 10 กม. (ยังไม่มีเส้นทาง 1 กม.)
          </span>
        )}
        <span className="lg:hidden text-xs font-semibold text-[#6B5A85]">← ปัดเพื่อดูแผนที่ →</span>
      </div>
    </div>
  );
};
