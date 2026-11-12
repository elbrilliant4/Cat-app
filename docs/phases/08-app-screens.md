# Phase 08: Friendly app screens

## Goal
Merlin: "real app ready", an easy, clear interface. The test group (phase
09) has to understand it on their phone with nobody explaining it.

## Known facts (iPhone 13 size, build on 2026-11-12)
Screenshot of the current home: one long web page, 1177 px tall on a
844 px screen, so the needs and level are below the fold.
- The header title is cut off: "pocke..." (the old name, Pocket Kitten).
- Her name and mood sit faded over the room, hard to read.
- Six view buttons (Room, Mochi, Food, Water, Bed, Watch) cover the right
  of the room and look like actions; "Water" is both a view and a need.
- The hint under the room is written for a computer: "click", "scroll to
  zoom".
- Credits and the build label sit on the main screen.
- No first visit welcome: a new player lands with no idea what to tap.
- `DESIGN.md` doesn't exist yet (`docs/design-rules.md` says make it first).

## How similar apps do it
- **Pou**: the pet fills the screen; four need icons along the top; arrows
  to change rooms; each room has one main action at the bottom.
- **Neko Atsume**: the yard fills the screen; one menu button opens
  everything else. Very calm, very little text.
- **Finch** (self-care pet): the pet home screen, a bottom tab bar, big
  rounded buttons, short friendly words, a gentle first-day walkthrough.

Where Mochi can be better: she's a real 3D cat living her own life, so the
screen should get out of her way more than these do. Needs show as small
rings that only grow and speak up when one gets low; no coins, no ads, no
nagging.

## Plan (proposed)
1. Make `DESIGN.md` first (template or not, 1 to 3 sites Merlin likes, the
   taste skill), from the current warm cream and pink look.
2. Phone home screen fits one screen, no page scrolling: the room fills it;
   a slim top bar (her name, mood, level ring, sound, day/night); the five
   care buttons as a bottom dock; the needs as a row of small rings.
3. The six view buttons become one "View" button that opens a small sheet.
4. Everything else (Moments, Care guide, rename, backup, decor, sound
   volumes, credits, build) moves into one "More" sheet.
5. Touch words everywhere ("tap", "pinch to zoom", "drag to look").
6. A first visit welcome: meet Mochi, name her (or keep "Mochi"), then
   three short tap hints over the real screen. Shown once.
7. Computer screens keep a side panel layout (room left, needs right).

## Assumptions (check these)
- Lettuce's save, journal and name carry over untouched.
- No new kinds of saved data except a "welcome seen" flag.
- No paid template unless Merlin picks one (budget $50 total).
- Orion sends a concept for the home screen and the sheets.

## Done when
A new person on a phone (375 px wide and up), with nobody explaining,
can within one minute feed, play with and pet Mochi, see how she's doing,
and find the backup code; the home screen needs no page scrolling, no text
is cut off, all words are touch words, and an existing save loads with
nothing lost.

## Test
Phone screenshots at 375, 390 and 430 px (light and night) before and
after; `npm run check`; save-checks with an old save; a first visit run in
a fresh browser. Then Lettuce tries it on the preview.

## Result (2026-11-12, on preview)
Merlin OK'd the plan; keep our look, no template, no style sites.
- `DESIGN.md` written from the current look.
- Phones: one screen, page height = screen height at 320, 390 and 430 px
  wide (was 1177 px on a 664 px screen). No text cut off (also with the
  preview build chip at 360x600).
- View button and menu replace the six view buttons; More sheet holds
  moments, guide, rename, backup, credits; level chip in the top bar.
- Touch words on phones. First visit: welcome sheet (name her), then four
  tips with "Skip tips"; tapping outside can't skip it by accident.
- Checked: every menu item, full screen and back, Feed, backup code, level
  chip; an old save (name, level 3, day 6, moments, decor) loads with no
  welcome; `npm run check`, `tools/qa/season.mjs`; no page errors.
- Reviewer caught: tap-outside skipped the welcome and lost the name; View
  menu could run off short screens; preview build chip squeezed her name;
  no skip for tips; wrong menu roles for screen readers. All fixed.
- Not done: a real person trying it with nobody explaining (Lettuce).
