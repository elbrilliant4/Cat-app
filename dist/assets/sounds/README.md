# Mochi's sounds

`sounds.json` lists the recordings the app plays. Until it lists some, Mochi
meows silently (her mouth still moves) and only the synthesized purr and room
tone are heard.

To add recordings:

1. Use only recordings you may use in a commercial app: your own, CC0, or
   CC BY (then add the required credit to `credits`).
2. Trim each to a single gentle call (0.3–1.2 s), with a few milliseconds of
   silence at each end, and normalise to about −3 dB peak. Ogg Vorbis or MP3,
   mono, 44.1 or 48 kHz.
3. Put the files here and list them, for example:

```json
{
  "clips": [
    {"file": "mew-1.ogg", "kind": "mew"},
    {"file": "meow-1.ogg", "kind": "meow", "gain": 0.8},
    {"file": "trill-1.ogg", "kind": "chirp"},
    {"file": "sleepy-1.ogg", "kind": "sleepy"}
  ],
  "credits": ["“Soft meow” by Someone, CC BY 4.0, https://…"]
}
```

A recorded purr (`"kind": "purr"`, a loopable clip of a few seconds) replaces
the synthesized one. The mouth follows each recording's loudness
automatically.
