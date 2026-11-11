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
