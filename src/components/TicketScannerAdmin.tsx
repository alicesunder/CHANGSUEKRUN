import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, Check, Search, X } from 'lucide-react';
import { adminApi, type ServerOrder } from '../utils/api';

type ScanOrder = ServerOrder & {
  routeName?: string;
  shirtSize?: string;
  dogName?: string;
  concertQty?: number;
  addOns?: { label: string; people: number; total: number; tower?: boolean; gun?: 'none' | 'standard' | 'premium'; windTunnel?: boolean };
  vipTables?: number;
  parkingPlates?: { plate: string; province: string }[];
  shooting?: { shooters: { fullName: string; idCard?: string }[] };
};

/** Pulls an order id / BIB out of whatever a QR code holds (our JSON payload or a plain code). */
function codeFromQr(text: string): string {
  const t = text.trim();
  try {
    const j = JSON.parse(t);
    if (j && typeof j === 'object') return String(j.orderId || j.bib || '').trim();
  } catch {
    /* not JSON: use the raw text */
  }
  return t;
}

/** The plate printed on a VIP parking pass QR, if this QR is one. */
function parkingPlateFromQr(text: string): string {
  try {
    const j = JSON.parse(text.trim());
    return j && j.type === 'VIP_PARKING' ? String(j.plate || '') : '';
  } catch {
    return '';
  }
}

function beep(ok: boolean) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = ok ? 880 : 220;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + (ok ? 0.12 : 0.35));
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    /* sound is optional */
  }
}

/** Run ticket name without the VIP table tail (that has its own card). */
const runName = (o: ScanOrder) => (o.routeName || '').replace(/\s*\+\s*VIP TABLE.*$/, '');

/** One row per bought activity (older orders without the flags fall back to the one-line label). */
function activityRows(o: ScanOrder) {
  const a = o.addOns;
  if (!a) return [];
  const rows: { key: string; icon: string; title: string; bg: string }[] = [];
  if (a.tower) rows.push({ key: 'tower', icon: '🗼', title: 'หอสูง', bg: 'bg-violet-100' });
  if (a.gun && a.gun !== 'none') rows.push({ key: 'gun', icon: '🔫', title: a.gun === 'premium' ? 'ยิงปืน Premium' : 'ยิงปืน', bg: 'bg-amber-100' });
  if (a.windTunnel) rows.push({ key: 'wind', icon: '🌪️', title: 'อุโมงค์ลม', bg: 'bg-sky-100' });
  if (!rows.length) rows.push({ key: 'other', icon: '⭐', title: a.label, bg: 'bg-violet-100' });
  return rows;
}

const TONES = {
  gold: 'border-[#FFC928] bg-[#FFFBEA]',
  violet: 'border-[#C4B5FD] bg-[#F5F0FF]',
  vip: 'border-[#7C3AED] bg-[#F5F0FF]',
} as const;

/** A purchased entitlement: coloured card, icon tile, title, chips and a tick. */
const Entitlement: React.FC<{ tone: keyof typeof TONES; icon: string; title: string; chips: string[]; children?: React.ReactNode }> = ({ tone, icon, title, chips, children }) => (
  <div className={`rounded-2xl border-2 p-3 ${TONES[tone]}`}>
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-3xl ${tone === 'gold' ? 'bg-[#FFE9A6]' : tone === 'vip' ? 'bg-[#2A1450]' : 'bg-violet-100'}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-black text-[#2A1450] text-base leading-tight break-words">{title}</p>
        {chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className="rounded-full border border-[#2A1450]/20 bg-white/80 px-2.5 py-1 text-xs font-extrabold text-[#2A1450]">{c}</span>
            ))}
          </div>
        )}
      </div>
      <span aria-label="ลงทะเบียนแล้ว" className="shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>
    </div>
    {children}
  </div>
);

type ScannerApi = {
  lookup: (q: string) => Promise<{ order: ServerOrder }>;
  toggleKit: (orderId: string, action?: 'checkin' | 'undo') => Promise<{ order: ServerOrder; alreadyCheckedIn?: boolean }>;
};

