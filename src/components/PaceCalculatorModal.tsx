import React, { useState } from 'react';
import { X, Calculator, Clock, Flame, Droplets, Zap, Award, CheckCircle, ArrowRight } from 'lucide-react';
import { RouteId } from '../types';

interface PaceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterModal: (route: RouteId) => void;
}

export const PaceCalculatorModal: React.FC<PaceCalculatorModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterModal,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<RouteId>('5km');
  const [paceMinutes, setPaceMinutes] = useState<number>(7);
  const [paceSeconds, setPaceSeconds] = useState<number>(0);

  if (!isOpen) return null;

  const distanceKm = selectedRoute === '1km' ? 1.0 : selectedRoute === '3km' ? 3.0 : selectedRoute === '5km' ? 5.0 : 10.0;
  const cutOffMinutes = selectedRoute === '1km' ? 45 : selectedRoute === '3km' ? 75 : selectedRoute === '5km' ? 90 : 135;

  const totalPaceSeconds = paceMinutes * 60 + paceSeconds;
  const totalFinishSeconds = Math.round(totalPaceSeconds * distanceKm);

  const finishHours = Math.floor(totalFinishSeconds / 3600);
  const finishMins = Math.floor((totalFinishSeconds % 3600) / 60);
  const finishSecs = totalFinishSeconds % 60;

  const finishTimeFormatted =
    finishHours > 0
      ? `${finishHours} ชม. ${finishMins} นาที ${finishSecs > 0 ? `${finishSecs} วิ` : ''}`
      : `${finishMins} นาที ${finishSecs > 0 ? `${finishSecs} วิ` : ''}`;

  const isWithinCutoff = totalFinishSeconds <= cutOffMinutes * 60;
  const estimatedCalories = Math.round(distanceKm * 68); // average 68 kcal/km
  const recommendedWater = selectedRoute === '1km' ? '100 - 150 มล.' : selectedRoute === '3km' ? '150 - 250 มล.' : selectedRoute === '5km' ? '300 - 450 มล.' : '600 - 800 มล.';

  const presets = [
    { label: '🚶 เดินชิลล์ / พาน้องหมาเดินเล่น', paceM: 10, paceS: 30 },
    { label: '🏃 วิ่งเหยาะๆ จ๊อกกิ้งครอบครัว', paceM: 8, paceS: 0 },
    { label: '⚡ วิ่งปานกลาง สุขภาพแข็งแรง', paceM: 6, paceS: 30 },
    { label: '🚀 วิ่งพัฒนาสถิติ ขาแรงแนวหน้า', paceM: 5, paceS: 0 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-[#EEE4FA] overflow-hidden my-6 transition-all transform animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFC928] via-[#F5B800] to-[#2EAD62] p-5 text-[#17151C] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center text-xl">
              ⏱️
            </div>
            <div>
              <h3 className="text-lg font-black leading-tight">คำนวณเวลาวิ่ง & Pace Estimator</h3>
              <p className="text-xs font-bold text-black/70">ประเมินเวลาเข้าเส้นชัยและวางแผนความเร็ว</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/40 hover:bg-white/60 flex items-center justify-center text-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Distance Selection */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
              1. เลือกระยะทางที่คุณต้องการวิ่ง
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRoute('1km')}
                className={`py-2 px-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                  selectedRoute === '1km'
                    ? 'border-[#FF8A3D] bg-[#FFE9DA] text-[#B4500F] shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                🐾 Dog 1 KM
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoute('3km')}
                className={`py-2 px-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                  selectedRoute === '3km'
                    ? 'border-[#2EAD62] bg-[#DFF5E8] text-[#2EAD62] shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                🐾 Dog 3 KM
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoute('5km')}
                className={`py-2 px-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                  selectedRoute === '5km'
                    ? 'border-[#EF5350] bg-red-50 text-[#EF5350] shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                5 KM
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoute('10km')}
                className={`py-2 px-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                  selectedRoute === '10km'
                    ? 'border-[#7B3FC6] bg-[#EEE4FA] text-[#7B3FC6] shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                10 KM
              </button>
            </div>
          </div>

          {/* Quick Pace Presets */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
              2. เลือกรูปแบบความเร็ว หรือปรับด้วยตัวเอง
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {presets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPaceMinutes(preset.paceM);
                    setPaceSeconds(preset.paceS);
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                    paceMinutes === preset.paceM && paceSeconds === preset.paceS
                      ? 'border-[#7B3FC6] bg-[#EEE4FA] text-[#54239A]'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Slider / Minute Input */}
            <div className="bg-[#FAF9FC] p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600">Pace ต่อกิโลเมตร:</span>
                <span className="text-base font-black text-[#54239A]">
                  {paceMinutes}:{paceSeconds < 10 ? `0${paceSeconds}` : paceSeconds} นาที / กม.
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="14"
                step="0.5"
                value={paceMinutes + paceSeconds / 60}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const m = Math.floor(val);
                  const s = Math.round((val - m) * 60);
                  setPaceMinutes(m);
                  setPaceSeconds(s);
                }}
                className="w-full accent-[#7B3FC6] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                <span>เร็ว 4:00</span>
                <span>ปานกลาง 8:00</span>
                <span>เดิน 14:00</span>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EEE4FA]/60 via-white to-[#DFF5E8]/60 border-2 border-[#EEE4FA] text-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
              เวลาจบการแข่งขันโดยประมาณ (ESTIMATED TIME)
            </span>
            <div className="text-3xl sm:text-4xl font-black text-[#54239A] my-1">
              {finishTimeFormatted}
            </div>

            {isWithinCutoff ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFF5E8] text-[#2EAD62] text-xs font-black">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>ทันเวลา Cut-off ({cutOffMinutes} นาที) สบายๆ! 🏅</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black">
                <span>⚠️ อาจเกินเวลา Cut-off ({cutOffMinutes} นาที) แนะนำปรับเพิ่มความเร็ว</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 text-left">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-100">
                <Flame className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="text-[10px] text-gray-400 font-bold">เผาผลาญพลังงาน</div>
                  <div className="text-xs font-black text-gray-800">~{estimatedCalories} กิโลแคลอรี</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-100">
                <Droplets className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-[10px] text-gray-400 font-bold">น้ำดื่มที่ควรดื่ม</div>
                  <div className="text-xs font-black text-gray-800">{recommendedWater}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={() => {
              onClose();
              onOpenRegisterModal(selectedRoute);
            }}
            className="w-full py-3 bg-[#FFC928] hover:bg-[#F5B800] text-[#17151C] font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <span>ลงทะเบียนระยะ {selectedRoute.toUpperCase()} ด้วยเป้าหมายนี้</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
