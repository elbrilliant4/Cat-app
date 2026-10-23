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
- Baseline, `tools/qa/legs.mjs` SEED=777 SEC=120, preview `52b536b`
  (rows with frames stretched >2cm):
  - **shelfHigh walk RH: 63.8%** (worst 3.3cm), the clearest problem.
  - floor walk: LF 5.9%, LH 5.8%, RH 7.6% (worst 16.9cm), RF 1.2% (12.3cm);
    planted-paw slide ~26–32cm total per leg.
  - floor prejump RH 11.8% (16.9cm), loaf LH 12% (4.4cm), swat RF 11.5%.
  - Many worst moments: straight walking at full speed (0.65, no turn),
    LH/RH ~4cm short. So the stride outruns the hind legs on the floor,
    not only in turns.

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
