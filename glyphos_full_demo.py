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
import io, numpy as np, matplotlib.pyplot as plt
from glyphos_sdk import get_engine
from glyphos_sdk.evaluator import compare_logits, pretty_print, plot_histogram
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL = "sshleifer/tiny-gpt2"
tok   = AutoTokenizer.from_pretrained(MODEL)
mdl   = AutoModelForCausalLM.from_pretrained(MODEL)
eng   = get_engine()

def one_pass(prompt: str):
    toks = tok(prompt, return_tensors="pt")
    rawL = mdl(**toks).logits[0, -1].detach().cpu().numpy()

    # demo-only vectors
    G = np.random.randn(256).astype(np.float32)
    I = G + np.random.normal(scale=0.05, size=256).astype(np.float32)

    modL = eng.run(I, G, rawL)
    m    = compare_logits(rawL, modL)

    print("\n## Metrics\n")
    print(pretty_print(m))

    # Save histogram
    fig = plot_histogram(rawL, modL)
    fig.savefig("hist.png")
    print("\n![hist](hist.png)")

if __name__ == "__main__":
    one_pass("Summarise Gödel's Incompleteness in one sentence")
