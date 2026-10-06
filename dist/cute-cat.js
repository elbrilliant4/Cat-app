// The kitten: a fluffy seal-point cat (white coat, chocolate points, blue
// eyes), built from simple shapes so every part can move. Shell-textured fur
// gives it a soft, realistic coat; the face has blue eyes with dilating
// pupils and real eyelids, a pink nose with nostrils, a mouth that can meow,
// lick and yawn, whiskers and springy ears. The body can sit, stand, walk,
// crouch, pounce, stretch, groom, loaf, sleep curled up and roll onto its back.
import * as THREE from 'three';
import {Fur} from './fur.js';

const {damp, clamp} = THREE.MathUtils;

// Seal-point colouring: white coat, chocolate points, pink skin, blue eyes.
const C = {
  white: '#f6f2ec',
  point: '#4f3426',
  taupe: '#8f6f5a',
  innerEar: '#b98c82',
  nose: '#e9a3a6',
  bean: '#eaa4ad',
  line: '#2a1a14',
  mouth: '#5e2a2f',
  tongue: '#ec8d96',
  lid: '#46301f',
};

// Face presets. The app eases between them and layers blinks, meows etc. on top.
// open: upper lids (1 = wide), happy: lower lids push up into a smile-squint,
// pupil: 0 slit .. 1 round and dilated.
export const EXPRESSIONS = {
  content:   {open: .92, happy: .15, pupil: .55, smile: 1,  mouth: 0,   sparkle: .5, earBack: 0,    earOut: 0,    tongue: 0},
  joy:       {open: 0,   happy: 1,   pupil: .7,  smile: 1,  mouth: .35, sparkle: .8, earBack: -.1,  earOut: .05,  tongue: 0},
  love:      {open: .4,  happy: .8,  pupil: 1,   smile: 1,  mouth: 0,   sparkle: 1,  earBack: .05,  earOut: .12,  tongue: 0},
  excited:   {open: 1,   happy: 0,   pupil: 1,   smile: .7, mouth: .25, sparkle: 1,  earBack: -.3,  earOut: -.05, tongue: 0},
  yum:       {open: 0,   happy: .9,  pupil: .6,  smile: 1,  mouth: 0,   sparkle: .6, earBack: 0,    earOut: .1,   tongue: 0},
  bliss:     {open: 0,   happy: .5,  pupil: .6,  smile: 1,  mouth: 0,   sparkle: .4, earBack: .15,  earOut: .28,  tongue: 0},
  curious:   {open: 1,   happy: 0,   pupil: .85, smile: .4, mouth: .1,  sparkle: .8, earBack: -.3,  earOut: -.1,  tongue: 0},
  sleepy:    {open: .4,  happy: .1,  pupil: .5,  smile: .6, mouth: 0,   sparkle: .2, earBack: .15,  earOut: .3,   tongue: 0},
  asleep:    {open: 0,   happy: 0,   pupil: .5,  smile: .7, mouth: 0,   sparkle: 0,  earBack: .2,   earOut: .35,  tongue: 0},
  hungry:    {open: 1,   happy: 0,   pupil: 1,   smile: 0,  mouth: 0,   sparkle: 1,  earBack: .25,  earOut: .2,   tongue: 0},
  lonely:    {open: .8,  happy: 0,   pupil: 1,   smile: 0,  mouth: 0,   sparkle: 1,  earBack: .45,  earOut: .45,  tongue: 0},
  grumpy:    {open: .5,  happy: 0,   pupil: .25, smile: 0,  mouth: 0,   sparkle: .2, earBack: .6,   earOut: .4,   tongue: 0},
  surprised: {open: 1,   happy: 0,   pupil: .95, smile: 0,  mouth: .6,  sparkle: 1,  earBack: -.35, earOut: -.1,  tongue: 0},
  groom:     {open: 0,   happy: .4,  pupil: .5,  smile: 0,  mouth: .2,  sparkle: .3, earBack: .05,  earOut: .1,   tongue: 1},
};

