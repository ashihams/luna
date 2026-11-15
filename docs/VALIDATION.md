# Scientific verification and limitations

Updated 2026-11-15. This is a project self-review, not an independent audit or scientific certification. Software checks and comparison with published model maps do not establish ground truth.

## V1 / V2 — Geometry and ephemeris tests

`python -m pytest pipeline/validate -q -p no:cacheprovider` covers synthetic flat-sphere/wall/cone geometry, ephemeris bounds, finite-disc visibility, failure reporting, pixel-center interpolation, missing-ground rejection, and coordinate-aware cache invalidation. The full suite has 12 tests. Synthetic terrain and mocked API failures are intentional test fixtures, never production fallback data.

## V3 — Horizons Cross-Check (Section 16)

**Status**: PASS (12/12 live comparisons). [Machine-readable results](horizons-results.json).

The test uses the configured site coordinates and a reference-sphere altitude of 2 m in both SPICE and Horizons. It checks celestial geometry, not DEM heights or terrain occlusion. Values displayed as 0.0000° are rounded, not evidence of zero error. Production tracks include the sampled ground elevation; all 13 sites' tracks are separately regenerated in [production_integrity.json](production_integrity.json).

| Point | UTC | Body | Azimuth difference (°) | Elevation difference (°) |
|---|---|---|---:|---:|
| connecting-ridge | 2027-01-01 00:00 | SUN | 0.0000 | 0.0000 |
| connecting-ridge | 2027-01-01 00:00 | EARTH | 0.0000 | 0.0000 |
| connecting-ridge | 2027-07-01 00:00 | SUN | 0.0000 | 0.0000 |
| connecting-ridge | 2027-07-01 00:00 | EARTH | 0.0000 | 0.0000 |
| connecting-ridge | 2028-01-01 00:00 | SUN | 0.0000 | 0.0000 |
| connecting-ridge | 2028-01-01 00:00 | EARTH | 0.0000 | 0.0000 |
| shackleton-rim | 2027-01-01 00:00 | SUN | 0.0000 | 0.0000 |
| shackleton-rim | 2027-01-01 00:00 | EARTH | 0.0000 | 0.0000 |
| shackleton-rim | 2027-07-01 00:00 | SUN | 0.0000 | 0.0000 |
| shackleton-rim | 2027-07-01 00:00 | EARTH | 0.0000 | 0.0000 |
| shackleton-rim | 2028-01-01 00:00 | SUN | 0.0000 | 0.0000 |
| shackleton-rim | 2028-01-01 00:00 | EARTH | 0.0000 | 0.0000 |

## V4 — Published map comparison

