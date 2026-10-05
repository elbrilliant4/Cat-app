// Expressive face for the supplied Meshy kitten.
//
// The GLB has no blend shapes and its face is skinned almost entirely to the
// chest bone, so the rig alone cannot make the cat emote. Instead we patch the
// kitten's material:
//   - vertex stage: rotate the head and each ear around anatomical pivots in
//     bind space (before skinning), with smooth falloff weights;
//   - fragment stage: paint procedural eyes (iris, pupil, sparkles, lids),
//     a mouth and blush on top of the baked texture, positioned in bind space
//     so they stay glued to the face through every deformation.
//
// All landmark coordinates below were measured on kitten.glb (bind space,
// metres, cat facing +z). Change them only if the model changes.
import * as THREE from 'three';

export const LANDMARKS = {
  eyeR: new THREE.Vector3(0.174, 1.163, 0.92),
  eyeL: new THREE.Vector3(-0.178, 1.163, 0.92),
  eyeRadius: new THREE.Vector2(0.084, 0.071),
  mouth: new THREE.Vector3(0, 0.948, 1.0),
  headPivot: new THREE.Vector3(0, 0.98, 0.32),
  earPivotR: new THREE.Vector3(0.33, 1.46, 0.72),
  earPivotL: new THREE.Vector3(-0.33, 1.46, 0.72),
};

const shared = /* glsl */`
uniform mat3 pkHeadRot;
uniform vec3 pkHeadPivot;
uniform mat3 pkEarRotR;
uniform mat3 pkEarRotL;
uniform vec3 pkEarPivotR;
uniform vec3 pkEarPivotL;
float pkHeadWeight(vec3 p){ return smoothstep(0.72, 1.02, p.y) * smoothstep(0.02, 0.5, p.z); }
float pkEarWeight(vec3 p){
  vec2 e = vec2(abs(p.x), p.y) - vec2(0.21, 1.545);
  return smoothstep(0.0, 0.09, dot(e, vec2(0.69, 0.72))) * smoothstep(0.38, 0.58, p.z);
}
vec3 pkDeform(vec3 p){
  float ew = pkEarWeight(p);
  bool right = p.x > 0.0;
  vec3 piv = right ? pkEarPivotR : pkEarPivotL;
  mat3 er = right ? pkEarRotR : pkEarRotL;
  p = mix(p, er * (p - piv) + piv, ew);
  float hw = pkHeadWeight(p);
  return mix(p, pkHeadRot * (p - pkHeadPivot) + pkHeadPivot, hw);
}
vec3 pkDeformNormal(vec3 p, vec3 n){
  float ew = pkEarWeight(p);
  mat3 er = p.x > 0.0 ? pkEarRotR : pkEarRotL;
  n = normalize(mix(n, er * n, ew));
  return normalize(mix(n, pkHeadRot * n, pkHeadWeight(p)));
}
`;

