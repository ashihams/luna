"""Bilinear sampling at GeoTIFF pixel centers; missing terrain stays missing."""
import numpy as np
from scipy.ndimage import map_coordinates


def sample_projected(level, x, y):
    data = np.asarray(level['data'], dtype=np.float32)
    cols, rows = ~level['transform'] * (np.asarray(x), np.asarray(y))
    # Rasterio's affine maps pixel corners; scipy's index 0 is the first center.
    rows, cols = np.asarray(rows) - 0.5, np.asarray(cols) - 0.5
    valid = (rows >= 0) & (rows <= data.shape[0] - 1) & (cols >= 0) & (cols <= data.shape[1] - 1)
    nodata = level.get('nodata')
    if nodata is not None and np.isfinite(nodata):
        data = np.where(data == nodata, np.nan, data)
    coords = np.vstack([rows.ravel(), cols.ravel()])
    sampled = map_coordinates(data, coords, order=1, mode='nearest').reshape(rows.shape)
    return np.where(valid, sampled, np.nan)
