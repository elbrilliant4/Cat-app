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

---

# Earlier handoff from the preview branch (phases 11b and 12)

## Handoff — 2026-11-11 (evening)

## State
- Live: build 161 = `70ade23` (unchanged).
- Preview branch `claude/expressive-cat-modern-ui-65z6r5`, not live:
  the title screen (step 1), Halloween stored away, and now **phase 11b,
  steps 1, 2, 3 and 7**: Enter buttons, the zoomies sequence (7.6 s), glow
  and sun shafts, name reveal with shine and sparkles, skip, once a day.
  See the Result section of `docs/phases/11-title-cinematic.md`.
- Merlin was sent a true-speed clip (`tools/qa/title-clip.mjs`). Waiting on
  his view of it.
- GitHub Actions has 0 runs on this repo, so `/preview/` does not update.
  Only Merlin can check the repo's Actions settings. Until then the
  preview is a clip.

## Next
0. **Phase 12, move like a real cat** (`docs/phases/12-cat-motion.md`):
   Merlin finds her movement unnatural (run, jumps, vase pat, also in the
   app) and picked "fix the motion code". Steps 1 (jumps), 2 (the run) and 3 (the
   swat) are on the preview branch. Merlin said yes to the run; he has not
   judged the jumps (frame sheets) or the swat (old | new clip) yet. Next:
   step 4, the in-betweens.
   This comes before the music.
1. Merlin's notes on the clip (shots, pace, look).
2. Phase 11b, what is left: the music sting from Runway (step 5; 2 or 3
   takes for Merlin to pick by ear; the hit goes on the freeze at about
   7.2 s), the paw-wipe into the app (step 6), name ornament if wanted.
3. One look on Merlin's phone for speed (not measurable here).
4. Then as before: phase 02 Vision, Christmas decor (Orion's image), Miso
   (Merlin's .glb), phase 08, 09.

## Gotchas
- Merlin judges by eye and ear: send clips and sound files, offer choices
  as a picker.
- The title QA (`title.mjs`) needs `npm run dev` running and takes about
  25 min; a clip about 20 min (software 3D, about 2.5 s a frame). Use
  `tools/qa/title-shots.mjs` for quick stills of single shots.
- The room is big: Mochi sitting is about 1.1 units tall, the mantel is at
  2.76, the walls are 12 high. A camera looking steeply up sees past the
  wall tops (black).
- The olive tree stands at about (4.0, -1.45): keep it out of the mantel
  shots.
- A side-view clip (`clip.mjs`) takes about 15 min here; for a quick look
  at a move, take stills through it (see how `title-shots.mjs` steps).
- In the QA stepper, CSS animations only move when `anims()` is called
  each frame (see `title-clip.mjs`).

## Paste into a new chat
> Read CLAUDE.md and docs/HANDOFF.md, then go on with phase 12 (docs/phases/12-cat-motion.md), step 4: the in-betweens.
