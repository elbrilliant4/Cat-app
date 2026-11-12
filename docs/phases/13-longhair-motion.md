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

## Done so far (2026-11-12)
- **Her joints** are at the first Mochi's heights (`BONES_LONGHAIR`): walk
  and run footfalls now match the first Mochi's chart; before, her front left
  paw took catch-up steps through most of a running stride.
- **`tools/qa/smooth.mjs`** measures jolts. It showed the two cats move alike,
  and three jolts in the shared code, now eased (they change both cats):
  1. Stopping dead on arrival (`app.js`, the walk): she eases down (+.06 in
     place of +.2) and the last of her speed dies away over a couple of
     centimetres. End of a run, change of speed at the head: 86 to 48 m/s2
     (first Mochi), 71 to 74 on her (not better: look at why).
  2. The body's tilt in a jump snapped to the arc's slope in one frame
     (`motion-cat.js`): now a spring. Turning change 1990 to about 430 rad/s2.
  3. A jump went from still to full speed in one frame and stopped the same
     way (`app.js`, `brain.jump`): a push-off over the first sixth and a
     landing over the last eighth. Head 1790 to about 580 m/s2, hips 820 to
     about 390. The rig also lets the floor's lift go with a spring
     (`motion.js`).
- **Second round, from the frame data (`OUT=` of `smooth.mjs`):**
  4. Every turn started at full pace in one frame (her hips whipped
     sideways turning round on the mantel): turns now gather pace and ease
     off (`TURN_ACC`, 40 rad/s2, `app.js`).
  5. Landing, the floor contact came a frame late (her speed read as
     walking) and her body popped up 5 cm: contact holds for .6 s after any
     time in the air, and her body stays above her root's level in the air
     (`bodyFloor`, `motion.js`, `motion-cat.js`).
  6. The landing dip was applied all at once (her head dropped 16 cm in one
     frame): eased in over .07 s. The landing's last eighth became a sixth,
     down to 15% of her speed.
  7. Stopping: she slows over the last centimetres before her old stopping
     spot (6 cm short of the target), so reach is as before.
- **Numbers now** (worst change of speed, m/s2; both cats alike): jump 225
  (was 1790), walk and sit down 25 to 40, stop after a run 36 (first Mochi;
  was 86). Body's worst change of turning in a jump: about 140 to 290
  rad/s2 (was 1990). Reach (`eat-reach.mjs`): bowl .10, fountain .35,
  salmon .09, faucet .02 (run with `ONLY=` each: run in one go, the faucet
  check moves her while the salmon one is still playing out and fails).
  Walk chart of the first Mochi unchanged.
- Not done: the 73 m/s2 at the head at a full run on the long-haired Mochi
  (frames 551-552 of the trip: her sideways speed drops to zero in a frame,
  probably the furniture push-out as she passes something), the 250 rad/s2
  head turn as the first Mochi sits down, what the 225 in a jump is (the
  push-off is 165 for six frames by design), frame rate on a phone, poses,
  the behaviour list, `legs.mjs` and `vacuum.mjs` after these changes.
