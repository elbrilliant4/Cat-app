// A hand-built cartoon kitten: big head, big glossy eyes, a real body with
// legs, paws and a striped tail. Every part is its own joint, so the kitten
// can sit, stand, walk, crouch, pounce, stretch, groom, loaf, sleep curled up
// and roll onto its back — and its face can blink, squint "^^", wear heart
// eyes, meow, lick its lips and blush.
import * as THREE from 'three';

const {damp} = THREE.MathUtils;

const C = {
  fur: '#f7bd84',
  stripe: '#e48d4f',
  white: '#fff5ea',
  innerEar: '#f6a9ad',
  nose: '#f08391',
  bean: '#f49aa6',
  eye: '#2b1b16',
  line: '#4a2a22',
  mouth: '#7c2d39',
  tongue: '#f47e8e',
  blush: '#ff8fa3',
  heart: '#ff4d7a',
};

// Face presets. The app eases between them and layers blinks, meows etc. on top.
export const EXPRESSIONS = {
  content:   {open: 1,   happy: 0,  pupil: .55, smile: 1,  blush: .4,  mouth: 0,   sparkle: .5, earBack: 0,    earOut: 0,   heart: 0, tongue: 0},
  joy:       {open: 0,   happy: 1,  pupil: .6,  smile: 1,  blush: 1,   mouth: .45, sparkle: .8, earBack: -.1,  earOut: .05, heart: 0, tongue: 0},
  love:      {open: 1,   happy: 0,  pupil: .6,  smile: 1,  blush: 1,   mouth: .3,  sparkle: 1,  earBack: -.1,  earOut: 0,   heart: 1, tongue: 0},
  excited:   {open: 1,   happy: 0,  pupil: 1,   smile: .8, blush: .5,  mouth: .3,  sparkle: 1,  earBack: -.25, earOut: -.05, heart: 0, tongue: 0},
  yum:       {open: 0,   happy: 1,  pupil: .6,  smile: 1,  blush: .7,  mouth: 0,   sparkle: .6, earBack: 0,    earOut: .1,  heart: 0, tongue: 0},
  bliss:     {open: 0,   happy: .2, pupil: .5,  smile: 1,  blush: .8,  mouth: 0,   sparkle: .4, earBack: .15,  earOut: .25, heart: 0, tongue: 0},
  curious:   {open: 1,   happy: 0,  pupil: .85, smile: .4, blush: .2,  mouth: .12, sparkle: .8, earBack: -.3,  earOut: -.1, heart: 0, tongue: 0},
  sleepy:    {open: .45, happy: 0,  pupil: .5,  smile: .6, blush: .2,  mouth: 0,   sparkle: .2, earBack: .15,  earOut: .3,  heart: 0, tongue: 0},
  asleep:    {open: 0,   happy: 0,  pupil: .5,  smile: .7, blush: .3,  mouth: 0,   sparkle: 0,  earBack: .2,   earOut: .35, heart: 0, tongue: 0},
  hungry:    {open: 1,   happy: 0,  pupil: 1,   smile: 0,  blush: 0,   mouth: 0,   sparkle: 1,  earBack: .25,  earOut: .2,  heart: 0, tongue: 0},
  lonely:    {open: .85, happy: 0,  pupil: 1,   smile: 0,  blush: 0,   mouth: 0,   sparkle: 1,  earBack: .45,  earOut: .45, heart: 0, tongue: 0},
  grumpy:    {open: .55, happy: 0,  pupil: .4,  smile: 0,  blush: 0,   mouth: 0,   sparkle: .2, earBack: .6,   earOut: .4,  heart: 0, tongue: 0},
  surprised: {open: 1,   happy: 0,  pupil: .95, smile: 0,  blush: .2,  mouth: .6,  sparkle: 1,  earBack: -.35, earOut: -.1, heart: 0, tongue: 0},
  groom:     {open: 0,   happy: .3, pupil: .5,  smile: 0,  blush: .3,  mouth: .25, sparkle: .3, earBack: .05,  earOut: .1,  heart: 0, tongue: 1},
};

