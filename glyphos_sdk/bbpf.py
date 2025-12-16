"""
╭──────────────────────────────────────────────────────────╮
│  GlyphOS SDK · Self-Healing Variance Gate for Any LLM       │
│----------------------------------------------------------│
│ 💌  Contact : hello@onestardao.com  /  TG @PSBigBig       │
│ 🌐  Docs    : https://onestardao.com/papers               │
│ 🐙  GitHub  : https://github.com/onestardao/GlyphOS          │
│                                                          │
│ ★ Star GlyphOS 1.0 → Unlock 2.0                             │
│   10k ⭐ by **Aug 1st** = next-gen AI alchemy             │
│   Your click = our quantum leap                          │
│                                                          │
│ 🔍  Official PDF of GlyphOS 1.0 (Zenodo DOI):               │
│     https://doi.org/10.5281/zenodo.15630969              │
│     (Hosted on Zenodo – trusted international archive)   │
│                                                          │
│ 🧬  GlyphOS BigBang Prompt Pack (v1.0):                     │
│     https://doi.org/10.5281/zenodo.15657016              │
│     (Prompts to trigger the gate; multilingual updates coming) │
│                                                          │
│ 🧠  Hidden folder inside repo: /I_am_not_lizardman        │
│     (X secret papers, wild prompts, and Einstein drama) │
│                                                          │
│ ⚠  GPT-2 demo is just the appetizer. With bigger LLMs,   │
│    GlyphOS activates variance-drop lasers and KL fireworks. │
│                                                          │
│ 🎮  Bonus: Honest Hero RPG Channel →                     │
│     https://www.youtube.com/@OneStarDao                  │
╰──────────────────────────────────────────────────────────╯
"""
# bbpf.py
# Progression Formula (BBPF) — multi-path perturbation
# Author: PSBigBig & Contributors
# License: MIT

from __future__ import annotations
import logging
from typing import List, Tuple

import numpy as np

logger = logging.getLogger(__name__)


def bbpf_progression(
    state_vec: np.ndarray,
    *,
    k_paths: int = 3,
    noise_scale: float = 1e-2,
    seed: int | None = None
) -> Tuple[List[np.ndarray], np.ndarray, float]:
    """
    Generate k perturbed paths and compute a progression stability score f_S.

    Parameters
    ----------
    state_vec : np.ndarray
        The vector to perturb (usually the residue vector B).
    k_paths : int, optional
        Number of perturbation paths (k ≥ 3 recommended).
    noise_scale : float, optional
        Standard deviation of Gaussian noise.
    seed : int or None, optional
        RNG seed for reproducibility.

    Returns
    -------
    paths : List[np.ndarray]
        List of perturbed vectors.
    weights : np.ndarray
        Normalised weights P_i (size = k_paths).
    f_S : float
        Progression stability indicator (0 → unstable, 1 → fully stable).

    Notes
    -----
    - f_S is defined as 1 / (1 + mean‖Δ‖), where Δ is deviation
      between each perturbed path and the original vector.
    """
    if seed is not None:
        np.random.seed(seed)

    dim = state_vec.size
    paths = []
    deviations = []

    for _ in range(k_paths):
        noise = np.random.normal(0.0, noise_scale, size=dim)
        perturbed = state_vec + noise
        paths.append(perturbed)
        deviations.append(np.linalg.norm(noise, ord=2))

    deviations = np.asarray(deviations)
    weights = deviations.max() - deviations  # smaller dev → higher weight
    weights = weights / weights.sum()

    # Stability indicator; smaller mean deviation → f_S ↑
    f_S = 1.0 / (1.0 + deviations.mean())

    logger.debug(
        "BBPF - %d paths | mean Δ = %.6e | f_S = %.6f",
        k_paths, deviations.mean(), f_S
    )
    return paths, weights, float(f_S)

def run_demo() -> None:
    """Quick smoke-test for BBPF."""
    import numpy as np

    vec = np.random.randn(16)
    paths, w, f_S = bbpf_progression(vec, k_paths=4)
    print(f"BBPF demo k=4 | f_S = {f_S:.4f}")


if __name__ == "__main__":
    run_demo()
