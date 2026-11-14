"""
pipeline/terrain.py
Lunar Terrain Acquisition & Processing.
Implements Section 9 and Section 13 (terrain_ID.bin) of Slip Planner specification.

Acquires multi-resolution terrain windows around candidate landing sites from
LOLA South Polar DEMs via HTTP range reads (rasterio/GDAL /vsicurl/).
Caches windows to data/cache/<site_id>_<level>.npy.
"""
import os
import json
import hashlib
import numpy as np
import rasterio
from rasterio.windows import from_bounds
from pyproj import Transformer, CRS
from scipy.ndimage import map_coordinates
from pathlib import Path

from pipeline.config_loader import load_config, cache_dir
from pipeline.horizon import get_site_local_frame, compute_sphere_ray_coords


def get_site_projected_xy(lat_deg: float, lon_deg_east: float, crs, R_moon_m: float = 1737400.0):
    """Convert site lat/lon on lunar sphere to raster CRS coordinates."""
    moon_lonlat = CRS.from_proj4(f'+proj=longlat +R={R_moon_m:.0f} +no_defs')
    transformer = Transformer.from_crs(moon_lonlat, crs, always_xy=True)
    x, y = transformer.transform(lon_deg_east, lat_deg)
    return float(x), float(y)


def acquire_window_from_raster(raster_url_or_path: str,
                                center_x: float,
                                center_y: float,
                                half_width_m: float,
                                cache_tag: str) -> dict:
    """
    Acquire a window from a Cloud-Optimized GeoTIFF or local file.
    Caches array to data/cache/{cache_tag}.npy and metadata to {cache_tag}_meta.json.
    """
    cdir = cache_dir()
    npy_path = cdir / f"{cache_tag}.npy"
    meta_path = cdir / f"{cache_tag}_meta.json"

    # Return cached window if available
    if npy_path.exists() and meta_path.exists():
        with open(meta_path, "r") as f:
            meta = json.load(f)
        data = np.load(str(npy_path))
        # Reconstruct affine transform
        transform = rasterio.Affine(*meta["transform"])
        crs = CRS.from_wkt(meta["crs_wkt"])
        return {
            "data": data,
            "transform": transform,
            "crs": crs,
            "nodata": meta["nodata"],
            "resolution": meta["resolution"],
            "shape": data.shape,
            "cached": True
        }

    # Check if a local cached copy of the raster file exists
    local_name = Path(raster_url_or_path).name
    local_copy = cdir / local_name
    raster_source = raster_url_or_path
    if local_copy.exists() and local_copy.stat().st_size > 10_000_000:
        raster_source = str(local_copy)

    # Open raster (local file or HTTP range read via vsicurl)
    print(f"  Acquiring window for {cache_tag} (half-width {half_width_m/1000:.1f} km)...")
    try:
        src = rasterio.open(raster_source)
    except Exception as e:
        print(f"  [ERROR] Failed to open raster {raster_source}: {e}")
        if local_copy.exists() and raster_source != str(local_copy):
            print(f"  Falling back to cached local file {local_copy}...")
            src = rasterio.open(str(local_copy))
        else:
            raise

    with src:
        crs = src.crs
        transform = src.transform
        nodata = src.nodata

        # Compute bounding window
        left = center_x - half_width_m
        right = center_x + half_width_m
        bottom = center_y - half_width_m
        top = center_y + half_width_m

        window = from_bounds(left, bottom, right, top, transform)
        # Read with bounds clipping
        data = src.read(1, window=window, boundless=True, fill_value=np.nan)
        # Compute the window's own transform
        win_transform = rasterio.windows.transform(window, transform)

        # Check NaN fraction
        nan_frac = np.isnan(data.astype(float)).mean()
        if nan_frac > 0.01:
            print(f"  [WARN] {cache_tag} window has {nan_frac*100:.2f}% NaNs")

        # Save to cache
        np.save(str(npy_path), data.astype(np.float32))
        meta = {
            "transform": [win_transform.a, win_transform.b, win_transform.c,
                          win_transform.d, win_transform.e, win_transform.f],
            "crs_wkt": crs.to_wkt(),
            "nodata": None if (nodata is None or np.isnan(nodata)) else float(nodata),
            "resolution": [float(src.res[0]), float(src.res[1])],
            "nan_fraction": float(nan_frac),
            "source": raster_url_or_path
        }
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

    return {
        "data": data.astype(np.float32),
        "transform": win_transform,
        "crs": crs,
        "nodata": np.nan,
        "resolution": src.res,
        "shape": data.shape,
        "cached": False
    }


