# Phase 07 — Walk like a cat again

## Goal
Merlin (2026-10-24): her walk "is not cat like any more. She sort of struts,
a wee bit like John Travolta in Staying Alive, and her hind legs gallop if
she's running or chasing after a toy." When the new rig first went in she
"moved more gracefully, minus the flopping head and ears and minus the
levitating dragging legs." Get that grace back without bringing those back.

## Known facts
- Old vs new clips of a normal walk (`tools/qa/clip.mjs SCENE=walk`,
  before/after phase 01) look the same frame by frame: the strut is older
  than phase 01.
- The run: phase 01 (`c048b4b`) made the hind paws lift sooner at the gallop
  (`dk = duty - .05*runW`) and the run duty .36 -> .30. Hind legs now spend
  ~75% of a stride in the air: both hop together ("hind legs gallop").
  Revert that part first; keep the front-paw landing fix and the bed fix,
  then re-check `gallop.mjs` (LH was 7.5% / 7.2cm before it).
- Suspect for the strut (not proven): `6c56c04` "all four legs show more
  often" put the hind paws out wider than the hips (+.05 / -.055 m), the
  front paws in under the chest, front legs upright, a taller stance. With
  the walk's hip roll (`pelvis.roll .045`, `yaw .03`, `swayH .012` per hind
  swing in `motion-cat.js`), wide hips that roll read as a swagger.
- Versions to compare: `34d84a2` (new rig in the app), `7981a2b` (real
  steps again), `6c56c04` (wide stance), now.

## Where to look
`dist/motion-cat.js`: `home0` (stance), pelvis roll/yaw/sway in "State for
the rig", `stride`/`duty`, `PHASE_RUN`, the `runW` threshold (gallop starts
at speed 1.0; chasing a toy may want a trot, not a gallop).

## Plan
1. Revert the hind lift-off change; `gallop.mjs` + run clip.
2. Clips of the same walk at `7981a2b` and now, side by side (copy
   `tools/qa/lib.mjs` and `clip.mjs` into the old checkout). Send Merlin.
3. Ask Orion (Work Orion, technical animator) for notes on the clips (see
   below). Change stance width, hip roll, stride one at a time, a clip each.
4. Keep phase 01's numbers: `legs.mjs` seeds 777 and 42 must not get worse.

## For Orion (paste with the clips)
"Here are side-view clips of Mochi walking and running: an earlier build
Merlin liked, and today's. Merlin says she now struts and her hind legs hop
together when she runs. As a technical animator: what's off compared with a
real ragdoll kitten? Please be specific: stance width (front and hind), hip
sway and roll, head bob, step timing (which paw when), stride length, how
low she carries her body, and the run (trot vs gallop, when each). Numbers
or frame references if you can, and one or two real cat video references."

## Test
Clips side by side; Merlin's eye decides. `legs.mjs` and `gallop.mjs` no
worse than phase 01's result.

## Result (preview, 2026-10-24): part 1, the run
**Run fixed; strut not yet changed** (waiting on Merlin's eye and Orion's notes).

Step 1 (revert phase 01's hind lift-off and run duty .30 -> .36) brought back
the old reach problem exactly (LH 7.5% / 7.2cm) and didn't stop the hop:
both hind paws still up 45% of running frames. Two causes of the hop:
- hind legs only .1 of a stride apart (`PHASE_RUN` RH .1): they move as a pair;
- each hind paw up 75% of the stride: whatever the spacing, two paws up
  that long overlap at least 2x.75-1 = 50%.

Change (`motion-cat.js`): hinds a quarter stride apart (`PHASE_RUN`
`{LH 0, RH .25, LF .5, RF .7}`), hind duty .37 (front .36), and quicker,
shorter bounds (run stride `clamp(.2 + .2*gait, .5, .62)`, was .8-1.05)
so a planted hind paw stays in reach; bound .045 -> .035. Hind lift-off
hack (`dk`) removed. Tried and dropped: bound later in the stride (front
legs stretch more), a tighter leash at the run (no gain).

`gallop.mjs` (HEAD -> now):
| seed | both hind up | worst stretch | stretched >2cm (LF/RF/LH/RH) |
|---|---|---|---|
| 777 | 59% -> 36% | 2.6 -> 2.0cm | 3.8/0/0.9/0 -> 0.9/0/0/0 % |
| 42 | 65% -> 37% | 3.1 -> 5.1cm | 3.9/1.3/1.3/0 -> 1.3/0/1.3/0 % |

Seed 42's 5.1cm is one frame at take-off (0.3 -> 1.7 m/s in a quarter
second, turning): the paw lands short mid-acceleration. Left as is.

