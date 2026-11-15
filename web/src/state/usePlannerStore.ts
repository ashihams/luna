import { create } from 'zustand';
import {
  Manifest,
  SiteMeta,
  PlannerParameters,
  CellMetrics,
  MetricMode,
  SlipAnalysis,
  RescueCandidate,
  HorizonData,
} from '../types';
import { fetchManifest, fetchMetrics, fetchTracks, fetchHorizon } from '../data/loader';
import { lastStartDay, parseUtc } from '../data/science';
import {
  SiteMetricsHelper,
  computeHeatmapMatrix,
  calculateSlipAnalysis,
  computeRescueCandidates,
} from '../workers/metrics';

export interface PinnedScenario {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  dayIndex: number;
  dateUtc: string;
  slipDays: number;
  metrics: CellMetrics;
}

interface PlannerState {
  loading: boolean;
  error: string | null;
  manifest: Manifest | null;
  sites: SiteMeta[];
  selectedSiteId: string;
  plannedDayIndex: number;
  slipDays: number;
  scrubStep: number;
  isPlaying: boolean;
  playbackSpeed: number;
  metricMode: MetricMode;
  activeTab: 'landing' | 'planner' | 'site' | 'pole';
  parameters: PlannerParameters;
  helpers: SiteMetricsHelper[];
  heatmapMatrix: CellMetrics[][] | null;
  currentHorizon: HorizonData | null;
  detailLoading: boolean;
  detailError: string | null;
  pinnedScenarios: PinnedScenario[];

