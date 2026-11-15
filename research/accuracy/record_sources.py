"""Record exact bytes read; never interpret a downloaded label as a DEM."""
import json
from pathlib import Path
import rasterio
from pipeline.config_loader import load_config
from research.accuracy.run_criterion_diagnostic import ROOT, sha


def main():
    directory = ROOT / 'research/accuracy/sources'
    urls = {
        'product69.html': 'https://pgda.gsfc.nasa.gov/products/69',
        'README_ILLUMINATION_2016.TXT': 'https://imbrium.mit.edu/EXTRAS/ILLUMINATION/README_ILLUMINATION_2016.TXT',
        'AVGVISIB_65S_240M_201608.LBL': 'https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/AVGVISIB_65S_240M_201608.LBL',
        'AVGVISIB_65S_240M_201608_EARTH.LBL': 'https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/AVGVISIB_65S_240M_201608_EARTH.LBL',
        'polar-img-index.html': 'https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/',
        'LDEM_60S_240M.LBL': 'https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/LDEM_60S_240M.LBL',
        'gdal-geotransforms.html': 'https://gdal.org/en/stable/tutorials/geotransforms_tut.html',
    }
    sources = []
    for name, url in urls.items():
        path = directory / name
        sources.append(dict(path=path.relative_to(ROOT).as_posix(), url=url,
                            accessed='2026-11-15', sha256=sha(path), bytes=path.stat().st_size,
                            access='Downloaded source'))
    raster_metadata = {}
    for suffix in ['', '_EARTH']:
        path = ROOT / f'data/cache/pgda69/AVGVISIB_65S_240M_201608{suffix}.TIF'
        sources.append(dict(path=path.relative_to(ROOT).as_posix(),
                            url='https://pgda.gsfc.nasa.gov/data/MoonIllumination/' + path.name,
                            accessed='2026-11-15', sha256=sha(path), bytes=path.stat().st_size,
                            access='Read previously downloaded file; no new download'))
        with rasterio.open(path) as src:
            raster_metadata[path.name] = dict(crs_wkt=src.crs.to_wkt(),
                geotransform=list(src.transform.to_gdal()), shape=list(src.shape),
                scales=list(src.scales), offsets=list(src.offsets), nodata=src.nodata,
                tags=src.tags(), first_pixel_center=list(src.xy(0, 0)),
                first_pixel_corner=list(src.transform * (0, 0)))
    for name, url in load_config()['SPICE_KERNEL_URLS'].items():
        path = ROOT / 'data/cache/kernels' / name
        sources.append(dict(path=path.relative_to(ROOT).as_posix(), url=url,
                            accessed='2026-11-15', sha256=sha(path), bytes=path.stat().st_size,
                            access='Read previously downloaded kernel; used only for frozen-horizon reproduction'))
    out = dict(sources=sources, published_raster_metadata=raster_metadata)
    (ROOT / 'research/accuracy/provenance.json').write_text(json.dumps(out, indent=2) + '\n')
    rows = ['\n### Diagnostic source byte records\n',
            'Access/read date for every entry: **2026-11-15**. Previously downloaded rasters and kernels were rehashed locally, not redownloaded. The saved pages and labels were downloaded for this investigation.\n',
            '| Local file | URL | SHA-256 |', '|---|---|---|']
    for s in sources:
        rows.append(f"| `{s['path']}` | {s['url']} | `{s['sha256']}` |")
    path = ROOT / 'docs/SOURCES.md'
    text = path.read_text(encoding='utf-8')
    marker = '\n### Diagnostic source byte records\n'
    if marker in text:
        text = text.split(marker)[0]
    path.write_text(text.rstrip() + '\n' + '\n'.join(rows) + '\n', encoding='utf-8')
    print(json.dumps(raster_metadata, indent=2))


if __name__ == '__main__':
    main()
