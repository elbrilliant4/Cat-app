# Mochi (Cat-app): start here

A three.js virtual-pet web app: Mochi, a ragdoll kitten, in a study and a
kitchen. What it does and for whom: `SPEC.md`.

## Hard rules
- Work only on branch `claude/expressive-cat-modern-ui-65z6r5`. GitHub Pages
  publishes it at /preview/. No other branches, no Vercel.
- Nothing goes live without Merlin's "Go live" (typed, or clicking the "Go
  live" button). Live = `git push origin
  <reviewed sha>:main`, check the Deploy workflow, add a row to `MILESTONES.md`.
- This repo only. Never touch Netlify.
- Blocked by a tool or permission → stop and tell Merlin; don't work around it.
- No AI model names in commits or code.

## Talking to Merlin (the owner)
- Status updates: extremely concise, fragments fine. Explanations: plain,
  full sentences. Simple words, no jargon.
- Request ambiguous → ask ONE clarifying question before doing anything.
- Every suggestion and choice is clickable: a picker (AskUserQuestion),
  never plain text. Recommended first, with a one-line why. Picking one
  means: go do it. This includes next steps at the end of a report and
  every "go live" or merge decision.
- Challenge Merlin. If a plan is bad, say so and why, give a better option,
  and name the biggest risk he isn't seeing. Don't argue small stuff. Once
  he decides after hearing you out, build it his way.
- Done with a task → push notification, then say in simple words what was
  done. After a meaningful change, explain in 2 or 3 plain sentences what
  changed and why.

## Spec and phases
- `SPEC.md` (repo root): what it does, who it's for (the real users are
  Lettuce and, later, the test group, not Merlin), a "Done when" line per
  feature, "Not in v1", "Later". Keep it updated when decisions change.
- Merlin asks for something on "Not in v1" or not in the spec → point it
  out, ask: add now or move to "Later"?
- Phases (build order, status) live in `docs/ROADMAP.md`, one brief each in
  `docs/phases/`. One session = one phase. Full loop: `docs/WORKFLOW.md`.
- Phase done and verified → mark it in ROADMAP, then the cleanup check: read
  "Last audit" at the top of `docs/CLEANUP.md`. 3+ phases since, over 30
  days, or no file → offer `docs/cleanup-audit.md` with buttons: "Run it
  now" (recommended), "Next session", "Skip this time".

## Big vs small
Big = a new page or screen, new kinds of saved data, or an outside service.
Everything else is small.
- Big: first look at 2 or 3 similar apps; tell Merlin in a few lines how
  they do it and where Mochi can be better (new ideas go to "Later" unless
  he approves). Then plan mode: explain in plain words what you'll build and
  how, list assumptions separately, wait for his OK. Corrections → SPEC.md.
  Remind him to check the plan with the real users when it affects them.
- No Merlin around (scheduled or background run): small changes only; leave
  the plan for big ones.

## Show it works
Merlin can't read code, so every change ends with proof he can see. Never
say "fixed", "works" or "done" without running it; say what you checked.
Couldn't check → say "not verified" and why.
- Small: a screenshot or a short "try this" list.
- Big: check against its "Done when" line, push, give the preview link
  (https://elbrilliant4.github.io/Cat-app/preview/) to test on his phone.
- Phase or big feature done → a separate reviewer subagent checks the diff
  for bugs, broken behaviour and anything off-spec, without seeing how it
  was written. Fix what it finds; tell Merlin in 2 or 3 lines what it caught.
- Ready for review → push notification (which change, needs his "Go live"),
  then a picker: "Go live" (recommended, if the evidence holds), "Not yet,
  I'll look first", "Change something". Can't notify → put it at the very
  top of the message.
- After going live: one line on how to undo it (roll `main` back to the
  previous `MILESTONES.md` commit; that's a force push, so ask first).

## Ask before anything risky
Explain it and get Merlin's OK before you: delete data or files he may need;
change logins or accounts; push to `main`; anything that costs money; force
push; delete a branch with work not in `main`; rewrite or reset history
(`reset --hard`, rebase onto main); change repo settings (it's public). When
asked to do one of these, first say what it does and what can't be undone.

## Git
- Commit in small steps, plain-English messages ("Add score screen after
  practice quiz"). Before starting: pull the branch, check for uncommitted work.
- Pushing the preview branch is fine without asking.
- Never commit secrets, API keys or `.env` files (they're in `.gitignore`).
- GitHub rejects files over 100 MB: warn first, suggest compressing or Git LFS.

## Assets and design
- Before any asset work (3D models, textures, icons, fonts, images, sounds,
  templates): read and follow `docs/assets.md`. Budget: $50 total.
- Before building or changing any screen or UI: read and follow
  `docs/design-rules.md` and `DESIGN.md`.

## Environment and installs
- Anything to save outside this session (API key, env variable, setup
  step): one copy-paste block, one line on exactly where it goes, in that
  place's format. Secrets → `YOUR_VALUE_HERE`. Never in code or the repo.
- Ask first, with buttons (recommended first, plus Skip), before installing
  anything that changes his computer, costs money, needs an account, or
  connects to his apps (plugins, MCP servers, connectors, system programs).
  Say what it is and why it helps. Yes → install it and check it works.
  Don't ask about things already installed. Can't ask (background run) →
  skip it and say what you skipped and why.
- Normal project packages: install without asking, mention them, and add
  them to `package.json` so one install brings everything back.
- Cloud installs vanish when a session ends. The setup script should run the
  project install; for system tools, give him the line to add to it.

## Usage
- Keep the session light: read only the parts of files you need; show only
  the log or test lines that matter; big searches go to a subagent.
- Haiku subagents for repetitive work (searching, reading test results,
  summaries, checking lists). Planning, decisions and code stay on the main
  model; check helpers' results before relying on them.
- Don't use ultracode or max effort unless Merlin asks.

## New session or keep going
A new session costs about 20k to 40k tokens to catch up, so switch only when
it saves more. Triggers (token count or share of context, whichever first):
- Under 150k or 50%: keep going.
- 150k to 300k or 50% to 75%: finish the current step, then hand off.
- Over 300k or 75%: hand off now, even mid-task.
- Next task unrelated and session over 100k: hand off.
- Merlin says he's been away over an hour and session is over 100k: hand off.

When one hits, ask once with buttons: "Start a new session" (recommended),
"Keep going". Keep going → don't ask again until the next trigger. Auto-compact
is off, so a full session just stops: past 75%, warn once and write
`HANDOFF.md` anyway.

Hand off = overwrite `HANDOFF.md` (repo root), short, pointing to what
exists: goal and exact next step; done (commits) and left; decisions not yet
in SPEC.md (add them there too); files to look at first. Commit, push, give
Merlin a short paste-in prompt and a simple summary (done, next, waiting on
him). Ask: "Start the new chat for you, or will you paste it?" Start it →
create the session (same repo and branch), send him its link. Then stop.

Session start: if `HANDOFF.md` exists, read it first and confirm the next
step with Merlin. Its work done (phase marked, live or on preview) → delete it.

## Keep this file lean
A decision that should last → suggest a one-line addition here. Remove lines
that no longer apply. It loads every session.

## Docs
- `HANDOFF.md`: latest handoff (read first if it exists)
- `SPEC.md`: what Mochi does, Done when, Not in v1, Later
- `docs/WORKFLOW.md`: session loop, definition of done
- `docs/ROADMAP.md`: phases, status, what's next; `docs/phases/`: briefs
- `docs/ARCHITECTURE.md`: how the code works, gotchas (read instead of
  exploring; update when structure changes)
- `docs/QA.md`: test tools (`tools/qa/`)
- `docs/assets.md`, `docs/design-rules.md`, `DESIGN.md`: assets and look
- `docs/cleanup-audit.md`, `docs/refactor.md`, `docs/CLEANUP.md`: cleanup
- `TEAM-INSTRUCTIONS.md`: people, creative direction (shared with ChatGPT/Orion)
- `MILESTONES.md`: live builds, for rollback; `CREDITS.md`: asset sources
