import React, { useState, useMemo } from 'react';
import { hotelsData } from '../data/hotelsData';
import { Hotel } from '../types';
import {
  MapPin,
  Phone,
  Search,
  PawPrint,
  Car,
  Navigation,
  X,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Table as TableIcon,
  LayoutList,
  Map as MapIcon,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  Heart,
  Star,
  Compass,
  ArrowRight,
} from 'lucide-react';
const HotelMap = React.lazy(() => import('./HotelMap').then((m) => ({ default: m.HotelMap })));
import { getGoogleMapsUrl } from '../utils/geo';
import { PawIcon } from './brand/DogDecor';

interface HotelExplorerProps {
  initialSearch?: string;
}

const getHotelImage = (hotel: Hotel): string => {
  const photoPool = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80',
  ];
  const idx =
    Math.abs(hotel.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) %
    photoPool.length;
  return photoPool[idx];
};

// 4 Featured Hotels matching the reference mockup
const FEATURED_MOCKUP_HOTELS = [
  {
    id: 'featured-radisson',
    name: 'Radisson Resort & Spa Hua Hin',
    priceStart: '฿1,500',
    distanceText: 'ห่างจากงาน 1.92 กม.',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700&auto=format&fit=crop&q=80',
    matchKeyword: 'Radisson',
  },
  {
    id: 'featured-cera',
    name: 'Cera Resort Chaam',
    priceStart: '฿1,626',
    distanceText: 'ห่างจากงาน 2.2 กม.',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&auto=format&fit=crop&q=80',
    matchKeyword: 'Cera',
  },
  {
    id: 'featured-vala',
    name: 'VALA Hua Hin - Nu Chapter',
    priceStart: '฿4,608',
    distanceText: 'ห่างจากงาน 2.28 กม.',
    image:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=700&auto=format&fit=crop&q=80',
    matchKeyword: 'VALA',
  },
  {
    id: 'featured-avani',
    name: 'AVANI+ Hua Hin Resort',
    priceStart: '฿3,680',
    distanceText: 'ห่างจากงาน 2.8 กม.',
    image:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=700&auto=format&fit=crop&q=80',
    matchKeyword: 'AVANI',
  },
];

