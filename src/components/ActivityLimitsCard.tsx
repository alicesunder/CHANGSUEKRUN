import React, { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';

/** Admin card (owner): how many people the tower and the shooting range take. 0 = no limit. The wind tunnel is fixed at 60 seats. */
export const ActivityLimitsCard: React.FC = () => {
  const [tower, setTower] = useState('');
  const [gun, setGun] = useState('');
  const [left, setLeft] = useState<{ tower: number | null; gun: number | null } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .getLimits()
      .then((r) => {
        setTower(String(r.limits.tower));
        setGun(String(r.limits.gun));
        setLeft(r.seatsLeft);
      })
      .catch((e) => setMsg({ ok: false, text: e instanceof Error ? e.message : 'โหลดไม่สำเร็จ' }));
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await adminApi.setLimits({ tower: Number(tower) || 0, gun: Number(gun) || 0 });
      setTower(String(r.limits.tower));
      setGun(String(r.limits.gun));
      setLeft(r.seatsLeft);
      setMsg({ ok: true, text: 'บันทึกแล้ว' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-xs space-y-3" aria-labelledby="limits-title">
      <div>
        <h3 id="limits-title" className="text-base font-black text-slate-900">จำนวนที่นั่งกิจกรรมเสริม</h3>
        <p className="text-xs font-semibold text-slate-600">ใส่จำนวนคนสูงสุดของแต่ละกิจกรรม เมื่อเต็มระบบจะไม่รับออเดอร์เพิ่ม · ใส่ 0 = ไม่จำกัด · อุโมงค์ลมจำกัด 60 คนตายตัว · คำสั่งซื้อที่มีอยู่แล้วไม่ถูกตัด</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-bold text-slate-800">
          หอสูง (คน)
          <input type="number" min={0} value={tower} onChange={(e) => setTower(e.target.value)} className="w-full rounded-xl border-2 border-slate-300 px-3 py-2 font-bold outline-none focus:border-[#5B20A8]" />
          <span className="block text-xs font-semibold text-slate-500">{left?.tower === null || left === null ? 'ไม่จำกัด' : `เหลือ ${left.tower} ที่`}</span>
        </label>
        <label className="space-y-1 text-sm font-bold text-slate-800">
          ยิงปืน (คน)
          <input type="number" min={0} value={gun} onChange={(e) => setGun(e.target.value)} className="w-full rounded-xl border-2 border-slate-300 px-3 py-2 font-bold outline-none focus:border-[#5B20A8]" />
          <span className="block text-xs font-semibold text-slate-500">{left?.gun === null || left === null ? 'ไม่จำกัด' : `เหลือ ${left.gun} ที่`}</span>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" disabled={busy} onClick={save} className="min-h-[44px] rounded-xl bg-[#5B20A8] px-5 text-sm font-black text-white cursor-pointer disabled:opacity-60">
          {busy ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
        {msg && <span className={`text-sm font-bold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</span>}
      </div>
    </section>
  );
};
