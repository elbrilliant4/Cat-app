// Rig check: Mochi without her fur, for inspecting the skeleton, the skin
// weights and how the mesh bends. Driven from the console (or the review
// tools):
//   check.pose(name)   'sculpt' (the model as Meshy made it), 'rest' (legs
//                      straightened), a single-joint bend (see BENDS), or an
//                      app pose (sit, loaf, crouch, sleep…) settled by update()
//   check.mode(name)   'tex' | 'weights' | 'raw' (weights before smoothing)
//                      | 'heat:<bone or group>' (one bone's influence)
//   check.view(name)   see VIEWS
//   check.bones(on)    the skeleton drawn over the mesh
//   check.stats()      where influence crosses between body regions
import * as THREE from 'three';
import {RealCat, EXPRESSIONS} from './real-cat.js';
import {BONES, BONES2, computeWeights, computeWeights2, syncHelpers} from './cat-rig.js';

const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9e6e1');
scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8f84, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(3, 5, 4);
scene.add(key);
const back = new THREE.DirectionalLight(0xffffff, .6);
back.position.set(-3, 3, -4);
scene.add(back);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshLambertMaterial({color: '#d6d1ca'}));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const grid = new THREE.GridHelper(8, 32, 0xb9b2a9, 0xc8c2ba);
grid.position.y = .001;
scene.add(grid);
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .05, 50);

// ?rig=2: the motion trial's rig (shoulder blades, repaired weights).
const RIG = +new URLSearchParams(location.search).get('rig') || 1;
const DEF = RIG === 2 ? BONES2 : BONES;
const cat = new RealCat({rig: RIG});
await cat.load('./assets/mochi-ragdoll.glb');
scene.add(cat.root);
cat.fur.visible = false;
const B = cat.bones, skinned = cat.skinned, geo = skinned.geometry;
const texMaterial = skinned.material;

// Weights as they are (smoothed) and before smoothing.
const smoothW = {index: geo.attributes.skinIndex, weight: geo.attributes.skinWeight};
const rawGeo = new THREE.BufferGeometry();
rawGeo.setAttribute('position', geo.attributes.position);
rawGeo.setIndex(geo.index);
const {names} = RIG === 2 ? computeWeights2(rawGeo, {smooth: 0}) : computeWeights(rawGeo, cat.rigSource.bright, {smooth: 0});
const rawW = {index: rawGeo.attributes.skinIndex, weight: rawGeo.attributes.skinWeight};

// Colours by bone: body cool, front legs warm, hind legs red/pink, tail green.
const GROUPS = {
  hips: '#7a4fd0', spine: '#3f6fd8', chest: '#33a6d6', neck: '#8aa0b0', head: '#b8b8b8', jaw: '#e0e0e0', earR: '#d8d8d8', earL: '#d8d8d8',
  scapulaR: '#ff5e1a', scapulaL: '#c2410c', shoulderR: '#f08a24', elbowR: '#f6b54a', wristR: '#fbe08a', shoulderL: '#d4691a', elbowL: '#e0a040', wristL: '#efd27a',
  thighR: '#ff7a7a', thighL: '#b84a4a', hipR: '#d8313a', kneeR: '#ee6f86', hockR: '#f7aab8', hipL: '#a8202a', kneeL: '#c95468', hockL: '#df8c9c',
};
for (let i = 0; i < 8; i++) GROUPS['tail' + i] = new THREE.Color().setHSL(.3 + i * .025, .6, .28 + i * .05).getStyle();
const boneColor = names.map(n => new THREE.Color(GROUPS[n] || '#ff00ff'));
const GROUP_SETS = {tail: names.filter(n => n.startsWith('tail')), hindL: ['thighL', 'hipL', 'kneeL', 'hockL'].filter(n => names.includes(n)), hindR: ['thighR', 'hipR', 'kneeR', 'hockR'].filter(n => names.includes(n)), frontR: ['scapulaR', 'shoulderR', 'elbowR', 'wristR'].filter(n => names.includes(n)), frontL: ['scapulaL', 'shoulderL', 'elbowL', 'wristL'].filter(n => names.includes(n))};

