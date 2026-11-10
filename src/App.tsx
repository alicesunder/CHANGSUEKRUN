/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDogCategory } from './data/eventData';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { RouteId } from './types';
import { ScrollFX } from './components/ScrollFX';
import { PlayfulFX } from './components/PlayfulFX';
import { PeekingPup } from './components/PeekingPup';
import { FunRibbon } from './components/FunRibbon';
import { ActivityStickerLayer } from './components/ActivitySticker';
import { IntroSplash } from './components/IntroSplash';
import { TestModeBanner } from './components/TestModeBanner';
import { CustomCursor } from './components/CustomCursor';
import { EasterEggElephant } from './components/EasterEggElephant';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { EventObjectiveSection } from './components/EventObjectiveSection';
import { TicketShop } from './components/TicketShop';
import { DogContestSection } from './components/DogContestSection';
import { DogHealthCheckSection } from './components/DogHealthCheckSection';
import { WinnersSection } from './components/WinnersSection';
import { RunnerAwardsSection } from './components/RunnerAwardsSection';
import { EMPTY_ADD_ONS, hasAddOns, type AddOnSelection } from './data/addOns';
import { RaceDistances } from './components/RaceDistances';
import { SponsorsSection } from './components/SponsorsSection';
import { PrivacyNotice, openPrivacyNotice } from './components/PrivacyNotice';
import { TermsSection, TermsModal, openTerms } from './components/TermsSection';
import { LazySection } from './components/LazySection';
import { ConcertSection } from './components/ConcertSection';
import { HotelExplorer } from './components/HotelExplorer';
import { LeaderboardSection } from './components/LeaderboardSection';
import { EventWeatherForecast } from './components/EventWeatherForecast';
import { EssentialRunnerChecklist } from './components/EssentialRunnerChecklist';
import { FAQSection } from './components/FAQSection';
import { FollowFacebook } from './components/FollowFacebook';
import { EventCtaBanner } from './components/EventCtaBanner';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { useLang } from './i18n/lang';
import { authApi, consumeEmailLink, consumeLineLogin, useSession, type Session } from './utils/runnerAuth';
import type { BuyKind } from './components/RunnerHub';

// Pop-ups are loaded only when first opened (keeps the first page load small).
const AdminDashboardModal = lazy(() => import('./components/AdminDashboardModal').then((m) => ({ default: m.AdminDashboardModal })));
const RunnerHub = lazy(() => import('./components/RunnerHub').then((m) => ({ default: m.RunnerHub })));
const StaffConsole = lazy(() => import('./components/StaffConsole').then((m) => ({ default: m.StaffConsole })));
const RegistrationModal = lazy(() => import('./components/RegistrationModal').then((m) => ({ default: m.RegistrationModal })));
const ArtworkViewerModal = lazy(() => import('./components/ArtworkViewerModal').then((m) => ({ default: m.ArtworkViewerModal })));
const DistanceComparisonModal = lazy(() => import('./components/DistanceComparisonModal').then((m) => ({ default: m.DistanceComparisonModal })));
const VideoTeaserModal = lazy(() => import('./components/VideoTeaserModal').then((m) => ({ default: m.VideoTeaserModal })));
const PaceCalculatorModal = lazy(() => import('./components/PaceCalculatorModal').then((m) => ({ default: m.PaceCalculatorModal })));
const RouteAndScheduleSection = lazy(() =>
  import('./components/RouteAndScheduleSection').then((m) => ({ default: m.RouteAndScheduleSection }))
);

// Results block stays hidden until race day has passed (9 Jan 2027)
const RESULTS_OPEN = Date.now() >= new Date('2027-01-09T00:00:00+07:00').getTime();

