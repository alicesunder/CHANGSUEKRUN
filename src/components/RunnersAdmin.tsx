import React, { useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminRunnerSummary, type ServerOrder } from '../utils/api';

const METHOD_LABEL: Record<string, string> = { password: 'อีเมล/ชื่อผู้ใช้', google: 'Google', line: 'LINE' };
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const baht = (n: number) => `฿${n.toLocaleString('th-TH')}`;

type Detail = { runner: Awaited<ReturnType<typeof adminApi.getRunner>>['runner']; orders: ServerOrder[] };

interface Props {
  /** opens the full order inspector (slip, BIB, insurance...) used in the Orders tab */
  onOpenOrder: (orderId: string) => void;
}

/** Admin tab: every runner account, how many orders it made, and all of one account's orders in one place. */
export const RunnersAdmin: React.FC<Props> = ({ onOpenOrder }) => {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.listRunners>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState<'all' | 'password' | 'google' | 'line'>('all');
  const [onlyOrders, setOnlyOrders] = useState<'all' | 'with' | 'without'>('all');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  const load = () => {
    setError(null);
    adminApi
      .listRunners()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ'));
  };
  useEffect(load, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.runners || []).filter((r) => {
      if (method !== 'all' && !r.methods.includes(method)) return false;
      if (onlyOrders === 'with' && r.orders === 0) return false;
      if (onlyOrders === 'without' && r.orders > 0) return false;
      if (!q) return true;
      return [r.name, r.email, r.username, r.phone, r.id].some((v) => v.toLowerCase().includes(q));
    });
  }, [data, query, method, onlyOrders]);

  const open = async (r: AdminRunnerSummary) => {
    setDetailBusy(true);
    setError(null);
    try {
      setDetail(await adminApi.getRunner(r.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เปิดบัญชีไม่สำเร็จ');
    } finally {
      setDetailBusy(false);
    }
  };

  const t = data?.totals;

  if (detail) {
    const d = detail.runner;
    const live = detail.orders.filter((o) => !o.cancelledAt && !o.isTest);
    const paid = live.filter((o) => o.paymentStatus === 'PAID');
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setDetail(null)} className="text-sm font-extrabold text-[#5B20A8] underline underline-offset-2 cursor-pointer">
          ← กลับไปรายชื่อบัญชีทั้งหมด
        </button>
        <div className="rounded-2xl border-2 border-[#180B30] bg-white p-4 shadow-[3px_3px_0_#180B30]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[#180B30]">{d.name || '(ยังไม่ได้ใส่ชื่อ)'}</h3>
              <p className="text-xs font-bold text-[#6B5A85]">รหัสบัญชี {d.id} · สมัครเมื่อ {fmtDate(d.createdAt)}</p>
            </div>
            <div className="flex gap-2 text-center">
              <div className="rounded-xl bg-[#F4ECFF] px-3 py-1.5">
                <div className="text-lg font-black text-[#5B20A8]">{live.length}</div>
                <div className="text-[10px] font-extrabold text-[#6B5A85]">คำสั่งซื้อ</div>
              </div>
              <div className="rounded-xl bg-[#ECFDF5] px-3 py-1.5">
                <div className="text-lg font-black text-emerald-700">{baht(paid.reduce((n, o) => n + o.totalPrice, 0))}</div>
                <div className="text-[10px] font-extrabold text-[#6B5A85]">จ่ายแล้ว ({paid.length})</div>
              </div>
            </div>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div><dt className="inline font-extrabold text-[#6B5A85]">อีเมล: </dt><dd className="inline">{d.email || '—'}{d.email && (d.emailVerified ? ' ✅ ยืนยันแล้ว' : ' ⏳ ยังไม่ยืนยัน')}</dd></div>
            <div><dt className="inline font-extrabold text-[#6B5A85]">ชื่อผู้ใช้: </dt><dd className="inline">{d.username || '—'}</dd></div>
            <div><dt className="inline font-extrabold text-[#6B5A85]">โทร: </dt><dd className="inline">{d.phone || '—'}</dd></div>
            <div>
              <dt className="inline font-extrabold text-[#6B5A85]">เข้าสู่ระบบด้วย: </dt>
              <dd className="inline">{[d.hasPassword && METHOD_LABEL.password, ...d.social.map((s) => METHOD_LABEL[s] || s)].filter(Boolean).join(', ') || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="overflow-x-auto rounded-2xl border-2 border-[#180B30] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#180B30] text-xs font-extrabold text-[#FFC928]">
              <tr>
                <th className="px-3 py-2">คำสั่งซื้อ</th>
                <th className="px-3 py-2">รายการ</th>
                <th className="px-3 py-2">ผู้ลงทะเบียน</th>
                <th className="px-3 py-2 text-right">ยอด</th>
                <th className="px-3 py-2">สถานะ</th>
                <th className="px-3 py-2">BIB</th>
                <th className="px-3 py-2">วันที่</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {detail.orders.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center font-bold text-[#6B5A85]">บัญชีนี้ยังไม่มีคำสั่งซื้อ</td></tr>
              )}
              {detail.orders.map((o) => {
                const status = o.cancelledAt ? 'ยกเลิก' : o.isTest ? 'ทดสอบ' : o.paymentStatus === 'PAID' ? 'จ่ายแล้ว' : 'รอชำระ';
                const color = o.cancelledAt ? 'bg-rose-100 text-rose-800' : o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
                return (
                  <tr key={o.orderId} className="border-t border-[#E9DDF9] align-top">
                    <td className="px-3 py-2 font-mono text-xs font-bold">{o.orderId}</td>
                    <td className="px-3 py-2">
                      <div className="font-bold">{o.routeName}</div>
                      {o.addOns?.label ? <div className="text-xs text-[#6B5A85]">+ {o.addOns.label}</div> : null}
                      {o.vipTables ? <div className="text-xs text-[#6B5A85]">VIP {o.vipTables} โต๊ะ</div> : null}
                    </td>
                    <td className="px-3 py-2">{o.fullName}</td>
                    <td className="px-3 py-2 text-right font-bold">{baht(o.totalPrice)}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${color}`}>{status}</span></td>
                    <td className="px-3 py-2 font-mono text-xs">{o.bibNumber || '—'}</td>
                    <td className="px-3 py-2 text-xs">{fmtDate(o.createdAt)}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => onOpenOrder(o.orderId)} className="rounded-lg border-2 border-[#180B30] bg-[#FFC928] px-2 py-1 text-[11px] font-extrabold text-[#180B30] cursor-pointer">
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          ['บัญชีทั้งหมด', t?.accounts, 'bg-[#F4ECFF] text-[#5B20A8]'],
          ['เคยสั่งซื้อ', t?.withOrders, 'bg-[#ECFDF5] text-emerald-700'],
          ['อีเมล/ชื่อผู้ใช้', t?.password, 'bg-white text-[#180B30]'],
          ['Google', t?.google, 'bg-white text-[#180B30]'],
          ['LINE', t?.line, 'bg-white text-[#180B30]'],
        ].map(([label, n, cls]) => (
          <div key={String(label)} className={`rounded-2xl border-2 border-[#180B30] px-3 py-2 text-center ${cls}`}>
            <div className="text-2xl font-black">{n ?? '…'}</div>
            <div className="text-[11px] font-extrabold text-[#6B5A85]">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อ / อีเมล / ชื่อผู้ใช้ / เบอร์ / รหัสบัญชี"
          className="min-w-[14rem] flex-1 rounded-xl border-2 border-[#180B30] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#5B20A8]"
        />
        <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="rounded-xl border-2 border-[#180B30] bg-white px-2 py-2 text-sm font-bold">
          <option value="all">ทุกวิธีสมัคร</option>
          <option value="password">อีเมล/ชื่อผู้ใช้</option>
          <option value="google">Google</option>
          <option value="line">LINE</option>
        </select>
        <select value={onlyOrders} onChange={(e) => setOnlyOrders(e.target.value as typeof onlyOrders)} className="rounded-xl border-2 border-[#180B30] bg-white px-2 py-2 text-sm font-bold">
          <option value="all">ทั้งหมด</option>
          <option value="with">เคยสั่งซื้อ</option>
          <option value="without">ยังไม่เคยสั่งซื้อ</option>
        </select>
        <button type="button" onClick={load} className="rounded-xl border-2 border-[#180B30] bg-white px-3 py-2 text-sm font-extrabold cursor-pointer">รีเฟรช</button>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#180B30] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#180B30] text-xs font-extrabold text-[#FFC928]">
            <tr>
              <th className="px-3 py-2">ชื่อ</th>
              <th className="px-3 py-2">อีเมล / ชื่อผู้ใช้</th>
              <th className="px-3 py-2">เข้าสู่ระบบด้วย</th>
              <th className="px-3 py-2 text-right">คำสั่งซื้อ</th>
              <th className="px-3 py-2 text-right">จ่ายแล้ว</th>
              <th className="px-3 py-2">สมัครเมื่อ</th>
              <th className="px-3 py-2">ซื้อล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && <tr><td colSpan={7} className="px-3 py-6 text-center font-bold text-[#6B5A85]">กำลังโหลด…</td></tr>}
            {data && rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center font-bold text-[#6B5A85]">ไม่พบบัญชีตามเงื่อนไขนี้</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} onClick={() => !detailBusy && open(r)} className="cursor-pointer border-t border-[#E9DDF9] hover:bg-[#F4ECFF]">
                <td className="px-3 py-2 font-bold">{r.name || '—'}</td>
                <td className="px-3 py-2 text-xs">
                  <div>{r.email || '—'}{r.email && !r.emailVerified ? ' ⏳' : ''}</div>
                  {r.username ? <div className="text-[#6B5A85]">@{r.username}</div> : null}
                </td>
                <td className="px-3 py-2 text-xs">{r.methods.map((m) => METHOD_LABEL[m] || m).join(', ') || '—'}</td>
                <td className="px-3 py-2 text-right font-black">{r.orders}</td>
                <td className="px-3 py-2 text-right font-bold">{r.paidOrders ? `${r.paidOrders} · ${baht(r.paidTotal)}` : '—'}</td>
                <td className="px-3 py-2 text-xs">{fmtDate(r.createdAt)}</td>
                <td className="px-3 py-2 text-xs">{fmtDate(r.lastOrderAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs font-bold text-[#6B5A85]">กดที่แถวเพื่อดูคำสั่งซื้อทั้งหมดของบัญชีนั้น · คำสั่งซื้อเก่าที่ซื้อก่อนมีระบบสมาชิก (ไม่ได้ล็อกอิน) จะไม่ผูกกับบัญชีจนกว่านักวิ่งจะกดรับคำสั่งซื้อเดิมเข้าบัญชี</p>
    </div>
  );
};
