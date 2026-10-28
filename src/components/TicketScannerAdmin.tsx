import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, Check, Search, X } from 'lucide-react';
import { adminApi, type ServerOrder } from '../utils/api';

type ScanOrder = ServerOrder & {
  routeName?: string;
  shirtSize?: string;
  dogName?: string;
  concertQty?: number;
  addOns?: { label: string; people: number; total: number };
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

/** Admin tab: scan a ticket QR (or type a BIB / order id) and see who it belongs to. */
export const TicketScannerAdmin: React.FC = () => {
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
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.lookup(code);
      setOrder(res.order as ScanOrder);
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

  const toggleKit = async () => {
    if (!order) return;
    setToggling(true);
    try {
      const res = await adminApi.toggleKit(order.orderId);
      setOrder(res.order as ScanOrder);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setToggling(false);
    }
  };

  const paid = order?.paymentStatus === 'PAID';
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
              {paid ? 'ชำระเงินแล้ว' : 'ยังไม่ชำระเงิน'}
            </span>
            <span className="font-mono text-xs font-bold text-[#6F6878]">{order.orderId}</span>
          </div>
          <div>
            <p className="text-2xl font-black text-[#2A1450] break-words">{order.fullName}</p>
            <p className="text-sm font-bold text-[#4B2D78]">{order.phone}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3">
              <span className="block text-[11px] font-extrabold text-[#6F6878]">{isConcertPass ? 'เลขบัตรคอนเสิร์ต' : 'เลข BIB'}</span>
              <span className="block font-mono text-2xl font-black text-[#54239A]">{order.bibNumber || '—'}</span>
            </div>
            <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3">
              <span className="block text-[11px] font-extrabold text-[#6F6878]">ประเภทตั๋ว</span>
              <span className="block font-extrabold text-[#2A1450] break-words">
                {isConcertPass ? `ตั๋วคอนเสิร์ต × ${order.concertQty || 1}` : order.routeName}
                {!isConcertPass && order.concertQty ? ` + ตั๋วคอนเสิร์ต × ${order.concertQty}` : ''}
              </span>
            </div>
            {!isConcertPass && order.shirtSize && (
              <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3">
                <span className="block text-[11px] font-extrabold text-[#6F6878]">ไซส์เสื้อ</span>
                <span className="block font-extrabold text-[#2A1450]">{order.shirtSize}</span>
              </div>
            )}
            {order.dogName && (
              <div className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3">
                <span className="block text-[11px] font-extrabold text-[#6F6878]">น้องสุนัข</span>
                <span className="block font-extrabold text-[#2A1450] break-words">{order.dogName}</span>
              </div>
            )}
            {order.addOns && (
              <div className="col-span-2 rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3">
                <span className="block text-[11px] font-extrabold text-[#6F6878]">กิจกรรมเสริม</span>
                <span className="block font-extrabold text-[#2A1450] break-words">{order.addOns.label} × {order.addOns.people} คน</span>
              </div>
            )}
          </div>
          {paid && (
            <button
              type="button"
              onClick={toggleKit}
              disabled={toggling}
              className={`w-full min-h-[52px] rounded-2xl border-2 border-[#2A1450] text-base font-black cursor-pointer disabled:opacity-60 ${checkedIn ? 'bg-white text-[#2A1450]' : 'bg-[#FFC928] text-[#2A1450] shadow-[0_4px_0_#2A1450]'}`}
            >
              {checkedIn ? '✓ เช็กอินแล้ว (แตะเพื่อยกเลิก)' : 'ยืนยันเช็กอิน / รับชุด'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
