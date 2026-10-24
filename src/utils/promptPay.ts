/**
 * Official Thai QR PromptPay (EMVCo Merchant-Presented QR) Payload Generator
 * Supports 10-digit Thai Mobile Numbers (08x-xxx-xxxx) and 13-digit National/Tax IDs.
 * Computes CRC-16/CCITT-FALSE (polynomial 0x1021, initial 0xFFFF) per Bank of Thailand spec.
 */

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16CcittFalse(payload: string): string {
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

export function sanitizePromptPayTarget(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

export function formatPromptPayDisplay(raw: string): string {
  const digits = sanitizePromptPayTarget(raw);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 13) {
    return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`;
  }
  return raw;
}

export function generatePromptPayPayload(targetId: string, amount?: number): string {
  const digits = sanitizePromptPayTarget(targetId);

  // Sub-tag 00: AID for PromptPay
  const aidTag = formatTag('00', 'A000000677010111');

  // Sub-tag 01 (mobile), 02 (13-digit Tax/Citizen ID), or 03 (15-digit E-Wallet ID)
  let recipientSubTag = '';
  if (digits.length >= 15) {
    recipientSubTag = formatTag('03', digits.slice(0, 15));
  } else if (digits.length === 13) {
    recipientSubTag = formatTag('02', digits);
  } else {
    // Default treat as Thai mobile number (convert leading 0 -> 0066)
    const phone = digits.length === 10 && digits.startsWith('0')
      ? `0066${digits.slice(1)}`
      : `0066${digits}`;
    recipientSubTag = formatTag('01', phone);
  }

  const merchantAccountInfo = formatTag('29', `${aidTag}${recipientSubTag}`);

  const hasAmount = typeof amount === 'number' && amount > 0;
  const parts: string[] = [
    formatTag('00', '01'), // Payload Format Indicator
    formatTag('01', hasAmount ? '12' : '11'), // 12 = Dynamic QR (with amount), 11 = Static
    merchantAccountInfo,
    formatTag('53', '764'), // Currency THB (ISO 4217 = 764)
  ];

  if (hasAmount) {
    parts.push(formatTag('54', amount.toFixed(2)));
  }

  parts.push(formatTag('58', 'TH')); // Country Code TH

  // Tag 63 (CRC) prefix
  const rawPayload = `${parts.join('')}6304`;
  const checksum = crc16CcittFalse(rawPayload);
  return `${rawPayload}${checksum}`;
}

/** Formats a Thai bank account number for display, e.g. 2408677648 -> 240-8-67764-8. */
export function formatThaiBankAccount(raw: string): string {
  const d = (raw || '').replace(/[^0-9]/g, '');
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 4)}-${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `${d.slice(0, 3)}-${d.slice(3, 9)}-${d.slice(9)}`;
  return d;
}
