# Phase 18: phone speed and an offline copy

Status: **approved by Merlin 2026-11-13, speed and offline together.** Building.

## Why
The test group (phase 09) opens the app on their own phones and data plans.
Today the first open downloads 12.5 MB in 46 requests, 8.9 MB of it the cat.
Nobody has measured how smoothly the room runs on a real phone, and with no
signal the app does not open at all.

## How others do it
- **Google model-viewer**: shows a still picture at once, loads the 3D model
  behind it, then swaps it in. (modelviewer.dev/examples/loading)
- **drei (the three.js toolkit most web 3D apps use)**: watches the frame
  rate while the app runs and lowers the picture sharpness when it drops,
  raises it again when there is room. (drei.docs.pmnd.rs/performances)
- **Workbox (Google's offline kit for web apps)**: keeps a named copy of each
  build on the phone, swaps the whole copy when a new build is out, deletes
  the old one. (developer.chrome.com/docs/workbox/modules/workbox-precaching)

Where Mochi can be better: the title screen already is the "still picture",
so the wait can be her asleep, not a loading bar. And the step-down can drop
fur layers before sharpness, which a generic toolkit cannot do.

## What gets built
1. **A smaller cat file.** Pack `mochi-longhair-hq.glb` with meshopt (the
   unpacker is already in `dist/vendor/`). Trial on a copy: 8.9 MB to 5.3 MB
   with the shape untouched. Then half-size textures for phones (2048 to
   1024), aiming at about 3 MB on a phone. Computers keep the full textures.
2. **Smaller code.** Minify three.js (2 MB of readable source today). Check
   nothing big loads at start that is not needed (the 3 MB portrait icon,
   the film before Enter is pressed).
3. **A quality step-down in the room.** Measure frame time while she plays.
   Too slow for a few seconds: first less sharpness, then fewer fur layers
   (9 to 6), then simpler shadows. Never steps down on a phone that keeps up.
4. **An offline copy.** A service worker keeps the files the app really uses
   (not the three old cat models in `dist/assets/`, 21 MB). Second open works
   in airplane mode, in the browser and from the home screen. A new build
   replaces the whole copy on the next open. It takes over the job of the
   "fresh files" script in `index.html`, so there is one update system.
5. **Proof.** `?fps` shows frames per second on screen, so Merlin and Lettuce
   can read it off their phones. `tools/qa/load.mjs` counts bytes and
   requests, opens the app offline, and checks a new build arrives.

## Done when
- First open on a phone downloads under 6 MB (12.5 MB today).
- After one open with signal, the app opens and plays in airplane mode,
  from the browser and from the home screen, with the save intact.
- A new build shows after at most one reopen, never a mix of old and new.
- On Merlin's and Lettuce's phones the room holds 30 frames a second, or
  steps down until it does.
- She looks the same on a computer, side by side with today.

## Not in this version
- Notifications, saves that move between phones, app-store packaging.
- A lighter cat shape (fewer triangles): her skeleton is fitted to this
  exact shape at load, so that is its own job.
- GPU texture formats (KTX2): needs a 500 KB unpacker for little gain here.
- An "update ready" banner. The swap happens on the next open.

## Assumptions (to check while building)
- Packing moves her vertices by a hair; `cat-rig.js` fits bones from vertex
  positions. If the fit shifts, pack without rounding (a bigger file).
- WebP made her textures bigger in the trial (6.3 MB), so they stay JPEG.
- GitHub Pages keeps files for 10 minutes; the worker file must not be kept
  longer or updates stall. Not confirmed from GitHub's own docs: test on
  the preview path.
- The film is fetched in pieces; whether Safari plays it from the offline
  copy is not confirmed. If not, offline falls back to the zoomies title.
- iPhones delete a website's stored files after 7 days without a visit in
  Safari (webkit.org/blog/10218). Home-screen apps are counted separately.

## Biggest risk
A broken service worker can pin every player to an old build with no way
for us to reach them. Guards: the worker asks `version.json` over the
network first every time, `?sw=off` removes it, and it ships to the preview
for several days before any "Go live".

## Needed from Merlin
- His and Lettuce's phone models.
