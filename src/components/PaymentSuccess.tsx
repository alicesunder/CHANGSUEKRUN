import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Download, FileText, Mail, Ticket } from 'lucide-react';
import { PawIcon } from './brand/DogDecor';
import { formatBaht } from '../data/eventData';
import type { ServerOrder } from '../utils/api';
import type { PrintFormatOption } from '../utils/ticketEmailAndPrint';

const RUN_ROUTES = ['1km', '3km', '5km', '10km'];

const Fact: React.FC<{ label: string; value: React.ReactNode; tone?: 'ok' }> = ({ label, value, tone }) => (
  <div className={`rounded-2xl border-2 px-3.5 py-2.5 ${tone === 'ok' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-[#2A1450]/12'}`}>
    <div className={`text-[11px] font-extrabold ${tone === 'ok' ? 'text-emerald-700' : 'text-[#6B5A85]'}`}>{label}</div>
    <div className={`text-sm font-black leading-snug break-words ${tone === 'ok' ? 'text-emerald-900' : 'text-[#2A1450]'}`}>{value}</div>
  </div>
);

/**
 * The confirmation screen after paying: the ticket (BIB, QR, the facts), ONE main button (Runner Center, where every
 * document, print-out and pass lives), what happens next. Printing was moved out of here on purpose.
 */
