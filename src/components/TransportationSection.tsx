import React from 'react';
import { Car, Train, Bus, Plane, Navigation, Clock, AlertTriangle, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/geo';
import { venueInfo } from '../data/eventData';

export const TransportationSection: React.FC = () => {
  const transportModes = [
    {
      id: 'car',
      icon: Car,
      title: 'รถยนต์ส่วนบุคคล (จากกรุงเทพฯ)',
      duration: '2.0 - 2.5 ชั่วโมง',
      route: 'ถ.พระราม 2 (ทล.35) ➔ ถ.เพชรเกษม (ทล.4) มุ่งหน้าชะอำ-หัวหิน',
      description: 'เดินทางสะดวกที่สุด สามารถเข้าจอดในลานจอดค่ายนเรศวรได้โดยตรง มีป้ายบอกทางชัดเจนตลอดเส้นทาง',
      tips: 'แนะนำออกเดินทางก่อน 04:30 น. ในวันแข่งขัน เพื่อหลีกเลี่ยงการจราจรชะลอตัวหน้าทางเข้าค่าย',
      badge: 'แนะนำสูงสุด',
      badgeColor: 'bg-[#EEE4FA] text-[#7B3FC6]',
    },
    {
      id: 'train',
      icon: Train,
      title: 'รถไฟแห่งประเทศไทย (SRT)',
      duration: '3.5 - 4.0 ชั่วโมง',
      route: 'สถานีกลางกรุงเทพอภิวัฒน์ ➔ สถานีชะอำ หรือ สถานีหัวหิน',
      description: 'สัมผัสการเดินทางแบบสโลว์ไลฟ์ ขบวนรถด่วนพิเศษปรับอากาศ หรือรถไฟท่องเที่ยวสายใต้',
      tips: 'จากสถานีรถไฟชะอำ นั่งรถสองแถวหรือแท็กซี่ต่อมายังค่ายนเรศวรเพียง 10-15 นาที (ประมาณ 8 กม.)',
      badge: 'ชมวิวธรรมชาติ',
      badgeColor: 'bg-[#DFF5E8] text-[#2EAD62]',
    },
    {
      id: 'van',
      icon: Bus,
      title: 'รถตู้ / มินิบัสประจำทาง',
      duration: '2.5 - 3.0 ชั่วโมง',
      route: 'สถานีขนส่งสายใต้ใหม่ / หมอชิต 2 / เอกมัย ➔ ชะอำ',
      description: 'มีรถออกทุก 30-45 นาที แจ้งคนขับขอลงบริเวณหน้าค่ายนเรศวร (ติดถนนเพชรเกษม กม. 219)',
      tips: 'บอกคนขับว่า "ลงหน้าค่ายนเรศวร ตชด." จะจอดตรงสะพานลอยคนข้ามหน้าค่ายพอดี',
      badge: 'ประหยัดคุ้มค่า',
      badgeColor: 'bg-[#FFC928]/20 text-[#54239A]',
    },
    {
      id: 'plane',
      icon: Plane,
      title: 'เครื่องบินสู่สนามบินหัวหิน (HHQ)',
      duration: 'เที่ยวบิน 45 นาที',
      route: 'ท่าอากาศยานหัวหิน ➔ ค่ายนเรศวร (ระยะทางเพียง 6 กม.)',
      description: 'สำหรับนักวิ่งจากต่างภูมิภาค เดินทางจากสนามบินหัวหินมายังค่ายนเรศวรเพียง 10 นาทีด้วย Grab / Taxi',
      tips: 'แนะนำเช็กเที่ยวบินและรอบเวลาก่อนการเดินทางล่วงหน้า',
      badge: 'รวดเร็วสะดวก',
      badgeColor: 'bg-[#45B9EA]/15 text-[#169BD5]',
    },
    {
      id: 'local',
      icon: Navigation,
      title: 'รถสองแถวท้องถิ่น & Grab / Taxi',
      duration: '10 - 20 นาที',
      route: 'วิ่งให้บริการระหว่างตัวเมืองชะอำ ➔ หาดเจ้าสำราญ ➔ หัวหิน',
      description: 'มีรถสองแถวสีส้มและสีเขียววิ่งผ่านหน้าค่ายตลอดวัน หรือเรียกบริการผ่านแอปพลิเคชัน Grab ได้สะดวก',
      tips: 'ช่วงบ่ายวันแข่งขันการจราจรหนาแน่น แนะนำนัดหมายคนขับล่วงหน้าเพื่อความตรงเวลา',
      badge: 'เดินทางระยะสั้น',
      badgeColor: 'bg-gray-100 text-gray-700',
    },
  ];

  const parkingZones = [
    {
      zone: 'โซน A (Zone A)',
      title: 'ลานจอดหลักภายในค่ายนเรศวร',
      capacity: '400 คัน',
      distance: 'เดิน 200 ม. ถึงจุดปล่อยตัว',
      shuttle: 'ไม่ต้องขึ้นรถรับส่ง (เดินถึงทันที)',
      type: 'รถยนต์ส่วนบุคคล & วีไอพี',
      status: 'เปิด 03:30 น.',
      statusColor: 'text-[#2EAD62] bg-[#DFF5E8]',
    },
    {
      zone: 'โซน B (Zone B)',
      title: 'ลานสนามฟุตบอลและสโมสรทหาร',
      capacity: '250 คัน',
      distance: '500 ม. จากจุดปล่อยตัว',
      shuttle: 'มีรถกอล์ฟรับส่งฟรีทุก 3 นาที',
      type: 'รถยนต์ส่วนบุคคลทั่วไป',
      status: 'เปิด 03:30 น.',
      statusColor: 'text-[#2EAD62] bg-[#DFF5E8]',
    },
    {
      zone: 'โซน C (Zone C)',
      title: 'ลานจอดสำรองริม ถ.เพชรเกษม',
      capacity: '200 คัน',
      distance: '1.2 กม. จากจุดปล่อยตัว',
      shuttle: 'รถสองแถวรับส่งฟรีทุก 5 นาที',
      type: 'รถบัสทีมวิ่ง & รถตู้คณะ',
      status: 'เปิด 04:00 น.',
      statusColor: 'text-[#54239A] bg-[#EEE4FA]',
    },
  ];

  return (
    <section id="transport" className="py-16 bg-[#FAF9FC] border-b border-[#EEE4FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEE4FA] text-xs font-black text-[#7B3FC6] uppercase tracking-wider mb-3">
            <Navigation className="w-3.5 h-3.5 text-[#FFC928]" />
            <span>TRAVEL & PARKING GUIDE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#17151C] tracking-tight mb-3">
            การเดินทางและที่จอดรถสะดวกสบาย
          </h2>
          <p className="text-sm sm:text-base text-[#6F6878] font-semibold">
            วางแผนเดินทางสู่ค่ายนเรศวร ชะอำ-หัวหิน ด้วย 5 ช่องทาง พร้อมลานจอดรถรองรับกว่า 850 คัน และรถรับส่งฟรี
          </p>
        </div>

        {/* SECTION 24: 5 Transportation Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {transportModes.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border-2 border-[#EEE4FA] p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#EEE4FA] text-[#7B3FC6] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#17151C] mb-1">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#7B3FC6] mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ระยะเวลา: {item.duration}</span>
                  </div>

                  <p className="text-xs text-[#6F6878] font-medium leading-relaxed mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEE4FA] text-[11px] text-[#2EAD62] font-semibold bg-[#DFF5E8]/40 p-2.5 rounded-xl">
                  <strong>ข้อแนะนำ:</strong> {item.tips}
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 25: PARKING & SHUTTLE SERVICE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#EEE4FA] shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#54239A] bg-[#EEE4FA] px-3 py-1 rounded-full">
                PARKING ZONES & SHUTTLE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#17151C] mt-2">
                3 โซนที่จอดรถ (รองรับ 850+ คัน) & รถรับส่งฟรีตลอดงาน
              </h3>
              <p className="text-xs sm:text-sm text-[#6F6878] font-semibold mt-1">
                มีเจ้าหน้าที่ทหาร ตชด. จัดการจราจรและดูแลความปลอดภัยตลอด 24 ชั่วโมง
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#2EAD62] bg-[#DFF5E8] px-3.5 py-2 rounded-2xl">
              <ShieldCheck className="w-4 h-4" />
              <span>จอดฟรี ไม่มีค่าใช้จ่าย</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {parkingZones.map((pz, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#FAF9FC] border-2 border-[#EEE4FA] hover:border-[#7B3FC6]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#7B3FC6]">{pz.zone}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${pz.statusColor}`}>
                      {pz.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-[#17151C] mb-2">{pz.title}</h4>
                  <div className="space-y-1.5 text-xs text-[#6F6878] font-medium mb-3">
                    <div>🚗 ความจุ: <strong>{pz.capacity}</strong></div>
                    <div>📍 ระยะทาง: {pz.distance}</div>
                    <div>🚌 การรับส่ง: <span className="text-[#54239A] font-bold">{pz.shuttle}</span></div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 pt-2 border-t border-[#EEE4FA]">
                  เหมาะสำหรับ: {pz.type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Navigation CTA Banner */}
        <div className="bg-gradient-to-r from-[#24172F] via-[#54239A] to-[#7B3FC6] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-[#FFC928]">
              พร้อมออกเดินทางสู่ค่ายนเรศวรหรือยัง?
            </h3>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl font-medium">
              ปักหมุดจุดหมายที่ ค่ายนเรศวร กองบัญชาการตำรวจตระเวนชายแดน ถ.เพชรเกษม ชะอำ จ.เพชรบุรี
            </p>
          </div>

          <a
            href={getGoogleMapsUrl(venueInfo.name, venueInfo.latitude, venueInfo.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FFC928] hover:bg-[#F5B800] text-[#17151C] font-black text-sm px-7 py-3.5 rounded-2xl shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Navigation className="w-4 h-4 text-[#17151C]" />
            <span>เปิด Google Maps นำทางทันที</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
