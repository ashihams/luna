<USER_REQUEST>
Slip Planner: Build Specification
NASA Space Apps 2026 | Challenge: Lunar Landing Site Navigator | Spec v1.0 | Audience: the engineer or LLM implementing the build
0. Rules for the builder
1.  Build the milestones in the order of section 18. Do not start a milestone until the previous one passes its acceptance checks.
2.  Never invent URLs, file names, site coordinates or NASA thresholds. Wherever this spec says VERIFY, open the source, read it, and record what you found in docs/SOURCES.md.
3.  Every number shown in the UI comes from the precomputed tables. The 3D scene is illustrative and never feeds a metric.
4.  Never silently fall back to a flat horizon or a coarser DEM. If a read fails, stop and report it.
5.  Time is UTC. Files store degrees; numerical code uses radians internally. Distances are metres unless a name ends in _km.
6.  Everything runs on one laptop with free tools and deploys as a static site. No server at runtime.
7.  Write tests before code for sections 10 to 12. Log every validation result to docs/VALIDATION.md.
1. Product
Core question: My landing slipped N days. Is this site still viable, and what are my alternatives?
Given a candidate lunar south pole site, a landing date and a stay length, the app reports whether sunlight and a direct line of sight to Earth last through the stay, using the real terrain horizon rather than a flat one. It then shows how that answer changes if the date or site changes.
Users: mission planners (precision and speed) and educators or the public (intuition about why the Moon is hard).
Screens:
• A. Planner: heatmap of sites (rows) by landing date (columns), a slip slider, a rescue list, two-scenario comparison.
• B. Site view: first-person 3D scene at the lander, a sky plot with the terrain horizon and Sun and Earth tracks, a time scrubber, and countdown badges to sunset and Earthset.
• C. Pole overview (should-have): 3D terrain of the pole with site markers coloured by viability.
2. Scope tiers
Must: 10 to 15 curated sites; terrain horizon masks; Sun and Earth tracks for 2027 and 2028; heatmap; slip slider; sky plot; first-person 3D scene; metrics; validation against published maps.
Should: rescue ranking; Artemis-style and CLPS-style presets (user-editable); two-scenario comparison; countdown badges; pole overview.
Stretch (cut in this order if late): DEM-resolution sensitivity panel; WAC image validation overlay; custom lat/lon via precomputed 1 km grid inside 87 to 90 S; Barker clone uncertainty bands; Moon Trek texture.
Non-goals: live API calls at runtime; atmosphere or refraction (the Moon has none); thermal modelling; trajectory design.
3. Data sources
ID
Source
Use
Location
Status
D1
LOLA south polar DEM, 80 to 90 S, 20 m (about 2.6 GB cloud-optimized GeoTIFF)
near and mid terrain
https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF
link listed on PGDA page; range reads untested
D2
Same folder: LDEM_80S_80MPP_ADJ.TIF (about 181 MB) and LDEM_80S_40MPP_ADJ.TIF (about 685 MB)
far terrain, resolution experiments
https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/
listed
D3
Same folder: LDSM_80S_20MPP_ADJ.TIF (slope, degrees)
slope screening
same folder
listed
D4
5 m site DEMs (Sites 1, 4, 7, 11) and 87 to 90 S 5 m DEM
near terrain at best resolution
https://pgda.gsfc.nasa.gov/products/78 and https://imbrium.mit.edu/
VERIFY file URLs
D5
SPICE kernels from NAIF generic_kernels: naif0012.tls, de421.bsp, moon_pa_de421_1900-2050.bpc, moon_080317.tf
Sun and Earth positions in MOON_ME
https://naif.jpl.nasa.gov/pub/naif/generic_kernels/
VERIFY exact names and paths
D6
JPL Horizons API
independent cross-check of Sun and Earth az/el
https://ssd.jpl.nasa.gov/api/horizons.api
VERIFY request format; frame may differ slightly
D7
Mazarico et al. 2011 long-term illumination and Earth visibility maps
validation
https://pgda.gsfc.nasa.gov/products/69
VERIFY file names and assumed observer height
D8
LROC WAC south pole movie frames, 100 m/px, 80 to 90 S, timestamp in file name
stretch validation
https://data.lroc.im-ldi.com/lroc/view_rdr/WAC_POLE_MOVIE_SOUTH
VERIFY
D9
LROC WAC south summer mosaic 100 m/px; Moon Trek WMTS tiles
texture
https://data.lroc.im-ldi.com/lroc/view_rdr/WAC_ROI_SOUTH_SUMMER ; https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon
VERIFY; stretch
Notes: LOLA polar products use polar stereographic coordinates in metres in the MOON_ME frame of DE421. Read the CRS from the file; never hardcode it. Heights are surface heights in metres relative to a 1737.4 km sphere (VERIFY in the product README). Moon Trek serves images, not verified raw elevations, so it is never used for horizon computation. Cite Barker et al. 2023 (Planet. Sci. J. 4, 183) and Mazarico et al. 2011 (Icarus 211, 1066) in the README.
4. Architecture
Offline Python pipeline (run once, deterministic) writes static artifacts. A static React app reads them. There is no runtime backend.
Offline: sites.json -> terrain acquisition (rasterio windows) -> horizon engine (numpy) -> ephemeris (SpiceyPy) -> visibility products -> export to web/public/data/ (manifest.json, horizon_ID.json, tracks_ID.bin, terrain_ID.bin) -> validation scripts and research scripts.
Online: manifest loader -> typed-array stores -> metrics Web Worker (window metrics, heatmap, rescue) -> UI (D3 heatmap and sky plot, three.js scenes).
Stack: Python 3.11+, numpy, scipy, rasterio (use its bundled GDAL wheel; do not pin or install gdal separately), pyproj, spiceypy, pytest, optional numba. Frontend: Node 20, Vite, React 18, TypeScript, three, @react-three/fiber, @react-three/drei, d3, zustand. Pin exact versions at install time and record them in the README.
5. Repository layout
• config/config.yaml: all constants (section 6)
• config/sites.json: curated sites
• pipeline/terrain.py, horizon.py, ephemeris.py, visibility.py, export.py, run_all.py
• pipeline/validate/: unit tests, horizons_check.py, pgda_compare.py, wac_overlay.py (stretch)
• research/: sensitivity.py, outputs as CSV and PNG
• web/: Vite app; web/src/{data,workers,state,views,three,charts}; web/public/data/ (generated)
• docs/: SOURCES.md, VALIDATION.md, SPEC.md
• data/cache/: git-ignored DEM windows (.npy) and kernels
6. Constants (config.yaml)
Key
Value
R_MOON_M
1737400
R_SUN_KM
695700
R_EARTH_KM
6371.0
OBS_HEIGHT_M
2.0 (lander-top assumption; stored per site)
AZ_STEP_DEG
0.5 (720 azimuths)
T0_UTC / T1_UTC
2027-01-01T00:00:00 / 2029-01-01T00:00:00
STEP_MIN
30
N_STEPS
35088 (731 days x 48)
DISC_SAMPLES
32
TERRAIN_N / TERRAIN_HALF_M
513 / 10000
ABCORR
LT+S
The 30 minute step matters: the Sun moves about 0.5 deg per hour and its disc is about 0.53 deg wide, so hourly sampling can miss grazing events.
7. Frames and angle conventions
All positions are in the MOON_ME body-fixed frame. For a site at latitude phi and east longitude lambda:
• up = (cos phi cos lambda, cos phi sin lambda, sin phi)
• east = (-sin lambda, cos lambda, 0)
• north = (-sin phi cos lambda, -sin phi sin lambda, cos phi)
Azimuth is measured from local north toward east, 0 to 360 deg. Elevation is the angle above the local horizontal plane. Use these same definitions for horizon rays and for SPICE-derived az/el so they agree. Clamp latitude to at most -89.9999 to avoid the pole singularity. In three.js (Y up): x = east, y = up, z = -north.
8. Stage 1: Sites
config/sites.json fields per site: id (slug), name, lat_deg, lon_deg_east, program (artemis, clps, other), source (citation or URL), notes, obs_height_m (default from config).
Rules: take coordinates only from published sources (PGDA site README for Sites 1, 4, 7, 11; Mazarico et al. 2011 candidate list; NASA Artemis candidate regions; CLPS announcements). Record each source in docs/SOURCES.md. Target 12 to 15 sites, at least 8 within 87 to 90 S or covered by a 5 m tile, including the Shackleton to de Gerlache connecting ridge and the Malapert region. Add one synthetic test site at lat -89.9, lon 0 for tests, flagged test: true and hidden in the UI.
9. Stage 2: Terrain acquisition (pipeline/terrain.py)
Three levels per site:
Level
Source
Ground range from site
Step
near
5 m tile if available, else D1
0 to 15 km
native pixel
mid
D1 (or 40 m)
15 to 60 km
native pixel
far
D2 80 m
60 to 300 km
native pixel
The 80 S products extend about 304 km from the pole, so clip each ray at the raster edge and record effective_radius_km per site.
Read windows with rasterio over HTTP (rasterio.open on the URL; window from bounds). Convert site lat/lon to raster x,y with pyproj Transformer.from_crs(CRS.from_proj4('+proj=longlat +R=1737400 +no_defs'), src.crs, always_xy=True). If range reads fail, download the file once into data/cache and read locally. Treat nodata as NaN; count NaN samples on rays; fail the site if more than 1 percent. Cache windows as .npy with a manifest hash. Output per site per level: array, affine transform, CRS string, pixel size.
Observer ground height z0 comes from bilinear sampling of the near level at the site.
10. Stage 3: Horizon engine (pipeline/horizon.py)
Function: compute_horizon(site, levels, obs_height_m, az_step_deg) returns elev_deg[720].
Algorithm, for each azimuth az and each sample ground distance d in a level range:
1.  theta = d / R_MOON_M (central angle).
2.  Unit vector on the sphere: p = cos(theta)up + sin(theta)(cos(az)*north + sin(az)*east).
3.  lat = asin(p_z), lon = atan2(p_y, p_x). Convert to raster x,y with the level transformer (vectorized pyproj).
4.  Bilinear sample height z (scipy.ndimage.map_coordinates, order 1). Target radius r_t = R_MOON_M + z.
5.  Observer radius r_o = R_MOON_M + z0 + obs_height_m.
6.  Elevation angle e = atan2(r_tcos(theta) - r_o, r_tsin(theta)).
7.  horizon(az) = max of e over all samples from all levels. Never treat pixels as a flat plane; the stereographic scale error is about 0.8 percent at 10 deg from the pole and the curvature drop is d^2/(2R).
Vectorize over azimuth and distance as 2D arrays. Expect about 6 million samples per site; target under 30 s per site. Process levels separately and combine with max.
Variants (for research and baselines), same function: flat (horizon = geometric sphere dip only, no terrain); dem80 (80 m everywhere); dem20 (20 m near and mid, 80 m far); dem5 (5 m near where available). The best available variant is the one the app uses.
Unit tests (pytest), all must pass:
• Synthetic flat sphere: horizon equals about -0.087 deg for a 2 m observer (the geometric dip) at every azimuth, within 0.01 deg.
• Synthetic wall of 1000 m at 10 km due east: horizon at azimuth 90 is about 5.53 deg, within 0.05 deg; other azimuths unaffected.
• Rotational symmetry: a synthetic cone centred on the site gives the same horizon at all azimuths within 0.01 deg.
• Pole test site (lat -89.9): output has no NaN and varies smoothly with azimuth.
11. Stage 4: Ephemeris (pipeline/ephemeris.py)
1.  Furnish kernels from config (D5). Fail loudly if any is missing.
2.  Build ET array: et0 = str2et(T0_UTC), then et0 + k*1800 s for k in 0..N_STEPS-1.
3.  Observer vector in MOON_ME (km): (R_MOON_M + z0 + obs_height_m)/1000 * up.
4.  For body in SUN and EARTH: v = spkpos(body, et, 'MOON_ME', 'LT+S', 'MOON')[0] minus the observer vector. Vectorize over times if the installed SpiceyPy supports it; otherwise loop.
5.  Components: e_comp = v.east, n_comp = v.north, u_comp = v.up. az = atan2(e_comp, n_comp) mod 360; el = atan2(u_comp, hypot(e_comp, n_comp)).
6.  Angular radius rho = asin(R_body_km / |v|).
Output per body: az_deg, el_deg, rho_deg arrays of length N_STEPS.
Sanity tests: for sites within 1 deg of the pole, |sun el| stays under about 1.6 deg plus the site colatitude and |earth el| under about 8 deg plus colatitude (loose bounds); Sun azimuth sweeps a full circle about every 29.5 days; |v| for the Sun is near 1 AU, for Earth near 384400 km.
12. Stage 5: Visibility products (pipeline/visibility.py)
Sun and Earth disc visibility: sample the disc with DISC_SAMPLES equal-area points: for k in 0..N-1, r_k = rhosqrt((k+0.5)/N), phi_k = k2.399963 rad, el_k = el + r_ksin(phi_k), az_k = az + r_kcos(phi_k)/max(cos(el), 0.05). Look up horizon at az_k by linear interpolation with wraparound. A sample is visible if el_k > horizon(az_k). vis_pct = round(100 * visible / N).
Also store earth_clearance = el_center - horizon(az_center), in degrees. The frontend applies the antenna mask: link available when earth_clearance >= mask_deg (default 0, slider 0 to 5).
Outputs per site, per step: sun_az, sun_el, earth_az, earth_el, earth_clearance, sun_vis_pct, earth_vis_pct.
13. Data contracts (pipeline/export.py writes to web/public/data/)
manifest.json: version; generated_utc; constants block (copy of section 6); time block {t0_utc, step_min, n_steps}; sites list. Each site entry: id, name, lat_deg, lon_deg_east, program, source, obs_height_m, ground_height_m, effective_radius_km, files {horizon, tracks, terrain}, variants list, and for tracks_ID.bin a layout list of {name, dtype, byte_offset, length}. The frontend must read offsets from the manifest, never assume them.
horizon_ID.json: az_step_deg, n, obs_height_m, and a variants object holding elev_deg arrays (3 decimals) for each variant, plus levels_used, nan_fraction, runtime_s.
tracks_ID.bin (little endian, concatenated): sun_az uint16 (centi-degrees), sun_el int16 (centi-degrees), earth_az uint16, earth_el int16, earth_clearance int16 (centi-degrees), sun_vis_pct uint8, earth_vis_pct uint8. Put the uint8 arrays last and pad to 2-byte alignment.
terrain_ID.bin: uint16 row-major, TERRAIN_N x TERRAIN_N. Row 0 is the north edge, column 0 the west edge. Grid is in local east/north axes centred on the site (resample the DEM through the great-circle mapping of section 10; do not copy raster axes). Header values in the manifest: z_min, z_max; height relative to site ground z0 = z_min + v/65535*(z_max - z_min). Curvature is NOT baked in.
Expected total size under 10 MB gzipped for 15 sites. Fail the export if larger.
14. Metrics (web/src/workers/metrics.ts)
User parameters and defaults (all editable; these are planning assumptions, not NASA requirements): stay_days (6.5 Artemis-style preset, 14 CLPS-style preset); lit_threshold_pct 50; min_sun_fraction 0.85; max_dark_gap_hours 24; min_earth_fraction 0.8; antenna_mask_deg 0.
For a site s, start index i (daily granularity, every 48 steps) and window D = stay_days*48 steps:
• sun_fraction = mean(sun_vis_pct over window)/100, via prefix sums.
• earth_fraction = share of steps with earth_clearance >= mask, via prefix sums of the boolean.
• longest_dark_gap_h = longest run of steps with sun_vis_pct < lit_threshold, times 0.5 h.
• longest_comms_outage_h = longest run with earth_clearance < mask, times 0.5 h.
• viable = all four thresholds satisfied.
• score = 0.5sun_fraction + 0.5earth_fraction - 0.5min(1, longest_dark_gap_h/(24stay_days)).
Heatmap: compute for all sites and 731 start dates inside the worker; recompute on any parameter change; target under 200 ms. Countdown badges: from the scrubbed time t, find the next index where the lit state flips; show hours remaining to sunset (or to sunrise if dark); same for Earth.
Slip tolerance for (site, planned date t0): largest k such that the site is viable on every daily start t0, t0+1, ..., t0+k (cap 60); -1 if not viable at t0. Also earliest_recovery_days: smallest j > 0 that is viable again. Flag fragile if tolerance < 3 days.
Rescue ranking for planned date plus slip: (a) best alternative start at the same site within plus or minus 30 days; (b) best other sites on the slipped date; (c) top 5 site-date pairs overall. Sort viable first, then by score. Show deltas against the original plan.
15. Frontend spec
State (zustand): selected site, planned date, slip days, parameters, scrub time, pinned comparison scenarios. Load manifest first, tracks and horizon lazily per site, terrain only for the Site view.
Planner view: left panel with parameter controls and presets; main heatmap (canvas, sites by dates; metric toggle: power, comms, combined; non-viable cells outlined; month ticks; hover tooltip with all metrics; click selects; arrow keys move selection); slip slider moving a planned-date marker with a delta label; rescue panel; comparison drawer with two scenarios side by side.
Site view: 60 percent first-person 3D canvas; 40 percent sky plot and timeline strips; scrubber across the stay window; play/pause with speed control; countdown badges; a Why box that states, from the data, what blocks the Sun or Earth at the start of the longest dark gap or outage (for example, terrain at azimuth X rising Y deg).
Sky plot (D3 SVG): rectangular, azimuth 0 to 360 by elevation -5 to +10 deg; terrain horizon as a filled silhouette; Sun and Earth tracks over the selected window as polylines broken at the 0/360 wrap; current positions as discs at true angular size.
Three.js scene: terrain mesh 513 x 513 over plus or minus 10 km; for each vertex subtract curvature (e^2 + n^2)/(2*R_MOON_M) from height; apply a vertical exaggeration slider (default 1). Camera at (0, obs_height, 0), drag to look, FOV 70. Sun: DirectionalLight from direction (cos(el) sin(az), sin(el), -cos(el) cos(az)), intensity proportional to sun_vis_pct, off when el below horizon; shadow map 4096, orthographic shadow camera plus or minus 12 km, tune bias and normalBias for the very low Sun; a toggle drops to 2048. Earth: billboard sprite with a procedural texture (no external assets) at true angular size. Sun and Earth angular size exaggeration slider 1 to 8 (size only, never position). Beyond-mesh terrain: a black horizon ring at 19 km built from the 720 horizon values, so occlusion stays correct without loading far terrain. Stars: procedural points. Ambient light about 0.02 for earthshine.
Pole overview (should-have): export a 512 x 512 overview heightmap from the 80 m DEM covering plus or minus 150 km; site markers coloured by viability on the current date; click flies the camera to the site and switches to Site view.
Performance: initial load under 8 MB gzipped; heatmap recompute under 200 ms; 30 fps on an integrated GPU at default settings. Accessibility: colour-blind safe palette, keyboard navigation, text alternatives for charts. Labels must make clear that results are modelled, use the 2 m observer height, and that the assumptions are user-editable.
16. Validation (must pass before building the UI beyond a stub)
• V1 unit tests of section 10: all pass.
• V2 ephemeris sanity bounds of section 11: all pass.
• V3 Horizons cross-check: for 2 sites and 3 dates, compare Sun and Earth az/el from SPICE and Horizons. Log differences. Target under 0.1 deg; if larger, investigate frame definitions before proceeding.
• V4 PGDA comparison: compute 18.6 year (about 326,000 steps at 30 minutes) average Sun and Earth visibility at 5 or more sites and compare with the PGDA maps (D7). Match the observer height and DEM resolution the maps assume (VERIFY). Target absolute difference within 5 percentage points; if over 10, stop and debug. Document remaining differences (DEM version, disc handling, resolution).
• V5 (stretch) WAC overlay: for 3 WAC frame timestamps, compute a per-pixel hard-shadow mask over a 60 km region at 100 m with the Sun azimuth and elevation at that time, overlay on the frame, and report agreement.
17. Research experiments (for the write-up)
Research/sensitivity.py, on 3 to 4 sites: compare flat, dem80, dem20 and dem5 variants for sun_fraction, earth_fraction, longest dark gap and slip tolerance over the 2027 to 2028 window. Report error versus the best variant and a table and plot per site. Define slip sensitivity as the change in score per day of delay averaged over plus or minus 30 days. Stretch: use Barker's clone DEMs (VERIFY format in the site product README) to get P10 to P90 bands on sun_fraction.
18. Build order (30 hours)
Milestone
Hours
Acceptance
M0 Setup
0 to 2
repo, env, kernels furnished, one DEM window read and plotted
M1 Terrain and horizon
2 to 8
V1 passes; horizon file for 3 sites; polar plot looks sane
M2 Ephemeris and tracks
8 to 11
V2 passes; tracks for all sites exported
M3 Validation
11 to 13
V3 and V4 logged in VALIDATION.md
M4 Planner UI
13 to 18
heatmap, slip slider, parameters, sky plot working on real data
M5 Site view and 3D
18 to 25
first-person scene, scrubber, countdowns, Why box
M6 Rescue and presets
25 to 28
rescue panel, presets, comparison drawer
M7 Ship
28 to 30
static deploy, README with validation figures, demo script
Cut lines, in order: pole overview, sensitivity panel, WAC overlay, custom coordinates, clone bands, Moon Trek texture. Never cut V3 and V4.
19. Known pitfalls
• Frame mismatch between DEM (MOON_ME, DE421) and ephemeris. Use the DE421 kernels listed in D5; this causes silent errors.
• Treating stereographic pixels as planar distances; always go through lat/lon and the sphere.
• Azimuth convention drift between horizon code, SPICE code and three.js. Test with a synthetic wall and a known Sun direction.
• uint16 overflow of centi-degree azimuth (max 36000 fits uint16, not int16).
• Horizon ring missing in 3D, which lets the Sun shine through far terrain.
• Hourly sampling missing grazing Sun events; keep 30 minutes.
• Raster edge: 80 S products end about 304 km from the pole; clip rays rather than reading garbage.
• Large downloads in the build environment; prefer windowed reads and cache.
• Presenting defaults as NASA requirements; they are planning assumptions and must be labelled so.
20. Deliverables
Public repo; deployed static site; README with data citations, method summary, validation figures and the research plots; docs/SOURCES.md and docs/VALIDATION.md; a two minute demo script that opens with the slip question, shows the heatmap, drops into the first-person view at the longest dark gap, and closes with the resolution error result.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-14T14:45:56+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.8 Flash (Medium). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>