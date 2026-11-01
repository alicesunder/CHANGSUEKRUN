import React, { useEffect, useState } from 'react';
import { ScanLine, CheckCircle2, AlertTriangle } from 'lucide-react';
import { GatewayStatus, adminApi } from '../utils/api';

/** Admin card for the payment check: PromptPay transfer + slip, verified by EasySlip. */
export const EasySlipSettingsCard: React.FC = () => {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminApi
      .gatewayStatus()
      .then(setStatus)
      .catch(() => setMessage({ ok: false, text: 'โหลดสถานะ EasySlip ไม่สำเร็จ' }));
  }, []);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      setStatus(await adminApi.setEasySlipKey(keyInput.trim()));
      setKeyInput('');
      setMessage({ ok: true, text: 'บันทึกแล้ว — เปิดรับชำระเงินด้วยการแนบสลิป' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ' });
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!window.confirm('ลบ EasySlip key? ผู้สมัครจะชำระเงินไม่ได้จนกว่าจะใส่ key ใหม่')) return;
    setBusy(true);
    try {
      setStatus(await adminApi.clearEasySlipKey());
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
          <ScanLine className="w-5 h-5 text-purple-700" />
          <div>
            <h3 className="text-base font-black text-slate-900">ระบบตรวจสลิป EasySlip</h3>
            <p className="text-xs font-semibold text-slate-500">
              ผู้สมัครโอนผ่านพร้อมเพย์แล้วแนบสลิป ระบบตรวจยอด บัญชีผู้รับ เวลาโอน และสลิปซ้ำให้อัตโนมัติ
            </p>
          </div>
        </div>
        {status && (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
              status.hasEasySlipKey ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {status.hasEasySlipKey ? 'เปิดรับชำระเงิน' : 'ปิดรับชำระเงิน'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="easyslip-key" className="block text-xs font-extrabold text-slate-700">
          EasySlip API Key
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="easyslip-key"
            type="password"
            autoComplete="off"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={status?.hasEasySlipKey ? 'ตั้งค่าไว้แล้ว — ใส่ใหม่เพื่อเปลี่ยน' : 'วาง API Key จาก EasySlip Dashboard'}
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
          {status?.hasEasySlipKey && (
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
          แนะนำให้ตั้งผ่านตัวแปร EASYSLIP_API_KEY บนเซิร์ฟเวอร์แทนการใส่ที่นี่ · บัญชีผู้รับที่ตรวจคือเลขบัญชีและพร้อมเพย์ในการตั้งค่าด้านบน
          (ลงทะเบียนบัญชีเดียวกันใน EasySlip Dashboard ด้วยจะตรวจได้แม่นขึ้น)
        </p>
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
