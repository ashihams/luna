import React, { useState } from 'react';
import { parseUtc } from '../data/science';
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
  const baseDate = parseUtc(manifest.time.t0_utc);
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
      complete: false,
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none text-white">
      <div className="w-full max-w-4xl bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_-10px_rgba(139,92,246,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center shadow-[0_0_12px_#8B5CF6]">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-normal text-white tracking-tight">
                Two-Scenario Mission Comparison
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                LOLA HORIZONS • POWER MARGINS • EARTH COMMS WINDOWS
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsComparisonOpen(false)}
            className="p-2 rounded-full bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] transition duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-mono text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                Scenario A (Baseline)
              </label>
              <select
                value={slotAId}
                onChange={(e) => setSlotAId(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
              >
                {allAvailable.map((s) => (
                  <option key={`a-${s.id}`} value={s.id}>
                    {s.name} • {s.dateUtc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                Scenario B (Alternative)
              </label>
              <select
                value={slotBId}
                onChange={(e) => setSlotBId(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
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
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 transition duration-300 ease-snappy ${
                scenarioA.metrics.viable
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-rose-950/20 border-rose-900/40'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-normal text-white">{scenarioA.siteName}</h3>
                  <div className="font-mono text-[11px] text-purple-300 mt-1">
                    Date: {scenarioA.dateUtc} (Slip: {scenarioA.slipDays >= 0 ? `+${scenarioA.slipDays}` : scenarioA.slipDays}d)
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider font-semibold border ${
                    scenarioA.metrics.viable
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {scenarioA.metrics.viable ? 'VIABLE' : 'FAILED'}
                </div>
              </div>

              <button
                onClick={() => applyScenario(scenarioA)}
                className="w-full py-2 px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-sans text-xs text-white transition duration-300 ease-snappy"
              >
                Adopt Scenario A
              </button>
            </div>

            {/* Scenario B Card */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 transition duration-300 ease-snappy ${
                scenarioB.metrics.viable
                  ? 'bg-violet-950/20 border-violet-500/40 shadow-[0_0_20px_-10px_#8B5CF6]'
                  : 'bg-rose-950/20 border-rose-900/40'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-normal text-white">{scenarioB.siteName}</h3>
                  <div className="font-mono text-[11px] text-purple-300 mt-1">
                    Date: {scenarioB.dateUtc} (Slip: {scenarioB.slipDays >= 0 ? `+${scenarioB.slipDays}` : scenarioB.slipDays}d)
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider font-semibold border ${
                    scenarioB.metrics.viable
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {scenarioB.metrics.viable ? 'VIABLE' : 'FAILED'}
                </div>
              </div>

              <button
                onClick={() => applyScenario(scenarioB)}
                className="w-full py-2 px-3 rounded-full bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-sans text-xs font-semibold transition duration-300 ease-snappy shadow-[0_0_15px_-5px_#8B5CF6]"
              >
                Adopt Scenario B
              </button>
            </div>
          </div>

          {/* Metric Rows Table */}
          <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
            <div className="grid grid-cols-12 bg-white/[0.03] px-5 py-3 font-mono text-[10px] font-semibold text-neutral-400 border-b border-white/5 uppercase tracking-widest">
              <div className="col-span-5">Metric</div>
              <div className="col-span-3 text-right">Scenario A</div>
              <div className="col-span-1 text-center">Δ</div>
              <div className="col-span-3 text-right">Scenario B</div>
            </div>

            <div className="divide-y divide-white/5 text-xs">
              {/* Composite Score */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans text-white flex items-center space-x-2">
                  <Trophy className="w-3.5 h-3.5 text-violet-400" />
                  <span>Mission Viability Score</span>
                </div>
                <div className="col-span-3 text-right font-mono font-medium text-white/90">
                  {(scenarioA.metrics.score * 100).toFixed(1)}
                </div>
                <div className="col-span-1 text-center font-mono font-semibold text-[11px]">
                  <span className={deltaScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaScore >= 0 ? `+${deltaScore}` : deltaScore}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-purple-300">
                  {(scenarioB.metrics.score * 100).toFixed(1)}
                </div>
              </div>

              {/* Sun Lit % */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans text-white flex items-center space-x-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Solar Illumination</span>
                </div>
                <div className="col-span-3 text-right font-mono text-amber-300">
                  {Math.round(scenarioA.metrics.sun_fraction * 100)}%
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaSun >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaSun >= 0 ? `+${deltaSun}%` : `${deltaSun}%`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-amber-300 font-semibold">
                  {Math.round(scenarioB.metrics.sun_fraction * 100)}%
                </div>
              </div>

              {/* Earth Comms % */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans text-white flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Earth Direct LOS</span>
                </div>
                <div className="col-span-3 text-right font-mono text-cyan-300">
                  {Math.round(scenarioA.metrics.earth_fraction * 100)}%
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaEarth >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaEarth >= 0 ? `+${deltaEarth}%` : `${deltaEarth}%`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-cyan-300 font-semibold">
                  {Math.round(scenarioB.metrics.earth_fraction * 100)}%
                </div>
              </div>

              {/* Max Dark Gap */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans text-white flex items-center space-x-2">
                  <Moon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Longest Dark Gap</span>
                </div>
                <div className="col-span-3 text-right font-mono text-white/90">
                  {scenarioA.metrics.longest_dark_gap_h.toFixed(1)} h
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaDark <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaDark > 0 ? `+${deltaDark.toFixed(1)}h` : `${deltaDark.toFixed(1)}h`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-white font-semibold">
                  {scenarioB.metrics.longest_dark_gap_h.toFixed(1)} h
                </div>
              </div>

              {/* Max Comms Outage */}
              <div className="grid grid-cols-12 px-5 py-3 items-center">
                <div className="col-span-5 font-sans text-white flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  <span>Longest Comms Outage</span>
                </div>
                <div className="col-span-3 text-right font-mono text-purple-300">
                  {scenarioA.metrics.longest_comms_outage_h.toFixed(1)} h
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaOutage <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaOutage > 0 ? `+${deltaOutage.toFixed(1)}h` : `${deltaOutage.toFixed(1)}h`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-purple-300 font-semibold">
                  {scenarioB.metrics.longest_comms_outage_h.toFixed(1)} h
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={() => setIsComparisonOpen(false)}
            className="px-6 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-full font-sans text-xs font-semibold transition duration-200"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
