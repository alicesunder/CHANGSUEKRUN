import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Download, FileText, Mail, Printer, Ticket } from 'lucide-react';
import { PawIcon } from './brand/DogDecor';
import { RaceBib, runnerBib } from './RaceBib';
import { ParkingPasses } from './ParkingPass';
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
 * The last step: one clean ticket (BIB, QR and the facts), the buttons people really need (documents, print, save),
 * what happens next, and the printable BIB / parking passes underneath.
 */
export const PaymentSuccess: React.FC<{
  order: ServerOrder;
  chipLabel: string;
  headerGrad: string;
  startTime: string;
  qrUrl: string;
  emailReady: boolean;
  noRun: boolean;
  onPrint: (format: PrintFormatOption) => void;
  onDownloadBib: () => void;
  onRunnerCenter: () => void;
  onClose: () => void;
  onOpenAdmin?: () => void;
}> = ({ order, chipLabel, headerGrad, startTime, qrUrl, emailReady, noRun, onPrint, onDownloadBib, onRunnerCenter, onClose, onOpenAdmin }) => {
  const isRun = RUN_ROUTES.includes(order.routeId) && Boolean(order.bibNumber);
  const numberLabel = noRun ? 'เลขบัตรของคุณ' : 'หมายเลข BIB ของคุณ';
  const runners = [
    { name: order.fullName, ins: order.insurance, shirt: order.shirtSize },
    ...(order.extraRunners || []).map((r) => ({ name: r.name, ins: r.insurance, shirt: r.shirtSize })),
  ];
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
          className="mx-auto w-16 h-16 rounded-full bg-emerald-500 border-[3px] border-[#2A1450] flex items-center justify-center shadow-[0_4px_0_#2A1450]"
        >
          <CheckCircle2 className="w-9 h-9 text-white" />
        </motion.div>
        <h3 className="text-2xl sm:text-3xl font-black text-[#2A1450] leading-tight">ชำระเงินสำเร็จ</h3>
        <p className="text-sm font-bold text-[#4B2D78]">
          ขอบคุณคุณ <span className="text-[#6D28D9]">{order.fullName}</span> · ตั๋วของคุณพร้อมแล้ว
        </p>
      </motion.div>

      {/* the ticket */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-[28px] border-[3px] border-[#2A1450] bg-white shadow-[0_8px_0_#2A1450] overflow-hidden"
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
            <div className="font-display text-6xl sm:text-7xl font-black text-[#2A1450] tabular-nums leading-tight tracking-wide">#{order.bibNumber}</div>
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

      {/* what you need now */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {order.documentsUrl && (
          <a
            href={order.documentsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:col-span-3 flex items-center justify-center gap-2 min-h-[56px] px-5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white text-base font-black border-[3px] border-[#2A1450] shadow-[0_5px_0_#2A1450] active:translate-y-0.5"
          >
            <FileText className="w-5 h-5" /> เปิด / พิมพ์เอกสาร A4 (BIB · บัตร · ประกัน)
          </a>
        )}
        <button type="button" onClick={() => onPrint('full_a4_receipt')} className="min-h-[50px] px-4 rounded-2xl bg-[#FFC928] hover:bg-[#FFD646] text-[#2A1450] text-sm font-black border-2 border-[#2A1450] shadow-[0_3px_0_#2A1450] flex items-center justify-center gap-2 cursor-pointer">
          <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF
        </button>
        {isRun && (
          <button type="button" onClick={onDownloadBib} className="min-h-[50px] px-4 rounded-2xl bg-white hover:bg-[#F3E8FF] text-[#2A1450] text-sm font-black border-2 border-[#2A1450] shadow-[0_3px_0_#2A1450] flex items-center justify-center gap-2 cursor-pointer">
            <Download className="w-4 h-4" /> รูป BIB (.PNG)
          </button>
        )}
        <button type="button" onClick={() => onPrint('eticket_pass')} className="min-h-[50px] px-4 rounded-2xl bg-white hover:bg-[#F3E8FF] text-[#2A1450] text-sm font-black border-2 border-[#2A1450] shadow-[0_3px_0_#2A1450] flex items-center justify-center gap-2 cursor-pointer">
          <Ticket className="w-4 h-4" /> บัตร E-Ticket
        </button>
      </div>

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

      {/* printable BIBs */}
      {isRun && (
        <div className="rounded-3xl border-[3px] border-[#2A1450] bg-white p-4 sm:p-5 space-y-4">
          <div>
            <h3 className="text-base font-black text-[#2A1450]">ป้าย BIB ของคุณ</h3>
            <p className="text-xs font-bold text-[#6B5A85]">เลข ชื่อ และ QR เติมให้อัตโนมัติ · BIB ตัวจริงพร้อมชิปรับได้ที่จุดรับอุปกรณ์</p>
          </div>
          {runners.map((r, i) => (
            <RaceBib
              key={i}
              bib={runnerBib(order.bibNumber, i)}
              routeId={order.routeId}
              name={r.name}
              orderId={order.orderId}
              gender={r.ins?.gender}
              age={r.ins?.age}
              dogName={order.runningWithDog ? order.dogName : undefined}
            />
          ))}
        </div>
      )}

      <ParkingPasses orderId={order.orderId} vipTables={order.vipTables} plates={order.parkingPlates} paid={order.paymentStatus === 'PAID'} />

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        <button type="button" onClick={onRunnerCenter} className="w-full sm:w-auto px-6 min-h-[50px] rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-extrabold text-sm border-2 border-[#2A1450] shadow-[0_4px_0_#2A1450] flex items-center justify-center gap-2 cursor-pointer">
          <Ticket className="w-4 h-4" /> ไปยังศูนย์นักวิ่ง
        </button>
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
