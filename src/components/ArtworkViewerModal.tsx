import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Share2, Check, Globe, MapPin, Compass } from 'lucide-react';
import { eventInfo, routesData } from '../data/eventData';

interface ArtworkViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: '1km' | '3km' | '5km' | '10km' | 'map';
  onOpenSimulation?: (id?: '1km' | '3km' | '5km' | '10km') => void;
  onOpenRunnerCenter?: () => void;
}

export const ArtworkViewerModal: React.FC<ArtworkViewerModalProps> = ({
  isOpen,
  onClose,
  defaultTab = '3km',
  onOpenSimulation,
  onOpenRunnerCenter,
}) => {
  const [activeTab, setActiveTab] = useState<'1km' | '3km' | '5km' | '10km' | 'map'>(defaultTab);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);
  const [mapRouteId, setMapRouteId] = useState<'1km' | '3km' | '5km' | '10km'>(
    defaultTab === 'map' ? '3km' : (defaultTab as '1km' | '3km' | '5km' | '10km')
  );

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  const handleResetZoom = () => setZoomLevel(1);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'CHANG SUEK RUN 2026 Route Map',
        text: 'แผนที่เส้นทางวิ่งทางการ เห็นช้างวิ่ง วิ่งตามช้าง 2026 ค่ายนเรศวร ชะอำ',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const currentRouteData = activeTab === '1km' || activeTab === '3km' || activeTab === '5km' || activeTab === '10km' ? routesData[activeTab] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#18151D] text-white rounded-3xl max-w-5xl w-full h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 bg-[#241E2D] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6F35B5] flex items-center justify-center">
              <Globe className="w-4 h-4 text-[#FFC928]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Google Earth Survey & Official Artwork Gallery
              </h3>
              <p className="text-[11px] text-white/60">
                ข้อมูลรังวัดเส้นทางภาพถ่ายดาวเทียม • CHANG SUEK RUN 2026
              </p>
            </div>
          </div>

          {/* Switch Tab between Routes & Map */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-black/40 p-1 rounded-xl flex items-center gap-1 border border-white/10 overflow-x-auto max-w-full">
              <button
                onClick={() => {
                  setActiveTab('1km');
                  setMapRouteId('1km');
                  handleResetZoom();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === '1km' ? 'bg-[#FF8A3D] text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                ดาวเทียม Dog 1 KM
              </button>
              <button
                onClick={() => {
                  setActiveTab('3km');
                  setMapRouteId('3km');
                  handleResetZoom();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === '3km' ? 'bg-[#2EAA59] text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                ดาวเทียม Dog 3.8 KM (4.08k)
              </button>
              <button
                onClick={() => {
                  setActiveTab('5km');
                  setMapRouteId('5km');
                  handleResetZoom();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === '5km' ? 'bg-[#E53935] text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                ดาวเทียม 5 KM (5.20k)
              </button>
              <button
                onClick={() => {
                  setActiveTab('10km');
                  setMapRouteId('10km');
                  handleResetZoom();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === '10km' ? 'bg-[#6F35B5] text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                ดาวเทียม 10 KM (10.52k)
              </button>
              <button
                onClick={() => {
                  setActiveTab('map');
                  handleResetZoom();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'map' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                โปสเตอร์เส้นทาง
              </button>
            </div>

            {onOpenSimulation && (
              <button
                onClick={() => {
                  onClose();
                  const target = activeTab === 'map' ? '3km' : activeTab;
                  onOpenSimulation(target);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFC928] hover:bg-[#F5B800] text-[#17151C] text-xs font-black transition-all cursor-pointer whitespace-nowrap"
              >
                <span>▶ จำลองวิ่งเส้นทางนี้</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer flex-shrink-0"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Center Viewer Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-[#130F18] relative select-none">
          
          {/* Detailed Google Earth Route Card */}
          {currentRouteData ? (
            <div
              className="transition-transform duration-200 ease-out origin-center w-full max-w-3xl bg-[#1C1724] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: currentRouteData.color }}
                  />
                  <div>
                    <h4 className="text-lg font-black text-white">
                      {currentRouteData.name} — {currentRouteData.title}
                    </h4>
                    <span className="text-xs text-white/60">
                      {currentRouteData.type} • ระดับ {currentRouteData.difficulty}
                    </span>
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-extrabold text-white uppercase shadow-sm"
                  style={{ backgroundColor: currentRouteData.color }}
                >
                  {currentRouteData.distanceKm} KM
                </span>
              </div>

              {/* Google Earth Measurement Box */}
              <div className="p-4 rounded-xl bg-[#292235] border border-white/10 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-[#FFC928] uppercase tracking-wider block">
                    GOOGLE EARTH POLYGON SURVEY
                  </span>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {currentRouteData.googleEarthSummary}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-white bg-black/40 px-3 py-2 rounded-lg border border-white/10">
                  <div>
                    <span className="text-white/60 block text-[9px]">เส้นรอบวงจริง</span>
                    <span className="text-[#FFC928] text-sm font-black">{currentRouteData.measuredPerimeterKm} กม.</span>
                  </div>
                  <span className="text-white/20">|</span>
                  <div>
                    <span className="text-white/60 block text-[9px]">พื้นที่รูปหลายเหลี่ยม</span>
                    <span className="text-white text-sm font-black">{currentRouteData.measuredAreaSqM?.toLocaleString()} ม²</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/80 leading-relaxed mb-4">
                {currentRouteData.description}
              </p>

              {/* Landmarks Sequence along the Route */}
              <div>
                <span className="text-[11px] font-extrabold uppercase text-white/60 tracking-wider block mb-2">
                  จุดเลี้ยวและพิกัดสำคัญบนเส้นทาง
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentRouteData.landmarks.map((lm, idx) => (
                    <div key={lm.id} className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-start gap-2 text-xs">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-[#FFC928] flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1">
                          <span>{lm.name}</span>
                          <span className="text-[10px] text-white/50">(กม. {lm.distanceFromStartKm})</span>
                        </div>
                        <p className="text-[11px] text-white/60 line-clamp-1">{lm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center p-4"
            >
              <div
                className="relative max-w-4xl max-h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center bg-black/40"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.2s ease' }}
              >
                <img loading="lazy" decoding="async"
                  src="/images/routes/route-map-artwork.svg"
                  alt="CHANGSUEK RUN Official Route Map Artwork"
                  className="max-h-[68vh] w-auto object-contain rounded-2xl"
                />
              </div>
            </div>
          )}

          {/* Floating Zoom & Action Controls */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
            <button
              onClick={handleZoomIn}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
              title="ซูมเข้า"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
              title="ซูมออก"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
              title="รีเซ็ตขนาด"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-white/20 my-auto" />
            <a
              href="/images/routes/route-map-artwork.svg"
              download="route-map-artwork.svg"
              className="p-2 text-white/80 hover:text-[#FFC928] hover:bg-white/10 rounded-xl cursor-pointer"
              title="ดาวน์โหลดแผนที่เส้นทาง"
            >
              <Download className="w-4 h-4" />
            </a>
            <div className="w-px h-5 bg-white/20 my-auto" />
            <button
              onClick={handleShare}
              className="px-3 py-1.5 text-xs font-bold text-[#FFC928] hover:bg-white/10 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์ข้อมูล'}</span>
            </button>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="p-3 sm:px-6 bg-[#241E2D] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/60 gap-2">
          <span>
            © 2026 CHANG SUEK RUN • ค่ายนเรศวร กองบัญชาการตำรวจตระเวนชายแดน • ข้อมูลรังวัด Google Earth
          </span>
          <span className="text-[#FFC928]">
            {currentRouteData ? `${currentRouteData.name} (รอบเส้นขอบ: ${currentRouteData.measuredPerimeterKm} กม.)` : '3.8 KM / 5 KM / 10 KM WAR DOG TRAIL'}
          </span>
        </div>

      </div>
    </div>
  );
};

