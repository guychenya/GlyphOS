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
# run_glyphos_with_embedding.py
# Official test script for GlyphOS SDK demonstrating semantic residue adjustments.

from sentence_transformers import SentenceTransformer
from transformers import pipeline
import numpy as np
from glyphos_sdk import enable

# Load Sentence-BERT model for generating semantic embeddings
sbert = SentenceTransformer('all-MiniLM-L6-v2')

# Load GPT-2 text-generation pipeline
generator = pipeline("text-generation", model="distilgpt2")

# Original prompt (challenging question for AI)
prompt = "What is the meaning of life in 15 words or less?"

# Generate embedding for input prompt (I)
embedding_I = sbert.encode(prompt)

# Define ideal semantic embedding (G) - this could be a target semantic state
ideal_answer = "Life means finding purpose and joy in every moment."
embedding_G = sbert.encode(ideal_answer)

# Initialize model state dictionary with embeddings and attention logits
model = {
    "I": embedding_I,
    "G": embedding_G,
    "state": np.copy(embedding_I),
    "attention_logits": np.random.rand(len(embedding_I))
}

# Run the GlyphOS SDK to apply BBMC, BBPF, BBCR, and BBAM sequentially
model = enable(model)

# Calculate adjusted semantic residue from the final SDK state
semantic_shift_factor = np.mean(model["state"])

# Generate a new adjusted prompt incorporating semantic residue factor
new_prompt = prompt + f" (adjusted semantic residue: {semantic_shift_factor:.3f})"

# Generate AI responses (before and after GlyphOS SDK adjustments)
original_output = generator(prompt, max_length=50, do_sample=True)[0]['generated_text']
adjusted_output = generator(new_prompt, max_length=50, do_sample=True)[0]['generated_text']

# Display comparison results clearly
print("\n=== Original Output ===")
print(original_output)

print("\n=== SDK Adjusted Output ===")
print(adjusted_output)
