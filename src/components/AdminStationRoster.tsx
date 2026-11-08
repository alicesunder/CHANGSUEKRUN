import React, { useMemo, useRef, useState } from 'react';
import { Download, Search } from 'lucide-react';
import type { ServerOrder } from '../utils/api';
import { WIND_TUNNEL_LIMIT, formatBaht } from '../data/addOns';
import { formatThaiId } from '../data/shooting';
import { maskEmailAddress, maskPhoneNumber } from '../utils/securityShield';
import { WAIVER_LABEL, WIND_HEALTH_QUESTIONS, ageOn, thaiDate } from '../data/activityWaivers';
import { WaiverDocument, printWaivers } from './WaiverDocument';

/** One "station" = one thing a buyer can sign up for: a run distance, the concert, VIP tables or an activity. */
interface Station {
  id: string;
  emoji: string;
  name: string;
  /** day it happens */
  day: string;
  color: string;
  /** how many people / seats / tables this order brings to the station (0 = not in it) */
  qty: (o: ServerOrder) => number;
  unit: string;
  limit?: number;
}

const isRunOrder = (o: ServerOrder) => (o.ticketType ?? 'RUN') === 'RUN';

const STATIONS: Station[] = [
  { id: '10km', emoji: '🏃', name: 'วิ่ง 10 km', day: '9 ม.ค.', color: '#8B5CF6', qty: (o) => (isRunOrder(o) && o.routeId === '10km' ? o.peopleCount || 1 : 0), unit: 'คน' },
  { id: '5km', emoji: '🏃', name: 'วิ่ง 5 km', day: '9 ม.ค.', color: '#FF5460', qty: (o) => (isRunOrder(o) && o.routeId === '5km' ? o.peopleCount || 1 : 0), unit: 'คน' },
  { id: '3km', emoji: '🐕', name: 'Dog Run 4 km', day: '9 ม.ค.', color: '#FF8A00', qty: (o) => (isRunOrder(o) && o.routeId === '3km' ? o.peopleCount || 1 : 0), unit: 'คน' },
  { id: '1km', emoji: '🐕', name: 'Dog Run 1 km', day: '9 ม.ค.', color: '#EC4899', qty: (o) => (isRunOrder(o) && o.routeId === '1km' ? o.peopleCount || 1 : 0), unit: 'คน' },
  { id: 'concert', emoji: '🎶', name: 'คอนเสิร์ต GA', day: '9 ม.ค.', color: '#DB2777', qty: (o) => o.concertQty || 0, unit: 'ใบ' },
  { id: 'vip', emoji: '⭐', name: 'VIP TABLE', day: '9 ม.ค.', color: '#B45309', qty: (o) => o.vipTables || 0, unit: 'โต๊ะ' },
  { id: 'tower', emoji: '🪂', name: 'หอสูง', day: '10 ม.ค.', color: '#4F46E5', qty: (o) => (o.addOns?.tower ? o.addOns.people : 0), unit: 'คน' },
  { id: 'gun-standard', emoji: '🎯', name: 'ยิงปืนสั้น', day: '10 ม.ค.', color: '#0369A1', qty: (o) => (o.addOns?.gun === 'standard' ? o.addOns.people : 0), unit: 'คน' },
  { id: 'gun-premium', emoji: '🎯', name: 'ยิงปืนยาว', day: '10 ม.ค.', color: '#1E3A8A', qty: (o) => (o.addOns?.gun === 'premium' ? o.addOns.people : 0), unit: 'คน' },
  { id: 'wind', emoji: '🌪️', name: 'อุโมงค์ลม', day: '10 ม.ค.', color: '#0F766E', qty: (o) => (o.addOns?.windTunnel ? o.addOns.people : 0), unit: 'คน', limit: WIND_TUNNEL_LIMIT },
];

/** A pending order still counts until its payment window closes. */
const isLivePending = (o: ServerOrder) =>
  !o.isTest && !o.cancelledAt && o.paymentStatus !== 'PAID' && (!o.expiresAt || new Date(o.expiresAt).getTime() > Date.now());
/** Paid and not cancelled. */
const isPaid = (o: ServerOrder) => o.paymentStatus === 'PAID' && !o.cancelledAt && !o.isTest;

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-');

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Admin tab: how many people signed up for each station, and who they are.
 * Paid orders and still-open pending orders are counted separately; expired pending orders are left out.
 */
