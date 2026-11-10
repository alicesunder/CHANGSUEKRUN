import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Car, Download } from 'lucide-react';

import { VIP_PARKING_PER_TABLE, parkingQrPayload, type ParkingPlate } from '../data/vipParking';
import { authApi } from '../utils/runnerAuth';
import { ProvinceSelect } from './ProvinceSelect';


/** Draws a pass as a PNG (same layout as the card) so it can be saved to the phone's photos. */
async function downloadPass(orderId: string, p: ParkingPlate, qr: string, n: number) {
  const W = 1200;
  const H = 820;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  // purple + gold corner sweeps
  ctx.fillStyle = '#5B20A8';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(420, 0);
  ctx.quadraticCurveTo(160, 60, 0, 170);
  ctx.fill();
  ctx.fillStyle = '#FFC928';
  ctx.beginPath();
  ctx.moveTo(W, H);
  ctx.lineTo(W - 460, H);
  ctx.quadraticCurveTo(W - 160, H - 70, W, H - 190);
  ctx.fill();

  const logo = new Image();
  logo.src = '/images/brand/changsuek-run-logo-v3.webp';
  await new Promise<void>((r) => {
    logo.onload = () => r();
    logo.onerror = () => r();
  });
  if (logo.naturalWidth) {
    const lw = 360;
    const lh = (logo.naturalHeight / logo.naturalWidth) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 30, lw, lh);
  }
  // VIP banner
  ctx.fillStyle = '#FFC928';
  ctx.fillRect(80, 230, W - 160, 130);
  ctx.fillStyle = '#3B1270';
  ctx.font = '900 120px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('VIP', 230, 340);
  ctx.font = '900 54px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PARKING PASS', 520, 318);
  ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`CHANGSUEK RUN · ${orderId} · คันที่ ${n}`, 520, 352);
  // plate box
  ctx.strokeStyle = '#5B20A8';
  ctx.lineWidth = 6;
  ctx.strokeRect(80, 420, 680, 320);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  ctx.font = '900 120px "Prompt", sans-serif';
  ctx.fillText(p.plate, 420, 580);
  ctx.font = '700 52px "Prompt", sans-serif';
  ctx.fillText(p.province, 420, 670);
  // QR
  const q = new Image();
  q.src = qr;
  await new Promise<void>((r) => {
    q.onload = () => r();
    q.onerror = () => r();
  });
  ctx.strokeRect(800, 420, 320, 320);
  if (q.naturalWidth) ctx.drawImage(q, 815, 435, 290, 290);
  ctx.textAlign = 'start';

  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = `VIP_PARKING_${orderId}_${n}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const PassCard: React.FC<{ orderId: string; plate: ParkingPlate; n: number; onSave?: (p: ParkingPlate) => Promise<void> }> = ({ orderId, plate, n, onSave }) => {
  const [qr, setQr] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ParkingPlate>(plate);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const save = async () => {
    if (!onSave) return;
    setErr('');
    setBusy(true);
    try {
      await onSave({ plate: draft.plate.trim(), province: draft.province.trim() });
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    QRCode.toDataURL(parkingQrPayload(orderId, plate), { width: 360, margin: 1, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => setQr(''));
  }, [orderId, plate.plate, plate.province]);

  return (
    <div className="relative overflow-hidden ds-card">
      <span aria-hidden="true" className="absolute -top-10 -left-12 w-32 h-20 rounded-full bg-[#5B20A8] -rotate-12" />
      <span aria-hidden="true" className="absolute -bottom-10 -right-10 w-44 h-24 rounded-full bg-[#FFC928] -rotate-12" />
      <div className="relative p-4 sm:p-5">
        <img src="/images/brand/changsuek-run-logo-v3.webp" alt="CHANGSUEK RUN" className="h-12 sm:h-14 w-auto mx-auto object-contain" />
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#FFC928] border-2 border-[#2A1450] px-3 py-1.5">
          <Car className="w-6 h-6 text-[#3B1270] shrink-0" aria-hidden="true" />
          <span className="font-display text-3xl sm:text-4xl font-black text-[#3B1270] leading-none">VIP</span>
          <span className="font-display text-sm sm:text-base font-black text-[#3B1270] leading-tight">
            PARKING PASS
            <span className="block text-[11px] sm:text-[11px] font-bold">ONLINE PARKING ACCESS · คันที่ {n}</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 items-stretch">
          <div className="rounded-xl border-[3px] border-[#5B20A8] flex flex-col items-center justify-center px-2 py-3 text-center">
            <span className="font-prompt text-3xl sm:text-4xl font-black text-[#111] leading-tight break-all">{plate.plate}</span>
            <span className="font-prompt text-sm sm:text-base font-bold text-[#111]">{plate.province}</span>
          </div>
          <div className="rounded-xl border-[3px] border-[#5B20A8] p-1.5 bg-white">
            {qr ? (
              <img src={qr} alt={`QR บัตรจอดรถ ${plate.plate}`} className="w-28 h-28 sm:w-32 sm:h-32" />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32" />
            )}
          </div>
        </div>
        {editing && (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-[#C9B4EE] bg-[#FAF6FF] p-3 space-y-2">
            <p className="text-xs font-black text-[#2A1450]">แก้ทะเบียนรถคันที่ {n} (แก้ได้ถึงก่อนวันงาน · QR ใหม่จะใช้แทนใบเดิม)</p>
            <input
              type="text"
              value={draft.plate}
              maxLength={16}
              onChange={(e) => setDraft({ ...draft, plate: e.target.value })}
              aria-label={`ทะเบียนรถคันที่ ${n}`}
              className="w-full min-h-[48px] px-3 rounded-xl border-2 border-[#2A1450]/20 bg-white text-sm font-semibold text-[#2A1450]"
            />
            <ProvinceSelect value={draft.province} onChange={(v) => setDraft({ ...draft, province: v })} />
            {err && <p role="alert" className="rounded-xl bg-rose-50 border-2 border-rose-300 px-3 py-2 text-xs font-extrabold text-rose-700">{err}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={save} className="min-h-[44px] rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFC928] border-2 border-[#2A1450] px-5 text-sm font-black text-[#2A1450] disabled:opacity-50 cursor-pointer">
                {busy ? 'กำลังบันทึก…' : 'บันทึก'}
              </button>
              <button type="button" disabled={busy} onClick={() => { setEditing(false); setDraft(plate); setErr(''); }} className="min-h-[44px] rounded-full border-2 border-[#2A1450]/30 bg-white px-5 text-sm font-extrabold text-[#2A1450] cursor-pointer">
                ยกเลิก
              </button>
            </div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-[#6B5A85]">
            คำสั่งซื้อ <span className="font-mono text-[#2A1450]">{orderId}</span> · แสดง QR ให้เจ้าหน้าที่สแกนที่ทางเข้าลานจอด VIP
          </span>
          {onSave && !editing && (
            <button
              type="button"
              onClick={() => { setDraft(plate); setEditing(true); }}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#2A1450] bg-white text-[#2A1450] px-3.5 py-2 text-xs font-extrabold cursor-pointer"
            >
              ✏️ แก้ทะเบียน
            </button>
          )}
          <button
            type="button"
            disabled={!qr}
            onClick={() => downloadPass(orderId, plate, qr, n)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#2A1450] text-[#FFC928] px-3.5 py-2 text-xs font-extrabold cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> บันทึกรูปบัตรจอดรถ
          </button>
        </div>
      </div>
    </div>
  );
};

/** Form to register the cars that are still left (a VIP table has 2 car passes; the buyer may have filled in fewer). */
const AddCars: React.FC<{ orderId: string; room: number; onAdded: (plates: ParkingPlate[]) => void }> = ({ orderId, room, onAdded }) => {
  const [rows, setRows] = React.useState<ParkingPlate[]>(() => Array.from({ length: room }, () => ({ plate: '', province: '' })));
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (i: number, patch: Partial<ParkingPlate>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const filled = rows.filter((r) => r.plate.trim() || r.province.trim());
  const submit = async () => {
    setErr('');
    setBusy(true);
    try {
      onAdded(await authApi.addParkingPlates(orderId, filled.map((r) => ({ plate: r.plate.trim(), province: r.province.trim() }))));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-3xl border-2 border-dashed border-[#C9B4EE] bg-[#FAF6FF] p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="w-10 h-10 rounded-2xl bg-[#FFC928] border-2 border-[#2A1450] flex items-center justify-center shrink-0"><Car className="w-5 h-5 text-[#2A1450]" /></span>
        <div>
          <p className="text-sm sm:text-base font-black text-[#2A1450] leading-tight">ยังลงทะเบียนรถได้อีก {room} คัน</p>
          <p className="text-xs font-bold text-[#6B5A85]">กรอกทะเบียนแล้วได้บัตรจอดรถ + QR ทันที ไม่ต้องติดต่อผู้จัดงาน</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3 space-y-2">
            <input
              type="text"
              value={r.plate}
              maxLength={16}
              onChange={(e) => set(i, { plate: e.target.value })}
              placeholder="ทะเบียน เช่น กก 1111"
              aria-label={`ทะเบียนรถคันที่ ${i + 1}`}
              className="w-full min-h-[48px] px-3 rounded-xl border-2 border-[#2A1450]/20 bg-white text-sm font-semibold text-[#2A1450]"
            />
            <ProvinceSelect value={r.province} onChange={(v) => set(i, { province: v })} />
          </div>
        ))}
      </div>
      {err && <p role="alert" className="rounded-xl bg-rose-50 border-2 border-rose-300 px-3 py-2 text-xs font-extrabold text-rose-700">{err}</p>}
      <button
        type="button"
        disabled={busy || filled.length === 0}
        onClick={submit}
        className="w-full sm:w-auto min-h-[48px] rounded-full bg-gradient-to-b from-[#FFE268] to-[#FFC928] border-2 border-[#2A1450] px-6 text-sm font-black text-[#2A1450] shadow-[0_4px_0_#2A1450] disabled:opacity-50 cursor-pointer"
      >
        {busy ? 'กำลังบันทึก…' : `บันทึกทะเบียน (${filled.length} คัน)`}
      </button>
    </div>
  );
};

/** VIP table orders come with parking passes, one per registered car. Renders nothing otherwise. */
export const ParkingPasses: React.FC<{ orderId: string; vipTables?: number; plates?: ParkingPlate[]; paid: boolean; canAdd?: boolean }> = ({
  orderId,
  vipTables,
  plates,
  paid,
  canAdd,
}) => {
  const [list, setList] = React.useState<ParkingPlate[]>(plates || []);
  React.useEffect(() => setList(plates || []), [plates]);
  if (!vipTables || !paid) return null;
  if (!list.length && !canAdd) return null;
  const room = Math.max(0, vipTables * VIP_PARKING_PER_TABLE - list.length);
  return (
    <section aria-label="บัตรจอดรถ VIP" className="space-y-3">
      <h3 className="flex items-center gap-2 text-base sm:text-lg font-black text-[#2A1450]">
        <Car className="w-5 h-5 text-[#7C3AED]" /> บัตรจอดรถ VIP ({list.length}/{vipTables * VIP_PARKING_PER_TABLE} คัน)
      </h3>
      {list.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {list.map((p, i) => (
            <PassCard
              key={`${p.plate}-${i}`}
              orderId={orderId}
              plate={p}
              n={i + 1}
              onSave={
                canAdd
                  ? async (np) => {
                      setList(await authApi.setParkingPlates(orderId, list.map((x, k) => (k === i ? np : x))));
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}
      {canAdd && room > 0 && <AddCars key={list.length} orderId={orderId} room={room} onAdded={setList} />}
    </section>
  );
};
