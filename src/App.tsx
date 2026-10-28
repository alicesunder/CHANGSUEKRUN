/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { RouteId } from './types';
import { ScrollFX } from './components/ScrollFX';
import { CustomCursor } from './components/CustomCursor';
import { EasterEggElephant } from './components/EasterEggElephant';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { EventObjectiveSection } from './components/EventObjectiveSection';
import { AddOnActivities } from './components/AddOnActivities';
import { ConcertPassCard } from './components/ConcertPassCard';
import { CostumeContestSection } from './components/CostumeContestSection';
import { WinnersSection } from './components/WinnersSection';
import { EMPTY_ADD_ONS, hasAddOns, type AddOnSelection } from './data/addOns';
import { RaceDistances } from './components/RaceDistances';
import { SponsorsSection } from './components/SponsorsSection';
import { PrivacyNotice } from './components/PrivacyNotice';
import { TermsSection, TermsModal } from './components/TermsSection';
import { LazySection } from './components/LazySection';
import { ConcertSection } from './components/ConcertSection';
import { HotelExplorer } from './components/HotelExplorer';
import { LeaderboardSection } from './components/LeaderboardSection';
import { EventWeatherForecast } from './components/EventWeatherForecast';
import { EssentialRunnerChecklist } from './components/EssentialRunnerChecklist';
import { FAQSection } from './components/FAQSection';
import { EventCtaBanner } from './components/EventCtaBanner';
import { Footer } from './components/Footer';

