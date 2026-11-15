# Luna Slip Planner — project and submission details

Scientific figures below come only from the final [VALIDATION.md](docs/VALIDATION.md). Archived research outputs are not submission results.

## Project summary

Luna Slip Planner explores how a delayed lunar surface stay changes modeled sunlight and geometric Earth visibility. Users select a study point, a landing date, and editable mission assumptions, then compare model estimates for delayed dates and nearby alternatives. The application uses precomputed LOLA terrain horizons and NAIF SPICE geometry; it does not certify landing safety, energy sufficiency, traversability, or a radio link.

## Results and limitations

Production uses the **LOLA 80 m DEM**. The final published-map comparison has a median absolute Sun difference of **1.06 percentage points**, but the median conceals large disagreements: **Connecting Ridge is 32.33 percentage points below the published center pixel**, and the alternate Malapert point is **26.23 points below**. **Three body/site values** fall outside their published neighborhood ranges. These are model estimates, and micro-siting remains a possible explanation rather than a demonstrated cause. Additionally, the published-map comparator previously checked only the disc center azimuth; a corrected version is now in use but its effect on the reported differences has not been measured. The numbers above are outputs of the approximate comparator and should not be treated as final accuracy figures.

The published-map comparison uses a different time span, observer height, and visibility definition from the interactive app. It does not validate any particular mission window. The previous 20 m study was withdrawn because its terrain windows and missing-data fallbacks were invalid. **A valid 20 m comparison is pending.** The app does not use the 20 m DEM in production.

## NASA data and services used

| Source | Product or service | Actual use |
|---|---|---|
| [NASA PGDA Product 69](https://pgda.gsfc.nasa.gov/products/69) | `AVGVISIB_65S_240M_201608.TIF` | Published solar-visibility reference raster sampled by the comparison script. |
| [NASA PGDA Product 69](https://pgda.gsfc.nasa.gov/products/69) | `AVGVISIB_65S_240M_201608_EARTH.TIF` | Published Earth-visibility reference raster sampled by the comparison script. |
| [LOLA south-polar terrain](https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_80MPP_ADJ.TIF) | `LDEM_80S_80MPP_ADJ.TIF` | Production observer heights, terrain horizons, and terrain visualization. The folder name contains `20mpp`, but this file is the 80 m product. |
| [NASA/JPL NAIF SPICE](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) | `de421.bsp`, `naif0012.tls`, `pck00011.tpc`, `moon_pa_de421_1900-2050.bpc`, `moon_080317.tf` | Celestial positions, time conversion, and lunar reference-frame definitions. |
| [NASA/JPL Horizons API](https://ssd.jpl.nasa.gov/api/horizons.api) | Observer-table azimuth and elevation | External ephemeris cross-check; not the browser's runtime source. |

The 20 m DEM and WAC movie are excluded from the submitted used-data list. The former research study is withdrawn; the movie is not used by the final app or final validation.

## AI disclosure

AI coding assistants were used during development for code, debugging, tests, and documentation. This remediation and repository verification used OpenAI Codex. Scientific model outputs are computed from the stated terrain and ephemeris inputs; they are not invented by a language model. AI-assisted review is a self-review, not independent scientific certification. Synthetic terrain and simulated API failures are used only as test fixtures, and some visual appearance assets are procedural.

## Submission links

- Repository: https://github.com/ashihams/luna
- Live application: https://lunaslipplanner.vercel.app
- Final scientific results: https://github.com/ashihams/luna/blob/main/docs/VALIDATION.md
- Source provenance: https://github.com/ashihams/luna/blob/main/docs/SOURCES.md

## Copy-ready submission fields

**Project name:** Luna Slip Planner

**Short description:** Explore model estimates of lunar sunlight and geometric Earth visibility after a landing delay, using real terrain and ephemeris inputs with explicit uncertainty.

**Project details:** Use the Project summary and Results and limitations sections above.

**NASA data:** Use the NASA data and services used table above; do not list withdrawn or unused products.

**AI use:** Yes — use the AI disclosure above.

**Source code URL:** https://github.com/ashihams/luna

**Demo URL:** https://lunaslipplanner.vercel.app

These are repository submission fields. Updating this file does not itself save an external event submission form.
