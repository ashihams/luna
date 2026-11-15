# Deployment audit — 2026-11-15

Target: https://lunaslipplanner.vercel.app

Initial verdict: genuine precomputed data and functioning desktop metrics, with blockers in mobile usability, cold loading, horizon visualization, and validation claims. The initial findings below are retained as historical evidence; the remediation section records subsequent fixes.

## Remediation — 2026-11-15

- Restored the shared horizon array contract, validated incoming horizon files, closed the silhouette correctly at 360°, and restored the 3D occlusion ring. Selected-window diagnostics now interpolate the actual horizon instead of defaulting to zero.
- Shared Sun/Earth threshold functions now drive metrics, sky markers, live status, and countdowns. The antenna mask follows terrain, the elevation axis adapts to the displayed tracks, and the 3D illumination no longer applies an arbitrary −0.5° cutoff. The Why Box distinguishes partial illumination from a threshold-defined dark gap.
- Added mobile constraint/rescue panels, always-accessible site/date controls, a scrollable heatmap, and an explicit-height 3D scene. Fixed arrow-key handling so sliders retain keyboard input. Time scrubbing updates an existing WebGL canvas rather than rebuilding it.
- Made all exported timestamps explicitly UTC, with defensive UTC parsing. Day and slip limits account for stay duration; incomplete windows are gray/unavailable and excluded from rescue candidates.
- Replaced eager fetching of all full tracks with a lossless compact visibility bundle plus the selected site's full track. All 9,503 windows (13 sites × 731 days) produce identical complete-window metrics to the full-track calculation. All-site visibility transfer falls from about 1.98 MB to 329 KB compressed. Initial JS is about 69 KB compressed; Three.js loads on demand.
- Added a revalidated catalog and content-versioned data requests, avoiding the previous immutable-manifest cache trap. Stable data paths now revalidate.
- Removed unsupported published-map and timing claims from the landing page/README and refreshed the demo script. The exploratory PGDA script cannot certify V4 or overwrite its status with PASS. The Horizons checker records errors, requires all 12 comparisons, refreshes existing documentation, and exits nonzero on incomplete/failed runs.

### Verification of fixes

- `npm test`: UTC parsing, horizon schema and wrap interpolation, 9,503 compact/full window comparisons, independently scanned thresholds, invalid-window rejection, rescue limits, and concurrent site-selection regression checks pass.
- Python validation: **9 tests pass**, including a regression that makes all Horizons queries fail and verifies the result is INCOMPLETE rather than PASS.
- Live NASA Horizons run: **12/12 comparisons pass**; recorded in [horizons-results.json](horizons-results.json) and [VALIDATION.md](VALIDATION.md).
- Production build succeeds with 3D split into separate chunks.
- Local production preview, same cold-cache mobile network/CPU settings as the initial audit: **4.776 seconds** to planner readiness on the final check (previous live version: 26.052 seconds). This local preview result is not a production network measurement. Initial recorded resources are about **556 KB compressed**, versus about 2.21 MB before.
- Both viewports render one terrain silhouette; mobile 3D canvas is **383×470 CSS pixels**. Keyboard slider input, four scrub positions, 90% solar threshold, terrain-relative 1.5° antenna mask, shared sky/status classification, and stable canvas identity pass. No console errors or failed requests in the exercised routes. Evidence: `../.audit/final-local/browser-results.json`.

Limitations: physical Android/iPhone/Safari tests remain unperformed. V4 independent published-map validation remains incomplete and is labeled accordingly; the fixes do not establish terrain accuracy against those maps.

## Method and scope

Used installed Chrome headlessly through the DevTools Protocol, in two new isolated private contexts with browser cache disabled. Desktop viewport: 1440×900, native network/CPU. Mobile emulation: 390×844, DPR 3, touch enabled, 1.6 Mbps download, 0.75 Mbps upload, 150 ms network latency, 4× CPU slowdown. These are single-run diagnostic measurements, not tests on a physical phone or laptop or Safari. A mobile user agent was not overridden. Timing ends when the planner slider mounts, not merely when the landing page or loading spinner paints. Both runs started directly at `/#planner` and visited Site 3D and Pole 3D.