const fragmentLib = /* glsl */`
varying vec3 pkPos;
uniform vec3 pkEyeR;
uniform vec3 pkEyeL;
uniform vec2 pkEyeRadius;
uniform vec3 pkMouth;
uniform float pkOpen;      // 0 closed .. 1 wide
uniform float pkHappy;     // lower-lid smile squint, closed eyes become arches
uniform float pkPupil;     // 0 narrow slit .. 1 big round pupils
uniform vec2 pkLook;       // iris offset, roughly -1..1
uniform float pkMouthOpen; // 0..1
uniform float pkSmile;     // 0..1 ":3" mouth line
uniform float pkBlush;     // 0..1
uniform float pkSparkle;   // 0..1 extra highlight size
uniform float pkGlow;      // night-time eye glow
uniform vec3 pkRingR[8];
uniform vec3 pkRingL[8];
float pkRegionMask = 0.0;
float pkLidMask = 0.0;
float pkEyeMask = 0.0;

vec3 pkRing(vec3 ring[8], float a){
  float f = (a / 6.2831853 + 0.5) * 8.0 - 0.5;
  float i0 = floor(f);
  float t = f - i0;
  int a0 = int(mod(i0, 8.0)), a1 = int(mod(i0 + 1.0, 8.0));
  vec3 c0 = ring[0], c1 = ring[0];
  for (int k = 0; k < 8; k++) { if (k == a0) c0 = ring[k]; if (k == a1) c1 = ring[k]; }
  return mix(c0, c1, smoothstep(0.0, 1.0, t));
}

vec4 pkEye(vec3 p, vec3 c, float side, vec3 ring[8], out vec3 glow){
  glow = vec3(0.0);
  vec2 e = (p.xy - c.xy) / pkEyeRadius;
  e.x *= side;                       // +x is the outer corner on both eyes
  float r = length(e);
  float region = (1.0 - smoothstep(1.06, 1.26, r)) * step(c.z - 0.13, p.z);
  if (region <= 0.0) return vec4(0.0);
  float aa = max(fwidth(e.y), 0.004) * 1.4;

  float hw = sqrt(max(0.0, 1.0 - e.x * e.x));
  // Shapes the lids meet at when the eye shuts: a relaxed "‿" or a happy "∩".
  float sleepLine = -0.12 - 0.16 * hw;
  float arch = -0.22 + 0.5 * hw;
  float meet = mix(sleepLine, arch, pkHappy);
  float yu = mix(meet, hw * 1.02 + 0.02 * e.x, pkOpen);   // upper lid
  float lowerRaise = max(pkHappy * 0.72, 1.0 - pkOpen);
  float yl = mix(-hw * 0.98, meet, lowerRaise);           // lower lid
  float inside = smoothstep(yl - aa, yl + aa, e.y) * (1.0 - smoothstep(yu - aa, yu + aa, e.y));
  inside *= 1.0 - smoothstep(0.97, 1.0, abs(e.x));

  // Fur lid: the colours measured around this eye, combed outward, with a
  // soft crease shadow toward the lash line.
  float ea = atan(e.y, e.x);
  vec3 lower = (ring[0] + ring[1] + ring[2] + ring[3]) * 0.25;
  vec3 upper = (ring[4] + ring[5] + ring[6] + ring[7]) * 0.25;
  vec3 lid = mix(mix(lower, upper, smoothstep(-0.35, 0.35, e.y)), pkRing(ring, ea), smoothstep(0.25, 0.85, r));
  float strand = sin(ea * 37.0 + r * 6.0) * 0.5 + sin(ea * 61.0 - r * 11.0) * 0.5;
  lid *= 0.9 + 0.12 * strand;
  lid *= mix(0.84, 1.0, clamp(abs(e.y - yu) * 5.0, 0.0, 1.0));

  // Iris and pupil, shifted by gaze.
  vec2 g = e - vec2(pkLook.x * side, pkLook.y) * vec2(0.26, 0.2);
  float d = length(g);
  float irisR = 1.0;
  float ang = atan(g.y, g.x);
  vec3 gold = vec3(0.98, 0.64, 0.14);
  vec3 amber = vec3(0.74, 0.30, 0.04);
  vec3 iris = mix(gold, amber, smoothstep(0.1, irisR, d));
  iris *= 0.9 + 0.1 * sin(ang * 23.0 + d * 9.0) * smoothstep(0.25, 0.7, d);
  iris = mix(iris, vec3(0.28, 0.1, 0.02), smoothstep(irisR - 0.2, irisR, d));
  vec3 sclera = vec3(0.78, 0.72, 0.64);
  vec3 col = mix(iris, sclera, smoothstep(irisR - aa, irisR + aa, d));
  float pw = mix(0.13, 0.56, pkPupil), ph = mix(0.66, 0.6, pkPupil);
  float pd = length(g / vec2(pw, ph));
  col = mix(col, vec3(0.05, 0.035, 0.03), 1.0 - smoothstep(1.0 - aa * 3.0, 1.0 + aa * 3.0, pd));
  glow = iris * (1.0 - smoothstep(0.95, 1.05, pd)) * inside;
  // Shadow cast by the upper lid on the eyeball.
  col *= mix(1.0, 0.45, smoothstep(yu - 0.42, yu, e.y));
  // Sparkles: fixed to the eye (they mirror the room light), nudged by gaze.
  vec2 s = e * vec2(side, 1.0) - pkLook * vec2(0.05, 0.04);
  float big = 1.0 - smoothstep(0.17 + 0.07 * pkSparkle - aa, 0.17 + 0.07 * pkSparkle + aa, length(s - vec2(-0.24, 0.3)));
  float small = 1.0 - smoothstep(0.075 + 0.03 * pkSparkle - aa, 0.075 + 0.03 * pkSparkle + aa, length(s - vec2(0.25, -0.24)));
  float tiny = (1.0 - smoothstep(0.04 - aa, 0.04 + aa, length(s - vec2(0.02, 0.42)))) * pkSparkle;
  col = mix(col, vec3(1.0, 0.99, 0.96), max(big, max(small * 0.9, tiny)));

  // Lash lines along both lids, and the line where shut lids meet.
  float lw = mix(0.085, 0.065, pkOpen);
  float upperLine = 1.0 - smoothstep(lw, lw + aa * 2.0, abs(e.y - yu - 0.03 * pkOpen));
  float lowerLine = (1.0 - smoothstep(0.04, 0.04 + aa * 2.0, abs(e.y - yl + 0.015 * pkOpen))) * 0.8;
  float wing = (1.0 - smoothstep(0.06, 0.06 + aa * 2.0, abs(e.y - (yu + 0.03) + (e.x - 0.85) * 0.35))) * smoothstep(0.82, 0.95, e.x) * (1.0 - smoothstep(1.08, 1.15, e.x));
  float lineMask = max(max(upperLine, lowerLine), wing) * (1.0 - smoothstep(0.98, 1.08, abs(e.x)));

  vec3 outc = mix(lid, col, inside);
  outc = mix(outc, vec3(0.035, 0.02, 0.015), lineMask);
  pkRegionMask = max(pkRegionMask, region * (1.0 - smoothstep(0.92, 1.08, r)));
  pkEyeMask = max(pkEyeMask, region * inside);
  pkLidMask = max(pkLidMask, region * (1.0 - inside));
  return vec4(outc, region);
}

vec3 pkFace(vec3 p, vec3 base, out vec3 glow){
  vec3 g1, g2;
  vec4 r = pkEye(p, pkEyeR, 1.0, pkRingR, g1);
  base = mix(base, r.rgb, r.a);
  vec4 l = pkEye(p, pkEyeL, -1.0, pkRingL, g2);
  base = mix(base, l.rgb, l.a);
  glow = g1 + g2;

  if (p.z > pkMouth.z - 0.15) {
    vec2 m = p.xy - pkMouth.xy;
    float aa = max(fwidth(m.y), 0.0006) * 1.4;
    // Blush on the cheeks.
    vec2 ck = vec2(abs(p.x) - 0.255, p.y - 1.035) / vec2(0.075, 0.045);
    base = mix(base, vec3(0.97, 0.56, 0.55), pkBlush * 0.65 * (1.0 - smoothstep(0.2, 1.0, length(ck))));
    // ":3" mouth line.
    vec2 q = vec2(abs(m.x), m.y) - vec2(0.026, 0.036);
    float arc = abs(length(q) - 0.026) - 0.0038;
    float smileLine = (1.0 - smoothstep(-aa, aa, arc)) * step(q.y, 0.004) * pkSmile;
    base = mix(base, vec3(0.16, 0.07, 0.06), smileLine * 0.75);
    // Open mouth with tongue.
    float o = pkMouthOpen;
    if (o > 0.01) {
      vec2 mm = (m - vec2(0.0, -0.022 * o)) / vec2(0.04 + 0.012 * o, 0.034 * o + 0.002);
      float hole = 1.0 - smoothstep(1.0 - aa * 30.0, 1.0 + aa * 30.0, length(mm));
      vec3 inner = mix(vec3(0.35, 0.08, 0.1), vec3(0.2, 0.04, 0.05), smoothstep(-0.5, 0.8, mm.y));
      float tongue = 1.0 - smoothstep(0.55, 0.6, length((mm - vec2(0.0, -0.55)) / vec2(0.85, 0.6)));
      inner = mix(inner, vec3(0.93, 0.47, 0.5), tongue);
      float fang = step(abs(abs(mm.x) - 0.55), 0.12 - (0.9 - mm.y) * 0.2) * step(0.45, mm.y);
      inner = mix(inner, vec3(0.98, 0.96, 0.92), fang);
      base = mix(base, inner, hole);
      float rim = (1.0 - smoothstep(0.0, 0.18, abs(length(mm) - 1.0))) * smoothstep(0.0, 0.2, o);
      base = mix(base, vec3(0.3, 0.12, 0.11), rim * 0.6);
    }
  }
  return base;
}
`;

