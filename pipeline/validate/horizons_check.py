"""
pipeline/validate/horizons_check.py
V3 Horizons Cross-Check (Section 16).
Compares Sun and Earth Azimuth and Elevation computed from SPICE (DE421 / MOON_ME)
with NASA JPL Horizons API output for 2 sites across 3 dates.

Target: difference under 0.1 deg.
Logs all results to docs/VALIDATION.md.
"""
import urllib.request
import urllib.parse
import json
import re
import numpy as np
import spiceypy as spice
from datetime import datetime

from pipeline.config_loader import load_config, load_sites, project_root
from pipeline.ephemeris import furnish_kernels, compute_ephemeris_for_site
from pipeline.horizon import get_site_local_frame


def query_horizons_api(target_id: str,
                       lat_deg: float,
                       lon_deg_east: float,
                       alt_km: float,
                       date_str: str) -> tuple[float, float]:
    """
    Query JPL Horizons API for a specific target body at a given lunar location and epoch.
    target_id: '10' (Sun) or '399' (Earth)
    date_str: 'YYYY-MM-DD HH:MM'
    Returns: (az_deg, el_deg)
    """
    base_url = "https://ssd.jpl.nasa.gov/api/horizons.api"

    # Time window: 2 hours around date_str to ensure match
    t_start = f"{date_str}"
    t_stop = f"{date_str[:11]}02:00"

    site_coord = f"{lon_deg_east:.4f},{lat_deg:.4f},{alt_km:.4f}"

    params = {
        "format": "json",
        "COMMAND": f"'{target_id}'",
        "EPHEM_TYPE": "'OBSERVER'",
        "CENTER": "'coord@301'",
        "COORD_TYPE": "'GEODETIC'",
        "SITE_COORD": f"'{site_coord}'",
        "START_TIME": f"'{t_start}'",
        "STOP_TIME": f"'{t_stop}'",
        "STEP_SIZE": "'10m'",
        "QUANTITIES": "'4'",
        "MAKE_EPHEM": "'YES'"
    }

    url = f"{base_url}?{urllib.parse.urlencode(params)}"

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode('utf-8'))

    result_text = data.get("result", "")

    # Parse Horizons text output between $$SOE and $$EOE
    match = re.search(r'\$\$SOE\s*(.*?)\s*\$\$EOE', result_text, re.DOTALL)
    if not match:
        raise ValueError(f"Could not parse Horizons output: {result_text[:400]}")

    lines = match.group(1).strip().split('\n')
    # First data line format: Date__(UT)__HR:MN  Azi_(a-app)___Elev_(a-app) ...
    # e.g.: 2027-Jan-01 00:00 *m  263.1234  1.0234
    first_line = lines[0].strip()
    tokens = [t for t in first_line.split() if t]

    # Find the floating point numbers corresponding to Azi and Elev
    # The tokens usually start with Date, Time, flags (*m), then Azi, Elev
    nums = []
    for token in tokens:
        try:
            val = float(token)
            nums.append(val)
        except ValueError:
            continue

    if len(nums) < 2:
        raise ValueError(f"Could not extract az/el from line: {first_line}")

    horizons_az = nums[0]
    horizons_el = nums[1]
    return horizons_az, horizons_el


