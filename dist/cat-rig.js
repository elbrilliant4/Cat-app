// Builds a cat skeleton inside the static Meshy ragdoll model and computes
// skin weights, so the realistic textured mesh can be posed and animated.
//
// All landmark coordinates are in the GLB's own space (metres, cat facing +z,
// ground at y = -0.628) and were measured on assets/mochi-ragdoll.glb.
// The model stands slightly curved, with its left hind leg stepped out and its
// tail wrapped along its left haunch; REST_FIX straightens it at runtime.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const GROUND_Y = -0.628;
export const MIDLINE_X = -0.313;

// name: [parent, position, end (for leaves / weighting)]
export const BONES = {
  hips:      [null,       V(-0.20, 0.00, -0.48)],
  spine:     ['hips',     V(-0.24, 0.02, -0.12)],
  chest:     ['spine',    V(-0.30, 0.02, 0.22)],
  neck:      ['chest',    V(-0.313, 0.13, 0.46)],
  head:      ['neck',     V(-0.313, 0.33, 0.62), V(-0.313, 0.34, 0.86)],
  jaw:       ['head',     V(-0.313, 0.27, 0.70), V(-0.313, 0.255, 0.86)],
  earR:      ['head',     V(-0.42, 0.50, 0.67), V(-0.47, 0.62, 0.66)],
  earL:      ['head',     V(-0.205, 0.50, 0.67), V(-0.155, 0.62, 0.66)],
  shoulderR: ['chest',    V(-0.45, -0.02, 0.30)],
  elbowR:    ['shoulderR', V(-0.47, -0.30, 0.33)],
  wristR:    ['elbowR',   V(-0.475, -0.52, 0.40), V(-0.48, -0.60, 0.53)],
  shoulderL: ['chest',    V(-0.17, -0.02, 0.30)],
  elbowL:    ['shoulderL', V(-0.155, -0.30, 0.33)],
  wristL:    ['elbowL',   V(-0.15, -0.52, 0.40), V(-0.145, -0.60, 0.53)],
  hipR:      ['hips',     V(-0.37, -0.04, -0.52)],
  kneeR:     ['hipR',     V(-0.39, -0.30, -0.47)],
  hockR:     ['kneeR',    V(-0.41, -0.48, -0.65), V(-0.41, -0.60, -0.51)],
  hipL:      ['hips',     V(-0.05, -0.04, -0.47)],
  kneeL:     ['hipL',     V(0.06, -0.30, -0.36)],
  hockL:     ['kneeL',    V(0.14, -0.48, -0.34), V(0.18, -0.60, -0.15)],
  tail0:     ['hips',     V(-0.10, 0.05, -0.62)],
  tail1:     ['tail0',    V(0.044, 0.008, -0.579)],
  tail2:     ['tail1',    V(0.182, -0.117, -0.539)],
  tail3:     ['tail2',    V(0.347, -0.277, -0.453)],
  tail4:     ['tail3',    V(0.44, -0.334, -0.459)],
  tail5:     ['tail4',    V(0.49, -0.366, -0.564)],
  tail6:     ['tail5',    V(0.457, -0.354, -0.723)],
  tail7:     ['tail6',    V(0.522, -0.382, -0.792), V(0.58, -0.38, -0.79)],
};
const TAIL = ['tail0', 'tail1', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6', 'tail7'];
const LEGS = {
  R: {bones: ['shoulderR', 'elbowR', 'wristR'], axis: [-0.47, 0.36]},
  L: {bones: ['shoulderL', 'elbowL', 'wristL'], axis: [-0.15, 0.36]},
  HR: {bones: ['hipR', 'kneeR', 'hockR'], axis: [-0.40, -0.58]},
  HL: {bones: ['hipL', 'kneeL', 'hockL'], axis: [0.13, -0.28]},
};

// Face landmarks for the eye/mouth shader (same space).
export const FACE = {
  eyeR: V(-0.388, 0.396, 0.826),
  eyeL: V(-0.238, 0.396, 0.826),
  eyeRadius: new THREE.Vector2(0.032, 0.0285),
  mouth: V(-0.313, 0.29, 0.876),
  nose: V(-0.313, 0.327, 0.89),
};

const _ab = new THREE.Vector3(), _ap = new THREE.Vector3();
function segDist(p, a, b) {
  _ab.subVectors(b, a); _ap.subVectors(p, a);
  const t = THREE.MathUtils.clamp(_ap.dot(_ab) / Math.max(1e-9, _ab.lengthSq()), 0, 1);
  return _ap.addScaledVector(_ab, -t).length();
}

/** Returns {root, bones: {name: Bone}, list: Bone[]} with identity rotations. */
export function buildSkeleton() {
  const bones = {}, list = [];
  for (const [name, [parent, pos]] of Object.entries(BONES)) {
    const b = new THREE.Bone();
    b.name = name;
    const parentPos = parent ? BONES[parent][1] : new THREE.Vector3();
    b.position.copy(pos).sub(parentPos);
    if (parent) bones[parent].add(b);
    bones[name] = b;
    list.push(b);
  }
  return {root: bones.hips, bones, list};
}

function segmentFor(name) {
  const [, pos, end] = BONES[name];
  if (end) return [pos, end];
  const child = Object.entries(BONES).find(([, [parent]]) => parent === name);
  return [pos, child ? child[1][1] : pos];
}

/**
 * Computes skinIndex/skinWeight attributes. `color(i)` returns the texture
 * brightness (0..1) at vertex i, used to tell the dark tail from the haunch.
 */
export function computeWeights(geometry, color) {
  const pos = geometry.attributes.position, idx = geometry.index, N = pos.count;
  const names = Object.keys(BONES), NB = names.length;
  const nameIndex = Object.fromEntries(names.map((n, i) => [n, i]));
  const segs = names.map(segmentFor);

  // Weld duplicated seam vertices so smoothing crosses UV seams.
  const key = new Map(), weld = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const k = Math.round(pos.getX(i) * 1e4) + ',' + Math.round(pos.getY(i) * 1e4) + ',' + Math.round(pos.getZ(i) * 1e4);
    if (!key.has(k)) key.set(k, i);
    weld[i] = key.get(k);
  }
  const tailPts = TAIL.map(n => BONES[n][1]).concat([BONES.tail7[2]]);
  const tailDist = p => { let m = 9; for (let k = 1; k < tailPts.length - 1; k++) m = Math.min(m, segDist(p, tailPts[k], tailPts[k + 1])); return m; };

  const W = new Float32Array(N * NB);
  const p = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    if (weld[i] !== i) continue;
    p.fromBufferAttribute(pos, i);
    const row = i * NB;
    const td = tailDist(p);
    const nearHindLeg = Math.hypot(p.x - LEGS.HL.axis[0], p.z - LEGS.HL.axis[1]) < 0.16 && p.y < -0.12;
    const isTail = p.z < -0.28 && !nearHindLeg && (td < 0.06 || (td < 0.18 && color(i) < 0.5) || (td < 0.22 && p.x > 0.3));
    if (isTail) {
      // Follow the tail chain: only the nearest segment and its neighbours,
      // so where the tail curls back on itself it doesn't split apart.
      let k = 1, bd = 1e9, bt = 0;
      for (let s = 1; s < tailPts.length - 1; s++) {
        const a = tailPts[s], e = tailPts[s + 1];
        _ab.subVectors(e, a); _ap.subVectors(p, a);
        const t = THREE.MathUtils.clamp(_ap.dot(_ab) / _ab.lengthSq(), 0, 1);
        const d = _ap.addScaledVector(_ab, -t).length();
        if (d < bd) { bd = d; k = s; bt = t; }
      }
      const prev = k > 1 ? nameIndex['tail' + (k - 1)] : nameIndex.tail0;
      const cur = nameIndex['tail' + k], next = k < 7 ? nameIndex['tail' + (k + 1)] : cur;
      const toPrev = (1 - THREE.MathUtils.smoothstep(bt, 0, 0.35)) * 0.5;
      const toNext = THREE.MathUtils.smoothstep(bt, 0.65, 1) * 0.5;
      W[row + prev] += toPrev; W[row + next] += toNext; W[row + cur] += 1 - toPrev - toNext;
      continue;
    }
    for (let b = 0; b < NB; b++) {
      const name = names[b];
      const [a, e] = segs[b];
      let d = segDist(p, a, e);
      let allowed = true;
      if (name.startsWith('tail')) allowed = isTail;
      else if (isTail) allowed = name === 'hips';
      else {
        for (const [, leg] of Object.entries(LEGS)) {
          const li = leg.bones.indexOf(name);
          if (li < 0) continue;
          const horiz = Math.hypot(p.x - leg.axis[0], p.z - leg.axis[1]);
          // The upper bone may reach into the body; lower bones only the visible leg.
          allowed = li === 0 ? (p.y < 0.05 && horiz < 0.24) : (p.y < -0.18 && horiz < 0.22);
        }
        if (name === 'jaw') allowed = p.z > 0.72 && p.y < 0.305 && p.y > 0.17 && Math.abs(p.x - MIDLINE_X) < 0.14;
        if (name === 'earR' || name === 'earL') allowed = p.y > 0.47 && p.z < 0.78;
        if (name === 'head' || name === 'neck') allowed = allowed && p.z > 0.25;
      }
      if (!allowed) continue;
      W[row + b] = 1 / Math.pow(d + 0.012, 4);
    }
    // Normalise.
    let s = 0; for (let b = 0; b < NB; b++) s += W[row + b];
    if (s === 0) {
      // Nothing allowed: fall back to the nearest bone.
      let best = 0, bd = 1e9;
      for (let b = 0; b < NB; b++) { const d = segDist(p, segs[b][0], segs[b][1]); if (d < bd) { bd = d; best = b; } }
      W[row + best] = 1; s = 1;
    }
    for (let b = 0; b < NB; b++) W[row + b] /= s;
  }

  // Smooth along the surface so joints bend softly.
  const adj = Array.from({length: N}, () => []);
  for (let t = 0; t < idx.count; t += 3) {
    const a = weld[idx.getX(t)], b = weld[idx.getX(t + 1)], c = weld[idx.getX(t + 2)];
    adj[a].push(b, c); adj[b].push(a, c); adj[c].push(a, b);
  }
  const tmp = new Float32Array(NB);
  for (let it = 0; it < 4; it++) {
    for (let i = 0; i < N; i++) {
      if (weld[i] !== i || !adj[i].length) continue;
      tmp.fill(0);
      for (const j of adj[i]) for (let b = 0; b < NB; b++) tmp[b] += W[j * NB + b];
      const inv = 1 / adj[i].length;
      for (let b = 0; b < NB; b++) W[i * NB + b] = W[i * NB + b] * 0.5 + tmp[b] * inv * 0.5;
    }
  }

  const skinIndex = new Uint16Array(N * 4), skinWeight = new Float32Array(N * 4);
  const order = new Array(NB);
  for (let i = 0; i < N; i++) {
    const src = weld[i] * NB;
    for (let b = 0; b < NB; b++) order[b] = b;
    order.sort((x, y) => W[src + y] - W[src + x]);
    let s = 0;
    for (let k = 0; k < 4; k++) s += W[src + order[k]];
    for (let k = 0; k < 4; k++) {
      skinIndex[i * 4 + k] = order[k];
      skinWeight[i * 4 + k] = s > 0 ? W[src + order[k]] / s : (k === 0 ? 1 : 0);
    }
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  return {weld, names};
}
