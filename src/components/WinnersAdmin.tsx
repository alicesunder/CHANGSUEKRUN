import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { adminApi, type Winner } from '../utils/api';

const MAX_PHOTO_CHARS = 240_000;

/** Shrinks a photo in the browser until it is small enough to store with the winner. */
async function shrinkPhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  let side = 1000;
  for (let q = 0.82; ; q -= 0.12) {
    const scale = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', Math.max(q, 0.4));
    if (url.length <= MAX_PHOTO_CHARS) return url;
    if (q <= 0.4) side = Math.round(side * 0.75);
    if (side < 240) throw new Error('รูปใหญ่เกินไป');
  }
}

const newId = () => Math.random().toString(36).slice(2, 10);

/** Admin tab: fill in the winners board (name, headline, photo). Starts empty. */
export const WinnersAdmin: React.FC = () => {
  const [list, setList] = useState<Winner[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminApi
      .getWinners()
      .then((r) => setList(r.winners))
      .catch((e) => {
        setList([]);
        setMsg({ ok: false, text: e instanceof Error ? e.message : 'โหลดไม่สำเร็จ' });
      });
  }, []);

  const patch = (id: string, p: Partial<Winner>) => setList((l) => (l || []).map((w) => (w.id === id ? { ...w, ...p } : w)));
  const move = (i: number, d: -1 | 1) =>
    setList((l) => {
      const a = [...(l || [])];
      const j = i + d;
      if (j < 0 || j >= a.length) return a;
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });

  const pickPhoto = async (id: string, file?: File) => {
    if (!file) return;
    try {
      patch(id, { photo: await shrinkPhoto(file) });
      setMsg(null);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'ใช้รูปนี้ไม่ได้' });
    }
  };

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await adminApi.saveWinners((list || []).filter((w) => w.name.trim()));
      setList(res.winners);
      setMsg({ ok: true, text: 'บันทึกแล้ว · ขึ้นบนหน้าเว็บทันที' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ' });
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full min-h-[44px] px-3 py-2 rounded-xl border-2 border-[#2A1450]/20 text-sm font-semibold';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-black text-[#2A1450]">ประกาศอันดับผู้ชนะ</h3>
        <p className="text-xs sm:text-sm font-semibold text-[#6F6878] mt-1">
          เพิ่มชื่อผู้ชนะและรูป แล้วกดบันทึก จะแสดงในส่วน “ประกาศอันดับผู้ชนะ” บนหน้าเว็บ (ถ้ายังไม่มีรายการ หน้าเว็บจะแสดงว่า “รอลุ้น”)
        </p>
      </div>

      {list === null ? (
        <p className="text-sm font-semibold text-[#6F6878] text-center py-6">กำลังโหลด…</p>
      ) : (
        <ul className="space-y-3">
          {list.map((w, i) => (
            <li key={w.id} className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
              <label className="relative aspect-[4/3] sm:aspect-square rounded-xl border-2 border-dashed border-[#2A1450]/30 bg-[#FAF7FF] flex items-center justify-center overflow-hidden cursor-pointer">
                {w.photo ? <img src={w.photo} alt="" className="w-full h-full object-cover" /> : <span className="flex flex-col items-center text-xs font-bold text-[#6B5A85]"><ImagePlus className="w-6 h-6" />เพิ่มรูป</span>}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(w.id, e.target.files?.[0])} />
              </label>
              <div className="space-y-2 min-w-0">
                <input className={input} value={w.title} onChange={(e) => patch(w.id, { title: e.target.value })} placeholder="หัวข้อ เช่น 5 KM ชาย อันดับ 1 / ประกวดแต่งตัว ชนะเลิศ" maxLength={120} />
                <input className={input} value={w.name} onChange={(e) => patch(w.id, { name: e.target.value })} placeholder="ชื่อผู้ชนะ *" maxLength={120} />
                <input className={input} value={w.note || ''} onChange={(e) => patch(w.id, { note: e.target.value })} placeholder="หมายเหตุ เช่น เวลา 22:15 (ไม่บังคับ)" maxLength={200} />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => move(i, -1)} aria-label="เลื่อนขึ้น" className="w-11 h-11 rounded-xl border-2 border-[#2A1450]/20 flex items-center justify-center cursor-pointer"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="เลื่อนลง" className="w-11 h-11 rounded-xl border-2 border-[#2A1450]/20 flex items-center justify-center cursor-pointer"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setList((l) => (l || []).filter((x) => x.id !== w.id))} aria-label="ลบรายการ" className="w-11 h-11 rounded-xl border-2 border-rose-300 text-rose-600 flex items-center justify-center cursor-pointer ml-auto"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </li>
          ))}
          {list.length === 0 && <li className="text-sm font-semibold text-[#6F6878] text-center py-4">ยังไม่มีผู้ชนะ (หน้าเว็บแสดงสถานะ “รอลุ้น”)</li>}
        </ul>
      )}

      {msg && (
        <p role="status" className={`text-sm font-bold rounded-xl px-3 py-2 border-2 ${msg.ok ? 'text-emerald-800 bg-emerald-50 border-emerald-300' : 'text-rose-700 bg-rose-50 border-rose-300'}`}>
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setList((l) => [...(l || []), { id: newId(), title: '', name: '' }])}
          disabled={(list?.length ?? 0) >= 24}
          className="min-h-[48px] px-4 rounded-xl border-2 border-[#2A1450] bg-white text-[#2A1450] text-sm font-extrabold flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> เพิ่มผู้ชนะ
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy || list === null}
          className="min-h-[48px] px-5 rounded-xl border-2 border-[#2A1450] bg-[#FFC928] text-[#2A1450] text-sm font-black flex items-center gap-2 cursor-pointer shadow-[0_3px_0_#2A1450] disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {busy ? 'กำลังบันทึก…' : 'บันทึกและแสดงบนเว็บ'}
        </button>
      </div>
    </div>
  );
};
