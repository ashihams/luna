import numpy as np
import pytest
import rasterio
from rasterio.transform import from_origin
from pipeline.raster_sampling import sample_projected
from pipeline.horizon import sample_point_height, compute_horizon
from pipeline import terrain


def test_pixel_centers_and_nodata():
    level = dict(data=np.array([[10, 20, 30], [40, 50, 60], [70, 80, 90]], dtype='float32'),
                 transform=from_origin(0, 3, 1, 1), nodata=-9999)
    assert sample_projected(level, 0.5, 2.5) == 10
    assert sample_projected(level, 1.5, 1.5) == 50
    assert sample_projected(level, 1, 2) == 30
    assert np.isnan(sample_projected(level, -1, 2))
    level['data'][1, 1] = -9999
    assert np.isnan(sample_projected(level, 1.5, 1.5))


def test_missing_observer_never_becomes_zero_height():
    level = dict(data=np.ones((4, 4), dtype='float32'),
                 transform=from_origin(10000, 10000, 20, 20),
                 crs='+proj=stere +lat_0=-90 +lon_0=0 +R=1737400')
    with pytest.raises(ValueError, match='no valid DEM ground height'):
        sample_point_height(level, -90, 0)
    with pytest.raises(ValueError, match='requires a near DEM'):
        compute_horizon(dict(lat_deg=-89, lon_deg_east=0), {}, variant='dem20')


def test_window_registration_and_cache_coordinates(tmp_path, monkeypatch):
    monkeypatch.setattr(terrain, 'cache_dir', lambda: tmp_path)
    path = tmp_path / 'source.tif'
    data = np.arange(10000, dtype='float32').reshape(100, 100)
    with rasterio.open(path, 'w', driver='GTiff', width=100, height=100,
                       count=1, dtype='float32', transform=from_origin(0, 100, 1, 1),
                       crs='+proj=stere +lat_0=-90 +lon_0=0 +R=1737400') as dst:
        dst.write(data, 1)
    window = terrain.acquire_window_from_raster(str(path), 40.2, 60.7, 5, 'same-site')
    assert sample_projected(window, 40.5, 60.5) == data[39, 40]
    assert terrain.acquire_window_from_raster(str(path), 40.2, 60.7, 5, 'same-site')['cached']
    moved = terrain.acquire_window_from_raster(str(path), 70.2, 30.7, 5, 'same-site')
    assert not moved['cached']
    assert sample_projected(moved, 70.5, 30.5) == data[69, 70]