export const HotelExplorer: React.FC<HotelExplorerProps> = () => {
  const [directoryExpanded, setDirectoryExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'map'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [distanceFilter, setDistanceFilter] = useState<'all' | 'under3' | '3to5' | 'above5'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'budget' | 'mid' | 'premium'>('all');
  const [roomFilter, setRoomFilter] = useState<'all' | 'available' | 'immediate'>('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'Resort' | 'Hotel' | 'Villa' | 'Guest House'
  >('all');
  const [showAllHotels, setShowAllHotels] = useState(false);
  const [selectedHotelModal, setSelectedHotelModal] = useState<Hotel | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const toggleFavorite = (hotelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({
      ...prev,
      [hotelId]: !prev[hotelId],
    }));
  };

  const copyPhoneNumber = (phone: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  const handleSelectFeaturedHotel = (keyword: string, fallbackName: string) => {
    const found =
      hotelsData.find(
        (h) =>
          h.name.toLowerCase().includes(keyword.toLowerCase()) ||
          h.nameEn.toLowerCase().includes(keyword.toLowerCase())
      ) ||
      ({
        id: keyword.toLowerCase(),
        rank: 1,
        name: fallbackName,
        nameTh: fallbackName,
        nameEn: fallbackName,
        type: 'Resort',
        distanceKm: 1.8,
        drivingTimeMinutes: 4,
        priceMin: 2800,
        priceMax: 5500,
        priceStart: '฿2,800',
        availableRooms: 'มีห้องว่าง',
        availableRoomsCount: 8,
        petFriendly: true,
        petPolicy: 'ต้อนรับสุนัขและสัตว์เลี้ยงในโซน Pet-Friendly พร้อมพื้นที่เดินเล่นริมหาด',
        phone: '032-512-021',
        address: 'ถ.เพชรเกษม ชะอำ-หัวหิน จ.เพชรบุรี (ใกล้ค่ายนเรศวร)',
        latitude: 12.685,
        longitude: 99.962,
        rating: 4.8,
        amenities: ['ติดชายหาด', 'Pet-Friendly', 'อาหารเช้าสำหรับนักวิ่ง', 'ที่จอดรถฟรี'],
      } as Hotel);
    setSelectedHotelModal(found);
  };

  const filteredHotels = useMemo(() => {
    return hotelsData
      .filter((hotel) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNameTh = hotel.nameTh.toLowerCase().includes(q);
          const matchNameEn = hotel.nameEn.toLowerCase().includes(q);
          const matchName = hotel.name.toLowerCase().includes(q);
          const matchPhone = hotel.phone.includes(q);
          const matchPolicy = (hotel.petPolicy || '').toLowerCase().includes(q);
          const matchAddress = (hotel.address || '').toLowerCase().includes(q);
          if (
            !matchNameTh &&
            !matchNameEn &&
            !matchName &&
            !matchPhone &&
            !matchPolicy &&
            !matchAddress
          ) {
            return false;
          }
        }

        if (distanceFilter === 'under3' && hotel.distanceKm >= 3) return false;
        if (distanceFilter === '3to5' && (hotel.distanceKm < 3 || hotel.distanceKm > 5))
          return false;
        if (distanceFilter === 'above5' && hotel.distanceKm <= 5) return false;

        if (priceFilter === 'budget' && hotel.priceMin > 1000) return false;
        if (priceFilter === 'mid' && (hotel.priceMin <= 1000 || hotel.priceMin > 3000))
          return false;
        if (priceFilter === 'premium' && hotel.priceMin <= 3000) return false;

        if (
          roomFilter === 'available' &&
          (!hotel.availableRoomsCount || hotel.availableRoomsCount <= 0)
        )
          return false;
        if (
          roomFilter === 'immediate' &&
          (!hotel.availableRoomsCount || hotel.availableRoomsCount < 10)
        )
          return false;

        if (typeFilter !== 'all' && !hotel.type.toLowerCase().includes(typeFilter.toLowerCase()))
          return false;

        return true;
      })
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }, [searchQuery, distanceFilter, priceFilter, roomFilter, typeFilter]);

  const displayedHotels = useMemo(() => {
    if (showAllHotels || viewMode === 'table') {
      return filteredHotels;
    }
    return filteredHotels.slice(0, 6);
  }, [filteredHotels, showAllHotels, viewMode]);

  const totalHotelsCount = hotelsData.length;
  const availableHotelsCount = hotelsData.filter(
    (h) =>
      h.availableRoomsCount !== null &&
      h.availableRoomsCount !== undefined &&
      h.availableRoomsCount > 0
  ).length;
  const lowestPrice = Math.min(...hotelsData.map((h) => h.priceMin || 9999));

  return (
    <section
      id="hotels"
      className="py-10 sm:py-14 bg-white text-[#1E1B26] relative overflow-hidden scroll-mt-20"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ================================================================ */}
        {/* WHITE FEATURED HOTELS STRIP ("ที่พักใกล้สนาม วิ่งสบาย พักสบาย")     */}
        {/* ================================================================ */}
        <div className="relative rounded-[36px] bg-white p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_-16px_rgba(42,20,80,0.18),0_7px_0_#2A1450] overflow-hidden border-[3px] border-[#2A1450]">
          {/* Top Golden & Purple Stripe */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#5B20A8] via-[#FFC928] to-[#5B20A8]" />

          {/* Subtle Paw Print Watermarks */}
          <PawIcon className="w-28 h-28 text-[#5B20A8]/5 absolute -top-4 left-1/3 -rotate-12 pointer-events-none" />
          <PawIcon className="w-36 h-36 text-[#5B20A8]/5 absolute -bottom-6 right-12 rotate-12 pointer-events-none" />

          {/* Header Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-7 pb-5 border-b-2 border-dashed border-[#2A1450]/15">
            <div className="flex items-center gap-3.5">
              <span className="w-12 h-12 rounded-2xl bg-[#FFC928] border-2 border-[#2A1450] flex items-center justify-center text-[#2A1450] shadow-[2px_3px_0_#2A1450] shrink-0">
                <PawIcon className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2A1450] tracking-tight leading-tight">
                  ที่พักใกล้สนาม วิ่งสบาย พักสบาย
                </h2>
                <p className="text-xs sm:text-sm text-[#6B5A85] font-bold mt-0.5">
                  แนะนำที่พักยอดนิยม ใกล้หาดชะอำ • ต้อนรับนักวิ่งและสัตว์เลี้ยง
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDirectoryExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full bg-[#FFC928] hover:bg-[#F5B800] text-[#2A1450] border-2 border-[#2A1450] shadow-[0_4px_0_#2A1450] px-5 py-2.5 text-xs sm:text-sm font-extrabold transition-transform hover:scale-105 cursor-pointer"
            >
              <span>
                {directoryExpanded
                  ? 'ย่อตารางค้นหาที่พัก'
                  : `ดูที่พักทั้งหมด (${totalHotelsCount} แห่ง)`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Featured Hotel Cards Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {FEATURED_MOCKUP_HOTELS.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectFeaturedHotel(item.matchKeyword, item.name)}
                className="group bg-[#FAF7FF] hover:bg-white rounded-2xl p-3 border-2 border-[#2A1450]/20 hover:border-[#2A1450] shadow-[0_8px_20px_-8px_rgba(42,20,80,0.12)] hover:shadow-[0_14px_26px_-10px_rgba(42,20,80,0.28),0_4px_0_#2A1450] hover:-translate-y-1.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Resort Photo */}
                  <div className="relative h-36 sm:h-40 w-full rounded-xl overflow-hidden bg-purple-100 mb-3 border border-purple-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#15803D] text-white text-[10px] font-extrabold px-2.5 py-0.5 shadow-sm">
                      <PawPrint className="w-3 h-3" />
                      Pet Friendly
                    </span>
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/55 text-white text-[10px] font-semibold px-1.5 py-0.5">
                      ภาพประกอบ
                    </span>
                  </div>

                  {/* Hotel Name */}
                  <div className="px-1">
                    <h3 className="text-sm sm:text-[15px] font-extrabold text-[#2A1450] group-hover:text-[#6B2FD6] transition-colors truncate">
                      {item.name}
                    </h3>

                    <div className="mt-1 text-xs font-extrabold text-[#4B2D78] tabular-nums">
                      ราคาเริ่มต้น {item.priceStart} / คืน
                    </div>
                  </div>
                </div>

                {/* Distance Row */}
                <div className="mt-3 pt-2.5 border-t border-purple-200/60 px-1 flex items-center justify-between text-xs font-extrabold text-[#4B1C8C]">
                  <span className="inline-flex items-center gap-1 bg-white border border-purple-200 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3.5 h-3.5 text-[#7B3FC6] shrink-0" />
                    <span>{item.distanceText}</span>
                  </span>
                  <span className="text-[11px] text-[#6B2FD6] group-hover:translate-x-0.5 transition-transform">
                    ดูที่พัก →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* EXPANDABLE FULL 41-HOTEL PET-FRIENDLY DIRECTORY & MAP            */}
        {/* ================================================================ */}
        {directoryExpanded && (
          <div className="mt-8 bg-white rounded-[32px] p-5 sm:p-7 border border-purple-100 shadow-lg animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-[#5B20A8] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <PawPrint className="w-3 h-3 text-[#5B20A8]" />
                  <span>ฐานข้อมูลที่พัก Pet-Friendly ทั้งหมด {totalHotelsCount} แห่ง</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#261042]">
                  ค้นหาเปรียบเทียบราคา ระยะทาง และห้องว่าง
                </h3>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 bg-[#FAF8FD] border border-purple-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-[#5B20A8] text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-[#5B20A8]'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>การ์ด</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#5B20A8] text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-[#5B20A8]'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>ตาราง</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-[#5B20A8] text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-[#5B20A8]'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>แผนที่</span>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
              <div className="bg-[#FAF8FD] border border-purple-100 rounded-xl px-3.5 py-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">ที่พักทั้งหมด</div>
                  <div className="text-base font-black text-[#261042]">{totalHotelsCount} แห่ง</div>
                </div>
                <Building className="w-4 h-4 text-[#5B20A8]" />
              </div>
              <div className="bg-[#FAF8FD] border border-purple-100 rounded-xl px-3.5 py-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">รัศมีค้นหา</div>
                  <div className="text-base font-black text-[#261042]">30 กม.</div>
                </div>
                <Compass className="w-4 h-4 text-rose-500" />
              </div>
              <div className="bg-[#FAF8FD] border border-purple-100 rounded-xl px-3.5 py-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">มีห้องว่าง</div>
                  <div className="text-base font-black text-emerald-600">
                    {availableHotelsCount} แห่ง
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="bg-[#FAF8FD] border border-purple-100 rounded-xl px-3.5 py-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">ราคาเริ่มต้น</div>
                  <div className="text-base font-black text-[#B87A00]">
                    ฿{lowestPrice.toLocaleString()}+
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-[#B87A00]" />
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#FAF8FD] border border-purple-100 p-2.5 rounded-xl mb-4 flex flex-wrap md:flex-nowrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px] w-full md:w-auto">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อที่พัก, ทำเล, เบอร์โทร..."
                  className="w-full bg-white border border-purple-100 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B20A8]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value as any)}
                className="bg-white border border-purple-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">ระยะทาง ทั้งหมด</option>
                <option value="under3">&lt; 3 กม. (ใกล้มาก)</option>
                <option value="3to5">3 - 5 กม.</option>
                <option value="above5">&gt; 5 กม.</option>
              </select>

              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="bg-white border border-purple-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">ราคา ทั้งหมด</option>
                <option value="budget">ประหยัด (&lt; ฿1,000)</option>
                <option value="mid">ปานกลาง (฿1,000 - ฿3,000)</option>
                <option value="premium">พรีเมียม (&gt; ฿3,000)</option>
              </select>

              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value as any)}
                className="bg-white border border-purple-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">ห้องว่าง ทั้งหมด</option>
                <option value="available">มีห้องว่างแน่นอน</option>
                <option value="immediate">ว่าง 10+ ห้อง</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-white border border-purple-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">ประเภท ทั้งหมด</option>
                <option value="Resort">รีสอร์ต (Resort)</option>
                <option value="Hotel">โรงแรม (Hotel)</option>
                <option value="Villa">พูลวิลล่า (Villa)</option>
                <option value="Guest House">เกสต์เฮาส์</option>
              </select>
            </div>

            {viewMode === 'cards' && (
              <div className="space-y-2.5">
                {displayedHotels.map((hotel) => {
                  const hasRooms =
                    hotel.availableRoomsCount !== null &&
                    hotel.availableRoomsCount !== undefined &&
                    hotel.availableRoomsCount > 0;
                  const isFav = !!favorites[hotel.id];
                  const hotelImage = getHotelImage(hotel);

                  return (
                    <div
                      key={hotel.id}
                      onClick={() => setSelectedHotelModal(hotel)}
                      className="group bg-white hover:bg-purple-50/20 border border-purple-100 hover:border-purple-300 rounded-xl p-2.5 sm:p-3 transition-all cursor-pointer flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                    >
                      <div className="relative w-full sm:w-28 md:w-32 h-24 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-purple-50 border border-purple-100">
                        <img
                          src={hotelImage}
                          alt={hotel.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1 left-1 bg-[#5B20A8] text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                          #{hotel.rank || 1}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] uppercase font-bold text-[#5B20A8] bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                            {hotel.type || 'Hotel'}
                          </span>
                          {hotel.rating && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              <span>{hotel.rating}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-[#261042] truncate">{hotel.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 flex-wrap font-medium">
                          <span className="flex items-center gap-1 font-bold text-[#261042]">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>ห่างงาน {hotel.distanceKm} กม.</span>
                          </span>
                          <span>•</span>
                          <span>ขับรถ ~{hotel.drivingTimeMinutes} นาที</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div className="text-left sm:text-right">
                          {hasRooms && (
                            <div className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mb-0.5">
                              <span>ว่าง {hotel.availableRooms}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-base font-black text-[#5B20A8]">
                              {hotel.priceStart || `฿${hotel.priceMin.toLocaleString()}`}
                            </span>
                            <span className="text-[9px] text-slate-400"> /คืน</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => toggleFavorite(hotel.id, e)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isFav
                                ? 'bg-rose-50 border-rose-300 text-rose-500'
                                : 'bg-white border-purple-100 text-slate-400'
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`}
                            />
                          </button>
                          <button
                            onClick={() => setSelectedHotelModal(hotel)}
                            className="bg-[#5B20A8] hover:bg-[#471587] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <span>ดูข้อมูล</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredHotels.length > 6 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setShowAllHotels(!showAllHotels)}
                      className="bg-purple-50 hover:bg-purple-100 text-[#5B20A8] border border-purple-200 text-xs font-bold px-4 py-2 rounded-full inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {showAllHotels
                          ? 'ย่อแสดง 6 แห่งแรก'
                          : `แสดงครบทั้ง ${filteredHotels.length} แห่ง`}
                      </span>
                      {showAllHotels ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'table' && (
              <div className="bg-white border border-purple-100 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF8FD] border-b border-purple-100 text-[11px] font-black text-purple-900 uppercase">
                        <th className="py-3 px-3.5">#</th>
                        <th className="py-3 px-3.5">ชื่อที่พัก</th>
                        <th className="py-3 px-3.5 text-center">ระยะทาง</th>
                        <th className="py-3 px-3.5 text-center">ห้องว่าง</th>
                        <th className="py-3 px-3.5 text-right">ราคาเริ่มต้น</th>
                        <th className="py-3 px-3.5">สัตว์เลี้ยง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {filteredHotels.map((hotel) => (
                        <tr
                          key={hotel.id}
                          onClick={() => setSelectedHotelModal(hotel)}
                          className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-3.5 font-bold text-[#5B20A8]">#{hotel.rank}</td>
                          <td className="py-2.5 px-3.5 font-bold text-[#261042]">{hotel.name}</td>
                          <td className="py-2.5 px-3.5 text-center">{hotel.distanceKm} กม.</td>
                          <td className="py-2.5 px-3.5 text-center">{hotel.availableRooms || '-'}</td>
                          <td className="py-2.5 px-3.5 text-right font-black text-[#5B20A8]">
                            {hotel.priceStart || `฿${hotel.priceMin.toLocaleString()}`}
                          </td>
                          <td className="py-2.5 px-3.5 text-[11px] text-slate-600 truncate max-w-[180px]">
                            {hotel.petPolicy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'map' && (
              <div className="bg-white border border-purple-100 rounded-2xl overflow-hidden p-2 min-h-[420px]">
                <React.Suspense fallback={<div className="min-h-[400px]" aria-busy="true" />}>
                  <HotelMap compact={true} />
                </React.Suspense>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* HOTEL DETAIL MODAL                                           */}
      {/* ============================================================ */}
      {selectedHotelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedHotelModal(null)}
        >
          <div
            className="bg-white text-[#1E1B26] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-purple-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedHotelModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-full h-40 sm:h-44 rounded-2xl overflow-hidden mb-4 border border-purple-100 bg-purple-50">
              <img loading="lazy" decoding="async"
                src={getHotelImage(selectedHotelModal)}
                alt={selectedHotelModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="text-xs font-bold text-white bg-emerald-600 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <PawPrint className="w-3 h-3" />
                  <span>Pet Friendly</span>
                </span>
              </div>
              <span className="absolute bottom-3 right-3 rounded-md bg-black/55 text-white text-[11px] font-semibold px-2 py-0.5">
                ภาพประกอบ
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-[#261042] mb-1">
              {selectedHotelModal.name}
            </h3>

            <div className="my-3 p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">สถานะห้องว่าง:</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                {selectedHotelModal.availableRooms || 'สอบถามที่พัก'}
              </span>
            </div>

            <div className="mb-3.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs">
              <div className="font-bold text-[#8A5A00] mb-1 flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5" />
                <span>นโยบายสัตว์เลี้ยง (Pet Policy):</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedHotelModal.petPolicy}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 mb-4 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  {selectedHotelModal.address || `${selectedHotelModal.name} ชะอำ - หัวหิน`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  ระยะห่างจากงาน:{' '}
                  <strong className="text-[#261042]">{selectedHotelModal.distanceKm} กม.</strong>
                </span>
              </div>
              {selectedHotelModal.phone && selectedHotelModal.phone !== '-' && (
                <div className="flex items-center justify-between bg-purple-50/60 p-2.5 rounded-xl border border-purple-100 mt-1">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <Phone className="w-3.5 h-3.5 text-[#5B20A8]" />
                    <span>เบอร์โทร: {selectedHotelModal.phone}</span>
                  </div>
                  <button
                    onClick={(e) => copyPhoneNumber(selectedHotelModal.phone, e)}
                    className="text-[11px] font-bold text-[#5B20A8] bg-white hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                  >
                    {copiedPhone === selectedHotelModal.phone ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={getGoogleMapsUrl(
                  selectedHotelModal.googleMaps || selectedHotelModal.name,
                  selectedHotelModal.latitude,
                  selectedHotelModal.longitude
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-purple-50 text-[#5B20A8] border border-purple-200 text-xs sm:text-sm font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-4 h-4 text-[#5B20A8]" />
                <span>นำทาง Google Maps</span>
              </a>

              {selectedHotelModal.phone && selectedHotelModal.phone !== '-' ? (
                <a
                  href={`tel:${selectedHotelModal.phone.split('/')[0].trim()}`}
                  className="bg-[#5B20A8] hover:bg-[#471587] text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>โทรสอบถาม</span>
                </a>
              ) : (
                <button
                  onClick={() => setSelectedHotelModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
