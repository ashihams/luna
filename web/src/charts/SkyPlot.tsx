import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { isLit, hasEarthLOS, parseUtc } from '../data/science';

export const SkyPlot: React.FC = () => {
  const { currentHorizon, sites, selectedSiteId, plannedDayIndex, slipDays, scrubStep,
    setScrubStep, isPlaying, setIsPlaying, playbackSpeed, setPlaybackSpeed,
    parameters, helpers, manifest } = usePlannerStore();
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(440);
  const tracks = helpers[sites.findIndex(s => s.id === selectedSiteId)]?.tracks;
  const steps = Math.round(parameters.stay_days * 48);
  const start = (plannedDayIndex + slipDays) * 48;
  const current = start + scrubStep;
  const horizon = currentHorizon?.variants.best;
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setScrubStep((usePlannerStore.getState().scrubStep + 1) % steps), 100 / playbackSpeed);
    return () => clearInterval(timer);
  }, [isPlaying, steps, playbackSpeed, setScrubStep]);
  const plot = useMemo(() => {
    if (!tracks?.sun_az.length || !horizon) return null;
    const sun: number[][][] = [[]], earth: number[][][] = [[]];
    let min = Math.min(-5, ...horizon) - 1;
    let max = Math.max(5, ...horizon.map(v => v + parameters.antenna_mask_deg)) + 1;
    for (let i = start; i < Math.min(start + steps, tracks.n_steps); i++) {
      for (const [segments, az, el] of [[sun, tracks.sun_az[i], tracks.sun_el[i]], [earth, tracks.earth_az[i], tracks.earth_el[i]]] as [number[][][], number, number][]) {
        let segment = segments[segments.length - 1];
        if (segment.length && Math.abs(segment[segment.length - 1][0] - az) > 180) { segment = []; segments.push(segment); }
        segment.push([az, el]);
        min = Math.min(min, el - 1.1); max = Math.max(max, el + 1.1);
      }
    }
    return { sun, earth, min: Math.floor(min), max: Math.ceil(max) };
  }, [tracks, horizon, start, steps, parameters.antenna_mask_deg]);
  if (!plot || !tracks || !manifest || !horizon) return <p role="status">Loading sky…</p>;
  const height = 200, left = 38, right = width - 14, top = 10, bottom = 174;
  const x = (az: number) => left + az / 360 * (right - left);
  const y = (el: number) => bottom - (el - plot.min) / (plot.max - plot.min) * (bottom - top);
  const line = (points: number[][]) => points.map(([az, el], i) => `${i ? 'L' : 'M'}${x(az)},${y(el)}`).join(' ');
  const silhouette = Array.from({ length: horizon.length + 1 }, (_, i) => [i * 360 / horizon.length, horizon[i % horizon.length]]);
  const sunLit = isLit(tracks.sun_vis_pct[current], parameters.lit_threshold_pct);
  const earthLOS = hasEarthLOS(tracks.earth_clearance[current], parameters.antenna_mask_deg);
  const time = new Date(parseUtc(manifest.time.t0_utc).getTime() + current * 1800000).toISOString().replace('T', ' ').slice(0,19);
  return <div className="sky-plot h-full p-3 flex flex-col gap-2 bg-[#050508]" ref={host}>
    <div className="text-sm font-serif">Sky Visibility Plot</div>
    <div className="text-[11px] font-mono flex flex-wrap gap-x-3 gap-y-1">
      <span className="text-amber-300">Sun: {tracks.sun_az[current].toFixed(1)}° / {tracks.sun_el[current].toFixed(2)}° ({tracks.sun_vis_pct[current]}%) · {sunLit ? 'Sunlit' : 'Dark'}</span>
      <span className="text-cyan-300">Earth: {tracks.earth_az[current].toFixed(1)}° / {tracks.earth_el[current].toFixed(2)}° · {earthLOS ? 'LOS' : 'Blocked'}</span>
    </div>
    <svg className="w-full block shrink-0" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sun and Earth centers above the terrain horizon">
      <rect x={left} y={top} width={right-left} height={bottom-top} fill="#070b14" />
      {[0,90,180,270,360].map((az,i) => <g key={az}>
        <line x1={x(az)} x2={x(az)} y1={top} y2={bottom} stroke="#1e293b" />
        <text x={x(az)} y={190} textAnchor="middle" fill="#94a3b8" fontSize="9">{['N','E','S','W','N'][i]} {az}°</text>
      </g>)}
      {[plot.min, 0, plot.max].map(el => <g key={el}><line x1={left} x2={right} y1={y(el)} y2={y(el)} stroke="#334155" strokeDasharray="3 3" /><text x={left-5} y={y(el)+3} textAnchor="end" fill="#94a3b8" fontSize="9">{el}°</text></g>)}
      <path data-testid="terrain-silhouette" d={`${line(silhouette)} L${right},${bottom} L${left},${bottom} Z`} fill="#0f141f" stroke="#38bdf8" strokeWidth="1" />
      {parameters.antenna_mask_deg > 0 && <path data-testid="antenna-mask" d={line(silhouette.map(([az,el]) => [az,el+parameters.antenna_mask_deg]))} fill="none" stroke="#a855f7" strokeDasharray="3 3" />}
      {plot.sun.map((s,i) => <path key={`s${i}`} d={line(s)} fill="none" stroke="#f59e0b" strokeOpacity=".65" />)}
      {plot.earth.map((s,i) => <path key={`e${i}`} d={line(s)} fill="none" stroke="#06b6d4" strokeOpacity=".65" />)}
      <circle data-testid="sun-marker" cx={x(tracks.sun_az[current])} cy={y(tracks.sun_el[current])} r="4" fill={sunLit ? '#fbbf24' : '#78350f'} stroke="white" />
      <circle cx={x(tracks.earth_az[current])} cy={y(tracks.earth_el[current])} r="4" fill={earthLOS ? '#06b6d4' : '#164e63'} stroke="white" />
    </svg>
    <div className="text-[10px] text-neutral-400">Markers show centers. Darkness: visible Sun &lt; {parameters.lit_threshold_pct}%. Earth mask: terrain + {parameters.antenna_mask_deg}°.</div>
    <div className="flex items-center gap-2">
      <button className="p-2" aria-label="Step backward" onClick={() => setScrubStep(scrubStep-1)}>−</button>
      <button className="px-3 py-2 rounded bg-violet-700" onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</button>
      <button className="p-2" aria-label="Step forward" onClick={() => setScrubStep(scrubStep+1)}>+</button>
      <button className="p-2" aria-label="Playback speed" onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 5 : 1)}>{playbackSpeed}x</button>
      <input aria-label="Mission time" type="range" min="0" max={steps-1} value={scrubStep} onChange={e => setScrubStep(Number(e.target.value))} className="min-w-0 flex-1 accent-violet-500" />
    </div>
    <div className="text-[11px] font-mono text-cyan-300">{time} UTC · +{(scrubStep*.5).toFixed(1)}h</div>
  </div>;
};
