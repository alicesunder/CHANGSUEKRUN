import React, { useEffect, useState } from 'react';
import { Power, RefreshCw } from 'lucide-react';
import { adminApi } from '../utils/api';

/**
 * Admin card: open / close ticket sales. Closed = the shop shows "ปิดการขายชั่วคราว" and the server
 * refuses new orders; orders already created can still upload their slip and be paid.
 */
export const SalesSwitchCard: React.FC = () => {
  const [state, setState] = useState<{ open: boolean; updatedAt?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      setState(await adminApi.getSales());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดสถานะการขายไม่สำเร็จ');
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const toggle = async () => {
    if (!state || busy) return;
    const next = !state.open;
    if (!window.confirm(next ? 'เปิดการขายบัตรบนเว็บไซต์?' : 'ปิดการขายบัตรชั่วคราว? ลูกค้าจะสร้างคำสั่งซื้อใหม่ไม่ได้ (คำสั่งซื้อที่สร้างแล้วยังชำระเงินได้)')) return;
    setBusy(true);
    setError('');
    try {
      setState(await adminApi.setSales(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const open = state?.open;
  return (
    <section
      className={`rounded-2xl border-2 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4 ${
        state === null ? 'bg-white border-slate-200' : open ? 'bg-emerald-50 border-emerald-400' : 'bg-rose-50 border-rose-400'
      }`}
      aria-labelledby="sales-switch-title"
    >
      <div className="flex items-center gap-3">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${open ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <Power className="w-6 h-6" />
        </span>
        <div>
          <h3 id="sales-switch-title" className="text-base font-black text-slate-900">
            การขายบัตรบนเว็บไซต์: {state === null ? '…' : open ? 'เปิดขายอยู่' : 'ปิดการขายชั่วคราว'}
          </h3>
          <p className="text-xs font-semibold text-slate-600">
            {open ? 'ลูกค้าซื้อบัตรได้ตามปกติ' : 'หน้าเว็บแสดง "ปิดการขายชั่วคราว" และไม่รับคำสั่งซื้อใหม่ · คำสั่งซื้อเดิมยังแนบสลิปได้'}
            {state?.updatedAt && ` · เปลี่ยนล่าสุด ${new Date(state.updatedAt).toLocaleString('th-TH')}`}
          </p>
          {error && (
            <p role="alert" className="text-xs font-bold text-rose-700 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={load} className="min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> รีเฟรช
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(open)}
          disabled={state === null || busy}
          onClick={toggle}
          className={`min-h-[44px] px-5 rounded-xl text-sm font-black text-white cursor-pointer disabled:opacity-50 ${open ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {busy ? 'กำลังบันทึก…' : open ? 'ปิดการขาย' : 'เปิดการขาย'}
        </button>
      </div>
    </section>
  );
};
