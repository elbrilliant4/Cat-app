# Handoff — 2026-11-10

## State
- Live: build 161 = `70ade23`: the cat walk (measured numbers, no
  stutter-step), a trot for every run, gallop only at a dash or zoomies.
  Merlin: "much much better than before".
- Preview branch (`66395d2`), not live: Halloween stored away out of
  October (`?decor=halloween` shows it; a room left in it wakes up as
  Thanksgiving). Waiting on Merlin's "Go live".

## Next (Merlin's order, 2026-11-10)
1. Phase 02, Vision (`docs/phases/02-vacuum-vision.md`): she, the vacuum,
   or her tail (phase 03) passing through furniture. Reproduce with
   `tools/qa/vacuum.mjs` extended to every obstacle and her body points.
2. Christmas decor: waiting on Orion's image (decor.js; different files
   from Vision, can run as a second session).
3. Miso, the second cat: waiting on Merlin's Meshy .glb.
4. Phase 08 (app screens), 09 (small test group). Merlin wants a
   commercial-quality app.

## Gotchas
- Merlin judges in the live preview, not recordings: ship an A/B behind a
  URL flag so both are live links. Walk flags left in `motion-cat.js`
  (`?walk=old`, `?gait=old`, `?low=0`, `?track=wide`, `?sway=1`,
  `?hindlift=`, `?trot=0`); remove once nobody needs them.
- QA: `gait-chart.mjs` (footfall chart, `RUN=2.1`), `legs.mjs` (steps at
  20 fps: a "worst" on a fast change of speed is ~3x the app's), 2
  browsers at a time; a leg run ~6 min, a clip ~10 min.
- Papers: pmc.ncbi.nlm.nih.gov, journals.plos.org, www.originalwisdom.com
  are allowed in the Default environment; fetch with curl (WebFetch's
  resolver can't see them). Numbers are in the phase 07 brief.
- `pkill -f`/`pgrep -f` match your own shell line: use exact names.

## Paste into a new chat
> Read CLAUDE.md and docs/HANDOFF.md, then do phase 02 (docs/phases/02-vacuum-vision.md).
