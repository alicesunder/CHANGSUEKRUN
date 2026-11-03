import React, { useState, useEffect } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

const loadingMessages = [
  'กำลังเตรียมเส้นทางริมหาดชะอำ...',
  'กำลังเตรียมสนามค่ายนเรศวร...',
  'กำลังตรวจเช็กจุดบริการน้ำดื่ม...',
  'กำลังเตรียมของที่ระลึกและเหรียญรางวัล...',
  'พร้อมแล้ว! ไปวิ่งด้วยกันเถอะ!',
];

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFading(true);
            setTimeout(onComplete, 400);
          }, 200);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return next > 100 ? 100 : next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 600);
    return () => clearInterval(msgInterval);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF9FC] transition-opacity duration-500 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Decorative background glow */}
      <div className="absolute top-12 right-16 w-32 h-32 rounded-full bg-[#FFC928]/20 blur-2xl animate-pulse" />
      <div className="absolute bottom-12 left-16 w-40 h-40 rounded-full bg-[#7B3FC6]/15 blur-3xl animate-pulse" />

      {/* Main Content Box */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Brand Title */}
        <div className="inline-block px-3 py-1 mb-2 text-xs font-extrabold tracking-wider text-[#54239A] uppercase bg-[#EEE4FA] rounded-full border border-[#7B3FC6]/20">
          CHANG SUEK RUN 2027
        </div>
        <h1 className="text-2xl font-black text-[#17151C] mb-1">
          เห็นช้างวิ่ง วิ่งตามช้าง
        </h1>
        <p className="text-sm font-semibold text-[#7B3FC6] mb-6">
          RUN TOGETHER • วิ่งสนุกไปด้วยกัน
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-[#E5E0EE] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#7B3FC6]/20 shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#7B3FC6] via-[#FFC928] to-[#2EAD62] rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage & Messages */}
        <div className="flex items-center justify-between w-full text-xs font-semibold text-[#6F6878] mb-2">
          <span className="text-[#54239A] font-bold">{loadingMessages[messageIndex]}</span>
          <span className="font-mono text-sm font-black text-[#7B3FC6]">{progress}%</span>
        </div>
      </div>
    </div>
  );
};
