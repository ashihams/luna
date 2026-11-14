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
    <div className="w-96 h-full border-l border-[#262626] bg-[#171717]/95 flex flex-col justify-between overflow-hidden select-none">
      <div className="p-4 space-y-3.5 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center space-x-2.5">
            <LifeBuoy className="w-4 h-4 text-indigo-400" />
            <h2 className="font-serif italic text-sm font-semibold tracking-wide text-[#fcfbf9]">
              Rescue Alternatives
            </h2>
          </div>
          {pinnedScenarios.length > 0 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="font-mono text-[9px] uppercase tracking-[0.25em] text-indigo-300 hover:text-white transition underline"
            >
              Pinned ({pinnedScenarios.length})
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-full border border-[#262626] text-[11px]">
          <button
            onClick={() => setActiveCategory('alt_date')}
            className={`py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ease-premium flex items-center justify-center space-x-1.5 ${
              activeCategory === 'alt_date'
                ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
            title="Alternative launch dates at this site (±30 days)"
          >
            <Calendar className="w-3 h-3 text-indigo-300" />
            <span>Alt Dates</span>
          </button>

          <button
            onClick={() => setActiveCategory('alt_site')}
            className={`py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ease-premium flex items-center justify-center space-x-1.5 ${
              activeCategory === 'alt_site'
                ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
            title="Alternative sites on this slipped date"
          >
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>Alt Sites</span>
          </button>

          <button
            onClick={() => setActiveCategory('top_overall')}
            className={`py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ease-premium flex items-center justify-center space-x-1.5 ${
              activeCategory === 'top_overall'
                ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
            title="Top 5 optimal windows across the lunar south pole"
          >
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span>Top 5</span>
          </button>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {currentList.length === 0 ? (
            <div className="text-center font-sans text-xs text-white/40 py-12">
              No viable alternatives found in this range.
            </div>
          ) : (
            currentList.map((item, idx) => {
              const deltaScore = Math.round(item.deltaScore * 100);
              return (
                <div
                  key={`${item.siteId}-${item.dayIndex}-${idx}`}
                  className="p-3 rounded-xl border border-[#262626] bg-black/30 hover:border-indigo-500/40 hover:bg-black/50 transition-all duration-500 ease-premium flex flex-col space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-medium text-xs text-[#fcfbf9] truncate pr-2 group-hover:text-indigo-300 transition duration-500">
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
                    <span className="text-indigo-300 font-semibold">{item.dateUtc}</span>
                    <span
                      className={`font-semibold ${
                        deltaScore >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {deltaScore >= 0 ? `+${deltaScore}` : deltaScore} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-white/50 border-t border-[#262626] pt-1.5">
                    <div>
                      Sun: <span className="text-white/90 font-semibold">{Math.round(item.sun_fraction * 100)}%</span>
                    </div>
                    <div>
                      Earth: <span className="text-white/90 font-semibold">{Math.round(item.earth_fraction * 100)}%</span>
                    </div>
                    <div>
                      Dark: <span className="text-white/90 font-semibold">{item.longest_dark_gap_h.toFixed(1)}h</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdopt(item)}
                    className="w-full mt-1 py-1.5 px-3 rounded-full bg-white/5 hover:bg-[#4338ca] text-white font-mono text-[10px] uppercase tracking-[0.2em] border border-white/10 hover:border-transparent transition-all duration-500 ease-premium flex items-center justify-center space-x-1.5"
                  >
                    <span>Adopt this plan</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Comparison Drawer Modal */}
      {showComparison && (
        <div className="absolute inset-0 z-30 bg-[#171717]/98 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
              <h3 className="font-serif italic text-sm font-semibold text-[#fcfbf9]">
                Pinned Scenarios Comparison
              </h3>
              <button
                onClick={() => setShowComparison(false)}
                className="p-1 text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinnedScenarios.length === 0 ? (
              <p className="font-sans text-xs text-white/40">No scenarios pinned yet. Click "Pin" in the header to save one.</p>
            ) : (
              <div className="space-y-3">
                {pinnedScenarios.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 bg-black/40 border border-[#262626] rounded-xl text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-serif font-medium text-white">{s.name}</span>
                      <button
                        onClick={() => removePinnedScenario(s.id)}
                        className="text-white/40 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-indigo-300">
                      Date: {s.dateUtc} (Slip: {s.slipDays >= 0 ? `+${s.slipDays}` : s.slipDays}d)
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-white/60 pt-2 border-t border-[#262626]">
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
            className="w-full mt-4 py-2.5 bg-white/10 hover:bg-[#4338ca] text-white rounded-full font-mono text-xs uppercase tracking-[0.25em] transition-all duration-500 ease-premium"
          >
            Close Comparison
          </button>
        </div>
      )}
    </div>
  );
};