// Body poses: joint angles (radians) and heights. x-rotation convention:
// negative pitch lifts the front of a body part; negative leg angles swing a
// leg forward.
export const POSES = {
  stand:   {y: .56, pitch: 0,     roll: 0,    spine: 0,    chest: 0,    neck: -.1,  shF: 0,     elF: 0,    shB: 0,     knB: 0,    tailLift: 1.3,  tailCurl: .07,  tailSide: 0,   hYaw: 0,   hPitch: 0,    hRoll: 0},
  sit:     {y: .3,  pitch: -.85,  roll: 0,    spine: -.12, chest: -.05, neck: .82,  shF: .95,   elF: .05,  shB: -.55,  knB: 1.6,  tailLift: .55,  tailCurl: .03,  tailSide: .7,  hYaw: 0,   hPitch: 0,    hRoll: 0},
  loaf:    {y: .27, pitch: 0,     roll: 0,    spine: 0,    chest: 0,    neck: -.15, shF: -1.3,  elF: 2.5,  shB: -1.25, knB: 2.45, tailLift: -.25, tailCurl: .02,  tailSide: .5,  hYaw: 0,   hPitch: 0,    hRoll: 0},
  sleep:   {y: .25, pitch: .05,   roll: 0,    spine: .05,  chest: .05,  neck: .12,  shF: -1.3,  elF: 2.5,  shB: -1.25, knB: 2.45, tailLift: -.3,  tailCurl: .03,  tailSide: 1.0, hYaw: .45, hPitch: -.15, hRoll: .4},
  crouch:  {y: .36, pitch: .12,   roll: 0,    spine: .08,  chest: .05,  neck: -.35, shF: -.7,   elF: 1.35, shB: -.95,  knB: 1.9,  tailLift: .15,  tailCurl: -.02, tailSide: 0,   hYaw: 0,   hPitch: 0,    hRoll: 0},
  leap:    {y: .6,  pitch: -.2,   roll: 0,    spine: -.05, chest: 0,    neck: .05,  shF: -1.25, elF: .2,   shB: .75,   knB: .2,   tailLift: .3,   tailCurl: -.05, tailSide: 0,   hYaw: 0,   hPitch: 0,    hRoll: 0},
  stretch: {y: .6,  pitch: .35,   roll: 0,    spine: .25,  chest: .1,   neck: -.75, shF: -1.95, elF: .05,  shB: -.3,   knB: .35,  tailLift: 1.35, tailCurl: .05,  tailSide: 0,   hYaw: 0,   hPitch: 0,    hRoll: 0},
  belly:   {y: .4,  pitch: 0,     roll: 1.75, spine: .05,  chest: 0,    neck: -.2,  shF: -.7,   elF: 1.5,  shB: -.6,   knB: 1.2,  tailLift: .2,   tailCurl: .1,   tailSide: .3,  hYaw: .25, hPitch: 0,    hRoll: -1.15},
  beg:     {y: .3,  pitch: -1.25, roll: 0,    spine: -.15, chest: -.1,  neck: 1.25, shF: .1,    elF: 1.9,  shB: -.55,  knB: 1.6,  tailLift: .9,   tailCurl: .03,  tailSide: .7,  hYaw: 0,   hPitch: 0,    hRoll: 0},
};
const POSE_KEYS = Object.keys(POSES.stand);

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .8, ...extra});

