# Handoff — 2026-11-11

## State
- Live: build 174 = `97f11c8` (walk and trot, Halloween away).
- Preview: `f027528` on `claude/expressive-cat-modern-ui-65z6r5`, phase 02
  (Vision) done, **waiting on Merlin** to look and say "Go live" (7 commits
  `ad829b7`..`f027528`; go live with the last one).
- Build numbers = commits on the branch; count in a full clone.

## Phase 02, in short
The vacuum never went through anything (measured); she did. Her tail now
keeps out of the kitchen's furniture (`clearTail` in motion.js, the
kitchen's `tailSolids`), the keep-out and the vacuum's lanes fit her body,
she boards and leaves the vacuum from a side with room, the gap by the
window steps is entered by its mouth. Numbers and leftovers:
`docs/phases/02-vacuum-vision.md`. Pictures: `qa-out/vision-evidence/`
(not committed; rerun `tools/qa/vacuum.mjs` to make new ones).

## Next (Merlin's order)
1. Merlin looks at the preview; "Go live" → `git push origin f027528:main`,
   check the Deploy workflow, add a row to `MILESTONES.md`.
2. Phase 03, the study: a `tailSolids` list in `studyLayout()` (app.js)
   from the study's furniture (room.js: beds, chair, mantel, bookcase,
   walls), and `tools/qa/tail.mjs` for both rooms (copy the body-point and
   solid-reading parts of `vacuum.mjs`). The mechanism is done.
3. Christmas decor (waiting on Orion's image), Miso (waiting on the .glb),
   phases 08, 09.

## Gotchas learned this phase
- Every pass that "should have worked" didn't until measured: run
  `tools/qa/vacuum.mjs` (2 seeds x 600 s, ~25 real minutes for both in
  parallel) after any change to kitchen.js margins, FLOOR, KEEP_OUT, the
  vacuum's pads or `clearTail`.
- The window lane is just wide enough for the vacuum with her aboard:
  `KEEP_OUT.x0`, the riding pad (.7) and `VAC_FLOOR_RIDE.x0` (-5.3) are
  tuned together; see ARCHITECTURE.
- `route()` drops any circle that holds the goal: never let a goal sit
  inside a padded circle (randomFloorPoint handles the vacuum's).
- The cloud container restarts kill background runs: launch them with
  `run_in_background`, outputs in the scratchpad, and check they finished
  (`overlap(s):` in the output).
- Screenshots in the QA nudge the clock a frame; same AT list = same run.

## Paste into a new chat
> Read CLAUDE.md and HANDOFF.md. Phase 02 is on preview waiting for
> Merlin. If Merlin says Go live, do that; otherwise do phase 03 for the
> study (docs/phases/03-tail-collision.md).
