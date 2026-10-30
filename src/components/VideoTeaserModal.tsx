import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, MapPin, Sparkles, Heart, Compass } from 'lucide-react';

interface VideoTeaserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterModal: () => void;
}

export const VideoTeaserModal: React.FC<VideoTeaserModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterModal,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Synthesize realistic gentle ocean waves using Web Audio API
  useEffect(() => {
    if (!isOpen) {
      if (audioCtx) {
        audioCtx.close();
        setAudioCtx(null);
      }
      return;
    }

    if (isSoundOn && !audioCtx) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // White noise node for ocean waves
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Filter simulating waves
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);

        // Wave oscillation
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.18, ctx.currentTime); // Wave breath every ~5.5s
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(180, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();
        lfo.start();
        setAudioCtx(ctx);
      } catch (err) {
        console.warn('AudioContext not allowed or failed:', err);
      }
    } else if (!isSoundOn && audioCtx) {
      audioCtx.close();
      setAudioCtx(null);
    }
  }, [isOpen, isSoundOn]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-2 border-[#EEE4FA] overflow-hidden transition-all transform animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#169BD5] via-[#54239A] to-[#7B3FC6] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
              🎬
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">
                CHANG SUEK RUN 2026 • บรรยากาศเส้นทางจริง
              </h3>
              <p className="text-xs text-white/80">
                ค่ายนเรศวร ตชด. & หาดโรงแรม Sea Sand Sun ชะอำ-หัวหิน
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSoundOn(!isSoundOn)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                isSoundOn ? 'bg-[#FFC928] text-[#17151C]' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isSoundOn ? 'ปิดเสียงคลื่นทะเล' : 'เปิดเสียงคลื่นทะเล'}
            >
              {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSoundOn ? 'เสียงคลื่น ON' : 'เปิดเสียงทะเล'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Stage Simulation */}
        <div className="relative aspect-video bg-gray-900 overflow-hidden group">
          {/* Coastal Beach Drone Footage Visual */}
          <img loading="lazy" decoding="async"
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"
            alt="Cha-am Hua Hin Beach Preview"
            className={`w-full h-full object-cover transition-transform duration-1000 ${
              isPlaying ? 'scale-105' : 'scale-100'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

          {/* Center Play/Pause Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFC928] hover:bg-[#F5B800] text-[#17151C] flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>
          </div>

          {/* Bottom Video HUD */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-bold">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2EAD62] animate-ping" />
              <span>เส้นทางวิ่งริมชายหาดยามเย็น ปล่อยตัว 16:30 น.</span>
            </div>
            <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <span>HD 1080P • ชะอำ - หัวหิน</span>
            </div>
          </div>
        </div>

        {/* Info & Call to Action */}
        <div className="p-4 sm:p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-base font-black text-gray-900">
              “แล้วมาเจอกันที่เส้น Start นะ!” 🐘🐕
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              สัมผัสประสบการณ์วิ่งพร้อมหน้าทั้งครอบครัว รับลมทะเลเย็นสบาย ไม่มีคัตออฟกดดัน
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenRegisterModal();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#17151C] font-black rounded-2xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            สมัครวิ่งเลย ➔
          </button>
        </div>
      </div>
    </div>
  );
};