const colors = new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3);
geo.setAttribute('color', colors);
const weightMaterial = new THREE.MeshLambertMaterial({vertexColors: true});
function paint(W, fn) {
  const c = new THREE.Color();
  for (let i = 0; i < colors.count; i++) {
    c.setRGB(0, 0, 0);
    fn(i, W, c);
    colors.setXYZ(i, c.r, c.g, c.b);
  }
  colors.needsUpdate = true;
}
const byBone = (i, W, c) => { for (let k = 0; k < 4; k++) { const w = W.weight.getComponent(i, k); if (w > 0) c.add(boneColor[W.index.getComponent(i, k)].clone().multiplyScalar(w)); } };
const heat = set => (i, W, c) => {
  let s = 0;
  for (let k = 0; k < 4; k++) if (set.has(W.index.getComponent(i, k))) s += W.weight.getComponent(i, k);
  // Grey where it has no influence, through yellow to red at full.
  c.setRGB(.55, .55, .58).lerp(s < .5 ? new THREE.Color(1, .85, .1) : new THREE.Color(.85, .05, .05), Math.min(1, s * 2) > 0 ? Math.min(1, .25 + s) : 0);
  if (s > 0 && s < .02) c.setRGB(.35, .55, 1); // a trace (under 2%): blue, so leaks show
};

let modeName = 'tex';
function mode(name) {
  modeName = name;
  const legend = document.getElementById('legend');
  legend.style.display = name === 'tex' ? 'none' : 'block';
  if (name === 'tex') { skinned.material = texMaterial; return; }
  // The skinning attributes the shader reads.
  const W = name === 'raw' ? rawW : smoothW;
  geo.setAttribute('skinIndex', W.index); geo.setAttribute('skinWeight', W.weight);
  if (name === 'weights' || name === 'raw') {
    paint(W, byBone);
    legend.innerHTML = Object.entries({hips: 'hips', spine: 'spine', chest: 'chest', ...(RIG === 2 ? {'shoulder blade R': 'scapulaR'} : {}), 'shoulder/elbow/wrist R': 'shoulderR', 'L front': 'shoulderL', 'hip/knee/hock R': 'hipR', 'L hind': 'hipL', tail: 'tail3'}).map(([k, n]) => `<div><span style="background:${GROUPS[n]}"></span>${k}</div>`).join('');
  } else {
    const key = name.slice(5), set = new Set((GROUP_SETS[key] || [key]).map(n => names.indexOf(n)));
    const w2 = name.includes('raw:') ? rawW : W;
    paint(w2, heat(set));
    legend.innerHTML = `<b>${key}</b> influence<div><span style="background:#ffd91a"></span>some</div><div><span style="background:#d90d0d"></span>full</div><div><span style="background:#5a8cff"></span>trace (&lt;2%)</div>`;
  }
  skinned.material = weightMaterial;
}
// (Smoothed weights back on for the textured view.)
const restoreSkin = () => { geo.setAttribute('skinIndex', smoothW.index); geo.setAttribute('skinWeight', smoothW.weight); };