// Body poses: joint angles (radians) and heights. x-rotation convention:
// negative pitch lifts the front of a body part; negative leg angles swing a
// leg forward.
export const POSES = {
  stand:   {y: .56, lift: 0, pitch: 0,    roll: 0, spine: 0,    chest: 0,    neck: -.1,  shF: 0,    elF: 0,    shB: 0,     knB: 0,    tailLift: 1.3,  tailCurl: .07,  tailSide: 0, hYaw: 0, hPitch: 0, hRoll: 0},
  sit:     {y: .3,  lift: 0, pitch: -.85, roll: 0, spine: -.12, chest: -.05, neck: .82,  shF: .95,  elF: .05,  shB: -.55,  knB: 1.6,  tailLift: .55,  tailCurl: .03,  tailSide: .7, hYaw: 0, hPitch: 0, hRoll: 0},
  loaf:    {y: .27, lift: 0, pitch: 0,    roll: 0, spine: 0,    chest: 0,    neck: -.15, shF: -1.3, elF: 2.5,  shB: -1.25, knB: 2.45, tailLift: -.25, tailCurl: .02,  tailSide: .5, hYaw: 0, hPitch: 0, hRoll: 0},
  sleep:   {y: .25, lift: 0, pitch: .05,  roll: 0, spine: .05,  chest: .05,  neck: .12,  shF: -1.3, elF: 2.5,  shB: -1.25, knB: 2.45, tailLift: -.3,  tailCurl: .03,  tailSide: 1.0, hYaw: .45, hPitch: -.15, hRoll: .4},
  crouch:  {y: .36, lift: 0, pitch: .12,  roll: 0, spine: .08,  chest: .05,  neck: -.35, shF: -.7,  elF: 1.35, shB: -.95,  knB: 1.9,  tailLift: .15,  tailCurl: -.02, tailSide: 0, hYaw: 0, hPitch: 0, hRoll: 0},
  leap:    {y: .6,  lift: 0, pitch: -.2,  roll: 0, spine: -.05, chest: 0,    neck: .05,  shF: -1.25, elF: .2,  shB: .75,   knB: .2,   tailLift: .3,   tailCurl: -.05, tailSide: 0, hYaw: 0, hPitch: 0, hRoll: 0},
  stretch: {y: .6,  lift: 0, pitch: .35,  roll: 0, spine: .25,  chest: .1,   neck: -.75, shF: -1.95, elF: .05,  shB: -.3,   knB: .35,  tailLift: 1.35, tailCurl: .05,  tailSide: 0, hYaw: 0, hPitch: 0, hRoll: 0},
  belly:   {y: .4,  lift: 0, pitch: 0,    roll: 1.75, spine: .05, chest: 0,  neck: -.2,  shF: -.7,  elF: 1.5,  shB: -.6,   knB: 1.2,  tailLift: .2,   tailCurl: .1,   tailSide: .3, hYaw: .25, hPitch: 0, hRoll: -1.15},
  beg:     {y: .3,  lift: 0, pitch: -1.25, roll: 0, spine: -.15, chest: -.1, neck: 1.25, shF: .1,  elF: 1.9,  shB: -.55,  knB: 1.6,  tailLift: .9,   tailCurl: .03,  tailSide: .7, hYaw: 0, hPitch: 0, hRoll: 0},
};
const POSE_KEYS = Object.keys(POSES.stand);

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color, roughness: .78, ...extra});

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -.9);
  s.bezierCurveTo(-.25, -.62, -1, -.25, -1, .25);
  s.bezierCurveTo(-1, .75, -.4, 1, 0, .55);
  s.bezierCurveTo(.4, 1, 1, .75, 1, .25);
  s.bezierCurveTo(1, -.25, .25, -.62, 0, -.9);
  const g = new THREE.ExtrudeGeometry(s, {depth: .25, bevelEnabled: true, bevelSize: .12, bevelThickness: .12, bevelSegments: 3, curveSegments: 16});
  g.center();
  return g;
}

