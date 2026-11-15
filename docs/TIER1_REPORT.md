# Implementation and scientific self-review

2026-11-15. This report was prepared during AI-assisted development of Luna Slip Planner. It is a self-review, not an independent audit, certification, NASA endorsement, or flight-readiness assessment.

The planner uses precomputed LOLA 80 m terrain horizons and NAIF SPICE tracks. All 13 production sites were regenerated after correcting pixel registration, cache-coordinate handling, and site provenance. The API cross-check and production reproduction results are linked in [VALIDATION.md](VALIDATION.md).

The corrected published-map comparison (using any-disc boundary search, documented in [PGDA_RERUN_RESULTS.md](PGDA_RERUN_RESULTS.md)) has a median absolute Sun difference of 1.07 percentage points and Earth difference of 0.18 percentage points; 7 sites agree within 1.1 points for Sun, and 8 sites agree within 0.4 points for Earth. Comparison completion is not a pass certificate. Micro-siting is a hypothesis, not an established explanation.

Individual center-pixel disagreements remain large: 32.31 points for Connecting Ridge Sun (44.47% vs 76.78%) and 26.20 for the alternate Malapert Sun estimate (54.76% vs 80.96%). Neighborhood inclusion does not validate either prediction.

The old 20 m sensitivity report is withdrawn because misplaced windows and silent missing-data fallbacks invalidated it. Higher resolution has not been shown to improve accuracy. Production remains 80 m and shows a provisional uncertainty notice.

No fabricated metric values were found in the reviewed browser calculation path. However, the old terrain fallback fabricated plausible inputs, and the landing page contained a hardcoded example result and an invalid API example. Both were corrected. Tests deliberately use synthetic fixtures and failed-API mocks; visual textures and stars are procedural. A blanket “zero mocked numbers” claim would be misleading.

Site coordinates are sourced study points or explicitly labeled approximations. They are not all independently verified current Artemis III landing candidates. The previous coordinate signs and Site04/Site07 association were wrong.

The distance calculation is lunar great-circle distance. Nearby viable alternatives are ranked by viability, distance, and score; this does not establish traversability or operational accessibility.

See [deployment checks](DEPLOYMENT_AUDIT.md), [source provenance](SOURCES.md), and [numerical limitations](VALIDATION.md) for the evidence and remaining work.
