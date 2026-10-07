# Mochi's sounds

`sounds.json` lists the recordings the app plays. Mochi's meows are
synthesized (`../../meows.js`: the first version's meow, chosen by ear)
unless a recording is listed for that kind of call; her purr is the recorded sleepy purr.

- No status: plays everywhere. `"candidate"`: preview only, until approved by
  ear. `"reference"`: never played, shown in the review pack for comparison.
- Only use recordings you may use in a commercial app: your own, CC0, or
  CC BY (then add the required credit to `credits`).
- The recordings are made from `sources/audio/` by `tools/audio/prepare.py`
  (trim, rumble and noise reduction, click repair, loudness matching, loop
  seams). The recorded meow candidates were not approved; the script only
  writes them with `--with-meows`.
