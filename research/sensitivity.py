import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
"""
research/sensitivity.py
DEM-Resolution and Topographic Fidelity Sensitivity Analysis.
Compares geometric Flat Moon, LOLA 80 m DEM, and LOLA 20 m DEM across
all 13 candidate Artemis landing sites over the 2027-2028 operational window.

Outputs:
  - data/out_dem20/horizon_dem20_{site_id}.json
  - data/out_dem20/tracks_{site_id}.bin
  - data/out_dem20/tracks_summary_{site_id}.json
  - research/sensitivity_dem20.json
  - research/sensitivity_dem20.csv
  - research/sensitivity_dem20.png
"""

import csv
import json
import os
from pathlib import Path
from typing import Dict, List, Any

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import spiceypy as spice

from pipeline.config_loader import load_config, load_sites, project_root, cache_dir
from pipeline.ephemeris import furnish_kernels, compute_ephemeris_for_site
from pipeline.terrain import acquire_site_levels
from pipeline.horizon import compute_horizon
from pipeline.visibility import compute_disc_visibility, compute_earth_clearance


def compute_metrics_for_tracks(sun_vis_pct: np.ndarray,
                               earth_clearance: np.ndarray,
                               stay_days: float = 6.5,
                               lit_threshold_pct: float = 10.0,
                               min_sun_fraction: float = 0.50,
                               min_earth_fraction: float = 0.50,
                               max_dark_gap_hours: float = 48.0) -> Dict[str, Any]:
    """
    Compute operational metrics over the 2-year window (35,088 30-min steps):
      - sun_fraction (% mean)
      - earth_fraction (% with LOS)
      - max_dark_gap_h (longest continuous dark period)
      - viable_windows (number of 6.5-day mission windows satisfying thresholds)
      - slip_tolerance_days (maximum consecutive viable launch days)
    """
    n_steps = len(sun_vis_pct)
    window_steps = int(round(stay_days * 48))  # 312 steps for 6.5 days
    daily_stride = 48  # 1-day step between candidate launch dates
    launch_starts = np.arange(0, n_steps - window_steps + 1, daily_stride)
    n_launches = len(launch_starts)

    # Global fractions
    sun_frac_global = float(np.mean(sun_vis_pct))
    earth_frac_global = float(np.mean(earth_clearance >= 0.0) * 100.0)

    # Maximum dark gap across entire 2 years
    is_dark = (sun_vis_pct < lit_threshold_pct)
    max_dark_steps = 0
    cur_dark_steps = 0
    for d in is_dark:
        if d:
            cur_dark_steps += 1
            if cur_dark_steps > max_dark_steps:
                max_dark_steps = cur_dark_steps
        else:
            cur_dark_steps = 0
    max_dark_gap_h = max_dark_steps * 0.5

    # Prefix sums for fast sliding window evaluation
    sun_prefix = np.concatenate([[0], np.cumsum(sun_vis_pct.astype(np.float64) / 100.0)])
    earth_prefix = np.concatenate([[0], np.cumsum((earth_clearance >= 0.0).astype(np.float64))])

    viable_windows = 0
    viable_mask = np.zeros(n_launches, dtype=bool)

    for i, start_idx in enumerate(launch_starts):
        end_idx = start_idx + window_steps
        w_sun = (sun_prefix[end_idx] - sun_prefix[start_idx]) / window_steps
        w_earth = (earth_prefix[end_idx] - earth_prefix[start_idx]) / window_steps

        # Window dark gap
        w_dark_slice = is_dark[start_idx:end_idx]
        w_max_dark = 0
        w_cur_dark = 0
        for d in w_dark_slice:
            if d:
                w_cur_dark += 1
                if w_cur_dark > w_max_dark:
                    w_max_dark = w_cur_dark
            else:
                w_cur_dark = 0
        w_dark_h = w_max_dark * 0.5

        if (w_sun >= min_sun_fraction and
            w_earth >= min_earth_fraction and
            w_dark_h <= max_dark_gap_hours):
            viable_windows += 1
            viable_mask[i] = True

    # Calculate longest contiguous viable launch streak (slip tolerance)
    max_slip = 0
    cur_slip = 0
    for v in viable_mask:
        if v:
            cur_slip += 1
            if cur_slip > max_slip:
                max_slip = cur_slip
        else:
            cur_slip = 0

    return {
        "sun_fraction_pct": round(sun_frac_global, 2),
        "earth_fraction_pct": round(earth_frac_global, 2),
        "max_dark_gap_h": round(max_dark_gap_h, 1),
        "viable_windows": int(viable_windows),
        "total_windows": int(n_launches),
        "slip_tolerance_days": int(max_slip)
    }


