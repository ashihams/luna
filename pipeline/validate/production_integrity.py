"""Recompute every exported track from SPICE and check cached DEM registration.

Run after pipeline.run_all; writes docs/production_integrity.json.
This checks reproducibility, not independent terrain truth.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
import rasterio
import spiceypy as spice
from pipeline.config_loader import load_config, load_sites, project_root
from pipeline.ephemeris import furnish_kernels, compute_ephemeris_for_site
from pipeline.terrain import acquire_site_levels, get_site_projected_xy
from pipeline.horizon import sample_point_height
from pipeline.raster_sampling import sample_projected
from pipeline.visibility import compute_site_visibility_products


def run():
    root = project_root()
    cfg = load_config()
    manifest = json.loads((root / 'web/public/data/manifest.json').read_text())
    sites = {s['id']: s for s in load_sites()}
    rows = []
    furnish_kernels()
    with rasterio.open(root / 'data/cache/LDEM_80S_80MPP_ADJ.TIF') as source:
        for meta in manifest['sites']:
            site = sites[meta['id']]
            assert (meta['lat_deg'], meta['lon_deg_east']) == (site['lat_deg'], site['lon_deg_east'])
            levels = acquire_site_levels(site)
            x, y = get_site_projected_xy(site['lat_deg'], site['lon_deg_east'], source.crs)
            col, row = source.index(x, y)[::-1]
            window = rasterio.windows.Window(col-2, row-2, 5, 5)
            direct = dict(data=source.read(1, window=window), transform=source.window_transform(window), nodata=source.nodata)
            z_direct = float(sample_projected(direct, x, y))
            z_cached = sample_point_height(levels['near'], site['lat_deg'], site['lon_deg_east'])
            assert abs(z_direct-z_cached) < 0.001, (site['id'], z_direct, z_cached)
            assert abs(meta['ground_height_m']-z_direct) <= 0.011
            h = json.loads((root/'web/public'/meta['files']['horizon']).read_text())
            ephem = compute_ephemeris_for_site(site, z0=z_cached, obs_height_m=meta['obs_height_m'])
            vis = compute_site_visibility_products(ephem, np.array(h['variants']['best']))
            raw = (root/'web/public'/meta['files']['tracks']).read_bytes()
            diffs = {}
            for field in meta['tracks_layout']:
                name = field['name']
                arr = np.frombuffer(raw, dtype={'uint16':'<u2','int16':'<i2','uint8':'u1'}[field['dtype']], count=field['length'], offset=field['byte_offset'])
                actual = arr.astype(float) / (1 if field['dtype'] == 'uint8' else 100)
                delta = np.abs(actual-vis[name])
                if name.endswith('_az'):
                    delta = np.minimum(delta, 360-delta)
                maximum = float(delta.max())
                assert maximum <= (0 if field['dtype'] == 'uint8' else 0.0051), (site['id'], name, maximum)
                diffs[name] = maximum
            rows.append(dict(site=site['id'], latitude=site['lat_deg'], longitude_east=site['lon_deg_east'], ground_height_m=z_direct, max_field_error=diffs, track_sha256=hashlib.sha256(raw).hexdigest()))
            print(f'PASS {site["id"]}: source/cache ground and all exported track fields', flush=True)
    spice.kclear()
    provenance = []
    for file in [root/'data/cache/LDEM_80S_80MPP_ADJ.TIF', *sorted((root/'data/cache/kernels').glob('*')), *sorted((root/'data/cache/pgda69').glob('*.TIF'))]:
        if file.is_file():
            with file.open('rb') as f:
                sha = hashlib.file_digest(f, 'sha256').hexdigest()
            provenance.append(dict(file=file.name, bytes=file.stat().st_size, sha256=sha))
    result = dict(status='PASS', scope='Internal reproducibility, not independent scientific validation', sites=rows, input_files=provenance)
    (root/'docs/production_integrity.json').write_text(json.dumps(result, indent=2))


if __name__ == '__main__':
    run()
