# Deployment audit — 2026-11-15

Target: https://lunaslipplanner.vercel.app

The corrected production deployment is live and passed the checks below. This is an implementation self-review, not an independent scientific certification. [Machine-readable deployment evidence](deployment-verification.json) records the deployment ID, timing, browser checks, and all asset hashes.

## Current deployment

- Deployment: `dpl_AEqAG7sKUnbqCtw9DTpCCeb97dnQ`, [immutable URL](https://lunar-slip-planner-o5vgbrv91.vercel.app).
- The public `lunaslipplanner.vercel.app` alias previously pointed to an old `dist` deployment. It was explicitly moved to the verified corrected deployment; testing was then repeated on this original public URL.
- All **44** scientific assets served by the public URL match local SHA-256 hashes: catalog, manifest, compact metrics bundle, all 13 horizons/tracks/terrain meshes, and pole overview files. Stable data paths revalidate; the catalog uses versioned asset requests.

## Browser results

Installed Chrome, isolated contexts, cache disabled. Desktop: 1440×900. Mobile emulation: 390×844, touch, DPR 3, 1.6 Mbps download, 0.75 Mbps upload, 150 ms latency, 4× CPU slowdown. This is not a physical-phone or Safari test.

| Check | Desktop | Simulated mobile |
|---|---:|---:|
| Planner slider ready | 1.685 s | 5.566 s |
| Console errors / failed requests | 0 / 0 | 0 / 0 |
| Terrain silhouettes | 1 | 1 |
| Site 3D canvas height | 811 px | 470 px |
| Scrub positions with shared sky/status result | 4 | 4 |
| Pole overview canvas | present | present |

Both viewports passed slip-slider changes and keyboard input, a 90% Sun threshold, a terrain-relative 1.5° antenna mask, stable WebGL canvas identity while scrubbing, visible model uncertainty, and error-free planner/Site 3D/Pole 3D routes. Desktop additionally selected **all 13 sites** and loaded each horizon, and clamped an end-of-dataset landing date to the last complete stay. Timing is one diagnostic run, not a service-level guarantee.

## Calculation and source checks

- `npm test`: all 9,503 compact/full window comparisons, editable thresholds, UTC handling, invalid-window rejection, rescue distance/ranking, site-selection races, and polar projection checks passed.
- Production TypeScript/Vite build passed.
- `pytest pipeline/validate`: **12 tests passed**, including missing-ground rejection, cache-coordinate invalidation, and pixel-center sampling.
- Live JPL Horizons: **12/12 comparisons passed**, using the corrected configured coordinates. This tests ephemeris geometry at a shared reference-sphere altitude, not terrain truth.
- All 13 exported tracks were regenerated from SPICE and their current horizons: angle/clearance errors stayed within export rounding; disc-percentage fields matched exactly. Observer heights matched direct sampling of the source DEM. [Reproduction report](production_integrity.json).

## Corrections made

Connecting Ridge and its extension had east/west longitude errors; Peak near Shackleton was assigned the wrong PGDA site number; Nobile Rim 2 was aligned with its cited center. Terrain windows now use integer pixel bounds, interpolate pixel centers, and invalidate caches when coordinates/source/bounds change. Missing observer ground or near/mid terrain aborts generation instead of supplying zero height or a flat horizon. All 13 production datasets were rebuilt. Pole markers had a north/south sign error that has also been corrected.

The landing page's fixed example result was removed and its copied code now uses the real API. The app visibly explains provisional uncertainty and its geometric assumptions. README, SOURCES, VALIDATION, and TIER1_REPORT now distinguish computed data, test fixtures, procedural visuals, and unresolved accuracy.

## Scientific status (replaces stale item 8)

`pgda_compare.py` samples actual PGDA Product 69 rasters; the former claim that it uses only hardcoded reference constants is obsolete. The corrected comparison using `any_disc_visible` is completed, with a median absolute Sun difference of 1.07 points and Earth difference of 0.18 points. Complete results are archived in [PGDA_RERUN_RESULTS.md](PGDA_RERUN_RESULTS.md) and [VALIDATION.md](VALIDATION.md); earlier aggregate agreement-count claims are not used in the submission.

Accuracy is still not established: Connecting Ridge Sun differs from its published center pixel by **32.31 points** (44.47% vs 76.78%), the alternate Malapert point by **26.20 points** (54.76% vs 80.96%), and three body/site results lie outside their 3×3 ranges. Micro-siting remains a hypothesis. The 20 m study is withdrawn because 11/13 near windows excluded the observer and missing-data fallbacks contaminated the result. Valid 20 m comparison remains pending after source download timeout. Production remains 80 m; the displayed ±10–30-point ridge caution is provisional, not a measured confidence interval or a guaranteed bound.

## Reproduce

```text
npm test
npm run build
python -m pytest pipeline/validate -q -p no:cacheprovider
python -m pipeline.validate.production_integrity
python -m pipeline.validate.pgda_compare
python -m pipeline.validate.horizons_check
node scripts/audit-deployed.mjs https://lunaslipplanner.vercel.app
node scripts/audit-browser.mjs https://lunaslipplanner.vercel.app .audit/recheck
```

The browser script uses installed Windows Chrome and makes no mocked network responses. Synthetic terrains and intentionally failed API responses exist only in unit tests. The renderer uses procedural appearance assets. Neither passing software checks nor genuine input provenance proves a future mission window will meet real operational requirements.
