# Phase 16: two camera modes, Mochi and Explore

Merlin, 2026-11-13: moving with fingers is "still really bad": the aim is
off, roaming is hard and heads for the walls, no full turn, getting back to
her is hard. He wants one mode that stays on the cat and one for admiring
the rooms. Status: **built on preview, awaiting Merlin and Lettuce.**

## What it does
Two buttons on the room screen work as a switch, remembered between visits
(`mochi-cam` in the phone's storage): **Explore** and **Mochi**.
- **Mochi:** the camera stays on her. One finger circles her, a pinch zooms
  on her, a tap on the floor calls her. Nothing but the Explore button (or
  Food, Water, Bed, Watch) leaves her view.
- **Explore:** one finger turns the view about what it looks at. A pinch
  zooms to the thing under the fingers (furniture, walls and pictures too).
  Two fingers sliding together move the view. A double tap on a thing goes
  close and makes it the centre; again on the same thing gives the whole
  room. A tap on the floor does not call her. Tapping the Explore button
  again gives the whole room.
- The turn runs from one side wall round to the other, about 200 degrees.
  Past the end it gives a little and springs back.
- The camera never changes mode by itself (before, a pinch near or away
  from her switched it).

## Who it's for
Lettuce and the test group, one hand on a phone. Show the preview to
Lettuce before "Go live".

## Merlin's picks (2026-11-13)
- One finger in Explore **turns** (not "slide the room", his 2026-11-12
  note). Risk he accepted: the old "moving around is off" complaint may
  come back in a new form.
- No full circle. Pictures of both rooms from eight sides showed the back
  half looks broken: the rooms have three walls, and curtains, shelves,
  window frames and the kitchen's glazing hang in front of a camera that
  stands behind them. He picked the **wide turn** over building a fourth
  wall or hiding everything fixed to a wall.

## Done when
- On a 390 x 844 phone, in the study and the kitchen, one finger turns
  Explore from one end of the turn to the other, and it springs back from
  past the end.
- A pinch on the fireplace ends at the fireplace.
- One tap on the Mochi button brings her back from any view.
- A pinch, drag or tap never changes the mode.
- `tools/qa/camera.mjs`: every line `PASS`.

## Not in this version
A true 360 (needs a fourth wall: "Later"); walking through the room at eye
level; an arrow pointing to her when she is off screen; a photo mode.

## Looked at first
Sims FreePlay (one finger moves, two turn: what Mochi had), Sims Mobile
(players complain about blocked turns), Google model-viewer, Nira and
SketchUp Viewer (one finger turns, double tap sets the centre, named
modes), Matterport's dollhouse (a bounce when a move is blocked).
