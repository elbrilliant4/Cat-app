# Handoff: 2026-11-12

## State
- Live: build 174 = `97f11c8` (walk and trot, Halloween away); `main` has
  since had docs and rules added (`43fdbf8`).
- Preview branch `claude/expressive-cat-modern-ui-65z6r5`: on 2026-11-12
  `main` was merged into it (Merlin's choice), so it now holds both lines
  of work: vacuum Vision (phase 02), the title screen and zoomies cinematic
  (11, 11b), move like a real cat (12), and the new **Christmas kitchen
  (phase 13)**. None of it is live; all of it waits on Merlin.
- Christmas kitchen: built in code from Orion's day and night pictures, no
  bought assets, no Meshy or Runway credits used. Shows in December, or now
  with `?decor=christmas` on the address, then the look picker. Stills:
  `DECOR=christmas node tools/qa/look.mjs`.

## Next (ask Merlin which)
1. Merlin looks at the Christmas kitchen on the preview and gives notes
   or "Go live" (go live takes the whole preview branch: check with him
   that phases 11, 11b and 12 are ready to go with it, or go live with
   less).
2. Phase 12, move like a real cat (`docs/phases/12-cat-motion.md`): paused
   by Merlin 2026-11-12, he is working on a new cat model. Ask before going
   on. The swat's third take still needs its clip
   (`SCENE=swat FPS=30 SEC=3.8 node tools/qa/clip.mjs`).
3. Phase 11b leftovers: music sting, paw-wipe, logo polish.
4. Phase 03, the study's `tailSolids` and `tools/qa/tail.mjs`.
5. Christmas for the study and the tree (phase 06), Miso, phases 08, 09.

## Gotchas
- Joined code measured 2026-11-12 (`vacuum.mjs` SEED 1 and 2, 600 s,
  classic look; Christmas adds nothing on the floor). The vacuum never
  touches anything. Her body does: 328 and 133 overlaps (phase 02 ended
  at 74 and 199, seeds not recorded, so not a like-for-like number).
  Worst: sitting with her hips 25 cm into the food bowl (seed 1, 107 s),
  an ear 24 cm into the counter walking at -3.07,-2.12 (seed 2, 32 s),
  jaw 11 cm into the island. Not yet known whether the merge caused it:
  run the same two seeds on `main` (`43fdbf8`) to compare before live.
  `legs.mjs`: worst 7 cm, a front leg sitting on the chair and mantel (the
  known leftover from phase 01).
- QA stills: the look picker redresses the room 120 ms after the tap, on
  real time; wait before stepping (see `look.mjs`).
- Merlin judges by eye and ear: send pictures, clips and sound files.
- The older notes still hold: background runs with `run_in_background`,
  one render at a time (two at once time out), software 3D is slow.

## Paste into a new chat
> Read CLAUDE.md and HANDOFF.md. The Christmas kitchen (phase 13) is on
> the preview waiting for Merlin's notes. Ask Merlin what's next.
