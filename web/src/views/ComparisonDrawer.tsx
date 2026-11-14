import React, { useState } from 'react';
import { usePlannerStore, PinnedScenario } from '../state/usePlannerStore';
import { X, ArrowRight, CheckCircle2, AlertTriangle, Layers, Sun, Radio, Moon, Trophy } from 'lucide-react';

export const ComparisonDrawer: React.FC = () => {
  const {
    isComparisonOpen,
    setIsComparisonOpen,
    pinnedScenarios,
    removePinnedScenario,
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Two-Scenario Mission Comparison
              </h2>
              <p className="text-xs text-slate-400">
                Evaluate slip alternatives, power margins, and communication windows side-by-side.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsComparisonOpen(false)}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Scenario A (Baseline)
              </label>
              <select
                value={slotAId}
                onChange={(e) => setSlotAId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
              >
                {allAvailable.map((s) => (
                  <option key={`a-${s.id}`} value={s.id}>
                    {s.name} • {s.dateUtc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Scenario B (Alternative)
              </label>
              <select
                value={slotBId}
                onChange={(e) => setSlotBId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
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
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                scenarioA.metrics.viable
                  ? 'bg-slate-900/40 border-slate-800'
                  : 'bg-rose-950/20 border-rose-900/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{scenarioA.siteName}</h3>
                  <div className="text-xs font-mono text-cyan-400 mt-0.5">
                    Date: {scenarioA.dateUtc} (Slip: {scenarioA.slipDays >= 0 ? `+${scenarioA.slipDays}` : scenarioA.slipDays}d)
                  </div>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    scenarioA.metrics.viable
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-700/60'
                      : 'bg-rose-950 text-rose-400 border-rose-700/60'
                  }`}
                >
                  {scenarioA.metrics.viable ? 'VIABLE' : 'FAILED'}
                </div>
              </div>

              <button
                onClick={() => applyScenario(scenarioA)}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition"
              >
                Adopt Scenario A
              </button>
            </div>

            {/* Scenario B Card */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                scenarioB.metrics.viable
                  ? 'bg-slate-900/40 border-cyan-500/40'
                  : 'bg-rose-950/20 border-rose-900/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{scenarioB.siteName}</h3>
                  <div className="text-xs font-mono text-cyan-400 mt-0.5">
                    Date: {scenarioB.dateUtc} (Slip: {scenarioB.slipDays >= 0 ? `+${scenarioB.slipDays}` : scenarioB.slipDays}d)
                  </div>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    scenarioB.metrics.viable
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-700/60'
                      : 'bg-rose-950 text-rose-400 border-rose-700/60'
                  }`}
                >
                  {scenarioB.metrics.viable ? 'VIABLE' : 'FAILED'}
                </div>
              </div>

              <button
                onClick={() => applyScenario(scenarioB)}
                className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition shadow-lg shadow-cyan-950/50"
              >
                Adopt Scenario B
              </button>
            </div>
          </div>

          {/* Metric Rows Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <div className="grid grid-cols-12 bg-slate-900/80 px-4 py-2.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <div className="col-span-5">Metric</div>
              <div className="col-span-3 text-right">Scenario A</div>
              <div className="col-span-1 text-center">Δ</div>
              <div className="col-span-3 text-right">Scenario B</div>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              {/* Composite Score */}
              <div className="grid grid-cols-12 px-4 py-2.5 items-center">
                <div className="col-span-5 font-medium text-slate-200 flex items-center space-x-2">
                  <Trophy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mission Score</span>
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-slate-100">
                  {(scenarioA.metrics.score * 100).toFixed(1)}
                </div>
                <div className="col-span-1 text-center font-mono font-bold text-[11px]">
                  <span className={deltaScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaScore >= 0 ? `+${deltaScore}` : deltaScore}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-cyan-300">
                  {(scenarioB.metrics.score * 100).toFixed(1)}
                </div>
              </div>

              {/* Sun Lit % */}
              <div className="grid grid-cols-12 px-4 py-2.5 items-center">
                <div className="col-span-5 font-medium text-slate-200 flex items-center space-x-2">
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
              <div className="grid grid-cols-12 px-4 py-2.5 items-center">
                <div className="col-span-5 font-medium text-slate-200 flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-blue-400" />
                  <span>Earth Direct LOS</span>
                </div>
                <div className="col-span-3 text-right font-mono text-blue-300">
                  {Math.round(scenarioA.metrics.earth_fraction * 100)}%
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaEarth >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaEarth >= 0 ? `+${deltaEarth}%` : `${deltaEarth}%`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-blue-300 font-semibold">
                  {Math.round(scenarioB.metrics.earth_fraction * 100)}%
                </div>
              </div>

              {/* Max Dark Gap */}
              <div className="grid grid-cols-12 px-4 py-2.5 items-center">
                <div className="col-span-5 font-medium text-slate-200 flex items-center space-x-2">
                  <Moon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Longest Dark Gap</span>
                </div>
                <div className="col-span-3 text-right font-mono text-slate-200">
                  {scenarioA.metrics.longest_dark_gap_h.toFixed(1)} h
                </div>
                <div className="col-span-1 text-center font-mono text-[11px]">
                  <span className={deltaDark <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaDark > 0 ? `+${deltaDark.toFixed(1)}h` : `${deltaDark.toFixed(1)}h`}
                  </span>
                </div>
                <div className="col-span-3 text-right font-mono text-slate-200 font-semibold">
                  {scenarioB.metrics.longest_dark_gap_h.toFixed(1)} h
                </div>
              </div>

              {/* Max Comms Outage */}
              <div className="grid grid-cols-12 px-4 py-2.5 items-center">
                <div className="col-span-5 font-medium text-slate-200 flex items-center space-x-2">
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
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={() => setIsComparisonOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