export const AdminStationRoster: React.FC<{
  orders: ServerOrder[];
  masked: boolean;
  onInspect: (o: ServerOrder) => void;
}> = ({ orders, masked, onInspect }) => {
  const [stationId, setStationId] = useState(STATIONS[6].id);
  const [showPending, setShowPending] = useState(true);
  const [query, setQuery] = useState('');

  const summary = useMemo(
    () =>
      STATIONS.map((s) => {
        let paid = 0;
        let pending = 0;
        let paidOrders = 0;
        for (const o of orders) {
          const n = s.qty(o);
          if (!n) continue;
          if (isPaid(o)) {
            paid += n;
            paidOrders++;
          } else if (isLivePending(o)) pending += n;
        }
        return { station: s, paid, pending, paidOrders };
      }),
    [orders]
  );

  const active = STATIONS.find((s) => s.id === stationId) || STATIONS[0];
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => active.qty(o) > 0 && (isPaid(o) || (showPending && isLivePending(o))))
      .filter((o) => !q || [o.fullName, o.orderId, o.bibNumber, o.phone, o.email, o.dogName].some((v) => String(v ?? '').toLowerCase().includes(q)))
      .sort((a, b) => (a.paymentStatus === b.paymentStatus ? a.createdAt.localeCompare(b.createdAt) : a.paymentStatus === 'PAID' ? -1 : 1));
  }, [orders, active, showPending, query]);

  const phone = (p?: string) => (masked ? maskPhoneNumber(p) : p || '-');
  const email = (e?: string) => (masked ? maskEmailAddress(e) : e || '-');
  const shooters = (o: ServerOrder) =>
    active.id.startsWith('gun') && o.shooting?.shooters?.length ? o.shooting.shooters.map((x) => x.fullName).join(', ') : '';

  const exportCsv = () => {
    const head = ['ลำดับ', 'สถานะ', 'คำสั่งซื้อ', 'BIB/เลขบัตร', 'ชื่อ', `จำนวน (${active.unit})`, 'โทร', 'อีเมล', 'ผู้ร่วมเพิ่มเติม', 'น้องสุนัข', 'ผู้ยิงปืน', 'ผู้ร่วมกิจกรรม (เอกสารสละสิทธิ์)', 'ยอดชำระ', 'สั่งเมื่อ', 'ชำระเมื่อ'];
    const lines = rows.map((o, i) =>
      [
        i + 1,
        o.paymentStatus === 'PAID' ? 'ชำระแล้ว' : 'รอชำระ',
        o.orderId,
        o.bibNumber || '',
        o.fullName,
        active.qty(o),
        phone(o.phone),
        email(o.email),
        o.extraRunnerNames || '',
        o.runningWithDog ? `${o.dogName || ''} ${o.dogBreed ? `(${o.dogBreed})` : ''}`.trim() : '',
        shooters(o),
        o.activityWaiver?.participants?.map((p) => p.fullName).join(', ') || '',
        o.totalPrice,
        fmtDate(o.createdAt),
        fmtDate(o.paidAt),
      ]
        .map(csvCell)
        .join(',')
    );
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `roster_${active.id}_${new Date().toISOString().slice(0, 10)}${masked ? '_masked' : ''}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <div className="space-y-5">
      {/* station cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summary.map(({ station: s, paid, pending, paidOrders }) => {
          const on = s.id === stationId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStationId(s.id)}
              aria-pressed={on}
              className={`text-left rounded-2xl border-2 p-3 bg-white cursor-pointer transition-all ${on ? 'shadow-[0_4px_0_#180B30] -translate-y-0.5' : 'border-slate-200 hover:border-slate-400'}`}
              style={on ? { borderColor: s.color } : undefined}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-slate-700 truncate">
                  {s.emoji} {s.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400 shrink-0">{s.day}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-black tabular-nums" style={{ color: s.color }}>
                  {paid}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {s.unit}
                  {s.limit ? ` / ${s.limit}` : ''}
                </span>
              </div>
              {s.limit ? (
                <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((paid + pending) / s.limit) * 100)}%`, background: s.color }} />
                </div>
              ) : null}
              <div className="mt-1 text-[10.5px] font-bold text-slate-500">
                {paidOrders} คำสั่งซื้อ{pending ? <span className="text-amber-600"> · รอชำระ +{pending}</span> : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* roster */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {active.emoji} รายชื่อผู้สมัคร · {active.name}
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {rows.length} รายการ · รวม {rows.reduce((n, o) => n + active.qty(o), 0)} {active.unit}
              {masked ? ' · ซ่อนเบอร์/อีเมลตาม PDPA (ปลดได้ที่ปุ่ม PDPA ด้านบน)' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาชื่อ / BIB / เบอร์"
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold w-48"
              />
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={showPending} onChange={(e) => setShowPending(e.target.checked)} />
              แสดงรายการรอชำระ
            </label>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!rows.length}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#180B30] text-[#FFC928] text-xs font-extrabold cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4" /> ส่งออก CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold text-slate-600">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">ผู้สมัคร</th>
                <th className="py-2.5 px-3 text-center">{active.unit}</th>
                <th className="py-2.5 px-3">ติดต่อ</th>
                <th className="py-2.5 px-3">รายละเอียด</th>
                <th className="py-2.5 px-3">สถานะ</th>
                <th className="py-2.5 px-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((o, i) => (
                <tr key={o.orderId} className="hover:bg-slate-50 align-top">
                  <td className="py-2.5 px-3 font-mono text-slate-400">{i + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-extrabold text-slate-900">{o.fullName}</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {o.orderId}
                      {o.bibNumber ? <span className="ml-1.5 text-purple-700 font-black">#{o.bibNumber}</span> : null}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-sm font-black tabular-nums">{active.qty(o)}</td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <div>{phone(o.phone)}</div>
                    <div className="text-[11px] text-slate-500">{email(o.email)}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 max-w-[260px]">
                    {o.extraRunnerNames ? <div>👥 {o.extraRunnerNames}</div> : null}
                    {o.runningWithDog ? (
                      <div>
                        🐶 {o.dogName || '-'}
                        {o.dogBreed ? ` (${o.dogBreed})` : ''}
                      </div>
                    ) : null}
                    {shooters(o) ? <div>🎯 {shooters(o)}</div> : null}
                    {(active.id === 'tower' || active.id === 'wind') && o.activityWaiver?.participants?.length ? (
                      <div>📜 {o.activityWaiver.participants.map((p) => p.fullName).join(', ')}</div>
                    ) : null}
                    {active.id === 'vip' && o.parkingPlates?.length ? <div>🚗 {o.parkingPlates.map((p) => `${p.plate} ${p.province}`).join(', ')}</div> : null}
                    {o.addOns && !['tower', 'gun-standard', 'gun-premium', 'wind'].includes(active.id) ? <div className="text-slate-500">{o.addOns.label}</div> : null}
                  </td>
                  <td className="py-2.5 px-3">
                    {o.paymentStatus === 'PAID' ? (
                      <span className="inline-block rounded-lg bg-emerald-100 text-emerald-800 px-2 py-0.5 font-extrabold">ชำระแล้ว</span>
                    ) : (
                      <span className="inline-block rounded-lg bg-amber-100 text-amber-800 px-2 py-0.5 font-extrabold">รอชำระ</span>
                    )}
                    <div className="mt-0.5 text-[10.5px] text-slate-500">฿{formatBaht(o.totalPrice)}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onInspect(o)}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-100 text-purple-800 font-extrabold cursor-pointer hover:bg-purple-200 whitespace-nowrap"
                    >
                      ดูข้อมูลครบ
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm font-bold text-slate-400">
                    ยังไม่มีผู้สมัครในฐานนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/** Every field of one order, grouped, for the admin inspector. Shows real values (admin only). */
export const OrderFullDetails: React.FC<{ order: ServerOrder }> = ({ order: o }) => {
  const groups: { title: string; items: [string, React.ReactNode][] }[] = [
    {
      title: '👤 ผู้สมัคร & การติดต่อ',
      items: [
        ['ชื่อ-นามสกุล', o.fullName],
        ['โทร', o.phone],
        ['อีเมล', o.email],
        ['เบอร์ฉุกเฉิน', o.emergencyPhone],
        [
          'ผู้ร่วมวิ่งเพิ่ม',
          o.extraPeople
            ? `${o.extraPeople} คน · ${o.extraRunners?.length ? o.extraRunners.map((r) => `${r.name} (${r.shirtSize})`).join(', ') : o.extraRunnerNames || 'ไม่ได้ระบุชื่อ'}`
            : '-',
        ],
      ],
    },
    {
      title: '🎟️ รายการที่ซื้อ',
      items: [
        ['ประเภท', o.ticketType === 'CONCERT' ? 'คอนเสิร์ต/VIP' : o.ticketType === 'ADDON' ? 'กิจกรรมเสริม' : 'ตั๋ววิ่ง'],
        ['รายการ', o.routeName],
        ['BIB / เลขบัตร', o.bibNumber ? `#${o.bibNumber}` : 'ยังไม่ออก'],
        ['ไซส์เสื้อ', o.shirtSize || '-'],
        ['จำนวนคน / สุนัข', `${o.peopleCount ?? '-'} คน · ${o.dogCount ?? 0} ตัว`],
        ['น้องสุนัข', o.runningWithDog ? `${o.dogName || '-'}${o.dogBreed ? ` (${o.dogBreed})` : ''}` : '-'],
        ['คอนเสิร์ต GA', o.concertQty ? `${o.concertQty} ใบ` : '-'],
        ['VIP TABLE', o.vipTables ? `${o.vipTables} โต๊ะ` : '-'],
        ['กิจกรรมเสริม', o.addOns ? `${o.addOns.label} × ${o.addOns.people} คน (฿${formatBaht(o.addOns.total)})` : '-'],
        ['ทะเบียนรถ VIP', o.parkingPlates?.length ? o.parkingPlates.map((p) => `${p.plate} ${p.province}`).join(' · ') : '-'],
        [
          'ผู้ยิงปืน',
          o.shooting?.shooters?.length ? (
            <span>
              {o.shooting.shooters.map((x) => (x.idCard ? `${x.fullName} (${formatThaiId(x.idCard)})` : x.fullName)).join(' · ')}
              <br />
              {o.shooting.consentAt && <span className="text-slate-500">ยอมรับกฎความปลอดภัย {fmtDate(o.shooting.consentAt)}</span>}
            </span>
          ) : (
            '-'
          ),
        ],
      ],
    },
    {
      title: '🛡️ ประกันอุบัติเหตุ',
      items: o.insurance
        ? [
            ['ผู้เอาประกัน', `${o.insurance.prefix}${o.insurance.firstName} ${o.insurance.lastName}`],
            o.insurance.foreigner
              ? ['พาสปอร์ต', `${o.insurance.passportNo || '-'} (${o.insurance.nationality || '-'}) · หมดอายุ ${o.insurance.passportExpiry || '-'}`]
              : ['เลขบัตรประชาชน', o.insurance.idCard || '-'],
            ['เพศ / อายุ', `${o.insurance.gender} · ${o.insurance.age} ปี (เกิด ${o.insurance.birthDate})`],
            ['กรุ๊ปเลือด', o.insurance.bloodType],
            ['โรคประจำตัว', o.insurance.medicalConditions],
            ['ติดต่อฉุกเฉิน', `${o.insurance.emergencyName} (${o.insurance.relationship}) ${o.insurance.emergencyPhone || o.emergencyPhone}`],
            ['ผู้รับผลประโยชน์', o.insurance.beneficiaryName ? `${o.insurance.beneficiaryName} (${o.insurance.beneficiaryRelationship || '-'})` : 'ตามผู้ติดต่อฉุกเฉิน'],
          ]
        : [['ข้อมูลประกัน', 'ไม่มี']],
    },
    {
      title: '💳 การชำระเงิน',
      items: [
        ['ยอดชำระ', `฿${formatBaht(o.totalPrice)}`],
        ['ช่องทาง', o.paymentMethod === 'SPONSOR_CODE' ? `รหัสสปอนเซอร์${o.sponsorName ? ` · ${o.sponsorName}` : ''}` : 'โอน/สแกนจ่าย + แนบสลิป'],
        ['สถานะ', o.paymentStatus === 'PAID' ? `ชำระแล้ว (${fmtDate(o.paidAt)})` : `รอชำระ · หมดเวลา ${fmtDate(o.expiresAt)}`],
        ['ผลตรวจสลิป', o.slipNote || '-'],
        ['เลขอ้างอิงสลิป', o.slipRef || o.paymentRef || '-'],
        ['ตรวจสลิปกี่ครั้ง', o.slipAttempts ?? 0],
        ['อนุมัติโดย', o.verifiedBy ? `${o.verifiedBy} (${fmtDate(o.verifiedAt)})` : '-'],
      ],
    },
    {
      title: '🗂️ ระบบ',
      items: [
        ['สั่งซื้อเมื่อ', fmtDate(o.createdAt)],
        ['สถานะรับอุปกรณ์', o.kitStatus === 'CHECKED_IN' ? 'รับแล้ว / เช็กอินแล้ว' : 'ยังไม่รับ'],
        ['ยกเลิก', o.cancelledAt ? `ยกเลิกโดย ${o.cancelledBy || '-'} (${fmtDate(o.cancelledAt)}) · ${o.cancelReason || '-'}` : '-'],
        ['สถานะลงทะเบียน', o.registrationStatus],
      ],
    },
  ];

  return (
    <div className="space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {groups.map((g) => (
        <div key={g.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-black text-slate-700 mb-1.5">{g.title}</div>
          <dl className="space-y-1 text-xs">
            {g.items.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[38%_1fr] gap-2">
                <dt className="font-bold text-slate-500">{k}</dt>
                <dd className="font-extrabold text-slate-900 break-words">{v ?? '-'}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
    {o.activityWaiver && <WaiverAdminPanel order={o} />}
    </div>
  );
};

/** Tower / wind-tunnel waivers of one order: participants, health answers, and the filled documents to print. */
const WaiverAdminPanel: React.FC<{ order: ServerOrder }> = ({ order: o }) => {
  const w = o.activityWaiver!;
  const docsRef = useRef<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState(false);
  return (
    <div className="rounded-2xl border border-teal-300 bg-teal-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-xs font-black text-slate-700">
          📜 เอกสารสละสิทธิ์ฟ้องร้อง · {w.activities.map((a) => `${WAIVER_LABEL[a]} (ยอมรับ ${fmtDate(w.acceptedAt[a])})`).join(' · ')}
          <span className="ml-1.5 font-semibold text-slate-500">ฉบับ {w.version}</span>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setPreview((v) => !v)} className="px-2.5 py-1.5 rounded-lg bg-white border border-teal-400 text-teal-800 text-xs font-extrabold cursor-pointer">
            {preview ? 'ซ่อนเอกสาร' : 'ดูเอกสารที่กรอกแล้ว'}
          </button>
          <button
            type="button"
            onClick={() => printWaivers(docsRef.current, `เอกสารสละสิทธิ์ ${o.orderId}`)}
            className="px-2.5 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-extrabold cursor-pointer"
          >
            🖨️ พิมพ์ / บันทึก PDF ({w.activities.length * w.participants.length} ฉบับ)
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="py-1 pr-2">#</th>
              <th className="py-1 pr-2">ชื่อ</th>
              <th className="py-1 pr-2">วันเกิด / อายุ</th>
              <th className="py-1 pr-2">โทร</th>
              <th className="py-1 pr-2">เลขบัตร</th>
              <th className="py-1 pr-2">ผู้ปกครอง</th>
              {w.activities.includes('wind') && <th className="py-1">สุขภาพ (อุโมงค์ลม)</th>}
            </tr>
          </thead>
          <tbody>
            {w.participants.map((p, i) => (
              <tr key={i} className="border-t border-teal-200 align-top">
                <td className="py-1 pr-2">{i + 1}</td>
                <td className="py-1 pr-2 font-extrabold">{p.fullName}</td>
                <td className="py-1 pr-2">
                  {thaiDate(p.birthDate)} · {ageOn(p.birthDate) ?? '-'} ปี
                </td>
                <td className="py-1 pr-2">{p.phone}</td>
                <td className="py-1 pr-2 font-mono">{formatThaiId(p.idCard)}</td>
                <td className="py-1 pr-2">{p.guardianName || '-'}</td>
                {w.activities.includes('wind') && (
                  <td className="py-1">{WIND_HEALTH_QUESTIONS.map((q) => (p.windHealth?.[q.id] === 'ok' ? q.ok : `⚠️ ${q.risk}`)).join(' · ')}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* the filled documents (always rendered so printing works; shown on request) */}
      <div ref={docsRef} className={preview ? 'mt-3 space-y-4 max-h-[60vh] overflow-y-auto rounded-xl bg-white p-3 border border-teal-200' : 'hidden'}>
        {w.activities.flatMap((a) =>
          w.participants.map((p, i) => (
            <div key={`${a}-${i}`} className="border-b border-dashed border-slate-300 pb-4">
              <WaiverDocument activity={a} participant={p} orderId={o.orderId} acceptedAt={w.acceptedAt[a]} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
