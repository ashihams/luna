"""
pipeline/config_loader.py
Loads config/config.yaml and config/sites.json relative to the project root.
"""
import os
import yaml
import json
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent

def project_root() -> Path:
    return _PROJECT_ROOT

def load_config() -> dict:
    """Load config/config.yaml and return as dict."""
    config_path = _PROJECT_ROOT / "config" / "config.yaml"
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def load_sites() -> list[dict]:
    """Load config/sites.json and return list of site dicts."""
    sites_path = _PROJECT_ROOT / "config" / "sites.json"
    with open(sites_path, "r") as f:
        return json.load(f)

def cache_dir() -> Path:
    """Return data/cache directory, creating it if needed."""
    d = _PROJECT_ROOT / "data" / "cache"
    d.mkdir(parents=True, exist_ok=True)
    return d

def kernels_dir() -> Path:
    """Return data/cache/kernels directory."""
    d = cache_dir() / "kernels"
    d.mkdir(parents=True, exist_ok=True)
    return d

def web_data_dir() -> Path:
    """Return web/public/data directory."""
    d = _PROJECT_ROOT / "web" / "public" / "data"
    d.mkdir(parents=True, exist_ok=True)
    return d
