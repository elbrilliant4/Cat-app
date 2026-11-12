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

## Missing (not substituted)
- **A skeleton and skin weights.** Meshy's rigging refused her ("not a
  humanoid"), no charge. They have to come from our own rig code.
- **Real fur.** The coat is carved into the surface and painted; no hair
  cards, no direction or length maps. Our shell fur has to go on top.
- **Eyes.** Painted on the surface: no eyeball, no lids, nothing to blink.
- **A mouth that opens, a tongue, teeth, whiskers** (the old Mochi's are
  cut and built in `face-sculpt.js` and `real-cat.js` for her face only).
- **Paw pads and toes** underneath; toes are only suggested on top.
- **Poses.** One standing pose, tail up. Sitting, loafing, sleeping all have
  to come from the rig.

## Next (one step at a time, each shown under neutral light first)
1. Make `cat-rig.js` and `real-cat.js` take a model profile instead of the
   old model's numbers: bone table, face points, ground, midline, scale,
   rest fixes (none needed: she stands straight), `sculptFace` off, fur
   lengths by region. `computeWeights2` is full of the old model's
   distances (leg tops at y -.2, `TAIL_CUT`, `reachOf`): check each on her.
   Her fur is thick: weights by distance to bone will pull belly fur with
   the legs, look at `heat:` views in `rig-check.html`.
2. Show her in `rig-check.html` (`?model=longhair`): stand, sit, loaf, sleep.
3. Fur shells with longer lengths (ruff, britches, plume), eyes and lids in
   the skin shader at `FACE_LONGHAIR`, then mouth and whiskers.
4. Only then the app behind a flag (`?mochi=longhair`), room light,
   breathing, blinking, ears, tail. Then Merlin and Eagle compare.

## Open questions for Merlin
- **Which branch this goes to.** `main` and the preview branch
  (`claude/expressive-cat-modern-ui-65z6r5`) have each moved on without the
  other (16 and 13 commits). This work sits on
  `claude/mochi-cat-upgrade-pu4l2c`, cut from `main`. The rig work in step 1
  touches files the preview branch has changed (motion).
- The Meshy plan's license for a public site (CREDITS.md).
- `TEAM-INSTRUCTIONS.md` still says Mochi stays on her original model.
