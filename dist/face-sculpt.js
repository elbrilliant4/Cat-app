// Gives Mochi a real mouth. The Meshy model's muzzle is a smooth, coarse
// surface with the mouth only painted on, so at load time we:
//   1. refine the mesh around the muzzle (two rounds of conforming 1→4 splits),
//   2. sculpt it: two rounded muzzle pads, a groove under the nose (philtrum),
//      a lip line with the upper lip slightly overhanging, and a small chin,
//   3. open the lip line into a narrow slit, so the jaw can part the lips and
//      a mouth interior (built in real-cat.js) shows through.
// All coordinates are in the GLB's own space (cat faces +z).
import * as THREE from 'three';

export const MOUTH = {
  midX: -0.313,
  // Lip line: y at a given distance from the midline. A small peak under the
  // philtrum, falling gently to the corners.
  seamY: dx => 0.2835 - 0.0052 * fade(Math.abs(dx), 0.002, 0.03) - 0.004 * fade(Math.abs(dx), 0.026, 0.038),
  halfWidth: 0.034,
  frontZ: 0.86,
};

// Smooth 0→1 step that also works with reversed edges (e0 > e1 fades out).
export const fade = (x, e0, e1) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

const inRegion = (x, y, z) => z > 0.8 && Math.abs(x - MOUTH.midX) < 0.085 && y > 0.235 && y < 0.34;

// One round of red–green refinement on an indexed, non-interleaved geometry:
// every triangle touching the region is split 1→4, and its neighbours are
// split along the shared edges so no cracks appear.
function refine(geometry) {
  const attrs = Object.entries(geometry.attributes).map(([name, a]) => ({name, size: a.itemSize, data: Array.from(a.array)}));
  const pos = attrs.find(a => a.name === 'position');
  const index = Array.from(geometry.index.array);
  const count = () => pos.data.length / 3;
  const split = new Set();
  const key = (a, b) => a < b ? a * 1e7 + b : b * 1e7 + a;
  for (let t = 0; t < index.length; t += 3) {
    const tri = [index[t], index[t + 1], index[t + 2]];
    if (!tri.some(i => inRegion(pos.data[3 * i], pos.data[3 * i + 1], pos.data[3 * i + 2]))) continue;
    split.add(key(tri[0], tri[1])); split.add(key(tri[1], tri[2])); split.add(key(tri[2], tri[0]));
  }
  const mid = new Map();
  const midpoint = (a, b) => {
    const k = key(a, b);
    if (mid.has(k)) return mid.get(k);
    const n = count();
    for (const at of attrs) for (let c = 0; c < at.size; c++) at.data.push((at.data[a * at.size + c] + at.data[b * at.size + c]) / 2);
    mid.set(k, n);
    return n;
  };
  const out = [];
  for (let t = 0; t < index.length; t += 3) {
    const [a, b, c] = [index[t], index[t + 1], index[t + 2]];
    const sab = split.has(key(a, b)), sbc = split.has(key(b, c)), sca = split.has(key(c, a));
    const n = sab + sbc + sca;
    if (n === 0) { out.push(a, b, c); continue; }
    if (n === 3) {
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      out.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
      continue;
    }
    // Rotate so the split edges come first, keeping winding.
    let v = [a, b, c], s = [sab, sbc, sca];
    while (!(n === 1 ? s[0] : s[0] && s[1])) { v = [v[1], v[2], v[0]]; s = [s[1], s[2], s[0]]; }
    if (n === 1) {
      const m = midpoint(v[0], v[1]);
      out.push(v[0], m, v[2], m, v[1], v[2]);
    } else {
      const m0 = midpoint(v[0], v[1]), m1 = midpoint(v[1], v[2]);
      out.push(m0, v[1], m1, v[0], m0, m1, v[0], m1, v[2]);
    }
  }
  const g = new THREE.BufferGeometry();
  for (const at of attrs) {
    const src = geometry.attributes[at.name];
    g.setAttribute(at.name, new THREE.BufferAttribute(new src.array.constructor(at.data), at.size, src.normalized));
  }
  g.setIndex(count() > 65535 ? new THREE.Uint32BufferAttribute(out, 1) : new THREE.Uint16BufferAttribute(out, 1));
  return g;
}

const gauss = (v, w) => Math.exp(-(v * v) / (2 * w * w));

