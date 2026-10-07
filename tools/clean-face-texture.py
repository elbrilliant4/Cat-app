"""Paints out the whisker strokes baked into Mochi's cheek texture.

The Meshy texture paints the sculpted whiskers onto the cheeks and muzzle as
thin white and dark streaks. Now that the whisker clumps are cut out of the
mesh (dist/face-sculpt.js) and fine strands are drawn instead, those strokes
look like scratches. This finds them (pixels that differ sharply from the fur
around them, inside the cheek and muzzle area only) and fills them in from the
surrounding fur, in both the colour and the normal map.

    python3 tools/clean-face-texture.py models/mochi-ragdoll-meshy.glb dist/assets/mochi-ragdoll.glb [preview-dir]

Needs numpy and opencv-python-headless.
"""
import os, sys
import cv2
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import glb

src, dst = sys.argv[1], sys.argv[2]
preview = sys.argv[3] if len(sys.argv) > 3 else None
g, b = glb.read(src)
prim = g['meshes'][0]['primitives'][0]
pos = glb.accessor(g, b, prim['attributes']['POSITION'])
uv = glb.accessor(g, b, prim['attributes']['TEXCOORD_0'])
idx = glb.accessor(g, b, prim['indices']).reshape(-1, 3)

MID_X = -0.313
EYES = [(-0.388, 0.396), (-0.238, 0.396)]
x, y, z = pos[:, 0], pos[:, 1], pos[:, 2]
dx = np.abs(x - MID_X)
eye = np.min([np.hypot((x - ex) / 0.035, (y - ey) / 0.032) for ex, ey in EYES], axis=0)
nose = np.hypot(x - MID_X, y - 0.327)
region = (z > 0.6) & (y > 0.14) & (y < 0.41) & (dx > 0.03) & (eye > 1.55) & (nose > 0.035)

colour = cv2.imdecode(np.frombuffer(glb.image_bytes(g, b, 0), np.uint8), cv2.IMREAD_COLOR)
normal = cv2.imdecode(np.frombuffer(glb.image_bytes(g, b, 2), np.uint8), cv2.IMREAD_COLOR)
H, W = colour.shape[:2]

# Texture-space mask of the region (triangles with all corners inside it).
mask = np.zeros((H, W), np.uint8)
for tri in idx[region[idx].all(axis=1)]:
    pts = np.round(uv[tri] * [W, H]).astype(np.int32)
    cv2.fillConvexPoly(mask, pts, 255)
mask = cv2.erode(mask, np.ones((3, 3), np.uint8))

# Strokes: sharp local departures in lightness from the median fur colour.
# Two passes: the bold strokes first, then the fainter ones they hid.
clean, clean_n, total = colour.copy(), normal.copy(), np.zeros((H, W), np.uint8)
for threshold in (20, 15):
    lab = cv2.cvtColor(clean, cv2.COLOR_BGR2LAB)
    L = lab[:, :, 0].astype(np.int16)
    med = cv2.medianBlur(lab[:, :, 0], 25).astype(np.int16)
    strokes = ((np.abs(L - med) > threshold) & (mask > 0)).astype(np.uint8) * 255
    strokes = cv2.morphologyEx(strokes, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    strokes = cv2.dilate(strokes, np.ones((5, 5), np.uint8)) & mask
    clean = cv2.inpaint(clean, strokes, 7, cv2.INPAINT_TELEA)
    clean_n = cv2.inpaint(clean_n, strokes, 7, cv2.INPAINT_TELEA)
    total |= strokes
strokes = total
print(f'texture {W}x{H}, region {int((mask > 0).sum())} px, strokes {int((strokes > 0).sum())} px')

if preview:
    os.makedirs(preview, exist_ok=True)
    ys, xs = np.nonzero(mask)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    cv2.imwrite(f'{preview}/before.jpg', colour[y0:y1, x0:x1])
    cv2.imwrite(f'{preview}/after.jpg', clean[y0:y1, x0:x1])
    cv2.imwrite(f'{preview}/strokes.png', strokes[y0:y1, x0:x1])

ok, enc = cv2.imencode('.jpg', clean, [cv2.IMWRITE_JPEG_QUALITY, 97])
b = glb.replace_image(g, b, 0, enc.tobytes())
ok, enc = cv2.imencode('.jpg', clean_n, [cv2.IMWRITE_JPEG_QUALITY, 97])
b = glb.replace_image(g, b, 2, enc.tobytes())
glb.write(dst, g, b)
print('wrote', dst, os.path.getsize(dst), 'bytes')
