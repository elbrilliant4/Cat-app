#!/usr/bin/env bash
# Renders the review pack for a built site into <site dir>/review.
#   tools/review-pack/run.sh <site dir>
# Installs Playwright's Chromium (and ffmpeg, if missing) on the way; used by
# the Pages workflow for every preview build.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
site="$(cd "$1" && pwd)"
work="$(mktemp -d)"
(cd "$work" && npm init -y >/dev/null && npm install --no-audit --no-fund --silent playwright && npx --yes playwright install --with-deps chromium)
command -v ffmpeg >/dev/null || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)
PLAYWRIGHT_MODULE="$work/node_modules/playwright/index.mjs" node "$here/capture.mjs" "$site" "$site/review"
