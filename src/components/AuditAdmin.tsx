import React, { useEffect, useState } from 'react';
import { adminApi, type AuditRow } from '../utils/api';

/** Plain-language names for the actions the server records. */
const LABELS: Record<string, string> = {
  'LOGIN ok': 'เข้าสู่ระบบ',
  'LOGIN failed': 'เข้าสู่ระบบไม่สำเร็จ',
  'LOGIN locked': 'ถูกล็อกเพราะใส่รหัสผิดหลายครั้ง',
  'GET /orders/:id/full': 'เปิดดูข้อมูลเต็ม (เลขบัตร/สุขภาพ)',
  'GET /export/orders': 'ส่งออกข้อมูลเต็ม (CSV)',
  'POST /orders/:id/verification': 'เปลี่ยนสถานะตรวจสลิป',
  'POST /orders/:id/email': 'ส่งตั๋วทางอีเมลซ้ำ',
  'POST /orders/:id/kit': 'เช็กอิน/ยกเลิกการรับชุด',
  'POST /orders/:id/cancel': 'ยกเลิกคำสั่งซื้อ',
  'POST /orders/:id/restore': 'กู้คืนคำสั่งซื้อ',
  'POST /orders/:id/refund': 'บันทึกการคืนเงิน',
  'PUT /settings': 'แก้ตั้งค่าการชำระเงิน/BIB',
  'POST /payment-gateway': 'เปลี่ยนคีย์ตรวจสลิป',
  'PUT /sales': 'เปิด/ปิดการขาย',
  'PUT /early-bird': 'ตั้ง Early Bird',
  'PUT /limits': 'ตั้งจำนวนที่นั่งกิจกรรม',
  'PUT /winners': 'แก้ประกาศผู้ชนะ',
  'POST /sponsor-codes': 'สร้างรหัสสปอนเซอร์',
  'PATCH /sponsor-codes/:code': 'แก้รหัสสปอนเซอร์',
  'DELETE /sponsor-codes/:code': 'ลบรหัสสปอนเซอร์',
  'POST /admins': 'สร้างบัญชีแอดมิน',
  'PATCH /admins/:user': 'แก้บัญชีแอดมิน',
  'POST /admins/sign-out-all': 'ออกจากระบบทุกอุปกรณ์',
  'POST /me/password': 'เปลี่ยนรหัสผ่านของตัวเอง',
  'POST /runners/:id/disable': 'ระงับ/เปิดบัญชีนักวิ่ง',
  'POST /runners/:id/reset-email': 'ส่งลิงก์ตั้งรหัสผ่านให้นักวิ่ง',
};

const SENSITIVE = new Set(['GET /orders/:id/full', 'GET /export/orders', 'POST /orders/:id/cancel', 'POST /orders/:id/refund', 'POST /admins', 'PATCH /admins/:user', 'POST /admins/sign-out-all', 'LOGIN failed', 'LOGIN locked', 'PUT /settings', 'POST /payment-gateway']);

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'medium' });

