import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Clock, Copy, Download, ScanLine, ShieldCheck, Upload } from 'lucide-react';
import { formatThaiBankAccount } from '../utils/promptPay';
import type { ServerOrder } from '../utils/api';

/** Seconds left until `expiresAt`, ticking once a second. */
function useSecondsLeft(expiresAt: string | undefined): number {
  const target = expiresAt ? new Date(expiresAt).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return target ? Math.max(0, Math.ceil((target - now) / 1000)) : 0;
}

const baht = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setDone(true);
        window.setTimeout(() => setDone(false), 2000);
      }}
      aria-label={`คัดลอก${label}`}
      className={`shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-xl border-2 text-sm font-black cursor-pointer transition-colors ${
        done ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-[#2A1450] text-[#2A1450] hover:bg-[#F3E8FF]'
      }`}
    >
      {done ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {done ? 'คัดลอกแล้ว' : 'คัดลอก'}
    </button>
  );
};

/**
 * The payment step: a 5-minute transfer timer, the amount and the bank account to copy, the QR when a PromptPay ID
 * is set, and the slip upload. Once the time is up the page tells the buyer not to transfer any more; a slip of a
 * transfer already made can still be sent.
 */
export const PaymentStep: React.FC<{
  order: ServerOrder;
  amount: number;
  bank: { label: string; accountNo: string; accountName: string };
  qrDataUrl: string;
  qrError: string | null;
  hasPromptPay: boolean;
  slipBusy: boolean;
  slipMessage: { ok: boolean; text: string } | null;
  onSlipFile: (file: File | undefined) => void;
  onDownloadQr: () => void;
  onCancel: () => void;
}> = ({ order, amount, bank, qrDataUrl, qrError, hasPromptPay, slipBusy, slipMessage, onSlipFile, onDownloadQr, onCancel }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const left = useSecondsLeft(order.expiresAt);
  const expired = left <= 0 && order.paymentStatus !== 'PAID';
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const urgent = left > 0 && left <= 60;
  const reviewing = order.verificationStatus === 'PENDING_REVIEW';
  const cancelled = order.verificationStatus === 'REJECTED';

  if (cancelled) {
    return (
      <div role="alert" className="max-w-xl mx-auto rounded-3xl bg-rose-50 border-2 border-rose-500 p-5 text-rose-900 space-y-2">
        <div className="font-black flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5" /> คำสั่งซื้อนี้ถูกยกเลิกโดยเจ้าหน้าที่
        </div>
        <p className="text-sm font-semibold">
          กรุณาติดต่อผู้จัดงานพร้อมเลขคำสั่งซื้อ <strong className="font-mono">{order.orderId}</strong>
        </p>
        <button type="button" onClick={onCancel} className="min-h-[46px] px-4 rounded-xl bg-white border-2 border-[#2A1450] text-sm font-black text-[#2A1450] cursor-pointer">
          เริ่มสมัครใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* timer */}
      <div
        role="timer"
        aria-live={urgent ? 'assertive' : 'off'}
        className={`rounded-3xl border-[3px] p-4 sm:p-5 flex items-center gap-4 ${
          expired ? 'bg-rose-50 border-rose-500' : urgent ? 'bg-amber-50 border-amber-500' : 'bg-[#F5F0FF] border-[#2A1450]'
        }`}
      >
        <div
          className={`shrink-0 w-[92px] h-[92px] rounded-full flex flex-col items-center justify-center border-[5px] bg-white ${
            expired ? 'border-rose-500 text-rose-600' : urgent ? 'border-amber-500 text-amber-700 animate-pulse' : 'border-[#7C3AED] text-[#2A1450]'
          }`}
        >
          {expired ? (
            <Clock className="w-9 h-9" />
          ) : (
            <span className="font-mono text-[28px] font-black leading-none tabular-nums">
              {mm}:{ss}
            </span>
          )}
          {!expired && <span className="text-[10px] font-extrabold mt-1">นาที : วินาที</span>}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#6B5A85]">คำสั่งซื้อ {order.orderId}</div>
          {expired ? (
            <>
              <h3 className="text-lg font-black text-rose-700 leading-tight">หมดเวลาโอนแล้ว</h3>
              <p className="text-xs sm:text-sm font-bold text-rose-900 mt-1">
                ถ้ายังไม่ได้โอน กรุณาอย่าโอน แล้วเริ่มสั่งซื้อใหม่ ถ้าโอนไปแล้วภายในเวลา แนบสลิปด้านล่างได้เลย
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-black text-[#2A1450] leading-tight">กรุณาโอนภายใน 5 นาที</h3>
              <p className="text-xs sm:text-sm font-bold text-[#4B2D78] mt-1">แล้วแนบสลิปด้านล่าง ระบบตรวจให้อัตโนมัติ ผ่านแล้วได้ตั๋วทันที</p>
            </>
          )}
        </div>
      </div>

      {/* amount (hidden once the time is up, so nobody transfers late) */}
      {!expired && (
      <div className="rounded-3xl border-[3px] border-[#2A1450] bg-white p-4 sm:p-5 shadow-[0_6px_0_#2A1450]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold text-[#6B5A85]">ยอดที่ต้องโอน (ให้ตรงทุกสตางค์)</div>
            <div className="font-display text-4xl sm:text-5xl font-black text-[#2A1450] tabular-nums leading-tight">
              {baht(amount)} <span className="text-lg font-extrabold">บาท</span>
            </div>
          </div>
          <CopyButton text={amount.toFixed(2)} label="ยอดเงิน" />
        </div>
      </div>
      )}

      {/* bank account */}
      {bank.accountNo && !expired && (
        <div className="rounded-3xl border-[3px] border-[#1E3A8A] bg-[#EFF6FF] overflow-hidden">
          <div className="bg-[#1E3A8A] text-white px-4 py-2.5 text-sm font-black flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7DD3FC]" /> โอนเข้าบัญชี {bank.label}
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-2xl sm:text-3xl font-black text-[#1E3A8A] tabular-nums tracking-wide">{formatThaiBankAccount(bank.accountNo)}</div>
              <CopyButton text={bank.accountNo} label="เลขบัญชี" />
            </div>
            <div className="text-sm font-extrabold text-[#1E3A8A] leading-snug">ชื่อบัญชี: {bank.accountName}</div>
          </div>
        </div>
      )}

      {/* QR (only when a PromptPay ID is set) */}
      {hasPromptPay && !expired && (
        <div className="rounded-3xl border-2 border-dashed border-[#2A1450]/30 bg-white p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-44 h-44 shrink-0 rounded-2xl border-2 border-[#2A1450]/15 bg-white flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR พร้อมเพย์ ${baht(amount)} บาท`} className="w-full h-full object-contain p-1.5 select-none" />
            ) : (
              <span className="text-xs font-bold text-slate-400 px-3 text-center">{qrError || 'กำลังสร้าง QR...'}</span>
            )}
          </div>
          <div className="text-center sm:text-left space-y-2">
            <div className="text-sm font-black text-[#2A1450]">หรือสแกน QR พร้อมเพย์</div>
            <p className="text-xs font-semibold text-[#6B5A85]">สแกนได้ทุกธนาคาร ยอดเงินใส่ให้แล้ว</p>
            <button
              type="button"
              onClick={onDownloadQr}
              disabled={!qrDataUrl}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-sm font-extrabold text-[#2A1450] cursor-pointer"
            >
              <Download className="w-4 h-4" /> บันทึกรูป QR ลงมือถือ
            </button>
          </div>
        </div>
      )}

      {/* slip */}
      <div className="rounded-3xl border-[3px] border-[#2A1450] bg-white p-4 sm:p-5 shadow-[0_6px_0_#2A1450] space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-emerald-100 border-2 border-emerald-600 text-emerald-800 flex items-center justify-center shrink-0">
            <ScanLine className="w-5 h-5" />
          </span>
          <div>
            <div className="text-[11px] font-extrabold text-emerald-700">โอนเสร็จแล้ว</div>
            <h3 className="text-base sm:text-lg font-black text-[#2A1450] leading-tight">แนบสลิปที่นี่</h3>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onSlipFile(e.target.files?.[0]); e.target.value = ''; }} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={slipBusy || reviewing}
          className="w-full min-h-[60px] rounded-2xl border-[3px] border-[#2A1450] bg-gradient-to-b from-[#FFD84D] to-[#FFB300] text-[#180B30] text-base font-black flex items-center justify-center gap-2 shadow-[0_5px_0_#2A1450] active:translate-y-0.5 disabled:opacity-60 cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          {slipBusy ? 'กำลังตรวจสลิป...' : 'เลือกรูปสลิปการโอน'}
        </button>
        {reviewing ? (
          <div role="status" className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-3.5 text-sm text-amber-900 font-bold">
            ได้รับสลิปแล้ว ระบบตรวจอัตโนมัติไม่ได้ เจ้าหน้าที่จะตรวจและยืนยันให้ เมื่อยืนยันแล้วหน้านี้จะอัปเดตเอง
          </div>
        ) : (
          slipMessage && (
            <div
              role={slipMessage.ok ? 'status' : 'alert'}
              className={`rounded-2xl border-2 p-3.5 text-sm font-bold flex items-start gap-2 ${slipMessage.ok ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-rose-50 border-rose-500 text-rose-900'}`}
            >
              {!slipMessage.ok && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{slipMessage.text}</span>
            </div>
          )
        )}
        <p className="text-xs font-semibold text-[#6B5A85]">ปิดหน้านี้ได้ เปิดหน้าสมัครอีกครั้งจากเครื่องนี้เพื่อแนบสลิปหรือดูสถานะ</p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[46px] px-5 rounded-2xl bg-white border-2 border-[#2A1450]/40 text-sm font-extrabold text-[#4B2D78] hover:bg-[#F3E8FF] cursor-pointer"
        >
          {expired ? 'เริ่มสั่งซื้อใหม่' : 'ยกเลิกและเริ่มสมัครใหม่'}
        </button>
      </div>
    </div>
  );
};
