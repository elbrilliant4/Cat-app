# Handoff: 2026-11-13, phase 17 (reasons to come back) on the preview

Older handoffs (film cuts, Christmas kitchen, the fork's publishing) were
stacked here, 262 lines; they are in git history (`git log -p HANDOFF.md`).

## Next step
Merlin picked (2026-11-13): **phone speed and an offline copy** as the next
phase (18). It is a big change: look at how 2 or 3 similar web apps load 3D
on phones, then plan mode, wait for his OK. Facts measured this session:
first load 12.5 MB in 46 requests; the cat `assets/mochi-longhair-hq.glb`
is 8.9 MB (3.3 MB of it two JPEG textures), 93,356 triangles, fur 9 layers
on a phone and 20 on a computer; three.js 2 MB, not minified; no service
worker; no quality step-down in the room (only `title-fx.js` has one); the
meshopt decoder is already in `dist/vendor/`. Frame rate on a real phone
has never been measured: ask Merlin for his and Lettuce's phone models.
Also check "Deploy site" run 43461836073 published phase 17 (preview
`version.json` should show `aecd788`).

Meanwhile, phase 17: Merlin and Lettuce try phase 17 on a phone at
https://jvtomax99.github.io/Cat-app/preview/ and give notes or "Go live".
Brief: `docs/phases/17-reasons-to-return.md`. To see the cards without
waiting: play until friendship level 2 (15 care), or leave the app closed
for 30 minutes.

## Done (preview branch)
- "While you were away" card, gifts at friendship levels 2 to 4 (felt
  mouse, fabric fish, her name on her bowl), toy basket on Play, photo
  button, Moments keeps 40.
- Fixed a live bug: the friendship card squeezed to a strip on phones.
- `npm run check`, `tools/qa/return.mjs` (23 of 23), `sheet.mjs`,
  `panel.mjs`.

## Not verified
- Share and Save of a photo on a real iPhone and Android phone (the test
  browser cannot press a real share sheet).
- Frame rate on a real phone (never measured for this app; the cat is an
  8.9 MB file and the fur draws her 9 times over on a phone).

## Waiting on Merlin
- Gifts for levels 5 to 9 (phase 17b; proposals in SPEC.md "Later").
- Should needs drop faster while away? Today a week away reads "All good".
- From the review, not started: phone speed and an offline copy; a feedback
  button before the test group (phase 09); Mochi is small in the room view,
  labels are 10.5 px; the opening now plays on every launch (three taps to
  reach her).
- SPEC.md open questions: free or paid, what counts as v1.
- Still owed from before: Lettuce's reaction to the opening film and first
  steps; then phase 14b (long-haired Mochi's movement). `DESIGN.md` does
  not exist yet (docs/design-rules.md says how to make it).

## Files to look at first
`docs/phases/17-reasons-to-return.md`, `dist/away.js`, `dist/rewards.js`,
"Reasons to come back" in `docs/ARCHITECTURE.md`.

## Paste into a new chat
> Read CLAUDE.md and HANDOFF.md. Do the next step there: plan phase 18,
> phone speed and an offline copy. Phase 17 is on the preview waiting for
> Merlin's notes.