  // Actions
  initialize: () => Promise<void>;
  setSelectedSiteId: (siteId: string) => void;
  setPlannedDayIndex: (day: number) => void;
  setSlipDays: (slip: number) => void;
  setScrubStep: (step: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setMetricMode: (mode: MetricMode) => void;
  setActiveTab: (tab: 'landing' | 'planner' | 'site' | 'pole') => void;
  updateParameters: (params: Partial<PlannerParameters>) => void;
  isComparisonOpen: boolean;
  setIsComparisonOpen: (open: boolean) => void;
  applyPreset: (preset: 'artemis' | 'clps' | 'viper' | 'habitat') => void;
  pinCurrentScenario: (name?: string) => void;
  removePinnedScenario: (id: string) => void;

  // Computed getters
  getSlipAnalysis: () => SlipAnalysis | null;
  getRescueCandidates: () => {
    altDates: RescueCandidate[];
    altSites: RescueCandidate[];
    topOverall: RescueCandidate[];
  } | null;
}

export const ARTEMIS_PRESET: PlannerParameters = {
  stay_days: 6.5,
  lit_threshold_pct: 50,
  min_sun_fraction: 0.85,
  max_dark_gap_hours: 24,
  min_earth_fraction: 0.8,
  antenna_mask_deg: 0.0,
};

export const CLPS_PRESET: PlannerParameters = {
  stay_days: 14.0,
  lit_threshold_pct: 50,
  min_sun_fraction: 0.8,
  max_dark_gap_hours: 36,
  min_earth_fraction: 0.75,
  antenna_mask_deg: 0.0,
};

export const VIPER_PRESET: PlannerParameters = {
  stay_days: 21.0,
  lit_threshold_pct: 50,
  min_sun_fraction: 0.85,
  max_dark_gap_hours: 16,
  min_earth_fraction: 0.85,
  antenna_mask_deg: 1.5,
};

export const HABITAT_PRESET: PlannerParameters = {
  stay_days: 28.0,
  lit_threshold_pct: 40,
  min_sun_fraction: 0.75,
  max_dark_gap_hours: 48,
  min_earth_fraction: 0.70,
  antenna_mask_deg: 0.5,
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  loading: true,
  error: null,
  manifest: null,
  sites: [],
  selectedSiteId: 'connecting-ridge',
  plannedDayIndex: 12, // Jan 13, 2027 (initial study date; metrics are calculated from the loaded data)
  slipDays: 0,
  scrubStep: 0,
  isPlaying: false,
  playbackSpeed: 1,
  metricMode: 'combined',
  activeTab: (typeof window !== 'undefined' && ['planner', 'site', 'pole'].includes(window.location.hash.replace('#', ''))
    ? window.location.hash.replace('#', '')
    : 'landing') as 'landing' | 'planner' | 'site' | 'pole',
  parameters: { ...ARTEMIS_PRESET },
  helpers: [],
  heatmapMatrix: null,
  currentHorizon: null,
  detailLoading: false,
  detailError: null,
  pinnedScenarios: [],
  isComparisonOpen: false,
  setIsComparisonOpen: (open: boolean) => set({ isComparisonOpen: open }),

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const manifest = await fetchManifest();
      const sites = manifest.sites;

      // All-site metrics are losslessly packed; only the selected sky track is needed.
      const selectedSite = sites[0];
      const [allTracks, selectedTracks, initialHorizon] = await Promise.all([
        fetchMetrics(manifest), fetchTracks(selectedSite), fetchHorizon(selectedSite),
      ]);
      allTracks[0] = selectedTracks;

      const helpers = allTracks.map((tracks) => new SiteMetricsHelper(tracks));

      // Compute initial heatmap matrix
      const heatmapMatrix = computeHeatmapMatrix(helpers, get().parameters, 731);

      set({
        loading: false,
        manifest,
        sites,
        selectedSiteId: selectedSite.id,
        helpers,
        heatmapMatrix,
        currentHorizon: initialHorizon,
      });
    } catch (err: any) {
      console.error('Initialization error:', err);
      set({ loading: false, error: err.message || 'Failed to initialize data' });
    }
  },

  setSelectedSiteId: async (siteId: string) => {
    const { sites } = get();
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    set({ selectedSiteId: siteId, scrubStep: 0, currentHorizon: null, detailLoading: true, detailError: null, isPlaying: false });
    try {
      const [horizon, tracks] = await Promise.all([fetchHorizon(site), fetchTracks(site)]);
      if (get().selectedSiteId !== siteId) return;
      const helpers = [...get().helpers];
      helpers[sites.findIndex(s => s.id === siteId)] = new SiteMetricsHelper(tracks);
      set({ currentHorizon: horizon, helpers, detailLoading: false });
    } catch (e) {
      if (get().selectedSiteId === siteId) set({ detailLoading: false, detailError: String(e) });
    }
  },

  setPlannedDayIndex: (day: number) => {
    const max = lastStartDay(get().manifest?.time.n_steps ?? 35088, get().parameters.stay_days);
    const clamped = Math.max(0, Math.min(max, Math.round(day)));
    set({ plannedDayIndex: clamped, slipDays: Math.max(-clamped, Math.min(get().slipDays, max - clamped)), scrubStep: 0 });
  },

  setSlipDays: (slip: number) => {
    const max = lastStartDay(get().manifest?.time.n_steps ?? 35088, get().parameters.stay_days);
    const clamped = Math.max(-15, -get().plannedDayIndex, Math.min(60, max - get().plannedDayIndex, Math.round(slip)));
    set({ slipDays: clamped || 0, scrubStep: 0 });
  },

  setScrubStep: (step: number) => {
    set({ scrubStep: Math.max(0, Math.min(Math.round(get().parameters.stay_days * 48) - 1, Math.round(step))) });
  },

  setIsPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: speed });
  },

  setMetricMode: (mode: MetricMode) => {
    set({ metricMode: mode });
  },

  setActiveTab: (tab: 'landing' | 'planner' | 'site' | 'pole') => {
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash.replace('#', '');
      if (tab === 'landing') {
        if (currentHash !== '') {
          history.pushState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        if (currentHash !== tab) {
          window.location.hash = tab;
        }
      }
    }
    set({ activeTab: tab });
  },

  updateParameters: (partial: Partial<PlannerParameters>) => {
    const newParams = { ...get().parameters, ...partial };
    const { helpers } = get();
    if (helpers.length > 0) {
      const heatmapMatrix = computeHeatmapMatrix(helpers, newParams, 731);
      const max = lastStartDay(get().manifest?.time.n_steps ?? 35088, newParams.stay_days);
      const plannedDayIndex = Math.min(get().plannedDayIndex, max);
      const slipDays = Math.max(-plannedDayIndex, Math.min(get().slipDays, max - plannedDayIndex));
      set({ parameters: newParams, heatmapMatrix, plannedDayIndex, slipDays, scrubStep: 0 });
    } else {
      set({ parameters: newParams });
    }
  },

  applyPreset: (preset: 'artemis' | 'clps' | 'viper' | 'habitat') => {
    let targetParams = ARTEMIS_PRESET;
    if (preset === 'clps') targetParams = CLPS_PRESET;
    if (preset === 'viper') targetParams = VIPER_PRESET;
    if (preset === 'habitat') targetParams = HABITAT_PRESET;
    get().updateParameters(targetParams);
  },

  pinCurrentScenario: (name?: string) => {
    const { sites, selectedSiteId, plannedDayIndex, slipDays, manifest, heatmapMatrix } = get();
    if (!heatmapMatrix || !manifest) return;

    const siteIdx = sites.findIndex((s) => s.id === selectedSiteId);
    if (siteIdx === -1) return;

    const site = sites[siteIdx];
    const slippedDay = Math.max(0, Math.min(730, plannedDayIndex + slipDays));
    const cellMetrics = heatmapMatrix[siteIdx][slippedDay];

    const d = parseUtc(manifest.time.t0_utc);
    d.setUTCDate(d.getUTCDate() + slippedDay);
    const dateUtc = d.toISOString().split('T')[0];

    const scenario: PinnedScenario = {
      id: `${site.id}-${slippedDay}-${Date.now()}`,
      name: name || `${site.name.split('(')[0].trim()} (${dateUtc})`,
      siteId: site.id,
      siteName: site.name,
      dayIndex: slippedDay,
      dateUtc,
      slipDays,
      metrics: cellMetrics,
    };

    set({ pinnedScenarios: [...get().pinnedScenarios, scenario] });
  },

  removePinnedScenario: (id: string) => {
    set({
      pinnedScenarios: get().pinnedScenarios.filter((s) => s.id !== id),
    });
  },

  getSlipAnalysis: () => {
    const { heatmapMatrix, sites, selectedSiteId, plannedDayIndex, slipDays } = get();
    if (!heatmapMatrix || sites.length === 0) return null;

    const siteIdx = sites.findIndex((s) => s.id === selectedSiteId);
    if (siteIdx === -1) return null;

    const analysis = calculateSlipAnalysis(heatmapMatrix, siteIdx, plannedDayIndex, slipDays, 731);
    const { currentHorizon, helpers, parameters } = get();
    if (currentHorizon?.site_id === selectedSiteId && helpers[siteIdx].tracks.sun_az.length) {
      analysis.cellMetrics = helpers[siteIdx].evaluateWindow(
        analysis.slippedDayIndex * 48, Math.round(parameters.stay_days * 48), parameters, currentHorizon.variants.best,
      );
    }
    return analysis;
  },

  getRescueCandidates: () => {
    const { heatmapMatrix, sites, selectedSiteId, plannedDayIndex, slipDays, manifest } = get();
    if (!heatmapMatrix || sites.length === 0 || !manifest) return null;

    const siteIdx = sites.findIndex((s) => s.id === selectedSiteId);
    if (siteIdx === -1) return null;

    const slippedDay = Math.max(0, Math.min(730, plannedDayIndex + slipDays));
    return computeRescueCandidates(
      heatmapMatrix,
      sites.map((s) => ({
        id: s.id,
        name: s.name,
        lat_deg: s.lat_deg,
        lon_deg_east: s.lon_deg_east,
      })),
      siteIdx,
      slippedDay,
      manifest.time.t0_utc,
      731
    );
  },
}));
