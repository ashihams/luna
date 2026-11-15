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

**Status: HISTORICAL APPROXIMATE — comparator limitation identified; rerun pending.**

> **Note:** A concrete definition mismatch in the comparator was demonstrated after this comparison was run: the evaluator checked the disc's upper limb only at its center azimuth, missing visibility beside steep ridges. Two false-negative timesteps at Connecting Ridge (Sun and Earth) are documented in [ACCURACY_REPORT.md](ACCURACY_REPORT.md). The corrected comparator (`accuracy_disc.any_disc_visible`) is now in production in `pgda_compare.py`. The aggregate impact on the numbers below has not been measured. The existing table is retained as a historical record; it should not be used as a final accuracy figure.

**Previous status:** comparison completed; disagreements remain. Current results: [pgda_comparison.json](pgda_comparison.json). Source: [NASA PGDA Product 69](https://pgda.gsfc.nasa.gov/products/69).

We sample actual 240 m Sun/Earth rasters at each configured point, including the center and 3×3 neighborhood. The model uses corrected 80 m terrain, a 0 m observer, 163,165 hourly steps from 2009-07-13T17:33:17 UTC, and an upper-limb visibility approximation. The exact epoch equivalence to the reference map has not been independently established. The upper-limb test at center azimuth approximates visibility of any part of the disc across a varying skyline. These are limitations, not established causes of the differences.

Production is a different calculation: 2027–2028, 2 m observer, mean visible solar-disc area, and Earth-center clearance relative to an editable mask. Do not compare a production percentage directly to the long-run published percentage as if their definitions matched.

| Study point | Published Sun / model (%) | Sun difference (pp) | Published Earth / model (%) | Earth difference (pp) | Outside published 3×3 range |
|---|---:|---:|---:|---:|---|
| Connecting Ridge (Site 01) | 76.78 / 44.45 | -32.33 | 58.14 / 58.13 | -0.01 | none |
| Connecting Ridge Extension | 32.24 / 32.52 | +0.28 | 0.00 / 0.00 | +0.00 | none |
| Peak near Shackleton (Site 07) | 70.85 / 65.48 | -5.37 | 56.24 / 54.63 | -1.61 | none |
| de Gerlache Rim 1 (Site 11) | 46.84 / 44.10 | -2.74 | 60.49 / 60.63 | +0.14 | none |
| de Gerlache Rim 2 | 38.42 / 38.82 | +0.40 | 54.26 / 54.39 | +0.13 | sun |
| Faustini Rim A | 38.55 / 38.75 | +0.20 | 50.56 / 50.57 | +0.01 | none |
| Haworth | 32.74 / 32.65 | -0.09 | 40.72 / 40.16 | -0.56 | none |
| Malapert Massif | 39.88 / 36.18 | -3.70 | 79.75 / 77.39 | -2.36 | sun |
| Leibnitz Beta Plateau (Site 20) | 31.12 / 32.18 | +1.06 | 48.02 / 47.14 | -0.88 | none |
| Nobile Rim 1 | 31.86 / 31.43 | -0.43 | 34.04 / 34.17 | +0.13 | none |
| Nobile Rim 2 | 33.31 / 33.99 | +0.68 | 68.31 / 68.34 | +0.03 | none |
| Malapert Massif (Site 23) | 80.96 / 54.73 | -26.23 | 62.85 / 52.39 | -10.46 | none |
| Slater Plain | 21.62 / 14.94 | -6.68 | 47.27 / 47.18 | -0.09 | sun |

Median absolute Sun difference: **1.06 percentage points**. **3 body/site values** lie outside the published 3×3 range: de-gerlache-rim2 sun, malapert-massif sun, slater-plain sun. Use the individual final rows above; earlier aggregate agreement-count claims are not used in the submission. Neighborhood ranges are spatial summaries, not uncertainty intervals. Micro-siting, resolution, georeferencing, ray sampling, and ground-height differences remain possible contributors; this run does not isolate them.

The low median must not conceal outliers: **Connecting Ridge is 32.33 percentage points below the published center pixel**, and the alternate Malapert point is **26.23 points below**, despite both falling within broad neighborhood ranges. Neither result is validated as accurate at its exact coordinate. These are model estimates, not measured illumination or certified predictions.

### What was wrong in the previous report

[Archived old comparison](pgda_comparison_legacy.json) is retained only as historical evidence. Its agreement counts and numerical results are superseded and must not be reused in summaries or submission fields. The old differences could not be explained solely by being somewhere inside the sampled neighborhood.

The app's Connecting Ridge and extension longitudes had the wrong signs. Neither old Connecting Ridge point was inside the PGDA Site01 tile. The corrected points are −89.46°, −136.68° and −88.99°, −104.47°, following [Collins et al. 2024, Table 1](https://www.hou.usra.edu/meetings/lpsc2024/pdf/1775.pdf). The point at −88.81°, 124.68° is inside Site07 (Peak near Shackleton), not Site04. Nobile Rim 2's latitude was aligned with the same source (−83.95°). See [SOURCES.md](SOURCES.md).

Cached windows were keyed only by site name. Fractional window transforms and a missing half-pixel correction could shift the sampled surface. These have been fixed and all 13 production sites rebuilt. [Registration-only intermediate results](pgda_comparison_registration_only.json) retain the old coordinates and are not current predictions.

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
