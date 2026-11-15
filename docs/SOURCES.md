# SOURCES.md — Data provenance and verification log
# Slip Planner | NASA Space Apps 2026

> Data products have published sources. Coordinates below are sourced study centers or explicitly labeled project choices; mission thresholds are editable assumptions.
> This file records what was verified, when, and what was found.

---

## D1 – LOLA 20 m South Polar DEM — research use pending valid reacquisition

- **Product**: LDEM_80S_20MPP_ADJ.TIF
- **URL**: https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF
- **Size**: HTTP transfer reported 2,696,082,051 bytes. The full download did not complete; no full-file checksum is claimed.
- **CRS**: Polar Stereographic (`MOON_ME`), Central Meridian 0.0°, Latitude of True Scale -90.0°, R = 1,737,400 m
- **Resolution**: 20 m/pixel; the readable source header reports 30,400 × 30,400 pixels, projected bounds ±304,000 m (the previous 52,400-pixel claim was wrong).
- **Heights**: Surface heights in metres relative to a 1737.4 km (1,737,400 m) reference sphere
- **Height formula**: `Elevation = R_measured − 1,737,400 m`
- **Status**: Old cached near windows were misplaced for 11/13 points. The old study is withdrawn. A full source download timed out; the partial file is not used. Header dimensions were read from the partial source; terrain pixels from that incomplete file are never used. Corrected readers use integer windows, pixel-center interpolation, and coordinate-aware cache identities.

## D2 – LOLA 40 m and 80 m South Polar DEMs

- **40 m**: LDEM_80S_40MPP_ADJ.TIF (~685 MB)
- **80 m**: LDEM_80S_80MPP_ADJ.TIF (~181 MB)
- **URL**: https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/
- **Status**: 80 m is the production source; its local file and all kernels/reference rasters are hashed in [production_integrity.json](production_integrity.json).

## D3 – LOLA 20 m Slope Map

- **Product**: LDSM_80S_20MPP_ADJ.TIF
- **URL**: Same folder as D1
- **Status**: Listed

## D4 – 5 m Site DEMs — **VERIFIED 2026-11-14**

