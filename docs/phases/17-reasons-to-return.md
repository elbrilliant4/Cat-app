# Phase 17: reasons to come back

Merlin, 2026-11-13, after a review of the whole app: Mochi is lovely for two
minutes and gives no reason to open her the next day. Needs barely move
while you are away, a friendship level gave only a new title, and Moments
forgot after 12 lines. He picked "Reasons to come back" as the first fix and
approved the plan. Status: **preview, awaiting Merlin and Lettuce.**

## How similar apps do it
- Neko Atsume: cats visit while the app is closed; you come back to see who
  came and what they left; a book of cats and photo albums. You never see
  the cats do anything.
- Finch: the pet goes out and comes back with discoveries to tell you; they
  are text about places you never see.
- Talking Tom: levels unlock outfits and props, mostly behind coins and ads.
- Mochi: the story is made of things she really does in her rooms, so you
  can then watch her do them. Gifts come from friendship only.

## What it does
1. **While you were away.** Back after 30 minutes or more (a launch, or the
   app coming back from the background): a card with two or three things
   she did, picked to fit the hours that passed (day, evening, night), the
   season's look, and whether she was put to bed. One tap closes it. The
   first line is kept in Moments. The same absence always tells the same
   story. It is a story, not a recording, and never changes her needs.
2. **Gifts of friendship.** Level 2: a felt mouse. Level 3: a fabric fish.
   Level 4: her name on her food bowl. The friendship card names the next
   gift. A save already past a level gets its gifts on one card at the
   first launch. Play opens a toy basket once she has more than the ball;
   she stalks the mouse and the fish before she pounces (the felt bat's
   moves).
3. **Photo.** A camera button under Watch: a flash, a picture of the room
   with no buttons on it, her name and the date at the foot, then Share
   (where the phone can share a picture) or Save. On a phone the picture
   stops above the care buttons. The first photo is a Moment.
4. **Moments keeps 40 entries**, not 12.
5. Found on the way, and fixed: on a phone the friendship card was squeezed
   to a 36 px strip in the open sheet once the sheet's content was taller
   than the screen (a few Moments were enough). This was live.

## Not in this version
- Gifts for levels 5 to 9: phase 17b.
- Finding her where the story ended; things she finds and a collection; a
  photo gallery in the app; notifications; coins or a shop.
- Any change to how fast her needs drop. They drop too slowly to matter (a
  week away still reads "All good"); that changes the feel of the game for
  Lettuce, so it is its own decision.
- A shutter sound (the app has no such sound yet).

## Decisions and assumptions (Merlin approved the plan, 2026-11-13)
- Gifts are only ever added; nothing a player has is locked.
- Photos are not kept in the app and are not in the backup code.
- No new assets and no money spent: the three toy models were already in
  the app for the title screen.
- `DESIGN.md` does not exist yet, so the new cards reuse the existing
  dialog, snack-menu and button styles as they are.

## Checks
- `npm run check` (now also `return-checks.mjs`: story length, repeatable,
  fits the hours, asleep, season, gifts by level, the save).
- `node tools/qa/return.mjs` (390 x 844): 23 of 23 PASS, stills in `OUT`.
- `tools/qa/sheet.mjs` and `panel.mjs` still pass.

## Left for Merlin and Lettuce
- Try it on a real phone: Share and Save a photo on iPhone and on Android
  (the test browser cannot press a real share sheet).
- Are the story lines in her voice? They are in `dist/away.js`, one line
  each, easy to change or add to.
- Pick the gifts for levels 5 to 9 (17b).
