// Review stage: renders the pieces of a review pack (tools/review-pack) the
// same way every build, so builds can be compared side by side.
//   window.shot(expr, view)  still close-up (expr: content | open | half | closed | any expression)
//   window.walkAt(seconds)   one frame of a short walking clip
//   window.renderAudio(kind) purr / room tone / meows, rendered offline, as a base64 WAV
// Every frame carries the build label.
import * as THREE from 'three';
import {RealCat, EXPRESSIONS} from './real-cat.js';
import {Room} from './room.js';
import {synthPurr} from './sound.js';
import {meowV1, meowV2} from './legacy-meows.js';

const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const room = new Room(scene, renderer);
room.kibbles.forEach(k => k.visible = false);
const hemi = new THREE.HemisphereLight(0xfff0dc, 0x8a6446, 1.25);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffdcae, 2.2);
key.position.set(-4, 5, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, {left: -3, right: 3, top: 3, bottom: -3});
key.shadow.normalBias = .02;
scene.add(key);
const fill = new THREE.DirectionalLight(0xffe7cc, .9);
fill.position.set(1, 1.6, 6);
scene.add(fill);
const moon = new THREE.DirectionalLight(0x9fb4ff, 0);
moon.position.set(-3, 4, -4);
scene.add(moon);
// Daylight, or the app's evening: lamps on, a cool moon through the window
// and a warm fill from the front.
let night = false;
window.light = mode => {
  night = mode === 'evening';
  hemi.intensity = night ? .35 : 1.25;
  key.intensity = night ? .05 : 2.2;
  moon.intensity = night ? .45 : 0;
  fill.color.set(night ? 0xffcf9a : 0xffe7cc);
  fill.intensity = night ? .7 : .9;
  for (let i = 0; i < 60; i++) room.update(1 / 30, i / 30, night, {camera});
  return true;
};

const camera = new THREE.PerspectiveCamera(26, innerWidth / innerHeight, .05, 60);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
const cat = new RealCat();
await cat.load('./assets/mochi-ragdoll.glb');
scene.add(cat.root);

const label = document.getElementById('label');
try {
  const v = await (await fetch('./version.json', {cache: 'no-store'})).json();
  label.textContent = `Mochi · build ${v.build} · ${v.commit}`;
} catch { label.textContent = 'Mochi · local build'; }

const face = (name) => {
  if (name === 'half') return {...EXPRESSIONS.content, open: .4, happy: .25};
  if (name === 'closed') return {...EXPRESSIONS.content, open: 0, happy: 0};
  if (name === 'open') return {...EXPRESSIONS.content, open: 1, happy: 0};
  return EXPRESSIONS[name] || EXPRESSIONS.content;
};

let t = 0;
function step(dt, ctl) { t += dt; cat.update(dt, t, ctl); }
const still = f => ({pose: 'sit', poseRate: 8, face: f, look: {x: 0, y: 0}, head: {yaw: 0, pitch: .05, roll: 0}});

// A still close-up. view: front | left | right | three (three-quarter), or
// mouth-front | mouth-three | mouth-side for the muzzle.
window.shot = (expr = 'content', view = 'front', lighting) => {
  if (lighting) window.light(lighting);
  const f = face(expr), eyes = ['half', 'closed', 'open'].includes(expr);
  cat.root.position.set(0, 0, .6);
  cat.root.rotation.y = 0;
  for (let i = 0; i < 90; i++) step(1 / 30, still(f));
  cat.root.updateMatrixWorld(true);
  const c = cat.headCenter(new THREE.Vector3());
  const mouth = view.startsWith('mouth');
  const yaw = {front: 0, left: -1.25, right: 1.25, three: .6, 'mouth-front': 0, 'mouth-three': .6, 'mouth-side': 1.1}[view] ?? 0;
  const dist = mouth ? .48 : eyes ? .62 : 1.3, aimY = mouth ? -.1 : eyes ? .03 : .02;
  camera.position.set(c.x + Math.sin(yaw) * dist, c.y + aimY + .02, c.z + Math.cos(yaw) * dist);
  camera.lookAt(c.x, c.y + aimY, c.z + (mouth ? .08 : 0));
  renderer.render(scene, camera);
  return true;
};

