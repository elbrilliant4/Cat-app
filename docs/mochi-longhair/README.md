# Long-haired Mochi (candidate model)

Merlin asked (2026-11-12) for Mochi to match Orion's character sheet: a
long-haired seal bicolor ragdoll with a ruff and a plume tail. He chose a new
Meshy model over a new coat on the old one, knowing it sets aside the rule
"Mochi stays on her original model". **The app still uses the old Mochi.**
Nothing here is live or on preview.

## What exists
- `dist/assets/mochi-longhair.glb` (6 MB, 82,706 triangles, 2K colour and
  normal maps). Original with 4K maps: `models/mochi-longhair-meshy.glb`.
- Made from three standing views Meshy drew from the sheet
  (`sources/mochi-longhair-views/`), then Multi-Image to 3D (meshy-7.1, 2K
  geometry). 74 credits. The sheet itself is not in the repo.
- Her left foreleg repainted white below the elbow, as on the sheet (Meshy
  made both brown): `tools/mochi-longhair/repaint.py <original> <web copy>`.
- `dist/mochi-study.html`: the model alone under neutral light, drag to turn.
  `?bones` draws the measured skeleton. Pictures: `neutral-light.jpg`,
  `skeleton.jpg` here.
- `BONES_LONGHAIR`, `FACE_LONGHAIR`, `GROUND_Y_LONGHAIR` in `dist/cat-rig.js`:
  the app's bones (same names as `BONES2`) and face points, measured on this
  model. Midline x = 0, ground y = -0.62, facing +z, her left is +x.

## Second model, Meshy's top settings (2026-11-12)
Merlin: "use the best settings, cost is not an issue". Three new large views
(`sources/mochi-longhair-hq-views/`, finer fur, the right leg colours asked
for in the prompt), then Multi-Image to 3D: meshy-7.1, 2K geometry (the most
that endpoint has), 8K textures with PBR, 300,000 triangles; a 90,000
triangle copy for phones by Meshy's Remesh. 96 credits (170 in all).
- `dist/assets/mochi-longhair-hq.glb`; see it:
  `mochi-study.html?model=mochi-longhair-hq.glb`. Picture: `neutral-light-hq.jpg`.
- Better than the first: face and eyes, finer coat, leg colours right with
  no repaint. Worse: she stands mid-step (hind legs staggered, as the back
  view was slightly turned), so her bone table needs each side measured and
  rest fixes like the first Mochi's (`aim()` in `real-cat.js`).
- **Rigged (Merlin picked this model).** `BONES_LONGHAIR`, `FACE_LONGHAIR`
  and the `longhair` numbers in `cat-rig.js` are now hers, and
  `rig-check.html?rig=2&model=longhair` loads her. Picture:
  `rigged-poses.jpg`. Two fixes on the way: a model with over about 125,000
  points broke a `Math.min(...)` call in the weights; loose flecks of tail
  fur now follow the tail (`T.tailUp`). The first candidate
  (`mochi-longhair.glb`) is kept for comparison only; its bone table is in
  git history (commit `1d2b971`).
- `tools/mochi-longhair/measure.py <glb>` prints the landmarks a bone table
  is built from; `pack.py` makes a web copy.
- The 8K original is too big for the repo comfortably (95 MB; GitHub's
  limit is 100): Merlin should download it from Meshy before it expires
  there (task `01a1cd4a-6e89-7137-b41f-0d9decacdf03`).

## Candidate B: Merlin's own Meshy model (2026-11-12)
Merlin shared a model he made in Meshy (317 MB, 7.7 million triangles, fur
strands and whiskers as real geometry, no skeleton). Meshy's Remesh made a
90,000 triangle copy: `dist/assets/mochi-longhair-b.glb`, see it with
`mochi-study.html?model=mochi-longhair-b.glb`. Side by side with the rigged
model: `compare-merlin-model.jpg` (his on top). His: warmer cream closer to
the sheet, squarer stance. At phone size its strands collapse into flat
shards and it has no normal map; the face is flatter. Not rigged.

**Merlin's pick: the rigged model, warmed up.** Its coat colour is shifted
toward his model's warm cream by `tools/mochi-longhair/warm.py` (run on
Meshy's 90,000 triangle file, then `pack.py`); blaze, muzzle and paws stay
near white, eyes and nose untouched. Picture, three rows (his, before,
warmed): `compare-warmed.jpg`. Only `dist/assets/mochi-longhair-hq.glb`
is warmed; the 300,000 triangle copy in `models/` is as Meshy made it.
Meshy's license: Merlin says it allows a public site.

