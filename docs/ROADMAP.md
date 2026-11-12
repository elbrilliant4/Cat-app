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
| 10 | Seasonal looks stored away | live (build 174) | Halloween hidden from the picker out of October (`?decor=halloween` shows it); a room left in it wakes up as Thanksgiving. Christmas: waiting on Orion's image. |
| 11 | Title screen | preview | Her name over the real room while she sleeps; "Tap to wake her"; the camera glides out and the screen shrinks to the app. A music-box chime as she wakes (sound on only; Merlin picked take A). `?intro=0` turns it off. Test: `tools/qa/title.mjs`. Not built: an opening film, a replay or on/off setting, music. |
| 11b | [Title: zoomies cinematic](phases/11-title-cinematic.md) | in progress | Merlin: the title is "too simplistic"; wants it "exciting like Star Rail". Chosen: an in-room action sequence with the real Mochi. Built (preview, not live): Enter buttons, the 8 s sequence, glow and sun shafts, name reveal, skip, once a day. Still to do: logo polish, the music sting, the paw-wipe. |
| 12 | [Move like a real cat](phases/12-cat-motion.md) | in progress | Merlin: her movement is "awkward and unnatural" (run, jumps, vase pat, and in the normal app). Chosen: fix the motion code. Done on preview: jumps (real arc, push-off, landing), the run (a bounding gallop, back, level head, tail; Merlin: good), the swat (draw back, fast out, second tap, body leans in). Next: in-betweens, then re-cut the title. |
| 13 | [Long-haired Mochi](mochi-longhair/README.md) | in progress | Merlin: match Orion's character sheet with a new Meshy model. Done: top-settings model, coat warmed, rigged, in the app behind `?mochi=longhair`. In progress in its own chat: fur, then eyes, mouth, whiskers. Branch `claude/mochi-cat-upgrade-pu4l2c`. |
| 13b | [Long-haired Mochi moves like a cat](phases/13-longhair-motion.md) | todo | Merlin: natural, fluid movement and behaviour for the new model. Her proportions differ from the first Mochi's (taller, narrower, shorter), which the movement was tuned on. Brief written, first numbers in it. |
| 08 | Friendly app screens | todo | Merlin wants it "real app ready": an easy, clear interface. Needs a brief with Merlin/Orion first. |
| 09 | Small test group | todo | Share with 10-20 people (different phones) with a way to send feedback, before the 1000-member group. |

## Done (live build 174, `97f11c8`)
Mouth reaches food and water; monarch butterflies; vacuum routing round the
island; per-leg reach and turn caps (leg drag reduced); tent flaps; night
mode and night-owl activities; kitchen seasonal decor. History:
`MILESTONES.md` and `git log`.
