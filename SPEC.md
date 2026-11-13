# Mochi: spec

Drafted 2026-11-11 from the current app and docs. Merlin: fill the gaps
marked **(Merlin?)** and check "Not in v1".

## What it is
A virtual-pet web app. Mochi, a realistic seal-point ragdoll kitten, lives
in a cosy study and a kitchen that you watch and care for. She lives her own
life (roams, climbs, naps, rides the robot vacuum, eats, plays at night);
you feed, pet, brush and play with her, and your friendship grows. Runs in
the phone's browser and can be added to the home screen.

## Who it's for
- **Lettuce** plays with the live app. Whatever is live is what Lettuce sees.
- **Next: a test group** of 10 to 20 people on different phones (phase 09),
  then a group of about 1000. They need it easy and clear without anyone
  explaining it, working on their phone, and their cat kept safe.
- **Merlin** owns it and reviews every change on the preview.
- Goal (Merlin): a commercial-quality app.
- **(Merlin?)** Free, paid, or not decided yet?

## Features (live) and Done when
- **Mochi looks like herself.** Done when: she's recognisably the same
  peculiar, endearing kitten (her Meshy model, fur, real eyes), checked in
  close-ups in the review pack.
- **She moves like a cat.** Done when: the walk matches measured cat numbers
  with no stutter-step, she trots for every run and gallops only flat out,
  no leg stretched more than ~4 cm (`tools/qa/legs.mjs`).
- **Two rooms.** Done when: she walks between the study and the kitchen
  through the doorway, and the player can switch rooms and views.
- **Looking around** (live, phase 14; plan A, Merlin 2026-11-12, then
  "moving around still off", "two fingers to move is off" and "zoom goes to
  the walls, hard to aim": pinch aims at the fingers, tilt follows zoom,
  turning stops before a wall). Done when:
  in the room, one finger drags you about it like a map (the floor stays
  under the finger) and the view stays where you leave it; around her, one
  finger circles her; two fingers pinch to zoom towards the spot between them
  (on her: to her; never into a wall) and twist to turn, and a turn stops
  before the camera would back into a wall; closer in, the view tilts down
  to her level, further out it looks down over the room; a double tap on the floor goes closer to that spot (again
  when close: the whole room); pinching in from the whole room goes where the fingers are,
  and pinching far out from anywhere gives the room back; zooming in always
  moves the camera, even after a wall stopped it; a flick glides on; a
  double tap on her gives a close-up that follows; following her keeps the
  player's zoom; Watch shows the whole room (`tools/qa/camera.mjs`, every
  line `PASS`).
- **Touching her** (preview, phase 14). Done when: she takes a touch by
  where it lands: head and back welcome, chin the favourite, tail and paws
  not for touching (ears flick, a look, a word, no friendship; kept up, she
  moves away), belly only as a good friend (otherwise a playful trap);
  stroking is felt all along the stroke; rolling over is hers to decide, not
  every third pat; a single tap on the floor calls her there unless she is
  busy or asleep (`tools/qa/camera.mjs`).
- **Opening film** (live, phase 15). Done when: on the first launch of
  the day, by day, in the plain study, with the long-haired Mochi and an
  upright screen, Enter plays the film "Mochi and the yarn ball" (9.8 s,
  its music only with "Enter with sound"); a tap skips it; it fades into
  the living title with no visible jump in the room; at night, in a
  seasonal look, with the first Mochi or on a wide screen the zoomies
  sequence plays instead; a film that cannot load never leaves a black or
  stuck screen (`tools/qa/title.mjs`).
- **First steps** (live, phase 15). Done when: a new player sees "Tap the
  pink ball" once, a tap on the ball starts play at once, then one "give her
  a stroke" hint, and neither shows again, also after a reload; a save from
  before never sees them; the ball stays tappable for good.
- **Opening screen.** Done when: the first launch of the day plays the
  zoomies sequence with the real Mochi and ends on the Pocket Kitten logo
  with her name under it (the name can be changed, the logo cannot), her
  toys on the rug beside her and "Play with <name>"; a tap skips at any
  moment; other launches show the short title (`tools/qa/title.mjs`).
  Merlin changed his mind on a generated film (2026-11-12, evening): a
  13 s Runway film, "Mochi and the yarn ball", is cut and waiting for his
  pick of music; it is NOT in the app yet (`HANDOFF.md`).
