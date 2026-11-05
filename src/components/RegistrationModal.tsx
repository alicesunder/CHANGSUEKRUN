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
  AlertTriangle,
  ScanLine,
  Building2,
  Eye,
  Trophy,
  PartyPopper,
  Gift,
  Music,
  Crown,
} from 'lucide-react';
import { RouteId } from '../types';
import { PawIcon } from './brand/DogDecor';
import { LABRADOR_SVG_PATH, LabradorMascot } from './brand/LabradorMascot';
import { playVictoryCelebrationSound } from '../utils/ticketSoundFx';
import { TicketOrder, saveRunnerProfile } from '../utils/runnerStorage';
import { buildQrWithAmount, formatThaiBankAccount, generatePromptPayPayload } from '../utils/promptPay';
import { processUploadedSlipImage } from '../utils/slipVerifier';
import { openPrivacyNotice } from './PrivacyNotice';
import { openTerms } from './TermsSection';
import { authApi, useSession } from '../utils/runnerAuth';
import { useLang } from '../i18n/lang';
import { SHIRT_SIZES } from '../data/shirts';
import {
  ApiError,
  PendingOrderRef,
  PublicConfig,
  ServerOrder,
  checkSponsorCode,
  createOrder,
  fetchOrder,
  uploadSlip,
  extendPaymentTime,
  getPublicConfig,
  loadPendingOrderRef,
  savePendingOrderRef,
} from '../utils/api';
import {
  ticketById,
  isDogCategory,
  calcTicketTotal,
  CONCERT_PASS_PRICE,
  VIP_TABLE_PRICE,
  concertPassPrice,
  runBasePrice,
  vipTablePrice,
  MAX_VIP_TABLES,
  VIP_TABLE_SEATS,
  formatBaht,
} from '../data/eventData';
import {
  PrintFormatOption,
  generateTicketCheckInQrDataUrl,
  downloadOfficialBibAsPng,
} from '../utils/ticketEmailAndPrint';
import { TicketPrintEmailModal } from './TicketPrintEmailModal';
import { AddOnPicker } from './AddOnPicker';
import { needsInsurance } from '../data/insurance';
import { digitsOnly, type Shooter } from '../data/shooting';
import { ShootingSafetyRules } from './ShootingSafetyRules';
import { PaymentWow } from './PaymentWow';
import { PaymentStep } from './PaymentStep';
import { PaymentSuccess } from './PaymentSuccess';
import { RaceBib, runnerBib } from './RaceBib';
import { EarlyBirdPrice } from './EarlyBirdPrice';
import { DogDetailsForm, dogExtraFromProfile, emptyDogExtra, type DogExtra } from './DogDetailsForm';
import { dogProfileProblems } from '../data/dogProfile';
import { useEarlyBird } from '../utils/earlyBird';
import { FormSection, RunnerDetailsForm, emptyRunner, runnerFromSaved, runnerName, runnerProblems, toInsurance, type RunnerEntry } from './RunnerDetailsForm';
import { VIP_PARKING_PER_TABLE, type ParkingPlate } from '../data/vipParking';
import { waiversFor, type WaiverActivity, type WaiverParticipant } from '../data/activityWaivers';
import { TEST_PRICE_BAHT, useTestMode } from '../utils/testMode';
import { ActivityWaiverForm, mergeParticipant } from './ActivityWaiverForm';
import { ParkingPasses } from './ParkingPass';
import { EMPTY_ADD_ONS, addOnBonusDiscount, addOnConcertRate, addOnCountRate, addOnDiscountRate, addOnLabel, addOnTotal, concertDiscountPerTicket, hasAddOns, percentOf, type AddOnSelection } from '../data/addOns';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoute?: RouteId;
  initialExtraPeople?: number;
  initialExtraDogs?: number;
  initialAddOns?: AddOnSelection;
  /** 'CONCERT' opens the concert-only pass (no run) */
  initialMode?: 'RUN' | 'CONCERT' | 'ADDON';
  /** with a run ticket: also tick the concert ticket */
  initialConcert?: boolean;
  /** how many concert tickets to start with */
  initialConcertQty?: number;
  /** how many VIP tables to start with */
  initialVipTables?: number;
  onRegistrationSuccess?: () => void;
  onOpenAdminModal?: () => void;
  /** the login expired while buying: the page asks the runner to log in again */
  onNeedLogin?: () => void;
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
  '3km': { src: '/images/distances/icon-3k.webp', alt: 'นักวิ่งกับน้องสุนัขระยะ 4 กม. ริมหาด' },
  '1km': { src: '/images/distances/icon-1k.webp', alt: 'น้องสุนัขวิ่งระยะ 1 กม.' },
};

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
  initialAddOns,
  initialMode = 'RUN',
  initialConcert = false,
  initialConcertQty = 1,
  initialVipTables = 0,
  onRegistrationSuccess,
  onOpenAdminModal,
  onNeedLogin,
}) => {
  const session = useSession();
  const { t: tr } = useLang();
  const [selectedRoute, setSelectedRoute] = useState<RouteId>(initialRoute);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  // Three independent choices: any one, or any mix
  const [wantRun, setWantRun] = useState(initialMode === 'RUN');
  const [wantConcert, setWantConcert] = useState(initialMode === 'CONCERT' || initialConcert);
  const [wantAddons, setWantAddons] = useState(initialMode === 'ADDON' || Boolean(initialAddOns));
  const mode: 'RUN' | 'CONCERT' | 'ADDON' = wantRun ? 'RUN' : wantConcert ? 'CONCERT' : 'ADDON';
  // GA tickets may be 0 when VIP tables are bought instead; at least one of the two when the concert is ticked
  const [concertQty, setConcertQty] = useState(initialVipTables > 0 ? initialConcertQty : Math.max(1, initialConcertQty));
  const [vipTablesState, setVipTables] = useState(initialVipTables);
  const vipTables = wantConcert ? vipTablesState : 0;
  const gaQty = wantConcert ? concertQty : 0;
  const isConcert = mode === 'CONCERT';
  const isAddonOnly = mode === 'ADDON';
  const noRun = mode !== 'RUN';
  const [extraPeople, setExtraPeople] = useState(0);
  const [extraDogs, setExtraDogs] = useState(0);
  const [addOnsState, setAddOns] = useState<AddOnSelection>(initialAddOns ? { ...initialAddOns } : { ...EMPTY_ADD_ONS });
  const addOns: AddOnSelection = wantAddons ? addOnsState : { ...EMPTY_ADD_ONS };
  // something must be chosen: a run, a concert ticket, or at least one activity
  const addonMissing = !wantRun && !wantConcert && !hasAddOns(addOns);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  // Runners: runner 1 is the main applicant; Dog Run extra runners fill the same card (insurance included)
  const [runnersState, setRunnersState] = useState<RunnerEntry[]>([emptyRunner(0)]);
  const [activeRunner, setActiveRunner] = useState(0);
  const [showRunnerErrors, setShowRunnerErrors] = useState(false);
  const [insConsent, setInsConsent] = useState(false);
  // VIP parking: up to 2 cars per table
  const [plates, setPlates] = useState<ParkingPlate[]>([]);
  // Shooting: a name for each person (starts from the runners' names) + acceptance of the range's safety rules
  const [shooters, setShooters] = useState<Partial<Shooter>[]>([]);
  const [shootingAck, setShootingAck] = useState(false);
  // Tower / wind tunnel: the buyer's edits to each participant, and which waivers were accepted
  // (stored as the details they were accepted for, so changing a detail asks again)
  const [waiverEdits, setWaiverEdits] = useState<Partial<WaiverParticipant>[]>([]);
  const [waiverAccepted, setWaiverAccepted] = useState<Partial<Record<WaiverActivity, string>>>({});
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogExtra, setDogExtra] = useState<DogExtra>(emptyDogExtra);
  const [showDogErrors, setShowDogErrors] = useState(false);

  // Server-backed order & payment state (the server decides price, payment status and BIB)
  const [publicCfg, setPublicCfg] = useState<PublicConfig | null>(null);
  const earlyBird = useEarlyBird();
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

  // Sponsor code: free registration (run + concert). The server checks it again on submit.
  const [sponsorInput, setSponsorInput] = useState('');
  const [sponsor, setSponsor] = useState<{ code: string; name: string } | null>(null);
  const [sponsorChecking, setSponsorChecking] = useState(false);
  const [sponsorError, setSponsorError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<TicketOrder | null>(null);

  const [celebrationKey, setCelebrationKey] = useState<number>(1);
  // full-screen celebration the moment a payment goes through
  const [wow, setWow] = useState(false);

  // Step 4 Email & Print States
  const [ticketCheckInQrUrl, setTicketCheckInQrUrl] = useState<string>('');
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);
  const [printModalTab, setPrintModalTab] = useState<'print' | 'email'>('print');
  const [selectedPrintFormat, setSelectedPrintFormat] =
    useState<PrintFormatOption>('full_a4_receipt');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ticket = ticketById(selectedRoute);
  // Concert / add-on orders carry routeId 'concert' / 'addon', which have no run theme.
  const theme = ROUTE_THEME[selectedRoute] ?? ROUTE_THEME['5km'];
  const isDog = !noRun && isDogCategory(selectedRoute);
  const insured = !noRun && needsInsurance(selectedRoute);
  // Runner 2+ start with runner 1's last name (family / same group); changing runner 1's last name carries over
  // to the others until they type their own.
  const newRunner = (i: number, first?: RunnerEntry): RunnerEntry => ({ ...emptyRunner(i), lastName: i > 0 ? first?.lastName || '' : '' });
  const runners: RunnerEntry[] = Array.from({ length: noRun ? 0 : 1 + extraPeople }, (_, i) => runnersState[i] || newRunner(i, runnersState[0]));
  const updateRunner = (i: number, patch: Partial<RunnerEntry>) =>
    setRunnersState((rs) => {
      const next = [...rs];
      const before = rs[i] || newRunner(i, rs[0]);
      next[i] = { ...before, ...patch };
      if (i === 0 && patch.lastName !== undefined) {
        for (let k = 1; k < 1 + extraPeople; k++) {
          const other = next[k] || newRunner(k, rs[0]);
          if (!other.lastName || other.lastName === before.lastName) next[k] = { ...other, lastName: patch.lastName };
        }
      }
      return next;
    });
  const shirtSize = runners[0]?.shirtSize || 'L';
  // Bundle discounts never stack with a sponsor code (rules in data/addOns.ts; the server decides the real price).
  const sponsorOn = Boolean(sponsor) && wantRun;
  const discountCtx = { hasRun: wantRun, hasConcert: gaQty > 0 || vipTables > 0, sponsor: sponsorOn, earlyBird };
  const concertUnit = concertPassPrice(earlyBird);
  const vipUnit = vipTablePrice(earlyBird);
  const concertDiscount = gaQty * concertDiscountPerTicket(concertUnit, wantRun && !sponsorOn);
  const vipTotal = vipUnit * vipTables;
  const ticketTotal = (wantRun ? calcTicketTotal(selectedRoute, extraPeople, extraDogs, earlyBird) : 0) + (wantConcert ? concertUnit * gaQty - concertDiscount + vipTotal : 0);
  const addOnSum = addOnTotal(addOns, discountCtx);
  const addOnOff = addOnBonusDiscount(addOns, discountCtx);
  const concertMissing = wantConcert && gaQty === 0 && vipTables === 0;
  const hasGun = wantAddons && addOns.gun !== 'none';
  const waiverActivities = waiversFor(addOns);
  const buyerName = noRun ? fullName.trim() : runnerName(runners[0]);
  // Names typed once in the runner cards fill the shooting list and the waivers (each can still be edited there).
  const autoName = (i: number) => (i === 0 ? buyerName : runnerName(runners[i]));
  const shooterList: Shooter[] = Array.from({ length: hasGun ? addOns.people : 0 }, (_, i) => ({
    fullName: shooters[i]?.fullName ?? autoName(i),
  }));
  const waiverPeople: WaiverParticipant[] = Array.from({ length: waiverActivities.length ? addOns.people : 0 }, (_, i) =>
    mergeParticipant(
      {
        fullName: shooterList[i]?.fullName || autoName(i),
        phone: i === 0 ? digitsOnly(phone) : '',
        birthDate: runners[i]?.birthDate || '',
        idCard: runners[i]?.idCard || '',
      },
      waiverEdits[i]
    )
  );
  const waiverKey = JSON.stringify(waiverPeople);
  const waiversDone = waiverActivities.every((a) => waiverAccepted[a] === waiverKey);
  const testMode = useTestMode();
  // admin test mode: the server prices every order at 1 baht
  const total = testMode ? TEST_PRICE_BAHT : ticketTotal + addOnSum;
  // With a sponsor code the run is free; add-on activities are always paid.
  const chargeTotal = testMode ? TEST_PRICE_BAHT : (sponsorOn ? 0 : ticketTotal) + addOnSum;
  const isFreeOrder = sponsorOn && addOnSum === 0;
  const dogCount = isDog ? 1 + extraDogs : 0;
  const peopleCount = isAddonOnly ? addOns.people : isConcert ? gaQty + vipTables * VIP_TABLE_SEATS : isDog ? 1 + extraPeople : 1;
  // Amount to pay always comes from the server order once it exists.
  const payAmount = serverOrder?.totalPrice ?? total;
  // the admin closed ticket sales (orders already created can still be paid)
  const salesClosed = publicCfg?.salesOpen === false;

  /** Payment confirmed by the server -> show the ticket. */
  const finalizePaidOrder = async (order: ServerOrder) => {
    savePendingOrderRef(null);
    setPendingRef(null);
    saveRunnerProfile(order);
    // The server e-mails the ticket itself when the payment is confirmed (see server/mailer.ts).
    const qrCheckIn = await generateTicketCheckInQrDataUrl(order);
    setTicketCheckInQrUrl(qrCheckIn);
    setCreatedOrder(order);
    setCelebrationKey((prev) => prev + 1);
    setWow(true);
    playVictoryCelebrationSound(true);
    setStep(4);
  };

  /** Restore form fields from a server order (used when resuming an unfinished payment). */
  const restoreFromOrder = (o: ServerOrder) => {
    if (ROUTE_THEME[o.routeId]) setSelectedRoute(o.routeId);
    setExtraPeople(o.extraPeople || 0);
    setExtraDogs(o.extraDogs || 0);
    setFullName(o.fullName || '');
    setPhone(o.phone || '');
    setEmail(o.email || '');
    setEmergencyPhone(o.emergencyPhone || '');
    setDogName(o.dogName || '');
    setDogBreed(o.dogBreed || '');
    setDogExtra(dogExtraFromProfile((o as ServerOrder).dogProfile));
    setRunnersState([
      runnerFromSaved(0, o.fullName || '', o.shirtSize, (o as ServerOrder).insurance),
      ...((o as ServerOrder).extraRunners || []).map((r, k) => runnerFromSaved(k + 1, r.name, r.shirtSize, r.insurance)),
    ]);
  };

  // On open: reset, load public config, and resume any unfinished order from this browser.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setSelectedRoute(initialRoute);
    setStep(1);
    setExtraPeople(initialExtraPeople);
    setExtraDogs(initialExtraDogs);
    setAddOns(initialAddOns ? { ...initialAddOns } : { ...EMPTY_ADD_ONS });
    setWantRun(initialMode === 'RUN');
    setWantConcert(initialMode === 'CONCERT' || initialConcert);
    setWantAddons(initialMode === 'ADDON' || Boolean(initialAddOns));
    setConcertQty(initialVipTables > 0 ? initialConcertQty : Math.max(1, initialConcertQty));
    setVipTables(initialVipTables);
    setServerOrder(null);
    setPendingRef(null);
    setFormError(null);
    setSponsor(null);
    setSponsorInput('');
    setSponsorError(null);
    setCreatedOrder(null);
    setTicketCheckInQrUrl('');

    // A logged-in runner starts with their saved details (they can still change anything).
    if (session?.role === 'runner') {
      const u = session.user;
      const p = u.profile || {};
      const [first = '', ...rest] = (u.name || '').trim().split(/\s+/);
      setFullName(u.name || '');
      setPhone(u.phone || '');
      setEmail(u.email || '');
      setEmergencyPhone(p.emergencyPhone || '');
      setRunnersState([
        {
          ...emptyRunner(0),
          firstName: p.firstName ?? first,
          lastName: p.lastName ?? rest.join(' '),
          gender: p.gender || '',
          birthDate: p.birthDate || '',
          bloodType: p.bloodType || '',
          shirtSize: (SHIRT_SIZES as readonly string[]).includes(p.shirtSize || '') ? (p.shirtSize as (typeof SHIRT_SIZES)[number]) : 'L',
          emergencyName: p.emergencyName || '',
          relationship: p.relationship || '',
        },
      ]);
    }

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
  }, [isOpen, initialRoute, initialExtraPeople, initialExtraDogs, initialAddOns, initialMode, initialConcert, initialConcertQty, initialVipTables]);

  // Close with Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !printModalOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, printModalOpen]);


  // PromptPay QR with the exact amount, made in the browser from the organiser's PromptPay ID
  const [qrError, setQrError] = useState<string | null>(null);
  const qrPromptPayId = publicCfg?.qrPayload || publicCfg?.promptPayId || '';
  const qrAmount = serverOrder?.totalPrice ?? 0;
  useEffect(() => {
    if (!isOpen || step !== 3 || !qrPromptPayId || qrAmount <= 0) return;
    let cancelled = false;
    setQrDataUrl('');
    setQrError(null);
    const qrText = publicCfg?.qrPayload ? buildQrWithAmount(publicCfg.qrPayload, qrAmount) : generatePromptPayPayload(qrPromptPayId, qrAmount);
    if (!qrText) {
      setQrError('สร้าง QR ไม่สำเร็จ กรุณาโอนเข้าบัญชีด้านล่างแทน');
      return;
    }
    QRCode.toDataURL(qrText, { width: 480, margin: 1, errorCorrectionLevel: 'M' })
      .then((u) => !cancelled && setQrDataUrl(u))
      .catch(() => !cancelled && setQrError('สร้าง QR ไม่สำเร็จ กรุณาโอนเข้าบัญชีด้านล่างแทน'));
    return () => {
      cancelled = true;
    };
  }, [isOpen, step, qrPromptPayId, qrAmount]);

  // Slip upload: the server checks it with EasySlip; PAID comes back right away when it passes.
  const [slipBusy, setSlipBusy] = useState(false);
  const [slipMessage, setSlipMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const handleSlipFile = async (file: File | undefined) => {
    if (!file || !pendingRef || slipBusy) return;
    setSlipBusy(true);
    setSlipMessage(null);
    try {
      const { dataUrl } = await processUploadedSlipImage(file);
      const res = await uploadSlip(pendingRef, dataUrl);
      setServerOrder(res.order);
      if (res.order.paymentStatus === 'PAID') {
        finalizePaidOrder(res.order);
        return;
      }
      setSlipMessage({ ok: true, text: res.message || 'ได้รับสลิปแล้ว รอเจ้าหน้าที่ตรวจ' });
    } catch (err) {
      setSlipMessage({ ok: false, text: err instanceof Error ? err.message : 'ส่งสลิปไม่สำเร็จ กรุณาลองใหม่' });
    } finally {
      setSlipBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Poll the server for payment confirmation (admin approval of a slip under review, or an old Omise charge)
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

  const handleApplySponsorCode = async () => {
    const code = sponsorInput.trim();
    if (!code || sponsorChecking) return;
    setSponsorChecking(true);
    setSponsorError(null);
    try {
      const res = await checkSponsorCode(code);
      setSponsor({ code: code.toUpperCase().replace(/\s+/g, ''), name: res.sponsorName });
      // A sponsor code covers one runner (and the dog); extra people / dogs are not included.
      setExtraPeople(0);
      setExtraDogs(0);
      setRunnersState((rs) => rs.slice(0, 1));
      setActiveRunner(0);
    } catch (err) {
      setSponsor(null);
      setSponsorError(err instanceof Error ? err.message : 'ตรวจรหัสไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSponsorChecking(false);
    }
  };

  const handleClearSponsorCode = () => {
    setSponsor(null);
    setSponsorInput('');
    setSponsorError(null);
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingOrder) return;
    setFormError(null);
    // Only the open runner tab is on screen, so the runner cards are checked here instead of by the browser.
    const firstBad = runners.findIndex((r, i) => runnerProblems(r, i, insured).length > 0);
    if (firstBad >= 0) {
      setShowRunnerErrors(true);
      setActiveRunner(firstBad);
      setFormError(`กรุณากรอกข้อมูลนักวิ่งคนที่ ${firstBad + 1} ให้ครบ (ช่องสีแดง)`);
      document.getElementById('runner-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (isDog && dogProfileProblems({ name: dogName, breed: dogBreed, ...dogExtra }).length > 0) {
      setShowDogErrors(true);
      setFormError('กรุณากรอกข้อมูลน้องสุนัขให้ครบ (ช่องสีแดง)');
      document.getElementById('dog-name')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsCreatingOrder(true);
    try {
      const res = await createOrder({
        routeId: selectedRoute,
        ticketType: mode,
        concertQty: wantConcert ? gaQty : undefined,
        vipTables: vipTables > 0 ? vipTables : undefined,
        extraPeople,
        extraDogs,
        fullName: buyerName,
        insurance: insured ? toInsurance(runners[0], runners[0]) : undefined,
        insuranceConsent: insured ? insConsent : undefined,
        parkingPlates: vipTables > 0 ? plates.slice(0, vipTables * VIP_PARKING_PER_TABLE).filter((p) => p.plate.trim() || p.province.trim()) : undefined,
        shooters: hasGun ? shooterList.map((x) => ({ fullName: x.fullName.trim() })) : undefined,
        shootingAck: hasGun ? shootingAck : undefined,
        activityWaiver: waiverActivities.length
          ? { participants: waiverPeople, accepted: Object.fromEntries(waiverActivities.map((a) => [a, waiverAccepted[a] === waiverKey])) }
          : undefined,
        phone: phone.trim(),
        email: email.trim(),
        emergencyPhone: emergencyPhone.trim(),
        shirtSize: noRun ? '' : shirtSize,
        dogName: isDog ? dogName.trim() : undefined,
        dogBreed: isDog ? dogBreed.trim() : undefined,
        dogProfile: isDog ? { name: dogName.trim(), breed: dogBreed.trim(), ...dogExtra } : undefined,
        extraRunners:
          extraPeople > 0
            ? runners.slice(1).map((r) => ({ name: runnerName(r), shirtSize: r.shirtSize, insurance: insured ? toInsurance(r, runners[0]) : undefined }))
            : undefined,
        privacyConsent,
        sponsorCode: wantRun ? sponsor?.code : undefined,
        addOns: hasAddOns(addOns) ? addOns : undefined,
      });
      // Keep these details for the next order (no national ID is saved).
      if (session?.role === 'runner') {
        const r0 = runners[0];
        authApi
          .saveProfile({
            phone: phone.trim(),
            ...(session.user.email ? {} : { email: email.trim() }),
            profile: r0
              ? {
                  firstName: r0.firstName.trim(),
                  lastName: r0.lastName.trim(),
                  shirtSize: r0.shirtSize,
                  gender: r0.gender,
                  birthDate: r0.birthDate,
                  bloodType: r0.bloodType,
                  emergencyName: r0.emergencyName.trim(),
                  emergencyPhone: emergencyPhone.trim(),
                  relationship: r0.relationship,
                }
              : { emergencyPhone: emergencyPhone.trim() },
          })
          .catch(() => {});
      }
      // Sponsor registrations are confirmed on the spot: skip the payment step.
      if (res.order.paymentStatus === 'PAID') {
        await finalizePaidOrder(res.order);
        return;
      }
      const ref = { orderId: res.order.orderId, accessToken: res.accessToken };
      savePendingOrderRef(ref);
      setPendingRef(ref);
      setServerOrder(res.order);
      setPublicCfg(res.config);
      setSlipMessage(null);
      setStep(3);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onNeedLogin?.();
        return;
      }
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

  // Saves the QR as a PNG with a white border so bank apps can scan it from the gallery
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


  // Step names follow what is being bought: a run ticket has a runner + BIB, the rest a buyer + e-ticket.
  const steps = wantRun
    ? [
        { num: 1, title: tr('เลือกระยะวิ่ง', 'Choose distance'), sub: 'Package & Add-on' },
        { num: 2, title: tr('ข้อมูลนักวิ่ง', 'Runner details'), sub: 'Runner & Shirt' },
        { num: 3, title: tr('โอนเงิน', 'Payment'), sub: tr('โอน + แนบสลิป', 'Transfer + slip') },
        { num: 4, title: tr('สำเร็จ ✓', 'Done ✓'), sub: tr('ได้เลข BIB แล้ว', 'Your BIB number') },
      ]
    : [
        { num: 1, title: wantConcert ? tr('เลือกบัตร', 'Choose tickets') : tr('เลือกกิจกรรม', 'Choose activities'), sub: wantConcert ? 'Concert & VIP' : 'Activities' },
        { num: 2, title: wantConcert ? tr('ข้อมูลผู้ซื้อ', 'Buyer details') : tr('ข้อมูลผู้ร่วมกิจกรรม', 'Participant details'), sub: wantConcert ? 'Buyer details' : 'Participants' },
        { num: 3, title: tr('โอนเงิน', 'Payment'), sub: tr('โอน + แนบสลิป', 'Transfer + slip') },
        { num: 4, title: tr('สำเร็จ ✓', 'Done ✓'), sub: 'E-Ticket' },
      ];

  const renderTicketOption = (id: RouteId) => {
    const t = ticketById(id);
    const rTheme = ROUTE_THEME[id];
    const on = selectedRoute === id;

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
                className="inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
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
          </div>
          <div className="text-right">
            <span className="font-display text-lg font-black text-[#261247] tabular-nums">
              <EarlyBirdPrice list={t.basePrice} now={runBasePrice(t.id, earlyBird)} />
            </span>
            <span className="text-[11px] font-extrabold text-[#4B2D78] ml-0.5">บาท</span>
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
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 min-h-[46px] px-3.5 rounded-2xl bg-[#FFE268] hover:bg-[#FFD43B] text-[#261247] text-sm font-black border-2 border-white shadow-[0_4px_0_rgba(0,0,0,0.35)] cursor-pointer shrink-0 active:translate-y-0.5"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[3]" />
                  <span>{tr('ย้อนกลับ', 'Back')}</span>
                </button>
              )}
              <div className={`w-13 h-13 rounded-2xl ${step === 2 ? 'hidden sm:flex' : 'flex'} bg-white/95 border-2 border-[#FFE268] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.35)] items-center justify-center shrink-0 overflow-hidden`}>
                <img loading="lazy" decoding="async"
                  src={LABRADOR_SVG_PATH}
                  alt="น้องสุนัขลาบราดอร์ต้อนรับ"
                  className="w-12 h-12 object-contain translate-y-0.5"
                />
              </div>
              <div>
                {/* one short line on phones: the long version wrapped onto 3 lines and ran into the title */}
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[#FFE268] leading-none whitespace-nowrap mb-1">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>CHANGSUEK RUN 2027<span className="hidden sm:inline"> · SMART E-TICKET & AUTO-BIB</span></span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                  {isAddonOnly ? tr('ซื้อกิจกรรมเสริม', 'Buy activities') : isConcert ? tr('ซื้อตั๋วคอนเสิร์ต / เข้างาน', 'Buy concert / entry tickets') : tr('สมัครวิ่ง & รับบัตรวิ่ง E-BIB', 'Register & get your E-BIB')}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={tr('ปิดหน้าต่าง', 'Close')}
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
                      className={`text-[11px] font-bold truncate hidden sm:block ${
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
                <div role="group" aria-label={tr('เลือกสิ่งที่ต้องการซื้อ (เลือกได้หลายอย่าง)', 'Choose what to buy (you can pick several)')} className="space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D28D9]">{tr('เลือกสิ่งที่ต้องการซื้อ · ติ๊กได้ทั้งหมด หรืออย่างเดียวก็ได้', 'Choose what to buy · tick all of them, or just one')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([
                      { key: 'run', emoji: '🏃', title: tr('ตั๋ววิ่ง', 'Run ticket'), sub: tr('เลือกระยะด้านล่าง', 'Pick a distance below'), on: wantRun, set: setWantRun },
                      { key: 'concert', emoji: '🎶', title: tr('ตั๋วคอนเสิร์ต', 'Concert ticket'), sub: `GA ${formatBaht(concertUnit)} · ${tr('VIP โต๊ะ', 'VIP table')}`, on: wantConcert, set: setWantConcert },
                      { key: 'addon', emoji: '🎢', title: tr('กิจกรรมเสริม (เฉพาะบุคคล)', 'Activities (individuals only)'), sub: tr('หอสูง · ยิงปืน · อุโมงค์ลม', 'High tower · shooting · wind tunnel'), on: wantAddons, set: setWantAddons },
                    ] as const).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        role="checkbox"
                        aria-checked={m.on}
                        onClick={() => m.set(!m.on)}
                        className={`min-h-[64px] rounded-2xl px-3 py-2 text-left border-[3px] transition-all cursor-pointer flex items-center gap-2.5 ${
                          m.on
                            ? 'bg-[#2A1450] text-white border-[#2A1450] shadow-[0_4px_0_#FFC928] -translate-y-0.5'
                            : 'bg-white text-[#2A1450] border-[#2A1450]/25 hover:border-[#2A1450]'
                        }`}
                      >
                        <span className={`w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center ${m.on ? 'bg-[#FFC928] border-[#FFC928] text-[#2A1450]' : 'bg-white border-[#2A1450]/40 text-transparent'}`} aria-hidden="true">
                          <Check className="w-4 h-4 stroke-[3.5]" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-sm font-black"><span aria-hidden="true" className="text-lg">{m.emoji}</span>{m.title}</span>
                          <span className={`block text-xs font-bold ${m.on ? 'text-[#FFD84D]' : 'text-[#6B5A85]'}`}>{m.sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {wantConcert && (
                  <div className="rounded-3xl bg-gradient-to-br from-[#241047] via-[#341866] to-[#4A1F8F] text-white border-[3px] border-[#2A1450] p-4 sm:p-5 space-y-3 shadow-[0_8px_0_#2A1450]">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-2xl bg-[#FFC928] text-2xl flex items-center justify-center" aria-hidden="true">🎶</span>
                      <div>
                        <h3 className="text-lg font-black leading-tight">ตั๋วคอนเสิร์ต / เข้างาน</h3>
                        <p className="text-xs font-semibold text-white/80">ซื้อกี่ใบก็ได้ (ผู้ชมไม่ต้องเป็นผู้วิ่ง) · ตั๋ววิ่งไม่รวมคอนเสิร์ต</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-[#2A1450]">
                      <Stepper
                        label="ตั๋วคอนเสิร์ต GA"
                        hint={`${formatBaht(concertUnit)} บาท / คน${earlyBird ? ` (ปกติ ${formatBaht(CONCERT_PASS_PRICE)})` : ''}`}
                        value={concertQty}
                        onChange={(n: number) => setConcertQty(Math.min(9, Math.max(vipTablesState > 0 ? 0 : 1, n)))}
                        icon={<Music className="w-5 h-5" />}
                      />
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-[#2A1450]">
                      <Stepper
                        label="VIP TABLE (6 ท่าน)"
                        hint={`${formatBaht(vipUnit)} บาท / โต๊ะ${earlyBird ? ` (ปกติ ${formatBaht(VIP_TABLE_PRICE)})` : ''}`}
                        value={vipTablesState}
                        onChange={(n: number) => {
                          const next = Math.min(MAX_VIP_TABLES, Math.max(0, n));
                          setVipTables(next);
                          if (next === 0 && concertQty === 0) setConcertQty(1);
                        }}
                        icon={<Crown className="w-5 h-5" />}
                        max={MAX_VIP_TABLES}
                      />
                    </div>
                    {concertMissing && (
                      <p role="alert" className="text-xs font-bold text-[#FFE268]">กรุณาเลือกตั๋ว GA หรือ VIP TABLE อย่างน้อย 1 อย่าง</p>
                    )}
                  </div>
                )}

                {isAddonOnly && (
                  <div className="rounded-3xl bg-gradient-to-br from-[#FDF2F8] to-[#F3E8FF] border-[3px] border-[#2A1450] p-4 shadow-[0_8px_0_#2A1450] flex items-start gap-3">
                    <span className="w-12 h-12 shrink-0 rounded-2xl bg-[#EC4899] text-2xl flex items-center justify-center" aria-hidden="true">🎢</span>
                    <div>
                      <h3 className="text-lg font-black text-[#2A1450] leading-tight">ซื้อกิจกรรมเสริมอย่างเดียว</h3>
                      <p className="text-xs font-semibold text-[#4B2D78]">ไม่ต้องซื้อตั๋ววิ่งหรือตั๋วคอนเสิร์ต · เลือกกิจกรรมด้านล่างอย่างน้อย 1 อย่าง · ไม่มีเลข BIB และไม่มีเสื้อวิ่ง</p>
                    </div>
                  </div>
                )}

                {!noRun && (<>
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#6D28D9]">
                      1. {tr('เลือกระยะวิ่งบุคคลทั่วไป (General Run)', 'General Run — individuals')}
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
                      <span>2. {tr('เลือกระยะวิ่งร่วมกับน้องสุนัข (Dog Run)', 'Dog Run — run with your dog')}</span>
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
                        <span>เพิ่มผู้ร่วมวิ่งในแพ็กเกจเดียวกัน (น้องสุนัข 1 ตัวรวมในตั๋วแล้ว)</span>
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

                </>)}

                {/* Add-on activities (optional) */}
                {wantAddons && (
                <div
                  className="rounded-[28px] p-[2px]"
                  style={{ background: 'linear-gradient(135deg, #FF7A59 0%, #EC4899 30%, #9333EA 62%, #0EA5E9 100%)', boxShadow: '0 24px 48px -20px rgba(147, 51, 234, 0.45)' }}
                >
                <div className="rounded-[26px] bg-gradient-to-b from-white via-[#FBF8FF] to-[#F3EBFF] p-4 sm:p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-[0_8px_14px_-6px_rgba(245,158,11,0.6)]" style={{ background: 'linear-gradient(135deg, #FDE68A 0%, #FBBF24 55%, #FB923C 100%)' }} aria-hidden="true">🎉</span>
                    <div>
                      <h3 className="text-base font-black text-[#2A1450] leading-tight">{tr('เพิ่มความสนุก · กิจกรรมเสริม (เฉพาะบุคคล) · วันอาทิตย์ที่ 10 ม.ค. 2570', 'More fun · activities (individuals only) · Sunday 10 Jan 2027')}</h3>
                      <p className="text-[11px] font-bold text-[#6F6878]">{tr('ไม่บังคับ · เลือกหลายอย่างได้ ยิ่งเลือกยิ่งคุ้ม', 'Optional · pick several, the more the better value')}</p>
                    </div>
                  </div>
                  <AddOnPicker
                    value={addOns}
                    onChange={setAddOns}
                    windTunnelRemaining={typeof publicCfg?.windTunnelRemaining === 'number' ? publicCfg.windTunnelRemaining : null}
                    discountCtx={discountCtx}
                  />
                </div>
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
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/90 block">
                        SELECTED PASS SUMMARY
                      </span>
                      <h3 className="text-xl font-black leading-tight mt-0.5">{isAddonOnly ? 'กิจกรรมเสริมอย่างเดียว' : isConcert ? 'ตั๋วคอนเสิร์ต / เข้างาน' : ticket.name}</h3>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-black/25 backdrop-blur-xs text-xs font-black border border-white/30">
                        {isAddonOnly ? 'ACTIVITY' : isConcert ? 'CONCERT' : ticket.distanceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Next Auto-BIB Preview Banner + Labrador Mascot */}
                  {!noRun && (
                  <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-r from-[#FAF5FF] to-[#FFFBEB] border border-dashed border-[#8B5CF6]/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img loading="lazy" decoding="async"
                        src={LABRADOR_SVG_PATH}
                        alt="Labrador Mascot"
                        className="w-11 h-11 object-contain shrink-0"
                      />
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6D28D9] block">
                          หมายเลข BIB ของคุณ
                        </span>
                        <span className="text-[11px] font-bold text-[#4B2D78]">
                          ได้เลขทันทีที่ชำระสำเร็จ
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-black text-[#261247] bg-[#FFE268] px-3 py-1 rounded-xl border border-amber-400 shadow-xs">
                      สุ่มเลขให้
                    </span>
                  </div>
                  )}

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
                        {isAddonOnly ? `ผู้เล่น ${peopleCount} คน` : isConcert ? `ตั๋ว ${peopleCount} ใบ` : `ผู้วิ่ง ${peopleCount} คน ${isDog ? `· น้องสุนัข ${dogCount} ตัว` : ''}`}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[#261247]/10 text-xs font-bold text-[#4B2D78]">
                      {wantRun && (
                        <div className="flex justify-between">
                          <span>{`ค่าสมัครหลัก (${ticket.distanceLabel})`}</span>
                          <span className="font-extrabold text-[#261247] tabular-nums"><EarlyBirdPrice list={ticket.basePrice} now={runBasePrice(ticket.id, earlyBird)} /> บาท</span>
                        </div>
                      )}
                      {gaQty > 0 && (
                        <div className="flex justify-between">
                          <span>{`ตั๋วคอนเสิร์ต GA × ${gaQty}`}</span>
                          <span className="font-extrabold text-[#261247] tabular-nums"><EarlyBirdPrice list={CONCERT_PASS_PRICE * gaQty} now={concertUnit * gaQty} /> บาท</span>
                        </div>
                      )}
                      {vipTables > 0 && (
                        <div className="flex justify-between">
                          <span>{`VIP TABLE × ${vipTables} โต๊ะ (${vipTables * VIP_TABLE_SEATS} ท่าน)`}</span>
                          <span className="font-extrabold text-[#261247] tabular-nums"><EarlyBirdPrice list={VIP_TABLE_PRICE * vipTables} now={vipTotal} /> บาท</span>
                        </div>
                      )}
                      {concertDiscount > 0 && (
                        <div className="flex justify-between gap-3 text-emerald-700">
                          <span>🎶 ส่วนลดซื้อคู่วิ่ง + คอนเสิร์ต (10%)</span>
                          <span className="font-extrabold tabular-nums shrink-0">-{formatBaht(concertDiscount)} บาท</span>
                        </div>
                      )}
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
                      {hasAddOns(addOns) && (
                        <div className="flex justify-between gap-3">
                          <span>
                            กิจกรรมเสริม: {addOnLabel(addOns)} × {addOns.people} คน
                          </span>
                          <span className="font-extrabold text-[#261247] tabular-nums shrink-0">+{formatBaht(addOnSum + addOnOff)} บาท</span>
                        </div>
                      )}
                      {addOnOff > 0 && (
                        <div className="flex justify-between gap-3 text-emerald-700">
                          <span>
                            🎉 ส่วนลดกิจกรรม {percentOf(addOnDiscountRate(addOns, discountCtx))}%
                            {' ('}
                            {[
                              addOnCountRate(addOns, discountCtx) > 0 && `${addOns.tower && addOns.gun !== 'none' && addOns.windTunnel && wantRun ? 'วิ่ง + ครบ 3' : '2'} กิจกรรม ${percentOf(addOnCountRate(addOns, discountCtx))}%`,
                              addOnConcertRate(addOns, discountCtx) > 0 && `มีคอนเสิร์ต +${percentOf(addOnConcertRate(addOns, discountCtx))}%`,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                            {')'}
                          </span>
                          <span className="font-extrabold tabular-nums shrink-0">-{formatBaht(addOnOff)} บาท</span>
                        </div>
                      )}
                    </div>

                    {/* Total Box */}
                    <div className="rounded-2xl bg-gradient-to-r from-[#240D47] to-[#3B1870] text-white p-3.5 flex items-center justify-between shadow-md">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FFE268] block">
                          ยอดชำระสุทธิ (PromptPay QR)
                        </span>
                        <span className="text-xs text-white/80 font-bold">
                          {isAddonOnly ? 'กิจกรรมเสริมตามที่เลือก' : isConcert ? 'ตั๋วเข้างาน + คอนเสิร์ต' : 'รวมเสื้อวิ่ง + เหรียญ + E-BIB'}
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
                      disabled={addonMissing || concertMissing || salesClosed}
                      className="disabled:opacity-50 disabled:cursor-not-allowed w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#FFE268] via-[#FFC928] to-[#F59E0B] hover:brightness-105 text-[#261247] font-black text-base border-2 border-[#261247] luminous-pill-btn active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{salesClosed ? (publicCfg?.salesOpensAt ? 'ยังไม่ถึงเวลาเปิดขาย' : 'ขณะนี้ปิดการขายบัตรชั่วคราว') : addonMissing ? 'เลือกอย่างน้อย 1 อย่างก่อน (วิ่ง / คอนเสิร์ต / กิจกรรม)' : concertMissing ? 'เลือกตั๋ว GA หรือ VIP TABLE ก่อน' : 'ดำเนินการต่อ · กรอกข้อมูลผู้สมัคร'}</span>
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
                      {isAddonOnly ? 'ACTIVITY' : isConcert ? 'CONCERT' : ticket.distanceLabel}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-[#2A1450]">
                          {isAddonOnly ? 'ข้อมูลผู้ซื้อกิจกรรมเสริม' : isConcert ? 'ข้อมูลผู้ซื้อตั๋วคอนเสิร์ต' : `ข้อมูลผู้สมัครวิ่ง (${ticket.name})`}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#6B5A85] mt-0.5">
                        {isAddonOnly ? <>กิจกรรมเสริม {peopleCount} คน · เลขบัตรออกหลังชำระเงิน</> : isConcert ? <>ตั๋วคอนเสิร์ต {peopleCount} ใบ · เลขบัตรออกหลังชำระเงิน</> : <>ผู้วิ่ง {peopleCount} คน {isDog ? `· น้องสุนัข ${dogCount} ตัว` : ''} · เลข BIB สุ่มให้หลังชำระเงิน</>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className="text-[11px] font-extrabold uppercase text-[#6B5A85] block">
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

                <div className="relative z-10 space-y-7">
                  {wantRun ? (
                    <FormSection
                      n={1}
                      icon="🏃"
                      color="#C4B5FD"
                      title={runners.length > 1 ? `ข้อมูลนักวิ่ง ${runners.length} คน` : 'ข้อมูลนักวิ่ง'}
                      sub={runners.length > 1 ? 'แตะชื่อด้านบนเพื่อสลับคน · ทุกคนกรอกเหมือนกันและได้ประกันเท่ากัน' : 'กรอกครั้งเดียว ระบบเติมให้ทั้ง BIB ประกัน และเอกสารกิจกรรม'}
                    >
                      <div id="runner-details" className="scroll-mt-4">
                        <RunnerDetailsForm
                          runners={runners}
                          onChange={updateRunner}
                          active={activeRunner}
                          onActive={setActiveRunner}
                          insured={insured}
                          showErrors={showRunnerErrors}
                          distanceLabel={ticket.distanceLabel}
                        />
                      </div>
                      {insured && (
                        <label className="flex items-start gap-2.5 rounded-2xl bg-[#E9FBF6] border-2 border-[#0F766E]/40 p-3.5 cursor-pointer">
                          <input type="checkbox" required checked={insConsent} onChange={(e) => setInsConsent(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#0F766E] shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-[#2A1450] leading-snug">
                            🛡️ ข้าพเจ้ายินยอมให้ผู้จัดงานส่งข้อมูลส่วนบุคคลและข้อมูลสุขภาพข้างต้น{runners.length > 1 ? 'ของนักวิ่งทุกคนในคำสั่งซื้อนี้' : ''}ให้บริษัทประกันภัย เพื่อทำประกันอุบัติเหตุสำหรับกิจกรรมนี้เท่านั้น *
                          </span>
                        </label>
                      )}
                    </FormSection>
                  ) : (
                    <FormSection n={1} icon="👤" color="#C4B5FD" title={isAddonOnly ? 'ข้อมูลผู้ซื้อกิจกรรมเสริม' : 'ข้อมูลผู้ซื้อตั๋ว'}>
                      <div className="rounded-3xl border-[3px] border-[#2A1450] bg-gradient-to-br from-[#F5F0FF] via-white to-[#FFF7DB] p-4 sm:p-5 shadow-[0_6px_0_#2A1450]">
                        <label className={labelCls} htmlFor="buyer-name">ชื่อ - นามสกุล *</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#6B5A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input id="buyer-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="เช่น สมชาย ใจดี" className={inputCls} />
                        </div>
                      </div>
                    </FormSection>
                  )}

                  <FormSection n={2} icon="📞" color="#7DD3FC" title="ช่องทางติดต่อ & รับบัตร" sub="ระบบส่งบัตร BIB / ตั๋ว และใบเสร็จไปที่อีเมลนี้ให้อัตโนมัติหลังชำระเงิน">
                    <div className="rounded-3xl border-[3px] border-[#2A1450] bg-gradient-to-br from-[#E0F2FE] via-white to-[#F5F0FF] p-4 sm:p-5 shadow-[0_6px_0_#2A1450] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className={labelCls} htmlFor="buyer-phone">เบอร์โทรศัพท์ *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[#0284C7] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input id="buyer-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" autoComplete="tel" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls} htmlFor="buyer-emphone">เบอร์โทรผู้ติดต่อฉุกเฉิน *</label>
                        <div className="relative">
                          <ShieldAlert className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input id="buyer-emphone" type="tel" required value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="08x-xxx-xxxx (ญาติ/คนใกล้ชิด)" className={inputCls} />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls} htmlFor="buyer-email">อีเมลรับบัตรและใบเสร็จ *</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#7C3AED] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input id="buyer-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inputCls} />
                        </div>
                      </div>
                    </div>
                  </FormSection>

                  {isDog && (
                    <FormSection n={3} icon="🐶" color="#86EFAC" title={`ข้อมูลน้องสุนัขคู่ใจ (${dogCount} ตัว)`} sub="ชื่อน้องจะพิมพ์ลงบนป้าย Dog Pass">
                      <div className="rounded-3xl border-[3px] border-[#2A1450] bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 sm:p-5 shadow-[0_6px_0_#2A1450] grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3.5 items-end">
                        <div>
                          <label className={labelCls} htmlFor="dog-name">ชื่อน้องสุนัข {dogCount > 1 ? `(ระบุ ${dogCount} ตัว)` : '*'}</label>
                          <input id="dog-name" type="text" required value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder={dogCount > 1 ? 'เช่น ลัคกี้, ถุงทอง' : 'เช่น ลัคกี้'} className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 bg-white text-sm font-semibold text-[#14532D] outline-none" />
                        </div>
                        <div>
                          <label className={labelCls} htmlFor="dog-breed">สายพันธุ์ *</label>
                          <input id="dog-breed" type="text" required value={dogBreed} onChange={(e) => setDogBreed(e.target.value)} placeholder="เช่น โกลเด้น, ชิบะ, พันธุ์ทาง" className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 bg-white text-sm font-semibold text-[#14532D] outline-none" />
                        </div>
                        <img loading="lazy" decoding="async" src={LABRADOR_SVG_PATH} alt="" className="hidden sm:block w-14 h-14 object-contain" />
                      </div>
                      <DogDetailsForm name={dogName} breed={dogBreed} extra={dogExtra} onChange={setDogExtra} showErrors={showDogErrors} />
                    </FormSection>
                  )}

                  {(vipTables > 0 || hasGun || waiverActivities.length > 0) && (
                    <FormSection n={isDog ? 4 : 3} icon="🎟️" color="#FDE68A" title="ข้อมูลเพิ่มเติมของบัตรที่เลือก" sub="ชื่อนักวิ่งเติมให้แล้ว ตรวจแล้วกรอกส่วนที่เหลือ">
                      <div className="space-y-4">
                        {/* VIP TABLE: register the cars that get a parking pass */}
                        {vipTables > 0 && (
                          <div className="rounded-3xl border-2 border-[#F59E0B] bg-[#FFFBEB] p-4 sm:p-5 space-y-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-10 h-10 rounded-2xl bg-[#FFC928] border-2 border-[#2A1450] flex items-center justify-center text-lg shrink-0" aria-hidden="true">🚗</span>
                              <div>
                                <h3 className="text-base font-black text-[#2A1450] leading-tight">ทะเบียนรถสำหรับบัตรจอดรถ VIP</h3>
                                <p className="text-xs font-bold text-[#6B5A85]">
                                  VIP TABLE ได้ที่จอด {VIP_PARKING_PER_TABLE} คันต่อโต๊ะ (รวม {vipTables * VIP_PARKING_PER_TABLE} คัน) · กรอกอย่างน้อย 1 คัน · ได้บัตรจอดรถพร้อม QR หลังชำระเงิน
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {Array.from({ length: vipTables * VIP_PARKING_PER_TABLE }, (_, i) => (
                                <div key={i} className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3 space-y-2">
                                  <span className="block text-xs font-extrabold text-[#2A1450]">
                                    รถคันที่ {i + 1} {i === 0 ? '*' : '(ไม่บังคับ)'}
                                  </span>
                                  <input
                                    type="text"
                                    required={i === 0}
                                    value={plates[i]?.plate || ''}
                                    maxLength={16}
                                    onChange={(e) =>
                                      setPlates((ps) => {
                                        const next = [...ps];
                                        next[i] = { plate: e.target.value, province: ps[i]?.province || '' };
                                        return next;
                                      })
                                    }
                                    placeholder="ทะเบียน เช่น กก 1111"
                                    className="w-full min-h-[48px] px-3 rounded-xl border-2 border-[#2A1450]/20 bg-white text-sm font-semibold text-[#2A1450]"
                                  />
                                  <input
                                    type="text"
                                    required={i === 0 || Boolean(plates[i]?.plate?.trim())}
                                    value={plates[i]?.province || ''}
                                    maxLength={40}
                                    onChange={(e) =>
                                      setPlates((ps) => {
                                        const next = [...ps];
                                        next[i] = { plate: ps[i]?.plate || '', province: e.target.value };
                                        return next;
                                      })
                                    }
                                    placeholder="จังหวัด เช่น กรุงเทพมหานคร"
                                    className="w-full min-h-[48px] px-3 rounded-xl border-2 border-[#2A1450]/20 bg-white text-sm font-semibold text-[#2A1450]"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SHOOTING: each shooter's name (from the runner cards) + the range's safety rules to read and accept */}
                        {hasGun && (
                          <div className="rounded-3xl border-2 border-[#8B5CF6] bg-[#F5F3FF] p-4 sm:p-5 space-y-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-10 h-10 rounded-2xl bg-white border-2 border-[#2A1450] flex items-center justify-center text-lg shrink-0" aria-hidden="true">🎯</span>
                              <div>
                                <h3 className="text-base font-black text-[#2A1450] leading-tight">{tr('ข้อมูลผู้ยิงปืน', 'Shooter details')} ({addOns.people})</h3>
                                <p className="text-xs font-bold text-[#6B5A85]">ใช้ลงทะเบียนกับสนามยิงปืน · อ่านกฎความปลอดภัยด้านล่างแล้วกดรับทราบก่อนชำระเงิน</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {shooterList.map((sh, i) => {
                                const setSh = (patch: Partial<Shooter>) =>
                                  setShooters((ss) => {
                                    const next = [...ss];
                                    next[i] = { ...ss[i], ...patch };
                                    return next;
                                  });
                                return (
                                  <div key={i} className="rounded-2xl bg-white border-2 border-[#2A1450]/15 p-3">
                                    <div>
                                      <label className={labelCls}>ผู้ยิงคนที่ {i + 1}: ชื่อ-นามสกุล *</label>
                                      <input type="text" required value={sh.fullName} maxLength={120} onChange={(e) => setSh({ fullName: e.target.value })} className="w-full min-h-[48px] px-3 rounded-xl border-2 border-[#2A1450]/20 bg-white text-sm font-semibold text-[#2A1450]" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <ShootingSafetyRules accepted={shootingAck} onChange={setShootingAck} />
                          </div>
                        )}

                        {/* TOWER / WIND TUNNEL: participant details filled into the legal waivers, read + accept before paying */}
                        {waiverActivities.length > 0 && (
                          <ActivityWaiverForm
                            activities={waiverActivities}
                            people={waiverPeople}
                            onEdit={(i, patch) =>
                              setWaiverEdits((ws) => {
                                const next = [...ws];
                                const prev = ws[i] || {};
                                next[i] = { ...prev, ...patch, windHealth: patch.windHealth ? { ...(prev.windHealth || {}), ...patch.windHealth } : prev.windHealth };
                                return next;
                              })
                            }
                            accepted={Object.fromEntries(waiverActivities.map((a) => [a, waiverAccepted[a] === waiverKey]))}
                            onAccept={(a) => setWaiverAccepted((w) => ({ ...w, [a]: waiverKey }))}
                          />
                        )}
                      </div>
                    </FormSection>
                  )}
                </div>

                {/* Sponsor code */}
                {wantRun && (
                <div className="relative z-10 rounded-2xl bg-[#FFF8DC] border-2 border-[#F5B800] p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-xl bg-[#FFC928] text-[#2A1450] flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-sm font-black text-[#2A1450]">มีรหัสสปอนเซอร์?</div>
                      <div className="text-[11px] font-semibold text-[#6F6878]">
                        ใส่รหัสเพื่อลงทะเบียนฟรี ได้สิทธิ์วิ่ง (ทุกระยะ) + คอนเสิร์ต
                      </div>
                    </div>
                  </div>

                  {sponsor ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 border-2 border-emerald-500/60 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-emerald-900 min-w-0">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                          <div className="text-sm font-black truncate">ใช้รหัสสำเร็จ · {sponsor.name}</div>
                          <div className="text-[11px] font-bold text-emerald-800">
                            ค่าสมัครวิ่ง 0 บาท (วิ่ง + คอนเสิร์ต) · 1 รหัสต่อผู้วิ่ง 1 คน ไม่รวมผู้ร่วมวิ่ง/น้องหมาเพิ่มและกิจกรรมเสริม
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSponsorCode}
                        className="px-3 py-1.5 rounded-lg bg-white border-2 border-emerald-500/50 text-xs font-extrabold text-emerald-800 cursor-pointer"
                      >
                        เปลี่ยนรหัส
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={sponsorInput}
                        onChange={(e) => {
                          setSponsorInput(e.target.value.toUpperCase());
                          setSponsorError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplySponsorCode();
                          }
                        }}
                        placeholder="เช่น CSR-XXXXXXXX"
                        aria-label="รหัสสปอนเซอร์"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        maxLength={40}
                        className="flex-1 min-h-[48px] px-3.5 rounded-xl border-2 border-[#2A1450]/25 bg-white text-sm font-mono font-bold tracking-wider text-[#2A1450] placeholder:font-sans placeholder:font-semibold placeholder:tracking-normal"
                      />
                      <button
                        type="button"
                        onClick={handleApplySponsorCode}
                        disabled={sponsorChecking || !sponsorInput.trim()}
                        className="min-h-[48px] px-5 rounded-xl bg-[#2A1450] hover:bg-[#3A1C6E] disabled:opacity-50 text-white text-sm font-extrabold cursor-pointer"
                      >
                        {sponsorChecking ? 'กำลังตรวจ...' : 'ใช้รหัส'}
                      </button>
                    </div>
                  )}
                  {sponsorError && (
                    <p role="alert" className="mt-2 text-xs sm:text-sm font-bold text-rose-700">
                      {sponsorError}
                    </p>
                  )}
                </div>
                )}

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

                {!waiversDone && (
                  <div className="relative z-10 p-3 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-900 text-xs font-extrabold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>กรุณาอ่านและกดยอมรับเอกสารสละสิทธิ์ฟ้องร้อง ({waiverActivities.filter((a) => waiverAccepted[a] !== waiverKey).map((a) => (a === 'tower' ? 'โดดหอสูง' : 'อุโมงค์ลม')).join(', ')}) ก่อนชำระเงิน</span>
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
                    className="w-full sm:w-auto min-h-[54px] px-6 rounded-2xl bg-[#2A1450] hover:bg-[#3D1D70] text-white font-black text-base border-[3px] border-[#2A1450] shadow-[0_5px_0_#7C3AED] flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[3]" />
                    <span>ย้อนกลับ ไปเลือกบัตร</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isCreatingOrder || salesClosed || !privacyConsent || !waiversDone || (!isFreeOrder && publicCfg !== null && !publicCfg.paymentReady)}
                    className="w-full sm:w-auto disabled:opacity-60 disabled:cursor-wait px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FFDF5A] via-[#FFC928] to-[#FFAE19] hover:brightness-105 text-[#1E0F38] font-black text-base border border-amber-300 shadow-[0_10px_25px_-6px_rgba(245,158,11,0.5)] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isFreeOrder ? <Gift className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
                    <span>
                      {isCreatingOrder
                        ? isFreeOrder
                          ? 'กำลังลงทะเบียน...'
                          : 'กำลังสร้างคำสั่งซื้อ...'
                        : isFreeOrder
                          ? 'ยืนยันลงทะเบียนฟรี (รหัสสปอนเซอร์)'
                          : `ไปหน้าโอนเงิน (${formatBaht(chargeTotal)} บาท)`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------------- */}
          {/* STEP 3: COUNTDOWN TIMER + PROMPTPAY QR + SLIP VERIFIER     */}
          {/* ---------------------------------------------------------- */}
          {step === 3 && serverOrder && (
            <PaymentStep
              order={serverOrder}
              amount={payAmount}
              bank={{ label: publicCfg?.bankLabel || '', accountNo: publicCfg?.bankAccountNo || '', accountName: publicCfg?.accountName || '' }}
              qrDataUrl={qrDataUrl}
              qrError={qrError}
              hasPromptPay={Boolean(qrPromptPayId)}
              slipBusy={slipBusy}
              slipMessage={slipMessage}
              onSlipFile={handleSlipFile}
              onDownloadQr={handleDownloadQrImage}
              onCancel={handleCancelPendingOrder}
              onExtend={async () => {
                if (!pendingRef) return;
                setServerOrder(await extendPaymentTime(pendingRef));
              }}
            />
          )}

          {/* ---------------------------------------------------------- */}
          {/* STEP 4: GRAND CONGRATULATIONS CELEBRATION & E-BIB PASS     */}
          {/* ---------------------------------------------------------- */}
          {wow && createdOrder && (
            <PaymentWow
              title={createdOrder.paymentMethod === 'SPONSOR_CODE' ? 'ลงทะเบียนสำเร็จ!' : 'เย้! ชำระเงินสำเร็จ'}
              line={createdOrder.bibNumber && /^\d/.test(String(createdOrder.bibNumber)) ? `BIB #${createdOrder.bibNumber} พร้อมแล้ว · ระบบส่งบัตรเข้าอีเมลของคุณ` : 'บัตรของคุณพร้อมแล้ว · ระบบส่งบัตรเข้าอีเมลของคุณ'}
              onDone={() => setWow(false)}
            />
          )}
          {step === 4 && createdOrder && (
            <>
              <PaymentSuccess
                key={`celebration-${celebrationKey}`}
                order={createdOrder as ServerOrder}
                chipLabel={isAddonOnly ? 'ACTIVITY' : isConcert ? 'CONCERT' : ticket.distanceLabel}
                headerGrad={theme.headerGrad}
                startTime={theme.startTime}
                qrUrl={ticketCheckInQrUrl}
                emailReady={Boolean(publicCfg?.emailReady)}
                noRun={noRun}
                onPrint={(fmt) => {
                  setSelectedPrintFormat(fmt);
                  setPrintModalTab('print');
                  setPrintModalOpen(true);
                }}
                onDownloadBib={() => downloadOfficialBibAsPng(createdOrder)}
                onRunnerCenter={() => (onRegistrationSuccess ? onRegistrationSuccess() : onClose())}
                onClose={onClose}
                onOpenAdmin={
                  onOpenAdminModal
                    ? () => {
                        onClose();
                        onOpenAdminModal();
                      }
                    : undefined
                }
              />
              {/* Dedicated Print & Email Preview Modal */}
              <TicketPrintEmailModal
                isOpen={printModalOpen}
                onClose={() => setPrintModalOpen(false)}
                profile={createdOrder}
                initialMode={printModalTab}
                initialPrintFormat={selectedPrintFormat}
              />
            </>
          )}
        </div>

        {/* Lightbox for inspecting uploaded slip in Step 3 */}
      </div>
    </div>
  );
};
