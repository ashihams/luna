import React from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sun, Radio, Moon, Sparkles } from 'lucide-react';

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
    <div className="border-t border-white/10 bg-[#080808]/90 backdrop-blur-xl p-4 space-y-3.5 select-none text-white">
      {/* Top row: Slip slider and date delta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Date mapping */}
        <div className="flex items-center space-x-3">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl px-4 py-2">
            <div className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
              Planned Launch
            </div>
            <div className="text-sm font-mono font-semibold text-amber-300">{plannedDateStr}</div>
          </div>

          <div className="text-white/20 font-serif text-lg">→</div>

          <div
            className={`rounded-2xl px-4 py-2 border transition duration-300 ease-snappy ${
              analysis.isViable
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_-5px_#10B981]'
                : 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_-5px_#EF4444]'
            }`}
          >
            <div className="flex items-center justify-between font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
              <span>Slipped Landing</span>
              <span className="font-mono text-purple-300 ml-2 font-bold">
                {slipDays >= 0 ? `+${slipDays}` : slipDays}d
              </span>
            </div>
            <div
              className={`text-sm font-mono font-semibold ${
                analysis.isViable ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {slippedDateStr}
            </div>
          </div>

          {/* Quick buttons */}
          <div className="hidden sm:flex items-center space-x-1.5">
            {quickDeltas.map((d) => (
              <button
                key={d}
                onClick={() => setSlipDays(d)}
                className={`px-3 py-1 text-xs font-mono rounded-full transition duration-300 ease-snappy ${
                  slipDays === d
                    ? 'bg-[#8B5CF6] text-white font-bold shadow-[0_0_12px_-5px_#8B5CF6]'
                    : 'bg-white/[0.02] text-neutral-400 hover:text-white border border-white/10'
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
            className={`px-4 py-2 rounded-2xl border flex items-center space-x-3 transition duration-300 ease-snappy ${
              analysis.isViable
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_-5px_#10B981]'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300 shadow-[0_0_15px_-5px_#EF4444]'
            }`}
          >
            {analysis.isViable ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <div>
              <div className="font-serif text-sm font-normal leading-tight text-white">
                {analysis.isViable
                  ? 'Site Viable for Sortie'
                  : slipDays === 0
                  ? 'Baseline Date Unfeasible'
                  : 'Mission Slip Unfeasible'}
              </div>
              <div className="font-sans text-[11px] text-neutral-400 font-light">
                {analysis.isViable
                  ? `${parameters.stay_days}d window satisfies solar & direct-Earth constraints`
                  : failureReasons.join('; ') || 'Thresholds violated'}
              </div>
            </div>
          </div>

          {/* Slip tolerance info */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl px-4 py-2 text-xs">
            <div className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest">Slip Tolerance</div>
            {analysis.slipToleranceDays >= 0 ? (
              <div className="font-mono font-semibold flex items-center space-x-1.5 mt-0.5">
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
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-mono uppercase tracking-widest">
                    FRAGILE
                  </span>
                )}
              </div>
            ) : (
              <div className="font-mono text-rose-400 font-semibold mt-0.5">
                0 days (Planned non-viable)
              </div>
            )}
          </div>

          {/* Earliest recovery */}
          {!analysis.isViable && analysis.earliestRecoveryDays !== null && (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl px-4 py-2 text-xs">
              <div className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest">Recovery Window</div>
              <div className="font-mono font-semibold text-cyan-300 mt-0.5">
                In +{analysis.earliestRecoveryDays} days
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs text-neutral-400 font-sans">
          <span>Slip Slider: Drag to simulate launch delays across lunar synodic cycles</span>
          <span className="font-mono text-purple-300 font-semibold">
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
          className="w-full accent-[#8B5CF6] h-2 bg-white/10 rounded-full cursor-pointer"
        />
        <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest text-neutral-500">
          <span>-15d</span>
          <span>0d (Baseline)</span>
          <span>+15d</span>
          <span>+30d (1 lunar day)</span>
          <span>+45d</span>
          <span>+60d</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-xs">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 hover:border-white/15 transition duration-300 ease-snappy">
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 flex items-center space-x-1.5">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Sun Fraction</span>
          </div>
          <div className="font-mono text-lg font-semibold text-amber-300 mt-0.5">
            {Math.round(metrics.sun_fraction * 100)}%
          </div>
          <div className="font-sans text-[10px] text-neutral-500 font-light">Min: {Math.round(parameters.min_sun_fraction * 100)}%</div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 hover:border-white/15 transition duration-300 ease-snappy">
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 flex items-center space-x-1.5">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>Earth Comms</span>
          </div>
          <div className="font-mono text-lg font-semibold text-cyan-300 mt-0.5">
            {Math.round(metrics.earth_fraction * 100)}%
          </div>
          <div className="font-sans text-[10px] text-neutral-500 font-light">Min: {Math.round(parameters.min_earth_fraction * 100)}%</div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 hover:border-white/15 transition duration-300 ease-snappy">
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 flex items-center space-x-1.5">
            <Moon className="w-3 h-3 text-rose-400" />
            <span>Max Dark Gap</span>
          </div>
          <div
            className={`font-mono text-lg font-semibold mt-0.5 ${
              metrics.longest_dark_gap_h > parameters.max_dark_gap_hours
                ? 'text-rose-400'
                : 'text-white'
            }`}
          >
            {metrics.longest_dark_gap_h.toFixed(1)} h
          </div>
          <div className="font-sans text-[10px] text-neutral-500 font-light">Limit: {parameters.max_dark_gap_hours}h</div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 hover:border-white/15 transition duration-300 ease-snappy">
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 flex items-center space-x-1.5">
            <Radio className="w-3 h-3 text-purple-400" />
            <span>Max Outage</span>
          </div>
          <div className="font-mono text-lg font-semibold text-purple-300 mt-0.5">
            {metrics.longest_comms_outage_h.toFixed(1)} h
          </div>
          <div className="font-sans text-[10px] text-neutral-500 font-light">Direct LOS Outage</div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 hover:border-white/15 transition duration-300 ease-snappy">
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>Viability Score</span>
          </div>
          <div className="font-mono text-lg font-semibold text-purple-300 mt-0.5">
            {(metrics.score * 100).toFixed(1)}
            <span className="text-xs text-neutral-500 font-normal">/100</span>
          </div>
          <div className="font-sans text-[10px] text-neutral-500 truncate font-light">{selectedSite?.name.split('(')[0]}</div>
        </div>
      </div>
    </div>
  );
};
