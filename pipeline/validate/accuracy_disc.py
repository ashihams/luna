"""Proposed reference comparator; deliberately not wired into production.

Any part of a spherical apparent disc may be visible beside the center azimuth.
Search the upper boundary of the spherical cap against each linear horizon
segment. This is a slow diagnostic reference, not a production replacement.
All angles in the public interface are degrees.
"""
import numpy as np
from scipy.optimize import minimize_scalar


def horizon_at(az, horizon, step):
    idx = (np.asarray(az) % 360.0) / step
    lo = np.floor(idx).astype(int)
    f = idx - lo
    return (1 - f) * horizon[lo % len(horizon)] + f * horizon[(lo + 1) % len(horizon)]


def any_disc_visible(az, el, rho, horizon, az_step_deg=0.5):
    """Return visibility and a witness azimuth / elevation, or None.

    Intended for near-horizon polar tracks. Discs containing a zenith or nadir
    are rejected, not silently approximated. Tangency is not positive area.
    Numerical optimization tolerance is 1e-10 degrees in azimuth; no fitted
    offset or agreement threshold is applied.
    """
    h = np.asarray(horizon, dtype=float)
    if h.ndim != 1 or len(h) < 3 or not np.all(np.isfinite(h)):
        raise ValueError('A complete finite horizon is required')
    if not np.isclose(len(h) * az_step_deg, 360):
        raise ValueError('Horizon grid must cover 360 degrees')
    if not np.all(np.isfinite([az, el, rho])) or rho < 0 or abs(el) + rho >= 90:
        raise ValueError('Expected finite nonpolar disc with nonnegative radius')
    az = float(az % 360)
    if el + rho > horizon_at(az, h, az_step_deg):
        return True, (az, el + rho)
    if rho == 0:
        return False, None
    e, r = np.radians([el, rho])
    half_width = np.degrees(np.arcsin(np.sin(r) / np.cos(e)))
    left, right = az - half_width, az + half_width
    # A break at every horizon knot avoids optimizing across skyline corners.
    knots = np.arange(np.ceil(left / az_step_deg), np.floor(right / az_step_deg) + 1) * az_step_deg
    bounds = np.unique(np.r_[left, knots, right])
    if el + rho <= np.min(horizon_at(bounds, h, az_step_deg)):
        return False, None

    def upper(a):
        # cos(rho) = sin(el)*sin(v) + cos(el)*cos(v)*cos(a-az).
        b = np.cos(e) * np.cos(np.radians(a - az))
        amplitude = np.hypot(np.sin(e), b)
        return np.degrees(np.arctan2(np.sin(e), b) +
                          np.arccos(np.clip(np.cos(r) / amplitude, -1, 1)))

    def gap(a):
        return float(upper(a) - horizon_at(a, h, az_step_deg))

    for a in bounds:
        if gap(a) > 0:
            return True, (float(a % 360), float(upper(a)))
    for lo, hi in zip(bounds[:-1], bounds[1:]):
        result = minimize_scalar(lambda a: -gap(a), bounds=(lo, hi),
                                 method='bounded', options={'xatol': 1e-10})
        if not result.success:
            raise RuntimeError('Disc-boundary optimizer did not converge')
        if -result.fun > 0:
            return True, (float(result.x % 360), float(upper(result.x)))
    return False, None
