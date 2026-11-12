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

## Next, in order (Merlin's picks, 2026-11-12)
A. Overlaps, compared with `main` (done 2026-11-12, same runs on
   `origin/main` `43fdbf8`): main has 99 and 224 overlaps, the joined
   branch 328 and 133 (323 against 461 in total). Main's worst are the same
   size: an ear 28 cm into the counter walking at -5.40,-2.41 (seed 2,
   525 s), her head 15 cm into the window wall, jaw 8 cm into the island.
   So this was mostly there before the join. New on the joined branch
   only: sitting with her hips 25 cm into the food bowl (seed 1, 107 s, she
   at 4.06,3.12). That one is fixed: she hopped off the vacuum to a spot
   hard by the bowl and sat down with her hips in it. The spot chooser
   (`kitchen.js`, the vacuum perch's `base`) is the same code on `main`,
   so the join did not break it, the run just went a different way; it
   now keeps .5 clear of the bowl, fountain and tent. Seed 1's first
   112 s: 81 overlaps before, 1 after (a 4 mm tail brush). The full 600 s
   runs after the fix: 158 and 223 overlaps (seeds 1 and 2; before 328
   and 133, so 381 against 461; a run goes a different way after any
   change, so one seed going up is not a sign of a new fault). The hips in
   the bowl are gone (worst at the bowl now: a wrist 10 cm in, walking
   past). The worst left is the same as before: an ear 24 cm into the
   counter walking at -3.07,-2.12 (seed 2, 32 s). The runs also list 23
   and 11 moments with her centre past the walking floor's edge; the
   earlier 600 s logs were not kept, so it is not known whether that is
   new. Check it on `main` when the head and ear work starts. The rest (heads and ears turned into the counter and
   window wall) is a phase 02 leftover, there on `main` too: Merlin chose
   (2026-11-12) to fix it after going live, as its own piece of work. He
   has not said "Go live" yet.
B. Christmas details (all four built 2026-11-12, on the preview, waiting
   for Merlin's eye). Orion's pictures were not in the session that built
   these (they are never committed): it worked from this list, so ask
   Merlin for the pictures before matching any closer.
   1. Curled nap: Merlin picked "light curl now". New pose `curl` in
      `motion-cat.js` (numbers only, used for the top-shelf garland nap;
      `tailWrap` says which side the tail wraps). She arrives from the
      left and lies with her back in the garland, face to the room.
      `garland-nap.mjs` passes day and night. To redo for the new model.
   2. Lamps: alabaster shades (drawn stone, lit from inside, warmer and
      brighter at night with a halo), brass arms, a brass band on each.
      Same shapes and places (she still rides the big one).
   3. Tent corner: a big round woven mat under the tent, a green plaid
      cushion propped in the back of the tent. The fountain's woven mat
      and the bowl's green mat were already there in every look.
   4. Shelves: two boards and a stack of bowls over the sink, books by
      the glasses, flat books with a brass dish and a framed pine print on
      the top shelf. Counter: a stoneware jar of utensils (in place of the
      crock) and a little fir in a clay pot (in place of the olive); both
      swap back in the other looks. Nothing she knocks over moved.
Done this session for Christmas: kitchen decor, warm walls and floor,
dappled sun, evening lights, her nap spot, study mantel pine and lantern,
plaid chair cushion, kitchen camera (wide screens) turned to yaw .15 so
the fireplace shows through the doorway.

## After that (ask Merlin which)
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

## The long-haired Mochi (joined in 2026-11-12)
Merlin picked a new Meshy model for Mochi and asked for her to replace the
first Mochi on the preview link (not live). She is the default cat now;
`?mochi=first` shows the kitten. Model, rig, fur, tail and what is missing
(whiskers, a mouth that opens, blinking unchecked): `docs/mochi-longhair/README.md`.
Movement fitted to her and the jolts taken out of stops, turns and jumps
(both cats): `docs/phases/13-longhair-motion.md`, `tools/qa/smooth.mjs`.
QA scripts run her by default; `MOCHI=first` runs the kitten.
