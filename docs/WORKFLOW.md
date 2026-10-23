# Workflow — run it like an engineering team

Goal: small, fresh sessions that read the docs, not one huge chat that
replays its history (slow and costly).

## One session = one phase
A phase is one fix or one set of related changes, listed in
`docs/ROADMAP.md`, with a brief in `docs/phases/`.

Start a new session with something like:
> Do phase 02 (docs/phases/02-vacuum-vision.md).

## The loop
1. **Read**: `CLAUDE.md`, the phase brief, `docs/ARCHITECTURE.md`, then
   only the code the brief points to.
2. **Clarify**: if the brief or request is ambiguous, ask Merlin ONE
   question. Otherwise go.
3. **Measure first**: reproduce the problem with a `tools/qa/` script (or
   write one) and record the "before" numbers or screenshot.
4. **Change**: smallest change that fixes it. Match the code style.
5. **Test**: `npm run check`, re-run the QA script ("after"), look at
   screenshots. Re-read your own diff.
6. **Push to the preview branch**: one commit per phase, clear message.
7. **Update docs**: phase brief (result, numbers), `ROADMAP.md` status,
   `ARCHITECTURE.md` if you learned how something works. New QA script →
   `tools/qa/` + `docs/QA.md`.
8. **Report to Merlin**: a few lines: what was wrong, what changed,
   before/after evidence, preview link. Then the session is done.

## Definition of done
- Problem reproduced before, gone after (numbers or pictures).
- `npm run check` passes; no page errors in the QA run.
- On the preview branch; docs updated.
- Merlin told, concisely, with evidence.

## Going live
Only when Merlin says "Go live":
`git push origin <sha>:main`, check the "Deploy site" workflow succeeded,
add the build to `MILESTONES.md`, then tell Merlin. (github.io itself can't
be reached from the cloud container, so check the workflow run instead.)

## Running several phases at once
Fine if they touch different files. Use separate sessions, each pushing
small commits; pull before pushing. Don't park a session for hours and
resume it with a huge context: start a fresh one.

## Handoff when the chat gets heavy
At about 60% context: overwrite `docs/HANDOFF.md` with what's done, what's
in flight (uncommitted? pushed? waiting on Merlin?), the next step, and
anything learned that isn't in the docs yet. Commit and push, then give
Merlin a 2–3 line prompt to paste into a new chat. Then ask Merlin:
start the new chat for you, or will you paste it? If "start it", create
the new session with that prompt (same repo and branch) and send Merlin
its link. Then stop.

## Writing a phase brief (docs/phases/NN-name.md)
Sections: **Goal** (in Merlin's words), **Known facts** (with numbers),
**Where to look** (files, functions), **Plan**, **Test** (which script,
target numbers), **Result** (filled in at the end).
