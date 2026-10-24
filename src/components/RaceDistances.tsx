import React from 'react';
import { RouteId } from '../types';
import { MerchShowcase } from './MerchShowcase';
import { TicketSection } from './TicketSection';

interface RaceDistancesProps {
  selectedRoute: RouteId;
  onSelectRoute: (id: RouteId) => void;
  onScrollToMap: () => void;
  onOpenRegister: (id?: RouteId, extras?: { people: number; dogs: number }) => void;
  onOpenComparisonModal?: () => void;
  onOpenPaceModal?: () => void;
}

export const RaceDistances: React.FC<RaceDistancesProps> = ({
  selectedRoute,
  onSelectRoute,
  onScrollToMap,
  onOpenRegister,
  onOpenComparisonModal,
  onOpenPaceModal,
}) => {
  return (
    <section
      id="distances"
      className="py-10 sm:py-14 lg:py-16 bg-gradient-to-b from-white via-[#FBF8FF] to-[#EFE6FC] paw-bg relative overflow-hidden"
    >
      {/* Soft colour blobs */}
      <div className="absolute -top-16 -left-20 w-72 h-72 bg-[#FFC928]/25 blob pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 bg-[#8ED8F8]/30 blob pointer-events-none" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <TicketSection
          selectedRoute={selectedRoute}
          onSelectRoute={onSelectRoute}
          onOpenRegister={onOpenRegister}
          onOpenComparisonModal={onOpenComparisonModal}
        />

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {onOpenComparisonModal && (
            <button
              type="button"
              onClick={onOpenComparisonModal}
              className="btn-paw bg-white px-5 py-2.5 text-sm"
            >
              เปรียบเทียบระยะทาง
            </button>
          )}
          {onOpenPaceModal && (
            <button
              type="button"
              onClick={onOpenPaceModal}
              className="btn-paw bg-white px-5 py-2.5 text-sm"
            >
              คำนวณเพซและเวลา
            </button>
          )}
          <button
            type="button"
            onClick={onScrollToMap}
            className="btn-paw bg-white px-5 py-2.5 text-sm"
          >
            ดูแผนที่เส้นทาง & จำลองการวิ่ง
          </button>
        </div>

        {/* Unified Showcase: เสื้อวิ่ง, เหรียญรางวัล Finisher & สิทธิประโยชน์ Race Pack */}
        <div id="merch-showcase" className="mt-10 sm:mt-14 scroll-mt-24">
          <MerchShowcase onOpenRegister={() => onOpenRegister(selectedRoute)} />
        </div>
      </div>
    </section>
  );
};
