# QA tools (`tools/qa/`)

Headless Chromium (software WebGL) runs the real app, steps time by hand,
measures, and takes screenshots. Slow: a few minutes per script.

| Script | Checks | Good result |
|---|---|---|
| `eat-reach.mjs` | Mouth reaches kibble, fountain water, salmon, faucet trickle. Screenshots go to `OUT` (default `qa-out/`). | bowl: height ~.12, <.17 from centre; fountain: height ~.21–.23, .19–.40 from centre; salmon <.10; faucet <.05 |
| `legs.mjs` | Roams the study, kitchen, shelves; a leg "stretched" = planted paw out of reach (looks dragged); paw slide. `SEC`, `SEED`, `FLAGS` (e.g. `&walk=cat`, a preview A/B flag; see the top of `motion-cat.js`). | stretched >2cm under ~1% of frames; worst under ~4cm |
| `gallop.mjs` | Dashes across the rug; stretch per leg while running, how long each paw is up, how often both hind paws are up at once. `DASHES`, `SEED`. | stretched >2cm few %, worst under ~4cm; both hind up about 45% (since phase 12 the gallop has a moment in the air; near 100% would be a rabbit hop) |
| `stride.mjs` | A straight sprint across the study at 60 frames a second: strides a second and their length, share of the run at a gallop, head, hip and chest bob, all four paws up, leg stretch. `RUN` (speed), `SHEET=1` (12 side-view stills through one stride, `OUT`), `FLAGS`, `SEED`. About 2 min. | 2.6 strides a second, about 1.0 long; all four up 10 to 20%; head bob under the old 14.8 cm; stretched 0% |
| `clip.mjs` | Side-view clip following her (`SCENE` walk, turn, run (the walk's trip at a run, works on old builds too), gallop, sprint (flat out across the room and back; use `FPS=30`), swat (sitting, three pats at the ball), bed, shelf or jump, `SEC`, `FPS`, `OUT`), for checking by eye; old vs new: run in each checkout, `ffmpeg -i a.mp4 -i b.mp4 -filter_complex hstack`. | looks right |
| `ab-walk.mjs` | Controlled walk clip for an A/B: empty floor, straight walk at walking speed, fixed side camera, starts at the top of a stride, 60 fps. `FLAGS` (e.g. `&hindlift=0.8`), `SEC`, `OUT`; writes `OUT.json` (phase, paw heights per frame). Blank frames are retaken; `ONLY=44,52` re-takes just those frames. Same seed: A and B match frame for frame except the change. | phase and position identical between A and B |
| `gait-chart.mjs` | Footfall chart of a straight walk (`RUN=1` a run): which paws are down through the stride, cadence, stretch, track width, body bob and sway. `FLAGS`, `SEED`. | walk: LH 0, LF .25, RH .5, RF .75 touch-downs, no `e` (catch-up) steps mid-stride, stretch under 2cm |
| `season.mjs` | Seasonal decor: Halloween picked under `?decor=halloween`, then back without the flag out of season. | out of season: room `thanksgiving`, Halloween not offered; no page errors |
| `title.mjs` | Title screen. Full: Enter buttons, the sequence, her name, a tap leaves; a tap skips and the room is tidy; the second launch that day is the short one. Short: a tap (or Enter) leaves it, the app is left usable; already asleep (tiptoe in), reduced motion (no sequence), `?intro=0`, `?debug`. Needs `npm run dev` running. Screenshots to `OUT`. Slow (real time on software 3D): about 25 min. | every line `PASS` |
| `title-clip.mjs` | A true-speed clip of the title screen (`MODE=full`, the default: Enter, the zoomies cinematic, her name, the tap, the shrink; `MODE=short`: asleep, the tap, the wake-up). `W`, `H`, `NIGHT`, `FPS`, `OUT`. For when the preview link is not available. About 20 min. | looks right: no cut mid-move, no stretch while it shrinks |
| `title-shots.mjs` | Stills from the cinematic at chosen story-clock times (`AT="0.9 2.3 5.8 7.1"`), to check a shot's framing quickly. `W`, `H`, `NIGHT`, `OUT`. | each shot framed: she is in the picture, nothing in front of the lens |
| `vacuum.mjs` | Robot vacuum, alone and with her riding, her stalking it and walking about: closest approach of the vacuum's disc and of every point of her body (bones, the tail along its length) to every solid on the kitchen floor, read off the real meshes (island base, stool legs and bars, bowl, fountain, dock, counter, walls, tent footprint). Prints the worst per solid for the vacuum / her body riding / her tail riding / her body on the floor / her tail on the floor, a log of overlaps, screenshots of the worst moments (`OUT`, `SHOTS=0` to skip) and at given seconds (`AT=60,98`). `SEC`, `SEED`. ~1 real minute per 25 virtual s. | vacuum and her body > 0 everywhere; tail ≥ about -.03 (a brush, the skin's thickness) |
| `look.mjs` | Stills of a room in a seasonal look, day and night: `DECOR=christmas`, `ROOM=study`, `CAMS` (extra close-ups as JSON), `EVAL` (something to do first, e.g. `kitten.garlandNap()`), `STEPS`, `OUT`. | looks right against Orion's pictures; no page errors |
| `camera.mjs` | Looking around and touching her on a phone-sized screen, with real mouse and two-finger touch input. Camera: zoom to the pointer in a view of your own, no dead stretch after zooming out into a wall, zoom kept while following, pinch in from the whole room goes to her and far out gives the room back, the room view settles back, double tap on her, glide, twist. Touch: a tap on the floor calls her; head welcome, tail and paws not (zone, friendship gained, face). Stills to `OUT`. About 5 min. | every line `PASS` |

Run: `node tools/qa/<script>.mjs`. Uses `playwright` if installed,
otherwise the cloud container's copy in `/opt/node22`.

Runs are repeatable: same seed, same result (timeouts and the clock run on
virtual time). Different seeds give different days: test 2 seeds.

New check? Use `open()` from `lib.mjs` (`{seed, kitchen, night, quiet}`;
returns `page`, `step(n)`, `look({focus, yaw, pitch, dist})`, `close()`),
add it to this table.