- **Source**: PGDA Product 78 (https://pgda.gsfc.nasa.gov/products/78)
- **imbrium.mit.edu**: Legacy mirror; PGDA is authoritative
- **File naming**: `SiteXX_final_adj_5mpp_surf.tif`
- **Available sites with 5m DEMs**:

| File | Feature |
|------|---------|
| Site01_final_adj_5mpp_surf.tif | Connecting Ridge |
| Site04_final_adj_5mpp_surf.tif | Shackleton Rim |
| Site07_final_adj_5mpp_surf.tif | Peak near Shackleton |
| Site11_final_adj_5mpp_surf.tif | de Gerlache Rim |
| Site20_final_adj_5mpp_surf.tif | Leibnitz Beta Plateau |
| Site23_final_adj_5mpp_surf.tif | Malapert Massif |

- **Ancillary files per site** (same prefix):
  - `_ldec.tif` — LOLA spot count map
  - `_slp.tif` — Slope (degrees)
  - `_toterr.tif` — Total Z uncertainty (RMS, meters)
  - `clone_[site]_[001-100].tif` — 100 statistical ensemble realizations

## D5 – SPICE Kernels — **VERIFIED 2026-11-14**

| Kernel | URL | Notes |
|--------|-----|-------|
| naif0012.tls | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls | Leap seconds |
| pck00011.tpc | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc | **REQUIRED** — provides BODY301_RADII (Moon shape). Not in original spec; added after verification. |
| de421.bsp | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp | **Moved** to `a_old_versions/` subdirectory; original path would 404 |
| moon_pa_de421_1900-2050.bpc | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.bpc | Binary PCK for lunar orientation |
| moon_080317.tf | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf | Defines MOON_ME and MOON_PA frames |

**Load order**: LSK → Text PCK → SPK → Binary PCK → FK

## D6 – JPL Horizons API — **VERIFIED 2026-11-14**

- **URL**: https://ssd.jpl.nasa.gov/api/horizons.api
- **Target codes**: Sun = `'10'`, Earth = `'399'`
- **Observer**: `CENTER='coord@301'`, `COORD_TYPE='GEODETIC'`, `SITE_COORD='lon,lat,alt_km'`
- **Ephemeris type**: `EPHEM_TYPE='OBSERVER'`
- **Quantities**: `'4'` = Apparent Azimuth & Elevation
- **Note**: Two separate requests needed (one per target body)

## D7 – Mazarico et al. 2011 Illumination & Earth Visibility Maps (PGDA Product 69) — **VERIFIED 2026-11-15**

- **Product page**: https://pgda.gsfc.nasa.gov/products/69
- **Citation**: Mazarico, E., et al. 2011. *Illumination conditions of the lunar polar regions using LOLA topography*. Icarus 211, 1066–1081.
- **Downloaded Files & SHA-256 Checksums**:
  - Solar Illumination: `AVGVISIB_65S_240M_201608.TIF` (60,394,652 bytes)
    - URL: https://pgda.gsfc.nasa.gov/data/MoonIllumination/AVGVISIB_65S_240M_201608.TIF
    - SHA-256: `822fbf4618852311d4f494012e74e9cfb0147807a54ecb3302293c4266d2068d`
    - PDS Label: `AVGVISIB_65S_240M_201608.LBL`
  - Earth Visibility: `AVGVISIB_65S_240M_201608_EARTH.TIF` (22,963,503 bytes)
    - URL: https://pgda.gsfc.nasa.gov/data/MoonIllumination/AVGVISIB_65S_240M_201608_EARTH.TIF
    - SHA-256: `8a6d5fa8079c83e2159adf58ce33cd1cd9c09be6c19023bf5b6cc304f51568b7`
    - PDS Label: `AVGVISIB_65S_240M_201608_EARTH.LBL`
- **Spatial Resolution & Grid**: 240 m/pixel (126.347 pix/deg true at the pole), 6420 × 6420 grid covering 65°S to 90°S.
- **Projection**: Polar Stereographic, spherical with Moon radius $R = 1737.4\text{ km}$, center ($-90^\circ, 0^\circ$), pixel offset $(3209.5, 3209.5)$, coordinate frame `MEAN EARTH/POLAR AXIS OF DE421` (`MOON_ME`).
- **Observer Height**: Not documented in the Product 69 page, linked README, or the downloaded Sun/Earth PDS labels. The comparator's 0 m setting is a model assumption, not an established match.
- **Time Span and Cadence**: Approximately 18.6 years at hourly cadence. The model uses 163,165 steps; exact reference epoch equivalence has not been independently established.
- **Solar Illumination Criterion**: Any fraction of the finite solar disc visible, per the PDS label. Checking the upper limb only at the center azimuth is not equivalent on a varying skyline; see ACCURACY_REPORT.md.
- **Earth Visibility Criterion**: Any fraction of the finite Earth disc visible, per the page and PDS label. The same center-azimuth shortcut can miss visibility beside a ridge.
- **Data Scaling**: Digital numbers stored as 16-bit integers (`LSB_INTEGER`), scaled to average visibility by multiplying by `0.00004` (DN 0..25000 corresponds to 0.0 to 1.0, or 0% to 100%).

## D8 – LROC WAC South Pole Movie — **VERIFIED 2026-11-14**

- **URL**: https://data.lroc.im-ldi.com/view_rdr?product=WAC_POLE_MOVIE_SOUTH
- **Note**: URL uses query parameter format, not path segment
- **Specs**: 100 m/pixel, 80°S–90°S, Polar Stereographic
- **Status**: Stretch validation

## D9 – LROC WAC South Summer Mosaic — **VERIFIED 2026-11-14**

- **URL**: https://data.lroc.im-ldi.com/view_rdr?product=WAC_ROI_SOUTH_SUMMER
- **Specs**: September–October 2010, 643 nm band, 100 m/px
- **Status**: Stretch texture

---

## Site coordinates — corrected 2026-11-15

Coordinates use signed east longitude (negative = west). Most are mosaic centers from [Collins et al., LPSC 2024, Table 1](https://www.hou.usra.edu/meetings/lpsc2024/pdf/1775.pdf), not official touchdown coordinates. The table's latitude/longitude headings are transposed: the numeric column containing values near −90 is latitude. The PGDA footprint cross-check independently confirms the west-longitude Connecting Ridge location.

The [PGDA README](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README) identifies Site01 as Connecting ridge, Site04 as Shackleton rim, and Site07 as Peak near Shackleton; it does not specify a unique landing coordinate. The Site01 raster spans projected X −19,000…−3,000 m and Y −20,000…−4,000 m. Both former positive-longitude Connecting Ridge coordinates lie outside it. The corrected −89.46°, −136.68° point lies inside it. The point −88.81°, 124.68° lies inside Site07, outside Site04. [Header evidence](site-coordinate-check.json).

| ID | Study point | Latitude | East longitude | Coordinate basis |
|---|---|---:|---:|---|
| connecting-ridge | Connecting Ridge (Site 01) | -89.46 | -136.68 | Collins Table 1 |
| connecting-ridge-ext | Connecting Ridge Extension | -88.99 | -104.47 | Collins Table 1 |
| shackleton-rim | Peak near Shackleton (Site 07) | -88.81 | 124.68 | Collins Table 1 |
| de-gerlache-rim1 | de Gerlache Rim 1 (Site 11) | -88.67 | -66.37 | Collins Table 1 |
| de-gerlache-rim2 | de Gerlache Rim 2 | -88.22 | -63.43 | Collins Table 1 |
| faustini-rim-a | Faustini Rim A | -87.86 | 90.0 | Collins Table 1 |
| haworth | Haworth | -86.75 | -23.67 | Collins Table 1 |
| malapert-massif | Malapert Massif | -85.98 | -0.26 | Collins Table 1 |
| leibnitz-beta | Leibnitz Beta Plateau (Site 20) | -85.43 | 31.83 | Collins Table 1 |
| nobile-rim1 | Nobile Rim 1 | -85.44 | 37.44 | Collins Table 1 |
| nobile-rim2 | Nobile Rim 2 | -83.95 | 58.74 | Collins Table 1 |
| malapert-site23 | Malapert Massif (Site 23) | -86.0 | 2.0 | Project approximation |
| slater-plain | Slater Plain | -88.3 | -28.0 | Project approximation |

A raster footprint establishes coverage, not membership in an approved landing polygon. Slater Plain and the alternate Malapert point remain explicit project approximations. The point list mixes historical regions and must not be presented as the current official Artemis III list.

---

## References

- Barker, M.K., et al. 2021. *Improved LOLA Elevation Maps for South Pole Landing Sites: Error Estimates and Their Impact on Illumination Conditions*. Planetary and Space Science 203, 105119. DOI: 10.1016/j.pss.2020.105119 (as cited by the PGDA README).
- Mazarico, E., et al. 2011. *Illumination conditions of the lunar polar regions using LOLA topography*. Icarus 211, 1066–1081.

## Accuracy diagnostics: Product 69 input contract (2026-11-15)

This section distinguishes source statements from project assumptions. Its scope is the saved Product 69 page, its linked illumination README, the two PDS labels, the current polar DEM archive index, the candidate DEM label, and GDAL's geotransform documentation. Full byte records follow and are also in `research/accuracy/provenance.json`.

| Item | What the inspected sources establish |
|---|---|
| Source terrain name | Both visibility labels name **LDEM_65S_240M**. |
| Source terrain resolution | **240 m/pixel**, true at the pole, in the visibility labels. |
| Exact source DEM revision | **Not documented.** The visibility labels' **V1.05** is their product version; it does not establish the source DEM version. |
| Observer height | **Not documented** in these sources. **0 m** is the requested diagnostic setting, not a confirmed reference-map input. |
| Sun criterion | The Sun label defines the fraction of timesteps with **any fraction of the solar disc** visible. It is not a time average of illuminated disc area. |
| Earth criterion | The Earth label and Product 69 page use **any fraction of the Earth disc** visible. This is not Earth-center visibility or DSN station availability. |
| Time span and cadence | The page describes approximately **18.6 years**, sampled **hourly**. Exact simulation start, end, endpoint inclusion, and time scale are **not documented** in the inspected sources. |
| Label dates | Both visibility labels give `START_TIME=2009-07-13T17:33:17.246` and `STOP_TIME=2013-07-18T14:12:13`. They do not state that these are the illumination simulation endpoints, and this interval is not the stated full cycle. Using START_TIME as the long-run simulation epoch is unsubstantiated. |
| Ephemeris | The labels specify the **mean Earth/polar axis of DE421** coordinate frame. Exact Sun/Earth ephemeris kernels, aberration convention, and adopted apparent body radii are **not documented**. A frame identifier alone does not establish these inputs. |
| Pixel registration | Labels say **pixel registration**. The GeoTIFFs have `AREA_OR_POINT=Area`. GDAL's affine origin is the upper-left corner; a center is `(column+0.5,row+0.5)`. Raster metadata and the diagnostic test establish the file-coordinate interpretation, not a hidden simulation convention. |
| Scaling | Both labels and GeoTIFF metadata give visibility fraction = DN × **0.00004**, offset **0**. Multiply that fraction by 100 for percent. Nodata must be excluded before scaling. |
| Ray spacing / horizon range / interpolation / disc integration method | **Not documented** in the inspected product page, README and labels. No equivalence to the current engine is assumed. |

The inspected current `POLAR/IMG/` index does not list `LDEM_65S_240M`. It does list `LDEM_60S_240M.IMG`; its downloaded label describes **V2.0**, **240 m/pixel**, created **2017-06-15**, with scale **0.5** and offset **1737400 m**. The scaled value is radius; subtract the reference radius to obtain the relative heights expected by the horizon engine. This is a documented same-resolution candidate with different extent and revision, not proof of the terrain used for the visibility maps. Only its label was downloaded: terrain acquisition and like-for-like modeling were stopped after the comparator defect was demonstrated. No claim is made that the original DEM is unavailable everywhere.

For the frozen-horizon defect reproduction only, the existing repository's configuration, kernel files, saved 80 m horizon, and historical time grid are held constant. Their numeric settings are model inputs, not newly established published-map reference values. See `research/accuracy/criterion_diagnostic.json` for their hashes and scope.

### Diagnostic source byte records

Access/read date for every entry: **2026-11-15**. Previously downloaded rasters and kernels were rehashed locally, not redownloaded. The saved pages and labels were downloaded for this investigation.

| Local file | URL | SHA-256 |
|---|---|---|
| `research/accuracy/sources/product69.html` | https://pgda.gsfc.nasa.gov/products/69 | `aca046555f29da9fcbe926c0b90450ce69e78a44cc406bc2a60d9a010eb3fe42` |
| `research/accuracy/sources/README_ILLUMINATION_2016.TXT` | https://imbrium.mit.edu/EXTRAS/ILLUMINATION/README_ILLUMINATION_2016.TXT | `f806f9c7fb410b17dd75c2f44f91755b5ca890ac047004a1e8fbb819c24b9ec6` |
| `research/accuracy/sources/AVGVISIB_65S_240M_201608.LBL` | https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/AVGVISIB_65S_240M_201608.LBL | `10b0d6d881713d6bd4d61a30cc64da6d53934e2c9a8cc702b36a5cd758751b03` |
| `research/accuracy/sources/AVGVISIB_65S_240M_201608_EARTH.LBL` | https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/AVGVISIB_65S_240M_201608_EARTH.LBL | `eb99d4e4a0bd3508e95dc87e0f65663452db0c20dcadaf272ebf27c7ce418913` |
| `research/accuracy/sources/polar-img-index.html` | https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/ | `37a6cbec0a4df082239e180c89758e32338cb2666ad5940d17cbbcf4eb7e07f2` |
| `research/accuracy/sources/LDEM_60S_240M.LBL` | https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/LDEM_60S_240M.LBL | `dde15a7f2a64ff8d744913c31d606ef572a992c74a44a72356ff91ca9cf4bfcb` |
| `research/accuracy/sources/gdal-geotransforms.html` | https://gdal.org/en/stable/tutorials/geotransforms_tut.html | `a34a6497b82d7c02cfea80d8bf5db806b7c389207249ed234fcbc386f2e774d9` |
| `data/cache/pgda69/AVGVISIB_65S_240M_201608.TIF` | https://pgda.gsfc.nasa.gov/data/MoonIllumination/AVGVISIB_65S_240M_201608.TIF | `822fbf4618852311d4f494012e74e9cfb0147807a54ecb3302293c4266d2068d` |
| `data/cache/pgda69/AVGVISIB_65S_240M_201608_EARTH.TIF` | https://pgda.gsfc.nasa.gov/data/MoonIllumination/AVGVISIB_65S_240M_201608_EARTH.TIF | `8a6d5fa8079c83e2159adf58ce33cd1cd9c09be6c19023bf5b6cc304f51568b7` |
| `data/cache/kernels/naif0012.tls` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls | `678e32bdb5a744117a467cd9601cd6b373f0e9bc9bbde1371d5eee39600a039b` |
| `data/cache/kernels/pck00011.tpc` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc | `3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1` |
| `data/cache/kernels/de421.bsp` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp | `08b20db2ae22488650641c5a9033e5bfda4b1c4b440cfeaf20f621cfa18ecdb3` |
| `data/cache/kernels/moon_pa_de421_1900-2050.bpc` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.bpc | `656f90616403d75a75f0cd6c8830fc5b44f8cb4facb5ccb8915e752b397520cf` |
| `data/cache/kernels/moon_080317.tf` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf | `78732477b96f9863e7b0d65bcee3c22b8707ca5ed0db56d1173319cb2e8c7993` |