- **The screen on a phone** (live, build 323, phase 08; Merlin 2026-11-12 picked
  the pull-up sheet over swipe cards and needs-on-the-room). Done when: on
  a phone the room fills the screen and never scrolls; a sheet at the bottom
  shows what she needs most with its button and the other four needs; a
  swipe up (or a tap) opens it to friendship, moments and the care guide; a
  swipe down or a tap on the room closes it. Tablets and computers keep the
  side panel. Brief: docs/phases/08-app-sheet.md.
- **Care panel look** (live, builds 284 and 294). The need that wants her
  most is a big coloured card with its button; the rest fill like glasses;
  glossy icons on the needs, dock, moments and guide (made with Meshy, then
  Runway).
- **Care.** Done when: a player can feed, pet, brush, play with and put her
  to sleep, and the meters (food, water, happiness, energy, cleanliness)
  respond.
- **Friendship.** Done when: care raises the bond, the level bar fills, and
  the journal records moments.
- **Saves.** Done when: closing and reopening keeps her name, meters and
  journal, time away counts, an update never loses a save, and the player
  can copy a backup code and restore from it.
- **Her own life.** Done when: left alone she roams, climbs shelves and the
  bed, eats and drinks with her mouth at the bowl, fountain, salmon or
  faucet, rides the vacuum, and never goes through furniture
  (`tools/qa/vacuum.mjs`).
- **Night.** Done when: the sun/moon button switches lighting and she does
  night-owl things.
- **Seasonal decor.** Done when: decor shows in its season only (Halloween
  in October, Thanksgiving, Christmas in December), stays put day and
  night, and her routes stay open.
- **Christmas kitchen** (preview, from Orion's day and night pictures).
  Done when: in December the look picker offers "Christmas at the Beach
  House"; the kitchen then has the pine garland with fairy lights on the
  top shelf, velvet bows, the wreath on the glazing, pine in a jug, the
  runner with clementines and walnuts, the lantern with baubles, and in
  the evening the lights and the glow under the shelves come up; she naps
  on the top shelf by the garland; her routes stay open
  (`tools/qa/vacuum.mjs`). The study keeps its classic look, with pine
  and a brass lantern on the mantel and a plaid cushion on the armchair
  (seen through the doorway).
- **Sound.** Done when: sound is off until the player turns it on, only
  short occasional sounds play (meows, purr, soft clinks), with separate
  volume for her and the room.

## Phases
Build order and status: `docs/ROADMAP.md` (a brief per phase in
`docs/phases/`). Next up: phase 03 (tail in the study), then Christmas
decor, Miso, phase 08 (app screens), phase 09 (test group).

## Not in v1 (draft, Merlin to confirm)
- Picking her up or carrying her, dragging food or the brush to her (plan
  B of phase 14; "Later" unless Merlin approves).
- **(Merlin?)** What counts as v1: what the test group (phase 09) gets?
- Accounts, logins, or saves that move between devices (saves stay on the
  phone; backup codes cover moving).
- Continuous or ambient sound, including the vacuum's sound.
- Spotify (on hold).
- The dog visit, until there's a proper model (code waits behind `?dog`).
- **(Merlin?)** Miso: v1 or later?
- **(Merlin?)** Payments, ads, notifications?

## Later
- First steps for food, water, brushing and sleep (ChatGPT's review of the
  opening film, 2026-11-12; v1 teaches only the ball and a stroke).
- A "watch the film again" button; a film for night and for Christmas.
- Miso, the second cat (blue British Shorthair), and the cats playing together.
- Adopting more cats by levelling up.
- Christmas tree mischief (phase 06, December).
- The dog visit at the French doors.
- Friendly app screens (phase 08): "real app ready".
- Sharing with the 1000-member group after the test group.

## Decisions
- Nothing goes live without Merlin's "Go live"; one preview branch,
  published at /preview/ (no per-feature branches, no Vercel). 2026-11-11.
- Asset and design budget: $50 total. 2026-11-11.
- Preserve her identity, not her imperfections; paid Meshy only for new
  characters. (TEAM-INSTRUCTIONS.md)
