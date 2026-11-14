import React from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { Sliders, Sun, Radio, Clock, Shield, Info, Eye } from 'lucide-react';
import { MetricMode } from '../types';

export const ControlPanel: React.FC = () => {
  const { parameters, updateParameters, metricMode, setMetricMode, applyPreset } =
    usePlannerStore();

  return (
    <div className="w-80 h-full border-r border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-5">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-slate-200">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Mission Constraints</h2>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">EDITABLE</span>
        </div>

        {/* Preset quick buttons */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Mission Profile Preset
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => applyPreset('artemis')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border text-left transition ${
                parameters.stay_days === 6.5
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold">Artemis III</div>
              <div className="text-[10px] text-slate-400">6.5d Sortie</div>
            </button>
            <button
              onClick={() => applyPreset('clps')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border text-left transition ${
                parameters.stay_days === 14.0
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold">CLPS Lander</div>
              <div className="text-[10px] text-slate-400">14d Lunar Day</div>
            </button>
            <button
              onClick={() => applyPreset('viper')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border text-left transition ${
                parameters.stay_days === 21.0
                  ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold">VIPER Rover</div>
              <div className="text-[10px] text-slate-400">21d Traverse</div>
            </button>
            <button
              onClick={() => applyPreset('habitat')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border text-left transition ${
                parameters.stay_days === 28.0
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold">Base Camp</div>
              <div className="text-[10px] text-slate-400">28d Habitation</div>
            </button>
          </div>
        </div>

        {/* Heatmap Metric Display Mode */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Heatmap Metric View
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {(
              [
                { id: 'combined', label: 'Combined' },
                { id: 'power', label: 'Solar' },
                { id: 'comms', label: 'Earth' },
              ] as { id: MetricMode; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMetricMode(m.id)}
                className={`py-1 text-xs font-medium rounded transition ${
                  metricMode === m.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4 pt-1">
          {/* Stay Duration */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Stay Duration</span>
              </span>
              <span className="font-mono text-cyan-400 font-semibold">{parameters.stay_days} d</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="28.0"
              step="0.5"
              value={parameters.stay_days}
              onChange={(e) => updateParameters({ stay_days: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>1 day</span>
              <span>14 days</span>
              <span>28 days</span>
            </div>
          </div>

          {/* Min Sun Fraction */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Min Sun Fraction</span>
              </span>
              <span className="font-mono text-amber-400 font-semibold">
                {Math.round(parameters.min_sun_fraction * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="1.00"
              step="0.05"
              value={parameters.min_sun_fraction}
              onChange={(e) => updateParameters({ min_sun_fraction: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Max Dark Gap */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Max Dark Gap</span>
              </span>
              <span className="font-mono text-rose-400 font-semibold">
                {parameters.max_dark_gap_hours} hrs
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="72"
              step="2"
              value={parameters.max_dark_gap_hours}
              onChange={(e) => updateParameters({ max_dark_gap_hours: parseInt(e.target.value) })}
              className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>6h</span>
              <span>24h (battery)</span>
              <span>72h</span>
            </div>
          </div>

          {/* Lit Threshold */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-yellow-400" />
                <span>Solar Disc Lit Threshold</span>
              </span>
              <span className="font-mono text-yellow-400 font-semibold">
                {parameters.lit_threshold_pct}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={parameters.lit_threshold_pct}
              onChange={(e) => updateParameters({ lit_threshold_pct: parseInt(e.target.value) })}
              className="w-full accent-yellow-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Min Earth Fraction */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                <span>Min Earth Visibility</span>
              </span>
              <span className="font-mono text-blue-400 font-semibold">
                {Math.round(parameters.min_earth_fraction * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="1.00"
              step="0.05"
              value={parameters.min_earth_fraction}
              onChange={(e) => updateParameters({ min_earth_fraction: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Antenna Mask */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Antenna Horizon Mask</span>
              </span>
              <span className="font-mono text-purple-400 font-semibold">
                +{parameters.antenna_mask_deg.toFixed(1)}°
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="5.0"
              step="0.5"
              value={parameters.antenna_mask_deg}
              onChange={(e) => updateParameters({ antenna_mask_deg: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0° (Terrain LOS)</span>
              <span>+2.5°</span>
              <span>+5.0° (Multipath)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology & Assumptions Footer Note */}
      <div className="mt-4 p-3 bg-slate-900/80 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
          <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>Modeling Assumptions</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          Thresholds are mission planning assumptions, not rigid constraints. Observer height is 2.0 m
          above LOLA 80 m DEM terrain in the MOON_ME reference frame.
        </p>
      </div>
    </div>
  );
};
