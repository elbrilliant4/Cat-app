# Phase 06 — Body on narrow perches

## Goal
On her narrow perches her body stays out of the wall and the furniture
around them: the kitchen wall steps (`step`, `stepMid`, `stepTop`), the
shelves (`shelf`, `shelfHigh`) and the study window sill.

## Known facts (from phase 03)
- The steps are .66 m deep from the back wall; she's about 1.2 m long and
  sits facing the room at the step's middle (`PERCHES` in kitchen.js
  `layout()`, spot z -3.87): her hips end up about 15 cm into the wall.
  Same on the sill (spot at half its .8 m depth).
- `tools/qa/tail.mjs` counts frames with her hips (where the tail starts)
  inside something: kitchen 7 to 13%, study 4 to 11% of frames.
- Sitting on the lower shelf, the upper shelf's bracket goes through her
  head (seen in a picture; `vacuum.mjs` measures body points, kitchen floor
  only).
- Mid-jump up the step and shelf stack the tail clips the next step or
  shelf edge for a few frames.

## Ideas
Sit spot further forward on these perches, or sitting sideways along the
step. Careful: the step jump paths and the step-gap gotchas in
ARCHITECTURE.md (the gap at the foot of the steps, `atStepFoot`).

## Test
`tools/qa/tail.mjs` (hips-inside frames toward 0), plus body points on
perches (extend `tail.mjs` with `vacuum.mjs`'s body points), pictures.

## Result
(fill in)
