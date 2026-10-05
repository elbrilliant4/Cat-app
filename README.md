# Pocket Kitten — full Codex handoff

The complete virtual-pet app created on October 5, 2026, using your uploaded Meshy cat. Read **CODEX-HANDOFF.md** first.

This is the new companion app, not a merged copy of the separate earlier paper-bag project.

## Run

Use Node.js 20 or newer. All browser dependencies are bundled locally. No npm install, account, API key or build step is required.

```sh
cd Pocket-Kitten-Codex
npm run dev
```

Open http://127.0.0.1:5173/ in a WebGL-capable browser. Serve over HTTP; do not double-click index.html. Set PORT to change the port. For a remote preview, set HOST to 0.0.0.0 and use the environment's port forwarding.

```sh
npm run check
```

## Files

- `dist/index.html`, `dist/style.css`, `dist/app.js`: full UI and Three.js room/interaction source.
- `dist/pet-state.js`: care rules, saves and offline progression.
- `dist/assets/kitten.glb`: original Meshy GLB, unchanged, with textures and rig embedded.
- `dist/assets/paw.svg`: app icon.
- `dist/vendor/`: local Three.js, GLTFLoader, utilities and license.
- `checks.mjs`: care and asset checks.
- `server.mjs`: dependency-free preview server.
- `.openai/hosting.json`: existing hosted Site identity/configuration.
- `SOURCE-SNAPSHOT.json`: source provenance and model checksum.
- `CODEX-HANDOFF.md`: status, limitations and next priorities.

## Hosted app

https://pocket-kitten-companion.elbrilliant4.chatgpt.site

The hosted version is owner-private. Your local preview is separate. Browser saves remain on each browser/origin; they are not included in this archive.
