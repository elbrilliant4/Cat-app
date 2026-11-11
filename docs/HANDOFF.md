# Handoff — 2026-11-11 (evening)

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
   app) and picked "fix the motion code". Steps 1 (jumps) and 2 (the run) are on the
   preview branch; Merlin has not judged either yet (frame sheets for the
   jumps, an old | new sprint clip for the run). Next: step 3, the swat.
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
> Read CLAUDE.md and docs/HANDOFF.md, then go on with phase 12 (docs/phases/12-cat-motion.md), step 3: the swat.
