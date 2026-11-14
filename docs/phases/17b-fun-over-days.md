# Phase 17b: fun that lasts more than one sitting

Merlin, 2026-11-13, after the store review (finding 1): a keen player has
seen everything in one sitting. He approved the plan the same day and
picked: needs "a bit faster", "wish now, collection later". Status:
**built, on the preview branch, waiting for Merlin and Lettuce on a phone.**

## The problem, in numbers (from the rules in `dist/pet-state.js`)
- A stroke gives 1 friendship and can repeat every 0.9 seconds with no
  limit. Level 9 needs 1100: about 17 minutes of tapping. Brush gives 3
  every 4 seconds: all three gifts (100) in a bit over two minutes.
- She drinks by herself and that also gives friendship, with no player.
- Levels 5 to 9 give only a new title.
- Needs drop 1 to 2.5 an hour, time away counts for 12 hours at most, and
  nothing goes under 30. A need "asks" under 40 (joy under 45). From a
  fresh kitten the longest absence leaves food 58, water 55, joy 70, clean
  80, energy 60: nothing ever asks.

## How similar apps do it (from the review page, their store pages)
- Finch: a morning and an evening check-in; the pet comes home with stories.
- Neko Atsume: almost no controls; a book of 48 cats to fill carries it.
- My Talking Tom 2: things to collect, prize boxes, behind coins and ads.
- Mochi can be better: the day's new thing is something she really does in
  her rooms and you can watch, and every gift comes from friendship alone.

## What it will do
1. **Friendship earned over days.** She reacts to every touch exactly as
   now (hearts, purr, needs go up). Only the friendship number slows:
   each kind of care counts in full a few times a day, then one tenth, and
   the tenths stop at 5 more a day. The day turns over at 4 in the morning.

   | Care | Each | Full times a day | Most a day |
   |---|---|---|---|
   | Stroke | 1 | 10 | 10 |
   | Brush | 3 | 2 | 6 |
   | Feed | 3 | 3 | 9 |
   | Water (you tap it) | 1 | 3 | 3 |
   | Play | 6 | 3 | 18 |
   | Her wish of the day | 5 | 1 | 5 |

   Best possible day: about 56. A normal day (one visit): about 25.
   The level numbers stay as they are (15, 40, 100, 180, 300, 480, 750,
   1100), so nobody loses a level.

   | Level | Best case | One visit a day |
   |---|---|---|
   | 2 and 3 (mouse, fish) | day 1 | day 1 and 2 |
   | 4 (bowl) | day 2 | day 4 |
   | 5 | day 4 | day 8 |
   | 6 | day 6 | day 12 |
   | 7 | day 9 | day 20 |
   | 8 | day 14 | day 30 |
   | 9 | day 20 | day 44 |

   Her drinking by herself gives no friendship. Friendship never goes
   down. The friendship card shows one soft line once the day's full
   counts are used: "A lovely day together. More tomorrow." No counters,
   no "limit reached".
2. **Gifts for levels 5 to 9** (all made in code or already in the app, no
   money):
   - 5: the yarn ball, a fourth toy in the basket (the model is in the app).
   - 6: fairy lights in the study, on in the evening (the Christmas
     kitchen's lights, reused).
   - 7: a ribbon collar, colour picked from six.
   - 8: one of your photos, framed on the study wall. You pick it after
     taking a photo; you can change it.
   - 9: a gold tag on the collar with her name.
   A save already past level 4 gets these one a day, not all on one card.
3. **One new thing a day: her wish.** Each day she fancies one thing:
   salmon, the felt mouse, a chin scratch, a brush, a photo, a game after
   dark, and so on (about 14, only things this player has). The sheet's top
   card says it in her voice. Do it: a special thank-you from her, a line
   in Moments, 5 friendship. Skip it: nothing is lost. Never the same wish
   two days running; the same all day, also after a reload.
4. **Needs that ask for you (if Merlin and Lettuce say yes).** Food and
   water drop about 5 an hour, joy 3, clean 1.5, and time away counts for
   24 hours, not 12. Left overnight she is a little hungry and thirsty in
   the morning; left a whole day she is also "Missing you". Still never
   under 30, never ill, never sad at you, and friendship never drops.

## Not in the first version
- Streaks, or anything lost for missing a day.
- Notifications ("she misses you"): needs the store wrapper.
- Things she finds and a collection screen. It is on "Not in v1" in
  SPEC.md. It is the stronger month-two hook (Neko Atsume runs on it), and
  it needs a new screen and about 30 pictures.
- Coins, a shop, anything after level 9.
- A guard against changing the phone's clock (only: a clock set backwards
  does not give a second day).
