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

# bbmc.py
# Semantic Residue (BBMC) implementation
# License: MIT

from __future__ import annotations
import logging
from typing import Dict
import numpy as np

logger = logging.getLogger(__name__)


def _safe_normalise(vec: np.ndarray) -> np.ndarray:
    """Return a unit L2-normalised copy; if norm is 0 return original."""
    norm = np.linalg.norm(vec)
    return vec if norm == 0.0 else vec / norm


def compute_residue(
    input_vec: np.ndarray,
    ground_vec: np.ndarray,
    m: float = 0.1,
    c: float = 0.5,
    *,
    normalise: bool = True,
    return_vector: bool = True
) -> Dict[str, np.ndarray | float]:
    """
    Compute semantic residue B = I - G + m * c^2.

    Parameters
    ----------
    input_vec : np.ndarray
        Input semantic vector I.
    ground_vec : np.ndarray
        Ground-truth semantic vector G.
    m : float, optional
        Matching coefficient.
    c : float, optional
        Context factor.
    normalise : bool, optional
        If True, I and G are L2-normalised before subtraction.
    return_vector : bool, optional
        If True, include full B_vec in the result.

    Returns
    -------
    dict
        {
            "B_vec": np.ndarray,
            "B_norm": float
        }
    """
    if input_vec.shape != ground_vec.shape:
        raise ValueError("input_vec and ground_vec must share the same shape")

    if normalise:
        input_vec = _safe_normalise(input_vec)
        ground_vec = _safe_normalise(ground_vec)

    B_vec = input_vec - ground_vec + m * (c ** 2)
    B_norm = float(np.linalg.norm(B_vec, ord=2))

    out = {"B_norm": B_norm}
    if return_vector:
        out["B_vec"] = B_vec

    logger.debug("BBMC ‖B‖ = %.6f", B_norm)
    return out


# ------------------------- quick demo ------------------------- #
def run_demo() -> None:
    rng = np.random.default_rng(42)
    I = rng.normal(size=8)
    G = I + rng.normal(scale=0.05, size=8)  # small noise
    res = compute_residue(I, G)
    print(f"BBMC demo ‖B‖ = {res['B_norm']:.4f}")


if __name__ == "__main__":
    run_demo()
