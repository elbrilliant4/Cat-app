// Mochi: the realistic ragdoll model (assets/mochi-ragdoll.glb), rigged at
// load time with a cat skeleton (cat-rig.js), given a soft coat of
// shell-textured fur that takes its colour from the model's own texture, and
// realistic eyes with eyelids, dilating pupils and gaze painted in the skin
// shader. Same interface as the earlier cartoon cat, so app.js drives it with
// the same behaviours: walking, sitting, loafing, sleeping, stretching,
// grooming, eating, kneading, pouncing and rolling over.
import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {buildSkeleton, computeWeights, BONES, FACE, GROUND_Y, MIDLINE_X} from './cat-rig.js';

const {damp, clamp} = THREE.MathUtils;
const MODEL_SCALE = 0.86;

// Face presets: real-cat expressions. open = upper lids, happy = lower lids
// push up (a contented squint), pupil = 0 narrow slit .. 1 round and wide.
export const EXPRESSIONS = {
  content:   {open: .95, happy: .1,  pupil: .7,  smile: 0, mouth: 0,   sparkle: .5, earBack: 0,    earOut: 0,    tongue: 0},
  joy:       {open: .35, happy: .7,  pupil: .55, smile: 0, mouth: .12, sparkle: .6, earBack: -.05, earOut: .05,  tongue: 0},
  love:      {open: .25, happy: .6,  pupil: .8,  smile: 0, mouth: 0,   sparkle: .8, earBack: .05,  earOut: .1,   tongue: 0},
  excited:   {open: 1,   happy: 0,   pupil: 1,   smile: 0, mouth: .1,  sparkle: 1,  earBack: -.3,  earOut: -.05, tongue: 0},
  yum:       {open: .3,  happy: .6,  pupil: .5,  smile: 0, mouth: 0,   sparkle: .5, earBack: 0,    earOut: .1,   tongue: 0},
  bliss:     {open: .12, happy: .5,  pupil: .5,  smile: 0, mouth: 0,   sparkle: .4, earBack: .15,  earOut: .3,   tongue: 0},
  curious:   {open: 1,   happy: 0,   pupil: .8,  smile: 0, mouth: 0,   sparkle: .8, earBack: -.35, earOut: -.1,  tongue: 0},
  sleepy:    {open: .4,  happy: .2,  pupil: .5,  smile: 0, mouth: 0,   sparkle: .2, earBack: .15,  earOut: .3,   tongue: 0},
  asleep:    {open: 0,   happy: 0,   pupil: .5,  smile: 0, mouth: 0,   sparkle: 0,  earBack: .2,   earOut: .4,   tongue: 0},
  hungry:    {open: 1,   happy: 0,   pupil: .95, smile: 0, mouth: 0,   sparkle: 1,  earBack: .1,   earOut: .15,  tongue: 0},
  lonely:    {open: .8,  happy: 0,   pupil: .9,  smile: 0, mouth: 0,   sparkle: .9, earBack: .35,  earOut: .45,  tongue: 0},
  grumpy:    {open: .5,  happy: 0,   pupil: .2,  smile: 0, mouth: 0,   sparkle: .2, earBack: .55,  earOut: .55,  tongue: 0},
  surprised: {open: 1,   happy: 0,   pupil: 1,   smile: 0, mouth: .35, sparkle: 1,  earBack: -.4,  earOut: -.1,  tongue: 0},
  groom:     {open: .15, happy: .4,  pupil: .5,  smile: 0, mouth: .35, sparkle: .3, earBack: .05,  earOut: .1,   tongue: 1},
};

