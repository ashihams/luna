# Slip Planner 🌑
> *My landing slipped N days. Is this site still viable, and what are my alternatives?*

**NASA Space Apps 2026 — Challenge: Lunar Landing Site Navigator**  
**Live Application:** [https://dist-seven-psi-39.vercel.app](https://dist-seven-psi-39.vercel.app)  
**Target Region:** Lunar South Pole (80°S to 90°S) • 14 Curated Artemis III Candidate Sites  

---

## 1. Executive Summary

At the lunar south pole, the Sun skims the rugged topographic horizon at grazing elevation angles between $-2^\circ$ and $+2^\circ$. A landing delay of even 24 to 48 hours dramatically shifts solar illumination vectors and direct line-of-sight to Earth.

**Slip Planner** provides mission architects, flight controllers, and the public with instant, rigorous feasibility assessments for lunar surface missions. Given a landing site, launch date, and stay duration, it answers:
1. **Is the mission still viable after an $N$-day launch slip?**
2. **What physical terrain feature causes mission failure (exact azimuth and elevation)?**
3. **What are the best rescue alternatives (alternate dates, adjacent sites, or optimal polar windows)?**

All metrics are derived strictly from precomputed tables combining **LOLA 80 m digital elevation models** and **JPL SPICE DE421 ephemerides** across 35,088 30-minute steps (2027–2028).

---

## 2. Key Architecture & Features

- **Interactive Canvas Heatmap (60 FPS)**: Evaluates $>10,200$ mission windows across 14 sites $\times$ 731 dates in $<25\text{ ms}$ via TypedArray prefix sums.
- **Slip Slider & Tolerance Engine**: Simulates delays from $-15$ to $+60$ days with continuous viable day calculation ($k$ days), fragile window indicators ($<3$ days), and earliest recovery window finder.
- **D3 Sky Visibility Plot**: $0^\circ–360^\circ$ azimuth by $-5^\circ$ to $+10^\circ$ elevation displaying the true 720-azimuth LOLA terrain silhouette, wrapped celestial tracks, and discs at true angular size (Sun $\approx 0.26^\circ$, Earth $\approx 0.95^\circ$).
- **Three.js First-Person Surface Scene**: 60% viewport 3D perspective at $2.0\text{ m}$ eye level with $513 \times 513$ local terrain mesh ($\pm 10\text{ km}$), subtracted spherical lunar curvature $\Delta z = -(e^2 + n^2)/(2R)$, and a procedural 19 km horizon occlusion ring.
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

## 4. Verification & Validation (V1 – V4)

Every pipeline step was validated against independent reference benchmarks before UI implementation:

### V1. Synthetic Terrain Sanity Tests (`pipeline/validate/test_horizon.py`)
- **Synthetic flat sphere**: Horizon equals $-0.087^\circ$ for a 2 m observer (geometric dip) across all azimuths (Pass: $-0.087^\circ \pm 0.001^\circ$).
- **1000 m wall at 10 km East**: Horizon at azimuth $90^\circ$ equals $+5.53^\circ$ (Pass: $+5.532^\circ$).
- **Rotational symmetry & pole smoothness**: Max azimuthal elevation jump across 720 rays $<0.27^\circ$, zero NaNs.

### V2. Ephemeris Sanity Bounds (`pipeline/validate/test_ephemeris.py`)
- Diurnal solar rotation matches synodic month ($29.53\text{ days}$).
- Sub-Earth libration bounds remain strictly inside $[-8.5^\circ, +8.5^\circ]$.
- Solar distance $\approx 1.0\text{ AU}$, Earth distance $\approx 384,400\text{ km}$.

### V3. JPL Horizons API Independent Cross-Check (`pipeline/validate/horizons_check.py`)
Cross-checked local SPICE `MOON_ME` vectors against the independent NASA JPL Horizons REST API across multiple sites and epochs in 2027 and 2028:
$$\Delta\text{Azimuth} = 0.0000^\circ, \quad \Delta\text{Elevation} = 0.0000^\circ$$
*(Full logs in [docs/VALIDATION.md](docs/VALIDATION.md))*.

### V4. PGDA Product 69 Comparison (`pipeline/validate/pgda_compare.py`)
Compared long-term Earth visibility against Mazarico et al. (2011) / PGDA Product 69 (10 m observer height):
- **Shackleton Rim**: 49.0% vs Mazarico 53.0% ($-4.0\%$ diff due to 80m vs 240m DEM sampling)
- **Connecting Ridge Crest**: 53.4% vs Mazarico 58.0% ($-4.6\%$ diff)
- **de Gerlache Rim**: 57.1% vs Mazarico 62.0% ($-4.9\%$ diff)  
All within the required $\le 5.0\%$ target threshold.

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

- **[0:00 - 0:25] The Slip Question**:
  *"Welcome to Slip Planner. In lunar polar exploration, landing dates frequently slip due to orbital mechanics or launch delays. If our Artemis III landing at Connecting Ridge slips by 5 days, is the site still viable, or will the crew land in darkness?"*
- **[0:25 - 0:50] Heatmap & Slip Slider**:
  *"On the main planner, we see 14 candidate sites across 731 days of 2027 and 2028. We drag the slip slider to +5 days. The primary indicator stays green: our slip tolerance is 9 continuous days, with 89% sunlight and a maximum dark gap of only 11.5 hours."*
- **[0:50 - 1:15] Simulating Failure & The Rescue Panel**:
  *"Now let's drag the slip slider to +14 days. The badge flips to red: SLIP FAILED. The longest dark gap has spiked to 38 hours, exceeding the 24-hour battery endurance limit. Instantly, the Rescue Panel recommends alternatives: shifting the date by +3 days restores viability, or switching to Shackleton Rim provides an immediate 92% solar score."*
- **[1:15 - 1:40] 3D First-Person Perspective & The 'Why' Box**:
  *"We switch to the Site View. Sitting 2 meters above the lunar surface in full 3D, we scrub to the start of the dark gap. The 'Why' Box pinpoints the cause: terrain at azimuth 124.5° rising to +2.8° crest elevation occludes the Sun, which has dipped to +0.9°. The 19 km horizon occlusion ring physically cuts off the solar disc."*
- **[1:40 - 2:00] Pole Overview & Summary**:
  *"Finally, the 3D Pole Overview displays the entire 300 km polar cap, with interactive pins showing which candidate sites are viable on this slipped date. Slip Planner transforms complex orbital geometry into actionable, life-saving mission decisions."*

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
