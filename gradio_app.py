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
import glyphos_sdk as w, numpy as np, gradio as gr
from glyphos_sdk.evaluator import compare_logits, pretty_print

def run_glyphos(prompt):
    logits = w.call_remote_model(prompt, model_id="gpt2")
    G = np.random.randn(128); G /= np.linalg.norm(G)
    I = G + np.random.normal(scale=0.05, size=128)
    out = w.get_engine().run(input_vec=I, ground_vec=G, logits=logits)
    m = compare_logits(logits, out)
    delta = (1 - m["std_ratio"]) * 100
    return f"variance drop {delta:.0f}% • KL {m['kl_divergence']:.2f}"

demo = gr.Interface(fn=run_glyphos,
                    inputs=gr.Textbox(),
                    outputs="textbox",
                    title="GlyphOS Quick Test",
                    description="Type any prompt. GPT-2 baseline, variance/KL will appear.")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
