import React, { useEffect, useState } from 'react';
import { getAdminToken } from '../utils/api';

const authHeader = () => ({ Authorization: `Bearer ${getAdminToken() || ''}` });
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Zap,
} from 'lucide-react';

type ApiProviderChoice =
  | 'STRIPE_PROMPTPAY_WEBHOOK'
  | 'OMISE_PROMPTPAY_WEBHOOK'
  | 'GBPRIMEPAY_WEBHOOK'
  | 'EASYSLIP_API'
  | 'THUNDER_API'
  | 'SLIPOK_API';

interface ServerSlipStatus {
  activeExternalProvider: string;
  activeAutoGateway?: string;
  hasEasySlipKey: boolean;
  hasThunderKey: boolean;
  hasSlipOkKey: boolean;
  hasStripeKey?: boolean;
  hasOmiseKey?: boolean;
  hasGbPrimePayKey?: boolean;
  slipOkBranch?: string;
}

const PROVIDER_GUIDES: Record<
  ApiProviderChoice,
  {
    category: 'NO_SLIP_WEBHOOK' | 'SLIP_VERIFY';
    name: string;
    website: string;
    freeQuota: string;
    priceInfo: string;
    placeholder: string;
    steps: string[];
  }
> = {
  STRIPE_PROMPTPAY_WEBHOOK: {
    category: 'NO_SLIP_WEBHOOK',
    name: 'Stripe Thailand PromptPay (สแกนปุ๊บได้บัตรเลย · ไม่ต้องแนบสลิป)',
    website: 'https://dashboard.stripe.com',
    freeQuota: 'สมัครฟรี · ไม่มีค่ารายเดือน · ไม่มีค่าแรกเข้า',
    priceInfo: 'หักค่าธรรมเนียมอัตโนมัติ 1.65% ต่อรายการเมื่อมีคนจ่ายสำเร็จเท่านั้น',
    placeholder: 'วาง Stripe Secret Key (เช่น sk_live_... หรือ sk_test_...) ที่นี่...',
    steps: [
      '1. สมัครบัญชีที่ https://dashboard.stripe.com (เลือกประเทศไทย รองรับทั้งบุคคลธรรมดาและนิติบุคคล)',
      '2. ไปที่เมนู Settings -> Payment Methods -> กดเปิดใช้งาน "PromptPay"',
      '3. ไปที่เมนู Developers -> API Keys แล้วคัดลอก "Secret Key" (ขึ้นต้นด้วย sk_test_ หรือ sk_live_)',
      '4. นำมาวางในช่องด้านล่าง เมื่อนักวิ่งสแกนจ่าย ธนาคารจะยิงสัญญาณ Webhook เข้าเว็บและออกบัตรทันทีใน 2 วินาทีโดยไม่ต้องแนบสลิป!',
    ],
  },
  OMISE_PROMPTPAY_WEBHOOK: {
    category: 'NO_SLIP_WEBHOOK',
    name: 'Omise PromptPay QR (แนะนำ · สแกนปุ๊บได้บัตรเลย ไม่ต้องแนบสลิป)',
    website: 'https://dashboard.omise.co',
    freeQuota: 'โหมด Test (skey_test_...) ทดสอบฟรีไม่จำกัด · สมัครฟรีไม่มีค่ารายเดือน',
    priceInfo: 'ค่าธรรมเนียม 1.65% ต่อบิลที่จ่ายสำเร็จ (โอนเข้าบัญชีธนาคารอัตโนมัติ)',
    placeholder: 'วาง Omise Secret Key (ขึ้นต้นด้วย skey_test_... หรือ skey_...) ที่นี่...',
    steps: [
      '1. เข้าไปที่ https://dashboard.omise.co แล้วสมัครบัญชี (เลือกประเทศไทย · ใช้โหมด Test ทดสอบได้ทันทีโดยไม่ต้องรอเอกสาร)',
      '2. คลิกเมนู "Keys" (รหัสกุญแจ) ที่แถบเมนูด้านซ้ายมือ',
      '3. คัดลอกรหัส "Secret key" (หากอยู่ในโหมดทดสอบจะขึ้นต้นด้วย skey_test_... หากใช้งานจริงจะขึ้นต้นด้วย skey_...)',
      '4. นำมาวางในช่องด้านล่างแล้วกด "บันทึกเชื่อมต่อ API" — ระบบจะยิงไปสร้าง QR กับ https://api.omise.co/charges และเช็คสถานะเงินเข้าอัตโนมัติทุก 2 วินาที พอจ่ายปุ๊บออกป้าย BIB ทันทีโดยไม่ต้องแนบสลิป!',
    ],
  },
  GBPRIMEPAY_WEBHOOK: {
    category: 'NO_SLIP_WEBHOOK',
    name: 'GB Prime Pay QR Cash (สแกนปุ๊บได้บัตรเลย · ไม่ต้องแนบสลิป)',
    website: 'https://www.gbprimepay.com',
    freeQuota: 'ระบบ Payment Gateway มาตรฐานธนาคารในไทย',
    priceInfo: 'ค่าธรรมเนียมประมาณ 1.0% – 1.5% ต่อรายการ',
    placeholder: 'วาง GB Prime Pay Token / Secret Key ที่นี่...',
    steps: [
      '1. สมัครใช้งานระบบรับชำระเงินที่ https://www.gbprimepay.com',
      '2. เปิดใช้งานบริการ QR Cash (PromptPay Dynamic QR พร้อม Webhook แจ้งเตือนเงินเข้าทันที)',
      '3. คัดลอกรหัส Token จากเมนูตั้งค่าระบบร้านค้า',
      '4. นำมาวางในช่องด้านล่างแล้วกดบันทึกเชื่อมต่อได้ทันที',
    ],
  },
  EASYSLIP_API: {
    category: 'SLIP_VERIFY',
    name: 'EasySlip API (โอนเข้าพร้อมเพย์ส่วนตัว 0% + แนบสลิปตรวจแท้)',
    website: 'https://developer.easyslip.com',
    freeQuota: 'ทดลองใช้ฟรี 50 สลิป/สัปดาห์',
    priceInfo: 'แพ็กเกจเริ่มต้น 99 บาท/เดือน (เงินเข้าบัญชีคุณตรง 100% ไม่โดนหัก %)',
    placeholder: 'วาง Access Token (Bearer Token) จากเว็บ EasySlip ที่นี่...',
    steps: [
      '1. เข้าไปที่เว็บไซต์ https://developer.easyslip.com แล้วเข้าสู่ระบบด้วยบัญชี LINE หรือ Google',
      '2. กดเมนู "สร้างแอปพลิเคชัน (Create Application)" ตั้งชื่อแอป เช่น "CHANGSUEK RUN"',
      '3. ระบบจะแสดงรหัส "Access Token" (เป็นตัวอักษรยาวๆ) ให้กดปุ่ม Copy (คัดลอก)',
      '4. นำรหัส Access Token มาวางในช่องด้านล่าง แล้วกดปุ่ม "บันทึกเชื่อมต่อ API" ได้ทันที',
    ],
  },
  THUNDER_API: {
    category: 'SLIP_VERIFY',
    name: 'Thunder Solution API (โอนเข้าพร้อมเพย์ส่วนตัว + แนบสลิปตรวจแท้)',
    website: 'https://thunder.in.th',
    freeQuota: 'มีเครดิตทดลองใช้งานฟรีสำหรับนักพัฒนา',
    priceInfo: 'เฉลี่ยสลิปละ 0.15 – 0.25 บาท (เติมเครดิตตามจริงได้)',
    placeholder: 'วาง API Access Token จากเว็บ Thunder Solution ที่นี่...',
    steps: [
      '1. เข้าไปที่เว็บไซต์ https://thunder.in.th แล้วสมัครสมาชิก / เข้าสู่ระบบ',
      '2. ไปที่เมนูจัดการ API (Slip Verification API) แล้วกดสร้าง Token ใหม่',
      '3. คัดลอกรหัส "Access Token" ที่ได้จากหน้า Dashboard ของ Thunder',
      '4. นำมาวางในช่องด้านล่าง แล้วกดปุ่ม "บันทึกเชื่อมต่อ API" ได้ทันที',
    ],
  },
  SLIPOK_API: {
    category: 'SLIP_VERIFY',
    name: 'SlipOK API (โอนเข้าพร้อมเพย์ส่วนตัว + แนบสลิปตรวจแท้)',
    website: 'https://slipok.com',
    freeQuota: 'ทดลองใช้ฟรี 100 สลิปแรก',
    priceInfo: 'แพ็กเกจรายเดือนเริ่มประมาณ 100+ บาท/สาขา',
    placeholder: 'วางรหัส API Key (x-authorization) จาก SlipOK ที่นี่...',
    steps: [
      '1. เข้าไปที่เว็บไซต์ https://slipok.com หรือ LINE Official ของ SlipOK แล้วสมัครใช้งาน',
      '2. สร้างสาขา (Branch) สำหรับรับโอนเงิน แล้วเลือกโหมดการเชื่อมต่อแบบ "API Key"',
      '3. คัดลอก "Branch ID" (รหัสสาขา) และ "API Key" จากหน้าตั้งค่าสาขา',
      '4. กรอกทั้ง Branch ID และ API Key ในช่องด้านล่าง แล้วกดปุ่ม "บันทึกเชื่อมต่อ API"',
    ],
  },
};

