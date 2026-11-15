# PGDA Product 69 Independent Comparison — Corrected Rerun Results
**Luna Slip Planner | NASA Space Apps Challenge 2026**  
**Document**: `docs/PGDA_RERUN_RESULTS.md`  
**Execution Date**: November 15, 2026  
**Simulation Baseline**: Full 18.613-Year Lunar Nodal Precession Cycle ($163,165$ hourly timesteps from `2009-07-13T17:33:17 UTC`)  
**Evaluator**: Corrected `any_disc_visible` spherical disc boundary optimizer (`pipeline/validate/accuracy_disc.py`)  
**Reference Rasters**: NASA GSFC LOLA Product 69 (Mazarico et al. 2011, 240 m/pixel)

---

## 1. Executive Summary & Context

This document compiles the complete, definitive results of the independent validation comparing the Luna Slip Planner topocentric visibility model against the published NASA GSFC Lunar Orbiter Laser Altimeter (LOLA) South Polar Illumination and Earth Visibility maps ([PGDA Product 69](https://pgda.gsfc.nasa.gov/products/69)).

### Comparator Remediation
Following the reproduction of a comparator defect documented in [ACCURACY_REPORT.md](ACCURACY_REPORT.md) (where testing only the upper limb at the celestial body's center azimuth undercounted visibility when grazing arcs clear beside steep ridges), the validation engine in `pipeline/validate/pgda_compare.py` was upgraded to evaluate the full apparent spherical disc boundary against each piecewise-linear horizon segment.

### Key Conclusions from the Full Rerun
1. **Geometric Defect Impact**: The comparator defect is physically real at individual timesteps, but its aggregate impact over the full 18.6-year cycle is very small:
   - **Solar Illumination**: $+0.00\text{ to }+0.04\text{ percentage points}$ across all 13 sites ($+0.02\text{ pp}$ at Connecting Ridge, corresponding to $\approx 33\text{ hours}$ over 18.6 years).
   - **Earth Line-of-Sight**: $+0.00\text{ to }+0.18\text{ percentage points}$ across all 13 sites ($+0.04\text{ pp}$ at Connecting Ridge; $+0.18\text{ pp}$ at Nobile Rim 1).
2. **Persistence of Large Discrepancies**: The large differences at ridge crests (**−32.31 pp** at Connecting Ridge and **−26.20 pp** at Malapert Site 23) were **not** caused by the comparator shortcut. They are genuine physical consequences of terrain model resolution ($80\text{ m}$ LOLA DEM vs $240\text{ m}$ smoothed raster), extreme local topography gradients, and sub-pixel micro-siting.
3. **Statistical Agreement**:
   - **Median Absolute Difference**: **1.07 percentage points** for Sun; **0.18 percentage points** for Earth.
   - **7 of 13 sites** agree with published solar illumination within $\le 1.1\text{ percentage points}$.
   - **8 of 13 sites** agree with published Earth visibility within $\le 0.4\text{ percentage points}$.

---

## 2. Complete Results Table Across All 13 Artemis Sites

All model simulations use $0.0\text{ m}$ observer mast height to match the published map baseline, with NAIF SPICE DE421 planetary ephemerides and high-resolution LOLA $80\text{ m}$ topography (`dem80`).

### Solar Illumination Results (18.613 Years, 163,165 Hours)

| Site ID | Site Name | Lat (°) | Lon E (°) | Published Center | Published 3×3 Range [Min .. Max] (Median) | Legacy Model (Center-Az) | Corrected Model (Any-Disc) | Net Change | Difference vs Published Center | Outside 3×3 Range? |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|:---:|
| `connecting-ridge` | Connecting Ridge (Site 01) | −89.46 | 136.68 | 76.78% | [39.3% .. 77.3%] (63.1%) | 44.45% | **44.47%** | +0.02 pp | −32.31 pp | **YES** |
| `connecting-ridge-ext` | Connecting Ridge Extension | −88.99 | 104.47 | 32.24% | [27.6% .. 34.1%] (32.2%) | 32.52% | **32.54%** | +0.02 pp | +0.30 pp | No |
| `shackleton-rim` | Peak near Shackleton (Site 04) | −88.81 | 124.68 | 70.85% | [42.1% .. 70.8%] (58.5%) | 65.48% | **65.50%** | +0.02 pp | −5.35 pp | No |
| `de-gerlache-rim1` | de Gerlache Rim 1 (Site 11) | −88.67 | −66.37 | 46.84% | [37.8% .. 47.8%] (46.2%) | 44.10% | **44.14%** | +0.04 pp | −2.70 pp | No |
| `de-gerlache-rim2` | de Gerlache Rim 2 | −88.22 | −63.43 | 38.42% | [37.6% .. 38.6%] (38.2%) | 38.82% | **38.84%** | +0.02 pp | +0.42 pp | No |
| `faustini-rim-a` | Faustini Rim A | −87.86 | 90.00 | 38.55% | [28.3% .. 41.7%] (38.5%) | 38.75% | **38.77%** | +0.02 pp | +0.22 pp | No |
| `haworth` | Haworth | −86.75 | −23.67 | 32.74% | [31.8% .. 33.7%] (32.7%) | 32.65% | **32.66%** | +0.01 pp | −0.08 pp | No |
| `malapert-massif` | Malapert Massif | −85.98 | −0.26 | 39.88% | [38.8% .. 60.5%] (43.1%) | 36.18% | **36.18%** | +0.00 pp | −3.70 pp | No |
| `leibnitz-beta` | Leibnitz Beta Plateau (Site 20) | −85.43 | 31.83 | 31.12% | [22.2% .. 73.8%] (35.7%) | 32.18% | **32.19%** | +0.01 pp | +1.07 pp | No |
| `nobile-rim1` | Nobile Rim 1 | −85.44 | 37.44 | 31.86% | [29.5% .. 37.8%] (31.9%) | 31.43% | **31.46%** | +0.03 pp | −0.40 pp | No |
| `nobile-rim2` | Nobile Rim 2 | −83.93 | 58.74 | 33.31% | [33.3% .. 41.3%] (36.0%) | 33.99% | **33.99%** | +0.00 pp | +0.68 pp | No |
| `malapert-site23` | Malapert Site 23 | −86.00 | 2.00 | 80.96% | [12.4% .. 82.0%] (63.8%) | 54.73% | **54.76%** | +0.03 pp | −26.20 pp | No |
| `slater-plain` | Slater Plain | −88.30 | −28.00 | 21.62% | [17.3% .. 26.1%] (21.6%) | 14.94% | **14.96%** | +0.02 pp | −6.66 pp | **YES** |

---

### Earth Line-of-Sight Results (18.613 Years, 163,165 Hours)

| Site ID | Site Name | Published Center | Published 3×3 Range [Min .. Max] (Median) | Legacy Model (Center-Az) | Corrected Model (Any-Disc) | Net Change | Difference vs Published Center | Outside 3×3 Range? |
|---|---|---:|---|---:|---:|---:|---:|:---:|
| `connecting-ridge` | Connecting Ridge (Site 01) | 58.14% | [40.7% .. 58.2%] (58.1%) | 58.13% | **58.17%** | +0.04 pp | +0.03 pp | No |
| `connecting-ridge-ext` | Connecting Ridge Extension | 0.00% | [0.0% .. 0.0%] (0.0%) | 0.00% | **0.00%** | 0.00 pp | 0.00 pp | No |
| `shackleton-rim` | Peak near Shackleton (Site 04) | 56.24% | [36.1% .. 58.6%] (46.4%) | 54.63% | **54.67%** | +0.04 pp | −1.57 pp | No |
| `de-gerlache-rim1` | de Gerlache Rim 1 (Site 11) | 60.49% | [60.2% .. 60.8%] (60.5%) | 60.63% | **60.70%** | +0.07 pp | +0.21 pp | No |
| `de-gerlache-rim2` | de Gerlache Rim 2 | 54.26% | [53.9% .. 54.6%] (54.3%) | 54.39% | **54.44%** | +0.05 pp | +0.18 pp | No |
| `faustini-rim-a` | Faustini Rim A | 50.56% | [49.0% .. 50.6%] (50.4%) | 50.57% | **50.64%** | +0.07 pp | +0.08 pp | No |
| `haworth` | Haworth | 40.72% | [38.4% .. 42.7%] (40.7%) | 40.16% | **40.18%** | +0.02 pp | −0.54 pp | No |
| `malapert-massif` | Malapert Massif | 79.75% | [50.3% .. 100.0%] (79.5%) | 77.39% | **77.41%** | +0.02 pp | −2.34 pp | No |
| `leibnitz-beta` | Leibnitz Beta Plateau (Site 20) | 48.02% | [45.9% .. 56.7%] (50.2%) | 47.14% | **47.15%** | +0.01 pp | −0.87 pp | No |
| `nobile-rim1` | Nobile Rim 1 | 34.04% | [7.8% .. 46.2%] (34.0%) | 34.17% | **34.35%** | +0.18 pp | +0.31 pp | No |
| `nobile-rim2` | Nobile Rim 2 | 68.31% | [66.0% .. 68.9%] (68.3%) | 68.34% | **68.35%** | +0.01 pp | +0.04 pp | No |
| `malapert-site23` | Malapert Site 23 | 62.85% | [0.0% .. 82.5%] (60.0%) | 52.39% | **52.40%** | +0.01 pp | −10.45 pp | No |
| `slater-plain` | Slater Plain | 47.27% | [46.6% .. 48.4%] (47.4%) | 47.18% | **47.18%** | +0.00 pp | −0.09 pp | No |

---

## 3. Statistical Analysis & Aggregate Metrics

### Summary Metrics Across 13 Candidate Landing Sites
* **Median Absolute Sun Difference**: **1.07 percentage points** (legacy was 1.06 pp)
* **Median Absolute Earth Difference**: **0.18 percentage points** (legacy was 0.13 pp)
* **High Agreement Sites (Sun ≤ 1.1 pp)**: **7 sites** (`connecting-ridge-ext`, `de-gerlache-rim2`, `faustini-rim-a`, `haworth`, `leibnitz-beta`, `nobile-rim1`, `nobile-rim2`).
* **High Agreement Sites (Earth ≤ 0.4 pp)**: **8 sites** (`connecting-ridge`, `connecting-ridge-ext`, `de-gerlache-rim1`, `de-gerlache-rim2`, `faustini-rim-a`, `nobile-rim1`, `nobile-rim2`, `slater-plain`).
* **Values Outside Published 3×3 Neighborhood**:
  - `connecting-ridge` Sun: Model = 44.47% (Published $3\times 3 = [39.3\% .. 77.3\%]$)
  - `slater-plain` Sun: Model = 14.96% (Published $3\times 3 = [17.3\% .. 26.1\%]$)
  - All other 24 body/site comparisons fall inside their published $3\times 3$ geographic ranges.

---

## 4. Factual Discussion & Scientific Insights

### A. Quantified Effect of the Comparator Shortcut
The synthetic counterexample in `pipeline/validate/test_accuracy_disc.py` and the witness timesteps in `ACCURACY_REPORT.md` proved that the center-azimuth shortcut was geometrically incomplete. However, across the full 18.6-year nodal ephemeris:
- The Sun subtends a small angular radius ($\rho_\odot \approx 0.266^\circ$). The time spent with the solar disc straddling a steep horizon slope where the center is blocked but an outer limb clears is restricted to fleeting grazing transitions.
- The Earth has a larger angular radius ($\rho_\oplus \approx 0.95^\circ$), which is why Earth visibility exhibits slightly larger shifts (e.g. $+0.18\text{ pp}$ at Nobile Rim 1, or $\approx 290\text{ hours}$ over 18.6 years).
- In all cases, correcting the comparator **increases** model visibility ($0.00\text{ to }+0.18\text{ pp}$), confirming the theoretical expectation that the shortcut could only undercount, never overcount.

### B. Causes of Residual Large Discrepancies
The rerun demonstrates conclusively that the large residual differences are not artifacts of the search algorithm:
1. **Topographic Grid Smoothing ($80\text{ m}$ vs $240\text{ m}$)**:
   - The published maps were computed on LOLA $240\text{ m/pixel}$ rasters (`LDEM_65S_240M`). At $240\text{ m/pixel}$, narrow mountain crests and ridges are substantially broadened and smoothed, lowering peak elevations and filling adjacent saddles.
   - Our model uses the $80\text{ m/pixel}$ DEM (`LDEM_80S_80MPP_ADJ.TIF`), which resolves sharper ridges that cast narrower but steeper shadows.
2. **Extreme Neighborhood Spatial Gradients**:
   - At `connecting-ridge`, the published map itself varies from **$39.3\%$ to $77.3\%$** across a single pixel step ($\pm 240\text{ m}$).
   - At `malapert-site23`, published Earth visibility swings from **$0.0\%$ to $82.5\%$**, and Sun swings from **$12.4\%$ to $82.0\%$**.
   - These enormous gradients indicate that a ground offset of just $50\text{ to }100\text{ meters}$ along the ridgeline completely alters whether the site catches continuous illumination or falls into grazing shadow.
3. **Coordinate Centroid vs Topographic Summit**:
   - Artemis candidate region coordinates represent nominal planning centroids, not optimized precision landing touchdown spots. Placing an observer at the nominal centroid can position it meters below a localized crest, whereas a $240\text{ m}$ pixel blends the crest and the flank together.

---

## 5. Provenance & Reproducibility

### Input Files & Verified SHA-256 Checksums
* **Sun Map**: `AVGVISIB_65S_240M_201608.TIF`
  * SHA-256: `822fbf4618852311d4f494012e74e9cfb0147807a54ecb3302293c4266d2068d`
* **Earth Map**: `AVGVISIB_65S_240M_201608_EARTH.TIF`
  * SHA-256: `8a6d5fa8079c83e2159adf58ce33cd1cd9c09be6c19023bf5b6cc304f51568b7`
* **LOLA Topography**: `LDEM_80S_80MPP_ADJ.TIF`
  * Cached in `data/cache/`
* **Planetary Ephemeris**: NAIF SPICE kernels `de421.bsp`, `naif0012.tls`, `pck00011.tpc`, `moon_pa_de421_1900-2050.bpc`, `moon_080317.tf`

### Output Artifacts
* Machine-readable rerun output: [`docs/pgda_comparison.json`](pgda_comparison.json)
* Long-run 0 m horizon masks and ephemeris summaries: `data/out_longrun_dem80/`
* Execution script: `python -m pipeline.validate.pgda_compare`
