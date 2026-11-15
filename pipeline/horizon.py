"""
pipeline/horizon.py
Lunar Terrain Horizon Engine.
Implements Section 10 of the Slip Planner specification.

Computes 360-degree terrain horizon elevation angles from observer ground height z0 + obs_height_m
over spherical geometry on the 1737.4 km Moon sphere.
"""
import numpy as np
from scipy.ndimage import map_coordinates
from pyproj import Transformer, CRS

from pipeline.config_loader import load_config
from pipeline.raster_sampling import sample_projected


def calculate_elevation_angle(r_t, r_o, theta):
    """
    Elevation angle formula from Section 10:
    e = atan2(r_t * cos(theta) - r_o, r_t * sin(theta))

    r_t: Target radius from Moon centre (m)
    r_o: Observer radius from Moon centre (m)
    theta: Central angle (radians) = ground_distance / R_MOON_M
    Returns: elevation angle in radians
    """
    numerator = r_t * np.cos(theta) - r_o
    denominator = r_t * np.sin(theta)
    return np.arctan2(numerator, denominator)


def get_site_local_frame(lat_deg: float, lon_deg_east: float):
    """
    Section 7: Frames and angle conventions.
    All positions in MOON_ME body-fixed frame.
    For latitude phi and east longitude lambda:
    • up = (cos phi cos lambda, cos phi sin lambda, sin phi)
    • east = (-sin lambda, cos lambda, 0)
    • north = (-sin phi cos lambda, -sin phi sin lambda, cos phi)
    Clamps latitude to at most -89.9999 (i.e. no closer to pole than -89.9999) to avoid pole singularity.
    """
    clamped_lat = max(lat_deg, -89.9999) if lat_deg < 0 else min(lat_deg, 89.9999)
    phi = np.radians(clamped_lat)
    lam = np.radians(lon_deg_east)

    cos_phi = np.cos(phi)
    sin_phi = np.sin(phi)
    cos_lam = np.cos(lam)
    sin_lam = np.sin(lam)

    up = np.array([cos_phi * cos_lam, cos_phi * sin_lam, sin_phi], dtype=np.float64)
    east = np.array([-sin_lam, cos_lam, 0.0], dtype=np.float64)
    north = np.array([-sin_phi * cos_lam, -sin_phi * sin_lam, cos_phi], dtype=np.float64)

    # Normalize for numerical precision
    up /= np.linalg.norm(up)
    east /= np.linalg.norm(east)
    north /= np.linalg.norm(north)

    return up, east, north


def compute_sphere_ray_coords(up, east, north, distances_m, azimuths_deg, R_moon_m: float = 1737400.0):
    """
    Vectorized calculation of lat, lon on the Moon sphere for rays cast
    at given ground distances and azimuths.

    distances_m: 1D array of length N_dist
    azimuths_deg: 1D array of length N_az
    Returns:
        theta: 1D array (N_dist,)
        lats_deg: 2D array (N_dist, N_az)
        lons_deg: 2D array (N_dist, N_az)
    """
    theta = distances_m / R_moon_m  # (N_dist,)
    az_rad = np.radians(azimuths_deg)  # (N_az,)

    # cos(theta) is (N_dist, 1)
    cos_theta = np.cos(theta)[:, np.newaxis]
    sin_theta = np.sin(theta)[:, np.newaxis]

    # horizontal ray unit vector in local east-north frame: (1, N_az, 3)
    # az measured from local north toward east
    cos_az = np.cos(az_rad)[np.newaxis, :]  # (1, N_az)
    sin_az = np.sin(az_rad)[np.newaxis, :]  # (1, N_az)

    # ray_dir_h = cos(az)*north + sin(az)*east -> shape (1, N_az, 3)
    ray_dir_h = cos_az[:, :, np.newaxis] * north[np.newaxis, np.newaxis, :] + \
                sin_az[:, :, np.newaxis] * east[np.newaxis, np.newaxis, :]

    # p = cos(theta)*up + sin(theta)*ray_dir_h -> shape (N_dist, N_az, 3)
    p = cos_theta[:, :, np.newaxis] * up[np.newaxis, np.newaxis, :] + \
        sin_theta[:, :, np.newaxis] * ray_dir_h

    # normalize p
    p_norm = np.linalg.norm(p, axis=-1, keepdims=True)
    p = p / p_norm

    p_x = p[:, :, 0]
    p_y = p[:, :, 1]
    p_z = p[:, :, 2]

    # lat = asin(p_z), lon = atan2(p_y, p_x)
    lats_deg = np.degrees(np.arcsin(np.clip(p_z, -1.0, 1.0)))
    lons_deg = np.degrees(np.arctan2(p_y, p_x))

    return theta, lats_deg, lons_deg


