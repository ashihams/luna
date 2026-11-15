import React, { useState } from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { RescueCandidate } from '../types';
import { LifeBuoy, Calendar, MapPin, Trophy, ArrowRight, X } from 'lucide-react';

export const RescuePanel: React.FC = () => {
  const {
    getRescueCandidates,
    setSelectedSiteId,
    setPlannedDayIndex,
    setSlipDays,
    pinnedScenarios,
    removePinnedScenario,
  } = usePlannerStore();

  const [activeCategory, setActiveCategory] = useState<'alt_date' | 'alt_site' | 'top_overall'>('alt_date');
  const [showComparison, setShowComparison] = useState(false);

  const rescues = getRescueCandidates();
  if (!rescues) return null;

  const handleAdopt = (candidate: RescueCandidate) => {
    setSelectedSiteId(candidate.siteId);
    setPlannedDayIndex(candidate.dayIndex);
    setSlipDays(0);
  };

  const getList = () => {
    if (activeCategory === 'alt_date') return rescues.altDates;
    if (activeCategory === 'alt_site') return rescues.altSites;
    return rescues.topOverall;
  };

  const currentList = getList();

  return (
    <div className="w-96 h-full border-l border-white/10 bg-[#080808]/90 backdrop-blur-xl flex flex-col justify-between overflow-hidden select-none text-white">
      <div className="p-4 space-y-3.5 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <LifeBuoy className="w-4 h-4 text-violet-400" />
            <h2 className="font-serif text-lg font-normal tracking-tight text-white">
              Rescue Alternatives
            </h2>
          </div>
          {pinnedScenarios.length > 0 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="font-mono text-[9px] uppercase tracking-widest text-purple-400 hover:text-purple-300 transition underline"
            >
              Pinned ({pinnedScenarios.length})
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white/[0.02] p-1 rounded-full border border-white/10 text-[11px]">
          <button
            onClick={() => setActiveCategory('alt_date')}
            className={`py-1 rounded-full font-sans text-[11px] font-medium transition duration-300 ease-snappy flex items-center justify-center space-x-1.5 ${
              activeCategory === 'alt_date'
                ? 'bg-[#8B5CF6] text-white shadow-[0_0_12px_-5px_#8B5CF6] font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Alternative launch dates at this site (±30 days)"
          >
            <Calendar className="w-3 h-3 text-purple-300" />
            <span>Alt Dates</span>
          </button>

          <button
            onClick={() => setActiveCategory('alt_site')}
            className={`py-1 rounded-full font-sans text-[11px] font-medium transition duration-300 ease-snappy flex items-center justify-center space-x-1.5 ${
              activeCategory === 'alt_site'
                ? 'bg-[#8B5CF6] text-white shadow-[0_0_12px_-5px_#8B5CF6] font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Alternative sites on this slipped date"
          >
            <MapPin className="w-3 h-3 text-cyan-300" />
            <span>Alt Sites</span>
          </button>

          <button
            onClick={() => setActiveCategory('top_overall')}
            className={`py-1 rounded-full font-sans text-[11px] font-medium transition duration-300 ease-snappy flex items-center justify-center space-x-1.5 ${
              activeCategory === 'top_overall'
                ? 'bg-[#8B5CF6] text-white shadow-[0_0_12px_-5px_#8B5CF6] font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Top 5 optimal windows across the lunar south pole"
          >
            <Trophy className="w-3 h-3 text-amber-300" />
            <span>Top 5</span>
          </button>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {currentList.length === 0 ? (
            <div className="text-center font-sans text-xs text-neutral-500 py-12 font-light">
              No viable alternatives found in this range.
            </div>
          ) : (
            currentList.map((item, idx) => {
              const deltaScore = Math.round(item.deltaScore * 100);
              return (
                <div
                  key={`${item.siteId}-${item.dayIndex}-${idx}`}
                  className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-violet-500/40 hover:-translate-y-1 hover:shadow-[0_0_20px_-10px_rgba(139,92,246,0.3)] transition duration-300 ease-snappy flex flex-col space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-base text-white truncate pr-2 group-hover:text-purple-300 transition duration-300">
                      {item.siteName.split('(')[0]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-semibold ${
                        item.viable
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {item.viable ? 'VIABLE' : 'FAILED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-300 font-medium">{item.dateUtc}</span>
                    <span
                      className={`font-semibold ${
                        deltaScore >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {deltaScore >= 0 ? `+${deltaScore}` : deltaScore} pts
                    </span>
                  </div>

                  {item.distance_km !== undefined && (
                    <div className="flex items-center space-x-1.5 text-[11px] font-mono text-violet-300 bg-violet-950/20 px-2 py-1 rounded-lg border border-violet-500/20">
                      <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      <span>{item.distance_km.toFixed(1)} km surface distance</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-neutral-400 border-t border-white/5 pt-2">
                    <div>
                      Sun: <span className="text-white font-medium">{Math.round(item.sun_fraction * 100)}%</span>
                    </div>
                    <div>
                      Earth: <span className="text-white font-medium">{Math.round(item.earth_fraction * 100)}%</span>
                    </div>
                    <div>
                      Dark: <span className="text-white font-medium">{item.longest_dark_gap_h.toFixed(1)}h</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdopt(item)}
                    className="w-full mt-1.5 py-1.5 px-3 rounded-full bg-white/[0.03] hover:bg-[#8B5CF6] text-neutral-200 hover:text-white font-sans text-xs font-medium border border-white/10 hover:border-transparent transition duration-300 ease-snappy flex items-center justify-center space-x-1.5"
                  >
                    <span>Adopt this plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Comparison Drawer Modal */}
      {showComparison && (
        <div className="absolute inset-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-2xl p-5 flex flex-col justify-between overflow-y-auto border-l border-white/10">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-serif text-lg font-normal text-white">
                Pinned Scenarios Comparison
              </h3>
              <button
                onClick={() => setShowComparison(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinnedScenarios.length === 0 ? (
              <p className="font-sans text-xs text-neutral-500 font-light">No scenarios pinned yet. Click "Pin" in the header to save one.</p>
            ) : (
              <div className="space-y-3">
                {pinnedScenarios.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-serif text-base text-white">{s.name}</span>
                      <button
                        onClick={() => removePinnedScenario(s.id)}
                        className="text-neutral-500 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-purple-300">
                      Date: {s.dateUtc} (Slip: {s.slipDays >= 0 ? `+${s.slipDays}` : s.slipDays}d)
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-neutral-400 pt-2 border-t border-white/5">
                      <div>Sun: {Math.round(s.metrics.sun_fraction * 100)}%</div>
                      <div>Earth: {Math.round(s.metrics.earth_fraction * 100)}%</div>
                      <div>Dark Gap: {s.metrics.longest_dark_gap_h.toFixed(1)}h</div>
                      <div>Score: {(s.metrics.score * 100).toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowComparison(false)}
            className="w-full mt-4 py-2.5 bg-white/[0.04] hover:bg-[#8B5CF6] text-white rounded-full font-sans text-xs font-semibold border border-white/10 hover:border-transparent transition duration-300 ease-snappy shadow-lg"
          >
            Close Comparison
          </button>
        </div>
      )}
    </div>
  );
};
