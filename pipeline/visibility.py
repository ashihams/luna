"""
pipeline/visibility.py
Disc-Integrated Solar and Earth Visibility Engine.
Implements Section 12 of the Slip Planner specification.

Calculates disc-sampled visibility percentage (0 to 100%) for Sun and Earth
against precomputed terrain horizon at 30-minute intervals over 2027-2028.
Also computes Earth clearance angle in degrees.
"""
import numpy as np


def compute_disc_visibility(body_az_deg: np.ndarray,
                            body_el_deg: np.ndarray,
                            body_rho_deg: np.ndarray,
                            horizon_deg: np.ndarray,
                            az_step_deg: float = 0.5,
                            n_disc_samples: int = 32) -> np.ndarray:
    """
    Sample the celestial body's disc with N equal-area points (Fibonacci spiral / Vogel's method).
    For k in 0..N-1:
      r_k = rho * sqrt((k + 0.5) / N)
      phi_k = k * 2.399963 rad (golden angle)
      el_k = el + r_k * sin(phi_k)
      az_k = az + r_k * cos(phi_k) / max(cos(radians(el)), 0.05)
    A sample is visible if el_k > horizon(az_k).
    Returns: vis_pct uint8 array (N_STEPS,) in range [0, 100].
    """
    n_steps = len(body_az_deg)
    k_indices = np.arange(n_disc_samples, dtype=np.float32)

    # Precompute sample pattern offsets
    # r_frac = sqrt((k + 0.5) / N) -> shape (n_disc_samples,)
    r_frac = np.sqrt((k_indices + 0.5) / float(n_disc_samples))
    phi_k = k_indices * 2.399963  # radians
    sin_phi = np.sin(phi_k)  # (n_disc_samples,)
    cos_phi = np.cos(phi_k)  # (n_disc_samples,)

    # horizon lookup interpolation function
    n_az = len(horizon_deg)
    horizon_extended = np.append(horizon_deg, horizon_deg[0])  # for 360 wraparound

    def lookup_horizon(az_arr):
        """az_arr in degrees [0, 360). Linear interpolation."""
        az_mod = np.mod(az_arr, 360.0)
        idx_float = az_mod / az_step_deg
        idx_low = np.floor(idx_float).astype(np.int32) % n_az
        idx_high = (idx_low + 1) % n_az
        frac = idx_float - np.floor(idx_float)
        return (1.0 - frac) * horizon_deg[idx_low] + frac * horizon_deg[idx_high]

    # Process in chunks to maintain vectorization while keeping memory bounded
    chunk_size = 4096
    vis_pct = np.zeros(n_steps, dtype=np.uint8)

    for start_i in range(0, n_steps, chunk_size):
        end_i = min(start_i + chunk_size, n_steps)
        az_c = body_az_deg[start_i:end_i]     # (M,)
        el_c = body_el_deg[start_i:end_i]     # (M,)
        rho_c = body_rho_deg[start_i:end_i]   # (M,)

        # Disc radius for each step: (M, n_disc_samples)
        r_k = rho_c[:, np.newaxis] * r_frac[np.newaxis, :]
        el_k = el_c[:, np.newaxis] + r_k * sin_phi[np.newaxis, :]

        cos_el_denom = np.maximum(np.cos(np.radians(el_c)), 0.05)[:, np.newaxis]
        az_k = az_c[:, np.newaxis] + (r_k * cos_phi[np.newaxis, :]) / cos_el_denom

        # Lookup horizon at all sample points: (M, n_disc_samples)
        h_k = lookup_horizon(az_k)

        # Count visible samples
        visible = np.sum(el_k > h_k, axis=1)  # (M,)
        pct = np.round(100.0 * visible / float(n_disc_samples)).astype(np.uint8)
        vis_pct[start_i:end_i] = pct

    return vis_pct


def compute_earth_clearance(earth_az_deg: np.ndarray,
                            earth_el_deg: np.ndarray,
                            horizon_deg: np.ndarray,
                            az_step_deg: float = 0.5) -> np.ndarray:
    """
    earth_clearance = el_center - horizon(az_center), in degrees.
    Returns: float32 array of length N_STEPS.
    """
    n_az = len(horizon_deg)

    az_mod = np.mod(earth_az_deg, 360.0)
    idx_float = az_mod / az_step_deg
    idx_low = np.floor(idx_float).astype(np.int32) % n_az
    idx_high = (idx_low + 1) % n_az
    frac = idx_float - np.floor(idx_float)
    h_center = (1.0 - frac) * horizon_deg[idx_low] + frac * horizon_deg[idx_high]

    clearance = earth_el_deg - h_center
    return clearance.astype(np.float32)


def compute_site_visibility_products(ephem: dict,
                                     horizon_deg: np.ndarray,
                                     az_step_deg: float = 0.5,
                                     n_disc_samples: int = 32) -> dict:
    """
    Compute complete set of visibility products for a site.
    Returns:
      - sun_az: (N_STEPS,)
      - sun_el: (N_STEPS,)
      - earth_az: (N_STEPS,)
      - earth_el: (N_STEPS,)
      - earth_clearance: (N_STEPS,) in degrees
      - sun_vis_pct: (N_STEPS,) uint8
      - earth_vis_pct: (N_STEPS,) uint8
    """
    sun_vis_pct = compute_disc_visibility(
        ephem["sun_az"],
        ephem["sun_el"],
        ephem["sun_rho"],
        horizon_deg,
        az_step_deg,
        n_disc_samples
    )

    earth_vis_pct = compute_disc_visibility(
        ephem["earth_az"],
        ephem["earth_el"],
        ephem["earth_rho"],
        horizon_deg,
        az_step_deg,
        n_disc_samples
    )

    earth_clearance = compute_earth_clearance(
        ephem["earth_az"],
        ephem["earth_el"],
        horizon_deg,
        az_step_deg
    )

    return {
        "sun_az": ephem["sun_az"],
        "sun_el": ephem["sun_el"],
        "earth_az": ephem["earth_az"],
        "earth_el": ephem["earth_el"],
        "earth_clearance": earth_clearance,
        "sun_vis_pct": sun_vis_pct,
        "earth_vis_pct": earth_vis_pct
    }
