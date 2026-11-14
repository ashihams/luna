"""
pipeline/validate/test_horizon.py
V1 Unit tests for Section 10 of Slip Planner Build Specification:
1. Synthetic flat sphere: horizon equals about -0.087 deg for a 2 m observer (geometric dip) at every azimuth, within 0.01 deg.
2. Synthetic wall of 1000 m at 10 km due east: horizon at azimuth 90 is about 5.53 deg, within 0.05 deg; other azimuths unaffected.
3. Rotational symmetry: synthetic cone centred on site gives same horizon at all azimuths within 0.01 deg.
4. Pole test site (lat -89.9): output has no NaN and varies smoothly with azimuth.
"""
import pytest
import numpy as np
from pipeline.horizon import (
    compute_horizon_from_elevation_func,
    compute_horizon,
    calculate_elevation_angle
)
from pipeline.config_loader import load_config


@pytest.fixture
def config():
    return load_config()


def test_synthetic_flat_sphere(config):
    """
    Synthetic flat sphere: z = 0 everywhere.
    For a 2 m observer, the geometric dip is -sqrt(2*h/R) rad = -0.087 deg at every azimuth within 0.01 deg.
    """
    obs_height_m = 2.0
    R = config["R_MOON_M"]
    expected_dip = -np.degrees(np.sqrt(2.0 * obs_height_m / R))  # ~ -0.08696 deg

    # Elevation function: height z = 0 for any (lat, lon) or (distance, azimuth)
    def flat_elevation_func(lat, lon):
        return np.zeros_like(lat, dtype=float)

    site = {
        "id": "synthetic-flat",
        "lat_deg": -89.9,
        "lon_deg_east": 0.0,
        "obs_height_m": obs_height_m,
    }

    elev = compute_horizon_from_elevation_func(
        site=site,
        elevation_func=flat_elevation_func,
        obs_height_m=obs_height_m,
        az_step_deg=0.5,
        max_dist_m=60000.0,
        dist_step_m=50.0,
        z0=0.0
    )

    assert len(elev) == 720
    assert not np.isnan(elev).any(), "Horizon contains NaNs"
    np.testing.assert_allclose(elev, expected_dip, atol=0.01,
                               err_msg=f"Expected flat dip ~{expected_dip:.3f} deg within 0.01 deg")


def test_synthetic_wall(config):
    """
    Synthetic wall of 1000 m at 10 km due east (azimuth 90 deg):
    Horizon at azimuth 90 is about 5.53 deg, within 0.05 deg; other azimuths unaffected.
    """
    obs_height_m = 2.0
    site = {
        "id": "synthetic-wall",
        "lat_deg": -89.9,
        "lon_deg_east": 0.0,
        "obs_height_m": obs_height_m,
    }

    # At 10 km east (azimuth 90 deg), add a 1000 m wall
    # Function in (distance, azimuth) space
    def wall_polar_func(d, az):
        # d is shape (N_dist, 1), az is shape (1, N_az)
        h = np.zeros((d.shape[0], az.shape[1]), dtype=float)
        wall_mask = (np.abs(d - 10000.0) <= 50.0) & (np.abs(az - 90.0) <= 0.25)
        h[wall_mask] = 1000.0
        return h

    elev = compute_horizon_from_elevation_func(
        site=site,
        polar_height_func=wall_polar_func,
        obs_height_m=obs_height_m,
        az_step_deg=0.5,
        max_dist_m=30000.0,
        dist_step_m=20.0,
        z0=0.0
    )

    idx_90 = int(round(90.0 / 0.5))
    expected_wall_el = 5.53
    assert abs(elev[idx_90] - expected_wall_el) <= 0.05, (
        f"Horizon at az 90 deg was {elev[idx_90]:.3f} deg, expected {expected_wall_el} +/- 0.05 deg"
    )

    # Check that azimuth 0 (north), 180 (south), 270 (west) are unaffected (flat sphere dip ~ -0.087 deg)
    for check_az in [0.0, 180.0, 270.0]:
        idx = int(round(check_az / 0.5)) % 720
        assert elev[idx] < 0.0, f"Azimuth {check_az} affected by wall! Elevation: {elev[idx]}"
        assert abs(elev[idx] - (-0.087)) <= 0.01


def test_rotational_symmetry(config):
    """
    Rotational symmetry: a synthetic cone centred on the site gives the same horizon
    at all azimuths within 0.01 deg.
    """
    obs_height_m = 2.0
    site = {
        "id": "synthetic-cone",
        "lat_deg": -89.9,
        "lon_deg_east": 0.0,
        "obs_height_m": obs_height_m,
    }

    # Cone: height rises linearly to 500 m at 5 km, then drops back to 0 at 10 km
    def cone_polar_func(d, az):
        h = np.zeros_like(d, dtype=float)
        mask = d <= 10000.0
        h[mask] = 500.0 * (1.0 - np.abs(d[mask] - 5000.0) / 5000.0)
        return h

    elev = compute_horizon_from_elevation_func(
        site=site,
        polar_height_func=cone_polar_func,
        obs_height_m=obs_height_m,
        az_step_deg=0.5,
        max_dist_m=30000.0,
        dist_step_m=50.0,
        z0=0.0
    )

    # Standard deviation across all 720 azimuths should be essentially 0
    max_diff = np.max(elev) - np.min(elev)
    assert max_diff <= 0.01, f"Rotational symmetry violated: max diff is {max_diff:.4f} deg (> 0.01 deg)"


def test_calculate_elevation_angle_formula(config):
    """
    Test direct mathematical evaluation of formula:
    e = atan2(r_t * cos(theta) - r_o, r_t * sin(theta))
    """
    R = config["R_MOON_M"]
    z0 = 0.0
    obs_height_m = 2.0
    r_o = R + z0 + obs_height_m

    # At distance d = 10000 m, z = 1000 m
    d = 10000.0
    z = 1000.0
    theta = d / R
    r_t = R + z

    el_rad = calculate_elevation_angle(r_t, r_o, theta)
    el_deg = np.degrees(el_rad)

    assert abs(el_deg - 5.53) <= 0.05


def test_pole_test_site_smoothness(config):
    """
    Section 10 V1 check 4:
    Pole test site (lat -89.9, lon 0): output has no NaN and varies smoothly with azimuth.
    """
    from pipeline.terrain import acquire_site_levels
    from pipeline.horizon import compute_horizon

    test_site = {
        "id": "test-pole",
        "name": "Test Site (Pole)",
        "lat_deg": -89.9,
        "lon_deg_east": 0.0,
        "obs_height_m": 2.0
    }

    levels = acquire_site_levels(test_site)
    elev, info = compute_horizon(test_site, levels, obs_height_m=2.0, az_step_deg=0.5, variant="dem80")

    assert len(elev) == 720
    assert not np.isnan(elev).any(), "Pole test site horizon contains NaNs"
    assert info["nan_fraction"] <= 0.01, f"NaN fraction {info['nan_fraction']} exceeded 1%"

    # Check smoothness: max step-to-step azimuth jump across 0.5 deg steps
    # Near the pole, topography does not have infinite cliff jumps
    diffs = np.abs(np.diff(elev))
    wrap_diff = abs(elev[0] - elev[-1])
    max_jump = max(np.max(diffs), wrap_diff)
    print(f"\nPole site max az-to-az horizon jump: {max_jump:.3f} deg")
    assert max_jump < 5.0, f"Horizon jump between consecutive 0.5 deg azimuths too large: {max_jump:.2f} deg"
