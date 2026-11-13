# Handoff: 2026-11-13, camera modes are live

## Next step
Live now: build 345, `8fb63a4` (phase 16, Explore and Mochi camera modes,
camera only; before it build 339, `7beff45`; rolling back is a force push:
ask first). Merlin said "Go live" before trying it on a phone, so next is
his and Lettuce's notes on how it feels. Known and not done: on phones the
two mode buttons are icons only (offer the words Explore and Mochi); a game
started from an Explore close-up may play off screen; the last full
`tools/qa/camera.mjs` run was 24 of 25, the 25th (double tap on her) was
fixed and checked alone, so run the script once more. Still held on the
preview, no "Go live" yet: the 20 s opening film. No `docs/CLEANUP.md`:
offer the cleanup audit.

---
# Handoff: 2026-11-13, opening film and first steps are live

## Next step
Live now: build 333, `f16091b` (the film's long cut, 13.5 s, Merlin's "Go
live" 2026-11-13; before it build 330, `8624a88`, film at night too; before
that `72e3372`). In this fork a push to `main` does not
publish: run the "Deploy site" workflow after it. Merlin compared the
second cut (eye close-up, leap) and chose to keep the third.
Phase 15 first went live as build 323, `72e3372` (Merlin: "Go live with everything",
2026-11-13). That push also took the phone sheet (phase 08) and everything
else on the preview branch live. Before it: `cdd41b3` (rolling back is a
force push: ask first). Next: Lettuce's reaction to the film and the first
steps; then phase 14b. Still owed, Merlin said "Later": true-speed clip of
the living title. Runway credits: 1,366 left. `tools/qa/title.mjs`: run it
alone (17 cases, about 90 minutes on the cloud machine).

---
# Handoff: 2026-11-12 (night), third cut of the opening film

## Next step
Merlin said the third cut is good ("Good, write the plan", 22:55 UTC). Film:
`sources/title/film-v3/mochi-film-v3-A.mp4`, 9.8 s, music A. NOT in the app.
Now: the plan for a big change (CLAUDE.md "Big vs small"): first look at 2
or 3 similar apps' openings and first-run steps, tell Merlin in a few lines,
then plan mode, list assumptions, wait for his OK. Nothing is built.
Decisions Merlin made tonight (not in SPEC.md yet, add them with the plan):
- The film plays after Enter on the first launch of every day, in place of
  the zoomies sequence; a tap skips. Night, the Christmas look and
  `?mochi=first` keep the zoomies (earlier outline, still stands).
- "Tap the ball" first step: ADD NOW, planned with the film. After the film
  the room is live, a short "Tap the ball" prompt, the first tap makes Mochi
  react at once, petting and care taught after. My proposal, not yet agreed:
  the prompt shows only the very first time, not every day. Note: the yarn
  ball is a title toy today (`TITLE_TOYS`), removed on entering the room, so
  the room needs a real ball. Show the plan to Lettuce before building.
- The film's last frame matches the living title (`real-room.webp`), so the
  hand-over should be a short cross-fade from film to the live room.
- Also: CREDITS.md rows for the film and music, copy the film to
  `dist/assets/title/` (1.7 MB), reduced motion gets no film.
- Another session pushes to this branch too (panel revamp): fetch and
  rebase before every push.
How the cut was made:
- Shot 1 wake: REDONE in the bright real room (Merlin asked), task
  932911f0, key picture 8dcf62c1 (`k1.webp`), `shot1.mp4`.
- Shot 2 spots the ball (over her shoulder), task e0675dc2, key picture
  67e501e9 (`k2.webp`). Use about 1.0 s.
- Shot 3 crouch and short pounce, task 0b5eefc6 (4 s), key picture 4b40b5d4
  (`k3.webp`). Use about 2.5 s.
- Shot 4 nudges the ball to the viewer, sits, waits: task ff8063f9 (4 s),
  DONE and good (`shot4.mp4`). Starts on 638c4681 (`k4s.webp`), ends on
  285df482 (`kE.webp`), which was made from a clean still of the real living
  title (`real-room.webp`, Runway upload asset 5a749de0). Use the last 3.0 s.
- CUT DONE (22:50 UTC): `mochi-film-v3-A.mp4` (music A) and
  `mochi-film-v3-silent.mp4`, 9.8 s, all four shots in the real room. Cut:
  shot1 0.9-3.0, shot2 0.5-1.7, shot3 0.5-3.2, shot4 0.2-4.04; music from
  0, faded out from 8.3 s. `last-frame-vs-real-room.png` is the comparison.
  Merlin has it; waiting for his OK or reshoot notes.
- After his OK on the cut: plan (big change, plan mode) for the film in the
  app PLUS the new "Tap the ball" first step: after the film the room is
  live, a short "Tap the ball" prompt, the first tap makes Mochi react at
  once, petting and care are taught after. Not in SPEC.md yet: add it with a
  "Done when" line when the plan is agreed; show the plan to Lettuce.
- Runway credits: 1,366 left (188 spent on this cut).
- Still owed, Merlin said "Later": true-speed clip of the living title.

---
# Handoff: 2026-11-12 (late), camera and touch live

## Next step
Opening film: Merlin picked cut A (storybook orchestra). Next is putting it
in the app as the opening (not built; ask how it should start and skip).
Phase 14 is live (build 267, `1aba265`); its notes are in docs/ROADMAP.md,
SPEC.md and docs/ARCHITECTURE.md (Camera paragraph predates one-finger map
drag: update it). Next phase after the film: 14b, long-haired Mochi motion.

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

## Second cut (2026-11-12, 21:50 UTC), replaces the first
Merlin asked to redo the weak shots. Shots 2, 3, 4, 6 were redone in the
real study; the film is now 14.9 s (`sources/title/film/mochi-film-silent.mp4`
is the second cut). Cut: s1 1.0-3.0, s2b 0-1.2, s3b 0.2-2.7, s4b 0-3.0,
s5 0.2-2.4, s6b 0-4.0; music laid from 0, faded out from 13.4 s. New
Runway tasks: shots 83099f7f (2), cd41e22e (3), 8d763002 (4), 08429c76
(6, starts on the last frame of shot 5); key pictures 72d9aadb (2),
9325e0a9 (3), 7ae37d9c (4). Runway credits left: 1,554. Merlin has the
three music versions and a 5-page storyboard PDF he is giving to ChatGPT
to review; wait for his notes and his music pick.

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
