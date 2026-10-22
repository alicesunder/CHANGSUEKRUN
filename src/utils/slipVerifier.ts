import jsQR from 'jsqr';
import QRCode from 'qrcode';

export interface ThaiBankOption {
  code: string;
  bankCode3Digit: string;
  name: string;
  color: string;
}

export const THAI_BANKS: ThaiBankOption[] = [
  { code: 'KBANK', bankCode3Digit: '004', name: 'ธนาคารกสิกรไทย (KBank)', color: '#00A950' },
  { code: 'SCB', bankCode3Digit: '014', name: 'ธนาคารไทยพาณิชย์ (SCB)', color: '#4E2A84' },
  { code: 'KTB', bankCode3Digit: '006', name: 'ธนาคารกรุงไทย (Krungthai)', color: '#00A5E5' },
  { code: 'BBL', bankCode3Digit: '002', name: 'ธนาคารกรุงเทพ (Bangkok Bank)', color: '#1E4598' },
  { code: 'BAY', bankCode3Digit: '025', name: 'ธนาคารกรุงศรีอยุธยา (Krungsri)', color: '#FEC43B' },
  { code: 'TTB', bankCode3Digit: '011', name: 'ธนาคารทหารไทยธนชาต (ttb)', color: '#0050F0' },
  { code: 'GSB', bankCode3Digit: '030', name: 'ธนาคารออมสิน (GSB)', color: '#EB198D' },
  { code: 'BAAC', bankCode3Digit: '034', name: 'ธ.ก.ส. (BAAC)', color: '#1B5E20' },
  { code: 'KKP', bankCode3Digit: '069', name: 'ธนาคารเกียรตินาคินภัทร (KKP)', color: '#594F74' },
  { code: 'CIMB', bankCode3Digit: '022', name: 'ธนาคารซีไอเอ็มบี ไทย (CIMB)', color: '#780006' },
  { code: 'UOB', bankCode3Digit: '024', name: 'ธนาคารยูโอบี (UOB)', color: '#003399' },
  { code: 'LHB', bankCode3Digit: '073', name: 'ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)', color: '#6D6E71' },
];

export const THAI_BANK_CODE_MAP: Record<string, string> = {
  '002': 'ธนาคารกรุงเทพ (Bangkok Bank)',
  '004': 'ธนาคารกสิกรไทย (KBank)',
  '006': 'ธนาคารกรุงไทย (Krungthai)',
  '011': 'ธนาคารทหารไทยธนชาต (ttb)',
  '014': 'ธนาคารไทยพาณิชย์ (SCB)',
  '017': 'ธนาคารซิตี้แบงก์ (Citibank)',
  '020': 'ธนาคารสแตนดาร์ดชาร์เตอร์ด (SCBT)',
  '022': 'ธนาคารซีไอเอ็มบี ไทย (CIMB)',
  '024': 'ธนาคารยูโอบี (UOB)',
  '025': 'ธนาคารกรุงศรีอยุธยา (Krungsri)',
  '030': 'ธนาคารออมสิน (GSB)',
  '033': 'ธนาคารอาคารสงเคราะห์ (GHB)',
  '034': 'ธ.ก.ส. (BAAC)',
  '067': 'ธนาคารทิสโก้ (TISCO)',
  '069': 'ธนาคารเกียรตินาคินภัทร (KKP)',
  '070': 'ธนาคารไอซีบีซี (ICBC)',
  '071': 'ธนาคารไทยเครดิต (TCRB)',
  '073': 'ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)',
};

export interface SlipVerificationCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SlipVerificationResult {
  isValid: boolean;
  checks: SlipVerificationCheckItem[];
  normalizedRef: string;
  slipHash: string;
  errorMessage?: string;
}

export interface ParsedMiniQrInfo {
  rawPayload: string;
  isValidThaiBankSlipQr: boolean;
  isPromptPayPaymentQr?: boolean;
  crcValid: boolean;
  bankCode: string;
  bankName: string;
  transactionRef: string;
}

export interface RealSlipVerificationResult {
  verified: boolean;
  isRealBankSlip: boolean;
  miniQrFound: boolean;
  crcValid: boolean;
  miniQrInfo: ParsedMiniQrInfo | null;
  detectedAmount: number | null;
  expectedAmount: number;
  amountMatched: boolean;
  receiverMatched: boolean;
  qrMatchesVisualSlip: boolean;
  senderBank: string;
  senderName: string;
  receiverName: string;
  receiverAccount: string;
  transactionRef: string;
  transferDateTime: string;
  tamperingSuspected: boolean;
  externalApiProvider?: string;
  externalApiVerified?: boolean;
  verificationMethod:
    | 'EXTERNAL_BANK_API'
    | 'MINI_QR_AND_AI_VISION'
    | 'AI_VISION_OCR'
    | 'MINI_QR_CRYPTO'
    | 'REJECTED';
  rejectReasons: string[];
  summaryMessage: string;
}

function computeCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Computes a deterministic perceptual/pixel hash of an image DataURL
 * to prevent the exact same slip image file from being reused.
 */
export function computeSimpleImageHash(dataUrl: string): string {
  let hash1 = 5381;
  let hash2 = 52711;
  const step = Math.max(1, Math.floor(dataUrl.length / 4000));
  for (let i = 0; i < dataUrl.length; i += step) {
    const ch = dataUrl.charCodeAt(i);
    hash1 = (hash1 * 33) ^ ch;
    hash2 = (hash2 * 31) ^ ch;
  }
  return `SLIP-${(hash1 >>> 0).toString(16).toUpperCase().padStart(8, '0')}-${(hash2 >>> 0)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0')}`;
}

/**
 * Compresses and reads an uploaded slip image file into a clean Data URL + hash.
 */
export async function processUploadedSlipImage(
  file: File
): Promise<{ dataUrl: string; slipHash: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        // Keep high enough resolution so Mini QR code on slip remains crisp and scannable
        const maxDim = 1400;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fallbackHash = computeSimpleImageHash(rawDataUrl);
          resolve({ dataUrl: rawDataUrl, slipHash: fallbackHash, width: w, height: h });
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.94);
        const slipHash = computeSimpleImageHash(compressedDataUrl);
        resolve({ dataUrl: compressedDataUrl, slipHash, width: w, height: h });
      };
      img.onerror = () => reject(new Error('ไม่สามารถเปิดไฟล์รูปภาพสลิปได้'));
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ที่อัปโหลดได้'));
    reader.readAsDataURL(file);
  });
}

/**
 * Parses an EMVCo / National ITMX Thai Bank Transfer Slip Mini-QR Payload.
 * Real Thai bank slip QR codes start with Tag 00 containing AID "000001" (ITMX Slip Verify)
 * followed by Sub-tag 01 (Sending Bank Code, 3 digits) and Sub-tag 02 (Transaction Reference),
 * Tag 51 ("TH"), and Tag 91 (4-char hex CRC-16/CCITT-FALSE).
 */
export function parseThaiBankSlipQrPayload(raw: string): ParsedMiniQrInfo {
  const cleaned = (raw || '').trim();
  if (cleaned.length < 18) {
    return {
      rawPayload: cleaned,
      isValidThaiBankSlipQr: false,
      isPromptPayPaymentQr: false,
      crcValid: false,
      bankCode: '',
      bankName: '',
      transactionRef: '',
    };
  }

  // Detect if the user uploaded the unpaid PromptPay QR Code standee itself (starts with 000201)
  if (cleaned.startsWith('000201') && cleaned.includes('A000000677010111')) {
    return {
      rawPayload: cleaned,
      isValidThaiBankSlipQr: false,
      isPromptPayPaymentQr: true,
      crcValid: false,
      bankCode: '',
      bankName: '',
      transactionRef: '',
    };
  }

  const lastTagPrefix = cleaned.slice(-8, -4);
  const declaredCrc = cleaned.slice(-4).toUpperCase();
  let crcValid = false;

  if (lastTagPrefix === '9104' || lastTagPrefix === '6304') {
    const bodyToHash = cleaned.slice(0, -4);
    const calculatedCrc = computeCRC16(bodyToHash).toUpperCase();
    crcValid = declaredCrc === calculatedCrc;
  }

  // Standard National ITMX Slip Verification pattern:
  // 0006000001 (AID) + 0103(BankCode) + 02(Len)(TransRef)
  const itmxMatch = cleaned.match(/00060000010103(\d{3})02(\d{2})([A-Za-z0-9\-_]+)/);
  if (itmxMatch) {
    const bankCode = itmxMatch[1];
    const refLen = parseInt(itmxMatch[2], 10);
    const fullRemainder = itmxMatch[3];
    const transactionRef =
      !isNaN(refLen) && refLen > 0 && fullRemainder.length >= refLen
        ? fullRemainder.slice(0, refLen)
        : fullRemainder.slice(0, 25);

    const isKnownThaiBank = Boolean(THAI_BANK_CODE_MAP[bankCode]);

    return {
      rawPayload: cleaned,
      isValidThaiBankSlipQr: isKnownThaiBank && crcValid && transactionRef.length >= 8,
      isPromptPayPaymentQr: false,
      crcValid,
      bankCode,
      bankName: THAI_BANK_CODE_MAP[bankCode] || `ธนาคารรหัส ${bankCode}`,
      transactionRef,
    };
  }

  // Fallback pattern for bank slip QR variations containing 000001 and 5102TH
  const hasItmxMarker = cleaned.includes('000001') && cleaned.includes('5102TH');
  if (hasItmxMarker) {
    const bankMatch = cleaned.match(/0103(\d{3})/);
    const bankCode = bankMatch ? bankMatch[1] : '';
    const beforeTh = cleaned.split('5102TH')[0] || '';
    const refCandidate = beforeTh.slice(-22).replace(/[^A-Za-z0-9]/g, '');
    const isKnownThaiBank = Boolean(THAI_BANK_CODE_MAP[bankCode]);
    return {
      rawPayload: cleaned,
      isValidThaiBankSlipQr: isKnownThaiBank && crcValid && refCandidate.length >= 8,
      isPromptPayPaymentQr: false,
      crcValid,
      bankCode,
      bankName:
        THAI_BANK_CODE_MAP[bankCode] ||
        (bankCode ? `ธนาคารรหัส ${bankCode}` : 'ธนาคารในระบบ ITMX'),
      transactionRef: refCandidate || cleaned.slice(18, 38),
    };
  }

  return {
    rawPayload: cleaned,
    isValidThaiBankSlipQr: false,
    isPromptPayPaymentQr: false,
    crcValid,
    bankCode: '',
    bankName: '',
    transactionRef: '',
  };
}

