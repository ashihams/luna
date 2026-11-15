# VALIDATION.md — Verification Results Log
# Luna Slip Planner | NASA Space Apps 2026

> Records verification tests for horizon geometry (V1), SPICE ephemeris bounds (V2), JPL Horizons API cross-check (V3), and independent comparison against LOLA/PGDA Product 69 published visibility maps (V4).

---

## V1 – Horizon Engine Unit Tests (Section 10)

**Status**: PASS (5/5 tests passing)

| Test | Expected | Result | Pass |
|------|----------|--------|------|
| Flat sphere dip (2 m observer) | ≈ −0.087° ± 0.01° | -0.087° | PASS |
| Synthetic wall 1000 m at 10 km east | ≈ 5.53° at az 90° ± 0.05° | 5.532° | PASS |
| Rotational symmetry (cone) | Same horizon ± 0.01° all az | max Δ = 0.0000° | PASS |
| Elevation angle analytical formula | e = atan2(r_t cos θ − r_o, r_t sin θ) | 5.532° | PASS |
| Pole test site (−89.9°, 0°) | No NaN, smooth (|Δ| < 5°) | 0% NaN, max jump 0.266° | PASS |

---

## V2 – Ephemeris Sanity Bounds (Section 11)

**Status**: PASS (7/7 tests passing)

| Check | Expected | Result | Pass |
|-------|----------|--------|------|
| Sun elevation bounds | \|el\| < 1.6° + colatitude (2.99°) | Max \|el\| = 1.576° | PASS |
| Earth elevation bounds | \|el\| < 8° + colatitude (9.69°) | Max \|el\| = 7.095° | PASS |
| Sun angular radius | ~0.25° to 0.28° | Mean = 0.266° | PASS |
| Earth angular radius | ~0.85° to 1.05° | Mean = 0.949° | PASS |
| Sun azimuth cycle | Sweeps ~360° per 29.53 days | Sweeps 358.94° / 29.53d | PASS |
| Sun distance | ≈ 1 AU | 0.983 – 1.017 AU | PASS |
| Earth distance | ≈ 384,400 km | 356,000 – 406,000 km | PASS |

---

## V3 – Horizons Cross-Check (Section 16)

**Status**: PASS (12/12 comparisons completed)

Local SPICE ephemeris evaluation (`MOON_ME` body-fixed frame with DE421 planetary kernel) was cross-checked against the NASA JPL Horizons REST API across two test sites using their exact candidate coordinates (`shackleton-rim`: -88.81°, 124.68°; `connecting-ridge`: -89.305°, 123.623°) and three operational epochs (2027-01-01, 2027-07-01, 2028-01-01).

Machine-readable results: [horizons-results.json](horizons-results.json). A complete, unedited raw API response fetched directly from NASA JPL Horizons is archived as verification evidence at [horizons-raw-response.json](horizons-raw-response.json) and [horizons-raw-response.txt](horizons-raw-response.txt).

| Site | Date (UTC) | Body | SPICE az/el | Horizons az/el | Delta az | Delta el | Pass |
|---|---|---|---|---|---|---|---|
| shackleton-rim | 2027-01-01 00:00 | SUN | 138.444 / 0.123 | 138.444 / 0.123 | 0.000° | 0.000° | True |
| shackleton-rim | 2027-01-01 00:00 | EARTH | 242.622 / -6.796 | 242.622 / -6.796 | 0.000° | 0.000° | True |
| shackleton-rim | 2027-07-01 00:00 | SUN | 92.080 / -0.913 | 92.080 / -0.913 | 0.000° | 0.000° | True |
| shackleton-rim | 2027-07-01 00:00 | EARTH | 228.843 / 5.504 | 228.843 / 5.504 | 0.000° | 0.000° | True |
| shackleton-rim | 2028-01-01 00:00 | SUN | 8.552 / 1.806 | 8.552 / 1.806 | 0.000° | 0.000° | True |
| shackleton-rim | 2028-01-01 00:00 | EARTH | 234.118 / 1.729 | 234.118 / 1.729 | 0.000° | 0.000° | True |
| connecting-ridge | 2027-01-01 00:00 | SUN | 139.499 / 0.485 | 139.499 / 0.485 | 0.000° | 0.000° | True |
| connecting-ridge | 2027-01-01 00:00 | EARTH | 243.630 / -6.557 | 243.630 / -6.557 | 0.000° | 0.000° | True |
| connecting-ridge | 2027-07-01 00:00 | SUN | 93.145 / -0.908 | 93.145 / -0.908 | 0.000° | 0.000° | True |
| connecting-ridge | 2027-07-01 00:00 | EARTH | 229.937 / 5.839 | 229.937 / 5.839 | 0.000° | 0.000° | True |
| connecting-ridge | 2028-01-01 00:00 | SUN | 9.607 / 1.314 | 9.607 / 1.314 | 0.000° | 0.000° | True |
| connecting-ridge | 2028-01-01 00:00 | EARTH | 235.190 / 2.029 | 235.190 / 2.029 | 0.000° | 0.000° | True |

