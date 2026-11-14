export interface Constants {
  R_MOON_M: number;
  R_SUN_KM: number;
  R_EARTH_KM: number;
  OBS_HEIGHT_M: number;
  AZ_STEP_DEG: number;
  T0_UTC: string;
  T1_UTC: string;
  STEP_MIN: number;
  N_STEPS: number;
  DISC_SAMPLES: number;
  TERRAIN_N: number;
  TERRAIN_HALF_M: number;
  ABCORR: string;
}

export interface TimeBlock {
  t0_utc: string;
  t1_utc: string;
  step_min: number;
  n_steps: number;
  days: number;
}

export interface TracksLayoutItem {
  name: string;
  dtype: string;
  byte_offset: number;
  length: number;
  byte_length: number;
}

export interface SiteMeta {
  id: string;
  name: string;
  lat_deg: number;
  lon_deg_east: number;
  program: string;
  source: string;
  obs_height_m: number;
  ground_height_m: number;
  effective_radius_km: number;
  terrain_z_min: number;
  terrain_z_max: number;
  files: {
    horizon: string;
    tracks: string;
    terrain: string;
  };
  variants: string[];
  tracks_layout: TracksLayoutItem[];
}

export interface Manifest {
  version: string;
  generated_utc: string;
  constants: Constants;
  time: TimeBlock;
  sites: SiteMeta[];
}

export interface HorizonVariant {
  elev_deg: number[];
  levels_used: string[];
  nan_fraction: number;
  runtime_s: number;
}

export interface HorizonData {
  az_step_deg: number;
  n: number;
  obs_height_m: number;
  variants: Record<string, HorizonVariant>;
}

export interface SiteTracks {
  sun_az: Float32Array;
  sun_el: Float32Array;
  earth_az: Float32Array;
  earth_el: Float32Array;
  earth_clearance: Float32Array;
  sun_vis_pct: Uint8Array;
  earth_vis_pct: Uint8Array;
  n_steps: number;
}

export interface PlannerParameters {
  stay_days: number;
  lit_threshold_pct: number;
  min_sun_fraction: number;
  max_dark_gap_hours: number;
  min_earth_fraction: number;
  antenna_mask_deg: number;
}

export interface CellMetrics {
  sun_fraction: number;
  earth_fraction: number;
  longest_dark_gap_h: number;
  longest_comms_outage_h: number;
  viable: boolean;
  score: number;
  // Diagnostics for "Why" box
  dark_gap_start_step: number;
  dark_gap_start_az: number;
  dark_gap_start_el: number;
  dark_gap_start_horizon: number;
  outage_start_step: number;
  outage_start_az: number;
  outage_start_el: number;
  outage_start_horizon: number;
}

export interface SlipAnalysis {
  plannedDayIndex: number;
  slipDays: number;
  slippedDayIndex: number;
  isViable: boolean;
  slipToleranceDays: number;
  isFragile: boolean;
  earliestRecoveryDays: number | null;
  cellMetrics: CellMetrics;
}

export interface RescueCandidate {
  type: 'alt_date' | 'alt_site' | 'top_overall';
  siteId: string;
  siteName: string;
  dayIndex: number;
  dateUtc: string;
  score: number;
  deltaScore: number;
  viable: boolean;
  sun_fraction: number;
  earth_fraction: number;
  longest_dark_gap_h: number;
}

export type MetricMode = 'combined' | 'power' | 'comms';