// Single-joint bends on the right side (the left stays at rest, for
// comparison). Euler x: negative swings a leg forward.
const BENDS = {
  'front-forward': {shoulderR: [-.75, 0, 0], elbowR: [.3, 0, 0]},
  'front-back': {shoulderR: [.6, 0, 0], elbowR: [.55, 0, 0], wristR: [-.8, 0, 0]},
  'front-fold': {shoulderR: [.95, 0, 0], elbowR: [-2.25, 0, 0], wristR: [1.2, 0, 0]},
  'hind-forward': {hipR: [-.9, 0, 0], kneeR: [1.1, 0, 0], hockR: [-.45, 0, 0]},
  'hind-back': {hipR: [.6, 0, 0], kneeR: [.15, 0, 0], hockR: [.2, 0, 0]},
  'hind-sit-fold': {hipR: [-.95, 0, 0], kneeR: [2.15, 0, 0], hockR: [-1.25, 0, 0]},
  // The same fold with the knee turned out a little (as a sitting cat's is).
  'hind-sit-out': {hipR: [-.95, 0, -.3], kneeR: [2.15, 0, 0], hockR: [-1.25, 0, 0]},
  'hind-sit-out2': {hipR: [-.95, 0, .3], kneeR: [2.15, 0, 0], hockR: [-1.25, 0, 0]},
  'spine-arch': {spine: [-.25, 0, 0], chest: [-.2, 0, 0]},
  'spine-sag': {spine: [.22, 0, 0], chest: [.18, 0, 0]},
  'spine-curl': {hips: [0, .45, 0], spine: [0, .9, 0], chest: [0, .9, 0], neck: [0, .7, 0]},
  'tail-out': {},
};
const _q = new THREE.Quaternion(), _e = new THREE.Euler();
let poseName = 'rest';
function pose(name) {
  poseName = name;
  cat.root.position.set(0, 0, 0);
  if (name === 'sculpt' || name === 'rest' || BENDS[name]) {
    for (const b of Object.values(B)) b.quaternion.identity();
    if (name !== 'sculpt') for (const [n, q] of Object.entries(cat.rest)) B[n].quaternion.copy(q);
    if (BENDS[name]) for (const [n, [x, y, z]] of Object.entries(BENDS[name])) B[n].quaternion.multiply(_q.setFromEuler(_e.set(x, y, z)));
    if (name === 'tail-out') { cat.poseTail(0, {amp: 0, speed: 0}); }
    syncHelpers(B);
    cat.model.position.y = 0;
    cat.root.updateMatrixWorld(true);
    // Stand on the lowest paw.
    let low = Infinity;
    for (const c of cat.contacts.slice(0, 8)) low = Math.min(low, c.getWorldPosition(new THREE.Vector3()).y);
    cat.root.position.y = -low;
  } else {
    let t = 0;
    for (let i = 0; i < 90; i++) { t += 1 / 30; cat.update(1 / 30, t, {pose: name, face: EXPRESSIONS.content, tail: {amp: 0, speed: 1}, head: {yaw: 0, pitch: 0, roll: 0}, look: {x: 0, y: 0}}); }
  }
  cat.root.updateMatrixWorld(true);
  drawBones();
  label();
}

// Views: the cat faces +z, its right side is -x.
const VIEWS = {
  side: [[3.6, .55, 0], [0, .45, 0]],             // her left side
  sideR: [[-3.6, .55, 0], [0, .45, 0]],           // her right side (the bent legs)
  front34: [[-2.3, 1.0, 2.6], [0, .45, .05]],
  back34: [[-2.3, 1.1, -2.6], [0, .4, -.1]],
  backL34: [[2.3, 1.1, -2.6], [0, .4, -.1]],
  top: [[0.01, 4.2, 0], [0, 0, 0]],
  shoulderR: [[-1.7, .75, 1.1], [-.15, .4, .2]],
  hipR: [[-1.7, .7, -1.2], [-.15, .35, -.35]],
  haunchL: [[1.4, .7, -1.3], [.15, .3, -.35]],
  under: [[0, -.02, 0], [0, .5, 0]],
};
let viewName = 'side';
function view(name) {
  viewName = name;
  const [p, l] = VIEWS[name];
  camera.position.set(...p);
  camera.lookAt(...l);
  label();
}

// The skeleton, drawn over everything.
const boneLines = new THREE.Group();
scene.add(boneLines);
const lineMat = new THREE.LineBasicMaterial({color: 0x111111, depthTest: false, transparent: true, opacity: .9});
const jointMat = new THREE.MeshBasicMaterial({color: 0xffffff, depthTest: false});
const jointGeo = new THREE.SphereGeometry(.014, 8, 6);
function drawBones() {
  boneLines.clear();
  if (!boneLines.visible) return;
  const pts = [], p = new THREE.Vector3(), q = new THREE.Vector3();
  for (const [name, [parent]] of Object.entries(DEF)) {
    B[name].getWorldPosition(p);
    const j = new THREE.Mesh(jointGeo, jointMat); j.position.copy(p); j.renderOrder = 10; boneLines.add(j);
    if (parent) { B[parent].getWorldPosition(q); pts.push(q.clone(), p.clone()); }
  }
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
  lines.renderOrder = 9;
  boneLines.add(lines);
}
function bones(on) { boneLines.visible = on; drawBones(); }
bones(false);