// Pop-ups are loaded only when first opened (keeps the first page load small).
const AdminDashboardModal = lazy(() => import('./components/AdminDashboardModal').then((m) => ({ default: m.AdminDashboardModal })));
const RunnerCenter = lazy(() => import('./components/RunnerCenter').then((m) => ({ default: m.RunnerCenter })));
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
  const [registerMode, setRegisterMode] = useState<'RUN' | 'CONCERT'>('RUN');
  const [registerAddOns, setRegisterAddOns] = useState<AddOnSelection | undefined>(undefined);
  // Activities chosen in the block under the ticket cards; every "register" button carries them into the form
  const [pageAddOns, setPageAddOns] = useState<AddOnSelection>({ ...EMPTY_ADD_ONS });
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [paceModalOpen, setPaceModalOpen] = useState(false);
  const [runnerCenterOpen, setRunnerCenterOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [easterEggActive, setEasterEggActive] = useState(false);

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

  const handleSelectDistance = (distance: RouteId) => {
    setSelectedRoute(distance);
    const elem = document.getElementById('distances');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToRouteMap = () => {
    document.getElementById('schedule-and-map')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToMap = scrollToRouteMap;

  const handleOpenRegister = (distance?: RouteId, extras?: { people: number; dogs: number }, addOns?: AddOnSelection) => {
    setRegisterMode('RUN');
    setRegisterExtras(extras ?? { people: 0, dogs: 0 });
    setRegisterAddOns(addOns ?? (hasAddOns(pageAddOns) ? pageAddOns : undefined));
    if (distance) {
      setRegisterTargetRoute(distance);
    } else {
      setRegisterTargetRoute(selectedRoute);
    }
    setRegisterModalOpen(true);
  };

  // Concert-only pass (no run), optionally with the activities chosen on the page
  const handleOpenConcert = () => {
    setRegisterMode('CONCERT');
    setRegisterExtras({ people: 0, dogs: 0 });
    setRegisterAddOns(hasAddOns(pageAddOns) ? pageAddOns : undefined);
    setRegisterModalOpen(true);
  };

  // The old Leaflet simulator is gone: just show the route on the illustrated map
  const handleOpenSimulation = (routeId?: RouteId) => {
    setSelectedRoute(routeId || selectedRoute || '3km');
    scrollToRouteMap();
  };

  return (
    <div className="min-h-screen bg-[#FAF7FF] text-[#17151C] font-sans antialiased selection:bg-[#FFCC00] selection:text-[#17151C] relative overflow-x-hidden pb-16 lg:pb-0">
      {/* 1. Desktop Custom Cursor & Scroll Progress */}
      <CustomCursor />
      <ScrollFX />

      {/* 2. Easter Egg Elephant */}
      <EasterEggElephant
        isActive={easterEggActive}
        onClose={() => setEasterEggActive(false)}
      />

      {/* 3. Top Dark-Purple Navbar matching mockup */}
      <Navbar
        onOpenArtworkModal={() => setArtworkModalOpen(true)}
        onOpenRegisterModal={() => handleOpenRegister()}
        onOpenRunnerCenter={() => setRunnerCenterOpen(true)}
        onEasterEggTrigger={() => setEasterEggActive(true)}
      />

      {/* Main Content Flow */}
      <main>
        {/* 4. Hero + Curved Countdown & Quote Banner + 9 Quick-Navigation Icon Cards */}
        <Hero
          onOpenArtworkModal={() => setArtworkModalOpen(true)}
          onOpenRegisterModal={() => handleOpenRegister()}
          onSelectDistance={handleSelectDistance}
        />

        {/* 5. เลือกบัตรวิ่งของคุณ (Preserved 3D Collectible Tickets + Price Calculator + Unified Race Pack & Merch) */}
        <RaceDistances
          selectedRoute={selectedRoute}
          onSelectRoute={setSelectedRoute}
          onScrollToMap={handleScrollToMap}
          onOpenRegister={handleOpenRegister}
          onOpenComparisonModal={() => setComparisonModalOpen(true)}
          onOpenPaceModal={() => setPaceModalOpen(true)}
          afterTickets={
            <>
              <ConcertPassCard onBuy={handleOpenConcert} />
              <AddOnActivities
                selectedRoute={selectedRoute}
                value={pageAddOns}
                onChange={setPageAddOns}
                onOpenRegister={() => handleOpenRegister(selectedRoute)}
                onOpenConcert={handleOpenConcert}
              />
            </>
          }
          beforeMerch={<CostumeContestSection />}
        />

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
            <summary className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 min-h-[56px] flex items-center justify-between gap-3 cursor-pointer list-none text-base font-extrabold text-[#2A1450]">
              <span>🌤️ สภาพอากาศ & เช็กลิสต์เตรียมตัวก่อนวิ่ง</span>
              <span className="text-sm text-[#5B20A8] group-open:hidden">ดูเพิ่ม ▾</span>
              <span className="text-sm text-[#5B20A8] hidden group-open:inline">ซ่อน ▴</span>
            </summary>
            <div className="pb-10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
              <div>
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border-2 border-[#2A1450] text-[#5B20A8] text-xs font-extrabold uppercase tracking-wider shadow-[0_3px_0_#2A1450] mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>WEATHER & RUNNER READINESS</span>
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2A1450] tracking-tight">
                  สภาพอากาศชายหาด & เช็กลิสต์เตรียมความพร้อม
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#4B2D78]">
                ตรวจเช็กอุณหภูมิริมหาดชะอำและอุปกรณ์สำคัญก่อนออกสตาร์ท
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

        {/* 4.5 วัตถุประสงค์ของการจัดงาน (Official Event Objective & Mission) */}
        <EventObjectiveSection />


        {/* 12. คำถามที่พบบ่อย (FAQ) */}
        <WinnersSection />

        <FAQSection />

        {/* 9. ผู้สนับสนุนงาน (Sponsor board) */}
        <SponsorsSection />


        {RESULTS_OPEN && <LeaderboardSection />}

        {/* 13. CTA Banner */}
        <EventCtaBanner onOpenRegisterModal={() => handleOpenRegister()} />

        {/* ข้อกำหนดและเงื่อนไข — compact, collapsed by default */}
        <TermsSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenArtworkModal={() => setArtworkModalOpen(true)}
        onOpenRegisterModal={() => handleOpenRegister()}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onOpenRegisterModal={() => handleOpenRegister()}
        onOpenRunnerCenter={() => setRunnerCenterOpen(true)}
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

      <Deferred open={runnerCenterOpen}>
        <RunnerCenter
          isOpen={runnerCenterOpen}
          onClose={() => setRunnerCenterOpen(false)}
          onOpenRegisterModal={() => {
            setRunnerCenterOpen(false);
            handleOpenRegister();
          }}
          onOpenSimulation={(routeId) => {
            setRunnerCenterOpen(false);
            handleOpenSimulation(routeId);
          }}
          onSelectRoute={setSelectedRoute}
        />
      </Deferred>

      <Deferred open={registerModalOpen}>
        <RegistrationModal
          isOpen={registerModalOpen}
          initialRoute={registerTargetRoute}
          initialExtraPeople={registerExtras.people}
          initialExtraDogs={registerExtras.dogs}
          initialAddOns={registerAddOns}
          initialMode={registerMode}
          onClose={() => setRegisterModalOpen(false)}
          onRegistrationSuccess={() => {
            setRegisterModalOpen(false);
            setRunnerCenterOpen(true);
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
            setRunnerCenterOpen(true);
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
