# Slip Planner 🌑

> *My landing slipped N days. Is this site still viable, and what are my alternatives?*

**NASA Space Apps 2026 — Lunar Landing Site Navigator Challenge**

## What it does

Given a candidate lunar south pole landing site, a landing date, and a stay length, Slip Planner reports whether sunlight and a direct line-of-sight to Earth last through the stay — using the **real terrain horizon** rather than a flat one. It then shows how that answer changes if the date or site changes.

## Method

1. **Terrain horizons** computed from LOLA polar DEMs (5–80 m resolution) at 720 azimuths per site, accounting for lunar curvature.
2. **Sun and Earth tracks** from SPICE/DE421 ephemerides at 30-minute intervals across 2027–2028.
3. **Disc-integrated visibility** (32-point sampling) determines partial vs. full illumination and Earth link availability.
4. **Offline pipeline** writes static JSON/binary artifacts; the React/Three.js frontend reads them with no runtime server.

## Data sources

| ID | Source | Citation |
|----|--------|----------|
| D1 | LOLA 20 m South Polar DEM | PGDA, NASA GSFC |
| D2 | LOLA 40 m / 80 m DEMs | PGDA |
| D4 | 5 m Site DEMs | PGDA Product 78 |
| D5 | SPICE kernels (DE421) | NAIF/JPL |
| D7 | Mazarico et al. 2011 maps | Icarus 211, 1066 |

See [docs/SOURCES.md](docs/SOURCES.md) for full provenance.

## References

- Barker, M.K., et al. 2023. *Improved LOLA Elevation Maps for South Pole Landing Sites*. Planet. Sci. J. 4, 183.
- Mazarico, E., et al. 2011. *Illumination conditions of the lunar polar regions using LOLA topography*. Icarus 211, 1066–1081.

## Stack

**Pipeline**: Python 3.13, numpy, scipy, rasterio, pyproj, spiceypy  
**Frontend**: Node 20, Vite, React 18, TypeScript, Three.js, D3, zustand

### Installed versions

*(recorded at install time)*

- numpy 2.5.4
- scipy 1.18.1
- rasterio 1.5.2
- pyproj 3.8.0
- spiceypy 8.4.0
- pyyaml 6.0.3
- pytest 9.2.0
- matplotlib 3.11.2

## Setup

```bash
# Python environment
python -m venv .venv
.venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements.txt

# Download SPICE kernels
python -m pipeline.fetch_kernels

# Run pipeline
python -m pipeline.run_all

# Frontend
cd web
npm install
npm run dev
```

## Validation

See [docs/VALIDATION.md](docs/VALIDATION.md) for test results.

## Important disclaimers

- **All planning parameters (stay duration, illumination thresholds, etc.) are user-editable assumptions, NOT NASA requirements.**
- Results use a 2 m observer height by default, representing a lander-top viewpoint.
- The 3D scene is illustrative; all metrics come from precomputed tables.

## License

MIT
