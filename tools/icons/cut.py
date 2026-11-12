# Cut a 3x3 icon sheet on white into transparent icons.
# White is unmixed ("colour to alpha") only in the background and a thin band
# at the object's edge, so white highlights inside an icon stay solid.
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
src, out = sys.argv[1], sys.argv[2]
# usage: cut.py sheet.png outdir [names,comma,separated] [grid]
names = sys.argv[3].split(',') if len(sys.argv) > 3 else ['bowl','heart','drop','bolt','sparkle','paw','moon','yarn','brush']
G = int(sys.argv[4]) if len(sys.argv) > 4 else 3
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
H, W, _ = im.shape
for i, name in enumerate(names):
    r, c = divmod(i, G)
    cell = im[r*H//G:(r+1)*H//G, c*W//G:(c+1)*W//G]
    a_raw = np.clip((1 - cell.min(axis=2)) / 1.0, 0, 1)          # how far from white
    near = a_raw < 0.10                                           # background-ish
    lab, _ = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    band = ndimage.binary_dilation(bg, iterations=4) & ~bg
    alpha = np.ones(a_raw.shape, np.float32)
    alpha[bg] = 0
    alpha[band] = np.clip(a_raw[band] * 1.6, 0, 1)
    # keep only the biggest piece plus anything within reach (the little stars)
    solid = alpha > 0.5
    lab2, n = ndimage.label(solid)
    if n:
        sizes = ndimage.sum(solid, lab2, range(1, n + 1))
        keep = [k + 1 for k, s in enumerate(sizes) if s > sizes.max() * 0.01]
        mask = ndimage.binary_dilation(np.isin(lab2, keep), iterations=6)
        alpha = alpha * mask
    rgb = cell.copy()
    a3 = np.maximum(alpha, 1e-3)[..., None]
    un = (rgb - (1 - a3)) / a3                                    # remove the white mixed into edges
    rgb = np.where(band[..., None], np.clip(un, 0, 1), rgb)
    rgba = np.dstack([rgb, alpha])
    img = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
    bb = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop(bb)
    side = int(max(img.size) / 0.9)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    canvas = canvas.resize((192, 192), Image.LANCZOS)
    canvas.save(f'{out}/{name}.png')
    print(name, bb)