function label(extra = '') {
  document.getElementById('label').textContent = `rig v${RIG}   pose: ${poseName}   view: ${viewName}   ${modeName === 'tex' ? 'textured, fur hidden' : modeName === 'raw' ? 'weights BEFORE smoothing' : modeName === 'weights' ? 'weights after smoothing (as used)' : modeName}${extra}`;
}

// Where influence crosses between regions. A vertex's region is the group
// with most weight before smoothing (the masks decided it); after
// smoothing, how much weight from other regions has it picked up?
function stats() {
  const region = n => /^scapula/.test(n) ? (n.endsWith('R') ? 'frontR' : 'frontL') : n.startsWith('tail') ? 'tail' : /^(thigh|hip|knee|hock)L/.test(n) ? 'hindL' : /^(thigh|hip|knee|hock)R/.test(n) ? 'hindR' : /(shoulder|elbow|wrist)R/.test(n) ? 'frontR' : /(shoulder|elbow|wrist)L/.test(n) ? 'frontL' : n === 'hips' ? 'hips' : 'body';
  const regionOf = (W, i) => { const s = {}; for (let k = 0; k < 4; k++) { const r = region(names[W.index.getComponent(i, k)]); s[r] = (s[r] || 0) + W.weight.getComponent(i, k); } return s; };
  const out = {}, N = geo.attributes.position.count;
  for (let i = 0; i < N; i++) {
    const r0 = regionOf(rawW, i), r1 = regionOf(smoothW, i);
    const home = Object.entries(r0).sort((a, b) => b[1] - a[1])[0][0];
    for (const [r, w] of Object.entries(r1)) {
      if (r === home || w < .02 || (r0[r] || 0) > .02) continue;
      const k = `${home} <- ${r}`;
      out[k] ??= {verts: 0, max: 0};
      out[k].verts++; out[k].max = Math.max(out[k].max, +w.toFixed(3));
    }
  }
  // Is the tail joined to the body? Edges from tail vertices (past its root)
  // straight to the haunch / hind leg.
  const tailBones = new Set(['tail2', 'tail3', 'tail4', 'tail5', 'tail6', 'tail7'].map(n => names.indexOf(n)));
  const dom = (W, i) => { let b = 0, w = -1; for (let k = 0; k < 4; k++) if (W.weight.getComponent(i, k) > w) { w = W.weight.getComponent(i, k); b = W.index.getComponent(i, k); } return b; };
  const idx = geo.index, pos = geo.attributes.position;
  const key = i => Math.round(pos.getX(i) * 1e4) + ',' + Math.round(pos.getY(i) * 1e4) + ',' + Math.round(pos.getZ(i) * 1e4);
  let joined = 0;
  const seen = new Set();
  for (let t = 0; t < idx.count; t += 3) {
    const tri = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)];
    for (let a = 0; a < 3; a++) {
      const i = tri[a], j = tri[(a + 1) % 3];
      const ti = tailBones.has(dom(rawW, i)), tj = tailBones.has(dom(rawW, j));
      if (ti === tj) continue;
      const other = ti ? j : i, r = region(names[dom(rawW, other)]);
      if (r === 'tail' || r === 'hips') continue;
      const e = [key(i), key(j)].sort().join('|');
      if (!seen.has(e)) { seen.add(e); joined++; }
    }
  }
  return {crossings: out, tailJoinedToBodyEdges: joined, vertices: N, triangles: idx.count / 3};
}

addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
function render() { if (modeName === 'tex') restoreSkin(); renderer.render(scene, camera); }
renderer.setAnimationLoop(render);
pose('rest'); view('side');
window.check = {pose, mode, view, bones, stats, render, BENDS, VIEWS, cat, ready: true};