def export_dem20_tracks_bin(out_path: Path,
                            ephem: dict,
                            horizon_deg: np.ndarray,
                            sun_vis_pct: np.ndarray,
                            earth_clearance: np.ndarray) -> None:
    """
    Export binary tracks matching Slip Planner layout:
      sun_az (uint16, centi-deg), sun_el (int16, centi-deg),
      earth_az (uint16, centi-deg), earth_el (int16, centi-deg),
      earth_clearance (int16, centi-deg),
      sun_vis_pct (uint8), earth_vis_pct (uint8)
    """
    earth_vis_pct = np.where(earth_clearance >= 0.0, 100, 0).astype(np.uint8)

    sun_az = np.clip(np.round(ephem["sun_az"] * 100.0), 0, 65535).astype("<u2")
    sun_el = np.clip(np.round(ephem["sun_el"] * 100.0), -32768, 32767).astype("<i2")
    earth_az = np.clip(np.round(ephem["earth_az"] * 100.0), 0, 65535).astype("<u2")
    earth_el = np.clip(np.round(ephem["earth_el"] * 100.0), -32768, 32767).astype("<i2")
    clearance = np.clip(np.round(earth_clearance * 100.0), -32768, 32767).astype("<i2")

    n_steps = len(sun_az)
    # Interleave into structured record
    dtype = np.dtype([
        ('sun_az', '<u2'),
        ('sun_el', '<i2'),
        ('earth_az', '<u2'),
        ('earth_el', '<i2'),
        ('earth_clearance', '<i2'),
        ('sun_vis_pct', 'u1'),
        ('earth_vis_pct', 'u1')
    ])
    buf = np.empty(n_steps, dtype=dtype)
    buf['sun_az'] = sun_az
    buf['sun_el'] = sun_el
    buf['earth_az'] = earth_az
    buf['earth_el'] = earth_el
    buf['earth_clearance'] = clearance
    buf['sun_vis_pct'] = sun_vis_pct
    buf['earth_vis_pct'] = earth_vis_pct

    out_path.write_bytes(buf.tobytes())