Raw results, screenshots, and repeatable audit scripts are in `../.audit/`. No application source or deployed version was changed by this audit. Documentation was corrected to qualify V4 claims.

## Checklist results

| Check | Result | Evidence |
|---|---|---|
| Cold load under about 10 seconds | Desktop passes; simulated mobile fails | Planner mounted after 5.038 s desktop and 26.052 s mobile. First contentful paint was 1.964 s and 2.204 s, respectively; an early spinner is not readiness. |
| Console and failed requests | Pass for the exercised routes | No captured JavaScript exceptions, console errors, failed requests, or HTTP error responses. Terrain and pole data loaded. Silent rendering failures still exist. |
| Real data | Pass for provenance path and reproducibility checks | All 14 binary tracks are requested; metrics read their arrays. Deployed manifest and Connecting Ridge tracks/horizon are byte-identical to local files by SHA-256. Regenerated Connecting Ridge ephemerides match exported tracks within about 0.00502°. |
| Physical sanity | Pass for tested numerical bounds | Connecting Ridge Sun −2.24°…+2.24°, Earth −7.41°…+6.21°. Shackleton Sun −2.74°…+2.74°, Earth −7.68°…+5.91°. Latitude offset from the exact pole must be included in the approximate ±2°/±8° rule. No overhead-Sun convention error was found. |
| Slip slider | Responds correctly in tested desktop sequence | At +5 days Earth LOS falls to 92%; +6 gives 98% Sun, 77% Earth, 2.5 h dark; +7 gives 84%, 62%, 26.5 h; +10 gives 46%, 15%, 53.5 h. Initial +0…+4 stays at 100% because the data really does. Inputs use whole-day increments and dark gaps use half-hour samples, so smoothness does not mean continuous interpolation. Mobile values updated programmatically, but the control is not practically usable in the broken layout. |
| Metrics match sky | Fail | Terrain silhouette absent in both live browser runs; horizon diagnostics default to zero; 3D illumination uses an inconsistent elevation cutoff. |
| Validation | Partial | File exists; eight tests pass; one live JPL spot-check agrees. Published-map comparison is not established, and the documented V4 numbers do not meet the script's overall pass criterion. |

## Priority findings

1. **Horizon JSON contract is wrong in both visualizations.** `pipeline/export.py` emits `variants.best` as a 720-element array. `web/src/types.ts` describes an object containing `elev_deg`; `SkyPlot.tsx:239` and `SiteScene.tsx:237` consequently skip the silhouette and distant occlusion ring. The live SVG contained zero horizon paths. Fix the data contract and validate JSON at the loader boundary. The sky polygon also wraps its last azimuth to 0 instead of closing at 360, which needs correction when restoring drawing.

2. **Mobile layout hides the central task.** The fixed-width constraints/rescue columns squeeze away the planner and slider at 390 px. Site 3D has a measured canvas rectangle of 389×0 CSS pixels. Screenshots: `../.audit/mobile-4g-planner.png` and `../.audit/mobile-4g-site.png`. Use mobile drawers/stacking and explicit usable canvas height.

3. **Cold load waits for every track.** `initialize()` fetches all 14 tracks before rendering the planner. These total 5,894,784 bytes decoded and 1,978,096 bytes compressed on this deployment. Recorded initial resources total about 2.21 MB compressed, excluding inaccessible cross-origin size details. The main JS bundle is about 803 KB decoded / 220 KB transferred and eagerly includes the 3D code. Prioritize a compact heatmap summary, selected-site loading, deferred remaining tracks, and lazy 3D imports. Server compression is already working. The observation supports reducing initial work; it does not prove file size is the only latency cause.

4. **Why Box reports a fabricated zero crest.** `computeHeatmapMatrix()` calls `evaluateWindow()` without its optional horizon argument, leaving all crest diagnostics at 0°. For Connecting Ridge +14 days, the live page showed +0.00°, whereas supplying the real horizon gives approximately −0.346° at the longest dark-gap start. Calculate diagnostics for the selected scenario with its horizon, using consistent interpolation; avoid asserting terrain occlusion when there is no dark gap.