/** Mounts its (lazy) child once `open` first becomes true, then keeps it mounted so close animations still run. */
function Deferred({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [seen, setSeen] = useState(open);
  useEffect(() => {
    if (open) setSeen(true);
  }, [open]);
  if (!seen && !open) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}

export default function App() {
  const [selectedRoute, setSelectedRoute] = useState<RouteId>('5km');
  const [artworkModalOpen, setArtworkModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerTargetRoute, setRegisterTargetRoute] = useState<RouteId>('5km');
  const [registerExtras, setRegisterExtras] = useState({ people: 0, dogs: 0 });
  const [registerMode, setRegisterMode] = useState<'RUN' | 'CONCERT' | 'ADDON'>('RUN');
  const [registerConcert, setRegisterConcert] = useState(false);
  const [registerAddOns, setRegisterAddOns] = useState<AddOnSelection | undefined>(undefined);
  // Activities chosen in the block under the ticket cards; every "register" button carries them into the form
  const [pageAddOns, setPageAddOns] = useState<AddOnSelection>({ ...EMPTY_ADD_ONS });
  // Ticket shop basket: run distance (or none) and concert tickets
  const [shopRun, setShopRun] = useState<RouteId | null>(null);
  const [shopConcertQty, setShopConcertQty] = useState(0);
  const [shopVipTables, setShopVipTables] = useState(0);
  const [shopExtraPeople, setShopExtraPeople] = useState(0);
  const [registerConcertQty, setRegisterConcertQty] = useState(1);
  const [registerVipTables, setRegisterVipTables] = useState(0);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [paceModalOpen, setPaceModalOpen] = useState(false);
  const [runnerCenterOpen, setRunnerCenterOpen] = useState(false);
  // Runner / staff login: buying and the Runner Center need an account (staff get only the ticket scanner)
  const session = useSession();
  const { t } = useLang();
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<'checkout' | 'center'>('center');
  const pendingAfterLogin = React.useRef<(() => void) | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);
  const [lineFailed, setLineFailed] = useState(false);
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);
  const [mailNote, setMailNote] = useState<string | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [easterEggActive, setEasterEggActive] = useState(false);

  // Count this visit (anonymous random id kept in this browser; the admin sees the totals). Skipped for /#admin.
  useEffect(() => {
    if (window.location.hash === '#admin' || navigator.webdriver) return;
    let vid = '';
    try {
      vid = localStorage.getItem('csr_vid') || '';
      if (!/^[A-Za-z0-9-]{8,64}$/.test(vid)) {
        vid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('csr_vid', vid);
      }
    } catch {
      vid = `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vid }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  // Admin is not linked anywhere public: open it with /#admin
  useEffect(() => {
    const check = () => {
      if (window.location.hash === '#admin') {
        setAdminModalOpen(true);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  // Public addresses for the privacy notice and the terms (asked for by Google / Facebook sign-in setup): /privacy and /terms
  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path !== '/privacy' && path !== '/terms') return;
    const t = window.setTimeout(() => (path === '/privacy' ? openPrivacyNotice() : openTerms()), 700);
    return () => window.clearTimeout(t);
  }, []);

  // Back from LINE Login (the server redirects to /#runner-auth=...), and refresh the account details at start-up
  useEffect(() => {
    consumeLineLogin().then((r) => {
      if (r === 'ok') setRunnerCenterOpen(true);
      else if (r === 'error') setLineFailed(true);
    });
    authApi.refresh();
    // links from our e-mails: set a new password / confirm the e-mail address
    consumeEmailLink().then((r) => {
      if (!r) return;
      if (r.kind === 'reset') {
        setResetToken(r.token);
        setAuthOpen(true);
      } else {
        setMailNote(r.ok ? 'ยืนยันอีเมลเรียบร้อยแล้ว ✓ / E-mail confirmed ✓' : r.message || 'ลิงก์ยืนยันไม่ถูกต้อง');
      }
    });
  }, []);

  /** Runs `action` once a runner is logged in (asks to log in first). */
  const requireRunner = (action: () => void, reason: 'checkout' | 'center' = 'checkout') => {
    if (session?.role === 'runner') {
      action();
      return;
    }
    if (session?.role === 'staff') {
      setStaffOpen(true);
      return;
    }
    pendingAfterLogin.current = action;
    setAuthReason(reason);
    setAuthOpen(true);
  };

  const handleAuthed = (s: Session) => {
    setAuthOpen(false);
    if (s.role === 'staff') {
      pendingAfterLogin.current = null;
      setStaffOpen(true);
      return;
    }
    const next = pendingAfterLogin.current;
    pendingAfterLogin.current = null;
    if (next) next();
    else setRunnerCenterOpen(true);
  };

  const openRunnerCenter = () => requireRunner(() => setRunnerCenterOpen(true), 'center');

  const handleSelectDistance = (distance: RouteId) => {
    setSelectedRoute(distance);
    setShopRun(distance);
    const elem = document.getElementById('distances');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToRouteMap = () => {
    document.getElementById('schedule-and-map')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToMap = scrollToRouteMap;

  // Every "buy" button leads to the ticket shop, so tickets are always chosen in one place
  const goToShop = () => {
    document.getElementById('distances')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenRegister = (distance?: RouteId, extras?: { people: number; dogs: number }, addOns?: AddOnSelection) =>
    requireRunner(() => openRegisterNow(distance, extras, addOns));

  const openRegisterNow = (distance?: RouteId, extras?: { people: number; dogs: number }, addOns?: AddOnSelection) => {
    setRegisterMode('RUN');
    setRegisterConcert(false);
    setRegisterConcertQty(1);
    setRegisterVipTables(0);
    setRegisterExtras(extras ?? { people: 0, dogs: 0 });
    setRegisterAddOns(addOns ?? (hasAddOns(pageAddOns) ? pageAddOns : undefined));
    if (distance) {
      setRegisterTargetRoute(distance);
    } else {
      setRegisterTargetRoute(selectedRoute);
    }
    setRegisterModalOpen(true);
  };

  // Checkout from the ticket shop: open the form with exactly what is in the basket
  const handleShopCheckout = () => requireRunner(shopCheckoutNow);

  // From the Runner Center "buy more": open the form for that kind of ticket
  const handleHubBuy = (kind: BuyKind, preset?: AddOnSelection) => {
    setRunnerCenterOpen(false);
    if (kind === 'RUN') {
      goToShop();
      return;
    }
    setRegisterConcert(kind === 'CONCERT');
    setRegisterConcertQty(1);
    setRegisterVipTables(0);
    setRegisterExtras({ people: 0, dogs: 0 });
    setRegisterAddOns(preset);
    setRegisterMode(kind);
    setRegisterModalOpen(true);
  };

  const shopCheckoutNow = () => {
    const addOnsPicked = hasAddOns(pageAddOns);
    const shopConcert = shopConcertQty > 0 || shopVipTables > 0;
    if (!shopRun && !shopConcert && !addOnsPicked) return;
    setRegisterMode(shopRun ? 'RUN' : shopConcert ? 'CONCERT' : 'ADDON');
    setRegisterConcert(shopConcert);
    setRegisterConcertQty(shopVipTables > 0 ? shopConcertQty : Math.max(1, shopConcertQty));
    setRegisterVipTables(shopVipTables);
    setRegisterTargetRoute(shopRun ?? selectedRoute);
    if (shopRun) setSelectedRoute(shopRun);
    setRegisterExtras({ people: shopRun && isDogCategory(shopRun) ? shopExtraPeople : 0, dogs: 0 });
    setRegisterAddOns(addOnsPicked ? pageAddOns : undefined);
    setRegisterModalOpen(true);
  };

  // The old Leaflet simulator is gone: just show the route on the illustrated map
  const handleOpenSimulation = (routeId?: RouteId) => {
    setSelectedRoute(routeId || selectedRoute || '3km');
    scrollToRouteMap();
  };

  return (
    <div className="min-h-screen bg-[#FAF7FF] text-[#17151C] font-sans antialiased selection:bg-[#FFCC00] selection:text-[#17151C] relative overflow-x-clip pb-16 lg:pb-0">
      {/* 1. Desktop Custom Cursor & Scroll Progress */}
      <CustomCursor />
      <ScrollFX />
      <PlayfulFX />
      <PeekingPup />
      <ActivityStickerLayer />
      <IntroSplash />
      <TestModeBanner />

      {/* 2. Easter Egg Elephant */}
      <EasterEggElephant
        isActive={easterEggActive}
        onClose={() => setEasterEggActive(false)}
      />

      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[10000] focus:rounded-lg focus:bg-[#FFC928] focus:px-4 focus:py-2 focus:text-sm focus:font-extrabold focus:text-[#2A1450]">
        ข้ามไปเนื้อหาหลัก
      </a>
      {/* 3. Top Dark-Purple Navbar matching mockup */}
      <Navbar
        onOpenArtworkModal={() => setArtworkModalOpen(true)}
        onOpenRegisterModal={goToShop}
        onOpenRunnerCenter={openRunnerCenter}
        onEasterEggTrigger={() => setEasterEggActive(true)}
      />

      {/* Main Content Flow */}
      <main id="main">
        {/* 4. Hero + Curved Countdown & Quote Banner + 9 Quick-Navigation Icon Cards */}
        <Hero
          onOpenArtworkModal={() => setArtworkModalOpen(true)}
          onOpenRegisterModal={goToShop}
          onSelectDistance={handleSelectDistance}
        />

        <FunRibbon />

        {/* 5. เลือกบัตรวิ่งของคุณ (Preserved 3D Collectible Tickets + Price Calculator + Unified Race Pack & Merch) */}
        <RaceDistances
          selectedRoute={selectedRoute}
          onSelectRoute={setSelectedRoute}
          onScrollToMap={handleScrollToMap}
          onOpenRegister={handleOpenRegister}
          onOpenComparisonModal={() => setComparisonModalOpen(true)}
          onOpenPaceModal={() => setPaceModalOpen(true)}
          afterTickets={
            <TicketShop
              run={shopRun}
              onRunChange={(r) => {
                setShopRun(r);
                if (r) setSelectedRoute(r);
              }}
              concertQty={shopConcertQty}
              onConcertQtyChange={setShopConcertQty}
              vipTables={shopVipTables}
              onVipTablesChange={setShopVipTables}
              extraPeople={shopExtraPeople}
              onExtraPeopleChange={setShopExtraPeople}
              addOns={pageAddOns}
              onAddOnsChange={setPageAddOns}
              onCheckout={handleShopCheckout}
              onOpenComparison={() => setComparisonModalOpen(true)}
              onOpenPace={() => setPaceModalOpen(true)}
              onShowMap={handleScrollToMap}
            />
          }
          beforeMerch={
            <>
              <RunnerAwardsSection />
              <DogHealthCheckSection />
              <DogContestSection />
            </>
          }
        />

        {/* วัตถุประสงค์ของการจัดงาน (การกุศล): ย้ายขึ้นมาไว้ใกล้ตั๋ว เพื่อสร้างความน่าเชื่อถือก่อนตัดสินใจ */}
        <EventObjectiveSection />

        {/* 6. 2-Column Side-by-Side: กำหนดการวันแข่งขัน (Left) & เส้นทางวิ่ง GPS Survey (Right) */}
        <LazySection id="schedule-and-map" minHeight={1100}>
          <RouteAndScheduleSection
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
            onOpenArtworkModal={() => setArtworkModalOpen(true)}
            onOpenSimulation={handleOpenSimulation}
          />
        </LazySection>

        <ConcertSection />

        {/* 7. Dark Purple Featured Hotels Strip: ที่พักใกล้สนาม วิ่งสบาย พักสบาย */}
        <HotelExplorer />

        {/* 10. 2-Column Side-by-Side: พยากรณ์อากาศวันแข่ง & เช็กลิสต์เตรียมตัวนักวิ่ง */}
        <section
          id="runner-prep"
          className="bg-gradient-to-b from-[#EFE6FC] via-[#FAF7FF] to-[#E0F2FE]/60 relative overflow-hidden"
        >
          <details className="group">
            <summary className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="jelly ds-card flex items-center justify-between gap-3 min-h-[60px] px-4 sm:px-5 py-2.5">
                <span className="flex items-center gap-3 text-base font-extrabold text-[#2A1450]">
                  <span className="animate-bounce-gentle inline-block text-2xl" aria-hidden="true">🌤️</span>
                  <span>
                    สภาพอากาศ & เช็กลิสต์เตรียมตัวก่อนวิ่ง
                    <span className="block text-xs font-bold text-[#6B5A85]">อุณหภูมิริมหาด + ของที่ต้องพก (ทั้งคนและน้องหมา)</span>
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-[#FFC928] border-2 border-[#2A1450] px-3 py-1 text-xs font-extrabold text-[#2A1450]">
                  <span className="group-open:hidden">ดูเพิ่ม ▾</span>
                  <span className="hidden group-open:inline">ซ่อน ▴</span>
                </span>
              </span>
            </summary>
            <div className="pb-10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-7">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border-2 border-[#2A1450] text-[#5B20A8] text-xs font-extrabold uppercase tracking-wider shadow-[0_3px_0_#2A1450] mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>WEATHER & RUNNER READINESS</span>
                </span>
                {/* whole phrases per line: on tablets the heading used to break in the middle of a word */}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2A1450] tracking-tight leading-snug">
                  <span className="inline-block whitespace-nowrap">สภาพอากาศชายหาด</span>{' '}
                  <span className="inline-block whitespace-nowrap">&amp; เช็กลิสต์เตรียมความพร้อม</span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#4B2D78]">
                ตรวจเช็กอุณหภูมิริมหาดและอุปกรณ์สำคัญก่อนออกสตาร์ท
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-stretch">
              <div className="lg:col-span-6">
                <EventWeatherForecast />
              </div>
              <div className="lg:col-span-6">
                <EssentialRunnerChecklist />
              </div>
            </div>
          </div>
            </div>
          </details>
        </section>


        {/* 12. คำถามที่พบบ่อย (FAQ) */}
        <WinnersSection />

        <FollowFacebook />
        <FAQSection />

        {/* 9. ผู้สนับสนุนงาน (Sponsor board) */}
        <SponsorsSection />


        {RESULTS_OPEN && <LeaderboardSection />}

        {/* 13. CTA Banner */}
        <EventCtaBanner onOpenRegisterModal={goToShop} />

        {/* ข้อกำหนดและเงื่อนไข — compact, collapsed by default */}
        <TermsSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenArtworkModal={() => setArtworkModalOpen(true)}
        onOpenRegisterModal={goToShop}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onOpenRegisterModal={goToShop}
        onOpenRunnerCenter={openRunnerCenter}
        onOpenSimulation={() => handleOpenSimulation()}
      />

      {/* Modals & Dialogs */}
      <Deferred open={adminModalOpen}>
        <AdminDashboardModal
          isOpen={adminModalOpen}
          onClose={() => setAdminModalOpen(false)}
          onOpenRegisterModal={(routeId) => {
            setAdminModalOpen(false);
            handleOpenRegister(routeId);
          }}
        />
      </Deferred>

      <Deferred open={runnerCenterOpen && session?.role === 'runner'}>
        {session?.role === 'runner' && (
          <RunnerHub isOpen={runnerCenterOpen} session={session} onClose={() => setRunnerCenterOpen(false)} onBuy={handleHubBuy} />
        )}
      </Deferred>

      <Deferred open={staffOpen && session?.role === 'staff'}>
        {session?.role === 'staff' && <StaffConsole isOpen={staffOpen} session={session} onClose={() => setStaffOpen(false)} />}
      </Deferred>

      <AuthModal isOpen={authOpen} onClose={() => { setAuthOpen(false); setResetToken(undefined); }} onAuthed={(s) => { setResetToken(undefined); handleAuthed(s); }} reason={authReason} resetToken={resetToken} />

      {mailNote && (
        <div role="status" className="fixed left-1/2 top-20 z-[10200] -translate-x-1/2 ds-card px-4 py-3 text-sm font-extrabold text-[#2A1450]">
          {mailNote}
          <button type="button" onClick={() => setMailNote(null)} className="ml-3 rounded-lg bg-[#2A1450] px-2 py-0.5 text-xs text-white cursor-pointer">OK</button>
        </div>
      )}

      {lineFailed && (
        <div role="alert" className="fixed left-1/2 top-20 z-[10200] -translate-x-1/2 ds-card px-4 py-3 text-sm font-extrabold text-[#2A1450]">
          {t('เข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาลองใหม่หรือใช้อีเมล', 'LINE login failed — please try again or use e-mail')}
          <button type="button" onClick={() => setLineFailed(false)} className="ml-3 rounded-lg bg-[#2A1450] px-2 py-0.5 text-xs text-white cursor-pointer">OK</button>
        </div>
      )}

      <Deferred open={registerModalOpen}>
        <RegistrationModal
          isOpen={registerModalOpen}
          initialRoute={registerTargetRoute}
          initialExtraPeople={registerExtras.people}
          initialExtraDogs={registerExtras.dogs}
          initialAddOns={registerAddOns}
          initialMode={registerMode}
          initialConcert={registerConcert}
          initialConcertQty={registerConcertQty}
          initialVipTables={registerVipTables}
          onClose={() => setRegisterModalOpen(false)}
          onRegistrationSuccess={() => {
            setRegisterModalOpen(false);
            setRunnerCenterOpen(true);
          }}
          onNeedLogin={() => {
            setRegisterModalOpen(false);
            requireRunner(() => setRegisterModalOpen(true));
          }}
          onOpenAdminModal={() => {
            setRegisterModalOpen(false);
            setAdminModalOpen(true);
          }}
        />
      </Deferred>

      <Deferred open={artworkModalOpen}>
        <ArtworkViewerModal
          isOpen={artworkModalOpen}
          onClose={() => setArtworkModalOpen(false)}
          onOpenSimulation={(routeId) => {
            setArtworkModalOpen(false);
            handleOpenSimulation(routeId);
          }}
          onOpenRunnerCenter={() => {
            setArtworkModalOpen(false);
            openRunnerCenter();
          }}
        />
      </Deferred>

      <Deferred open={comparisonModalOpen}>
        <DistanceComparisonModal
          isOpen={comparisonModalOpen}
          onClose={() => setComparisonModalOpen(false)}
          onSelectRouteToRegister={(route: RouteId) => {
            setSelectedRoute(route);
            setComparisonModalOpen(false);
            handleOpenRegister(route);
          }}
        />
      </Deferred>

      <Deferred open={videoModalOpen}>
        <VideoTeaserModal
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          onOpenRegisterModal={() => {
            setVideoModalOpen(false);
            handleOpenRegister();
          }}
        />
      </Deferred>

      <Deferred open={paceModalOpen}>
        <PaceCalculatorModal
          isOpen={paceModalOpen}
          onClose={() => setPaceModalOpen(false)}
          onOpenRegisterModal={(route: RouteId) => {
            setPaceModalOpen(false);
            handleOpenRegister(route);
          }}
        />
      </Deferred>
      <PrivacyNotice />
      <TermsModal />
    </div>
  );
}
