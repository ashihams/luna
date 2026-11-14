import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { usePlannerStore } from '../state/usePlannerStore';
import { CellMetrics } from '../types';

interface TooltipInfo {
  x: number;
  y: number;
  siteName: string;
  dateStr: string;
  dayIndex: number;
  metrics: CellMetrics;
}

export const Heatmap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    sites,
    selectedSiteId,
    setSelectedSiteId,
    plannedDayIndex,
    setPlannedDayIndex,
    slipDays,
    metricMode,
    heatmapMatrix,
    manifest,
  } = usePlannerStore();

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 420 });

  const numDays = 731;
  const numSites = sites.length;
  const slippedDayIndex = Math.max(0, Math.min(numDays - 1, plannedDayIndex + slipDays));
  const selectedSiteIdx = sites.findIndex((s) => s.id === selectedSiteId);

  // Layout constants
  const LEFT_MARGIN = 175;
  const RIGHT_MARGIN = 20;
  const TOP_MARGIN = 28;
  const BOTTOM_MARGIN = 32;

  // Responsive resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(380, containerRef.current.clientHeight - 10),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Month boundaries for 2027 and 2028
  const monthTicks = useMemo(() => {
    if (!manifest) return [];
    const ticks: { day: number; label: string }[] = [];
    const base = new Date(manifest.time.t0_utc);

    for (let m = 0; m < 24; m++) {
      const d = new Date(Date.UTC(2027, m, 1));
      const diffMs = d.getTime() - base.getTime();
      const day = Math.round(diffMs / (86400 * 1000));
      if (day >= 0 && day < numDays) {
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
        ticks.push({ day, label });
      }
    }
    return ticks;
  }, [manifest, numDays]);

  // Color mapping
  const getColor = useCallback(
    (metric: CellMetrics, mode: string) => {
      let val = metric.score;
      if (mode === 'power') val = metric.sun_fraction;
      if (mode === 'comms') val = metric.earth_fraction;

      // Color ramp
      if (!metric.viable) {
        // Dimmer red/slate tone for non-viable
        const v = Math.max(0, Math.min(1, val));
        const r = Math.round(40 + v * 50);
        const g = Math.round(15 + v * 15);
        const b = Math.round(25 + v * 25);
        return `rgb(${r}, ${g}, ${b})`;
      }

      if (mode === 'power') {
        // Amber / Yellow ramp
        const r = Math.round(60 + val * 195);
        const g = Math.round(40 + val * 175);
        const b = Math.round(20 + val * 30);
        return `rgb(${r}, ${g}, ${b})`;
      } else if (mode === 'comms') {
        // Cyan / Blue ramp
        const r = Math.round(10 + val * 30);
        const g = Math.round(60 + val * 160);
        const b = Math.round(100 + val * 155);
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        // Combined: Deep navy -> Emerald -> Gold
        if (val < 0.5) {
          const t = val * 2;
          const r = Math.round(12 + t * 16);
          const g = Math.round(45 + t * 110);
          const b = Math.round(90 + t * 40);
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          const t = (val - 0.5) * 2;
          const r = Math.round(28 + t * 227);
          const g = Math.round(155 + t * 80);
          const b = Math.round(130 - t * 80);
          return `rgb(${r}, ${g}, ${b})`;
        }
      }
    },
    []
  );

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapMatrix || numSites === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dimensions;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const heatWidth = width - LEFT_MARGIN - RIGHT_MARGIN;
    const heatHeight = height - TOP_MARGIN - BOTTOM_MARGIN;
    const cellW = heatWidth / numDays;
    const cellH = heatHeight / numSites;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw Heatmap Cells
    for (let s = 0; s < numSites; s++) {
      const y = TOP_MARGIN + s * cellH;
      const row = heatmapMatrix[s];
      if (!row) continue;

      for (let d = 0; d < numDays; d++) {
        const x = LEFT_MARGIN + d * cellW;
        const metric = row[d];
        ctx.fillStyle = getColor(metric, metricMode);
        ctx.fillRect(x, y, Math.max(1, cellW + 0.2), cellH);

        // Highlight non-viable cells with subtle dark stroke or diagonal hash
        if (!metric.viable && cellW > 3) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellW, cellH);
        }
      }
    }

    // Selected Site Horizontal Glow
    if (selectedSiteIdx >= 0) {
      const y = TOP_MARGIN + selectedSiteIdx * cellH;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(LEFT_MARGIN, y, heatWidth, cellH);
    }

    // Planned Date Marker (Dashed Amber line)
    const plannedX = LEFT_MARGIN + plannedDayIndex * cellW;
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(plannedX, TOP_MARGIN - 8);
    ctx.lineTo(plannedX, TOP_MARGIN + heatHeight + 5);
    ctx.stroke();
    ctx.restore();

    // Slipped Date Marker (Solid Cyan line)
    const slippedX = LEFT_MARGIN + slippedDayIndex * cellW;
    ctx.save();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(slippedX, TOP_MARGIN - 14);
    ctx.lineTo(slippedX, TOP_MARGIN + heatHeight + 5);
    ctx.stroke();

    // Slipped marker badge
    ctx.fillStyle = '#0891b2';
    ctx.beginPath();
    ctx.roundRect(slippedX - 18, TOP_MARGIN - 24, 36, 14, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(slipDays >= 0 ? `+${slipDays}d` : `${slipDays}d`, slippedX, TOP_MARGIN - 14);
    ctx.restore();

    // Left Axis: Site Labels
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let s = 0; s < numSites; s++) {
      const y = TOP_MARGIN + s * cellH + cellH / 2;
      const isSelected = s === selectedSiteIdx;

      // Site background row highlight
      if (isSelected) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fillRect(0, TOP_MARGIN + s * cellH, LEFT_MARGIN, cellH);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
      }

      const siteName = sites[s].name.replace(' (Site ', ' #').replace(')', '');
      ctx.fillText(siteName, LEFT_MARGIN - 8, y);
    }

    // Bottom Axis: Month Ticks & Labels
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (const tick of monthTicks) {
      const x = LEFT_MARGIN + tick.day * cellW;
      ctx.beginPath();
      ctx.moveTo(x, TOP_MARGIN + heatHeight);
      ctx.lineTo(x, TOP_MARGIN + heatHeight + 4);
      ctx.stroke();

      ctx.fillText(tick.label, x, TOP_MARGIN + heatHeight + 7);
    }
  }, [
    dimensions,
    heatmapMatrix,
    numSites,
    numDays,
    selectedSiteIdx,
    plannedDayIndex,
    slippedDayIndex,
    slipDays,
    metricMode,
    getColor,
    monthTicks,
    sites,
  ]);

  // Click handler to select site or date
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !manifest) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const heatWidth = dimensions.width - LEFT_MARGIN - RIGHT_MARGIN;
    const heatHeight = dimensions.height - TOP_MARGIN - BOTTOM_MARGIN;
    const cellW = heatWidth / numDays;
    const cellH = heatHeight / numSites;

    // Check if clicked in site label area
    if (mouseX < LEFT_MARGIN && mouseY >= TOP_MARGIN && mouseY <= TOP_MARGIN + heatHeight) {
      const siteIdx = Math.floor((mouseY - TOP_MARGIN) / cellH);
      if (siteIdx >= 0 && siteIdx < numSites) {
        setSelectedSiteId(sites[siteIdx].id);
      }
      return;
    }

    // Check if clicked in heat grid
    if (
      mouseX >= LEFT_MARGIN &&
      mouseX <= LEFT_MARGIN + heatWidth &&
      mouseY >= TOP_MARGIN &&
      mouseY <= TOP_MARGIN + heatHeight
    ) {
      const day = Math.floor((mouseX - LEFT_MARGIN) / cellW);
      const siteIdx = Math.floor((mouseY - TOP_MARGIN) / cellH);

      if (siteIdx >= 0 && siteIdx < numSites) {
        setSelectedSiteId(sites[siteIdx].id);
      }
      if (day >= 0 && day < numDays) {
        setPlannedDayIndex(day);
      }
    }
  };

  // Hover Tooltip handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapMatrix || !manifest) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const heatWidth = dimensions.width - LEFT_MARGIN - RIGHT_MARGIN;
    const heatHeight = dimensions.height - TOP_MARGIN - BOTTOM_MARGIN;
    const cellW = heatWidth / numDays;
    const cellH = heatHeight / numSites;

    if (
      mouseX >= LEFT_MARGIN &&
      mouseX <= LEFT_MARGIN + heatWidth &&
      mouseY >= TOP_MARGIN &&
      mouseY <= TOP_MARGIN + heatHeight
    ) {
      const day = Math.floor((mouseX - LEFT_MARGIN) / cellW);
      const siteIdx = Math.floor((mouseY - TOP_MARGIN) / cellH);

      if (siteIdx >= 0 && siteIdx < numSites && day >= 0 && day < numDays) {
        const metrics = heatmapMatrix[siteIdx][day];
        const site = sites[siteIdx];

        const d = new Date(manifest.time.t0_utc);
        d.setUTCDate(d.getUTCDate() + day);
        const dateStr = d.toISOString().split('T')[0];

        setTooltip({
          x: e.clientX,
          y: e.clientY,
          siteName: site.name,
          dateStr,
          dayIndex: day,
          metrics,
        });
        return;
      }
    }
    setTooltip(null);
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // Keyboard navigation: Arrow keys move site and date
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') {
          setPlannedDayIndex(plannedDayIndex - 1);
        } else if (e.key === 'ArrowRight') {
          setPlannedDayIndex(plannedDayIndex + 1);
        } else if (e.key === 'ArrowUp') {
          if (selectedSiteIdx > 0) {
            setSelectedSiteId(sites[selectedSiteIdx - 1].id);
          }
        } else if (e.key === 'ArrowDown') {
          if (selectedSiteIdx < numSites - 1) {
            setSelectedSiteId(sites[selectedSiteIdx + 1].id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [plannedDayIndex, selectedSiteIdx, numSites, sites, setPlannedDayIndex, setSelectedSiteId]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col select-none rounded-2xl overflow-hidden border border-[#e5e5e5] bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e5e5] bg-[#fcfbf9] text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-serif italic font-semibold text-[#171717]">Landing Feasibility Heatmap</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#171717]/50">
            (14 sites × 731 days, 2027–2028 | Click or Arrow keys to navigate)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 font-mono text-[9px] uppercase tracking-wider">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0b1329] border border-slate-700" />
            <span className="text-[#171717]/60">Low</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0d9488]" />
            <span className="text-[#171717]/60">Viable</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#fbbf24]" />
            <span className="text-[#171717]/60">Optimal</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-red-500 bg-red-950/40" />
            <span className="text-red-600">Non-viable</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        />

        {/* Floating Tooltip */}
        {tooltip && (
          <div
            className="fixed pointer-events-none z-50 bg-white/95 backdrop-blur-md border border-[#e5e5e5] rounded-xl shadow-xl p-3.5 text-xs w-64 transform -translate-x-1/2 -translate-y-full mb-3 text-[#171717]"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2 mb-2">
              <span className="font-serif font-bold text-sm text-[#171717] truncate pr-2">{tooltip.siteName}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-semibold ${
                  tooltip.metrics.viable
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}
              >
                {tooltip.metrics.viable ? 'VIABLE' : 'FAILED'}
              </span>
            </div>

            <div className="text-[11px] font-mono text-[#171717]/60 mb-2.5">
              UTC Start: <span className="text-[#4338ca] font-semibold">{tooltip.dateStr}</span> (Day{' '}
              {tooltip.dayIndex})
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#171717]/50 block font-mono text-[9px] uppercase tracking-wider">Sun Lit</span>
                <span className="font-mono text-amber-600 font-semibold">
                  {Math.round(tooltip.metrics.sun_fraction * 100)}%
                </span>
              </div>
              <div>
                <span className="text-[#171717]/50 block font-mono text-[9px] uppercase tracking-wider">Earth Comms</span>
                <span className="font-mono text-sky-600 font-semibold">
                  {Math.round(tooltip.metrics.earth_fraction * 100)}%
                </span>
              </div>
              <div>
                <span className="text-[#171717]/50 block font-mono text-[9px] uppercase tracking-wider">Dark Gap</span>
                <span className="font-mono text-rose-600 font-semibold">
                  {tooltip.metrics.longest_dark_gap_h.toFixed(1)} h
                </span>
              </div>
              <div>
                <span className="text-[#171717]/50 block font-mono text-[9px] uppercase tracking-wider">Comms Outage</span>
                <span className="font-mono text-purple-600 font-semibold">
                  {tooltip.metrics.longest_comms_outage_h.toFixed(1)} h
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#e5e5e5] flex justify-between items-center text-[11px]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#171717]/50">Viability Score</span>
              <span className="font-mono font-bold text-[#4338ca]">
                {(tooltip.metrics.score * 100).toFixed(1)} / 100
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
