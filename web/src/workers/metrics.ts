import { CellMetrics, PlannerParameters, SiteTracks, RescueCandidate, SlipAnalysis } from '../types';

/**
 * Precomputed prefix sums and state arrays for a single site to enable
 * sub-millisecond sliding window evaluations.
 */
export class SiteMetricsHelper {
  readonly tracks: SiteTracks;
  private readonly sunPrefix: Float64Array;
  private readonly nSteps: number;

  constructor(tracks: SiteTracks) {
    this.tracks = tracks;
    this.nSteps = tracks.n_steps;
    this.sunPrefix = new Float64Array(this.nSteps + 1);

    let sum = 0;
    for (let i = 0; i < this.nSteps; i++) {
      sum += tracks.sun_vis_pct[i];
      this.sunPrefix[i + 1] = sum;
    }
  }

  /**
   * Evaluate metrics for a single window [startStep, startStep + windowSteps)
   */
  evaluateWindow(
    startStep: number,
    windowSteps: number,
    params: PlannerParameters,
    horizonDeg?: number[]
  ): CellMetrics {
    const endStep = Math.min(startStep + windowSteps, this.nSteps);
    const actualSteps = endStep - startStep;

    if (actualSteps <= 0) {
      return {
        sun_fraction: 0,
        earth_fraction: 0,
        longest_dark_gap_h: 0,
        longest_comms_outage_h: 0,
        viable: false,
        score: 0,
        dark_gap_start_step: startStep,
        dark_gap_start_az: 0,
        dark_gap_start_el: 0,
        dark_gap_start_horizon: 0,
        outage_start_step: startStep,
        outage_start_az: 0,
        outage_start_el: 0,
        outage_start_horizon: 0,
      };
    }

    // 1. Sun fraction via prefix sum
    const sunSum = this.sunPrefix[endStep] - this.sunPrefix[startStep];
    const sun_fraction = sunSum / (actualSteps * 100.0);

    // 2. Earth fraction and outages, Sun dark gaps
    let earthValidCount = 0;
    let maxDarkSteps = 0;
    let currentDarkSteps = 0;
    let darkGapStartStep = startStep;
    let currentDarkStartStep = startStep;

    let maxOutageSteps = 0;
    let currentOutageSteps = 0;
    let outageStartStep = startStep;
    let currentOutageStartStep = startStep;

    const sunVis = this.tracks.sun_vis_pct;
    const earthClear = this.tracks.earth_clearance;
    const litThreshold = params.lit_threshold_pct;
    const antennaMask = params.antenna_mask_deg;

    for (let i = startStep; i < endStep; i++) {
      // Earth LOS clearance check
      if (earthClear[i] >= antennaMask) {
        earthValidCount++;
        if (currentOutageSteps > maxOutageSteps) {
          maxOutageSteps = currentOutageSteps;
          outageStartStep = currentOutageStartStep;
        }
        currentOutageSteps = 0;
      } else {
        if (currentOutageSteps === 0) {
          currentOutageStartStep = i;
        }
        currentOutageSteps++;
      }

      // Sun lit check
      if (sunVis[i] >= litThreshold) {
        if (currentDarkSteps > maxDarkSteps) {
          maxDarkSteps = currentDarkSteps;
          darkGapStartStep = currentDarkStartStep;
        }
        currentDarkSteps = 0;
      } else {
        if (currentDarkSteps === 0) {
          currentDarkStartStep = i;
        }
        currentDarkSteps++;
      }
    }

    if (currentDarkSteps > maxDarkSteps) {
      maxDarkSteps = currentDarkSteps;
      darkGapStartStep = currentDarkStartStep;
    }

    if (currentOutageSteps > maxOutageSteps) {
      maxOutageSteps = currentOutageSteps;
      outageStartStep = currentOutageStartStep;
    }

    const earth_fraction = earthValidCount / actualSteps;
    const longest_dark_gap_h = maxDarkSteps * 0.5;
    const longest_comms_outage_h = maxOutageSteps * 0.5;

    // Viability condition: all thresholds satisfied
    const viable =
      sun_fraction >= params.min_sun_fraction &&
      earth_fraction >= params.min_earth_fraction &&
      longest_dark_gap_h <= params.max_dark_gap_hours;

    // Score according to spec: 0.5*sun + 0.5*earth - 0.5*min(1, dark_gap/(24*stay_days))
    const penalty = Math.min(1.0, longest_dark_gap_h / (24.0 * params.stay_days));
    const score = Math.max(0, 0.5 * sun_fraction + 0.5 * earth_fraction - 0.5 * penalty);

    // Diagnostics for Why box
    const dark_gap_start_az = this.tracks.sun_az[darkGapStartStep] || 0;
    const dark_gap_start_el = this.tracks.sun_el[darkGapStartStep] || 0;
    let dark_gap_start_horizon = 0;

    const outage_start_az = this.tracks.earth_az[outageStartStep] || 0;
    const outage_start_el = this.tracks.earth_el[outageStartStep] || 0;
    let outage_start_horizon = 0;

    if (horizonDeg && horizonDeg.length > 0) {
      const azIdxSun = Math.round((dark_gap_start_az % 360) / 0.5) % horizonDeg.length;
      dark_gap_start_horizon = horizonDeg[azIdxSun] || 0;

      const azIdxEarth = Math.round((outage_start_az % 360) / 0.5) % horizonDeg.length;
      outage_start_horizon = horizonDeg[azIdxEarth] || 0;
    }

    return {
      sun_fraction,
      earth_fraction,
      longest_dark_gap_h,
      longest_comms_outage_h,
      viable,
      score,
      dark_gap_start_step: darkGapStartStep,
      dark_gap_start_az,
      dark_gap_start_el,
      dark_gap_start_horizon,
      outage_start_step: outageStartStep,
      outage_start_az,
      outage_start_el,
      outage_start_horizon,
    };
  }
}

