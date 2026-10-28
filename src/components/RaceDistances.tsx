import React from 'react';
import { RouteId } from '../types';
import { MerchShowcase } from './MerchShowcase';

interface RaceDistancesProps {
  selectedRoute: RouteId;
  onSelectRoute: (id: RouteId) => void;
  onScrollToMap: () => void;
  onOpenRegister: (id?: RouteId, extras?: { people: number; dogs: number }) => void;
  onOpenComparisonModal?: () => void;
  onOpenPaceModal?: () => void;
  /** The ticket shop (run / concert / activities) */
  afterTickets?: React.ReactNode;
  /** Rendered just above the souvenirs (merch) block */
  beforeMerch?: React.ReactNode;
}

export const RaceDistances: React.FC<RaceDistancesProps> = ({
  selectedRoute,
  onSelectRoute,
  onScrollToMap,
  onOpenRegister,
  onOpenComparisonModal,
  onOpenPaceModal,
  afterTickets,
  beforeMerch,
}) => {
  return (
    <section
      id="distances"
      className="py-10 sm:py-14 lg:py-16 bg-gradient-to-b from-white via-[#FBF8FF] to-[#EFE6FC] paw-bg relative overflow-x-clip"
    >
      {/* Soft colour blobs */}
      <div className="absolute -top-16 -left-20 w-72 h-72 bg-[#FFC928]/25 blob pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 bg-[#8ED8F8]/30 blob pointer-events-none" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {afterTickets}

        {beforeMerch}

        {/* Unified Showcase: เสื้อวิ่ง, เหรียญรางวัล Finisher & สิทธิประโยชน์ Race Pack */}
        <div id="merch-showcase" className="mt-10 sm:mt-14 scroll-mt-24">
          <MerchShowcase onOpenRegister={() => document.getElementById('shop-run')?.scrollIntoView({ behavior: 'smooth' })} />
        </div>
      </div>
    </section>
  );
};
