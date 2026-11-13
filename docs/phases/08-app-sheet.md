# Phase 08: the room fills the phone, the rest lives in a pull-up sheet

Merlin, 2026-11-12: "I don't like how the menu is just one giant strip."
He picked the pull-up sheet (option 1 of three mockups: sheet, swipe cards,
needs on the room plus tabs). Status: **approved by Merlin (2026-11-12, "OK, build it here"), with the three assumptions below.**

## What it does (phones, under 720 px wide)
- The room fills the whole screen. No page scroll.
- A sheet sits at the bottom with two resting heights:
  - **Resting** (about 300 px): "Mochi needs" and the pill, the big card for
    the need that wants her most with its button, the five needs as small
    rings with their clay icons.
  - **Open** (about 85% of the screen): the same, then friendship, Moments
    (or the care guide) and the footer. Its inside scrolls if it must.
- Swipe the sheet up or tap its grip or header to open it; swipe down, tap
  the grip, or tap the room above it to close.
- The dock floats just above the sheet. Her name and mood stay top left.
- The camera frames her in the part of the room above the sheet.

## Who it's for
Lettuce first, then the test group: on a phone, Mochi and what she needs
are always on screen together, and nothing is more than one swipe away.
(Check the mockup with Lettuce before building if possible.)

## Done when
- On a 390 x 844 phone: Mochi, the top need and its button are visible
  without scrolling; the page itself never scrolls.
- Swipe up shows friendship and moments; swipe down brings the room back.
- A touch that starts on the sheet moves the sheet; one that starts on the
  room moves the camera. `tools/qa/camera.mjs` still 17 of 17,
  `tools/qa/panel.mjs` 4 of 4, `tools/qa/title.mjs` all PASS.
- Day, night and asleep all look right; reduced motion: no slide animation.

## Not in v1
- Dragging the sheet to any height (only the two stops).
- Hiding the sheet completely (the Watch button already gives full screen).
- Tablet and desktop layouts: unchanged (the panel stays a side column).

## Assumptions (Merlin to confirm)
1. The top bar (brand, "Good evening…", Day chip, sound, day/night) goes
   away on phones; its buttons move into the room's top-right buttons.
2. The sheet opens at "resting" every visit (it doesn't remember).
3. A tap on a need ring opens the sheet; it doesn't trigger care itself.

## How (for the builder)
- Reuse watch mode's full-screen stage (`body.watch` in `dist/style.css`)
  as the phone layout; the sheet is the existing `.panel` moved into a
  fixed container with a grip, `transform: translateY` between two stops.
- Pointer events on the sheet stop before the room's camera handlers
  (docs/ARCHITECTURE.md "Camera" and "Touch").
- Give the camera framing (`roomFrame`) a bottom inset equal to the
  resting sheet's height.
- 100dvh and safe-area insets for iPhone; solid sheet background (no
  backdrop blur over the 3D canvas, for speed).

## Mockups
`sources/layout-mockups/` (`layouts.png`; `layout.html?v=1`, `1b`, `2`, `3`) shows
"1 resting", "1 swiped up", "2 swipe cards", "3 needs on the room + tabs".
Similar apps: Finch (pet scene with a sheet and tabs), Pou and Tamagotchi
style (stats over the scene), the Interpreter Hub (capsule tab bar and
sheets).

## After Merlin's first try (2026-11-13): "takes too much of the screen"
- Resting, the sheet is one slim row of the five needs (no heading, no big
  card): about 13% of a 390 x 844 screen; sheet plus dock about 22%.
- The big card and its button show when the sheet is open; resting, the
  care button for what she needs most glows (`.wants`; the fountain camera
  button for water).
- Slimmer dock; camera buttons icons only; no Day chip on phones.
- The room view may run off the left and right edges on a phone held
  upright (`ROOM_CROP` .6 in `roomFrame`, `?crop=` to compare), so she is
  bigger.
