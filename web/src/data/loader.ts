import { Manifest, SiteMeta, SiteTracks, HorizonData } from '../types';

let cachedManifest: Manifest | null = null;
const tracksCache: Map<string, SiteTracks> = new Map();
const horizonCache: Map<string, HorizonData> = new Map();

export async function fetchManifest(): Promise<Manifest> {
  if (cachedManifest) return cachedManifest;
  const res = await fetch('/data/manifest.json');
  if (!res.ok) {
    throw new Error(`Failed to load manifest.json: ${res.statusText}`);
  }
  cachedManifest = (await res.json()) as Manifest;
  return cachedManifest;
}

export async function fetchTracks(site: SiteMeta): Promise<SiteTracks> {
  if (tracksCache.has(site.id)) {
    return tracksCache.get(site.id)!;
  }

  const res = await fetch(`/${site.files.tracks}`);
  if (!res.ok) {
    throw new Error(`Failed to load tracks for ${site.id}: ${res.statusText}`);
  }
  const buffer = await res.arrayBuffer();

  const layout = site.tracks_layout;
  const findLayout = (name: string) => {
    const item = layout.find((l) => l.name === name);
    if (!item) throw new Error(`Missing layout item: ${name} in manifest for ${site.id}`);
    return item;
  };

  const sunAzItem = findLayout('sun_az');
  const sunElItem = findLayout('sun_el');
  const earthAzItem = findLayout('earth_az');
  const earthElItem = findLayout('earth_el');
  const earthClearItem = findLayout('earth_clearance');
  const sunVisItem = findLayout('sun_vis_pct');
  const earthVisItem = findLayout('earth_vis_pct');

  const nSteps = sunAzItem.length;

  const rawSunAz = new Uint16Array(buffer, sunAzItem.byte_offset, nSteps);
  const rawSunEl = new Int16Array(buffer, sunElItem.byte_offset, nSteps);
  const rawEarthAz = new Uint16Array(buffer, earthAzItem.byte_offset, nSteps);
  const rawEarthEl = new Int16Array(buffer, earthElItem.byte_offset, nSteps);
  const rawEarthClear = new Int16Array(buffer, earthClearItem.byte_offset, nSteps);
  const sunVisPct = new Uint8Array(buffer, sunVisItem.byte_offset, nSteps);
  const earthVisPct = new Uint8Array(buffer, earthVisItem.byte_offset, nSteps);

  // Convert centi-degrees to degrees (float32)
  const sunAz = new Float32Array(nSteps);
  const sunEl = new Float32Array(nSteps);
  const earthAz = new Float32Array(nSteps);
  const earthEl = new Float32Array(nSteps);
  const earthClearance = new Float32Array(nSteps);

  for (let i = 0; i < nSteps; i++) {
    sunAz[i] = rawSunAz[i] / 100.0;
    sunEl[i] = rawSunEl[i] / 100.0;
    earthAz[i] = rawEarthAz[i] / 100.0;
    earthEl[i] = rawEarthEl[i] / 100.0;
    earthClearance[i] = rawEarthClear[i] / 100.0;
  }

  const tracks: SiteTracks = {
    sun_az: sunAz,
    sun_el: sunEl,
    earth_az: earthAz,
    earth_el: earthEl,
    earth_clearance: earthClearance,
    sun_vis_pct: sunVisPct,
    earth_vis_pct: earthVisPct,
    n_steps: nSteps,
  };

  tracksCache.set(site.id, tracks);
  return tracks;
}

export async function fetchHorizon(site: SiteMeta): Promise<HorizonData> {
  if (horizonCache.has(site.id)) {
    return horizonCache.get(site.id)!;
  }

  const res = await fetch(`/${site.files.horizon}`);
  if (!res.ok) {
    throw new Error(`Failed to load horizon for ${site.id}: ${res.statusText}`);
  }
  const horizon = (await res.json()) as HorizonData;
  horizonCache.set(site.id, horizon);
  return horizon;
}
