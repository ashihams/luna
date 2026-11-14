"""
pipeline/test_spice.py
M0 acceptance test: furnish all SPICE kernels and compute Sun/Earth position
at a test point to confirm the MOON_ME frame works.

Usage:
    python -m pipeline.test_spice
"""
import sys
import numpy as np
import spiceypy as spice

from pipeline.config_loader import load_config, kernels_dir


def furnish_kernels():
    """Load all SPICE kernels in the correct order."""
    cfg = load_config()
    kdir = kernels_dir()

    for name in cfg["SPICE_KERNELS"]:
        path = kdir / name
        if not path.exists():
            print(f"  [ERROR] Missing kernel: {path}", file=sys.stderr)
            raise FileNotFoundError(f"Kernel not found: {path}")
        spice.furnsh(str(path))
        print(f"  [loaded] {name}")


def test_spice():
    """Quick sanity check: compute Sun and Earth positions from the south pole."""
    print("Furnishing SPICE kernels...")
    furnish_kernels()

    cfg = load_config()

    # Convert T0 to ET
    t0_utc = cfg["T0_UTC"]
    et = spice.str2et(t0_utc)
    print(f"\n  T0 = {t0_utc}")
    print(f"  ET = {et:.3f} s past J2000")

    # Observer at south pole, on surface
    R = cfg["R_MOON_M"] / 1000.0  # km
    obs_height_m = cfg["OBS_HEIGHT_M"]
    lat = np.radians(-89.9)
    lon = np.radians(0.0)

    # up vector
    up = np.array([
        np.cos(lat) * np.cos(lon),
        np.cos(lat) * np.sin(lon),
        np.sin(lat)
    ])
    obs_km = (R + obs_height_m / 1000.0) * up

    # Sun position
    sun_pos, _ = spice.spkpos('SUN', et, 'MOON_ME', cfg["ABCORR"], 'MOON')
    sun_vec = sun_pos - obs_km
    sun_dist_km = np.linalg.norm(sun_vec)
    sun_dist_au = sun_dist_km / 149597870.7

    # Earth position
    earth_pos, _ = spice.spkpos('EARTH', et, 'MOON_ME', cfg["ABCORR"], 'MOON')
    earth_vec = earth_pos - obs_km
    earth_dist_km = np.linalg.norm(earth_vec)

    # Local frame
    east = np.array([-np.sin(lon), np.cos(lon), 0.0])
    north = np.array([
        -np.sin(lat) * np.cos(lon),
        -np.sin(lat) * np.sin(lon),
        np.cos(lat)
    ])

    # Sun az/el
    sun_e = np.dot(sun_vec, east)
    sun_n = np.dot(sun_vec, north)
    sun_u = np.dot(sun_vec, up)
    sun_az = np.degrees(np.arctan2(sun_e, sun_n)) % 360
    sun_el = np.degrees(np.arctan2(sun_u, np.hypot(sun_e, sun_n)))

    # Earth az/el
    earth_e = np.dot(earth_vec, east)
    earth_n = np.dot(earth_vec, north)
    earth_u = np.dot(earth_vec, up)
    earth_az = np.degrees(np.arctan2(earth_e, earth_n)) % 360
    earth_el = np.degrees(np.arctan2(earth_u, np.hypot(earth_e, earth_n)))

    print(f"\n  Results at {t0_utc} from lat={np.degrees(lat):.1f} deg, lon={np.degrees(lon):.1f} deg:")
    print(f"  Sun:   az={sun_az:.2f} deg  el={sun_el:.3f} deg  dist={sun_dist_au:.4f} AU")
    print(f"  Earth: az={earth_az:.2f} deg  el={earth_el:.3f} deg  dist={earth_dist_km:.0f} km")

    # Sanity checks
    ok = True
    colatitude = 90 - abs(np.degrees(lat))  # ~0.1 deg

    if not (0.98 < sun_dist_au < 1.02):
        print(f"  [FAIL] Sun distance {sun_dist_au:.4f} AU not near 1 AU")
        ok = False
    else:
        print(f"  [OK] Sun distance is near 1 AU (~{sun_dist_au:.4f} AU)")

    if not (350000 < earth_dist_km < 420000):
        print(f"  [FAIL] Earth distance {earth_dist_km:.0f} km not near 384400 km")
        ok = False
    else:
        print(f"  [OK] Earth distance is near 384400 km (~{earth_dist_km:.0f} km)")

    if abs(sun_el) > 1.6 + colatitude + 1.0:  # loose bound
        print(f"  [WARN] Sun elevation {sun_el:.3f} deg seems high for near-pole site")
    else:
        print(f"  [OK] Sun elevation within expected bounds")

    if abs(earth_el) > 8.0 + colatitude + 1.0:
        print(f"  [WARN] Earth elevation {earth_el:.3f} deg seems high for near-pole site")
    else:
        print(f"  [OK] Earth elevation within expected bounds")

    spice.kclear()

    if ok:
        print("\n  [PASS] SPICE test PASSED")
    else:
        print("\n  [FAIL] SPICE test FAILED")
        sys.exit(1)

    return ok


if __name__ == "__main__":
    test_spice()
