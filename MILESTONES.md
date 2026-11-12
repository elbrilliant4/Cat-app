# Mochi milestones

Archived versions of Mochi, so earlier looks can always be restored (Eagle is
attached to her appearance, and a personal "Lettuce" version may come from one
of these). Each is a commit in this repository; `git checkout <commit> -- dist`
brings that version's app back.

| Milestone | Commit | Notes |
|---|---|---|
| OG Mochi | `135be78` | The first realistic ragdoll: the Meshy model, rigged at load time, with fur and real eyes. |
| Live build 84 | `10e1fc6` | The living room only, before the kitchen. |
| Live build 108 | `a82c556` | The kitchen, as Lettuce first enjoyed it. |
| Live build 136 | `670a3b9` | The new rig and movement (gallop, real steps), the study and kitchen joined by a doorway, night with a sun/moon button and a night-owl cat, kitchen Halloween and Thanksgiving, the lamp ride, Orion's cushions. (`?motion=classic` still brings back the old movement.) |
| Live build 137 | `631f8ab` | Mouth reaches the food and water (sits in the sink to lap the faucet), monarch butterflies at the windows, vacuum steers round the island and stools, steadier legs on turns and shelves, gathered tent flaps. |
| Live build 171 | `70ade23` | Walks like a cat (set to measured cat numbers: longer slower steps, lower, narrow track, no stutter-step), a trot for every run, gallop only at a dash or zoomies, hind legs no longer hop together. |
| Live build 174 | `97f11c8` | Halloween stored away out of October (a room left in it wakes up as Thanksgiving). |
| Live build 190 | `43fdbf8` | Vision: her tail and body kept out of the kitchen furniture, the vacuum's lanes and keep-out sized for her, boarding and leaving the vacuum from a side with room. Also the new working rules (CLAUDE.md, SPEC.md, asset and design rules, taste skill and its browser connector). |
| Live build 192 | `f91155a` | Docs only: every suggestion, merge and go-live is a clickable choice. Mochi unchanged from build 190. |
| Live build 203 | `795e591` | Phase 03: her tail kept out of the study's furniture (walls, fireplace, sill, armchair, side table, pots, bowl, fountain, bed rim, mantel vase) and the kitchen's wall steps and shelves; new tail check `tools/qa/tail.mjs`. |
| Live build 212 | `261ff9f` | Phase 06: her body kept out of the wall on narrow perches (deeper kitchen steps, spots at the front, mantel sat along, sill on the slant, a turn in the air to land); the tail check now measures her body and tours the perches. |
| Live build 214 | `1cfc013` | Cleanup, no change to Mochi: unused meow envelope and a compiled file removed, rand/pick shared, one mesh helper, README points at CLAUDE.md, debug flags written down. Tail check identical to build 212. |
| Motion trial, first review | `6dbfb4d` | Repaired rig and authored walk, sit and lie-down (trial page only). |

Direction (Merlin and Orion): preserve her identity, not her imperfections.
Her face, expressions, proportions, rig and movement may keep improving;
the original geometry isn't untouchable, but she stays recognisably the same
peculiar, endearing kitten. Paid Meshy is reserved for a second cat.