// A calm walk across the rug, seen from the side with the camera travelling
// alongside. Call with s = 0, 1/fps, 2/fps, ...
const WALK = {x0: -1.3, speed: .45};
let last = 0;
window.walkAt = s => {
  if (s === 0) {
    last = 0;
    cat.root.rotation.y = Math.PI / 2;
    cat.root.position.set(WALK.x0, 0, .5);
    for (let i = 0; i < 60; i++) step(1 / 30, {...still(EXPRESSIONS.content), pose: 'stand'});
  }
  const dt = Math.max(1 / 60, s - last);
  last = s;
  const walking = s > .4 && s < 4.6;
  cat.root.position.set(WALK.x0 + WALK.speed * Math.max(0, Math.min(s, 4.6) - .4), 0, .5);
  step(dt, {pose: 'stand', poseRate: 8, walk: walking ? WALK.speed / .65 : 0, face: EXPRESSIONS.content, look: {x: .2, y: 0}, head: {yaw: .15, pitch: -.05, roll: 0}, tail: {amp: .3, speed: 2.2}});
  camera.position.set(cat.root.position.x + .1, .6, 5.2);
  camera.lookAt(cat.root.position.x + .1, .36, .5);
  renderer.render(scene, camera);
  return true;
};
window.shot(q.get('expr') || 'content', q.get('view') || 'front', q.get('light') || 'day');
document.title = 'ready';

// Offline audio for the pack: the bundled recordings (meows, purr loop), the
// synthesized purr, and earlier versions' synthesized meows (legacy-meows.js)
// for comparison.
window.renderAudio = async (kind, seconds = 6) => {
  const sr = 44100, ctx = new OfflineAudioContext(1, sr * seconds, sr);
  const list = await fetch('./assets/sounds/sounds.json').then(r => r.ok ? r.json() : {clips: []}).catch(() => ({clips: []}));
  const purrClip = (list.clips || []).find(c => c.kind === 'purr' && c.status !== 'reference');
  if (kind === 'meow-v1') { let at = .3; while (at + .6 < seconds) at += meowV1(ctx, ctx.destination, at) + 1.2; }
  else if (kind === 'meow-v2') { let at = .3; for (const k of ['mew', 'meow', 'chirp', 'sleepy']) at += meowV2(ctx, ctx.destination, at, k) + 1.2; }
  else if (kind === 'purr-synth') synthPurr(ctx, ctx.destination, 0, seconds);
  else if (kind === 'purr' && purrClip) {
    const src = ctx.createBufferSource();
    src.buffer = await ctx.decodeAudioData(await (await fetch('./assets/sounds/' + purrClip.file)).arrayBuffer());
    src.loop = true; src.connect(ctx.destination); src.start(0);
  } else if (kind === 'purr') synthPurr(ctx, ctx.destination, 0, seconds);
  else {
    const clips = (list.clips || []).filter(c => c.kind !== 'purr' && c.status !== 'reference');
    if (!clips.length) return null;
    let at = .3;
    for (const c of clips) {
      const buf = await ctx.decodeAudioData(await (await fetch('./assets/sounds/' + c.file)).arrayBuffer());
      if (at + buf.duration > seconds) break;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.connect(ctx.destination); src.start(at);
      at += buf.duration + 1.2;
    }
  }
  const out = await ctx.startRendering();
  return wav(out.getChannelData(0), sr);
};

function wav(data, sr) {
  const n = data.length, buf = new ArrayBuffer(44 + n * 2), d = new DataView(buf);
  const str = (o, s) => [...s].forEach((ch, i) => d.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF'); d.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true); d.setUint32(24, sr, true);
  d.setUint32(28, sr * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); str(36, 'data'); d.setUint32(40, n * 2, true);
  let peak = 1e-6;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]));
  const gain = .89 / peak; // every sample at the same peak (-1 dB), so they compare easily
  for (let i = 0; i < n; i++) d.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i] * gain)) * 32767, true);
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(bin);
}
