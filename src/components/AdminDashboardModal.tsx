import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  CreditCard,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Users,
  Ticket,
  TrendingUp,
  Settings,
  Shirt,
  QrCode,
  Eye,
  EyeOff,
  Ban,
  Plus,
  RotateCcw,
  ShieldCheck,
  Copy,
  Check,
  Filter,
  Lock,
  User,
  KeyRound,
  LogOut,
  AlertCircle,
  ScanLine,
  Timer,
  XCircle,
  ShieldAlert,
  FileSpreadsheet,
  Activity,
  Gift,
  Trash2,
} from 'lucide-react';
import { RouteId } from '../types';
import { SponsorCodesAdmin } from './SponsorCodesAdmin';
import { TicketScannerAdmin } from './TicketScannerAdmin';
import { WinnersAdmin } from './WinnersAdmin';
import { RunnersAdmin } from './RunnersAdmin';
import {
  TicketOrder,
  PromptPayConfig,
  BibCounters,
  PaymentVerificationStatus,
  DEFAULT_PROMPTPAY_CONFIG,
  exportTicketOrdersToCsv,
  formatBibNumber,
} from '../utils/runnerStorage';
import { ServerOrder, adminApi, adminLogin, clearAdminToken, getAdminRole, getAdminToken, type AdminRole } from '../utils/api';
import { exportInsuranceXlsx } from '../utils/insuranceXlsx';
import { AuditAdmin } from './AuditAdmin';
import { AdminAccountsAdmin } from './AdminAccountsAdmin';
import { ActivityLimitsCard } from './ActivityLimitsCard';
import { formatThaiId } from '../data/shooting';
import { AdminStationRoster, OrderFullDetails } from './AdminStationRoster';
import { SHIRT_SIZES, countShirts } from '../data/shirts';
import { setTestMode, useTestMode } from '../utils/testMode';
import {
  formatPromptPayDisplay,
  formatThaiBankAccount,
  generatePromptPayPayload,
  buildQrWithAmount,
} from '../utils/promptPay';
import {
  SecurityAuditEvent,
  MAX_LOGIN_ATTEMPTS,
  maskPhoneNumber,
  maskEmailAddress,
  getSecurityAuditLogs,
  appendSecurityAuditLog,
  clearSecurityAuditLogs,
} from '../utils/securityShield';
import { formatBaht, ticketById } from '../data/eventData';
import { RunnerBibCard } from './RunnerBibCard';
import { SalesSwitchCard } from './SalesSwitchCard';
import { EarlyBirdCard } from './EarlyBirdCard';
import { AnnouncementsCard } from './AnnouncementsCard';
import { VisitStatsCard } from './VisitStatsCard';
import { PawIcon } from './brand/DogDecor';
import { EasySlipSettingsCard } from './EasySlipSettingsCard';
import { AdminSlipView } from './AdminSlipView';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterModal?: (routeId?: RouteId) => void;
}

const ROUTE_ORDER: RouteId[] = ['10km', '5km', '3km', '1km'];

const ROUTE_BADGE_STYLE: Record<
  RouteId,
  { bg: string; text: string; border: string; label: string; prefix: string }
> = {
  '10km': {
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-300',
    label: '10 km บุคคลทั่วไป',
    prefix: '10-',
  },
  '5km': {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    label: '5 km บุคคลทั่วไป',
    prefix: '05-',
  },
  '3km': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    label: '4 km วิ่งกับน้องสุนัข',
    prefix: '03-',
  },
  '1km': {
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-300',
    label: '1 km วิ่งกับน้องสุนัข',
    prefix: '01-',
  },
};

const SHIRT_SIZE_LIST: readonly string[] = SHIRT_SIZES;