def run_dem20_sensitivity_study() -> Dict[str, Any]:
    """
    Main sensitivity study executing resolution comparison across all 13 sites.
    """
    p_root = project_root()
    out_dem20_dir = p_root / "data" / "out_dem20"
    out_dem20_dir.mkdir(parents=True, exist_ok=True)
    research_dir = p_root / "research"
    research_dir.mkdir(parents=True, exist_ok=True)

    furnish_kernels()
    cfg = load_config()

    all_sites = [s for s in load_sites() if s["id"] != "test-pole"]

    print("=" * 80)
    print("DEM-RESOLUTION SENSITIVITY STUDY: Flat Moon vs DEM 80m vs DEM 20m")
    print("=" * 80)
    print(f"Time Grid: {cfg['T0_UTC']} to {cfg['T1_UTC']} ({cfg['N_STEPS']} steps @ {cfg['STEP_MIN']} min)")
    print(f"Sites: {len(all_sites)} Artemis Candidate Sites")
    print("-" * 80)

    site_results = []

    for site in all_sites:
        sid = site["id"]
        name = site["name"]
        lat = site["lat_deg"]
        lon = site["lon_deg_east"]
        print(f"\nProcessing {name} ({sid})...")

        # 1. Ephemeris over 2027-2028 operational window
        ephem = compute_ephemeris_for_site(site, z0=0.0, obs_height_m=2.0)

        # 2. Horizons
        # A: Flat
        h_flat, _ = compute_horizon(site, {}, obs_height_m=2.0, az_step_deg=0.5, variant="flat")

        # B: DEM 80m
        levels_80 = acquire_site_levels(site, variant="dem80")
        h_80, info_80 = compute_horizon(site, levels_80, obs_height_m=2.0, az_step_deg=0.5, variant="dem80")

        # C: DEM 20m
        levels_20 = acquire_site_levels(site, variant="dem20")
        h_20, info_20 = compute_horizon(site, levels_20, obs_height_m=2.0, az_step_deg=0.5, variant="dem20")

        # Persist DEM 20m horizon to data/out_dem20/
        h20_path = out_dem20_dir / f"horizon_dem20_{sid}.json"
        h20_path.write_text(json.dumps({
            "site_id": sid,
            "obs_height_m": 2.0,
            "az_step_deg": 0.5,
            "horizon_deg": [round(float(v), 3) for v in h_20],
            "info": info_20
        }, indent=2), encoding="utf-8")

        # 3. Visibility Calculations
        # Flat
        sun_vis_flat = compute_disc_visibility(ephem["sun_az"], ephem["sun_el"], ephem["sun_rho"], h_flat)
        earth_clear_flat = compute_earth_clearance(ephem["earth_az"], ephem["earth_el"], h_flat)
        m_flat = compute_metrics_for_tracks(sun_vis_flat, earth_clear_flat)

        # DEM 80m
        sun_vis_80 = compute_disc_visibility(ephem["sun_az"], ephem["sun_el"], ephem["sun_rho"], h_80)
        earth_clear_80 = compute_earth_clearance(ephem["earth_az"], ephem["earth_el"], h_80)
        m_80 = compute_metrics_for_tracks(sun_vis_80, earth_clear_80)

        # DEM 20m
        sun_vis_20 = compute_disc_visibility(ephem["sun_az"], ephem["sun_el"], ephem["sun_rho"], h_20)
        earth_clear_20 = compute_earth_clearance(ephem["earth_az"], ephem["earth_el"], h_20)
        m_20 = compute_metrics_for_tracks(sun_vis_20, earth_clear_20)

        # Persist DEM 20m tracks and summary
        tracks_bin_path = out_dem20_dir / f"tracks_{sid}.bin"
        export_dem20_tracks_bin(tracks_bin_path, ephem, h_20, sun_vis_20, earth_clear_20)

        summary_path = out_dem20_dir / f"tracks_summary_{sid}.json"
        summary_path.write_text(json.dumps({
            "site_id": sid,
            "name": name,
            "metrics_dem20": m_20,
            "metrics_dem80": m_80,
            "metrics_flat": m_flat
        }, indent=2), encoding="utf-8")

        # Horizon diff stats
        h_diff = h_20 - h_80
        h_diff_mean = float(np.mean(h_diff))
        h_diff_std = float(np.std(h_diff))
        h_diff_max = float(np.max(np.abs(h_diff)))

        res = {
            "site_id": sid,
            "name": name,
            "lat_deg": lat,
            "lon_deg_east": lon,
            "horizon_diff_dem20_minus_dem80": {
                "mean_deg": round(h_diff_mean, 3),
                "std_deg": round(h_diff_std, 3),
                "max_abs_deg": round(h_diff_max, 3)
            },
            "flat": m_flat,
            "dem80": m_80,
            "dem20": m_20,
            "delta_dem20_minus_dem80": {
                "sun_fraction_pp": round(m_20["sun_fraction_pct"] - m_80["sun_fraction_pct"], 2),
                "earth_fraction_pp": round(m_20["earth_fraction_pct"] - m_80["earth_fraction_pct"], 2),
                "dark_gap_diff_h": round(m_20["max_dark_gap_h"] - m_80["max_dark_gap_h"], 1),
                "viable_windows_diff": m_20["viable_windows"] - m_80["viable_windows"],
                "slip_tolerance_diff_days": m_20["slip_tolerance_days"] - m_80["slip_tolerance_days"]
            }
        }
        site_results.append(res)

        print(f"  Sun Vis:   Flat={m_flat['sun_fraction_pct']:5.1f}% | 80m={m_80['sun_fraction_pct']:5.1f}% | 20m={m_20['sun_fraction_pct']:5.1f}% [d20-80: {res['delta_dem20_minus_dem80']['sun_fraction_pp']:+4.1f}%]")
        print(f"  Earth LOS: Flat={m_flat['earth_fraction_pct']:5.1f}% | 80m={m_80['earth_fraction_pct']:5.1f}% | 20m={m_20['earth_fraction_pct']:5.1f}% [d20-80: {res['delta_dem20_minus_dem80']['earth_fraction_pp']:+4.1f}%]")
        print(f"  Dark Gap:  Flat={m_flat['max_dark_gap_h']:5.1f}h | 80m={m_80['max_dark_gap_h']:5.1f}h | 20m={m_20['max_dark_gap_h']:5.1f}h [d20-80: {res['delta_dem20_minus_dem80']['dark_gap_diff_h']:+4.1f}h]")
        print(f"  Viable:    Flat={m_flat['viable_windows']:3d}    | 80m={m_80['viable_windows']:3d}    | 20m={m_20['viable_windows']:3d}    [d20-80: {res['delta_dem20_minus_dem80']['viable_windows_diff']:+3d} win]")
        print(f"  Slip Tol:  Flat={m_flat['slip_tolerance_days']:3d}d   | 80m={m_80['slip_tolerance_days']:3d}d   | 20m={m_20['slip_tolerance_days']:3d}d   [d20-80: {res['delta_dem20_minus_dem80']['slip_tolerance_diff_days']:+3d} days]")

    spice.kclear()

    # Save JSON report
    report = {
        "status": "COMPLETED",
        "description": "DEM resolution and fidelity sensitivity study comparing flat sphere dip, LOLA 80 m DEM, and LOLA 20 m DEM across Artemis candidate landing sites.",
        "sites_count": len(site_results),
        "results": site_results
    }
    json_path = research_dir / "sensitivity_dem20.json"
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nSaved JSON report to: {json_path}")

    # Save CSV report
    csv_path = research_dir / "sensitivity_dem20.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Site ID", "Site Name", "Variant",
            "Sun Fraction (%)", "Earth LOS (%)",
            "Max Dark Gap (h)", "Viable Windows", "Slip Tolerance (days)"
        ])
        for r in site_results:
            sid = r["site_id"]
            name = r["name"]
            for var in ["flat", "dem80", "dem20"]:
                m = r[var]
                writer.writerow([
                    sid, name, var,
                    m["sun_fraction_pct"], m["earth_fraction_pct"],
                    m["max_dark_gap_h"], m["viable_windows"], m["slip_tolerance_days"]
                ])
    print(f"Saved CSV report to: {csv_path}")

    # Generate PNG visualization plot
    png_path = research_dir / "sensitivity_dem20.png"
    generate_sensitivity_plot(site_results, png_path)
    print(f"Saved PNG chart to: {png_path}")

    return report


