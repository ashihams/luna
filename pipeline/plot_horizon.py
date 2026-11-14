"""
pipeline/plot_horizon.py
Generates a polar plot of the terrain horizon for a site.
Shows azimuth (0-360 deg, North at top, East at right) vs elevation angle (deg).
Saves to data/cache/<site_id>_horizon_polar.png.
"""
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from pathlib import Path

from pipeline.config_loader import cache_dir


def plot_polar_horizon(site_id: str,
                       azimuths_deg: np.ndarray,
                       elev_deg: np.ndarray,
                       title: str = None,
                       out_path: Path = None):
    """
    Generate polar plot of lunar terrain horizon.
    North (az 0) is at top (theta=pi/2 or 0 depending on convention), East (az 90) clockwise.
    """
    if out_path is None:
        out_path = cache_dir() / f"{site_id}_horizon_polar.png"

    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw={'projection': 'polar'})

    # In standard navigation polar plot: 0 deg North is at the top, angles go clockwise
    ax.set_theta_zero_location('N')
    ax.set_theta_direction(-1)  # Clockwise (0=North, 90=East, 180=South, 270=West)

    az_rad = np.radians(azimuths_deg)
    # Append first point to close the polygon
    az_plot = np.append(az_rad, az_rad[0])
    elev_plot = np.append(elev_deg, elev_deg[0])

    # Offset elevation so that horizon is clearly visible
    # Minimum elevation could be -1 deg, max could be +8 deg
    el_min = min(-2.0, float(np.min(elev_deg)) - 0.5)
    el_max = max(5.0, float(np.max(elev_deg)) + 1.0)

    # Plot terrain outline
    ax.plot(az_plot, elev_plot, color='#e05638', linewidth=1.5, label='Terrain Horizon')
    # Fill terrain below horizon (from el_min up to elev)
    ax.fill_between(az_plot, el_min, elev_plot, color='#3a3a4a', alpha=0.5, label='Occluded Terrain')

    # Draw geometric sphere dip reference line (-0.087 deg)
    ax.plot(az_plot, np.full_like(az_plot, -0.087), 'b--', alpha=0.6, linewidth=1.0, label='Flat Sphere Dip (-0.087°)')

    ax.set_ylim(el_min, el_max)
    yticks = np.linspace(np.floor(el_min), np.ceil(el_max), 5)
    ax.set_yticks(yticks)
    ax.set_yticklabels([f"{int(y)} deg" for y in yticks])

    if title is None:
        title = f"Lunar Terrain Horizon - {site_id}"
    ax.set_title(title, pad=20, fontsize=12, fontweight='bold')
    ax.legend(loc='lower right', bbox_to_anchor=(1.25, 0.0), fontsize=9)

    fig.tight_layout()
    fig.savefig(str(out_path), dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"  Polar horizon plot saved to: {out_path}")
    return out_path
