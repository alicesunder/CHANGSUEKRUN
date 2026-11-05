import React, { useEffect, useState } from 'react';
import { CalendarClock, Power, RefreshCw } from 'lucide-react';
import { adminApi, type SalesState } from '../utils/api';
import { formatOpenAt } from '../utils/earlyBird';

/** ISO -> value for <input type="datetime-local"> in Bangkok time (UTC+7, no DST). */
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t + 7 * 3600_000).toISOString().slice(0, 16);
}

/**
 * Admin card: open / close ticket sales, plus an automatic opening time (Bangkok).
 * Before the opening time the shop shows the countdown message and the server refuses new orders;
 * "closed" works the same way; orders already created can still upload their slip and be paid.
 */
export const SalesSwitchCard: React.FC = () => {
  const [state, setState] = useState<SalesState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openAtInput, setOpenAtInput] = useState('');

  const apply = (s: SalesState) => {
    setState(s);
    setOpenAtInput(toLocalInput(s.openAt));
  };
  const load = async () => {
    setError('');
    try {
      apply(await adminApi.getSales());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดสถานะการขายไม่สำเร็จ');
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const run = async (fn: () => Promise<SalesState>) => {
    setBusy(true);
    setError('');
    try {
      apply(await fn());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    if (!state || busy) return;
    const next = !state.manualOpen;
    if (!window.confirm(next ? 'เปิดการขายบัตรบนเว็บไซต์ "ตอนนี้เลย"? (จะยกเลิกเวลาเปิดขายอัตโนมัติ)' : 'ปิดการขายบัตรชั่วคราว? ลูกค้าจะสร้างคำสั่งซื้อใหม่ไม่ได้ (คำสั่งซื้อที่สร้างแล้วยังชำระเงินได้)')) return;
    await run(() => adminApi.setSales(next));
  };

  const saveOpenAt = async (clear: boolean) => {
    if (busy) return;
    if (!clear && !openAtInput) {
      setError('เลือกวันและเวลาเปิดขายก่อน');
      return;
    }
    const iso = clear ? null : new Date(openAtInput + ':00+07:00').toISOString();
    await run(() => adminApi.setSalesOpenAt(iso));
  };

  const open = state?.open;
  const scheduled = state?.scheduled;
  const tone = state === null ? 'bg-white border-slate-200' : open ? 'bg-emerald-50 border-emerald-400' : scheduled ? 'bg-amber-50 border-amber-400' : 'bg-rose-50 border-rose-400';
  return (
    <section className={`rounded-2xl border-2 shadow-xs p-5 space-y-4 ${tone}`} aria-labelledby="sales-switch-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${open ? 'bg-emerald-600' : scheduled ? 'bg-amber-500' : 'bg-rose-600'}`}>
            <Power className="w-6 h-6" />
          </span>
          <div>
            <h3 id="sales-switch-title" className="text-base font-black text-slate-900">
              การขายบัตรบนเว็บไซต์: {state === null ? '…' : open ? 'เปิดขายอยู่' : scheduled ? 'ยังไม่ถึงเวลาเปิดขาย' : 'ปิดการขายชั่วคราว'}
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              {open
                ? 'ลูกค้าซื้อบัตรได้ตามปกติ'
                : scheduled
                  ? `ระบบจะเปิดขายเองเมื่อถึง ${state?.openAt ? formatOpenAt(state.openAt, false) : ''} · ก่อนถึงเวลาไม่รับคำสั่งซื้อใหม่`
                  : 'หน้าเว็บแสดง "ปิดการขายชั่วคราว" และไม่รับคำสั่งซื้อใหม่ · คำสั่งซื้อเดิมยังแนบสลิปได้'}
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
          <button type="button" onClick={load} className="min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> รีเฟรช
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(state?.manualOpen)}
            disabled={state === null || busy}
            onClick={toggle}
            className={`min-h-[44px] px-5 rounded-xl text-sm font-black text-white cursor-pointer disabled:opacity-50 ${state?.manualOpen ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {busy ? 'กำลังบันทึก…' : state?.manualOpen ? (scheduled ? 'ยกเลิกการขาย' : 'ปิดการขาย') : 'เปิดการขายเดี๋ยวนี้'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white/70 p-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-extrabold text-slate-700">
          <span className="inline-flex items-center gap-1.5 mb-1">
            <CalendarClock className="w-3.5 h-3.5" /> เวลาเปิดขายอัตโนมัติ (เวลาไทย)
          </span>
          <input
            type="datetime-local"
            value={openAtInput}
            onChange={(e) => setOpenAtInput(e.target.value)}
            className="block min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900"
          />
        </label>
        <button type="button" disabled={busy} onClick={() => saveOpenAt(false)} className="min-h-[44px] px-4 rounded-lg bg-slate-900 text-white text-xs font-black cursor-pointer disabled:opacity-50">
          บันทึกเวลาเปิดขาย
        </button>
        <button type="button" disabled={busy || !state?.openAt} onClick={() => saveOpenAt(true)} className="min-h-[44px] px-4 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50">
          ไม่ตั้งเวลา (เปิดตามสวิตช์)
        </button>
        <p className="basis-full text-[11px] font-semibold text-slate-500">
          ค่าเริ่มต้นของระบบ: เปิดขาย 9 พ.ย. 2569 เวลา 09.00 น. · การกด "เปิดการขายเดี๋ยวนี้" จะเปิดทันทีและยกเลิกเวลาที่ตั้งไว้
        </p>
      </div>
    </section>
  );
};
