# Handoff: 2026-11-13, review done, waiting for Merlin's pick

## Next step
The full review is done (no app changes). Merlin picks what to fix first.
Review page with pictures: https://claude.ai/artifact/YRrnVJZKRBrARzXUnccHH7
Findings, most important first (390 x 844, touch):
1. Fun (big): all three gifts can be earned in about two minutes (Brush
   gives 3 friendship each time, no limit); needs drop 1 to 2.5 an hour and
   never under 30; levels 5 to 9 give nothing. Needs a plan and Lettuce.
2. She is 57 points tall (7% of the screen) in the Explore view the app
   opens in; 179 in Mochi mode. Open in Mochi mode, bring the room view in.
3. In Explore, Brush and Cuddle can land on a cat who is off screen.
4. Pinched all the way in, her face is behind the care buttons (the camera
   centres on the whole screen, not the free part above the buttons).
5. Film and three taps on every launch: suggest first launch only.
6. Day looks washed out next to night.
7. Kitchen room view, Bed view and the turned study view are badly framed
   on an upright phone.
8. Buttons under Apple's 44 points (40, 36, 30); labels 10 to 10.5 points.
9. The first hint covers the sound panel.
App Store: guideline 4.2 (not a repackaged website) is the main risk; a
privacy policy is required; offline inside a wrapper is not confirmed.
Not judged: smoothness, the film at true speed, sound, real-phone sharing.

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