/**
 * Multi-pass QR Code scanner on an image Data URL.
 * Scans full image, bottom half, bottom-right, bottom-left, middle-right, and high-contrast binarized crops
 * to reliably locate the small Mini-QR code on Thai bank e-Slips.
 */
export async function decodeSlipMiniQrFromImage(
  imageDataUrl: string
): Promise<ParsedMiniQrInfo | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) {
        resolve(null);
        return;
      }

      // Regions: [sx, sy, sw, sh, scale, threshold (0 = none)]
      const regions: Array<[number, number, number, number, number, number]> = [
        [0, 0, w, h, 1.0, 0],
        [0, Math.floor(h * 0.35), w, Math.floor(h * 0.65), 1.8, 0],
        [
          Math.floor(w * 0.35),
          Math.floor(h * 0.42),
          Math.floor(w * 0.65),
          Math.floor(h * 0.58),
          2.5,
          0,
        ],
        [0, Math.floor(h * 0.42), Math.floor(w * 0.65), Math.floor(h * 0.58), 2.5, 0],
        [
          Math.floor(w * 0.35),
          Math.floor(h * 0.22),
          Math.floor(w * 0.65),
          Math.floor(h * 0.58),
          2.3,
          0,
        ],
        [0, Math.floor(h * 0.35), w, Math.floor(h * 0.65), 2.0, 145],
        [
          Math.floor(w * 0.35),
          Math.floor(h * 0.42),
          Math.floor(w * 0.65),
          Math.floor(h * 0.58),
          2.5,
          135,
        ],
        [
          Math.floor(w * 0.35),
          Math.floor(h * 0.42),
          Math.floor(w * 0.65),
          Math.floor(h * 0.58),
          2.5,
          165,
        ],
      ];

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }

      for (const [sx, sy, sw, sh, scale, threshold] of regions) {
        if (sw <= 10 || sh <= 10) continue;
        const targetW = Math.min(2400, Math.round(sw * scale));
        const targetH = Math.min(2400, Math.round(sh * scale));
        canvas.width = targetW;
        canvas.height = targetH;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

        const imageData = ctx.getImageData(0, 0, targetW, targetH);

        if (threshold > 0) {
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const val = lum < threshold ? 0 : 255;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
        }

        const code = jsQR(imageData.data, targetW, targetH, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data && code.data.trim().length > 0) {
          const parsed = parseThaiBankSlipQrPayload(code.data);
          resolve(parsed);
          return;
        }
      }

      resolve(null);
    };

    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
}

/**
 * Generates a realistic, cryptographically valid Thai Bank Transfer Slip PNG Data URL
 * containing a real EMVCo ITMX Mini-QR Code (`000001` standard + valid CRC-16 checksum),
 * exact receiver account, and matching transfer amount.
 */
