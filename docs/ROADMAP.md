# Roadmap

Status: `todo` · `doing` · `preview` (pushed, awaiting review) · `live` · `blocked`.
One phase per session (see `WORKFLOW.md`). Briefs are in `docs/phases/`.

| # | Phase | Status | Notes |
|---|---|---|---|
| 01 | [Leg drag](phases/01-leg-drag.md) | preview | Three causes fixed (stuck step when setting off, bed step-up, gallop reach). Left: a short front-leg stretch sitting down on perches, one high-shelf turn. |
| 02 | [Vacuum "Vision"](phases/02-vacuum-vision.md) | preview | Measured: the vacuum itself never went through anything; she did (tail off the vacuum into the counter, stools, dock; head and hips into the stool legs; body in the counter at two spots). Her tail now keeps out of the kitchen furniture (`clearTail`), the keep-out and the vacuum's lanes are sized for her body. Overlaps 2005 to 74 and 1625 to 199 per 600 s; the vacuum never touches anything; left: head turned while walking along a thing (to 15 cm), fur-deep tail brushes. Preview `f027528`, awaiting Merlin. |
| 03 | [Tail through furniture](phases/03-tail-collision.md) | doing | The kitchen is done in phase 02 (`clearTail` with the kitchen's solids). Left: the study's furniture list (`tailSolids` in `studyLayout`), `tools/qa/tail.mjs` for both rooms. |
| 04 | Miso, the second cat | blocked | Waiting for Merlin's Meshy .glb (blue British Shorthair kitten). Then: the cats play together; later, adopt more cats by levelling up. |
| 05 | Dog visit at the French doors | blocked | Code ready behind `?dog`; needs a proper (Meshy) dog model. |
| 06 | Christmas tree mischief | todo (December) | Mochi climbs and bats at the tree. |
| 07 | [Walk like a cat again](phases/07-walk-grace.md) | live (build 171) | Walk set to measured cat numbers, stutter-step fixed, a trot for every run, gallop only flat out. Merlin: "much much better". |
| 10 | Seasonal looks stored away | live (build 174) | Halloween hidden from the picker out of October (`?decor=halloween` shows it); a room left in it wakes up as Thanksgiving. Christmas: phase 13. |
| 11 | Title screen | preview | Her name over the real room while she sleeps; "Tap to wake her"; the camera glides out and the screen shrinks to the app. A music-box chime as she wakes (sound on only; Merlin picked take A). `?intro=0` turns it off. Test: `tools/qa/title.mjs`. Not built: an opening film, a replay or on/off setting, music. |
| 11b | [Title: zoomies cinematic](phases/11-title-cinematic.md) | in progress | Merlin: the title is "too simplistic"; wants it "exciting like Star Rail". Chosen: an in-room action sequence with the real Mochi. Built (preview, not live): Enter buttons, the 8 s sequence, glow and sun shafts, name reveal, skip, once a day. Still to do: logo polish, the music sting, the paw-wipe. |
| 12 | [Move like a real cat](phases/12-cat-motion.md) | in progress | Merlin: her movement is "awkward and unnatural" (run, jumps, vase pat, and in the normal app). Chosen: fix the motion code. Done on preview: jumps (real arc, push-off, landing), the run (a bounding gallop, back, level head, tail; Merlin: good), the swat (draw back, fast out, second tap, body leans in). Next: in-betweens, then re-cut the title. |
| 13 | Christmas kitchen | preview | From Orion's day and night pictures (2026-11-12): a look for the existing kitchen, built in code, no bought assets. Garland with fairy lights, bows, wreath, jug of pine, runner, clementines, lantern and baubles, evening glow under the shelves, her nap curled up in the garland, alabaster lamps on brass arms, a woven mat and plaid cushion at the tent, more on the shelves, a utensil jar and a potted fir on the counter. Offered in December; `?decor=christmas` shows it now. Stills: `tools/qa/look.mjs`. Not built: the study's Christmas decor, the tree (phase 06). |
| 08 | Friendly app screens | todo | Merlin wants it "real app ready": an easy, clear interface. Needs a brief with Merlin/Orion first. |
| 09 | Small test group | todo | Share with 10-20 people (different phones) with a way to send feedback, before the 1000-member group. |
| 14 | Looking around and touching her (the core handling) | preview | Merlin 2026-11-12: camera hard to steer, touching her feels scripted; a first pass at the camera (zoom to the fingers, no dead stretch, glide, twist) still felt off. Compared with Nintendogs, Pokémon-Amie, Peridot, Talking Tom: there the app frames the pet and the finger is for the pet. Plan A built: pinch is one line in and out about her, the room view settles back, no lost views on a phone; a reaction per body part (chin favourite, tail and paws disliked, belly a trap), stroking felt all along, roll-over hers to decide, tap the floor to call her. `tools/qa/camera.mjs` 17 of 17. Left for later (plan B): carrying her, dragging food and brush, full-screen room (phase 08). Her spots go by bone name, so a new model on the same rig keeps them; the touch spheres for tail and paws are in `real-cat.js`. |

## Done (live build 174, `97f11c8`)
Mouth reaches food and water; monarch butterflies; vacuum routing round the
island; per-leg reach and turn caps (leg drag reduced); tent flaps; night
mode and night-owl activities; kitchen seasonal decor. History:
`MILESTONES.md` and `git log`.
