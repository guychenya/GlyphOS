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
# example_04_remote_inference.py
# Toggle between local random logits and Hugging Face remote model

import pathlib, sys, numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import glyphos_sdk as w
from glyphos_sdk.evaluator import compare_logits

# --- toggle here ---------------------------------------------------------
use_remote = False                       # True = call HF endpoint
MODEL_ID   = "tiiuae/falcon-7b-instruct"
prompt     = "Explain semantic gravity in one tweet."
# ------------------------------------------------------------------------

logits_before = (
    w.call_remote_model(prompt, model_id=MODEL_ID) if use_remote
    else np.random.randn(32000)
)

G = np.random.randn(128); G /= np.linalg.norm(G)
I = G + np.random.normal(scale=0.05, size=128)

eng = w.get_engine(reload=True)
logits_after = eng.run(input_vec=I, ground_vec=G, logits=logits_before)
m = compare_logits(logits_before, logits_after)

print("\n=== Example 04 · Remote toggle demo ===")
print(f"Source: {'HF API ' + MODEL_ID if use_remote else 'local random'}")
print(f"KL {m['kl_divergence']:.2f} | var↓ {(1-m['std_ratio'])*100:.0f}%")
print("⚠ Larger LLM → stronger variance drop & higher KL.\n")
