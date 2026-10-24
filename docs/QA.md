# QA tools (`tools/qa/`)

Headless Chromium (software WebGL) runs the real app, steps time by hand,
measures, and takes screenshots. Slow: a few minutes per script.

| Script | Checks | Good result |
|---|---|---|
| `eat-reach.mjs` | Mouth reaches kibble, fountain water, salmon, faucet trickle. Screenshots go to `OUT` (default `qa-out/`). | bowl: height ~.12, <.17 from centre; fountain: height ~.21–.23, .19–.40 from centre; salmon <.10; faucet <.05 |
| `legs.mjs` | Roams the study, kitchen, shelves; a leg "stretched" = planted paw out of reach (looks dragged); paw slide. `SEC`, `SEED`. | stretched >2cm under ~1% of frames; worst under ~4cm |
| `gallop.mjs` | Dashes across the rug; stretch per leg while running, how long each paw is up, how often both hind paws are up at once (rabbit hop). `DASHES`, `SEED`. | stretched >2cm few %, worst under ~4cm; both hind up under ~40% |
| `clip.mjs` | Side-view clip following her (`SCENE` walk, turn, run (the walk's trip at a run, works on old builds too), gallop, bed or shelf, `SEC`, `OUT`), for checking by eye; old vs new: run in each checkout, `ffmpeg -i a.mp4 -i b.mp4 -filter_complex hstack`. | looks right |
| `ab-walk.mjs` | Controlled walk clip for an A/B: empty floor, straight walk at walking speed, fixed side camera, starts at the top of a stride, 60 fps. `FLAGS` (e.g. `&hindlift=0.8`), `SEC`, `OUT`; writes `OUT.json` (phase, paw heights per frame). Blank frames are retaken; `ONLY=44,52` re-takes just those frames. Same seed: A and B match frame for frame except the change. | phase and position identical between A and B |
| `vacuum.mjs` | Robot vacuum, alone and with her riding: closest approach to the island/stools box. `SEC`, `SEED`. | all values > 0 (never inside) |

Run: `node tools/qa/<script>.mjs`. Uses `playwright` if installed,
otherwise the cloud container's copy in `/opt/node22`.

Runs are repeatable: same seed, same result (timeouts and the clock run on
virtual time). Different seeds give different days: test 2 seeds.

New check? Use `open()` from `lib.mjs` (`{seed, kitchen, night, quiet}`;
returns `page`, `step(n)`, `look({focus, yaw, pitch, dist})`, `close()`),
add it to this table.