// Average the baked fur colour in eight sectors around an eye, so painted
// eyelids blend into whatever fur surrounds them.
function ringColors(mesh, center, side) {
  const out = Array.from({length: 8}, () => new THREE.Vector3());
  const counts = new Array(8).fill(0);
  const img = mesh.material.map?.image;
  const pos = mesh.geometry.attributes.position, uv = mesh.geometry.attributes.uv;
  let px;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    ctx.drawImage(img, 0, 0);
    px = ctx.getImageData(0, 0, img.width, img.height).data;
  } catch {
    return out.map(() => new THREE.Vector3(0.78, 0.68, 0.56));
  }
  const R = LANDMARKS.eyeRadius, toLinear = c => Math.pow(c / 255, 2.2);
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    if (z < center.z - 0.13) continue;
    const ex = (pos.getX(i) - center.x) / R.x * side, ey = (pos.getY(i) - center.y) / R.y;
    const r = Math.hypot(ex, ey);
    if (r < 1.18 || r > 1.6) continue;
    const a = Math.atan2(ey, ex);
    const bin = Math.min(7, Math.floor((a / (Math.PI * 2) + 0.5) * 8));
    const x = Math.min(img.width - 1, Math.floor(uv.getX(i) * img.width));
    const y = Math.min(img.height - 1, Math.floor(uv.getY(i) * img.height));
    const k = (y * img.width + x) * 4;
    out[bin].x += toLinear(px[k]); out[bin].y += toLinear(px[k + 1]); out[bin].z += toLinear(px[k + 2]);
    counts[bin]++;
  }
  return out.map((v, k) => counts[k] ? v.multiplyScalar(1 / counts[k]) : new THREE.Vector3(0.78, 0.68, 0.56));
}

