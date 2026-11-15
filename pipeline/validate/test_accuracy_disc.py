"""Analytic counterexamples, not lunar reference measurements."""
import numpy as np
import pytest
from rasterio.transform import from_origin, xy
from pipeline.validate.accuracy_disc import any_disc_visible, horizon_at
from pipeline.validate.pgda_compare import evaluate_visibility


def test_side_of_disc_visible_while_center_upper_limb_is_blocked():
    # Synthetic ridge: center azimuth 180 degrees has skyline 2 degrees;
    # skyline at 181 degrees is zero. A unit-radius disc centered at (180, 0)
    # is partly visible to the right, although its top at (180, 1) is blocked.
    horizon = np.full(720, 2.0)
    horizon[362] = 0
    old, _ = evaluate_visibility(np.array([180.]), np.array([0.]), np.array([1.]), horizon)
    assert old == 0
    visible, witness = any_disc_visible(180, 0, 1, horizon)
    assert visible
    a, e = witness
    # Independent spherical dot product proves this point belongs to the disc.
    dot = np.cos(np.radians(e)) * np.cos(np.radians(a - 180))
    assert dot >= np.cos(np.radians(1)) - 1e-12
    assert e > horizon_at(a, horizon, .5)


@pytest.mark.parametrize('rotation', [0, 180, 359.5])
def test_azimuth_rotation_and_wrap_do_not_change_visibility(rotation):
    horizon = np.full(720, 2.)
    horizon[2] = 0
    shifted = np.roll(horizon, int(rotation / .5))
    assert any_disc_visible(rotation, 0, 1, shifted)[0]


@pytest.mark.parametrize('el,rho,height,expected', [
    (-2, 1, 0, False), (-1, 1, 0, False), (-.9, 1, 0, True),
    (1, 0, 0, True), (0, 0, 0, False), (0, .25, .3, False),
])
def test_flat_horizon_has_analytic_upper_limb_result(el, rho, height, expected):
    assert any_disc_visible(19, el, rho, np.full(720, height))[0] == expected


def test_interior_segment_maximum_is_not_missed():
    # All grid knots are blocked, but the spherical upper edge is concave
    # between them. A center-only or knots-only check misses the exposed arc.
    horizon = np.full(720, 2.)
    horizon[361] = 1.0
    horizon[362] = 0.2
    assert all(horizon_at(a, horizon, .5) >=
               np.degrees(np.arccos(np.cos(np.radians(1)) / np.cos(np.radians(a-180))))
               for a in [180., 180.5, 181.])
    assert any_disc_visible(180, 0, 1, horizon)[0]


def test_center_and_corner_coordinates_are_distinct():
    transform = from_origin(-770400, 770400, 240, 240)
    center = xy(transform, 3209, 3209, offset='center')
    corner = xy(transform, 3209, 3209, offset='ul')
    assert center == (-120., 120.)
    assert corner == (-240., 240.)
    assert transform * (3209.5, 3209.5) == center
    assert transform * (3209., 3209.) == corner


def test_unsupported_input_is_rejected():
    with pytest.raises(ValueError, match='nonpolar'):
        any_disc_visible(0, 89.5, 1, np.zeros(720))
