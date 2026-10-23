# Architecture

Plain ES modules in `dist/`, three.js vendored in `dist/vendor/`. No build
step. `npm run dev` serves on :5173. `npm run check` = syntax + care checks.
Publishing: `.github/workflows/pages.yml` deploys `main` at the root and the
preview branch (`PREVIEW_BRANCH` in that file) at `/preview/`, plus a review
pack (`tools/review-pack/`). `preview.yml` re-runs it on every push to the
preview branch.

## Files
| File | Job |
|---|---|
| `app.js` | The brain: state (`brain`, `pet`), behaviours, walking and jumping, camera, night, rooms, debug hooks. Big file; search by function name. |
| `motion-cat.js` | `MotionCat`: poses (`POSES`), walk and gallop gaits, foot placement and stepping, eating reach. |
| `motion.js` | `MotionRig`: IK legs (`solveLeg`, `reachShort` = how far a leg is short of its paw), spine, head and neck, tail (`drapeTail`, bed bounds), floor contact. |
| `cat-rig.js` | Builds the skeleton and skin weights from the Meshy model at load. |
| `real-cat.js` | Fur, eyes, face, ears, jaw; also the classic movement (`?motion=classic`). |
| `room.js` | `Room`: the study, bowl, fountain, window visitors (bird, moths, monarch). Shared methods live on `Room.prototype` (the kitchen uses them too). |
| `kitchen.js` | `Kitchen`: island, shelves, sink and faucet, pendant lamp, robot vacuum, terrace, dog (`?dog`). Layout constants in `K`; spots in `layout()`. |
| `decor.js` | Seasonal decor for both rooms; `pillowGeometry`. |
| `pet-state.js`, `save.js` | Care meters, saves, offline progress. |
| `sound.js`, `meows.js` | Short sounds and meows (no ambient loops). |

## Frame loop (app.js)
`frame(now)` → `updateCat(dt, t)` → `updateCamera(dt)` → `updateRoom(dt, t)` → render.

`updateCat` order: idle and night choices (`idleLife`, `nightLife`) →
movement toward `brain.target` (heading, turn caps) → eyes, head, gaze →
eating reach → pick a pose → `cat.update(dt, t, ctl)` (MotionCat).

## Behaviour model
- `brain.mode` (idle, feed, drink, play, brush, …) and `brain.activity`
  (walk, sit, eat, jump, …), set with `setActivity(name, seconds, then)`.
- Moving: `walkTo(point, then, run, anywhere)`, `jumpTo(perchName)`,
  `leap(...)`, `jumpDown`. Perches are listed in `PERCHES` (per room).
- Player actions go through `act('feed' | 'drink' | 'play' | …)`.

## Coordinates and sizes
- The active room is at the origin; `brain.pos` is in its frame. The other
  room is placed by `JOIN` (seen through the doorway; `cullThroughDoor`
  hides what's out of view).
- Her own frame: +z is forward. The root is near the front legs: front
  wrists at z +.23, hips at -.48, tail base at -.71. Standing nose about
  +.4 ahead; head down to eat, her mouth reaches about +.75 to +.9.
- Mouth point: `cat.bones.jaw.localToWorld(new V(0, -.015, .14))`.

## Gotchas (learned the hard way)
- **Study walks are clamped to the rug** (`onRug`) unless `walkTo(..., anywhere = true)`.
- The kitchen vacuum avoids the island with `route(from, to, pad)`
  (pad .45, .75 with her riding); `clampVacuum` keeps it out of the padded box.
- The motion rig resets the jaw and ears each frame (otherwise rotations pile up).
- Random choices make runs differ: seed `Math.random` (QA `open({seed})`).
  `setTimeout` and `performance.now` are real time: in QA they're put on
  virtual time (`lib.mjs`), else a busy machine changes the run.
- `MotionCat` paws: a standing (corrective) swing and a walking (`gait`)
  swing are advanced by different code; a swing of the wrong kind for the
  current mode is never finished (that was the dragged leg).
- Software WebGL is slow: step with `kitten.step(dt, n, false)` (draws only the last frame).
- github.io is blocked from the cloud container; check the deploy workflow run instead.
- Night: `clockNight()` (sunset table) or `?night=0` / `?night=1`.

## Debug (`?debug` → `window.kitten`)
`brain`, `pet`, `cat`, `room`, `kitchen`, `place`, `view`, `camera`,
`step(dt, n, draw)`, `act`, `setActivity`, `walkTo`, `jumpTo`, `jumpDown`,
`goTo('kitchen' | 'room')`, `stroll`, `stealSalmon`, `drinkFaucet`,
`vacuumRide`, `vacuumAttack`, `ridePendant`, `nightLife`, `setNight(bool)`,
`knockItem`, `tapCups`, and others (see the end of app.js).
URL flags: `?debug`, `?frames`, `?night=0/1`, `?dog`, `?motion=classic`.
