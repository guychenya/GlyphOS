# reproduce.sh

#!/usr/bin/env bash
set -euo pipefail

python verify_manifest.py
pip install -e .
glyphos init
glyphos evaluate --suite all
glyphos evaluate --suite efficiency
glyphos report --format html --output glyphos_results/report.html

echo "SUCCESS: reproduction complete."