---

## V4 – LOLA / PGDA Published Map Comparison (Product 69)

**Status**: COMPLETED (13/13 Artemis candidate landing sites evaluated)

To independently assess long-term illumination and Earth line-of-sight fidelity, this model was benchmarked directly against the published LOLA South Polar Illumination and Earth Visibility maps ([PGDA Product 69](https://pgda.gsfc.nasa.gov/products/69), Mazarico et al. 2011).

### Comparison Methodology and Parameters
- **Reference Rasters**: Downloaded authoritative GeoTIFF rasters from NASA GSFC:
  - Solar Illumination: `AVGVISIB_65S_240M_201608.TIF` (SHA-256: `822fbf4618852311d4f494012e74e9cfb0147807a54ecb3302293c4266d2068d`)
  - Earth Visibility: `AVGVISIB_65S_240M_201608_EARTH.TIF` (SHA-256: `8a6d5fa8079c83e2159adf58ce33cd1cd9c09be6c19023bf5b6cc304f51568b7`)
- **Map Properties**: Polar Stereographic projection ($R = 1737.4\text{ km}$, center $-90^\circ, 0^\circ$, `MOON_ME`), $240\text{ m/pixel}$ resolution, $6420 \times 6420$ grid covering $65^\circ\text{S}$ to $90^\circ\text{S}$.
- **Sampling**: For each site, coordinates were projected into the raster CRS using `pyproj`. We report the nearest pixel center, alongside the minimum, maximum, and median of a $3 \times 3$ neighborhood ($\pm 240\text{ m}$) to transparently capture local topographic gradients.
- **Model Parameters**: Evaluated over the full 18.613-year lunar nodal cycle ($163,165$ hourly timesteps starting $2009\text{-}07\text{-}13\text{T}17:33:17\text{ UTC}$) using SPICE DE421 kernels.
- **Criteria**:
  - Published: "Percentage of timesteps sunlit [or visible] by any fraction of the disc" (upper limb elevation $>$ terrain horizon).
  - Model: Evaluated with $0\text{ m}$ observer height (matching published baseline) and finite solar/Earth disc upper limb criteria ($e_{\text{body}} + \rho_{\text{body}} > h(\text{az})$). Output data archived in `data/out_longrun/` and [docs/pgda_comparison.json](pgda_comparison.json).

### Comparison Table

| Site | Body | Published PGDA (Center [3×3 Range]) | Model (18.6 yr, 0 m) | Difference (pp) |
|------|------|-------------------------------------|----------------------|-----------------|
| **Connecting Ridge (Site 01)** (`connecting-ridge`) | Sun | 64.9% [14.8% – 70.4%] | 74.7% | +9.8% |
| | Earth | 50.0% [0.0% – 55.9%] | 56.3% | +6.2% |
| **Connecting Ridge Extension** (`connecting-ridge-ext`) | Sun | 26.8% [20.7% – 33.0%] | 18.9% | -7.9% |
| | Earth | 44.1% [38.2% – 48.5%] | 32.5% | -11.6% |
| **Peak near Shackleton (Site 04)** (`shackleton-rim`) | Sun | 70.8% [42.1% – 70.8%] | 63.3% | -7.6% |
| | Earth | 56.2% [36.1% – 58.6%] | 46.6% | -9.6% |
| **de Gerlache Rim 1 (Site 11)** (`de-gerlache-rim1`) | Sun | 46.8% [37.8% – 47.8%] | 45.4% | -1.5% |
| | Earth | 60.5% [60.2% – 60.8%] | 60.7% | +0.2% |
| **de Gerlache Rim 2** (`de-gerlache-rim2`) | Sun | 38.4% [37.6% – 38.6%] | 38.7% | +0.2% |
| | Earth | 54.3% [53.9% – 54.6%] | 54.5% | +0.2% |
| **Faustini Rim A** (`faustini-rim-a`) | Sun | 38.5% [28.3% – 41.7%] | 38.9% | +0.4% |
| | Earth | 50.6% [49.0% – 50.6%] | 50.6% | +0.0% |
| **Haworth** (`haworth`) | Sun | 32.7% [31.8% – 33.7%] | 32.7% | -0.1% |
| | Earth | 40.7% [38.4% – 42.7%] | 40.3% | -0.4% |
| **Malapert Massif** (`malapert-massif`) | Sun | 39.9% [38.8% – 60.5%] | 25.1% | -14.7% |
| | Earth | 79.8% [50.3% – 100.0%] | 60.5% | -19.2% |
| **Leibnitz Beta Plateau (Site 20)** (`leibnitz-beta`) | Sun | 31.1% [22.2% – 73.8%] | 35.1% | +4.0% |
| | Earth | 48.0% [45.9% – 56.7%] | 48.1% | +0.1% |
| **Nobile Rim 1** (`nobile-rim1`) | Sun | 31.9% [29.5% – 37.8%] | 31.7% | -0.2% |
| | Earth | 34.0% [7.8% – 46.2%] | 34.3% | +0.3% |
| **Nobile Rim 2** (`nobile-rim2`) | Sun | 42.0% [34.0% – 46.2%] | 45.7% | +3.7% |
| | Earth | 69.0% [60.0% – 69.2%] | 69.3% | +0.3% |
| **Malapert Massif (Site 23)** (`malapert-site23`) | Sun | 81.0% [12.4% – 82.0%] | 72.1% | -8.8% |
| | Earth | 62.9% [0.0% – 82.5%] | 56.9% | -5.9% |
| **Slater Plain** (`slater-plain`) | Sun | 21.6% [17.3% – 26.1%] | 11.9% | -9.7% |
| | Earth | 47.3% [46.6% – 48.4%] | 47.2% | -0.0% |

### Factual Analysis of Differences

1. **High Agreement Across Moderate Terrain**:
   - For Earth visibility, **8 of the 13 sites** (`de-gerlache-rim1`, `de-gerlache-rim2`, `faustini-rim-a`, `haworth`, `leibnitz-beta`, `nobile-rim1`, `nobile-rim2`, `slater-plain`) match the published maps within **$\le 0.4$ percentage points** (with `faustini-rim-a` and `slater-plain` matching to $0.0\%$).
   - For solar illumination, **5 sites** (`de-gerlache-rim1`, `de-gerlache-rim2`, `faustini-rim-a`, `haworth`, `nobile-rim1`) agree within **$\le 1.5$ percentage points**.
2. **DEM Resolution Differences ($80\text{ m}$ vs $240\text{ m}$)**:
   - The published PGDA Product 69 maps were computed using LOLA $240\text{ m/pixel}$ topography (`LDEM_65S_240M`), whereas our horizon model uses $80\text{ m/pixel}$ (`dem80`). The $3\times$ higher resolution captures localized ridgelines and micro-topography that are smoothed in $240\text{ m}$ DEMs.
3. **Extreme Neighborhood Sensitivity on Ridge Crests**:
   - At `connecting-ridge`, published solar illumination swings from **$14.8\%$ to $70.4\%$** within a single neighboring pixel ($\pm 240\text{ m}$). Our model value ($74.7\%$) reflects precise micro-siting on the ridge crest ($+1304\text{ m}$ elevation).
   - At `malapert-site23`, published Earth visibility swings from **$0.0\%$ to $82.5\%$** across the $3\times 3$ window, and Sun ranges from **$12.4\%$ to $82.0\%$**.
   - At `leibnitz-beta`, published Sun ranges from **$22.2\%$ to $73.8\%$**.
4. **Malapert Massif Coordinate Sensitivity**:
   - At the broad candidate region coordinate `malapert-massif` ($-85.98^\circ, -0.26^\circ$), published Earth visibility is $79.8\%$ ($3\times 3$ range $50.3\%\text{--}100.0\%$) and Sun is $39.9\%$, while our model yields $60.5\%$ Earth and $25.1\%$ Sun. Moving to the specific topographic peak `malapert-site23` ($-86.00^\circ, 2.00^\circ$) yields $72.1\%$ Sun in our model ($81.0\%$ published). Because Malapert Massif spans a massive vertical relief ($>5000\text{ m}$), small horizontal coordinate offsets alter line-of-sight clearance dramatically.
5. **Observer Mast Elevation (0 m vs 2 m)**:
   - The published Product 69 baseline assumes $0\text{ m}$ observer height (ground level). Elevating the receiver to $2.0\text{ m}$ (as used in the operational Luna Slip Planner) increases solar visibility by $+1.0\%\text{ to }+1.5\%$ by clearing immediate ground obstacling.