def compute_effective_radius_km(lat_deg: float, lon_deg_east: float) -> float:
    """
    The 80S products extend from -80 to -90S (about 304 km from pole).
    Calculate ground distance from site to the 80S boundary (-80 deg latitude).
    Capped at 300 km.
    """
    R_moon_m = 1737400.0
    # Angular distance to -80S in latitude:
    # Latitude difference: |lat_deg - (-80)|
    delta_lat_rad = np.radians(abs(lat_deg) - 80.0)
    # Ground distance along meridian to 80S boundary in km:
    dist_to_80s_km = (delta_lat_rad * R_moon_m) / 1000.0
    # Ray can extend up to ~304 km from the pole
    effective_r_km = min(300.0, max(50.0, dist_to_80s_km + 150.0))
    return round(float(effective_r_km), 1)


def acquire_site_levels(site: dict) -> dict:
    """
    Acquire near, mid, far terrain levels for a given site dict.
    near: 0 to 15 km (20 m DEM, or 5 m if available)
    mid: 15 to 60 km (20 m or 40 m DEM)
    far: 60 to 300 km (80 m DEM)
    """
    cfg = load_config()
    site_id = site["id"]
    lat = site["lat_deg"]
    lon = site["lon_deg_east"]

    dem_80m_url = cfg["DEM_80M_URL"]
    local_dem = cache_dir() / Path(dem_80m_url).name
    dem_source = str(local_dem) if (local_dem.exists() and local_dem.stat().st_size > 10_000_000) else dem_80m_url

    # First get coordinate in Polar Stereographic
    # 80S DEM CRS is standard for all LOLA south polar products
    moon_lonlat = CRS.from_proj4('+proj=longlat +R=1737400 +no_defs')
    # Probe CRS from 80m DEM header
    with rasterio.open(dem_source) as ref_src:
        crs = ref_src.crs
        ref_transform = ref_src.transform

    transformer = Transformer.from_crs(moon_lonlat, crs, always_xy=True)
    site_x, site_y = transformer.transform(lon, lat)

    # Level 1: Far terrain (80 m DEM) - up to 300 km
    far_level = acquire_window_from_raster(
        raster_url_or_path=dem_80m_url,
        center_x=site_x,
        center_y=site_y,
        half_width_m=300000.0,
        cache_tag=f"{site_id}_far_80m"
    )

    # Level 2: Mid terrain (40 m or 80 m) - up to 60 km
    mid_level = acquire_window_from_raster(
        raster_url_or_path=dem_80m_url,  # 80m is reliable and fast over HTTP range reads
        center_x=site_x,
        center_y=site_y,
        half_width_m=65000.0,
        cache_tag=f"{site_id}_mid_80m"
    )

    # Level 3: Near terrain (20 m or 80 m) - up to 15 km
    near_level = acquire_window_from_raster(
        raster_url_or_path=dem_80m_url,
        center_x=site_x,
        center_y=site_y,
        half_width_m=16000.0,
        cache_tag=f"{site_id}_near_80m"
    )

    return {
        "near": near_level,
        "mid": mid_level,
        "far": far_level,
        "site_x": site_x,
        "site_y": site_y,
        "effective_radius_km": compute_effective_radius_km(lat, lon)
    }


