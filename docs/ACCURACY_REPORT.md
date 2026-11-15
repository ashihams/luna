# Accuracy investigation: stopped at the Task 1 review gate

Date: 2026-11-15. Branch: `accuracy-diagnostics`. Baseline: `13b84ce`.

**A systematic defect was reproduced in the published-map visibility comparator. The terrain horizon engine's accuracy remains unknown.** The comparator checks the top of a disc only at its center azimuth. The published Sun and Earth definitions allow any part of the disc to be visible, including beside a ridge. The shortcut can therefore report blocked when part of the disc is visible.

Per rule 6, this investigation stops here for maintainer review. Tasks 2–5 were not started, and production data were not regenerated. No parameters were fitted to published values. No push, merge, deployment, UI edit, or edit to `web/public/data/` was made.

## What was run, and what was stopped

| Work | Status and evidence |
|---|---|
| Product 69 metadata and linked README | Read and saved; URLs, access dates and SHA-256 in [SOURCES.md](SOURCES.md#accuracy-diagnostics-product-69-input-contract-2026-11-15) and [provenance.json](../research/accuracy/provenance.json). |
| Sun/Earth PDS labels and existing GeoTIFF headers | Read; source terrain, definitions, raw-DN scale and pixel registration recorded. |
| Source terrain discovery | Labels name `LDEM_65S_240M`, but do not identify its revision. The inspected current archive index lacks that name. A same-resolution candidate, `LDEM_60S_240M` V2.0, has a later creation date; its label was downloaded, its DEM was not. |
| Task 1 visibility criterion | Synthetic counterexample and Sun/Earth witnesses in the frozen Connecting Ridge horizon reproduce the defect. Proposed evaluator and regression tests are on this branch. |
| Pixel convention | Test distinguishes affine center from upper-left corner coordinates. Actual map headers use the same affine. **No center-versus-corner visibility experiment was run.** |
| Sole-source terrain, 13 neighborhoods + 300 random pixels | **Not run:** stopped at the defect review gate before terrain acquisition or sample selection. |
| Like-for-like visibility statistics and scatter plot | **Not computed.** [likeforlike_results.json](likeforlike_results.json) contains explicit null statistics, not fabricated results. |
| Task 2 DEM alignment and full GeoTIFF analytic horizon | **Not started:** review gate. Existing window-registration tests do not substitute for the requested new full-path synthetic test. |
| Task 3 convergence | **Not started:** review gate. Numerical error is unknown. |
| Task 4 landing-area sensitivity | **Not started:** review gate. All sites' positional spreads and their ranking are unknown. |
| Task 5 verified 5 m terrain | **Not started:** review gate. No tile alignment or superiority claim. |

The initial shell downloads were blocked by the sandbox. The same official sources downloaded successfully with network permission. There is no unresolved download failure in this diagnostic. Source documentation still leaves the exact terrain revision, observer height, simulation epoch and ephemeris implementation unspecified; see SOURCES.md. Those unknowns prevent a claim of exact input equivalence even after correcting the comparator.

## Defect and controlled evidence

`pipeline/validate/pgda_compare.py::evaluate_visibility` computes:

```text
visible = body_center_elevation + angular_radius > horizon(center_azimuth)
```

That is sufficient for any-disc visibility, but it is not necessary. On a skyline that varies with azimuth, another part of the disc can clear lower terrain while the top at center azimuth remains blocked. Relative to the same fixed geometry, the shortcut can undercount any-disc visibility; it cannot introduce extra visible timesteps. This direction of bias follows from geometry, not from agreement with the published map.

The new synthetic regression uses a deliberately constructed ridge, not lunar reference data. The old comparator returns blocked. An independently checked point on the spherical disc clears the interpolated horizon. Tests also cover rotation, azimuth wrap, flat horizons, tangency, point sources, a visible arc between horizon knots, and rejection of unsupported polar discs.

The same failure occurs in the existing Connecting Ridge **0 m / 80 m** saved horizon. This separate reproduction holds that horizon, the configured kernels, observer ground height, historical epoch and hourly grid constant. It is **not the requested single-DEM published-map experiment**, and it makes no claim that this time grid matches PGDA. Moon-centered vectors were saved under `data/out_accuracy/` and converted to the local frame using the existing function.

| Body and computed UTC | Center azimuth | Center elevation | Disc radius | Horizon at center | Visible witness azimuth | Witness elevation | Horizon at witness |
|---|---:|---:|---:|---:|---:|---:|---:|
| Sun, 2010-03-04T07:33:16.998 | 94.158824° | -1.320027° | 0.268290° | -1.048259° | 94.216993° | -1.058116° | -1.061172° |
| Earth, 2009-10-12T21:33:17.001 | 136.736417° | -2.189036° | 0.988514° | -1.198678° | 136.500000° | -1.229184° | -1.254000° |

Both old decisions are blocked. Both witnesses clear the skyline: approximately **0.003056° for Sun** and **0.024816° for Earth**. An independent spherical dot-product calculation checks that each witness lies on the apparent disc. The positive clearance implies an exposed arc, not merely tangency. Full precision, file hashes and reproduction settings are in [criterion_diagnostic.json](../research/accuracy/criterion_diagnostic.json).

These are individual timestep counterexamples. **The aggregate percentage-point impact is unknown.** We stopped after the first witness per body. This result does not explain or correct the historical **32.33-point Connecting Ridge difference** reported in the unchanged [VALIDATION.md](VALIDATION.md). It does not prove a DEM alignment error or that a higher-resolution DEM is better. It also does not establish a fault in the production disc-area sampler, which is a different calculation in `pipeline/visibility.py`.

## Proposed minimal fix for review

`pipeline/validate/accuracy_disc.py::any_disc_visible` is a proposed diagnostic reference evaluator. It is deliberately **not connected to production or the existing V4 report writer**. No existing numerical output has been replaced.

For center elevation `e`, radius `r`, and azimuth displacement `d`, the spherical disc boundary satisfies:

```text
cos(r) = sin(e) sin(v) + cos(e) cos(v) cos(d)
```

The evaluator computes the upper solution `v` and searches its clearance above each piecewise-linear horizon segment across the disc's azimuth span. It checks segment boundaries and interior maxima, including azimuth wrap. The optimizer tolerance controls numerical search, not agreement with a reference value. Discs crossing a zenith or nadir are rejected explicitly; they are outside this near-horizon diagnostic's supported domain.

The proposed next change, after review, is to use this definition in the published-map comparator, retaining a separately named center-azimuth upper-limb diagnostic for comparison. Review numerical robustness and cost before using the reference evaluator in a large run. Do not change the production disc-area thresholds to mimic an any-disc reference. Then resume Task 1 using one documented terrain product at all distances, explicit unknown-input assumptions, the requested center/corner runs and the full sample design. Do not resume the later tasks before that review.

## What remains unknown

The like-for-like verdict is **unknown**, rather than “engine sound.” A defect is demonstrated in the validation comparator; correctness of the terrain engine is not decided by it. Median, 90th percentile, maximum absolute differences, and fractions within 1 or 3 points are all uncomputed for the requested sample. There is no valid new scatter plot.

DEM alignment, the cause of the withdrawn resolution study, numerical convergence error, and positional sensitivity remain unknown. The 20 m study remains withdrawn. No defensible uncertainty interval or per-site range can be derived from these witnesses. If landing-area experiments are later completed, a UI band could show the sampled minimum–maximum range with radius and assumptions displayed; it should not be labeled a confidence interval.

## Proposed wording changes for the maintainer

The files below were inspected but **not edited**.

| Production claim location | What this investigation supports | Recommended change |
|---|---|---|
| README.md, scientific limits | “Model estimates”; large unresolved differences; valid 20 m comparison pending. | Add: “The published-map comparator can miss disc visibility beside steep horizons. Its effect on the reported differences has not been measured; a like-for-like rerun is pending.” Label existing comparison figures as historical outputs of that comparator. |
| PROJECT_DETAILS.md, validation summary and submission fields | Real input provenance and explicit estimates; no accuracy or mission-window guarantee. | Keep the NASA input list and AI disclosure. Qualify the current comparison numbers with the comparator limitation; do not replace them with witness counts or imply that the discrepancy is resolved. |
| Landing page / `web/src/components/ModelNotice.tsx` | Exploratory estimates and unresolved higher-resolution accuracy. | Add a brief pending-validation notice. Do not present the existing provisional ridge range as a measured interval or as supported by this investigation. No new numerical band is supported yet. |
| `web/src/views/LandingPage.tsx`, Earth-visibility feature description | This investigation concerns geometric visibility only. | Replace the statement that antenna elevation masks prevent multipath loss with “Applies a configurable geometric elevation mask; radio-link and multipath performance are not modeled.” The libration description was not tested here and should not be presented as a finding from this report. |
| docs/VALIDATION.md, V4 | It already calls the upper-limb test an approximation. We now have concrete false-negative cases. | Link this report, state the demonstrated definition mismatch, and label V4 as a historical approximate comparison pending rerun. Keep the existing discrepancies visible with their provenance. |
| docs/VALIDATION.md, V1/V2 | Existing software checks still pass. | After review, update test coverage/count to include the comparator regressions; distinguish them from the still-unrun full GeoTIFF analytic horizon test. |
| Any claim of resolved micro-siting, aligned DEMs, calibrated uncertainty, or superior 20 m results | Not supported. | Use “unknown” or “pending the specified experiment.” Do not assign the remaining discrepancies to one cause. |

## Tests and unchanged production data

- `python -m pytest pipeline/validate -vv -p no:cacheprovider --basetemp=data/out_accuracy/pytest-full`: **25 passed**. This includes **13 new diagnostic cases** and the **12 existing tests**. The cached SPICE kernels were available; the ephemeris test ran. The run emitted 14 Affine multiplication deprecation warnings, no failures.
- Unmodified **`npm test`**: passed in `data/out_accuracy/npm-test-workspace`, using copies of the current scripts, source and production data. This is necessary because the command first writes derived data. It covered the existing **9,503 compact/full window comparisons**, UTC handling, schemas, thresholds, boundaries, rescue behavior and selection races.
- Live JPL Horizons requests were **not rerun**. The failure-reporting test intentionally simulates an unavailable API; it is not a live reference comparison. No test was skipped for missing kernels or network. The requested unperformed scientific experiments are listed separately above.
- SHA-256 hashes of **all 48 original `web/public/data/` files** matched before and after the diagnostic and test runs. See [test_results.json](../research/accuracy/test_results.json). Synthetic test fixtures are explicitly identified and are not production fallback data.

Reproduce from the repository root, with the existing dependencies and kernels:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
.venv/Scripts/python.exe -m research.accuracy.run_criterion_diagnostic
.venv/Scripts/python.exe -m research.accuracy.run_checks
```

The witness reproduction uses the committed frozen historical horizon in `research/accuracy/`, checks its expected hash before running, and does not regenerate it. Raw vectors, test workspaces and logs stay under ignored `data/out_accuracy/`. Source snapshots, evidence, tests and this report are reviewable on the branch. Maintainer review is the next step required by rule 6.

---

## Addendum — Completed Full-Span Rerun (2026-11-15)

The full 18.6-year rerun (163,165 hourly steps from 2009-07-13T17:33:17 UTC) using `pipeline/validate/accuracy_disc.py::any_disc_visible` has now been executed across all 13 candidate sites; see [PGDA_RERUN_RESULTS.md](PGDA_RERUN_RESULTS.md).

Key empirical findings of the rerun:
1. **Measured Aggregate Impact**:
   - Solar Illumination: +0.00 to +0.04 percentage points across all sites (+0.02 pp at Connecting Ridge, corresponding to ~33 hours over 18.6 years).
   - Earth Line-of-Sight: +0.00 to +0.18 percentage points across all sites (+0.04 pp at Connecting Ridge, +0.18 pp at Nobile Rim 1).
2. **Persistence of Large Ridge Discrepancies**:
   - Connecting Ridge Sun: 44.47% model vs 76.78% published (−32.31 pp).
   - Malapert Site 23 Sun: 54.76% model vs 80.96% published (−26.20 pp).
   - Malapert Site 23 Earth: 52.40% model vs 62.85% published (−10.45 pp).
   These differences are confirmed to result from topographic grid resolution (80 m DEM vs 240 m smoothed raster) and extreme local slopes (>40 pp across 240 m), not from comparator search failure.
3. **Summary Metrics**:
   - Median absolute Sun difference: **1.07 pp** (was 1.06 pp).
   - Median absolute Earth difference: **0.18 pp** (was 0.13 pp).
   - 7 of 13 sites agree within <= 1.1 pp for Sun; 8 of 13 sites agree within <= 0.4 pp for Earth.

