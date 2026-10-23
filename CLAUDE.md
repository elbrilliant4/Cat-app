# Mochi (Cat-app) — start here

A three.js virtual-pet web app: Mochi, a ragdoll kitten, in a study and a kitchen.

## Talking to Merlin (the owner)
- Extremely concise. Short lines, no filler; grammar optional.
- Simple words, no jargon.
- Request ambiguous → ask ONE clarifying question before doing anything.
- Evidence before confidence: claim only what you measured or saw. Show numbers or screenshots.
- Disagree → say so, with a reason and a better option.

## Hard rules
- Work only on branch `claude/expressive-cat-modern-ui-65z6r5` (it publishes the preview).
- Nothing goes live without Merlin saying "Go live". Live = `git push origin <reviewed sha>:main`, then add a row to `MILESTONES.md`.
- This repo only. Never touch Netlify.
- Blocked by a tool or permission → stop and tell Merlin; don't work around it.
- No AI model names in commits or code.

## How we work (engineering team, short sessions)
One session = one phase from `docs/ROADMAP.md`. Read the docs, not old chat.
Full loop: `docs/WORKFLOW.md`.

## Heavy chat → hand off
When context is about 60% full: write `docs/HANDOFF.md` (state, in-flight
work, next step, gotchas), commit + push, give Merlin a short paste-in
prompt for a new chat. Then stop.

## Docs
- `docs/HANDOFF.md`: latest handoff (read first if it exists)
- `docs/WORKFLOW.md`: session loop, definition of done
- `docs/ROADMAP.md`: phases, status, what's next
- `docs/phases/`: one brief per phase (goal, facts, plan, how to test)
- `docs/ARCHITECTURE.md`: how the code works, gotchas
- `docs/QA.md`: test tools (`tools/qa/`)
- `TEAM-INSTRUCTIONS.md`: people, creative direction (shared with ChatGPT/Orion)
- `MILESTONES.md`: live builds, for rollback
