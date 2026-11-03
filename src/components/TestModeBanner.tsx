import React from 'react';
import { setTestMode, useTestMode } from '../utils/testMode';

/** Red bar shown only while the admin's 1-baht test mode is on in this browser. */
export const TestModeBanner: React.FC = () => {
  const on = useTestMode();
  if (!on) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[68px] lg:bottom-0 z-[10020] bg-[#B91C1C] text-white border-t-4 border-[#FFC928] px-3 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs sm:text-sm font-extrabold"
    >
      <span>
        🧪 โหมดทดสอบ 1 บาท เปิดอยู่ (เฉพาะเบราว์เซอร์นี้): คำสั่งซื้อทุกใบคิดยอด 1 บาท · ใบทดสอบไม่นับในยอดขาย ไม่ใช้เลข BIB จริง
      </span>
      <button
        type="button"
        onClick={() => setTestMode(false)}
        className="px-3 py-1.5 min-h-[36px] rounded-lg bg-white text-[#B91C1C] font-black cursor-pointer"
      >
        ปิดโหมดทดสอบ
      </button>
    </div>
  );
};
