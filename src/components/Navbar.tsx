import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, User, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenArtworkModal: () => void;
  onOpenRegisterModal: () => void;
  onOpenRunnerCenter?: () => void;
  onOpenAdminModal?: () => void;
  onEasterEggTrigger?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRegisterModal,
  onOpenRunnerCenter,
  onOpenAdminModal,
  onEasterEggTrigger,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState('#hero');
  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 3) {
      if (onEasterEggTrigger) onEasterEggTrigger();
      setLogoClicks(0);
    }
  };

  const navLinks = [
    { label: 'เกี่ยวกับงาน', href: '#objective' },
    { label: 'ระยะ & ราคา', href: '#distances' },
    { label: 'กิจกรรมเสริม', href: '#addons' },
    { label: 'กำหนดการ & เส้นทาง', href: '#schedule-and-map' },
    { label: 'ที่พัก', href: '#hotels' },
    { label: 'ผู้สนับสนุน', href: '#sponsors' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#311256]/95 backdrop-blur-md shadow-lg border-b border-white/10 py-2'
          : 'bg-gradient-to-r from-[#2D1052] via-[#3B1768] to-[#2D1052] border-b border-white/10 py-2.5'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* Zone 1: Brand Identity Logo */}
          <a
            href="#hero"
            onClick={() => {
              setActiveHref('#hero');
              handleLogoClick();
            }}
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 select-none shrink-0"
            title="CHANGSUEK RUN 2027 - เห็นช้างวิ่ง วิ่งตามช้าง"
          >
            <img
              src="/images/brand/changsuek-run-logo.webp"
              alt="CHANGSUEK RUN"
              className="h-10 sm:h-11 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </a>

          {/* Zone 2: Navigation Links matching mockup */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navLinks.map((link) => {
              const isActive = activeHref === link.href && link.label === 'หน้าแรก';
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setActiveHref(link.href)}
                  className={`text-xs xl:text-[13px] font-bold px-3 py-1.5 transition-all whitespace-nowrap rounded-full ${
                    isActive
                      ? 'text-white font-extrabold bg-white/15 border border-white/25 shadow-2xs'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Language Switch + Login/Runner Center + Yellow Register CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">

            {/* เข้าสู่ระบบ / Runner Center Button matching mockup */}
            {onOpenRunnerCenter && (
              <button
                type="button"
                onClick={onOpenRunnerCenter}
                className="hidden md:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full border border-white/45 backdrop-blur-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5 text-white" />
                <span>ศูนย์นักวิ่ง</span>
              </button>
            )}

            {/* ระบบแอดมิน (Admin Console: เช็กตั๋ว & เลข BIB) */}
            {onOpenAdminModal && (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="hidden sm:inline-flex items-center gap-1.5 bg-[#180B30]/90 hover:bg-[#180B30] text-[#FFC928] text-xs sm:text-[13px] font-extrabold px-3.5 py-1.5 rounded-full border border-[#FFC928]/60 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>แอดมิน (ตั๋ว & BIB)</span>
              </button>
            )}

            {/* Bright Yellow "สมัครวิ่ง" Pill Button */}
            <button
              type="button"
              onClick={onOpenRegisterModal}
              className="bg-[#FFC928] hover:bg-[#FFD645] text-[#1F1035] text-xs sm:text-[13px] font-extrabold px-5 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
            >
              สมัครวิ่ง
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-white/85 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="เมนูหลัก"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#311256] border-b border-white/10 px-4 pt-3 pb-6 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-1.5">
            {onOpenRunnerCenter && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRunnerCenter();
                }}
                className="px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between bg-white/10 text-white border border-white/25 mb-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FFC928]" />
                  <span>เข้าสู่ระบบ / ศูนย์นักวิ่ง (Digital BIB)</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            )}

            {onOpenAdminModal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminModal();
                }}
                className="px-3.5 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-between bg-[#180B30] text-[#FFC928] border border-[#FFC928]/50 mb-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FFC928]" />
                  <span>ระบบแอดมิน (เช็กยอดตั๋ว & เลข BIB ทั้งหมด)</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            )}

            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => {
                  setActiveHref(link.href);
                  setMobileMenuOpen(false);
                }}
                className="px-3.5 py-2 rounded-xl text-sm font-bold flex items-center justify-between text-white/85 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </a>
            ))}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRegisterModal();
              }}
              className="mt-3 w-full bg-[#FFC928] hover:bg-[#FFD645] text-[#1F1035] font-extrabold text-sm py-2.5 rounded-full shadow-md text-center cursor-pointer"
            >
              สมัครวิ่งตอนนี้
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