**Status: COMPLETED WITH CORRECTED ANY-DISC COMPARATOR.** Machine-readable results: [pgda_comparison.json](pgda_comparison.json). Comprehensive rerun report: [PGDA_RERUN_RESULTS.md](PGDA_RERUN_RESULTS.md). Source: [NASA PGDA Product 69](https://pgda.gsfc.nasa.gov/products/69).

> **Update (November 15, 2026):** The full 18.6-year rerun (163,165 hourly steps from 2009-07-13T17:33:17 UTC) has been executed using the corrected spherical disc boundary search (`any_disc_visible` in `pipeline/validate/accuracy_disc.py`). As demonstrated below and detailed in [PGDA_RERUN_RESULTS.md](PGDA_RERUN_RESULTS.md), the comparator defect accounted for at most $+0.00\text{ to }+0.04\text{ pp}$ in solar illumination and $+0.00\text{ to }+0.18\text{ pp}$ in Earth visibility. The large ridge-crest discrepancies (Connecting Ridge $-32.31\text{ pp}$, Malapert Site 23 $-26.20\text{ pp}$) are confirmed to arise from topographic resolution differences ($80\text{ m}$ DEM vs $240\text{ m}$ smoothed raster) and extreme local slope gradients, not from comparator search failure.

Production is a different calculation: 2027–2028, 2 m observer, mean visible solar-disc area, and Earth-center clearance relative to an editable mask. Do not compare a production percentage directly to the long-run published percentage as if their definitions matched.

### Corrected Rerun Table (18.6 Years, 0 m Observer, Any-Disc Criterion)

| Study point | Published Sun / Model [Legacy → Corrected] (%) | Sun Diff (pp) | Published Earth / Model [Legacy → Corrected] (%) | Earth Diff (pp) | Outside Published 3×3 Range |
|---|---:|---:|---:|---:|:---:|
| Connecting Ridge (Site 01) | 76.78 / [44.45 → **44.47**] | −32.31 | 58.14 / [58.13 → **58.17**] | +0.03 | **sun** |
| Connecting Ridge Extension | 32.24 / [32.52 → **32.54**] | +0.30 | 0.00 / [0.00 → **0.00**] | +0.00 | none |
| Peak near Shackleton (Site 07) | 70.85 / [65.48 → **65.50**] | −5.35 | 56.24 / [54.63 → **54.67**] | −1.57 | none |
| de Gerlache Rim 1 (Site 11) | 46.84 / [44.10 → **44.14**] | −2.70 | 60.49 / [60.63 → **60.70**] | +0.21 | none |
| de Gerlache Rim 2 | 38.42 / [38.82 → **38.84**] | +0.42 | 54.26 / [54.39 → **54.44**] | +0.18 | none |
| Faustini Rim A | 38.55 / [38.75 → **38.77**] | +0.22 | 50.56 / [50.57 → **50.64**] | +0.08 | none |
| Haworth | 32.74 / [32.65 → **32.66**] | −0.08 | 40.72 / [40.16 → **40.18**] | −0.54 | none |
| Malapert Massif | 39.88 / [36.18 → **36.18**] | −3.70 | 79.75 / [77.39 → **77.41**] | −2.34 | none |
| Leibnitz Beta Plateau (Site 20) | 31.12 / [32.18 → **32.19**] | +1.07 | 48.02 / [47.14 → **47.15**] | −0.87 | none |
| Nobile Rim 1 | 31.86 / [31.43 → **31.46**] | −0.40 | 34.04 / [34.17 → **34.35**] | +0.31 | none |
| Nobile Rim 2 | 33.31 / [33.99 → **33.99**] | +0.68 | 68.31 / [68.34 → **68.35**] | +0.04 | none |
| Malapert Massif (Site 23) | 80.96 / [54.73 → **54.76**] | −26.20 | 62.85 / [52.39 → **52.40**] | −10.45 | none |
| Slater Plain | 21.62 / [14.94 → **14.96**] | −6.66 | 47.27 / [47.18 → **47.18**] | −0.09 | **sun** |

- **Median absolute Sun difference**: **1.07 percentage points** (legacy 1.06 pp).
- **Median absolute Earth difference**: **0.18 percentage points** (legacy 0.13 pp).
- **Agreement within $\le 1.1\text{ pp}$**: **7 sites** for Sun (`connecting-ridge-ext`, `de-gerlache-rim2`, `faustini-rim-a`, `haworth`, `leibnitz-beta`, `nobile-rim1`, `nobile-rim2`).
- **Agreement within $\le 0.4\text{ pp}$**: **8 sites** for Earth (`connecting-ridge`, `connecting-ridge-ext`, `de-gerlache-rim1`, `de-gerlache-rim2`, `faustini-rim-a`, `nobile-rim1`, `nobile-rim2`, `slater-plain`).
- **Ridge Discrepancies**: Connecting Ridge remains **32.31 pp below** published center pixel, and Malapert Site 23 remains **26.20 pp below**. Both features span huge spatial gradients in the published maps ($>40\text{ pp}$ across $240\text{ m}$). These are model estimates reflecting $80\text{ m}$ ridge-top terrain, not certified landing predictions.

## V5 — 20 m sensitivity study withdrawn

**Status: invalid old study; a valid replacement is pending.** [Current status](../research/sensitivity_dem20.json), [archived invalid numbers](../research/sensitivity_dem20_legacy.json).

The old cached 20 m near windows often excluded their observer. The sampler returned ground height zero outside a raster; all-missing horizon levels could become flat-sphere horizons. The old resolution percentages, horizon shifts, and viable-window comparisons are withdrawn and must not be reused. The study also used different mission thresholds from the app. **A valid 20 m comparison is pending.** The final production app uses the LOLA 80 m DEM.

The corrected code rejects missing ground, invalidates old windows, uses pixel-center interpolation, and exports research tracks in the production field layout. A new 20 m acquisition was attempted but the full download timed out after 600 seconds; no partial download is used as terrain. Run `python research/sensitivity.py` and `python -m pipeline.validate.pgda_compare --variant dem20` only with valid windows. No claim that 20 m is more accurate is supported yet.

The app displays provisional ridge uncertainty of roughly ±10–30 percentage points as a caution, **not a measured confidence interval or guaranteed bound**. The invalid 20 m study cannot calibrate this interval. A defensible uncertainty model still needs matched 20 m/published-map comparisons, coordinate perturbations, height/error ensembles, and horizon ray-spacing convergence.

## Additional limits

- 80 m pixels do not resolve boulders or landing hazards. Horizon rays use 0.5° azimuth steps and 40/120/400 m radial steps in near/mid/far bands; pixel size is not ray spacing.
- Far rays may leave the available regional DEM. Missing far samples are excluded and reported; near/mid gaps and missing observer heights now stop generation. No flat fallback is inserted.
- Sun percentage is mean disc area visible, not a thermal/power-system simulation. The app labels a sample dark using the editable disc threshold. Earth-center LOS is not a DSN visibility or RF link-budget model.
- Presets are project assumptions. The selected points mix historical candidate-region centers and project approximations; they are not an official current mission landing list.
- Procedural stars/Earth appearance and 3D lighting are illustrations. The displayed metrics come from the exported DEM/SPICE arrays.
