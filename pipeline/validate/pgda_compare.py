"""
pipeline/validate/pgda_compare.py
Independent V4 Validation: Comparison of Sun and Earth visibility against
LOLA/PGDA Product 69 published maps (Mazarico et al. 2011).

Samples the published 240 m/pixel Polar Stereographic rasters at all 13 Artemis
candidate landing sites, reporting the nearest pixel and 3x3 neighborhood bounds.
Computes the model equivalent over the full 18.6-year lunar precession cycle
(starting 2009-07-13T17:33:17, 1-hour cadence, 163,165 steps) matching the
published baseline (0 m observer height, finite disc upper-limb visibility criteria).
Outputs docs/pgda_comparison.json and populates data/out_longrun/.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any

import numpy as np
import rasterio
import pyproj
import spiceypy as spice

from pipeline.config_loader import load_config, load_sites, project_root, cache_dir
from pipeline.ephemeris import furnish_kernels
from pipeline.validate.accuracy_disc import any_disc_visible
from pipeline.terrain import acquire_site_levels
from pipeline.horizon import compute_horizon, get_site_local_frame


def get_pgda_raster_paths() -> tuple[Path, Path]:
    """Return paths to downloaded Product 69 GeoTIFF rasters, checking existence."""
    p_root = project_root()
    p_cache = p_root / "data" / "cache" / "pgda69"
    sun_path = p_cache / "AVGVISIB_65S_240M_201608.TIF"
    earth_path = p_cache / "AVGVISIB_65S_240M_201608_EARTH.TIF"

    if not sun_path.exists() or not earth_path.exists():
        raise FileNotFoundError(
            f"PGDA Product 69 raster maps missing in {p_cache}.\n"
            f"Expected: {sun_path.name} and {earth_path.name}.\n"
            "Download them from https://pgda.gsfc.nasa.gov/data/MoonIllumination/"
        )
    return sun_path, earth_path


def sample_raster_neighborhood(src: rasterio.DatasetReader,
                               proj: pyproj.Proj,
                               lat_deg: float,
                               lon_deg_east: float,
                               scaling_factor: float = 0.00004) -> Dict[str, float]:
    """
    Project lat/lon into raster coordinates, read 3x3 pixel neighborhood,
    and convert DNs into visibility percentage [0..100%].
    """
    x, y = proj(lon_deg_east, lat_deg)
    row, col = src.index(x, y)

    # 3x3 window around (row, col)
    row_start = max(0, row - 1)
    row_stop = min(src.height, row + 2)
    col_start = max(0, col - 1)
    col_stop = min(src.width, col + 2)

    if not 0 <= row < src.height or not 0 <= col < src.width:
        raise ValueError('Study coordinate is outside the published visibility map')
    win = src.read(1, window=((row_start, row_stop), (col_start, col_stop)), masked=True)
    if np.any(np.ma.getmaskarray(win)):
        raise ValueError('Published visibility neighborhood contains missing data')
    # DN to percentage (scaling factor 0.00004 maps 25000 -> 1.0 -> 100%)
    # Rasterio returns raw DNs; explicitly check the product's scale/offset.
    if src.scales[0] not in (1.0, scaling_factor) or src.offsets[0] != 0:
        raise ValueError('Unexpected visibility raster scale/offset')
    win_pct = np.asarray(win, dtype=np.float64) * scaling_factor * 100.0

    # Relative center inside window
    center_r = row - row_start
    center_c = col - col_start
    center_val = float(win_pct[center_r, center_c])

    return {
        "raster_row": int(row),
        "raster_col": int(col),
        "center_pct": round(center_val, 2),
        "min_pct": round(float(np.min(win_pct)), 2),
        "max_pct": round(float(np.max(win_pct)), 2),
        "median_pct": round(float(np.median(win_pct)), 2)
    }


def compute_longrun_ephemeris(ets: np.ndarray,
                              site: dict,
                              obs_height_m: float,
                              z0_m: float,
                              pos_sun_all: np.ndarray,
                              pos_earth_all: np.ndarray,
                              r_sun_km: float,
                              r_earth_km: float,
                              r_moon_m: float) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Compute topocentric azimuth, elevation, and angular radius for Sun and Earth
    at a site over a precomputed Moon-centered body array.
    """
    lat = site["lat_deg"]
    lon = site["lon_deg_east"]
    up, east, north = get_site_local_frame(lat, lon)

    r_obs_km = (r_moon_m + z0_m + obs_height_m) / 1000.0
    obs_v = r_obs_km * up

    def project_topo(body_positions: np.ndarray, radius_km: float):
        v = body_positions - obs_v[np.newaxis, :]
        dist = np.linalg.norm(v, axis=1)
        e = np.sum(v * east[np.newaxis, :], axis=1)
        n = np.sum(v * north[np.newaxis, :], axis=1)
        u = np.sum(v * up[np.newaxis, :], axis=1)
        az = (np.degrees(np.arctan2(e, n))) % 360.0
        el = np.degrees(np.arctan2(u, np.hypot(e, n)))
        rho = np.degrees(np.arcsin(np.clip(radius_km / dist, 0.0, 1.0)))
        return az, el, rho

    sun_az, sun_el, sun_rho = project_topo(pos_sun_all, r_sun_km)
    earth_az, earth_el, earth_rho = project_topo(pos_earth_all, r_earth_km)

    return sun_az, sun_el, sun_rho, earth_az, earth_el, earth_rho