export async function generateValidBankSlipSamplePng(params: {
  amount: number;
  receiverName: string;
  promptPayId: string;
  senderName?: string;
  bankCode?: string;
}): Promise<{ dataUrl: string; transactionRef: string; qrPayload: string; slipHash: string }> {
  const bankCode = params.bankCode || '004';
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const rand6 = String(Math.floor(100000 + Math.random() * 900000));
  const transactionRef = `004${y}${m}${d}${hh}${mm}${rand6}`;

  // Construct a real EMVCo National ITMX Slip Verification QR string with valid CRC-16:
  const sub00 = '0006000001';
  const sub01 = `0103${bankCode}`;
  const refLenStr = String(transactionRef.length).padStart(2, '0');
  const sub02 = `02${refLenStr}${transactionRef}`;
  const tag00Val = `${sub00}${sub01}${sub02}`;
  const tag00 = `00${String(tag00Val.length).padStart(2, '0')}${tag00Val}`;
  const tag51 = '5102TH';
  const bodyWithoutCrc = `${tag00}${tag51}9104`;
  const crc = computeCRC16(bodyWithoutCrc).toUpperCase();
  const qrPayload = `${bodyWithoutCrc}${crc}`;

  const miniQrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 240,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#111827', light: '#FFFFFF' },
  });

  const canvas = document.createElement('canvas');
  canvas.width = 760;
  canvas.height = 1040;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F0FDF4';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00A950';
  ctx.fillRect(0, 0, canvas.width, 150);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('กสิกรไทย K PLUS · โอนเงินสำเร็จ', 44, 72);
  ctx.font = '22px sans-serif';
  ctx.fillText(`${d}/${m}/${y + 543} ${hh}:${mm} น.`, 44, 115);

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#D1FAE5';
  ctx.lineWidth = 3;
  ctx.fillRect(36, 180, canvas.width - 72, 810);
  ctx.strokeRect(36, 180, canvas.width - 72, 810);

  ctx.fillStyle = '#6B7280';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('จาก (ผู้โอน / FROM)', 70, 240);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(params.senderName || 'ผู้สมัครวิ่ง CHANGSUEK RUN', 70, 278);
  ctx.fillStyle = '#059669';
  ctx.font = '20px monospace';
  ctx.fillText('ธ.กสิกรไทย · xxx-x-x4829-x', 70, 312);

  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 345);
  ctx.lineTo(canvas.width - 70, 345);
  ctx.stroke();

  ctx.fillStyle = '#6B7280';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('ไปยัง (ผู้รับโอน / TO PROMPTPAY)', 70, 395);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(params.receiverName, 70, 435);
  ctx.fillStyle = '#2563EB';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`PromptPay ID: ${params.promptPayId}`, 70, 472);

  ctx.beginPath();
  ctx.moveTo(70, 510);
  ctx.lineTo(canvas.width - 70, 510);
  ctx.stroke();

  ctx.fillStyle = '#ECFDF5';
  ctx.fillRect(70, 535, canvas.width - 140, 125);
  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('จำนวนเงิน (AMOUNT)', 96, 580);
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 48px monospace';
  ctx.fillText(`${params.amount.toFixed(2)} บาท`, 96, 638);

  ctx.fillStyle = '#374151';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('เลขที่รายการ (TRANSACTION REF):', 70, 730);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 23px monospace';
  ctx.fillText(transactionRef, 70, 766);

  ctx.fillStyle = '#6B7280';
  ctx.font = '18px sans-serif';
  ctx.fillText('ค่าธรรมเนียม: 0.00 บาท', 70, 815);
  ctx.fillText('สแกน QR เพื่อตรวจสอบสลิป (ITMX Verify)', 70, 850);

  const qrImg = new Image();
  await new Promise<void>((res) => {
    qrImg.onload = () => res();
    qrImg.src = miniQrDataUrl;
  });
  ctx.drawImage(qrImg, canvas.width - 295, 705, 220, 220);
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2;
  ctx.strokeRect(canvas.width - 295, 705, 220, 220);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
  return {
    dataUrl,
    transactionRef,
    qrPayload,
    slipHash: computeSimpleImageHash(dataUrl),
  };
}

/**
 * Legacy synchronous slip generator kept for Admin Dashboard preview compatibility.
 */
