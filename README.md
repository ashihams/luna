# Luna Slip Planner 🌑
> *My landing slipped N days. Is this site still viable, and what are my alternatives?*

**NASA Space Apps 2026 — Challenge: Lunar Landing Site Navigator**  
**Live Application:** [https://lunaslipplanner.vercel.app](https://lunaslipplanner.vercel.app)  
**Target Region:** Lunar South Pole (80°S to 90°S) • 13 Curated Artemis III Candidate Sites  

---

## 1. Executive Summary

At the lunar south pole, the Sun skims the horizon at low elevation angles, with a range that depends on latitude and season. A landing delay of even 24 to 48 hours dramatically shifts solar illumination vectors and direct line-of-sight to Earth.

**Luna Slip Planner** provides mission architects, flight controllers, and the public with interactive model-based feasibility assessments for lunar surface missions. Given a landing site, launch date, and stay duration, it answers:
1. **Is the mission still viable after an $N$-day launch slip?**
2. **What physical terrain feature causes mission failure (exact azimuth and elevation)?**
3. **What are the best rescue alternatives (alternate dates or adjacent site hops)?**

All metrics are derived strictly from precomputed tables combining **LOLA 80 m digital elevation models** and **JPL SPICE DE421 ephemerides** across 35,088 30-minute steps (2027–2028).

---

## 2. Key Architecture & Features

- **Interactive Canvas Heatmap**: Evaluates $>9,500$ mission windows across 13 sites $\times$ 731 dates using TypedArray visibility data and prefix sums.
- **Slip Slider & Tolerance Engine**: Simulates delays from $-15$ to $+60$ days with continuous viable day calculation ($k$ days), fragile window indicators ($<3$ days), and earliest recovery window finder.
- **Sky Visibility Plot**: $0^\circ–360^\circ$ azimuth with an adaptive elevation range displaying the true 720-azimuth LOLA terrain silhouette, wrapped celestial tracks, and labeled center markers.
- **Three.js First-Person Surface Scene**: 60% viewport 3D perspective at $2.0\text{ m}$ eye level with $513 \times 513$ local terrain mesh ($\pm 10\text{ km}$), subtracted spherical lunar curvature $\Delta z = -(e^2 + n^2)/(2R)$, and procedural Earth and solar rendering.
- **Data-Driven "Why" Box & Countdown Badges**: Dynamic countdowns to sunset/sunrise and Earthset/Earthrise; physical obstruction diagnostics pinpointing the obstacle crest elevation and dip angle.
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

## 4. Verification & Validation (V1 – V3; V4 Dropped)

Validation coverage and limitations are recorded in [docs/VALIDATION.md](docs/VALIDATION.md). Synthetic and ephemeris checks are available; independent published-map validation is explicitly dropped. See the [deployment audit](docs/DEPLOYMENT_AUDIT.md) for browser and exported-data checks.

### V1. Synthetic Terrain Sanity Tests (`pipeline/validate/test_horizon.py`)
- **Synthetic flat sphere**: Horizon equals $-0.087^\circ$ for a 2 m observer (geometric dip) across all azimuths (Pass: $-0.087^\circ \pm 0.001^\circ$).
- **1000 m wall at 10 km East**: Horizon at azimuth $90^\circ$ equals $+5.53^\circ$ (Pass: $+5.532^\circ$).
- **Rotational symmetry & pole smoothness**: Max azimuthal elevation jump across 720 rays $<0.27^\circ$, zero NaNs.

### V2. Ephemeris Sanity Bounds (`pipeline/validate/test_ephemeris.py`)
- Diurnal solar rotation matches synodic month ($29.53\text{ days}$).
- Sub-Earth libration bounds remain strictly inside $[-8.5^\circ, +8.5^\circ]$.
- Solar distance $\approx 1.0\text{ AU}$, Earth distance $\approx 384,400\text{ km}$.

### V3. JPL Horizons API Independent Cross-Check (`pipeline/validate/horizons_check.py`)
Cross-checked local SPICE `MOON_ME` vectors against the independent NASA JPL Horizons REST API across two candidate locations (`shackleton-rim` and `connecting-ridge`) and three epochs in 2027 and 2028 (12 comparisons rerun successfully on 2026-11-15):
- Evaluates azimuth and elevation consistency between SPICE DE421 ephemerides and Horizons observer-table outputs.
- *(Full logs in [docs/VALIDATION.md](docs/VALIDATION.md))*.

### V4. Published Map Comparison (Dropped)
Published map raster validation is explicitly dropped and not claimed. The external 18.6-year visibility map rasters (PGDA Product 69) were not sampled locally, and previously cited literature figures were unverified constants. Specifically, libration geometry for Malapert Massif puts Earth at $4^\circ \pm 6.7^\circ$ elevation (above the local horizon roughly 65–70% of the time, matching our computed 64.6% data), showing that our model is physically consistent while the hardcoded 98% benchmark was an inapplicable reference.

---

## 5. Research Findings: Flat Horizon vs Real Topography

Flat-horizon approximations fail catastrophically at the lunar poles:

| Site | Real DEM Sun % | Flat Horizon Sun % | Difference | Dark Gap Error | Viable Days Shift |
|---|---|---|---|---|---|
| **Connecting Ridge (Site 01)** | **71.3%** | 53.4% | **+17.9%** | **-32.8 hrs** (Overestimated) | +26 days |
| **Peak near Shackleton (Site 04)** | **67.7%** | 53.3% | **+14.4%** | **-23.6 hrs** (Overestimated) | +26 days |
| **Malapert Massif** | **34.3%** | 50.4% | **-16.1%** | **+23.5 hrs** (Underestimated) | -93 days |

**Key Takeaways**:
- **On elevated crater ridges**, real terrain acts as a natural solar mast, extending sunlight by up to 18 percentage points and shortening dark gaps by over 30 hours.
- **Near topographic massifs**, distant peaks cast long low shadows that flat models completely ignore, hiding 23-hour blackout periods that would freeze a solar-powered lander.

---

## 6. Two-Minute Demo Script

- Start at Connecting Ridge, January 13, 2027 UTC, using the Artemis 6.5-day preset. The baseline has 100% Sun and Earth LOS; continuous slip tolerance is 5 days.
- Set slip to +5 days: Sun remains 100%; Earth LOS is about 92%.
- Set slip to +7 days: Sun falls to about 84%, Earth LOS to 62%, and the longest dark gap is 26.5 hours. The mission fails the selected constraints.
- Open Site 3D and scrub the timeline. Compare the Sun marker against the measured terrain silhouette and the selected lit threshold. The Why Box describes the longest gap, not necessarily the current scrub time.
- Open Rescue Alternatives and inspect viable dates/sites, then compare pinned scenarios.

---

## 7. Data Sources & Provenance

1. **LOLA South Polar DEM (80 m, 80°S to 90°S)**: NASA Planetary Geodynamics Data Archive (PGDA), Goddard Space Flight Center. Polar stereographic projection in `MOON_ME` reference frame relative to a 1,737.4 km sphere.
2. **NAIF SPICE Kernels**: `de421.bsp`, `naif0012.tls`, `pck00011.tpc`, `moon_pa_de421_1900-2050.bpc`, `moon_080317.tf`.
3. **Mazarico et al. 2011**: *Illumination conditions of the lunar polar regions using LOLA topography*, Icarus 211, 1066–1081.
4. **Barker et al. 2023**: *Improved LOLA Elevation Maps for South Pole Landing Sites*, Planet. Sci. J. 4, 183.

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
