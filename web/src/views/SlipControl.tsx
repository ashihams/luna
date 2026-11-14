import React from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert, Sparkles, Sun, Radio, Moon } from 'lucide-react';

export const SlipControl: React.FC = () => {
  const {
    plannedDayIndex,
    slipDays,
    setSlipDays,
    manifest,
    getSlipAnalysis,
    parameters,
    sites,
    selectedSiteId,
  } = usePlannerStore();

  const analysis = getSlipAnalysis();
  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  if (!manifest || !analysis) return null;

  const baseDate = new Date(manifest.time.t0_utc);

  const plannedDate = new Date(baseDate);
  plannedDate.setUTCDate(plannedDate.getUTCDate() + analysis.plannedDayIndex);
  const plannedDateStr = plannedDate.toISOString().split('T')[0];

  const slippedDate = new Date(baseDate);
  slippedDate.setUTCDate(slippedDate.getUTCDate() + analysis.slippedDayIndex);
  const slippedDateStr = slippedDate.toISOString().split('T')[0];

  const metrics = analysis.cellMetrics;

  // Determine failure reason if non-viable
  const failureReasons: string[] = [];
  if (metrics.sun_fraction < parameters.min_sun_fraction) {
    failureReasons.push(
      `Sun fraction ${Math.round(metrics.sun_fraction * 100)}% < ${Math.round(
        parameters.min_sun_fraction * 100
      )}%`
    );
  }
  if (metrics.earth_fraction < parameters.min_earth_fraction) {
    failureReasons.push(
      `Earth comms ${Math.round(metrics.earth_fraction * 100)}% < ${Math.round(
        parameters.min_earth_fraction * 100
      )}%`
    );
  }
  if (metrics.longest_dark_gap_h > parameters.max_dark_gap_hours) {
    failureReasons.push(
      `Max dark gap ${metrics.longest_dark_gap_h.toFixed(1)}h > ${parameters.max_dark_gap_hours}h limit`
    );
  }

  const quickDeltas = [-7, -1, 0, 1, 3, 7, 14, 28];

  return (
    <div className="border-t border-slate-800 bg-slate-950/80 p-3.5 space-y-3">
      {/* Top row: Slip slider and date delta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Date mapping */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Planned Launch
            </div>
            <div className="text-sm font-mono font-bold text-amber-400">{plannedDateStr}</div>
          </div>

          <div className="text-slate-600 font-bold">→</div>

          <div
            className={`rounded-lg px-3 py-1.5 border ${
              analysis.isViable
                ? 'bg-emerald-950/30 border-emerald-700/50'
                : 'bg-rose-950/30 border-rose-700/50'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              <span>Slipped Landing</span>
              <span className="font-mono text-cyan-400 ml-2">
                {slipDays >= 0 ? `+${slipDays}` : slipDays} days
              </span>
            </div>
            <div
              className={`text-sm font-mono font-bold ${
                analysis.isViable ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {slippedDateStr}
            </div>
          </div>

          {/* Quick buttons */}
          <div className="hidden sm:flex items-center space-x-1">
            {quickDeltas.map((d) => (
              <button
                key={d}
                onClick={() => setSlipDays(d)}
                className={`px-2 py-1 text-xs font-mono rounded transition ${
                  slipDays === d
                    ? 'bg-cyan-500 text-black font-bold shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {d === 0 ? 'RESET' : d > 0 ? `+${d}d` : `${d}d`}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Viability / Tolerance Badge */}
        <div className="flex items-center space-x-3">
          <div
            className={`px-3.5 py-2 rounded-lg border flex items-center space-x-2.5 ${
              analysis.isViable
                ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-300'
                : 'bg-rose-950/50 border-rose-600/60 text-rose-300'
            }`}
          >
            {analysis.isViable ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold leading-tight">
                {analysis.isViable ? 'SITE VIABLE FOR SORTIE' : 'MISSION SLIP UNFEASIBLE'}
              </div>
              <div className="text-[10px] text-slate-300 font-medium">
                {analysis.isViable
                  ? `${parameters.stay_days}d window satisfies all solar & direct-Earth constraints`
                  : failureReasons.join('; ') || 'Thresholds violated'}
              </div>
            </div>
          </div>

          {/* Slip tolerance info */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Slip Tolerance</div>
            {analysis.slipToleranceDays >= 0 ? (
              <div className="font-mono font-bold flex items-center space-x-1">
                <span
                  className={
                    analysis.isFragile
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {analysis.slipToleranceDays} continuous days
                </span>
                {analysis.isFragile && (
                  <span className="text-[10px] px-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                    FRAGILE
                  </span>
                )}
              </div>
            ) : (
              <div className="font-mono text-rose-400 font-semibold">
                0 days (Planned date non-viable)
              </div>
            )}
          </div>

          {/* Earliest recovery */}
          {!analysis.isViable && analysis.earliestRecoveryDays !== null && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Recovery Window</div>
              <div className="font-mono font-bold text-cyan-400">
                In +{analysis.earliestRecoveryDays} days
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Slip Slider: Drag to simulate launch delays</span>
          <span className="font-mono text-cyan-400 font-semibold">
            {slipDays > 0 ? `+${slipDays} days slip` : slipDays === 0 ? 'On-schedule (0 days)' : `${slipDays} days early`}
          </span>
        </div>
        <input
          type="range"
          min="-15"
          max="60"
          step="1"
          value={slipDays}
          onChange={(e) => setSlipDays(parseInt(e.target.value))}
          className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>-15d</span>
          <span>0d (Baseline)</span>
          <span>+15d</span>
          <span>+30d (1 lunar day)</span>
          <span>+45d</span>
          <span>+60d</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
        <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
          <div className="text-[10px] text-slate-500 flex items-center space-x-1">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Sun Fraction</span>
          </div>
          <div className="font-mono text-base font-bold text-amber-300">
            {Math.round(metrics.sun_fraction * 100)}%
          </div>
          <div className="text-[9px] text-slate-500">Min: {Math.round(parameters.min_sun_fraction * 100)}%</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
          <div className="text-[10px] text-slate-500 flex items-center space-x-1">
            <Radio className="w-3 h-3 text-blue-400" />
            <span>Earth Comms</span>
          </div>
          <div className="font-mono text-base font-bold text-blue-300">
            {Math.round(metrics.earth_fraction * 100)}%
          </div>
          <div className="text-[9px] text-slate-500">Min: {Math.round(parameters.min_earth_fraction * 100)}%</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
          <div className="text-[10px] text-slate-500 flex items-center space-x-1">
            <Moon className="w-3 h-3 text-rose-400" />
            <span>Max Dark Gap</span>
          </div>
          <div
            className={`font-mono text-base font-bold ${
              metrics.longest_dark_gap_h > parameters.max_dark_gap_hours
                ? 'text-rose-400'
                : 'text-slate-200'
            }`}
          >
            {metrics.longest_dark_gap_h.toFixed(1)} h
          </div>
          <div className="text-[9px] text-slate-500">Max limit: {parameters.max_dark_gap_hours}h</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
          <div className="text-[10px] text-slate-500 flex items-center space-x-1">
            <Radio className="w-3 h-3 text-purple-400" />
            <span>Max Outage</span>
          </div>
          <div className="font-mono text-base font-bold text-purple-300">
            {metrics.longest_comms_outage_h.toFixed(1)} h
          </div>
          <div className="text-[9px] text-slate-500">Earth LOS outage</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
          <div className="text-[10px] text-slate-500 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Score</span>
          </div>
          <div className="font-mono text-base font-bold text-cyan-300">
            {(metrics.score * 100).toFixed(1)}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
          <div className="text-[9px] text-slate-500">{selectedSite?.name.split('(')[0]}</div>
        </div>
      </div>
    </div>
  );
};
