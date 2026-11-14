"""
pipeline/ephemeris.py
SPICE-based Sun and Earth Ephemeris Engine.
Implements Section 11 of the Slip Planner specification.

Computes 30-minute time-series of Sun and Earth azimuth, elevation, and angular radius
in the MOON_ME body-fixed frame over the 2-year window (2027-01-01 to 2029-01-01, 35,088 steps).
"""
import numpy as np
import spiceypy as spice
from typing import Tuple

from pipeline.config_loader import load_config, kernels_dir
from pipeline.horizon import get_site_local_frame


def furnish_kernels():
    """Load all configured SPICE kernels."""
    cfg = load_config()
    kdir = kernels_dir()
    for name in cfg["SPICE_KERNELS"]:
        path = kdir / name
        if not path.exists():
            raise FileNotFoundError(f"Missing required SPICE kernel: {path}")
        spice.furnsh(str(path))


def compute_ephemeris_for_site(site: dict,
                               z0: float = 0.0,
                               obs_height_m: float = None) -> dict:
    """
    Compute Sun and Earth tracks for a given site.

    Returns dict with:
      - sun_az: float32 array (N_STEPS,) in degrees [0, 360)
      - sun_el: float32 array (N_STEPS,) in degrees [-90, 90]
      - sun_rho: float32 array (N_STEPS,) in degrees (angular radius)
      - earth_az: float32 array (N_STEPS,) in degrees [0, 360)
      - earth_el: float32 array (N_STEPS,) in degrees [-90, 90]
      - earth_rho: float32 array (N_STEPS,) in degrees (angular radius)
      - ets: float64 array (N_STEPS,) ephemeris seconds past J2000
    """
    cfg = load_config()
    R_moon_m = cfg["R_MOON_M"]
    R_sun_km = cfg["R_SUN_KM"]
    R_earth_km = cfg["R_EARTH_KM"]
    n_steps = cfg["N_STEPS"]
    step_sec = cfg["STEP_MIN"] * 60.0
    abcorr = cfg["ABCORR"]

    if obs_height_m is None:
        obs_height_m = site.get("obs_height_m", cfg["OBS_HEIGHT_M"])

    lat_deg = site["lat_deg"]
    lon_deg = site["lon_deg_east"]

    up, east, north = get_site_local_frame(lat_deg, lon_deg)

    # Observer radius in km
    r_obs_km = (R_moon_m + z0 + obs_height_m) / 1000.0
    obs_vector_km = r_obs_km * up  # shape (3,)

    # Generate ET array
    et0 = spice.str2et(cfg["T0_UTC"])
    ets = et0 + np.arange(n_steps, dtype=np.float64) * step_sec

    # Vectorized computation of body vectors
    def compute_body_tracks(body_name: str, body_radius_km: float):
        # spkpos over ET array: spiceypy supports vector ets
        try:
            positions, _ = spice.spkpos(body_name, ets, 'MOON_ME', abcorr, 'MOON')
            # positions shape is (n_steps, 3)
        except Exception:
            # Fallback to loop if vectorized spkpos not available in this version
            positions = np.zeros((n_steps, 3), dtype=np.float64)
            for i, et in enumerate(ets):
                pos, _ = spice.spkpos(body_name, float(et), 'MOON_ME', abcorr, 'MOON')
                positions[i] = pos

        # Vector from observer to body: v = pos - obs_vector
        v = positions - obs_vector_km[np.newaxis, :]  # (n_steps, 3)

        # Distances
        dist = np.linalg.norm(v, axis=1)  # (n_steps,)

        # Components in local topo frame
        e_comp = np.sum(v * east[np.newaxis, :], axis=1)
        n_comp = np.sum(v * north[np.newaxis, :], axis=1)
        u_comp = np.sum(v * up[np.newaxis, :], axis=1)

        # Azimuth [0, 360) and Elevation [-90, 90]
        az_deg = (np.degrees(np.arctan2(e_comp, n_comp))) % 360.0
        horiz_dist = np.hypot(e_comp, n_comp)
        el_deg = np.degrees(np.arctan2(u_comp, horiz_dist))

        # Angular radius rho = asin(R_body / dist)
        rho_deg = np.degrees(np.arcsin(np.clip(body_radius_km / dist, 0.0, 1.0)))

        return az_deg.astype(np.float32), el_deg.astype(np.float32), rho_deg.astype(np.float32)

    sun_az, sun_el, sun_rho = compute_body_tracks('SUN', R_sun_km)
    earth_az, earth_el, earth_rho = compute_body_tracks('EARTH', R_earth_km)

    return {
        "sun_az": sun_az,
        "sun_el": sun_el,
        "sun_rho": sun_rho,
        "earth_az": earth_az,
        "earth_el": earth_el,
        "earth_rho": earth_rho,
        "ets": ets
    }