export class CuteCat {
  constructor() {
    this.root = new THREE.Group();
    this.meshes = [];
    this.pose = {...POSES.sit};
    this.face = {...EXPRESSIONS.content};
    this.walkPhase = 0;
    this.materials = {
      fur: mat(C.fur), stripe: mat(C.stripe), white: mat(C.white), innerEar: mat(C.innerEar), nose: mat(C.nose, {roughness: .45}),
      bean: mat(C.bean, {roughness: .6}),
      eye: new THREE.MeshPhysicalMaterial({color: C.eye, roughness: .18, clearcoat: 1, clearcoatRoughness: .08}),
      shine: new THREE.MeshBasicMaterial({color: '#ffffff'}),
      line: new THREE.MeshBasicMaterial({color: C.line}),
      mouth: mat(C.mouth, {roughness: .5}), tongue: mat(C.tongue, {roughness: .45}),
      blush: new THREE.MeshBasicMaterial({color: C.blush, transparent: true, opacity: 0, depthWrite: false}),
      heart: new THREE.MeshPhysicalMaterial({color: C.heart, roughness: .25, clearcoat: 1}),
      whisker: new THREE.MeshBasicMaterial({color: '#fffaf2'}),
    };
    this.geo = {sphere: new THREE.SphereGeometry(1, 32, 22), smallSphere: new THREE.SphereGeometry(1, 16, 12), heart: heartGeometry()};
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
    const pelvis = this.pelvis = this.joint(this.root, 0, .3, -.24);
    this.part(pelvis, sphere, M.fur, [0, .02, -.02], [.33, .32, .35]);
    this.part(pelvis, sphere, M.stripe, [0, .2, -.06], [.16, .12, .2]);
    const spine = this.spine = this.joint(pelvis, 0, .02, .18);
    this.part(spine, sphere, M.fur, [0, 0, .08], [.31, .3, .31]);
    this.part(spine, sphere, M.white, [0, -.1, .07], [.25, .2, .29]);
    for (const z of [-.02, .12]) this.part(spine, sphere, M.stripe, [0, .27, z], [.12, .05, .045]);
    const chest = this.chest = this.joint(spine, 0, .02, .25);
    this.part(chest, sphere, M.fur, [0, 0, 0], [.29, .31, .28]);
    this.part(chest, sphere, M.white, [0, -.03, .13], [.2, .23, .16]);

    // Legs.
    this.front = []; this.back = [];
    for (const s of [-1, 1]) {
      const sh = this.joint(chest, s * .15, -.1, .05);
      this.part(sh, this.capsule(.086, .16), M.fur, [0, -.12, 0]);
      const el = this.joint(sh, 0, -.25, 0);
      this.part(el, this.capsule(.074, .13), M.fur, [0, -.09, 0]);
      const paw = this.joint(el, 0, -.2, 0);
      this.part(paw, sphere, M.white, [0, -.015, .035], [.083, .058, .105]);
      this.part(paw, smallSphere, M.bean, [0, -.06, .03], [.04, .012, .04], [0, 0, 0], false);
      for (const tx of [-.04, 0, .04]) this.part(paw, smallSphere, M.bean, [tx, -.055, .095], [.017, .01, .017], [0, 0, 0], false);
      this.front.push({sh, el, paw});

      const hp = this.joint(pelvis, s * .16, -.02, .0);
      this.part(hp, sphere, M.fur, [s * .02, -.05, .03], [.15, .19, .2]);
      const kn = this.joint(hp, 0, -.2, .05);
      this.part(kn, this.capsule(.074, .14), M.fur, [0, -.1, 0]);
      const hpaw = this.joint(kn, 0, -.22, 0);
      this.part(hpaw, sphere, M.white, [0, -.012, .04], [.085, .058, .115]);
      this.back.push({hp, kn, paw: hpaw});
    }

    // Tail: a chain of joints, striped.
    this.tail = [];
    let prev = this.joint(pelvis, 0, .08, -.3);
    for (let i = 0; i < 10; i++) {
      const seg = i === 0 ? prev : this.joint(prev, 0, 0, -.085);
      const r = .068 - i * .0028;
      this.part(seg, smallSphere, i % 3 === 2 ? M.stripe : (i === 9 ? M.stripe : M.fur), [0, 0, -.045], [r, r, .075]);
      this.tail.push(seg);
      prev = seg;
    }

    // Neck and head.
    const neck = this.neck = this.joint(chest, 0, .15, .1);
    this.part(neck, sphere, M.fur, [0, .06, .02], [.21, .21, .21]);
    const head = this.head = this.joint(neck, 0, .3, .06);
    this.buildHead(head);
  }

