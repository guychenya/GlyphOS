# GlyphOS SDK ─ Inside the Engine Room  
*A tiny, self-contained Python package that powers every variant-gate demo in the repo.*

> **Already cloned the whole repo?**  
> You do **not** need to install anything else – the SDK is editable-installed by  
> `pip install -e .` at the project root.  
> Jump back to the top-level `README.md` for one-click Colab / HF Space guides.

---

## 1 Quick start (stand-alone)

```bash
python -m venv glyphos_env && source glyphos_env/bin/activate
pip install glyphos-sdk           # PyPI name
python - <<'PY'
from glyphos_sdk import get_engine, evaluator
import numpy as np

engine = get_engine()          # singleton
old = np.random.randn(32000).astype(np.float32)
g   = np.random.randn(256).astype(np.float32)
i   = g + np.random.normal(scale=0.05, size=256).astype(np.float32)

new = engine.run(i, g, old)
print(evaluator.compare_logits(old, new))
PY
````

Output guarantees **≥ 30 % variance drop** (`'std_ratio' < 0.7`) which is exactly what the CI checks.

---

## 2 Directory tour

| File                                       | Purpose                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `glyphos_engine.py`                           | **Single source of truth** – the variance gate. Keep the public signature `run(input_vec, ground_vec, logits)` stable.   |
| `evaluator.py`                             | Metric helpers: `compare_logits`, `plot_histogram`, `pretty_print`.                                                      |
| `bbam.py`, `bbpf.py`, `bbcr.py`, `bbmc.py` | Tiny stubs for the four “BigBig” sub-formulas. In v1 they forward to the core scaler; in v2 they will host real kernels. |
| `initializer.py`                           | Central place for default hyper-parameters, RNG seeding, and future config loading.                                      |
| `utils.py`                                 | Misc. helpers (array normalisation, safe softmax, etc.).                                                                 |
| `visual.py`                                | Matplotlib styles used by CLI / Colab.                                                                                   |
| `cli.py`                                   | Minimal REPL: `python -m glyphos_sdk.cli`.                                                                                  |
| `reporter.py`                              | Prints coloured tables & JSON logs for batch runs.                                                                       |
| `tests/`                                   | Repo-local unit tests. **Do not delete – CI depends on them.**                                                           |
| `__init__.py`                              | Re-exports `get_engine`, `compare_logits`, package `__version__`.                                                        |

---

## 3 Public API surface

```python
from glyphos_sdk import (
    get_engine,              # -> GlyphOSEngine singleton
    compare_logits,          # quick metrics
    plot_histogram,          # matplotlib.Figure
    pretty_print             # tty-friendly formatter
)

engine = get_engine()
new_logits = engine.run(I, G, old_logits)
```

* `I`, `G` are 256-D `float32` vectors (semantic fingerprint & anchor).
* `old_logits` + return value share the same shape `(vocab,)`.
* No in-place mutation; function is 100 % pure.

---

## 4 Coding guidelines

1. **Zero heavy deps** inside the core – NumPy only.
2. Keep every public symbol documented with Google-style docstrings; tests import the docs to build the API table.
3. Target **Python ≥ 3.9**. Our CI uses 3.10.
4. A pull request must keep `pytest` green:

   ```bash
   pip install -e ."[dev]"   # adds pytest + coverage
   pytest -q
   ```

---

## 5 Versioning & license

*Current tag: **GlyphOS 1.0.0\*** – commits are semantic-versioned (PEP 440).
Licensed under **MIT** – see ./LICENSE.

---

## 6 Roadmap

| Milestone               | ETA           | Note                            |
| ----------------------- | ------------- | ------------------------------- |
| **Adaptive-gamma** gate | Aug 2025 (v2) | opens after 10 k★               |
| Multimodal vectors      | Sep 2025      | 512-D fused vision-text anchors |
| Training-time plugin    | Q4 2025       | PyTorch Lightning callback      |

*Stars fuel research – one click = one photon of semantic clarity.* ⭐

```
```
