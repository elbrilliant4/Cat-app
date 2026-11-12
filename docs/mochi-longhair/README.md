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
- **Not rigged yet.** `BONES_LONGHAIR` is the first candidate's.
  `tools/mochi-longhair/measure.py <glb>` prints the landmarks to build her
  table from; `pack.py` makes a web copy.
- The 8K original is too big for the repo comfortably (95 MB; GitHub's
  limit is 100): Merlin should download it from Meshy before it expires
  there (task `01a1cd4a-6e89-7137-b41f-0d9decacdf03`).

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
- Sitting is low and sloped: the haunches don't tuck under. `POSES.sit` was
  tuned for the first Mochi's leg lengths; her legs are shorter under the fur.
- Crouch kicks a hind leg back.
- The fur shells still use the first Mochi's regions (`furLengths`), so the
  fur is hidden in these pictures.
- Contact points and petting colliders are the first Mochi's sizes.

## Next (each shown under neutral light first)
1. Poses on her proportions: sit, crouch, then walk in `motion-trial.html`.
2. Fur shells with her regions and longer lengths (ruff, britches, plume);
   eyes and lids tuned at `FACE_LONGHAIR`; then mouth and whiskers.
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
