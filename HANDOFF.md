# Handoff: 2026-11-12 (night), looking around and touching her (phase 14)

## Next step (waiting on Merlin)
Preview build 264 (`84e4ebf`) at https://jvtomax99.github.io/Cat-app/preview/
has the new camera and touch. Merlin tried earlier builds and steered it;
on 264 he gave no complaint, but has not said "Go live" for it. Ask him:
go live with it, or what still feels off (one concrete case).
- Live in the fork (jvtomax99.github.io/Cat-app/) is `5656431` (published
  by the Deploy run of 16:19 UTC): no camera work. No MILESTONES row yet.
- Going live: `main` holds a commit that undoes the camera work, so first
  `git merge -s ours origin/main` on the preview branch, then push the sha
  to `main`, run "Deploy site", check `/version.json`.

## How it works now (Merlin's choices, in order)
1. Plan A (picked after comparing Nintendogs, Pokemon-Amie, Peridot,
   Talking Tom): she takes a touch by where it lands (chin favourite, tail
   and paws disliked, belly a trap until friends), stroking felt along the
   stroke, a floor tap calls her, pinch is one line in and out about her.
2. "Moving around still off": no leash or snap-back in the room view.
3. "Two fingers to move is off": one finger drags the room like a map
   (`grabPan`), around her it circles her; two fingers pinch, twist to
   turn, slide up/down to tilt; double tap the floor looks closer (a
   single tap calls her after 0.34 s); pinch far out returns to the room.
4. Watch on a phone framed the ceiling: `roomFrame` now shares spare
   height above and below.
Spec lines: SPEC.md "Looking around", "Touching her". Code map:
docs/ARCHITECTURE.md "Camera" and "Touch" (the Camera paragraph predates
steps 2 and 3: update it). Checks: `tools/qa/camera.mjs`, 17 of 17 PASS on
`84e4ebf` (about 12 min; run with `run_in_background`).

## Left
- Feel on a real phone is Merlin's call; the checks use simulated input.
- Dragging near the room's open front drifts up to about 17 px over a
  120 px drag (the camera arm shortens against CAM_BOX).
- Not built (plan B, "Not in v1"): carrying her, dragging food or brush,
  full-screen room. The app still opens on the whole room, not on her.
- Body-part spots go by bone name; tail and paw touch spheres are in
  `real-cat.js`. Check them on the long-haired Mochi if her rig differs.

## Paste into a new chat
> Read CLAUDE.md and HANDOFF.md. Camera and touch (phase 14) are on the
> preview at build 264. Ask Merlin: go live, or what still feels off. He
> also has the opening film cuts (A, B, C) to pick from.

---
# Earlier handoff: 2026-11-12 (evening), opening screen

## Next step (waiting on Merlin)
Merlin asked for a Runway film intro and approved the storyboard ("Render
the whole film"). The film is cut, 13.2 s, in three music versions; he has
them and must pick A, B or C, or name shots to redo. It is NOT in the app.
- Storyboard page: https://claude.ai/artifact/7dRXGQuqt78f4XDc6sjzHC
- Film without sound: `sources/title/film/mochi-film-silent.mp4`; music
  takes beside it (A storybook orchestra, B music box, C tiny epic). Mux:
  music delayed 0.5 s, faded out from 12.2 s. Key pictures:
  `sources/title/film-storyboard/`.
- Runway task ids (shots 1 to 6, 3 s each, 720p, 36 credits each):
  1512e762, 777ff498, 941a3198, de3a9330, 0e4d63c1, 9780f634. Key
  pictures: 033b9d18 (1), 1a24c14b (2), 53638c5d (3), b6c58cbf (4),
  f9e043ed (5), a48c712a (6). Cut: s1 1.0-3.0, s2 0-1.0, s3 0.3-2.8,
  s4 0-2.5, s5 0.2-2.4, s6 0-3.0.
- Credits: Runway 1,722 left (was 1,985 at the start of this session).
- After his pick, building it in is a big change (plan first): play the
  film after Enter on the first launch of the day in place of the zoomies
  sequence, tap skips, then the living title (logo, name, toys) over the
  real room. Day only: at night, in the Christmas look, or with
  `?mochi=first`, keep the zoomies sequence. The film's room is not quite
  the real study (bookshelves in shot 2). Add CREDITS rows and copy the
  chosen film to `dist/assets/title/`.

## Done this session (on the preview branch, pushed)
- Pocket Kitten logo on top of the title, her name kept under it, button
  "Play with <name>", three Meshy toys on the rug in the living title
  (`TITLE_TOYS` in `app.js`; `docs/ARCHITECTURE.md`). Side branch
  `claude/cat-app-opening-menu-vmvfz6` not merged.
- `tools/qa/title.mjs`: 9 of 9 PASS. Reviewer: no real bugs, four small
  points fixed. Left from the review: on a 320x568 phone the logo may
  crowd her (not checked by eye); toys are only asserted on the skip path.
- Still owed to Merlin: the true-speed clip of the living title
  (`node tools/qa/title-clip.mjs`, about 20 min) and a check whether
  https://jvtomax99.github.io/Cat-app/preview/ updates (Actions had never
  run on the fork).
- The session's checkout was a detached HEAD; it is on the branch now. A
  push is sometimes refused once as "non-fast-forward": fetch, and retry.

## Paste into a new chat
> Read CLAUDE.md and HANDOFF.md. Merlin has three cuts of the opening film
> (music A, B, C). Ask which he picked, then plan how it goes into the app.

---
# Earlier handoff (still holds)

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

## Go live, 2026-11-12: NOT live yet, blocked
- Merlin said "Go live" and picked: everything except the new camera and
  touch controls (he has not tried those on his phone; they stay on the
  preview branch).
- The live version is commit `5656431`: the preview branch at `5bccf2b`
  with the four camera commits taken out (`78b32e7`, `4cca5f2`, `bbc4a25`,
  `5bccf2b`). Checked: `npm run check`, `season.mjs`, `garland-nap.mjs`,
  stills of both rooms. It was pushed to `main` of **`jvtomax99/Cat-app`**.
- That did not publish anything. `jvtomax99/Cat-app` is a fork; it has
  zero workflow runs. The site (https://elbrilliant4.github.io/Cat-app/)
  is built from **`elbrilliant4/Cat-app`**, which the cloud sessions cannot
  reach. The site still shows build 216 (`1cfc013`, a commit that is not
  in the fork) and the preview build 220 (`c87a0ba`), both from 13:51 UTC.
  So the fork and the real repo have drifted apart, and nothing pushed to
  the fork today is on the preview link either.
- Needed from Merlin: connect `elbrilliant4/Cat-app` to the sessions, or
  say how the fork's work should reach it (a pull request from the fork).
  Do not add a `MILESTONES.md` row until the site shows the new build.
- When it can go live: `main` now holds a commit that undoes the camera
  work, so before the preview branch can follow it, run
  `git merge -s ours origin/main` on the preview branch (keeps the
  preview's files, camera included).

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
