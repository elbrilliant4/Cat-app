# Handoff — 2026-10-24 (weekend pause)

## State
- Live: build 137 = `631f8ab` (unchanged). Nothing new is live.
- Preview branch (`99bc1dd`), deployed:
  - Phase 07 part 1: run fix (hind legs no longer hop together). Waiting on Merlin.
  - A/B, off by default: `?hindlift=0.8` = hind paws lift 20% lower.
    A: https://elbrilliant4.github.io/Cat-app/preview/
    B: https://elbrilliant4.github.io/Cat-app/preview/?hindlift=0.8
    Numbers: no regression (phase 07 brief, "A/B" section).

## Waiting on Merlin
- Judge A vs B in the live preview (recordings were too big / hard to judge).
- He has a real-cat walking video (YouTube, qHexBb35ens). YouTube is blocked
  in the container; he may describe it or allow www.youtube.com.
- Orion's notes on the clip pack (`qa-out/pack/`, not in git).

## Next
1. Merlin's pick on B: keep (make it the default, remove the flag) or drop.
2. One change at a time, each as a preview flag + `ab-walk.mjs` A/B:
   stance width (hind paws in under the hips), cadence, hip roll.
3. Small hitch seen in A and B: on a steady straight walk the left hind
   touches down for one frame mid-swing (phase ~.88, ~1 in 3 strides).
   Likely the "catch-up" step (leash trigger) firing during a normal swing.

## Gotchas
- Merlin judges in the real preview, not recordings: ship changes behind
  a URL flag so A and B are both live links.
- `ab-walk.mjs`: ~10 min per 2.5s clip; 2 browsers at a time max.
- `pkill -f`/`pgrep -f` match your own shell line: use exact names.
- Old builds: `git worktree add <scratch>/old <sha>`, copy in `tools/qa/lib.mjs`
  and `clip.mjs`; for 34d84a2 drop `&& kitten.kitchen` from lib's wait.

## Paste into a new chat
> Read CLAUDE.md and docs/HANDOFF.md, then continue phase 07 (docs/phases/07-walk-grace.md).
