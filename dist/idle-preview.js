// A calm 10-second idle loop for reviewing Mochi's look: sitting on her rug,
// breathing, looking at us, with an occasional slow blink, ear flick and a
// lazy tail curl, and real pauses in between. Add ?record to drive time by
// hand (window.renderAt(seconds)) for frame-by-frame capture.
import * as THREE from 'three';
import {RealCat, EXPRESSIONS} from './real-cat.js';
import {Room} from './room.js';

const params = new URLSearchParams(location.search);
const record = params.has('record');
const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: record});
renderer.setPixelRatio(record ? 1 : Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const room = new Room(scene, renderer);
// Soft, low-contrast light: warm window key from the left, gentle fill from us.
scene.add(new THREE.HemisphereLight(0xfff0dc, 0x8a6446, 1.25));
const key = new THREE.DirectionalLight(0xffdcae, 2.2);
key.position.set(-4, 5, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, {left: -3, right: 3, top: 3, bottom: -3});
key.shadow.radius = 6;
key.shadow.bias = -.0004;
key.shadow.normalBias = .02;
scene.add(key);
const fill = new THREE.DirectionalLight(0xffe7cc, .9);
fill.position.set(1, 1.6, 6);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffd29a, 1.1);
rim.position.set(-2, 3, -5);
scene.add(rim);

const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .1, 60);
const cat = new RealCat();
const HOLD = {x: -.3, z: .55};
cat.root.position.set(HOLD.x, 0, HOLD.z);
scene.add(cat.root);
room.kibbles.forEach(k => k.visible = false);

const {damp, clamp} = THREE.MathUtils;
const ease = x => x * x * (3 - 2 * x);
const pulse = (t, start, dur) => { const p = (t - start) / dur; return p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p); };

// The script: a 10 s loop with long still stretches. Times in seconds.
const LOOP = 10;
const SLOW_BLINKS = [3.2];
const BLINKS = [.6, 7.4];
const EAR_FLICKS = [[1.8, 1], [6.1, 0], [8.6, 1]];
const LOOK_SHIFTS = [[4.6, 6.0, {x: .35, y: .05}]]; // glance off to the window, then back

const face = {...EXPRESSIONS.content};
const head = {yaw: 0, pitch: 0, roll: 0}, look = {x: 0, y: 0};
let lastT = 0;

function frame(t) {
  const dt = clamp(t - lastT, 0, .1) || 1 / 30;
  lastT = t;
  const lt = ((t % LOOP) + LOOP) % LOOP;

  // Eyes: soft and relaxed, with blinks and one long, slow "I love you" blink.
  let open = .78;
  for (const b of BLINKS) open *= 1 - Math.pow(pulse(lt, b, .2), .7);
  for (const b of SLOW_BLINKS) {
    const p = (lt - b) / 1.9;
    if (p > 0 && p < 1) {
      const close = p < .35 ? ease(p / .35) : p < .6 ? 1 : 1 - ease((p - .6) / .4);
      open *= 1 - close;
    }
  }
  // Gaze: at us, with one unhurried glance toward the window.
  let gx = 0, gy = 0;
  for (const [a, b, g] of LOOK_SHIFTS) {
    const w = lt < a || lt > b ? 0 : Math.min(1, (lt - a) / .5, (b - lt) / .5);
    gx += g.x * ease(clamp(w, 0, 1)); gy += g.y * ease(clamp(w, 0, 1));
  }
  look.x = damp(look.x, gx * .6, 8, dt);
  look.y = damp(look.y, gy * .6, 8, dt);
  head.yaw = damp(head.yaw, gx * .55 + Math.sin(t * .5) * .015, 3, dt);
  head.pitch = damp(head.pitch, .04 + Math.sin(t * .37) * .012, 3, dt);
  head.roll = damp(head.roll, .05 + Math.sin(t * .41) * .02, 3, dt);

  // Ear flicks: one ear, a quick twitch and settle.
  for (const [at, side] of EAR_FLICKS) {
    if (lt >= at && lt - dt < at) cat.twitchEar(side, .55);
  }

  Object.assign(face, EXPRESSIONS.content, {open, happy: .18 + (1 - open) * .2, pupil: .62, sparkle: .5});
  cat.update(dt, t, {
    pose: 'sit', poseRate: 8, face, look, head,
    // Lazy tail: mostly still, one slow curl of the tip around 7 s.
    tail: {amp: .05 + .22 * pulse(lt, 6.6, 2.6), speed: .45},
  });
  cat.root.rotation.y = -.35;

  room.update(dt, t, false);
  // Camera: low and close, like sitting on the floor with her.
  const tall = camera.aspect < .9;
  const target = cat.headCenter(new THREE.Vector3());
  const lookAt = new THREE.Vector3(HOLD.x + .05, target.y * .62, HOLD.z);
  camera.fov = tall ? 38 : 30;
  camera.position.set(lookAt.x + .9, target.y * .74, lookAt.z + (tall ? 3.6 : 3.0));
  camera.lookAt(lookAt);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
camera.aspect = innerWidth / innerHeight;

await cat.load('./assets/mochi-ragdoll.glb');
// Settle into the sitting pose before anything is shown.
for (let i = 0; i < 90; i++) frame(i / 30 - 3);
if (record) {
  window.renderAt = s => { frame(s); return true; };
  document.title = 'ready';
} else {
  const start = performance.now();
  renderer.setAnimationLoop(now => frame((now - start) / 1000));
}
