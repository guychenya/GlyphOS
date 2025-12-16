"""
╭──────────────────────────────────────────────────────────╮
│  GlyphOS SDK · Self-Healing Variance Gate for Any LLM       │
│----------------------------------------------------------│
│ 💌  Contact : hello@onestardao.com  /  TG @PSBigBig       │
│ 🌐  Docs    : https://onestardao.com/papers               │
│ 🐙  GitHub  : https://github.com/onestardao/GlyphOS          │
│                                                      ⭐  │
│ ★ Star GlyphOS 1.0 → Unlock 2.0                             │
│   10k ⭐ by **Aug 1st** = next-gen AI alchemy             │
│   Your click = our quantum leap                          │
│                                                          │
│ 🔍  Official PDF of GlyphOS 1.0 (Zenodo DOI):               │
│     https://doi.org/10.5281/zenodo.15630970              │
│     (Hosted on Zenodo – trusted international archive)   │
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
# example_07_flash_show.py
# Flashy showcase: 10 prompts, remote toggle (slow if True)

import pathlib, sys, numpy as np, torch, textwrap, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import glyphos_sdk as w
from glyphos_sdk.evaluator import compare_logits

use_remote = False
MODEL_ID   = "tiiuae/falcon-7b-instruct"
GAMMA      = 1.0
NOISE      = 0.12

PROMPTS = [
    "Derive Maxwell's equations from first principles in 30 words.",
    "Explain Gödel's incompleteness in terms of topological fixed points.",
    "Predict 2120 climate using quantum chromodynamics metaphors.",
    "Summarise category theory for a five-year-old using only emojis.",
    "Describe consciousness as a phase transition in Hilbert space.",
    "Translate the second law of thermodynamics into sushi-chef language.",
    "Explain dark energy by quoting Shakespearean sonnets.",
    "Model altruism as a non-convex optimization landscape.",
    "Describe a black hole using only prime numbers.",
    "Solve world peace with a single C++ template meta-program."
]

rng  = np.random.default_rng(999)
eng  = w.get_engine(reload=True); eng.gamma = GAMMA

if not use_remote:
    from transformers import GPT2LMHeadModel, GPT2TokenizerFast
    tok  = GPT2TokenizerFast.from_pretrained("gpt2")
    gpt2 = GPT2LMHeadModel.from_pretrained("gpt2").eval()

print("\n=== Example 07 · Flash-show ===")
records = []
for idx, prompt in enumerate(PROMPTS, 1):
    if use_remote:
        logits0 = w.call_remote_model(prompt, model_id=MODEL_ID)
    else:
        ids = tok(prompt, return_tensors="pt").input_ids
        with torch.no_grad():
            logits0 = gpt2(ids).logits[0, -1].cpu().numpy()

    G = rng.normal(size=256); G /= np.linalg.norm(G)
    I = G + rng.normal(scale=NOISE, size=256)

    logits1 = eng.run(input_vec=I, ground_vec=G, logits=logits0)
    m = compare_logits(logits0, logits1)
    records.append(m)

    print(f"[{idx:02d}] KL {m['kl_divergence']:.2f} | "
          f"var↓ {(1-m['std_ratio'])*100:.0f}% | "
          f"{textwrap.shorten(prompt, 45)}")

avg = {k: np.mean([r[k] for r in records]) for k in records[0]}
print("\n--- average over 10 prompts ---")
print(avg)
print("⚠ Larger LLM → stronger variance drop & higher KL.\n")