/** Counts in totals: not cancelled, and paid or still inside its payment window. */
const isLiveOrder = (o: ServerOrder) =>
  !o.isTest && !o.cancelledAt && (o.paymentStatus === 'PAID' || !o.expiresAt || new Date(o.expiresAt).getTime() > Date.now());

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterModal,
}) => {
  // Authentication: a signed token issued by the server (/api/admin/login)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAdminToken()));
  const [adminUser, setAdminUser] = useState<string>('admin');
  // what the server allows this account to do (it enforces it; this only hides what would be refused)
  const [adminRole, setAdminRole] = useState<AdminRole>(() => getAdminRole());
  const isOwner = adminRole === 'owner';
  const canManage = adminRole !== 'viewer';
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lockoutSecondsLeft] = useState<number>(0);
  const [nextBibByRoute, setNextBibByRoute] = useState<Record<RouteId, string>>({
    '10km': '-',
    '5km': '-',
    '3km': '-',
    '1km': '-',
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'orders' | 'security' | 'settings' | 'sponsors' | 'scan' | 'winners' | 'runners' | 'admins'>(
    'orders'
  );
  const [orders, setOrders] = useState<TicketOrder[]>([]);
  const [bibCounters, setBibCounters] = useState<BibCounters>({
    '10km': 0,
    '5km': 0,
    '3km': 0,
    '1km': 0,
  });

  // PDPA Privacy Shield Masking State (Default ON to prevent accidental data leaks)
  const [isPiiMasked, setIsPiiMasked] = useState<boolean>(true);
  const testMode = useTestMode();
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEvent[]>([]);

  // Filters for Orders Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState<'ALL' | RouteId>('ALL');
  const [shirtFilter, setShirtFilter] = useState<string>('ALL');
  const [kitFilter, setKitFilter] = useState<'ALL' | 'PENDING_PICKUP' | 'CHECKED_IN'>('ALL');
  // 1-baht test orders are hidden unless asked for; e-mail filter finds tickets that never reached the buyer
  const [showTests, setShowTests] = useState(false);
  const [emailFilter, setEmailFilter] = useState<'ALL' | 'FAILED' | 'NEVER'>('ALL');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [inspectBusy, setInspectBusy] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | PaymentVerificationStatus>(
    'ALL'
  );

  // Inspect Individual BIB & Slip Modal State
  const [inspectingOrder, setInspectingOrder] = useState<TicketOrder | null>(null);
  const [inspectorViewMode, setInspectorViewMode] = useState<'details' | 'slip' | 'bib'>('details');
  // Cancelling an order (never deleting): which row asks for the reason, and the reason typed
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // PromptPay, Admin Credentials & Counter Settings State
  const [configForm, setConfigForm] = useState<PromptPayConfig>(DEFAULT_PROMPTPAY_CONFIG);
  const [counterForm, setCounterForm] = useState<BibCounters>({
    '10km': 2,
    '5km': 2,
    '3km': 2,
    '1km': 1,
  });
  const [testQrAmount, setTestQrAmount] = useState<number>(5);
  const [testQrUrl, setTestQrUrl] = useState<string>('');
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshData = async () => {
    if (!getAdminToken()) return;
    try {
      const [ordersRes, settingsRes] = await Promise.all([adminApi.listOrders(), adminApi.getSettings().catch(() => null)]);
      setOrders(ordersRes.orders);
      setBibCounters(ordersRes.bibCounters);
      setCounterForm(ordersRes.bibCounters);
      setNextBibByRoute(ordersRes.nextBib);
      if (settingsRes) setConfigForm((prev) => ({ ...prev, ...settingsRes.settings, adminUsername: adminUser }));
      setAuditLogs(getSecurityAuditLogs());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(Boolean(getAdminToken()));
      setLoginError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isAuthenticated) refreshData();
  }, [isOpen, isAuthenticated]);

  // Auto-refresh while open so new registrations / payments appear
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    const t = window.setInterval(refreshData, 30000);
    return () => window.clearInterval(t);
  }, [isOpen, isAuthenticated]);

  // Server rejected our token (expired / restarted) -> back to login
  useEffect(() => {
    const onLoggedOut = () => {
      setIsAuthenticated(false);
      setLoginError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
    };
    window.addEventListener('changsuek_admin_logged_out', onLoggedOut);
    return () => window.removeEventListener('changsuek_admin_logged_out', onLoggedOut);
  }, []);

  // Idle Session Auto-Lock (locks admin session if inactive for sessionIdleTimeoutMinutes)
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    const idleMinutes = Math.max(1, configForm.sessionIdleTimeoutMinutes || 15);
    const idleMs = idleMinutes * 60 * 1000;
    let timeoutId: number;

    const resetIdleTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setIsAuthenticated(false);
        clearAdminToken();
        appendSecurityAuditLog({
          action: 'ADMIN_LOGOUT',
          severity: 'INFO',
          actor: configForm.adminUsername || 'admin',
          detail: `ระบบล็อกหน้าจออัตโนมัติเนื่องจากไม่มีการใช้งานเกิน ${idleMinutes} นาที (Idle Session Protection)`,
        });
        setLoginError(
          `เซสชันหมดเวลาอัตโนมัติเนื่องจากไม่มีการใช้งานเกิน ${idleMinutes} นาที เพื่อป้องกันข้อมูลรั่วไหล`
        );
      }, idleMs);
    };

    resetIdleTimer();
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetIdleTimer));
    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
    };
  }, [isOpen, isAuthenticated, configForm.sessionIdleTimeoutMinutes, configForm.adminUsername]);

  // Generate test QR preview in Settings tab
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    if (!configForm.promptPayId.trim() && !configForm.qrPayload?.trim()) {
      setTestQrUrl('');
      return;
    }
    const payload = (configForm.qrPayload?.trim() ? buildQrWithAmount(configForm.qrPayload, testQrAmount) : null) ?? generatePromptPayPayload(configForm.promptPayId, testQrAmount);
    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: { dark: '#113566', light: '#FFFFFF' },
    })
      .then((url) => setTestQrUrl(url))
      .catch(() => setTestQrUrl(''));
  }, [isOpen, isAuthenticated, configForm.promptPayId, configForm.qrPayload, testQrAmount]);

  // Analytics Computations
  const analytics = useMemo(() => {
    // Cancelled orders and unpaid orders whose payment window has closed are not counted.
    const liveOrders = orders.filter((o) => isLiveOrder(o as ServerOrder));
    const validOrders = liveOrders.filter(
      (o) => o.verificationStatus === 'AUTO_VERIFIED' || o.verificationStatus === 'ADMIN_APPROVED'
    );
    const totalTickets = liveOrders.length;
    const verifiedCount = validOrders.length;
    const pendingReviewCount = liveOrders.filter(
      (o) => o.verificationStatus === 'PENDING_REVIEW'
    ).length;
    const testCount = orders.filter((o) => (o as ServerOrder).isTest).length;
    const cancelledCount = orders.filter((o) => !(o as ServerOrder).isTest && (o as ServerOrder).cancelledAt).length;
    const expiredCount = orders.length - liveOrders.length - cancelledCount - testCount;
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const totalPeople = validOrders.reduce((sum, o) => sum + (o.peopleCount || 1), 0);
    const totalDogs = validOrders.reduce((sum, o) => sum + (o.dogCount || 0), 0);
    const checkedInCount = validOrders.filter((o) => o.kitStatus === 'CHECKED_IN').length;

    const byRoute = ROUTE_ORDER.map((rId) => {
      const routeOrders = validOrders.filter((o) => o.routeId === rId);
      const count = routeOrders.length;
      const revenue = routeOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
      const people = routeOrders.reduce((s, o) => s + (o.peopleCount || 1), 0);
      const dogs = routeOrders.reduce((s, o) => s + (o.dogCount || 0), 0);
      const latestSeq = bibCounters[rId] || 0;
      const latestBib = latestSeq > 0 ? formatBibNumber(rId, latestSeq) : '-';
      const nextBib = nextBibByRoute[rId] || '-';

      return {
        routeId: rId,
        ticket: ticketById(rId),
        count,
        revenue,
        revenueShare: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
        people,
        dogs,
        latestBib,
        nextBib,
      };
    });

    // Jerseys: main runner of each paid run order + every extra Dog Run runner (concert / add-on orders have none)
    const shirts = countShirts(validOrders as ServerOrder[]);
    const shirtCounts: Record<string, number> = shirts.bySize;

    return {
      totalTickets,
      cancelledCount,
      expiredCount,
      testCount,
      shirts,
      verifiedCount,
      pendingReviewCount,
      totalRevenue,
      totalPeople,
      totalDogs,
      checkedInCount,
      byRoute,
      shirtCounts,
    };
  }, [orders, bibCounters]);

  // Filtered Orders for Table
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (routeFilter !== 'ALL' && o.routeId !== routeFilter) return false;
      if (shirtFilter !== 'ALL' && o.shirtSize !== shirtFilter) return false;
      if (kitFilter !== 'ALL' && o.kitStatus !== kitFilter) return false;
      if (verificationFilter !== 'ALL' && o.verificationStatus !== verificationFilter) return false;
      if (!showTests && (o as ServerOrder).isTest) return false;
      if (emailFilter !== 'ALL') {
        const so = o as ServerOrder;
        if (so.paymentStatus !== 'PAID' || so.cancelledAt) return false;
        if (emailFilter === 'FAILED' && !(so.emailStatus && !so.emailStatus.ok)) return false;
        if (emailFilter === 'NEVER' && so.emailStatus) return false;
      }

      if (!q) return true;
      return (
        o.bibNumber.toLowerCase().includes(q) ||
        o.fullName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.orderId.toLowerCase().includes(q) ||
        o.paymentRef.toLowerCase().includes(q) ||
        (o.senderBank && o.senderBank.toLowerCase().includes(q)) ||
        (o.dogName && o.dogName.toLowerCase().includes(q))
      );
    });
  }, [orders, searchQuery, routeFilter, shirtFilter, kitFilter, verificationFilter, showTests, emailFilter]);

  const emailProblems = useMemo(
    () => orders.filter((o) => { const so = o as ServerOrder; return so.paymentStatus === 'PAID' && !so.cancelledAt && !so.isTest && so.emailStatus && !so.emailStatus.ok; }).length,
    [orders]
  );

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2800);
  };

  const handleTogglePiiMask = () => {
    const nextMasked = !isPiiMasked;
    setIsPiiMasked(nextMasked);
    if (!nextMasked) {
      const updatedLogs = appendSecurityAuditLog({
        action: 'PII_UNMASKED',
        severity: 'WARNING',
        actor: configForm.adminUsername || 'admin',
        detail: 'ผู้ดูแลระบบเปิดดูข้อมูลส่วนบุคคลแบบเต็ม (Unmasked National ID, Phone & Email)',
      });
      setAuditLogs(updatedLogs);
      showToast('เปิดแสดงข้อมูลส่วนบุคคลแบบเต็ม (บันทึกใน Security Audit Log แล้ว)');
    } else {
      showToast('เปิดโหมดซ่อนข้อมูลส่วนบุคคล (PDPA Data Masking) แล้ว');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const username = await adminLogin(loginUsername.trim(), loginPassword);
      setAdminUser(username);
      setAdminRole(getAdminRole());
      setActiveTab('orders');
      setLoginPassword('');
      setIsAuthenticated(true);
      const updatedLogs = appendSecurityAuditLog({
        action: 'ADMIN_LOGIN_SUCCESS',
        severity: 'INFO',
        actor: username,
        detail: 'เข้าสู่ระบบจัดการแอดมินสำเร็จ',
      });
      setAuditLogs(updatedLogs);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    appendSecurityAuditLog({
      action: 'ADMIN_LOGOUT',
      severity: 'INFO',
      actor: adminUser,
      detail: 'ผู้ดูแลระบบออกจากระบบ',
    });
    clearAdminToken();
    setIsAuthenticated(false);
    setOrders([]);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError(null);
    setIsPiiMasked(true);
  };

  /** re-reads the orders (the server records whether the last ticket e-mail went out) and refreshes the open inspector */
  const reloadInspected = async () => {
    try {
      const fresh = await adminApi.listOrders();
      setOrders(fresh.orders);
      const again = fresh.orders.find((o) => inspectingOrder && o.orderId === inspectingOrder.orderId);
      if (again) setInspectingOrder(again);
    } catch {
      /* the 30-second refresh will catch up */
    }
  };

  const replaceOrder = (updated: ServerOrder) => {
    setOrders((prev) => prev.map((o) => (o.orderId === updated.orderId ? updated : o)));
    if (inspectingOrder && inspectingOrder.orderId === updated.orderId) {
      setInspectingOrder(updated);
    }
  };

  const handleToggleKit = async (orderId: string, action: 'checkin' | 'undo' = 'checkin') => {
    if (action === 'undo' && !window.confirm('ยกเลิกการรับชุดของคำสั่งซื้อนี้? (ใช้เมื่อกดเช็กอินผิดเท่านั้น — ระบบจะบันทึกว่าใครยกเลิก)')) return;
    try {
      const res = await adminApi.toggleKit(orderId, action);
      replaceOrder(res.order);
      if (res.alreadyCheckedIn) showToast('ตั๋วนี้เช็กอินรับชุดไปแล้ว');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ');
    }
  };

  const handleUpdateVerification = async (orderId: string, status: PaymentVerificationStatus) => {
    if (status !== 'ADMIN_APPROVED' && status !== 'REJECTED' && status !== 'PENDING_REVIEW') return;
    try {
      const res = await adminApi.setVerification(orderId, status);
      replaceOrder(res.order);
      setAuditLogs(
        appendSecurityAuditLog({
          action: 'SLIP_STATUS_CHANGED',
          severity: status === 'REJECTED' ? 'WARNING' : 'INFO',
          actor: adminUser,
          detail: `เปลี่ยนสถานะคำสั่งซื้อ ${orderId} เป็น ${status}`,
        })
      );
      showToast(
        status === 'ADMIN_APPROVED'
          ? `อนุมัติ ${orderId} แล้ว — ออกเลข BIB #${res.order.bibNumber}`
          : status === 'REJECTED'
          ? `ปฏิเสธสลิปคำสั่งซื้อ ${orderId} แล้ว`
          : `อัปเดตสถานะการตรวจสอบ ${orderId} แล้ว`
      );
      refreshData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ');
    }
  };

  /** Permanent delete (owner only): the admin must type the order id; the server writes a summary to the audit log. */
  const handleDeleteOrder = async (id: string, name: string) => {
    const typed = window.prompt('ลบคำสั่งซื้อ ' + id + ' (' + name + ') ถาวร กู้คืนไม่ได้\n\nพิมพ์เลขคำสั่งซื้อให้ตรงเพื่อยืนยัน:');
    if (typed === null) return;
    setInspectBusy(true);
    try {
      await adminApi.deleteOrder(id, typed.trim());
      setOrders((prev) => prev.filter((o) => o.orderId !== id));
      setInspectingOrder((cur) => (cur && cur.orderId === id ? null : cur));
      showToast('ลบคำสั่งซื้อ ' + id + ' แล้ว');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    } finally {
      setInspectBusy(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const r = await adminApi.cancelOrder(orderId, cancelReason.trim());
      replaceOrder(r.order);
      setConfirmCancelId(null);
      setCancelReason('');
      showToast(`ยกเลิกคำสั่งซื้อ ${orderId} แล้ว (ข้อมูลยังเก็บไว้ กู้คืนได้)`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ยกเลิกไม่สำเร็จ');
    }
  };

  const handleRestoreOrder = async (orderId: string) => {
    try {
      const r = await adminApi.restoreOrder(orderId);
      replaceOrder(r.order);
      showToast(`กู้คืนคำสั่งซื้อ ${orderId} แล้ว`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'กู้คืนไม่สำเร็จ');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.saveSettings(
        {
          promptPayId: configForm.promptPayId,
          qrPayload: configForm.qrPayload || '',
          accountName: configForm.accountName,
          bankLabel: configForm.bankLabel,
          bankAccountNo: configForm.bankAccountNo || '',
          paymentTimeoutMinutes: configForm.paymentTimeoutMinutes,
        },
        counterForm
      );
      setConfigForm((prev) => ({ ...prev, ...res.settings }));
      setBibCounters(res.bibCounters);
      setCounterForm(res.bibCounters);
      appendSecurityAuditLog({
        action: 'SECURITY_SETTINGS_UPDATED',
        severity: 'INFO',
        actor: adminUser,
        detail: 'อัปเดตการตั้งค่า PromptPay, เวลาโอน และลำดับเลข BIB',
      });
      refreshData();
      showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    }
  };

  const handleCopyBib = (bib: string) => {
    navigator.clipboard.writeText(bib);
    setCopiedId(bib);
    setTimeout(() => setCopiedId(null), 1800);
  };

  /* ============================================================== */
  /* 1. ADMIN LOGIN GATE (checked by the server)                    */
  /* ============================================================== */
  if (!isAuthenticated) {
    const isLockedOut = lockoutSecondsLeft > 0;

    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-md my-auto rounded-[28px] border-2 border-[#2A1450] bg-white text-slate-900 shadow-[0_24px_60px_rgba(0,0,0,0.6),0_8px_0_#2A1450] overflow-hidden">
          <div className="bg-gradient-to-r from-[#180B30] via-[#2A1450] to-[#180B30] text-white px-6 py-5 border-b-2 border-[#2A1450] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FFC928] text-[#180B30] border-2 border-[#180B30] flex items-center justify-center shadow-xs shrink-0">
                <Lock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-[0.2em] text-[#FFC928] block">
                  ADMIN SECURITY GATE · PDPA SHIELD
                </span>
                <h2 className="text-lg font-black tracking-tight">เข้าสู่ระบบจัดการแอดมิน</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">
                ตรวจสอบรหัสผ่านที่เซิร์ฟเวอร์ · ใส่ผิด {MAX_LOGIN_ATTEMPTS} ครั้งจะถูกล็อก 15 นาที
              </span>
            </div>

            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-extrabold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-[#2A1450] mb-1.5">
                ชื่อผู้ใช้งาน (Admin Username) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  disabled={isLockedOut}
                  autoFocus
                  value={loginUsername}
                  onChange={(e) => {
                    setLoginUsername(e.target.value);
                    setLoginError(null);
                  }}
                  placeholder="กรอก Username แอดมิน"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-slate-300 bg-slate-50/70 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#6D28D9] disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#2A1450] mb-1.5">
                รหัสผ่าน (Password) *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  disabled={isLockedOut}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setLoginError(null);
                  }}
                  placeholder="กรอกรหัสผ่านแอดมิน"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border-2 border-slate-300 bg-slate-50/70 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#6D28D9] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  aria-label="แสดงหรือซ่อนรหัสผ่าน"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLockedOut || isLoggingIn}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#FFC928] hover:bg-[#FFD646] text-[#180B30] font-black text-sm border-2 border-[#2A1450] shadow-[0_4px_0_#2A1450] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
              <span>
                {isLoggingIn ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบจัดการตั๋ว & ตรวจสลิปโอนเงิน'}
              </span>
            </button>

          </form>
        </div>
      </div>
    );
  }

  /* ============================================================== */
  /* 2. AUTHENTICATED ADMIN CONSOLE                                 */
  /* ============================================================== */
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-7xl my-auto rounded-[28px] border-2 border-slate-800 bg-[#F8FAFC] text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* ============================================================ */}
        {/* TOP ADMIN CONSOLE HEADER                                     */}
        {/* ============================================================ */}
        <div className="bg-[#180B30] text-white px-5 sm:px-7 py-4 border-b border-white/15 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FFC928] text-[#180B30] flex items-center justify-center font-black shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-[0.2em] text-[#FFC928]">
                  CHANGSUEK RUN 2027 · SECURE ADMIN CONSOLE
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ผู้ดูแล: {adminUser}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/40 text-purple-200 text-[10px] font-bold">
                  <Lock className="w-3 h-3 text-[#FFC928]" />
                  Server-verified session
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight">
                ระบบตรวจสอบสลิปโอนเงิน · ทะเบียนเลข BIB & ป้องกันข้อมูลรั่วไหล
              </h2>
            </div>
          </div>

          {/* Navigation Tabs & Logout / Close Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              type TabId = typeof activeTab;
              const groups: { id: string; label: string; icon: string; tabs: { id: TabId; label: string; icon: string; show: boolean }[] }[] = [
                {
                  id: 'sales', label: 'ขาย', icon: '🧾',
                  tabs: [
                    { id: 'orders', label: 'คำสั่งซื้อ', icon: '🧾', show: true },
                    { id: 'overview', label: 'ภาพรวม', icon: '📊', show: true },
                  ],
                },
                {
                  id: 'people', label: 'ลูกค้า', icon: '👥',
                  tabs: [
                    { id: 'runners', label: 'บัญชีนักวิ่ง', icon: '👥', show: true },
                    { id: 'roster', label: 'รายชื่อตามสถานี', icon: '📋', show: true },
                  ],
                },
                {
                  id: 'event', label: 'หน้างาน', icon: '📷',
                  tabs: [
                    { id: 'scan', label: 'สแกนตั๋ว', icon: '📷', show: canManage },
                    { id: 'winners', label: 'ประกาศผู้ชนะ', icon: '🏆', show: canManage },
                  ],
                },
                {
                  id: 'config', label: 'ตั้งค่า', icon: '⚙️',
                  tabs: [
                    { id: 'sponsors', label: 'รหัสสปอนเซอร์', icon: '🎟️', show: canManage },
                    { id: 'settings', label: 'ตั้งค่า/การชำระเงิน', icon: '⚙️', show: isOwner },
                    { id: 'admins', label: 'บัญชีแอดมิน', icon: '🔑', show: isOwner },
                    { id: 'security', label: 'บันทึกการใช้งาน', icon: '🛡️', show: isOwner },
                  ],
                },
              ];
              const visible = groups.map((g) => ({ ...g, tabs: g.tabs.filter((t) => t.show) })).filter((g) => g.tabs.length);
              const active = visible.find((g) => g.tabs.some((t) => t.id === activeTab)) || visible[0];
              return (
                <div className="flex flex-col gap-1.5">
                  <div className="inline-flex flex-wrap p-1 rounded-2xl bg-white/10 border border-white/15">
                    {visible.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setActiveTab(g.tabs[0].id)}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                          active.id === g.id ? 'bg-[#FFC928] text-[#180B30] shadow-xs' : 'text-white/80 hover:text-white'
                        }`}
                      >
                        <span aria-hidden="true">{g.icon}</span>
                        <span>{g.label}</span>
                      </button>
                    ))}
                  </div>
                  {active.tabs.length > 1 && (
                    <div className="inline-flex flex-wrap gap-1">
                      {active.tabs.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveTab(t.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer flex items-center gap-1 border ${
                            activeTab === t.id ? 'bg-white text-[#180B30] border-white' : 'text-white/85 border-white/25 hover:border-white/60'
                          }`}
                        >
                          <span aria-hidden="true">{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <button
              type="button"
              role="switch"
              aria-checked={testMode}
              onClick={() => {
                if (testMode) {
                  setTestMode(false);
                  showToast('ปิดโหมดทดสอบ 1 บาทแล้ว');
                } else if (
                  window.confirm(
                    [
                      'เปิดโหมดทดสอบ 1 บาท?',
                      '',
                      '• มีผลเฉพาะเบราว์เซอร์นี้ ขณะที่ล็อกอินแอดมินอยู่',
                      '• คำสั่งซื้อที่สร้างจากเบราว์เซอร์นี้จะคิดยอด 1 บาท',
                      '• ใบทดสอบไม่นับในยอดขาย เสื้อ รายชื่อ และไม่ใช้เลข BIB จริง',
                      '• ลูกค้าทั่วไปยังเห็นและจ่ายราคาปกติ',
                    ].join('\n')
                  )
                ) {
                  setTestMode(true);
                  showToast('เปิดโหมดทดสอบ 1 บาทแล้ว (ปิดแอดมินแล้วไปสั่งซื้อในหน้าเว็บได้เลย)');
                }
              }}
              title="โหมดทดสอบ 1 บาท: ใช้ทดลองโอนเงินจริง 1 บาทเพื่อทดสอบระบบตรวจสลิป (เฉพาะเบราว์เซอร์นี้)"
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                testMode ? 'bg-rose-600 text-white ring-2 ring-[#FFC928]' : 'bg-white/10 hover:bg-white/20 text-white/90'
              }`}
            >
              <span aria-hidden="true">🧪</span>
              <span>{testMode ? 'โหมดทดสอบ 1 บาท: เปิดอยู่' : 'โหมดทดสอบ 1 บาท'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="ล็อกหน้าจอ / ออกจากระบบแอดมิน"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-white/90 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ล็อกหน้าจอ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าแอดมิน"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {savedToast && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-extrabold flex items-center justify-between shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedToast}</span>
            </span>
            <button
              type="button"
              onClick={() => setSavedToast(null)}
              className="text-white/80 hover:text-white text-[11px] underline cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* MAIN BODY                                                    */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ---------------------------------------------------------- */}
          {/* TOP 4 KPI CARDS (ALWAYS VISIBLE FOR INSTANT VISIBILITY)    */}
          {/* ---------------------------------------------------------- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>จำนวนตั๋ว & สถานะตรวจสลิป</span>
                <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ScanLine className="w-4 h-4" />
                </span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums">
                {analytics.totalTickets}{' '}
                <span className="text-xs font-sans font-bold text-slate-500">ใบ</span>
              </div>
              {(analytics.cancelledCount > 0 || analytics.expiredCount > 0) && (
                <div className="text-[10.5px] font-bold text-slate-400">
                  ไม่นับ: ยกเลิก {analytics.cancelledCount} · หมดเวลาชำระ {analytics.expiredCount}{analytics.testCount > 0 ? ` · ใบทดสอบ ${analytics.testCount}` : ''}
                </div>
              )}
              <div className="text-[11px] font-bold text-emerald-600 mt-1">
                ✓ ยืนยันโอนจริง {analytics.verifiedCount} ใบ
                {analytics.pendingReviewCount > 0
                  ? ` · รอตรวจ ${analytics.pendingReviewCount} ใบ`
                  : ''}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>รายได้รวมที่ยืนยันแล้ว</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-700 mt-1 tabular-nums">
                ฿{formatBaht(analytics.totalRevenue)}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-1 truncate">
                {configForm.bankLabel} {formatThaiBankAccount(configForm.bankAccountNo || '')}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>นักวิ่งรวม / รับ BIB แล้ว</span>
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums">
                {analytics.totalPeople}{' '}
                <span className="text-xs font-sans font-bold text-slate-500">คน</span>
              </div>
              <div className="text-[11px] font-bold text-amber-700 mt-1">
                รับเสื้อ/BIB แล้ว {analytics.checkedInCount} จาก {analytics.totalTickets} ใบ
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>สถานะป้องกันข้อมูลรั่วไหล</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
              <div className="font-mono text-lg sm:text-xl font-black text-emerald-700 mt-1.5">
                {isPiiMasked ? 'PDPA MASKED' : 'UNMASKED VIEW'}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-1">
                ตรวจสิทธิ์ที่เซิร์ฟเวอร์ · ล็อกเมื่อว่าง {configForm.sessionIdleTimeoutMinutes || 15} นาที
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* TAB 1: ORDERS, SLIP VERIFICATION & BIB DIRECTORY           */}
          {/* ========================================================== */}
          {loadError && (
            <div role="alert" className="mb-4 p-3 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-800 text-xs font-extrabold flex items-center justify-between gap-2">
              <span>โหลดข้อมูลไม่สำเร็จ: {loadError}</span>
              <button type="button" onClick={refreshData} className="px-3 py-1 rounded-lg bg-white border border-rose-300 cursor-pointer">ลองใหม่</button>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filter, PDPA Mask Toggle & Safe Export Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาด้วยเลข BIB (เช่น 10-0001), ชื่อผู้ซื้อ, เบอร์โทร, เลขอ้างอิงสลิปธนาคาร..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6D28D9]"
                    />
                  </div>

                  {/* Action Buttons: PDPA Mask Toggle, Safe Export & New Ticket */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Toggle PDPA Masking */}
                    <button
                      type="button"
                      onClick={handleTogglePiiMask}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                        isPiiMasked
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200'
                      }`}
                    >
                      {isPiiMasked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>ซ่อนข้อมูล PDPA: เปิดอยู่ (คลิกดูเต็ม)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-800" />
                          <span>กำลังแสดงข้อมูลเต็ม (คลิกเพื่อซ่อน)</span>
                        </>
                      )}
                    </button>

                    {/* Export Masked CSV (PDPA Safe) */}
                    <button
                      type="button"
                      onClick={() => {
                        exportTicketOrdersToCsv(filteredOrders.filter((o) => !(o as ServerOrder).isTest), {
                          maskSensitiveData: true,
                          actor: configForm.adminUsername || 'admin',
                        });
                        setAuditLogs(getSecurityAuditLogs());
                        showToast('ส่งออกไฟล์ CSV แบบปิดบังข้อมูลส่วนบุคคล (PDPA Safe) เรียบร้อยแล้ว');
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>ส่งออก CSV (ซ่อนข้อมูล PDPA)</span>
                    </button>

                    {/* Export for the insurance company */}
                    {canManage && <button
                      type="button"
                      onClick={() => {
                        adminApi
                          .exportOrders('insurance')
                          .then((r) => exportInsuranceXlsx(r.orders.filter((o) => !o.isTest), adminUser))
                          .then((n) => {
                            showToast(n > 0 ? `ส่งออกไฟล์ Excel ทำประกัน (แบบฟอร์ม MTI) ${n} คน (เฉพาะที่ชำระเงินแล้ว) — บันทึกในบันทึกการใช้งานแล้ว` : 'ยังไม่มีนักวิ่งที่ชำระเงินแล้วสำหรับทำประกัน');
                          })
                          .catch((err) => showToast(err instanceof Error ? err.message : 'ส่งออกไม่สำเร็จ'));
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span aria-hidden="true">🛡️</span>
                      <span>Excel ทำประกัน (แบบฟอร์ม MTI)</span>
                    </button>}

                    {/* Export Full CSV */}
                    {canManage && <button
                      type="button"
                      onClick={() => {
                        const wanted = new Set(filteredOrders.filter((o) => !(o as ServerOrder).isTest).map((o) => o.orderId));
                        adminApi
                          .exportOrders('full')
                          .then((r) => {
                            exportTicketOrdersToCsv(r.orders.filter((o) => wanted.has(o.orderId)), { maskSensitiveData: false, actor: adminUser });
                            showToast('ส่งออกไฟล์ CSV ข้อมูลเต็มแล้ว — บันทึกในบันทึกการใช้งานแล้ว');
                          })
                          .catch((err) => showToast(err instanceof Error ? err.message : 'ส่งออกไม่สำเร็จ'));
                      }}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#FFC928]" />
                      <span>CSV (ข้อมูลเต็ม)</span>
                    </button>}

                    {onOpenRegisterModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenRegisterModal();
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ออกตั๋วใหม่</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Pills Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  {/* Distance Filter */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-500 flex items-center gap-1 mr-1">
                      <Filter className="w-3.5 h-3.5" /> ระยะวิ่ง:
                    </span>
                    {(
                      [
                        { id: 'ALL', label: `ทั้งหมด (${orders.length})` },
                        { id: '10km', label: '10 km (10-XXXX)' },
                        { id: '5km', label: '5 km (05-XXXX)' },
                        { id: '3km', label: '4 km Dog (03-XXXX)' },
                        { id: '1km', label: '1 km Dog (01-XXXX)' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRouteFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg font-extrabold transition-colors cursor-pointer ${
                          routeFilter === tab.id
                            ? 'bg-[#180B30] text-[#FFC928]'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Verification Status, Shirt Size & Kit Status Selects */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="กรองตามสถานะตรวจสลิป"
                      value={verificationFilter}
                      onChange={(e) =>
                        setVerificationFilter(e.target.value as 'ALL' | PaymentVerificationStatus)
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 text-xs"
                    >
                      <option value="ALL">สถานะตรวจสลิปทั้งหมด</option>
                      <option value="AWAITING_PAYMENT">… รอชำระเงิน / ยังไม่แนบสลิป</option>
                      <option value="AUTO_VERIFIED">✓ ตรวจสลิปผ่านอัตโนมัติ</option>
                      <option value="ADMIN_APPROVED">✓ แอดมินอนุมัติแล้ว</option>
                      <option value="PENDING_REVIEW">⏳ รอแอดมินตรวจสลิป</option>
                      <option value="REJECTED">✕ สลิปไม่ถูกต้อง/ปฏิเสธ</option>
                    </select>

                    <select
                      aria-label="กรองตามไซส์เสื้อ"
                      value={shirtFilter}
                      onChange={(e) => setShirtFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 text-xs"
                    >
                      <option value="ALL">ทุกไซส์เสื้อ (XS–10XL)</option>
                      {SHIRT_SIZE_LIST.map((sz) => (
                        <option key={sz} value={sz}>
                          เสื้อไซส์ {sz}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="กรองตามสถานะรับ BIB"
                      value={kitFilter}
                      onChange={(e) =>
                        setKitFilter(e.target.value as 'ALL' | 'PENDING_PICKUP' | 'CHECKED_IN')
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 text-xs"
                    >
                      <option value="ALL">สถานะรับ BIB ทั้งหมด</option>
                      <option value="PENDING_PICKUP">รอรับเสื้อ/BIB หน้างาน</option>
                      <option value="CHECKED_IN">✓ เช็กอินรับ BIB แล้ว</option>
                    </select>

                    <select
                      aria-label="กรองตามสถานะอีเมลตั๋ว"
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value as 'ALL' | 'FAILED' | 'NEVER')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 text-xs"
                    >
                      <option value="ALL">อีเมลตั๋ว: ทั้งหมด</option>
                      <option value="FAILED">✉ ส่งไม่สำเร็จ{emailProblems ? ` (${emailProblems})` : ''}</option>
                      <option value="NEVER">✉ ยังไม่มีบันทึกการส่ง</option>
                    </select>

                    <label className="inline-flex items-center gap-1.5 px-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={showTests} onChange={(e) => setShowTests(e.target.checked)} />
                      แสดงออเดอร์ทดสอบ 1 บาท
                    </label>
                  </div>
                </div>
              </div>

              {!showTests && orders.some((o) => (o as ServerOrder).isTest) && (
                <div role="status" className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-amber-900">
                    🧪 มีออเดอร์ทดสอบ 1 บาท {orders.filter((o) => (o as ServerOrder).isTest).length} รายการ ซ่อนอยู่ (ไม่นับในยอดขายและสถิติ) · ออเดอร์ที่คุณซื้อลองด้วยโหมดทดสอบจะอยู่ตรงนี้
                  </p>
                  <button type="button" onClick={() => setShowTests(true)} className="min-h-[44px] px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black cursor-pointer">
                    แสดงออเดอร์ทดสอบ
                  </button>
                </div>
              )}

              {/* Buyers, Slip Verification & BIB Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        <th className="py-3 px-4">หมายเลข BIB</th>
                        <th className="py-3 px-4">
                          ชื่อผู้ซื้อตั๋ว / ข้อมูลติดต่อ ({isPiiMasked ? 'PDPA Masked' : 'Full'})
                        </th>
                        <th className="py-3 px-4">ระยะวิ่ง & เสื้อ</th>
                        <th className="py-3 px-4">ข้อมูลโอนเงิน & เวลาโอน</th>
                        <th className="py-3 px-4 text-center">สถานะตรวจสอบสลิป</th>
                        <th className="py-3 px-4 text-center">สถานะรับ BIB หน้างาน</th>
                        <th className="py-3 px-4 text-right">ตรวจสลิป / ดูป้าย BIB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                            ไม่พบรายการตั๋วหรือหมายเลข BIB ที่ตรงกับเงื่อนไขการค้นหา
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          const badge = ROUTE_BADGE_STYLE[order.routeId] || ROUTE_BADGE_STYLE['5km'];
                          const isCheckedIn = order.kitStatus === 'CHECKED_IN';
                          const vStatus = order.verificationStatus || 'AUTO_VERIFIED';

                          return (
                            <tr
                              key={order.orderId}
                              className={`hover:bg-slate-50/90 transition-colors ${isLiveOrder(order as ServerOrder) ? '' : 'opacity-55 bg-slate-50'}`}
                            >
                              {/* BIB Number Column */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {(order as ServerOrder).isTest && (
                                  <span className="mb-1 mr-1 inline-block rounded-md bg-amber-500 text-slate-950 px-1.5 py-0.5 text-[10px] font-black" title="ใบทดสอบ 1 บาท ไม่นับในยอดขาย">
                                    🧪 ทดสอบ
                                  </span>
                                )}
                                {(order as ServerOrder).cancelledAt ? (
                                  <span className="mb-1 inline-block rounded-md bg-rose-600 text-white px-1.5 py-0.5 text-[10px] font-black" title={(order as ServerOrder).cancelReason}>
                                    ยกเลิกแล้ว
                                  </span>
                                ) : !isLiveOrder(order as ServerOrder) && !(order as ServerOrder).isTest ? (
                                  <span className="mb-1 inline-block rounded-md bg-slate-400 text-white px-1.5 py-0.5 text-[10px] font-black">หมดเวลาชำระ</span>
                                ) : null}
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-mono text-base font-black px-2.5 py-1 rounded-xl border ${badge.bg} ${badge.text} ${badge.border} tabular-nums`}
                                  >
                                    #{order.bibNumber}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyBib(order.bibNumber)}
                                    title="คัดลอกเลข BIB"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                  >
                                    {copiedId === order.bibNumber ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                                  {order.orderId}
                                </div>
                              </td>

                              {/* Buyer Name & PDPA Masked Contact */}
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-slate-900 text-sm">
                                  {order.fullName}
                                </div>
                                <div className="font-mono text-xs font-semibold text-slate-600 mt-0.5">
                                  โทร: {isPiiMasked ? maskPhoneNumber(order.phone) : order.phone}
                                </div>
                                <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                                  {isPiiMasked ? maskEmailAddress(order.email) : order.email}
                                </div>
                                {(order as ServerOrder).paymentStatus === 'PAID' && !(order as ServerOrder).cancelledAt && (
                                  (order as ServerOrder).emailStatus ? (
                                    (order as ServerOrder).emailStatus!.ok ? (
                                      <span className="mt-0.5 inline-block rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-extrabold">✉ ส่งตั๋วแล้ว</span>
                                    ) : (
                                      <span className="mt-0.5 inline-block rounded-md bg-rose-50 text-rose-700 border border-rose-300 px-1.5 py-0.5 text-[10px] font-extrabold" title={(order as ServerOrder).emailStatus!.error}>✉ ส่งไม่สำเร็จ — กดส่งซ้ำ</span>
                                    )
                                  ) : (
                                    <span className="mt-0.5 inline-block rounded-md bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold">✉ ยังไม่มีบันทึกการส่ง</span>
                                  )
                                )}
                                {(order as ServerOrder).refundedAt && (
                                  <span className="mt-0.5 ml-1 inline-block rounded-md bg-violet-50 text-violet-800 border border-violet-300 px-1.5 py-0.5 text-[10px] font-extrabold">↩ คืนเงิน {formatBaht((order as ServerOrder).refundAmount || 0)}</span>
                                )}
                                {order.addOns && (
                                  <div className="text-[11px] font-extrabold text-[#B45309] mt-0.5">
                                    🎉 กิจกรรมเสริม: {order.addOns.label} × {order.addOns.people} คน ({formatBaht(order.addOns.total)} บาท)
                                  </div>
                                )}
                                {order.extraRunnerNames && (
                                  <div className="text-[11px] font-bold text-purple-700 mt-0.5">
                                    + ผู้ร่วมวิ่ง: {order.extraRunnerNames}
                                  </div>
                                )}
                              </td>

                              {/* Distance & Shirt Size */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}
                                  >
                                    {order.routeName}
                                  </span>
                                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-slate-900 text-[#FFC928] font-display font-black text-xs">
                                    {order.shirtSize}
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-600 mt-1">
                                  คนวิ่ง {order.peopleCount} ท่าน
                                  {order.runningWithDog
                                    ? ` · น้องสุนัข ${order.dogCount} ตัว (${order.dogName || '-'})`
                                    : ''}
                                </div>
                              </td>

                              {/* Transfer Amount, Bank, Ref & Timer Duration */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm font-black text-slate-900 tabular-nums">
                                    ฿{formatBaht(order.totalPrice)}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                    {order.senderBank || 'PromptPay'}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                                  Ref: {order.paymentRef}
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Timer className="w-3 h-3 text-purple-600" />
                                  <span>โอนภายใน {order.transferDurationSec || 45} วินาที</span>
                                </div>
                              </td>

                              {/* Slip Verification Status Column */}
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                {vStatus === 'ADMIN_APPROVED' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>แอดมินยืนยันโอนจริง</span>
                                  </span>
                                )}
                                {vStatus === 'AUTO_VERIFIED' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-900 border border-teal-300 text-[11px] font-extrabold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                    <span>ตรวจสลิปผ่านอัตโนมัติ</span>
                                  </span>
                                )}
                                {vStatus === 'PENDING_REVIEW' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectorViewMode('slip');
                                      setInspectingOrder(order);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-400 text-[11px] font-extrabold cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                                    <span>รอตรวจสลิป (คลิกตรวจ)</span>
                                  </button>
                                )}
                                {vStatus === 'AWAITING_PAYMENT' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-extrabold">
                                    <Timer className="w-3.5 h-3.5 text-slate-500" />
                                    <span>รอชำระเงิน</span>
                                  </span>
                                )}
                                {vStatus === 'REJECTED' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-extrabold">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>ปฏิเสธสลิป</span>
                                  </span>
                                )}
                              </td>

                              {/* Race Kit Check-in Toggle */}
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  disabled={!canManage}
                                  title={isCheckedIn ? 'รับชุดแล้ว (ยกเลิกได้ในหน้ารายละเอียด)' : 'กดเมื่อจ่ายชุดให้ผู้ซื้อแล้ว'}
                                  onClick={() => !isCheckedIn && handleToggleKit(order.orderId)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                    isCheckedIn
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                  }`}
                                >
                                  {isCheckedIn ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>รับ BIB แล้ว</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                                      <span>รอรับ BIB</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              {/* Inspect Slip / Print BIB & Delete */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectorViewMode('slip');
                                      setInspectingOrder(order);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold text-xs inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <ScanLine className="w-3.5 h-3.5" />
                                    <span>ดูสลิปโอนเงิน</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectorViewMode('bib');
                                      setInspectingOrder(order);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>บัตร BIB</span>
                                  </button>

                                  {(order as ServerOrder).cancelledAt ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRestoreOrder(order.orderId)}
                                      title={`ยกเลิกโดย ${(order as ServerOrder).cancelledBy || '-'}: ${(order as ServerOrder).cancelReason || '-'}`}
                                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] cursor-pointer"
                                    >
                                      ↩ กู้คืน
                                    </button>
                                  ) : confirmCancelId === order.orderId ? (
                                    <span className="inline-flex items-center gap-1">
                                      <input
                                        autoFocus
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && cancelReason.trim().length >= 3 && handleCancelOrder(order.orderId)}
                                        placeholder="เหตุผลที่ยกเลิก"
                                        maxLength={300}
                                        className="w-36 px-2 py-1.5 rounded-lg border border-rose-300 text-[11px] font-semibold"
                                      />
                                      <button
                                        type="button"
                                        disabled={cancelReason.trim().length < 3}
                                        onClick={() => handleCancelOrder(order.orderId)}
                                        className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-extrabold text-[11px] cursor-pointer disabled:opacity-40"
                                      >
                                        ยืนยันยกเลิก
                                      </button>
                                      <button type="button" onClick={() => setConfirmCancelId(null)} aria-label="ไม่ยกเลิก" className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmCancelId(order.orderId);
                                        setCancelReason('');
                                      }}
                                      title="ยกเลิกคำสั่งซื้อ (ข้อมูลยังเก็บไว้ กู้คืนได้)"
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  )}
                                  {isOwner && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOrder(order.orderId, order.fullName)}
                                      title="ลบคำสั่งซื้อถาวร (กู้คืนไม่ได้)"
                                      aria-label={'ลบคำสั่งซื้อ ' + order.orderId + ' ถาวร'}
                                      className="inline-flex items-center gap-1 rounded-xl border border-rose-300 px-2 py-1.5 text-[11px] font-extrabold text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> ลบถาวร
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: SALES BY DISTANCE & SHIRT STOCK ANALYTICS           */}
          {/* ========================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <SalesSwitchCard />
              <EarlyBirdCard />
              <AnnouncementsCard />
              <VisitStatsCard />

              {/* Distance Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      สรุปยอดขายตั๋วและหมายเลข BIB แยกตามระยะวิ่ง (4 ประเภท)
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      แสดงจำนวนตั๋วที่ขายได้ เลข BIB ล่าสุด และเลข BIB ถัดไปที่จะออกอัตโนมัติของแต่ละระยะ
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        <th className="py-3 px-4">ระยะทางวิ่ง</th>
                        <th className="py-3 px-4 text-center">ตั๋วที่ขายได้ (ใบ)</th>
                        <th className="py-3 px-4 text-center">นักวิ่งรวม (คน)</th>
                        <th className="py-3 px-4 text-center">น้องสุนัขรวม (ตัว)</th>
                        <th className="py-3 px-4 text-center">เลข BIB ล่าสุด</th>
                        <th className="py-3 px-4 text-center">เลข BIB ถัดไป</th>
                        <th className="py-3 px-4 text-right">รายได้รวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {analytics.byRoute.map((row) => {
                        const badge = ROUTE_BADGE_STYLE[row.routeId];
                        return (
                          <tr key={row.routeId} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-extrabold text-slate-900">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg border mr-2 ${badge.bg} ${badge.text} ${badge.border}`}
                              >
                                {row.ticket.distanceLabel}
                              </span>
                              <span>{row.ticket.name}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-sm font-black text-slate-900 tabular-nums">
                              {row.count}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-sm font-bold text-slate-700 tabular-nums">
                              {row.people}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-sm font-bold text-slate-700 tabular-nums">
                              {row.dogs > 0 ? row.dogs : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-mono font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg tabular-nums">
                                #{row.latestBib}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-mono font-black text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg tabular-nums">
                                #{row.nextBib}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-sm font-black text-emerald-700 tabular-nums">
                              ฿{formatBaht(row.revenue)} ({row.revenueShare}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shirt Size Inventory Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shirt className="w-5 h-5 text-purple-700" />
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        สรุปจำนวนเสื้อวิ่งแยกตามไซส์ (Jersey Size Breakdown)
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        สำหรับฝ่ายจัดซื้อและจุดแจกเสื้อ Race Pack หน้างาน · รวม {analytics.shirts.total} ตัว (นักวิ่งที่ชำระแล้ว + ผู้ร่วมวิ่งเพิ่ม · ไม่นับตั๋วคอนเสิร์ต/กิจกรรมเสริม)
                      </p>
                      {(analytics.shirts.unknown > 0 || analytics.shirts.fromText > 0) && (
                        <p className="mt-1 text-xs font-bold text-amber-700">
                          ⚠️ คำสั่งซื้อรุ่นเก่ากรอกไซส์ผู้ร่วมวิ่งเพิ่มเป็นข้อความ: อ่านไซส์จากข้อความได้ {analytics.shirts.fromText} ตัว (นับรวมแล้ว ควรตรวจซ้ำ)
                          {analytics.shirts.unknown > 0 ? ` · อ่านไม่ออก ${analytics.shirts.unknown} ตัว (ไม่ได้นับ ดูชื่อได้ในรายการคำสั่งซื้อ)` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {SHIRT_SIZE_LIST.map((sz) => {
                    const count = analytics.shirtCounts[sz] || 0;
                    return (
                      <div
                        key={sz}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center"
                      >
                        <div className="text-xs font-extrabold text-slate-500 uppercase">
                          SIZE {sz}
                        </div>
                        <div className="font-mono text-2xl font-black text-slate-900 my-1 tabular-nums">
                          {count}
                        </div>
                        <div className="text-[11px] font-bold text-purple-700">ตัว</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: SECURITY SHIELD & ANTI-DATA LEAK CENTER (PDPA)      */}
          {/* ========================================================== */}
          {activeTab === 'security' && isOwner && <AuditAdmin />}
          {activeTab === 'admins' && isOwner && <AdminAccountsAdmin />}

          {/* ========================================================== */}
          {/* TAB 4: PROMPTPAY, TIMER, ADMIN CREDENTIALS & BIB COUNTERS  */}
          {/* ========================================================== */}
          {activeTab === 'roster' && (
            <AdminStationRoster
              orders={orders as ServerOrder[]}
              masked={isPiiMasked}
              onInspect={(o) => {
                setInspectorViewMode('details');
                setInspectingOrder(o);
              }}
            />
          )}
          {activeTab === 'sponsors' && <SponsorCodesAdmin />}
          {activeTab === 'scan' && <TicketScannerAdmin />}
          {activeTab === 'winners' && <WinnersAdmin />}
          {activeTab === 'runners' && (
            <RunnersAdmin
              onOpenOrder={(id) => {
                const o = orders.find((x) => x.orderId === id);
                if (o) {
                  setInspectorViewMode('details');
                  setInspectingOrder(o);
                } else {
                  setActiveTab('orders');
                  setSearchQuery(id);
                }
              }}
            />
          )}

          {activeTab === 'settings' && isOwner && (
            <div className="mb-6">
              <ActivityLimitsCard />
            </div>
          )}

          {activeTab === 'settings' && isOwner && (
            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 cols */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. PromptPay & Timer Settings */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <QrCode className="w-5 h-5 text-[#113566]" />
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        ตั้งค่าบัญชี PromptPay QR & เวลาจับเวลาตอนโอน
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        กำหนดเบอร์โทรศัพท์ 10 หลัก หรือเลขประจำตัว 13 หลัก และเวลาจำกัดในการโอนแต่ละรอบ
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        รหัสพร้อมเพย์สำหรับสร้าง QR (เบอร์ 10 หลัก / เลขบัตร 13 หลัก / เลขอ้างอิง K PLUS 15 หลัก) *
                      </label>
                      <input
                        type="text"
                        value={configForm.promptPayId}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, promptPayId: e.target.value })
                        }
                        placeholder="004999254157786"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        เวลาจับเวลาตอนโอน (นาที) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        required
                        value={configForm.paymentTimeoutMinutes || 30}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            paymentTimeoutMinutes: Math.max(
                              1,
                              Math.min(60, parseInt(e.target.value || '30', 10))
                            ),
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-black text-purple-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        ธนาคาร *
                      </label>
                      <input
                        type="text"
                        required
                        value={configForm.bankLabel}
                        onChange={(e) => setConfigForm({ ...configForm, bankLabel: e.target.value })}
                        placeholder="ธนาคารกสิกรไทย"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        ข้อความ QR ของธนาคาร (ใช้สร้าง QR พร้อมยอด · ถ้าใส่ จะใช้แทนรหัสพร้อมเพย์)
                      </label>
                      <textarea
                        rows={3}
                        value={configForm.qrPayload || ''}
                        onChange={(e) => setConfigForm({ ...configForm, qrPayload: e.target.value })}
                        placeholder="000201010211…"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900 break-all"
                      />
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        ได้จากการสแกนรูป QR ร้านค้าของธนาคารด้วยแอปอ่าน QR (ได้ข้อความขึ้นต้น 000201) เว็บจะใส่ยอดเงินให้เอง
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        เลขบัญชีธนาคาร (แสดงให้ผู้โอนด้วยมือ)
                      </label>
                      <input
                        type="text"
                        value={configForm.bankAccountNo || ''}
                        onChange={(e) => setConfigForm({ ...configForm, bankAccountNo: e.target.value })}
                        placeholder="240-8-67764-8"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        ชื่อบัญชีที่แสดงบนหน้าสแกนจ่ายและในสลิป *
                      </label>
                      <input
                        type="text"
                        required
                        value={configForm.accountName}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, accountName: e.target.value })
                        }
                        placeholder="ชื่อบัญชีตามสมุดบัญชีธนาคาร"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment check: PromptPay transfer + slip (EasySlip) */}
                <EasySlipSettingsCard />

                {/* 2. Admin Username, Password & Security Policy Settings */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Lock className="w-5 h-5 text-purple-700" />
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        บัญชีแอดมิน & การล็อกหน้าจอ
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        เวลาล็อกหน้าจออัตโนมัติเมื่อไม่มีการใช้งาน
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-semibold text-slate-600 leading-relaxed">
                      ชื่อผู้ใช้และรหัสผ่านแอดมินตั้งที่เซิร์ฟเวอร์ผ่านตัวแปร{' '}
                      <code className="font-mono bg-white px-1 rounded">ADMIN_USERNAME</code> และ{' '}
                      <code className="font-mono bg-white px-1 rounded">ADMIN_PASSWORD</code>{' '}
                      (เปลี่ยนจากหน้าเว็บไม่ได้ เพื่อความปลอดภัย)
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        ล็อกหน้าจอเมื่อว่าง (นาที) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        required
                        value={configForm.sessionIdleTimeoutMinutes || 15}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            sessionIdleTimeoutMinutes: Math.max(
                              1,
                              parseInt(e.target.value || '15', 10)
                            ),
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-black text-emerald-800"
                      />
                    </div>
                  </div>


                </div>

                {/* 3. BIB Counter Settings */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">
                      ตั้งค่าตัวนับเลข BIB ล่าสุดแยกตามระยะ (Sequential BIB Counters)
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      ผู้ซื้อตั๋วคนถัดไปจะได้รับเลขลำดับ = (ค่าตัวนับปัจจุบัน + 1) อัตโนมัติ
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {ROUTE_ORDER.map((rId) => {
                      const currentVal = counterForm[rId] || 0;
                      const nextFormatted = formatBibNumber(rId, currentVal + 1);
                      return (
                        <div
                          key={rId}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-800 uppercase">
                              ระยะ {rId.toUpperCase()}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-purple-700">
                              ใบถัดไป: #{nextFormatted}
                            </span>
                          </div>
                          <input
                            type="number"
                            min={0}
                            value={currentVal}
                            onChange={(e) =>
                              setCounterForm({
                                ...counterForm,
                                [rId]: Math.max(0, parseInt(e.target.value || '0', 10)),
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-sm font-black text-slate-900"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <span />

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#180B30] hover:bg-[#2A1450] text-[#FFC928] text-xs font-extrabold shadow-md cursor-pointer"
                    >
                      บันทึกการตั้งค่าทั้งหมด
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 5 cols: Live PromptPay QR Code Test Standee */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl border-2 border-[#113566] shadow-md overflow-hidden">
                  <div className="bg-[#113566] text-white px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider">
                        ตัวอย่างป้ายสแกน PromptPay QR
                      </div>
                      <div className="text-[10px] text-[#67E8F9] font-bold">
                        เวลาจับเวลาโอน: {Math.min(60, configForm.paymentTimeoutMinutes || 30)} นาที / รอบ
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00A699] text-[10px] font-extrabold">
                      LIVE PREVIEW
                    </span>
                  </div>

                  <div className="p-5 text-center space-y-3">
                    {testQrUrl && (
                      <img loading="lazy" decoding="async"
                        src={testQrUrl}
                        alt="PromptPay Test QR"
                        className="w-48 h-48 mx-auto rounded-2xl border-2 border-[#113566] p-2 bg-white"
                      />
                    )}
                    <div className="text-xs font-extrabold text-[#113566]">
                      {configForm.accountName}
                    </div>
                    <div className="font-mono text-sm font-black text-slate-800">
                      PromptPay: {formatPromptPayDisplay(configForm.promptPayId)}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-slate-500">ยอดเงินทดสอบ:</span>
                      {[590, 690, 890].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTestQrAmount(amt)}
                          className={`px-2.5 py-1 rounded-lg font-mono text-xs font-extrabold cursor-pointer ${
                            testQrAmount === amt
                              ? 'bg-[#113566] text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          ฿{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ============================================================ */}
        {/* SUB-MODAL: INSPECT BANK SLIP & RUNNER E-BIB CARD             */}
        {/* ============================================================ */}
        {inspectingOrder && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-3xl my-auto bg-white rounded-3xl border-2 border-[#2A1450] p-5 sm:p-6 shadow-2xl space-y-4">
              {/* Modal Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-purple-700 block">
                    SLIP & E-BIB AUDITOR ({inspectingOrder.orderId})
                  </span>
                  <h3 className="text-lg font-black text-[#2A1450]">
                    ตรวจสอบการโอนเงิน & ป้าย BIB ของคุณ {inspectingOrder.fullName}
                    {inspectingOrder.bibNumber ? ` (#${inspectingOrder.bibNumber})` : ''}
                  </h3>
                  {(inspectingOrder as ServerOrder).masked && canManage && (
                    <button
                      type="button"
                      disabled={inspectBusy}
                      onClick={async () => {
                        setInspectBusy(true);
                        try {
                          const r = await adminApi.getFullOrder(inspectingOrder.orderId);
                          setInspectingOrder(r.order);
                        } catch (err) {
                          showToast(err instanceof Error ? err.message : 'เปิดข้อมูลเต็มไม่สำเร็จ');
                        } finally {
                          setInspectBusy(false);
                        }
                      }}
                      className="mt-1 mr-2 inline-flex items-center gap-1 rounded-lg border-2 border-amber-500 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-900 cursor-pointer disabled:opacity-60"
                    >
                      🔓 แสดงข้อมูลเต็ม (เลขบัตร/สุขภาพ) — ระบบบันทึกว่าคุณเปิดดู
                    </button>
                  )}
                  {inspectingOrder.insurance && (
                    <p className="mt-1 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5">
                      🛡️ ประกัน: {inspectingOrder.insurance.prefix}{inspectingOrder.insurance.firstName} {inspectingOrder.insurance.lastName} · {inspectingOrder.insurance.gender} · อายุ {inspectingOrder.insurance.age} ปี (เกิด {inspectingOrder.insurance.birthDate}) · เลือด {inspectingOrder.insurance.bloodType} · โรคประจำตัว: {inspectingOrder.insurance.medicalConditions} · ติดต่อฉุกเฉิน: {inspectingOrder.insurance.emergencyName} ({inspectingOrder.insurance.relationship}) {inspectingOrder.emergencyPhone}
                    </p>
                  )}
                  {(inspectingOrder as ServerOrder).dogProfile && (() => {
                    const d = (inspectingOrder as ServerOrder).dogProfile!;
                    return (
                      <p className="mt-1 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                        🐶 {d.name} ({d.breed}) · {d.gender} · เกิดปี {d.birthYear} · {d.weightKg} กก. · {d.size} · {d.neutered} · วัคซีน: {d.vaccine} · ภูมิแพ้: {d.allergies || 'ไม่มี'} · นิสัย: {d.temperament}
                      </p>
                    );
                  })()}
                  {(inspectingOrder as ServerOrder).parkingPlates?.length ? (
                    <p className="mt-1 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                      🚗 จอดรถ VIP: {(inspectingOrder as ServerOrder).parkingPlates!.map((p) => `${p.plate} ${p.province}`).join(' · ')}
                    </p>
                  ) : null}
                  {(inspectingOrder as ServerOrder).shooting && (
                    <p className="mt-1 text-xs font-bold text-violet-900 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5">
                      🎯 ผู้ยิงปืน: {(inspectingOrder as ServerOrder).shooting!.shooters.map((x) => (x.idCard ? `${x.fullName} (${formatThaiId(x.idCard)})` : x.fullName)).join(' · ')}
                      {' '}· ยอมรับกฎความปลอดภัย {(inspectingOrder as ServerOrder).shooting!.consentAt?.slice(0, 10)}
                    </p>
                  )}
                  {inspectingOrder.paymentStatus === 'PAID' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const r = await adminApi.resendTicketEmail(inspectingOrder.orderId);
                          showToast(`ส่งอีเมลตั๋วไปที่ ${r.to} แล้ว`);
                          await reloadInspected();
                        } catch (err) {
                          showToast(err instanceof Error ? err.message : 'ส่งอีเมลไม่สำเร็จ');
                          await reloadInspected();
                        }
                      }}
                      className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-[#2A1450] text-[#FFC928] px-3 py-1.5 text-xs font-extrabold cursor-pointer"
                    >
                      📧 ส่งอีเมลตั๋วอีกครั้ง
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setInspectorViewMode('details')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                        inspectorViewMode === 'details'
                          ? 'bg-[#180B30] text-[#FFC928]'
                          : 'text-slate-600'
                      }`}
                    >
                      ข้อมูลผู้สมัคร
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorViewMode('slip')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                        inspectorViewMode === 'slip'
                          ? 'bg-[#180B30] text-[#FFC928]'
                          : 'text-slate-600'
                      }`}
                    >
                      ดูสลิปโอนเงิน
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorViewMode('bib')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                        inspectorViewMode === 'bib'
                          ? 'bg-[#180B30] text-[#FFC928]'
                          : 'text-slate-600'
                      }`}
                    >
                      ดูป้าย BIB
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectingOrder(null)}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {inspectorViewMode === 'details' ? (
                <OrderFullDetails order={inspectingOrder as ServerOrder} />
              ) : inspectorViewMode === 'slip' ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left 6 cols: Bank e-Slip Image */}
                  <div className="md:col-span-6 bg-slate-100 rounded-2xl p-3 border border-slate-200 text-center">
                    <AdminSlipView order={inspectingOrder as ServerOrder} />
                  </div>

                  {/* Right 6 cols: Audit Details & Approve / Reject Buttons */}
                  <div className="md:col-span-6 space-y-3.5">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                        รายละเอียดการตรวจสอบธุรกรรม (Transaction Audit)
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">หมายเลข BIB ที่ออก:</span>
                        <span className="font-mono font-black text-purple-800 text-sm">
                          {inspectingOrder.bibNumber ? `#${inspectingOrder.bibNumber}` : 'ยังไม่ออก (รอชำระเงิน)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">ยอดเงินที่ต้องชำระ:</span>
                        <span className="font-mono font-black text-emerald-700 text-sm">
                          ฿{formatBaht(inspectingOrder.totalPrice)}.00 บาท
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">ธนาคารผู้โอน:</span>
                        <span className="font-extrabold text-slate-900">
                          {inspectingOrder.senderBank || 'PromptPay QR'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">เลขที่อ้างอิงสลิป:</span>
                        <span className="font-mono font-extrabold text-slate-900">
                          {inspectingOrder.paymentRef}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">ลายนิ้วมือสลิป (Anti-Dup):</span>
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {inspectingOrder.slipHash ? `${inspectingOrder.slipHash.slice(0, 16)}…` : '-'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-bold text-slate-500">สถานะปัจจุบัน:</span>
                        <span className="font-extrabold text-emerald-700">
                          {inspectingOrder.verificationStatus === 'ADMIN_APPROVED'
                            ? '✓ แอดมินยืนยันยอดเงินแล้ว'
                            : inspectingOrder.verificationStatus === 'AUTO_VERIFIED'
                            ? '✓ ตรวจสลิปผ่านอัตโนมัติ'
                            : inspectingOrder.verificationStatus === 'REJECTED'
                            ? '✕ ปฏิเสธสลิป'
                            : inspectingOrder.verificationStatus === 'AWAITING_PAYMENT'
                            ? '… ยังไม่ได้รับสลิป/การชำระเงิน'
                            : '⏳ รอแอดมินตรวจสอบ'}
                        </span>
                      </div>
                    </div>

                    {/* Admin Verification Action Buttons */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `ยืนยันว่าตรวจแล้ว เงิน ${formatBaht(inspectingOrder.totalPrice)} บาท เข้าบัญชีโครงการจริง (ดูจากแอปธนาคาร ไม่ใช่จากรูปสลิป)?`
                            )
                          )
                            handleUpdateVerification(inspectingOrder.orderId, 'ADMIN_APPROVED');
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ยืนยันยอดเงินเข้าบัญชีจริง (Approve Transfer)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateVerification(inspectingOrder.orderId, 'REJECTED')
                        }
                        className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>ปฏิเสธสลิปไม่ถูกต้อง (Reject Slip)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <RunnerBibCard profile={inspectingOrder} />
              )}

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-500">รหัสอ้างอิง PromptPay: </span>
                  <span className="font-mono font-extrabold text-emerald-700">
                    {inspectingOrder.paymentRef || '-'} (฿{formatBaht(inspectingOrder.totalPrice)})
                  </span>
                </div>
                {inspectingOrder.kitStatus === 'CHECKED_IN' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold">
                      ✓ รับเสื้อและ BIB แล้ว
                      {(inspectingOrder as ServerOrder).kitCheckedInAt ? ` · ${new Date((inspectingOrder as ServerOrder).kitCheckedInAt!).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}` : ''}
                      {(inspectingOrder as ServerOrder).kitCheckedInBy ? ` · โดย ${(inspectingOrder as ServerOrder).kitCheckedInBy}` : ''}
                    </span>
                    {canManage && (
                      <button type="button" onClick={() => handleToggleKit(inspectingOrder.orderId, 'undo')} className="text-[11px] font-extrabold text-rose-700 underline underline-offset-2 cursor-pointer">
                        ยกเลิกการรับชุด
                      </button>
                    )}
                  </div>
                ) : (
                  canManage && (
                    <button type="button" onClick={() => handleToggleKit(inspectingOrder.orderId, 'checkin')} className="px-3.5 py-1.5 rounded-xl font-extrabold cursor-pointer bg-amber-400 text-slate-950">
                      กดยืนยันจ่ายเสื้อและ BIB หน้างาน
                    </button>
                  )
                )}
              </div>

              {isOwner && (
                <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="font-bold text-rose-900 max-w-xl">
                    ลบคำสั่งซื้อนี้ถาวร — ข้อมูลผู้ซื้อและคำสั่งซื้อหายไปเลย กู้คืนไม่ได้
                    {inspectingOrder.paymentStatus === 'PAID' && !(inspectingOrder as ServerOrder).cancelledAt && !(inspectingOrder as ServerOrder).isTest ? (
                      <span className="block text-rose-700">⚠️ คำสั่งซื้อนี้ชำระเงินแล้วและยังไม่ถูกยกเลิก ถ้ามีการคืนเงินให้จดบันทึกการคืนเงินก่อน</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={inspectBusy}
                    onClick={() => handleDeleteOrder(inspectingOrder.orderId, inspectingOrder.fullName)}
                    className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-black text-white cursor-pointer disabled:opacity-60"
                  >
                    🗑️ ลบคำสั่งซื้อถาวร
                  </button>
                </div>
              )}

              {inspectingOrder.paymentStatus === 'PAID' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-slate-700">
                      อีเมลตั๋ว:{' '}
                      {(inspectingOrder as ServerOrder).emailStatus ? (
                        (inspectingOrder as ServerOrder).emailStatus!.ok ? (
                          <span className="text-emerald-700">ส่งสำเร็จ {new Date((inspectingOrder as ServerOrder).emailStatus!.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        ) : (
                          <span className="text-rose-700">ส่งไม่สำเร็จ ({(inspectingOrder as ServerOrder).emailStatus!.error || 'ไม่ทราบสาเหตุ'})</span>
                        )
                      ) : (
                        <span className="text-slate-500">ยังไม่มีบันทึกการส่ง</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    {(inspectingOrder as ServerOrder).refundedAt ? (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-bold text-violet-800">
                          ↩ บันทึกการคืนเงิน {formatBaht((inspectingOrder as ServerOrder).refundAmount || 0)} บาท · {new Date((inspectingOrder as ServerOrder).refundedAt!).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })} · โดย {(inspectingOrder as ServerOrder).refundBy}
                          <div className="font-semibold text-slate-600">{(inspectingOrder as ServerOrder).refundNote}</div>
                        </div>
                        {canManage && (
                          <button
                            type="button"
                            disabled={inspectBusy}
                            onClick={async () => {
                              if (!window.confirm('ลบบันทึกการคืนเงินนี้? (ใช้เมื่อบันทึกผิด)')) return;
                              try {
                                const r = await adminApi.refundOrder(inspectingOrder.orderId, { clear: true });
                                replaceOrder(r.order);
                              } catch (err) {
                                showToast(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
                              }
                            }}
                            className="text-[11px] font-extrabold text-rose-700 underline underline-offset-2 cursor-pointer"
                          >
                            ลบบันทึก
                          </button>
                        )}
                      </div>
                    ) : (
                      canManage && (
                        <div className="space-y-2">
                          <div className="font-bold text-slate-700">บันทึกการคืนเงิน (ระบบนี้ไม่โอนเงินให้ — โอนคืนผ่านธนาคาร แล้วมาจดไว้ที่นี่)</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <input type="number" min={1} max={inspectingOrder.totalPrice} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder={`ยอดคืน (สูงสุด ${inspectingOrder.totalPrice})`} className="w-44 rounded-lg border-2 border-slate-300 px-2 py-1.5 font-bold outline-none" />
                            <input value={refundNote} onChange={(e) => setRefundNote(e.target.value)} placeholder="รายละเอียด เช่น โอนคืนวันที่ 5 พ.ย. เหตุผล…" className="min-w-[14rem] flex-1 rounded-lg border-2 border-slate-300 px-2 py-1.5 font-bold outline-none" />
                            <button
                              type="button"
                              disabled={inspectBusy || !refundAmount || refundNote.trim().length < 3}
                              onClick={async () => {
                                setInspectBusy(true);
                                try {
                                  const r = await adminApi.refundOrder(inspectingOrder.orderId, { amount: Number(refundAmount), note: refundNote.trim() });
                                  replaceOrder(r.order);
                                  setRefundAmount('');
                                  setRefundNote('');
                                  showToast('บันทึกการคืนเงินแล้ว');
                                } catch (err) {
                                  showToast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
                                } finally {
                                  setInspectBusy(false);
                                }
                              }}
                              className="rounded-lg bg-violet-700 px-3 py-1.5 font-extrabold text-white cursor-pointer disabled:opacity-50"
                            >
                              บันทึก
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
