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
- Baseline `tools/qa/vacuum.mjs` SEED=5 SEC=400 (preview `1d7a2b7`):
  vacuum alone .53 m clear, vacuum with her riding .82 m clear, but **her
  hips went 5 cm inside the island/stools box** (riding or on the floor;
  not yet split). So the vacuum looks fine; her body is the suspect.
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
Measured with the new `tools/qa/vacuum.mjs` (every kitchen solid read off
the real meshes; the vacuum's disc and every point of her body, the tail
along its length; 2 seeds x 600 s, screenshots of the worst moments).

**Before (live build 174):** the vacuum itself never went through anything
in 1200 s (closest: 3.5 cm from the bowl's rim). *She* did, and it was
never the vacuum's fault:

| what | how deep | where |
|---|---|---|
| her tail, hanging off the back of the vacuum | 63 to 67 cm | the counter (sitting on it in the back lane), the dock, the stools, the tent |
| her tail, walking past | 77 cm | the island's base, the stools' legs, the counter |
| her head and hips | 12 to 25 cm | the stool legs (walking or landing along the keep-out edge: the legs reach .7 in front of the island, the keep-out was .35 from them) |
| her body | 40 to 55 cm | the counter, standing at the foot of the wall steps turned across the gap; the island jump base (.3, -1.4) was clamped to the island's edge, her head in it |
| her hips | 11 to 17 cm | the dock, boarding the vacuum while it still stood on it |

Pictures: `qa-out/before-pics-s5/vacuum-at-{60,98,133}.png` (head in a
stool leg; tail straight through a stool leg from the vacuum; her back
half inside the counter drawers).

**What changed**
- `motion.js` `clearTail(solids)`: the tail keeps out of boxes, cylinders
  and the tent's turned box (each joint out by the nearest face; lying on
  top counts as out). The kitchen's list is `tailSolids` in `layout()`,
  passed per frame by `tailSolids()` in `app.js` (minus the tent while
  she's in it, the counter while she's in the sink; plus the vacuum).
- `kitchen.js`: `KEEP_OUT` .65 from the island, 1.35 in front (her head
  and hips reach .6); `clampFloor` runs its pushes in passes (out of the
  island's margin could mean into the vacuum's circle and back) and the
  floor's edge wins last; the vacuum's centre kept in `VAC_FLOOR` /
  `VAC_FLOOR_RIDE` (route points outside dropped, never clamped onto a
  thing); riding pad .7 (.45 behind the island, the lane is narrow); the
  dock an obstacle with her aboard; the tent .4 more room (square); a
  goal inside a margin or no route = no path, it picks another goal;
  fountain obstacle .8, bowl .6; island jump base (.3, -1.75); she hops
  off on the side with room.
- `app.js`: she doesn't board at the dock (it doesn't wait for her there);
  she walks up to it (to ride or to stalk) from a side where she and her
  landing stay on free floor; at the foot of the wall steps she faces the
  steps.

**After:** (numbers below, filled in from the final runs)

