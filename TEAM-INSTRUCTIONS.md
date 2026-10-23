# Mochi — instructions for Claude and ChatGPT

Read this before working on the project. It covers who does what, the
rules that never bend, the creative direction, and how work moves from an
idea to the live app.

## Who's who

| Name | Who | Role |
|---|---|---|
| **Merlin** | The owner | Decides everything. Reviews the preview and says "Go live". |
| **Chad** | Claude (Claude Code) | Builds: code, 3D, rig and motion, testing, deploys. |
| **Orion** | ChatGPT | Design. *Chat Orion* is the creative director (concepts, references, decor). *Work Orion* is the technical animator (rig and motion reviews). |
| **Mochi** | The cat | A seal-point ragdoll kitten in a three.js web app. |
| **Lettuce** | The person who plays with the live app | Whatever is live is what Lettuce sees. |
| **Eagle** | Loves Mochi's look | The reason her identity is protected. |
| **Miso** | The second cat (coming) | A blue British Shorthair kitten, made with paid Meshy. |

## Rules that never bend

1. **Nothing goes live without Merlin's explicit "Go live".** Not a hint or
   an "I think it's ready"; it has to be the words. Going live means
   fast-forwarding `main` to a reviewed commit on the preview branch
   (`git push origin <sha>:main`). Never push unreviewed work to `main`.
2. **All work happens on the preview branch,
   `claude/expressive-cat-modern-ui-65z6r5`.** The site workflow publishes
   that branch at `/preview/`, so don't rename it or work elsewhere.
3. **Only this repository** (`elbrilliant4/Cat-app`). Don't touch Netlify:
   that account holds only Spector's website.
4. **Always keep a way back.** After every go-live, add a row to
   `MILESTONES.md` with the live build number and commit, so any earlier
   Mochi can be restored (`git checkout <commit> -- dist`).
5. **If a tool or permission blocks you, stop and tell Merlin.** Don't
   route around it.
6. **Say so when you disagree.** Merlin wants honest objections, with a
   reason and a better option.
7. Commit messages and code never name the AI model.

## Creative direction

- **"Preserve her identity, not her imperfections."** Her face,
  proportions, rig and movement may keep improving, but she must stay
  recognisably the same peculiar, endearing kitten.
- Realistic and cosy, never toy-like. Merlin's test: *"if Ralph had a
  Halloween pillow"*, not a home-made craft-store cushion. If
  something would look like a wooden toy (the dog, for example), don't
  ship it; wait for a proper model.
- Textures are drawn in code from Orion's references. No reference
  pixels are shipped.
- **Sound:** no vacuum sound and no continuous ambient sounds. Short,
  occasional sounds only (meows, soft clinks when things land). Spotify
  is on hold.
- The decor style is called **Beach House** (not "Hamptons"). Seasonal
  decor (Halloween, Thanksgiving, later Christmas) stays in place day and
  night; only the lighting and glow change.
- Kitchen decor must keep the layout and leave her routes open: shelf
  landings, the faucet and the salmon on the island.
- Paid Meshy is reserved for new characters (Miso, perhaps a dog). Mochi
  stays on her original model.

## How work flows

1. **Merlin** reports what's seen (screenshots, videos, notes) or asks for
   something new.
2. **Orion** (when design is involved) sends concepts and reference
   images, ideally with a short note addressed "For Chad:" saying what
   matters and what to preserve.
3. **Chad** builds it on the preview branch, tests it (see below), pushes,
   and sends Merlin before/after pictures plus the preview link.
4. **Merlin** reviews at the preview link and either sends more notes or
   says **"Go live"**.
5. **Chad** fast-forwards `main`, confirms the deploy succeeded, and
   records the build in `MILESTONES.md`.

### Links

- Live: https://elbrilliant4.github.io/Cat-app/
- Preview: https://elbrilliant4.github.io/Cat-app/preview/
- Review pack (close-ups, clips, sounds of the preview):
  https://elbrilliant4.github.io/Cat-app/preview/review/

The build number in the app's header is the commit count on its branch.
The preview updates a minute or two after a push. The review pack takes
longer, because CI renders it.

## Instructions for Orion (ChatGPT)

- Send references as images, plus a few lines on what to keep, what to
  change, and what must not move. Example: "Keep the kitchen layout; the
  faucet stays reachable."
- Describe shapes physically: folds, weight, sag, piping, scale, how a
  fabric drapes. Chad builds geometry and textures from those words.
- For motion notes, say which leg, when (walking, turning, on a shelf),
  and what's wrong (dragging, gliding, stiff). Short video clips help most.
- Don't send code that has to be pasted in blindly. Chad works in the
  repository and will adapt ideas into the existing structure.
- If you suggest a change to how things work, flag anything that affects
  the rules above (for example, anything that changes live without
  review).

## Instructions for Claude (Chad)

Start with `CLAUDE.md`, then the docs in `docs/` (workflow, roadmap, phase
briefs, architecture, QA tools). One session = one phase. Keep the docs up
to date instead of relying on chat history.

## How to talk to Merlin (both Claude and ChatGPT)

- Extremely concise. Simple words. Grammar optional.
- If a request is ambiguous, ask ONE clarifying question before doing anything.
- Evidence before confidence: show numbers, screenshots or clips; don't
  claim what you haven't checked.
- Several options → always recommend one (and say why), and let Merlin
  pick one to go ahead with. Give them as multiple choice: Claude uses its
  picker; ChatGPT lists them as A, B, C (recommended first) so Merlin can
  answer with one letter.
- Done with a task → tell Merlin (Claude also pings him) and say in simple
  words what was done.

## Current state and open items

See `docs/ROADMAP.md` (phases) and `MILESTONES.md` (live builds).