// Realistic copper eye: iris striations, limbal ring and a pupil that can
// narrow to a slit or open wide, shifted for gaze.
function eyeMaterial(uniforms) {
  const m = new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: .12, clearcoat: 1, clearcoatRoughness: .04});
  m.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vEyeP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEyeP = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vEyeP;
        uniform vec2 eyeLook;
        uniform vec2 eyePupil;
        uniform float eyeOpen;
        uniform float eyeHappy;
        uniform vec3 lidColor;
        float eyeInside = 1.0;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 q = vEyeP - eyeLook * vec2(0.3, 0.26);
        float r = length(q);
        float ang = atan(q.y, q.x);
        vec3 iris = mix(vec3(0.78, 0.9, 0.98), vec3(0.42, 0.62, 0.8), smoothstep(0.1, 0.85, r));
        iris *= 0.82 + 0.18 * (0.5 + 0.5 * sin(ang * 37.0 + r * 15.0)) * smoothstep(0.15, 0.6, r);
        iris = mix(iris, vec3(0.92, 0.97, 1.0), (1.0 - smoothstep(0.0, 0.4, length(q - vec2(-0.1, -0.35)))) * 0.3);
        iris = mix(iris, vec3(0.16, 0.22, 0.3), smoothstep(0.76, 0.93, r));
        vec3 col = mix(iris, vec3(0.08, 0.06, 0.05), smoothstep(0.93, 1.0, r));
        float pd = length(q / eyePupil);
        col = mix(col, vec3(0.015, 0.01, 0.01), 1.0 - smoothstep(0.92, 1.06, pd));
        // Eyelids, drawn on the eyeball so they follow its curve. They meet in a
        // relaxed line when shut, or an upward smile-curve when happy.
        vec2 e = vEyeP;
        float aa = max(fwidth(e.y), 0.01) * 1.5;
        float hw = sqrt(max(0.0, 1.0 - e.x * e.x));
        float meet = mix(-0.08 - 0.12 * hw, -0.3 + 0.5 * hw, eyeHappy);
        float yu = mix(meet, hw * 1.04, eyeOpen);
        float yl = mix(-hw * 1.04, meet, max(eyeHappy * 0.8, 1.0 - eyeOpen));
        eyeInside = smoothstep(yl - aa, yl + aa, e.y) * (1.0 - smoothstep(yu - aa, yu + aa, e.y));
        col *= mix(1.0, 0.55, smoothstep(yu - 0.4, yu, e.y));
        vec3 lid = lidColor * (0.86 + 0.14 * smoothstep(-1.0, 1.0, e.y)) * (0.93 + 0.07 * sin(atan(e.y, e.x) * 41.0 + length(e) * 9.0));
        lid *= mix(1.0, 0.85, smoothstep(0.75, 1.0, length(e)));
        col = mix(lid, col, eyeInside);
        float lash = max(1.0 - smoothstep(0.04, 0.04 + aa * 2.0, abs(e.y - yu - 0.02)), (1.0 - smoothstep(0.03, 0.03 + aa * 2.0, abs(e.y - yl + 0.01))) * 0.8);
        col = mix(col, vec3(0.07, 0.04, 0.03), lash * (1.0 - smoothstep(0.85, 0.98, abs(e.x))));
        // A soft dark eyeliner rim where the eye meets the fur, only around the opening.
        col = mix(col, vec3(0.12, 0.07, 0.05), smoothstep(0.86, 0.98, length(e)) * eyeInside);
        diffuseColor.rgb = col;`)
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
        material.roughness = mix(0.9, material.roughness, eyeInside);
        #ifdef USE_CLEARCOAT
          material.clearcoat *= eyeInside;
        #endif`);
  };
  m.customProgramCacheKey = () => 'pocket-kitten-eye';
  return m;
}

