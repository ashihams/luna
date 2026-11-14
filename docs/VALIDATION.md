# VALIDATION.md — Validation results log
# Slip Planner | NASA Space Apps 2026

> Every validation result is recorded here. All V1–V4 must pass before the UI is built beyond a stub.

---

## V1 – Horizon Engine Unit Tests (Section 10)

**Status**: PASS

| Test | Expected | Result | Pass |
|------|----------|--------|------|
| Flat sphere dip (2 m observer) | ≈ −0.087° ± 0.01° | -0.087° | PASS |
| Synthetic wall 1000 m at 10 km east | ≈ 5.53° at az 90° ± 0.05° | 5.532° | PASS |
| Rotational symmetry (cone) | Same horizon ± 0.01° all az | max Δ = 0.0000° | PASS |
| Elevation angle analytical formula | e = atan2(r_t cos θ − r_o, r_t sin θ) | 5.532° | PASS |
| Pole test site (−89.9°, 0°) | No NaN, smooth (|Δ| < 5°) | 0% NaN, max jump 0.266° | PASS |

---

## V2 – Ephemeris Sanity Bounds (Section 11)

**Status**: PASS

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

**Status**: PASS (Cross-checked SPICE DE421 / MOON_ME vs JPL Horizons Web API)

| Site | Date | Body | SPICE az/el | Horizons az/el | Δ az | Δ el | Pass |
|------|------|------|-------------|----------------|------|------|------|
| shackleton-rim | 2027-01-01 00:00 | SUN | 138.44° / 0.123° | 138.44° / 0.123° | 0.0000° | 0.0000° | PASS |
| shackleton-rim | 2027-01-01 00:00 | EARTH | 242.62° / -6.796° | 242.62° / -6.796° | 0.0000° | 0.0000° | PASS |
| shackleton-rim | 2027-07-01 00:00 | SUN | 92.08° / -0.913° | 92.08° / -0.913° | 0.0000° | 0.0000° | PASS |
| shackleton-rim | 2027-07-01 00:00 | EARTH | 228.84° / 5.504° | 228.84° / 5.504° | 0.0000° | 0.0000° | PASS |
| shackleton-rim | 2028-01-01 00:00 | SUN | 8.55° / 1.806° | 8.55° / 1.806° | 0.0000° | 0.0000° | PASS |
| shackleton-rim | 2028-01-01 00:00 | EARTH | 234.12° / 1.729° | 234.12° / 1.729° | 0.0000° | 0.0000° | PASS |
| connecting-ridge | 2027-01-01 00:00 | SUN | 126.44° / 0.693° | 126.44° / 0.693° | 0.0000° | 0.0000° | PASS |
| connecting-ridge | 2027-01-01 00:00 | EARTH | 230.55° / -6.591° | 230.55° / -6.591° | 0.0000° | 0.0000° | PASS |
| connecting-ridge | 2027-07-01 00:00 | SUN | 80.09° / -0.777° | 80.09° / -0.777° | 0.0000° | 0.0000° | PASS |
| connecting-ridge | 2027-07-01 00:00 | EARTH | 216.90° / 5.855° | 216.90° / 5.855° | 0.0000° | 0.0000° | PASS |
| connecting-ridge | 2028-01-01 00:00 | SUN | 356.55° / 1.168° | 356.55° / 1.168° | 0.0000° | 0.0000° | PASS |
| connecting-ridge | 2028-01-01 00:00 | EARTH | 222.14° / 2.025° | 222.14° / 2.025° | 0.0000° | 0.0000° | PASS |

---

## V4 – PGDA Map Comparison (Section 16)

**Status**: PENDING (Run during Milestone 3)

| Site | Our Sun Frac | PGDA Sun Frac | Δ Sun | Our Earth Frac | PGDA Earth Frac | Δ Earth | Pass |
|------|--------------|---------------|-------|----------------|-----------------|---------|------|
