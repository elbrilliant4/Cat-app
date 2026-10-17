// Motion trial page: the new movement (repaired rig + authored motion,
// motion.js) beside the current one (the live rig, driven the way the app
// drives it), through the same sequence: she notices something, walks
// several steps, stops, sits, lies down and rests.
//
// Paw marks: for the new movement, each paw's planted target (a filled
// ring while the paw is down on it, faint rings for the footprints still to
// come); for the current one, where its paw-planting holds each paw.
//
// window.trial = {ready, duration, T, show(which), view(name), marks(on),
//                 fur(on), frame(t) (renders time t), slide()}
import * as THREE from 'three';
import {RealCat, EXPRESSIONS, POSES} from './real-cat.js';
import {MotionRig, trialSequence, LEGS} from './motion.js';
import {GLTFExporter} from './vendor/GLTFExporter.js';

const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#ece7e0');
scene.add(new THREE.HemisphereLight(0xfff4e8, 0x9a8a7a, 1.3));
const key = new THREE.DirectionalLight(0xfff0dc, 2.0);
key.position.set(3, 6, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, {left: -3, right: 3, top: 3, bottom: -3, near: .5, far: 20});
key.shadow.normalBias = .02;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight(0xffe8d0, .7);
fill.position.set(-3, 2, 4);
scene.add(fill);
// A pale oak floor with board lines, so travel and paw contact read clearly.
const floorTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#d9cbb8'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#d4c5b1' : '#dccfbd'; g.fillRect(i * 64, 0, 64, 512);
    g.fillStyle = 'rgba(120,95,70,.25)'; g.fillRect(i * 64, 0, 1.5, 512);
  }
  for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(110,85,60,${Math.random() * .05})`; g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 20 + Math.random() * 60); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
})();
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({map: floorTex, roughness: .8}));
floor.rotation.x = -Math.PI / 2; floor.position.z = 2;
floor.receiveShadow = true;
scene.add(floor);
const camera = new THREE.PerspectiveCamera(28, innerWidth / innerHeight, .05, 60);

const label = document.getElementById('label');
label.textContent = 'Loading the cats…';
// The new cat (trial rig) and the current one (live rig).
const fresh = new RealCat({rig: 2});
const live = new RealCat();
await Promise.all([fresh.load('./assets/mochi-ragdoll.glb'), live.load('./assets/mochi-ragdoll.glb')]);
scene.add(fresh.root, live.root);
for (const c of [fresh, live]) c.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
const rig = new MotionRig(fresh);
rig.enableSoftFloor(0);
const seq = trialSequence(rig);
const {T} = seq;
const phaseName = t => t < T.walk ? 'notices something' : t < T.stop ? 'walks' : t < T.sit ? 'stops' : t < T.lie ? 'sits' : t < T.lie + 2.6 ? 'lies down' : 'rests, breathing';

// --- Paw marks --------------------------------------------------------------
const COLORS = {LF: '#2f7de1', RF: '#e1442f', LH: '#2fb37a', RH: '#e1a12f'};
const marks = new THREE.Group();
scene.add(marks);
const ring = (color, filled) => {
  const m = new THREE.Mesh(filled ? new THREE.CircleGeometry(.035, 24) : new THREE.RingGeometry(.026, .036, 24),
    new THREE.MeshBasicMaterial({color, transparent: true, opacity: filled ? .85 : .35, depthWrite: false}));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 2;
  return m;
};
// Future footprints (faint), and one live disc per paw.
const live4 = {};
for (const k of Object.keys(LEGS)) {
  for (const s of seq.plan[k]) { const r = ring(COLORS[k], false); r.position.set(s.to.x, .003, s.to.z); r.userData.fresh = true; marks.add(r); }
  live4[k] = ring(COLORS[k], true); marks.add(live4[k]);
}
const liveMarks = live.legs.map(l => { const r = ring('#555', true); r.material.opacity = .6; marks.add(r); return r; });
const legKey = ['RF', 'LF', 'RH', 'LH']; // order of RealCat.legs
liveMarks.forEach((r, i) => r.material.color.set(COLORS[legKey[i]]));

// --- The current cat, driven as the app drives it -----------------------------
// Same timeline and the same travel: the app's walk cycle while moving, then
// its 'sit' and 'loaf' poses.
const liveState = {t: 0};
function resetLive() {
  liveState.t = 0;
  Object.assign(live.pose, POSES.stand);
  live.walkPhase = 0; live.ground = undefined; live.lean = 0;
  live.legs.forEach(l => { l.plant = null; l.step = null; l.w = 0; });
}
function stepLive(t) {
  if (t < liveState.t - 1e-6) resetLive();
  const dt = 1 / 60;
  while (liveState.t < t - 1e-6) {
    const tt = Math.min(t, liveState.t + dt), h = tt - liveState.t;
    const s = seq.state(tt);
    const z0 = seq.state(Math.max(0, tt - .02)).pelvis.pos.z;
    const speed = Math.max(0, (s.pelvis.pos.z - z0) / .02);
    live.root.position.set(0, 0, s.pelvis.pos.z - rig.stance.hips.z);
    const pose = tt < T.sit ? 'stand' : tt < T.lie ? 'sit' : 'loaf';
    const walk = tt > T.walk && tt < T.stop + .2 && speed > .05 ? speed / .8 : 0;
    live.update(h, tt, {pose, walk, head: {yaw: s.head.yaw, pitch: s.head.pitch, roll: 0}, look: {x: 0, y: 0},
      face: {...EXPRESSIONS.content, open: s.eyes}, tail: walk ? {amp: .3, speed: 2.5} : {amp: .25, speed: 1.4}});
    liveState.t = tt;
  }
}

// --- Views --------------------------------------------------------------------
let which = q.get('cat') || 'new', viewName = q.get('view') || 'side', showMarks = q.get('marks') !== '0';
let focusZ = null;
function placeCamera(t, snap) {
  const z = (which === 'new' ? seq.state(t).pelvis.pos.z : live.root.position.z + rig.stance.hips.z) + .25;
  focusZ = snap || focusZ === null ? z : focusZ + (z - focusZ) * .12;
  if (viewName === 'side') { camera.position.set(4.6, .45, focusZ); camera.lookAt(0, .36, focusZ); }
  else if (viewName === 'rear') { camera.position.set(2.2, 1.1, focusZ - 3.6); camera.lookAt(0, .25, focusZ - .2); }
  else { camera.position.set(3.0, 1.25, focusZ + 3.2); camera.lookAt(0, .3, focusZ - .05); }
  key.position.set(3, 6, focusZ + 3); key.target.position.set(0, 0, focusZ);
}

let now = 0;
function frame(t, snap = false) {
  now = t;
  fresh.root.visible = which === 'new';
  live.root.visible = which === 'current';
  // The new cat, posed from the authored state.
  const s = seq.state(t);
  s.face = {...EXPRESSIONS.content, open: s.eyes * blinkAt(t), happy: t > T.lie + 3 ? .25 : .1};
  s.look = {x: 0, y: 0};
  rig.apply(s, 1 / 30, t);
  stepLive(t);
  // Paw marks.
  marks.visible = showMarks;
  for (const k of Object.keys(LEGS)) {
    const p = s.paws[k];
    live4[k].visible = which === 'new' && p.planted;
    live4[k].position.set(p.pos.x, .004, p.pos.z);
  }
  marks.children.forEach(m => { if (m.userData.fresh) m.visible = which === 'new'; });
  live.legs.forEach((l, i) => { liveMarks[i].visible = which === 'current' && !!l.plant && l.w > .5; if (l.plant) liveMarks[i].position.set(l.plant.x, .004, l.plant.z); });
  placeCamera(t, snap);
  renderer.render(scene, camera);
  label.textContent = `${which === 'new' ? 'NEW · repaired rig, authored motion' : 'CURRENT · live rig and animation'}\n${t.toFixed(2)} s · ${phaseName(t)}`;
}
// Blinks: a few, unhurried; slow ones once she's resting.
const BLINKS = [1.25, 4.3, 8.9, 11.2, 13.6, 16.5, 19.2];
function blinkAt(t) {
  let k = 1;
  for (const b of BLINKS) { const d = t - b, len = t > T.lie + 2 ? .45 : .2; if (d > 0 && d < len) k = Math.min(k, Math.abs(d / len * 2 - 1)); }
  return k;
}

// Measurements, the same way for both cats:
//  slide: a paw counts as down while its sole is within 0.5 cm (real scale)
//    of the floor; how far it moves (in 3D) from where it touched down,
//    the most over the sequence. For the new cat, also during its
//    scheduled planted intervals.
//  floor: every vertex of the skin, every 0.1 s: how many are more than
//    `tol` below the floor, and how deep the deepest goes.
// (Distances in cm at real-cat scale: 1 app unit ≈ 40 cm.)
const CM = 40;
function stepCat(which, t) { if (which === 'new') { const s = seq.state(t); s.face = {...EXPRESSIONS.content, open: s.eyes}; rig.apply(s, 1 / 30, t); return s; } stepLive(t); return null; }
function skinBelow(cat, tol) {
  const m = cat.skinned, pos = m.geometry.attributes.position, v = new THREE.Vector3();
  m.skeleton.update(); cat.root.updateMatrixWorld(true);
  let n = 0, deep = 0;
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); if (v.y < -tol) { n++; deep = Math.max(deep, -v.y); } }
  return {n, deep};
}
function measure(which = 'new', {dt = 1 / 30, floorEvery = .1, tol = .01} = {}) {
  const cat = which === 'new' ? fresh : live, keys = which === 'new' ? cat.legs.map((_, i) => legKey[i]) : legKey;
  if (which === 'current') resetLive();
  const down = [null, null, null, null], slide = [0, 0, 0, 0], sched = {LF: 0, RF: 0, LH: 0, RH: 0}, schedRef = {};
  const floor = {maxVerts: 0, at: 0, maxDeepCm: 0, deepAt: 0}, lifts = [];
  const sole = new THREE.Vector3();
  let nextFloor = 0;
  for (let t = 0; t <= seq.duration + 1e-6; t += dt) {
    const s = stepCat(which, t);
    cat.root.updateMatrixWorld(true);
    cat.legs.forEach((l, i) => {
      l.sole.getWorldPosition(sole);
      if (sole.y < .5 / CM) { if (!down[i]) down[i] = sole.clone(); slide[i] = Math.max(slide[i], sole.distanceTo(down[i])); }
      else down[i] = null;
      if (s) {
        const k = legKey[i];
        if (s.paws[k].planted) { schedRef[k] ??= sole.clone(); sched[k] = Math.max(sched[k], sole.distanceTo(schedRef[k])); }
        else schedRef[k] = null;
      }
    });
    if (s) lifts.push([+t.toFixed(2), +(rig.lift * CM).toFixed(1)]);
    if (t >= nextFloor - 1e-6) {
      nextFloor += floorEvery;
      const f = skinBelow(cat, tol);
      if (f.n > floor.maxVerts) { floor.maxVerts = f.n; floor.at = +t.toFixed(2); }
      if (f.deep * CM > floor.maxDeepCm) { floor.maxDeepCm = +(f.deep * CM).toFixed(1); floor.deepAt = +t.toFixed(2); }
    }
  }
  // (For the new cat, skin below the floor is drawn squashed flat on it, not
  // through it; these figures are how far it presses in before squashing.)
  const out = {slideWhileDownCm: Object.fromEntries(keys.map((k, i) => [k, +(slide[i] * CM).toFixed(1)])), [which === 'new' ? 'pressedIntoFloor' : 'belowFloor']: floor};
  if (which === 'new') {
    out.slideScheduledCm = Object.fromEntries(Object.entries(sched).map(([k, v]) => [k, +(v * CM).toFixed(1)]));
    out.contactLiftCm = {max: Math.max(...lifts.map(l => l[1])), samples: lifts.filter((l, i) => i % 15 === 0 && l[1] > 0)};
  }
  return out;
}
const slide = measure; // (older name)

// --- Baked clips --------------------------------------------------------------
// The sequence sampled at 30 fps into named clips on the trial skeleton:
// bone turns, the pelvis's travel (root motion), shoulder-blade lifts and
// breathing (spine/chest scale). The face, eyes and the app's own gaze, ear
// and tail-tip touches stay live on top, as before.
function bakeClips(fps = 30) {
  const parts = [['notice', 0, T.walk], ['walk', T.walk, T.walkEnd], ['stop', T.walkEnd, T.sit], ['sit', T.sit, T.lie], ['lie_down', T.lie, T.lie + 2.6], ['rest', T.lie + 2.6, seq.duration]];
  const B = fresh.bones, names = Object.keys(B);
  return parts.map(([name, a, b]) => {
    const n = Math.max(2, Math.round((b - a) * fps) + 1), times = new Float32Array(n);
    const q = Object.fromEntries(names.map(k => [k, new Float32Array(n * 4)]));
    const pos = {hips: new Float32Array(n * 3), scapulaL: new Float32Array(n * 3), scapulaR: new Float32Array(n * 3)};
    const scl = {spine: new Float32Array(n * 3), chest: new Float32Array(n * 3)};
    for (let i = 0; i < n; i++) {
      const t = a + (b - a) * i / (n - 1);
      times[i] = t - a;
      const s = seq.state(t);
      rig.apply(s, 1 / fps, t);
      for (const k of names) B[k].quaternion.toArray(q[k], i * 4);
      for (const k of Object.keys(pos)) B[k].position.toArray(pos[k], i * 3);
      for (const k of Object.keys(scl)) B[k].scale.toArray(scl[k], i * 3);
    }
    const tracks = [
      ...names.map(k => new THREE.QuaternionKeyframeTrack(`${k}.quaternion`, times, q[k])),
      ...Object.keys(pos).map(k => new THREE.VectorKeyframeTrack(`${k}.position`, times, pos[k])),
      ...Object.keys(scl).map(k => new THREE.VectorKeyframeTrack(`${k}.scale`, times, scl[k])),
    ];
    return new THREE.AnimationClip(name, b - a, tracks);
  });
}
// The model, skeleton and clips as a GLB (for Blender or the app).
async function exportGLB() {
  const clips = bakeClips();
  const hidden = [];
  fresh.skinned.traverse(o => { if (o !== fresh.skinned && (o.isMesh || o.isLine || o.isLineSegments) && o.visible) { o.visible = false; hidden.push(o); } });
  try {
    return await new GLTFExporter().parseAsync(fresh.skinned, {binary: true, animations: clips, onlyVisible: true});
  } finally { hidden.forEach(o => o.visible = true); frame(now); }
}

// --- Controls -----------------------------------------------------------------
let playing = !q.has('paused'), last = performance.now();
const scrub = document.getElementById('scrub');
const press = (sel, on) => document.querySelectorAll(sel).forEach(b => b.setAttribute('aria-pressed', String(on(b))));
document.getElementById('play').onclick = e => { playing = !playing; e.target.textContent = playing ? 'Pause' : 'Play'; last = performance.now(); };
document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { which = b.dataset.cat; press('[data-cat]', x => x.dataset.cat === which); frame(now, true); });
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { viewName = b.dataset.view; press('[data-view]', x => x.dataset.view === viewName); frame(now, true); });
document.getElementById('marks').onclick = e => { showMarks = !showMarks; e.target.setAttribute('aria-pressed', String(showMarks)); frame(now); };
document.getElementById('fur').onclick = e => { const on = !fresh.fur.visible; fresh.fur.visible = live.fur.visible = on; e.target.setAttribute('aria-pressed', String(on)); frame(now); };
scrub.oninput = () => { frame(scrub.value / 1000 * seq.duration, true); };
document.getElementById('glb').onclick = async e => {
  e.target.textContent = 'Baking…';
  const buf = await exportGLB();
  const a = Object.assign(document.createElement('a'), {href: URL.createObjectURL(new Blob([buf], {type: 'model/gltf-binary'})), download: 'mochi-motion-trial.glb'});
  a.click(); URL.revokeObjectURL(a.href);
  e.target.textContent = 'Save GLB';
};
press('[data-cat]', x => x.dataset.cat === which); press('[data-view]', x => x.dataset.view === viewName);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
function loop() {
  const t = performance.now(), dt = Math.min(.1, (t - last) / 1000); last = t;
  if (playing) { let n = now + dt; if (n > seq.duration + 1) n = 0; frame(Math.min(n, seq.duration), n === 0); scrub.value = Math.round(now / seq.duration * 1000); }
  requestAnimationFrame(loop);
}
frame(0, true);
if (!q.has('capture')) loop();
else { document.getElementById('bar').style.display = 'none'; document.getElementById('time').style.display = 'none'; }
window.trial = {ready: true, duration: seq.duration, T, seq, rig, fresh, live,
  bakeClips, exportGLB,
  show: w => { which = w; }, view: v => { viewName = v; }, marks: on => { showMarks = on; }, fur: on => { fresh.fur.visible = live.fur.visible = on; }, frame, slide, measure};
