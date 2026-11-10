# Handoff — 2026-11-10

## State
- Live: build 137 = `631f8ab` (unchanged). Nothing new is live.
- Preview branch, deployed:
  - Phase 07: run fix; front-paw stutter-step fixed (default build).
  - A/B, off by default: `?walk=cat` = walk set to measured cat numbers.
    A: https://elbrilliant4.github.io/Cat-app/preview/
    B: https://elbrilliant4.github.io/Cat-app/preview/?walk=cat
    Numbers and sources: phase 07 brief, "Part 2".

## Waiting on Merlin
- A (default) vs B (`?walk=cat`) in the live preview. Merlin wants the walk
  first, then phase 02/03 ("Vision": through furniture).
- The papers (PMC, PLOS, originalwisdom.com) are allowed in the Default
  environment now: fetch with curl (WebFetch's resolver can't see them).

## Next
1. Merlin's pick: B as the default (then remove the flags), or parts of it.
2. The run: she gallops from 1.0 (real cats trot at ~1 m/s, gallop faster);
   a trot gait between walk and gallop. `gait-chart.mjs RUN=1`.
3. Then phase 02 (vacuum/through furniture) and 03 (tail).

## Gotchas
- Merlin judges in the real preview, not recordings: ship changes behind
  a URL flag so A and B are both live links.
- `ab-walk.mjs`: ~10 min per 2.5s clip; 2 browsers at a time max.
- `pkill -f`/`pgrep -f` match your own shell line: use exact names.
- Old builds: `git worktree add <scratch>/old <sha>`, copy in `tools/qa/lib.mjs`
  and `clip.mjs`; for 34d84a2 drop `&& kitten.kitchen` from lib's wait.

## Paste into a new chat
> Read CLAUDE.md and docs/HANDOFF.md, then continue phase 07 (docs/phases/07-walk-grace.md).