5. **UTC labels are shifted by the viewer's timezone.** Manifest timestamps omit `Z`. `new Date(manifest.time.t0_utc)` interprets them locally before converting to ISO/UTC. In Asia/Calcutta the intended Jan 13 baseline appeared Jan 12, and the intended Jan 27 00:00 sample was labeled Jan 26 18:30 UTC. Export explicitly UTC timestamps and parse them consistently.

6. **Displayed lighting and statuses use different rules.** `SiteScene.tsx:403` turns off solar lighting below −0.5° even when the precomputed Sun is visible above a depressed terrain horizon. Connecting Ridge has 4,987 half-hour samples with Sun below −0.5° and at least 50% disc visibility. `SiteView.tsx:40` uses fixed 50% Sun and 0° Earth thresholds, ignoring edited settings. The plotted antenna mask is horizontal instead of terrain-relative. The plot's fixed −5°…+10° axis also clips some valid Earth/Sun elevations. Shared visibility rules should drive metrics, labels, and rendering.

7. **Incomplete end-of-dataset missions can be called viable.** `evaluateWindow()` silently truncates stays at the end of 2028 and normalizes over the shorter window. Six sites were marked viable on day 730 for a requested 6.5-day mission with only one day of data available. Mark insufficient-data windows unavailable and constrain launch/slip ranges; edge clamping can otherwise make the slider appear frozen.

8. **Validation claims overstate the evidence.** `pgda_compare.py` compares against hardcoded reference percentages; it does not sample a PGDA raster. The model means in its existing table reproduce from exported data, but reference provenance/site correspondence is unverified. Every recorded solar comparison exceeds five percentage points. Two Earth comparisons exceed 30 points. The script requires both metrics to pass, so none of its five rows is a full pass. [PGDA's official description](https://pgda.gsfc.nasa.gov/products/69) also uses a finite disc and any-part-visible Earth criterion, unlike this script's Earth-center test. The former point-source explanation in VALIDATION.md was incorrect. README and validation documentation have been qualified; the deployed landing page's validation presentation still needs review.

## Additional validation evidence

- `.venv/Scripts/python.exe -m pytest pipeline/validate -q -p no:cacheprovider`: **8 passed** in 11.65 s. This does not run the standalone PGDA and Horizons cross-check scripts.
- `npm.cmd run build --prefix web`: **passed**, with a warning for a JS chunk larger than 500 KB.
- Recomputed solar disc visibility from exported angles/horizons using a constant 0.266° radius: per-site mean absolute differences were below 0.067 percentage points; no sample differed by more than 10 points. This is an internal consistency check, not independent terrain validation. Recomputed Earth clearance differs by at most about 0.012°, consistent with exported angle rounding.
- Independent Horizons spot-check for Shackleton at −88.81°, 124.68°E, height 2 m, 2027-01-01 00:00 UTC: Sun az/el **138.443517° / 0.123473°**; local SPICE **138.44351244° / 0.12348084°**. Differences below 0.000008° support the rounded `0.0000°` result for this one row. The remaining 11 V3 rows were not independently rerun. Response saved in `../.audit/horizons-reference.json`.
- `horizons_check.py` catches API errors and continues without marking the overall result incomplete/failed. It could print ALL PASSED with no successful comparisons. It also only replaces a PENDING documentation section, so rerunning it does not refresh the existing PASS table.
- The README demo numbers do not match the current live default scenario: measured tolerance is 5 days, and +14 has a 92.5 h maximum dark gap. Re-record demo figures after fixes.
- `/data/*` uses a one-year immutable cache policy on stable filenames, including the manifest. This can leave returning visitors with stale scientific data after a deployment; version content and revalidate the manifest.

Recommended fix order: restore the horizon contract and diagnostics; fix mobile layout and UTC handling; reject incomplete windows; align visibility semantics; reduce cold-load work; perform and archive a properly matched published-map comparison; rerun the same browser checks plus physical Android/iPhone tests.
