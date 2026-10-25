import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import {
  X,
  Check,
  Minus,
  Plus,
  UserPlus,
  User,
  Phone,
  Mail,
  ShieldAlert,
  Shirt,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Medal,
  Ticket,
  QrCode,
  CheckCircle2,
  CreditCard,
  Download,
  Copy,
  ShieldCheck,
  IdCard,
  FileText,
  Printer,
  Upload,
  RotateCcw,
  AlertTriangle,
  ScanLine,
  Timer,
  Building2,
  Eye,
  Trophy,
  PartyPopper,
} from 'lucide-react';
import { RouteId } from '../types';
import { DogCharacter, ElephantCharacter } from './brand/BrandCharacters';
import { PawIcon } from './brand/DogDecor';
import { LABRADOR_SVG_PATH, LabradorMascot } from './brand/LabradorMascot';
import { playVictoryCelebrationSound } from '../utils/ticketSoundFx';
import { TicketOrder, saveRunnerProfile } from '../utils/runnerStorage';
import { openPrivacyNotice } from './PrivacyNotice';
import { openTerms } from './TermsSection';
import {
  PendingOrderRef,
  PublicConfig,
  ServerOrder,
  createOrder,
  fetchOrder,
  fetchQrObjectUrl,
  renewQr,
  getPublicConfig,
  loadPendingOrderRef,
  savePendingOrderRef,
} from '../utils/api';
import {
  ticketById,
  isDogCategory,
  calcTicketTotal,
  formatBaht,
} from '../data/eventData';
import {
  PrintFormatOption,
  EmailDeliveryLog,
  dispatchAutomatedTicketEmail,
  generateTicketCheckInQrDataUrl,
  downloadOfficialBibAsPng,
} from '../utils/ticketEmailAndPrint';
import { TicketPrintEmailModal } from './TicketPrintEmailModal';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoute?: RouteId;
  initialExtraPeople?: number;
  initialExtraDogs?: number;
  onRegistrationSuccess?: () => void;
  onOpenAdminModal?: () => void;
}

const ROUTE_THEME: Record<
  RouteId,
  {
    grad: string;
    headerGrad: string;
    badgeBg: string;
    badgeText: string;
    borderActive: string;
    startTime: string;
  }
> = {
  '10km': {
    grad: 'linear-gradient(145deg, #FFFFFF 0%, #F3E8FF 100%)',
    headerGrad: 'linear-gradient(135deg, #6366F1 0%, #9333EA 52%, #EC4899 100%)',
    badgeBg: '#7C3AED',
    badgeText: '#FFFFFF',
    borderActive: '#8B5CF6',
    startTime: '16.30 น.',
  },
  '5km': {
    grad: 'linear-gradient(145deg, #FFFFFF 0%, #FEF3C7 100%)',
    headerGrad: 'linear-gradient(135deg, #F59E0B 0%, #FF6B6B 100%)',
    badgeBg: '#D97706',
    badgeText: '#FFFFFF',
    borderActive: '#F59E0B',
    startTime: '17.00 น.',
  },
  '3km': {
    grad: 'linear-gradient(145deg, #FFFFFF 0%, #CCFBF1 100%)',
    headerGrad: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
    badgeBg: '#0D9488',
    badgeText: '#FFFFFF',
    borderActive: '#10B981',
    startTime: '17.15 น.',
  },
  '1km': {
    grad: 'linear-gradient(145deg, #FFFFFF 0%, #FFE4D6 100%)',
    headerGrad: 'linear-gradient(135deg, #FF7A59 0%, #FF4E88 100%)',
    badgeBg: '#F43F5E',
    badgeText: '#FFFFFF',
    borderActive: '#FF5A5F',
    startTime: '17.30 น.',
  },
};

// Square icons cropped from the distance illustrations so each ticket shows its own runner(s)
const TICKET_ICONS: Record<RouteId, { src: string; alt: string }> = {
  '10km': { src: '/images/distances/icon-10k.webp', alt: 'นักวิ่ง 10 กม. บนถนนเลียบชายฝั่ง' },
  '5km': { src: '/images/distances/icon-5k.webp', alt: 'นักวิ่ง 5 กม. คู่หนึ่งวิ่งริมหาด' },
  '3km': { src: '/images/distances/icon-3k.webp', alt: 'นักวิ่งกับน้องสุนัขระยะ 3.8 กม. ริมหาด' },
  '1km': { src: '/images/distances/icon-1k.webp', alt: 'น้องสุนัขวิ่งระยะ 1 กม.' },
};

const SHIRT_SIZES = [
  { size: 'XS', chest: '34"' },
  { size: 'S', chest: '36"' },
  { size: 'M', chest: '38"' },
  { size: 'L', chest: '40"' },
  { size: 'XL', chest: '42"' },
  { size: '2XL', chest: '44"' },
  { size: '3XL', chest: '46"' },
];

const inputCls =
  'w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-[#2A1450]/20 bg-white text-sm font-semibold text-[#2A1450] placeholder-[#6B5A85]/50 focus:outline-none focus:border-[#6D28D9] focus:ring-4 focus:ring-[#6D28D9]/15 transition-all';
const labelCls = 'block text-xs font-extrabold text-[#2A1450] mb-1.5';

