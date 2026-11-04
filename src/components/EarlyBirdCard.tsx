import React, { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { adminApi } from '../utils/api';
import { EARLY_BIRD_OFF, formatBaht } from '../data/eventData';

/**
 * Admin card: early-bird switch. On = every run ticket, concert GA ticket and VIP table is cheaper by a fixed
 * amount (the shop shows the old price struck through); percentage discounts are worked out on the lower price.
 * Orders already created keep the price they were made with.
 */
export const EarlyBirdCard: React.FC = () => {
  const [state, setState] = useState<{ on: boolean; updatedAt?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getEarlyBird()
      .then(setState)
      .catch((err) => setError(err instanceof Error ? err.message : 'โหลดสถานะ Early Bird ไม่สำเร็จ'));
  }, []);

  const toggle = async () => {
    if (!state || busy) return;
    const next = !state.on;
    if (
      !window.confirm(
        next
          ? `เปิด Early Bird? บัตรวิ่งทุกบัตรลด ${formatBaht(EARLY_BIRD_OFF.run)} บาท · บัตรคอนเสิร์ต GA ลด ${formatBaht(EARLY_BIRD_OFF.concert)} บาท · VIP TABLE ลด ${formatBaht(EARLY_BIRD_OFF.vip)} บาท`
          : 'ปิด Early Bird? ราคากลับเป็นราคาปกติสำหรับคำสั่งซื้อใหม่ (คำสั่งซื้อที่สร้างแล้วคงราคาเดิม)'
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      setState(await adminApi.setEarlyBird(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const on = state?.on;
  return (
    <section
      className={`rounded-2xl border-2 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4 ${
        state === null ? 'bg-white border-slate-200' : on ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-300'
      }`}
      aria-labelledby="early-bird-title"
    >
      <div className="flex items-center gap-3">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${on ? 'bg-amber-500' : 'bg-slate-400'}`}>
          <Tag className="w-6 h-6" />
        </span>
        <div>
          <h3 id="early-bird-title" className="text-base font-black text-slate-900">
            Early Bird: {state === null ? '…' : on ? 'เปิดอยู่' : 'ปิดอยู่'}
          </h3>
          <p className="text-xs font-semibold text-slate-600">
            เปิดแล้ว: บัตรวิ่งทุกบัตรลด {formatBaht(EARLY_BIRD_OFF.run)} บาท · คอนเสิร์ต GA ลด {formatBaht(EARLY_BIRD_OFF.concert)} บาท · VIP TABLE ลด {formatBaht(EARLY_BIRD_OFF.vip)} บาท (กิจกรรมเสริมไม่ร่วมรายการ Early Bird)
            {state?.updatedAt && ` · เปลี่ยนล่าสุด ${new Date(state.updatedAt).toLocaleString('th-TH')}`}
          </p>
          {error && (
            <p role="alert" className="text-xs font-bold text-rose-700 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(on)}
        disabled={state === null || busy}
        onClick={toggle}
        className={`min-h-[44px] px-5 rounded-xl text-sm font-black text-white cursor-pointer disabled:opacity-50 ${on ? 'bg-slate-600 hover:bg-slate-700' : 'bg-amber-500 hover:bg-amber-600'}`}
      >
        {busy ? 'กำลังบันทึก…' : on ? 'ปิด Early Bird' : 'เปิด Early Bird'}
      </button>
    </section>
  );
};
