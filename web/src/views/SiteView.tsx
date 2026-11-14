import React from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { SkyPlot } from '../charts/SkyPlot';
import { SiteScene } from '../three/SiteScene';
import { Sun, Radio, AlertCircle } from 'lucide-react';

export const SiteView: React.FC = () => {
  const {
    sites,
    selectedSiteId,
    getSlipAnalysis,
    manifest,
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
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-[#fcfbf9] text-[#171717] select-none">
      {/* Left 60%: 3D Scene / Perspective View */}
      <div className="flex-1 h-full relative flex flex-col bg-[#0c101c] border-r border-[#e5e5e5]">
        {/* Top Info Bar */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-3 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md border border-[#e5e5e5] px-4 py-2 rounded-2xl shadow-lg pointer-events-auto text-[#171717]">
            <div className="font-mono text-[9px] text-[#171717]/50 font-semibold uppercase tracking-[0.25em]">
              Lander Site
            </div>
            <div className="font-serif italic text-sm font-bold text-[#171717]">{selectedSite.name}</div>
            <div className="text-[11px] font-mono text-[#4338ca] font-semibold mt-0.5">
              {selectedSite.lat_deg.toFixed(3)}°S, {selectedSite.lon_deg_east.toFixed(3)}°E •{' '}
              {selectedSite.ground_height_m.toFixed(0)} m elev
            </div>
          </div>

          {/* Countdown Badges */}
          <div className="bg-white/90 backdrop-blur-md border border-[#e5e5e5] px-4 py-2 rounded-2xl shadow-lg flex items-center space-x-4 pointer-events-auto text-[#171717]">
            <div className="flex items-center space-x-2">
              <Sun className={`w-4 h-4 ${isCurrentlyLit ? 'text-amber-500' : 'text-slate-400'}`} />
              <div>
                <div className="font-mono text-[9px] text-[#171717]/50 uppercase tracking-[0.2em] font-semibold">
                  {isCurrentlyLit ? 'To Sunset' : 'To Sunrise'}
                </div>
                <div className="text-xs font-mono font-bold text-amber-600">
                  {hoursToSunsetOrSunrise > 0 ? `${hoursToSunsetOrSunrise.toFixed(1)} hrs` : 'None in range'}
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-[#e5e5e5]" />

            <div className="flex items-center space-x-2">
              <Radio className={`w-4 h-4 ${isCurrentlyLOS ? 'text-sky-500' : 'text-slate-400'}`} />
              <div>
                <div className="font-mono text-[9px] text-[#171717]/50 uppercase tracking-[0.2em] font-semibold">
                  {isCurrentlyLOS ? 'To Earthset' : 'To Earthrise'}
                </div>
                <div className="text-xs font-mono font-bold text-sky-600">
                  {hoursToEarthsetOrEarthrise > 0 ? `${hoursToEarthsetOrEarthrise.toFixed(1)} hrs` : 'Continuous LOS'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D First-Person Surface Scene */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          <SiteScene />
        </div>
      </div>

      {/* Right 40%: Sky Plot, Countdown Badges, and "Why" Box */}
      <div className="w-full lg:w-[480px] h-full flex flex-col bg-[#fcfbf9] border-t lg:border-t-0 lg:border-l border-[#e5e5e5]">
        {/* Sky Plot Container */}
        <div className="h-72 border-b border-[#e5e5e5] bg-white">
          <SkyPlot />
        </div>

        {/* Data-Driven "Why" Box (Spec Section 15 & 18) */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="border border-amber-300 bg-amber-50/60 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center space-x-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <h4 className="font-serif italic text-xs font-bold uppercase tracking-wider">
                Why Box: Physical Obstruction Analysis
              </h4>
            </div>

            <p className="font-sans text-xs text-[#171717]/80 leading-relaxed">
              At the start of the longest dark gap (
              <span className="font-mono text-amber-700 font-bold">
                {metrics.longest_dark_gap_h.toFixed(1)} hours
              </span>
              ), solar occlusion occurs at azimuth{' '}
              <span className="font-mono text-[#4338ca] font-bold">{darkGapAz.toFixed(1)}°</span>:
            </p>

            <div className="bg-white rounded-xl border border-amber-200/80 p-3 text-xs font-mono space-y-1.5 shadow-sm">
              <div className="flex justify-between">
                <span className="text-[#171717]/60">Sun Center Elevation:</span>
                <span className="text-amber-700 font-bold">{darkGapEl.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#171717]/60">Terrain Horizon Crest:</span>
                <span className="text-[#4338ca] font-bold">+{darkGapHorizon.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between border-t border-[#e5e5e5] pt-1.5 text-[11px]">
                <span className="text-[#171717]/60">Occlusion Dip:</span>
                <span className="text-rose-600 font-bold">
                  {(darkGapEl - darkGapHorizon).toFixed(2)}° below ridge
                </span>
              </div>
            </div>

            <p className="font-sans text-[11px] text-[#171717]/70 leading-relaxed">
              Real high-standing topography on the lunar rim rises above the low grazing solar vector,
              causing complete solar power loss. Flat-horizon approximations falsely predict continuous sunlight here.
            </p>
          </div>

          {/* Mission Site Statistics Card */}
          <div className="border border-[#e5e5e5] bg-white rounded-2xl p-4 space-y-2.5 text-xs shadow-sm">
            <div className="font-serif italic font-bold text-[#171717] text-xs">
              Site Characteristics
            </div>
            <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px] text-[#171717]">
              <div>
                <span className="text-[#171717]/50 block text-[9px] uppercase tracking-wider">Ground Elevation</span>
                {selectedSite.ground_height_m > 0 ? `+${selectedSite.ground_height_m.toFixed(0)} m` : `${selectedSite.ground_height_m.toFixed(0)} m`}
              </div>
              <div>
                <span className="text-[#171717]/50 block text-[9px] uppercase tracking-wider">Target Body Frame</span>
                MOON_ME (DE421)
              </div>
              <div>
                <span className="text-[#171717]/50 block text-[9px] uppercase tracking-wider">Horizon Azimuths</span>
                720 samples (0.5° res)
              </div>
              <div>
                <span className="text-[#171717]/50 block text-[9px] uppercase tracking-wider">Observer Height</span>
                2.0 m above terrain
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
