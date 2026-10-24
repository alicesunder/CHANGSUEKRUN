import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { hotelsData, venueInfo, eventInfo } from '../data/eventData';
import { Hotel } from '../types';
import { MapPin, Phone, ExternalLink, PawPrint, Car, Navigation, X } from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/geo';

interface HotelMapProps {
  compact?: boolean;
}

export const HotelMap: React.FC<HotelMapProps> = ({ compact = false }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [venueInfo.latitude, venueInfo.longitude],
        zoom: 13,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // Event Venue Pin (Start/Finish)
      const venueIcon = L.divIcon({
        className: 'venue-marker',
        html: `
          <div style="
            background: #3D176C;
            color: #FFC928;
            font-weight: bold;
            font-size: 16px;
            padding: 8px;
            border-radius: 50%;
            border: 3px solid #FFC928;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
          ">
            🏁
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([venueInfo.latitude, venueInfo.longitude], { icon: venueIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: 'Prompt', sans-serif; padding: 4px 6px;">
            <div style="font-size: 11px; color: #FFC928; font-weight: 700; text-transform: uppercase;">จุดปล่อยตัว / เส้นชัย</div>
            <div style="font-size: 14px; font-weight: 800; color: #18151D;">${eventInfo.venue}</div>
            <div style="font-size: 11px; color: #6F6A76;">โรงแรม Sea Sand Sun • ค่ายนเรศวร</div>
          </div>
        `);

      // Hotel Pins
      hotelsData.forEach((hotel) => {
        const isPet = hotel.petFriendly;
        const hotelIcon = L.divIcon({
          className: 'hotel-marker',
          html: `
            <div style="
              background: ${isPet ? '#2EAA59' : '#6F35B5'};
              color: white;
              font-weight: bold;
              font-size: 13px;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 2px solid #FFFFFF;
              box-shadow: 0 3px 10px rgba(0,0,0,0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              ${isPet ? '🐾' : '🏨'}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([hotel.latitude, hotel.longitude], { icon: hotelIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedHotel(hotel);
        });
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={compact ? 'w-full h-full' : 'mt-8 bg-white rounded-3xl border border-[#ECEAF0] p-6 sm:p-8 shadow-sm'}>
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#18151D] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#8C4DDB]" />
              <span>แผนที่ตำแหน่งที่พักรอบค่ายนเรศวร (Hotel Map)</span>
            </h3>
            <p className="text-xs text-[#6F6A76] mt-0.5">
              คลิกที่หมุด 🏨 หรือ 🐾 เพื่อตรวจสอบระยะทาง ข้อมูลติดต่อ และเส้นทางสู่จุดปล่อยตัว
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#3D176C] border border-[#FFC928]" />
              <span className="font-semibold text-[#18151D]">จุดปล่อยตัว (Start/Finish)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#2EAA59]" />
              <span className="font-semibold text-[#18151D]">สัตว์เลี้ยงพักได้</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#6F35B5]" />
              <span className="font-semibold text-[#18151D]">โรงแรม/รีสอร์ตทั่วไป</span>
            </div>
          </div>
        </div>
      )}

      <div className={`relative rounded-2xl overflow-hidden border border-purple-100 ${compact ? 'h-[440px]' : 'h-96'} w-full`}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Selected Hotel Floating Card */}
        {selectedHotel && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20 bg-white rounded-2xl p-4 shadow-xl border border-[#ECEAF0] text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#6F35B5] bg-[#F3EDF9] px-2 py-0.5 rounded-md">
                  {selectedHotel.type}
                </span>
                <h4 className="text-sm font-extrabold text-[#18151D] mt-1">
                  {selectedHotel.nameTh}
                </h4>
                <p className="text-[11px] text-[#6F6A76]">{selectedHotel.nameEn}</p>
              </div>
              <button
                onClick={() => setSelectedHotel(null)}
                className="text-[#6F6A76] hover:text-[#18151D] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#ECEAF0]">
              <span className="text-[#6F6A76]">ห่างจากจุดปล่อยตัว:</span>
              <span className="font-bold text-[#18151D]">
                {selectedHotel.distanceKm} กม. (~{selectedHotel.drivingTimeMinutes} นาที)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6F6A76]">สัตว์เลี้ยง:</span>
              <span className={`font-bold ${selectedHotel.petFriendly ? 'text-[#2EAA59]' : 'text-[#6F6A76]'}`}>
                {selectedHotel.petFriendly ? 'สัตว์เลี้ยงพักได้' : 'ไม่อนุญาต'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6F6A76]">ราคาเริ่มต้น:</span>
              <span className="font-extrabold text-[#18151D]">฿{selectedHotel.priceMin.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={`tel:${selectedHotel.phone}`}
                className="bg-[#2EAA59] text-white font-bold py-2 rounded-xl text-center flex items-center justify-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>โทรจอง</span>
              </a>
              <a
                href={getGoogleMapsUrl(selectedHotel.nameTh, selectedHotel.latitude, selectedHotel.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#6F35B5] text-white font-bold py-2 rounded-xl text-center flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดแผนที่</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
