# Phase 02 — Vacuum "Vision"

## Goal
Merlin: "She and the vacuum went through the stools like she's Vision."
The vacuum, and Mochi riding it, must never pass through furniture.

## Known facts
- The vacuum plans around the island and stools with `route(from, to, pad)`
  in `kitchen.js` (pad .45, .75 with her riding), escaping the padded box
  first; `clampVacuum` keeps it out; the route is re-planned when a rider
  gets on or off (fixed in `718d283`).
- Earlier soak test: vacuum centre stayed ≥ .48 m clear (≥ .63 m riding).
  That only measured the island/stools box, and only the vacuum centre.
- Merlin reported "Visioness" again after build 137 went live. Not yet
  reproduced. Unknown: where (stools? shelves' base? terrace doors? dock?)
  and whether it was the vacuum, her body, or her tail.

## Where to look
`kitchen.js`: `startVacuum`, `updateVacuum`, `clampVacuum`, `route`, `K`,
`KEEP_OUT`. `app.js`: `vacuumRide`, `vacuumAttack`, riding pose and offset.

## Plan
1. Ask Merlin ONE question if needed: which furniture, and riding or not
   (a screenshot helps).
2. Extend `tools/qa/vacuum.mjs` to check every kitchen obstacle (not just
   the island box) and her body points (hips, chest, head, tail tip) while
   riding, plus her walk during `vacuumAttack`.
3. Reproduce it, fix it, re-run.

## Test
`node tools/qa/vacuum.mjs` (SEC=600, a couple of SEEDs). Target: every
clearance > 0 for the vacuum and her body.

## Result
(fill in)