/**
 * Compute the full heatmap matrix (sites x 731 days).
 * Highly optimized loop finishes in < 25ms.
 */
export function computeHeatmapMatrix(
  helpers: SiteMetricsHelper[],
  params: PlannerParameters,
  numDays: number = 731
): CellMetrics[][] {
  const windowSteps = Math.round(params.stay_days * 48);
  const matrix: CellMetrics[][] = [];

  for (let s = 0; s < helpers.length; s++) {
    const row: CellMetrics[] = [];
    const helper = helpers[s];

    for (let day = 0; day < numDays; day++) {
      const startStep = day * 48;
      row.push(helper.evaluateWindow(startStep, windowSteps, params));
    }
    matrix.push(row);
  }

  return matrix;
}

/**
 * Slip analysis calculation according to Section 14
 */
export function calculateSlipAnalysis(
  matrix: CellMetrics[][],
  siteIndex: number,
  plannedDayIndex: number,
  slipDays: number,
  numDays: number = 731
): SlipAnalysis {
  const row = matrix[siteIndex];
  if (!row) {
    throw new Error(`Invalid siteIndex: ${siteIndex}`);
  }

  const plannedMetrics = row[plannedDayIndex];
  const isPlannedViable = plannedMetrics ? plannedMetrics.viable : false;

  const slippedDayIndex = Math.max(0, Math.min(numDays - 1, plannedDayIndex + slipDays));
  const cellMetrics = row[slippedDayIndex];
  const isViable = cellMetrics ? cellMetrics.viable : false;

  // Slip tolerance: largest k >= 0 such that site is viable on every daily start t0, t0+1, ..., t0+k (cap 60)
  // If not viable at t0, tolerance is -1.
  let slipToleranceDays = -1;
  if (isPlannedViable) {
    let k = 0;
    while (k <= 60 && plannedDayIndex + k < numDays && row[plannedDayIndex + k].viable) {
      k++;
    }
    slipToleranceDays = k - 1;
  }

  const isFragile = isPlannedViable && slipToleranceDays < 3;

  // Earliest recovery days: smallest j > 0 that is viable again from slipped date
  let earliestRecoveryDays: number | null = null;
  if (!isViable) {
    for (let j = 1; j <= 60; j++) {
      const targetDay = slippedDayIndex + j;
      if (targetDay < numDays && row[targetDay].viable) {
        earliestRecoveryDays = j;
        break;
      }
    }
  }

  return {
    plannedDayIndex,
    slipDays,
    slippedDayIndex,
    isViable,
    slipToleranceDays,
    isFragile,
    earliestRecoveryDays,
    cellMetrics,
  };
}

