# Phase 03 — Tail through furniture

## Goal
Her tail never passes through furniture (beds, tent, chair, island, shelves, walls).

## Status (2026-11-11, from the last handoff)
The kitchen is done in phase 02: `clearTail` in motion.js with the
kitchen's `tailSolids`. Left: a `tailSolids` list in `studyLayout()`
(app.js) from the study's furniture (room.js: beds, chair, mantel, bookcase,
walls), and `tools/qa/tail.mjs` for both rooms (copy the body-point and
solid-reading parts of `tools/qa/vacuum.mjs`). The facts and plan below
predate that.
Gotchas: `route()` drops any circle that holds the goal, so never let a goal
sit inside a padded circle. Container restarts kill background runs: launch
QA with `run_in_background`, outputs in the scratchpad, and check they
finished (`overlap(s):` in the output).

## Known facts
- The tail is solved in `motion.js` `drapeTail(w, wrap, R, pel, bounds)`.
  Today it knows the floor and one circle (`bounds`, used for the study bed
  rim via `ctl.tailBounds` in `app.js`).
- The tent: fixed by changing her sleep heading and offset (`K.tent`,
  `sleepHeading`, `bedOffset`), not by collision.
- No general tail collision exists.

## Where to look
`motion.js` `drapeTail`; `app.js` where `tailBounds` is built; each room's
solid boxes (`L.camSolids` / `CAM_BLOCKS`, kitchen `K`).

## Plan
1. Give `drapeTail` a list of simple shapes (boxes and circles) near her,
   from the active room's layout.
2. Push each tail joint out of any shape (keep the chain smooth).
3. Write `tools/qa/tail.mjs`: roam and count frames with a tail joint
   inside a shape; screenshots of the worst moments.

## Test
New `tools/qa/tail.mjs`. Target: zero joints inside furniture; tail motion
still looks soft (screenshots).

## Result (2026-11-11, on preview)
Done: the study's furniture list (`studyTailSolids()` in app.js: walls,
fireplace, sill and what's on it, armchair as turned boxes, side table,
pots, bowl, fountain, bed rim with `climb`), the mantel vase while it
stands, the kitchen's wall steps and shelves, the kitchen counter's shape
fixed (it started .85 m too far left and swallowed her first step), walls
3 m deep (a tail swung right through a thin wall was never pushed back).
New check: `tools/qa/tail.mjs` (both rooms, read off the real meshes).

Tail into furniture (deeper than 3 cm), share of frames, 300 s runs,
before → after (frames with her hips already inside something counted
apart, as they're her body's place, not the tail):

| Room, seed | Before | After | Worst before → after |
|---|---|---|---|
| Study, 5 | 5.5% | 1.0% | 1.05 m (behind a wall) → .33 m |
| Study, 11 | 9.1% | 1.5% | 1.05 m → .33 m |
| Kitchen, 5 | 5.6% | 5.3% | .97 m → .39 m |
| Kitchen, 11 | 2.6% | 1.6% | .97 m → .37 m |

Not zero. What's left is mostly not the tail:
- Her hips sit inside the wall on the narrow perches (kitchen wall steps,
  .66 deep, she's 1.2 m long; the window sill): 4 to 13% of frames. Fix:
  sit spot further forward, or sit sideways on them. Touches the step jump
  paths (see the step gap gotchas in ARCHITECTURE.md), so its own phase.
- Jumps up the step and shelf stack and onto the sill: the tail clips the
  edge of the next step or shelf for a few frames mid-jump.
- On the mantel her hips are right by the vase and the wall.
- Seen in a picture: the upper shelf's bracket through her head while she
  sits on the lower shelf (body, not tail).