def compute_horizon_from_elevation_func(site: dict,
                                        elevation_func=None,
                                        polar_height_func=None,
                                        obs_height_m: float = 2.0,
                                        az_step_deg: float = 0.5,
                                        max_dist_m: float = 60000.0,
                                        dist_step_m: float = 50.0,
                                        z0: float = 0.0):
    """
    Synthetic horizon computer for unit testing and analytical profiles.
    Allows either:
      - elevation_func(lats_deg, lons_deg) -> heights (m)
      - polar_height_func(distances_m, azimuths_deg) -> heights (m)
    """
    cfg = load_config()
    R = cfg.get("R_MOON_M", 1737400.0)

    azimuths = np.arange(0.0, 360.0, az_step_deg)
    # Start distance at dist_step_m to avoid theta=0 singularity
    distances = np.arange(dist_step_m, max_dist_m + dist_step_m, dist_step_m)

    up, east, north = get_site_local_frame(site["lat_deg"], site["lon_deg_east"])
    theta, lats, lons = compute_sphere_ray_coords(up, east, north, distances, azimuths, R)

    if polar_height_func is not None:
        # Distance (N_dist, 1) and Azimuth (1, N_az)
        d_grid = distances[:, np.newaxis]
        az_grid = azimuths[np.newaxis, :]
        z = polar_height_func(d_grid, az_grid)
    elif elevation_func is not None:
        z = elevation_func(lats, lons)
    else:
        z = np.zeros((len(distances), len(azimuths)), dtype=float)

    r_t = R + z
    r_o = R + z0 + obs_height_m
    theta_2d = theta[:, np.newaxis]

    elev_rad = calculate_elevation_angle(r_t, r_o, theta_2d)
    elev_deg = np.degrees(np.max(elev_rad, axis=0))

    return elev_deg


def compute_horizon_for_raster_level(level: dict,
                                     site: dict,
                                     obs_height_m: float,
                                     z0: float,
                                     azimuths_deg: np.ndarray,
                                     distances_m: np.ndarray,
                                     R_moon_m: float = 1737400.0):
    """
    Compute horizon elevation angle array for a single DEM level using bilinear sampling.

    level dict must contain:
      - "data": 2D float32 array
      - "transform": Affine transform (rasterio.Affine or 6-tuple)
      - "crs": CRS object or string
      - "nodata": nodata value
    """
    data = level["data"]
    transform = level["transform"]
    crs = level["crs"]
    nodata = level.get("nodata", np.nan)

    up, east, north = get_site_local_frame(site["lat_deg"], site["lon_deg_east"])
    theta, lats, lons = compute_sphere_ray_coords(up, east, north, distances_m, azimuths_deg, R_moon_m)

    # Convert lat/lon on sphere to projected raster coordinates (x, y)
    moon_lonlat = CRS.from_proj4(f'+proj=longlat +R={R_moon_m:.0f} +no_defs')
    transformer = Transformer.from_crs(moon_lonlat, crs, always_xy=True)

    proj_x, proj_y = transformer.transform(lons.ravel(), lats.ravel())
    proj_x = proj_x.reshape(lats.shape)
    proj_y = proj_y.reshape(lats.shape)

    sampled_z = sample_projected(level, proj_x, proj_y)

    # Check NaN fraction
    nan_frac = np.isnan(sampled_z).mean()

    # Elevation angle computation
    r_t = R_moon_m + sampled_z
    r_o = R_moon_m + z0 + obs_height_m
    theta_2d = theta[:, np.newaxis]

    elev_rad = calculate_elevation_angle(r_t, r_o, theta_2d)

    # Mask NaNs with -inf before taking maximum over distances
    elev_rad_clean = np.where(np.isnan(elev_rad), -np.inf, elev_rad)
    max_elev_rad = np.max(elev_rad_clean, axis=0)

    # Missing terrain is not a flat sphere. Other valid levels may supply a ray;
    # the caller rejects any ray still unsupported after combining levels.
    max_elev_deg = np.degrees(max_elev_rad)

    return max_elev_deg, nan_frac