`legs.mjs` SEC=120, walk + play rows (HEAD -> now):
| seed | stretched >2cm | worst |
|---|---|---|
| 777 | 0.21% -> 0.17% | 3.5 -> 3.6cm |
| 42 | 0.24% -> 0.10% | 6.9 -> 3.8cm |

Clips (sent to Merlin, `qa-out/`): `gallop-old-vs-new.mp4` (run fix), and
the pack for Orion in `qa-out/pack/`: walk, run, turn, early rig (34d84a2)
vs preview, same seed and path, with `for-orion.txt` (the question above
plus what changed in the walk). Old build in the QA: its kitchen is
made only on a visit, so its copy of `lib.mjs` must not wait for
`kitten.kitchen`.

Walk, early rig vs now (from the code, 34d84a2 -> now), each added to fix
leg drag: steps quicker (stride .65 -> .50 at her walking speed .65 m/s:
1.0 -> 1.3 steps a second); paws lift higher (hind .06 -> .075, short steps
lift more: min .45 -> .7); hind paws out wider than the hips, front paws
in under the chest, a little taller. Same hip roll/yaw/sway as then. In the
clips, now looks taller with hind legs set wide; early rig lower and longer.
Real cats walk a narrow track (hind paw lands near the front paw's print).

**Next (part 2):** Merlin picks; Orion's notes on the clips; then change
stance width, step height, cadence one at a time, a clip each.

## A/B: hind paws lift 20% lower (2026-10-24, waiting on review)
Asked by Merlin/Orion: one controlled change. B = `?hindlift=0.8` on the
preview (hind step height .075 -> .06, walk and run; nothing else). Off by
default: the preview is still A.

`ab-walk.mjs` (seed 777, 2.5s, 60 fps): A and B identical in phase,
position and speed (0.65) on every frame. Hind step peaks 7.4 -> 5.9cm,
front unchanged (5.2-7.9cm).
- `legs.mjs` B vs A: identical, every row (777: 0.17% / 3.6cm; 42: 0.10% / 3.8cm).
- `gallop.mjs` B vs A: 777 LH worst 1.7 -> 1.8cm, rest identical; 42 identical
  (LH 5.1cm take-off frame, as A). No regression.

Seen in both A and B (not part of the A/B): on a straight steady walk the
left hind touches down for one frame mid-swing and lifts again (frame 84,
phase .88), about once in 3 strides: a small hitch.

## Reference from Merlin (2026-10-24): animation walk-cycle tutorial
8-drawing cat walk ("Animation Reference"): frames 1&5, 2&6, 3&7, 4&8 have
left and right legs swapped; at least two paws on the floor at all times
(Mochi already does both). What differs from Mochi (by eye, not measured):
- Side on, the far legs sit almost behind the near ones: a narrow track.
  Mochi's hind paws are set wide on purpose (6c56c04). Strongest strut lead.
- Paws stay low; the front paw folds back at the wrist as it swings
  rather than lifting high. Same direction as the hind-lift A/B.
- Long, level back; head carried forward at about shoulder height.
- Long reach: the front paw lands well forward, under the chin.

## Part 2 (2026-11-10): measured against real cats
Sources (read in full; Merlin allowed the sites):
- Day & Jayne 2007, J Exp Biol 210:642, "Interspecific scaling of the
  morphology and posture of the limbs during the locomotion of cats":
  domestic cat (3.3 kg, 4 cats, 16 strides) walking at .80 m/s: fore duty
  .62, hind duty .59, 1.5 strides/s, stride 165% of hind-leg length, hip
  height at mid-stance 77% of hind-leg length, shoulder 74% of fore-leg.
- Verdugo et al. 2013, BMC Vet Res (PMC3701551), 18 cats on a Tekscan
  walkway at .54-.74 m/s: cycle .80-.85 s (1.2 strides/s), stride .45-.49 m,
  fore stance 59-60%, hind stance 54-55%.
- Klishko et al. 2014, J Neurophysiol (PMC4137248), 5 cats at .72 m/s:
  cycle .71 s (1.4 strides/s), fore duty .64, hind duty .60.
- Bishop et al. 2008, PLoS ONE 3:e3808, "Whole body mechanics of stealthy
  walking in cats": walk-trot transition about 1 m/s (Froude .5); cats
  often walk with diagonality near 25% (feet evenly spaced in time); the
  more crouched, the more even the footfalls.
- Cartmill et al. 2002 (lateral-sequence walk definition; cat in the data set).
Mochi's numbers: `tools/qa/gait-chart.mjs`, straight walk at the app's
walking speed .65, seed 777. Her hind leg (hip to sole) is .44, so real
lengths are compared as a share of leg length.

| | real cat, walking | Mochi before | Mochi now (default) | `?walk=cat` |
|---|---|---|---|---|
| footfall order | lateral sequence LH, LF, RH, RF; fore lands ~1/4 stride after same-side hind | same, but each front paw stutter-stepped before its swing (chart below) | clean: LF at .25 after LH, RF .25 after RH | same |
| paw down (duty) | fore .62-.64, hind .59-.60 (hind less than fore) | fore .59-.61, hind .64-.66 (the other way round) | same | fore .62, hind .57 |
| strides/s | 1.2 at .6 m/s, 1.5 at .8 m/s | 1.4-1.5 at .65 | 1.4 | 1.2 |
| stride / leg length | 140% at .6 m/s, 165% at .8 m/s | 110% | 110% | 135% |
| head bob | ~1.5 cm peak to peak (head-movement study, search summary only) | 1.0 cm | 1.0 | 0.9 |
| head side sway | ~1 cm = ~1.3 cm at her leg length (same source) | +-3 cm | +-2.7 | +-2.1 |
| track | hind paws land about on the fore prints (direct register) | hind track 38 cm, front 21 cm | same | hind 22 cm |
| hip height at mid-stance | 77% of hind-leg length (legs bent) | hip joint at .506 with a .44 leg: near straight; left hind 1.6 cm past straight each stance | same | 5 cm lower while walking: every leg keeps slack (LH 1.1 cm) |
| trot / gallop | walk to trot ~1 m/s; gallop faster still | gallops from 1.0 | same | same (later) |

`?walk=cat` = `gait=long` + `sway=0.5` + `track=narrow` + `low=0.05`, each
also a flag of its own. Footfall chart with it: clean, hind swings start at
.57 of the stance (LH `###################.....`), front at .62.

**Stutter-step (fixed, no flag: a bug).** Footfall chart, each row a paw,
40 columns one stride, `#` down, `.` swing, `e` catch-up step:
```
before                                      after
LH  ##########################..............  #########################...............
LF  ee#.......######################eeeeeeee  ..........#########################.....
RH  #####+..............####################  #####+..............####################
RF  ############eeeeeeeee#........##########  ###############...............##########
```
Both front paws took the catch-up step (from the leg-drag fix) at the end
of every stance, touched down for a frame and lifted again for the real
swing. Cause: the trigger was a fixed fraction of the leash, and a normal
front stance (half the stance travel + the front's 5 cm landing offset)
goes past it. Now: the step is taken when the leg is about to go past
straight (the rig's per-leg reach, 1 cm before) or the paw is clearly
further off than a normal stance leaves it; tripped just before the paw's
own swing, that swing starts a hair early instead (and moves at once);
a catch-up step that lands late in its swing window counts as the swing.
Also: where a swinging paw lands now comes from the stride (a stance
always covers duty x stride), not from her speed of the moment, which
landed paws short while she was still speeding up out of a turn.
