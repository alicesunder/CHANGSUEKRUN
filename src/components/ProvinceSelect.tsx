import React from 'react';
import { THAI_PROVINCES } from '../data/provinces';

/** The province on a licence plate: a list of all 77 provinces in Thai alphabetical order. */
export const ProvinceSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  id?: string;
  className?: string;
}> = ({ value, onChange, required, id, className }) => (
  <select
    id={id}
    required={required}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label="จังหวัดบนป้ายทะเบียน"
    className={className || 'w-full min-h-[48px] px-3 rounded-xl border-2 border-[#2A1450]/20 bg-white text-sm font-semibold text-[#2A1450]'}
  >
    <option value="">จังหวัดบนป้ายทะเบียน (เลือก)</option>
    {THAI_PROVINCES.map((p) => (
      <option key={p} value={p}>
        {p}
      </option>
    ))}
  </select>
);