## In the app, behind a switch (2026-11-12)
Merlin asked to see her move before the fur was done. `?mochi=longhair` on
the app's address loads her in place of the first Mochi (`LONGHAIR` in
`app.js`); without it nothing changes. She walks, sits and uses the rooms
with the existing movement code. Clip: `walk-in-room.mp4`
(`SCENE=walk FLAGS='&mochi=longhair&intro=0' node tools/qa/clip.mjs`).
Her fur shells there still use the first Mochi's regions and lengths.

## Missing (not substituted)
- **A skeleton and skin weights in the file.** Meshy's rigging refused her
  ("not a humanoid"), no charge. Ours are worked out in code at load.
- **Real fur.** The coat is carved into the surface and painted; no hair
  cards, no direction or length maps. Our shell fur has to go on top.
- **Eyes.** Painted on the surface: no eyeball, no lids, nothing to blink.
- **A mouth that opens, a tongue, teeth, whiskers** (the old Mochi's are
  cut and built in `face-sculpt.js` and `real-cat.js` for her face only).
- **Paw pads and toes** underneath; toes are only suggested on top.
- **Poses.** One standing pose, tail up. Sitting, loafing, sleeping all have
  to come from the rig.

## Rigged (2026-11-12)
She takes the app's own skeleton now, behind a switch; the first Mochi is
untouched. `new RealCat({rig: 2, model: 'longhair'})` calls
`useModel('longhair')` in `cat-rig.js`, which swaps the bone tables, face
points, ground, midline and the weights' landmarks (`T`) in place (one model
per page). See her: `rig-check.html?rig=2&model=longhair`, then in the
console `check.pose('sit')`, `check.view('front34')`. Picture:
`rigged-poses.jpg`. For her, `real-cat.js` skips the face sculpt, the cut
mouth, the whiskers and the face retouch; the eye shader draws her eyes at
`FACE_LONGHAIR`.

Two things her build needed: leg skin goes to the nearest leg (her legs
stand close together), and a narrower midline limit (`T.mid`).

Known faults, not fixed yet:
- (First candidate: sitting was low, the crouch kicked a leg. On the
  top-settings model the sit reads as a sit; crouch and walk not looked at yet.)
- Standing, her hind legs trail a little behind her.
- Loading works out weights for 140,000 points: slow, to be timed on a phone.
- Contact points and petting colliders are the first Mochi's sizes.

## Fur layer (2026-11-12)
She has her own soft coat now (`furLengthsLonghair` in `real-cat.js`, numbers
in `FUR_LONGHAIR`). Body parts come from her skin weights, so the regions
follow her anatomy: long ruff, britches and plume, medium body and belly,
short lower legs, sleek paws, almost nothing on the muzzle, a small ear tuft.
Each part also has a comb direction (`furDir`): hair leaves the skin, bends
over to lie along the coat and sags a little. 20 layers on a computer, 9 on a
phone. Pictures: `fur-layer.jpg` (stand and sit; side, three-quarter, face),
`fur-face.jpg`. Take them again with
`node tools/qa/rig-shots.mjs <dir> --model=longhair --fur --size=1800x1400 stand:side sit:face`
(`check.fur(true)` and `check.view('face')` in the console do the same).
Loading her in the rig check took 7 to 8 seconds in the headless browser.

Not right yet: the eyes sit in a pale ring and look pasted on (next step);
the white blaze still shows the model's own carved flakes; ear edges are a
little ragged; the 9-layer phone coat has not been looked at or timed on a
phone.

## Next (each shown under neutral light first)
1. Poses on her proportions: sit, crouch, then walk in `motion-trial.html`.
2. Eyes close up at `FACE_LONGHAIR`, lids for blinking; then mouth and
   whiskers. (Fur layer: done, see above.)
3. Only then the app behind a flag (`?mochi=longhair`), room light,
   breathing, blinking, ears, tail. Then Merlin and Eagle compare.

## Open questions for Merlin
- **Which branch this goes to.** `main` and the preview branch
  (`claude/expressive-cat-modern-ui-65z6r5`) have each moved on without the
  other (16 and 13 commits). This work sits on
  `claude/mochi-cat-upgrade-pu4l2c`, cut from `main`, with the preview branch merged in
  (Merlin's choice, 2026-11-12). Neither `main` nor preview has the other's work yet.
- The Meshy plan's license for a public site (CREDITS.md).
- `TEAM-INSTRUCTIONS.md` still says Mochi stays on her original model.
