# Workflow — run it like an engineering team

Goal: small, fresh sessions that read the docs, not one huge chat that
replays its history (slow and costly).

## One session = one phase
A phase is one fix or one set of related changes, listed in
`docs/ROADMAP.md`, with a brief in `docs/phases/`.

Start a new session with something like:
> Do phase 02 (docs/phases/02-vacuum-vision.md).

## The loop
1. **Read**: `CLAUDE.md`, `HANDOFF.md` if it exists (confirm the next step
   with Merlin), the phase brief, `docs/ARCHITECTURE.md`, then only the code
   the brief points to. Check the request against `SPEC.md`.
2. **Clarify**: if the brief or request is ambiguous, ask Merlin ONE
   question. Otherwise go.
3. **Big feature?** (new screen, new kind of saved data, outside service):
   look at 2 or 3 similar apps, then plan mode, wait for Merlin's OK
   (`CLAUDE.md`, "Big vs small").
4. **Measure first**: reproduce the problem with a `tools/qa/` script (or
   write one) and record the "before" numbers or screenshot.
5. **Change**: smallest change that fixes it. Match the code style. Small
   commits, plain messages.
6. **Test**: `npm run check`, re-run the QA script ("after"), look at
   screenshots. Re-read your own diff.
7. **Review**: a separate reviewer subagent checks the diff for bugs,
   broken behaviour and anything that doesn't match `SPEC.md`. Fix what it
   finds.
8. **Push to the preview branch.**
9. **Update docs**: phase brief (result, numbers), `ROADMAP.md` status,
   `SPEC.md` if a decision changed, `ARCHITECTURE.md` if the structure or
   how something works changed. New QA script → `tools/qa/` + `docs/QA.md`.
   New asset → `CREDITS.md`.
10. **Report to Merlin**: push notification, then a few lines: what was
   wrong, what changed, before/after evidence, what the reviewer caught,
   preview link, and that it needs his "Go live".
11. **Cleanup check** (phase done): see `CLAUDE.md`, "Spec and phases".

## Definition of done
- Problem reproduced before, gone after (numbers or pictures).
- `npm run check` passes; no page errors in the QA run.
- Reviewer subagent run, its findings fixed.
- On the preview branch; docs updated.
- Merlin told, concisely, with evidence.

## Going live
Only when Merlin says "Go live":
`git push origin <sha>:main`, check the "Deploy site" workflow succeeded,
add the build to `MILESTONES.md`, then tell Merlin, with one line on how
to undo it. (github.io itself can't
be reached from the cloud container, so check the workflow run instead.)

## Running several phases at once
Fine if they touch different files. Use separate sessions, each pushing
small commits; pull before pushing. Don't park a session for hours and
resume it with a huge context: start a fresh one.

## Handoff when the chat gets heavy
Triggers, buttons and what goes in `HANDOFF.md` (repo root): `CLAUDE.md`,
"New session or keep going". Delete `HANDOFF.md` once its work is done.

## Writing a phase brief (docs/phases/NN-name.md)
Sections: **Goal** (in Merlin's words), **Known facts** (with numbers),
**Where to look** (files, functions), **Plan**, **Test** (which script,
target numbers), **Result** (filled in at the end).
