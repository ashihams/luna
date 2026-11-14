"""
pipeline/run_all.py
Main pipeline orchestrator. Runs all stages in order.

Usage:
    python -m pipeline.run_all [--sites SITE_ID ...] [--skip-terrain] [--skip-ephemeris]
"""
import argparse
import sys
import time
from pathlib import Path

from pipeline.config_loader import load_config, load_sites, project_root


def main():
    parser = argparse.ArgumentParser(description="Slip Planner offline pipeline")
    parser.add_argument('--sites', nargs='*', help='Specific site IDs to process (default: all non-test)')
    parser.add_argument('--skip-terrain', action='store_true', help='Skip terrain acquisition')
    parser.add_argument('--skip-ephemeris', action='store_true', help='Skip ephemeris computation')
    parser.add_argument('--include-test', action='store_true', help='Include test sites')
    args = parser.parse_args()

    cfg = load_config()
    sites = load_sites()

    # Filter sites
    if args.sites:
        sites = [s for s in sites if s['id'] in args.sites]
    elif not args.include_test:
        sites = [s for s in sites if not s.get('test', False)]

    print(f"Slip Planner Pipeline")
    print(f"  Sites: {len(sites)}")
    print(f"  Time window: {cfg['T0_UTC']} to {cfg['T1_UTC']}")
    print(f"  Steps: {cfg['N_STEPS']} ({cfg['STEP_MIN']} min intervals)")
    print()

    t0 = time.time()

    # Stage 1: Terrain acquisition
    if not args.skip_terrain:
        print("=" * 60)
        print("Stage 1: Terrain Acquisition")
        print("=" * 60)
        # TODO: from pipeline.terrain import acquire_terrain
        print("  [STUB] Not yet implemented")
        print()

    # Stage 2: Horizon computation
    if not args.skip_terrain:
        print("=" * 60)
        print("Stage 2: Horizon Computation")
        print("=" * 60)
        # TODO: from pipeline.horizon import compute_all_horizons
        print("  [STUB] Not yet implemented")
        print()

    # Stage 3: Ephemeris
    if not args.skip_ephemeris:
        print("=" * 60)
        print("Stage 3: Ephemeris")
        print("=" * 60)
        # TODO: from pipeline.ephemeris import compute_all_ephemerides
        print("  [STUB] Not yet implemented")
        print()

    # Stage 4: Visibility
    print("=" * 60)
    print("Stage 4: Visibility Products")
    print("=" * 60)
    # TODO: from pipeline.visibility import compute_all_visibility
    print("  [STUB] Not yet implemented")
    print()

    # Stage 5: Export
    print("=" * 60)
    print("Stage 5: Export")
    print("=" * 60)
    # TODO: from pipeline.export import export_all
    print("  [STUB] Not yet implemented")
    print()

    elapsed = time.time() - t0
    print(f"Pipeline complete in {elapsed:.1f} s")


if __name__ == "__main__":
    main()