export const SlipApiConfigBar: React.FC<{ defaultExpanded?: boolean }> = ({
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [selectedProvider, setSelectedProvider] = useState<ApiProviderChoice>(
    'OMISE_PROMPTPAY_WEBHOOK'
  );
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [branchIdInput, setBranchIdInput] = useState<string>('');
  const [status, setStatus] = useState<ServerSlipStatus | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/payment-webhook`
      : '/api/payment-webhook';

  const fetchCurrentStatus = async () => {
    try {
      const resp = await fetch('/api/slip-verifier-status', { headers: authHeader() });
      if (resp.ok) {
        const data: ServerSlipStatus = await resp.json();
        setStatus(data);
        if (
          data.activeAutoGateway === 'OMISE_PROMPTPAY_WEBHOOK' ||
          data.activeAutoGateway === 'STRIPE_PROMPTPAY_WEBHOOK' ||
          data.activeAutoGateway === 'GBPRIMEPAY_WEBHOOK'
        ) {
          setSelectedProvider(data.activeAutoGateway);
        } else if (
          data.activeExternalProvider === 'EASYSLIP_API' ||
          data.activeExternalProvider === 'THUNDER_API' ||
          data.activeExternalProvider === 'SLIPOK_API'
        ) {
          setSelectedProvider(data.activeExternalProvider);
        }
        if (data.slipOkBranch) {
          setBranchIdInput(data.slipOkBranch);
        }
      }
    } catch {
      // ignore network error
    }
  };

  useEffect(() => {
    fetchCurrentStatus();
  }, []);

  const handleSaveApiConfig = async () => {
    if (!apiKeyInput.trim()) {
      setFeedbackMsg('กรุณาวางรหัส Secret Key / API Key ก่อนกดบันทึก');
      return;
    }
    if (selectedProvider === 'SLIPOK_API' && !branchIdInput.trim()) {
      setFeedbackMsg('สำหรับ SlipOK กรุณากรอกรหัสสาขา (Branch ID) ด้วยครับ');
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      const resp = await fetch('/api/slip-verifier-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeyInput.trim(),
          branchId: branchIdInput.trim(),
        }),
      });
      if (resp.ok) {
        const updated = await resp.json();
        setStatus(updated);
        setApiKeyInput('');
        setFeedbackMsg(
          `บันทึก ${PROVIDER_GUIDES[selectedProvider].name} แล้ว — ระบบจะใช้กับคำสั่งซื้อใหม่ตั้งแต่ตอนนี้`
        );
      } else {
        setFeedbackMsg('ไม่สามารถบันทึกค่า API ได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setFeedbackMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearExternalApi = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      const resp = await fetch('/api/slip-verifier-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ provider: 'CLEAR' }),
      });
      if (resp.ok) {
        const updated = await resp.json();
        setStatus(updated);
        setApiKeyInput('');
        setFeedbackMsg(
          'ยกเลิก API ภายนอกแล้ว — สลิปทุกใบจะเข้าคิวให้แอดมินตรวจและอนุมัติเอง'
        );
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const guide = PROVIDER_GUIDES[selectedProvider];
  const isExternalConnected = Boolean(
    status &&
      ((status.activeExternalProvider &&
        status.activeExternalProvider !== 'ITMX_CRYPTO_AND_AI_FORENSIC') ||
        (status.activeAutoGateway &&
          status.activeAutoGateway !== 'REALTIME_BANK_WEBHOOK_ENGINE'))
  );

  return (
    <div className="rounded-2xl border-2 border-[#2A1450]/25 bg-white shadow-xs overflow-hidden">
      {/* Top Toggle Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full px-4 py-3 bg-gradient-to-r from-[#F5F0FF] via-[#FAF7FF] to-[#EEFDF6] flex flex-wrap items-center justify-between gap-2 text-left cursor-pointer hover:bg-[#F3E8FF]/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2A1450] text-[#FFC928] flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-[#2A1450] flex flex-wrap items-center gap-1.5">
              <span>
                ตั้งค่าเชื่อม Omise PromptPay API (สแกนจ่ายปุ๊บได้บัตรเลย ไม่ต้องแนบสลิป)
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                  isExternalConnected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FFC928] text-[#2A1450] border border-[#2A1450]/30'
                }`}
              >
                {status?.hasOmiseKey
                  ? '✓ เชื่อมต่อ Omise PromptPay แล้ว'
                  : isExternalConnected
                  ? '✓ เชื่อมต่อ API แล้ว'
                  : 'คลิกเพื่อใส่ Omise Secret Key (skey_...)'}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-[#6B5A85]">
              วางรหัส Omise Secret Key (`skey_test_...` หรือ `skey_...`) เพื่อสร้าง QR รับเงินและตรวจยอดเข้าอัตโนมัติโดยไม่ต้องแนบสลิป
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-extrabold text-[#6D28D9]">
          <span>{isExpanded ? 'ซ่อนแถบตั้งค่า Omise' : 'เปิดกรอก Omise API Key'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 border-t border-[#2A1450]/15 space-y-4 bg-white text-xs">
          {/* Group 1: NO-SLIP WEBHOOK GATEWAYS (Omise First!) */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-emerald-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>
                ทางเลือกที่ 1: สแกนจ่ายแล้วเงินเข้าปุ๊บ ออกบัตรทันที &ldquo;ไม่ต้องแนบสลิป&rdquo; (Omise)
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                ['OMISE_PROMPTPAY_WEBHOOK'] as ApiProviderChoice[]
              ).map((prov) => {
                const active = selectedProvider === prov;
                const label =
                  prov === 'OMISE_PROMPTPAY_WEBHOOK'
                    ? '⭐ Omise PromptPay (แนะนำ · ไม่ต้องแนบสลิป)'
                    : prov === 'STRIPE_PROMPTPAY_WEBHOOK'
                    ? 'Stripe PromptPay (ไม่ต้องแนบสลิป)'
                    : 'GB Prime Pay (ไม่ต้องแนบสลิป)';
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(prov);
                      setFeedbackMsg(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl border-2 font-black text-xs transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-emerald-700 text-white border-[#2A1450]'
                        : 'bg-emerald-50/70 text-emerald-950 border-emerald-300 hover:border-emerald-600'
                    }`}
                  >
                    <span>{label}</span>
                    {status?.activeAutoGateway === prov && (
                      <CheckCircle2 className="w-4 h-4 text-[#FFC928] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: SLIP VERIFICATION APIS */}
          <div className="space-y-1.5">
            <label className="block font-extrabold text-[#2A1450]">
              ทางเลือกที่ 2: โอนเข้าพร้อมเพย์ส่วนตัว (ฟรีค่าธรรมเนียม 0%) + แนบสลิปตรวจแท้ผ่าน API ธนาคาร:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['EASYSLIP_API', 'THUNDER_API', 'SLIPOK_API'] as ApiProviderChoice[]).map((prov) => {
                const active = selectedProvider === prov;
                const label =
                  prov === 'EASYSLIP_API'
                    ? 'EasySlip API (เช็คสลิปแท้)'
                    : prov === 'THUNDER_API'
                    ? 'Thunder Solution API'
                    : 'SlipOK API';
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(prov);
                      setFeedbackMsg(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl border-2 font-black text-xs transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-[#2A1450] text-[#FFC928] border-[#2A1450]'
                        : 'bg-slate-50 text-[#2A1450] border-slate-200 hover:border-[#6D28D9]'
                    }`}
                  >
                    <span>{label}</span>
                    {status?.activeExternalProvider === prov && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step-by-Step Guide Box: Where to get the API Key */}
          <div className="rounded-xl bg-[#FAF7FF] border border-[#6D28D9]/25 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-black text-[#2A1450] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#6D28D9]" />
                <span>วิธีเอา API Key จาก {guide.name}:</span>
              </div>
              <a
                href={guide.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6D28D9] text-white text-[11px] font-extrabold hover:bg-[#5B21B6]"
              >
                <span>เปิดเว็บ {guide.website.replace('https://', '')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-extrabold">
                สิทธิ์การใช้งาน: {guide.freeQuota}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold">
                ค่าธรรมเนียม: {guide.priceInfo}
              </span>
            </div>

            <ul className="space-y-1 text-[11px] font-semibold text-[#3B2166] pt-1">
              {guide.steps.map((st, i) => (
                <li key={i} className="leading-relaxed">
                  {st}
                </li>
              ))}
            </ul>

            {selectedProvider === 'OMISE_PROMPTPAY_WEBHOOK' && (
              <div className="mt-2 pt-2 border-t border-[#6D28D9]/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="text-[#2A1450]">
                  <span className="font-black">Webhook Endpoint ของเว็บคุณ (ตัวเลือกเสริม): </span>
                  <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-[#6D28D9]">
                    {webhookUrl}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-extrabold text-[#2A1450] cursor-pointer"
                >
                  {copiedWebhook ? '✓ คัดลอก Webhook URL แล้ว' : 'คัดลอก Webhook URL'}
                </button>
              </div>
            )}
          </div>

          {/* Input Fields for API Key (& Branch ID if SlipOK) */}
          <div className="space-y-2.5">
            <label className="block font-extrabold text-[#2A1450]">
              2. กรอกรหัส {selectedProvider === 'OMISE_PROMPTPAY_WEBHOOK' ? 'Omise Secret Key (skey_test_... หรือ skey_...)' : 'API Key / Access Token'} ที่คัดลอกมา:
            </label>

            {selectedProvider === 'SLIPOK_API' && (
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">
                  รหัสสาขา SlipOK (Branch ID) *
                </span>
                <input
                  type="text"
                  value={branchIdInput}
                  onChange={(e) => setBranchIdInput(e.target.value)}
                  placeholder="เช่น 10425 (ดูได้จากหน้าตั้งค่าสาขาในเว็บ SlipOK)"
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-300 font-mono text-xs font-bold text-slate-900 focus:border-[#6D28D9] outline-none"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={guide.placeholder}
                className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-mono text-xs font-bold text-slate-900 focus:border-[#6D28D9] outline-none"
              />
              <button
                type="button"
                onClick={handleSaveApiConfig}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#15803D] disabled:opacity-50 text-white font-black text-xs border-2 border-[#2A1450] flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกเชื่อมต่อ API'}</span>
              </button>
            </div>

            {isExternalConnected && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-extrabold text-emerald-700">
                  ✓ ขณะนี้ระบบกำลังใช้ {status?.activeExternalProvider} ตรวจสลิปกับธนาคารโดยตรง
                </span>
                <button
                  type="button"
                  onClick={handleClearExternalApi}
                  className="text-[11px] font-extrabold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ยกเลิก API ภายนอก (ให้แอดมินตรวจสลิปเอง)</span>
                </button>
              </div>
            )}

            {feedbackMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-400 text-emerald-900 text-[11px] font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
