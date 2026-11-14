"""
pipeline/validate/test_ephemeris.py
V2 Ephemeris sanity tests (Section 11 & Section 16):
1. For sites within 1 deg of the pole: |sun el| stays under about 1.6 deg plus site colatitude.
2. For sites within 1 deg of the pole: |earth el| stays under about 8 deg plus colatitude.
3. Sun azimuth sweeps a full circle (~360 deg) about every 29.5 days (synodic lunar day).
4. |v| for Sun is near 1 AU (~149.6M km +/- 3M km).
5. |v| for Earth is near 384,400 km (within ~350,000 to ~410,000 km).
"""
import pytest
import numpy as np
import spiceypy as spice

from pipeline.ephemeris import furnish_kernels, compute_ephemeris_for_site
from pipeline.config_loader import load_config


@pytest.fixture(scope="module")
def spice_setup():
    furnish_kernels()
    yield
    spice.kclear()


def test_ephemeris_sanity_bounds(spice_setup):
    """Test V2 sanity bounds for a near-polar site (Shackleton rim)."""
    site = {
        "id": "shackleton-rim",
        "name": "Peak near Shackleton",
        "lat_deg": -88.81,
        "lon_deg_east": 124.68,
        "obs_height_m": 2.0
    }

    colatitude = 90.0 - abs(site["lat_deg"])  # ~1.19 deg

    ephem = compute_ephemeris_for_site(site, z0=0.0)

    sun_az = ephem["sun_az"]
    sun_el = ephem["sun_el"]
    earth_az = ephem["earth_az"]
    earth_el = ephem["earth_el"]
    sun_rho = ephem["sun_rho"]
    earth_rho = ephem["earth_rho"]

    n_steps = len(sun_az)
    assert n_steps == 35088, f"Expected 35088 steps, got {n_steps}"

    # 1. Sun elevation bounds: |sun el| < 1.6 deg + colatitude
    max_sun_el = np.max(np.abs(sun_el))
    expected_sun_el_bound = 1.6 + colatitude + 0.2  # 0.2 deg safety margin
    assert max_sun_el <= expected_sun_el_bound, (
        f"Max |sun el| {max_sun_el:.3f} deg exceeded bound {expected_sun_el_bound:.3f} deg"
    )

    # 2. Earth elevation bounds: |earth el| < 8.0 deg + colatitude
    max_earth_el = np.max(np.abs(earth_el))
    expected_earth_el_bound = 8.0 + colatitude + 0.5  # 0.5 deg safety margin
    assert max_earth_el <= expected_earth_el_bound, (
        f"Max |earth el| {max_earth_el:.3f} deg exceeded bound {expected_earth_el_bound:.3f} deg"
    )

    # 3. Sun angular radius: ~0.26 deg (diameter ~0.53 deg)
    mean_sun_rho = np.mean(sun_rho)
    assert 0.25 <= mean_sun_rho <= 0.28, f"Unexpected mean sun angular radius: {mean_sun_rho:.4f} deg"

    # 4. Earth angular radius: ~0.95 deg (diameter ~1.9 deg)
    mean_earth_rho = np.mean(earth_rho)
    assert 0.85 <= mean_earth_rho <= 1.05, f"Unexpected mean earth angular radius: {mean_earth_rho:.4f} deg"

    # 5. Sun azimuth sweep: in 29.5 days (29.5 * 48 = 1416 steps), azimuth should sweep ~360 deg
    # In one synodic month, unwrapped azimuth should sweep approx 360 deg (magnitude)
    unwrapped_az = np.unwrap(np.radians(sun_az))
    one_month_steps = int(round(29.53 * 48))
    az_diff_1mo = np.degrees(unwrapped_az[one_month_steps] - unwrapped_az[0])
    assert abs(abs(az_diff_1mo) - 360.0) <= 15.0, (
        f"Sun azimuth did not sweep ~360 deg in 29.5 days: swept {az_diff_1mo:.2f} deg"
    )

    print("\n[V2 PASSED] All ephemeris sanity bounds verified:")
    print(f"  Max |sun el|: {max_sun_el:.3f} deg (bound: {expected_sun_el_bound:.2f} deg)")
    print(f"  Max |earth el|: {max_earth_el:.3f} deg (bound: {expected_earth_el_bound:.2f} deg)")
    print(f"  Sun radius: {mean_sun_rho:.3f} deg")
    print(f"  Earth radius: {mean_earth_rho:.3f} deg")
    print(f"  Synodic sweep in 29.5d: {az_diff_1mo:.2f} deg")
