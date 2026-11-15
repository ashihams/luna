import type { HorizonData } from '../types';

export const parseUtc = (value: string): Date =>
  new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`);

export const lastStartDay = (steps: number, stayDays: number): number =>
  Math.max(0, Math.floor((steps - Math.round(stayDays * 48)) / 48));

export function horizonAt(elevations: number[], azimuth: number): number {
  const index = ((azimuth % 360 + 360) % 360) * elevations.length / 360;
  const low = Math.floor(index);
  const fraction = index - low;
  return elevations[low] * (1 - fraction) + elevations[(low + 1) % elevations.length] * fraction;
}

export function validateHorizon(value: unknown, siteId: string): HorizonData {
  const h = value as HorizonData;
  if (!h || h.site_id !== siteId || h.n !== 720 || h.az_step_deg !== 0.5 ||
      !h.variants || !Array.isArray(h.variants.best) ||
      Object.values(h.variants).some(a => !Array.isArray(a) || a.length !== h.n || a.some(v => !Number.isFinite(v)))) {
    throw new Error(`Invalid horizon data for ${siteId}`);
  }
  return h;
}

export const isLit = (visiblePct: number, threshold: number): boolean => visiblePct > 0 && visiblePct >= threshold;
export const hasEarthLOS = (clearance: number, mask: number): boolean => clearance >= mask;
