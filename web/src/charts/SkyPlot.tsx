import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { usePlannerStore } from '../state/usePlannerStore';
import { Play, Pause, SkipBack, SkipForward, Sun, Radio, Compass } from 'lucide-react';

export const SkyPlot: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    currentHorizon,
    sites,
    selectedSiteId,
    plannedDayIndex,
    slipDays,
    scrubStep,
    setScrubStep,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    parameters,
    helpers,
    manifest,
  } = usePlannerStore();

  const [size, setSize] = useState({ width: 700, height: 280 });

  const selectedSiteIdx = sites.findIndex((s) => s.id === selectedSiteId);
  const currentHelper = selectedSiteIdx >= 0 ? helpers[selectedSiteIdx] : null;

  const windowSteps = Math.round(parameters.stay_days * 48);
  const numDays = 731;
  const slippedDayIndex = Math.max(0, Math.min(numDays - 1, plannedDayIndex + slipDays));
  const startStep = slippedDayIndex * 48;
  const currentStep = Math.min(startStep + scrubStep, (manifest?.time.n_steps || 35088) - 1);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setScrubStep((scrubStep + 1) % windowSteps);
    }, 100 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, scrubStep, windowSteps, playbackSpeed, setScrubStep]);

  // Resize observer
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.clientWidth,
          height: Math.max(220, containerRef.current.clientHeight - 45),
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Compute stay window ephemeris tracks
  const trackData = useMemo(() => {
    if (!currentHelper) return null;
    const tracks = currentHelper.tracks;

    const sunSegments: [number, number][][] = [];
    const earthSegments: [number, number][][] = [];

    let currentSunSeg: [number, number][] = [];
    let currentEarthSeg: [number, number][] = [];

    const endStep = Math.min(startStep + windowSteps, tracks.n_steps);

    for (let i = startStep; i < endStep; i++) {
      const sAz = tracks.sun_az[i];
      const sEl = tracks.sun_el[i];
      const eAz = tracks.earth_az[i];
      const eEl = tracks.earth_el[i];

      // Sun path wrap check
      if (currentSunSeg.length > 0) {
        const prevAz = currentSunSeg[currentSunSeg.length - 1][0];
        if (Math.abs(sAz - prevAz) > 180) {
          sunSegments.push(currentSunSeg);
          currentSunSeg = [];
        }
      }
      currentSunSeg.push([sAz, sEl]);

      // Earth path wrap check
      if (currentEarthSeg.length > 0) {
        const prevAz = currentEarthSeg[currentEarthSeg.length - 1][0];
        if (Math.abs(eAz - prevAz) > 180) {
          earthSegments.push(currentEarthSeg);
          currentEarthSeg = [];
        }
      }
      currentEarthSeg.push([eAz, eEl]);
    }

    if (currentSunSeg.length > 0) sunSegments.push(currentSunSeg);
    if (currentEarthSeg.length > 0) earthSegments.push(currentEarthSeg);

    return {
      sunSegments,
      earthSegments,
      currentSun: {
        az: tracks.sun_az[currentStep] || 0,
        el: tracks.sun_el[currentStep] || 0,
        visPct: tracks.sun_vis_pct[currentStep] || 0,
      },
      currentEarth: {
        az: tracks.earth_az[currentStep] || 0,
        el: tracks.earth_el[currentStep] || 0,
        clearance: tracks.earth_clearance[currentStep] || 0,
      },
    };
  }, [currentHelper, startStep, windowSteps, currentStep]);

  // Current scrub UTC time
  const currentUtcString = useMemo(() => {
    if (!manifest) return '';
    const base = new Date(manifest.time.t0_utc);
    base.setUTCMinutes(base.getUTCMinutes() + currentStep * 30);
    return base.toISOString().replace('.000Z', ' UTC').replace('T', ' ');
  }, [manifest, currentStep]);

  // Render D3 SVG Sky Plot
  useEffect(() => {
    if (!svgRef.current || !trackData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 15, right: 25, bottom: 25, left: 35 };
    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    // Azimuth: 0 to 360 deg
    const xScale = d3.scaleLinear().domain([0, 360]).range([0, width]);
    // Elevation: -5 to +10 deg
    const yScale = d3.scaleLinear().domain([-5, 10]).range([height, 0]);

    // Clip path for chart area
    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'sky-clip')
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    const chartArea = g.append('g').attr('clip-path', 'url(#sky-clip)');

    // Background Sky Gradient
    const skyGrad = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'sky-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    skyGrad.append('stop').attr('offset', '0%').attr('stop-color', '#070b14');
    skyGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a');

    chartArea
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#sky-grad)');

    // Elevation 0 deg line (Geometric local horizon)
    chartArea
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    // Antenna Mask Line
    if (parameters.antenna_mask_deg > 0) {
      chartArea
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(parameters.antenna_mask_deg))
        .attr('y2', yScale(parameters.antenna_mask_deg))
        .attr('stroke', '#a855f7')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

      chartArea
        .append('text')
        .attr('x', width - 5)
        .attr('y', yScale(parameters.antenna_mask_deg) - 3)
        .attr('text-anchor', 'end')
        .attr('fill', '#a855f7')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(`Mask +${parameters.antenna_mask_deg}°`);
    }

    // Gridlines: Azimuth cardinal points (0=N, 90=E, 180=S, 270=W, 360=N)
    const cardinals = [
      { az: 0, label: 'N (0°)' },
      { az: 90, label: 'E (90°)' },
      { az: 180, label: 'S (180°)' },
      { az: 270, label: 'W (270°)' },
      { az: 360, label: 'N (360°)' },
    ];

    cardinals.forEach((c) => {
      chartArea
        .append('line')
        .attr('x1', xScale(c.az))
        .attr('x2', xScale(c.az))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 1);
    });

    // Draw Terrain Horizon Silhouette
    if (currentHorizon && currentHorizon.variants) {
      const best = currentHorizon.variants['best'] || currentHorizon.variants['dem80'];
      if (best && best.elev_deg) {
        const elev = best.elev_deg;
        const nAz = elev.length;
        const dAz = 360 / nAz;

        const horizonPoints: [number, number][] = [];
        horizonPoints.push([0, -5]); // bottom left
        for (let i = 0; i <= nAz; i++) {
          const az = (i % nAz) * dAz;
          const el = elev[i % nAz];
          horizonPoints.push([az, el]);
        }
        horizonPoints.push([360, -5]); // bottom right

        const areaGen = d3
          .area<[number, number]>()
          .x((d) => xScale(d[0]))
          .y0(yScale(-5))
          .y1((d) => yScale(d[1]));

        chartArea
          .append('path')
          .datum(horizonPoints)
          .attr('fill', '#0f141f')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 1.5)
          .attr('d', areaGen);
      }
    }

    // Line generator for tracks
    const lineGen = d3
      .line<[number, number]>()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(d3.curveLinear);

    // Sun Track Segments (Amber)
    trackData.sunSegments.forEach((seg) => {
      chartArea
        .append('path')
        .datum(seg)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.6)
        .attr('d', lineGen);
    });

    // Earth Track Segments (Cyan)
    trackData.earthSegments.forEach((seg) => {
      chartArea
        .append('path')
        .datum(seg)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.6)
        .attr('d', lineGen);
    });

    // Current Sun Disc Marker
    const sunX = xScale(trackData.currentSun.az);
    const sunY = yScale(trackData.currentSun.el);
    const sunRadiusDeg = 0.26; // True angular radius ~0.26 deg
    const sunRadiusPx = Math.max(3, (yScale(0) - yScale(sunRadiusDeg)) * 1.5);

    chartArea
      .append('circle')
      .attr('cx', sunX)
      .attr('cy', sunY)
      .attr('r', sunRadiusPx)
      .attr('fill', trackData.currentSun.visPct > 0 ? '#fbbf24' : '#78350f')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .attr('filter', trackData.currentSun.visPct > 0 ? 'drop-shadow(0px 0px 4px #f59e0b)' : 'none');

    // Current Earth Disc Marker
    const earthX = xScale(trackData.currentEarth.az);
    const earthY = yScale(trackData.currentEarth.el);
    const earthRadiusDeg = 0.95; // True angular radius ~0.95 deg
    const earthRadiusPx = Math.max(4, (yScale(0) - yScale(earthRadiusDeg)) * 1.5);

    chartArea
      .append('circle')
      .attr('cx', earthX)
      .attr('cy', earthY)
      .attr('r', earthRadiusPx)
      .attr('fill', '#0284c7')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1)
      .attr('filter', 'drop-shadow(0px 0px 4px #0ea5e9)');

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([0, 90, 180, 270, 360])
      .tickFormat((d) => {
        const val = Number(d);
        if (val === 0 || val === 360) return 'N 0°';
        if (val === 90) return 'E 90°';
        if (val === 180) return 'S 180°';
        if (val === 270) return 'W 270°';
        return `${val}°`;
      });

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((d) => `${d}°`);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .attr('font-size', '9px');

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .attr('font-size', '9px');
  }, [size, trackData, currentHorizon, parameters.antenna_mask_deg]);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[#050508] p-3 space-y-2 select-none">
      {/* Top Header of Sky Plot */}
      <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="font-serif font-bold text-white tracking-wide">Sky Visibility Plot</span>
          <span className="text-[10px] text-neutral-500 font-mono">
            Azimuth 0°–360° × Elevation -5° to +10°
          </span>
        </div>

        {/* Live Ephemeris Readout */}
        {trackData && (
          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <div className="flex items-center space-x-1.5 text-amber-300">
              <Sun className="w-3.5 h-3.5" />
              <span>
                Sun: {trackData.currentSun.az.toFixed(1)}° / {trackData.currentSun.el.toFixed(2)}° (
                {trackData.currentSun.visPct}%)
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-cyan-300">
              <Radio className="w-3.5 h-3.5" />
              <span>
                Earth: {trackData.currentEarth.az.toFixed(1)}° /{' '}
                {trackData.currentEarth.el.toFixed(2)}° (clr:{' '}
                {trackData.currentEarth.clearance.toFixed(2)}°)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 w-full overflow-hidden">
        <svg ref={svgRef} className="w-full h-full block" />
      </div>

      {/* Time Scrubber Controls */}
      <div className="flex items-center space-x-3 pt-1 border-t border-white/10/80 text-xs">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setScrubStep(Math.max(0, scrubStep - 1))}
            className="p-1 rounded hover:bg-white/10 text-neutral-300 transition"
            title="Step backward (-30m)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-full bg-violet-600 hover:bg-violet-500 shadow-violet-900/30 text-white transition shadow"
            title={isPlaying ? 'Pause' : 'Play mission timeline'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setScrubStep(Math.min(windowSteps - 1, scrubStep + 1))}
            className="p-1 rounded hover:bg-white/10 text-neutral-300 transition"
            title="Step forward (+30m)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed button */}
        <button
          onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 5 : 1)}
          className="px-1.5 py-0.5 rounded bg-[#0a0a0a] border border-white/10 text-[10px] font-mono text-violet-300"
          title="Playback speed"
        >
          {playbackSpeed}x
        </button>

        {/* Timeline Scrubber */}
        <input
          type="range"
          min="0"
          max={Math.max(1, windowSteps - 1)}
          value={scrubStep}
          onChange={(e) => setScrubStep(parseInt(e.target.value))}
          className="flex-1 accent-violet-500 h-1.5 bg-white/10 rounded cursor-pointer"
        />

        {/* Timestamp & Step Label */}
        <div className="font-mono text-[11px] text-neutral-300 whitespace-nowrap">
          <span className="text-cyan-400 font-semibold">{currentUtcString}</span>
          <span className="text-neutral-500 ml-2">
            (+{(scrubStep * 0.5).toFixed(1)}h / {(parameters.stay_days * 24).toFixed(0)}h)
          </span>
        </div>
      </div>
    </div>
  );
};