// Joint angles (radians) on top of the straightened rest pose. x-rotation:
// negative pitch lifts the front; negative leg angles swing a leg forward.
// The body is set on the ground automatically from its lowest contact point.
export const POSES = {
  stand:   {pitch: 0,     roll: 0,   spine: 0,    chest: 0,    neck: 0,    shF: 0,    elF: 0,    wrF: 0,    shB: 0,    knB: 0,    hkB: 0,    tailLift: -.55, tailCurl: .22, tailSide: 0,   hYaw: 0,   hPitch: 0,   hRoll: 0},
  sit:     {pitch: -.58,  roll: 0,   spine: -.08, chest: -.04, neck: .32,  shF: .7,   elF: .05,  wrF: .05,  shB: -.95, knB: 2.15, hkB: -1.25, tailLift: -1.2, tailCurl: .05, tailSide: .9, hYaw: 0,   hPitch: 0,   hRoll: 0},
  loaf:    {pitch: .04,   roll: 0,   spine: 0,    chest: .04,  neck: -.05, shF: .95,  elF: -2.25, wrF: 1.2, shB: -.85, knB: 2.3,  hkB: -1.5, tailLift: -1.1, tailCurl: .02, tailSide: .8,  hYaw: 0,   hPitch: 0,   hRoll: 0},
  sleep:   {pitch: .06,   roll: 0,   spine: .08,  chest: .08,  neck: .25,  shF: .95,  elF: -2.25, wrF: 1.2, shB: -.85, knB: 2.3,  hkB: -1.5, tailLift: -1.2, tailCurl: .02, tailSide: 1.3, hYaw: .55, hPitch: -.35, hRoll: .35},
  crouch:  {pitch: .1,    roll: 0,   spine: .05,  chest: .05,  neck: -.2,  shF: -.45, elF: 1.0,  wrF: -.55, shB: -.55, knB: 1.25, hkB: -.75, tailLift: -.75, tailCurl: .05, tailSide: 0,   hYaw: 0,   hPitch: 0,   hRoll: 0},
  leap:    {pitch: -.18,  roll: 0,   spine: -.05, chest: 0,    neck: .1,   shF: -1.05, elF: .3,  wrF: -.2,  shB: .75,  knB: .1,   hkB: .2,   tailLift: -.2,  tailCurl: -.05, tailSide: 0,  hYaw: 0,   hPitch: 0,   hRoll: 0},
  stretch: {pitch: .3,    roll: 0,   spine: .12,  chest: .12,  neck: -.55, shF: -1.35, elF: .15, wrF: .1,   shB: -.15, knB: .25,  hkB: -.1,  tailLift: .35,  tailCurl: .15, tailSide: 0,   hYaw: 0,   hPitch: 0,   hRoll: 0},
  belly:   {pitch: 0,     roll: 1.55, spine: .05, chest: 0,    neck: -.15, shF: -.55, elF: 1.3,  wrF: -.4,  shB: -.5,  knB: 1.1,  hkB: -.5,  tailLift: -.5,  tailCurl: .1,  tailSide: .4,  hYaw: .2,  hPitch: .1,  hRoll: -1.0},
  beg:     {pitch: -1.05, roll: 0,   spine: -.15, chest: -.1,  neck: .75,  shF: .2,   elF: 1.5,  wrF: .6,   shB: -.95, knB: 2.15, hkB: -1.25, tailLift: -1.2, tailCurl: .05, tailSide: .9, hYaw: 0,   hPitch: 0,   hRoll: 0},
};
const POSE_KEYS = Object.keys(POSES.stand);

const skinVertexHead = /* glsl */`
attribute float furLen;
varying vec3 vBind;
varying float vFurLen;
`;

