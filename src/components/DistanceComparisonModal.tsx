import React from 'react';
import { X, Award, Clock, MapPin, Heart, Shield, Sparkles, UserPlus } from 'lucide-react';
import { RouteId } from '../types';
import { TICKET_CARD_IMAGES } from './brand/TicketCardArtwork';

interface DistanceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRouteToRegister: (route: RouteId) => void;
}

export const DistanceComparisonModal: React.FC<DistanceComparisonModalProps> = ({
  isOpen,
  onClose,
  onSelectRouteToRegister,
}) => {
  if (!isOpen) return null;

  const columns: {
    id: RouteId;
    short: string;
    sub: string;
    chip: string;
    color: string;
    soft: string;
  }[] = [
    { id: '1km', short: '1 KM', sub: 'DOG MINI RUN', chip: 'เริ่มต้นง่าย', color: '#FF8A3D', soft: '#FFE9DA' },
    { id: '3km', short: '3.8 KM', sub: 'DOG RUN', chip: 'วิ่งคู่น้องสุนัข', color: '#2EAD62', soft: '#DFF5E8' },
    { id: '5km', short: '5 KM', sub: 'บุคคลทั่วไป', chip: 'ยอดนิยม', color: '#E5A800', soft: '#FFF6CF' },
    { id: '10km', short: '10 KM', sub: 'บุคคลทั่วไป', chip: 'ท้าทาย', color: '#7B3FC6', soft: '#EEE4FA' },
  ];

  const comparisonData: { label: string; icon: any; v: [string, string, string, string] }[] = [
    {
      label: 'ราคาบัตร',
      icon: Award,
      v: [
        '790 บาท (1 คน + 1 น้องสุนัข)',
        '890 บาท (1 คน + 1 น้องสุนัข)',
        '690 บาท / คน',
        '890 บาท / คน',
      ],
    },
    {
      label: 'เพิ่มคน / เพิ่มน้องสุนัข',
      icon: UserPlus,
      v: ['+450 บาท/คน\n+250 บาท/ตัว', '+500 บาท/คน\n+300 บาท/ตัว', '-', '-'],
    },
    {
      label: 'เหมาะกับ',
      icon: Heart,
      v: [
        'ลูกน้องสุนัข น้องสุนัขสูงวัย เด็กเล็ก',
        'ครอบครัวและเจ้าของที่พาน้องสุนัขวิ่งเป็นประจำ',
        'นักวิ่งที่อยากพัฒนาความเร็วและสุขภาพ',
        'นักวิ่งที่อยากท้าทายตัวเอง',
      ],
    },
    {
      label: 'เวลาคัทออฟ (Cut-off)',
      icon: Clock,
      v: ['45 นาที', '1 ชม. 15 นาที', '1 ชม. 30 นาที', '2 ชม. 15 นาที'],
    },
    {
      label: 'สภาพพื้นผิววิ่ง',
      icon: MapPin,
      v: [
        'ทางเลียบหาด เรียบ 100%',
        'ถนนคอนกรีตและทางเลียบหาด เรียบ 100%',
        'ถนนลาดยาง/คอนกรีต 85% + ทางเลียบสระ 15%',
        'ทรายหาด ป่าสน และทางเรียบ',
      ],
    },
    {
      label: 'การนำน้องสุนัขเข้าร่วม',
      icon: Heart,
      v: [
        'วิ่งคู่ได้ (มีจุดน้ำสำหรับน้องสุนัข)',
        'วิ่งคู่ได้ (มีจุดน้ำสำหรับน้องสุนัข)',
        'ประเภทบุคคล: สมัครวิ่งคู่น้องสุนัขที่ 1 หรือ 3.8 KM',
        'ประเภทบุคคล: สมัครวิ่งคู่น้องสุนัขที่ 1 หรือ 3.8 KM',
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-[#EEE4FA] overflow-hidden my-6 transition-all transform animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7B3FC6] via-[#54239A] to-[#2EAD62] p-5 sm:p-6 text-white flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-[#FFC928] text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DISTANCE COMPARISON</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">เปรียบเทียบระยะวิ่งทั้ง 4 ประเภทบัตร</h3>
            <p className="text-xs sm:text-sm text-white/80">
              เลือกสนามที่ตอบโจทย์ไลฟ์สไตล์และความสนุกของคุณมากที่สุด
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 4 ticket summary cards with dedicated artwork */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 p-4 sm:p-6 bg-[#FAF9FC] border-b border-gray-100">
          {columns.map((c) => {
            const imgMeta = TICKET_CARD_IMAGES[c.id];
            return (
              <div
                key={c.id}
                className="group rounded-2xl bg-white border-2 shadow-xs overflow-hidden flex flex-col justify-between text-center"
                style={{ borderColor: c.color + '66' }}
              >
                <div className="relative h-24 w-full overflow-hidden">
                  <img loading="lazy" decoding="async"
                    src={imgMeta.src}
                    alt={imgMeta.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{ objectPosition: imgMeta.objectPosition }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span
                    className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs"
                    style={{ background: c.soft, color: c.color }}
                  >
                    {c.chip}
                  </span>
                  <div className="absolute bottom-1.5 right-2.5 text-xl sm:text-2xl font-black text-white drop-shadow">
                    {c.short}
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div className="text-[11px] sm:text-xs font-bold text-gray-700">{c.sub}</div>
                  <button
                    onClick={() => {
                      onClose();
                      onSelectRouteToRegister(c.id);
                    }}
                    className="mt-2.5 text-white text-xs font-black py-2 px-2 rounded-xl transition-all shadow cursor-pointer hover:brightness-95"
                    style={{ background: c.color }}
                  >
                    เลือกสมัคร {c.short}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-500">
                <th className="py-2.5 px-3 font-black text-gray-800 w-[20%]">เกณฑ์การเปรียบเทียบ</th>
                {columns.map((c) => (
                  <th key={c.id} className="py-2.5 px-3 font-black w-[20%]" style={{ color: c.color }}>
                    {c.short} ({c.sub})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparisonData.map((row, idx) => {
                const Icon = row.icon;
                return (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors align-top">
                    <td className="py-3 px-3 font-bold text-gray-800">
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-[#7B3FC6] flex-shrink-0" />
                        <span>{row.label}</span>
                      </span>
                    </td>
                    {row.v.map((cell, i) => (
                      <td key={i} className="py-3 px-3 text-gray-700 font-medium whitespace-pre-line">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#2EAD62]" />
            <span>ทุกระยะมีประกันอุบัติเหตุและทีมแพทย์กู้ชีพคอยดูแล 100%</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
