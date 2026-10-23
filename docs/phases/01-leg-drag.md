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

## Result (preview, 2026-10-23)
**The old baseline numbers were not repeatable.** The QA page ran the
app's `setTimeout`s and its clock on real time while stepping virtual
time, so the same seed gave different runs (high shelf RH 63.8% one run,
0% the next, same code). `lib.mjs` now runs timeouts and the clock on
virtual time and reseeds after start-up: two runs of a seed now match
exactly.

Causes found and fixed (`motion-cat.js`):
1. **Stuck step when setting off.** A standing (corrective) step still
   under way when she started walking was never advanced by the walking
   code: the paw stayed down and was dragged at the end of its leg until
   she stopped. Now it becomes a quick walking step. (Seed 42: shelf walk
   LH 23% -> 0%, high shelf RH 5.9% -> 0%.)
2. **Bed step-up.** Walking into her bed she rises 17cm; planted walking
   paws stayed at floor height (legs up to 12cm short). Planted paws now
   follow her height, as standing ones already did.
3. **Gallop reach.** Front paws reached past the leg before landing, hind
   paws trailed past it at push-off. Run duty .36 -> .30, front landing
   nearer (`ahead * (1 - .3*runW)`), hind lift-off sooner (`-.05*runW`).
   `gallop.mjs`: worst 7.2cm -> 3.6cm (LF 11.3% -> ~4% of running frames,
   just over 2cm).

`legs.mjs` SEC=120 (walk + play rows; before -> after):
| seed | stretched >2cm | worst |
|---|---|---|
| 777 | 0.68% -> 0.21% | 7.3 -> 3.5cm |
| 42 | 2.75% -> 0.24% | 12.1 -> 6.9cm |

The check now skips paws raised on purpose (swat RF, groom LF): those were
false alarms (12-20% "stretched").

**Still open:** sitting down on a perch (chair, mantel, sill) the front paw
reaches 7cm too far for ~2 frames (sit pose `fdz` with a low chest); turning
while sitting on the high shelf, LF up to 6.9cm; one high-shelf walk turn
(LH 6.9cm, 1.6%).