// Displacement (model units, along the surface normal) at a muzzle point.
function sculptHeight(x, y) {
  const dx = x - MOUTH.midX, ax = Math.abs(dx), seam = MOUTH.seamY(dx);
  let h = 0;
  // Muzzle (whisker) pads: two soft mounds either side of the philtrum.
  const px = (ax - 0.028) / 0.024, py = (y - 0.297) / 0.019;
  h += 0.0075 * Math.exp(-(px * px + py * py) * 1.6);
  // Philtrum: a narrow groove from the nose down to the lip.
  if (y > seam && y < 0.316) h -= 0.0026 * gauss(dx, 0.0032) * fade(y, seam, seam + 0.004);
  // Lip line: a fine crease; the upper lip overhangs a touch, the lower lip
  // sits back.
  const inMouth = 1 - fade(ax, MOUTH.halfWidth - 0.006, MOUTH.halfWidth + 0.006);
  h -= 0.0038 * gauss(y - seam, 0.0022) * inMouth;
  h += 0.0012 * gauss(y - (seam + 0.004), 0.003) * inMouth;
  h -= 0.0022 * fade(seam - y, 0.001, 0.008) * (1 - fade(seam - y, 0.012, 0.03)) * inMouth;
  // Chin: a small rounded bump below the lower lip.
  const cx = dx / 0.022, cy = (y - 0.258) / 0.013;
  h += 0.0042 * Math.exp(-(cx * cx + cy * cy) * 1.4);
  return h;
}

// The model's whiskers are sculpted as thick webbed clumps growing out of the
// muzzle pads (fine strands are drawn instead, see addWhiskers). Fold the
// clumps' roots back onto the face so the pads read as smooth, rounded mounds.
// The face here sits close to an ellipsoid around the head (FACE_SHELL), which
// also decides what counts as a clump (anything standing out in front of it).
export const FACE_SHELL = {c: new THREE.Vector3(-0.313, 0.38, 0.66), r: new THREE.Vector3(0.3, 0.27, 0.27)};
export const shellRadius = (x, y, z) => Math.hypot((x - FACE_SHELL.c.x) / FACE_SHELL.r.x, (y - FACE_SHELL.c.y) / FACE_SHELL.r.y, (z - FACE_SHELL.c.z) / FACE_SHELL.r.z);
const PAD_BAND = (x, y, z) => z > 0.8 && y > 0.235 && y < 0.335;
// How much of the folding applies at a point (also tells the fur shader which
// clump parts are now face and must not be hidden).
export const padWeight = (x, y, z) => PAD_BAND(x, y, z) ? fade(Math.abs(x - MOUTH.midX), 0.115, 0.095) * fade(y, 0.235, 0.245) * fade(y, 0.335, 0.325) : 0;
function foldWhiskerRoots(g) {
  const pos = g.attributes.position, nrm = g.attributes.normal, p = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    if (!PAD_BAND(p.x, p.y, p.z)) continue;
    const r = shellRadius(p.x, p.y, p.z), target = 0.895;
    if (r <= target) continue;
    const w = padWeight(p.x, p.y, p.z);
    if (w <= 0) continue;
    // Pull radially toward the shell, and face the shell's normal.
    const k = 1 + (target / r - 1) * w;
    p.sub(FACE_SHELL.c).multiplyScalar(k).add(FACE_SHELL.c);
    pos.setXYZ(i, p.x, p.y, p.z);
    n.set((p.x - FACE_SHELL.c.x) / FACE_SHELL.r.x ** 2, (p.y - FACE_SHELL.c.y) / FACE_SHELL.r.y ** 2, (p.z - FACE_SHELL.c.z) / FACE_SHELL.r.z ** 2).normalize();
    const o = new THREE.Vector3().fromBufferAttribute(nrm, i).lerp(n, w).normalize();
    nrm.setXYZ(i, o.x, o.y, o.z);
  }
}

