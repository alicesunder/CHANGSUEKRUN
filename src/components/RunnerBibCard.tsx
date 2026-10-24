import React, { useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  Share2,
  Printer,
  CheckCircle,
  Dog,
  Sparkles,
  RotateCw,
  Cpu,
  PhoneCall,
  ShieldCheck,
  MapPin,
  Clock,
  Check,
  Ticket,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Download,
} from 'lucide-react';
import { RunnerProfile } from '../utils/runnerStorage';
import { maskPhoneNumber } from '../utils/securityShield';
import {
  PrintFormatOption,
  downloadOfficialBibAsPng,
} from '../utils/ticketEmailAndPrint';
import { TicketPrintEmailModal } from './TicketPrintEmailModal';
import { PawIcon } from './brand/DogDecor';

interface RunnerBibCardProps {
  profile: RunnerProfile;
  onOpenSimulation?: () => void;
  className?: string;
}

const routeTheme: Record<
  string,
  {
    headerGrad: string;
    cardGrad: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
    wave: string;
    startTime: string;
  }
> = {
  '1km': {
    headerGrad: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 55%, #FB923C 100%)',
    cardGrad: 'linear-gradient(165deg, #FFFDF9 0%, #FFF0E4 55%, #FFE0C8 100%)',
    accent: '#EA580C',
    badgeBg: '#FFEDD5',
    badgeText: '#9A3412',
    wave: 'WAVE D · DOG MINI RUN',
    startTime: '17.30 น.',
  },
  '3km': {
    headerGrad: 'linear-gradient(135deg, #0E4D2D 0%, #1F8A4C 55%, #34C77B 100%)',
    cardGrad: 'linear-gradient(165deg, #F7FEFA 0%, #E3F9EE 55%, #C6F1DC 100%)',
    accent: '#1F8A4C',
    badgeBg: '#DCFCE7',
    badgeText: '#14532D',
    wave: 'WAVE C · DOG BUDDY RUN',
    startTime: '17.15 น.',
  },
  '5km': {
    headerGrad: 'linear-gradient(135deg, #3A1564 0%, #6D2FC4 55%, #F5B800 100%)',
    cardGrad: 'linear-gradient(165deg, #FFFDF4 0%, #FFF6D1 55%, #FFEAA0 100%)',
    accent: '#D48800',
    badgeBg: '#FEF3C7',
    badgeText: '#78350F',
    wave: 'WAVE B · FUN & MASS RUN',
    startTime: '17.00 น.',
  },
  '10km': {
    headerGrad: 'linear-gradient(135deg, #1E0A3C 0%, #5B20A8 55%, #9B51E0 100%)',
    cardGrad: 'linear-gradient(165deg, #FAF6FF 0%, #EFE5FF 55%, #DEC8FC 100%)',
    accent: '#6D2FC4',
    badgeBg: '#F3E8FF',
    badgeText: '#4C1D95',
    wave: 'WAVE A · MINI MARATHON',
    startTime: '16.30 น.',
  },
};