/**
 * Scan a ticket QR (or type a BIB / order id) and see who it belongs to.
 * Used in the admin console (adminApi) and by ticket-checking staff (staffApi: reduced view).
 */
/** canUndo: admins may take a kit hand-over back; ticket-checking staff can only check tickets in. */
export const TicketScannerAdmin: React.FC<{ api?: ScannerApi; canUndo?: boolean }> = ({ api = adminApi, canUndo = api === adminApi }) => {
  const [already, setAlready] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const busyRef = useRef(false);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<ScanOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  /** set when the last scan was a VIP parking pass */
  const [scannedPlate, setScannedPlate] = useState('');

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const lookup = useCallback(async (raw: string) => {
    const code = codeFromQr(raw);
    if (!code) return;
    setScannedPlate(parkingPlateFromQr(raw));
    setLoading(true);
    setError(null);
    try {
      const res = await api.lookup(code);
      setOrder(res.order as ScanOrder);
      setAlready(false);
      beep(true);
    } catch (e) {
      setOrder(null);
      setError(e instanceof Error ? e.message : 'ค้นหาไม่สำเร็จ');
      beep(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const startCamera = async () => {
    setCamError(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setCamOn(true);
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const tick = () => {
        if (!streamRef.current) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx && !busyRef.current) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (hit?.data) {
            busyRef.current = true;
            stopCamera();
            lookup(hit.data).finally(() => {
              busyRef.current = false;
            });
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      stopCamera();
      setCamError(
        e instanceof Error && e.name === 'NotAllowedError'
          ? 'ไม่ได้รับอนุญาตใช้กล้อง กรุณากดอนุญาตในเบราว์เซอร์แล้วลองใหม่'
          : 'เปิดกล้องไม่ได้ (ใช้ช่องพิมพ์เลข BIB / เลขออเดอร์ด้านล่างแทนได้)'
      );
    }
  };

  const toggleKit = async (action: 'checkin' | 'undo' = 'checkin') => {
    if (!order) return;
    if (action === 'undo' && !window.confirm('ยกเลิกการรับชุดของคำสั่งซื้อนี้? (ใช้เมื่อกดเช็กอินผิดคนเท่านั้น — ระบบจะบันทึกว่าใครยกเลิก)')) return;
    setToggling(true);
    try {
      const res = await api.toggleKit(order.orderId, action);
      setOrder(res.order as ScanOrder);
      setAlready(Boolean(res.alreadyCheckedIn));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setToggling(false);
    }
  };

  const cancelled = Boolean(order?.cancelledAt);
  // a cancelled ticket is treated as not valid at the gate
  const paid = order?.paymentStatus === 'PAID' && !cancelled;
  const isConcertPass = order?.ticketType === 'CONCERT';
  const checkedIn = order?.kitStatus === 'CHECKED_IN';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-4 sm:p-5 space-y-3">
        <h3 className="text-base sm:text-lg font-black text-[#2A1450]">สแกนตั๋ว / ค้นหาเลข BIB</h3>
        <p className="text-xs sm:text-sm font-semibold text-[#6F6878]">
          เปิดกล้องสแกน QR บนตั๋ว หรือพิมพ์เลข BIB (เช่น 05-0012) / เลขออเดอร์ เพื่อดูว่าเป็นใคร ชำระแล้วหรือยัง
        </p>

        <div className="rounded-2xl overflow-hidden bg-black relative" hidden={!camOn}>
          <video ref={videoRef} playsInline muted className="block w-full max-h-[60vh] object-cover" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-8 rounded-3xl border-4 border-[#FFC928]/90" />
        </div>

        <div className="flex flex-wrap gap-2">
          {camOn ? (
            <button type="button" onClick={stopCamera} className="min-h-[48px] px-4 rounded-xl border-2 border-rose-400 bg-rose-50 text-rose-700 text-sm font-extrabold flex items-center gap-2 cursor-pointer">
              <CameraOff className="w-4 h-4" /> ปิดกล้อง
            </button>
          ) : (
            <button type="button" onClick={startCamera} className="min-h-[48px] px-5 rounded-xl border-2 border-[#2A1450] bg-[#FFC928] text-[#2A1450] text-sm font-black flex items-center gap-2 cursor-pointer shadow-[0_3px_0_#2A1450]">
              <Camera className="w-4 h-4" /> เปิดกล้องสแกน
            </button>
          )}
        </div>
        {camError && <p role="alert" className="text-sm font-bold text-rose-700 bg-rose-50 border-2 border-rose-300 rounded-xl px-3 py-2">{camError}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup(query);
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="เลข BIB หรือเลขออเดอร์"
            inputMode="text"
            autoCapitalize="characters"
            className="flex-1 min-w-0 min-h-[48px] px-3 rounded-xl border-2 border-[#2A1450]/20 text-sm font-mono font-semibold"
          />
          <button type="submit" disabled={loading} className="min-h-[48px] px-4 rounded-xl bg-[#2A1450] text-white text-sm font-extrabold flex items-center gap-2 cursor-pointer disabled:opacity-60">
            <Search className="w-4 h-4" /> ค้นหา
          </button>
        </form>
      </div>

      {error && (
        <p role="alert" className="text-sm font-extrabold text-rose-700 bg-rose-50 border-2 border-rose-300 rounded-2xl px-4 py-3 flex items-center gap-2">
          <X className="w-5 h-5 shrink-0" /> {error}
        </p>
      )}

      {order && (
        <div className={`rounded-3xl border-[3px] p-4 sm:p-5 space-y-3 ${paid ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black ${paid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {paid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {cancelled ? `ตั๋วถูกยกเลิก: ${order?.cancelReason || '-'}` : paid ? 'ชำระเงินแล้ว' : 'ยังไม่ชำระเงิน'}
            </span>
            <span className="font-mono text-xs font-bold text-[#6F6878]">{order.orderId}</span>
          </div>
          {/* header: BIB + who */}
          <div className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3">
            <div className="pr-3 border-r-2 border-dashed border-[#2A1450]/20">
              <span className="block text-[11px] font-extrabold text-[#6F6878]">{isConcertPass ? 'เลขบัตรคอนเสิร์ต' : 'เลข BIB'}</span>
              <span className="block font-mono text-2xl font-black text-[#54239A] break-all max-w-[9rem] leading-tight">{order.bibNumber || '—'}</span>
            </div>
            <div className="min-w-0 self-center">
              <p className="text-base font-black text-[#2A1450] break-words leading-snug">{order.fullName}</p>
              {order.phone && <p className="text-sm font-bold text-[#4B2D78]">📞 {order.phone}</p>}
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-sm font-black text-[#2A1450]">🎫 สิทธิ์ที่ซื้อ (ติ๊กถูก = ลงทะเบียนแล้ว)</p>
          <div className="space-y-2 text-sm">
            {!isConcertPass && (
              <Entitlement tone="gold" icon="🏃" title={runName(order)} chips={[order.dogName ? `🐾 น้องหมา: ${order.dogName}` : '', order.shirtSize ? `👕 ไซส์เสื้อ: ${order.shirtSize}` : '', order.peopleCount && order.peopleCount > 1 ? `👥 ${order.peopleCount} คน` : ''].filter(Boolean)}>
                {order.extraRunnerNames && <p className="mt-1 text-xs font-bold text-[#6F6878] break-words">นักวิ่งเพิ่ม: {order.extraRunnerNames}</p>}
              </Entitlement>
            )}
            {order.concertQty ? <Entitlement tone="violet" icon="🎤" title="ตั๋วคอนเสิร์ต (GA)" chips={[`🎟️ จำนวน: ${order.concertQty} ใบ`]} /> : null}
            {order.vipTables ? (
              <Entitlement tone="vip" icon="👑" title="VIP TABLE" chips={[`🪑 จำนวน: ${order.vipTables} โต๊ะ`, `👥 รวม ${order.vipTables * 6} ท่าน`]}>
                {scannedPlate && (
                  <div className="mt-2 rounded-xl bg-[#FFC928] border-2 border-[#2A1450] p-2.5">
                    <span className="block text-[11px] font-extrabold text-[#2A1450]">🚗 สแกนบัตรจอดรถ VIP</span>
                    <span className="block text-lg font-black text-[#2A1450]">{scannedPlate}</span>
                    <span className="block text-xs font-bold text-[#2A1450]">
                      {order.parkingPlates?.some((p) => `${p.plate} ${p.province}`.trim() === scannedPlate)
                        ? '✓ ทะเบียนนี้ลงทะเบียนไว้กับคำสั่งซื้อนี้'
                        : '✕ ไม่พบทะเบียนนี้ในคำสั่งซื้อ — ตรวจสอบกับเจ้าของรถ'}
                    </span>
                  </div>
                )}
                <div className="mt-2 rounded-xl bg-[#FFF3CC] p-2.5">
                  <span className="block text-xs font-black text-[#2A1450]">
                    🚗 ทะเบียนรถ VIP ({order.parkingPlates?.length || 0}/{order.vipTables * 2} คัน)
                  </span>
                  {order.parkingPlates && order.parkingPlates.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {order.parkingPlates.map((p, i) => (
                        <span key={i} className="rounded-full border-2 border-[#2A1450]/40 bg-white px-3 py-1 text-sm font-black text-[#2A1450]">
                          {p.plate} {p.province}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="block text-xs font-bold text-[#6F6878]">ยังไม่ได้ลงทะเบียนรถ</span>
                  )}
                </div>
              </Entitlement>
            ) : null}
          </div>

          {order.addOns && (
            <>
              <p className="flex items-center gap-1.5 text-sm font-black text-[#2A1450]">⭐ กิจกรรมเสริม ({order.addOns.people} คน)</p>
              <div className="space-y-2 text-sm">
                {activityRows(order).map((r) => (
                  <div key={r.key} className="flex items-center gap-3 rounded-2xl bg-white border-2 border-[#2A1450]/15 p-2.5">
                    <span aria-hidden="true" className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-2xl ${r.bg}`}>{r.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[#2A1450] leading-tight">{r.title} × {order.addOns!.people}</p>
                      {r.key === 'gun' && order.shooting && order.shooting.shooters.length > 0 && (
                        <p className="text-xs font-bold text-[#4B2D78] break-words">🎯 ผู้ยิง: {order.shooting.shooters.map((s) => s.fullName).join(', ')}</p>
                      )}
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-black text-white">
                      <Check className="w-3.5 h-3.5" /> สมัครแล้ว
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {paid && checkedIn && (
            <div className={`rounded-2xl border-2 p-3 text-center ${already ? 'border-rose-500 bg-rose-50' : 'border-emerald-500 bg-emerald-50'}`}>
              <p className={`text-base font-black ${already ? 'text-rose-800' : 'text-emerald-800'}`}>
                {already ? '⚠️ ตั๋วนี้รับชุดไปแล้ว' : '✓ เช็กอินเรียบร้อย'}
              </p>
              {(order as ServerOrder).kitCheckedInAt && (
                <p className="text-xs font-bold text-[#2A1450]">
                  เมื่อ {new Date((order as ServerOrder).kitCheckedInAt!).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                  {(order as ServerOrder).kitCheckedInBy ? ` · โดย ${(order as ServerOrder).kitCheckedInBy}` : ''}
                </p>
              )}
              {canUndo && (
                <button
                  type="button"
                  onClick={() => toggleKit('undo')}
                  disabled={toggling}
                  className="mt-2 text-xs font-extrabold text-rose-700 underline underline-offset-2 cursor-pointer disabled:opacity-60"
                >
                  ยกเลิกการรับชุด (เฉพาะแอดมิน)
                </button>
              )}
            </div>
          )}
          {paid && !checkedIn && (
            <button
              type="button"
              onClick={() => toggleKit('checkin')}
              disabled={toggling}
              className="w-full min-h-[52px] rounded-2xl border-2 border-[#2A1450] bg-[#FFC928] text-base font-black text-[#2A1450] shadow-[0_4px_0_#2A1450] cursor-pointer disabled:opacity-60"
            >
              ยืนยันเช็กอิน / รับชุด
            </button>
          )}
        </div>
      )}
    </div>
  );
};
