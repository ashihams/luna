# Luna Slip Planner 🌑
> *My landing slipped N days. Is this site still viable, and what are my alternatives?*

**NASA Space Apps 2026 — Challenge: Lunar Landing Site Navigator**  
**Live Application:** [https://lunaslipplanner.vercel.app](https://lunaslipplanner.vercel.app)  
**Target Region:** Lunar South Pole (80°S to 90°S) • 13 Lunar South Pole Study Points

---

## 1. Executive Summary

At the lunar south pole, the Sun skims the horizon at low elevation angles, with a range that depends on latitude and season. A landing delay changes the modeled sunlight and geometric Earth visibility during a surface stay.

**Luna Slip Planner** provides mission architects, flight controllers, and the public with interactive model-based feasibility assessments for lunar surface missions. Given a landing site, launch date, and stay duration, it answers:
1. **Is the mission still viable after an $N$-day launch slip?**
2. **At what azimuth and elevation does the modeled horizon obstruct the Sun or Earth?**
3. **What are the best rescue alternatives (alternate dates or adjacent site hops)?**

The app presents **model estimates** computed from LOLA terrain and NAIF SPICE ephemerides. Scientific result figures come from the final [VALIDATION.md](docs/VALIDATION.md). [PROJECT_DETAILS.md](PROJECT_DETAILS.md) contains the submission summary, actual NASA data list, AI disclosure, repository link, and live link.

---

## 2. Key Architecture & Features

- **Interactive Canvas Heatmap**: Evaluates $>9,500$ mission windows across 13 sites $\times$ 731 dates using TypedArray visibility data and prefix sums.
- **Slip Slider & Tolerance Engine**: Simulates delays from $-15$ to $+60$ days with continuous viable day calculation ($k$ days), fragile window indicators ($<3$ days), and earliest recovery window finder.
- **Sky Visibility Plot**: $0^\circ–360^\circ$ azimuth with an adaptive elevation range displaying the true 720-azimuth LOLA terrain silhouette, wrapped celestial tracks, and labeled center markers.
- **Three.js First-Person Surface Scene**: 60% viewport 3D perspective at $2.0\text{ m}$ eye level with $513 \times 513$ local terrain mesh ($\pm 10\text{ km}$), subtracted spherical lunar curvature $\Delta z = -(e^2 + n^2)/(2R)$, and procedural Earth and solar rendering.
- **Data-Driven "Why" Box & Countdown Badges**: Dynamic countdowns to sunset/sunrise and Earthset/Earthrise; modeled horizon diagnostics at the start of the longest gap.
- **Two-Scenario Comparison Drawer**: Side-by-side comparison matrix of baseline vs slipped plans with color-coded deltas ($\Delta$).
- **3D Lunar South Pole Overview**: Full $300 \times 300\text{ km}$ regional polar cap model with interactive pins color-coded by real-time viability.

---

## 3. Mission Profile Presets

| Profile | Stay Duration | Min Sun % | Max Dark Gap | Min Earth LOS % | Antenna Mask | Application |
|---|---|---|---|---|---|---|
| **Artemis III** | 6.5 days | 85% | 24 hours | 80% | 0.0° | Human sortie, battery endurance |
| **CLPS Lander** | 14.0 days | 80% | 36 hours | 75% | 0.0° | Commercial lander daylight cycle |
| **VIPER Rover** | 21.0 days | 85% | 16 hours | 85% | 1.5° | Mobile traverse, multi-crater science |
| **Base Camp** | 28.0 days | 75% | 48 hours | 70% | 0.5° | Extended lunar surface habitation |

*Note: All thresholds are user-editable mission planning assumptions, not rigid NASA constraints.*

---

## 4. Verification and limitations

This is an exploratory model, not a certified mission-planning system. [VALIDATION.md](docs/VALIDATION.md) separates geometry tests, a 12-comparison JPL Horizons check, and actual sampling of PGDA Product 69 visibility maps. Published-map comparison was recomputed over the full 18.6-year nodal cycle using the corrected any-disc comparator (`any_disc_visible`), documented in [PGDA_RERUN_RESULTS.md](docs/PGDA_RERUN_RESULTS.md). Across all 13 sites, median absolute difference is **1.07 percentage points** for Sun and **0.18 percentage points** for Earth; 7 sites agree within 1.1 points for Sun, and 8 sites agree within 0.4 points for Earth.

The median conceals large individual disagreements: **Connecting Ridge is 32.31 percentage points below the published center pixel** (44.47% vs 76.78%), and **Malapert Site 23 is 26.20 points below** (54.76% vs 80.96%). As verified in [ACCURACY_REPORT.md](docs/ACCURACY_REPORT.md) and [PGDA_RERUN_RESULTS.md](docs/PGDA_RERUN_RESULTS.md), the comparator defect accounted for only +0.02 pp at Connecting Ridge; the remaining discrepancy is driven by terrain resolution (80 m DEM vs 240 m smoothed raster) and extreme local topography gradients (>40 pp across 240 m). Being within a broad neighborhood range does not establish accuracy at the selected coordinate.

The old 20 m sensitivity study is withdrawn: misplaced windows and silent zero-ground/flat-terrain fallbacks invalidated it. The corrected pipeline rejects those inputs. **A valid 20 m comparison is pending.** Production uses the 80 m DEM and displays provisional ridge uncertainty, not a validated confidence interval.

Connecting Ridge is now −89.46°, −136.68°; the extension is −88.99°, −104.47°. The previous positive longitudes were wrong. Peak near Shackleton is associated with PGDA Site07, not Site04. All 13 production sites were rebuilt with corrected pixel-center sampling. See [SOURCES.md](docs/SOURCES.md), [TIER1_REPORT.md](docs/TIER1_REPORT.md), and [PGDA_RERUN_RESULTS.md](docs/PGDA_RERUN_RESULTS.md).

## 5. Reading the results

Sun fraction is the average fraction of the solar disc visible during the selected stay. Dark gaps use the selected disc threshold. Earth LOS tests Earth's center against terrain plus the antenna mask. These are geometric outputs; the app does not simulate battery survival, lander safety, terrain traversability, or a radio link budget.

[Current production metrics](docs/production_metrics.json) record the precise period and default thresholds. The long-run PGDA comparison uses different visibility definitions, time span, and observer height and must not be substituted for a particular mission window. Procedural 3D textures/stars illustrate the scene; metrics use the exported DEM/SPICE arrays.

## 6. Demo

Open the planner, select a study point and UTC date, edit mission thresholds, and change the launch-slip slider. The metrics and rescue alternatives recalculate from the selected data. Open Site 3D to compare celestial positions with the terrain silhouette; scrub the mission time and inspect the visible-disc and Earth-clearance labels. End-of-dataset stays with insufficient data are unavailable.

See [DEPLOYMENT_AUDIT.md](docs/DEPLOYMENT_AUDIT.md) for the actual exercised workflows and browser limitations.

---

## 7. Data Sources & Provenance

The submission's used-data list is in [PROJECT_DETAILS.md](PROJECT_DETAILS.md#nasa-data-and-services-used). It includes the PGDA Product 69 Sun and Earth rasters, the production LOLA 80 m DEM, NAIF SPICE kernels, and the Horizons API. The 20 m DEM and WAC movie are not listed as used production/validation sources.

1. **LOLA South Polar DEM (80 m, 80°S to 90°S)**: NASA Planetary Geodynamics Data Archive (PGDA), Goddard Space Flight Center. Polar stereographic projection in `MOON_ME` reference frame relative to a 1,737.4 km sphere.
2. **NAIF SPICE Kernels**: `de421.bsp`, `naif0012.tls`, `pck00011.tpc`, `moon_pa_de421_1900-2050.bpc`, `moon_080317.tf`.
3. **Mazarico et al. 2011**: *Illumination conditions of the lunar polar regions using LOLA topography*, Icarus 211, 1066–1081.
4. **Barker et al. 2021**: *Improved LOLA Elevation Maps for South Pole Landing Sites: Error Estimates and Their Impact on Illumination Conditions*, Planetary and Space Science 203, 105119.

---

## 8. Development & Local Run

```bash
# 1. Pipeline environment (Python 3.13)
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt

# 2. Ephemeris & DEM generation
python -m pipeline.fetch_kernels
python -m pipeline.run_all

# 3. Web application
cd web
npm install
npm run dev
```

Build for static deployment:
```bash
npm run build --prefix web
```

---

## License
MIT License. Developed for NASA Space Apps Challenge 2026.
