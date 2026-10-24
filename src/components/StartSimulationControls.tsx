import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Gauge,
  MapPin,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react';
import { RouteId, Landmark } from '../types';

interface StartSimulationControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  progress: number;
  currentKm: number;
  totalKm: number;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  currentLandmark: Landmark | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  onOpenRunnerCenter?: () => void;
}

export const StartSimulationControls: React.FC<StartSimulationControlsProps> = ({
  isRunning,
  isPaused,
  isComplete,
  progress,
  currentKm,
  totalKm,
  speedMultiplier,
  onSpeedChange,
  currentLandmark,
  onStart,
  onPause,
  onResume,
  onRestart,
  onExit,
  onOpenRunnerCenter,
}) => {
  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <div className="flex flex-col gap-2">
      {/* 1. Landmark Proximity Alert Card */}
      {currentLandmark && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border-2 border-emerald-400 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            {currentLandmark.type === 'water' ? (
              <span className="text-xl">💧</span>
            ) : currentLandmark.type === 'medical' ? (
              <span className="text-xl">🏥</span>
            ) : currentLandmark.type === 'photo' ? (
              <span className="text-xl">📷</span>
            ) : (
              <span className="text-xl">🏁</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <span>ถึงจุดสำคัญ • กม. {currentLandmark.distanceFromStartKm}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-xs sm:text-sm font-black text-[#1F1035] truncate">
              {currentLandmark.name}
            </div>
            <div className="text-[11px] text-gray-500 truncate">
              {currentLandmark.description}
            </div>
          </div>
        </div>
      )}

      {/* 2. Route Complete Banner */}
      {isComplete && (
        <div className="bg-gradient-to-r from-[#3D106B] to-[#5B20A8] text-white rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-[#FFC928] animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏁</span>
              <span className="text-base sm:text-lg font-black text-[#FFC928]">
                ROUTE COMPLETE! ถึงเส้นชัยแล้ว
              </span>
            </div>
            <button
              onClick={onExit}
              className="text-white/70 hover:text-white p-1"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-white/90 mb-3">
            คุณได้จำลองการวิ่งครบระยะ {totalKm.toFixed(2)} กม. สัมผัสทัศนียภาพค่ายนเรศวรและหาดชะอำเรียบร้อยแล้ว
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRestart}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>วิ่งใหม่อีกครั้ง</span>
            </button>
            {onOpenRunnerCenter && (
              <button
                onClick={onOpenRunnerCenter}
                className="px-4 py-1.5 rounded-xl bg-[#FFC928] hover:bg-[#F5B800] text-[#17151C] font-black text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>เปิดศูนย์นักวิ่ง (BIB)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Floating Simulation Control Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-purple-200 shadow-2xl space-y-3">
        {/* Progress & Live Kilometers Display */}
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-black text-sm text-[#1F1035]">
              KM {currentKm.toFixed(2)} / {totalKm.toFixed(2)} KM
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-500 text-[11px]">
              ความคืบหน้า: <strong className="text-[#5B20A8]">{Math.round(progress)}%</strong>
            </span>
            <span className="hidden sm:inline-block text-[11px] text-gray-400">
              เพซจำลอง: 6:12 min/km
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
          <div
            className="bg-gradient-to-r from-[#5B20A8] via-[#FFC928] to-emerald-500 h-full rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Action Controls & Speed Multipliers */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Play/Pause/Restart buttons */}
          <div className="flex items-center gap-1.5">
            {!isRunning && !isPaused ? (
              <button
                onClick={onStart}
                className="px-4 py-2 rounded-xl bg-[#5B20A8] hover:bg-[#4A188A] text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>เริ่มจำลอง (Start)</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={onResume}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>เล่นต่อ (Resume)</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>หยุดชั่วคราว (Pause)</span>
              </button>
            )}

            <button
              onClick={onRestart}
              title="เริ่มใหม่ตั้งแต่ต้น"
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onExit}
              title="ปิดโหมดจำลอง"
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Buttons: 0.5x, 1x, 2x, 5x, 10x */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 px-1 hidden sm:inline">
              ความเร็ว:
            </span>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  speedMultiplier === s
                    ? 'bg-white text-[#5B20A8] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
