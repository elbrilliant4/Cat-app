# Handoff — 2026-10-24

## State
- Live: build 137 = `631f8ab` (unchanged).
- Preview branch: phase 01 (leg drag) pushed, waiting on Merlin. He says:
  "much better" on the drag, but she struts when walking and her hind legs
  hop together when running. Not live; don't go live until that's sorted.

## Done this session
- QA runs are now repeatable (timeouts and clock on virtual time,
  reseed after start-up): the old phase 01 baseline numbers were noise.
- Leg drag: 3 causes fixed in `motion-cat.js` (see `docs/phases/01-leg-drag.md`).
- New QA tools: `gallop.mjs`, `clip.mjs` (side-view clips, old vs new).
- Rules added: ping Merlin when done (push notification, simple words);
  options as a multiple-choice picker. `TEAM-INSTRUCTIONS.md` updated for ChatGPT.

## Next
Phase 07 part 1 done (run: hind legs no longer hop together; pushed, waiting
on Merlin). Part 2, the strut: clips sent (`walk-old-vs-now.mp4`); waiting
on Merlin's pick / Orion's notes; then stance width, step height, cadence one
at a time, a clip each (see the phase brief's Result).
Then 08 (friendly app screens), 09 (small test group).

## Gotchas
- Heavy runs (3-4 browsers at once) have restarted the container: 2 at a time.
- Old builds: `git worktree add <scratch>/old <sha>`, copy in `tools/qa/lib.mjs`
  and `clip.mjs` (old ones lack repeatable runs and the walk scene).
- `qa-out/` is git-ignored; send clips to Merlin as files.
- A clip takes ~9 min; gallop.mjs ~1.5 min; legs.mjs ~6 min.
- Old 34d84a2 in the QA: drop `&& kitten.kitchen` from its lib.mjs wait.
- Don't `pkill -f <script>` from a command line that names that script: it kills itself.

## Paste into a new chat
> Read CLAUDE.md and docs/HANDOFF.md, then do phase 07 (docs/phases/07-walk-grace.md).