export function generateRealisticBankSlipDataUrl(params: {
  bankName: string;
  bankCode: string;
  amount: number;
  promptPayId: string;
  accountName: string;
  payerName: string;
  paymentRef: string;
  transferTimeText: string;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 820;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#10B981';
  ctx.fillRect(0, 0, canvas.width, 130);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`${params.bankName} · โอนเงินสำเร็จ`, 36, 62);
  ctx.font = '18px sans-serif';
  ctx.fillText(`เวลาโอน: ${params.transferTimeText}`, 36, 100);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(32, 160, canvas.width - 64, 610);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('ผู้โอน (FROM):', 60, 220);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(params.payerName, 60, 255);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('ผู้รับโอน PromptPay (TO):', 60, 325);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(params.accountName, 60, 360);
  ctx.fillStyle = '#2563EB';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`PromptPay ID: ${params.promptPayId}`, 60, 392);

  ctx.fillStyle = '#ECFDF5';
  ctx.fillRect(60, 435, canvas.width - 120, 110);
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 40px monospace';
  ctx.fillText(`${params.amount.toFixed(2)} THB`, 85, 505);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`REF: ${params.paymentRef}`, 60, 610);

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Full End-to-End Real Slip Verification Pipeline:
 * 1. Decodes Mini-QR from slip image using multi-pass jsQR & validates EMVCo ITMX CRC-16.
 * 2. Sends slip image + decoded Mini-QR to `/api/verify-slip` which:
 *    - Calls External Thai Bank Slip Verification API (EasySlip / Thunder / SlipOK) if configured, AND
 *    - Runs Gemini Vision Forensic Inspection + Strict 6-Point Gate:
 *      (a) Mandatory ITMX Mini-QR `000001` + valid CRC-16 checksum
 *      (b) Genuine completed bank slip image (no random photos, no unpaid PromptPay QR standees)
 *      (c) Exact transfer amount match (`detectedAmount === expectedAmount`)
 *      (d) Receiver Account / PromptPay ID & Receiver Name match (blocks slips transferred to other people!)
 *      (e) Cross-check Mini-QR Transaction Ref vs visual slip text (blocks pasted QR codes)
 *      (f) Anti-Replay duplicate check (blocks reused slips)
 */
export async function verifyBankSlipAuthenticity(params: {
  imageDataUrl: string;
  expectedAmount: number;
  expectedReceiverName: string;
  expectedPromptPayId: string;
  existingRefs?: string[];
  existingSlipHashes?: string[];
}): Promise<RealSlipVerificationResult> {
  // Step 1: Multi-pass client-side Mini-QR scan
  const miniQrInfo = await decodeSlipMiniQrFromImage(params.imageDataUrl);

  // Step 2: Call backend `/api/verify-slip` for External Bank API + AI Vision Forensics
  const response = await fetch('/api/verify-slip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageDataUrl: params.imageDataUrl,
      expectedAmount: params.expectedAmount,
      expectedReceiverName: params.expectedReceiverName,
      expectedPromptPayId: params.expectedPromptPayId,
      miniQrInfo,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.error ||
        `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ตรวจสอบสลิปได้ (${response.status})`
    );
  }

  const result: RealSlipVerificationResult = await response.json();

  // Step 3: Client-side Anti-Replay check against stored orders
  const refNorm = (result.transactionRef || '').trim().toUpperCase();
  const imgHash = computeSimpleImageHash(params.imageDataUrl);

  if (
    refNorm &&
    params.existingRefs &&
    params.existingRefs.some((r) => r.trim().toUpperCase() === refNorm)
  ) {
    result.verified = false;
    result.verificationMethod = 'REJECTED';
    result.rejectReasons.push(
      `สลิปใบนี้ (เลขที่รายการ ${result.transactionRef}) ถูกใช้งานออกบัตรไปแล้ว ไม่สามารถใช้สลิปซ้ำได้`
    );
    result.summaryMessage = `ปฏิเสธสลิปซ้ำ: เลขที่รายการ ${result.transactionRef} ถูกใช้งานไปแล้ว`;
  } else if (
    params.existingSlipHashes &&
    params.existingSlipHashes.some((h) => h === imgHash)
  ) {
    result.verified = false;
    result.verificationMethod = 'REJECTED';
    result.rejectReasons.push('ไฟล์ภาพสลิปนี้ถูกอัปโหลดใช้งานไปแล้ว ไม่สามารถใช้สลิปซ้ำได้');
    result.summaryMessage = 'ปฏิเสธสลิปซ้ำ: ไฟล์ภาพสลิปนี้ถูกใช้งานไปแล้ว';
  }

  return result;
}