/** Admin tab (owner): the server-side audit log — who did what, when, from which address. */
export const AuditAdmin: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [actor, setActor] = useState('');
  const [onlySensitive, setOnlySensitive] = useState(false);

  const load = async (more = false) => {
    setBusy(true);
    setError('');
    try {
      const r = await adminApi.listAudit({ before: more && rows.length ? rows[rows.length - 1].id : undefined, actor: actor.trim() || undefined, limit: 100 });
      setRows((cur) => (more ? [...cur, ...r.rows] : r.rows));
      setDone(r.rows.length < 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOutAll = async () => {
    if (!window.confirm('ออกจากระบบแอดมินทุกบัญชีและทุกอุปกรณ์ (รวมของคุณด้วย)? ใช้เมื่อสงสัยว่ารหัสผ่านหรืออุปกรณ์รั่วไหล')) return;
    try {
      await adminApi.signOutAll();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ทำรายการไม่สำเร็จ');
    }
  };

  const shown = onlySensitive ? rows.filter((r) => SENSITIVE.has(r.action)) : rows;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border-2 border-[#180B30] bg-white p-4 space-y-2">
        <h3 className="text-base font-black text-[#180B30]">ความปลอดภัยของข้อมูล — สิ่งที่ระบบทำจริง</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
          <li>บันทึกการกระทำสำคัญของแอดมินและเจ้าหน้าที่สแกนไว้บนเซิร์ฟเวอร์ (ตารางด้านล่าง) ผู้ใช้ลบเองไม่ได้</li>
          <li>เลขบัตรประชาชน ข้อมูลสุขภาพ และหมู่เลือดในหน้ารายการ ถูกปิดบังที่เซิร์ฟเวอร์ ส่งตัวเต็มเฉพาะเมื่อกด "แสดงข้อมูลเต็ม" หรือส่งออก CSV และทุกครั้งถูกบันทึกในบันทึกนี้</li>
          <li>เบอร์โทรและอีเมลถูกซ่อนเฉพาะบนหน้าจอ (ฝั่งเบราว์เซอร์) เซิร์ฟเวอร์ยังส่งให้แอดมินทุกคนที่ล็อกอินได้ ถ้าต้องการจำกัดมากกว่านี้ให้ใช้บัญชี "ดูอย่างเดียว" สำหรับคนที่ไม่ต้องใช้ข้อมูลติดต่อ</li>
          <li>บัญชีแอดมินแยกสิทธิ์ได้ 3 ระดับ (เจ้าของ / ผู้จัดการ / ดูอย่างเดียว) และออกจากระบบทุกอุปกรณ์ได้</li>
          <li>ยังไม่มี 2FA และข้อมูลในฐานข้อมูลยังไม่ได้เข้ารหัสเพิ่มเติมนอกเหนือจากที่ผู้ให้บริการฐานข้อมูลทำ</li>
        </ul>
        <button type="button" onClick={signOutAll} className="rounded-xl border-2 border-rose-600 px-3 py-2 text-xs font-extrabold text-rose-700 cursor-pointer hover:bg-rose-50">
          ออกจากระบบแอดมินทุกอุปกรณ์
        </button>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="กรองตามชื่อผู้ทำ (ชื่อผู้ใช้)"
          className="min-w-[12rem] rounded-xl border-2 border-[#180B30] bg-white px-3 py-2 text-sm font-bold outline-none"
        />
        <button type="button" onClick={() => load()} className="rounded-xl border-2 border-[#180B30] bg-white px-3 py-2 text-sm font-extrabold cursor-pointer">ค้นหา / รีเฟรช</button>
        <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <input type="checkbox" checked={onlySensitive} onChange={(e) => setOnlySensitive(e.target.checked)} /> เฉพาะรายการสำคัญ
        </label>
      </div>
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#180B30] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#180B30] text-xs font-extrabold text-[#FFC928]">
            <tr>
              <th className="px-3 py-2">เวลา</th>
              <th className="px-3 py-2">ผู้ทำ</th>
              <th className="px-3 py-2">สิ่งที่ทำ</th>
              <th className="px-3 py-2">เป้าหมาย</th>
              <th className="px-3 py-2">รายละเอียด</th>
              <th className="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center font-bold text-slate-500">{busy ? 'กำลังโหลด…' : 'ยังไม่มีบันทึก'}</td></tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className={`border-t border-[#E9DDF9] align-top ${SENSITIVE.has(r.action) ? 'bg-amber-50' : ''}`}>
                <td className="whitespace-nowrap px-3 py-2 text-xs">{fmt(r.at)}</td>
                <td className="px-3 py-2 text-xs font-bold">{r.actor}<span className="ml-1 font-normal text-slate-500">{r.role}</span></td>
                <td className="px-3 py-2 font-bold">{LABELS[r.action] || r.action}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.target || '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {r.detail?.body ? Object.entries(r.detail.body).map(([k, v]) => `${k}: ${String(v)}`).join(' · ') : r.detail && Object.keys(r.detail).length ? JSON.stringify(r.detail) : ''}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!done && rows.length > 0 && (
        <button type="button" disabled={busy} onClick={() => load(true)} className="rounded-xl border-2 border-[#180B30] bg-white px-4 py-2 text-sm font-extrabold cursor-pointer disabled:opacity-60">
          {busy ? 'กำลังโหลด…' : 'ดูรายการเก่ากว่านี้'}
        </button>
      )}
    </div>
  );
};
