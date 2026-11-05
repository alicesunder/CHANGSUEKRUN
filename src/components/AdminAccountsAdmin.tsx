import React, { useEffect, useState } from 'react';
import { adminApi, type AdminAccountRow } from '../utils/api';

const ROLE_TH: Record<string, string> = {
  manager: 'ผู้จัดการ — จัดการคำสั่งซื้อ บัญชีนักวิ่ง ส่งออกข้อมูล (ไม่แตะตั้งค่า/เงิน)',
  viewer: 'ดูอย่างเดียว — ดูรายการและสรุป ไม่แก้ไข ไม่ส่งออกข้อมูลเต็ม',
};
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

/** Admin tab (owner): individual admin accounts with roles. The owner account itself is set in Vercel. */
export const AdminAccountsAdmin: React.FC = () => {
  const [rows, setRows] = useState<AdminAccountRow[] | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ username: '', displayName: '', role: 'manager' as 'manager' | 'viewer', password: '' });
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<{ admins: AdminAccountRow[] }>, ok: string) => {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      setRows((await fn()).admins);
      setMsg(ok);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ทำรายการไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    adminApi.listAdmins().then((r) => setRows(r.admins)).catch((e) => setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ'));
  }, []);

  const resetPw = (u: AdminAccountRow) => {
    const pw = window.prompt(`ตั้งรหัสผ่านใหม่ให้ ${u.username} (อย่างน้อย 10 ตัวอักษร) — แจ้งรหัสให้เจ้าตัวเอง และให้เขาเปลี่ยนเองภายหลังได้`);
    if (pw) run(() => adminApi.updateAdmin(u.username, { password: pw }), `ตั้งรหัสผ่านใหม่ให้ ${u.username} แล้ว (ออกจากระบบทุกอุปกรณ์ของเขา)`);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border-2 border-[#180B30] bg-white p-4 space-y-1">
        <h3 className="text-base font-black text-[#180B30]">บัญชีแอดมิน</h3>
        <p className="text-sm font-semibold text-slate-700">
          ให้แต่ละคนมีบัญชีของตัวเอง เพื่อรู้ว่าใครทำอะไร (ดูได้ที่แท็บ "บันทึกการใช้งาน") และถอนสิทธิ์รายคนได้ บัญชีเจ้าของ (ที่ตั้งใน Vercel) มีสิทธิ์ทุกอย่างและมีได้บัญชีเดียว
        </p>
      </section>

      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p>}
      {msg && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{msg}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#180B30] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#180B30] text-xs font-extrabold text-[#FFC928]">
            <tr>
              <th className="px-3 py-2">ชื่อผู้ใช้</th>
              <th className="px-3 py-2">ชื่อที่แสดง</th>
              <th className="px-3 py-2">สิทธิ์</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">เข้าล่าสุด</th>
              <th className="px-3 py-2">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows && rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center font-bold text-slate-500">ยังไม่มีบัญชีอื่น (มีแต่เจ้าของ)</td></tr>}
            {(rows || []).map((u) => (
              <tr key={u.username} className="border-t border-[#E9DDF9]">
                <td className="px-3 py-2 font-mono text-xs font-bold">{u.username}</td>
                <td className="px-3 py-2">{u.displayName}</td>
                <td className="px-3 py-2">
                  <select
                    value={u.role}
                    disabled={busy}
                    onChange={(e) => run(() => adminApi.updateAdmin(u.username, { role: e.target.value as 'manager' | 'viewer' }), 'เปลี่ยนสิทธิ์แล้ว (ออกจากระบบทุกอุปกรณ์ของเขา)')}
                    className="rounded-lg border-2 border-[#180B30] bg-white px-2 py-1 text-xs font-bold"
                  >
                    <option value="manager">ผู้จัดการ</option>
                    <option value="viewer">ดูอย่างเดียว</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{u.active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}</span>
                </td>
                <td className="px-3 py-2 text-xs">{fmt(u.lastLoginAt)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-extrabold">
                    <button type="button" disabled={busy} onClick={() => run(() => adminApi.updateAdmin(u.username, { active: !u.active }), u.active ? 'ปิดบัญชีแล้ว' : 'เปิดบัญชีแล้ว')} className="rounded-lg border-2 border-[#180B30] px-2 py-1 cursor-pointer">
                      {u.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => resetPw(u)} className="rounded-lg border-2 border-[#180B30] px-2 py-1 cursor-pointer">ตั้งรหัสผ่านใหม่</button>
                    <button type="button" disabled={busy} onClick={() => run(() => adminApi.updateAdmin(u.username, { signOut: true }), 'ออกจากระบบทุกอุปกรณ์ของเขาแล้ว')} className="rounded-lg border-2 border-[#180B30] px-2 py-1 cursor-pointer">ออกจากระบบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        className="space-y-3 rounded-2xl border-2 border-[#180B30] bg-[#FAF7FF] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => adminApi.createAdmin(form), `สร้างบัญชี ${form.username} แล้ว`).then(() => setForm({ username: '', displayName: '', role: 'manager', password: '' }));
        }}
      >
        <h4 className="text-sm font-black text-[#180B30]">เพิ่มบัญชีแอดมิน</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="ชื่อผู้ใช้ (a-z 0-9 . _ -)" autoComplete="off" className="rounded-xl border-2 border-[#180B30] bg-white px-3 py-2 text-sm font-bold outline-none" />
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="ชื่อที่แสดง (เช่น คุณสมชาย)" className="rounded-xl border-2 border-[#180B30] bg-white px-3 py-2 text-sm font-bold outline-none" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'manager' | 'viewer' })} className="rounded-xl border-2 border-[#180B30] bg-white px-3 py-2 text-sm font-bold">
            <option value="manager">ผู้จัดการ</option>
            <option value="viewer">ดูอย่างเดียว</option>
          </select>
          <input required type="password" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="รหัสผ่านเริ่มต้น (อย่างน้อย 10 ตัว)" autoComplete="new-password" className="rounded-xl border-2 border-[#180B30] bg-white px-3 py-2 text-sm font-bold outline-none" />
        </div>
        <p className="text-xs font-semibold text-slate-600">{ROLE_TH[form.role]}</p>
        <button type="submit" disabled={busy} className="rounded-xl border-2 border-[#180B30] bg-[#FFC928] px-4 py-2 text-sm font-black text-[#180B30] cursor-pointer disabled:opacity-60">
          สร้างบัญชี
        </button>
      </form>
    </div>
  );
};