def evaluate_visibility(az: np.ndarray,
                        el: np.ndarray,
                        rho: np.ndarray,
                        horizon_deg: np.ndarray,
                        az_step_deg: float = 0.5) -> tuple[float, float]:
    """Evaluate visibility over horizon profile using per-timestep disc search.

    Uses any_disc_visible from accuracy_disc.py, which searches the full
    apparent disc boundary across each horizon segment and can find clearance
    beside a ridge, not only at the center azimuth.  The old center-azimuth
    upper-limb shortcut (el + rho > horizon at center az) is kept as the second
    return value for regression comparison and diagnostics.

    Returns:
      any_frac_pct: fraction of timesteps (%) where any part of disc clears horizon
      center_pct:   fraction (%) where the upper limb at center azimuth clears
                    horizon (legacy approximate comparator; retained for diagnostics)
    """
    n_az = len(horizon_deg)
    idx = (az / az_step_deg) % n_az
    i0 = np.floor(idx).astype(np.int64)
    i1 = (i0 + 1) % n_az
    f = idx - i0
    h_interp = (1.0 - f) * horizon_deg[i0] + f * horizon_deg[i1]

    # Legacy comparator: upper limb at center azimuth only
    center_pct = float(np.mean(el + rho > h_interp) * 100.0)

    # Corrected comparator: search the spherical disc boundary per timestep.
    # Skip the full search when disc is comfortably above or below the horizon
    # at the center azimuth to keep cost proportional to near-horizon count.
    h_arr = np.asarray(horizon_deg, dtype=float)
    vis_flags = np.empty(len(az), dtype=bool)
    for i in range(len(az)):
        center_clear = bool(el[i] + rho[i] > h_interp[i])
        if center_clear:
            vis_flags[i] = True
        elif el[i] + rho[i] < h_interp[i] - 2.0 * rho[i]:
            # Too far below even with disc width; skip expensive search
            vis_flags[i] = False
        else:
            try:
                vis_flags[i], _ = any_disc_visible(float(az[i]), float(el[i]),
                                                    float(rho[i]), h_arr, az_step_deg)
            except (ValueError, RuntimeError):
                # Polar or degenerate geometry: fall back to center-azimuth test
                vis_flags[i] = center_clear

    any_frac_pct = float(np.mean(vis_flags) * 100.0)
    return any_frac_pct, center_pct


