"""Reproduce the Task 1 comparator defect without changing production files.

Run from the repository root with: python -m research.accuracy.run_criterion_diagnostic
The frozen 80 m horizon is ONLY a comparator witness, not a like-for-like run.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
import spiceypy as spice
from pipeline.config_loader import load_config, load_sites
from pipeline.validate.pgda_compare import compute_longrun_ephemeris
from pipeline.validate.accuracy_disc import any_disc_visible, horizon_at

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'data/out_accuracy'
RESEARCH = ROOT / 'research/accuracy'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def production_snapshot():
    return {p.relative_to(ROOT).as_posix(): sha(p)
            for p in sorted((ROOT / 'web/public/data').rglob('*')) if p.is_file()}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    before = production_snapshot()
    (OUT / 'production-before.json').write_text(json.dumps(before, indent=2))
    cfg = load_config()
    site = next(s for s in load_sites() if s['id'] == 'connecting-ridge')
    path = RESEARCH / 'frozen_horizon_0m_connecting-ridge.json'
    expected_horizon = 'fb12650208a29fa726a2ac9502eaca8c4d7e81581eadf2ebe1633be3ac42d5fc'
    if sha(path) != expected_horizon:
        raise ValueError('Frozen reproduction horizon changed; do not silently substitute terrain')
    frozen = json.loads(path.read_text())
    horizon = np.asarray(frozen['horizon_deg'])
    kernel_hashes = {}
    for name in cfg['SPICE_KERNELS']:
        kernel = ROOT / 'data/cache/kernels' / name
        spice.furnsh(str(kernel))
        kernel_hashes[name] = sha(kernel)
    # Preserve the old comparator's settings for this controlled reproduction.
    # Neither this epoch nor this number of steps is asserted to match PGDA.
    ets = spice.str2et('2009-07-13T17:33:17') + np.arange(163165) * 3600.
    sun, _ = spice.spkpos('SUN', ets, 'MOON_ME', cfg['ABCORR'], 'MOON')
    earth, _ = spice.spkpos('EARTH', ets, 'MOON_ME', cfg['ABCORR'], 'MOON')
    np.savez(OUT / 'moon_centered_vectors.npz', ets=ets, sun=sun, earth=earth)
    tracks = compute_longrun_ephemeris(ets, site, 0, frozen['z0_m'], sun, earth,
                                      cfg['R_SUN_KM'], cfg['R_EARTH_KM'], cfg['R_MOON_M'])
    results = []
    for body, (azs, els, radii) in zip(['Sun', 'Earth'], [tracks[:3], tracks[3:]]):
        old = els + radii > horizon_at(azs, horizon, .5)
        candidates = np.flatnonzero(~old & (els + radii > horizon.min()))
        found = None
        for i in candidates:
            visible, witness = any_disc_visible(azs[i], els[i], radii[i], horizon)
            if not visible:
                continue
            a, e = witness
            dot = (np.sin(np.radians(e)) * np.sin(np.radians(els[i])) +
                   np.cos(np.radians(e)) * np.cos(np.radians(els[i])) *
                   np.cos(np.radians(a - azs[i])))
            separation = np.degrees(np.arccos(np.clip(dot, -1, 1)))
            found = dict(body=body, sample_index=int(i), utc=spice.et2utc(ets[i], 'ISOC', 3),
                         center_az_deg=float(azs[i]), center_el_deg=float(els[i]),
                         radius_deg=float(radii[i]), center_horizon_deg=float(horizon_at(azs[i], horizon, .5)),
                         old_upper_limb_visible=False, proposed_any_disc_visible=True,
                         witness_az_deg=a, witness_el_deg=e,
                         witness_horizon_deg=float(horizon_at(a, horizon, .5)),
                         witness_separation_deg=float(separation),
                         witness_clearance_deg=float(e - horizon_at(a, horizon, .5)))
            assert separation <= radii[i] + 1e-8
            assert found['witness_clearance_deg'] > 0
            break
        results.append(found or dict(body=body, status='no counterexample found'))
        print(json.dumps(results[-1]), flush=True)
    spice.kclear()
    record = dict(status='comparator_defect_reproduced',
                  scope='Frozen 80 m Connecting Ridge horizon; NOT a like-for-like published-map test',
                  horizon_file=path.relative_to(ROOT).as_posix(), horizon_sha256=sha(path),
                  original_horizon_file='data/out_longrun_dem80/horizon_0m_connecting-ridge.json',
                  config_sha256=sha(ROOT / 'config/config.yaml'),
                  sites_sha256=sha(ROOT / 'config/sites.json'),
                  kernel_sha256=kernel_hashes, epoch_utc='2009-07-13T17:33:17',
                  steps=len(ets), cadence_seconds=3600, observer_height_m=0,
                  ground_height_m=frozen['z0_m'], aberration=cfg['ABCORR'],
                  moon_vector_sha256=sha(OUT / 'moon_centered_vectors.npz'),
                  results=results, aggregate_impact_pp=None,
                  reason='Stop after first witness per body; overall impact not measured')
    (RESEARCH / 'criterion_diagnostic.json').write_text(json.dumps(record, indent=2) + '\n')
    assert production_snapshot() == before


if __name__ == '__main__':
    main()