export function sculptMouth(geometry) {
  let g = refine(refine(geometry));
  // Remember how far out each point stood before folding: the fur shader
  // still hides the whisker clumps by it (see furLengths in real-cat.js).
  const p0 = g.attributes.position, shell0 = new Float32Array(p0.count);
  for (let i = 0; i < p0.count; i++) shell0[i] = shellRadius(p0.getX(i), p0.getY(i), p0.getZ(i));
  g.setAttribute('shell0', new THREE.BufferAttribute(shell0, 1));
  foldWhiskerRoots(g);
  const pos = g.attributes.position, nrm = g.attributes.normal, N = pos.count;
  // Displace along the normal, fading out at the region's edge. Copies of a
  // vertex along UV seams share one averaged normal, so they move together
  // and no cracks open.
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  const keyOf = i => Math.round(pos.getX(i) * 1e5) + ',' + Math.round(pos.getY(i) * 1e5) + ',' + Math.round(pos.getZ(i) * 1e5);
  const shared = new Map();
  for (let i = 0; i < N; i++) {
    p.fromBufferAttribute(pos, i);
    if (!inRegion(p.x, p.y, p.z) || p.z < 0.82) continue;
    const k = keyOf(i);
    if (!shared.has(k)) shared.set(k, new THREE.Vector3());
    shared.get(k).add(n.fromBufferAttribute(nrm, i).normalize());
  }
  for (let i = 0; i < N; i++) {
    p.fromBufferAttribute(pos, i);
    if (!inRegion(p.x, p.y, p.z) || p.z < 0.82) continue;
    const edge = fade(Math.abs(p.x - MOUTH.midX), 0.08, 0.06) * fade(p.y, 0.236, 0.245) * fade(p.y, 0.338, 0.33);
    n.copy(shared.get(keyOf(i))).normalize();
    p.addScaledVector(n, sculptHeight(p.x, p.y) * edge);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  // Open the lip line: drop the thin band of triangles that straddle it.
  const index = Array.from(g.index.array), kept = [];
  for (let t = 0; t < index.length; t += 3) {
    const tri = [index[t], index[t + 1], index[t + 2]];
    let above = 0, below = 0, front = true, cx = 0;
    for (const i of tri) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), dx = x - MOUTH.midX;
      if (z < MOUTH.frontZ || Math.abs(dx) > MOUTH.halfWidth - 0.002) front = false;
      if (y > MOUTH.seamY(dx)) above++; else below++;
      cx += dx / 3;
    }
    if (front && above && below) continue;
    kept.push(...tri);
  }
  g.setIndex(kept.length && N > 65535 ? new THREE.Uint32BufferAttribute(kept, 1) : new THREE.Uint32BufferAttribute(kept, 1));
  smoothNormals(g);
  return g;
}

// Recompute normals in the sculpted area, welding UV-seam duplicates so no
// shading seams appear; elsewhere the original normals are kept.
function smoothNormals(g) {
  const pos = g.attributes.position, nrm = g.attributes.normal, idx = g.index, N = pos.count;
  const weld = new Map(), id = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const k = Math.round(pos.getX(i) * 1e5) + ',' + Math.round(pos.getY(i) * 1e5) + ',' + Math.round(pos.getZ(i) * 1e5);
    if (!weld.has(k)) weld.set(k, weld.size);
    id[i] = weld.get(k);
  }
  const acc = new Float32Array(weld.size * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let t = 0; t < idx.count; t += 3) {
    const i0 = idx.getX(t), i1 = idx.getX(t + 1), i2 = idx.getX(t + 2);
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    if (!inRegion(a.x, a.y, a.z) && !inRegion(b.x, b.y, b.z) && !inRegion(c.x, c.y, c.z)) continue;
    fn.subVectors(c, b).cross(a.clone().sub(b));
    for (const i of [i0, i1, i2]) { acc[id[i] * 3] += fn.x; acc[id[i] * 3 + 1] += fn.y; acc[id[i] * 3 + 2] += fn.z; }
  }
  for (let i = 0; i < N; i++) {
    a.fromBufferAttribute(pos, i);
    if (!inRegion(a.x, a.y, a.z)) continue;
    const w = id[i] * 3;
    fn.set(acc[w], acc[w + 1], acc[w + 2]);
    if (fn.lengthSq() < 1e-14) continue;
    fn.normalize();
    // Blend toward the original normal at the region's rim.
    const k = fade(Math.abs(a.x - MOUTH.midX), 0.085, 0.07) * fade(a.y, 0.235, 0.245) * fade(a.y, 0.34, 0.33) * fade(a.z, 0.8, 0.82);
    b.fromBufferAttribute(nrm, i).lerp(fn, k).normalize();
    nrm.setXYZ(i, b.x, b.y, b.z);
  }
}
