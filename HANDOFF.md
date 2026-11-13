# Handoff: 2026-11-13, phase 17 (reasons to come back) on the preview

Older handoffs (film cuts, Christmas kitchen, the fork's publishing) were
stacked here, 262 lines; they are in git history (`git log -p HANDOFF.md`).

## Next step
Merlin and Lettuce try phase 17 on a phone at
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
> Read CLAUDE.md and HANDOFF.md. Phase 17 is on the preview waiting for
> Merlin's notes. Ask Merlin what's next.
