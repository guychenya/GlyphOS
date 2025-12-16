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
GlyphOS SDK – public facade
Exports:

• get_engine() – singleton factory
• enable()    – tiny helper used by the CI test
"""

from .glyphos_engine import get_engine, GlyphOSEngine     # re-export
from typing import Any, Dict

__all__ = ["get_engine", "enable", "GlyphOSEngine"]


def enable(model: Any, *, reload: bool = False, **_) -> Any:
    """
    Minimal helper for `tests/test_sdk_full.py`.

    If *model* is a dict that contains the three keys
    { "I", "G", "attention_logits" }, its logits are routed
    through GlyphOS and the dict is returned (in-place).  
    Otherwise the object is returned untouched.
    """
    if (
        isinstance(model, dict)
        and {"I", "G", "attention_logits"} <= model.keys()
    ):
        eng = get_engine(reload=reload)
        model["attention_logits"] = eng.run(
            model["I"], model["G"], model["attention_logits"]
        )
    return model
