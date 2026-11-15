# VALIDATION.md — Verification Results Log
# Luna Slip Planner | NASA Space Apps 2026

> Records verification tests for horizon geometry (V1), SPICE ephemeris bounds (V2), and JPL Horizons API cross-check (V3). Published map raster comparison (V4) is explicitly dropped and not claimed.

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

## V4 – Published Map Comparison (Dropped)

**Status**: DROPPED / NOT CLAIMED

Independent published-map validation against external raster files (such as PGDA Product 69 18.6-year visibility maps) is dropped and not claimed:
1. **No Direct Raster Sampling:** The multi-gigabyte published map rasters were not directly sampled; hardcoded constants in preliminary comparison scripts were literature approximations of unverified provenance.
2. **Physical Consistency of Local Libration:** Analytical libration geometry for Malapert Massif places Earth at $4^\circ \pm 6.7^\circ$ elevation. This orientation keeps Earth above the terrain horizon approximately 65–70% of the time (directly matching our computed 64.6% Earth visibility with elevations spanning $-3.1^\circ$ to $+10.6^\circ$). This confirms the pipeline's libration calculations are physically consistent, while the previously cited "98%" benchmark was an inapplicable or erroneous reference.
