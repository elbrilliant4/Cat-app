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
- **Looking around** (preview, phase 14; plan A, Merlin 2026-11-12: the
  camera works for the player, the finger is for Mochi). Done when: pinching
  or scrolling is one line in and out about her (her face, all of her, the
  whole room): from the whole room, pinching in goes to her, and pinching
  far out gives the room back; the whole-room view lets the player look
  round and settles back by itself; zooming in always moves the camera, even
  after a wall stopped it; a flick glides on; two fingers twisting turn the
  view; a double tap on her gives a close-up that follows; following her
  keeps the player's zoom; on a phone there is no way to end up in a lost
  view (`tools/qa/camera.mjs`, every line `PASS`).
- **Touching her** (preview, phase 14). Done when: she takes a touch by
  where it lands: head and back welcome, chin the favourite, tail and paws
  not for touching (ears flick, a look, a word, no friendship; kept up, she
  moves away), belly only as a good friend (otherwise a playful trap);
  stroking is felt all along the stroke; rolling over is hers to decide, not
  every third pat; a tap on the floor calls her there unless she is busy or
  asleep (`tools/qa/camera.mjs`).
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
