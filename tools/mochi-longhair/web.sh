#!/usr/bin/env bash
# Packs the long-haired Mochi for the web (phase 18). The source stays
# dist/assets/mochi-longhair-hq.glb (8.9 MB); the app loads these two:
#   mochi-longhair-web.glb    same textures, packed shape   (about 4.8 MB)
#   mochi-longhair-phone.glb  textures at 1024, packed shape (about 2.2 MB)
# Needs: npm i -g @gltf-transform/cli   (not a project package: a one-off tool)
set -euo pipefail
cd "$(dirname "$0")/../../dist/assets"
Q="--quantize-position 16 --quantize-texcoord 14"
gltf-transform meshopt mochi-longhair-hq.glb mochi-longhair-web.glb $Q
gltf-transform resize mochi-longhair-hq.glb /tmp/mochi-1k.glb --width 1024 --height 1024
gltf-transform meshopt /tmp/mochi-1k.glb mochi-longhair-phone.glb $Q
rm /tmp/mochi-1k.glb