export const PaymentSuccess: React.FC<{
  order: ServerOrder;
  chipLabel: string;
  headerGrad: string;
  startTime: string;
  qrUrl: string;
  emailReady: boolean;
  noRun: boolean;
  /** kept so callers need no change; printing now happens in the Runner Center */
  onPrint?: (format: PrintFormatOption) => void;
  onDownloadBib: () => void;
  onRunnerCenter: () => void;
  onClose: () => void;
  onOpenAdmin?: () => void;
}> = ({ order, chipLabel, headerGrad, startTime, qrUrl, emailReady, noRun, onDownloadBib, onRunnerCenter, onClose, onOpenAdmin }) => {
  const isRun = RUN_ROUTES.includes(order.routeId) && Boolean(order.bibNumber);
  const numberLabel = noRun ? 'เลขบัตรของคุณ' : 'หมายเลข BIB ของคุณ';
  const steps = [
    { icon: '✉️', title: 'ตรวจอีเมล', text: emailReady ? `ส่งตั๋วไปที่ ${order.email} แล้ว (ไม่เห็นให้ดูในโฟลเดอร์สแปม)` : 'บันทึกหน้านี้หรือพิมพ์บัตรเก็บไว้' },
    { icon: '🎽', title: 'รับเสื้อและ BIB', text: `แสดง QR หรือเลขคำสั่งซื้อ ${order.orderId} ที่จุดรับอุปกรณ์` },
    { icon: '🏁', title: 'มาวันงาน', text: `ปล่อยตัว ${startTime} · 9 ม.ค. 2570 ณ Sea Sand Sun Hua Hin Resort` },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">
      {/* success header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
          className="mx-auto w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
        >
          <CheckCircle2 className="w-9 h-9 text-white" />
        </motion.div>
        <h3 className="text-2xl sm:text-3xl font-black text-[#2A1450] leading-tight">ชำระเงินสำเร็จ</h3>
        <p className="text-sm font-bold text-[#4B2D78]">
          ขอบคุณคุณ <span className="text-[#6D28D9]">{order.fullName}</span> · ตั๋วของคุณพร้อมแล้ว
        </p>
      </motion.div>

      {/* the one main action */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onRunnerCenter}
          className="w-full sm:w-auto sm:min-w-[320px] px-7 min-h-[56px] rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white text-base font-black border-[3px] border-[#2A1450] shadow-[0_5px_0_#2A1450] flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
        >
          <Ticket className="w-5 h-5" /> ไปศูนย์นักวิ่ง
        </button>
        <p className="text-center text-xs font-bold text-[#6B5A85]">เอกสาร A4 · พิมพ์ BIB · บัตรจอดรถ · ใบประกัน ทั้งหมดอยู่ที่ศูนย์นักวิ่ง เปิดได้ทุกเมื่อ</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isRun && (
            <button type="button" onClick={onDownloadBib} className="min-h-[44px] px-4 rounded-xl bg-white hover:bg-[#F3E8FF] text-[#2A1450] text-sm font-extrabold border-2 border-[#2A1450] flex items-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" /> บันทึกรูป BIB (.PNG)
            </button>
          )}
          {order.documentsUrl && (
            <a href={order.documentsUrl} target="_blank" rel="noopener noreferrer" className="min-h-[44px] px-4 rounded-xl bg-white hover:bg-[#F3E8FF] text-[#2A1450] text-sm font-extrabold border-2 border-[#2A1450] flex items-center gap-2">
              <FileText className="w-4 h-4" /> เปิดเอกสาร A4
            </a>
          )}
        </div>
      </div>

      {/* the ticket */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="ds-card overflow-hidden"
      >
        <div style={{ background: headerGrad }} className="px-5 py-3.5 text-white flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold tracking-wider text-[#FFC928]">CHANGSUEK RUN 2027 · E-TICKET</div>
            <div className="text-base sm:text-lg font-black leading-tight truncate">{order.routeName}</div>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full bg-[#FFC928] text-[#2A1450] font-display font-black text-sm border-2 border-[#2A1450]">{chipLabel}</span>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
          <div className="text-center sm:text-left">
            <div className="text-xs font-extrabold text-[#6B5A85]">{numberLabel}</div>
            <div className="font-display text-5xl sm:text-7xl whitespace-nowrap font-black text-[#2A1450] tabular-nums leading-tight tracking-wide">#{order.bibNumber}</div>
            <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
              <CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันการชำระเงินแล้ว
            </div>
          </div>
          <div className="mx-auto sm:mx-0 text-center">
            <div className="w-32 h-32 rounded-2xl border-2 border-[#2A1450] bg-white flex items-center justify-center p-1.5">
              {qrUrl ? <img src={qrUrl} alt="QR สำหรับรับเสื้อวันงาน" className="w-full h-full object-contain" /> : <span className="text-xs text-slate-400">QR</span>}
            </div>
            <div className="mt-1 text-[11px] font-extrabold text-[#2A1450]">สแกนรับเสื้อวันงาน</div>
            <div className="text-[11px] font-mono font-bold text-[#6D28D9]">{order.orderId}</div>
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-2 gap-2.5">
          <Fact label="ชื่อ" value={order.fullName} />
          {!noRun && <Fact label="เสื้อวิ่ง" value={`ไซซ์ ${order.shirtSize} (${order.peopleCount} คน)`} />}
          {!noRun && <Fact label="เวลาปล่อยตัว" value={`${startTime} · 9 ม.ค. 70`} />}
          <Fact
            label={order.paymentMethod === 'SPONSOR_CODE' ? 'สิทธิ์สปอนเซอร์' : 'ยอดที่ชำระ'}
            tone="ok"
            value={order.paymentMethod === 'SPONSOR_CODE' ? `วิ่ง + คอนเสิร์ต ฟรี${order.totalPrice > 0 ? ` · กิจกรรมเสริม ${formatBaht(order.totalPrice)} บาท` : ''}` : `${formatBaht(order.totalPrice)} บาท`}
          />
          {order.addOns && <Fact label="กิจกรรมเสริม" value={`${order.addOns.label} × ${order.addOns.people} คน`} />}
          {order.runningWithDog && (
            <Fact
              label="น้องสุนัข"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <PawIcon size={14} color="#16A34A" /> {order.dogName || 'น้องสุนัขคู่ใจ'} ({order.dogBreed || 'ไม่ระบุสายพันธุ์'})
                </span>
              }
            />
          )}
        </div>
      </motion.div>

      {/* next steps */}
      <div className="rounded-3xl bg-[#FAF7FF] border-2 border-[#2A1450]/15 p-4 sm:p-5">
        <div className="text-sm font-black text-[#2A1450] mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#6D28D9]" /> ขั้นตอนต่อไป
        </div>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3">
              <span className="shrink-0 w-9 h-9 rounded-full bg-white border-2 border-[#2A1450] flex items-center justify-center text-base" aria-hidden="true">
                {s.icon}
              </span>
              <div>
                <div className="text-sm font-black text-[#2A1450]">
                  {i + 1}. {s.title}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#4B2D78] leading-snug">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        {onOpenAdmin && (
          <button type="button" onClick={onOpenAdmin} className="w-full sm:w-auto px-5 min-h-[50px] rounded-2xl bg-[#2A1450] text-[#FFC928] font-extrabold text-sm cursor-pointer">
            ดูรายการในระบบแอดมิน
          </button>
        )}
        <button type="button" onClick={onClose} className="w-full sm:w-auto px-5 min-h-[50px] rounded-2xl bg-white hover:bg-[#F3E8FF] text-[#2A1450] font-extrabold text-sm border-2 border-[#2A1450] cursor-pointer">
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  );
};
