# Phase 11 — Title: the zoomies cinematic

## Goal
Merlin (2026-11-11): the title screen is "too simplistic"; he wants better
graphics, "more dynamic and exciting", "exciting like Star Rail". He picked
the **zoomies cinematic with the real Mochi** (not a generated film).

Done when: on a phone, the opening shows her in action within the first
second, ends on a name logo reveal, and a tap leaves through a showpiece
transition; a tap skips at any moment; `tools/qa/title.mjs` passes; Merlin
has seen a true-speed clip (`tools/qa/title-clip.mjs`) and said yes.

## What exists (step 1, on the preview branch, not live)
"Tap to wake her": she sleeps on the study bed under her name; a tap wakes
her, the camera glides out, the stage shrinks to its card, a music-box
chime plays (sound on only). Code: the "Title screen" block in `app.js`
(`titleOn`, `titleView`, `titleLife`, `leaveTitle`, `shrinkTitle`,
`endTitle`), `#title` in `index.html`, the end of `style.css`,
`sounds.play` in `sound.js`. See `docs/ARCHITECTURE.md`.

## What is weak (agreed with Merlin)
- Nothing moves at first; flat picture (no glow, depth blur, light shafts,
  particles); the name is plain system text (no logo, no shine); no music;
  the tap's payoff is small.

## Plan (in this order; each step is shippable)
1. **Enter gate.** One "Enter" tap first (two buttons like C.F.B.: with
   sound / quietly), because browsers block sound before a tap. Sound stays
   off in the save unless he picks "with sound".
2. **The sequence, about 9 s, cut to the music** (story clock like the CPA
   intro's `SHOTS`; every shot = a camera placement + an action she can
   already do):
   1. Black. Close on her face asleep; eyes snap open (`express`).
   2. Low side camera: she gallops across the rug (`dash` / the gallop gait).
   3. She leaps to the shelf (`jumpTo`), camera whips up to follow.
   4. Slow motion: a paw pats the vase, it wobbles (`knockVase`); it must
      NOT fall in the intro (the room should start tidy).
   5. She pounces toward the camera (`shadowPounce` or a `leap`), freeze
      frame, white flash.
   6. Name logo slams in with a shine sweep and a sparkle burst; she lands
      and sits, tail swishing.
   Then the **living title**: she sits and looks around, "Tap to start".
3. **Graphics.** Vendor three r180's `EffectComposer`, `RenderPass`,
   `UnrealBloomPass`, `OutputPass` (and `BokehPass` if it holds 30 fps on a
   phone) into `dist/vendor/`; use them ONLY while the title is up, then
   switch back to the plain renderer. Sun shafts through the window (additive
   cones), dust motes (points), vignette and a little grain (one small
   shader pass). Motion streaks in the gallop shot (CSS speed lines are
   enough).
4. **Logo.** A drawn "Mochi" wordmark does not work: the kitten can be
   renamed. Keep live text; give it a display treatment (gradient fill,
   shine sweep with `background-clip: text`, a paw mark) and a generated
   ornament if it helps.
5. **Music.** One 10 to 12 s title sting from Runway (`generate_music`,
   `lyria-3-clip`, 4 credits a take): playful, a build, a hit at the freeze
   frame (shot 5), a soft tail under the title. Cut the shots to it.
   Merlin picks by ear from 2 or 3 takes. The wake chime
   (`wake-chime.mp3`) stays for the short version.
6. **Tap transition.** A paw-print wipe (CSS mask growing from the tap
   point) with a flash, into the app; replaces the shrink.
7. **How often.** Full sequence the first launch of the day; the short
   title (step 1's, with the new graphics) the other times. `?intro=full`
   and `?intro=short` force one; `?intro=0` and `?debug` still turn it off.
   A tap skips to the living title at any moment.

## Not in this phase
A generated (Runway) film; new 3D props from Meshy (nothing in the shot
list needs one; Merlin offered the credits, so use them if a shot does);
an on/off switch in the app (do it with phase 08, app screens).

## Risks
- **Phone speed.** Bloom and depth blur on a mid phone. Measure frame time
  on the title; drop depth blur first, then bloom to half size.
- **Team rule: no continuous sounds.** A 10 s sting bends it; Merlin was
  told and chose this option. Do not loop it.
- **She must end where the app starts.** After the sequence the room must
  be tidy (vase up, toy home) and `pet` unchanged, as in step 1.
- **Reduced motion:** no sequence, no flash; the still title only.
- **Random behaviour.** `idleLife` stays off for the whole title; the
  sequence drives her with direct calls.

## How to test
- `node tools/qa/title.mjs` (needs `npm run dev`): add cases for skip
  mid-sequence, full vs short, reduced motion.
- `node tools/qa/title-clip.mjs`: the true-speed clip for Merlin (GitHub
  Actions has never run on this repo, so `/preview/` does not update; the
  clip is the preview until Merlin fixes Actions).
- Frame time: log the average over the sequence in the QA run.

## Facts worth knowing
- Three is r180, vendored without the post-processing addons.
- `renderer.setSize` sets the canvas size in px inline: to scale the
  picture with its box, set the canvas style to 100% (see `shrinkTitle`).
- QA time is stepped by hand; CSS animations are held to that clock in
  `title-clip.mjs` (`document.getAnimations()`).
- Runway: about 1470 credits left (2026-11-11). Meshy and Gemini are
  reachable from the cloud session without keys.

## Result so far (2026-11-11, on the preview branch, not live)
Built: steps 1, 2, 3 and 7, plus the name treatment from step 4.
- **Enter gate**: "Enter with sound" (turns sound on in the save) and
  "Enter without sound" (save untouched).
- **The sequence, 7.6 s** (shot starts on the story clock): 0 face asleep,
  eyes snap open at 0.72; 1.3 gallop across the rug; 3.05 running leap to
  the mantel; 4.5 two pats at the vase, slow motion (rate 0.28) from 5.25
  to 6.05, the vase rocks and stays up; 6.3 pounce at the lens, freeze and
  white flash at about 7.2; her name slams in at about 7.5. Then the
  living title: she sits on the rug and looks about, "Tap to start".
- **Graphics** (`dist/title-fx.js`): bloom, vignette, grain, sun shafts,
  dust; film bars and speed lines in CSS. Only while the title is up.
- **Skip**: a tap (or Enter, Space, Escape) at any moment goes to her name.
- **How often**: full the first launch of the day, short after;
  `?intro=full` / `?intro=short` force one. Reduced motion or put to bed:
  always the short one.
- "The shelf" is the mantel (that is where the vase is).

Not built yet: the music sting (step 5; the sequence is silent), the
paw-wipe (step 6; it still shrinks to the card), a generated ornament for
the name, depth blur.

Not measured: speed on a real phone. This machine draws by software, so
its frame time says nothing about a phone. In place of a measurement the
picture steps itself down when frames run over 40 ms (pixel ratio 1, then
no bloom). Needs one look on Merlin's phone.

Added 2026-11-12 (Merlin's pick): the Pocket Kitten logo (made with Runway
in a side chat) is the brand at the top of the title; her name stays in the
reveal under it, and the button says "Play with <name>". Three Meshy toys
(yarn ball, felt mouse, fabric fish) sit on the rug beside her in the living
title only; the yarn ball rolls and her eyes follow. No generated film.

Timing note for step 5: the hit is the freeze at about 7.2 s after Enter;
the name lands about 0.35 s later. Cut the music to those, or move the
`CUES` times to the music.
