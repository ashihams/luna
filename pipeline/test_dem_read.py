"""
pipeline/test_dem_read.py
M0 acceptance test: read a small window from the 80 m LOLA DEM via HTTP range reads,
confirm CRS, and plot the result. Falls back to local cache if range reads fail.

Usage:
    python -m pipeline.test_dem_read
"""
import sys
import numpy as np
from pathlib import Path

from pipeline.config_loader import load_config, cache_dir


def test_dem_read():
    """Read a small window around the south pole from the 80 m DEM."""
    import rasterio
    from rasterio.windows import from_bounds
    from pyproj import Transformer, CRS

    cfg = load_config()

    # Use the 80 m DEM (smallest, ~181 MB) for the test
    url = cfg["DEM_80M_URL"]
    local_path = cache_dir() / "LDEM_80S_80MPP_ADJ.TIF"

    print(f"Testing DEM read...")
    print(f"  URL: {url}")

    # Try HTTP range read first, fall back to local
    src_path = url
    try:
        src = rasterio.open(url)
        print(f"  HTTP range read: OK")
    except Exception as e:
        print(f"  HTTP range read failed: {e}")
        if local_path.exists():
            src_path = str(local_path)
            print(f"  Falling back to local cache: {src_path}")
            src = rasterio.open(src_path)
        else:
            print(f"  No local cache. Download the 80 m DEM to {local_path} first.")
            print(f"  STOP: Cannot proceed without DEM data.")
            sys.exit(1)

    with src:
        # Report CRS
        crs = src.crs
        print(f"\n  CRS: {crs}")
        print(f"  CRS WKT (first 200 chars): {crs.to_wkt()[:200]}...")
        print(f"  Bounds: {src.bounds}")
        print(f"  Shape: {src.shape}")
        print(f"  Resolution: {src.res}")
        print(f"  NoData: {src.nodata}")
        print(f"  Dtype: {src.dtypes}")

        # Convert a test point (south pole area) to raster coords
        # Test site: lat -89.9, lon 0.0
        moon_lonlat = CRS.from_proj4('+proj=longlat +R=1737400 +no_defs')
        transformer = Transformer.from_crs(moon_lonlat, crs, always_xy=True)

        test_lon, test_lat = 0.0, -89.9
        x, y = transformer.transform(test_lon, test_lat)
        print(f"\n  Test point: lat={test_lat}, lon={test_lon}")
        print(f"  Projected x={x:.1f} m, y={y:.1f} m")

        # Read a 20 km × 20 km window around the test point
        half = 10000  # 10 km
        window = from_bounds(x - half, y - half, x + half, y + half, src.transform)
        print(f"  Window: {window}")

        data = src.read(1, window=window)
        print(f"\n  Read data shape: {data.shape}")
        print(f"  Min: {np.nanmin(data):.1f} m")
        print(f"  Max: {np.nanmax(data):.1f} m")
        print(f"  Mean: {np.nanmean(data):.1f} m")
        print(f"  NaN fraction: {np.isnan(data.astype(float)).mean():.4f}")

        # Save as .npy for verification
        out_path = cache_dir() / "test_dem_window.npy"
        np.save(str(out_path), data)
        print(f"\n  Saved to {out_path}")

        # Generate a quick plot
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt

            fig, ax = plt.subplots(1, 1, figsize=(8, 8))
            im = ax.imshow(data, cmap='terrain', origin='upper')
            ax.set_title(f'LOLA 80m DEM - 20 km window at ({test_lat} deg, {test_lon} deg)')
            ax.set_xlabel('East (pixels)')
            ax.set_ylabel('North (pixels)')
            plt.colorbar(im, ax=ax, label='Height (m) above 1737.4 km sphere')
            plot_path = cache_dir() / "test_dem_window.png"
            fig.savefig(str(plot_path), dpi=150, bbox_inches='tight')
            plt.close()
            print(f"  Plot saved to {plot_path}")
        except Exception as e:
            print(f"  Plot failed (non-critical): {e}")

    print("\n  [PASS] DEM read test PASSED")
    return True


if __name__ == "__main__":
    test_dem_read()
