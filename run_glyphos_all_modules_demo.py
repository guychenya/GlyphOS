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
# run_glyphos_all_modules_demo.py
# Full-pipeline demo with a single prompt + metrics

import pathlib, sys, numpy as np, json
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import glyphos_sdk as w
from glyphos_sdk.evaluator import compare_logits, pretty_print

prompt = "Describe the purpose of human consciousness using physics terms."
rng = np.random.default_rng(42)

# build synthetic vectors
G = rng.normal(size=128); G /= np.linalg.norm(G)
I = G + rng.normal(scale=0.05, size=128)
logits_before = rng.normal(size=32000)

eng = w.get_engine(reload=True)
logits_after = eng.run(input_vec=I, ground_vec=G, logits=logits_before)

metrics = compare_logits(logits_before, logits_after)

print("\n=== GlyphOS · End-to-End Demo ===")
print("Prompt:", prompt, "\n")
pretty_print(metrics)
print("\nExplanations:")
print("• variance drop  → calmer logits")
print("• KL > 0         → distribution reshaped (semantic nudge)")
print("• top-1 shift ✔  → main token changed; ✘ means subtle reorder")
print("⚠ GPT-2 baseline; bigger LLMs amplify every metric.\n")