/**
 * Compute rescue ranking according to Section 14:
 * (a) best alternative start at same site within +/- 30 days
 * (b) best other sites on the slipped date
 * (c) top 5 site-date pairs overall
 */
export function computeRescueCandidates(
  matrix: CellMetrics[][],
  siteNames: { id: string; name: string }[],
  siteIndex: number,
  slippedDayIndex: number,
  baseDateUtc: string,
  numDays: number = 731
): {
  altDates: RescueCandidate[];
  altSites: RescueCandidate[];
  topOverall: RescueCandidate[];
} {
  const baseScore = matrix[siteIndex][slippedDayIndex]?.score || 0;
  const getDateString = (dayIdx: number) => {
    const d = new Date(baseDateUtc);
    d.setUTCDate(d.getUTCDate() + dayIdx);
    return d.toISOString().split('T')[0];
  };

  // (a) Alternative dates for selected site within +/- 30 days
  const altDates: RescueCandidate[] = [];
  const minDay = Math.max(0, slippedDayIndex - 30);
  const maxDay = Math.min(numDays - 1, slippedDayIndex + 30);

  for (let d = minDay; d <= maxDay; d++) {
    if (d === slippedDayIndex) continue;
    const m = matrix[siteIndex][d];
    altDates.push({
      type: 'alt_date',
      siteId: siteNames[siteIndex].id,
      siteName: siteNames[siteIndex].name,
      dayIndex: d,
      dateUtc: getDateString(d),
      score: m.score,
      deltaScore: m.score - baseScore,
      viable: m.viable,
      sun_fraction: m.sun_fraction,
      earth_fraction: m.earth_fraction,
      longest_dark_gap_h: m.longest_dark_gap_h,
    });
  }

  // Sort viable first, then by score descending
  altDates.sort((a, b) => {
    if (a.viable !== b.viable) return a.viable ? -1 : 1;
    return b.score - a.score;
  });

  // (b) Alternative sites on the slipped date
  const altSites: RescueCandidate[] = [];
  for (let s = 0; s < siteNames.length; s++) {
    if (s === siteIndex) continue;
    const m = matrix[s][slippedDayIndex];
    altSites.push({
      type: 'alt_site',
      siteId: siteNames[s].id,
      siteName: siteNames[s].name,
      dayIndex: slippedDayIndex,
      dateUtc: getDateString(slippedDayIndex),
      score: m.score,
      deltaScore: m.score - baseScore,
      viable: m.viable,
      sun_fraction: m.sun_fraction,
      earth_fraction: m.earth_fraction,
      longest_dark_gap_h: m.longest_dark_gap_h,
    });
  }
  altSites.sort((a, b) => {
    if (a.viable !== b.viable) return a.viable ? -1 : 1;
    return b.score - a.score;
  });

  // (c) Top 5 overall site-date pairs within +/- 45 days
  const allCandidates: RescueCandidate[] = [];
  const startRange = Math.max(0, slippedDayIndex - 45);
  const endRange = Math.min(numDays - 1, slippedDayIndex + 45);

  for (let s = 0; s < siteNames.length; s++) {
    for (let d = startRange; d <= endRange; d++) {
      if (s === siteIndex && d === slippedDayIndex) continue;
      const m = matrix[s][d];
      if (m.viable) {
        allCandidates.push({
          type: 'top_overall',
          siteId: siteNames[s].id,
          siteName: siteNames[s].name,
          dayIndex: d,
          dateUtc: getDateString(d),
          score: m.score,
          deltaScore: m.score - baseScore,
          viable: m.viable,
          sun_fraction: m.sun_fraction,
          earth_fraction: m.earth_fraction,
          longest_dark_gap_h: m.longest_dark_gap_h,
        });
      }
    }
  }
  allCandidates.sort((a, b) => b.score - a.score);
  const topOverall = allCandidates.slice(0, 5);

  return {
    altDates: altDates.slice(0, 5),
    altSites: altSites.slice(0, 5),
    topOverall,
  };
}
