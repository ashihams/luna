"""
pipeline/export.py
Static Artifact Exporter for Slip Planner.
Implements Section 13 of the specification.

Writes static assets to web/public/data/:
  - manifest.json
  - horizon_<site_id>.json
  - tracks_<site_id>.bin
  - terrain_<site_id>.bin
"""
import json
import gzip
import datetime
import numpy as np
from pathlib import Path

from pipeline.config_loader import load_config, web_data_dir


def export_horizon_json(site_id: str,
                        elev_deg: np.ndarray,
                        az_step_deg: float = 0.5,
                        obs_height_m: float = 2.0,
                        variants: dict = None,
                        info: dict = None) -> Path:
    """Export horizon_<site_id>.json."""
    wdir = web_data_dir()
    out_path = wdir / f"horizon_{site_id}.json"

    if variants is None:
        variants = {"best": [round(float(e), 3) for e in elev_deg]}
    else:
        # Ensure all arrays are rounded to 3 decimals
        variants = {k: [round(float(e), 3) for e in v] for k, v in variants.items()}

    doc = {
        "site_id": site_id,
        "az_step_deg": float(az_step_deg),
        "n": len(elev_deg),
        "obs_height_m": float(obs_height_m),
        "variants": variants,
        "levels_used": info.get("levels_used", []) if info else [],
        "nan_fraction": info.get("nan_fraction", 0.0) if info else 0.0,
        "runtime_s": info.get("runtime_s", 0.0) if info else 0.0
    }

    with open(out_path, "w") as f:
        json.dump(doc, f, indent=2)

    return out_path


def export_tracks_bin(site_id: str,
                      vis_products: dict) -> tuple[Path, list[dict]]:
    """
    Export tracks_<site_id>.bin (little endian, concatenated):
      sun_az uint16 (centi-degrees),
      sun_el int16 (centi-degrees),
      earth_az uint16 (centi-degrees),
      earth_el int16 (centi-degrees),
      earth_clearance int16 (centi-degrees),
      sun_vis_pct uint8,
      earth_vis_pct uint8,
      padding to 2-byte alignment.
    Returns:
      out_path, layout list
    """
    wdir = web_data_dir()
    out_path = wdir / f"tracks_{site_id}.bin"

    sun_az = np.clip(np.round(vis_products["sun_az"] * 100.0), 0, 65535).astype("<u2")
    sun_el = np.clip(np.round(vis_products["sun_el"] * 100.0), -32768, 32767).astype("<i2")
    earth_az = np.clip(np.round(vis_products["earth_az"] * 100.0), 0, 65535).astype("<u2")
    earth_el = np.clip(np.round(vis_products["earth_el"] * 100.0), -32768, 32767).astype("<i2")
    earth_clearance = np.clip(np.round(vis_products["earth_clearance"] * 100.0), -32768, 32767).astype("<i2")
    sun_vis_pct = np.clip(vis_products["sun_vis_pct"], 0, 100).astype(np.uint8)
    earth_vis_pct = np.clip(vis_products["earth_vis_pct"], 0, 100).astype(np.uint8)

    n_steps = len(sun_az)
    byte_offset = 0
    layout = []

    fields = [
        ("sun_az", sun_az, "uint16"),
        ("sun_el", sun_el, "int16"),
        ("earth_az", earth_az, "uint16"),
        ("earth_el", earth_el, "int16"),
        ("earth_clearance", earth_clearance, "int16"),
        ("sun_vis_pct", sun_vis_pct, "uint8"),
        ("earth_vis_pct", earth_vis_pct, "uint8"),
    ]

    bin_chunks = []
    for name, arr, dtype_str in fields:
        raw = arr.tobytes()
        layout.append({
            "name": name,
            "dtype": dtype_str,
            "byte_offset": byte_offset,
            "length": n_steps,
            "byte_length": len(raw)
        })
        byte_offset += len(raw)
        bin_chunks.append(raw)

    total_bytes = b"".join(bin_chunks)
    # Pad to 2-byte alignment if needed
    if len(total_bytes) % 2 != 0:
        total_bytes += b"\x00"

    with open(out_path, "wb") as f:
        f.write(total_bytes)

    return out_path, layout


def export_terrain_bin(site_id: str,
                       uint16_data: np.ndarray) -> Path:
    """
    Export terrain_<site_id>.bin:
      uint16 row-major, TERRAIN_N x TERRAIN_N (513 x 513).
      Row 0 = north, Col 0 = west.
    """
    wdir = web_data_dir()
    out_path = wdir / f"terrain_{site_id}.bin"

    arr = uint16_data.astype("<u2")
    with open(out_path, "wb") as f:
        f.write(arr.tobytes())

    return out_path


def export_manifest(sites_meta: list[dict],
                    tracks_layouts: dict) -> Path:
    """
    Write manifest.json conforming to Section 13.
    """
    cfg = load_config()
    # The browser must not interpret these UTC epochs in its local timezone.
    cfg = dict(cfg)
    for key in ("T0_UTC", "T1_UTC"):
        if not cfg[key].endswith("Z"):
            cfg[key] += "Z"
    wdir = web_data_dir()
    out_path = wdir / "manifest.json"

    # Copy of section 6 constants
    constants_block = {
        "R_MOON_M": cfg["R_MOON_M"],
        "R_SUN_KM": cfg["R_SUN_KM"],
        "R_EARTH_KM": cfg["R_EARTH_KM"],
        "OBS_HEIGHT_M": cfg["OBS_HEIGHT_M"],
        "AZ_STEP_DEG": cfg["AZ_STEP_DEG"],
        "T0_UTC": cfg["T0_UTC"],
        "T1_UTC": cfg["T1_UTC"],
        "STEP_MIN": cfg["STEP_MIN"],
        "N_STEPS": cfg["N_STEPS"],
        "DISC_SAMPLES": cfg["DISC_SAMPLES"],
        "TERRAIN_N": cfg["TERRAIN_N"],
        "TERRAIN_HALF_M": cfg["TERRAIN_HALF_M"],
        "ABCORR": cfg["ABCORR"]
    }

    manifest = {
        "version": "1.0.0",
        "generated_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "constants": constants_block,
        "time": {
            "t0_utc": cfg["T0_UTC"],
            "t1_utc": cfg["T1_UTC"],
            "step_min": cfg["STEP_MIN"],
            "n_steps": cfg["N_STEPS"],
            "days": cfg["N_STEPS"] / (24 * 60 / cfg["STEP_MIN"])
        },
        "sites": []
    }

    for site in sites_meta:
        sid = site["id"]
        site_entry = {
            "id": sid,
            "name": site["name"],
            "lat_deg": site["lat_deg"],
            "lon_deg_east": site["lon_deg_east"],
            "program": site.get("program", "artemis"),
            "source": site.get("source", ""),
            "obs_height_m": site.get("obs_height_m", cfg["OBS_HEIGHT_M"]),
            "ground_height_m": site.get("ground_height_m", 0.0),
            "effective_radius_km": site.get("effective_radius_km", 300.0),
            "terrain_z_min": site.get("terrain_z_min", 0.0),
            "terrain_z_max": site.get("terrain_z_max", 0.0),
            "files": {
                "horizon": f"data/horizon_{sid}.json",
                "tracks": f"data/tracks_{sid}.bin",
                "terrain": f"data/terrain_{sid}.bin"
            },
            "variants": site.get("variants", ["best", "flat"]),
            "tracks_layout": tracks_layouts.get(sid, [])
        }
        manifest["sites"].append(site_entry)

    with open(out_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"  Manifest exported to: {out_path} ({len(sites_meta)} sites)")
    return out_path