const Stepper: React.FC<{
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
  icon: React.ReactNode;
  max?: number;
}> = ({ label, hint, value, onChange, icon, max = 9 }) => (
  <div className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-2xl bg-white border-2 border-[#2A1450]/15">
    <div className="flex items-center gap-3 min-w-0">
      <span className="w-10 h-10 rounded-xl bg-[#F4ECFF] border-2 border-[#2A1450] flex items-center justify-center shrink-0 text-[#5B20A8]">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-extrabold text-[#2A1450]">{label}</div>
        <div className="text-xs font-bold text-[#6B5A85]">{hint}</div>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        aria-label={`ลด${label}`}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        className="w-8 h-8 rounded-full border-2 border-[#2A1450] bg-white flex items-center justify-center disabled:opacity-30 hover:bg-[#F3E8FF] active:scale-90 transition cursor-pointer"
      >
        <Minus className="w-4 h-4 stroke-[2.5]" />
      </button>
      <span
        key={value}
        className="w-6 text-center font-display text-lg font-black text-[#2A1450] tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`เพิ่ม${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-full border-2 border-[#2A1450] bg-[#FFC928] flex items-center justify-center disabled:opacity-30 hover:bg-[#FFD84D] active:scale-90 transition cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  </div>
);

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  initialRoute = '5km',
  initialExtraPeople = 0,
  initialExtraDogs = 0,
  onRegistrationSuccess,
  onOpenAdminModal,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<RouteId>(initialRoute);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [extraPeople, setExtraPeople] = useState(0);
  const [extraDogs, setExtraDogs] = useState(0);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [shirtSize, setShirtSize] = useState('L');
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [extraRunnerNames, setExtraRunnerNames] = useState('');

  // Server-backed order & payment state (the server decides price, payment status and BIB)
  const [publicCfg, setPublicCfg] = useState<PublicConfig | null>(null);
  const promptPayConfig = {
    promptPayId: publicCfg?.promptPayId || '',
    accountName: publicCfg?.accountName || '',
    bankLabel: publicCfg?.bankLabel || '',
    bankAccountNo: publicCfg?.bankAccountNo || '',
  };
  const [pendingRef, setPendingRef] = useState<PendingOrderRef | null>(null);
  const [serverOrder, setServerOrder] = useState<ServerOrder | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<TicketOrder | null>(null);

  // Payment timer (informational — a late transfer can still be submitted)
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [qrShownUntil, setQrShownUntil] = useState<number>(0);

  const [celebrationKey, setCelebrationKey] = useState<number>(1);

  // Step 4 Email & Print States
  const [ticketCheckInQrUrl, setTicketCheckInQrUrl] = useState<string>('');
  const [emailLog, setEmailLog] = useState<EmailDeliveryLog | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);
  const [printModalTab, setPrintModalTab] = useState<'print' | 'email'>('print');
  const [selectedPrintFormat, setSelectedPrintFormat] =
    useState<PrintFormatOption>('full_a4_receipt');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ticket = ticketById(selectedRoute);
  const theme = ROUTE_THEME[selectedRoute];
  const isDog = isDogCategory(selectedRoute);
  const total = calcTicketTotal(selectedRoute, extraPeople, extraDogs);
  const dogCount = isDog ? 1 + extraDogs : 0;
  const peopleCount = isDog ? 1 + extraPeople : 1;
  // Amount to pay always comes from the server order once it exists.
  const payAmount = serverOrder?.totalPrice ?? total;
  const nextBibPreview = publicCfg?.nextBib?.[selectedRoute] ?? '—';

  const totalTimeoutSec = Math.max(1, publicCfg?.paymentTimeoutMinutes || 15) * 60;
  const deadlineMs = Math.max(
    serverOrder ? new Date(serverOrder.expiresAt).getTime() : 0,
    qrShownUntil
  );
  const remainingSeconds = serverOrder ? Math.max(0, Math.floor((deadlineMs - nowMs) / 1000)) : totalTimeoutSec;

  /** Payment confirmed by the server -> show the ticket. */
  const finalizePaidOrder = async (order: ServerOrder) => {
    savePendingOrderRef(null);
    setPendingRef(null);
    saveRunnerProfile(order);
    const [qrCheckIn, sentLog] = await Promise.all([
      generateTicketCheckInQrDataUrl(order),
      dispatchAutomatedTicketEmail(order),
    ]);
    setTicketCheckInQrUrl(qrCheckIn);
    setEmailLog(sentLog);
    setCreatedOrder(order);
    setCelebrationKey((prev) => prev + 1);
    playVictoryCelebrationSound(true);
    setStep(4);
  };

  /** Restore form fields from a server order (used when resuming an unfinished payment). */
  const restoreFromOrder = (o: ServerOrder) => {
    setSelectedRoute(o.routeId);
    setExtraPeople(o.extraPeople || 0);
    setExtraDogs(o.extraDogs || 0);
    setFullName(o.fullName || '');
    setPhone(o.phone || '');
    setEmail(o.email || '');
    setEmergencyPhone(o.emergencyPhone || '');
    setShirtSize(o.shirtSize || 'L');
    setDogName(o.dogName || '');
    setDogBreed(o.dogBreed || '');
    setExtraRunnerNames(o.extraRunnerNames || '');
  };

  // On open: reset, load public config, and resume any unfinished order from this browser.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setSelectedRoute(initialRoute);
    setStep(1);
    setExtraPeople(initialExtraPeople);
    setExtraDogs(initialExtraDogs);
    setServerOrder(null);
    setPendingRef(null);
    setFormError(null);
    setCreatedOrder(null);
    setEmailLog(null);
    setTicketCheckInQrUrl('');
    setQrShownUntil(0);

    getPublicConfig(true)
      .then((cfg) => !cancelled && setPublicCfg(cfg))
      .catch(() => {});

    const saved = loadPendingOrderRef();
    if (saved) {
      fetchOrder(saved)
        .then((o) => {
          if (cancelled) return;
          if (o.paymentStatus === 'PAID') {
            restoreFromOrder(o);
            finalizePaidOrder(o);
            return;
          }
          restoreFromOrder(o);
          setPendingRef(saved);
          setServerOrder(o);
          setStep(3);
        })
        .catch(() => savePendingOrderRef(null));
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialRoute, initialExtraPeople, initialExtraDogs]);

  // Close with Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !printModalOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, printModalOpen]);

  // 1-second clock while on the payment step
  useEffect(() => {
    if (!isOpen || step !== 3) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, step]);

  // Omise QR, loaded through our server so it can be saved/downloaded on a phone
  const [qrError, setQrError] = useState<string | null>(null);
  const [isRenewingQr, setIsRenewingQr] = useState(false);
  useEffect(() => {
    if (!isOpen || step !== 3 || !pendingRef || !serverOrder?.omiseChargeId) return;
    let objectUrl = '';
    let cancelled = false;
    setQrDataUrl('');
    setQrError(null);
    fetchQrObjectUrl(pendingRef)
      .then((u) => {
        objectUrl = u;
        if (!cancelled) setQrDataUrl(u);
      })
      .catch(() => !cancelled && setQrError('โหลด QR ไม่สำเร็จ กรุณากด "สร้าง QR ใหม่"'));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, step, pendingRef?.orderId, serverOrder?.omiseChargeId]);

  const handleRenewQr = async () => {
    if (!pendingRef || isRenewingQr) return;
    setIsRenewingQr(true);
    setQrError(null);
    try {
      const o = await renewQr(pendingRef);
      setServerOrder(o);
      setQrShownUntil(0);
      setNowMs(Date.now());
      if (o.paymentStatus === 'PAID') finalizePaidOrder(o);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'สร้าง QR ใหม่ไม่สำเร็จ');
    } finally {
      setIsRenewingQr(false);
    }
  };

  // Poll the server for payment confirmation (Omise or admin approval)
  useEffect(() => {
    if (!isOpen || step !== 3 || !pendingRef) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const o = await fetchOrder(pendingRef);
        if (cancelled) return;
        setServerOrder(o);
        if (o.paymentStatus === 'PAID') {
          cancelled = true;
          finalizePaidOrder(o);
        }
      } catch {
        // transient network error — try again next tick
      }
    };
    const interval = window.setInterval(poll, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isOpen, step, pendingRef?.orderId]);

  if (!isOpen) return null;

  const pickTicket = (id: RouteId) => {
    setSelectedRoute(id);
    if (!isDogCategory(id)) {
      setExtraPeople(0);
      setExtraDogs(0);
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingOrder) return;
    setFormError(null);
    setIsCreatingOrder(true);
    try {
      const res = await createOrder({
        routeId: selectedRoute,
        extraPeople,
        extraDogs,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        emergencyPhone: emergencyPhone.trim(),
        shirtSize,
        dogName: isDog ? dogName.trim() : undefined,
        dogBreed: isDog ? dogBreed.trim() : undefined,
        extraRunnerNames: extraPeople > 0 ? extraRunnerNames.trim() : undefined,
        privacyConsent,
      });
      const ref = { orderId: res.order.orderId, accessToken: res.accessToken };
      savePendingOrderRef(ref);
      setPendingRef(ref);
      setServerOrder(res.order);
      setPublicCfg(res.config);
            setNowMs(Date.now());
      setStep(3);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'สร้างคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleCancelPendingOrder = () => {
    savePendingOrderRef(null);
    setPendingRef(null);
    setServerOrder(null);
    setStep(1);
  };

  const handleCopyPromptPayId = () => {
    navigator.clipboard.writeText(serverOrder?.orderId || '');
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2200);
  };

  // Saves the QR as a real PNG (Omise serves SVG, which phone galleries and bank apps can't open)
  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const img = new Image();
    img.onload = () => {
      const size = 720;
      const pad = 40;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CHANGSUEK_RUN_${serverOrder?.orderId || selectedRoute}_${payAmount}THB.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }, 'image/png');
    };
    img.src = qrDataUrl;
  };

  // Format MM:SS countdown
  const formatCountdown = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const timerProgressPct =
    totalTimeoutSec > 0 ? Math.max(0, Math.min(100, (remainingSeconds / totalTimeoutSec) * 100)) : 0;
  const isTimerExpired = remainingSeconds <= 0;
  const isTimerLow = remainingSeconds > 0 && remainingSeconds <= 180;

  const steps = [
    { num: 1, title: 'เลือกระยะวิ่ง', sub: 'Package & Add-on' },
    { num: 2, title: 'ข้อมูลนักวิ่ง', sub: 'Runner & Shirt' },
    { num: 3, title: 'สแกนจ่าย', sub: 'PromptPay QR' },
    { num: 4, title: 'รับเลข BIB', sub: 'Auto E-BIB' },
  ];

  const renderTicketOption = (id: RouteId) => {
    const t = ticketById(id);
    const rTheme = ROUTE_THEME[id];
    const on = selectedRoute === id;
    const routeNextBib = publicCfg?.nextBib?.[id] ?? '—';

    return (
      <button
        key={id}
        type="button"
        onClick={() => pickTicket(id)}
        style={{
          background: on ? rTheme.grad : '#FFFFFF',
          borderColor: on ? rTheme.borderActive : 'rgba(123, 63, 198, 0.16)',
          boxShadow: on
            ? `0 16px 32px -12px ${rTheme.borderActive}55, 0 0 0 2px ${rTheme.borderActive}`
            : '0 8px 20px -10px rgba(42, 20, 80, 0.12)',
        }}
        className={`group relative text-left rounded-2xl p-3.5 transition-all cursor-pointer overflow-hidden border-2 ${
          on ? '-translate-y-0.5' : 'hover:bg-[#FAF8FF]'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <img
              src={TICKET_ICONS[id].src}
              alt={TICKET_ICONS[id].alt}
              width={56}
              height={56}
              loading="lazy"
              style={{ borderColor: on ? rTheme.borderActive : 'rgba(123, 63, 198, 0.18)' }}
              className="w-14 h-14 rounded-2xl object-cover border-2 shadow-xs shrink-0 bg-white"
            />
            <div>
              <span
                style={{
                  backgroundColor: on ? rTheme.badgeBg : '#F3E8FF',
                  color: on ? rTheme.badgeText : '#4B2D78',
                }}
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
              >
                {t.category === 'dog' ? '🐾 วิ่งกับน้องสุนัข' : '🏃 บุคคลทั่วไป'}
              </span>
              <div className="font-display text-xl font-black text-[#261247] leading-tight mt-0.5">
                {t.distanceLabel}
              </div>
            </div>
          </div>

          <span
            style={{
              backgroundColor: on ? rTheme.badgeBg : '#FFFFFF',
              borderColor: on ? rTheme.badgeBg : '#D8B4FE',
            }}
            className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform"
          >
            {on && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-2 border-t border-[#261247]/10">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[#4B2D78] flex items-center gap-1">
              <Clock className="w-3 h-3" /> ปล่อยตัว {rTheme.startTime}
            </span>
            <span className="text-[10px] font-mono font-extrabold text-[#6D28D9] mt-0.5">
              BIB ถัดไป: #{routeNextBib}
            </span>
          </div>
          <div className="text-right">
            <span className="font-display text-lg font-black text-[#261247] tabular-nums">
              {formatBaht(t.basePrice)}
            </span>
            <span className="text-[10px] font-extrabold text-[#4B2D78] ml-0.5">บาท</span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-[#140826]/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto rounded-[28px] sm:rounded-[34px] border border-white/40 shadow-[0_32px_80px_-16px_rgba(20,8,38,0.65)] overflow-hidden bg-gradient-to-b from-[#FAF8FF] to-[#F4EEFF] text-[#261247] max-h-[95vh] flex flex-col">
        {/* ============================================================ */}
        {/* TOP LUMINOUS FESTIVAL HEADER WITH LABRADOR & 4-STEP BAR      */}
        {/* ============================================================ */}
        <div className="relative bg-gradient-to-r from-[#240D47] via-[#431B7A] to-[#2B1055] text-white px-5 sm:px-7 pt-4 pb-4 border-b border-white/15 shrink-0 overflow-hidden">
          {/* Ambient Light Glows in Modal Header */}
          <div className="absolute -top-16 right-1/4 w-56 h-56 rounded-full bg-[#FFC928]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-10 w-56 h-56 rounded-full bg-[#EC4899]/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-white/95 border-2 border-[#FFE268] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.35)] flex items-center justify-center shrink-0 overflow-hidden">
                <img loading="lazy" decoding="async"
                  src={LABRADOR_SVG_PATH}
                  alt="น้องสุนัขลาบราดอร์ต้อนรับ"
                  className="w-12 h-12 object-contain translate-y-0.5"
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FFE268]">
                  <Sparkles className="w-3 h-3" />
                  <span>CHANGSUEK RUN 2027 · SMART E-TICKET & AUTO-BIB</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                  สมัครวิ่ง & รับบัตรวิ่ง E-BIB
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#FFE268] text-white hover:text-[#261247] border border-white/25 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* 4-Step Visual Progress Bar */}
          <div className="relative z-10 grid grid-cols-4 gap-2 mt-3.5">
            {steps.map((s) => {
              const isCurrent = step === s.num;
              const isDone = step > s.num;
              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#FFE268] to-[#FFC928] text-[#261247] border-white shadow-[0_8px_20px_-6px_rgba(255,201,40,0.55)]'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                      : 'bg-white/10 text-white/65 border-white/10'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-[#261247] text-[#FFE268]'
                        : isDone
                        ? 'bg-emerald-400 text-[#14532D]'
                        : 'bg-white/15 text-white/80'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                  </span>
                  <div className={`min-w-0 ${isCurrent ? '' : 'hidden sm:block'}`}>
                    <div className="text-[11px] sm:text-xs font-extrabold truncate leading-tight">
                      {s.title}
                    </div>
                    <div
                      className={`text-[9px] font-bold truncate hidden sm:block ${
                        isCurrent ? 'text-[#261247]/80' : 'text-white/50'
                      }`}
                    >
                      {s.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SCROLLABLE BODY                                              */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* ---------------------------------------------------------- */}
          {/* STEP 1: CHOOSE DISTANCE & PACKAGE                          */}
          {/* ---------------------------------------------------------- */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left 7 cols: 4 Distance Selectors + Add-on Steppers */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#6D28D9]">
                      1. เลือกระยะวิ่งบุคคลทั่วไป (General Run)
                    </span>
                    <span className="text-[11px] font-bold text-[#6B5A85]">
                      รันเลข BIB `10-XXXX` และ `05-XXXX`
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderTicketOption('10km')}
                    {renderTicketOption('5km')}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                      <PawIcon size={14} color="#0D9488" />
                      <span>2. เลือกระยะวิ่งร่วมกับน้องสุนัข (Dog Run)</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#0F766E]">
                      รันเลข BIB `03-XXXX` และ `01-XXXX`
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderTicketOption('3km')}
                    {renderTicketOption('1km')}
                  </div>
                </div>

                {/* Add-ons for Dog Run */}
                {isDog ? (
                  <div className="rounded-3xl bg-white/90 border border-[#7B3FC6]/20 shadow-[0_14px_30px_-14px_rgba(91,32,168,0.18)] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-[#261247] flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-[#6D28D9]" />
                        <span>เพิ่มผู้ร่วมวิ่ง / น้องสุนัขเพิ่มในแพ็กเกจเดียวกัน</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#6D28D9] bg-[#F3E8FF] px-2.5 py-0.5 rounded-full">
                        ตัวเลือกเสริม
                      </span>
                    </div>

                    <Stepper
                      label="เพิ่มผู้ร่วมวิ่ง"
                      hint={`+${formatBaht(ticket.extraPersonPrice ?? ticket.addPersonPrice ?? 2)} บาท / คน (รับเสื้อ + เหรียญเพิ่ม)`}
                      value={extraPeople}
                      onChange={setExtraPeople}
                      icon={<UserPlus className="w-5 h-5" />}
                    />
                    <Stepper
                      label="เพิ่มน้องสุนัขร่วมวิ่ง"
                      hint={`+${formatBaht(ticket.extraDogPrice ?? ticket.addDogPrice ?? 1)} บาท / ตัว (รับผ้าพันคอ K9 เพิ่ม)`}
                      value={extraDogs}
                      onChange={setExtraDogs}
                      icon={
                        <img loading="lazy" decoding="async"
                          src={LABRADOR_SVG_PATH}
                          alt="Dog"
                          className="w-7 h-7 object-contain"
                        />
                      }
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/90 border border-[#7B3FC6]/15 shadow-xs p-3.5 flex items-center gap-3 text-xs font-bold text-[#4B2D78]">
                    <span className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
                      <Medal className="w-5 h-5 text-[#B45309]" />
                    </span>
                    <span>
                      ระยะ <strong>{ticket.distanceLabel}</strong> สำหรับนักวิ่งบุคคลทั่วไป 1 ท่าน (รวมเสื้อวิ่ง Jersey, ป้าย BIB ชิปจับเวลา และเหรียญรางวัล Finisher)
                    </span>
                  </div>
                )}
              </div>

              {/* Right 5 cols: Live Pass Summary Card with Animated Labrador */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl border border-[#7B3FC6]/25 bg-white shadow-[0_22px_48px_-14px_rgba(67,28,130,0.22)] overflow-hidden">
                  <div
                    style={{ background: theme.headerGrad }}
                    className="p-4 text-white flex items-center justify-between relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/90 block">
                        SELECTED PASS SUMMARY
                      </span>
                      <h3 className="text-xl font-black leading-tight mt-0.5">{ticket.name}</h3>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-black/25 backdrop-blur-xs text-xs font-black border border-white/30">
                        {ticket.distanceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Next Auto-BIB Preview Banner + Labrador Mascot */}
                  <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-r from-[#FAF5FF] to-[#FFFBEB] border border-dashed border-[#8B5CF6]/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img loading="lazy" decoding="async"
                        src={LABRADOR_SVG_PATH}
                        alt="Labrador Mascot"
                        className="w-11 h-11 object-contain shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6D28D9] block">
                          หมายเลข BIB ถัดไปของคุณ
                        </span>
                        <span className="text-[11px] font-bold text-[#4B2D78]">
                          ล็อกเลขทันทีที่สแกนจ่ายสำเร็จ
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xl font-black text-[#261247] bg-[#FFE268] px-3 py-1 rounded-xl border border-amber-400 shadow-xs tabular-nums">
                      #{nextBibPreview}
                    </span>
                  </div>

                  {/* Breakdown */}
                  <div className="p-4 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#4B2D78]">
                        <Calendar className="w-3.5 h-3.5" /> 9 ม.ค. 2570
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400E]">
                        <Clock className="w-3.5 h-3.5" /> ปล่อยตัว {theme.startTime}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900">
                        ผู้วิ่ง {peopleCount} คน {isDog ? `· น้องสุนัข ${dogCount} ตัว` : ''}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[#261247]/10 text-xs font-bold text-[#4B2D78]">
                      <div className="flex justify-between">
                        <span>ค่าสมัครหลัก ({ticket.distanceLabel})</span>
                        <span className="font-extrabold text-[#261247] tabular-nums">
                          {formatBaht(ticket.basePrice)} บาท
                        </span>
                      </div>
                      {isDog && extraPeople > 0 && (
                        <div className="flex justify-between">
                          <span>ผู้ร่วมวิ่งเพิ่ม × {extraPeople} คน</span>
                          <span className="font-extrabold text-[#261247] tabular-nums">
                            +{formatBaht(extraPeople * (ticket.extraPersonPrice ?? ticket.addPersonPrice ?? 2))} บาท
                          </span>
                        </div>
                      )}
                      {isDog && extraDogs > 0 && (
                        <div className="flex justify-between">
                          <span>น้องสุนัขเพิ่ม × {extraDogs} ตัว</span>
                          <span className="font-extrabold text-[#261247] tabular-nums">
                            +{formatBaht(extraDogs * (ticket.extraDogPrice ?? ticket.addDogPrice ?? 1))} บาท
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total Box */}
                    <div className="rounded-2xl bg-gradient-to-r from-[#240D47] to-[#3B1870] text-white p-3.5 flex items-center justify-between shadow-md">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFE268] block">
                          ยอดชำระสุทธิ (PromptPay QR)
                        </span>
                        <span className="text-xs text-white/80 font-bold">
                          รวมเสื้อวิ่ง + เหรียญ + E-BIB
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-display text-3xl font-black text-[#FFE268] tabular-nums">
                          {formatBaht(total)}
                        </span>
                        <span className="text-xs font-bold text-white ml-1">บาท</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FFE268] via-[#FFC928] to-[#F59E0B] hover:brightness-105 text-[#261247] font-black text-base border-2 border-[#261247] luminous-pill-btn active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>ดำเนินการต่อ · กรอกข้อมูลผู้สมัคร</span>
                      <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/* STEP 2: RUNNER INFORMATION & SHIRT SIZE                    */}
          {/* ---------------------------------------------------------- */}
          {step === 2 && (
            <form onSubmit={handleProceedToPayment} className="space-y-5">
              {/* Main Registration Container */}
              <div className="relative bg-white rounded-3xl border-[3px] border-[#2A1450] px-4 sm:px-6 py-5 space-y-5 shadow-[0_8px_0_#2A1450]">
                {/* Header Banner */}
                <div className="rounded-2xl bg-[#FAF7FF] border-2 border-[#2A1450] p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      style={{ background: theme.headerGrad }}
                      className="px-3 py-1.5 rounded-xl text-white font-display font-black text-sm border border-[#2A1450]"
                    >
                      {ticket.distanceLabel}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-[#2A1450]">
                          ข้อมูลผู้สมัครวิ่ง ({ticket.name})
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#6B5A85] mt-0.5">
                        ผู้วิ่ง {peopleCount} คน {isDog ? `· น้องสุนัข ${dogCount} ตัว` : ''} · เลข BIB ถัดไป (ออกจริงหลังชำระเงิน){' '}
                        <strong className="font-mono text-[#6D28D9]">#{nextBibPreview}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold uppercase text-[#6B5A85] block">
                        ยอดชำระสุทธิ
                      </span>
                      <span className="font-display text-xl font-black text-[#2A1450] tabular-nums">
                        {formatBaht(total)} บาท
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-3 py-1.5 rounded-xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#4B2D78] text-xs font-extrabold border border-[#2A1450]/20 cursor-pointer"
                    >
                      เปลี่ยนระยะ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
                  {/* Runner Personal Info (7 cols) */}
                  <div className="lg:col-span-7 bg-[#FAF7FF] rounded-3xl border-2 border-[#2A1450]/20 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-dashed border-[#2A1450]/15">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#6D28D9]" />
                        <h3 className="text-sm font-black text-[#2A1450] uppercase tracking-wider">
                          ส่วนที่ 1: ข้อมูลผู้สมัครหลัก (พิมพ์ลงป้าย BIB)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-extrabold text-[#6D28D9] bg-[#F3E8FF] px-2 py-0.5 rounded">
                        BIB #{nextBibPreview}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>ชื่อ - นามสกุล (Full Name) *</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#6B5A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="เช่น สมชาย ใจดี"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>เบอร์โทรศัพท์ติดต่อ *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[#6B5A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="08x-xxx-xxxx"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>เบอร์ติดต่อฉุกเฉิน *</label>
                        <div className="relative">
                          <ShieldAlert className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            placeholder="08x-xxx-xxxx (ญาติ/คนใกล้ชิด)"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className={labelCls}>อีเมลรับใบเสร็จ & E-BIB *</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#6B5A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>

                    {extraPeople > 0 && (
                      <div className="pt-2">
                        <label className={labelCls}>
                          รายชื่อผู้ร่วมวิ่งเพิ่ม ({extraPeople} ท่าน) & ไซส์เสื้อ
                        </label>
                        <input
                          type="text"
                          value={extraRunnerNames}
                          onChange={(e) => setExtraRunnerNames(e.target.value)}
                          placeholder="เช่น นภา ใจดี (ไซส์ M), กานต์ ใจดี (ไซส์ XL)"
                          className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#2A1450]/20 bg-white text-sm font-semibold text-[#2A1450]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right 5 cols: Shirt Size Visual Selector + Dog Info */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Interactive Shirt Size Grid */}
                    <div className="bg-white/95 rounded-3xl border-2 border-[#2A1450]/25 p-4 sm:p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black uppercase tracking-wider text-[#2A1450] flex items-center gap-1.5">
                          <Shirt className="w-4 h-4 text-[#6D28D9]" />
                          <span>เลือกไซส์เสื้อวิ่ง (Jersey Size)</span>
                        </span>
                        <span className="text-[11px] font-bold text-[#6D28D9]">
                          เลือกแล้ว: ไซส์ {shirtSize}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {SHIRT_SIZES.map((s) => {
                          const active = shirtSize === s.size;
                          return (
                            <button
                              key={s.size}
                              type="button"
                              onClick={() => setShirtSize(s.size)}
                              className={`py-2 px-2 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                active
                                  ? 'bg-[#2A1450] text-[#FFC928] border-[#2A1450] shadow-[0_3px_0_#6D28D9] -translate-y-0.5'
                                  : 'bg-[#FAF7FF] text-[#2A1450] border-[#2A1450]/15 hover:border-[#2A1450]'
                              }`}
                            >
                              <div className="font-display text-sm font-black">{s.size}</div>
                              <div
                                className={`text-[10px] font-bold ${
                                  active ? 'text-white/80' : 'text-[#6B5A85]'
                                }`}
                              >
                                อก {s.chest}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dog Buddy Details (if 1K / 3.8K) */}
                    {isDog && (
                      <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-white rounded-3xl border border-emerald-200 p-4 sm:p-5 space-y-3 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.14)] relative overflow-hidden">
                        <div className="flex items-center justify-between gap-2 text-[#14532D]">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center">
                              <PawIcon size={15} color="#059669" />
                            </span>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                                ข้อมูลน้องสุนัขคู่ใจ ({dogCount} ตัว)
                              </h4>
                              <span className="text-[10px] font-bold text-emerald-700 block">
                                พิมพ์ชื่อน้องสุนัขลงบนป้าย Dog Pass
                              </span>
                            </div>
                          </div>
                          <img loading="lazy" decoding="async"
                            src={LABRADOR_SVG_PATH}
                            alt="Labrador Mascot"
                            className="w-12 h-12 object-contain drop-shadow-sm shrink-0"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>
                            ชื่อน้องสุนัข {dogCount > 1 ? `(ระบุ ${dogCount} ตัว)` : '*'}
                          </label>
                          <input
                            type="text"
                            required
                            value={dogName}
                            onChange={(e) => setDogName(e.target.value)}
                            placeholder={dogCount > 1 ? 'เช่น ลัคกี้, ถุงทอง' : 'เช่น ลัคกี้'}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 bg-white text-sm font-semibold text-[#14532D] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>สายพันธุ์ (Breed) *</label>
                          <input
                            type="text"
                            required
                            value={dogBreed}
                            onChange={(e) => setDogBreed(e.target.value)}
                            placeholder="เช่น โกลเด้น, ลาบราดอร์, คอร์กี้, ชิบะ, พันธุ์ทาง"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 bg-white text-sm font-semibold text-[#14532D] outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDPA & Data Encryption Protection Banner */}
                <div className="rounded-2xl bg-emerald-50/90 border-2 border-emerald-400/70 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs relative z-10">
                  <div className="flex items-start sm:items-center gap-2.5 text-emerald-950">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="font-black text-emerald-950">
                        ข้อมูลส่วนบุคคลของคุณ
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-800">
                        ข้อมูลของคุณเก็บบนเซิร์ฟเวอร์ของผู้จัดงานและใช้เพื่อการจัดงานเท่านั้น เบอร์โทรจะถูกปิดบางส่วนบนป้าย BIB
                      </div>
                    </div>
                  </div>
                </div>

                <label className="relative z-10 flex items-start gap-3 p-3.5 rounded-2xl bg-white border-2 border-[#2A1450]/15 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 w-5 h-5 shrink-0 accent-[#6D28D9] cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-[#3A2A52] leading-relaxed">
                    ฉันได้อ่านและยอมรับ{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        openTerms();
                      }}
                      className="font-bold text-[#5B20A8] underline underline-offset-2 cursor-pointer"
                    >
                      ข้อกำหนดและเงื่อนไข
                    </button>{' '}
                    และ{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        openPrivacyNotice();
                      }}
                      className="font-bold text-[#5B20A8] underline underline-offset-2 cursor-pointer"
                    >
                      ประกาศความเป็นส่วนตัว
                    </button>{' '}
                    (ไม่คืนเงินค่าสมัครและไม่อนุญาตให้โอนสิทธิ์)
                  </span>
                </label>

                {publicCfg && !publicCfg.paymentReady && (
                  <div role="alert" className="relative z-10 p-3 rounded-2xl bg-amber-50 border-2 border-amber-500 text-amber-900 text-xs font-extrabold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ยังไม่เปิดรับชำระเงินออนไลน์ กรุณาติดตามประกาศจากผู้จัดงาน</span>
                  </div>
                )}

                {formError && (
                  <div role="alert" className="relative z-10 p-3 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-800 text-xs font-extrabold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Bottom Navigation Bar */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2 relative z-10">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-purple-50 text-[#2A1450] font-extrabold text-sm border border-purple-200 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>ย้อนกลับไปเลือกบัตร</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isCreatingOrder || !privacyConsent || (publicCfg !== null && !publicCfg.paymentReady)}
                    className="w-full sm:w-auto disabled:opacity-60 disabled:cursor-wait px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FFDF5A] via-[#FFC928] to-[#FFAE19] hover:brightness-105 text-[#1E0F38] font-black text-base border border-amber-300 shadow-[0_10px_25px_-6px_rgba(245,158,11,0.5)] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-5 h-5" />
                    <span>{isCreatingOrder ? 'กำลังสร้างคำสั่งซื้อ...' : `ไปหน้าสแกนจ่าย PromptPay (${formatBaht(total)} บาท)`}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------------- */}
          {/* STEP 3: COUNTDOWN TIMER + PROMPTPAY QR + SLIP VERIFIER     */}
          {/* ---------------------------------------------------------- */}
          {step === 3 && serverOrder && (
            <div className="space-y-4">
              {/* Payment timer bar */}
              <div
                className={`rounded-2xl border-2 p-3.5 sm:px-5 transition-colors ${
                  isTimerExpired
                    ? 'bg-rose-950 text-white border-rose-500'
                    : isTimerLow
                    ? 'bg-amber-950 text-white border-amber-400'
                    : 'bg-[#180B30] text-white border-[#2A1450]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black ${
                        isTimerExpired
                          ? 'bg-rose-500 text-white'
                          : isTimerLow
                          ? 'bg-amber-400 text-slate-950 animate-pulse'
                          : 'bg-[#FFC928] text-[#180B30]'
                      }`}
                    >
                      <Timer className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#FFC928]">
                        คำสั่งซื้อ {serverOrder.orderId}
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                        {isTimerExpired
                          ? 'QR หมดอายุ — กดสร้าง QR ใหม่เพื่อชำระเงิน'
                          : 'สแกนจ่ายภายในเวลาที่กำหนด ระบบจะยืนยันให้อัตโนมัติ ไม่ต้องแนบสลิป'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">
                      เวลาที่เหลือ
                    </span>
                    <span
                      className={`font-mono text-2xl sm:text-3xl font-black tabular-nums tracking-wider ${
                        isTimerExpired ? 'text-rose-400' : isTimerLow ? 'text-amber-300' : 'text-[#FFC928]'
                      }`}
                    >
                      {formatCountdown(remainingSeconds)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden mt-3">
                  <div
                    style={{ width: `${timerProgressPct}%` }}
                    className={`h-full transition-all duration-700 ${
                      isTimerExpired ? 'bg-rose-500' : isTimerLow ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left: PromptPay QR */}
                <div className="lg:col-span-5">
                  <div className="rounded-[28px] border-[3px] border-[#113566] bg-white shadow-[0_10px_0_#113566] overflow-hidden">
                    <div className="bg-[#113566] text-white px-5 py-3.5 flex items-center justify-between border-b-4 border-[#00A699]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#113566] font-black text-xs shadow-xs">
                          QR
                        </div>
                        <div>
                          <div className="text-sm font-black tracking-wide uppercase">THAI QR PAYMENT</div>
                          <div className="text-[10px] font-bold text-[#67E8F9] tracking-wider">
                            PROMPTPAY · สแกนได้ทุกธนาคาร
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 text-center space-y-3.5">
                      <div className="inline-block p-3 rounded-3xl bg-white border-[3px] border-[#113566] shadow-md relative">
                        {qrDataUrl ? (
                          <img loading="lazy" decoding="async"
                            src={qrDataUrl}
                            alt={`PromptPay QR ${payAmount} บาท`}
                            className={`w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto select-none transition-all ${
                              isTimerExpired ? 'blur-md opacity-30' : ''
                            }`}
                          />
                        ) : (
                          <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-xs font-bold text-slate-400">
                            {qrError ? (
                              <button type="button" onClick={handleRenewQr} className="text-rose-700 underline cursor-pointer px-3">
                                {qrError}
                              </button>
                            ) : (
                              'กำลังโหลด QR Code...'
                            )}
                          </div>
                        )}
                        {isTimerExpired && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl text-white">
                            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                            <div className="text-sm font-black">QR หมดอายุแล้ว</div>
                            <p className="text-[11px] text-white/80 mt-0.5 mb-3">
                              ยังไม่ได้โอน? กดเพื่อรับ QR ใบใหม่ ยอดเท่าเดิม
                            </p>
                            <button
                              type="button"
                              onClick={handleRenewQr}
                              disabled={isRenewingQr}
                              className="px-4 py-2 rounded-xl bg-[#FFC928] text-[#180B30] text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{isRenewingQr ? 'กำลังสร้าง...' : 'สร้าง QR ใหม่'}</span>
                            </button>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#113566]">
                          <ShieldCheck className="w-4 h-4 text-[#00A699]" />
                          <span>
                            ยอดชำระสุทธิ {payAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-left text-xs flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-500">เลขคำสั่งซื้อ</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sm text-[#2A1450]">{serverOrder.orderId}</span>
                          <button
                            type="button"
                            onClick={handleCopyPromptPayId}
                            className="px-2 py-0.5 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedPromptPay ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleDownloadQrImage}
                        disabled={isTimerExpired || !qrDataUrl}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-[#113566] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลดรูป QR Code ลงมือถือ</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: payment status & slip upload */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="rounded-3xl border-[3px] border-[#2A1450] bg-white p-4 sm:p-5 shadow-[0_8px_0_#2A1450] space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#2A1450]/10 pb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 border-2 border-emerald-600 text-emerald-800 flex items-center justify-center shrink-0">
                        <ScanLine className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-emerald-700 block">
                          ยืนยันการชำระเงิน
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-[#2A1450]">
                          สแกนจ่ายแล้วระบบจะยืนยันให้อัตโนมัติ
                        </h3>
                      </div>
                    </div>

                    {serverOrder.verificationStatus === 'REJECTED' ? (
                      <div role="alert" className="rounded-2xl bg-rose-50 border-2 border-rose-500 p-4 text-sm text-rose-900 space-y-1">
                        <div className="font-black flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> คำสั่งซื้อนี้ถูกยกเลิกโดยเจ้าหน้าที่
                        </div>
                        <p className="text-xs font-semibold">
                          กรุณาติดต่อผู้จัดงานพร้อมเลขคำสั่งซื้อ <strong className="font-mono">{serverOrder.orderId}</strong>
                        </p>
                      </div>
                    ) : (
                      <>
                        <div role="status" className="rounded-2xl bg-[#180B30] text-white p-4 text-sm flex items-center gap-3">
                          <span className="relative flex h-3 w-3 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                          </span>
                          <span className="font-bold">
                            รอการชำระเงิน {formatBaht(payAmount)} บาท — ระบบจะยืนยันให้อัตโนมัติ
                          </span>
                        </div>
                        <ol className="rounded-2xl bg-[#FAF7FF] border border-[#2A1450]/15 p-3.5 text-xs text-[#4B2D78] font-semibold space-y-1.5 list-decimal list-inside">
                          <li>เปิดแอปธนาคารแล้วสแกน QR (ถ้าใช้มือถือเครื่องเดียวกัน กด "ดาวน์โหลดรูป QR" แล้วสแกนจากรูปในแอปธนาคาร)</li>
                          <li>ตรวจยอด <strong className="text-emerald-700">{payAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</strong> แล้วยืนยันการโอน</li>
                          <li>กลับมาที่หน้านี้ เลข BIB จะขึ้นเองภายในไม่กี่วินาที — ไม่ต้องแนบสลิป</li>
                        </ol>
                        <p className="text-[11px] font-semibold text-[#6B5A85]">
                          ปิดหน้านี้ได้ เปิดหน้าสมัครอีกครั้งจากเครื่องนี้เพื่อดูสถานะ
                        </p>
                      </>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleCancelPendingOrder}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#4B2D78] hover:text-[#2A1450] cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>ยกเลิกและเริ่มสมัครใหม่</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/* STEP 4: GRAND CONGRATULATIONS CELEBRATION & E-BIB PASS     */}
          {/* ---------------------------------------------------------- */}
          {step === 4 && createdOrder && (
            <div
              key={`celebration-${celebrationKey}`}
              className="relative max-w-3xl mx-auto space-y-5 py-2 overflow-hidden"
            >
              {/* ====================================================== */}
              {/* CONFETTI CANNONS, RIBBONS & FIREWORK BURST OVERLAY     */}
              {/* ====================================================== */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
              >
                {[
                  { left: '6%', dx: -30, dy: 220, rot: -140, color: '#FFC928', delay: 0, emoji: '🎉' },
                  { left: '12%', dx: 45, dy: 260, rot: 180, color: '#A855F7', delay: 0.05, emoji: '✨' },
                  { left: '18%', dx: -20, dy: 240, rot: -95, color: '#10B981', delay: 0.08, emoji: '🏅' },
                  { left: '25%', dx: 35, dy: 290, rot: 145, color: '#F97316', delay: 0.02, emoji: '🎊' },
                  { left: '33%', dx: -25, dy: 250, rot: -160, color: '#EC4899', delay: 0.1, emoji: '⭐' },
                  { left: '42%', dx: 20, dy: 270, rot: 120, color: '#FFC928', delay: 0.04, emoji: '🏆' },
                  { left: '50%', dx: 0, dy: 260, rot: 200, color: '#6D28D9', delay: 0.01, emoji: '🎉' },
                  { left: '58%', dx: -30, dy: 280, rot: -130, color: '#34D399', delay: 0.07, emoji: '✨' },
                  { left: '67%', dx: 28, dy: 245, rot: 160, color: '#B45309', delay: 0.03, emoji: '🏅' },
                  { left: '75%', dx: -35, dy: 275, rot: -175, color: '#EC4899', delay: 0.09, emoji: '🎊' },
                  { left: '83%', dx: 22, dy: 235, rot: 115, color: '#8B5CF6', delay: 0.06, emoji: '⭐' },
                  { left: '92%', dx: -40, dy: 260, rot: -150, color: '#FFC928', delay: 0.02, emoji: '🎉' },
                ].map((item, idx) => (
                  <React.Fragment key={idx}>
                    {/* Falling Emoji Particle */}
                    <motion.span
                      initial={{ opacity: 0, y: -20, x: 0, scale: 0.3, rotate: 0 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        y: [-10, 60, item.dy],
                        x: [0, item.dx * 0.6, item.dx],
                        scale: [0.4, 1.25, 0.9],
                        rotate: item.rot,
                      }}
                      transition={{
                        duration: 1.85,
                        delay: item.delay,
                        ease: 'easeOut',
                      }}
                      style={{ left: item.left }}
                      className="absolute top-0 text-xl sm:text-2xl select-none drop-shadow-sm"
                    >
                      {item.emoji}
                    </motion.span>

                    {/* Falling Colored Ribbon Strip */}
                    <motion.span
                      initial={{ opacity: 1, y: -16, x: 0, rotate: 0, scale: 0.5 }}
                      animate={{
                        opacity: [1, 1, 0],
                        y: [-16, item.dy + 40],
                        x: [0, -item.dx],
                        rotate: item.rot * 1.8,
                        scale: [0.7, 1.1, 0.8],
                      }}
                      transition={{
                        duration: 1.65,
                        delay: item.delay + 0.04,
                        ease: 'easeOut',
                      }}
                      style={{
                        left: item.left,
                        backgroundColor: item.color,
                      }}
                      className="absolute top-2 w-3 h-1.5 rounded-xs border border-[#2A1450]/40"
                    />
                  </React.Fragment>
                ))}
              </div>

              {/* ====================================================== */}
              {/* HERO CONGRATULATIONS BANNER WITH MASCOTS & TROPHY SLAM */}
              {/* ====================================================== */}
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="relative rounded-[28px] border-[3px] border-[#2A1450] bg-gradient-to-r from-[#220E42] via-[#4C1D95] to-[#220E42] text-white p-5 sm:p-6 shadow-[0_8px_0_#2A1450] overflow-hidden"
              >
                {/* Expanding Golden Shockwave Ring */}
                <motion.div
                  initial={{ scale: 0.3, opacity: 0.85 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-[#FFC928]"
                />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                  {/* Left: Celebrating Elephant + Animated Labrador Mascot wearing the runner's actual BIB */}
                  <motion.div
                    initial={{ scale: 0, rotate: -18 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 14, delay: 0.08 }}
                    className="shrink-0 flex items-center gap-2"
                  >
                    <div className="relative">
                      <ElephantCharacter
                        size={88}
                        showBib={true}
                        bibNumber={createdOrder.bibNumber}
                        mood="celebrating"
                      />
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 360 }}
                        className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#FFC928] border-2 border-[#2A1450] flex items-center justify-center text-[#2A1450] shadow-md"
                      >
                        <Trophy className="w-4 h-4 stroke-[2.5]" />
                      </motion.span>
                    </div>
                    <motion.div
                      initial={{ scale: 0, y: 16 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.18, type: 'spring' }}
                    >
                      <LabradorMascot
                        size={56}
                        glowColor="gold"
                        badgeText={createdOrder.runningWithDog ? 'DOG PASS 🐾' : 'HOORAY! 🐾'}
                        interactive={false}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Center: Congratulations Headline & Verified Stamp */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <motion.span
                        initial={{ scale: 2, rotate: -14, opacity: 0 }}
                        animate={{ scale: 1, rotate: -2, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 14, delay: 0.15 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC928] text-[#2A1450] border-2 border-[#2A1450] text-xs font-black uppercase tracking-wider shadow-[0_3px_0_#2A1450]"
                      >
                        <PartyPopper className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>CONGRATULATIONS! ซื้อบัตรวิ่งสำเร็จ</span>
                      </motion.span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/60 text-emerald-200 text-[11px] font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>โอนสำเร็จใน {createdOrder.transferDurationSec} วินาที</span>
                      </span>
                    </div>

                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 }}
                      className="text-2xl sm:text-3xl font-black text-white leading-tight"
                    >
                      ขอแสดงความยินดีคุณ <span className="text-[#FFC928]">{createdOrder.fullName}</span>!
                    </motion.h3>

                    <p className="text-xs sm:text-sm font-bold text-white/85">
                      คุณได้รับหมายเลข BIB ประจำตัวนักวิ่ง{' '}
                      <span className="font-mono font-black text-[#FFC928]">
                        #{createdOrder.bibNumber}
                      </span>{' '}
                      เรียบร้อยแล้ว · รหัสคำสั่งซื้อ{' '}
                      <span className="font-mono text-white">{createdOrder.orderId}</span> · อ้างอิงการชำระเงิน{' '}
                      <span className="font-mono text-emerald-300">{createdOrder.paymentRef}</span>
                    </p>
                  </div>

                  {/* Right: Replay Celebration Fireworks Button */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playVictoryCelebrationSound(true);
                        setCelebrationKey((prev) => prev + 1);
                      }}
                      className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-[#FFC928] text-white hover:text-[#2A1450] border-2 border-white/30 hover:border-[#2A1450] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>จุดพลุฉลองอีกครั้ง</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* ====================================================== */}
              {/* AUTOMATED EMAIL DELIVERY NOTIFICATION BAR              */}
              {/* ====================================================== */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-2xl bg-emerald-50 border-2 border-emerald-600 p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-emerald-950">
                      ชำระเงินสำเร็จ! เลข BIB ของคุณคือ #{createdOrder.bibNumber}
                    </div>
                    <p className="text-xs font-bold text-emerald-800 mt-0.5">
                      กรุณาดาวน์โหลดหรือพิมพ์บัตรเก็บไว้ และจดเลขคำสั่งซื้อ{' '}
                      <strong className="font-mono">{createdOrder.orderId}</strong> ไว้ใช้ตอนรับอุปกรณ์
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPrintModalTab('print');
                    setPrintModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-700 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ / บันทึกบัตร</span>
                </button>
              </motion.div>

              {/* ====================================================== */}
              {/* OFFICIAL COLLECTIBLE E-BIB & E-TICKET PASS             */}
              {/* ====================================================== */}
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.16 }}
                className="relative rounded-[28px] border-[3px] border-[#2A1450] bg-white shadow-[0_10px_0_#2A1450] overflow-hidden"
              >
                <div
                  style={{ background: theme.headerGrad }}
                  className="px-6 py-4 text-white border-b-[3px] border-[#2A1450] flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-[0.2em] text-[#FFC928] block">
                      CHANGSUEK RUN 2027 · VERIFIED OFFICIAL E-TICKET & BIB PASS
                    </span>
                    <span className="text-lg font-black">{createdOrder.routeName}</span>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-[#FFC928] text-[#2A1450] font-display font-black text-sm border-2 border-[#2A1450]">
                    {ticket.distanceLabel}
                  </span>
                </div>

                <div className="p-6 bg-gradient-to-b from-[#FAF7FF] to-white relative overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Left 8 cols: BIB Number & Runner Details */}
                    <div className="md:col-span-8 text-center md:text-left">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#6B5A85] block">
                        ASSIGNED SEQUENTIAL BIB NUMBER / หมายเลขประจำตัวนักวิ่งของคุณ
                      </span>

                      <motion.div
                        initial={{ scale: 0.5, rotate: -6, opacity: 0 }}
                        animate={{ scale: [0.5, 1.12, 1], rotate: [0, 2, 0], opacity: 1 }}
                        transition={{ duration: 0.55, delay: 0.22, ease: 'easeOut' }}
                        className="font-display text-6xl sm:text-7xl font-black text-[#2A1450] tracking-wider my-2 tabular-nums drop-shadow-[0_4px_0_#FFC928]"
                      >
                        #{createdOrder.bibNumber}
                      </motion.div>

                      <motion.div
                        initial={{ scale: 1.8, opacity: 0, rotate: -12 }}
                        animate={{ scale: 1, opacity: 1, rotate: -2 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 14, delay: 0.35 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border-2 border-emerald-700 text-emerald-900 text-[11px] font-black uppercase tracking-wider mb-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>OFFICIAL TICKET & BIB ISSUED · ชำระเงินและออกบัตรอัตโนมัติสำเร็จ</span>
                      </motion.div>
                    </div>

                    {/* Right 4 cols: E-Ticket QR Code for Race Pack Check-in */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-2 border-[#2A1450] shadow-[0_4px_0_#2A1450]">
                      {ticketCheckInQrUrl ? (
                        <img loading="lazy" decoding="async"
                          src={ticketCheckInQrUrl}
                          alt="E-Ticket Check-in QR Code"
                          className="w-28 h-28 object-contain"
                        />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center text-xs text-slate-400">
                          QR E-Ticket
                        </div>
                      )}
                      <span className="text-[11px] font-black text-[#2A1450] mt-1">
                        QR สแกนรับเสื้อวันงาน
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#6D28D9]">
                        {createdOrder.orderId}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 text-left">
                    <div className="p-3 rounded-2xl bg-white border-2 border-[#2A1450]/15">
                      <span className="text-[10px] font-bold text-[#6B5A85] uppercase block">
                        ชื่อนักวิ่ง
                      </span>
                      <span className="text-sm font-black text-[#2A1450] truncate block">
                        {createdOrder.fullName}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border-2 border-[#2A1450]/15">
                      <span className="text-[10px] font-bold text-[#6B5A85] uppercase block">
                        เสื้อวิ่ง Jersey
                      </span>
                      <span className="text-sm font-black text-[#2A1450] block">
                        Size {createdOrder.shirtSize} ({createdOrder.peopleCount} คน)
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border-2 border-[#2A1450]/15">
                      <span className="text-[10px] font-bold text-[#6B5A85] uppercase block">
                        เวลาปล่อยตัว
                      </span>
                      <span className="text-sm font-black text-[#2A1450] block">
                        {theme.startTime} (9 ม.ค. 70)
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-500/40">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                        ตรวจสอบเงินเข้าอัตโนมัติ
                      </span>
                      <span className="text-sm font-black text-emerald-800 tabular-nums block">
                        ✓ {formatBaht(createdOrder.totalPrice)} บาท
                      </span>
                    </div>
                  </div>

                  {createdOrder.runningWithDog && (
                    <div className="mt-3 p-3 rounded-2xl bg-[#F0FDF4] border-2 border-[#16A34A] flex items-center justify-between text-xs font-extrabold text-[#14532D]">
                      <span className="flex items-center gap-2">
                        <PawIcon size={16} color="#16A34A" />
                        <span>
                          น้องสุนัขร่วมวิ่ง: {createdOrder.dogName || 'น้องสุนัขคู่ใจ'} (
                          {createdOrder.dogBreed || 'ไม่ระบุสายพันธุ์'}) · รวม {createdOrder.dogCount} ตัว
                        </span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#16A34A]">
                        K9 PASS VERIFIED
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ====================================================== */}
              {/* SELECTABLE PRINT FORMATS PANEL (มีให้เลือกแบบ Print)    */}
              {/* ====================================================== */}
              <div className="rounded-3xl border-[3px] border-[#2A1450] bg-white p-4 sm:p-5 shadow-[0_8px_0_#2A1450] space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Printer className="w-5 h-5 text-[#6D28D9]" />
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-[#2A1450]">
                        เลือกรูปแบบการพิมพ์บัตร (Print / บันทึก PDF) หรือดาวน์โหลดรูปภาพ
                      </h4>
                      <p className="text-xs font-bold text-[#6B5A85]">
                        คลิกเลือกรูปแบบที่ต้องการเพื่อเปิดหน้าตัวอย่างก่อนสั่งพิมพ์ออกเครื่องปริ้นท์ขนาด A4
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadOfficialBibAsPng(createdOrder)}
                    className="px-3.5 py-2 rounded-xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#4B2D78] border-2 border-[#2A1450] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดรูปป้าย BIB (.PNG)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'bib_only' as PrintFormatOption,
                      title: '1. พิมพ์เฉพาะป้ายหมายเลข BIB',
                      sub: 'สำหรับติดเสื้อวิ่ง / เก็บสะสม',
                      badge: 'Official BIB',
                    },
                    {
                      id: 'eticket_pass' as PrintFormatOption,
                      title: '2. พิมพ์บัตร E-Ticket & QR รับเสื้อ',
                      sub: 'แสดง QR สแกนรับเสื้อและเหรียญ',
                      badge: 'E-Ticket Pass',
                    },
                    {
                      id: 'full_a4_receipt' as PrintFormatOption,
                      title: '3. พิมพ์ใบเสร็จ + บัตร + ป้าย BIB (A4)',
                      sub: 'ครบชุดในแผ่นเดียว พร้อมเส้นประตัดใช้งาน',
                      badge: 'แนะนำ · ครบชุด A4',
                    },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        setSelectedPrintFormat(fmt.id);
                        setPrintModalTab('print');
                        setPrintModalOpen(true);
                      }}
                      className="group text-left p-3.5 rounded-2xl border-2 border-[#2A1450] bg-[#FAF7FF] hover:bg-[#FFC928] transition-all shadow-[0_4px_0_#2A1450] active:translate-y-0.5 cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#2A1450] text-[#FFC928] text-[10px] font-extrabold">
                          {fmt.badge}
                        </span>
                        <Printer className="w-4 h-4 text-[#2A1450]" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-[#2A1450]">
                          {fmt.title}
                        </div>
                        <div className="text-[11px] font-bold text-[#4B2D78] group-hover:text-[#2A1450] mt-0.5">
                          {fmt.sub}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPrintFormat('full_a4_receipt');
                    setPrintModalTab('print');
                    setPrintModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#FFC928] hover:bg-[#FFD646] text-[#2A1450] font-black text-sm border-2 border-[#2A1450] shadow-[0_4px_0_#2A1450] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>เปิดหน้าสั่งพิมพ์ (Print / PDF) ทันที</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onRegistrationSuccess) {
                      onRegistrationSuccess();
                    } else {
                      onClose();
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-extrabold text-sm border-2 border-[#2A1450] shadow-[0_4px_0_#2A1450] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>ไปยังศูนย์นักวิ่ง (Runner Center)</span>
                </button>

                {onOpenAdminModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminModal();
                    }}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#2A1450] hover:bg-[#3B1870] text-[#FFC928] font-extrabold text-sm border-2 border-[#2A1450] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>ดูรายการในระบบแอดมิน</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-[#F3E8FF] text-[#2A1450] font-extrabold text-sm border-2 border-[#2A1450] cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

              {/* Dedicated Print & Email Preview Modal */}
              <TicketPrintEmailModal
                isOpen={printModalOpen}
                onClose={() => setPrintModalOpen(false)}
                profile={createdOrder}
                initialMode={printModalTab}
                initialPrintFormat={selectedPrintFormat}
              />
            </div>
          )}
        </div>

        {/* Lightbox for inspecting uploaded slip in Step 3 */}
      </div>
    </div>
  );
};
