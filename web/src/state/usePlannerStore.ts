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
import { fetchManifest, fetchTracks, fetchHorizon } from '../data/loader';
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
  plannedDayIndex: 12, // Jan 13, 2027 (Optimal Artemis III window with 100% Sun & Earth LOS)
  slipDays: 0,
  scrubStep: 0,
  isPlaying: false,
  playbackSpeed: 1,
  metricMode: 'combined',
  activeTab: 'planner',
  parameters: { ...ARTEMIS_PRESET },
  helpers: [],
  heatmapMatrix: null,
  currentHorizon: null,
  pinnedScenarios: [],
  isComparisonOpen: false,
  setIsComparisonOpen: (open: boolean) => set({ isComparisonOpen: open }),

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const manifest = await fetchManifest();
      const sites = manifest.sites;

      // Load all site tracks in parallel to enable instant heatmap computation
      const tracksPromises = sites.map((site) => fetchTracks(site));
      const allTracks = await Promise.all(tracksPromises);

      const helpers = allTracks.map((tracks) => new SiteMetricsHelper(tracks));

      // Compute initial heatmap matrix
      const heatmapMatrix = computeHeatmapMatrix(helpers, get().parameters, 731);

      // Select initial site
      const selectedSite = sites[0];
      const initialHorizon = await fetchHorizon(selectedSite);

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

    set({ selectedSiteId: siteId, scrubStep: 0 });
    try {
      const horizon = await fetchHorizon(site);
      set({ currentHorizon: horizon });
    } catch (e) {
      console.error('Failed to load horizon:', e);
    }
  },

  setPlannedDayIndex: (day: number) => {
    const clamped = Math.max(0, Math.min(730, day));
    set({ plannedDayIndex: clamped, scrubStep: 0 });
  },

  setSlipDays: (slip: number) => {
    const clamped = Math.max(-15, Math.min(60, slip));
    set({ slipDays: clamped, scrubStep: 0 });
  },

  setScrubStep: (step: number) => {
    set({ scrubStep: step });
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
    set({ activeTab: tab });
  },

  updateParameters: (partial: Partial<PlannerParameters>) => {
    const newParams = { ...get().parameters, ...partial };
    const { helpers } = get();
    if (helpers.length > 0) {
      const heatmapMatrix = computeHeatmapMatrix(helpers, newParams, 731);
      set({ parameters: newParams, heatmapMatrix });
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

    const d = new Date(manifest.time.t0_utc);
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

    return calculateSlipAnalysis(heatmapMatrix, siteIdx, plannedDayIndex, slipDays, 731);
  },

  getRescueCandidates: () => {
    const { heatmapMatrix, sites, selectedSiteId, plannedDayIndex, slipDays, manifest } = get();
    if (!heatmapMatrix || sites.length === 0 || !manifest) return null;

    const siteIdx = sites.findIndex((s) => s.id === selectedSiteId);
    if (siteIdx === -1) return null;

    const slippedDay = Math.max(0, Math.min(730, plannedDayIndex + slipDays));
    return computeRescueCandidates(
      heatmapMatrix,
      sites.map((s) => ({ id: s.id, name: s.name })),
      siteIdx,
      slippedDay,
      manifest.time.t0_utc,
      731
    );
  },
}));
