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
- **Observer Height**: Baseline **0 m** (surface level on LDEM_65S_240M).
- **Time Span and Cadence**: Approximately 18.6 years at hourly cadence. The model uses 163,165 steps; exact reference epoch equivalence has not been independently established.
- **Solar Illumination Criterion**: Any fraction of the finite solar disc visible above the horizon (solar disc upper limb elevation > horizon).
- **Earth Visibility Criterion**: Any fraction of the finite Earth disc visible above the horizon (Earth disc upper limb elevation > horizon).
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
