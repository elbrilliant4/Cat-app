# Handoff: 2026-11-14, the fun changes are built (phase 17b)

## Next step
Phase 17b is on the preview branch, waiting for Merlin and Lettuce to try
it on a phone: brief `docs/phases/17b-fun-over-days.md` ("As built" and
"Left for Merlin and Lettuce"). Merlin approved the plan on 2026-11-13 and
picked needs "a bit faster" and "wish now, collection later". To see it
without waiting days: `node tools/qa/gifts.mjs` (stills of every gift).
Not looked at: the collar on the first Mochi (`?mochi=first`); a real
phone. Next for the fun side, when Merlin asks: things she finds and a
collection (SPEC.md "Later").

## Camera fixes (on the preview, build 384, waiting for a phone try)
Merlin picked the three camera fixes from the review (page:
https://claude.ai/artifact/YRrnVJZKRBrARzXUnccHH7). Done and pushed
(`496b210`, test tools `fdcf723`); waiting for him to try them on a phone:
- With no mode picked yet the app opens in Mochi mode (after the first
  steps for a new player). A player who pressed Explore keeps Explore.
- In Mochi mode the picture slides up by half of what the care buttons
  cover (the camera does not move); pinched close, her face is centred.
- Brush, Cuddle or Play pressed in Explore while she is out of the picture
  turns the view to her.
Checked: `npm run check`, `camera.mjs` 25 of 25, `sheet.mjs` 14, `return.mjs` 24.
Not checked: a real phone; the kitchen in Mochi mode at closest zoom.

Still open from the review, most important first: (1) fun: all gifts in
about two minutes of Brush, nothing after level 4, needs a plan and
Lettuce; (5) film on every launch; (6) washed-out day; (7) kitchen room
view, Bed view and turned study view framing; (8) buttons under 44 points,
labels 10 points; (9) the first hint covers the sound panel. App Store:
guideline 4.2, privacy policy, offline inside a wrapper not confirmed.

## Also waiting
Phases 17 and 18 are both on the preview (build 374, `281e611`), waiting
for Merlin and Lettuce to try them on a real phone:
https://jvtomax99.github.io/Cat-app/preview/ . Then notes or "Go live".

Phase 18 (phone speed and an offline copy), brief:
`docs/phases/18-phone-speed-offline.md`. To check on a phone:
- Add `?fps` to the address: the top-left box shows frames a second and
  the quality level. Wanted: Merlin's and Lettuce's numbers and phone models.
- Open once with signal, wait a minute, turn on airplane mode, open again
  (browser, and the home-screen icon). Does the opening film play offline
  on an iPhone?
Going live puts a service worker on the live site for the first time: keep
it on the preview a few days first. Off switch if it misbehaves: publish a
`version.json` with `"sw": false` (needs a line in `tools/build-site.sh`).

Phase 17, brief: `docs/phases/17-reasons-to-return.md`. To see the cards
without waiting: play until friendship level 2 (15 care), or leave the app
closed for 30 minutes.

A fresh cloud session can start with the local branch label on an old
commit: check `git log -1` matches the remote tip before committing.

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
- Phase 18: frame rate on a real phone (`?fps`), offline from an iPhone
  home-screen icon, the film offline in Safari.

## Waiting on Merlin
- Gifts for levels 5 to 9 (phase 17b; proposals in SPEC.md "Later").
- Should needs drop faster while away? Today a week away reads "All good".
- From the review, not started: a feedback
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
> Read CLAUDE.md and HANDOFF.md. Do the next step there: a full review of
> the app (visuals, camera, touch movement, how fun it is) for a future App
> Store release. Review only, with pictures; no changes until I pick.
