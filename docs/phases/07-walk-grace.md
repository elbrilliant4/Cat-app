# Phase 07 — Walk like a cat again

## Goal
Merlin (2026-10-24): her walk "is not cat like any more. She sort of struts,
a wee bit like John Travolta in Staying Alive, and her hind legs gallop if
she's running or chasing after a toy." When the new rig first went in she
"moved more gracefully, minus the flopping head and ears and minus the
levitating dragging legs." Get that grace back without bringing those back.

## Known facts
- Old vs new clips of a normal walk (`tools/qa/clip.mjs SCENE=walk`,
  before/after phase 01) look the same frame by frame: the strut is older
  than phase 01.
- The run: phase 01 (`c048b4b`) made the hind paws lift sooner at the gallop
  (`dk = duty - .05*runW`) and the run duty .36 -> .30. Hind legs now spend
  ~75% of a stride in the air: both hop together ("hind legs gallop").
  Revert that part first; keep the front-paw landing fix and the bed fix,
  then re-check `gallop.mjs` (LH was 7.5% / 7.2cm before it).
- Suspect for the strut (not proven): `6c56c04` "all four legs show more
  often" put the hind paws out wider than the hips (+.05 / -.055 m), the
  front paws in under the chest, front legs upright, a taller stance. With
  the walk's hip roll (`pelvis.roll .045`, `yaw .03`, `swayH .012` per hind
  swing in `motion-cat.js`), wide hips that roll read as a swagger.
- Versions to compare: `34d84a2` (new rig in the app), `7981a2b` (real
  steps again), `6c56c04` (wide stance), now.

## Where to look
`dist/motion-cat.js`: `home0` (stance), pelvis roll/yaw/sway in "State for
the rig", `stride`/`duty`, `PHASE_RUN`, the `runW` threshold (gallop starts
at speed 1.0; chasing a toy may want a trot, not a gallop).

## Plan
1. Revert the hind lift-off change; `gallop.mjs` + run clip.
2. Clips of the same walk at `7981a2b` and now, side by side (copy
   `tools/qa/lib.mjs` and `clip.mjs` into the old checkout). Send Merlin.
3. Ask Orion (Work Orion, technical animator) for notes on the clips (see
   below). Change stance width, hip roll, stride one at a time, a clip each.
4. Keep phase 01's numbers: `legs.mjs` seeds 777 and 42 must not get worse.

## For Orion (paste with the clips)
"Here are side-view clips of Mochi walking and running: an earlier build
Merlin liked, and today's. Merlin says she now struts and her hind legs hop
together when she runs. As a technical animator: what's off compared with a
real ragdoll kitten? Please be specific: stance width (front and hind), hip
sway and roll, head bob, step timing (which paw when), stride length, how
low she carries her body, and the run (trot vs gallop, when each). Numbers
or frame references if you can, and one or two real cat video references."

## Test
Clips side by side; Merlin's eye decides. `legs.mjs` and `gallop.mjs` no
worse than phase 01's result.

## Result
(fill in)