def generate_sensitivity_plot(site_results: List[Dict[str, Any]], png_path: Path):
    """Generate comprehensive 4-panel comparison figure."""
    names = [r["name"].replace(" (Site 01)", "").replace(" (Site 04)", "").replace(" (Site 11)", "").replace(" (Site 20)", "").replace(" (Site 23)", "") for r in site_results]
    n_sites = len(names)
    y_pos = np.arange(n_sites)

    fig, axes = plt.subplots(2, 2, figsize=(16, 12), sharey=True)
    fig.patch.set_facecolor('#0b0e14')

    bar_height = 0.25

    colors = {
        "flat": '#3b82f6',   # blue
        "dem80": '#10b981',  # emerald
        "dem20": '#f59e0b'   # amber
    }

    metrics_config = [
        ("sun_fraction_pct", "Sun Visibility (% Mean)", axes[0, 0], (0, 100)),
        ("earth_fraction_pct", "Earth Line-of-Sight (% Time)", axes[0, 1], (0, 100)),
        ("max_dark_gap_h", "Maximum Dark Gap (hours)", axes[1, 0], None),
        ("viable_windows", "Viable Mission Windows (6.5-day)", axes[1, 1], None)
    ]

    for metric_key, title, ax, x_lim in metrics_config:
        ax.set_facecolor('#131722')
        ax.tick_params(colors='#94a3b8')
        ax.grid(True, linestyle='--', alpha=0.2, color='#64748b', axis='x')

        flat_vals = [r["flat"][metric_key] for r in site_results]
        dem80_vals = [r["dem80"][metric_key] for r in site_results]
        dem20_vals = [r["dem20"][metric_key] for r in site_results]

        ax.barh(y_pos - bar_height, flat_vals, height=bar_height, color=colors["flat"], label="Flat Sphere (No Relief)", alpha=0.85)
        ax.barh(y_pos, dem80_vals, height=bar_height, color=colors["dem80"], label="LOLA 80 m DEM", alpha=0.85)
        ax.barh(y_pos + bar_height, dem20_vals, height=bar_height, color=colors["dem20"], label="LOLA 20 m DEM", alpha=0.85)

        ax.set_title(title, color='#f1f5f9', fontsize=12, fontweight='bold', pad=10)
        if x_lim:
            ax.set_xlim(x_lim)

        for spine in ax.spines.values():
            spine.set_color('#334155')

    axes[0, 0].set_yticks(y_pos)
    axes[0, 0].set_yticklabels(names, color='#f1f5f9', fontsize=9)
    axes[1, 0].set_yticks(y_pos)
    axes[1, 0].set_yticklabels(names, color='#f1f5f9', fontsize=9)

    axes[0, 0].legend(loc='lower right', facecolor='#1e293b', edgecolor='#475569', labelcolor='#f1f5f9', fontsize=9)

    fig.suptitle("Artemis III Candidate Landing Sites — Topographic Resolution Sensitivity\nGeometric Flat Sphere vs LOLA 80 m DEM vs LOLA 20 m DEM",
                 color='#f8fafc', fontsize=14, fontweight='bold', y=0.98)

    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    plt.savefig(png_path, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()


if __name__ == "__main__":
    run_dem20_sensitivity_study()
