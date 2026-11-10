# Handoff — 2026-11-10

## State
- Live: build 161 = `70ade23` (the walk and trot). Merlin: "much much better".
- Preview branch, deployed:
  - Phase 07: walk set to measured cat numbers (Merlin: "very nice"), is
    the default; `?walk=old` = the old walk. A trot from 1.0; gallop only
    at a dash / zoomies (2.6). Brief: parts 2 and 3.

## Waiting on Merlin
- His eye on the run (trot) in the preview: https://elbrilliant4.github.io/Cat-app/preview/
  Then phase 02/03 ("Vision": through furniture).
- The papers (PMC, PLOS, originalwisdom.com) are allowed in the Default
  environment now: fetch with curl (WebFetch's resolver can't see them).

## Next
1. Remove the A/B flags once Merlin is happy with the run.
2. Then phase 02 (vacuum/through furniture) and 03 (tail).
Note: `legs.mjs` steps at 20 fps; the app runs at 60, so its "worst" on a
fast change of speed is about 3x what the app shows.

## Gotchas
- Merlin judges in the real preview, not recordings: ship changes behind
  a URL flag so A and B are both live links.
- `ab-walk.mjs`: ~10 min per 2.5s clip; 2 browsers at a time max.
- `pkill -f`/`pgrep -f` match your own shell line: use exact names.
- Old builds: `git worktree add <scratch>/old <sha>`, copy in `tools/qa/lib.mjs`
  and `clip.mjs`; for 34d84a2 drop `&& kitten.kitchen` from lib's wait.

## Paste into a new chat
> Read CLAUDE.md and docs/HANDOFF.md, then continue phase 07 (docs/phases/07-walk-grace.md).