def run_pgda_comparison(output_dir: Path = None, variant: str = 'dem80') -> Dict[str, Any]:
    """
    Execute full V4 validation comparing model to PGDA Product 69 rasters.
    """
    p_root = project_root()
    if output_dir is None:
        output_dir = p_root / 'data' / f'out_longrun_{variant}'
    output_dir.mkdir(parents=True, exist_ok=True)

    sun_path, earth_path = get_pgda_raster_paths()
    furnish_kernels()
    cfg = load_config()

    all_sites = [s for s in load_sites() if s["id"] != "test-pole"]

    # 18.613 year nodal cycle hourly grid matching Mazarico et al. (2011)
    start_utc = "2009-07-13T17:33:17"
    t0 = spice.str2et(start_utc)
    n_hours = 163165
    ets = t0 + np.arange(n_hours, dtype=np.float64) * 3600.0

    print("=" * 80)
    print("V4 Validation: PGDA Product 69 (Mazarico et al. 2011) Published Map Comparison")
    print("=" * 80)
    print(f"Time Grid: {start_utc} UTC + {n_hours} hours (~18.613 years, full nodal cycle)")
    print(f"Observer Height: 0.0 m (matching published map baseline)")
    print(f"Criteria: Upper limb > terrain horizon ('any fraction of disc visible')")
    print(f"Sites: {len(all_sites)} Artemis candidate landing regions")
    print("-" * 80)

    # Precompute SPICE body ephemeris relative to Moon center
    pos_sun_all, _ = spice.spkpos('SUN', ets, 'MOON_ME', cfg.get("ABCORR", "LT+S"), 'MOON')
    pos_earth_all, _ = spice.spkpos('EARTH', ets, 'MOON_ME', cfg.get("ABCORR", "LT+S"), 'MOON')

    R_moon_m = cfg["R_MOON_M"]
    R_sun_km = cfg["R_SUN_KM"]
    R_earth_km = cfg["R_EARTH_KM"]

    site_comparisons = []

    with rasterio.open(sun_path) as src_sun, rasterio.open(earth_path) as src_earth:
        proj = pyproj.Proj(src_sun.crs)

        for site in all_sites:
            sid = site["id"]
            name = site["name"]
            lat = site["lat_deg"]
            lon = site["lon_deg_east"]

            # Sample published maps
            pgda_sun = sample_raster_neighborhood(src_sun, proj, lat, lon)
            pgda_earth = sample_raster_neighborhood(src_earth, proj, lat, lon)

            # Terrain & 0m Horizon (matching published observer height)
            levels = acquire_site_levels(site, variant=variant)
            h_0m, info_0m = compute_horizon(site, levels, obs_height_m=0.0, az_step_deg=0.5, variant=variant)
            z0_m = info_0m.get("z0_m", 0.0)

            # Persist 0m horizon to data/out_longrun/
            h_out_path = output_dir / f"horizon_0m_{sid}.json"
            h_out_path.write_text(json.dumps({
                "site_id": sid,
                "obs_height_m": 0.0,
                "z0_m": z0_m,
                "az_step_deg": 0.5,
                "horizon_deg": [round(float(v), 3) for v in h_0m]
            }, indent=2), encoding="utf-8")

            # Model 18.6-year visibility at 0m observer height
            sun_az, sun_el, sun_rho, earth_az, earth_el, earth_rho = compute_longrun_ephemeris(
                ets=ets,
                site=site,
                obs_height_m=0.0,
                z0_m=z0_m,
                pos_sun_all=pos_sun_all,
                pos_earth_all=pos_earth_all,
                r_sun_km=R_sun_km,
                r_earth_km=R_earth_km,
                r_moon_m=R_moon_m
            )

            sun_any_pct, sun_center_pct = evaluate_visibility(sun_az, sun_el, sun_rho, h_0m)
            earth_any_pct, earth_center_pct = evaluate_visibility(earth_az, earth_el, earth_rho, h_0m)

            # Also compute 2m observer height for comparison
            h_2m, _ = compute_horizon(site, levels, obs_height_m=2.0, az_step_deg=0.5, variant=variant)
            sun_az_2m, sun_el_2m, sun_rho_2m, earth_az_2m, earth_el_2m, earth_rho_2m = compute_longrun_ephemeris(
                ets=ets,
                site=site,
                obs_height_m=2.0,
                z0_m=z0_m,
                pos_sun_all=pos_sun_all,
                pos_earth_all=pos_earth_all,
                r_sun_km=R_sun_km,
                r_earth_km=R_earth_km,
                r_moon_m=R_moon_m
            )
            sun_any_pct_2m, _ = evaluate_visibility(sun_az_2m, sun_el_2m, sun_rho_2m, h_2m)
            earth_any_pct_2m, _ = evaluate_visibility(earth_az_2m, earth_el_2m, earth_rho_2m, h_2m)

            delta_sun = sun_any_pct - pgda_sun["center_pct"]
            delta_earth = earth_any_pct - pgda_earth["center_pct"]

            record = {
                "site_id": sid,
                "name": name,
                "lat_deg": lat,
                "lon_deg_east": lon,
                "elevation_z0_m": round(z0_m, 1),
                "published_sun": pgda_sun,
                "published_earth": pgda_earth,
                "model_18yr_0m": {
                    "sun_any_pct": round(sun_any_pct, 2),
                    "sun_center_pct": round(sun_center_pct, 2),
                    "earth_any_pct": round(earth_any_pct, 2),
                    "earth_center_pct": round(earth_center_pct, 2)
                },
                "model_18yr_2m": {
                    "sun_any_pct": round(sun_any_pct_2m, 2),
                    "earth_any_pct": round(earth_any_pct_2m, 2)
                },
                "delta_sun_percentage_pts": round(delta_sun, 2),
                "delta_earth_percentage_pts": round(delta_earth, 2)
            }
            record['outside_3x3'] = {
                'sun': not pgda_sun['min_pct'] <= sun_any_pct <= pgda_sun['max_pct'],
                'earth': not pgda_earth['min_pct'] <= earth_any_pct <= pgda_earth['max_pct'],
            }
            site_comparisons.append(record)

            # Persist summary stats per site
            stat_out_path = output_dir / f"ephem_summary_{sid}.json"
            stat_out_path.write_text(json.dumps(record, indent=2), encoding="utf-8")

            print(f"{sid:20s} | Sun: Pub={pgda_sun['center_pct']:5.1f}% (med={pgda_sun['median_pct']:5.1f}%, 3x3=[{pgda_sun['min_pct']:4.1f}..{pgda_sun['max_pct']:4.1f}]), Model={sun_any_pct:5.1f}% | Diff={delta_sun:+5.1f}%")
            print(f"{'':20s} | Earth: Pub={pgda_earth['center_pct']:5.1f}% (med={pgda_earth['median_pct']:5.1f}%, 3x3=[{pgda_earth['min_pct']:4.1f}..{pgda_earth['max_pct']:4.1f}]), Model={earth_any_pct:5.1f}% | Diff={delta_earth:+5.1f}%")

    spice.kclear()

    full_report = {
        "status": "COMPLETED",
        "validation_level": "V4 - Published Map Comparison",
        "reference_dataset": "PGDA Product 69 (Mazarico et al. 2011)",
        "limitations": [
            "The chosen full-cycle epoch is recorded; exact epoch equivalence to the reference raster has not been independently established.",
            "Upper-limb-at-center-azimuth is an approximation to any-part-of-disc visibility over an azimuth-varying skyline.",
            "A 3x3 pixel range describes spatial variation, not a confidence interval or proof of the cause of disagreement."
        ],
        "reference_files": {
            "solar_map": sun_path.name,
            "earth_map": earth_path.name
        },
        "model_parameters": {
            "start_time_utc": start_utc,
            "n_steps": n_hours,
            "step_hours": 1.0,
            "observer_height_m": 0.0,
            "horizon_variant": variant,
            "terrain_sampling": "integer windows; bilinear pixel centers; missing ground rejected",
            "solar_criterion": "Upper limb above horizon (any fraction of disc)",
            "earth_criterion": "Upper limb above horizon (any fraction of disc)"
        },
        "sites_evaluated": len(site_comparisons),
        "results": site_comparisons
    }

    full_report['summary'] = {
        'median_abs_sun_difference_pp': round(float(np.median([abs(r['delta_sun_percentage_pts']) for r in site_comparisons])), 2),
        'earth_within_0_4_pp': sum(abs(r['delta_earth_percentage_pts']) <= 0.4 for r in site_comparisons),
        'outside_3x3_count': sum(sum(r['outside_3x3'].values()) for r in site_comparisons),
        'interpretation': 'Comparison completed, not certification. Neighborhood ranges are not confidence intervals; causes of residual differences remain unresolved.',
    }
    report_path = p_root / 'docs' / ('pgda_comparison.json' if variant == 'dem80' else f'pgda_comparison_{variant}.json')
    report_path.write_text(json.dumps(full_report, indent=2), encoding="utf-8")
    print("-" * 80)
    print(f"Saved machine-readable comparison report to: {report_path}")
    print(f"Saved long-run horizons and summaries to: {output_dir}")
    print("=" * 80)

    return full_report


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--variant', choices=['dem80', 'dem20'], default='dem80')
    run_pgda_comparison(variant=parser.parse_args().variant)