const eyeFragment = /* glsl */`
varying vec3 vBind;
uniform vec3 eyeR;
uniform vec3 eyeL;
uniform vec2 eyeRadius;
uniform vec3 mouthPos;
uniform float eyeOpen;
uniform float eyeHappy;
uniform float eyePupil;
uniform vec2 eyeLook;
uniform float eyeSparkle;
uniform float mouthOpen;
uniform float tongueOut;
uniform vec3 lidRing[8];
float eyeMask = 0.0;

vec3 lidColorAt(float a) {
  float f = (a / 6.2831853 + 0.5) * 8.0 - 0.5;
  float i0 = floor(f);
  int a0 = int(mod(i0, 8.0)), a1 = int(mod(i0 + 1.0, 8.0));
  vec3 c0 = lidRing[0], c1 = lidRing[0];
  for (int k = 0; k < 8; k++) { if (k == a0) c0 = lidRing[k]; if (k == a1) c1 = lidRing[k]; }
  return mix(c0, c1, smoothstep(0.0, 1.0, f - i0));
}

vec4 drawEye(vec3 p, vec3 c, float side) {
  vec2 e = (p.xy - c.xy) / eyeRadius;
  e.x *= side;
  float r = length(e);
  if (r > 1.35 || p.z < c.z - 0.06) return vec4(0.0);
  float aa = max(fwidth(e.y), 0.01) * 1.3;
  float hw = sqrt(max(0.0, 1.0 - e.x * e.x));
  // Lids meet in a relaxed line when shut; the lower lid rises when content.
  float meet = -0.12 - 0.08 * hw;
  float yu = mix(meet, hw * 1.02 + 0.03 * e.x, eyeOpen);
  float yl = mix(-hw * 1.0, meet, max(eyeHappy * 0.75, 1.0 - eyeOpen));
  float inside = smoothstep(yl - aa, yl + aa, e.y) * (1.0 - smoothstep(yu - aa, yu + aa, e.y));
  inside *= 1.0 - smoothstep(0.96, 1.02, abs(e.x));
  // Iris: pale ragdoll blue with fine radial fibres and a darker limbal ring.
  vec2 g = e - vec2(eyeLook.x * side, eyeLook.y) * vec2(0.22, 0.16);
  float d = length(g);
  float ang = atan(g.y, g.x);
  vec3 iris = mix(vec3(0.78, 0.86, 0.92), vec3(0.42, 0.56, 0.7), smoothstep(0.15, 0.85, d));
  iris *= 0.86 + 0.14 * (0.5 + 0.5 * sin(ang * 41.0 + d * 13.0)) * smoothstep(0.2, 0.7, d);
  iris = mix(iris, vec3(0.62, 0.72, 0.62), (1.0 - smoothstep(0.0, 0.32, d)) * 0.35);
  iris = mix(iris, vec3(0.16, 0.22, 0.28), smoothstep(0.78, 0.98, d));
  vec3 col = iris;
  // Pupil: a vertical slit that opens to a round, dark pool.
  float pw = mix(0.16, 0.6, eyePupil), ph = mix(0.74, 0.64, eyePupil);
  float pd = length(g / vec2(pw, ph));
  col = mix(col, vec3(0.02, 0.018, 0.02), 1.0 - smoothstep(0.9, 1.08, pd));
  // Wet look: shadow under the upper lid and a soft catchlight.
  col *= mix(1.0, 0.5, smoothstep(yu - 0.45, yu, e.y));
  vec2 s = e * vec2(side, 1.0);
  float glint = 1.0 - smoothstep(0.1 + 0.05 * eyeSparkle, 0.16 + 0.05 * eyeSparkle, length(s - vec2(-0.3, 0.32)));
  col = mix(col, vec3(0.97), glint * 0.9);
  // Lids: the dark seal-point fur around the eye, with a thin black rim.
  vec3 lid = lidColorAt(atan(e.y, e.x)) * (0.9 + 0.1 * sin(atan(e.y, e.x) * 37.0 + r * 9.0));
  float rim = max(1.0 - smoothstep(0.05, 0.05 + aa * 2.0, abs(e.y - yu - 0.025)),
                  (1.0 - smoothstep(0.04, 0.04 + aa * 2.0, abs(e.y - yl + 0.02))) * 0.9);
  rim *= 1.0 - smoothstep(0.92, 1.05, abs(e.x));
  vec3 outc = mix(lid, col, inside);
  outc = mix(outc, vec3(0.04, 0.03, 0.03), rim);
  float region = 1.0 - smoothstep(1.05, 1.3, r);
  eyeMask = max(eyeMask, region * inside);
  return vec4(outc, region);
}

vec3 paintFace(vec3 base) {
  vec4 a = drawEye(vBind, eyeR, -1.0);
  base = mix(base, a.rgb, a.a);
  vec4 b = drawEye(vBind, eyeL, 1.0);
  base = mix(base, b.rgb, b.a);
  // Mouth: when the jaw drops, the stretched skin below the lip line shows
  // the inside of the mouth and the tongue.
  float m = max(mouthOpen, tongueOut * 0.4);
  if (m > 0.01 && vBind.z > mouthPos.z - 0.06) {
    vec2 q = vec2((vBind.x - mouthPos.x) / (0.034 + 0.01 * m), (vBind.y - (mouthPos.y - 0.014)) / (0.004 + 0.016 * m));
    float hole = (1.0 - smoothstep(0.8, 1.0, length(q))) * smoothstep(0.0, 0.15, m);
    vec3 inner = mix(vec3(0.3, 0.07, 0.09), vec3(0.16, 0.03, 0.05), smoothstep(-0.6, 0.8, q.y));
    inner = mix(inner, vec3(0.92, 0.5, 0.55), (1.0 - smoothstep(0.45, 0.62, length((q - vec2(0.0, -0.45)) / vec2(0.85, 0.55)))) * clamp(tongueOut + m * 0.6, 0.0, 1.0));
    base = mix(base, inner, hole);
  }
  return base;
}
`;

