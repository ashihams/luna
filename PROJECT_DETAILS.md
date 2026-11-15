# Project Details: Luna Slip Planner

**Challenge:** Lunar Landing Site Navigator  
**Event:** NASA International Space Apps Challenge 2026  
**Live Application:** [https://lunaslipplanner.vercel.app](https://lunaslipplanner.vercel.app)  
**Source Code:** [https://github.com/ashihams/luna](https://github.com/ashihams/luna)  

---

## 1. What It Does and How It Works

Luna Slip Planner is a full-stack, real-time mission planning and contingency navigation platform built to answer the central operational question:
> **"Our lunar landing slipped $N$ days. Is our target landing site still viable, and if not, what are our best alternatives?"**

At the lunar south pole, low grazing solar vectors (elevations fluctuating between $-1.5^\circ$ and $+1.5^\circ$) mean that even a 24-to-48-hour launch slip drastically alters surface illumination and line-of-sight to Earth. A sunlit plateau can quickly become trapped in the deep shadow of an adjacent crater rim, causing fatal battery depletion and communications blackouts.

Luna Slip Planner resolves this operational challenge through an integrated three-tier architecture:

### A. Astrodynamics & Topography Pipeline
* **NASA JPL SPICE Ephemeris:** Evaluates planetary ephemerides using DE421 kernels (`de421.bsp`), planetary constants (`pck00010.tpc`), and the lunar body-fixed frame (`MOON_ME`). Solar and terrestrial position vectors are evaluated every 30 minutes over a continuous two-year mission window (2027–2028, 35,088 discrete time steps).
* **Ray-Marched Horizon Profiles:** Ingests Lunar Reconnaissance Orbiter (LRO) LOLA 80 m/pixel Digital Elevation Models (DEM) in polar stereographic projection covering $80^\circ\text{S}$ to $90^\circ\text{S}$. For each of the 13 candidate Artemis III landing sites, radial rays are cast at $0.5^\circ$ azimuth resolution (720 azimuth bins per site) up to 120 km from an observer height of 2.0 m above terrain. Surface curvature drop is calculated explicitly:
  $$\Delta z_{\text{curv}} = \frac{d^2}{2 R_{\text{Moon}}}$$
* **Solar Disk & Telecom Obscuration:** The pipeline models the Sun's finite angular diameter ($0.53^\circ$) and evaluates visible disk percentage against the terrain horizon. Direct-to-Earth line-of-sight (LOS) calculates terrain clearance angles against tunable ground antenna elevation masks.

### B. Real-Time Viability Matrix & Slip Engine
* **Constraint Evaluation Engine:** Evaluates a $13 \times 731$ viability matrix (13 candidate sites over 731 calendar days) against five critical mission constraints:
  1. **Surface Stay Duration:** User-selectable (e.g., 6.5 days for Artemis III, 14 days for CLPS).
  2. **Minimum Cumulative Sunlight:** Total illuminated hours required for power generation.
  3. **Maximum Allowable Dark Gap:** Critical battery survival limit before cryogenic chill down.
  4. **Maximum Allowable Comm Outage:** Permissible loss-of-signal (LOS) duration to Earth.
  5. **Elevation Angle Masks:** Minimum antenna/solar panel clearance angles above terrain.
* **Scrubbable Slip Timeline:** An interactive slip slider ($-15$ to $+60$ days) triggers instantaneous client-side re-evaluations, live countdown clocks (time-to-sunset, time-to-sunrise, time-to-Earthset, time-to-Earthrise), and telemetry badges.

### C. Automated Mission Rescue & Multi-Scenario Comparison
* **Rescue Recommendation Algorithm:** When a slip breaches mission constraints, the engine scans the spatiotemporal solution space to compute and rank viable contingency options:
  1. **Slip Recovery:** The nearest subsequent viable launch window at the original landing site.
  2. **Geometric Site Hop:** Evaluates alternative candidate Artemis sites on the slipped date, calculating great-circle surface distance ($R_{\text{Moon}} = 1737.4\text{ km}$) and ranking viable alternatives by proximity (closest distance first) to minimize surface relocation distance.
* **Side-by-Side Comparison Drawer:** Allows flight directors to pin multiple scenarios, compare multi-criteria score deltas, and review trade-offs between stay duration, dark gaps, and Earth visibility.

### D. 3D Surface Scene & Physical Obstruction "Why Box"
* **First-Person Surface Horizon View (Three.js):** Displays the lunar terrain silhouette, real-time sub-solar vector, sub-Earth vector, procedural celestial bodies, and dynamic solar illumination.
* **300×300 km Polar Stereographic Overview:** Renders the full lunar south polar cap ($80^\circ\text{S}$–$90^\circ\text{S}$) with interactive 3D orbit controls and color-coded site viability markers (green for viable, red for failed constraints).
* **The "Why Box":** Demystifies failure modes by providing explicit geometric diagnostic data (e.g., *"At azimuth 124.5°, Sun center elevation of +1.12° dips 0.48° below the crater rim crest at +1.60°, causing an unrecoverable 32.5-hour dark gap"*), conclusively demonstrating why flat-horizon approximations produce catastrophic errors.

---

## 2. Key Benefits

* **Zero-Latency Mission Planning:** Converts complex astrodynamics ephemeris and horizon calculations into instant, interactive feedback during launch slip evaluations.
* **True Topographic Fidelity:** Captures micro-relief occultations caused by prominent massifs (e.g., Malapert Massif, Connecting Ridge, Shackleton rim) that simplified geometric models overlook.
* **Multi-Class Mission Support:** Pre-configured presets support crewed lunar exploration (Artemis III 6.5d), commercial landers (CLPS 14d), polar rovers (VIPER-class cold-trap reconnaissance), and permanent lunar habitat outposts.
* **Quantitative Risk Mitigation:** Directly protects surface assets from unpredicted cryogenic battery exhaustion and telecommunication blackouts.

---

## 3. Intended Impact

As humanity prepares for a sustained presence on the Moon under the Artemis campaign and commercial lunar programs, launch delays are an operational certainty due to weather, trajectory constraints, or hardware checks. 

Luna Slip Planner equips flight dynamics officers, mission planners, commercial payload operators, and planetary scientists with an open-access decision-support engine. By bridging the gap between raw planetary data and human operational decisions, it reduces mission planning latency, enhances crew safety, and provides clear visibility into lunar polar landing dynamics.

---

## 4. Tools, Coding Languages, and Technologies

### Astrodynamics & Science Processing
* **Python 3.11 / 3.13:** Scientific pipeline and data modeling.
* **NASA JPL SPICE (SpiceyPy / CSPICE):** Planetary ephemeris kernels (`de421.bsp`), planetary constants (`pck00010.tpc`), and lunar body-fixed reference frames (`MOON_ME`).
* **NumPy & SciPy:** Vectorized ray-marching, horizon profile calculations, and matrix operations.
* **GDAL & Rasterio:** Parsing LOLA 80 m/pixel Digital Elevation Model IMG rasters and polar stereographic spatial transformations.

### Frontend Architecture & Interactive Visualization
* **TypeScript & React 18:** Resilient, type-safe reactive user interface.
* **Three.js (WebGL):** 3D real-time rendering of the 300×300 km polar DEM mesh, procedural Earth with atmospheric glow, and first-person lunar surface terrain.
* **D3.js:** Azimuth-elevation sky plots, ephemeris tracks, and the interactive $13 \times 731$ viability heatmap matrix.
* **Tailwind CSS & Synapse Design System:** High-contrast Vantablack (`#030303`) theme, Instrument Serif typography, glassmorphism, and responsive mission HUD panels.
* **Zustand:** Ultra-fast, client-side state store.

### Deployment & Infrastructure
* **Vite:** High-performance ES module bundler.
* **Vercel:** Globally distributed edge hosting and continuous delivery ([lunaslipplanner.vercel.app](https://lunaslipplanner.vercel.app)).
* **GitHub:** Open-source version control and collaborative development ([github.com/ashihams/luna](https://github.com/ashihams/luna)).

---

## 5. Creativity & Innovation

* **Data-Driven "Why Box":** Rather than providing an opaque red/green indicator, the platform details the exact topographic feature causing failure, pinpointing the azimuth, solar elevation, and ridge height.
* **Sub-Pixel Solar Disk Integration:** Implements partial disk concealment against the horizon, accurately modeling power transitions during grazing sunrise and sunset.
* **Editorial-Grade "Synapse" Interface:** Combines the rigorous data density of mission control displays with an elegant, modern editorial interface featuring live tickers, glassmorphism telemetry cards, and smooth micro-interactions.
* **Autonomous Rescue Routing:** Transforms passive failure detection into an active recommendation system that automatically routes missions to alternative sites or subsequent viable landing windows.

---

## 6. Critical Factors Considered

1. **Grazing Polar Illumination Geometry:** The Moon's low axial tilt ($1.54^\circ$ to the ecliptic) causes solar rays to strike the south pole almost horizontally. Local crater rims cast shadows tens of kilometers long, making high-resolution topography the dominant parameter.
2. **Lunar Surface Curvature:** Calculated quadratic drop-off ($\Delta z = d^2 / 2R_{\text{Moon}}$) across 120 km sightlines to prevent artificial overestimation of distant ridge heights.
3. **Earth Libration & Draconic Oscillations:** Tracked the $\pm 7^\circ$ apparent wobble of Earth in the lunar sky over the 27.3-day draconic period and enforced minimum antenna elevation masks to counter ground multipath interference.
4. **Cryogenic Battery Thermal Reserves:** Factored in realistic battery survival times under cryogenic conditions (12–24 hours max dark gap) to prevent permanent mission loss.
5. **Operational Human Factors:** Engineered responsive browser history synchronization and immediate contingency options so mission operators can pivot landing strategies in seconds.
