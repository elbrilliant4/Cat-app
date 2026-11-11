# Phase 12 — Move like a real cat

## Goal
Merlin (2026-11-11, after the zoomies clip): "The cat's movement is awkward
and unnatural." He picked: **fix the motion code** (not bought animation
clips, not hiding it with the camera). Wrong to his eye: the run, the
jumps, the vase pat, and also in the normal app.

Done when: side-by-side clips (old | new) of a jump, a gallop and a swat
look right to Merlin, `gallop.mjs` and `legs.mjs` still pass, and the
title clip is re-recorded.

## Known facts
- The room is about 4x real size (Mochi sitting is 1.1 units tall, the
  mantel is at 2.76). Speeds and gravity must be scaled for her size, or
  she looks like a balloon.
- Jumps (before): `updateCat` eased her position with a smoothstep, so she
  sped up and slowed down in mid-air; time and height came from
  `dur = .5 + |up| * .06`, `arc = .18 + up * .22` (gravity about 14
  units/s² on the mantel jump; a real cat at this scale: about 35 to 40).
  In the air the paws were held in one fixed tuck.
- The gallop already bounds and bends the back a little
  (`motion-cat.js`, `rw * .14 * sin(gph)` on the spine, `.035` bounce).
  Earlier phases tuned paw timing (`docs/phases/01`, `07`), not the body.
- The swat is one paw moved to a fixed point in front of her
  (`ctl.swat`, right front paw only); the body, shoulders and head do not
  join in.
- The title sequence removed the crouch before the mantel leap and pops
  her between poses at the cuts.

## Where to look
`dist/app.js`: `updateCat` (the `J` block), `leap`, `jumpArc`, the pose
choice ("Body pose"), `cineJump` and `CUES`. `dist/motion-cat.js`: the
`air` branch for the paws, the pelvis block (bounce, pitch), `ctl.swat`.

## Plan
1. **Jumps** (done, see Result): a thrown thing's path, timed by gravity
   for her size; push-off, tuck, front paws reach for the landing; she
   sinks on landing and comes back up; the body follows the flight path.
2. **Run**: more back (bend and stretch with the stride), head held level
   while the body bounds, shoulders and hips rocking against each other,
   tail streaming behind and lagging in turns. Check the gallop speed for
   her size (2.6 units/s is a jog for a 4x cat).
3. **Swat**: weight shifts to the other front leg, shoulder and head lean
   in, the paw goes out fast and comes back slower, a second quick tap.
4. **In-betweens**: getting up from sleep (front end first, then a
   stretch), turning the head before the body everywhere, ears and tail
   that react a beat late.
5. **Title**: put a short gather back before the mantel leap, stop the
   pose pops at the cuts, re-time the shots, new clip.

## Test
- `SCENE=jump node tools/qa/clip.mjs` (old checkout and new, then
  `hstack`), same for `SCENE=gallop`.
- `node tools/qa/gallop.mjs`, `node tools/qa/legs.mjs`: numbers no worse.
- `node tools/qa/title-shots.mjs` for the title shots that have a jump.

## Result
Step 1, jumps (2026-11-11): `jumpArc(up, dist)` in `app.js` (`JUMP_G = 32`,
clears the higher end by `.12 + .06 * dist`, never faster than 5 units/s
across); position is linear across and a parabola up; `airTilt` and
`squash` go to the rig; the paws in the air follow the jump's progress.
The mantel jump went from 0.67 s to about 0.54 s.

Step 2, the run (2026-11-11), `motion-cat.js`:
- A dash (`ctl.sprint`: `brain.run` a number from 2.5) gallops from the
  first bound; before, she trotted up to speed and galloped for about 10%
  of a dash. Dashes also take off and brake harder (`app.js`).
- Strides: a steady 2.6 a second that lengthen with speed (`RUN_HZ`), each
  paw down for about .29 of travel (`RUN_STANCE`). Hind paws a sixth of a
  stride apart, then the front pair, then all four up (`PHASE_RUN`).
- Body: `flex` (back rounds as the legs gather, stretches as they reach),
  `saw` (front end up over the pushing hind legs, hips up over the planted
  front paws), a small side swing of hips against shoulders (`rock`).
- Head: `headLevel` in `motion.js`, the neck tips to keep the head at its
  usual height.
- Tail: streams out level at a run, follows the hips a beat late
  (`tailBob`), swings wide in turns (`tailLag`, a little when walking too).

| `stride.mjs` (sprint across the room, 2.6) | before | after |
|---|---|---|
| strides a second / length | 4.17 / 0.62 | 2.60 / 1.00 |
| galloping, share of the run | 60% (28% trot) | 96% |
| all four paws up | 1% | 14% |
| head bob | 14.8 cm | 10.5 cm |
| leg stretched over 2 cm | 0% | 0% |

`gallop.mjs`: stretched worst 4.6 cm → 1.4 cm; both hind paws up 21% → 45%
(over the old 40% line: the paws are down for a shorter push now and there
is a moment in the air; they still land a sixth of a stride apart, not
together). `legs.mjs`: floor walk stretched 0.3% / 3.1 cm → 0% / 1.9 cm.

Speed check: by her jump gravity (32) and hip height (.45) a true gallop
would start near 6 units/s; the rug is under 3 units across, so the dash
stays at 2.6 and the rhythm was fixed instead. 3.0 was measured too (legs
fine, 17% in the air), not switched on. Merlin saw the old | new clip
(`SCENE=sprint FPS=30 node tools/qa/clip.mjs`) and said the run is good.

Step 3, the swat (2026-11-11): a pat now takes `SWAT` = .62 s (was .45):
the paw comes up bent beside her chest and draws back, goes out fast (it
still hits at .22 s, so the vase, book and toy timings hold), comes half
way back, a second quick tap, then home slowly. `app.js` sends `swat` (paw
off the floor), `swatReach` (drawn back to right out) and `swatLean`;
`motion-cat.js` shifts her hips over the left front leg, rolls and turns
the chest so the right shoulder comes up and forward, slides that shoulder
blade, and leans the head in. Clip: `SCENE=swat FPS=30 node
tools/qa/clip.mjs`. Merlin on the first take: arm too stiff, body barely
moves, paw aims at nothing. Second take: the paw hooks up and over and
comes down on the thing itself (`ctl.swatAt` = `brain.swatAt`, clamped to
her reach; else a spot on the floor ahead: `patAt`), the wrist hangs and
flicks flat as it lands; the lean is about twice as big and the chest and
head dip more the lower the thing is (`dip`). In the title the two pats are still .45 s apart, so
the first is cut short: re-time in step 5.
