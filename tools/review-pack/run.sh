#!/usr/bin/env bash
# Renders the review pack for a built site into <site dir>/review.
#   tools/review-pack/run.sh <site dir>
# Used by the Pages workflow for every preview build. Gets Playwright's
# Chromium (and ffmpeg, if missing) on the way, each with a time limit, and
# gives the rendering itself a budget: the pack page is written as it goes,
# so a slow run still publishes what it finished.
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
site="$(cd "$1" && pwd)"
work="$(mktemp -d)"
log() { echo "$(date -u +%T) $*"; }

cd "$work"
npm init -y >/dev/null
timeout 300 npm install --no-audit --no-fund --silent playwright || { log 'could not install Playwright'; exit 1; }
timeout 300 npx --yes playwright install chromium || { log 'could not download Chromium'; exit 1; }
# The runner usually has what Chromium needs already; only fetch system
# packages (slow when the package mirrors are) if it won't start.
probe() { timeout 120 node -e "import('$work/node_modules/playwright/index.mjs').then(async ({chromium}) => { const b = await chromium.launch(); await b.close(); })"; }
if ! probe; then
  log 'installing Chromium system packages'
  timeout 900 npx playwright install-deps chromium || log 'install-deps did not finish'
  probe || { log 'Chromium will not start'; exit 1; }
fi
if ! command -v ffmpeg >/dev/null; then
  log 'installing ffmpeg'
  (timeout 600 sudo apt-get update -qq && timeout 600 sudo apt-get install -y -qq ffmpeg) || log 'no ffmpeg: the motion clips will be skipped'
fi
cd "$here"
log 'rendering'
PLAYWRIGHT_MODULE="$work/node_modules/playwright/index.mjs" timeout 3000 node "$here/capture.mjs" "$site" "$site/review"
status=$?
[ $status -eq 124 ] && log 'rendering hit its 50-minute budget; the pack has what was finished'
exit $status
