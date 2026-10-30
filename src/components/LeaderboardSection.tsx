import React, { useState } from 'react';
import { Trophy, Flame, Users, Heart, Award, Footprints } from 'lucide-react';
import { motion } from 'motion/react';
import { RouteId } from '../types';

interface RunnerRecord {
  rank: number;
  name: string;
  bib: string;
  category: RouteId;
  time: string;
  pace: string;
  city: string;
  avatar: string;
  cheers: number;
  isPacer?: boolean;
}

interface CommunityTeam {
  rank: number;
  teamName: string;
  totalDistance: string;
  members: number;
  cheers: number;
  badge: string;
}

const LeaderboardResults: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'individual' | 'community'>('individual');
  const [distanceFilter, setDistanceFilter] = useState<'all' | '10km' | '5km' | '3km' | '1km'>('all');
  const [cheerCounts, setCheerCounts] = useState<{ [key: string]: number }>({});
  const [cheeredIds, setCheeredIds] = useState<{ [key: string]: boolean }>({});

  const runners: RunnerRecord[] = [
    {
      rank: 1,
      name: 'ชัชวาล วัฒนกุล (Chatchawal)',
      bib: 'C10-0142',
      category: '10km',
      time: '00:36:24',
      pace: '3:38 /km',
      city: 'เพชรบุรี',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      cheers: 342,
    },
    {
      rank: 2,
      name: 'พัชริดา แสนสุข (Patcharida)',
      bib: 'C10-0089',
      category: '10km',
      time: '00:38:10',
      pace: '3:49 /km',
      city: 'กรุงเทพฯ',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      cheers: 289,
    },
    {
      rank: 3,
      name: 'วรพล ธรรมศาสตร์ (Worapon)',
      bib: 'C05-0211',
      category: '5km',
      time: '00:17:45',
      pace: '3:33 /km',
      city: 'ประจวบคีรีขันธ์',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      cheers: 215,
    },
    {
      rank: 4,
      name: 'มนัสวี โชติกา (Manassavee)',
      bib: 'C05-0155',
      category: '5km',
      time: '00:19:12',
      pace: '3:50 /km',
      city: 'ชะอำ-หัวหิน',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      cheers: 178,
    },
    {
      rank: 5,
      name: 'ภานุเดช ฤทธิ์เดช & น้องสุนัขบัดดี้ (Buddy Pacer)',
      bib: 'C03-0004',
      category: '3km',
      time: '00:14:02',
      pace: '4:40 /km',
      city: 'เพชรบุรี',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      cheers: 450,
      isPacer: true,
    },
    {
      rank: 6,
      name: 'กานต์สินี สุริยะ (Kansinee)',
      bib: 'C10-0320',
      category: '10km',
      time: '00:41:05',
      pace: '4:06 /km',
      city: 'สมุทรสงคราม',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
      cheers: 134,
    },
  ];

  const communityTeams: CommunityTeam[] = [
    {
      rank: 1,
      teamName: 'ชมรมวิ่งช้างศึกเพชรบุรี (Changsuek Phetchaburi)',
      totalDistance: '1,420 KM',
      members: 128,
      cheers: 890,
      badge: '👑 สโมสรเจ้าภาพ',
    },
    {
      rank: 2,
      teamName: 'Cha-Am Beach Runners Club',
      totalDistance: '985 KM',
      members: 94,
      cheers: 642,
      badge: '🌊 เจ้าถิ่นริมหาด',
    },
    {
      rank: 3,
      teamName: 'เพื่อนสี่ขา พาวิ่ง (Dog & Runner Community)',
      totalDistance: '740 KM',
      members: 86,
      cheers: 1205,
      badge: '🐾 ขวัญใจมหาชน',
    },
    {
      rank: 4,
      teamName: 'Bangkok Weekend Striders',
      totalDistance: '620 KM',
      members: 52,
      cheers: 410,
      badge: '⚡ ทีมนักวิ่งกรุงเทพฯ',
    },
  ];

  const handleCheer = (id: string, initialCheers: number) => {
    if (cheeredIds[id]) return;
    setCheeredIds((prev) => ({ ...prev, [id]: true }));
    setCheerCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || initialCheers) + 1,
    }));
  };

  const filteredRunners = runners.filter((r) => {
    if (distanceFilter === 'all') return true;
    return r.category === distanceFilter;
  });

  return (
    <section
      id="leaderboard"
      className="py-12 sm:py-16 bg-gradient-to-b from-[#E0F2FE]/60 via-[#FAF7FF] to-[#FFF4D2]/50 relative overflow-hidden select-none scroll-mt-20"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-9">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border-2 border-[#2A1450] text-[#5B20A8] text-xs font-extrabold tracking-wider uppercase shadow-[0_3px_0_#2A1450] mb-3">
            <Trophy className="w-3.5 h-3.5 text-[#B45309]" />
            <span>CHANGSUEK COMMUNITY & LEADERBOARD</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2A1450] tracking-tight">
            ตารางเกียรติยศ & ชุมชนนักวิ่งช้างศึก
          </h2>
          <p className="text-xs sm:text-sm text-[#6B5A85] font-semibold mt-1.5">
            ร่วมส่งกำลังใจให้นักวิ่งแนวหน้าและชมรมวิ่งที่มาร่วมสร้างสถิติบนเส้นทางเลียบหาดชะอำ (ค่ายนเรศวร - ค่ายพระราม 6)
          </p>

          {/* Toggle Tab: รายบุคคล vs ชุมชน/ทีม */}
          <div className="inline-flex items-center p-1.5 bg-white rounded-2xl border-2 border-[#2A1450] shadow-[0_4px_0_#2A1450] mt-5">
            <button
              type="button"
              onClick={() => setActiveTab('individual')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === 'individual'
                  ? 'bg-[#2A1450] text-[#FFC928] shadow-xs'
                  : 'text-[#4B2D78] hover:text-[#2A1450]'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>อันดับนักวิ่งรายบุคคล</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === 'community'
                  ? 'bg-[#2A1450] text-[#FFC928] shadow-xs'
                  : 'text-[#4B2D78] hover:text-[#2A1450]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ชมรม & ชุมชนคนรักวิ่ง</span>
            </button>
          </div>
        </div>

        {/* TAB 1: INDIVIDUAL RUNNERS LEADERBOARD */}
        {activeTab === 'individual' && (
          <div>
            {/* Filter buttons by Distance */}
            <div className="flex items-center justify-center gap-2 mb-7 flex-wrap">
              {[
                { id: 'all', label: 'ทุกระยะ' },
                { id: '10km', label: '10K' },
                { id: '5km', label: '5K' },
                { id: '3km', label: 'Dog 3.8K 🐾' },
                { id: '1km', label: 'Dog 1K 🐾' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setDistanceFilter(filter.id as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border-2 ${
                    distanceFilter === filter.id
                      ? 'bg-[#FFC928] text-[#2A1450] border-[#2A1450] shadow-[0_3px_0_#2A1450]'
                      : 'bg-white text-[#4B2D78] border-purple-200 hover:border-[#2A1450]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Top 3 Podium Highlights on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7 items-end">
              {filteredRunners.slice(0, 3).map((topRunner, idx) => {
                const podiumPlace = idx === 0 ? 1 : idx === 1 ? 2 : 3;
                const isCheered = !!cheeredIds[topRunner.bib];

                const podiumCardStyle =
                  podiumPlace === 1
                    ? 'bg-gradient-to-b from-[#FFFDF0] via-white to-[#FFF4C2] border-[#2A1450] md:-translate-y-2 shadow-[0_20px_38px_-14px_rgba(245,184,0,0.45),0_7px_0_#2A1450]'
                    : podiumPlace === 2
                    ? 'bg-gradient-to-b from-[#FAF8FF] to-white border-[#2A1450] shadow-[0_14px_28px_-14px_rgba(42,20,80,0.28),0_5px_0_#2A1450]'
                    : 'bg-gradient-to-b from-[#FFF8F2] to-white border-[#2A1450] shadow-[0_14px_28px_-14px_rgba(42,20,80,0.28),0_5px_0_#2A1450]';

                const medalBadge =
                  podiumPlace === 1
                    ? '🥇 อันดับ 1 CHAMPION'
                    : podiumPlace === 2
                    ? '🥈 อันดับ 2'
                    : '🥉 อันดับ 3';

                return (
                  <motion.div
                    key={topRunner.bib}
                    whileHover={{ y: podiumPlace === 1 ? -12 : -6 }}
                    className={`rounded-[28px] p-5 sm:p-6 border-[2.5px] transition-all flex flex-col items-center text-center relative overflow-hidden ${podiumCardStyle}`}
                  >
                    <span
                      className={`text-xs font-extrabold px-3.5 py-1 rounded-full border-2 border-[#2A1450] mb-3 ${
                        podiumPlace === 1
                          ? 'bg-[#FFC928] text-[#2A1450]'
                          : 'bg-white text-[#2A1450]'
                      }`}
                    >
                      {medalBadge}
                    </span>

                    <div className="relative mb-3">
                      <img loading="lazy" decoding="async"
                        src={topRunner.avatar}
                        alt={topRunner.name}
                        className="w-20 h-20 rounded-full object-cover border-[3px] border-[#2A1450] shadow-md"
                      />
                      {topRunner.isPacer && (
                        <span
                          className="absolute -bottom-1 -right-1 text-base bg-white rounded-full p-0.5 border border-[#2A1450]"
                          title="วิ่งคู่สัตว์เลี้ยง"
                        >
                          🐾
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-[#2A1450] text-base sm:text-lg leading-tight">
                      {topRunner.name}
                    </h3>
                    <div className="text-xs text-[#6B5A85] font-bold mt-0.5">
                      BIB: {topRunner.bib} • จ.{topRunner.city}
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-purple-100 w-full flex items-center justify-around">
                      <div>
                        <div className="text-[10px] text-[#6B5A85] font-bold uppercase">
                          เวลาเข้าเส้นชัย
                        </div>
                        <div className="font-mono text-lg font-black text-[#2A1450] tabular-nums">
                          {topRunner.time}
                        </div>
                      </div>
                      <div className="h-7 w-[1px] bg-purple-100" />
                      <div>
                        <div className="text-[10px] text-[#6B5A85] font-bold uppercase">
                          ความเร็วเฉลี่ย
                        </div>
                        <div className="font-mono text-sm font-extrabold text-[#B45309] tabular-nums">
                          {topRunner.pace}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleCheer(topRunner.bib, topRunner.cheers)}
                      className={`mt-4 w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2 ${
                        isCheered
                          ? 'bg-rose-50 text-rose-600 border-rose-400'
                          : 'bg-[#2A1450] hover:bg-[#3F1D74] text-[#FFC928] border-[#2A1450]'
                      }`}
                    >
                      <motion.span
                        animate={isCheered ? { scale: [1, 1.45, 1] } : {}}
                        transition={{ duration: 0.35 }}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isCheered ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </motion.span>
                      <span className="tabular-nums">
                        ส่งกำลังใจ ({cheerCounts[topRunner.bib] || topRunner.cheers})
                      </span>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>

            {/* List Table of Top Runners */}
            <div className="bg-white rounded-[28px] border-[2.5px] border-[#2A1450] shadow-[0_14px_32px_-14px_rgba(42,20,80,0.25),0_5px_0_#2A1450] overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-purple-100 bg-[#FAF7FF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#B45309]" />
                  <span className="font-extrabold text-[#2A1450] text-sm sm:text-base">
                    อันดับนักวิ่งสถิติดีเยี่ยม ({filteredRunners.length} ท่าน)
                  </span>
                </div>
                <span className="text-xs text-[#6B5A85] font-bold">อัปเดตแบบเรียลไทม์</span>
              </div>

              <div className="divide-y divide-purple-100">
                {filteredRunners.map((runner) => {
                  const isCheered = !!cheeredIds[runner.bib];
                  return (
                    <div
                      key={runner.bib}
                      className="p-3.5 sm:p-4 hover:bg-[#FAF7FF] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs sm:text-sm shrink-0 border ${
                            runner.rank === 1
                              ? 'bg-[#FFC928] text-[#2A1450] border-[#2A1450]'
                              : runner.rank === 2
                              ? 'bg-purple-100 text-[#2A1450] border-purple-300'
                              : runner.rank === 3
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {runner.rank}
                        </span>

                        <img loading="lazy" decoding="async"
                          src={runner.avatar}
                          alt={runner.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#2A1450]/20 shrink-0"
                        />

                        <div className="min-w-0">
                          <div className="font-extrabold text-[#2A1450] text-xs sm:text-sm truncate">
                            {runner.name}
                          </div>
                          <div className="text-[11px] text-[#6B5A85] font-semibold flex items-center gap-1.5 flex-wrap">
                            <span>BIB: {runner.bib}</span>
                            <span>•</span>
                            <span className="text-[#5B20A8] font-extrabold uppercase">
                              {runner.category}
                            </span>
                            <span>•</span>
                            <span>{runner.city}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="font-mono font-black text-sm text-[#2A1450] tabular-nums">
                            {runner.time}
                          </div>
                          <div className="text-[10px] text-[#6B5A85] font-bold">
                            Pace: {runner.pace}
                          </div>
                        </div>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCheer(runner.bib, runner.cheers)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
                            isCheered
                              ? 'bg-rose-50 text-rose-600 border-rose-300'
                              : 'bg-[#F4ECFF] hover:bg-[#2A1450] text-[#2A1450] hover:text-[#FFC928] border-purple-200'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isCheered ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                          <span className="font-mono tabular-nums">
                            {cheerCounts[runner.bib] || runner.cheers}
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMMUNITY & RUNNING CLUBS */}
        {activeTab === 'community' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {communityTeams.map((team) => {
              const isCheered = !!cheeredIds[team.teamName];
              return (
                <div
                  key={team.teamName}
                  className="bg-white rounded-[28px] border-[2.5px] border-[#2A1450] shadow-[0_14px_28px_-14px_rgba(42,20,80,0.25),0_5px_0_#2A1450] p-5 sm:p-6 transition-all relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-extrabold text-[#FFC928] px-3 py-1 rounded-full bg-[#2A1450]">
                      อันดับ {team.rank}
                    </span>
                    <span className="text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
                      {team.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold text-[#2A1450] mb-4">
                    {team.teamName}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 bg-[#FAF7FF] p-3 rounded-2xl border border-purple-100 mb-4 text-center">
                    <div>
                      <div className="text-[10px] text-[#6B5A85] font-bold uppercase">
                        ระยะทางรวม
                      </div>
                      <div className="font-mono text-xs sm:text-sm font-black text-[#5B20A8] mt-0.5">
                        {team.totalDistance}
                      </div>
                    </div>
                    <div className="border-x border-purple-200">
                      <div className="text-[10px] text-[#6B5A85] font-bold uppercase">สมาชิก</div>
                      <div className="font-mono text-xs sm:text-sm font-black text-[#2A1450] mt-0.5">
                        {team.members} ท่าน
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#6B5A85] font-bold uppercase">
                        คะแนนส่งใจ
                      </div>
                      <div className="font-mono text-xs sm:text-sm font-black text-[#B45309] mt-0.5 tabular-nums">
                        {cheerCounts[team.teamName] || team.cheers}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleCheer(team.teamName, team.cheers)}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2 ${
                      isCheered
                        ? 'bg-rose-50 text-rose-600 border-rose-300'
                        : 'bg-[#FFC928] hover:bg-[#F5B800] text-[#2A1450] border-[#2A1450]'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isCheered ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span>
                      {isCheered ? 'ส่งกำลังใจให้ชมรมแล้ว!' : 'กดส่งหัวใจให้ชมรมนี้'}
                    </span>
                  </motion.button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

/**
 * Set to true after race day, once real results are loaded into LeaderboardResults.
 * Until then the page shows a "results announced after the race" notice instead of sample data.
 */
const RESULTS_PUBLISHED = false;

export const LeaderboardSection: React.FC = () => {
  if (RESULTS_PUBLISHED) return <LeaderboardResults />;
  return (
    <section
      id="leaderboard"
      aria-labelledby="leaderboard-heading"
      className="py-12 sm:py-16 bg-gradient-to-b from-[#E0F2FE]/60 via-[#FAF7FF] to-[#FFF4D2]/50 relative overflow-hidden scroll-mt-20"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 id="leaderboard-heading" className="text-3xl sm:text-4xl font-extrabold text-[#2A1450]">
          ผลการแข่งขัน
        </h2>
        <div className="mt-6 rounded-[28px] bg-white border-[3px] border-[#2A1450] shadow-[0_8px_0_#2A1450] px-6 py-8 sm:py-10 flex flex-col items-center gap-3">
          <span className="w-14 h-14 rounded-2xl bg-[#FFF4D2] border-2 border-[#2A1450] flex items-center justify-center">
            <Trophy className="w-7 h-7 text-[#B45309]" />
          </span>
          <p className="text-base sm:text-lg font-extrabold text-[#2A1450]">
            ประกาศผลหลังจบการแข่งขัน 10 ธ.ค. 2569
          </p>
          <p className="text-sm font-semibold text-[#6B5A85] max-w-lg text-balance">
            เวลาและอันดับของทุกระยะจะแสดงที่หน้านี้ ค้นหาผลของคุณได้ด้วยเลข BIB
          </p>
        </div>
      </div>
    </section>
  );
};
