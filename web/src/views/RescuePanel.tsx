import React, { useState } from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { RescueCandidate } from '../types';
import { LifeBuoy, Calendar, MapPin, Trophy, ArrowRight, Check, X } from 'lucide-react';

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
    <div className="w-96 h-full border-l border-slate-800 bg-slate-950/80 flex flex-col justify-between overflow-hidden">
      <div className="p-3.5 space-y-3 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <LifeBuoy className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Rescue Options
            </h2>
          </div>
          {pinnedScenarios.length > 0 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-[10px] font-medium text-cyan-400 hover:text-cyan-300 underline"
            >
              Compare Pinned ({pinnedScenarios.length})
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setActiveCategory('alt_date')}
            className={`py-1 rounded font-medium transition flex items-center justify-center space-x-1 ${
              activeCategory === 'alt_date'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Alternative launch dates at this site (±30 days)"
          >
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>Alt Dates</span>
          </button>

          <button
            onClick={() => setActiveCategory('alt_site')}
            className={`py-1 rounded font-medium transition flex items-center justify-center space-x-1 ${
              activeCategory === 'alt_site'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Alternative sites on this slipped date"
          >
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>Alt Sites</span>
          </button>

          <button
            onClick={() => setActiveCategory('top_overall')}
            className={`py-1 rounded font-medium transition flex items-center justify-center space-x-1 ${
              activeCategory === 'top_overall'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Top 5 optimal windows across the lunar south pole"
          >
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span>Top 5</span>
          </button>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {currentList.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-8">
              No viable alternatives found in this range.
            </div>
          ) : (
            currentList.map((item, idx) => {
              const deltaScore = Math.round(item.deltaScore * 100);
              return (
                <div
                  key={`${item.siteId}-${item.dayIndex}-${idx}`}
                  className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 transition flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200 truncate pr-2">
                      {item.siteName.split('(')[0]}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.viable
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                          : 'bg-rose-950 text-rose-400 border border-rose-700/60'
                      }`}
                    >
                      {item.viable ? 'VIABLE' : 'FAILED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="text-cyan-400 font-semibold">{item.dateUtc}</span>
                    <span
                      className={`font-semibold ${
                        deltaScore >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {deltaScore >= 0 ? `+${deltaScore}` : deltaScore} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
                    <div>
                      Sun: <span className="text-slate-200 font-semibold">{Math.round(item.sun_fraction * 100)}%</span>
                    </div>
                    <div>
                      Earth: <span className="text-slate-200 font-semibold">{Math.round(item.earth_fraction * 100)}%</span>
                    </div>
                    <div>
                      Dark: <span className="text-slate-200 font-semibold">{item.longest_dark_gap_h.toFixed(1)}h</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdopt(item)}
                    className="w-full mt-1 py-1 px-2 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition flex items-center justify-center space-x-1"
                  >
                    <span>Switch to this plan</span>
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
        <div className="absolute inset-0 z-30 bg-slate-950/95 p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Pinned Scenarios Comparison
              </h3>
              <button
                onClick={() => setShowComparison(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinnedScenarios.length === 0 ? (
              <p className="text-xs text-slate-500">No scenarios pinned yet. Click "Pin Plan" in the header to save one.</p>
            ) : (
              <div className="space-y-3">
                {pinnedScenarios.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{s.name}</span>
                      <button
                        onClick={() => removePinnedScenario(s.id)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400">
                      Date: {s.dateUtc} (Slip: {s.slipDays >= 0 ? `+${s.slipDays}` : s.slipDays}d)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
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
            className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium"
          >
            Close Comparison
          </button>
        </div>
      )}
    </div>
  );
};
