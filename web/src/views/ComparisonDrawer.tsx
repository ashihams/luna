import React, { useState } from 'react';
import { usePlannerStore, PinnedScenario } from '../state/usePlannerStore';
import { X, Layers, Sun, Radio, Moon, Trophy } from 'lucide-react';

export const ComparisonDrawer: React.FC = () => {
  const {
    isComparisonOpen,
    setIsComparisonOpen,
    pinnedScenarios,
    setSelectedSiteId,
    setPlannedDayIndex,
    setSlipDays,
    sites,
    selectedSiteId,
    plannedDayIndex,
    slipDays,
    manifest,
    getSlipAnalysis,
  } = usePlannerStore();

  const currentAnalysis = getSlipAnalysis();
  const currentSite = sites.find((s) => s.id === selectedSiteId);

  // Default Slot A to current live plan if no pinned, or first pinned
  const [slotAId, setSlotAId] = useState<string>('current-live');
  const [slotBId, setSlotBId] = useState<string>(
    pinnedScenarios.length > 0 ? pinnedScenarios[0].id : 'current-live'
  );

  if (!isComparisonOpen || !manifest) return null;

  // Build live scenario object for selection
  const baseDate = new Date(manifest.time.t0_utc);
  const slippedDay = Math.max(0, Math.min(730, plannedDayIndex + slipDays));
  const liveDate = new Date(baseDate);
  liveDate.setUTCDate(liveDate.getUTCDate() + slippedDay);
  const liveDateStr = liveDate.toISOString().split('T')[0];

  const liveScenario: PinnedScenario = {
    id: 'current-live',
    name: `${currentSite?.name.split('(')[0].trim() || 'Current'} (Live Plan)`,
    siteId: selectedSiteId,
    siteName: currentSite?.name || 'Selected Site',
    dayIndex: slippedDay,
    dateUtc: liveDateStr,
    slipDays: slipDays,
    metrics: currentAnalysis ? currentAnalysis.cellMetrics : {
      sun_fraction: 0,
      earth_fraction: 0,
      longest_dark_gap_h: 0,
      longest_comms_outage_h: 0,
      viable: false,
      score: 0,
      dark_gap_start_step: 0,
      dark_gap_start_az: 0,
      dark_gap_start_el: 0,
      dark_gap_start_horizon: 0,
      outage_start_step: 0,
      outage_start_az: 0,
      outage_start_el: 0,
      outage_start_horizon: 0,
    },
  };

  const allAvailable = [liveScenario, ...pinnedScenarios];

  const scenarioA = allAvailable.find((s) => s.id === slotAId) || liveScenario;
  const scenarioB = allAvailable.find((s) => s.id === slotBId) || (pinnedScenarios[0] || liveScenario);

  const applyScenario = (scenario: PinnedScenario) => {
    setSelectedSiteId(scenario.siteId);
    setPlannedDayIndex(scenario.dayIndex);
    setSlipDays(0);
    setIsComparisonOpen(false);
  };

  const deltaScore = Math.round((scenarioB.metrics.score - scenarioA.metrics.score) * 100);
  const deltaSun = Math.round((scenarioB.metrics.sun_fraction - scenarioA.metrics.sun_fraction) * 100);
  const deltaEarth = Math.round((scenarioB.metrics.earth_fraction - scenarioA.metrics.earth_fraction) * 100);
  const deltaDark = scenarioB.metrics.longest_dark_gap_h - scenarioA.metrics.longest_dark_gap_h;
  const deltaOutage = scenarioB.metrics.longest_comms_outage_h - scenarioA.metrics.longest_comms_outage_h;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 select-none text-[#171717]">
      <div className="w-full max-w-4xl bg-[#fcfbf9] border border-[#e5e5e5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e5e5] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#4338ca] flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-serif italic text-base font-semibold text-[#171717]">
                Two-Scenario Mission Comparison
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#171717]/50">
                LOLA HORIZONS • POWER MARGINS • EARTH COMMS WINDOWS
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsComparisonOpen(false)}
            className="p-2 rounded-full bg-slate-100 text-[#171717]/60 hover:text-[#171717] hover:bg-slate-200 transition duration-500 ease-premium"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-mono text-[10px] font-semibold text-[#171717]/60 uppercase tracking-[0.3em]">
                Scenario A (Baseline)
              </label>
              <select
                value={slotAId}
                onChange={(e) => setSlotAId(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] shadow-sm rounded-xl px-3.5 py-2.5 text-xs text-[#171717] font-mono focus:outline-none focus:border-[#4338ca]"
              >
                {allAvailable.map((s) => (
                  <option key={`a-${s.id}`} value={s.id}>
                    {s.name} • {s.dateUtc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] font-semibold text-[#171717]/60 uppercase tracking-[0.3em]">
                Scenario B (Alternative)
              </label>
              <select
                value={slotBId}
                onChange={(e) => setSlotBId(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] shadow-sm rounded-xl px-3.5 py-2.5 text-xs text-[#171717] font-mono focus:outline-none focus:border-[#4338ca]"
              >
                {allAvailable.map((s) => (
                  <option key={`b-${s.id}`} value={s.id}>
                    {s.name} • {s.dateUtc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Comparison Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Scenario A Card */}
            <div
              className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 transition-all duration-500 ease-premium ${
                scenarioA.metrics.viable
                  ? 'bg-white border-[#e5e5e5]'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif font-medium text-sm text-[#171717]">{scenarioA.siteName}</h3>
                  <div className="font-mono text-[11px] text-[#4338ca] mt-1 font-semibold">
                    Date: {scenarioA.dateUtc} (Slip: {scenarioA.slipDays >= 0 ? `+${scenarioA.slipDays}` : scenarioA.slipDays}d)
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider font-semibold border ${
                    scenarioA.metrics.viable
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {scenarioA.metrics.viable ? 'VIABLE' : 'FAILED'}
                </div>
              </div>

              <button
                onClick={() => applyScenario(scenarioA)}
                className="w-full py-2 px-3 rounded-full bg-white hover:bg-slate-50 border border-[#e5e5e5] font-mono text-[11px] uppercase tracking-[0.2em] text-[#171717] transition-all duration-500 ease-premium shadow-sm"
              >
                Adopt Scenario A
              </button>
            </div>

            {/* Scenario B Card */}
            <div
              className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 transition-all duration-500 ease-premium ${
                scenarioB.metrics.viable
                  ? 'bg-indigo-50/40 border-indigo-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif font-medium text-sm text-[#171717]">{scenarioB.siteName}</h3>
                  <div className="font-mono text-[11px] text-[#4338ca] mt-1 font-semibold">
                    Date: {scenarioB.dateUtc} (Slip: {scenarioB.slipDays >= 0 ? `+${scenarioB.slipDays}` : scenarioB.slipDays}d)
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider font-semibold border ${
                    scenarioB.metrics.viable
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {scenarioB.metrics.viable ? 'VIABLE' : 'FAILED'}
                </div>
              </div>

              <button
                onClick={() => applyScenario(scenarioB)}
                className="w-full py-2 px-3 rounded-full bg-[#4338ca] hover:bg-[#3730a3] text-white font-mono text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-500 ease-premium shadow-md shadow-indigo-900/20"
              >
                Adopt Scenario B
              </button>
            </div>
          </div>

          {/* Metric Rows Table */}
          <div className="border border-[#e5e5e5] rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="grid grid-cols-12 bg-slate-50 px-5 py-3 font-mono text-[10px] font-semibold text-[#171717]/60 border-b border-[#e5e5e5] uppercase tracking-[0.25em]">
              <div className="col-span-5">Metric</div>
              <div className="col-span-3 text-right">Scenario A</div>
              <div className="col-span-1 text-center">Δ</div>
              <div className="col-span-3 text-right">Scenario B</div>
            </div>

            <div className="divide-y divide-[#e5e5e5] text-xs">
              {/* Composite Score */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans font-medium text-[#171717] flex items-center space-x-2">
                  <Trophy className="w-3.5 h-3.5 text-[#4338ca]" />
                  <span>Mission Viability Score</span>
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-[#171717]">
                  {(scenarioA.metrics.score * 100).toFixed(1)}
                </div>
                <div className="col-span-1 text-center font-mono font-bold text-[11px]">
                  <span className={deltaScore >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {deltaScore >= 0 ? `+${deltaScore}` : deltaScore}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-[#4338ca]">
                  {(scenarioB.metrics.score * 100).toFixed(1)}
                </div>
              </div>

              {/* Sun Lit % */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans font-medium text-[#171717] flex items-center space-x-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Solar Illumination</span>
                </div>
                <div className="col-span-3 text-right font-mono text-amber-600 font-semibold">
                  {Math.round(scenarioA.metrics.sun_fraction * 100)}%
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaSun >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {deltaSun >= 0 ? `+${deltaSun}%` : `${deltaSun}%`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-amber-600 font-bold">
                  {Math.round(scenarioB.metrics.sun_fraction * 100)}%
                </div>
              </div>

              {/* Earth Comms % */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans font-medium text-[#171717] flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-sky-500" />
                  <span>Earth Direct LOS</span>
                </div>
                <div className="col-span-3 text-right font-mono text-sky-600 font-semibold">
                  {Math.round(scenarioA.metrics.earth_fraction * 100)}%
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaEarth >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {deltaEarth >= 0 ? `+${deltaEarth}%` : `${deltaEarth}%`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-sky-600 font-bold">
                  {Math.round(scenarioB.metrics.earth_fraction * 100)}%
                </div>
              </div>

              {/* Max Dark Gap */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans font-medium text-[#171717] flex items-center space-x-2">
                  <Moon className="w-3.5 h-3.5 text-rose-500" />
                  <span>Longest Dark Gap</span>
                </div>
                <div className="col-span-3 text-right font-mono text-[#171717]">
                  {scenarioA.metrics.longest_dark_gap_h.toFixed(1)} h
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaDark <= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {deltaDark > 0 ? `+${deltaDark.toFixed(1)}h` : `${deltaDark.toFixed(1)}h`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-[#171717] font-semibold">
                  {scenarioB.metrics.longest_dark_gap_h.toFixed(1)} h
                </div>
              </div>

              {/* Max Comms Outage */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans font-medium text-[#171717] flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-purple-500" />
                  <span>Longest Comms Outage</span>
                </div>
                <div className="col-span-3 text-right font-mono text-purple-600 font-semibold">
                  {scenarioA.metrics.longest_comms_outage_h.toFixed(1)} h
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaOutage <= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {deltaOutage > 0 ? `+${deltaOutage.toFixed(1)}h` : `${deltaOutage.toFixed(1)}h`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-purple-600 font-bold">
                  {scenarioB.metrics.longest_comms_outage_h.toFixed(1)} h
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e5e5] bg-white flex justify-end">
          <button
            onClick={() => setIsComparisonOpen(false)}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#171717] rounded-full font-mono text-xs uppercase tracking-[0.25em] transition-all duration-500 ease-premium font-semibold"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