def run_horizons_cross_check():
    """
    V3 Acceptance Check:
    2 sites × 3 dates = 6 comparisons each for Sun and Earth.
    Target: |Δ az| < 0.1°, |Δ el| < 0.1°
    """
    furnish_kernels()
    cfg = load_config()

    sites_to_test = [s for s in load_sites() if s['id'] in ('shackleton-rim', 'connecting-ridge')]

    dates_to_test = [
        "2027-01-01 00:00",
        "2027-07-01 00:00",
        "2028-01-01 00:00"
    ]

    log_rows = []
    all_pass = True
    errors = []

    print("=" * 70)
    print("V3 Validation: JPL Horizons Cross-Check (SPICE MOON_ME vs JPL Horizons)")
    print("=" * 70)

    for site in sites_to_test:
        sid = site["id"]
        lat = site["lat_deg"]
        lon = site["lon_deg_east"]
        up, east, north = get_site_local_frame(lat, lon)
        r_obs_km = (cfg["R_MOON_M"] + 2.0) / 1000.0
        obs_vec = r_obs_km * up

        for d_str in dates_to_test:
            utc_iso = d_str.replace(" ", "T") + ":00"
            et = spice.str2et(utc_iso)

            for body_name, body_cmd in [("SUN", "10"), ("EARTH", "399")]:
                # 1. SPICE computation
                pos, _ = spice.spkpos(body_name, et, 'MOON_ME', 'LT+S', 'MOON')
                v = pos - obs_vec
                e_c = np.dot(v, east)
                n_c = np.dot(v, north)
                u_c = np.dot(v, up)
                spice_az = float(np.degrees(np.arctan2(e_c, n_c)) % 360.0)
                spice_el = float(np.degrees(np.arctan2(u_c, np.hypot(e_c, n_c))))

                # 2. Horizons computation
                try:
                    h_az, h_el = query_horizons_api(body_cmd, lat, lon, 0.002, d_str)
                except Exception as e:
                    print(f"  [ERROR] Horizons API query failed for {body_name} at {sid} {d_str}: {e}")
                    all_pass = False
                    errors.append({"site": sid, "date": d_str, "body": body_name, "error": str(e)})
                    continue

                d_az = abs(spice_az - h_az)
                if d_az > 180.0:
                    d_az = 360.0 - d_az
                d_el = abs(spice_el - h_el)

                pass_az = d_az <= 0.1
                pass_el = d_el <= 0.1
                test_pass = pass_az and pass_el
                if not test_pass:
                    all_pass = False

                status = "PASS" if test_pass else "FAIL"
                print(f"  {site['name']} | {d_str} | {body_name:5s} | SPICE: ({spice_az:6.2f} deg, {spice_el:6.3f} deg) | "
                      f"Horizons: ({h_az:6.2f} deg, {h_el:6.3f} deg) | diff: ({d_az:.4f} deg, {d_el:.4f} deg) [{status}]")

                log_rows.append({
                    "site": sid,
                    "date": d_str,
                    "body": body_name,
                    "spice_az": round(spice_az, 3),
                    "spice_el": round(spice_el, 3),
                    "horizons_az": round(h_az, 3),
                    "horizons_el": round(h_el, 3),
                    "delta_az": round(d_az, 4),
                    "delta_el": round(d_el, 4),
                    "pass": test_pass
                })

    spice.kclear()

    expected_count = len(sites_to_test) * len(dates_to_test) * 2
    all_pass = all_pass and len(log_rows) == expected_count
    status = "INCOMPLETE" if errors or len(log_rows) != expected_count else ("PASS" if all_pass else "FAIL")
    report = {
        "generated_utc": datetime.now(__import__('datetime').timezone.utc).isoformat(),
        "status": status, "expected_count": expected_count, "completed_count": len(log_rows),
        "results": log_rows, "errors": errors,
    }
    report_path = project_root() / "docs" / "horizons-results.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    table = ["| Site | Date (UTC) | Body | SPICE az/el | Horizons az/el | Delta az | Delta el | Pass |",
             "|---|---|---|---|---|---|---|---|"]
    for r in log_rows:
        table.append(f"| {r['site']} | {r['date']} | {r['body']} | {r['spice_az']} / {r['spice_el']} | {r['horizons_az']} / {r['horizons_el']} | {r['delta_az']} | {r['delta_el']} | {r['pass']} |")
    section = f"## V3 – Horizons Cross-Check (Section 16)\n\n**Status**: {status} ({len(log_rows)}/{expected_count} comparisons completed).\n\nMachine-readable results and API errors: [horizons-results.json](horizons-results.json).\n\n" + "\n".join(table) + "\n\n---\n\n"
    val_path = project_root() / "docs" / "VALIDATION.md"
    content = val_path.read_text(encoding="utf-8")
    content = re.sub(r"## V3 .*?(?=## V4 )", lambda _: section, content, flags=re.DOTALL)
    val_path.write_text(content, encoding="utf-8")

    print("=" * 70)
    print(f"V3 Horizons Cross-Check overall: {'ALL PASSED' if all_pass else 'SOME FAILED'}")
    return all_pass


if __name__ == "__main__":
    raise SystemExit(0 if run_horizons_cross_check() else 1)
