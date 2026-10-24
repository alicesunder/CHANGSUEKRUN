import React, { useEffect, useState } from 'react';
import { CreditCard, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { GatewayStatus, adminApi } from '../utils/api';

/** Admin card for the only payment method: Omise PromptPay. */
export const OmiseSettingsCard: React.FC = () => {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const webhookUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/payment-webhook` : '/api/payment-webhook';

  useEffect(() => {
    adminApi
      .gatewayStatus()
      .then(setStatus)
      .catch(() => setMessage({ ok: false, text: 'โหลดสถานะ Omise ไม่สำเร็จ' }));
  }, []);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const s = await adminApi.setOmiseKey(keyInput.trim());
      setStatus(s);
      setKeyInput('');
      setMessage({
        ok: true,
        text: s.mode === 'test' ? 'บันทึกแล้ว (โหมดทดสอบ — ยังไม่รับเงินจริง)' : 'บันทึกแล้ว — เปิดรับชำระเงินจริง',
      });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ' });
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!window.confirm('ลบ Omise key? ผู้สมัครจะชำระเงินไม่ได้จนกว่าจะใส่ key ใหม่')) return;
    setBusy(true);
    try {
      setStatus(await adminApi.clearOmiseKey());
      setMessage({ ok: true, text: 'ลบ key แล้ว — ปิดรับชำระเงิน' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'ลบไม่สำเร็จ' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-700" />
          <div>
            <h3 className="text-base font-black text-slate-900">ระบบชำระเงิน Omise PromptPay</h3>
            <p className="text-xs font-semibold text-slate-500">
              ผู้สมัครสแกน QR แล้วระบบยืนยันอัตโนมัติ ไม่ต้องแนบสลิป
            </p>
          </div>
        </div>
        {status && (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
              !status.hasOmiseKey
                ? 'bg-rose-100 text-rose-800'
                : status.mode === 'test'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {!status.hasOmiseKey ? 'ปิดรับชำระเงิน' : status.mode === 'test' ? 'โหมดทดสอบ' : 'รับเงินจริง'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="omise-key" className="block text-xs font-extrabold text-slate-700">
          Omise Secret Key (skey_... หรือ skey_test_...)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="omise-key"
            type="password"
            autoComplete="off"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={status?.hasOmiseKey ? 'ตั้งค่าไว้แล้ว — ใส่ใหม่เพื่อเปลี่ยน' : 'วาง Secret Key จาก Omise Dashboard'}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm text-slate-900"
          />
          <button
            type="button"
            onClick={save}
            disabled={busy || !keyInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#180B30] hover:bg-[#2A1450] text-[#FFC928] text-xs font-extrabold disabled:opacity-50 cursor-pointer"
          >
            บันทึก
          </button>
          {status?.hasOmiseKey && (
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold cursor-pointer"
            >
              ลบ key
            </button>
          )}
        </div>
        <p className="text-[11px] font-semibold text-slate-500">
          แนะนำให้ตั้งผ่านตัวแปร OMISE_SECRET_KEY บนเซิร์ฟเวอร์แทนการใส่ที่นี่
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
        <span className="block text-xs font-extrabold text-slate-700">
          Webhook URL — ใส่ใน Omise Dashboard → Webhooks
        </span>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-xs text-slate-800 break-all">{webhookUrl}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(webhookUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-extrabold text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={`text-xs font-extrabold flex items-center gap-1.5 ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}
        >
          {message.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </p>
      )}
    </div>
  );
};