  buildHead(head) {
    const {sphere, smallSphere} = this.geo, M = this.materials;
    const R = [.44, .38, .4];
    // Point on the skull ellipsoid and its outward normal, from yaw/elevation.
    const surf = (az, el, out = 0) => {
      const d = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      const p = new THREE.Vector3(d.x * R[0], d.y * R[1], d.z * R[2]);
      const n = new THREE.Vector3(d.x / R[0], d.y / R[1], d.z / R[2]).normalize();
      return {p: p.addScaledVector(n, out), n};
    };
    const place = (obj, az, el, out = 0) => {
      const {p, n} = surf(az, el, out);
      obj.position.copy(p);
      obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      return obj;
    };

    this.part(head, sphere, M.fur, [0, 0, 0], R);
    // Muzzle, cheeks and chin.
    this.part(head, sphere, M.white, [0, -.13, .2], [.25, .15, .2]);
    for (const s of [-1, 1]) this.part(head, sphere, M.white, [s * .072, -.145, .315], [.088, .072, .07]);
    this.part(head, sphere, M.white, [0, -.215, .285], [.06, .04, .05]);
    // Fluffy cheek tufts.
    const tuft = new THREE.ConeGeometry(.075, .15, 12);
    for (const s of [-1, 1]) for (const [y, a] of [[-.1, .45], [-.18, .8]]) {
      this.part(head, tuft, M.fur, [s * .39, y, .12], [1, 1, .7], [0, 0, -s * (Math.PI / 2 + a)]);
    }
    // Forehead stripes.
    for (const [az, rz] of [[-.17, .25], [0, 0], [.17, -.25]]) {
      const st = place(new THREE.Group(), az, .52, -.004);
      head.add(st);
      this.part(st, smallSphere, M.stripe, [0, 0, 0], [.024, .085, .014], [0, 0, rz], false);
    }
    // Nose.
    this.part(head, sphere, M.nose, [0, -.075, .395], [.042, .027, .028], [.25, 0, 0]);

    // Mouth: ":3" line, open mouth and tongue.
    const mouth = this.mouthGroup = new THREE.Group();
    mouth.position.set(0, -.135, .4);
    head.add(mouth);
    const arc = new THREE.TorusGeometry(.032, .008, 8, 20, Math.PI);
    this.smile = [-1, 1].map(s => this.part(mouth, arc, M.line, [s * .03, .01, 0], [1, 1, 1], [0, 0, Math.PI], false));
    this.part(mouth, smallSphere, M.line, [0, .032, -.004], [.006, .022, .004], [0, 0, 0], false);
    this.mouthOpen = this.part(mouth, sphere, M.mouth, [0, -.03, -.012], [.055, .001, .03], [0, 0, 0], false);
    this.tongue = this.part(mouth, sphere, M.tongue, [0, -.05, .004], [.034, .001, .02], [0, 0, 0], false);

    // Whiskers.
    const whisker = new THREE.CylinderGeometry(.0035, .002, .2, 5);
    whisker.translate(0, .1, 0);
    this.whiskers = [];
    for (const s of [-1, 1]) for (const a of [-.18, 0, .18]) {
      const w = this.part(head, whisker, M.whisker, [s * .14, -.135 + a * .05, .33], [1, 1, 1], [0, s * -.35, -s * (Math.PI / 2 - a)], false);
      w.userData = {s, a};
      this.whiskers.push(w);
    }

    // Blush.
    this.blush = [-1, 1].map(s => {
      const b = place(new THREE.Group(), s * .6, -.2, .006);
      head.add(b);
      this.part(b, new THREE.CircleGeometry(.065, 24), M.blush, [0, 0, 0], [1, .7, 1], [0, 0, 0], false);
      return b;
    });

    // Eyes.
    const arcGeo = new THREE.TorusGeometry(.068, .015, 8, 24, Math.PI);
    this.eyes = [-1, 1].map(s => {
      const g = place(new THREE.Group(), s * .37, .02, -.012);
      head.add(g);
      const iris = new THREE.Group();
      g.add(iris);
      const dome = this.part(iris, sphere, M.eye, [0, 0, 0], [.088, .105, .05], [0, 0, 0], false);
      const hi1 = this.part(iris, smallSphere, M.shine, [-.03, .04, .045], [.026, .03, .01], [0, 0, 0], false);
      const hi2 = this.part(iris, smallSphere, M.shine, [.03, -.035, .045], [.013, .013, .008], [0, 0, 0], false);
      const hi3 = this.part(iris, smallSphere, M.shine, [.04, .045, .045], [.008, .008, .006], [0, 0, 0], false);
      const happyArc = this.part(g, arcGeo, M.line, [0, -.02, .03], [1, 1, 1], [0, 0, 0], false);
      const sleepArc = this.part(g, arcGeo, M.line, [0, .03, .03], [1, .75, 1], [0, 0, Math.PI], false);
      const heart = this.part(g, this.geo.heart, M.heart, [0, 0, .03], [.0, .0, .0], [0, 0, 0], false);
      return {g, iris, dome, hi1, hi2, hi3, happyArc, sleepArc, heart, s};
    });

    // Ears.
    const earGeo = new THREE.ConeGeometry(.17, .29, 24, 1);
    earGeo.translate(0, .145, 0);
    const innerGeo = new THREE.ConeGeometry(.11, .2, 20, 1);
    innerGeo.translate(0, .1, 0);
    this.ears = [-1, 1].map(s => {
      const base = place(new THREE.Group(), s * .6, .72, -.05);
      head.add(base);
      // Re-orient: ears point up and a little outward, not along the normal.
      base.quaternion.setFromEuler(new THREE.Euler(-.12, 0, -s * .38));
      const pivot = new THREE.Group();
      base.add(pivot);
      this.part(pivot, earGeo, M.fur, [0, 0, 0], [1, 1, .55]);
      this.part(pivot, innerGeo, M.innerEar, [0, .015, .045], [1, 1, .35], [0, 0, 0], false);
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
   * ctl: {pose, poseRate, walk (0..1 speed factor), knead, wiggle, purr,
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

    const tail = ctl.tail || {amp: .25, speed: 1.6};
    this.tail.forEach((seg, i) => {
      const k = i / (this.tail.length - 1);
      const sway = Math.sin(t * tail.speed * 2 - i * .45) * tail.amp * (.3 + k);
      seg.rotation.x = i === 0 ? P.tailLift : P.tailCurl + Math.sin(t * 1.3 - i * .3) * .02;
      seg.rotation.y = (i === 0 ? 0 : P.tailSide * .16) + sway * .25;
    });

    this.updateFace(dt, t, ctl.face || this.face, ctl.look || {x: 0, y: 0});
  }

  updateFace(dt, t, f, look) {
    const open = THREE.MathUtils.clamp(f.open, 0, 1);
    const heart = f.heart > .5;
    for (const e of this.eyes) {
      const eyeOpen = heart ? 0 : open;
      const size = .85 + f.pupil * .3;
      const visible = Math.max(.04, eyeOpen);
      const shown = eyeOpen < .12 ? 0 : 1;
      e.dome.scale.set(.088 * size * shown + 1e-4, .105 * size * visible * shown + 1e-4, .05);
      e.iris.position.set(look.x * .026, look.y * .022 - (1 - visible) * .045, 0);
      const shine = eyeOpen > .3 ? Math.min(1, (eyeOpen - .3) / .4) : 0;
      const sp = .8 + f.sparkle * .5;
      e.hi1.scale.set(.026 * sp * shine, .03 * sp * shine * visible, .01);
      e.hi2.scale.set(.013 * sp * shine, .013 * sp * shine, .008);
      e.hi3.scale.setScalar(.008 * f.sparkle * shine);
      e.hi1.position.set(-.03 - look.x * .01, .04 * visible, .045);
      e.hi2.position.set(.03 - look.x * .01, -.035 * visible, .045);
      const closed = heart ? 0 : THREE.MathUtils.clamp((.28 - eyeOpen) / .2, 0, 1);
      const happy = THREE.MathUtils.clamp(f.happy, 0, 1);
      e.happyArc.scale.setScalar(closed * happy + .0001);
      e.sleepArc.scale.set(closed * (1 - happy) + .0001, .75 * closed * (1 - happy) + .0001, 1);
      const hs = damp(e.heart.scale.x, heart ? .085 : 0, 12, dt);
      e.heart.scale.set(hs, hs, hs * .6);
      e.heart.rotation.z = Math.sin(t * 4) * .1;
      e.heart.position.y = Math.sin(t * 6) * .006;
    }
    const m = THREE.MathUtils.clamp(f.mouth, 0, 1), tg = THREE.MathUtils.clamp(f.tongue || 0, 0, 1);
    this.mouthOpen.scale.set(.05 + m * .01, .002 + m * .045, .03);
    this.mouthOpen.position.y = -.025 - m * .025;
    this.tongue.scale.set(.032, .002 + Math.max(m * .02, tg * .028), .022);
    this.tongue.position.set(0, -.04 - m * .04 - tg * .012, .01 + tg * .02);
    const smile = THREE.MathUtils.clamp(f.smile, 0, 1) * (1 - Math.min(1, m * 2.5));
    for (const s of this.smile) s.scale.set(.6 + smile * .4, .3 + smile * .7, 1);
    this.materials.blush.opacity = THREE.MathUtils.clamp(f.blush, 0, 1) * .55;
    for (const w of this.whiskers) w.rotation.z = -w.userData.s * (Math.PI / 2 - w.userData.a) + Math.sin(t * 3 + w.userData.a * 9) * .03 + m * w.userData.s * .1;

    for (const ear of this.ears) {
      ear.vel += (-170 * ear.twitch - 10 * ear.vel) * dt;
      ear.twitch += ear.vel * dt;
      ear.pivot.rotation.set(-(f.earBack + ear.twitch * .5), 0, -ear.s * (f.earOut + ear.twitch * .2));
    }
  }
}