export function createFace(mesh) {
  const L = LANDMARKS;
  const uniforms = {
    pkHeadRot: {value: new THREE.Matrix3()},
    pkHeadPivot: {value: L.headPivot.clone()},
    pkEarRotR: {value: new THREE.Matrix3()},
    pkEarRotL: {value: new THREE.Matrix3()},
    pkEarPivotR: {value: L.earPivotR.clone()},
    pkEarPivotL: {value: L.earPivotL.clone()},
    pkEyeR: {value: L.eyeR.clone()},
    pkEyeL: {value: L.eyeL.clone()},
    pkEyeRadius: {value: L.eyeRadius.clone()},
    pkMouth: {value: L.mouth.clone()},
    pkOpen: {value: 0.9},
    pkHappy: {value: 0},
    pkPupil: {value: 0.45},
    pkLook: {value: new THREE.Vector2()},
    pkMouthOpen: {value: 0},
    pkSmile: {value: 0.6},
    pkBlush: {value: 0},
    pkSparkle: {value: 0.5},
    pkGlow: {value: 0},
    pkRingR: {value: ringColors(mesh, L.eyeR, 1)},
    pkRingL: {value: ringColors(mesh, L.eyeL, -1)},
  };

  const patchVertex = (shader, withNormal) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${shared}\nvarying vec3 pkPos;`)
      .replace('#include <begin_vertex>', 'pkPos = position;\nvec3 transformed = pkDeform(vec3(position));');
    if (withNormal) {
      shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nobjectNormal = pkDeformNormal(position, objectNormal);');
    }
  };

  const material = mesh.material;
  material.onBeforeCompile = shader => {
    patchVertex(shader, true);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${fragmentLib}\nvec3 pkGlowOut;`)
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = pkFace(pkPos, diffuseColor.rgb, pkGlowOut);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(mix(roughnessFactor, 0.9, pkLidMask), 0.22, pkEyeMask);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, pkRegionMask));')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += pkGlowOut * pkGlow;');
  };
  material.customProgramCacheKey = () => 'pocket-kitten-face';
  material.needsUpdate = true;

  const depth = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking});
  depth.onBeforeCompile = shader => patchVertex(shader, false);
  depth.customProgramCacheKey = () => 'pocket-kitten-depth';
  mesh.customDepthMaterial = depth;

  return uniforms;
}

// Expression presets. Values are targets; the controller eases toward them.
export const EXPRESSIONS = {
  content:   {open: .88, happy: .22, pupil: .5,  smile: 1,  blush: .25, mouth: 0,   sparkle: .5, earBack: 0,   earOut: 0},
  joy:       {open: 0,   happy: 1,   pupil: .6,  smile: 1,  blush: .9,  mouth: .25, sparkle: .8, earBack: -.1, earOut: .05},
  excited:   {open: 1,   happy: 0,   pupil: 1,   smile: .8, blush: .35, mouth: .2,  sparkle: 1,  earBack: -.15, earOut: -.05},
  yum:       {open: .02, happy: .9,  pupil: .6,  smile: 1,  blush: .6,  mouth: 0,   sparkle: .6, earBack: 0,   earOut: .08},
  bliss:     {open: .12, happy: .6,  pupil: .5,  smile: 1,  blush: .7,  mouth: 0,   sparkle: .4, earBack: .08, earOut: .18},
  curious:   {open: 1,   happy: 0,   pupil: .75, smile: .3, blush: .1,  mouth: .08, sparkle: .7, earBack: -.2, earOut: -.08},
  sleepy:    {open: .42, happy: .15, pupil: .5,  smile: .4, blush: .1,  mouth: 0,   sparkle: .2, earBack: .12, earOut: .2},
  asleep:    {open: 0,   happy: 0,   pupil: .5,  smile: .5, blush: .2,  mouth: 0,   sparkle: 0,  earBack: .15, earOut: .25},
  hungry:    {open: .95, happy: 0,   pupil: .95, smile: 0,  blush: 0,   mouth: 0,   sparkle: 1,  earBack: .2,  earOut: .15},
  lonely:    {open: .75, happy: 0,   pupil: .9,  smile: 0,  blush: 0,   mouth: 0,   sparkle: .9, earBack: .3,  earOut: .25},
  grumpy:    {open: .55, happy: 0,   pupil: .3,  smile: 0,  blush: 0,   mouth: 0,   sparkle: .2, earBack: .45, earOut: .3},
  surprised: {open: 1,   happy: 0,   pupil: .85, smile: 0,  blush: 0,   mouth: .55, sparkle: 1,  earBack: -.25, earOut: -.1},
};
