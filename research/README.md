# Research status

The former 20 m study is withdrawn. See `sensitivity_dem20.json` for current status and `../docs/VALIDATION.md` for the reasons.

Files named `*_legacy.*` and the withdrawal-marked `sensitivity_dem20.csv` preserve invalid historical outputs for review. Do not use them as predictions, validation, or evidence that 20 m improves accuracy.

After valid terrain acquisition, `python research/sensitivity.py` recomputes a comparison using the app's default mission thresholds and actual DEM ground heights. `python -m pipeline.validate.pgda_compare --variant dem20` independently compares those horizons with published maps over the long-run period. Neither has completed with valid 20 m windows in this review.
