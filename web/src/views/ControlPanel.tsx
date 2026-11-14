import React from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { Sliders, Sun, Radio, Clock, Shield, Info, Eye } from 'lucide-react';
import { MetricMode } from '../types';

export const ControlPanel: React.FC = () => {
  const { parameters, updateParameters, metricMode, setMetricMode, applyPreset } =
    usePlannerStore();

  return (
    <div className="w-80 h-full border-r border-[#e5e5e5] bg-[#fcfbf9] p-5 flex flex-col justify-between overflow-y-auto select-none text-[#171717]">
      <div className="space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3.5">
          <div className="flex items-center space-x-2.5 text-[#171717]">
            <Sliders className="w-4 h-4 text-[#4338ca]" />
            <h2 className="font-serif italic text-sm font-semibold tracking-wide">Mission Constraints</h2>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-indigo-50 text-[#4338ca] border border-indigo-200">
            EDITABLE
          </span>
        </div>

        {/* Preset quick buttons */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#171717]/60 block mb-2">
            Mission Profile Preset
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => applyPreset('artemis')}
              className={`p-2.5 text-xs rounded-xl border text-left transition-all duration-500 ease-premium ${
                parameters.stay_days === 6.5
                  ? 'bg-[#4338ca] border-[#4338ca] text-white shadow-md shadow-indigo-900/20'
                  : 'bg-white border-[#e5e5e5] text-[#171717] hover:border-[#4338ca] shadow-sm'
              }`}
            >
              <div className="font-serif font-medium">Artemis III</div>
              <div className={`font-mono text-[9px] tracking-[0.2em] uppercase mt-0.5 ${parameters.stay_days === 6.5 ? 'text-indigo-200' : 'text-[#171717]/50'}`}>
                6.5d Sortie
              </div>
            </button>
            <button
              onClick={() => applyPreset('clps')}
              className={`p-2.5 text-xs rounded-xl border text-left transition-all duration-500 ease-premium ${
                parameters.stay_days === 14.0
                  ? 'bg-[#4338ca] border-[#4338ca] text-white shadow-md shadow-indigo-900/20'
                  : 'bg-white border-[#e5e5e5] text-[#171717] hover:border-[#4338ca] shadow-sm'
              }`}
            >
              <div className="font-serif font-medium">CLPS Lander</div>
              <div className={`font-mono text-[9px] tracking-[0.2em] uppercase mt-0.5 ${parameters.stay_days === 14.0 ? 'text-indigo-200' : 'text-[#171717]/50'}`}>
                14d Lunar Day
              </div>
            </button>
            <button
              onClick={() => applyPreset('viper')}
              className={`p-2.5 text-xs rounded-xl border text-left transition-all duration-500 ease-premium ${
                parameters.stay_days === 21.0
                  ? 'bg-[#4338ca] border-[#4338ca] text-white shadow-md shadow-indigo-900/20'
                  : 'bg-white border-[#e5e5e5] text-[#171717] hover:border-[#4338ca] shadow-sm'
              }`}
            >
              <div className="font-serif font-medium">VIPER Rover</div>
              <div className={`font-mono text-[9px] tracking-[0.2em] uppercase mt-0.5 ${parameters.stay_days === 21.0 ? 'text-indigo-200' : 'text-[#171717]/50'}`}>
                21d Traverse
              </div>
            </button>
            <button
              onClick={() => applyPreset('habitat')}
              className={`p-2.5 text-xs rounded-xl border text-left transition-all duration-500 ease-premium ${
                parameters.stay_days === 28.0
                  ? 'bg-[#4338ca] border-[#4338ca] text-white shadow-md shadow-indigo-900/20'
                  : 'bg-white border-[#e5e5e5] text-[#171717] hover:border-[#4338ca] shadow-sm'
              }`}
            >
              <div className="font-serif font-medium">Base Camp</div>
              <div className={`font-mono text-[9px] tracking-[0.2em] uppercase mt-0.5 ${parameters.stay_days === 28.0 ? 'text-indigo-200' : 'text-[#171717]/50'}`}>
                28d Habitation
              </div>
            </button>
          </div>
        </div>

        {/* Heatmap Metric Display Mode */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#171717]/60 block mb-2">
            Heatmap Metric View
          </label>
          <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-full border border-[#e5e5e5] shadow-sm">
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
                className={`py-1 text-[11px] font-mono tracking-[0.2em] uppercase rounded-full transition-all duration-500 ease-premium ${
                  metricMode === m.id
                    ? 'bg-[#4338ca] text-white font-semibold shadow-sm'
                    : 'text-[#171717]/60 hover:text-[#171717]'
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
              <span className="text-[#171717] font-sans flex items-center space-x-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#4338ca]" />
                <span>Stay Duration</span>
              </span>
              <span className="font-mono text-[#4338ca] font-semibold">{parameters.stay_days} d</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="28.0"
              step="0.5"
              value={parameters.stay_days}
              onChange={(e) => updateParameters({ stay_days: parseFloat(e.target.value) })}
              className="w-full accent-[#4338ca] h-1.5 bg-[#e5e5e5] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-[#171717]/50 mt-1">
              <span>1d</span>
              <span>14d</span>
              <span>28d</span>
            </div>
          </div>

          {/* Min Sun Fraction */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#171717] font-sans flex items-center space-x-1.5 font-medium">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Min Sun Fraction</span>
              </span>
              <span className="font-mono text-amber-600 font-semibold">
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
              className="w-full accent-amber-500 h-1.5 bg-[#e5e5e5] rounded-lg cursor-pointer"
            />
          </div>

          {/* Max Dark Gap */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#171717] font-sans flex items-center space-x-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>Max Dark Gap</span>
              </span>
              <span className="font-mono text-rose-600 font-semibold">
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
              className="w-full accent-rose-500 h-1.5 bg-[#e5e5e5] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-[#171717]/50 mt-1">
              <span>6h</span>
              <span>24h (battery)</span>
              <span>72h</span>
            </div>
          </div>

          {/* Lit Threshold */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#171717] font-sans flex items-center space-x-1.5 font-medium">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span>Solar Disc Lit Threshold</span>
              </span>
              <span className="font-mono text-[#4338ca] font-semibold">
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
              className="w-full accent-[#4338ca] h-1.5 bg-[#e5e5e5] rounded-lg cursor-pointer"
            />
          </div>

          {/* Min Earth Fraction */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#171717] font-sans flex items-center space-x-1.5 font-medium">
                <Radio className="w-3.5 h-3.5 text-sky-500" />
                <span>Min Earth Visibility</span>
              </span>
              <span className="font-mono text-sky-600 font-semibold">
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
              className="w-full accent-sky-500 h-1.5 bg-[#e5e5e5] rounded-lg cursor-pointer"
            />
          </div>

          {/* Antenna Mask */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#171717] font-sans flex items-center space-x-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-purple-500" />
                <span>Antenna Horizon Mask</span>
              </span>
              <span className="font-mono text-purple-600 font-semibold">
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
              className="w-full accent-purple-500 h-1.5 bg-[#e5e5e5] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-[#171717]/50 mt-1">
              <span>0° (Terrain LOS)</span>
              <span>+2.5°</span>
              <span>+5.0° (Multipath)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology & Assumptions Footer Note */}
      <div className="mt-6 p-4 bg-white rounded-xl border border-[#e5e5e5] shadow-sm text-[11px] text-[#171717]/70 space-y-2">
        <div className="flex items-center space-x-2 text-[#171717] font-medium">
          <Info className="w-3.5 h-3.5 text-[#4338ca] flex-shrink-0" />
          <span className="font-serif italic font-semibold">Modeling Assumptions</span>
        </div>
        <p className="font-sans text-[10px] leading-relaxed text-[#171717]/60">
          Thresholds are mission planning assumptions, not rigid constraints. Observer height is 2.0 m
          above LOLA 80 m DEM terrain in the MOON_ME reference frame.
        </p>
      </div>
    </div>
  );
};
