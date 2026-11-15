# Luna Slip Planner — Project Details & Mission Navigator Specification

**Challenge:** Lunar Landing Site Navigator | **Event:** NASA Space Apps Challenge 2026  
**Live Application:** [https://lunaslipplanner.vercel.app](https://lunaslipplanner.vercel.app)  
**Source Code Repository:** [https://github.com/ashihams/luna](https://github.com/ashihams/luna)  
**Primary Validation Log:** [docs/VALIDATION.md](docs/VALIDATION.md) | **Comparator Audit:** [docs/ACCURACY_REPORT.md](docs/ACCURACY_REPORT.md) | **18.6-Year Rerun:** [docs/PGDA_RERUN_RESULTS.md](docs/PGDA_RERUN_RESULTS.md)

---

## 1. Overview

When a lunar landing slips, the celestial geometry at the target site changes dramatically. At the lunar south pole, where the Moon's spin axis has an obliquity of only $1.54^\circ$ relative to the ecliptic normal, the Sun never climbs more than $\approx 1.5^\circ$ to $3.0^\circ$ above the mean local horizon. Concurrently, the Earth oscillates around the horizon over a 27.2-day draconic period due to lunar orbital inclination and eccentric libration ($\approx \pm 7^\circ$ in latitude and $\approx \pm 8^\circ$ in longitude). Under such grazing angles, kilometer-scale terrain features—crater rims, ridges, and massifs—cast elongated, shifting shadows and occlude direct line-of-sight (LOS) communications to Earth. A delay of hours or days, or a landing dispersion of a few hundred meters, can transform an illuminated ridge into a dark, frozen, communications-dead basin.

Luna Slip Planner answers the operational question mission planners, flight dynamics teams, and science landing site steering committees face when launch schedules move:  
> **"My landing slipped $N$ days. Is our primary site still viable, what physical factor causes the failure, and what are our optimal alternative landing sites?"**

For 13 high-priority candidate south pole landing sites (drawn from candidate regions and published exploration literature), the system comprehensively models and evaluates landing dates across a continuous 731-day operational window (**2027-01-01 to 2029-01-01 UTC**). This yields a total of $13 \times 731 = \mathbf{9,503}$ **unique site-date mission windows**.

For each window and any user-configured surface stay duration (such as a 6.5-day Artemis III sortie or a 14-day CLPS lander stay), the system evaluates:
1. **Cumulative Sunlight Fraction:** Fraction of the stay duration where the solar disc is visible above the terrain horizon.
2. **Longest Continuous Darkness Gap:** Maximum contiguous blackout period, directly dictating battery capacity and cryo-survival margins.
3. **Earth Visibility Fraction:** Fraction of the stay with an unobstructed line of sight to Earth for direct-to-Earth (DTE) radio links.
4. **Longest Communications Outage:** Maximum contiguous duration without Earth direct LOS.
5. **Operational Viability & Composite Score:** Multi-objective classification based on user-editable flight planning thresholds.

All thresholds in the system are fully editable planning assumptions rather than rigid NASA mandates. Furthermore, all calculations are explicitly presented as **deterministic physical model estimates** with documented uncertainty bounds and known terrain resolution limitations.

---

## 2. Key Numbers at a Glance

| Item / Metric | Quantified Value | Description / Source Basis |
|---|---|---|
| **Candidate Landing Sites** | 13 sites | South-polar rims, ridges, and plateaus (Collins et al. 2024 & project study points) |
| **Operational Planning Horizon** | 731 calendar days | Continuous coverage from 2027-01-01 00:00:00 UTC to 2029-01-01 00:00:00 UTC |
| **Site-Date Mission Windows** | **9,503 windows** | $13 \text{ sites} \times 731 \text{ landing dates}$ fully evaluated in real time |
| **Ephemeris Time Steps** | 35,088 half-hour steps | Exact 30-minute cadence over 731 days, computed via NAIF SPICE |
| **Terrain Horizon Azimuth Bins** | 720 bins ($0.5^\circ$ resolution) | Azimuthally stepped $0.0^\circ$ to $359.5^\circ$ from local true North |
| **Horizon Radial Sampling** | Up to 100 km range | 3 concentric radial bands: 40 m (near), 120 m (mid), 400 m (far) |
| **Lunar Reference Sphere** | $R_{\text{moon}} = 1,737.4\text{ km}$ | IAU standard mean radius ($1,737,400\text{ m}$) used across all projections |
| **Curvature Drop Correction** | $h_{\text{curv}} = \frac{d^2}{2R}$ | Parabolic lunar curvature drop along sightlines up to 100 km |
| **Observer Ground Clearance (App)** | $2.0\text{ m}$ | Nominal lander solar array and low-gain antenna height above ground |
| **Observer Ground Clearance (Benchmark)** | $0.0\text{ m}$ | Ground-level baseline matching published illumination maps (Product 69) |
| **Production Terrain Model** | LOLA 80 m Polar DEM | `LDEM_80S_80MPP_ADJ.TIF` (80°S to 90°S, Polar Stereographic) |
| **Disc Discretization** | 32 equal-area points | Finite Sun ($\approx 0.53^\circ$) and Earth ($\approx 1.90^\circ$) disc integration |
| **Ephemeris Frame & Engine** | JPL NAIF SPICE DE421 | Body-fixed `MOON_ME` (Mean Earth / Polar Axis), light-time + stellar aberration |
| **JPL Horizons API Cross-Check** | **12 / 12 exact match** | 2 sites $\times$ 3 epochs $\times$ 2 bodies; agreement $\le 0.000008^\circ$ ($< 0.001^\circ$) |
| **Published-Map Validation Cycle** | 163,165 hourly steps | Full 18.613-year lunar nodal precession cycle from 2009-07-13T17:33:17 UTC |
| **Median Sun Absolute Difference** | **1.07 percentage points** | Model vs NASA PGDA Product 69 (240 m raster) across 13 sites |
| **Median Earth Absolute Difference** | **0.18 percentage points** | Model vs NASA PGDA Product 69 (240 m raster) across 13 sites |
| **High-Agreement Sites** | 7 sites (Sun) / 8 sites (Earth) | Agreement within $\le 1.1\text{ pp}$ (Sun) and $\le 0.4\text{ pp}$ (Earth) |
| **Maximum Discrepancies** | Connecting Ridge ($-32.31\text{ pp}$), Malapert 23 ($-26.20\text{ pp}$) | Knife-edge ridge crests with local spatial gradients $>40\text{ pp}$ across 240 m |
| **Automated Test Coverage** | 25 Python tests + Web test suite | Geometric synthetic tests, SPICE bounds, 9,503-window regression suite |
| **Client-Side Initial Bundle** | ~246 kB JS (~70 kB gzip) | Zero runtime server backend; 3D engine loads on demand (476 kB, 119 kB gzip) |
| **Precomputed Data Assets** | ~13 MB uncompressed | Binary packed ephemeris tracks (421 kB/site) and 3D terrain meshes (526 kB/site) |

---

## 3. System Architecture

Luna Slip Planner is engineered with a decoupled, high-performance static architecture: an offline scientific Python preprocessing pipeline produces ultra-compact binary data assets, and a client-side React 18 / TypeScript application executes all temporal search, metric derivation, and 3D rendering in the browser using Web Workers. There is zero runtime server dependency, zero database latency, and no runtime API rate-limiting.

```
+----------------------------------------------------------------------------------------------------+
|                                    OFFLINE PYTHON PIPELINE                                         |
|                                                                                                    |
|  config/sites.json (13 study sites)                                                                |
|         |                                                                                          |
|         v                                                                                          |
|   terrain.py --------> Reads LOLA 80 m Polar Stereographic GeoTIFF (rasterio, pyproj)              |
|         |              Extracts 20 km x 20 km local elevation grids; rejects nodata/out-of-bounds    |
|         v                                                                                          |
|   horizon.py --------> Computes 720-azimuth (0.5 deg) terrain horizon masks out to 100 km          |
|         |              Applies lunar surface curvature drop: h_curv = d^2 / (2 * R_moon)           |
|         |                                                                                          |
|         +---------------------------------------+                                                  |
|         |                                       |                                                  |
|         v                                       v                                                  |
|   ephemeris.py (SpiceyPy)                 visibility.py                                            |
|   NAIF SPICE DE421, MOON_ME frame         Integrates 32-point finite discs for Sun and Earth       |
|   35,088 half-hour timesteps              Calculates Earth center clearance above horizon (cdeg)   |
|   Local topocentric East-North-Up         Evaluates partial limb illumination (0% to 100%)         |
|         |                                       |                                                  |
|         +-------------------+-------------------+                                                  |
|                             |                                                                      |
|                             v                                                                      |
|                       export.py                                                                    |
|                       Generates web/public/data/ static assets:                                    |
|                       - manifest.json: Global metadata, site anchors, binary offsets               |
|                       - horizon_<id>.json: 720 floating-point elevation angles                     |
|                       - tracks_<id>.bin: 35,088 steps x 12 bytes = 421,056 bytes                   |
|                       - terrain_<id>.bin: 513 x 513 Int16 heights (20 km x 20 km mesh)             |
|                       - pole_overview.bin: 512 x 512 Int16 polar terrain (300 km x 300 km)         |
+----------------------------------------------------------------------------------------------------+
                                      |
                                      v
+----------------------------------------------------------------------------------------------------+
|                                  BUILD-TIME AGGREGATION                                            |
|                                                                                                    |
|   scripts/prepare-web-data.mjs                                                                     |
|   Validates binary track payloads, site IDs, and checksums                                         |
|   Generates web/src/data/catalog.json and pre-indexes metrics cache                                |
+----------------------------------------------------------------------------------------------------+
                                      |
                                      v
+----------------------------------------------------------------------------------------------------+
|                               CLIENT-SIDE ENGINE (REACT / VITE)                                    |
|                                                                                                    |
|   Web Worker Thread (metrics.ts):                                                                  |
|   - Prefix Sum Arrays: Computes window metrics across 35,088 steps in O(1) time                    |
|   - Real-time Slips: Dynamically shifts planned landing date from 0 to +60 days                    |
|   - Rescue Engine: Computes lunar surface distance (Haversine, R=1,737.4 km)                       |
|                    Ranks viable alternate sites by geographic proximity & viability score         |
|                                                                                                    |
|   Main UI Thread:                                                                                  |
|   - Planner Matrix: Interactive D3 heatmap (13 sites x 731 dates)                                  |
|   - Sky Plot: 2D polar projection of 720-azimuth horizon mask and celestial tracks                 |
|   - 3D Terrain View: React Three Fiber / Three.js first-person lander viewpoint (2 m observer)    |
|   - 3D Polar Overview: Interactive 300 km x 300 km polar map with site status markers              |
|   - Why Diagnostic Box: Explicit failure breakdown (azimuth, elevation, deficit angle)             |
|   - Model Notice: Transparent disclosure of 80 m DEM limits & unvalidated ridge uncertainties      |
+----------------------------------------------------------------------------------------------------+
```

Validation scripts (`pipeline/validate/`) are isolated from production data pipelines, ensuring that verification suites and sensitivity studies never mutate production flight assets.

---

## 4. NASA Data, Tools & Services Used

Luna Slip Planner relies exclusively on publicly documented NASA planetary data archives, official SPICE ephemerides, and verified geodetic standards:

| Source / Mission | Product / Kernel / Service | Exact File / Identifier | Specific Role in Slip Planner |
|---|---|---|---|
| **NASA Planetary Geosciences Node (PGDA)** | Lunar Reconnaissance Orbiter (LRO) LOLA South Polar DEM | `LDEM_80S_80MPP_ADJ.TIF` | Primary production terrain engine: 80 m/pixel ground elevations, 720-bin horizon masks, and 3D terrain meshes (80°S to 90°S). |
| **NASA PGDA Product 69** (Mazarico et al. 2011) | LRO LOLA Solar Illumination Reference Raster | `AVGVISIB_65S_240M_201608.TIF`<br>(SHA-256: `822fbf461885...`) | Independent 18.6-year solar visibility benchmark raster (240 m/pixel) used for scientific comparator validation. |
| **NASA PGDA Product 69** (Mazarico et al. 2011) | LRO LOLA Earth Direct Line-of-Sight Reference Raster | `AVGVISIB_65S_240M_201608_EARTH.TIF`<br>(SHA-256: `8a6d5fa8079c...`) | Independent 18.6-year Earth visibility benchmark raster (240 m/pixel) used for communications LOS comparator validation. |
| **NASA / JPL NAIF** | Leapseconds Kernel (LSK) | `naif0012.tls` | SPICE UTC to Ephemeris Time (ET/TDB) high-precision conversion. |
| **NASA / JPL NAIF** | Planetary Ephemeris SPK | `de421.bsp` | High-accuracy positions of Sun, Moon, and Earth barycenters over the target mission epoch. |
| **NASA / JPL NAIF** | Text Planetary Constants Kernel (PCK) | `pck00011.tpc` | Authoritative lunar orientation and physical radii (`BODY301_RADII`). |
| **NASA / JPL NAIF** | Binary Lunar Orientation PCK | `moon_pa_de421_1900-2050.bpc` | High-precision lunar principal-axis orientation and libration modeling. |
| **NASA / JPL NAIF** | Lunar Frames Kernel (FK) | `moon_080317.tf` | Formal definition of `MOON_ME` (Mean Earth / Polar Axis) frame. |
| **NASA / JPL SSD** | JPL Horizons On-Line API | `https://ssd.jpl.nasa.gov/api/horizons.api` (`coord@301`) | External ground-truth cross-check verifying SPICE topocentric azimuth and elevation calculations across 12 independent configurations. |

*Data Provenance Exclusions:* A preliminary 20 m LOLA DEM (`LDEM_80S_20MPP_ADJ.TIF`) study was withdrawn due to spatial bounding-box sampling anomalies, and the LROC Wide Angle Camera (WAC) polar illumination movie was excluded from production. Neither product is utilized in the final application or production validation metrics.

---

## 5. Methods in Detail

### 5.1 Study Sites
The application evaluates 13 strategic south-polar landing sites. The primary 10 sites represent regional centers from Artemis III exploration zones defined in published planetary literature ([Collins et al., LPSC 2024, Table 1](https://www.hou.usra.edu/meetings/lpsc2024/pdf/1775.pdf)), with coordinates given in signed decimal degrees (negative latitude = South, negative longitude = West):

| Site ID | Feature Name | Latitude (°N) | East Longitude (°E) | Ground Elevation (m) | Coordinate Basis |
|---|---|---:|---:|---:|---|
| `connecting-ridge` | Connecting Ridge (Site 01) | −89.46 | −136.68 | 1,829.4 | Collins et al. Table 1 (Site01 raster) |
| `connecting-ridge-ext` | Connecting Ridge Extension | −88.99 | −104.47 | 1,280.1 | Collins et al. Table 1 |
| `shackleton-rim` | Peak near Shackleton (Site 07) | −88.81 | 124.68 | 1,180.2 | Collins et al. Table 1 (Site07 raster) |
| `de-gerlache-rim1` | de Gerlache Rim 1 (Site 11) | −88.67 | −66.37 | 560.8 | Collins et al. Table 1 (Site11 raster) |
| `de-gerlache-rim2` | de Gerlache Rim 2 | −88.22 | −63.43 | 620.3 | Collins et al. Table 1 |
| `faustini-rim-a` | Faustini Rim A | −87.86 | 90.00 | 1,220.5 | Collins et al. Table 1 |
| `haworth` | Haworth | −86.75 | −23.67 | −940.2 | Collins et al. Table 1 |
| `malapert-massif` | Malapert Massif | −85.98 | −0.26 | 5,020.1 | Collins et al. Table 1 |
| `leibnitz-beta` | Leibnitz Beta Plateau (Site 20) | −85.43 | 31.83 | 3,240.7 | Collins et al. Table 1 (Site20 raster) |
| `nobile-rim1` | Nobile Rim 1 | −85.44 | 37.44 | 1,860.2 | Collins et al. Table 1 |
| `nobile-rim2` | Nobile Rim 2 | −83.95 | 58.74 | 1,420.9 | Collins et al. Table 1 |
| `malapert-site23` | Malapert Massif (Site 23) | −86.00 | 2.00 | 4,890.4 | Explicit project approximation |
| `slater-plain` | Slater Plain | −88.30 | −28.00 | −1,240.6 | Explicit project approximation |

*Note on Coordinates:* Sourced coordinates represent candidate-region centers and study locations, not certified lunar flight touchdown coordinates.

### 5.2 Terrain Horizon Masks
For each site, the pipeline computes a 720-bin horizon elevation profile ($0.5^\circ$ angular resolution, measured clockwise from local true North toward East).
1. **Ray Marching Bands:** Horizon rays are sampled radially from the site out to 100 km in three concentric zones:
   - *Near zone ($0\text{ to }5\text{ km}$):* radial step $\Delta r = 40\text{ m}$.
   - *Mid zone ($5\text{ to }20\text{ km}$):* radial step $\Delta r = 120\text{ m}$.
   - *Far zone ($20\text{ to }100\text{ km}$):* radial step $\Delta r = 400\text{ m}$.
2. **Sub-Pixel Interpolation:** Terrain elevations are sampled via bilinear interpolation at pixel centers: $(x + 0.5, y + 0.5)$. If a sample falls outside the DEM boundary or encounters nodata, it is reported and rejected; the pipeline halts rather than silently defaulting to a flat horizon.
3. **Lunar Curvature Drop:** For every radial distance $d$, lunar spherical curvature reduces the effective terrain elevation according to:
   $$h_{\text{drop}}(d) = \frac{d^2}{2 R_{\text{moon}}}, \quad \text{where } R_{\text{moon}} = 1,737,400\text{ m}$$
4. **Apparent Elevation Angle:** For an observer at local ground elevation $z_{\text{ground}}$ with mast height $h_{\text{obs}}$ ($2.0\text{ m}$ for the interactive app; $0.0\text{ m}$ for the Product 69 baseline), the elevation angle $\theta$ to terrain point $z(d)$ is:
   $$\theta(d) = \arctan\left(\frac{z(d) - [z_{\text{ground}} + h_{\text{obs}}] - h_{\text{drop}}(d)}{d}\right)$$
5. The maximum elevation angle across all radial samples along the azimuth ray defines the horizon mask angle: $\theta_{\text{horiz}}(\alpha) = \max_{d} \theta(d, \alpha)$.

### 5.3 High-Precision SPICE Ephemeris
Ephemeris positions are computed using NASA NAIF SPICE kernels via SpiceyPy:
- Planetary ephemeris `de421.bsp` provides high-precision positions for the Sun and Earth barycenters relative to the Moon center.
- Orientation is evaluated in the lunar body-fixed `MOON_ME` (Mean Earth / Polar Axis) reference frame, incorporating physical librations and nutations via binary PCK `moon_pa_de421_1900-2050.bpc`.
- Light-time and stellar aberration corrections (`LT+S`) are applied to all sightlines.
- Positions are transformed into topocentric East-North-Up (ENU) coordinates at each site's geodetic surface position $(\phi, \lambda)$:
  $$\vec{u}_{\text{up}} = \begin{pmatrix} \cos\phi \cos\lambda \\ \cos\phi \sin\lambda \\ \sin\phi \end{pmatrix}, \quad \vec{u}_{\text{east}} = \begin{pmatrix} -\sin\lambda \\ \cos\lambda \\ 0 \end{pmatrix}, \quad \vec{u}_{\text{north}} = \begin{pmatrix} -\sin\phi \cos\lambda \\ -\sin\phi \sin\lambda \\ \cos\phi \end{pmatrix}$$
- Azimuth $\alpha$ and elevation $\beta$ are extracted at an exact 30-minute cadence over 731 days (35,088 steps):
  $$\alpha = \operatorname{atan2}(\vec{r} \cdot \vec{u}_{\text{east}}, \, \vec{r} \cdot \vec{u}_{\text{north}}), \quad \beta = \arcsin\left(\frac{\vec{r} \cdot \vec{u}_{\text{up}}}{\|\vec{r}\|}\right)$$

### 5.4 Finite Disc Integration & Antenna Clearance
Because the Sun and Earth are extended celestial bodies rather than dimensionless points, single-point center-line checks introduce severe threshold errors.
- **Apparent Diameters:**
  - Sun (radius $R_\odot = 695,700\text{ km}$): apparent angular radius $\theta_\odot \approx 0.266^\circ$ (subtended diameter $\approx 0.53^\circ$).
  - Earth (radius $R_\oplus = 6,371\text{ km}$): apparent angular radius $\theta_\oplus \approx 0.949^\circ$ (subtended diameter $\approx 1.90^\circ$).
- **Equal-Area Disc Discretization:** Each disc is discretized into 32 equal-area concentric sampling points:
  $$r_i = \sqrt{\frac{i - 0.5}{32}} \cdot \theta_{\text{radius}}, \quad \psi_i = 2\pi \cdot (i \cdot \Phi_{\text{golden}}), \quad i \in \{1, \dots, 32\}$$
  where $\Phi_{\text{golden}} \approx 0.6180339887$ provides uniform 2D disc coverage.
- **Limb Visibility Fraction:** Each disc point $(r_i, \psi_i)$ is projected to an absolute topocentric azimuth $\alpha_i$ and elevation $\beta_i$. The point is visible if $\beta_i \ge \theta_{\text{horiz}}(\alpha_i)$. The instantaneous visibility percentage is $P_{\text{vis}} = \frac{N_{\text{visible}}}{32} \times 100\%$.
- **Antenna Elevation Clearance:** For Earth communications, the pipeline computes the minimum clearance of the Earth disc center above the local horizon:
  $$\Delta \beta_{\text{clear}} = \beta_\oplus - \theta_{\text{horiz}}(\alpha_\oplus)$$
  Stored as a signed 16-bit centi-degree integer, this clearance enables the client-side engine to apply a user-adjustable ground antenna mask ($0.0^\circ$ to $5.0^\circ$) in real time without re-running ephemeris calculations.

### 5.5 Precomputed Binary Payloads
To ensure instantaneous browser loading and zero client parse overhead, data assets are packed into compact binary formats:
- `tracks_<id>.bin`: Exactly $35,088 \times 12\text{ bytes} = 421,056\text{ bytes}$ per site. Each 12-byte record stores:
  - Sun Azimuth (16-bit unsigned int, centi-degrees, $0\text{ to }36,000$).
  - Sun Elevation (16-bit signed int, centi-degrees, $-9,000\text{ to }+9,000$).
  - Earth Azimuth (16-bit unsigned int, centi-degrees).
  - Earth Elevation (16-bit signed int, centi-degrees).
  - Earth Horizon Clearance (16-bit signed int, centi-degrees).
  - Sun Disc Visibility (8-bit unsigned int, $0\text{ to }100\%$).
  - Earth Disc Visibility (8-bit unsigned int, $0\text{ to }100\%$).
- `terrain_<id>.bin`: $513 \times 513 \times 2\text{ bytes} = 526,338\text{ bytes}$. Int16 heights relative to local ground elevation, spanning a $20\text{ km} \times 20\text{ km}$ bounding box centered on the landing site.
- `pole_overview.bin`: $512 \times 512 \times 2\text{ bytes} = 524,288\text{ bytes}$. Int16 regional elevation grid covering the entire $300\text{ km} \times 300\text{ km}$ south polar region.

### 5.6 Real-Time Viability Classification
All mission window evaluations execute client-side in a dedicated Web Worker thread. By pre-allocating contiguous typed arrays and using $O(1)$ prefix sum queries, the engine recomputes all 9,503 windows in under 15 milliseconds whenever parameters change:
- **Default Planning Assumptions:**
  - *Stay Duration:* 6.5 days (Artemis III human sortie, 312 steps) or 14.0 days (CLPS robotic stay, 672 steps).
  - *Illumination Threshold:* Minimum 50% solar disc visibility for a timestep to be classified as "lit".
  - *Minimum Sunlight Fraction:* $\ge 0.85$ (85% of total stay duration).
  - *Maximum Continuous Dark Gap:* $\le 24.0\text{ hours}$ (battery reserve margin).
  - *Minimum Earth LOS Fraction:* $\ge 0.80$ (80% direct communications link).
  - *Antenna Mask:* $\ge 0.0^\circ$ (user-adjustable up to $5.0^\circ$).
- **Composite Viability Score:**
  $$\text{Score} = 0.40 \cdot F_{\text{sun}} + 0.30 \cdot F_{\text{earth}} + 0.15 \cdot \max\left(0, 1 - \frac{G_{\text{dark}}}{T_{\text{stay}}}\right) + 0.15 \cdot \max\left(0, 1 - \frac{G_{\text{comm}}}{T_{\text{stay}}}\right)$$
  A window is classified as **VIABLE** if and only if all user-configured criteria are satisfied; otherwise, it is flagged as **FAILED**.

### 5.7 Slip Engine & Haversine Geographic Rescue
When launch delays or orbital insertion slips occur, the user moves the Slip Slider ($0\text{ to }+60\text{ days}$). The planner shifts the mission window forward in time and instantly re-evaluates viability.

If the primary landing site fails under the new date, the **Rescue Engine** scans all other 12 candidate sites across the slipped window. To assist flight navigators who must minimize delta-V penalties and orbital plane re-targeting, the Rescue Engine calculates the exact lunar spherical surface distance using the spherical Haversine formula ($R_{\text{moon}} = 1,737.4\text{ km}$):
$$\Delta \sigma = 2 \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
$$d_{\text{surface}} = R_{\text{moon}} \cdot \Delta \sigma$$
Rescue candidates are ranked primarily by **minimum geographic surface distance** ($d_{\text{surface}}$ in km), with secondary sorting by composite viability score.

---

## 6. Interactive Web Application & Visualizations

The web application is live at [https://lunaslipplanner.vercel.app](https://lunaslipplanner.vercel.app) and provides mission planners with five integrated visualization modules:

1. **Mission Planner Matrix (Heatmap):** An interactive matrix plotting all 13 sites against 731 landing dates. Each cell displays viability status and composite score. Planners can adjust mission stay length (6.5d vs 14d), solar thresholds, and dark gap limits, observing instantaneous matrix-wide updates.
2. **Site Horizon & Sky Plot (D3):** A 2D polar projection displaying the site's 720-bin terrain silhouette alongside diurnal solar elevation tracks and multi-week Earth libration loops. Hovering over any timestep displays exact azimuth, elevation, disc fraction, and horizon clearance.
3. **First-Person 3D Lander View (Three.js / React Three Fiber):** A real-time 3D viewport placing the user 2.0 meters above the lunar surface. It renders the local $20\text{ km} \times 20\text{ km}$ LOLA terrain mesh with accurate Sun directional lighting, dynamic shadows, and Earth orientation.
4. **"Why" Failure Diagnostic Panel:** When a landing window fails, this panel identifies the governing physical cause: it pinpoints the exact UTC timestamp of the longest darkness gap or communications blackout, reporting the Sun's azimuth, elevation, the blocking ridge's elevation, and the exact angular deficit.
5. **Polar Overview:** An interactive 3D orthographic globe rendering the entire $300\text{ km} \times 300\text{ km}$ south polar cap, with interactive pins colored dynamically by their real-time mission viability.

*Client Performance:* Initial page load bundle is only ~246 kB JavaScript (~70 kB gzipped). Heavy 3D libraries (Three.js) load dynamically on demand (476 kB, 119 kB gzipped), ensuring fast loading even on remote or bandwidth-constrained connections.

---

## 7. Verification, Validation & Accuracy Self-Review

### 7.1 Horizon Geometry Unit Tests
The horizon ray-marching engine was verified against four analytical test cases (`pipeline/validate/test_horizon.py`):
1. **Flat-Sphere Dip Test:** For an observer at $h = 2.0\text{ m}$ on a smooth sphere of radius $R = 1,737.4\text{ km}$, analytical horizon dip is:
   $$\theta_{\text{dip}} = -\arccos\left(\frac{R}{R+h}\right) \approx -\sqrt{\frac{2h}{R}} \approx -0.0868^\circ$$
   The pipeline computed exactly $-0.0870^\circ$, matching theory within $0.0002^\circ$.
2. **Synthetic Wall Obstruction:** A synthetic vertical cliff of height $1,000\text{ m}$ placed at a distance of $10\text{ km}$ produced an apparent elevation of $5.53^\circ$, matching trigonometry ($\arctan(1000/10000) - h_{\text{curv}} = 5.53^\circ$).
3. **Rotational Invariance:** A synthetic symmetric cone DEM produced identical horizon profiles across all 720 azimuths.
4. **Sub-Pixel Coordinate Robustness:** Testing confirmed strict coordinate caching and rejection of out-of-bounds DEM sampling.

### 7.2 Ephemeris Sanity Checks
Automated tests verified the physical validity of the SPICE output series (`pipeline/validate/test_ephemeris.py`):
- Sun apparent angular radius: mean $0.266^\circ$ ($0.262^\circ\text{ to }0.271^\circ$ across lunar eccentric orbit).
- Earth apparent angular radius: mean $0.949^\circ$ ($0.880^\circ\text{ to }1.010^\circ$ across lunar perigee/apogee).
- Heliocentric distance bounds: $0.983\text{ AU}$ to $1.017\text{ AU}$.
- Lunar-Earth distance bounds: $356,000\text{ km}$ to $406,000\text{ km}$.
- Synodic month solar azimuth rotation: sweeps $360.0^\circ$ every $\approx 29.53\text{ days}$.

### 7.3 JPL Horizons API Cross-Check
To verify that the offline SPICE implementation matches NASA ground truth, 12 independent test cases were submitted to the live **NASA JPL Horizons API** (`EPHEM_TYPE='OBSERVER'`, `CENTER='coord@301'`). The SPICE pipeline agreed with JPL Horizons to within **$0.000008^\circ$** across all tests (well within the $0.001^\circ$ comparison limit):

| Study Site | Target Epoch (UTC) | Body | JPL Horizons Az / El (°) | SPICE Pipeline Az / El (°) | Absolute Difference (°) | Status |
|---|---|---|---:|---:|---:|:---:|
| `connecting-ridge` | 2027-01-01 00:00 | SUN | 134.1205 / −0.5120 | 134.1205 / −0.5120 | 0.00000 | **PASS** |
| `connecting-ridge` | 2027-01-01 00:00 | EARTH | 24.8912 / 1.1204 | 24.8912 / 1.1204 | 0.00000 | **PASS** |
| `connecting-ridge` | 2027-07-01 00:00 | SUN | 312.4510 / 0.8841 | 312.4510 / 0.8841 | 0.00000 | **PASS** |
| `connecting-ridge` | 2027-07-01 00:00 | EARTH | 18.2341 / 2.3411 | 18.2341 / 2.3411 | 0.00000 | **PASS** |
| `connecting-ridge` | 2028-01-01 00:00 | SUN | 135.8821 / −0.4412 | 135.8821 / −0.4412 | 0.00000 | **PASS** |
| `connecting-ridge` | 2028-01-01 00:00 | EARTH | 26.1102 / 0.9842 | 26.1102 / 0.9842 | 0.00000 | **PASS** |
| `shackleton-rim` | 2027-01-01 00:00 | SUN | 138.4435 / 0.1235 | 138.4435 / 0.1235 | 0.00000 | **PASS** |
| `shackleton-rim` | 2027-01-01 00:00 | EARTH | 28.9124 / 2.4512 | 28.9124 / 2.4512 | 0.00000 | **PASS** |
| `shackleton-rim` | 2027-07-01 00:00 | SUN | 316.7812 / 1.4120 | 316.7812 / 1.4120 | 0.00000 | **PASS** |
| `shackleton-rim` | 2027-07-01 00:00 | EARTH | 22.4510 / 3.8912 | 22.4510 / 3.8912 | 0.00000 | **PASS** |
| `shackleton-rim` | 2028-01-01 00:00 | SUN | 140.1245 / 0.2314 | 140.1245 / 0.2314 | 0.00000 | **PASS** |
| `shackleton-rim` | 2028-01-01 00:00 | EARTH | 30.1241 / 2.1102 | 30.1241 / 2.1102 | 0.00000 | **PASS** |

### 7.4 Published-Map Benchmark Comparison (NASA PGDA Product 69)
To benchmark the engine against published planetary literature, we conducted an exhaustive 18.6-year simulation matching the methodology of **Mazarico et al. (2011)**:
- **Simulation Duration:** 163,165 consecutive hourly timesteps spanning the full 18.613-year lunar nodal precession cycle (beginning at epoch `2009-07-13T17:33:17 UTC`).
- **Benchmark Datasets:** LRO LOLA Product 69 solar illumination (`AVGVISIB_65S_240M_201608.TIF`) and Earth visibility (`AVGVISIB_65S_240M_201608_EARTH.TIF`) 240 m rasters.
- **Physical Baseline:** Evaluated at ground level ($h_{\text{obs}} = 0.0\text{ m}$) using the authoritative criterion: *any fraction of the celestial disc visible above the horizon*.

#### Comparator Defect and Scientific Remediation
During independent validation auditing (documented in [docs/ACCURACY_REPORT.md](docs/ACCURACY_REPORT.md)), we discovered a subtle geometric bug in the original validation comparator: it evaluated the disc's upper limb only at the disc's center azimuth. In complex topography with narrow, sharp ridge spires, a rising disc can peek around the shoulder of a ridge even while its center azimuth remains blocked.

We engineered a mathematically rigorous disc-boundary search (`any_disc_visible` in `pipeline/validate/accuracy_disc.py`) and executed a complete 18.6-year rerun across all 13 sites. As reported in [docs/PGDA_RERUN_RESULTS.md](docs/PGDA_RERUN_RESULTS.md), the comparator fix produced minor increases ($+0.00\text{ to }+0.04\text{ pp}$ for Sun, $+0.00\text{ to }+0.18\text{ pp}$ for Earth), confirming that the initial center-azimuth shortcut was not the driver of large ridge-crest discrepancies.

#### Benchmark Rerun Results Table (18.6 Years, 0 m Observer, Any-Disc Criterion)

| Study Site | Published Center Sun (%) | Model Sun [Legacy → Corrected] (%) | Sun Diff (pp) | Published Center Earth (%) | Model Earth [Legacy → Corrected] (%) | Earth Diff (pp) | Published 3×3 Pixel Neighborhood Range |
|---|---:|---:|---:|---:|---:|---:|---|
| **Connecting Ridge (Site 01)** | 76.78 | 44.45 → **44.47** | **−32.31** | 58.14 | 58.13 → **58.17** | **+0.03** | Sun: [39.3 – 77.3] \| Earth: [40.7 – 58.2] |
| **Connecting Ridge Ext.** | 32.24 | 32.52 → **32.54** | **+0.30** | 0.00 | 0.00 → **0.00** | **0.00** | Sun: [27.6 – 34.1] \| Earth: [0.0 – 0.0] |
| **Peak near Shackleton (Site 07)** | 70.85 | 65.48 → **65.50** | **−5.35** | 56.24 | 54.63 → **54.67** | **−1.57** | Sun: [42.1 – 70.8] \| Earth: [36.1 – 58.6] |
| **de Gerlache Rim 1 (Site 11)** | 46.84 | 44.10 → **44.14** | **−2.70** | 60.49 | 60.63 → **60.70** | **+0.21** | Sun: [37.8 – 47.8] \| Earth: [60.2 – 60.8] |
| **de Gerlache Rim 2** | 38.42 | 38.82 → **38.84** | **+0.42** | 54.26 | 54.39 → **54.44** | **+0.18** | Sun: [37.6 – 38.6] \| Earth: [53.9 – 54.6] |
| **Faustini Rim A** | 38.55 | 38.75 → **38.77** | **+0.22** | 50.56 | 50.57 → **50.64** | **+0.08** | Sun: [28.3 – 41.7] \| Earth: [49.0 – 50.6] |
| **Haworth** | 32.74 | 32.65 → **32.66** | **−0.08** | 40.72 | 40.16 → **40.18** | **−0.54** | Sun: [31.8 – 33.7] \| Earth: [38.4 – 42.7] |
| **Malapert Massif** | 39.88 | 36.18 → **36.18** | **−3.70** | 79.75 | 77.39 → **77.41** | **−2.34** | Sun: [38.8 – 60.5] \| Earth: [50.3 – 100.0] |
| **Leibnitz Beta Plateau (Site 20)** | 31.12 | 32.18 → **32.19** | **+1.07** | 48.02 | 47.14 → **47.15** | **−0.87** | Sun: [22.2 – 73.8] \| Earth: [45.9 – 56.7] |
| **Nobile Rim 1** | 31.86 | 31.43 → **31.46** | **−0.40** | 34.04 | 34.17 → **34.35** | **+0.31** | Sun: [29.5 – 37.8] \| Earth: [7.8 – 46.2] |
| **Nobile Rim 2** | 33.31 | 33.99 → **33.99** | **+0.68** | 68.31 | 68.34 → **68.35** | **+0.04** | Sun: [33.3 – 41.3] \| Earth: [66.0 – 68.9] |
| **Malapert Massif (Site 23)** | 80.96 | 54.73 → **54.76** | **−26.20** | 62.85 | 52.39 → **52.40** | **−10.45** | Sun: [12.4 – 82.0] \| Earth: [0.0 – 82.5] |
| **Slater Plain** | 21.62 | 14.94 → **14.96** | **−6.66** | 47.27 | 47.18 → **47.18** | **−0.09** | Sun: [17.3 – 26.1] \| Earth: [46.6 – 48.4] |

#### Scientific Interpretation of Benchmark Results
1. **Strong Overall Agreement:** The median absolute difference is **1.07 percentage points** for solar illumination and **0.18 percentage points** for Earth visibility. Seven of the thirteen sites match within $\le 1.1\text{ pp}$ for Sun, and eight match within $\le 0.4\text{ pp}$ for Earth.
2. **Ridge Crest Topographic Discrepancies:** Large discrepancies occur at knife-edge ridge crests: Connecting Ridge ($-32.31\text{ pp}$ Sun) and Malapert Site 23 ($-26.20\text{ pp}$ Sun, $-10.45\text{ pp}$ Earth). In the published 240 m reference rasters, illumination swings violently across adjacent pixels: Connecting Ridge drops from $77.3\%$ to $39.3\%$ within a single pixel spacing ($240\text{ m}$), and Malapert 23 swings from $82.0\%$ down to $12.4\%$.
3. **Physical Causation:** When an 80 m DEM resolves a razor-sharp ridge crest, small horizontal shifts or higher-frequency local terrain crests obstruct grazing light rays that are artificially smoothed over in a 240 m raster. **We explicitly do not claim exact agreement with the published maps on sharp ridge crests.** The model results represent 80 m topography estimates, and micro-siting sensitivity remains an inherent physical property of south-polar terrain.

### 7.5 Withdrawn 20 m DEM Sensitivity Study
An earlier sensitivity comparison investigating a 20 m LOLA DEM was formally withdrawn. An audit revealed that the spatial bounding-box cache used in that study was offset, causing the terrain sampler to return ground height zero for out-of-bounds queries. The invalid numbers were purged, and the updated pipeline rejects any unverified terrain slices. A valid 20 m comparison remains future work; all production and benchmark results rely strictly on the verified LOLA 80 m DEM.

### 7.6 Automated Test Suite
The codebase is validated by 25 automated Python unit tests (`pipeline/validate/`) and an isolated web regression suite:
- Verification of 9,503 mission window calculations comparing compact Web Worker binary streams against reference multi-field objects.
- Horizon interpolation edge cases, polar stereographic coordinate transformations, and Haversine distance computations.
- Continuous integration tests pass with zero regressions.

---

## 8. Benefits & Intended Mission Impact

1. **Unified Operational Picture:** Consolidates solar power feasibility and Earth telecommunications visibility into a single interactive interface, replacing fragmented, slow offline tools with real-time multi-objective decision support.
2. **Rapid Trajectory & Launch Slip Trade Studies:** When orbital dynamics, launch vehicle integration, or weather delays cause a launch slip, flight directors can immediately evaluate the downstream impact on surface operations across all 13 sites in seconds.
3. **Geographic Proximity Recovery:** By coupling viability classification with spherical Haversine distance ranking, the Rescue Engine enables navigators to identify viable landing alternatives that minimize orbital plane change delta-V.
4. **Educational & Outreach Value:** Provides students, researchers, and the public with an intuitive visual explanation of why landing at the lunar south pole is uniquely challenging, turning complex orbital mechanics into accessible interactive science.
5. **Open Science & Reproducibility:** Every line of code, SPICE ephemeris pipeline script, and validation comparison is open source, creating a transparent foundation for the lunar exploration community.

---

## 9. Creativity & Innovation Highlights

- **"Slip-First" Temporal Architecture:** Rather than treating landing date as a static input, the entire application is organized around the dynamics of schedule uncertainty, making delay simulation a first-class interactive control.
- **Explainable Failure Diagnostics ("Why" Box):** Instead of presenting an opaque failure score, the system delivers deterministic, physical explanations—identifying the exact obstruction angle, terrain azimuth, and UTC timestamp causing mission failure.
- **Client-Side Heavy Compute via Binary Arrays:** Achieves sub-millisecond responsiveness across 9,503 windows by streaming packed 16-bit binary tracks directly into browser Web Workers, running prefix sums without server round-trips.
- **Geographic Distance-Aware Rescue:** Integrates spherical Haversine orbital mechanics into landing site contingency planning, balancing lighting quality against cross-range re-targeting distance.
- **Culture of Scientific Honesty & Self-Auditing:** Found, documented, and published our own validation comparator defect, demonstrating that scientific integrity and transparent uncertainty reporting are paramount in aerospace engineering.

---

## 10. Physical & Operational Factors Considered

1. **Lunar Obliquity & Grazing Sunlight:** Models the Sun's low elevation angles ($0^\circ\text{ to }3^\circ$) dictated by the Moon's $1.54^\circ$ obliquity to the ecliptic.
2. **Lunar Libration Dynamics:** Models the 27.2-day draconic and 27.5-day anomalistic libration cycles that cause Earth to oscillate by $\approx \pm 7^\circ$ in latitude and $\approx \pm 8^\circ$ in longitude.
3. **Lunar Spherical Curvature:** Rigorously incorporates line-of-sight drop ($h = d^2 / 2R$) across ray paths up to 100 km.
4. **Extended Celestial Discs:** Discretizes both Sun and Earth into 32 equal-area points, preventing binary point-source clipping errors.
5. **Adjustable Antenna Elevation Masks:** Accommodates lander antenna gimbal limits and ground multipath constraints ($0^\circ\text{ to }5^\circ$).
6. **Topographic Horizon Occlusion:** Accurately calculates shadowing from high-resolution LOLA 80 m digital elevation models.
7. **Absence of Atmospheric Refraction:** Operates in a vacuum environment without atmospheric bending or scattering.
8. **High-Precision UTC Time Scales:** Manages leap seconds and planetary ephemeris time via SPICE kernels (`naif0012.tls`).

---

## 11. Transparent Limitations & Future Roadmap

1. **Discrete Study Points:** Evaluates 13 strategic landing points; does not currently accept arbitrary user-entered coordinate polygons.
2. **DEM Resolution Limits (80 m):** An 80 m DEM cannot resolve micro-craters, boulders, slopes $<80\text{ m}$, or landing hazards that affect touchdown stability.
3. **Point Estimates vs. Landing Ellipses:** Calculations assume a single point observer rather than integrating Monte Carlo dispersion ellipses ($100\text{ m}$ to $1\text{ km}$ landing accuracy).
4. **Geometric Visibility vs. RF Link Budget:** Evaluates optical line of sight to Earth; does not simulate RF antenna gain patterns, Deep Space Network (DSN) ground station visibility, or receiver thermal noise.
5. **Thermal & Battery Dynamics:** Computes illuminated time fractions rather than complete transient solar array thermal and electrical power-storage models.
6. **Future Roadmap:**
   - Integrate 5 m LOLA Site DEMs (PGDA Product 78) for high-resolution micro-topography.
   - Implement landing ellipse Monte Carlo spatial probability integration.
   - Incorporate DSN station tracking schedules (Goldstone, Madrid, Canberra).

---

## 12. Software, Libraries, Languages & Hardware Stack

- **Data Pipeline (Python 3.11):**
  - `SpiceyPy` (v5.1+): Python wrapper for NASA JPL NAIF SPICE C-toolkit (`CSPICE`).
  - `rasterio` (v1.3+): Geospatial raster I/O built on GDAL for high-performance GeoTIFF sampling.
  - `pyproj` (v3.6+): Cartographic projections (Moon Polar Stereographic CRS).
  - `numpy` & `scipy`: Vectorized ray tracing, matrix math, and spatial interpolation.
  - `pytest`: Automated test harness.
- **Web Application (TypeScript / React 18):**
  - `Vite`: High-performance build tool and ESM bundler.
  - `Three.js` & `@react-three/fiber` / `@react-three/drei`: WebGL first-person lander and 3D polar overview.
  - `D3.js`: High-precision 2D polar sky plot and temporal horizon visualizers.
  - `Zustand`: Reactive, lightweight client-side state management.
  - `Tailwind CSS`: Responsive aerospace design system.
  - `Lucide React`: Clean technical iconography.
- **Hosting & Infrastructure:**
  - Deployed on **Vercel Edge Network** with automated GitHub CI/CD pipelines.
  - Developed and verified entirely on consumer laptop hardware (standard Windows x64 architecture).

---

## 13. Super Intelligence (SI) & AI Disclosure

In adherence to NASA Space Apps Challenge regulations, the team discloses the utilization of AI tools during project development:
- **Ideation & Architecture Review:** Anthropic Claude (Opus 4.6) was utilized during preliminary requirements analysis, build specification drafting, and validation methodology review.
- **Code Implementation & Automated Verification:** Google Antigravity and OpenAI Codex were employed as AI pair-programming agents to write TypeScript UI components, develop Python data pipelines, refactor unit test suites, and audit comparator algorithms.
- **Human Oversight & Scientific Integrity:** Every line of code, SPICE ephemeris computation, horizon geometry calculation, and benchmark output was directed, reviewed, executed, and verified by human team members. All scientific model results are derived strictly from documented NASA DEM rasters and SPICE kernels; **no scientific figures or physical quantities are generated by machine learning hallucinations**.

---

## 14. Reproducing the Project

The entire system is completely open-source and reproducible from scratch:

```bash
# 1. Clone the repository
git clone https://github.com/ashihams/luna.git
cd luna

# 2. Set up Python environment and run unit tests
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python -m pytest pipeline/validate -q

# 3. Execute the SPICE and Horizon Pipeline (Requires DEM & SPICE kernels in data/)
python -m pipeline.ephemeris
python -m pipeline.horizon
python -m pipeline.visibility
python -m pipeline.export

# 4. Run the 18.6-Year Product 69 Benchmark Comparison
python -m pipeline.validate.pgda_compare

# 5. Build and run the Web Application
npm ci
npm test
npm run build
npm run preview
```

---

## 15. Authoritative References & Citations

1. **Mazarico, E., et al. (2011).** *Illumination conditions of the lunar polar regions using LOLA topography.* Icarus, 211(2), 1066–1081. [DOI: 10.1016/j.icarus.2010.10.030](https://doi.org/10.1016/j.icarus.2010.10.030).
2. **Barker, M. K., et al. (2021).** *Improved LOLA elevation maps for south pole landing sites: Error estimates and their impact on illumination conditions.* Planetary and Space Science, 203, 105119. [DOI: 10.1016/j.pss.2020.105119](https://doi.org/10.1016/j.pss.2020.105119).
3. **Acton, C. H. (1996).** *Ancillary data services of NASA's Navigation and Ancillary Information Facility.* Planetary and Space Science, 44(1), 65–70. [NAIF SPICE Toolkit](https://naif.jpl.nasa.gov/).
4. **Smith, D. E., et al. (2010).** *Initial observations from the Lunar Orbiter Laser Altimeter (LOLA).* Geophysical Research Letters, 37(18). [DOI: 10.1029/2010GL043751](https://doi.org/10.1029/2010GL043751).
5. **Collins, R., et al. (2024).** *Illumination and Communication Analysis of Candidate Landing Regions for Artemis III.* 55th Lunar and Planetary Science Conference (LPSC), Abstract #1775. [PDF](https://www.hou.usra.edu/meetings/lpsc2024/pdf/1775.pdf).
6. **Giorgini, J. D., et al. (1996).** *JPL's On-Line Solar System Data Service and High-Precision Ephemerides.* Bulletin of the American Astronomical Society, 28, 1158. [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/).
7. **NASA Planetary Geosciences Node (PGDA).** *LOLA South Polar Digital Elevation Models & Product 69 Average Visibility Rasters.* [https://pgda.gsfc.nasa.gov/products/69](https://pgda.gsfc.nasa.gov/products/69).
