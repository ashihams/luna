"""
pipeline/validate/test_visibility.py
Unit tests for Section 12 (Visibility products):
1. Sun disc well above horizon -> 100% visible.
2. Sun disc well below horizon -> 0% visible.
3. Sun disc centered on flat horizon -> ~50% visible (partial illumination).
4. Earth clearance angle matches el_center - horizon(az_center).
5. All disc samples within valid uint8 range [0, 100].
"""
import pytest
import numpy as np

from pipeline.visibility import compute_disc_visibility, compute_earth_clearance


def test_disc_visibility_extremes():
    """Test 100% when high, 0% when low, ~50% when centered on flat horizon."""
    n_steps = 10
    az = np.linspace(0.0, 90.0, n_steps, dtype=np.float32)
    rho = np.full(n_steps, 0.26, dtype=np.float32)  # solar angular radius ~0.26 deg

    # Flat horizon at 0.0 deg across all 720 azimuths
    horizon = np.zeros(720, dtype=np.float64)

    # 1. High elevation (+5.0 deg)
    el_high = np.full(n_steps, 5.0, dtype=np.float32)
    vis_high = compute_disc_visibility(az, el_high, rho, horizon)
    assert np.all(vis_high == 100), f"Expected 100% for high sun, got {vis_high}"

    # 2. Low elevation (-5.0 deg)
    el_low = np.full(n_steps, -5.0, dtype=np.float32)
    vis_low = compute_disc_visibility(az, el_low, rho, horizon)
    assert np.all(vis_low == 0), f"Expected 0% for sun below horizon, got {vis_low}"

    # 3. Center on horizon (0.0 deg elevation)
    # Exactly half the circular disc should be above the horizontal line
    el_zero = np.full(n_steps, 0.0, dtype=np.float32)
    vis_zero = compute_disc_visibility(az, el_zero, rho, horizon)
    # 32 points: ~16 points above horizon -> 50%
    assert np.all(np.abs(vis_zero.astype(int) - 50) <= 6), (
        f"Expected ~50% for sun centered on horizon, got {vis_zero}"
    )


def test_earth_clearance():
    """Test earth clearance formula."""
    az = np.array([45.0, 90.0, 180.0], dtype=np.float32)
    el = np.array([5.0, 2.0, -1.0], dtype=np.float32)

    # Non-flat horizon: 1.0 deg at az 45, 3.0 deg at az 90, 0.0 deg at az 180
    horizon = np.zeros(720, dtype=np.float64)
    horizon[int(45.0 / 0.5)] = 1.0
    horizon[int(90.0 / 0.5)] = 3.0
    horizon[int(180.0 / 0.5)] = 0.0

    clearance = compute_earth_clearance(az, el, horizon)

    # az 45: 5.0 - 1.0 = 4.0
    # az 90: 2.0 - 3.0 = -1.0
    # az 180: -1.0 - 0.0 = -1.0
    expected = np.array([4.0, -1.0, -1.0], dtype=np.float32)
    np.testing.assert_allclose(clearance, expected, atol=0.01)
