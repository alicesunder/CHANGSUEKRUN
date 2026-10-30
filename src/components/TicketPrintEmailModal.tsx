import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Mail,
  Download,
  CheckCircle2,
  QrCode,
  FileText,
  Ticket,
  Send,
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Scissors,
  Check,
} from 'lucide-react';
import { RunnerProfile } from '../utils/runnerStorage';
import {
  PrintFormatOption,
  generateTicketCheckInQrDataUrl,
  dispatchAutomatedTicketEmail,
  downloadOfficialBibAsPng,
  getRoutePrintMeta,
} from '../utils/ticketEmailAndPrint';
import { formatBaht } from '../data/eventData';
import { PawIcon } from './brand/DogDecor';

interface TicketPrintEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RunnerProfile;
  initialMode?: 'print' | 'email';
  initialPrintFormat?: PrintFormatOption;
}

export const TicketPrintEmailModal: React.FC<TicketPrintEmailModalProps> = ({
  isOpen,
  onClose,
  profile,
  initialMode = 'print',
  initialPrintFormat = 'full_a4_receipt',
}) => {
  const [activeTab, setActiveTab] = useState<'print' | 'email'>(initialMode);
  const [printFormat, setPrintFormat] = useState<PrintFormatOption>(initialPrintFormat);
  const [checkInQrUrl, setCheckInQrUrl] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>(profile.email || 'runner@changsuekrun.com');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState<string | null>(null);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);

  const meta = getRoutePrintMeta(profile.routeId);
  const orderId = profile.orderId || `CSR27-${profile.bibNumber}`;
  const totalAmount = profile.totalPrice || 690;

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setPrintFormat(initialPrintFormat);
      setEmailInput(profile.email || 'runner@changsuekrun.com');
      generateTicketCheckInQrDataUrl(profile).then(setCheckInQrUrl);
    }
  }, [isOpen, initialMode, initialPrintFormat, profile]);

  if (!isOpen) return null;

  const handlePrintNow = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    setIsDownloadingPng(true);
    try {
      await downloadOfficialBibAsPng(profile);
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSendingEmail(true);
    setEmailToast(null);
    await new Promise((r) => setTimeout(r, 650));
    const log = await dispatchAutomatedTicketEmail(profile, emailInput.trim());
    setIsSendingEmail(false);
    setEmailToast(
      `จัดส่งบัตรวิ่ง E-Ticket และป้าย BIB #${profile.bibNumber} ไปยัง ${log.recipientEmail} เรียบร้อยแล้ว!`
    );
    setTimeout(() => setEmailToast(null), 4000);
  };

  const handleOpenMailClient = () => {
    const subject = encodeURIComponent(
      `[บัตรวิ่ง E-Ticket & BIB #${profile.bibNumber}] งานวิ่งช้างศึกรัน CHANGSUEK RUN 2026`
    );
    const body = encodeURIComponent(
      `สวัสดีคุณ ${profile.fullName}\n\n` +
        `ระบบยืนยันการชำระเงินอัตโนมัติและออกบัตรวิ่งงาน CHANGSUEK RUN 2026 เรียบร้อยแล้ว\n` +
        `----------------------------------------\n` +
        `• รหัสคำสั่งซื้อ: ${orderId}\n` +
        `• หมายเลขประจำตัวนักวิ่ง (BIB): #${profile.bibNumber}\n` +
        `• ระยะทาง: ${profile.routeName} (${profile.routeId.toUpperCase()})\n` +
        `• ไซส์เสื้อวิ่ง: Size ${profile.shirtSize}\n` +
        `• เวลาปล่อยตัว: ${meta.startTime} (วันพฤหัสบดีที่ 10 ธ.ค. 2569 ณ ค่ายนเรศวร ชะอำ-หัวหิน)\n` +
        `• ยอดชำระสุทธิ: ${formatBaht(totalAmount)} บาท (รหัสอ้างอิง: ${profile.paymentRef || 'PROMPTPAY-VERIFIED'})\n` +
        `----------------------------------------\n` +
        `กรุณาแสดงอีเมลหรือป้าย E-BIB นี้ที่จุดรับเสื้อและเหรียญรางวัลในวันงาน\n`
    );
    window.location.href = `mailto:${emailInput.trim()}?subject=${subject}&body=${body}`;
  };

  const modalContent = (
    <div className="dedicated-print-portal fixed inset-0 z-[10050] flex items-center justify-center p-2 sm:p-4 bg-[#140826]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto rounded-[28px] border-[3px] border-[#2A1450] bg-[#FAF7FF] text-[#2A1450] shadow-[0_24px_60px_rgba(0,0,0,0.6),0_8px_0_#2A1450] overflow-hidden max-h-[95vh] flex flex-col print-sheet-wrapper">
        {/* ============================================================ */}
        {/* TOP HEADER (HIDDEN ON PAPER PRINT)                           */}
        {/* ============================================================ */}
        <div className="print-hide bg-gradient-to-r from-[#220E42] via-[#3B1870] to-[#220E42] text-white px-5 py-4 border-b-[3px] border-[#2A1450] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC928] text-[#2A1450] border-2 border-[#2A1450] flex items-center justify-center shrink-0 font-black">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#FFC928]">
                AUTO E-TICKET, EMAIL & PRINT CENTER · BIB #{profile.bibNumber}
              </div>
              <h3 className="text-base sm:text-xl font-black leading-tight">
                เลือกรูปแบบการพิมพ์บัตร (Print) & ตรวจสอบอีเมลอัตโนมัติ
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch between Print Layout vs Email View */}
            <div className="flex rounded-xl bg-white/10 p-1 border border-white/20">
              <button
                type="button"
                onClick={() => setActiveTab('print')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'print'
                    ? 'bg-[#FFC928] text-[#2A1450] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>เลือกรูปแบบ Print (3 แบบ)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'email'
                    ? 'bg-[#FFC928] text-[#2A1450] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>อีเมลที่ส่งอัตโนมัติ</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#FFC928] text-white hover:text-[#2A1450] border border-white/25 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FORMAT SELECTOR BAR (HIDDEN ON PAPER PRINT)                  */}
        {/* ============================================================ */}
        {activeTab === 'print' && (
          <div className="print-hide bg-white border-b-2 border-[#2A1450]/15 px-5 py-3.5 space-y-3 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#2A1450] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#6D28D9]" />
                <span>เลือกรูปแบบเอกสารที่ต้องการพิมพ์หรือบันทึกเป็น PDF:</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isDownloadingPng}
                  className="px-3.5 py-2 rounded-xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#4B2D78] border-2 border-[#2A1450] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingPng ? 'กำลังสร้างไฟล์รูป...' : 'ดาวน์โหลดรูปป้าย BIB (.PNG)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintNow}
                  className="px-4 py-2 rounded-xl bg-[#FFC928] hover:bg-[#FFD646] text-[#2A1450] border-2 border-[#2A1450] shadow-[0_3px_0_#2A1450] text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>สั่งพิมพ์เอกสารนี้ / บันทึกเป็น PDF</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'bib_only' as PrintFormatOption,
                  title: '1. พิมพ์เฉพาะป้าย BIB ติดเสื้อ',
                  desc: 'ป้ายหมายเลข BIB ขนาดใหญ่ชัดเจน พร้อมรูเข็มกลัด 4 มุม',
                  icon: <Ticket className="w-4 h-4" />,
                },
                {
                  id: 'eticket_pass' as PrintFormatOption,
                  title: '2. พิมพ์บัตร E-Ticket รับเสื้อ',
                  desc: 'บัตรเข้างานพร้อม QR Code สแกนรับเสื้อและเหรียญ',
                  icon: <QrCode className="w-4 h-4" />,
                },
                {
                  id: 'full_a4_receipt' as PrintFormatOption,
                  title: '3. ใบเสร็จ + E-Ticket + ป้าย BIB (A4)',
                  desc: 'ครบชุดในแผ่นเดียว พร้อมเส้นประตัดป้าย BIB ใช้งาน',
                  icon: <FileText className="w-4 h-4" />,
                },
              ].map((opt) => {
                const active = printFormat === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrintFormat(opt.id)}
                    className={`text-left p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                      active
                        ? 'bg-[#2A1450] text-white border-[#2A1450] shadow-[0_3px_0_#6D28D9]'
                        : 'bg-[#FAF7FF] text-[#2A1450] border-[#2A1450]/20 hover:border-[#2A1450]'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        active ? 'bg-[#FFC928] text-[#2A1450]' : 'bg-white text-[#6D28D9]'
                      }`}
                    >
                      {opt.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{opt.title}</div>
                      <div
                        className={`text-[10px] font-semibold truncate ${
                          active ? 'text-white/80' : 'text-[#6B5A85]'
                        }`}
                      >
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* EMAIL CONTROLS BAR (WHEN IN EMAIL TAB)                       */}
        {/* ============================================================ */}
        {activeTab === 'email' && (
          <div className="print-hide bg-white border-b-2 border-[#2A1450]/15 px-5 py-3.5 space-y-2.5 shrink-0">
            <form
              onSubmit={handleResendEmail}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  ระบบส่งบัตร E-Ticket & BIB #{profile.bibNumber} เข้าอีเมลอัตโนมัติทันทีที่เงินเข้าเรียบร้อยแล้ว
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ระบุอีเมลผู้รับ..."
                  className="px-3 py-2 rounded-xl border-2 border-[#2A1450]/25 text-xs font-bold text-[#2A1450] bg-white min-w-[210px]"
                />
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-3.5 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingEmail ? 'กำลังส่ง...' : 'ส่งเข้าอีเมลซ้ำ'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenMailClient}
                  className="px-3 py-2 rounded-xl bg-[#FFC928] hover:bg-[#FFD646] text-[#2A1450] border-2 border-[#2A1450] text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>เปิดในแอปเมล</span>
                </button>
              </div>
            </form>

            {emailToast && (
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{emailToast}</span>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MAIN SCROLLABLE PREVIEW & PRINTABLE DOCUMENT SHEET           */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/70 print:bg-white print:p-0">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border-[3px] border-[#2A1450] p-5 sm:p-7 shadow-xl print:shadow-none print:border-0 print:rounded-none printable-active-document space-y-6">
            {/* ======================================================== */}
            {/* TAB 1: PRINTABLE FORMATS                                 */}
            {/* ======================================================== */}
            {activeTab === 'print' && (
              <>
                {/* PART A: OFFICIAL RECEIPT HEADER (Shown in full_a4_receipt) */}
                {printFormat === 'full_a4_receipt' && (
                  <div className="border-2 border-[#2A1450] rounded-2xl p-4 sm:p-5 bg-[#FAF7FF] space-y-3 page-break-avoid">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#2A1450]/15 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#6D28D9] block">
                          OFFICIAL E-RECEIPT & AUTOMATIC PAYMENT CONFIRMATION
                        </span>
                        <h2 className="text-lg sm:text-xl font-black text-[#2A1450]">
                          ใบสำคัญรับเงิน / ยืนยันการสมัครวิ่งช้างศึกรัน 2026
                        </h2>
                        <p className="text-xs font-bold text-[#6B5A85]">
                          โครงการวิ่งช้างศึกรัน (เห็นช้างวิ่ง วิ่งตามช้าง) · ศูนย์ฝึกสุนัขตำรวจ ค่ายนเรศวร ชะอำ-หัวหิน
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-600 text-emerald-900 text-xs font-black">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          ชำระเงินแล้ว (PAID)
                        </span>
                        <div className="text-[11px] font-mono font-bold text-[#4B2D78] mt-1">
                          เลขที่คำสั่งซื้อ: {orderId}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-[#6B5A85] block">ชื่อผู้สมัคร</span>
                        <span className="font-black text-[#2A1450]">{profile.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#6B5A85] block">อีเมลรับบัตร</span>
                        <span className="font-bold text-[#2A1450]">{profile.email || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#6B5A85] block">อ้างอิง PromptPay</span>
                        <span className="font-mono font-black text-emerald-800">
                          {profile.paymentRef || 'PP-VERIFIED'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#6B5A85] block">ยอดชำระสุทธิ</span>
                        <span className="font-display text-base font-black text-[#2A1450]">
                          {formatBaht(totalAmount)} บาท
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PART B: E-TICKET & QR RACE KIT PICKUP PASS (Shown in eticket_pass & full_a4_receipt) */}
                {(printFormat === 'eticket_pass' || printFormat === 'full_a4_receipt') && (
                  <div className="border-[3px] border-[#2A1450] rounded-3xl overflow-hidden bg-white page-break-avoid">
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${meta.primary} 0%, ${meta.secondary} 100%)`,
                      }}
                      className="px-5 py-3.5 text-white border-b-[3px] border-[#2A1450] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#FFC928] block">
                          CHANGSUEK RUN 2026 · E-TICKET & RACE KIT PICKUP PASS
                        </span>
                        <span className="text-base sm:text-lg font-black">
                          บัตรรับเสื้อวิ่งและอุปกรณ์แข่งขัน (แสดง QR นี้ในวันรับบิบ)
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#FFC928] text-[#2A1450] font-black text-xs border-2 border-[#2A1450]">
                        {profile.routeId.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-8 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-[#2A1450] text-[#FFC928] font-mono font-black text-base">
                            BIB #{profile.bibNumber}
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-[#F3E8FF] text-[#4B2D78] font-extrabold text-xs">
                            เสื้อวิ่ง Size {profile.shirtSize || 'L'}
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                            ปล่อยตัว {meta.startTime}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-xs bg-[#FAF7FF] p-3.5 rounded-2xl border border-[#2A1450]/15">
                          <div>
                            <span className="text-[10px] font-bold text-[#6B5A85] block">
                              ชื่อนักวิ่ง (Runner)
                            </span>
                            <span className="font-black text-sm text-[#2A1450]">
                              {profile.fullName}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#6B5A85] block">
                              ประเภทระยะทาง
                            </span>
                            <span className="font-black text-sm text-[#2A1450]">
                              {profile.routeName}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#6B5A85] block">
                              วันและสถานที่จัดงาน
                            </span>
                            <span className="font-bold text-[#2A1450]">
                              พฤหัสบดี 10 ธ.ค. 2569 · ค่ายนเรศวร
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#6B5A85] block">
                              จุดรับ Race Kit
                            </span>
                            <span className="font-bold text-[#5B20A8]">
                              หน้าหาด รร. Sea Sand Sun
                            </span>
                          </div>
                        </div>

                        {profile.runningWithDog && (
                          <div className="p-2.5 rounded-xl bg-[#DCFCE7] border border-[#16A34A] text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                            <PawIcon size={15} color="#16A34A" />
                            <span>
                              K9 Companion Pass: น้อง{profile.dogName || 'เพื่อนซี้สี่ขา'} (
                              {profile.dogBreed || 'ไม่ระบุสายพันธุ์'}) · เข้าจุดตรวจสุขภาพสัตว์เลี้ยงฟรี
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Check-in QR Code */}
                      <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-[#2A1450] bg-[#FAF7FF] text-center">
                        {checkInQrUrl && (
                          <img loading="lazy" decoding="async"
                            src={checkInQrUrl}
                            alt="Race Kit Check-in QR"
                            className="w-32 h-32 object-contain mx-auto"
                          />
                        )}
                        <span className="text-[11px] font-black text-[#2A1450] mt-1.5">
                          QR สแกนรับเสื้อและเหรียญ
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#6B5A85]">
                          {orderId}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CUT LINE DIVIDER (Shown in full_a4_receipt) */}
                {printFormat === 'full_a4_receipt' && (
                  <div className="flex items-center gap-3 text-xs font-extrabold text-[#6B5A85] py-1">
                    <Scissors className="w-4 h-4 text-[#6D28D9] shrink-0" />
                    <div className="flex-1 border-t-2 border-dashed border-[#2A1450]/35" />
                    <span>แนวเส้นประสำหรับตัดป้ายหมายเลข BIB ด้านล่างเพื่อใช้งาน</span>
                    <div className="flex-1 border-t-2 border-dashed border-[#2A1450]/35" />
                  </div>
                )}

                {/* PART C: OFFICIAL PRINTABLE RACE BIB PLATE (Shown in bib_only & full_a4_receipt) */}
                {(printFormat === 'bib_only' || printFormat === 'full_a4_receipt') && (
                  <div className="relative rounded-[28px] border-[4px] border-[#2A1450] bg-white overflow-hidden page-break-avoid">
                    {/* 4 Corner Safety Pin Holes */}
                    <div className="absolute top-3.5 left-3.5 w-4 h-4 rounded-full bg-white border-[3px] border-[#2A1450] z-20" />
                    <div className="absolute top-3.5 right-3.5 w-4 h-4 rounded-full bg-white border-[3px] border-[#2A1450] z-20" />
                    <div className="absolute bottom-3.5 left-3.5 w-4 h-4 rounded-full bg-white border-[3px] border-[#2A1450] z-20" />
                    <div className="absolute bottom-3.5 right-3.5 w-4 h-4 rounded-full bg-white border-[3px] border-[#2A1450] z-20" />

                    {/* Top Wave Banner */}
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${meta.primary} 0%, ${meta.secondary} 100%)`,
                      }}
                      className="px-8 py-4 text-white border-b-[3.5px] border-[#2A1450] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.22em] text-[#FFC928] block">
                          CHANGSUEK RUN 2026 · OFFICIAL RACE BIB
                        </span>
                        <span className="text-lg sm:text-xl font-black block">
                          เห็นช้างวิ่ง วิ่งตามช้าง • ค่ายนเรศวร
                        </span>
                        <span className="text-xs font-bold text-white/85">
                          {meta.wave} · ปล่อยตัว {meta.startTime}
                        </span>
                      </div>
                      <div className="px-4 py-1.5 rounded-2xl bg-[#FFC928] text-[#2A1450] font-display font-black text-xl sm:text-2xl border-[3px] border-[#2A1450]">
                        {profile.routeId.toUpperCase()}
                      </div>
                    </div>

                    {/* Center Giant BIB Number */}
                    <div className="px-6 py-6 text-center bg-gradient-to-b from-[#FAF7FF] to-white">
                      <div className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#6B5A85]">
                        RACE NUMBER / หมายเลขประจำตัวนักวิ่ง
                      </div>
                      <div className="font-display text-7xl sm:text-8xl font-black tracking-wider text-[#2A1450] my-2 tabular-nums leading-none">
                        {profile.bibNumber}
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 border-2 border-emerald-700 text-emerald-900 text-xs font-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>VERIFIED RUNNER · ชำระเงินและยืนยันสิทธิ์อัตโนมัติแล้ว</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-5 text-left max-w-2xl mx-auto">
                        <div className="p-3 rounded-2xl bg-[#FAF7FF] border-2 border-[#2A1450]/20">
                          <span className="text-[10px] font-bold text-[#6B5A85] uppercase block">
                            RUNNER NAME
                          </span>
                          <span className="text-sm sm:text-base font-black text-[#2A1450] truncate block">
                            {profile.fullName}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-[#FAF7FF] border-2 border-[#2A1450]/20">
                          <span className="text-[10px] font-bold text-[#6B5A85] uppercase block">
                            JERSEY SIZE
                          </span>
                          <span className="text-sm sm:text-base font-black text-[#2A1450] block">
                            Size {profile.shirtSize || 'L'}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-[#FAF7FF] border-2 border-[#2A1450]/20">
                          <span className="text-[10px] font-bold text-[#6B5A85] uppercase block">
                            EMERGENCY / กู้ชีพ
                          </span>
                          <span className="text-xs sm:text-sm font-black text-[#5B20A8] block">
                            032-471-299
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ======================================================== */}
            {/* TAB 2: AUTOMATED EMAIL INBOX PREVIEW                     */}
            {/* ======================================================== */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                {/* Simulated Email Client Envelope Header */}
                <div className="rounded-2xl bg-[#FAF7FF] border-2 border-[#2A1450]/20 p-4 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A1450]/10 pb-2">
                    <span className="font-black text-sm text-[#2A1450]">
                      [ชำระเงินสำเร็จ] บัตรวิ่ง E-Ticket และป้ายหมายเลข BIB #{profile.bibNumber} งาน
                      CHANGSUEK RUN 2026
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                      ✓ ส่งอัตโนมัติแล้ว (Auto-Dispatched)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[#4B2D78] font-semibold">
                    <div>
                      <strong>จาก (From):</strong> CHANGSUEK RUN Official Ticketing &lt;tickets@changsuekrun.com&gt;
                    </div>
                    <div>
                      <strong>ถึง (To):</strong> {profile.fullName} &lt;{emailInput}&gt;
                    </div>
                  </div>
                </div>

                {/* Email Body Content */}
                <div className="rounded-2xl border-2 border-[#2A1450]/20 p-5 space-y-4 bg-white text-xs sm:text-sm leading-relaxed text-[#2A1450]">
                  <p className="font-bold">
                    เรียนคุณ <span className="text-[#6D28D9] font-black">{profile.fullName}</span>,
                  </p>
                  <p>
                    ขอแสดงความยินดี! ระบบอัตโนมัติของโครงการวิ่ง{' '}
                    <strong>CHANGSUEK RUN 2026 (เห็นช้างวิ่ง วิ่งตามช้าง)</strong>{' '}
                    ได้ตรวจสอบยอดเงินโอนผ่านระบบ PromptPay QR ของคุณจำนวน{' '}
                    <strong>{formatBaht(totalAmount)} บาท</strong> เรียบร้อยแล้ว
                    และได้ออกบัตรวิ่งพร้อมหมายเลขประจำตัวนักวิ่ง (BIB) ให้คุณทันทีดังนี้:
                  </p>

                  <div className="rounded-2xl bg-[#FAF5FF] border-2 border-[#6D28D9] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6D28D9]">
                        หมายเลขประจำตัวนักวิ่งของคุณ (OFFICIAL BIB)
                      </div>
                      <div className="font-display text-4xl font-black text-[#2A1450]">
                        #{profile.bibNumber}
                      </div>
                      <div className="text-xs font-bold text-[#4B2D78]">
                        ระยะทาง: {profile.routeName} · เสื้อวิ่ง Size {profile.shirtSize}
                      </div>
                      <div className="text-xs font-semibold text-emerald-800">
                        รหัสคำสั่งซื้อ: {orderId} · อ้างอิงโอนเงิน: {profile.paymentRef || 'PROMPTPAY-AUTO'}
                      </div>
                    </div>

                    {checkInQrUrl && (
                      <div className="p-2.5 bg-white rounded-2xl border-2 border-[#2A1450] text-center shrink-0">
                        <img loading="lazy" decoding="async"
                          src={checkInQrUrl}
                          alt="Email E-Ticket QR"
                          className="w-28 h-28 object-contain mx-auto"
                        />
                        <span className="text-[10px] font-extrabold text-[#2A1450] block mt-1">
                          QR สแกนรับเสื้อวันงาน
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#6D28D9] shrink-0" />
                      <div>
                        <div className="font-bold text-slate-500">วันแข่งขัน</div>
                        <div className="font-black">พฤหัสบดี 10 ธ.ค. 2569</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#6D28D9] shrink-0" />
                      <div>
                        <div className="font-bold text-slate-500">เวลาปล่อยตัว</div>
                        <div className="font-black">{meta.startTime}</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#6D28D9] shrink-0" />
                      <div>
                        <div className="font-bold text-slate-500">สถานที่</div>
                        <div className="font-black">ค่ายนเรศวร ชะอำ-หัวหิน</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
