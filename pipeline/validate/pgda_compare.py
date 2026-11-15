"""
pipeline/validate/pgda_compare.py
Exploratory comparison (not independent V4 validation): Long-Term Illumination & Earth Visibility Comparison with Mazarico et al. (2011) / PGDA Product 69.
Compares computed average solar illumination and Earth visibility across 5 curated sites.

Target: absolute difference within 5 percentage points.
Documents any remaining differences in docs/VALIDATION.md.
"""
import numpy as np
import spiceypy as spice

from pipeline.config_loader import load_config, project_root, cache_dir
from pipeline.ephemeris import furnish_kernels, compute_ephemeris_for_site
from pipeline.visibility import compute_disc_visibility, compute_earth_clearance
from pipeline.horizon import compute_horizon
from pipeline.terrain import acquire_site_levels


# Legacy manually entered reference values. Provenance and coordinate correspondence
# are unverified. Never use this exploratory comparison to certify V4.
PUBLISHED_PGDA_BENCHMARKS = {
    "shackleton-rim": {
        "name": "Peak near Shackleton (Site 04)",
        "published_sun_pct": 86.0,
        "published_earth_pct": 53.0,
        "notes": "Mazarico 2011 Site 4; high illumination peak on Shackleton rim"
    },
    "connecting-ridge": {
        "name": "Connecting Ridge (Site 01)",
        "published_sun_pct": 82.0,
        "published_earth_pct": 58.0,
        "notes": "Mazarico 2011 Site 1; connecting ridge between Shackleton and de Gerlache"
    },
    "de-gerlache-rim1": {
        "name": "de Gerlache Rim 1 (Site 11)",
        "published_sun_pct": 80.0,
        "published_earth_pct": 62.0,
        "notes": "Mazarico 2011 Site 11"
    },
    "malapert-massif": {
        "name": "Malapert Massif",
        "published_sun_pct": 74.0,
        "published_earth_pct": 98.0,
        "notes": "High elevation massif with near-permanent Earth line of sight"
    },
    "leibnitz-beta": {
        "name": "Leibnitz Beta Plateau (Site 20)",
        "published_sun_pct": 70.0,
        "published_earth_pct": 88.0,
        "notes": "High latitude plateau"
    }
}


def run_pgda_comparison(sites_dict: list[dict] = None):
    """
    V4 Comparison against published PGDA benchmarks.
    Computes 2-year average illumination and Earth visibility for 5 sites
    and compares with published 18.6-year cycle values.
    """
    furnish_kernels()
    cfg = load_config()

    from pipeline.config_loader import load_sites
    all_sites = {s["id"]: s for s in load_sites()}

    results = []
    all_pass = True

    print("=" * 70)
    print("V4 Validation: PGDA / Mazarico et al. 2011 Illumination Comparison")
    print("=" * 70)

    for sid, bench in PUBLISHED_PGDA_BENCHMARKS.items():
        if sid not in all_sites:
            continue
        site = all_sites[sid]
        print(f"\nEvaluating site: {sid} ({bench['name']})...")

        # Acquire terrain and compute horizon
        levels = acquire_site_levels(site)
        elev_deg, info = compute_horizon(site, levels, obs_height_m=2.0, az_step_deg=0.5, variant="dem80")

        # Ephemeris & visibility
        ephem = compute_ephemeris_for_site(site, z0=info.get("z0_m", 0.0), obs_height_m=2.0)
        sun_vis = compute_disc_visibility(ephem["sun_az"], ephem["sun_el"], ephem["sun_rho"], elev_deg)
        earth_clearance = compute_earth_clearance(ephem["earth_az"], ephem["earth_el"], elev_deg)

        # Average percentages over 2027-2028 window
        model_sun_pct = float(np.mean(sun_vis))
        model_earth_pct = float(np.mean(earth_clearance >= 0.0) * 100.0)

        pub_sun = bench["published_sun_pct"]
        pub_earth = bench["published_earth_pct"]

        d_sun = abs(model_sun_pct - pub_sun)
        d_earth = abs(model_earth_pct - pub_earth)

        pass_sun = d_sun <= 5.0
        pass_earth = d_earth <= 5.0
        site_pass = pass_sun and pass_earth
        if not site_pass:
            all_pass = False

        status = "PASS" if site_pass else "MARGINAL/FAIL"
        print(f"  Sun Vis:   Model = {model_sun_pct:.1f}%, Published = {pub_sun:.1f}%, diff = {d_sun:.1f}% [{'PASS' if pass_sun else 'FAIL'}]")
        print(f"  Earth Vis: Model = {model_earth_pct:.1f}%, Published = {pub_earth:.1f}%, diff = {d_earth:.1f}% [{'PASS' if pass_earth else 'FAIL'}]")

        results.append({
            "site": sid,
            "name": bench["name"],
            "model_sun": round(model_sun_pct, 1),
            "pub_sun": pub_sun,
            "delta_sun": round(d_sun, 1),
            "model_earth": round(model_earth_pct, 1),
            "pub_earth": pub_earth,
            "delta_earth": round(d_earth, 1),
            "pass": site_pass
        })

    spice.kclear()

    # Preserve validation status: these constants are not independently sampled maps.
    import json
    from datetime import datetime, timezone
    report = {"status": "INCOMPLETE", "generated_utc": datetime.now(timezone.utc).isoformat(),
              "reason": "Reference percentages are unverified constants, not sampled PGDA rasters; periods and visibility definitions differ.",
              "exploratory_results": results}
    (project_root() / "docs" / "pgda-exploratory-results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("V4 remains INCOMPLETE. Exploratory results saved; no validation PASS claimed.")
    return results


if __name__ == "__main__":
    run_pgda_comparison()
    raise SystemExit(2)  # Independent map validation remains incomplete.
