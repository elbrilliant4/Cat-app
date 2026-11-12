# Phase 13b: the long-haired Mochi moves like a cat

Merlin (2026-11-12): "improve the movement and behavior of the new model.
The goal is to make it look like a natural cat as much as possible. I want
fluid movements." She is in the app behind `?mochi=longhair`
(`docs/mochi-longhair/README.md`); the first Mochi must not change.

## What is known (measured, `tools/qa/gait-chart.mjs`, first line of output)
|  | first Mochi | long-haired |
|---|---|---|
| hip joint height | 0.506 | 0.572 |
| shoulder joint height | 0.523 | 0.553 |
| hips apart (L to R) | 0.279 | 0.190 |
| shoulders apart | 0.238 | 0.171 |
| body length (front to hind paws) | 0.877 | 0.764 |

She is taller on her legs, much narrower and shorter in the body. The walk,
trot, gallop, jumps, poses and paw "homes" were tuned on the first Mochi's
numbers (phases 07 and 12), so on her they are off before any style
question. Seen so far: hind legs trail behind when standing, the crouch
kicks a hind leg back, sitting is rough. The rest of the gait chart (footfall
timing, stretch, bob and sway) had not finished when this was written: run
it first, old and new, walk and `RUN=1`, with
`FLAGS='&mochi=longhair&intro=0'` (one at a time: four at once take over
20 minutes).

## Plan, in this order (measure, change one thing, measure, show a clip)
1. **Frame rate first.** Fluid needs frames. She is 93,000 triangles plus
   the fur shells, and her weights are worked out at load for 140,000
   points. Time the load and the frame time on a phone-sized view
   (`&frames` shows the frame time). If she is slow, nothing else will look
   fluid: fewer shells, or weights worked out once and saved in a file.
2. **Proportions.** Find every number in `motion-cat.js`, `motion.js` and
   `POSES` (`real-cat.js`) that is a length in the first Mochi's body
   (stride, paw homes, hip and shoulder height, track width, reach caps)
   and make it come from her own bones, so both cats use one code path.
   Check the bone table again while there: her bones were placed by eye
   inside thick fur (hips at y .08), the joint heights above depend on it.
3. **Poses.** Stand (hind legs under her), sit (haunches tucked, front legs
   straight), crouch, loaf, sleep curl, on her proportions. Neutral light,
   `rig-check.html?rig=2&model=longhair`.
4. **Gaits.** Walk, trot, gallop footfalls against the targets in
   `docs/QA.md`; stretch under 2 cm; no paw slide.
5. **Fluid.** A number for it: frame-to-frame change of speed (jerk) of the
   head, chest and hips through walk, turn, sit down, stand up, jump. Then:
   eased starts and stops, weight shift before a step, the spine and
   shoulder blades following, the head held steady, the plume tail lagging
   and settling. No pose may pop.
6. **Behaviour.** List what she already does on her own (`SPEC.md`,
   `app.js` idle code) and what real cats do that she doesn't (slow blink,
   ear swivel toward a sound, stretch after sleep, look before a jump,
   grooming bouts). Show Merlin the list; new ones go to "Later" unless he
   says now.

## Not in this phase
New rooms or interactions; her fur, eyes, mouth and whiskers (the fur chat);
replacing the first Mochi (needs "Go live").

## Missing, said plainly
There are no animation recordings of a real cat for her (no motion capture,
no hand-made clips): every movement is worked out in code. That is why the
first Mochi took phases 01, 07 and 12, and it sets how natural she can get.

## Done when
Merlin watches clips of walk, run, turn, sit down, stand up and a jump (and
her on the preview link on his phone) and says they are fluid; gait numbers
within the `docs/QA.md` targets; the first Mochi's numbers unchanged.