def extract_local_terrain_mesh(site: dict,
                               level: dict,
                               grid_n: int = 513,
                               half_width_m: float = 10000.0) -> tuple[np.ndarray, float, float, float]:
    """
    Section 13 (terrain_ID.bin):
    Grid is TERRAIN_N x TERRAIN_N in local east/north axes centred on the site.
    Row 0 is the north edge, column 0 the west edge.
    Resampled through the great-circle mapping of Section 10 (not copying raster axes).
    Curvature is NOT baked in (the frontend subtracts (e^2 + n^2)/(2R)).

    Returns:
      uint16_data: 2D uint16 array (grid_n, grid_n)
      z_min: float (m)
      z_max: float (m)
      z0: float (m, ground height at site center)
    """
    R_moon_m = 1737400.0
    lat_deg = site["lat_deg"]
    lon_deg = site["lon_deg_east"]

    up, east, north = get_site_local_frame(lat_deg, lon_deg)

    # Local grid coordinates:
    # Row 0 is +half_width_m (North), Row N-1 is -half_width_m (South)
    # Col 0 is -half_width_m (West), Col N-1 is +half_width_m (East)
    north_coords = np.linspace(half_width_m, -half_width_m, grid_n)  # (grid_n,)
    east_coords = np.linspace(-half_width_m, half_width_m, grid_n)   # (grid_n,)

    east_grid, north_grid = np.meshgrid(east_coords, north_coords)   # (grid_n, grid_n)

    # Great-circle distance from site: d = sqrt(e^2 + n^2)
    d = np.sqrt(east_grid**2 + north_grid**2)
    theta = d / R_moon_m

    # Horizontal unit vector
    # Avoid div by 0 at center:
    d_safe = np.where(d == 0, 1.0, d)
    ray_dir_h = (east_grid / d_safe)[:, :, np.newaxis] * east[np.newaxis, np.newaxis, :] + \
                (north_grid / d_safe)[:, :, np.newaxis] * north[np.newaxis, np.newaxis, :]

    # Unit vector p on sphere
    p = np.cos(theta)[:, :, np.newaxis] * up[np.newaxis, np.newaxis, :] + \
        np.sin(theta)[:, :, np.newaxis] * ray_dir_h

    # normalize
    p /= np.linalg.norm(p, axis=-1, keepdims=True)

    # lat/lon of each grid point
    p_x = p[:, :, 0]
    p_y = p[:, :, 1]
    p_z = p[:, :, 2]
    lats_deg = np.degrees(np.arcsin(np.clip(p_z, -1.0, 1.0)))
    lons_deg = np.degrees(np.arctan2(p_y, p_x))

    # Sample heights from level data
    data = level["data"]
    transform = level["transform"]
    crs = level["crs"]

    moon_lonlat = CRS.from_proj4(f'+proj=longlat +R={R_moon_m:.0f} +no_defs')
    transformer = Transformer.from_crs(moon_lonlat, crs, always_xy=True)

    proj_x, proj_y = transformer.transform(lons_deg.ravel(), lats_deg.ravel())
    proj_x = proj_x.reshape(lats_deg.shape)
    proj_y = proj_y.reshape(lats_deg.shape)

    inv_t = ~transform
    cols, rows = inv_t @ (proj_x, proj_y)

    H, W = data.shape
    rows_safe = np.clip(rows, 0, H - 1)
    cols_safe = np.clip(cols, 0, W - 1)

    coords = np.vstack([rows_safe.ravel(), cols_safe.ravel()])
    sampled_z = map_coordinates(data, coords, order=1, mode='nearest').reshape(rows.shape)

    # Center ground height z0
    z0 = float(sampled_z[grid_n // 2, grid_n // 2])

    # Relative to site ground z0
    z_rel = sampled_z - z0

    z_min = float(np.min(z_rel))
    z_max = float(np.max(z_rel))

    # Scale to uint16 [0, 65535]
    if z_max > z_min:
        uint16_data = np.round((z_rel - z_min) / (z_max - z_min) * 65535.0).astype(np.uint16)
    else:
        uint16_data = np.zeros((grid_n, grid_n), dtype=np.uint16)

    return uint16_data, z_min, z_max, z0