export class CuteCat {
  constructor() {
    this.root = new THREE.Group();
    this.meshes = [];
    this.pose = {...POSES.sit};
    this.walkPhase = 0;
    this.fur = new Fur();
    this.eyeUniforms = {eyeLook: {value: new THREE.Vector2()}, eyePupil: {value: new THREE.Vector2(.4, .7)}, eyeOpen: {value: 1}, eyeHappy: {value: 0}, lidColor: {value: new THREE.Color(C.lid)}};
    this.materials = {
      white: mat(C.white), point: mat(C.point), innerEar: mat(C.innerEar, {roughness: .7}),
      nose: mat(C.nose, {roughness: .4}), bean: mat(C.bean, {roughness: .6}), lid: mat(C.lid, {roughness: .9}),
      eye: eyeMaterial(this.eyeUniforms),
      shine: new THREE.MeshBasicMaterial({color: '#ffffff'}),
      line: new THREE.MeshBasicMaterial({color: C.line}),
      lip: mat('#5a3b35', {roughness: .6}),
      rim: mat('#3a2418', {roughness: .5}),
      mouth: mat(C.mouth, {roughness: .5}), tongue: mat(C.tongue, {roughness: .45}),
      fang: mat('#fffdf7', {roughness: .3}),
      whisker: new THREE.MeshBasicMaterial({color: '#fffaf2'}),
    };
    this.geo = {sphere: new THREE.SphereGeometry(1, 30, 20), smallSphere: new THREE.SphereGeometry(1, 16, 12)};
    this.build();
  }

