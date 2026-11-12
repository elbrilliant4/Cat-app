Last audit: 2026-11-12, after phase 06.

# Cleanup findings

From `docs/cleanup-audit.md`: knip (dist pages and tools as entry points),
a search for duplicate helpers and dead functions, and checks by hand that
nothing is used by name at runtime (URL flags, `page.evaluate` strings,
`window.kitten`, files fetched by path). No unused files were found. Nothing
here touches saves.

1. (done 2026-11-12) **`meowV2Envelope` is never called** (`dist/meows.js:63`). The mouth
   follows `meowV1Envelope`; v2's envelope was written for a mouth sync that
   never got wired. `meowV2` itself stays (the review pack compares it).
   Removing it: 12 fewer lines of dead code. Risk: low.
2. (done 2026-11-12) **A compiled Python file is committed** (`tools/__pycache__/glb.cpython-311.pyc`).
   It's a by-product of running `tools/glb.py`, not source. Remove it and add
   `__pycache__/` to `.gitignore`. Improves: no stale binary in the repo.
   Risk: low.
3. (done 2026-11-12) **README points new sessions at an old handoff.** `README.md` says "Read
   CODEX-HANDOFF.md first"; that file is the October 5 handoff from before
   CLAUDE.md, SPEC.md and the docs/ folder. Point README at CLAUDE.md and move
   the old handoff to `docs/history/` (keep it: it records where the app came
   from). Improves: no conflicting "start here". Risk: low.
4. (done 2026-11-12) **`docs/QA.md` gives `&walk=cat` as an example flag; it no longer
   exists** (the cat walk is now the default; `dist/motion-cat.js:39` lists
   `?walk=old`, `?gait=old`, `?low=0`, `?track=wide`, `?sway=1`). Fix the
   example. Risk: low.
5. **Angle wrapping written out ten times**
   (`Math.atan2(Math.sin(d), Math.cos(d))` at `dist/app.js` 796, 816, 860,
   911, 918, 950, 1807, `dist/kitchen.js` 426, 453, `dist/motion-cat.js`
   151). One `wrapAngle(d)` helper. Improves: shorter, easier-to-read heading
   code (the area most bugs come from). Risk: medium (heading code; needs a
   QA run after).
6. (done 2026-11-12) **`rand` and `pick` defined in several files** (`rand`: `dist/app.js:13`,
   `dist/kitchen.js:20`; `pick`: `dist/app.js:14`, `dist/sound.js:188`;
   identical). One small shared module. Improves: one place to seed or
   change them. Risk: low. (`room.js:155` and `kitchen.js:1313` have
   different `pick`s on purpose: seeded and weighted.)
7. (done 2026-11-12) **`Room.mesh` and `Kitchen.mesh` are the same function**
   (`dist/room.js:526`, `dist/kitchen.js:79`). The kitchen already borrows
   shared methods from `Room.prototype`; it could borrow this one too.
   Improves: one copy. Risk: low.
8. (done 2026-11-12) **URL flags not written down anywhere**: `?roomview=full`
   (`dist/app.js:2347`), `?trot` (`dist/motion-cat.js:197`), `?rig`
   (`rig-check.js`), `?record` (`idle-preview.js`, used by the review pack),
   and the trial pages' `?cat`, `?view`, `?marks`, `?paused`, `?capture`,
   `?expr`, `?light`. Add one line each to ARCHITECTURE.md's Debug section.
   Improves: they won't be mistaken for dead code later. Risk: low.
9. (done 2026-11-12) **`export` on functions only used in their own file** (`padQ`,
   `eyeDist` in face-sculpt.js; `drawBreccia` in kitchen.js; `ypr`, `Track`
   in motion.js; `drawLeather`, `drawAbstract` in room.js; `FLOOR` in
   pet-state.js is also only used there, kitchen.js has its own). Drop the
   `export`. Improves: a little clarity, nothing else. Risk: low.

Checked and kept: `models/*.glb` (31 MB, the original Meshy models: OG Mochi
and the source for `dist/assets`); `tools/clean-face-texture.py` and
`tools/glb.py` (how the face texture was made); the extra pages (idle,
motion-trial, rig-check, review-stage) and `tools/review-pack` (used by the
deploy); `capture.mjs`'s `import('./decor.js')` (runs in the browser, knip
can't see that).
