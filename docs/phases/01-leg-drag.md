# Phase 01 — Leg drag

## Goal
Merlin: "one leg dragging here and there (different legs)", "like gliding",
"saw it again when she was on one of the shelves (left hind)".
No leg should look dragged or slide while planted.

## Known facts
- A leg looks dragged when its paw is planted further than the leg can
  reach (`reachShort` > 0 in `motion.js`) or a planted paw slides.
- Fixed so far (build 137): per-leg reach scaling (`this.reach[k]`), turn
  caps on the floor and on perches, an earlier catch-up step, higher step
  lift. Seeded test: left hind over-stretch 15.6% → ~3% of walking frames;
  shelves: over-stretch ~5% → <1%.
- Baseline from `tools/qa/legs.mjs`: (see Result once measured)

## Where to look
`motion-cat.js` `update`: `LEASH`, `reach`, stepping (catch-up at
`> .65*rk`), stance home positions, crouch-while-moving blend.
`app.js`: turn caps (`1.2 rad/s` resting, `1.8 + speed*2.2` walking).

## Plan
1. Run `tools/qa/legs.mjs` (2–3 seeds); find which activity, place and leg
   has the most stretched frames and the worst moments.
2. Fix the cause there (step timing, turn rate, or pose), not with a
   bigger leash.
3. Re-run; screenshots of the worst moment before and after.

## Test
`node tools/qa/legs.mjs`. Target: stretched >2cm under 1% of frames in
every row, worst under 4cm, no visible slide.

## Result
(fill in)