  part(parent, geo, material, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], shadow = true) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(...p); m.scale.set(...s); m.rotation.set(...r);
    m.castShadow = shadow; m.receiveShadow = true;
    parent.add(m);
    this.meshes.push(m);
    return m;
  }
  furry(parent, geo, p, s, opts, r = [0, 0, 0]) {
    const m = this.part(parent, geo, this.materials.white, p, s, r);
    this.fur.add(m, opts);
    return m;
  }
  joint(parent, x, y, z) {
    const j = new THREE.Group();
    j.position.set(x, y, z);
    parent.add(j);
    return j;
  }
  capsule(radius, length) {
    const key = `cap${radius}_${length}`;
    return this.geo[key] ??= new THREE.CapsuleGeometry(radius, length, 6, 14);
  }

  build() {
    const {sphere, smallSphere} = this.geo, M = this.materials;
    const BACK = new THREE.Vector3(0, -.4, -1), DOWN = new THREE.Vector3(0, -1, .15);
    const body = {color: C.white, accent: C.taupe, mix: .45, grad: .55, length: .075, density: 55, comb: BACK};
    const white = {color: C.white, accent: C.taupe, length: .08, density: 55, comb: DOWN};
    const pelvis = this.pelvis = this.joint(this.root, 0, .3, -.24);
    this.furry(pelvis, sphere, [0, .02, -.02], [.32, .31, .34], {...body, mix: .55});
    const spine = this.spine = this.joint(pelvis, 0, .02, .18);
    this.furry(spine, sphere, [0, 0, .08], [.3, .29, .3], body);
    this.furry(spine, sphere, [0, -.1, .07], [.24, .19, .28], {...white, length: .07, mix: -.2});
    const chest = this.chest = this.joint(spine, 0, .02, .25);
    this.furry(chest, sphere, [0, 0, 0], [.28, .3, .27], {...body, mix: .3, grad: .6});
    // The Persian ruff: a big soft white bib.
    this.furry(chest, sphere, [0, -.02, .12], [.21, .25, .17], {...white, length: .1, mix: -.25});

    // Legs.
    this.front = []; this.back = [];
    const LEGDOWN = new THREE.Vector3(0, -1, 0);
    const upperLeg = {color: C.white, accent: C.taupe, mix: .55, grad: .4, length: .05, density: 55, shells: 10, comb: LEGDOWN};
    const lowerLeg = {color: C.white, accent: C.taupe, mix: .05, grad: .7, length: .045, density: 55, shells: 10, comb: LEGDOWN};
    const paw = {color: C.white, accent: C.taupe, mix: -.3, length: .025, density: 70, shells: 8, comb: new THREE.Vector3(0, -.3, 1)};
    for (const s of [-1, 1]) {
      const sh = this.joint(chest, s * .15, -.1, .05);
      this.furry(sh, this.capsule(.082, .16), [0, -.12, 0], [1, 1, 1], upperLeg);
      const el = this.joint(sh, 0, -.25, 0);
      this.furry(el, this.capsule(.07, .13), [0, -.09, 0], [1, 1, 1], lowerLeg);
      const p = this.joint(el, 0, -.2, 0);
      this.furry(p, sphere, [0, -.015, .035], [.08, .056, .1], paw);
      this.part(p, smallSphere, M.bean, [0, -.058, .03], [.036, .01, .036], [0, 0, 0], false);
      for (const tx of [-.035, 0, .035]) this.part(p, smallSphere, M.bean, [tx, -.052, .09], [.015, .009, .015], [0, 0, 0], false);
      this.front.push({sh, el, paw: p});

      const hp = this.joint(pelvis, s * .16, -.02, 0);
      this.furry(hp, sphere, [s * .02, -.05, .03], [.14, .18, .19], {...body, mix: .65, length: .07});
      const kn = this.joint(hp, 0, -.2, .05);
      this.furry(kn, this.capsule(.07, .14), [0, -.1, 0], [1, 1, 1], {...lowerLeg, mix: .25});
      const hpaw = this.joint(kn, 0, -.22, 0);
      this.furry(hpaw, sphere, [0, -.012, .04], [.082, .056, .11], paw);
      this.back.push({hp, kn, paw: hpaw});
    }

    // A long, plumed tail in the dark point colour.
    this.tail = [];
    let prev = this.joint(pelvis, 0, .08, -.3);
    for (let i = 0; i < 10; i++) {
      const seg = i === 0 ? prev : this.joint(prev, 0, 0, -.085);
      const r = .06 - i * .0022;
      this.furry(seg, smallSphere, [0, 0, -.045], [r, r, .07], {color: C.white, accent: C.point, mix: .55 + i * .03, grad: .2, length: .09 + i * .003, density: 30, shells: 12, comb: new THREE.Vector3(0, 0, -1)});
      this.tail.push(seg);
      prev = seg;
    }

    // Neck and head.
    const neck = this.neck = this.joint(chest, 0, .15, .1);
    this.furry(neck, sphere, [0, .06, .02], [.2, .2, .2], {...white, mix: .1, grad: .6, length: .09});
    const head = this.head = this.joint(neck, 0, .3, .06);
    this.buildHead(head);
  }

  buildHead(head) {
    const {sphere, smallSphere} = this.geo, M = this.materials;
    const R = [.43, .37, .39];
    const dir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    // Point on the skull ellipsoid and its outward normal, from yaw/elevation.
    const surf = (az, el, out = 0) => {
      const d = dir(az, el);
      const n = new THREE.Vector3(d.x / R[0], d.y / R[1], d.z / R[2]).normalize();
      return {p: new THREE.Vector3(d.x * R[0], d.y * R[1], d.z * R[2]).addScaledVector(n, out), n};
    };
    const place = (obj, az, el, out = 0) => {
      const {p, n} = surf(az, el, out);
      obj.position.copy(p);
      obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      head.add(obj);
      return obj;
    };
    const EYE_AZ = .37, EYE_EL = .03;
    // Fur is kept off the eyes, nose and mouth; the face itself has short fur.
    const holes = [[dir(-EYE_AZ, EYE_EL), Math.cos(.185)], [dir(EYE_AZ, EYE_EL), Math.cos(.185)], [dir(0, -.2), Math.cos(.14)]];
    this.furry(head, sphere, [0, 0, 0], R, {color: C.white, accent: C.point, pattern: 1, length: .05, density: 65, holes, shells: 14, comb: new THREE.Vector3(0, -.15, -1)});
    // Kept so the fur can close in over shut eyes.
    this.headFur = this.fur.parts[this.fur.parts.length - 1].uniforms;

    // Muzzle puffs and chin, in short white fur.
    const muzzle = {color: C.white, accent: C.taupe, length: .02, density: 85, shells: 7, comb: new THREE.Vector3(0, -.6, -.4)};
    this.furry(head, sphere, [0, -.13, .2], [.24, .14, .19], {...muzzle, holes: [[new THREE.Vector3(0, .2, 1).normalize(), Math.cos(.5)]]});
    for (const s of [-1, 1]) this.furry(head, sphere, [s * .07, -.14, .31], [.085, .07, .068], muzzle);
    this.furry(head, sphere, [0, -.21, .28], [.06, .04, .05], {...muzzle, mix: .45});
    // Fluffy cheek ruff, Persian style.
    for (const s of [-1, 1]) this.furry(head, sphere, [s * .27, -.16, .09], [.14, .13, .13], {color: C.white, accent: C.taupe, mix: .05, grad: .5, length: .075, density: 50, shells: 10, comb: new THREE.Vector3(0, -1, -.3)});

    // Nose leather with nostrils.
    this.part(head, sphere, M.nose, [0, -.07, .392], [.044, .028, .026], [.3, 0, 0]);
    for (const s of [-1, 1]) this.part(head, smallSphere, M.mouth, [s * .016, -.078, .414], [.008, .005, .004], [0, 0, s * .4], false);

    // Mouth: the ω line, an open mouth with tongue and two tiny fangs.
    const mouth = this.mouthGroup = new THREE.Group();
    mouth.position.set(0, -.132, .395);
    head.add(mouth);
    const arc = new THREE.TorusGeometry(.028, .0035, 6, 20, Math.PI);
    this.smile = [-1, 1].map(s => this.part(mouth, arc, M.lip, [s * .029, .008, .004], [1, 1, 1], [0, 0, Math.PI], false));
    this.part(mouth, smallSphere, M.lip, [0, .032, 0], [.003, .022, .003], [0, 0, 0], false);
    this.mouthOpen = this.part(mouth, sphere, M.mouth, [0, -.03, -.01], [.05, .001, .03], [0, 0, 0], false);
    this.tongue = this.part(mouth, sphere, M.tongue, [0, -.05, .004], [.032, .001, .02], [0, 0, 0], false);
    const fangGeo = new THREE.ConeGeometry(.007, .022, 8);
    fangGeo.rotateX(Math.PI);
    this.fangs = [-1, 1].map(s => this.part(mouth, fangGeo, M.fang, [s * .026, -.012, .012], [1, 0, 1], [0, 0, 0], false));

    // Whiskers, plus a couple above each eye.
    const whisker = new THREE.CylinderGeometry(.0024, .0012, .32, 4);
    whisker.translate(0, .16, 0);
    this.whiskers = [];
    for (const s of [-1, 1]) for (const a of [-.2, -.07, .06, .19]) {
      const w = this.part(head, whisker, M.whisker, [s * .12, -.13 + a * .06, .34], [1, 1, 1], [0, s * -.4, -s * (Math.PI / 2 - a)], false);
      w.userData = {s, a};
      this.whiskers.push(w);
    }
    for (const s of [-1, 1]) this.part(head, whisker, M.whisker, [s * .16, .14, .33], [.6, .55, .6], [-.4, 0, -s * .5], false);

    // Eyes: glossy copper eyeballs; the lids are painted by the eye shader.
    const EX = .072, EY = .078;
    this.eyes = [-1, 1].map(s => {
      const g = place(new THREE.Group(), s * EYE_AZ, EYE_EL, -.004);
      const ball = this.part(g, sphere, M.eye, [0, 0, 0], [EX, EY, .042], [0, 0, 0], false);
      const shine = new THREE.Group();
      g.add(shine);
      const hi1 = this.part(shine, smallSphere, M.shine, [-.022, .028, .042], [.011, .013, .005], [0, 0, 0], false);
      const hi2 = this.part(shine, smallSphere, M.shine, [.025, -.026, .041], [.005, .005, .003], [0, 0, 0], false);
      return {g, ball, shine, hi1, hi2, s, EX};
    });

    // Ears: furred outside, pink inside with pale ear tufts.
    const earGeo = new THREE.ConeGeometry(.16, .27, 24, 1);
    earGeo.translate(0, .135, 0);
    const innerGeo = new THREE.ConeGeometry(.1, .19, 20, 1);
    innerGeo.translate(0, .095, 0);
    const tuftGeo = new THREE.ConeGeometry(.012, .12, 5);
    tuftGeo.translate(0, .06, 0);
    this.ears = [-1, 1].map(s => {
      const base = place(new THREE.Group(), s * .6, .72, -.05);
      base.quaternion.setFromEuler(new THREE.Euler(-.12, 0, -s * .4));
      const pivot = new THREE.Group();
      base.add(pivot);
      const outer = this.part(pivot, earGeo, M.point, [0, 0, 0], [1, 1, .55]);
      this.fur.add(outer, {color: C.point, accent: C.point, length: .016, density: 70, shells: 7, comb: new THREE.Vector3(0, 1, 0), holes: [[new THREE.Vector3(0, 0, 1), Math.cos(.9)]]});
      this.part(pivot, innerGeo, M.innerEar, [0, .012, .045], [1, 1, .35], [0, 0, 0], false);
      for (const [x, rz] of [[-.03, .25], [0, 0], [.03, -.25]]) this.part(pivot, tuftGeo, M.white, [x, .02, .06], [1, 1, 1], [.25, 0, rz], false);
      return {base, pivot, s, twitch: 0, vel: 0};
    });
  }

  // World-space point just above the head, for speech bubbles and particles.
  headTop(target = new THREE.Vector3()) {
    return this.head.localToWorld(target.set(0, .55, 0));
  }
  headCenter(target = new THREE.Vector3()) {
    return this.head.localToWorld(target.set(0, 0, 0));
  }

  twitchEar(i, strength = 1) {
    this.ears[i].vel += (Math.random() < .5 ? -10 : 8) * strength;
  }

  /**
   * ctl: {pose, poseRate, walk (speed factor), knead, wiggle, purr, groom,
   *       head: {yaw, pitch, roll}, look: {x, y}, face, tail: {amp, speed}, lift}
   */
  update(dt, t, ctl) {
    const P = this.pose, target = POSES[ctl.pose] || POSES.sit, rate = ctl.poseRate ?? 6;
    for (const k of POSE_KEYS) P[k] = damp(P[k], target[k], rate, dt);

    // Breathing and purring.
    const breathe = Math.sin(t * (ctl.pose === 'sleep' ? 1.4 : 2.4)) * (ctl.pose === 'sleep' ? .018 : .01);
    const purr = ctl.purr ? Math.sin(t * 60) * .003 : 0;

    // Walk cycle: diagonal pairs alternate.
    const walk = ctl.walk || 0;
    this.walkPhase += dt * (5 + walk * 7) * (walk > .01 ? 1 : 0);
    const ph = this.walkPhase, stride = Math.min(1, walk) * .55;
    const legSwing = side => Math.sin(ph + side);
    const legLift = side => Math.max(0, Math.cos(ph + side));

    this.pelvis.position.y = P.y + breathe * .3 + Math.abs(Math.sin(ph)) * .03 * Math.min(1, walk) + (ctl.lift || 0);
    this.pelvis.rotation.set(P.pitch + Math.sin(ph * 2) * .02 * walk, (ctl.wiggle || 0) * Math.sin(t * 22) * .18, P.roll);
    this.spine.rotation.x = P.spine;
    this.spine.scale.set(1 + breathe, 1 + breathe + purr, 1);
    this.chest.rotation.x = P.chest;
    this.neck.rotation.x = P.neck;

    const h = ctl.head || {yaw: 0, pitch: 0, roll: 0};
    this.head.rotation.set(-(h.pitch + P.hPitch), h.yaw + P.hYaw, h.roll + P.hRoll, 'YXZ');

    const knead = ctl.knead ? 1 : 0;
    this.front.forEach((leg, i) => {
      const side = i === 0 ? 0 : Math.PI;
      const kneadLift = knead * Math.max(0, Math.sin(t * 6 + side)) * .45;
      let sh = P.shF + legSwing(side) * stride - kneadLift * .6;
      let el = P.elF + legLift(side) * .7 * Math.min(1, walk) + kneadLift;
      if (ctl.groom && i === 1) { sh = -.2 + Math.sin(t * 5) * .08; el = 2.2; }
      leg.sh.rotation.x = sh;
      leg.el.rotation.x = el;
      leg.paw.rotation.x = -(P.pitch + P.spine + P.chest + sh + el) * .8;
    });
    this.back.forEach((leg, i) => {
      const side = i === 0 ? Math.PI : 0;
      leg.hp.rotation.x = P.shB + legSwing(side) * stride * .9;
      leg.kn.rotation.x = P.knB + legLift(side) * .5 * Math.min(1, walk);
      leg.paw.rotation.x = -(P.pitch + P.shB + P.knB) * .9;
    });

    const tail = ctl.tail || {amp: .25, speed: 1.4};
    this.tail.forEach((seg, i) => {
      const k = i / (this.tail.length - 1);
      const sway = Math.sin(t * tail.speed * 2 - i * .45) * tail.amp * (.3 + k);
      seg.rotation.x = i === 0 ? P.tailLift : P.tailCurl + Math.sin(t * 1.3 - i * .3) * .02;
      seg.rotation.y = (i === 0 ? 0 : P.tailSide * .16) + sway * .25;
    });

    this.updateFace(dt, t, ctl.face || EXPRESSIONS.content, ctl.look || {x: 0, y: 0});
  }

  updateFace(dt, t, f, look) {
    const open = clamp(f.open, 0, 1), happy = clamp(f.happy, 0, 1);
    this.eyeUniforms.eyeOpen.value = open;
    const bare = Math.cos(.095 + .09 * open);
    this.headFur.furHoles.value[0].w = bare;
    this.headFur.furHoles.value[1].w = bare;
    this.eyeUniforms.eyeHappy.value = happy;
    for (const e of this.eyes) {
      e.ball.scale.z = .012 + .03 * open;
      e.shine.visible = open > .3 && happy < .7;
      e.shine.position.set(-look.x * .008, 0, 0);
      const sp = .8 + f.sparkle * .4;
      e.hi1.scale.set(.011 * sp, .013 * sp, .005);
    }
    this.eyeUniforms.eyeLook.value.set(look.x, look.y);
    const p = clamp(f.pupil, 0, 1);
    this.eyeUniforms.eyePupil.value.set(.16 + p * .5, .66 + p * .1);

    const m = clamp(f.mouth, 0, 1), tg = clamp(f.tongue || 0, 0, 1);
    this.mouthOpen.scale.set(.046 + m * .012, .002 + m * .042, .03);
    this.mouthOpen.position.y = -.025 - m * .024;
    this.tongue.scale.set(.03, .002 + Math.max(m * .02, tg * .026), .02);
    this.tongue.position.set(0, -.04 - m * .036 - tg * .01, .008 + tg * .02);
    for (const fang of this.fangs) fang.scale.set(1, clamp((m - .3) * 3, 0, 1), 1);
    const smile = clamp(f.smile, 0, 1) * (1 - Math.min(1, m * 2.5));
    for (const s of this.smile) s.scale.set(.75 + smile * .25, .4 + smile * .6, 1);
    for (const w of this.whiskers) w.rotation.z = -w.userData.s * (Math.PI / 2 - w.userData.a) + Math.sin(t * 3 + w.userData.a * 9) * .03 + m * w.userData.s * .12;

    for (const ear of this.ears) {
      ear.vel += (-170 * ear.twitch - 10 * ear.vel) * dt;
      ear.twitch += ear.vel * dt;
      ear.pivot.rotation.set(-(f.earBack + ear.twitch * .5), 0, -ear.s * (f.earOut + ear.twitch * .2));
    }
  }
}
