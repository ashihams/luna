import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SiteMetricsHelper, computeHeatmapMatrix, computeRescueCandidates, computeLunarDistanceKm } from '../web/src/workers/metrics';
import { parseUtc, horizonAt, validateHorizon, isLit, hasEarthLOS, lastStartDay, lunarPolarXY } from '../web/src/data/science';
import { fetchManifest, fetchMetrics, fetchTracks } from '../web/src/data/loader';
import { usePlannerStore } from '../web/src/state/usePlannerStore';

const base = 'web/public/';
const files: string[] = [];
globalThis.fetch = (async (input: string) => {
  const name=String(input).split('?')[0].replace(/^\//,''); files.push(name);
  try { return new Response(fs.readFileSync(base + name)); }
  catch { return new Response('', {status:404}); }
}) as typeof fetch;
const manifest=await fetchManifest();
assert.equal(parseUtc('2027-01-01T00:00:00').toISOString(),'2027-01-01T00:00:00.000Z');
assert.equal(parseUtc('2027-01-01T05:30:00+05:30').toISOString(),'2027-01-01T00:00:00.000Z');
assert.equal(horizonAt([0,10,20,30],45),5);
assert.equal(horizonAt([0,10,20,30],315),15);
assert.equal(horizonAt([0,10,20,30],-45),15);
assert.equal(lastStartDay(35088,6.5),724);
// Independent pyproj coordinates in the official PGDA south-polar CRS.
const [polarX, polarY] = lunarPolarXY(-89.46, -136.68);
assert.ok(Math.abs(polarX + 11234.249821) < .001);
assert.ok(Math.abs(polarY + 11913.161960) < .001);
const horizon=validateHorizon(JSON.parse(fs.readFileSync(base+'data/horizon_connecting-ridge.json','utf8')),'connecting-ridge');
assert.throws(()=>validateHorizon({...horizon,variants:{best:{elev_deg:horizon.variants.best}}},'connecting-ridge'));
assert.throws(()=>validateHorizon(horizon,'wrong-site'));

const params={stay_days:6.5,lit_threshold_pct:50,min_sun_fraction:.85,max_dark_gap_hours:24,min_earth_fraction:.8,antenna_mask_deg:0};
const compact=await fetchMetrics(manifest);
const full=await Promise.all(manifest.sites.map(fetchTracks));
const compactMatrix=computeHeatmapMatrix(compact.map(t=>new SiteMetricsHelper(t)),params);
const fullMatrix=computeHeatmapMatrix(full.map(t=>new SiteMetricsHelper(t)),params);
for(let s=0;s<full.length;s++) for(let day=0;day<731;day++) {
  for(const field of ['complete','sun_fraction','earth_fraction','longest_dark_gap_h','longest_comms_outage_h','viable','score'] as const)
    assert.equal(compactMatrix[s][day][field],fullMatrix[s][day][field],`${s}/${day}/${field}`);
  if(day>724) assert.equal(fullMatrix[s][day].complete,false);
}
const helper=new SiteMetricsHelper(full[0]);
assert.equal(helper.evaluateWindow(-1,312,params).viable,false);
assert.equal(helper.evaluateWindow(35040,312,params).complete,false);
// Locate an actual dark window in the current dataset. A fixed old date may
// legitimately become fully lit when erroneous site coordinates are corrected.
const darkDay = fullMatrix[0].findIndex(cell => cell.complete && cell.longest_dark_gap_h > 0);
assert.ok(darkDay >= 0, 'Dataset must exercise dark-gap diagnostics');
const diagnostic=helper.evaluateWindow(darkDay*48,312,params,horizon.variants.best);
assert.ok(diagnostic.longest_dark_gap_h > 0);
assert.equal(diagnostic.dark_gap_start_horizon, horizonAt(horizon.variants.best, full[0].sun_az[diagnostic.dark_gap_start_step]));
const rescue=computeRescueCandidates(fullMatrix,manifest.sites.map(s=>({id:s.id,name:s.name})),0,724,manifest.time.t0_utc);
for(const row of [...rescue.altDates,...rescue.altSites,...rescue.topOverall]) assert.ok(row.dayIndex<=724);
// Unit tests for lunar surface distance & rescue ranking (Task A)
// (a) Known pairs
const poleStepKm = computeLunarDistanceKm(-90, 0, -89, 0);
assert.ok(Math.abs(poleStepKm - 30.3233) < 0.01, `Pole 1 deg step expected ~30.32 km, got ${poleStepKm}`);
const equatorQuarterKm = computeLunarDistanceKm(0, 0, 0, 90);
assert.ok(Math.abs(equatorQuarterKm - 2729.1038) < 0.01, `Equator 90 deg step expected ~2729.10 km, got ${equatorQuarterKm}`);
const crToCreKm = computeLunarDistanceKm(-89.305, 123.623, -88.99, 104.47);
assert.ok(Math.abs(crToCreKm - 12.8) < 0.2, `CR to CRE expected ~12.8 km, got ${crToCreKm}`);

const ridge = manifest.sites.find(s => s.id === 'connecting-ridge')!;
const extension = manifest.sites.find(s => s.id === 'connecting-ridge-ext')!;
assert.equal(ridge.lat_deg, -89.46);
assert.equal(ridge.lon_deg_east, -136.68);
assert.equal(extension.lon_deg_east, -104.47);
assert.ok(computeLunarDistanceKm(ridge.lat_deg, ridge.lon_deg_east, extension.lat_deg, extension.lon_deg_east) > 18);

// (b) Zero distance for same site
assert.equal(computeLunarDistanceKm(-89.305, 123.623, -89.305, 123.623), 0, 'Self-distance must be exactly 0');
assert.equal(computeLunarDistanceKm(0, 45, 0, 45), 0, 'Self-distance must be exactly 0');

// (c) Symmetry
assert.equal(
  computeLunarDistanceKm(-89.305, 123.623, -88.99, 104.47),
  computeLunarDistanceKm(-88.99, 104.47, -89.305, 123.623),
  'Distance calculation must be symmetric'
);
assert.equal(
  computeLunarDistanceKm(-85.43, 31.83, -88.81, 124.68),
  computeLunarDistanceKm(-88.81, 124.68, -85.43, 31.83),
  'Distance calculation must be symmetric for arbitrary sites'
);

// (d) Ordering rule in computeRescueCandidates
const siteListWithCoords = manifest.sites.map(s => ({
  id: s.id,
  name: s.name,
  lat_deg: s.lat_deg,
  lon_deg_east: s.lon_deg_east
}));
const rescueWithCoords = computeRescueCandidates(fullMatrix, siteListWithCoords, 0, 100, manifest.time.t0_utc);

// All altDates must have distance_km === 0
assert.ok(rescueWithCoords.altDates.length > 0);
for (const cand of rescueWithCoords.altDates) {
  assert.equal(cand.distance_km, 0, `alt_date candidate must have distance_km === 0, got ${cand.distance_km}`);
}

// altSites must have valid distances and follow ordering rule: viable first, then ascending distance, then descending score
assert.ok(rescueWithCoords.altSites.length > 0);
let seenNonViable = false;
for (let i = 0; i < rescueWithCoords.altSites.length; i++) {
  const cand = rescueWithCoords.altSites[i];
  assert.ok(typeof cand.distance_km === 'number' && cand.distance_km > 0, 'alt_site must have distance_km > 0');
  if (cand.viable) {
    assert.equal(seenNonViable, false, 'Viable candidate must never appear after a non-viable candidate');
  } else {
    seenNonViable = true;
  }
  if (i > 0) {
    const prev = rescueWithCoords.altSites[i - 1];
    if (prev.viable === cand.viable) {
      if (prev.distance_km! === cand.distance_km!) {
        assert.ok(prev.score >= cand.score, 'Equal distance must sort by score descending');
      } else {
        assert.ok(prev.distance_km! <= cand.distance_km!, 'Viable sites must sort by ascending distance');
      }
    }
  }
}

// Independently scan classifications to validate editable thresholds, not just default presets.
for(const threshold of [10,40,50,90]) for(const mask of [0,1.5,5]) {
  const p={...params,lit_threshold_pct:threshold,antenna_mask_deg:mask};
  const t=full[0], start=24*48, end=start+312;
  let run=0,max=0,earth=0;
  for(let i=start;i<end;i++){run=isLit(t.sun_vis_pct[i],threshold)?0:run+1;max=Math.max(max,run);earth+=Number(hasEarthLOS(t.earth_clearance[i],mask));}
  const cell=helper.evaluateWindow(start,312,p,horizon.variants.best);
  assert.equal(cell.longest_dark_gap_h,max*.5);assert.equal(cell.earth_fraction,earth/312);
}
files.length=0;
await usePlannerStore.getState().initialize();
assert.equal(usePlannerStore.getState().error,null);
usePlannerStore.getState().setPlannedDayIndex(730);
assert.equal(usePlannerStore.getState().plannedDayIndex,724);
usePlannerStore.getState().setSlipDays(60);
assert.equal(usePlannerStore.getState().slipDays,0);
usePlannerStore.getState().updateParameters({stay_days:28});
assert.equal(usePlannerStore.getState().plannedDayIndex,703);
assert.equal(usePlannerStore.getState().getSlipAnalysis()?.cellMetrics.complete,true);
usePlannerStore.getState().setPlannedDayIndex(0);usePlannerStore.getState().setSlipDays(-15);
assert.equal(usePlannerStore.getState().slipDays,0);
// Racing selections must retain the last requested site's horizon and tracks.
await Promise.all([usePlannerStore.getState().setSelectedSiteId('shackleton-rim'),usePlannerStore.getState().setSelectedSiteId('nobile-rim2')]);
assert.equal(usePlannerStore.getState().currentHorizon?.site_id,'nobile-rim2');
console.log('PASS: UTC, horizon schema/interpolation, 9,503 compact/full window comparisons, thresholds, data boundaries, rescue filtering, site-selection races, lunar great-circle distance & rescue ranking (Task A).');
