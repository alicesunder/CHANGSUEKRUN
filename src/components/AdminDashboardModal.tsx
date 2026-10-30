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
  Trash2,
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
} from 'lucide-react';
import { RouteId } from '../types';
import { SponsorCodesAdmin } from './SponsorCodesAdmin';
import { TicketScannerAdmin } from './TicketScannerAdmin';
import { WinnersAdmin } from './WinnersAdmin';
import {
  TicketOrder,
  PromptPayConfig,
  BibCounters,
  PaymentVerificationStatus,
  DEFAULT_PROMPTPAY_CONFIG,
  exportTicketOrdersToCsv,
  exportInsuranceCsv,
  formatBibNumber,
} from '../utils/runnerStorage';
import { ServerOrder, adminApi, adminLogin, clearAdminToken, getAdminToken } from '../utils/api';
import {
  formatPromptPayDisplay,
  formatThaiBankAccount,
  generatePromptPayPayload,
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
import { PawIcon } from './brand/DogDecor';
import { OmiseSettingsCard } from './OmiseSettingsCard';

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
    label: '10 KM บุคคลทั่วไป',
    prefix: '10-',
  },
  '5km': {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    label: '5 KM บุคคลทั่วไป',
    prefix: '05-',
  },
  '3km': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    label: '3.8 KM วิ่งกับน้องสุนัข',
    prefix: '03-',
  },
  '1km': {
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-300',
    label: '1 KM วิ่งกับน้องสุนัข',
    prefix: '01-',
  },
};

