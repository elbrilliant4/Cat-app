# QA tools (`tools/qa/`)

Headless Chromium (software WebGL) runs the real app, steps time by hand,
measures, and takes screenshots. Slow: a few minutes per script.

| Script | Checks | Good result |
|---|---|---|
| `eat-reach.mjs` | Mouth reaches kibble, fountain water, salmon, faucet trickle. Screenshots go to `OUT` (default `qa-out/`). | bowl: height ~.12, <.17 from centre; fountain: height ~.21–.23, .19–.40 from centre; salmon <.10; faucet <.05 |
| `legs.mjs` | Roams the study, kitchen, shelves; a leg "stretched" = planted paw out of reach (looks dragged); paw slide. `SEC`, `SEED`. | stretched >2cm under ~1% of frames; worst under ~4cm |
| `vacuum.mjs` | Robot vacuum, alone and with her riding: closest approach to the island/stools box. `SEC`, `SEED`. | all values > 0 (never inside) |

Run: `node tools/qa/<script>.mjs`. Uses `playwright` if installed,
otherwise the cloud container's copy in `/opt/node22`.

New check? Use `open()` from `lib.mjs` (`{seed, kitchen, night, quiet}`;
returns `page`, `step(n)`, `look({focus, yaw, pitch, dist})`, `close()`),
add it to this table.
