// Model study: a cat model on its own under plain neutral light, with no
// room, no fur shader and no movement, for judging a model before it is
// rigged. ?bones draws the skeleton measured for the long-haired model
// (cat-rig.js) over it. ?model=<file in assets/> (default: the candidate from the Mochi
// character sheet), ?view=<name>. Drag to turn it; the buttons jump to the
// character sheet's views.
//   window.study.view(name)   front | side | back | threeq | face | paws | top
import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {BONES_LONGHAIR, FACE_LONGHAIR} from './cat-rig.js';

const q = new URLSearchParams(location.search);
const file = q.get('model') || 'mochi-longhair-hq.glb';
const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
document.body.prepend(renderer.domElement);

// Neutral light: white sky and key, grey ground, nothing coloured.
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9b9b9');
scene.add(new THREE.HemisphereLight(0xffffff, 0x8c8c8c, 1.5));
const key = new THREE.DirectionalLight(0xffffff, 1.7);
key.position.set(2, 4, 4);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, .7);
fill.position.set(-3, 2, 2);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, .6);
rim.position.set(0, 3, -4);
scene.add(rim);
const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 64), new THREE.MeshLambertMaterial({color: '#a9a9a9'}));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .02, 50);

// The model: stood on the floor, centred, 1 unit long from nose to rump.
const gltf = await new GLTFLoader().loadAsync('./assets/' + file);
const model = gltf.scene;
let tris = 0;
model.traverse(o => { if (o.isMesh) { tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; o.material.metalness = 0; } });
const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
const scale = 1 / Math.max(size.x, size.z);
const turn = new THREE.Group();
model.scale.setScalar(scale);
model.position.set(-mid.x * scale, -box.min.y * scale, -mid.z * scale);
turn.add(model);
if (q.has('bones')) {
  // The measured skeleton and face landmarks, in the model's own space.
  const g = new THREE.Group(), pts = [], dot = new THREE.SphereGeometry(.012, 10, 8);
  const seen = new THREE.MeshBasicMaterial({color: '#ff3b1f', depthTest: false}), face = new THREE.MeshBasicMaterial({color: '#18c964', depthTest: false});
  const mark = (v, m) => { const d = new THREE.Mesh(dot, m); d.position.copy(v); d.renderOrder = 10; g.add(d); };
  for (const [, [parent, pos, end]] of Object.entries(BONES_LONGHAIR)) {
    mark(pos, seen);
    if (parent) pts.push(BONES_LONGHAIR[parent][1], pos);
    if (end) { pts.push(pos, end); mark(end, seen); }
  }
  for (const k of ['eyeR', 'eyeL', 'nose', 'mouth']) mark(FACE_LONGHAIR[k], face);
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color: '#ffd400', depthTest: false}));
  lines.renderOrder = 9;
  g.add(lines);
  model.add(g);
  model.traverse(o => { if (o.isMesh && o.material.map) { o.material.transparent = true; o.material.opacity = .55; } });
}
turn.rotation.y = (+q.get('yaw') || 0) * Math.PI / 180; // if a model doesn't face +z
scene.add(turn);
const H = size.y * scale;

// [camera position, look-at], the cat facing +z.
const VIEWS = {
  front: [[0, H * .55, 2.3], [0, H * .5, 0]],
  side: [[-2.5, H * .55, 0], [0, H * .5, 0]],
  back: [[0, H * .6, -2.3], [0, H * .5, 0]],
  threeq: [[-1.5, H * .85, 1.9], [0, H * .48, 0]],
  face: [[-.12, H * .7, 1.15], [0, H * .68, .4]],
  paws: [[-.45, H * .2, 1.25], [0, H * .1, .25]],
  top: [[0.01, 2.6, 0], [0, 0, 0]],
};
const label = document.getElementById('label');
let orbit = null;
function place() {
  const {yaw, pitch, dist, at} = orbit;
  camera.position.set(at.x + dist * Math.sin(yaw) * Math.cos(pitch), at.y + dist * Math.sin(pitch), at.z + dist * Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(at);
  renderer.render(scene, camera);
}
function view(name) {
  const [p, l] = VIEWS[name] || VIEWS.threeq;
  const at = new THREE.Vector3(...l), d = new THREE.Vector3(...p).sub(at);
  orbit = {at, dist: d.length(), yaw: Math.atan2(d.x, d.z), pitch: Math.asin(d.y / d.length())};
  label.textContent = `${file} · ${Math.round(tris).toLocaleString('en')} triangles · neutral light · ${name}`;
  place();
}
for (const name of Object.keys(VIEWS)) {
  const b = document.createElement('button');
  b.textContent = name === 'threeq' ? '3/4' : name;
  b.onclick = () => view(name);
  document.getElementById('views').append(b);
}
let drag = null;
renderer.domElement.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener('pointermove', e => {
  if (!drag) return;
  orbit.yaw -= (e.clientX - drag[0]) * .008;
  orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + (e.clientY - drag[1]) * .006, -.2, 1.5);
  drag = [e.clientX, e.clientY];
  place();
});
addEventListener('pointerup', () => { drag = null; });
renderer.domElement.addEventListener('wheel', e => { orbit.dist = THREE.MathUtils.clamp(orbit.dist * (1 + e.deltaY * .001), .5, 8); place(); }, {passive: true});
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); place(); });
view(q.get('view') || 'threeq');
window.study = {view, VIEWS, model, ready: true};
