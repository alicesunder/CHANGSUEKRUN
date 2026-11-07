import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { adminApi, type Announcement } from '../utils/api';

/**
 * Admin card: announcements shown to runners at the top of their Runner Center ("ประกาศจากผู้จัด").
 * Newest first; "สำคัญ" ones are highlighted in gold. Plain text only. Every save is recorded in the audit log.
 */
export const AnnouncementsCard: React.FC = () => {
  const [list, setList] = useState<Announcement[] | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [important, setImportant] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminApi
      .getAnnouncements()
      .then((r) => setList(r.announcements))
      .catch((e) => setMsg({ ok: false, text: e instanceof Error ? e.message : 'โหลดประกาศไม่สำเร็จ' }));
  }, []);

  const save = async (next: Announcement[], okText: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await adminApi.saveAnnouncements(next);
      setList(r.announcements);
      setMsg({ ok: true, text: okText });
      return true;
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (!title.trim() || busy || !list) return;
    const item: Announcement = { id: '', title: title.trim(), body: body.trim(), level: important ? 'important' : 'info', createdAt: new Date().toISOString() };
    if (await save([item, ...list], 'เผยแพร่ประกาศแล้ว นักวิ่งจะเห็นใน "ศูนย์นักวิ่ง"')) {
      setTitle('');
      setBody('');
      setImportant(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
        <Megaphone className="h-5 w-5 text-purple-600" aria-hidden="true" /> ประกาศจากผู้จัด (แสดงในศูนย์นักวิ่ง)
      </h3>
      <p className="mt-1 text-xs font-semibold text-slate-500">เขียนข้อความสั้นๆ ที่นักวิ่งทุกคนต้องเห็น เช่น เวลารับ Race Kit หรือการเปลี่ยนแปลงกำหนดการ (ข้อความล้วน ไม่ใส่ลิงก์อันตราย)</p>

      <div className="mt-3 grid gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="หัวข้อประกาศ"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-purple-500"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="รายละเอียด (ไม่เกิน 600 ตัวอักษร)"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-purple-500"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} /> ประกาศสำคัญ (เน้นสีทอง)
          </label>
          <button
            type="button"
            onClick={add}
            disabled={busy || !title.trim() || !list}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-purple-700 px-4 text-sm font-black text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> เผยแพร่ประกาศ
          </button>
        </div>
      </div>

      {msg && <p role="status" className={`mt-2 text-sm font-bold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</p>}

      <ul className="mt-3 space-y-2">
        {(list || []).map((a) => (
          <li key={a.id} className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 ${a.level === 'important' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900">
                {a.level === 'important' && <span className="mr-1 rounded bg-amber-300 px-1.5 text-[11px]">สำคัญ</span>}
                {a.title}
              </p>
              {a.body && <p className="whitespace-pre-line text-xs font-semibold text-slate-600">{a.body}</p>}
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{new Date(a.createdAt).toLocaleString('th-TH')}</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm('ลบประกาศนี้? นักวิ่งจะไม่เห็นอีก')) void save((list || []).filter((x) => x.id !== a.id), 'ลบประกาศแล้ว');
              }}
              aria-label={`ลบประกาศ ${a.title}`}
              className="shrink-0 rounded-lg border border-slate-300 bg-white p-2 text-rose-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {list && list.length === 0 && <li className="text-sm font-semibold text-slate-400">ยังไม่มีประกาศ</li>}
      </ul>
    </div>
  );
};
