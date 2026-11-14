# VALIDATION.md — Validation results log
# Slip Planner | NASA Space Apps 2026

> Every validation result is recorded here. All V1–V4 must pass before the UI is built beyond a stub.

---

## V1 – Horizon Engine Unit Tests (Section 10)

**Status**: PENDING

| Test | Expected | Result | Pass |
|------|----------|--------|------|
| Flat sphere dip (2 m observer) | ≈ −0.087° ± 0.01° | | |
| Synthetic wall 1000 m at 10 km east | ≈ 5.53° at az 90° ± 0.05° | | |
| Rotational symmetry (cone) | Same horizon ± 0.01° all az | | |
| Pole test site (−89.9°, 0°) | No NaN, smooth | | |

## V2 – Ephemeris Sanity Bounds (Section 11)

**Status**: PENDING

| Check | Expected | Result | Pass |
|-------|----------|--------|------|
| Sun elevation bounds | \|el\| < 1.6° + colatitude | | |
| Earth elevation bounds | \|el\| < 8° + colatitude | | |
| Sun azimuth cycle | Full circle every ~29.5 days | | |
| Sun distance | ≈ 1 AU | | |
| Earth distance | ≈ 384,400 km | | |

## V3 – Horizons Cross-Check (Section 16)

**Status**: PENDING

| Site | Date | Body | SPICE az/el | Horizons az/el | Δ az | Δ el |
|------|------|------|-------------|----------------|------|------|

## V4 – PGDA Map Comparison (Section 16)

**Status**: PENDING

| Site | Our Sun frac | PGDA Sun frac | Δ | Our Earth frac | PGDA Earth frac | Δ |
|------|-------------|---------------|---|---------------|-----------------|---|
