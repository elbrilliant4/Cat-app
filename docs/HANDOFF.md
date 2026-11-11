# Handoff — 2026-11-11

## State
- Live: build 161 = `70ade23` (unchanged).
- Preview branch `claude/expressive-cat-modern-ui-65z6r5` (recreated today)
  and session branch `claude/gallant-johnson-bh11wf`, same commits, not
  live: the title screen, step 1 ("Tap to wake her", wake chime A), plus
  Halloween stored away (from before). Waiting on Merlin's "Go live".
- GitHub Actions has 0 runs on this repo (workflows listed, never run), so
  `/preview/` does not update. Only Merlin can check the repo's Actions
  settings. Until then the preview is a clip: `tools/qa/title-clip.mjs`.

## Next (Merlin's order, 2026-11-11)
1. **Phase 11b, the zoomies cinematic** (`docs/phases/11-title-cinematic.md`):
   Merlin finds the title too simple and wants it "exciting like Star
   Rail". The plan, shot list and risks are in the brief. He allows Runway
   and Meshy credits.
2. Then as before: phase 02 Vision, Christmas decor (Orion's image), Miso
   (Merlin's .glb), phase 08, 09.

## Gotchas
- Merlin judges by eye and ear: send clips and sound files, offer choices
  as a picker.
- The title QA needs `npm run dev` running; a worker restart kills it.
- A title run takes about 8 min, a clip about 5 min (software WebGL).
- Older gotchas (walk flags, papers, `pkill`) are in git history of this
  file (`97f11c8`).

## Paste into a new chat
> Read CLAUDE.md and docs/HANDOFF.md, then do phase 11b (docs/phases/11-title-cinematic.md).
