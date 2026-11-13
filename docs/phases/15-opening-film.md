# Phase 15: Opening film and first steps

## Goal
Merlin (2026-11-12): a Runway opening film, and after ChatGPT's review of it,
an opening that ends in something the player does ("Tap the ball").

Done when: see SPEC.md, "Opening film" and "First steps".

## What was decided
- Film: third cut, four shots, first 9.8 s; from 2026-11-13 the long cut,
  13.5 s, the same shots at nearly full length (Merlin: "too short";
  `mochi-film-v3-long-A.mp4`: shot1 0.2-3.0, shot2 0.2-3.0, shot3 0-4.0,
  shot4 0.1-4.04, music from 0, faded out from 12.0 s). Four shots (wake, spots the ball, crouch and
  pounce, nudges the ball to the viewer and waits), music A (storybook
  orchestra). Sources, key pictures and Runway task ids:
  `sources/title/film-v3/` and HANDOFF.md of 2026-11-12. The last frame was
  made from a still of the real living title (`real-room.webp`).
- Plays on the first launch of every day (Merlin), only where the room looks
  like the film: plain study, long-haired Mochi, upright screen. At first day
  only; from 2026-11-13 by night too (Merlin: evening players never saw it).
  Everything else keeps the zoomies sequence. `?film=0` forces the sequence.
- First steps show once ever, only to new saves (Merlin approved the plan).
- Not in this version: teaching other care, a replay button, night or
  Christmas films (SPEC.md "Later").

## Check
`node tools/qa/title.mjs` (needs `npm run dev`). The test browser cannot
play mp4, so the test hands it `fixtures/mochi-opening.webm`. Sound and
start-up on a real iPhone can only be checked by hand.
