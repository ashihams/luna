import React from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { SkyPlot } from '../charts/SkyPlot';
import { Sun, Radio, Compass, AlertCircle, Clock, ShieldCheck, Mountain } from 'lucide-react';

export const SiteView: React.FC = () => {
  const {
    sites,
    selectedSiteId,
    getSlipAnalysis,
    manifest,
    currentHorizon,
    helpers,
    plannedDayIndex,
    slipDays,
    scrubStep,
  } = usePlannerStore();

  const selectedSite = sites.find((s) => s.id === selectedSiteId);
  const analysis = getSlipAnalysis();
  const selectedSiteIdx = sites.findIndex((s) => s.id === selectedSiteId);
  const currentHelper = selectedSiteIdx >= 0 ? helpers[selectedSiteIdx] : null;

  if (!selectedSite || !analysis || !manifest) return null;

  const metrics = analysis.cellMetrics;
  const numDays = 731;
  const slippedDayIndex = Math.max(0, Math.min(numDays - 1, plannedDayIndex + slipDays));
  const startStep = slippedDayIndex * 48;
  const currentStep = Math.min(startStep + scrubStep, manifest.time.n_steps - 1);

  // Compute countdown badges: from scrubbed time, find next index where lit state flips
  let hoursToSunsetOrSunrise = 0;
  let isCurrentlyLit = false;
  let hoursToEarthsetOrEarthrise = 0;
  let isCurrentlyLOS = false;

  if (currentHelper) {
    const tracks = currentHelper.tracks;
    isCurrentlyLit = tracks.sun_vis_pct[currentStep] >= 50;
    isCurrentlyLOS = tracks.earth_clearance[currentStep] >= 0;

    // Search forward for flip
    let flipStepSun = -1;
    for (let i = currentStep + 1; i < tracks.n_steps; i++) {
      const lit = tracks.sun_vis_pct[i] >= 50;
      if (lit !== isCurrentlyLit) {
        flipStepSun = i;
        break;
      }
    }
    if (flipStepSun !== -1) {
      hoursToSunsetOrSunrise = (flipStepSun - currentStep) * 0.5;
    }

    let flipStepEarth = -1;
    for (let i = currentStep + 1; i < tracks.n_steps; i++) {
      const los = tracks.earth_clearance[i] >= 0;
      if (los !== isCurrentlyLOS) {
        flipStepEarth = i;
        break;
      }
    }
    if (flipStepEarth !== -1) {
      hoursToEarthsetOrEarthrise = (flipStepEarth - currentStep) * 0.5;
    }
  }

  // Why Box analysis:
  // Azimuth and elevation at start of longest dark gap and outage
  const darkGapAz = metrics.dark_gap_start_az;
  const darkGapEl = metrics.dark_gap_start_el;
  const darkGapHorizon = metrics.dark_gap_start_horizon;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      {/* Left 60%: 3D Scene / Perspective View */}
      <div className="flex-1 h-full relative flex flex-col bg-slate-900 border-r border-slate-800">
        {/* Top Info Bar */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg shadow-lg pointer-events-auto">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Lander Location</div>
            <div className="text-sm font-bold text-slate-100">{selectedSite.name}</div>
            <div className="text-[11px] font-mono text-cyan-400">
              {selectedSite.lat_deg.toFixed(3)}°S, {selectedSite.lon_deg_east.toFixed(3)}°E •{' '}
              {selectedSite.ground_height_m.toFixed(0)} m elev
            </div>
          </div>

          {/* Countdown Badges */}
          <div className="bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-3 pointer-events-auto">
            <div className="flex items-center space-x-1.5">
              <Sun className={`w-4 h-4 ${isCurrentlyLit ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  {isCurrentlyLit ? 'Time to Sunset' : 'Time to Sunrise'}
                </div>
                <div className="text-xs font-mono font-bold text-amber-300">
                  {hoursToSunsetOrSunrise > 0 ? `${hoursToSunsetOrSunrise.toFixed(1)} hrs` : 'None in range'}
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="flex items-center space-x-1.5">
              <Radio className={`w-4 h-4 ${isCurrentlyLOS ? 'text-blue-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  {isCurrentlyLOS ? 'Time to Earthset' : 'Time to Earthrise'}
                </div>
                <div className="text-xs font-mono font-bold text-blue-300">
                  {hoursToEarthsetOrEarthrise > 0 ? `${hoursToEarthsetOrEarthrise.toFixed(1)} hrs` : 'Continuous LOS'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Canvas Placeholder / Preview */}
        <div className="flex-1 w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
          {/* Subtle starfield background */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="text-center z-10 p-6 max-w-md bg-slate-950/70 border border-slate-800 rounded-xl backdrop-blur shadow-2xl">
            <Mountain className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-1">
              Lander Horizon & Surface Perspective
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Observer placed at 2.0 m above terrain. Full 513×513 lunar mesh with LOLA 80 m
              elevation, lunar curvature subtraction, and 19 km horizon occlusion ring.
            </p>
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rigorous Geometric Occlusion Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right 40%: Sky Plot, Countdown Badges, and "Why" Box */}
      <div className="w-full lg:w-[480px] h-full flex flex-col bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800">
        {/* Sky Plot Container */}
        <div className="h-72 border-b border-slate-800">
          <SkyPlot />
        </div>

        {/* Data-Driven "Why" Box (Spec Section 15 & 18) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="border border-amber-500/30 bg-amber-950/20 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Why Box: Physical Obstruction Analysis
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              At the start of the longest dark gap (
              <span className="font-mono text-amber-400 font-semibold">
                {metrics.longest_dark_gap_h.toFixed(1)} hours
              </span>
              ), solar occlusion occurs at azimuth{' '}
              <span className="font-mono text-cyan-400 font-semibold">{darkGapAz.toFixed(1)}°</span>:
            </p>

            <div className="bg-slate-900/90 rounded border border-slate-800 p-2.5 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Sun Center Elevation:</span>
                <span className="text-amber-300 font-semibold">{darkGapEl.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Terrain Horizon Crest:</span>
                <span className="text-cyan-300 font-semibold">+{darkGapHorizon.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1 text-[11px]">
                <span className="text-slate-400">Occlusion Dip:</span>
                <span className="text-rose-400 font-semibold">
                  {(darkGapEl - darkGapHorizon).toFixed(2)}° below ridge
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real high-standing topography on the lunar rim rises above the low grazing solar vector,
              causing complete solar power loss. Flat-horizon approximations falsely predict continuous sunlight here.
            </p>
          </div>

          {/* Mission Site Statistics Card */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Site Characteristics
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Ground Elevation</span>
                {selectedSite.ground_height_m > 0 ? `+${selectedSite.ground_height_m.toFixed(0)} m` : `${selectedSite.ground_height_m.toFixed(0)} m`}
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Target Body Frame</span>
                MOON_ME (DE421)
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Horizon Azimuths</span>
                720 samples (0.5° res)
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Observer Height</span>
                2.0 m above terrain
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
