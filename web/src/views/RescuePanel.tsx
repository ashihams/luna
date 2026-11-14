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
    <div className="w-96 h-full border-l border-[#e5e5e5] bg-[#fcfbf9] flex flex-col justify-between overflow-hidden select-none text-[#171717]">
      <div className="p-4 space-y-3.5 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
          <div className="flex items-center space-x-2.5">
            <LifeBuoy className="w-4 h-4 text-[#4338ca]" />
            <h2 className="font-serif italic text-sm font-semibold tracking-wide text-[#171717]">
              Rescue Alternatives
            </h2>
          </div>
          {pinnedScenarios.length > 0 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#4338ca] hover:text-[#3730a3] transition underline font-semibold"
            >
              Pinned ({pinnedScenarios.length})
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-full border border-[#e5e5e5] shadow-sm text-[11px]">
          <button
            onClick={() => setActiveCategory('alt_date')}
            className={`py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ease-premium flex items-center justify-center space-x-1.5 ${
              activeCategory === 'alt_date'
                ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
                : 'text-[#171717]/60 hover:text-[#171717]'
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
                : 'text-[#171717]/60 hover:text-[#171717]'
            }`}
            title="Alternative sites on this slipped date"
          >
            <MapPin className="w-3 h-3 text-amber-500" />
            <span>Alt Sites</span>
          </button>

          <button
            onClick={() => setActiveCategory('top_overall')}
            className={`py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ease-premium flex items-center justify-center space-x-1.5 ${
              activeCategory === 'top_overall'
                ? 'bg-[#4338ca] text-white shadow-sm font-semibold'
                : 'text-[#171717]/60 hover:text-[#171717]'
            }`}
            title="Top 5 optimal windows across the lunar south pole"
          >
            <Trophy className="w-3 h-3 text-amber-500" />
            <span>Top 5</span>
          </button>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {currentList.length === 0 ? (
            <div className="text-center font-sans text-xs text-[#171717]/50 py-12">
              No viable alternatives found in this range.
            </div>
          ) : (
            currentList.map((item, idx) => {
              const deltaScore = Math.round(item.deltaScore * 100);
              return (
                <div
                  key={`${item.siteId}-${item.dayIndex}-${idx}`}
                  className="p-3 rounded-xl border border-[#e5e5e5] bg-white hover:border-[#4338ca] hover:shadow-md transition-all duration-500 ease-premium flex flex-col space-y-2 group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-medium text-xs text-[#171717] truncate pr-2 group-hover:text-[#4338ca] transition duration-500">
                      {item.siteName.split('(')[0]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-semibold ${
                        item.viable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {item.viable ? 'VIABLE' : 'FAILED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#4338ca] font-semibold">{item.dateUtc}</span>
                    <span
                      className={`font-semibold ${
                        deltaScore >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {deltaScore >= 0 ? `+${deltaScore}` : deltaScore} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-[#171717]/60 border-t border-[#e5e5e5] pt-1.5">
                    <div>
                      Sun: <span className="text-[#171717] font-semibold">{Math.round(item.sun_fraction * 100)}%</span>
                    </div>
                    <div>
                      Earth: <span className="text-[#171717] font-semibold">{Math.round(item.earth_fraction * 100)}%</span>
                    </div>
                    <div>
                      Dark: <span className="text-[#171717] font-semibold">{item.longest_dark_gap_h.toFixed(1)}h</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdopt(item)}
                    className="w-full mt-1 py-1.5 px-3 rounded-full bg-indigo-50 hover:bg-[#4338ca] text-[#4338ca] hover:text-white font-mono text-[10px] uppercase tracking-[0.2em] font-semibold border border-indigo-200 hover:border-transparent transition-all duration-500 ease-premium flex items-center justify-center space-x-1.5"
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
        <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto border-l border-[#e5e5e5]">
          <div>
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3 mb-4">
              <h3 className="font-serif italic text-sm font-semibold text-[#171717]">
                Pinned Scenarios Comparison
              </h3>
              <button
                onClick={() => setShowComparison(false)}
                className="p-1 text-[#171717]/50 hover:text-[#171717]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinnedScenarios.length === 0 ? (
              <p className="font-sans text-xs text-[#171717]/50">No scenarios pinned yet. Click "Pin" in the header to save one.</p>
            ) : (
              <div className="space-y-3">
                {pinnedScenarios.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 bg-[#fcfbf9] border border-[#e5e5e5] rounded-xl text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-serif font-medium text-[#171717]">{s.name}</span>
                      <button
                        onClick={() => removePinnedScenario(s.id)}
                        className="text-[#171717]/40 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-[#4338ca]">
                      Date: {s.dateUtc} (Slip: {s.slipDays >= 0 ? `+${s.slipDays}` : s.slipDays}d)
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-[#171717]/60 pt-2 border-t border-[#e5e5e5]">
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
            className="w-full mt-4 py-2.5 bg-[#4338ca] hover:bg-[#3730a3] text-white rounded-full font-mono text-xs uppercase tracking-[0.25em] transition-all duration-500 ease-premium shadow-md shadow-indigo-900/20"
          >
            Close Comparison
          </button>
        </div>
      )}
    </div>
  );
};
