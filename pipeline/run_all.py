"""
pipeline/run_all.py
Master Pipeline Orchestrator for Slip Planner.
Implements the complete offline data pipeline:
  Sites -> Terrain -> Horizon -> Ephemeris -> Visibility -> Export
"""
import argparse
import sys
import time
import json
import numpy as np
from pathlib import Path

from pipeline.config_loader import load_config, load_sites, cache_dir, web_data_dir
from pipeline.terrain import acquire_site_levels, extract_local_terrain_mesh
from pipeline.horizon import compute_horizon
from pipeline.plot_horizon import plot_polar_horizon
from pipeline.ephemeris import furnish_kernels, compute_ephemeris_for_site
from pipeline.visibility import compute_site_visibility_products
from pipeline.export import (
    export_horizon_json,
    export_tracks_bin,
    export_terrain_bin,
    export_manifest
)


def run_pipeline(site_filter: list[str] = None,
                 include_test: bool = False,
                 skip_plots: bool = False,
                 generate_overview: bool = True):
    """Run full pipeline for specified sites or all configured sites."""
    cfg = load_config()
    all_sites = load_sites()

    # Filter sites
    if site_filter:
        sites = [s for s in all_sites if s["id"] in site_filter]
    elif not include_test:
        sites = [s for s in all_sites if not s.get("test", False)]
    else:
        sites = all_sites

    print("=" * 70)
    print("SLIP PLANNER: OFFLINE PRECOMPUTATION PIPELINE")
    print(f"  Target sites ({len(sites)}): {[s['id'] for s in sites]}")
    print(f"  Ephemeris window: {cfg['T0_UTC']} to {cfg['T1_UTC']} ({cfg['N_STEPS']} steps @ {cfg['STEP_MIN']} min)")
    print(f"  Horizon resolution: {cfg['AZ_STEP_DEG']} deg ({cfg['AZ_COUNT']} azimuths)")
    print("=" * 70)

    # 1. Load SPICE kernels once
    print("\n[Step 1/5] Loading SPICE kernels...")
    furnish_kernels()

    # Results containers for manifest
    sites_meta = []
    tracks_layouts = {}
    t_start = time.time()

    for idx, site in enumerate(sites, 1):
        sid = site["id"]
        sname = site["name"]
        print(f"\n--- [{idx}/{len(sites)}] Processing site: {sid} ({sname}) ---")
        t_site = time.time()

        # Step 2: Acquire terrain levels
        print(f"  Acquiring terrain levels for {sid}...")
        levels = acquire_site_levels(site)

        # Step 3: Compute Horizon
        print(f"  Computing 720-azimuth terrain horizon for {sid}...")
        elev_deg, h_info = compute_horizon(
            site=site,
            levels=levels,
            obs_height_m=site.get("obs_height_m", cfg["OBS_HEIGHT_M"]),
            az_step_deg=cfg["AZ_STEP_DEG"],
            variant="dem80"
        )
        print(f"    Horizon computed in {h_info['runtime_s']:.2f}s (levels: {h_info['levels_used']}, NaN frac: {h_info['nan_fraction']:.4f})")
        print(f"    Elevation range: {np.min(elev_deg):.2f} deg to {np.max(elev_deg):.2f} deg (ground z0 = {h_info.get('z0_m', 0):.1f} m)")

        # Polar plot
        if not skip_plots:
            plot_polar_horizon(
                site_id=sid,
                azimuths_deg=np.arange(0.0, 360.0, cfg["AZ_STEP_DEG"]),
                elev_deg=elev_deg,
                title=f"Lunar Terrain Horizon — {sname} ({site['lat_deg']} deg lat, {site['lon_deg_east']} deg lon)"
            )

        # Flat horizon baseline for comparison
        flat_elev_deg, _ = compute_horizon(
            site=site,
            levels=levels,
            obs_height_m=site.get("obs_height_m", cfg["OBS_HEIGHT_M"]),
            az_step_deg=cfg["AZ_STEP_DEG"],
            variant="flat"
        )

        # Export horizon JSON
        export_horizon_json(
            site_id=sid,
            elev_deg=elev_deg,
            az_step_deg=cfg["AZ_STEP_DEG"],
            obs_height_m=site.get("obs_height_m", cfg["OBS_HEIGHT_M"]),
            variants={
                "best": elev_deg,
                "dem80": elev_deg,
                "flat": flat_elev_deg
            },
            info=h_info
        )

        # Step 4: Extract 513x513 local terrain mesh for 3D viewer
        print(f"  Extracting 513x513 local terrain mesh (±10 km) for {sid}...")
        near_lvl = levels["near"]
        uint16_mesh, z_min, z_max, z0 = extract_local_terrain_mesh(
            site=site,
            level=near_lvl,
            grid_n=cfg["TERRAIN_N"],
            half_width_m=cfg["TERRAIN_HALF_M"]
        )
        export_terrain_bin(sid, uint16_mesh)
        print(f"    Terrain mesh exported: z_min={z_min:.1f} m, z_max={z_max:.1f} m, z0={z0:.1f} m")

        # Step 5: Compute ephemeris and visibility products
        print(f"  Computing Sun and Earth tracks (35,088 steps) for {sid}...")
        ephem = compute_ephemeris_for_site(
            site=site,
            z0=z0,
            obs_height_m=site.get("obs_height_m", cfg["OBS_HEIGHT_M"])
        )

        print(f"  Computing disc-integrated visibility products for {sid}...")
        vis_products = compute_site_visibility_products(
            ephem=ephem,
            horizon_deg=elev_deg,
            az_step_deg=cfg["AZ_STEP_DEG"],
            n_disc_samples=cfg["DISC_SAMPLES"]
        )

        # Export tracks binary
        _, layout = export_tracks_bin(sid, vis_products)
        tracks_layouts[sid] = layout

        # Site metadata entry for manifest
        site_entry = dict(site)
        site_entry["ground_height_m"] = round(z0, 2)
        site_entry["terrain_z_min"] = round(z_min, 2)
        site_entry["terrain_z_max"] = round(z_max, 2)
        site_entry["effective_radius_km"] = levels["effective_radius_km"]
        site_entry["variants"] = ["best", "dem80", "flat"]
        sites_meta.append(site_entry)

        elapsed_site = time.time() - t_site
        print(f"  [PASS] Site {sid} completed in {elapsed_site:.1f} s")

    # Step 6: Export master manifest
    print("\n[Step 5/5] Exporting manifest.json...")
    manifest_path = export_manifest(sites_meta, tracks_layouts)

    # Optional: Pole overview heightmap (Section 15 Should-have)
    if generate_overview:
        print("\nGenerating South Pole overview heightmap (512x512, ±150 km)...")
        try:
            from pipeline.terrain import acquire_window_from_raster
            pole_window = acquire_window_from_raster(
                raster_url_or_path=cfg["DEM_80M_URL"],
                center_x=0.0,
                center_y=0.0,
                half_width_m=150000.0,
                cache_tag="pole_overview_150km"
            )
            # Downsample to 512x512
            from scipy.ndimage import zoom
            pdata = pole_window["data"]
            zoom_f = 512.0 / pdata.shape[0]
            overview_512 = zoom(pdata, zoom_f, order=1)
            # Normalize to uint16
            ov_min = float(np.nanmin(overview_512))
            ov_max = float(np.nanmax(overview_512))
            ov_u16 = np.round((overview_512 - ov_min) / (ov_max - ov_min) * 65535.0).astype(np.uint16)
            ov_bin_path = web_data_dir() / "pole_overview.bin"
            with open(ov_bin_path, "wb") as f:
                f.write(ov_u16.tobytes())
            # Save meta
            ov_meta_path = web_data_dir() / "pole_overview_meta.json"
            with open(ov_meta_path, "w") as f:
                json.dump({"z_min": ov_min, "z_max": ov_max, "half_width_m": 150000.0, "dim": 512}, f, indent=2)
            print(f"  [PASS] Pole overview heightmap exported: {ov_bin_path}")
        except Exception as e:
            print(f"  Pole overview generation skipped/failed: {e}")

    total_time = time.time() - t_start
    print("\n" + "=" * 70)
    print(f"PIPELINE RUN COMPLETE in {total_time:.1f} s ({total_time/60:.2f} min)")
    print(f"Static assets ready in: {web_data_dir()}")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Slip Planner Pipeline")
    parser.add_argument("--sites", nargs="*", help="Specific site IDs (default: all)")
    parser.add_argument("--include-test", action="store_true", help="Include test site")
    parser.add_argument("--skip-plots", action="store_true", help="Skip polar horizon plots")
    args = parser.parse_args()

    run_pipeline(
        site_filter=args.sites,
        include_test=args.include_test,
        skip_plots=args.skip_plots
    )