- New props or new things she does in the room.

## Assumptions
- Lettuce's save may already be far along. Not known. If it is at level 9
  the slower earning changes nothing for Lettuce; only the gifts, the wish
  and the needs do.
- "A day" is the phone's own date, turning at 4 in the morning.
- One rate for needs, app open or closed (a ten minute visit costs about 1
  point of food).
- The collar can sit on the long-haired Mochi without sinking into her fur
  and on the first Mochi too. Not tried. If it looks wrong: say so and
  propose another gift for 7 and 9.
- The framed photo is one small picture kept on this phone only. It is not
  in the backup code (phase 17 decided photos are not kept; this keeps
  one). A restored save shows an empty frame until a new photo is picked.
- The exact need rates get tuned in the build; Merlin sees a table of
  "left 8, 12, 24 hours" before it is called done.
- New saved data: today's counts and wish, the collar colour, which catch-up
  gifts were given, the framed photo. Old saves open unchanged.

## Checks (when built)
- `save-checks.mjs`, `return-checks.mjs`: the day's counts, the day turning
  over, the tenths stopping, a wish per day, gifts by level, catch-up one a
  day, need values after 8, 12 and 24 hours, an old save untouched.
- A phone-sized run with a pretend clock: three days played, stills of each
  gift, the wish card, the framed photo.
- Then the separate reviewer on the diff.

## As built (2026-11-14)
- Rules: `dist/pet-state.js` (`earn`, `today`, `DAY_FULL`, `DROP`),
  `dist/wish.js`, `dist/rewards.js`. Best day 56 (51 from care, 5 from the
  wish). Need rates: food 5.5 an hour, water 6 (2.5 asleep), joy 3 (1.5
  asleep), fluff 1.5, energy unchanged. From 90%: 8 hours leaves food 46,
  water 42 (all good); 10 hours food 35, water 30 (2 need you); 24 hours
  food 30, water 30, joy 30, fluff 54.
- The wish is a button under her name (44 points tall); the open sheet's
  big card also names it when nothing else is low. She says it once a
  visit.
- The fairy lights hang along the front of the mantel; the frame hangs
  over it; the ribbon colours are in the name card (tap the pencil).
- The collar on the long-haired Mochi: it peeks through her ruff at the
  front with the tag, and is under the fur at the sides and back, as on a
  real long-haired cat. Placed by eye over three rounds of stills. On the
  first Mochi (`?mochi=first`) its place is a guess: not looked at.
- Not built from the plan: nothing. Changed: the "more tomorrow" line shows
  once stroke, brush and play have each counted in full (feed and water
  are held back by her needs anyway).

## What the reviewer caught (fixed)
- A save from a phone whose clock had run ahead would have earned no
  friendship until that date came. Now a day more than one day off, either
  way, is dropped. Cost: a clock set back two days or more does start a
  new day (the plan only promised no defence against clock tricks).
- The collar came on up to 15 seconds after launch: now at once.
- The collar card said "tap her name"; only the pencil opens the name card.
- The "game after dark" hint could be read as the Rest button.
- A kept wish for a toy she does not have is swapped.
Left as it is: a different kitten restored from a backup code on the same
phone keeps the photo that hangs over the fire.

## Left for Merlin and Lettuce
- Try it on a phone. Does the collar look right to you up close?
- Which level Lettuce's save is at (past level 4 it gets a gift a day).
- Are the wish lines in her voice? One line each in `dist/wish.js`.

