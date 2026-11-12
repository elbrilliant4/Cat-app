# Roadmap

Status: `todo` · `doing` · `preview` (pushed, awaiting review) · `live` · `blocked`.
One phase per session (see `WORKFLOW.md`). Briefs are in `docs/phases/`.

| # | Phase | Status | Notes |
|---|---|---|---|
| 01 | [Leg drag](phases/01-leg-drag.md) | preview | Three causes fixed (stuck step when setting off, bed step-up, gallop reach). Left: a short front-leg stretch sitting down on perches, one high-shelf turn. |
| 02 | [Vacuum "Vision"](phases/02-vacuum-vision.md) | live (build 190) | Measured: the vacuum itself never went through anything; she did (tail off the vacuum into the counter, stools, dock; head and hips into the stool legs; body in the counter at two spots). Her tail now keeps out of the kitchen furniture (`clearTail`), the keep-out and the vacuum's lanes are sized for her body. Overlaps 2005 to 74 and 1625 to 199 per 600 s; the vacuum never touches anything; left: head turned while walking along a thing (to 15 cm), fur-deep tail brushes. |
| 03 | [Tail through furniture](phases/03-tail-collision.md) | live (build 203) | Study furniture, kitchen steps and shelves, mantel vase, deep walls; `tools/qa/tail.mjs`. Tail into furniture: study 5.5% to 1.0% and 9.1% to 1.5% of frames, kitchen 5.6% to 5.3% and 2.6% to 1.6%. Left: her hips inside the wall on narrow perches (steps, sill), clips mid-jump up the step stack (next phase). |
| 06 | [Body on narrow perches](phases/06-narrow-perches.md) | live (build 212) | Steps .95 deep, spots at the front, mantel sat along, sill on the slant, a turn in the air to land. Kitchen perches: hips inside something 63% to 1.4% of frames, body into furniture 82% to 6%; study walls 50 cm to 5 cm. Left: turning round on the first step after the jump from the floor. |
| 04 | Miso, the second cat | blocked | Waiting for Merlin's Meshy .glb (blue British Shorthair kitten). Then: the cats play together; later, adopt more cats by levelling up. |
| 05 | Dog visit at the French doors | blocked | Code ready behind `?dog`; needs a proper (Meshy) dog model. |
| 06 | Christmas tree mischief | todo (December) | Mochi climbs and bats at the tree. |
| 07 | [Walk like a cat again](phases/07-walk-grace.md) | live (build 171) | Walk set to measured cat numbers, stutter-step fixed, a trot for every run, gallop only flat out. Merlin: "much much better". |
| 10 | Seasonal looks stored away | live (build 174) | Halloween hidden from the picker out of October (`?decor=halloween` shows it); a room left in it wakes up as Thanksgiving. Christmas: waiting on Orion's image. |
| 11 | First wall step from the floor | todo | (Merlin, 2026-11-12, after phase 06.) She lands on the first step facing the wall and turns round on it (.62 wide): head or hips into the wall or the counter's end for a second or two. Needs a new idea (another take-off spot, or not stopping on that step). |
| 08 | [Friendly app screens](phases/08-app-screens.md) | preview | Phones get one screen (room, care buttons, needs), a View menu, a More sheet, touch words, a first visit welcome and tips. `DESIGN.md` made. |
| 09 | Small test group | todo | Share with 10-20 people (different phones) with a way to send feedback, before the 1000-member group. |

## Done (live build 190, `43fdbf8`)
Mouth reaches food and water; monarch butterflies; vacuum routing round the
island; per-leg reach and turn caps (leg drag reduced); tent flaps; night
mode and night-owl activities; kitchen seasonal decor; her tail and body kept out of the kitchen furniture. History:
`MILESTONES.md` and `git log`.
