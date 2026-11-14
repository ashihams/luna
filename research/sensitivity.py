"""
research/sensitivity.py
Section 17: DEM-Resolution and Flat-Horizon Sensitivity Experiments.
Compares flat sphere dip vs LOLA 80 m DEM terrain horizons across key sites.
Outputs metrics table and sensitivity summary.
"""
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from pathlib import Path

from pipeline.config_loader import load_config, load_sites, project_root, cache_dir
from pipeline.ephemeris import furnish_kernels, compute_ephemeris_for_site
from pipeline.visibility import compute_disc_visibility, compute_earth_clearance


def compute_window_metrics(sun_vis_pct: np.ndarray,
                           earth_clearance: np.ndarray,
                           stay_days: float = 6.5,
                           lit_threshold_pct: float = 50.0,
                           min_sun_fraction: float = 0.85,
                           max_dark_gap_hours: float = 24.0,
                           min_earth_fraction: float = 0.8,
                           antenna_mask_deg: float = 0.0):
    """Compute Section 14 metrics over daily windows."""
    n_steps = len(sun_vis_pct)
    window_steps = int(round(stay_days * 48))
    daily_starts = np.arange(0, n_steps - window_steps + 1, 48)
    n_days = len(daily_starts)

    sun_prefix = np.concatenate([[0], np.cumsum(sun_vis_pct.astype(float) / 100.0)])
    earth_link = (earth_clearance >= antenna_mask_deg).astype(float)
    earth_prefix = np.concatenate([[0], np.cumsum(earth_link)])

    sun_fractions = (sun_prefix[daily_starts + window_steps] - sun_prefix[daily_starts]) / window_steps
    earth_fractions = (earth_prefix[daily_starts + window_steps] - earth_prefix[daily_starts]) / window_steps

    longest_dark = np.zeros(n_days, dtype=float)
    longest_outage = np.zeros(n_days, dtype=float)

    is_dark = (sun_vis_pct < lit_threshold_pct)
    is_outage = (earth_clearance < antenna_mask_deg)

    for i, s_idx in enumerate(daily_starts):
        w_dark = is_dark[s_idx : s_idx + window_steps]
        w_out = is_outage[s_idx : s_idx + window_steps]

        def max_consecutive(arr):
            max_c = 0
            cur_c = 0
            for val in arr:
                if val:
                    cur_c += 1
                    if cur_c > max_c:
                        max_c = cur_c
                else:
                    cur_c = 0
            return max_c * 0.5

        longest_dark[i] = max_consecutive(w_dark)
        longest_outage[i] = max_consecutive(w_out)

    viable = (
        (sun_fractions >= min_sun_fraction) &
        (earth_fractions >= min_earth_fraction) &
        (longest_dark <= max_dark_gap_hours)
    )

    scores = 0.5 * sun_fractions + 0.5 * earth_fractions - 0.5 * np.minimum(1.0, longest_dark / (24.0 * stay_days))

    return {
        "daily_starts": daily_starts,
        "sun_fractions": sun_fractions,
        "earth_fractions": earth_fractions,
        "longest_dark": longest_dark,
        "longest_outage": longest_outage,
        "viable": viable,
        "scores": scores
    }


def run_sensitivity_experiments():
    """Run sensitivity analysis comparing DEM vs flat horizon (Section 17)."""
    cfg = load_config()
    furnish_kernels()
    manifest_path = project_root() / "web" / "public" / "data" / "manifest.json"
    with open(manifest_path, "r") as f:
        manifest = json.load(f)
    sites_meta = manifest["sites"]
    out_dir = project_root() / "research"
    out_dir.mkdir(exist_ok=True)

    target_ids = ["shackleton-rim", "connecting-ridge", "malapert-massif"]
    results = {}

    print("=" * 70)
    print("DEM-RESOLUTION & FLAT HORIZON SENSITIVITY EXPERIMENTS (Section 17)")
    print("=" * 70)

    for site_id in target_ids:
        site = next((s for s in sites_meta if s["id"] == site_id), None)
        if not site:
            continue

        print(f"\nEvaluating Site: {site['name']} (lat={site['lat_deg']}°, lon={site['lon_deg_east']}°)")

        # Load horizon
        h_path = project_root() / "web" / "public" / "data" / f"horizon_{site_id}.json"
        with open(h_path, "r") as f:
            h_data = json.load(f)

        v_best = h_data["variants"]["best"]
        v_flat = h_data["variants"]["flat"]
        elev_dem = np.array(v_best if isinstance(v_best, list) else v_best.get("elev_deg", v_best))
        elev_flat = np.array(v_flat if isinstance(v_flat, list) else v_flat.get("elev_deg", v_flat))

        # Compute ephemeris
        ephem = compute_ephemeris_for_site(site, site["ground_height_m"], site.get("obs_height_m", 2.0))

        # DEM 80m metrics
        sun_vis_dem = compute_disc_visibility(ephem["sun_az"], ephem["sun_el"],
                                              ephem["sun_rho"], elev_dem)
        earth_clear_dem = compute_earth_clearance(ephem["earth_az"], ephem["earth_el"], elev_dem)
        m_dem = compute_window_metrics(sun_vis_dem, earth_clear_dem)

        # Flat horizon metrics
        sun_vis_flat = compute_disc_visibility(ephem["sun_az"], ephem["sun_el"],
                                               ephem["sun_rho"], elev_flat)
        earth_clear_flat = compute_earth_clearance(ephem["earth_az"], ephem["earth_el"], elev_flat)
        m_flat = compute_window_metrics(sun_vis_flat, earth_clear_flat)

        # Compare
        mean_sun_dem = np.mean(m_dem["sun_fractions"]) * 100
        mean_sun_flat = np.mean(m_flat["sun_fractions"]) * 100
        mean_dark_dem = np.mean(m_dem["longest_dark"])
        mean_dark_flat = np.mean(m_flat["longest_dark"])
        viable_days_dem = int(np.sum(m_dem["viable"]))
        viable_days_flat = int(np.sum(m_flat["viable"]))

        # Slip sensitivity: d(score)/d(day) over +/- 30 days
        diffs = np.abs(np.diff(m_dem["scores"]))
        slip_sens = float(np.mean(diffs))

        print(f"  Sun Fraction:   DEM 80m = {mean_sun_dem:.1f}% | Flat = {mean_sun_flat:.1f}% (Diff: {mean_sun_dem - mean_sun_flat:+.1f}%)")
        print(f"  Avg Dark Gap:   DEM 80m = {mean_dark_dem:.1f}h  | Flat = {mean_dark_flat:.1f}h  (Diff: {mean_dark_dem - mean_dark_flat:+.1f}h)")
        print(f"  Viable Windows: DEM 80m = {viable_days_dem}/731 | Flat = {viable_days_flat}/731 (Diff: {viable_days_dem - viable_days_flat:+d} days)")
        print(f"  Slip Sensitivity (score change/day): {slip_sens:.4f}")

        results[site_id] = {
            "name": site["name"],
            "mean_sun_dem": mean_sun_dem,
            "mean_sun_flat": mean_sun_flat,
            "mean_dark_dem": mean_dark_dem,
            "mean_dark_flat": mean_dark_flat,
            "viable_days_dem": viable_days_dem,
            "viable_days_flat": viable_days_flat,
            "slip_sens": slip_sens
        }

    # Save results to json
    with open(out_dir / "sensitivity_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print("\nSaved sensitivity results to research/sensitivity_results.json")
    return results


if __name__ == "__main__":
    run_sensitivity_experiments()
