import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { adminApi, type ServerOrder } from '../utils/api';

/** Admin order inspector, left side: the uploaded slip and what EasySlip read from it. */
export const AdminSlipView: React.FC<{ order: ServerOrder }> = ({ order }) => {
  const [image, setImage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setImage('');
    setError(null);
    if (!order.hasSlip) return;
    let cancelled = false;
    adminApi
      .getSlip(order.orderId)
      .then((r) => !cancelled && setImage(r.image))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'โหลดสลิปไม่สำเร็จ'));
    return () => {
      cancelled = true;
    };
  }, [order.orderId, order.hasSlip, order.slipCheckedAt]);

  const paidBy =
    order.paymentStatus !== 'PAID'
      ? order.verificationStatus === 'PENDING_REVIEW'
        ? 'รอแอดมินตรวจสลิป'
        : order.hasSlip
          ? 'สลิปล่าสุดไม่ผ่าน — รอผู้สมัครส่งใหม่'
          : 'ยังไม่ได้รับสลิป'
      : order.verificationStatus === 'ADMIN_APPROVED'
        ? 'แอดมินอนุมัติด้วยตนเอง'
        : order.omiseChargeId && !order.hasSlip
          ? 'ชำระผ่าน Omise PromptPay แล้ว (ระบบเดิม)'
          : 'ตรวจสลิปผ่านอัตโนมัติ (EasySlip)';

  return (
    <div className="space-y-2 text-xs font-bold text-slate-600">
      {image ? (
        <a href={image} target="_blank" rel="noreferrer" className="block">
          <img src={image} alt={`สลิปของ ${order.orderId}`} className="max-h-[420px] w-auto mx-auto rounded-xl border border-slate-300 bg-white" />
        </a>
      ) : (
        <div className="py-10 px-4 space-y-2">
          <CreditCard className="w-8 h-8 mx-auto text-purple-700" />
          {order.hasSlip && !error && <p>กำลังโหลดสลิป...</p>}
          {error && <p className="text-rose-700">{error}</p>}
        </div>
      )}
      <div className="text-sm font-black text-slate-900">{paidBy}</div>
      {order.slipNote && <p className="font-semibold text-slate-600 text-left break-words">{order.slipNote}</p>}
      {order.slipAttempts ? <p className="font-semibold text-slate-500">ส่งสลิปแล้ว {order.slipAttempts} ครั้ง</p> : null}
    </div>
  );
};
