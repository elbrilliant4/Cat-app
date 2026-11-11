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

**After (`f027528`, 7 passes, each measured with 2 x 600 s):**

| | before (s5 / s7) | after (s5 / s7) |
|---|---|---|
| overlaps logged | 2005 / 1625 | 74 / 199 |
| vacuum alone, closest | +.05 / +.04 | +.17 / +.15 |
| vacuum with her riding, closest | +.05 / +.05 | +.15 / +.15 |
| her body riding, worst | -.20 / -.17 | +.16 / -.00 |
| her tail riding, worst | -.63 / -.67 | -.06 / -.08 |
| her body on the floor, worst | -.40 / -.25 | -.14 / -.12 |
| her tail on the floor, worst | -.77 / -.56 | -.04 / -.06 |

The vacuum never touches anything. The tail's worst is fur-deep (its
radius is .04 to .08). Pictures: `qa-out/vision-evidence/`.

**Left (small, documented, not fixed):**
- Her ear or jaw 8 to 15 cm into the counter's front, the island's end or
  a stool leg when she turns her head to look at something while walking
  right along it (the keep-out is sized for her body, not a head turned
  90 degrees; widening it closes the vacuum's lanes).
- The tail's base (`tail0`) is set by her hips: when she lands on the
  vacuum .25 behind its centre by the counter, 8 cm of it is in the
  drawer fronts for a moment.
- Walls, the counter and the gap by the window steps are checked in the
  kitchen only. The study has no `tailSolids` yet (phase 03).

**What each pass found** (for the next person: measure, don't guess)
1. Tail through everything; head and hips in the stool legs; body in the
   counter at the step foot and the island jump base.
2. The counter between x .3 and 2.5 missing from the solid list; the spot
   to hop on from pushed past the floor's edge by the vacuum's circle.
3. A route point east of the tent clamped onto the tent (25 cm in).
4. A bigger tent margin made the padded circle bigger than the goal
   picker's exclusion: goal inside, circle dropped, straight through the
   tent (99 cm).
5. A tail bone pointing straight into a face can't be turned out (the
   push is along the bone): it bends up along the face instead.
6. The bend's temp vector was overwritten before use (tail worse again).
7. The island's margin lost to the vacuum's circle when both applied; off
   the vacuum ahead or behind when neither side has room; the gap mouth.

