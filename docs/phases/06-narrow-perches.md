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
Measured with `tools/qa/tail.mjs`, now with her body (bones) as well as the
tail, and `TOUR=1` (up each perch in turn, 12 s sitting, pictures).

Cause: sitting she's about .85 from tail to front paws (hips .6 behind her
centre, paws .26 ahead); the steps were .66 deep, the sill .8, the mantel
.71, the shelves .9 with the spot at their middle. Landing she reaches ~.7
ahead, nose first into the wall.

Changes: wall steps .95 deep (mesh and tail boxes); step and shelf spots at
the front (paws just on, tail base just off the wall); lower shelf spot off
the upper bracket (x -4.3); the mantel sat along (facing the vase); the sill
on the slant (2.2 rad: books and glass both in reach of her head turn, so
the bird still works; the reviewer caught that sitting square along it lost
the window); `narrow: true` perches: she turns in the air to land the way
she'll sit (if under 2.1 rad).

Before / after (seed 5):
- Kitchen perch tour: hips inside something 62.7% → 1.4% of frames; body
  into furniture 82% → 5.7% (resting on a top not counted; that rule was
  added after, the "before" ran without it but its hits were the wall);
  worst while sitting: hips 30 cm into the wall → tail base touching it (5 cm,
  skin).
- Study perch tour: worst into the wall 50 cm (ear, landing on the mantel)
  → 5 cm; sill head through the glass 31 cm → clear; tail into furniture
  2.7% → 3.0% of frames (now counting frames that used to be "hips inside",
  15.4% left are the armchair).
- Kitchen day: hips inside 13.6% → 1.5%; day seed 9 0.3%. No page errors.

Left (not this phase, or not solved):
- First step from the floor: she lands facing the wall (a half turn in the
  air would look wrong) and turns round on the .62-wide step: head or hips
  into the wall or the counter's end, up to ~23 cm, for a second or two.
- Turning to jump down from the mantel or sill: her hips swing near the wall
  (prejump, under a second).
- Not perches: her hips in the armchair, her body brushing her bed and the
  fountain walking, the counter and island sits (all in the "before" too).
