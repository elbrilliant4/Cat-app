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

## Result
(fill in)
