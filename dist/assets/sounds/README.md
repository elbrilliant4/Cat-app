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

`wake-chime.mp3`: the title screen's wake-up chime (a music box), played
once as she wakes, sound on only. Generated with Runway on Merlin's plan
(2026-11-11), trimmed and levelled with ffmpeg; Merlin picked it by ear over
a celesta take. Not listed in `sounds.json` (that is her own voice).

`music-box.mp3`, `music-piano.mp3`, `music-guitar.mp3`: the three pieces of
music a player can pick in the sound panel (`TUNES` in `../../sound.js`),
60 s each. Made with ElevenLabs Music (2026-11-14); the originals are in
`sources/audio/music/`. Levelled to one loudness, faded in and out and
shrunk with ffmpeg (`loudnorm=I=-24`, 96 kbps). Not listed in `sounds.json`.