const furVertex = /* glsl */`
uniform float furShells;
uniform float furScale;
varying float vLayer;
`;
const furFragment = /* glsl */`
uniform float furDensity;
varying float vLayer;
varying float vFurLen;
float furHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

export class RealCat {
  constructor() {
    this.root = new THREE.Group();
    this.model = new THREE.Group();
    this.root.add(this.model);
    this.meshes = [];
    this.pose = {...POSES.stand};
    this.walkPhase = 0;
    this.ears = [{s: -1, twitch: 0, vel: 0}, {s: 1, twitch: 0, vel: 0}];
    this.faceUniforms = {
      eyeR: {value: FACE.eyeR.clone()}, eyeL: {value: FACE.eyeL.clone()}, eyeRadius: {value: FACE.eyeRadius.clone()},
      mouthPos: {value: FACE.mouth.clone()},
      eyeOpen: {value: .9}, eyeHappy: {value: 0}, eyePupil: {value: .4}, eyeLook: {value: new THREE.Vector2()},
      eyeSparkle: {value: .5}, mouthOpen: {value: 0}, tongueOut: {value: 0},
      lidRing: {value: Array.from({length: 8}, () => new THREE.Color(0.25, 0.16, 0.12))},
    };
    this.ready = false;
  }

  load(url, onProgress) {
    return new Promise((resolve, reject) => new GLTFLoader().load(url, gltf => { this.build(gltf); resolve(this); }, onProgress, reject));
  }

  build(gltf) {
    let src;
    gltf.scene.traverse(o => { if (o.isMesh && !src) src = o; });
    const geometry = src.geometry;
    const material = src.material;
    material.metalness = 0;
    material.roughness = 1;
    material.metalnessMap = null;
    material.needsUpdate = true;

    // Texture brightness per vertex (tells the dark tail from the haunch, and
    // gives the eyelids the colour of the fur around each eye).
    const img = material.map.image;
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, img.width, img.height).data;
    const uv = geometry.attributes.uv, pos = geometry.attributes.position;
    const texel = i => {
      const x = Math.min(img.width - 1, Math.floor(uv.getX(i) * img.width));
      const y = Math.min(img.height - 1, Math.floor(uv.getY(i) * img.height));
      return (y * img.width + x) * 4;
    };
    const bright = i => { const k = texel(i); return Math.max(px[k], px[k + 1], px[k + 2]) / 255; };
    const {weld} = computeWeights(geometry, bright);
    this.sampleLidRing(pos, texel, px);
    this.furLengths(geometry, weld);

    const {root, bones, list} = buildSkeleton();
    this.bones = bones;
    const skinned = new THREE.SkinnedMesh(geometry, material);
    skinned.castShadow = true;
    skinned.receiveShadow = true;
    skinned.frustumCulled = false;
    skinned.add(root);
    this.model.add(skinned);
    // Line the model up: body axis along +z, standing on y = 0, scaled for the room.
    this.model.scale.setScalar(MODEL_SCALE);
    const yaw = Math.atan2(BONES.chest[1].x - BONES.hips[1].x, BONES.chest[1].z - BONES.hips[1].z);
    this.model.rotation.y = -yaw;
    const centre = new THREE.Vector3(MIDLINE_X + .06, GROUND_Y, -0.1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, -yaw).multiplyScalar(MODEL_SCALE);
    this.model.position.set(-centre.x, -centre.y, -centre.z);
    this.model.updateMatrixWorld(true);
    const skeleton = new THREE.Skeleton(list);
    skinned.bind(skeleton, skinned.matrixWorld);
    this.skinned = skinned;
    this.patchSkin(material);
    this.addFur(skinned, material);

    // Rest-pose fixes: tuck the stepped-out left hind leg under the body.
    this.rest = {};
    const aim = (name, childPos, target) => {
      const from = childPos.clone().sub(BONES[name][1]).normalize();
      this.rest[name] = new THREE.Quaternion().setFromUnitVectors(from, target.clone().normalize());
    };
    aim('hipL', BONES.hockL[2], new THREE.Vector3(0.02, -1, 0.05));
    aim('hipR', BONES.hockR[2], new THREE.Vector3(-0.02, -1, 0.05));
    aim('shoulderR', BONES.wristR[2], new THREE.Vector3(-0.01, -1, 0.12));
    aim('shoulderL', BONES.wristL[2], new THREE.Vector3(0.01, -1, 0.12));
    // The sculpted head looks slightly upward; level it.
    this.rest.head = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0, 0));
    this.tailRest = [];
    for (let i = 0; i < 8; i++) {
      const a = BONES['tail' + i][1], b = i < 7 ? BONES['tail' + (i + 1)][1] : BONES.tail7[2];
      this.tailRest.push(b.clone().sub(a).normalize());
    }

    // Contact points used to set the cat on the floor, in bone space.
    const pt = (bone, x, y, z) => {
      const o = new THREE.Object3D();
      o.position.set(x, y, z);
      bones[bone].add(o);
      return o;
    };
    const endOf = (b) => BONES[b][2].clone().sub(BONES[b][1]);
    this.contacts = [
      pt('wristR', ...endOf('wristR').setY(-0.09)), pt('wristL', ...endOf('wristL').setY(-0.09)),
      pt('wristR', 0, -0.06, 0), pt('wristL', 0, -0.06, 0),
      pt('hockR', ...endOf('hockR').setY(-0.13)), pt('hockL', ...endOf('hockL').setY(-0.13)),
      pt('hockR', 0, -0.06, 0), pt('hockL', 0, -0.06, 0),
      pt('hips', 0, -0.3, -0.1), pt('hips', 0, -0.2, -0.28), pt('hips', 0.25, -0.15, -0.05), pt('hips', -0.25, -0.15, -0.05),
      pt('spine', 0, -0.3, 0), pt('spine', 0.3, -0.05, 0), pt('spine', -0.3, -0.05, 0), pt('spine', 0, 0.3, 0),
      pt('chest', 0, -0.3, 0.05), pt('chest', 0.28, -0.1, 0), pt('chest', -0.28, -0.1, 0),
      pt('head', 0, -0.12, 0.2), pt('head', 0.2, 0, 0.05), pt('head', -0.2, 0, 0.05),
    ];

    // Cheap invisible colliders for petting (raycasting a skinned mesh is slow).
    const hidden = new THREE.MeshBasicMaterial({visible: false});
    const collider = (bone, r, x, y, z, sx = 1, sy = 1, sz = 1) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), hidden);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      bones[bone].add(m);
      this.meshes.push(m);
    };
    collider('head', .26, 0, .04, .12);
    collider('chest', .32, 0, -.02, .05);
    collider('spine', .32, 0, 0, 0, 1, 1, 1.2);
    collider('hips', .3, 0, 0, -.05);

    this.neck = bones.neck;
    this.head = bones.head;
    this.ready = true;
  }

  sampleLidRing(pos, texel, px) {
    const sums = Array.from({length: 8}, () => [0, 0, 0, 0]);
    const toLin = c => Math.pow(c / 255, 2.2);
    for (const c of [FACE.eyeR, FACE.eyeL]) {
      const side = c.x < MIDLINE_X ? -1 : 1;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getZ(i) < c.z - 0.06) continue;
        const ex = (pos.getX(i) - c.x) / FACE.eyeRadius.x * side, ey = (pos.getY(i) - c.y) / FACE.eyeRadius.y;
        const r = Math.hypot(ex, ey);
        if (r < 1.25 || r > 1.8) continue;
        const bin = Math.min(7, Math.floor((Math.atan2(ey, ex) / (Math.PI * 2) + .5) * 8));
        const k = texel(i);
        sums[bin][0] += toLin(px[k]); sums[bin][1] += toLin(px[k + 1]); sums[bin][2] += toLin(px[k + 2]); sums[bin][3]++;
      }
    }
    sums.forEach((s, i) => { if (s[3]) this.faceUniforms.lidRing.value[i].setRGB(s[0] / s[3], s[1] / s[3], s[2] / s[3]); });
  }

  // How long the fur grows at each vertex (model units).
  furLengths(geometry, weld) {
    const pos = geometry.attributes.position, N = pos.count;
    const len = new Float32Array(N);
    // Tiny disconnected pieces (whiskers) get no fur.
    const idx = geometry.index, parent = new Int32Array(N).map((_, i) => i);
    const find = i => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
    for (let t = 0; t < idx.count; t += 3) {
      const a = find(weld[idx.getX(t)]), b = find(weld[idx.getX(t + 1)]), c = find(weld[idx.getX(t + 2)]);
      parent[b] = a; parent[find(c)] = a;
    }
    const size = new Map();
    for (let i = 0; i < N; i++) { const r = find(weld[i]); size.set(r, (size.get(r) || 0) + 1); }
    const eyes = [FACE.eyeR, FACE.eyeL];
    const p = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      p.fromBufferAttribute(pos, i);
      if (size.get(find(weld[i])) < 2000) { len[i] = 0; continue; }
      let l = 0.024;
      const face = p.z > 0.62 && p.y > 0.12;
      if (face) l = p.z > 0.76 ? 0.007 : 0.014;
      if (p.y > 0.47 && p.z < 0.78 && p.z > 0.55) l = 0.008; // ears
      if (p.z > 0.25 && p.z < 0.7 && p.y < 0.2 && p.y > -0.32 && Math.abs(p.x - MIDLINE_X) < 0.3) l = 0.04; // ruff
      if (p.y < -0.3 && p.z > 0.2) l = 0.012; // front legs
      if (p.y < -0.5) l = 0.008; // paws
      if (p.x > 0.0 && p.z < -0.4 && p.y < 0.1) l = 0.034; // tail (fluffy)
      for (const e of eyes) {
        const d = Math.hypot((p.x - e.x) / FACE.eyeRadius.x, (p.y - e.y) / FACE.eyeRadius.y);
        if (p.z > e.z - 0.06 && d < 1.8) l *= clamp((d - 1.3) / 0.5, 0, 1);
      }
      // Whiskers and ear furnishings stay crisp, without a fur coat.
      if (p.z > 0.84 && Math.abs(p.x - MIDLINE_X) > 0.09 && p.y > 0.12 && p.y < 0.4) l = 0;
      const dn = Math.hypot(p.x - FACE.nose.x, p.y - FACE.nose.y);
      if (p.z > 0.82 && dn < 0.06) l = 0;
      const dm = Math.hypot((p.x - FACE.mouth.x) / 0.05, (p.y - FACE.mouth.y) / 0.025);
      if (p.z > 0.8 && dm < 1) l = 0;
      len[i] = l;
    }
    geometry.setAttribute('furLen', new THREE.BufferAttribute(len, 1));
  }

  patchSkin(material) {
    const u = this.faceUniforms;
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, u);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + skinVertexHead)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;\nvFurLen = furLen;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + eyeFragment)
        .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = paintFace(diffuseColor.rgb);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.2, eyeMask);');
    };
    material.customProgramCacheKey = () => 'mochi-skin';
    material.needsUpdate = true;
  }

  addFur(skinned, baseMaterial) {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const shells = coarse ? 7 : 11;
    const g = new THREE.InstancedBufferGeometry();
    for (const [name, attr] of Object.entries(skinned.geometry.attributes)) g.setAttribute(name, attr);
    g.setIndex(skinned.geometry.index);
    g.instanceCount = shells;
    const u = {furShells: {value: shells}, furDensity: {value: 380}};
    const m = new THREE.MeshStandardMaterial({map: baseMaterial.map, roughness: 1, metalness: 0});
    m.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, u);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + skinVertexHead + furVertex)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;\nvFurLen = furLen;\nvLayer = (float(gl_InstanceID) + 1.0) / furShells;')
        .replace('#include <skinning_vertex>', `#include <skinning_vertex>
          vec3 furN = normalize(objectNormal);
          transformed += furN * vLayer * furLen + vec3(0.0, -1.0, -0.4) * vLayer * vLayer * furLen * 0.6;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + furFragment + '\nvarying vec3 vBind;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          if (vFurLen < 0.002) discard;
          vec2 furG = vMapUv * vec2(furDensity);
          vec2 furCell = floor(furG);
          float furSeed = furHash(furCell);
          vec2 furF = fract(furG) - 0.5 - (vec2(furHash(furCell + 7.1), furHash(furCell + 3.3)) - 0.5) * 0.5;
          float furH = mix(0.4, 1.0, furSeed);
          if (vLayer > furH) discard;
          if (length(furF) > 0.6 * (1.0 - vLayer / furH) + 0.08) discard;
          diffuseColor.rgb *= mix(0.72, 1.08, vLayer) * (0.93 + 0.14 * furHash(furCell + 1.7));`);
    };
    m.customProgramCacheKey = () => 'mochi-fur';
    const fur = new THREE.SkinnedMesh(g, m);
    fur.frustumCulled = false;
    fur.castShadow = false;
    fur.receiveShadow = true;
    fur.raycast = () => {};
    fur.bind(skinned.skeleton, skinned.bindMatrix);
    skinned.parent.add(fur);
    this.fur = fur;
  }

  headTop(target = new THREE.Vector3()) { return this.head.localToWorld(target.set(0, .34, .05)); }
  headCenter(target = new THREE.Vector3()) { return this.head.localToWorld(target.set(0, .06, .12)); }
  twitchEar(i, strength = 1) { this.ears[i].vel += (Math.random() < .5 ? -10 : 8) * strength; }

  /**
   * ctl: {pose, poseRate, walk, knead, wiggle, purr, groom, lift,
   *       head: {yaw, pitch, roll}, look: {x, y}, face, tail: {amp, speed}}
   */
  update(dt, t, ctl) {
    if (!this.ready) return;
    const B = this.bones, P = this.pose, target = POSES[ctl.pose] || POSES.stand, rate = ctl.poseRate ?? 6;
    for (const k of POSE_KEYS) P[k] = damp(P[k], target[k], rate, dt);
    const sleeping = ctl.pose === 'sleep';
    const breathe = Math.sin(t * (sleeping ? 1.4 : 2.4)) * (sleeping ? .03 : .015);

    for (const b of Object.values(B)) b.quaternion.identity();
    for (const [name, q] of Object.entries(this.rest)) B[name].quaternion.copy(q);
    const rot = (name, x = 0, y = 0, z = 0) => B[name].quaternion.multiply(_q.setFromEuler(_e.set(x, y, z)));

    // Walk cycle: diagonal pairs move together.
    const walk = ctl.walk || 0;
    if (walk > .01) this.walkPhase += dt * (5 + walk * 6);
    const ph = this.walkPhase, stride = Math.min(1, walk) * .5;
    const swing = side => Math.sin(ph + side) * stride;
    const lift = side => Math.max(0, Math.cos(ph + side)) * Math.min(1, walk);

    rot('hips', P.pitch + Math.sin(ph * 2) * .02 * walk, (ctl.wiggle || 0) * Math.sin(t * 20) * .16, P.roll);
    rot('spine', P.spine + breathe * .3, -(ctl.wiggle || 0) * Math.sin(t * 20) * .08);
    rot('chest', P.chest - breathe * .3);
    rot('neck', P.neck);
    const h = ctl.head || {yaw: 0, pitch: 0, roll: 0};
    B.head.quaternion.multiply(_q.setFromEuler(_e.set(-(h.pitch + P.hPitch), h.yaw + P.hYaw, h.roll + P.hRoll, 'YXZ')));
    _e.order = 'XYZ';

    // Front legs, with kneading ("making biscuits"): paws press down in turn.
    const knead = ctl.knead ? 1 : 0;
    [['R', 0], ['L', Math.PI]].forEach(([s, side]) => {
      const press = knead * Math.max(0, Math.sin(t * 5.5 + side));
      let sh = P.shF + swing(side) - press * .35;
      let el = P.elF + lift(side) * .9 + press * .7;
      let wr = P.wrF - lift(side) * .4 - press * .45;
      if (ctl.groom && s === 'L') { sh = -.9 + Math.sin(t * 5) * .1; el = 2.0; wr = -.6; }
      rot('shoulder' + s, sh);
      rot('elbow' + s, el);
      rot('wrist' + s, wr);
    });
    [['R', Math.PI], ['L', 0]].forEach(([s, side]) => {
      rot('hip' + s, P.shB + swing(side) * .9);
      rot('knee' + s, P.knB + lift(side) * .6);
      rot('hock' + s, P.hkB - lift(side) * .3);
    });

    this.poseTail(t, ctl.tail || {amp: .25, speed: 1.4});
    this.updateFace(dt, t, ctl.face || EXPRESSIONS.content, ctl.look || {x: 0, y: 0});

    // Breathing swell and purr shiver.
    const purr = ctl.purr ? Math.sin(t * 55) * .004 : 0;
    B.spine.scale.set(1 + breathe * .5 + purr, 1 + breathe + purr, 1);

    // Stand on the floor: lowest contact point touches y = 0.
    this.model.position.y = 0;
    this.root.updateMatrixWorld(true);
    let low = Infinity;
    for (const c of this.contacts) low = Math.min(low, c.getWorldPosition(_v).y);
    const want = this.model.position.y - (low - this.root.getWorldPosition(_v2).y) + (ctl.lift || 0);
    this.ground = this.ground === undefined ? want : damp(this.ground, want, 14, dt);
    this.model.position.y = this.ground;
  }

  // Tail: each segment is aimed along a smooth curve behind the cat.
  poseTail(t, tail) {
    const P = this.pose, B = this.bones;
    let parentQ = _pq.identity();
    let pitch = P.tailLift, yaw = 0;
    for (let i = 0; i < 8; i++) {
      const k = i / 7;
      const sway = Math.sin(t * tail.speed * 2 - i * .55) * tail.amp * (.25 + k) * .35;
      yaw += (i === 0 ? 0 : P.tailSide * .14) + sway;
      if (i > 0) pitch += P.tailCurl * (.4 + k);
      // Direction in the hips' frame: straight back is -z, rotated by pitch/yaw.
      _v.set(0, 0, -1).applyAxisAngle(_x, pitch).applyAxisAngle(_y, -yaw);
      // Carry the parent's rotation along, then bend by the smallest arc, so
      // the tail keeps a consistent twist from root to tip.
      _v2.copy(this.tailRest[i]).applyQuaternion(parentQ);
      const world = _q.setFromUnitVectors(_v2, _v).multiply(parentQ);
      const local = _q2.copy(parentQ).invert().multiply(world);
      B['tail' + i].quaternion.copy(local);
      parentQ = _pq.copy(world);
    }
  }

  updateFace(dt, t, f, look) {
    const u = this.faceUniforms;
    u.eyeOpen.value = clamp(f.open, 0, 1);
    u.eyeHappy.value = clamp(f.happy, 0, 1);
    u.eyePupil.value = clamp(f.pupil, 0, 1);
    u.eyeLook.value.set(look.x, look.y);
    u.eyeSparkle.value = f.sparkle;
    const m = clamp(f.mouth, 0, 1), tg = clamp(f.tongue || 0, 0, 1);
    u.mouthOpen.value = m;
    u.tongueOut.value = tg;
    const B = this.bones;
    B.jaw.quaternion.multiply(_q.setFromEuler(_e.set(m * .42 + tg * .12, 0, 0)));
    for (const [i, ear] of this.ears.entries()) {
      ear.vel += (-170 * ear.twitch - 10 * ear.vel) * dt;
      ear.twitch += ear.vel * dt;
      const name = i === 0 ? 'earR' : 'earL';
      B[name].quaternion.multiply(_q.setFromEuler(_e.set(-(f.earBack + ear.twitch * .5), 0, -ear.s * (f.earOut + ear.twitch * .2))));
    }
  }
}

const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _pq = new THREE.Quaternion();
const _e = new THREE.Euler(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const _x = new THREE.Vector3(1, 0, 0), _y = new THREE.Vector3(0, 1, 0);
