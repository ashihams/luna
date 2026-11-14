# SOURCES.md — Data provenance and verification log
# Slip Planner | NASA Space Apps 2026

> Every URL, coordinate and threshold in this project must come from a published source.
> This file records what was verified, when, and what was found.

---

## D1 – LOLA 20 m South Polar DEM (80–90°S)

- **Product**: LDEM_80S_20MPP_ADJ.TIF
- **URL**: https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF
- **Size**: ~2.6 GB (cloud-optimized GeoTIFF)
- **CRS**: Polar stereographic, MOON_ME body-fixed frame (DE421)
- **Heights**: Surface heights in metres relative to a 1737.4 km (1,737,400 m) reference sphere — **VERIFIED** from PGDA product documentation
- **Height formula**: `Elevation = R_measured − 1,737,400 m`
- **Status**: URL listed on PGDA page; range reads to be tested in M0

## D2 – LOLA 40 m and 80 m South Polar DEMs

- **40 m**: LDEM_80S_40MPP_ADJ.TIF (~685 MB)
- **80 m**: LDEM_80S_80MPP_ADJ.TIF (~181 MB)
- **URL**: https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/
- **Status**: Listed

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

## D7 – Mazarico et al. 2011 Illumination Maps — **VERIFIED 2026-11-14**

- **Product page**: https://pgda.gsfc.nasa.gov/products/69
- **Citation**: Mazarico, E., et al. 2011. *Illumination conditions of the lunar polar regions using LOLA topography*. Icarus 211, 1066–1081.
- **DEM resolution**: 240 m/pixel (original paper); also 120 m (75°S–90°S) and 60 m (85°S–90°S)
- **Observer height**: Baseline at **0 m** (surface); variants at **2 m** and **10 m** in extended products
- **Modeled period**: Full ~18.6 year lunar precession/nutation cycle, hourly timesteps
- **Products**: Average Solar Illumination, Earth Visibility, Sky Visibility, PSRs
- **File formats**: .IMG (PDS3), .JP2, .TIF, .COG

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

## Site Coordinates — **Sourced 2026-11-14**

All from NASA Artemis III candidate regions (Aug 2022, updated Oct 2024) and PGDA Product 78.

| Site ID | Name | Lat (°) | Lon E (°) | Source |
|---------|------|---------|-----------|--------|
| connecting-ridge | Connecting Ridge (Site 01) | -89.46 | 136.68 | Artemis III Aug 2022; PGDA Site01 |
| connecting-ridge-ext | Connecting Ridge Extension | -88.99 | 104.47 | Artemis III Aug 2022 |
| shackleton-rim | Peak near Shackleton (Site 04) | -88.81 | 124.68 | Artemis III Aug 2022; PGDA Site04 |
| de-gerlache-rim1 | de Gerlache Rim 1 (Site 11) | -88.67 | -66.37 | Artemis III Aug 2022; PGDA Site11 |
| de-gerlache-rim2 | de Gerlache Rim 2 | -88.22 | -63.43 | Artemis III Aug 2022; Oct 2024 |
| faustini-rim-a | Faustini Rim A | -87.86 | 90.0 | Artemis III Aug 2022 |
| peak-near-shackleton | Peak near Shackleton (Site 07) | -88.81 | 124.68 | PGDA Site07 |
| haworth | Haworth | -86.75 | -23.67 | Artemis III Aug 2022; Oct 2024 |
| malapert-massif | Malapert Massif | -85.98 | -0.26 | Artemis III Aug 2022; Oct 2024 |
| leibnitz-beta | Leibnitz Beta Plateau (Site 20) | -85.43 | 31.83 | Artemis III Aug 2022; PGDA Site20 |
| nobile-rim1 | Nobile Rim 1 | -85.44 | 37.44 | Artemis III Aug 2022; Oct 2024 |
| nobile-rim2 | Nobile Rim 2 | -83.93 | 58.74 | Artemis III Aug 2022; Oct 2024 |
| malapert-site23 | Malapert (Site 23) | -86.0 | 2.0 | PGDA Site23 |
| slater-plain | Slater Plain | -88.3 | -28.0 | Artemis III Oct 2024 |
| test-pole | Test Site | -89.9 | 0.0 | Synthetic (hidden) |

**Caveat**: NASA did not publish exact polygon-corner centroids; approximate centres from USGS/LROC mapping analyses. PGDA site products provide precise coverage polygons.

---

## References

- Barker, M.K., et al. 2023. *Improved LOLA Elevation Maps for South Pole Landing Sites*. Planet. Sci. J. 4, 183.
- Mazarico, E., et al. 2011. *Illumination conditions of the lunar polar regions using LOLA topography*. Icarus 211, 1066–1081.