const SHIRT_SIZE_LIST = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterModal,
}) => {
  // Authentication: a signed token issued by the server (/api/admin/login)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAdminToken()));
  const [adminUser, setAdminUser] = useState<string>('admin');
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

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'security' | 'settings' | 'sponsors' | 'scan' | 'winners'>(
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
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEvent[]>([]);

  // Filters for Orders Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState<'ALL' | RouteId>('ALL');
  const [shirtFilter, setShirtFilter] = useState<string>('ALL');
  const [kitFilter, setKitFilter] = useState<'ALL' | 'PENDING_PICKUP' | 'CHECKED_IN'>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | PaymentVerificationStatus>(
    'ALL'
  );

  // Inspect Individual BIB & Slip Modal State
  const [inspectingOrder, setInspectingOrder] = useState<TicketOrder | null>(null);
  const [inspectorViewMode, setInspectorViewMode] = useState<'slip' | 'bib'>('slip');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      const [ordersRes, settingsRes] = await Promise.all([adminApi.listOrders(), adminApi.getSettings()]);
      setOrders(ordersRes.orders);
      setBibCounters(ordersRes.bibCounters);
      setCounterForm(ordersRes.bibCounters);
      setNextBibByRoute(ordersRes.nextBib);
      setConfigForm((prev) => ({ ...prev, ...settingsRes.settings, adminUsername: adminUser }));
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
    const payload = generatePromptPayPayload(configForm.promptPayId, testQrAmount);
    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: { dark: '#113566', light: '#FFFFFF' },
    })
      .then((url) => setTestQrUrl(url))
      .catch(() => setTestQrUrl(''));
  }, [isOpen, isAuthenticated, configForm.promptPayId, testQrAmount]);

  // Analytics Computations
  const analytics = useMemo(() => {
    const validOrders = orders.filter(
      (o) => o.verificationStatus === 'AUTO_VERIFIED' || o.verificationStatus === 'ADMIN_APPROVED'
    );
    const totalTickets = orders.length;
    const verifiedCount = orders.filter(
      (o) =>
        o.verificationStatus === 'AUTO_VERIFIED' || o.verificationStatus === 'ADMIN_APPROVED'
    ).length;
    const pendingReviewCount = orders.filter(
      (o) => o.verificationStatus === 'PENDING_REVIEW'
    ).length;
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const totalPeople = validOrders.reduce((sum, o) => sum + (o.peopleCount || 1), 0);
    const totalDogs = validOrders.reduce((sum, o) => sum + (o.dogCount || 0), 0);
    const checkedInCount = orders.filter((o) => o.kitStatus === 'CHECKED_IN').length;

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

    const shirtCounts: Record<string, number> = {};
    SHIRT_SIZE_LIST.forEach((s) => {
      shirtCounts[s] = 0;
    });
    validOrders.forEach((o) => {
      const sz = o.shirtSize || 'L';
      shirtCounts[sz] = (shirtCounts[sz] || 0) + 1;
    });

    return {
      totalTickets,
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
  }, [orders, searchQuery, routeFilter, shirtFilter, kitFilter, verificationFilter]);

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

  const replaceOrder = (updated: ServerOrder) => {
    setOrders((prev) => prev.map((o) => (o.orderId === updated.orderId ? updated : o)));
    if (inspectingOrder && inspectingOrder.orderId === updated.orderId) {
      setInspectingOrder(updated);
    }
  };

  const handleToggleKit = async (orderId: string) => {
    try {
      const res = await adminApi.toggleKit(orderId);
      replaceOrder(res.order);
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

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await adminApi.deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      setConfirmDeleteId(null);
      if (inspectingOrder?.orderId === orderId) setInspectingOrder(null);
      showToast(`ลบรายการ ${orderId} เรียบร้อยแล้ว`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.saveSettings(
        {
          promptPayId: configForm.promptPayId,
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
                  CHANGSUEK RUN 2026 · SECURE ADMIN CONSOLE
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
            <div className="inline-flex flex-wrap p-1 rounded-2xl bg-white/10 border border-white/15">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'bg-[#FFC928] text-[#180B30] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>ตรวจสลิป & เลข BIB ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'bg-[#FFC928] text-[#180B30] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>สรุปยอดขาย & เสื้อ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'security'
                    ? 'bg-emerald-400 text-[#180B30] shadow-xs'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>ความปลอดภัย & PDPA</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'settings'
                    ? 'bg-[#FFC928] text-[#180B30] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>ตั้งค่าระบบ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sponsors')}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'sponsors'
                    ? 'bg-[#FFC928] text-[#180B30] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>รหัสสปอนเซอร์</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('scan')}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'scan'
                    ? 'bg-[#FFC928] text-[#180B30] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <span aria-hidden="true">📷</span>
                <span>สแกนตั๋ว</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('winners')}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'winners'
                    ? 'bg-[#FFC928] text-[#180B30] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <span aria-hidden="true">🏆</span>
                <span>ประกาศผู้ชนะ</span>
              </button>
            </div>

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
                        exportTicketOrdersToCsv(filteredOrders, {
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
                    <button
                      type="button"
                      onClick={() => {
                        const n = exportInsuranceCsv(orders, configForm.adminUsername || 'admin');
                        setAuditLogs(getSecurityAuditLogs());
                        showToast(n > 0 ? `ส่งออกรายชื่อทำประกัน ${n} คน (เฉพาะที่ชำระเงินแล้ว)` : 'ยังไม่มีนักวิ่ง 5K/10K ที่ชำระเงินแล้วสำหรับทำประกัน');
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span aria-hidden="true">🛡️</span>
                      <span>CSV ทำประกัน (5K/10K)</span>
                    </button>

                    {/* Export Full CSV */}
                    <button
                      type="button"
                      onClick={() => {
                        exportTicketOrdersToCsv(filteredOrders, {
                          maskSensitiveData: false,
                          actor: configForm.adminUsername || 'admin',
                        });
                        setAuditLogs(getSecurityAuditLogs());
                        showToast('ส่งออกไฟล์ CSV ข้อมูลเต็ม (บันทึกใน Security Audit Log แล้ว)');
                      }}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#FFC928]" />
                      <span>CSV (ข้อมูลเต็ม)</span>
                    </button>

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
                        { id: '10km', label: '10 KM (10-XXXX)' },
                        { id: '5km', label: '5 KM (05-XXXX)' },
                        { id: '3km', label: '3.8 KM Dog (03-XXXX)' },
                        { id: '1km', label: '1 KM Dog (01-XXXX)' },
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
                      <option value="ALL">ทุกไซส์เสื้อ (XS–3XL)</option>
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
                  </div>
                </div>
              </div>

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
                              className="hover:bg-slate-50/90 transition-colors"
                            >
                              {/* BIB Number Column */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
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
                                  onClick={() => handleToggleKit(order.orderId)}
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

                                  {confirmDeleteId === order.orderId ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOrder(order.orderId)}
                                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-extrabold text-[11px] cursor-pointer"
                                    >
                                      ยืนยันลบ
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(order.orderId)}
                                      title="ลบรายการ"
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
                        สำหรับฝ่ายจัดซื้อและจุดแจกเสื้อ Race Pack หน้างาน
                      </p>
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
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* 4-Layer Security Posture Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border-2 border-emerald-300 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                      1. AT-REST STORAGE ENCRYPTION
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                      ✓ SERVER-SIDE
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    ข้อมูลผู้สมัครเก็บบนเซิร์ฟเวอร์ ไม่อยู่ในเบราว์เซอร์
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                    คำสั่งซื้อ ราคา สถานะการชำระเงิน และเลข BIB ถูกตัดสินที่เซิร์ฟเวอร์เท่านั้น
                    การเข้าหน้านี้ต้องใช้รหัสผ่านที่ตั้งในตัวแปร ADMIN_PASSWORD บนเซิร์ฟเวอร์
                  </p>
                </div>

                <div className="bg-white rounded-2xl border-2 border-purple-300 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-800">
                      2. PDPA DATA MASKING & PRIVACY SHIELD
                    </span>
                    <button
                      type="button"
                      onClick={handleTogglePiiMask}
                      className="px-2.5 py-0.5 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-extrabold cursor-pointer"
                    >
                      {isPiiMasked ? 'สถานะ: ปิดบังข้อมูลอยู่' : 'สถานะ: แสดงข้อมูลเต็ม'}
                    </button>
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    ระบบปิดบังเบอร์โทรและอีเมลอัตโนมัติ (เว็บไม่เก็บเลขบัตรประชาชน)
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                    ซ่อนข้อมูลส่วนบุคคลบนหน้าจอแอดมิน (เช่น <code className="font-mono">081-XXX-5678</code>,{' '}
                    <code className="font-mono">1-1005-XXXXX-19-X</code>) และบนป้าย E-BIB เวลาผู้สมัครแชร์รูปลงโซเชียล พร้อมบันทึกประวัติทุกครั้งที่มีการกดดูข้อมูลเต็ม
                  </p>
                </div>

                <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                      3. BRUTE-FORCE & IDLE SESSION LOCK
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                      ✓ MAX {MAX_LOGIN_ATTEMPTS} ATTEMPTS
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    ป้องกันการสุ่มรหัสผ่านแอดมิน & ล็อกหน้าจออัตโนมัติ
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                    หากกรอกรหัสผ่านแอดมินผิดครบ {MAX_LOGIN_ATTEMPTS} ครั้ง ระบบจะระงับการเข้าสู่ระบบ 60 วินาทีทันที และล็อกหน้าจอแอดมินอัตโนมัติเมื่อไม่มีการใช้งานเกิน{' '}
                    <strong>{configForm.sessionIdleTimeoutMinutes || 15} นาที</strong>
                  </p>
                </div>

                <div className="bg-white rounded-2xl border-2 border-teal-300 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-teal-800">
                      4. XSS & CSV FORMULA INJECTION SHIELD
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[10px] font-extrabold">
                      ✓ SANITIZED
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    กรองโค้ดแปลกปลอม (Anti-XSS) & ป้องกันไวรัสสูตร Excel
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                    คัดกรองแท็ก <code className="font-mono">&lt;script&gt;</code> จากฟอร์มรับสมัครทุกช่อง และป้องกัน{' '}
                    <strong>CSV Formula Injection</strong> (<code className="font-mono">=, +, -, @</code>) เวลาแอดมินดาวน์โหลดไฟล์ไปเปิดในโปรแกรม Microsoft Excel
                  </p>
                </div>
              </div>

              {/* Security Audit Log Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-purple-700" />
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        บันทึกประวัติการเข้าถึงข้อมูลและความปลอดภัย (Security Audit Log)
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        ตรวจสอบย้อนหลังว่าใครเข้าสู่ระบบ เปิดดูข้อมูลส่วนบุคคล (Unmask PII) หรือดาวน์โหลดไฟล์ CSV เมื่อใด
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const reset = clearSecurityAuditLogs(configForm.adminUsername || 'admin');
                      setAuditLogs(reset);
                      showToast('ล้างประวัติ Security Audit Log เรียบร้อยแล้ว');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
                  >
                    ล้างประวัติบันทึก
                  </button>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        <th className="py-3 px-4">วัน-เวลา</th>
                        <th className="py-3 px-4">ระดับ</th>
                        <th className="py-3 px-4">เหตุการณ์ (Action)</th>
                        <th className="py-3 px-4">ผู้ดำเนินการ</th>
                        <th className="py-3 px-4">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-bold">
                            ยังไม่มีรายการบันทึกในระบบ
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {new Date(ev.timestamp).toLocaleString('th-TH')}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {ev.severity === 'CRITICAL' && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                                  CRITICAL
                                </span>
                              )}
                              {ev.severity === 'WARNING' && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                                  WARNING
                                </span>
                              )}
                              {ev.severity === 'INFO' && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                                  INFO
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {ev.action}
                            </td>
                            <td className="py-3 px-4 font-bold text-purple-800 whitespace-nowrap">
                              {ev.actor}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">{ev.detail}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: PROMPTPAY, TIMER, ADMIN CREDENTIALS & BIB COUNTERS  */}
          {/* ========================================================== */}
          {activeTab === 'sponsors' && <SponsorCodesAdmin />}
          {activeTab === 'scan' && <TicketScannerAdmin />}
          {activeTab === 'winners' && <WinnersAdmin />}

          {activeTab === 'settings' && (
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
                        required
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
                        value={configForm.paymentTimeoutMinutes || 15}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            paymentTimeoutMinutes: Math.max(
                              1,
                              parseInt(e.target.value || '15', 10)
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

                {/* Payment gateway (Omise only) */}
                <OmiseSettingsCard />

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
                        เวลาจับเวลาโอน: {configForm.paymentTimeoutMinutes || 15} นาที / รอบ
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
                  {inspectingOrder.insurance && (
                    <p className="mt-1 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5">
                      🛡️ ประกัน: {inspectingOrder.insurance.prefix}{inspectingOrder.insurance.firstName} {inspectingOrder.insurance.lastName} · {inspectingOrder.insurance.gender} · อายุ {inspectingOrder.insurance.age} ปี (เกิด {inspectingOrder.insurance.birthDate}) · เลือด {inspectingOrder.insurance.bloodType} · โรคประจำตัว: {inspectingOrder.insurance.medicalConditions} · ติดต่อฉุกเฉิน: {inspectingOrder.insurance.emergencyName} ({inspectingOrder.insurance.relationship}) {inspectingOrder.emergencyPhone}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
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

              {inspectorViewMode === 'slip' ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left 6 cols: Bank e-Slip Image */}
                  <div className="md:col-span-6 bg-slate-100 rounded-2xl p-3 border border-slate-200 text-center">
                    <div className="py-10 px-4 space-y-2 text-xs font-bold text-slate-600">
                      <CreditCard className="w-8 h-8 mx-auto text-purple-700" />
                      <div className="text-sm font-black text-slate-900">
                        {inspectingOrder.paymentStatus === 'PAID'
                          ? inspectingOrder.verificationStatus === 'ADMIN_APPROVED'
                            ? 'แอดมินอนุมัติด้วยตนเอง'
                            : 'ชำระผ่าน Omise PromptPay แล้ว'
                          : 'ยังไม่ได้รับการชำระเงินจาก Omise'}
                      </div>
                      <div className="font-mono break-all">
                        {inspectingOrder.paymentRef || (inspectingOrder as ServerOrder).omiseChargeId || '-'}
                      </div>
                      <p className="font-semibold text-slate-500">
                        ตรวจรายการได้ใน Omise Dashboard → Charges
                      </p>
                    </div>
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
                <button
                  type="button"
                  onClick={() => handleToggleKit(inspectingOrder.orderId)}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold cursor-pointer ${
                    inspectingOrder.kitStatus === 'CHECKED_IN'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {inspectingOrder.kitStatus === 'CHECKED_IN'
                    ? '✓ เช็กอินรับเสื้อและ BIB แล้ว'
                    : 'กดยืนยันจ่ายเสื้อและ BIB หน้างาน'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
