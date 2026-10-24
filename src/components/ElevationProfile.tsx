import React from 'react';
import { RouteId } from '../types';
import { routesData } from '../data/eventData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Mountain, ArrowUpRight, ArrowDownRight, Compass, Info } from 'lucide-react';

interface ElevationProfileProps {
  selectedRoute: RouteId;
}

export const ElevationProfile: React.FC<ElevationProfileProps> = ({ selectedRoute }) => {
  const currentRoute = routesData[selectedRoute];
  const profile = currentRoute.elevationProfile;

  return (
    <section id="elevation" className="py-12 bg-[#FAF9FC] border-b border-[#ECEAF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-3xl border border-[#ECEAF0] p-6 sm:p-8 shadow-sm">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mountain className="w-4 h-4" style={{ color: currentRoute.color }} />
                <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A76]">
                  กราฟระดับความสูงเส้นทาง (Elevation Profile)
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#18151D]">
                ระดับความสูงและลักษณะภูมิประเทศ — {currentRoute.name} ({currentRoute.distanceKm} KM)
              </h3>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="bg-[#FAF9FC] border border-[#ECEAF0] px-3 py-1.5 rounded-xl text-center">
                <div className="text-[10px] text-[#6F6A76] uppercase font-bold">ต่ำสุด</div>
                <div className="text-sm font-extrabold text-[#18151D]">4 ม.</div>
              </div>
              <div className="bg-[#FAF9FC] border border-[#ECEAF0] px-3 py-1.5 rounded-xl text-center">
                <div className="text-[10px] text-[#6F6A76] uppercase font-bold">สูงสุด</div>
                <div className="text-sm font-extrabold text-[#18151D]">
                  {selectedRoute === '10km' ? '14 ม.' : selectedRoute === '5km' ? '11 ม.' : selectedRoute === '1km' ? '5 ม.' : '7 ม.'}
                </div>
              </div>
              <div className="bg-[#FAF9FC] border border-[#ECEAF0] px-3 py-1.5 rounded-xl text-center">
                <div className="text-[10px] text-[#6F6A76] uppercase font-bold">Elevation Gain</div>
                <div className="text-sm font-extrabold text-[#2EAA59]">
                  +{selectedRoute === '10km' ? '28' : selectedRoute === '5km' ? '18' : selectedRoute === '1km' ? '2' : '10'} ม.
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={profile}
                margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`elevGrad-${selectedRoute}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentRoute.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={currentRoute.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="distanceKm"
                  tickFormatter={(val) => `${val}k`}
                  stroke="#A49FB0"
                  fontSize={12}
                />
                <YAxis
                  unit="m"
                  stroke="#A49FB0"
                  fontSize={12}
                  domain={[0, 'dataMax + 4']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-[#ECEAF0] text-xs">
                          <div className="font-extrabold text-[#18151D]">
                            กม. ที่ {data.distanceKm}
                          </div>
                          <div className="text-[#6F35B5] font-bold mt-0.5">
                            ระดับความสูง: {data.elevationM} เมตร
                          </div>
                          <div className="text-[#6F6A76] text-[11px] mt-0.5">
                            จุดอ้างอิง: {data.surface}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="elevationM"
                  stroke={currentRoute.color}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#elevGrad-${selectedRoute})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Route Terrain Type & Official Disclaimer */}
          <div className="mt-4 pt-4 border-t border-[#ECEAF0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6F6A76]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#8C4DDB]" />
              <span>
                <strong>ลักษณะพื้นผิว:</strong> {currentRoute.roadCondition}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8C4DDB] bg-[#F5EDFD] px-3 py-1 rounded-lg">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>ข้อมูลความสูงเส้นทางจะอัปเดตอย่างเป็นทางการหลังตรวจสอบ GPS Track จากคณะกรรมการ</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
