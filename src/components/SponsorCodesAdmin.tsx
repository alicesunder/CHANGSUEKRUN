import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Gift, Plus, Trash2 } from 'lucide-react';
import { adminApi, type SponsorCodeRow } from '../utils/api';

/** Admin tab: create and manage sponsor codes (free registration for run + concert). */
export const SponsorCodesAdmin: React.FC = () => {
  const [codes, setCodes] = useState<SponsorCodeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [sponsorName, setSponsorName] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [unlimited, setUnlimited] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await adminApi.listSponsorCodes();
      setCodes(res.codes);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดรายการไม่สำเร็จ');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await adminApi.createSponsorCode({
        sponsorName: sponsorName.trim(),
        maxUses: unlimited ? null : Number(maxUses),
        code: customCode.trim() || undefined,
        note: note.trim(),
      });
      setSponsorName('');
      setCustomCode('');
      setNote('');
    });
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked: the code is visible on screen anyway */
    }
  };

  const used = (codes || []).reduce((n, c) => n + c.usedCount, 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5 text-[#6D28D9]" />
          <h3 className="text-base sm:text-lg font-black text-[#2A1450]">รหัสสปอนเซอร์ (ลงทะเบียนฟรี: วิ่งทุกระยะ + คอนเสิร์ต)</h3>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-[#6F6878] mb-4">
          สร้างรหัสให้สปอนเซอร์ ผู้ใช้ใส่รหัสตอนลงทะเบียนแล้วไม่ต้องชำระเงิน 1 รหัส/1 สิทธิ์ = ผู้วิ่ง 1 คน (ไม่รวมผู้ร่วมวิ่ง/น้องหมาเพิ่ม)
        </p>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <label className="md:col-span-4 block">
            <span className="block text-xs font-extrabold text-[#2A1450] mb-1">ชื่อสปอนเซอร์ *</span>
            <input
              required
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              maxLength={120}
              placeholder="เช่น บริษัท ตัวอย่าง จำกัด"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-[#2A1450]/20 text-sm font-semibold"
            />
          </label>
          <div className="md:col-span-3">
            <span className="block text-xs font-extrabold text-[#2A1450] mb-1">จำนวนสิทธิ์ (คน)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100000}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                disabled={unlimited}
                className="w-24 px-3 py-2.5 rounded-xl border-2 border-[#2A1450]/20 text-sm font-semibold disabled:opacity-40"
              />
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#4B2D78] cursor-pointer">
                <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
                ไม่จำกัด
              </label>
            </div>
          </div>
          <label className="md:col-span-3 block">
            <span className="block text-xs font-extrabold text-[#2A1450] mb-1">รหัสเอง (ไม่บังคับ)</span>
            <input
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              maxLength={32}
              placeholder="เว้นว่าง = สุ่มให้"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-[#2A1450]/20 text-sm font-mono font-semibold"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FFC928] hover:brightness-105 disabled:opacity-60 text-[#1E0F38] font-black text-sm border-2 border-[#2A1450] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              สร้างรหัส
            </button>
          </div>
          <label className="md:col-span-12 block">
            <span className="block text-xs font-extrabold text-[#2A1450] mb-1">หมายเหตุ (เห็นเฉพาะแอดมิน)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={240}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-[#2A1450]/20 text-sm font-semibold"
            />
          </label>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-sm font-bold text-rose-700 bg-rose-50 border-2 border-rose-300 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 overflow-hidden">
        <div className="px-4 py-3 border-b-2 border-[#2A1450]/10 flex items-center justify-between text-xs font-extrabold text-[#2A1450]">
          <span>ทั้งหมด {codes?.length ?? 0} รหัส</span>
          <span>ใช้ไปแล้วรวม {used} สิทธิ์</span>
        </div>
        {codes === null ? (
          <p className="p-6 text-sm font-semibold text-[#6F6878] text-center">กำลังโหลด...</p>
        ) : codes.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-[#6F6878] text-center">ยังไม่มีรหัส สร้างรหัสแรกได้ด้านบน</p>
        ) : (
          <ul className="divide-y-2 divide-[#2A1450]/10">
            {codes.map((c) => {
              const full = c.maxUses !== null && c.usedCount >= c.maxUses;
              return (
                <li key={c.code} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-black text-base text-[#54239A] tracking-wide break-all">{c.code}</code>
                      <button
                        type="button"
                        onClick={() => copy(c.code)}
                        aria-label={`คัดลอกรหัส ${c.code}`}
                        className="shrink-0 w-8 h-8 rounded-lg border-2 border-[#2A1450]/20 hover:bg-[#EEE4FA] flex items-center justify-center cursor-pointer"
                      >
                        {copied === c.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm font-extrabold text-[#2A1450] truncate">{c.sponsorName}</p>
                    {c.note && <p className="text-xs font-semibold text-[#6F6878] truncate">{c.note}</p>}
                  </div>
                  <div className="md:col-span-3 text-sm font-bold text-[#2A1450]">
                    ใช้แล้ว {c.usedCount} / {c.maxUses === null ? 'ไม่จำกัด' : c.maxUses}
                    {full && <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-400 text-amber-800 text-[11px]">ครบสิทธิ์</span>}
                  </div>
                  <div className="md:col-span-5 flex flex-wrap items-center gap-2 md:justify-end">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => adminApi.updateSponsorCode(c.code, { active: !c.active }))}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold border-2 cursor-pointer disabled:opacity-60 ${
                        c.active
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-slate-100 border-slate-400 text-slate-600'
                      }`}
                    >
                      {c.active ? 'เปิดใช้งานอยู่' : 'ปิดอยู่'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const v = window.prompt(`เปลี่ยนจำนวนสิทธิ์ทั้งหมดของ ${c.code} (เว้นว่างหรือ 0 = ไม่จำกัด)`, String(c.maxUses ?? ''));
                        if (v === null) return;
                        const n = Math.floor(Number(v));
                        run(() => adminApi.updateSponsorCode(c.code, { maxUses: v.trim() === '' || n === 0 ? null : n }));
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-extrabold border-2 border-[#2A1450]/25 bg-white hover:bg-[#F4EEFD] cursor-pointer disabled:opacity-60"
                    >
                      แก้จำนวนสิทธิ์
                    </button>
                    {c.usedCount === 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`ลบรหัส ${c.code} ?`)) run(() => adminApi.deleteSponsorCode(c.code));
                        }}
                        aria-label={`ลบรหัส ${c.code}`}
                        className="w-9 h-9 rounded-xl border-2 border-rose-300 text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer disabled:opacity-60"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
