#!/usr/bin/env bash
# Lints the theme: Shopify theme check (whole theme) + the save-time schema rules
# that theme check misses (scripts/check-schema.js, from the High-Spirits repo).
#   bash dev/check.sh
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== shopify theme check"
shopify theme check --path . -o text 2>&1 | grep -E "\[(error|warning|suggestion)\]|files inspected|offenses|^│  [a-z]+/" || true
echo "== schema save rules"
node scripts/check-schema.js
