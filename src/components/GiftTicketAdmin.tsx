import React, { useState } from 'react';
import { Gift, Mail, Send } from 'lucide-react';
import { adminApi } from '../utils/api';
import { ticketCategories } from '../data/eventData';
import { SHIRT_SIZES } from '../data/shirts';

const FIELD = 'w-full px-3 py-2.5 rounded-xl border-2 border-[#2A1450]/20 text-sm font-semibold bg-white';
const LABEL = 'block text-xs font-extrabold text-[#2A1450] mb-1';

type Done = { orderId: string; bib: string; name: string; emailed: boolean; emailError?: string };

/**
 * Admin tab: create a free / gift ticket by filling in the holder's details.
 * It always makes a NEW order (paid at once, no money), gets a BIB like any paid order, and can be e-mailed.
 */
export const GiftTicketAdmin: React.FC = () => {
  const [kind, setKind] = useState<'RUN' | 'CONCERT'>('RUN');
  const [routeId, setRouteId] = useState<string>(ticketCategories[0]?.id || '10km');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [shirtSize, setShirtSize] = useState('M');
  const [dogName, setDogName] = useState('');
  const [concertQty, setConcertQty] = useState('1');
  const [reason, setReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done[]>([]);

  const dogRoute = kind === 'RUN' && /^(1|3)km$/.test(routeId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await adminApi.createGiftTicket({
        ticketType: kind,
        routeId: kind === 'RUN' ? routeId : undefined,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        emergencyPhone: emergencyPhone.trim(),
        shirtSize: kind === 'RUN' ? shirtSize : undefined,
        dogName: dogRoute ? dogName.trim() : undefined,
        concertQty: kind === 'CONCERT' ? Number(concertQty) || 1 : undefined,
        reason: reason.trim(),
        sendEmail,
      });
      setDone((d) => [{ orderId: r.order.orderId, bib: r.order.bibNumber, name: r.order.fullName, emailed: r.emailed, emailError: r.emailError }, ...d]);
      setFullName('');
      setPhone('');
      setEmail('');
      setEmergencyPhone('');
      setDogName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สร้างตั๋วไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5 text-[#6D28D9]" />
          <h3 className="text-base sm:text-lg font-black text-[#2A1450]">สร้างตั๋วมอบ / ฟรี (กรอกข้อมูลผู้ถือตั๋วเอง)</h3>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-[#6F6878] mb-4">
          สร้างคำสั่งซื้อใหม่ สถานะ “ชำระแล้ว” ไม่มีค่าใช้จ่าย ได้เลข BIB และตั๋ว e-ticket เหมือนปกติ และส่งอีเมลให้ผู้ถือตั๋วได้ (ไม่แก้ไขหรือลบคำสั่งซื้อเดิมใดๆ)
        </p>

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-12 flex flex-wrap gap-2">
            {([['RUN', '🏃 ตั๋ววิ่ง (รวมคอนเสิร์ต)'], ['CONCERT', '🎶 ตั๋วคอนเสิร์ตอย่างเดียว']] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={`px-4 py-2 rounded-full border-2 text-sm font-black cursor-pointer ${kind === id ? 'bg-[#2A1450] text-white border-[#2A1450]' : 'bg-white text-[#2A1450] border-[#2A1450]/25'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {kind === 'RUN' && (
            <label className="md:col-span-6 block">
              <span className={LABEL}>ประเภทบัตร / ระยะ *</span>
              <select value={routeId} onChange={(e) => setRouteId(e.target.value)} className={FIELD}>
                {ticketCategories.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {kind === 'CONCERT' && (
            <label className="md:col-span-3 block">
              <span className={LABEL}>จำนวนบัตรคอนเสิร์ต</span>
              <input type="number" min={1} max={9} value={concertQty} onChange={(e) => setConcertQty(e.target.value)} className={FIELD} />
            </label>
          )}
          {kind === 'RUN' && (
            <label className="md:col-span-3 block">
              <span className={LABEL}>ไซซ์เสื้อ *</span>
              <select value={shirtSize} onChange={(e) => setShirtSize(e.target.value)} className={FIELD}>
                {SHIRT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}
          {dogRoute && (
            <label className="md:col-span-3 block">
              <span className={LABEL}>ชื่อน้องหมา</span>
              <input value={dogName} onChange={(e) => setDogName(e.target.value)} maxLength={80} className={FIELD} />
            </label>
          )}

          <label className="md:col-span-6 block">
            <span className={LABEL}>ชื่อ-นามสกุล ผู้ถือตั๋ว *</span>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} className={FIELD} />
          </label>
          <label className="md:col-span-3 block">
            <span className={LABEL}>เบอร์โทร</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} inputMode="tel" className={FIELD} />
          </label>
          <label className="md:col-span-3 block">
            <span className={LABEL}>เบอร์ฉุกเฉิน (ว่าง = ใช้เบอร์โทร)</span>
            <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} maxLength={30} inputMode="tel" className={FIELD} />
          </label>
          <label className="md:col-span-6 block">
            <span className={LABEL}>{sendEmail ? 'อีเมล *' : 'อีเมล'}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} className={FIELD} />
          </label>
          <label className="md:col-span-6 block">
            <span className={LABEL}>เหตุผล / ที่มาของตั๋ว * (เห็นเฉพาะแอดมิน)</span>
            <input required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="เช่น แขกผู้จัดงาน, ผู้สนับสนุน, ชดเชย" className={FIELD} />
          </label>

          <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-bold text-[#4B2D78] cursor-pointer">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
              <Mail className="w-4 h-4" /> ส่งอีเมลตั๋วให้ผู้ถือทันที
            </label>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-[#FFC928] hover:brightness-105 disabled:opacity-60 text-[#1E0F38] font-black text-sm border-2 border-[#2A1450] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {busy ? 'กำลังสร้าง…' : 'สร้างตั๋ว'}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
      </div>

      {done.length > 0 && (
        <div className="rounded-2xl bg-white border-2 border-emerald-200 p-4 sm:p-5">
          <p className="text-sm font-black text-emerald-700 mb-2">สร้างแล้วในรอบนี้</p>
          <ul className="space-y-1.5">
            {done.map((d) => (
              <li key={d.orderId} className="text-sm font-semibold text-[#2A1450]">
                ✅ <b>{d.orderId}</b> · {d.name}
                {d.bib ? ` · BIB ${d.bib}` : ''}
                {d.emailed ? ' · ส่งอีเมลแล้ว' : d.emailError ? ` · ส่งอีเมลไม่สำเร็จ (${d.emailError})` : ' · ไม่ได้ส่งอีเมล'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
