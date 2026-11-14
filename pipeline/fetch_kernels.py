"""
pipeline/fetch_kernels.py
Downloads SPICE kernels listed in config.yaml to data/cache/kernels/.
Skips files that already exist and have nonzero size.
"""
import urllib.request
import sys
from pathlib import Path
from pipeline.config_loader import load_config, kernels_dir


def fetch_kernels(verbose: bool = True) -> list[Path]:
    """Download all SPICE kernels. Returns list of local paths."""
    cfg = load_config()
    urls = cfg["SPICE_KERNEL_URLS"]
    dest = kernels_dir()
    paths = []

    for name, url in urls.items():
        local = dest / name
        if local.exists() and local.stat().st_size > 0:
            if verbose:
                print(f"  [skip] {name} already cached ({local.stat().st_size:,} bytes)")
            paths.append(local)
            continue

        if verbose:
            print(f"  [download] {name} from {url} ...")
        try:
            urllib.request.urlretrieve(url, str(local))
            size = local.stat().st_size
            if verbose:
                print(f"    -> {size:,} bytes")
            paths.append(local)
        except Exception as e:
            print(f"  [ERROR] Failed to download {name}: {e}", file=sys.stderr)
            raise

    return paths


def verify_kernels(verbose: bool = True) -> bool:
    """Check that all required kernels exist and have nonzero size."""
    cfg = load_config()
    dest = kernels_dir()
    all_ok = True

    for name in cfg["SPICE_KERNELS"]:
        local = dest / name
        if local.exists() and local.stat().st_size > 0:
            if verbose:
                print(f"  [ok] {name}: {local.stat().st_size:,} bytes")
        else:
            print(f"  [MISSING] {name}")
            all_ok = False

    return all_ok


if __name__ == "__main__":
    print("Fetching SPICE kernels...")
    fetch_kernels()
    print("\nVerifying...")
    ok = verify_kernels()
    if ok:
        print("\nAll kernels present.")
    else:
        print("\nSome kernels missing!", file=sys.stderr)
        sys.exit(1)