def compute_horizon(site: dict,
                    levels: dict,
                    obs_height_m: float = 2.0,
                    az_step_deg: float = 0.5,
                    variant: str = "best"):
    """
    Main horizon computation function (Section 10).
    Computes horizon elevation angles for all 720 azimuths (0 to 360 deg at az_step_deg).

    levels: dict with keys "near", "mid", "far", each containing raster level dict.
    variant: "flat", "dem80", "dem20", "dem5", or "best"
    Returns:
      elev_deg: array of length 720 (rounded to 3 decimal places)
      info: dict with levels_used, nan_fraction, runtime_s
    """
    import time
    t0 = time.time()
    cfg = load_config()
    R = cfg.get("R_MOON_M", 1737400.0)

    azimuths = np.arange(0.0, 360.0, az_step_deg)
    n_az = len(azimuths)

    # Geometric flat sphere horizon
    if variant == "flat":
        dip_deg = -np.degrees(np.sqrt(2.0 * obs_height_m / R))
        elev = np.full(n_az, dip_deg, dtype=np.float64)
        return np.round(elev, 3), {
            "variant": variant,
            "levels_used": [],
            "nan_fraction": 0.0,
            "runtime_s": round(time.time() - t0, 3)
        }

    # Observer ground height z0 from near level at the site
    near_level = levels.get("near")
    if near_level is not None:
        z0 = sample_point_height(near_level, site["lat_deg"], site["lon_deg_east"], R)
    else:
        raise ValueError('A terrain horizon requires a near DEM at the observer')

    site_with_z0 = dict(site)
    site_with_z0["ground_height_m"] = z0

    overall_horizon = np.full(n_az, -np.inf, dtype=np.float64)
    levels_used = []
    total_nan_samples = 0
    total_samples = 0

    # Determine which levels to process based on variant
    # Distances for each level
    # near: 0 to 15 km (step: native pixel or 20m)
    # mid: 15 to 60 km (step: native pixel or 40m/80m)
    # far: 60 to 300 km (step: 80m)
    level_ranges = {
        "near": (20.0, 15000.0, 40.0),
        "mid": (15000.0, 60000.0, 120.0),
        "far": (60000.0, 300000.0, 400.0)
    }

    levels_to_run = []
    if variant == "dem80":
        # 80m everywhere with tiered distance steps
        far_lvl = levels.get("far", levels.get("near"))
        if far_lvl is not None:
            levels_to_run = [
                ("near", (80.0, 15000.0, 40.0)),
                ("mid", (15000.0, 60000.0, 120.0)),
                ("far", (60000.0, 300000.0, 400.0))
            ]
    elif variant == "dem20":
        levels_to_run = [
            ("near", (20.0, 15000.0, 40.0)),
            ("mid", (15000.0, 60000.0, 120.0)),
            ("far", (60000.0, 300000.0, 400.0))
        ]
    else:
        for lvl_name in ["near", "mid", "far"]:
            if lvl_name in levels and levels[lvl_name] is not None:
                levels_to_run.append((lvl_name, level_ranges[lvl_name]))

    for lvl_name, (d_min, d_max, d_step) in levels_to_run:
        lvl = levels.get(lvl_name, levels.get("far"))
        distances = np.arange(d_min, d_max + d_step, d_step)
        lvl_elev, nan_frac = compute_horizon_for_raster_level(
            level=lvl,
            site=site_with_z0,
            obs_height_m=obs_height_m,
            z0=z0,
            azimuths_deg=azimuths,
            distances_m=distances,
            R_moon_m=R
        )
        if lvl_name in ('near', 'mid') and nan_frac > 0:
            raise ValueError(f'Missing {lvl_name} terrain for {site.get("id", "site")}: {nan_frac:.4%}')
        overall_horizon = np.maximum(overall_horizon, lvl_elev)
        levels_used.append(lvl_name)
        total_nan_samples += nan_frac * len(distances) * n_az
        total_samples += len(distances) * n_az

    nan_fraction = total_nan_samples / max(total_samples, 1)
    if not np.all(np.isfinite(overall_horizon)):
        raise ValueError('Cannot compute a horizon from missing terrain')

    return np.round(overall_horizon, 3), {
        "variant": variant,
        "levels_used": levels_used,
        "nan_fraction": round(float(nan_fraction), 4),
        "z0_m": round(float(z0), 2),
        "runtime_s": round(time.time() - t0, 3)
    }


def sample_point_height(level: dict, lat_deg: float, lon_deg_east: float, R_moon_m: float = 1737400.0) -> float:
    """Sample bilinear ground height z0 at exact site lat/lon."""
    data = level["data"]
    transform = level["transform"]
    crs = level["crs"]

    moon_lonlat = CRS.from_proj4(f'+proj=longlat +R={R_moon_m:.0f} +no_defs')
    transformer = Transformer.from_crs(moon_lonlat, crs, always_xy=True)

    x, y = transformer.transform(lon_deg_east, lat_deg)
    z = float(sample_projected(level, x, y))
    if not np.isfinite(z):
        raise ValueError(f'Observer ({lat_deg}, {lon_deg_east}) has no valid DEM ground height')
    return z
