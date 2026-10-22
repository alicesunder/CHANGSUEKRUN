import React from 'react';
import { safetyContacts } from '../data/eventData';
import {
  ShieldAlert,
  Phone,
  HeartPulse,
  PawPrint,
  Sun,
  Droplets,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export const SafetySection: React.FC = () => {
  return (
    <section id="safety" className="py-16 bg-[#FAF9FC] border-b border-[#ECEAF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-[#E53935] uppercase bg-[#FDF2F2] px-3.5 py-1 rounded-full">
            Safety & Medical Protocols
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#18151D] mt-2">
            มาตรฐานความปลอดภัยและการแพทย์
          </h2>
          <p className="text-sm sm:text-base text-[#6F6A76] mt-2">
            ระบบความปลอดภัยและทีมแพทย์กู้ชีพพร้อมดูแลทั้งนักวิ่ง ครอบครัว และน้องหมาตลอดเส้นทาง
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left 7 cols: Safety Guidelines & Dog Protocol */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Medical Support Team Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#ECEAF0] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#E53935] flex items-center justify-center">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#18151D]">
                    ระบบการแพทย์และหน่วยกู้ชีพฉุกเฉิน
                  </h3>
                  <p className="text-xs text-[#6F6A76]">
                    ศูนย์อำนวยการร่วม รพ.หัวหิน และกองร้อยพยาบาล ค่ายนเรศวร
                  </p>
                </div>
              </div>
              <ul className="text-xs text-[#6F6A76] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2EAA59] flex-shrink-0 mt-0.5" />
                  <span>หน่วยแพทย์สนามหลักประจำจุด Start/Finish พร้อมเครื่องกระตุกหัวใจ AED และรถพยาบาลฉุกเฉินระดับสูง</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2EAA59] flex-shrink-0 mt-0.5" />
                  <span>หน่วยปฐมพยาบาลเคลื่อนที่เร็วด้วยจักรยานและมอเตอร์ไซค์ลาดตระเวนตลอดแนวเส้นทาง 10K</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2EAA59] flex-shrink-0 mt-0.5" />
                  <span>จุดบริการน้ำเกลือแร่ ผลไม้ และผ้าเย็นชุบน้ำแข็งเพื่อป้องกันภาวะฮีทสโตรก (Heatstroke)</span>
                </li>
              </ul>
            </div>

            {/* Dog Running Safety Protocol (Special Highlight) */}
            <div className="bg-white rounded-3xl p-6 border border-[#2EAA59]/30 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F7ED] text-[#2EAA59] flex items-center justify-center">
                  <PawPrint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#18151D]">
                    กฎความปลอดภัยสำหรับสุนัขคู่ใจ (Dog Running Protocol)
                  </h3>
                  <p className="text-xs text-[#2EAA59] font-bold">
                    เพื่อให้การวิ่งปลอดภัย มีความสุข และไม่กระทบผู้อื่น
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#6F6A76] mt-4">
                <div className="p-3 rounded-2xl bg-[#FAF9FC] border border-[#ECEAF0]">
                  <span className="font-bold text-[#18151D] block mb-1">สายจูงตลอดเวลา</span>
                  ความยาวสายจูงไม่เกิน 1.5 - 2 เมตร ไม่อนุญาตให้ปล่อยวิ่งอิสระ
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF9FC] border border-[#ECEAF0]">
                  <span className="font-bold text-[#18151D] block mb-1">ตรวจอุ้งเท้าและความร้อน</span>
                  มีสัตวแพทย์และจุดแช่น้ำคลายร้อนบริเวณเส้นชัย
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF9FC] border border-[#ECEAF0]">
                  <span className="font-bold text-[#18151D] block mb-1">พกถุงเก็บมูล</span>
                  รักษาความสะอาดพื้นที่ค่ายและชายหาดร่วมกัน 100%
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF9FC] border border-[#ECEAF0]">
                  <span className="font-bold text-[#18151D] block mb-1">สมุดวัคซีน</span>
                  สุนัขต้องได้รับวัคซีนพิษสุนัขบ้าและวัคซีนรวมครบถ้วน
                </div>
              </div>
            </div>

            {/* Weather & Cancellation Protocol */}
            <div className="p-4 rounded-2xl bg-[#FFF8E7] border border-[#FFC928]/50 text-xs text-[#7A5400] leading-relaxed flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#A66D00] flex-shrink-0 mt-0.5" />
              <div>
                <strong>นโยบายกรณีสภาพอากาศแปรปรวน:</strong> ในกรณีที่เกิดพายุฝนฟ้าคะนอง คลื่นลมทะเลรุนแรง หรือสภาวะที่ไม่ปลอดภัย คณะกรรมการจัดการแข่งขันมีอำนาจในการปรับเปลี่ยนเส้นทาง เลื่อนเวลาปล่อยตัว หรือยุติการแข่งขัน เพื่อความปลอดภัยสูงสุดของผู้เข้าร่วมทุกคน
              </div>
            </div>

          </div>

          {/* Right 5 cols: Emergency Hotlines Contact Panel */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#ECEAF0] shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E53935] uppercase tracking-wider">
              <Phone className="w-4 h-4" />
              <span>เบอร์โทรฉุกเฉินตลอด 24 ชั่วโมง</span>
            </div>

            <h3 className="text-xl font-black text-[#18151D]">
              Emergency Hotlines
            </h3>
            <p className="text-xs text-[#6F6A76]">
              บันทึกเบอร์โทรสำคัญนี้ไว้ในโทรศัพท์เพื่อการติดต่อเร่งด่วนในวันแข่งขัน
            </p>

            <div className="divide-y divide-[#ECEAF0] pt-2">
              {safetyContacts.map((contact, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#18151D]">
                      {contact.title}
                    </h4>
                    <p className="text-xs text-[#6F6A76]">
                      {contact.role}
                    </p>
                  </div>

                  <a
                    href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`}
                    className="bg-[#FAF9FC] hover:bg-[#FDF2F2] text-[#E53935] border border-[#ECEAF0] hover:border-[#E53935]/40 font-black text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{contact.phone}</span>
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-[#A49FB0]">
                ศูนย์วิทยุกู้ชีพค่ายนเรศวร ช่องความถี่วิทยุ 162.250 MHz
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
