import React, { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { adminApi, type EarlyBirdState } from '../utils/api';
import { EARLY_BIRD_OFF, formatBaht } from '../data/eventData';

/**
 * Admin card: early-bird switch. On = every run ticket, concert GA ticket and VIP table is cheaper by a fixed
 * amount (the shop shows the old price struck through); percentage discounts are worked out on the lower price.
 * Orders already created keep the price they were made with.
 */
export const EarlyBirdCard: React.FC = () => {
  const [state, setState] = useState<EarlyBirdState | null>(null);
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');
  const [schedMsg, setSchedMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getEarlyBird()
      .then((st) => {
        setState(st);
        setFrom((st.autoFrom || '').slice(0, 10));
        setUntil((st.autoUntil || '').slice(0, 10));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'โหลดสถานะ Early Bird ไม่สำเร็จ'));
  }, []);

  const toggle = async () => {
    if (!state || busy) return;
    if (state.byTimer) {
      window.alert('ตอนนี้ Early Bird เปิดอยู่ตามช่วงวันที่ที่ตั้งไว้ ถ้าจะปิดให้กด "ยกเลิกการตั้งเวลา" ด้านล่าง');
      return;
    }
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

  const saveSchedule = async (clear = false) => {
    if (busy) return;
    setBusy(true);
    setSchedMsg(null);
    try {
      const st = await adminApi.setEarlyBirdSchedule(clear ? null : from || null, clear ? null : until || null);
      setState(st);
      if (clear) {
        setFrom('');
        setUntil('');
      }
      setSchedMsg({ ok: true, text: clear ? 'ยกเลิกการตั้งเวลาแล้ว' : 'บันทึกช่วงวันที่แล้ว' });
    } catch (err) {
      setSchedMsg({ ok: false, text: err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ' });
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
      <div className="w-full rounded-xl border-2 border-dashed border-amber-300 bg-white/70 p-3 space-y-2">
        <p className="text-xs font-extrabold text-slate-800">
          ตั้งช่วงวันที่ให้เปิด-ปิดเอง (เวลาไทย){state?.byTimer ? ' — ตอนนี้เปิดอยู่เพราะอยู่ในช่วงนี้' : ''}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-slate-700">
            เริ่มวันที่
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-lg border-2 border-slate-300 px-2 py-1.5 text-sm font-bold" />
          </label>
          <label className="text-xs font-bold text-slate-700">
            ถึงวันที่ (รวมวันนี้)
            <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="mt-1 block rounded-lg border-2 border-slate-300 px-2 py-1.5 text-sm font-bold" />
          </label>
          <button type="button" disabled={busy || state === null || (!from && !until)} onClick={() => saveSchedule(false)} className="min-h-[38px] rounded-lg bg-[#5B20A8] px-4 text-xs font-black text-white cursor-pointer disabled:opacity-50">
            บันทึกช่วงวันที่
          </button>
          {(state?.autoFrom || state?.autoUntil) && (
            <button type="button" disabled={busy} onClick={() => saveSchedule(true)} className="min-h-[38px] rounded-lg border-2 border-slate-400 px-3 text-xs font-extrabold text-slate-700 cursor-pointer disabled:opacity-50">
              ยกเลิกการตั้งเวลา
            </button>
          )}
        </div>
        <p className="text-[11px] font-semibold text-slate-500">
          ตัวอย่างตามแผน: 9 พ.ย. 2569 ถึง 19 พ.ย. 2569 ราคา Early Bird จะเปิดตั้งแต่ 00.00 น. วันที่ 9 และกลับเป็นราคาปกติหลังสิ้นวันที่ 19 โดยไม่ต้องมากดเอง · ปุ่มเปิดด้านบนยังใช้บังคับเปิดได้ตลอด · คำสั่งซื้อที่สร้างแล้วคงราคาเดิม
        </p>
        {schedMsg && <p className={`text-xs font-bold ${schedMsg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{schedMsg.text}</p>}
      </div>
    </section>
  );
};
