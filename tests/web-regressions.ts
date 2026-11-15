import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SiteMetricsHelper, computeHeatmapMatrix, computeRescueCandidates } from '../web/src/workers/metrics';
import { parseUtc, horizonAt, validateHorizon, isLit, hasEarthLOS, lastStartDay } from '../web/src/data/science';
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
const diagnostic=helper.evaluateWindow(26*48,312,params,horizon.variants.best);
assert.ok(Math.abs(diagnostic.dark_gap_start_horizon+.349)<.02);
assert.ok(diagnostic.longest_dark_gap_h>90);
const rescue=computeRescueCandidates(fullMatrix,manifest.sites.map(s=>({id:s.id,name:s.name})),0,724,manifest.time.t0_utc);
for(const row of [...rescue.altDates,...rescue.altSites,...rescue.topOverall]) assert.ok(row.dayIndex<=724);
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
console.log('PASS: UTC, horizon schema/interpolation, 10,234 compact/full window comparisons, thresholds, data boundaries, rescue filtering, site-selection races.');
