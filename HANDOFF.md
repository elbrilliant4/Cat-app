# Handoff: 2026-11-13, next is a full review of the app

## Next step
Merlin (2026-11-13): "Really analyze the visuals, the camera, the touch
screen movement when moving around, and how fun the app is. The intention
is to fine tune it here to release it on the App Store in the future."

Do a **review, not changes**: play the preview build the way a new player
would, on a phone-sized screen (390 x 844, touch), with stills and short
clips (`tools/qa/`, `docs/QA.md`; `camera.mjs` drives real two-finger
touch). Four parts: how it looks (her, the rooms, the buttons and sheet,
day and night); the camera (Mochi and Explore modes, framing, how small she
is in the room view); moving around by touch (drag, pinch, double tap,
what feels wrong or slow); how fun it is (first minute, what there is to do
after five minutes, reasons to come back). Compare with 2 or 3 pet apps
that are on the App Store. Give Merlin findings ranked by how much they
matter for a release, each with a picture, then a picker of what to fix
first. No code changes until he picks. The test machine draws in software,
so it cannot judge smoothness: say so, and use his `?fps` numbers if he
has sent them.

The App Store is new: SPEC.md says the app runs in the phone's browser.
It is noted under "Later" in SPEC.md; what a store release needs (a
wrapper app, Apple's rules for web-only apps, a developer account at $99 a
year) is a question to raise in the review, not to build.

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
