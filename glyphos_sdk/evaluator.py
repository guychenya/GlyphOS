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
"""
GlyphOS · Metrics & Visuals – pure NumPy + Matplotlib
This module’s keys must match the CI test and the HF Space UI.
"""

import numpy as np
import matplotlib.pyplot as plt
from tabulate import tabulate

# ── helpers ──────────────────────────────────────────────────────────────
def _safe_std(x: np.ndarray) -> float:
    s = float(np.std(x))
    return s if s > 0 else 1e-12


def _softmax(x: np.ndarray) -> np.ndarray:
    z = x - x.max()
    e = np.exp(z)
    return e / e.sum()


# ── public API ───────────────────────────────────────────────────────────
def compare_logits(old: np.ndarray, new: np.ndarray) -> dict:
    sr = _safe_std(new) / _safe_std(old)          # std-ratio  (< 0.7 passes)
    var_drop = 1.0 - sr
    p, q = _softmax(old), _softmax(new)
    kl_val = float(np.sum(p * np.log((p + 1e-8) / (q + 1e-8))))
    top1_same = int(old.argmax() == new.argmax())

    return {
        "std_ratio": sr,
        "var_drop": var_drop,
        "kl_divergence": kl_val,   # name used by CI
        "kl": kl_val,              # alias for UI headline
        "top1": top1_same,
    }


# ── CLI pretty table ─────────────────────────────────────────────────────
def pretty_print(m: dict) -> str:
    tbl = tabulate(
        [[f"{m['std_ratio']:.3f}",
          f"{m['var_drop']*100:4.1f} %",
          f"{m['kl_divergence']:.3f}",
          "✔" if m['top1'] else "✘"]],
        headers=["std_ratio", "▼ var", "KL", "Top-1"],
        tablefmt="github",
    )
    return tbl


# ── histogram figure ─────────────────────────────────────────────────────
def plot_histogram(old: np.ndarray, new: np.ndarray, bins: int = 50) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(6, 3.5), dpi=110)
    ax.hist(old, bins=bins, alpha=0.6, label="Raw", log=True)
    ax.hist(new, bins=bins, alpha=0.6, label="GlyphOS", log=True)
    ax.set_title("Logit distribution (log-scale)")
    ax.set_xlabel("logit value")
    ax.set_ylabel("frequency")
    ax.legend()
    fig.tight_layout()
    return fig