export const RunnerBibCard: React.FC<RunnerBibCardProps> = ({
  profile,
  onOpenSimulation,
  className = '',
}) => {
  const bibCardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [maskPii, setMaskPii] = useState(true);
  const [printEmailModalOpen, setPrintEmailModalOpen] = useState(false);
  const [printEmailInitialTab, setPrintEmailInitialTab] = useState<'print' | 'email'>('print');
  const [printFormatChoice, setPrintFormatChoice] = useState<PrintFormatOption>('full_a4_receipt');

  const theme = routeTheme[profile.routeId] || routeTheme['5km'];

  // Interactive 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 250, damping: 22 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bibCardRef.current) return;
    const rect = bibCardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleOpenPrintFormat = (fmt: PrintFormatOption = 'full_a4_receipt') => {
    setPrintFormatChoice(fmt);
    setPrintEmailInitialTab('print');
    setPrintEmailModalOpen(true);
  };

  const handleOpenEmailPreview = () => {
    setPrintEmailInitialTab('email');
    setPrintEmailModalOpen(true);
  };

  const handleShare = async () => {
    const text = `ฉันสมัคร CHANGSUEK RUN 2027 เรียบร้อยแล้ว! หมายเลข BIB #${profile.bibNumber} ระยะ ${profile.routeName} ร่วมวิ่งด้วยกันนะ! #เห็นช้างวิ่งวิ่งตามช้าง`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CHANGSUEK RUN 2027 BIB',
          text,
          url: window.location.href,
        });
      } catch {
        copyToClipboard(text);
      }
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2600);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 3D Perspective Container */}
      <div className="perspective-1200">
        <motion.div
          ref={bibCardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: isFlipped ? 0 : rotateX,
            rotateY: isFlipped ? 180 : rotateY,
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="relative w-full preserve-3d printable-bib group"
        >
          {/* ========================================================== */}
          {/* FRONT SIDE: OFFICIAL COLLECTIBLE MARATHON BIB PASS         */}
          {/* ========================================================== */}
          <div
            className="relative rounded-[30px] border-[3.5px] border-[#2A1450] shadow-[0_20px_44px_-14px_rgba(42,20,80,0.45),0_7px_0_#2A1450] overflow-hidden backface-hidden"
            style={{ background: theme.cardGrad }}
          >
            {/* Animated Holographic Sheen Sweep */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[28px]"
            >
              <div className="absolute -inset-y-12 w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-ticket-shimmer" />
            </div>

            {/* 4 Corner Metallic Safety-Pin Eyelets */}
            <div className="absolute top-3.5 left-3.5 z-30 w-4 h-4 rounded-full bg-white border-[2.5px] border-[#2A1450] shadow-inner" />
            <div className="absolute top-3.5 right-3.5 z-30 w-4 h-4 rounded-full bg-white border-[2.5px] border-[#2A1450] shadow-inner" />
            <div className="absolute bottom-3.5 left-3.5 z-30 w-4 h-4 rounded-full bg-white border-[2.5px] border-[#2A1450] shadow-inner" />
            <div className="absolute bottom-3.5 right-3.5 z-30 w-4 h-4 rounded-full bg-white border-[2.5px] border-[#2A1450] shadow-inner" />

            {/* Top Color-Coded Wave Banner */}
            <div
              className="relative px-7 pt-5 pb-4 text-white border-b-[3px] border-[#2A1450] flex items-center justify-between gap-3"
              style={{ background: theme.headerGrad }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/35 flex items-center justify-center shrink-0">
                  {profile.runningWithDog ? (
                    <PawIcon size={22} color="#FFC928" />
                  ) : (
                    <Ticket className="w-5 h-5 text-[#FFC928]" />
                  )}
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-extrabold tracking-[0.22em] text-[#FFC928] uppercase">
                    CHANGSUEK RUN 2027 · OFFICIAL BIB
                  </span>
                  <span className="block text-sm sm:text-base font-extrabold text-white leading-tight">
                    เห็นช้างวิ่ง วิ่งตามช้าง • ค่ายนเรศวร
                  </span>
                  <span className="block text-[10px] font-bold text-white/80 mt-0.5">
                    {theme.wave} · ปล่อยตัว {theme.startTime}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                <span className="inline-block px-3.5 py-1 rounded-full text-xs sm:text-sm font-black bg-[#FFC928] text-[#2A1450] border-2 border-[#2A1450] shadow-[2px_2px_0_#2A1450]">
                  {profile.routeId.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-black/30 hover:bg-black/45 text-white px-2.5 py-0.5 rounded-full border border-white/25 transition-colors cursor-pointer"
                >
                  <RotateCw className="w-2.5 h-2.5" />
                  <span>พลิกด้านหลัง BIB</span>
                </button>
              </div>
            </div>

            {/* Main BIB Number Plate */}
            <div className="px-6 py-5">
              <div className="relative text-center py-4 px-4 bg-white/90 backdrop-blur-xs rounded-2xl border-[2.5px] border-[#2A1450] shadow-[4px_5px_0_#2A1450] overflow-hidden">
                {/* Subtle Watermark Paw/Track */}
                <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#6B5A85]">
                  RACE NUMBER / หมายเลขประจำตัวนักวิ่ง
                </div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="font-display text-5xl sm:text-6xl font-black tracking-wider text-[#2A1450] my-1.5 tabular-nums drop-shadow-[0_3px_0_rgba(255,201,40,0.65)]"
                >
                  {profile.bibNumber}
                </motion.div>

                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-0.5 rounded-full font-extrabold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>VERIFIED RUNNER · ลงทะเบียนสำเร็จ</span>
                  </div>
                  <div className="inline-flex items-center justify-center gap-1 text-[10px] text-purple-900 bg-purple-100/90 border border-purple-300 px-2.5 py-0.5 rounded-full font-extrabold">
                    <Lock className="w-3 h-3 text-purple-700" />
                    <span>PDPA PROTECTED</span>
                  </div>
                </div>
              </div>

              {/* Runner Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 text-xs">
                <div className="p-2.5 rounded-xl bg-white/80 border border-[#2A1450]/15">
                  <div className="text-[10px] font-bold text-[#6B5A85] uppercase">
                    ชื่อนักวิ่ง / Runner
                  </div>
                  <div className="font-extrabold text-[#2A1450] truncate text-sm mt-0.5">
                    {profile.fullName || 'นักวิ่งช้างศึก'}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 border border-[#2A1450]/15">
                  <div className="text-[10px] font-bold text-[#6B5A85] uppercase">
                    ไซส์เสื้อ / Jersey
                  </div>
                  <div className="font-extrabold text-[#2A1450] text-sm mt-0.5">
                    Size {profile.shirtSize || 'L'}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-white/80 border border-[#2A1450]/15">
                  <div className="text-[10px] font-bold text-[#6B5A85] uppercase">
                    สถานที่ / Venue
                  </div>
                  <div className="font-extrabold text-[#5B20A8] text-sm mt-0.5 truncate">
                    ค่ายนเรศวร ชะอำ-หัวหิน
                  </div>
                </div>
              </div>

              {/* Dog Runner Companion Pass Strip (if applicable) */}
              {profile.runningWithDog && (
                <div className="mt-3 p-3 rounded-2xl bg-[#DDF7EA] border-2 border-[#2A1450] shadow-[2px_3px_0_#2A1450] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-extrabold text-[#14532D]">
                    <span className="w-7 h-7 rounded-xl bg-[#2EAD62] text-white flex items-center justify-center shrink-0">
                      <PawIcon size={16} color="#fff" />
                    </span>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[#166534]">
                        K9 COMPANION PASS
                      </span>
                      <span>
                        น้อง{profile.dogName || 'เพื่อนซี้สี่ขา'}{' '}
                        {profile.dogBreed ? `(${profile.dogBreed})` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white text-[#14532D] border border-[#14532D]/30 px-2.5 py-1 rounded-full font-extrabold shrink-0">
                    ✓ สิทธิ์เข้าโซน Pet Vet
                  </span>
                </div>
              )}

              {/* Perforated Tear-Off Barcode Footer */}
              <div className="mt-4 pt-3 border-t-2 border-dashed border-[#2A1450]/25 flex items-center justify-between text-[10px] text-[#4B2D78] font-mono">
                <div>
                  <span className="font-extrabold block text-[#2A1450]">
                    CSR-2027-{profile.routeId.toUpperCase()}-{profile.bibNumber}
                  </span>
                  <span className="text-[9px] font-sans font-bold text-[#6B5A85]">
                    RFID TIMING CHIP EMBEDDED · แสดงบัตรนี้ในวันรับ Race Pack
                  </span>
                </div>

                {/* Barcode Graphic */}
                <div className="flex items-end gap-[2px] h-7 opacity-80" aria-hidden="true">
                  {[2.5, 1.5, 3.5, 1.5, 2, 4, 1.5, 2.5, 3, 1.5, 3.5, 2].map((w, i) => (
                    <span
                      key={i}
                      className="bg-[#2A1450] rounded-xs inline-block"
                      style={{ width: `${w}px`, height: i % 2 === 0 ? '100%' : '75%' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* BACK SIDE: RFID TIMING CHIP & EMERGENCY MEDICAL PASS       */}
          {/* ========================================================== */}
          <div
            onClick={() => setIsFlipped(false)}
            style={{
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 rounded-[30px] border-[3.5px] border-[#2A1450] shadow-[0_20px_44px_-14px_rgba(42,20,80,0.45),0_7px_0_#2A1450] bg-gradient-to-b from-[#1E0E36] via-[#2A1450] to-[#170B28] text-white p-6 flex flex-col justify-between backface-hidden cursor-pointer overflow-hidden"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#FFC928]" />
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#FFC928] block">
                    RFID TIMING TRANSPONDER
                  </span>
                  <span className="text-sm font-extrabold">
                    ด้านหลังป้าย BIB #{profile.bibNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="inline-flex items-center gap-1 text-xs font-extrabold bg-[#FFC928] text-[#2A1450] px-3 py-1 rounded-full cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>พลิกด้านหน้า</span>
              </button>
            </div>

            {/* Simulated RFID Foam Strip with Scanning Laser */}
            <div className="my-3 relative rounded-2xl bg-white/10 border-2 border-dashed border-[#FFC928]/60 p-4 text-center overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-[#FFC928]/40 to-transparent animate-scan-laser" />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC928]/20 text-[#FFC928] text-xs font-extrabold mb-1">
                <Cpu className="w-4 h-4" />
                <span>ACTIVE UHF RFID CHIP · DO NOT BEND</span>
              </div>
              <p className="text-xs text-white/80 font-medium">
                ห้ามพับหรือเจาะรูทับแถบชิปจับเวลา เพื่อความแม่นยำในการบันทึกสถิติที่จุด Start และ Finish
              </p>
            </div>

            {/* Emergency & Medical Info Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white/10 border border-white/15">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-[10px] text-white/60 font-bold uppercase flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-[#FFC928]" />
                    <span>เบอร์ฉุกเฉิน (PDPA)</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaskPii((prev) => !prev);
                    }}
                    title={maskPii ? 'แสดงเบอร์เต็ม' : 'ซ่อนเบอร์โทรป้องกันข้อมูลรั่วไหล'}
                    className="text-[10px] font-bold text-[#FFC928] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    {maskPii ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{maskPii ? 'ดูเบอร์' : 'ซ่อน'}</span>
                  </button>
                </div>
                <div className="font-bold text-white mt-0.5 tabular-nums">
                  {maskPii
                    ? maskPhoneNumber(profile.emergencyPhone || profile.phone || '081-890-2027')
                    : profile.emergencyPhone || profile.phone || '081-890-2027'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/15">
                <div className="text-[10px] text-white/60 font-bold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>หน่วยแพทย์กู้ชีพค่ายนเรศวร</span>
                </div>
                <div className="font-bold text-emerald-300 mt-0.5 tabular-nums">
                  032-471-299 (24 ชม.)
                </div>
              </div>
            </div>

            <div className="text-center text-[11px] text-white/65 pt-2 border-t border-white/10">
              แตะที่การ์ดเพื่อพลิกกลับด้านหน้า • CHANGSUEK RUN 2027
            </div>
          </div>
        </motion.div>
      </div>

      {/* Inline Toast Notification for Copy */}
      {copiedToast && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md"
        >
          <Check className="w-4 h-4" />
          <span>คัดลอกข้อความและลิงก์สำหรับแชร์ BIB เรียบร้อยแล้ว!</span>
        </motion.div>
      )}

      {/* Action Buttons: Flip, Print (3 Formats), Email E-Ticket, Download PNG, Share, Simulate */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleOpenPrintFormat('full_a4_receipt')}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#FFC928] hover:bg-[#FFD646] text-[#2A1450] border-2 border-[#2A1450] font-black text-xs shadow-[0_3px_0_#2A1450] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4 stroke-[2.5]" />
          <span>เลือกแบบ Print / PDF (3 แบบ)</span>
        </button>

        <button
          type="button"
          onClick={handleOpenEmailPreview}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#2A1450] font-extrabold text-xs shadow-[0_3px_0_#2A1450] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          <span>ดูบัตรในอีเมล / ส่งซ้ำ</span>
        </button>

        <button
          type="button"
          onClick={() => downloadOfficialBibAsPng(profile)}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-[#5B20A8] border-2 border-[#2A1450] font-extrabold text-xs shadow-[0_3px_0_#2A1450] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>โหลดรูป BIB (.PNG)</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFlipped((f) => !f)}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-[#2A1450] border-2 border-[#2A1450] font-extrabold text-xs shadow-[0_3px_0_#2A1450] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <RotateCw className="w-4 h-4 text-[#7B3FC6]" />
          <span>{isFlipped ? 'ดูด้านหน้า BIB' : 'พลิกดูชิป RFID'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#5B20A8] hover:bg-[#4A188A] text-white border-2 border-[#2A1450] font-extrabold text-xs shadow-[0_3px_0_#2A1450] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>แชร์บัตรวิ่ง</span>
        </button>

        {onOpenSimulation && (
          <button
            type="button"
            onClick={onOpenSimulation}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-[#17151C] border-2 border-[#2A1450] font-black text-xs shadow-[0_3px_0_#2A1450] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span>▶ จำลองเส้นทาง</span>
          </button>
        )}
      </div>

      <TicketPrintEmailModal
        isOpen={printEmailModalOpen}
        onClose={() => setPrintEmailModalOpen(false)}
        profile={profile}
        initialMode={printEmailInitialTab}
        initialPrintFormat={printFormatChoice}
      />
    </div>
  );
};
