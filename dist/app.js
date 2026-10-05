import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {KEY, restore, fresh, advance, care, mood} from './pet-state.js';
import {createFace, EXPRESSIONS} from './kitten-face.js';

const $ = s => document.querySelector(s);
const {damp, clamp, lerp} = THREE.MathUtils;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = list => list[Math.floor(Math.random() * list.length)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = reduceMotion ? 0.35 : 1;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
let pet;
try { pet = restore(JSON.parse(localStorage.getItem(KEY))); } catch { pet = fresh(); }
let saveWarned = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(pet)); }
  catch { if (!saveWarned) { toast('Browser storage is unavailable. Care will last for this visit.'); saveWarned = true; } }
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
let toastTimer;
function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3400);
}

const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const LEGACY_ICONS = {'♡': 'i-heart', '◡': 'i-bowl', '≋': 'i-brush', '✺': 'i-yarn', '☾': 'i-moon', '✦': 'i-sparkle'};
const ICON_TINT = {'i-heart': '--love', 'i-bowl': '--food', 'i-brush': '--clean', 'i-yarn': '--happy', 'i-moon': '--energy', 'i-sparkle': '--accent', 'i-sun': '--energy'};

const NEEDS = [
  {key: 'food', label: 'Tummy', icon: 'i-bowl', tint: '--food'},
  {key: 'happiness', label: 'Joy', icon: 'i-heart', tint: '--happy'},
  {key: 'energy', label: 'Energy', icon: 'i-bolt', tint: '--energy'},
  {key: 'cleanliness', label: 'Fluff', icon: 'i-sparkle', tint: '--clean'},
];
const CIRC = 2 * Math.PI * 29;
for (const n of NEEDS) {
  const el = document.createElement('div');
  el.className = 'ring';
  el.id = 'ring-' + n.key;
  el.style.setProperty('--tint', `var(${n.tint})`);
  el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-label', n.label);
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '100');
  el.innerHTML = `<div class="ring-wrap"><svg class="dial" viewBox="0 0 70 70" aria-hidden="true"><circle class="track" cx="35" cy="35" r="29"/><circle class="bar" cx="35" cy="35" r="29" style="stroke-dashoffset:${CIRC}"/></svg><span class="ring-icon">${icon(n.icon)}</span></div><div><strong>0%</strong><small>${n.label}</small></div>`;
  $('#stats').append(el);
}

const LEVELS = [0, 15, 40, 100, 180, 300, 480, 750, 1100];
const LEVEL_NAMES = ['New friends', 'A familiar face', 'Growing closer', 'Best little friends', 'Kindred spirits', 'Inseparable', 'Soulmates', 'Hearts entwined', 'Legendary love'];
function levelInfo(bond) {
  let i = 0;
  while (i < LEVELS.length - 1 && bond >= LEVELS[i + 1]) i++;
  const lo = LEVELS[i], hi = LEVELS[i + 1] ?? lo + 500;
  return {level: i + 1, name: LEVEL_NAMES[i], progress: clamp((bond - lo) / (hi - lo), 0, 1), toGo: Math.max(0, Math.ceil(hi - bond))};
}
let shownLevel = levelInfo(pet.bond).level;

const MOOD_COLORS = {'Dreaming softly': '#8f9cff', 'A little hungry': '#f28c5b', 'Ready for a nap': '#e9ad2f', 'Needs a little brush': '#3fb3c9', 'Missing you': '#b48ad8', 'Feeling lovely': '#5cc489'};

function greeting() {
  const h = new Date().getHours();
  const part = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  if (pet.sleeping) return `${part}. ${pet.name} is fast asleep — shh.`;
  if (pet.food < 25) return `${part}. ${pet.name} keeps glancing at the bowl…`;
  if (pet.happiness < 35) return `${part}. ${pet.name} missed you.`;
  return `${part}. ${pet.name} is so happy you’re here.`;
}

function refresh() {
  const m = mood(pet);
  $('#pet-name').textContent = pet.name;
  $('#mood-text').textContent = m;
  $('#mood').style.setProperty('--mood', MOOD_COLORS[m] || '#5cc489');
  $('#age').textContent = 'Day ' + Math.max(1, Math.floor((Date.now() - pet.born) / 86400000) + 1);
  $('#greeting').textContent = greeting();
  for (const n of NEEDS) {
    const v = Math.round(pet[n.key]), el = $('#ring-' + n.key);
    el.querySelector('.bar').style.strokeDashoffset = String(CIRC * (1 - v / 100));
    el.querySelector('strong').textContent = v + '%';
    el.setAttribute('aria-valuenow', v);
    el.classList.toggle('low', v < 25);
  }
  const lv = levelInfo(pet.bond);
  $('#level').textContent = lv.level;
  $('#bond-label').textContent = lv.name;
  $('#xp-fill').style.width = (lv.progress * 100).toFixed(1) + '%';
  $('#xp-bar').setAttribute('aria-valuenow', Math.round(lv.progress * 100));
  $('#bond-next').textContent = lv.level >= LEVELS.length ? 'Max level — wow' : `${lv.toGo} to level ${lv.level + 1}`;
  $('#bond-count').textContent = pet.cuddles + ' cuddle' + (pet.cuddles === 1 ? '' : 's');
  if (lv.level > shownLevel) {
    const badge = $('.level-badge');
    badge.classList.remove('up'); void badge.offsetWidth; badge.classList.add('up');
    toast(`Friendship level ${lv.level}: ${lv.name}!`);
    moment(`Friendship grew: ${lv.name}.`, 'i-heart');
    if (ready) { express('joy', 2); burst('sparkle', 8); }
  }
  shownLevel = lv.level;
  $('#sleep-label').textContent = pet.sleeping ? 'Wake' : 'Rest';
  $('#sleep-icon').setAttribute('href', pet.sleeping ? '#i-sun' : '#i-moon');
  document.body.classList.toggle('night', pet.sleeping);
  document.querySelector('meta[name=theme-color]').content = pet.sleeping ? '#141a2e' : '#f7f1ea';
  for (const b of document.querySelectorAll('.dock [data-action]')) {
    const off = pet.sleeping && b.dataset.action !== 'sleep';
    b.setAttribute('aria-disabled', String(off));
    b.classList.toggle('active', brain.mode === b.dataset.action || (b.dataset.action === 'sleep' && pet.sleeping));
  }
  $('#care-tip').textContent = pet.sleeping ? 'Resting restores energy, even while you’re away.'
    : pet.food < 25 ? 'A tasty snack would be lovely.'
    : pet.energy < 25 ? 'A nap will put the bounce back.'
    : pet.cleanliness < 30 ? 'Time for a gentle brush.'
    : pet.happiness < 35 ? 'A cuddle or a game would help.'
    : 'All good. Just be here.';
  $('#sound').innerHTML = icon(pet.sound ? 'i-sound' : 'i-mute');
  $('#sound').setAttribute('aria-pressed', String(pet.sound));
  $('#sound').setAttribute('aria-label', pet.sound ? 'Turn sound off' : 'Turn sound on');
  $('#scene-hint').textContent = brain.mode === 'play' ? 'Steer the toy · hold it still near your kitten to tempt a pounce'
    : pet.sleeping ? 'Shh… tap Wake when it’s time to play'
    : 'Stroke your kitten to pet · drag the room to turn';
}

function showDeltas(before) {
  for (const n of NEEDS) {
    const d = Math.round(pet[n.key]) - Math.round(before[n.key]);
    if (!d) continue;
    const ring = $('#ring-' + n.key);
    const chip = document.createElement('span');
    chip.className = 'delta' + (d < 0 ? ' neg' : '');
    chip.textContent = (d > 0 ? '+' : '') + d;
    ring.append(chip);
    setTimeout(() => chip.remove(), 1700);
    if (d > 0) { ring.classList.remove('bump'); void ring.offsetWidth; ring.classList.add('bump'); }
  }
}

function moment(text, iconId = 'i-heart') {
  pet.journal.unshift({text, icon: iconId, time: Date.now()});
  pet.journal = pet.journal.slice(0, 12);
  renderJournal(true);
  save();
}
function renderJournal(fresh = false) {
  const list = $('#journal');
  list.replaceChildren();
  pet.journal.slice(0, 8).forEach((m, i) => {
    const id = LEGACY_ICONS[m.icon] || (String(m.icon).startsWith('i-') ? m.icon : 'i-heart');
    const li = document.createElement('li');
    li.className = 'moment' + (fresh && i === 0 ? ' new' : '');
    li.style.setProperty('--tint', `var(${ICON_TINT[id] || '--love'})`);
    const when = new Date(m.time);
    li.innerHTML = `<span class="moment-icon">${icon(id)}</span><div><strong></strong><small></small></div>`;
    li.querySelector('strong').textContent = m.text;
    li.querySelector('small').textContent = when.toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) + ' · ' + when.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
    list.append(li);
  });
  $('#journal-count').textContent = pet.journal.length;
}

// Speech bubble anchored above the kitten's head.
let speechTimer;
function say(text, ms = 4200) {
  $('#speech-text').textContent = text;
  $('#speech').classList.add('show');
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => $('#speech').classList.remove('show'), ms);
}

// Little floating hearts, sparkles and z's rising from the kitten.
const headScreen = {x: 0, y: 0};
function burst(kind = 'heart', count = 5, at = headScreen) {
  for (let k = 0; k < count; k++) {
    setTimeout(() => {
      const s = document.createElement('span');
      s.className = 'floating' + (kind === 'z' ? ' zzz' : '');
      if (kind === 'z') s.textContent = 'z';
      else s.innerHTML = icon(kind === 'sparkle' ? 'i-sparkle' : kind === 'note' ? 'i-sound' : 'i-heart');
      s.style.setProperty('--c', kind === 'sparkle' ? '#f6b73c' : kind === 'note' ? '#8f9cff' : '#f2689a');
      s.style.left = (at.x + rand(-40, 40)) + 'px';
      s.style.top = (at.y + rand(-10, 30)) + 'px';
      s.style.fontSize = (kind === 'z' ? rand(16, 26) : rand(16, 30)) + 'px';
      s.style.setProperty('--drift', rand(-60, 60) + 'px');
      s.style.setProperty('--r0', rand(-40, 40) + 'deg');
      s.style.setProperty('--r1', rand(-25, 25) + 'deg');
      $('#float-layer').append(s);
      setTimeout(() => s.remove(), 2000);
    }, k * 110);
  }
}

// ---------------------------------------------------------------------------
// Sound: small synthesized meows and purrs (no recorded audio is bundled).
// ---------------------------------------------------------------------------
let audio;
function audioCtx() {
  audio ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
  return audio;
}
function meow(kind = 'meow') {
  const dur = {chirp: .2, mew: .36, meow: .6, sleepy: .8}[kind] ?? .6;
  brain.mouthAnim = {start: clockNow, dur: dur + .08, peak: kind === 'chirp' ? .45 : kind === 'sleepy' ? .5 : .8};
  if (!pet.sound) return;
  try {
    const a = audioCtx(), t = a.currentTime + .02;
    const base = {chirp: 760, mew: 700, meow: 540, sleepy: 430}[kind] ?? 540;
    const o = a.createOscillator(), lfo = a.createOscillator(), lfoGain = a.createGain();
    const f1 = a.createBiquadFilter(), f2 = a.createBiquadFilter(), out = a.createGain(), g2 = a.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(base * .82, t);
    o.frequency.linearRampToValueAtTime(base * 1.32, t + dur * .32);
    o.frequency.exponentialRampToValueAtTime(base * .72, t + dur);
    lfo.frequency.value = 6.5; lfoGain.gain.value = base * .018;
    lfo.connect(lfoGain).connect(o.frequency);
    f1.type = f2.type = 'bandpass'; f1.Q.value = 5; f2.Q.value = 7;
    f1.frequency.setValueAtTime(650, t); f1.frequency.linearRampToValueAtTime(1150, t + dur * .4); f1.frequency.linearRampToValueAtTime(600, t + dur);
    f2.frequency.setValueAtTime(2700, t); f2.frequency.linearRampToValueAtTime(1800, t + dur * .5); f2.frequency.linearRampToValueAtTime(1100, t + dur);
    g2.gain.value = .55;
    o.connect(f1).connect(out); o.connect(f2).connect(g2).connect(out); out.connect(a.destination);
    out.gain.setValueAtTime(.0001, t);
    out.gain.exponentialRampToValueAtTime(.32, t + .05);
    out.gain.setValueAtTime(.32, t + dur * .55);
    out.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.start(t); lfo.start(t); o.stop(t + dur + .05); lfo.stop(t + dur + .05);
  } catch {}
}
function purr(seconds = 2.2) {
  if (!pet.sound) return;
  try {
    const a = audioCtx(), t = a.currentTime, len = Math.floor(a.sampleRate * seconds);
    const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = a.createBufferSource(), lp = a.createBiquadFilter(), am = a.createGain(), lfo = a.createOscillator(), depth = a.createGain(), out = a.createGain();
    src.buffer = buf; lp.type = 'lowpass'; lp.frequency.value = 420;
    am.gain.value = .5; lfo.frequency.value = 25; depth.gain.value = .5;
    lfo.connect(depth).connect(am.gain);
    src.connect(lp).connect(am).connect(out).connect(a.destination);
    out.gain.setValueAtTime(.0001, t);
    out.gain.exponentialRampToValueAtTime(.9, t + .35);
    out.gain.setValueAtTime(.9, t + seconds - .5);
    out.gain.exponentialRampToValueAtTime(.0001, t + seconds);
    src.start(t); lfo.start(t); src.stop(t + seconds); lfo.stop(t + seconds);
  } catch {}
}

// ---------------------------------------------------------------------------
// 3D room
// ---------------------------------------------------------------------------
const host = $('#scene');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.prepend(renderer.domElement);
} catch (e) {
  $('#loading strong').textContent = 'Your browser couldn’t open the 3D room.';
  $('#load-progress').textContent = 'Try a browser with WebGL enabled.';
  console.error(e);
}

const ambient = new THREE.HemisphereLight(0xfff4e2, 0xa89c8a, 2.3);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffe9c9, 3.4);
sun.position.set(-3, 6, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {left: -4, right: 4, top: 4, bottom: -4});
sun.shadow.bias = -.0005;
sun.shadow.normalBias = .02;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xfff2f6, 1.5);
rim.position.set(4, 3, -3);
scene.add(rim);
const moon = new THREE.DirectionalLight(0x9fb4ff, 0);
moon.position.set(-3, 4, 4);
scene.add(moon);
const lamp = new THREE.PointLight(0xffb36b, 0, 6, 1.6);
lamp.position.set(1.6, 1.4, 1.6);
scene.add(lamp);

const mat = (color, roughness = .85) => new THREE.MeshStandardMaterial({color, roughness});
function mesh(geo, material, parent = scene) {
  const o = new THREE.Mesh(geo, material);
  o.castShadow = true; o.receiveShadow = true;
  parent.add(o);
  return o;
}
const DAY = {floor: new THREE.Color('#eadfce'), wall: new THREE.Color('#f3ebdf'), rug: new THREE.Color('#b9c8a6'), glass: new THREE.Color('#e3eedb')};
const NIGHT = {floor: new THREE.Color('#2a3150'), wall: new THREE.Color('#283055'), rug: new THREE.Color('#3f4f6b'), glass: new THREE.Color('#5d6fa8')};
const floorMat = mat('#eadfce'), wallMat = mat('#f3ebdf', .95), rugMat = mat('#b9c8a6', .95);
const floor = mesh(new THREE.PlaneGeometry(200, 200), floorMat);
floor.rotation.x = -Math.PI / 2; floor.position.y = -.026;
const rug = mesh(new THREE.CylinderGeometry(2.1, 2.1, .035, 96), rugMat);
rug.scale.z = .8; rug.position.set(0, -.005, .15);
const rugRim = mesh(new THREE.TorusGeometry(2.0, .012, 6, 96), mat('#dfe6d2'));
rugRim.rotation.x = -Math.PI / 2; rugRim.scale.y = .8; rugRim.position.set(0, .016, .15);
const wall = mesh(new THREE.PlaneGeometry(40, 14), wallMat);
wall.position.set(0, 5, -3.5);
mesh(new THREE.BoxGeometry(40, .16, .08), mat('#e2d6c4')).position.set(0, .06, -3.44);

const windowFrame = new THREE.Group();
windowFrame.position.set(-2.5, 2.2, -3.43);
scene.add(windowFrame);
const glass = mesh(new THREE.PlaneGeometry(1.8, 2.2), new THREE.MeshBasicMaterial({color: 0xe3eedb}), windowFrame);
for (const x of [-.97, 0, .97]) mesh(new THREE.BoxGeometry(.075, 2.4, .08), mat('#fffaf0'), windowFrame).position.set(x, 0, .03);
for (const y of [-1.16, 0, 1.16]) mesh(new THREE.BoxGeometry(2, .075, .08), mat('#fffaf0'), windowFrame).position.set(0, y, .03);
const sunPatch = mesh(new THREE.PlaneGeometry(1.9, 2.5), new THREE.MeshBasicMaterial({color: 0xfff1c4, transparent: true, opacity: .3, depthWrite: false}));
sunPatch.rotation.set(-Math.PI / 2, 0, -.2); sunPatch.position.set(-1.6, .006, -.9); sunPatch.castShadow = sunPatch.receiveShadow = false;

// Food bowl, close enough for the kitten to lean into.
const bowl = new THREE.Group();
bowl.position.set(1.3, .1, .9);
scene.add(bowl);
mesh(new THREE.CylinderGeometry(.3, .24, .16, 48, 1, true), new THREE.MeshStandardMaterial({color: 0xf08f6a, side: THREE.DoubleSide, roughness: .4}), bowl);
const bowlRim = mesh(new THREE.TorusGeometry(.295, .032, 12, 48), mat('#ffd2bd', .4), bowl);
bowlRim.rotation.x = Math.PI / 2; bowlRim.position.y = .075;
mesh(new THREE.CylinderGeometry(.24, .21, .03, 32), mat('#f6e2d2'), bowl).position.y = -.04;
const kibbles = [];
for (let i = 0; i < 18; i++) {
  const k = mesh(new THREE.SphereGeometry(.03, 7, 5), mat(i % 3 ? '#a8763f' : '#c99257'), bowl);
  const a = i * 2.4, r = .19 * Math.sqrt((i + 1) / 18);
  k.position.set(Math.cos(a) * r, -.01 + (i % 4) * .008, Math.sin(a) * r);
  k.visible = false;
  kibbles.push(k);
}

const cushion = mesh(new THREE.CylinderGeometry(.8, .78, .19, 48), mat('#e7c9b3'));
cushion.scale.z = .63; cushion.position.set(1.7, .075, -1.7);

const bag = new THREE.Group();
bag.position.set(-1.9, .02, -1.4); bag.rotation.y = .25;
scene.add(bag);
const paper = mat('#c89a6c');
mesh(new THREE.BoxGeometry(.75, .035, .55), paper, bag);
for (const x of [-.375, .375]) mesh(new THREE.BoxGeometry(.02, .86, .55), paper, bag).position.set(x, .43, 0);
for (const z of [-.275, .275]) mesh(new THREE.BoxGeometry(.75, .86, .02), paper, bag).position.set(0, .43, z);

// Toy ball.
const TOY_HOME = new THREE.Vector3(-1.15, .13, 1.35);
const toy = mesh(new THREE.SphereGeometry(.12, 28, 18), mat('#f2689a', .55));
toy.position.copy(TOY_HOME);
mesh(new THREE.TorusGeometry(.121, .012, 6, 32), mat('#ffe2a8'), toy).rotation.x = .6;
mesh(new THREE.TorusGeometry(.121, .012, 6, 32), mat('#ffe2a8'), toy).rotation.y = 1.2;
const toyTarget = TOY_HOME.clone(), toyVel = new THREE.Vector3(), toyLast = toy.position.clone();

// Grooming brush (shown while brushing).
const brushRig = new THREE.Group();
const brushTool = new THREE.Group();
mesh(new THREE.BoxGeometry(.34, .07, .16), mat('#ffb48f', .5), brushTool);
const bristles = mesh(new THREE.BoxGeometry(.3, .07, .13), mat('#fff6ea', .9), brushTool);
bristles.position.y = -.07;
const handle = mesh(new THREE.CylinderGeometry(.03, .035, .32, 12), mat('#ffb48f', .5), brushTool);
handle.rotation.z = Math.PI / 2; handle.position.set(.32, .02, 0);
brushTool.scale.setScalar(0);
brushRig.add(brushTool);

const catPivot = new THREE.Group();
scene.add(catPivot);
catPivot.add(brushRig);

// Soft contact shadow so the kitten feels grounded.
const shadowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(60,40,25,.45)'); grd.addColorStop(1, 'rgba(60,40,25,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const contact = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.7), new THREE.MeshBasicMaterial({map: shadowTex, transparent: true, depthWrite: false}));
contact.rotation.x = -Math.PI / 2; contact.position.y = .02;
catPivot.add(contact);

// ---------------------------------------------------------------------------
// Kitten
// ---------------------------------------------------------------------------
let model = null, kitten = null, face = null, ready = false, baseY = 0, baseScale = 1;
const bones = {};
const proxies = [];

new GLTFLoader().load('./assets/kitten.glb', gltf => {
  model = gltf.scene;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  baseScale = 1.75 / size.y;
  model.scale.setScalar(baseScale);
  model.position.set(-center.x * baseScale, -bounds.min.y * baseScale, -center.z * baseScale);
  baseY = model.position.y;
  catPivot.add(model);
  model.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true; o.receiveShadow = true;
      if (o.material) { o.material.metalness = 0; o.material.roughness = .86; }
      if (o.isSkinnedMesh) kitten = o;
    }
    if (o.isBone) bones[o.name] = {node: o, base: o.quaternion.clone()};
  });
  face = createFace(kitten);
  // Cheap invisible colliders for petting instead of raycasting 600k triangles.
  const hidden = new THREE.MeshBasicMaterial({visible: false});
  const head = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 8), hidden);
  head.position.set(0, 1.25, .7);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), hidden);
  body.position.set(0, .72, -.05); body.scale.set(.82, .74, 1.1);
  kitten.parent.add(head, body);
  proxies.push(head, body);
  ready = true;
  host.classList.add('ready');
  $('#loading').classList.add('done');
  setTimeout(() => $('#loading').hidden = true, 900);
  greet(true);
}, p => {
  if (p.total) {
    const pct = Math.round(p.loaded / p.total * 100);
    $('#load-fill').style.width = pct + '%';
    $('#load-progress').textContent = pct + '% · bringing your kitten home';
  }
}, e => {
  $('#loading strong').textContent = 'Your kitten couldn’t load.';
  $('#load-progress').textContent = 'Please reload to try again.';
  console.error(e);
});

// ---------------------------------------------------------------------------
// Behaviour: expressions, gaze, blinks, ears and body language
// ---------------------------------------------------------------------------
let clockNow = 0;
const brain = {
  mode: 'idle', modeStart: 0, modeUntil: 0,
  override: null, overrideUntil: 0,
  face: {...EXPRESSIONS.content},
  blinkAt: 0, nextBlink: 1.5, blinkDouble: false,
  slowBlinkAt: -10,
  mouthAnim: null, chewUntil: 0, yawnAt: -10,
  hopAt: -10, kneadUntil: 0, strokeUntil: 0,
  gaze: new THREE.Vector3(0, 1.2, 4), glance: null, glanceUntil: 0,
  head: {yaw: 0, pitch: 0, roll: 0}, look: new THREE.Vector2(),
  ears: {r: 0, l: 0, vr: 0, vl: 0, perk: 0},
  nextIdle: 5, nextZ: 0, nextTwitch: 3,
  pointerAt: -10, pointerWorld: new THREE.Vector3(),
  pounce: null, pounceReadyAt: 0, stillSince: 0, catches: 0, playEnd: 0,
  bodyTurn: 0, lean: 0, offset: new THREE.Vector3(),
};

function express(name, seconds) { brain.override = name; brain.overrideUntil = clockNow + seconds; }
function hop() { if (!reduceMotion) brain.hopAt = clockNow; }
function slowBlink() { brain.slowBlinkAt = clockNow; }
function yawn() { brain.yawnAt = clockNow; }
function glanceAt(point, seconds) { brain.glance = point.clone(); brain.glanceUntil = clockNow + seconds; }
function twitchEar(side = Math.random() < .5 ? 'r' : 'l', strength = 1) { brain.ears['v' + side] += (Math.random() < .5 ? -9 : 7) * strength; }

function baseExpression() {
  if (pet.sleeping) return 'asleep';
  if (pet.energy < 25) return 'sleepy';
  if (pet.food < 25) return 'hungry';
  if (pet.cleanliness < 30) return 'grumpy';
  if (pet.happiness < 35) return 'lonely';
  return 'content';
}
function currentExpression() {
  if (clockNow < brain.overrideUntil) return brain.override;
  if (brain.mode === 'feed') return clockNow - brain.modeStart < .9 ? 'curious' : 'yum';
  if (brain.mode === 'brush') return 'bliss';
  if (brain.mode === 'play') return 'excited';
  if (clockNow < brain.strokeUntil) return 'bliss';
  return baseExpression();
}

function greet(first = false) {
  if (!ready) return;
  if (pet.sleeping) { say(pick(['Zzz… dreaming of tiny adventures.', 'Zzz… mrrp… fish…']), 3800); return; }
  express('surprised', .55);
  brain.ears.perk = 1;
  setTimeout(() => { express('joy', 1.6); hop(); meow('mew'); burst('heart', 4); }, 550);
  const lines = pet.food < 25 ? [`You’re back! Is it… snack o’clock?`] : pet.happiness < 35 ? ['There you are! I missed you.'] : first ? ['Oh! Hi, you! Got a little time for me?', 'Mrrp! You came back!', 'Hello, my favourite human.'] : ['Welcome back!', 'Mrrp! There you are.'];
  setTimeout(() => say(pick(lines)), 400);
}

const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpM = new THREE.Matrix4(), tmpE = new THREE.Euler(), invMesh = new THREE.Matrix4();
const EYE_LOCAL = new THREE.Vector3(0, 1.16, .93), HEAD_TOP = new THREE.Vector3(0, 1.66, .78);
const q = new THREE.Quaternion(), AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
function boneRot(name, axis, angle) {
  const b = bones[name];
  if (b) b.node.quaternion.multiply(q.setFromAxisAngle(axis, angle));
}

function updateKitten(dt, t) {
  const f = brain.face, ex = EXPRESSIONS[currentExpression()] || EXPRESSIONS.content;
  for (const k in ex) f[k] = damp(f[k], ex[k], k === 'mouth' ? 12 : 7, dt);

  // --- Blinks ---------------------------------------------------------------
  let open = f.open, happy = f.happy, mouth = f.mouth, earBack = f.earBack, earOut = f.earOut;
  if (t > brain.nextBlink && !pet.sleeping) {
    brain.blinkAt = t;
    brain.blinkDouble = Math.random() < .2;
    brain.nextBlink = t + rand(2.2, 5.5);
  }
  const bp = (t - brain.blinkAt) / .17;
  let shut = bp < 0 ? 0 : bp < .45 ? bp / .45 : bp < 1 ? 1 - (bp - .45) / .55 : 0;
  if (brain.blinkDouble && bp >= 1.25 && bp < 2.25) { const b2 = bp - 1.25; shut = b2 < .45 ? b2 / .45 : 1 - (b2 - .45) / .55; }
  const sb = (t - brain.slowBlinkAt) / 2.0;
  if (sb >= 0 && sb < 1) { shut = Math.max(shut, Math.sin(Math.PI * Math.min(1, sb * 1.25)) ** .6); happy = Math.max(happy, .6); }
  open *= 1 - shut;

  // --- Mouth: meows, chewing, yawns ------------------------------------------
  const m = brain.mouthAnim;
  if (m) {
    const p = (t - m.start) / m.dur;
    if (p >= 1) brain.mouthAnim = null;
    else mouth = Math.max(mouth, Math.sin(Math.PI * p) ** .7 * m.peak);
  }
  if (t < brain.chewUntil) mouth = Math.max(mouth, .1 + .16 * (.5 + .5 * Math.sin(t * 15)));
  const yp = (t - brain.yawnAt) / 2.1;
  let yawnPitch = 0;
  if (yp >= 0 && yp < 1) {
    const y = Math.sin(Math.PI * yp) ** 1.4;
    mouth = Math.max(mouth, y);
    open = Math.min(open, 1 - y);
    happy = Math.max(happy, y * .4);
    earBack += y * .35;
    yawnPitch = y * .28;
  }

  // --- Gaze ----------------------------------------------------------------------
  let gazeTarget;
  if (brain.mode === 'play') gazeTarget = toy.position;
  else if (brain.mode === 'feed') gazeTarget = tmpV2.copy(bowl.position).setY(.05);
  else if (brain.mode === 'brush') gazeTarget = camera.position;
  else if (t - brain.pointerAt < 2.2) gazeTarget = brain.pointerWorld;
  else if (brain.glance && t < brain.glanceUntil) gazeTarget = brain.glance;
  else gazeTarget = camera.position;
  brain.gaze.x = damp(brain.gaze.x, gazeTarget.x, 9, dt);
  brain.gaze.y = damp(brain.gaze.y, gazeTarget.y, 9, dt);
  brain.gaze.z = damp(brain.gaze.z, gazeTarget.z, 9, dt);

  catPivot.updateMatrixWorld(true);
  invMesh.copy(kitten.matrixWorld).invert();
  const local = tmpV.copy(brain.gaze).applyMatrix4(invMesh).sub(EYE_LOCAL);
  const wantYaw = Math.atan2(local.x, Math.max(.15, local.z));
  const wantPitch = Math.atan2(local.y, Math.hypot(local.x, local.z));
  let yaw = clamp(wantYaw * .7, -.6, .6), pitch = clamp(wantPitch * .6, -.32, .3), roll = 0;

  const e = currentExpression();
  const idleSway = motion * (pet.sleeping ? .5 : 1);
  roll += Math.sin(t * .7) * .035 * idleSway;
  yaw += Math.sin(t * .43) * .04 * idleSway;
  if (e === 'curious') roll += .2;
  if (e === 'bliss') { roll += .16; pitch += .12; }
  if (e === 'joy') roll += Math.sin(t * 2.4) * .08;
  if (e === 'sleepy') { pitch -= .1; roll += .1; }
  if (e === 'lonely' || e === 'hungry') pitch -= .06;
  if (pet.sleeping) { yaw = .1; pitch = -.3; roll = .2 + Math.sin(t * .4) * .03; }
  if (brain.mode === 'feed' && t - brain.modeStart > .9 && t < brain.modeUntil - 1) pitch = -.5 + Math.sin(t * 7) * .03;
  pitch += yawnPitch;
  const headRate = brain.mode === 'play' ? 7 : 4;
  brain.head.yaw = damp(brain.head.yaw, yaw, headRate, dt);
  brain.head.pitch = damp(brain.head.pitch, pitch, headRate, dt);
  brain.head.roll = damp(brain.head.roll, roll, 3, dt);
  const lookX = pet.sleeping ? 0 : clamp((wantYaw - brain.head.yaw) / .45, -1, 1);
  const lookY = pet.sleeping ? 0 : clamp((wantPitch - brain.head.pitch) / .35, -1, 1);
  brain.look.x = damp(brain.look.x, lookX, 16, dt);
  brain.look.y = damp(brain.look.y, lookY, 16, dt);

  // --- Ears: posture + springy twitches ---------------------------------------
  if (t > brain.nextTwitch) {
    brain.nextTwitch = t + rand(3, 9);
    twitchEar(undefined, pet.sleeping ? .6 : 1);
    if (Math.random() < .3) setTimeout(() => twitchEar(undefined, .7), 180);
  }
  const ears = brain.ears;
  for (const s of ['r', 'l']) {
    ears['v' + s] += (-160 * ears[s] - 9 * ears['v' + s]) * dt;
    ears[s] += ears['v' + s] * dt;
  }
  ears.perk = damp(ears.perk, 0, 1.5, dt);
  earBack -= ears.perk * .2;
  tmpE.set(-(earBack + ears.r * .5), 0, -(earOut + ears.r * .25));
  face.pkEarRotR.value.setFromMatrix4(tmpM.makeRotationFromEuler(tmpE));
  tmpE.set(-(earBack + ears.l * .5), 0, earOut + ears.l * .25);
  face.pkEarRotL.value.setFromMatrix4(tmpM.makeRotationFromEuler(tmpE));
  tmpE.set(-brain.head.pitch, brain.head.yaw, brain.head.roll, 'YXZ');
  face.pkHeadRot.value.setFromMatrix4(tmpM.makeRotationFromEuler(tmpE));
  tmpE.order = 'XYZ';

  face.pkOpen.value = clamp(open, 0, 1);
  face.pkHappy.value = clamp(happy, 0, 1);
  face.pkPupil.value = f.pupil;
  face.pkLook.value.copy(brain.look);
  face.pkMouthOpen.value = clamp(mouth, 0, 1);
  face.pkSmile.value = f.smile * (1 - clamp(mouth * 3, 0, 1));
  face.pkBlush.value = f.blush;
  face.pkSparkle.value = f.sparkle;
  face.pkGlow.value = document.body.classList.contains('night') ? .25 : 0;

  // --- Body: breathing, hops, kneading, posture ------------------------------
  for (const b of Object.values(bones)) b.node.quaternion.copy(b.base);
  const breath = Math.sin(t * (pet.sleeping ? 1.3 : 2.3)) * (pet.sleeping ? .014 : .006) * (reduceMotion ? .5 : 1);
  let sy = 1 + breath, sxz = 1 - breath * .4, lift = 0;
  const hp = (t - brain.hopAt) / .62;
  if (hp >= 0 && hp < 1) {
    if (hp < .22) { const c = Math.sin(hp / .22 * Math.PI); sy -= c * .06; sxz += c * .03; }
    else if (hp < .78) { const a = Math.sin((hp - .22) / .56 * Math.PI); lift = a * .16; sy += a * .04; sxz -= a * .02; }
    else { const c = Math.sin((hp - .78) / .22 * Math.PI); sy -= c * .05; sxz += c * .025; }
  }
  if (t < brain.kneadUntil || brain.mode === 'brush' || t < brain.strokeUntil) {
    boneRot('Bone_017', AX, -.24 * Math.max(0, Math.sin(t * 6)) * motion);
    boneRot('Bone_021', AX, -.24 * Math.max(0, Math.sin(t * 6 + Math.PI)) * motion);
  }
  let chestDip = 0, wiggle = 0, stretch = 0;
  if (pet.sleeping) chestDip = .1;
  if (brain.mode === 'feed' && t - brain.modeStart > .7 && t < brain.modeUntil - .8) chestDip = .2;
  if (yp >= 0 && yp < 1) chestDip -= Math.sin(Math.PI * yp) * .1;
  const pc = brain.pounce;
  let lunge = 0;
  if (pc) {
    const p = (t - pc.start) / 1.35;
    if (p >= 1) brain.pounce = null;
    else if (p < .5) { chestDip = .16 * Math.min(1, p / .15); wiggle = Math.sin(t * 22) * .05 * Math.min(1, p / .2); }
    else if (p < .72) { const a = (p - .5) / .22; lunge = Math.sin(a * Math.PI / 2); chestDip = .16 - .3 * a; stretch = a * .06; lift = Math.sin(a * Math.PI) * .18; if (!pc.caught && a > .6) catchToy(); }
    else { const a = (p - .72) / .28; lunge = 1 - a * a * (3 - 2 * a); chestDip = -.14 * (1 - a); }
  }
  boneRot('Bone_011', AX, chestDip * motion);
  bones.Bone_000 && bones.Bone_000.node.quaternion.multiply(q.setFromAxisAngle(AY, wiggle * motion));

  model.scale.set(baseScale * sxz, baseScale * sy, baseScale * (sxz + stretch));
  model.position.y = baseY + lift * motion;

  // Body turns toward what it cares about; the user's drag adds on top.
  let turn = 0;
  if (brain.mode === 'play') turn = clamp(Math.atan2(toy.position.x, toy.position.z + .4) * .6, -.75, .75);
  if (brain.mode === 'feed') turn = .55;
  brain.bodyTurn = damp(brain.bodyTurn, turn, 2.5, dt);
  const offTarget = tmpV2.set(0, 0, 0);
  if (brain.mode === 'feed') offTarget.set(.42, 0, .22);
  if (pc) offTarget.set(pc.dir.x * lunge * pc.reach, 0, pc.dir.z * lunge * pc.reach);
  brain.offset.x = damp(brain.offset.x, offTarget.x, pc ? 18 : 3, dt);
  brain.offset.z = damp(brain.offset.z, offTarget.z, pc ? 18 : 3, dt);
  catPivot.position.set(brain.offset.x, 0, brain.offset.z);
  catPivot.rotation.y = view.angle + brain.bodyTurn;

  // Screen anchor above the head for speech and particles.
  const top = tmpV.copy(HEAD_TOP).sub(face.pkHeadPivot.value).applyMatrix3(face.pkHeadRot.value).add(face.pkHeadPivot.value);
  top.applyMatrix4(kitten.matrixWorld).project(camera);
  headScreen.x = (top.x * .5 + .5) * host.clientWidth;
  headScreen.y = (-top.y * .5 + .5) * host.clientHeight;
}

// Little unprompted behaviours that make the kitten feel alive.
function idleLife(t) {
  if (pet.sleeping) {
    if (t > brain.nextZ) { brain.nextZ = t + rand(2.2, 3.4); burst('z', 1); }
    return;
  }
  if (brain.mode !== 'idle' || t < brain.nextIdle || t - brain.pointerAt < 3) return;
  brain.nextIdle = t + rand(4, 9);
  const options = ['glance', 'glance', 'twitch', 'tilt'];
  if (pet.happiness > 60) options.push('slowBlink');
  if (pet.energy < 55) options.push('yawn', 'yawn');
  if (pet.food < 40) options.push('bowl', 'bowl');
  if (pet.happiness > 50) options.push('meow');
  const choice = pick(options);
  if (choice === 'glance') glanceAt(new THREE.Vector3(rand(-3, 3), rand(.2, 2.4), rand(-.5, 2.5)), rand(1.2, 2.6));
  if (choice === 'twitch') { twitchEar('r'); setTimeout(() => twitchEar('l'), 140); }
  if (choice === 'tilt') { express('curious', 1.8); brain.ears.perk = 1; }
  if (choice === 'slowBlink') slowBlink();
  if (choice === 'yawn') { yawn(); if (Math.random() < .5) setTimeout(() => say(pick(['*yawn*… so cozy.', 'Mmm… nap soon?'])), 900); }
  if (choice === 'bowl') { glanceAt(bowl.position, 2.2); setTimeout(() => say(pick(['Is it snack o’clock?', 'That bowl looks very empty…'])), 600); }
  if (choice === 'meow') { meow(pick(['mew', 'chirp'])); if (Math.random() < .5) say(pick(['Mrrp?', 'Mew!', 'I like it here. With you.'])); }
}

// ---------------------------------------------------------------------------
// Care actions
// ---------------------------------------------------------------------------
function setMode(mode, seconds) {
  brain.mode = mode;
  brain.modeStart = clockNow;
  brain.modeUntil = clockNow + seconds;
  host.classList.toggle('playing', mode === 'play');
  refresh();
}

let lastPet = -10;
function act(a, opts = {}) {
  advance(pet);
  if (!ready && a !== 'sleep') { toast('Your kitten is still settling in. One moment.'); return false; }
  if (brain.mode === 'play' && a !== 'sleep' && a !== 'pet') { toast('Playtime is in progress. Move the toy around!'); return false; }
  if ((brain.mode === 'feed' || brain.mode === 'brush') && a !== 'sleep' && a !== 'pet') { toast('One thing at a time — almost done!'); return false; }
  if (a === 'pet' && clockNow - lastPet < .9) return false;
  if (pet.sleeping && a === 'pet') {
    twitchEar(undefined, .8);
    say(pick(['Mmm… five more minutes.', 'Zzz… *happy mumble*']), 2600);
    return false;
  }
  const before = {...pet};
  const r = care(pet, a, opts.snack);
  if (!r.ok) {
    toast(r.message);
    if (a === 'feed') { express('content', 1); twitchEar(); say('I’m stuffed, thank you!'); }
    if (a === 'play') { yawn(); say('Too sleepy to play…'); }
    return false;
  }
  showDeltas(before);
  const t = clockNow;
  if (a === 'feed') {
    const name = {kibble: 'crunchy kibble', salmon: 'salmon bites', chicken: 'chicken morsels'}[opts.snack] || 'crunchy kibble';
    kibbles.forEach(k => k.visible = true);
    setMode('feed', 4.8);
    brain.chewUntil = t + 3.8;
    meow('chirp');
    say(pick([`Mmm, ${name}! You know the way to my heart.`, `${name[0].toUpperCase() + name.slice(1)}?! Best. Human. Ever.`]));
    setTimeout(() => burst('sparkle', 5), 1200);
    moment(`A happy tummy, thanks to ${name}.`, 'i-bowl');
  } else if (a === 'brush') {
    setMode('brush', 3.6);
    purr(3.4);
    say(pick(['Oh, that’s the spot… fluffy again!', 'Mmm. Brush the cheeks too, please.']));
    setTimeout(() => burst('sparkle', 6), 900);
    moment('Freshly brushed & feeling fabulous.', 'i-brush');
  } else if (a === 'play') {
    startPlay();
    moment('A little mischief. A lot of fun.', 'i-yarn');
  } else if (a === 'sleep') {
    endPlay(true);
    brain.mode = 'idle';
    if (pet.sleeping) {
      yawn();
      setTimeout(() => meow('sleepy'), 300);
      say('Zzz… dreaming of tiny adventures.');
      moment('Tucked in for sweet little dreams.', 'i-moon');
    } else {
      express('sleepy', 1.6);
      setTimeout(() => { yawn(); }, 200);
      setTimeout(() => { express('joy', 1.2); hop(); meow('mew'); }, 2300);
      say('Good morning, my favourite human.');
      moment('Hello again, sleepyhead.', 'i-sun');
    }
  } else if (a === 'pet') {
    lastPet = t;
    express(opts.stroke ? 'bliss' : 'joy', 2.2);
    if (!opts.stroke) hop();
    brain.kneadUntil = t + 2.4;
    purr(2.2);
    burst('heart', opts.stroke ? 3 : 5, opts.at || headScreen);
    if (!opts.quiet) say(pick(['I like it here. Especially with you.', 'More of that, please.', 'You have excellent petting skills.', 'Purrrr…', 'Right behind the ears. Perfect.']), 3000);
    if (pet.bond >= 15 && Math.random() < .45) setTimeout(slowBlink, 2300);
    if (pet.cuddles % 5 === 0) moment(`${pet.cuddles} cuddles. One very happy cat.`, 'i-heart');
  }
  refresh();
  save();
  return true;
}

// Play: steer the toy, tempt a pounce.
const PLAY_SECONDS = 20;
function startPlay() {
  setMode('play', PLAY_SECONDS);
  brain.playEnd = clockNow + PLAY_SECONDS;
  brain.catches = 0;
  brain.stillSince = clockNow;
  brain.pounceReadyAt = clockNow + 1.2;
  toyTarget.set(.2, .13, 1.6);
  $('#play-meter').hidden = false;
  $('#play-score').textContent = '0 catches';
  express('surprised', .4);
  brain.ears.perk = 1;
  meow('chirp');
  say('Catch me if you can! Steer the toy around.');
}
function endPlay(silent = false) {
  if (brain.mode !== 'play') return;
  brain.mode = 'idle';
  brain.pounce = null;
  host.classList.remove('playing');
  $('#play-meter').hidden = true;
  toyTarget.copy(TOY_HOME);
  if (!silent) {
    const n = brain.catches;
    express('joy', 2);
    hop();
    burst('sparkle', 6);
    say(n ? `That was fun! ${n} catch${n === 1 ? '' : 'es'}. Same time tomorrow?` : 'That was fun. Same time tomorrow?');
    toast(`Playtime complete · ${n} catch${n === 1 ? '' : 'es'} · joy +18`);
    if (n >= 3) moment(`Pounce champion: ${n} catches!`, 'i-yarn');
  }
  refresh();
}
function catchToy() {
  const pc = brain.pounce;
  if (!pc || pc.caught) return;
  pc.caught = true;
  brain.catches++;
  $('#play-score').textContent = `${brain.catches} catch${brain.catches === 1 ? '' : 'es'}`;
  burst('sparkle', 4, toyScreen());
  meow('chirp');
  // The toy squirts away from the paws.
  const a = rand(-1.2, 1.2);
  toyTarget.set(clamp(toy.position.x + Math.sin(a) * 1.2, -1.8, 1.8), .13, clamp(toy.position.z + Math.cos(a) * .9, .9, 2));
  toy.position.lerp(toyTarget, .35);
  brain.stillSince = clockNow + 1;
  setTimeout(() => express('joy', 1), 300);
}
function toyScreen() {
  const p = toy.position.clone().project(camera);
  return {x: (p.x * .5 + .5) * host.clientWidth, y: (-p.y * .5 + .5) * host.clientHeight};
}
function updatePlay(dt, t) {
  if (brain.mode !== 'play') {
    toy.position.x = damp(toy.position.x, toyTarget.x, 4, dt);
    toy.position.z = damp(toy.position.z, toyTarget.z, 4, dt);
    return;
  }
  const remaining = brain.playEnd - t;
  $('#play-fill').style.transform = `scaleX(${clamp(remaining / PLAY_SECONDS, 0, 1)})`;
  if (remaining <= 0) { endPlay(); return; }
  toy.position.x = damp(toy.position.x, toyTarget.x, 10, dt);
  toy.position.z = damp(toy.position.z, toyTarget.z, 10, dt);
  toyVel.subVectors(toy.position, toyLast).divideScalar(Math.max(dt, 1e-3));
  toyLast.copy(toy.position);
  toy.rotation.x += toyVel.z * dt / .12;
  toy.rotation.z -= toyVel.x * dt / .12;
  if (toyVel.length() > .35) brain.stillSince = t;
  if (brain.pounce || t < brain.pounceReadyAt) return;
  const dx = toy.position.x - catPivot.position.x, dz = toy.position.z - catPivot.position.z;
  const dist = Math.hypot(dx, dz);
  const still = t - brain.stillSince;
  // Close and still for a moment → wiggle and pounce. Fast swishes nearby also tempt one.
  if ((dist < 2.1 && still > .7) || (dist < 1.6 && toyVel.length() > 2.5 && Math.random() < dt * 1.5)) {
    const dir = new THREE.Vector3(dx, 0, dz).normalize();
    brain.pounce = {start: t, dir, reach: clamp(dist - 1.05, 0, .7), caught: false};
    brain.pounceReadyAt = t + 2;
    express('excited', 1.4);
  }
}

// ---------------------------------------------------------------------------
// Input: stroke the kitten, drag to turn, steer the toy, look at the pointer
// ---------------------------------------------------------------------------
const view = {angle: 0, target: 0, lastDrag: -10, zoom: 0, zoomTarget: 0};
const pointer = new THREE.Vector2(), ray = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.13);
const gazePlane = new THREE.Plane();
let gesture = null;

function setPointer(e) {
  const r = host.getBoundingClientRect();
  pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(pointer, camera);
  return r;
}
function hitsCat() { return ready && ray.intersectObjects(proxies, false).length > 0; }
function trackPointer(e) {
  const r = setPointer(e);
  brain.pointerAt = clockNow;
  gazePlane.setFromNormalAndCoplanarPoint(tmpV.subVectors(camera.position, catPivot.position).setY(0).normalize(), tmpV2.set(0, 1.2, 1.6));
  ray.ray.intersectPlane(gazePlane, brain.pointerWorld);
  if (brain.mode === 'play') {
    const hit = new THREE.Vector3();
    if (ray.ray.intersectPlane(groundPlane, hit)) toyTarget.set(clamp(hit.x, -2, 2), .13, clamp(hit.z, -.4, 2.1));
  }
  return r;
}

host.addEventListener('pointerdown', e => {
  if (e.target.closest('button, .hud, .dock, dialog')) return;
  const r = trackPointer(e);
  host.setPointerCapture(e.pointerId);
  const onCat = brain.mode !== 'play' && hitsCat();
  gesture = {x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, angle: view.target, moved: false, onCat, stroke: 0, rect: r};
  if (onCat) host.classList.add('stroking');
});
host.addEventListener('pointermove', e => {
  if (e.target.closest('.hud, .dock')) return;
  trackPointer(e);
  if (!gesture) {
    if (e.pointerType === 'mouse') host.classList.toggle('over-cat', brain.mode !== 'play' && hitsCat());
    return;
  }
  const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
  if (Math.abs(dx) + Math.abs(dy) > 8) gesture.moved = true;
  if (gesture.onCat) {
    const step = Math.hypot(e.clientX - gesture.lastX, e.clientY - gesture.lastY);
    gesture.stroke += step;
    if (!pet.sleeping && step > 1) brain.strokeUntil = clockNow + .5;
    if (gesture.stroke > 240) {
      gesture.stroke = 0;
      act('pet', {stroke: true, quiet: clockNow - lastPet < 6, at: {x: e.clientX - gesture.rect.left, y: e.clientY - gesture.rect.top}});
    }
  } else if (brain.mode !== 'play') {
    view.target = gesture.angle + dx * .008;
    view.lastDrag = clockNow;
    host.classList.add('dragging');
  }
  gesture.lastX = e.clientX; gesture.lastY = e.clientY;
});
function endGesture(e) {
  if (gesture && !gesture.moved && gesture.onCat) act('pet', {at: {x: e.clientX - gesture.rect.left, y: e.clientY - gesture.rect.top}});
  gesture = null;
  host.classList.remove('stroking', 'dragging');
}
host.addEventListener('pointerup', endGesture);
host.addEventListener('pointercancel', () => { gesture = null; host.classList.remove('stroking', 'dragging'); });
host.addEventListener('pointerleave', () => host.classList.remove('over-cat'));

$('.dock').addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const a = b.dataset.action;
  if (pet.sleeping && a !== 'sleep') { toast('Shh… wake your kitten first.'); twitchEar(); return; }
  if (a === 'feed') {
    if (brain.mode !== 'idle') { toast('One thing at a time — almost done!'); return; }
    $('#feed-dialog').showModal();
  } else act(a);
});
$('.snacks').addEventListener('click', e => {
  const b = e.target.closest('[data-snack]');
  if (b) { $('#feed-dialog').close(); act('feed', {snack: b.dataset.snack}); }
});
$('#rename').onclick = () => { $('#name-input').value = pet.name; $('#name-dialog').showModal(); $('#name-input').select(); };
$('#close-name').onclick = () => $('#name-dialog').close();
$('#name-form').onsubmit = e => {
  e.preventDefault();
  const name = $('#name-input').value.trim();
  if (!name) return;
  pet.name = name.slice(0, 24);
  moment('A name to love: ' + pet.name + '.', 'i-heart');
  refresh();
  $('#name-dialog').close();
  toast('Hello, ' + pet.name);
  if (ready && !pet.sleeping) { express('joy', 1.6); hop(); meow('mew'); say(`${pet.name}? I love it!`); }
};
$('#sound').onclick = () => {
  pet.sound = !pet.sound;
  refresh(); save();
  if (pet.sound) { meow('mew'); brain.ears.perk = 1; }
};
$('#view').onclick = () => { view.target += Math.PI / 3; view.lastDrag = clockNow; };
$('#zoom').onclick = () => {
  view.zoomTarget = view.zoomTarget ? 0 : 1;
  $('#zoom').setAttribute('aria-pressed', String(!!view.zoomTarget));
  $('#zoom').setAttribute('aria-label', view.zoomTarget ? 'Show the whole room' : 'Close-up on face');
};
$('.tabs').onclick = e => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  for (const x of $('.tabs').querySelectorAll('button')) { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', String(x === b)); }
  $('#journal').hidden = b.dataset.tab !== 'journal';
  $('#guide').hidden = b.dataset.tab !== 'guide';
};
for (const d of document.querySelectorAll('dialog')) {
  d.addEventListener('click', e => {
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
  });
}

let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  advance(pet); refresh(); save();
  if (document.hidden) hiddenAt = Date.now();
  else if (Date.now() - hiddenAt > 45000) greet();
});
window.addEventListener('pagehide', save);
setInterval(() => { advance(pet); refresh(); save(); }, 15000);
refresh();
renderJournal();

// ---------------------------------------------------------------------------
// Camera & frame loop
// ---------------------------------------------------------------------------
const CAM = {
  wide: {pos: new THREE.Vector3(1.9, 2.15, 5.6), look: new THREE.Vector3(0, .92, .3), fov: 32},
  close: {pos: new THREE.Vector3(.75, 1.55, 3.05), look: new THREE.Vector3(0, 1.22, .65), fov: 30},
  tallWide: {pos: new THREE.Vector3(1.5, 2.25, 6.3), look: new THREE.Vector3(0, 1.0, .3), fov: 36},
  tallClose: {pos: new THREE.Vector3(.6, 1.6, 3.6), look: new THREE.Vector3(0, 1.2, .6), fov: 34},
};
const camLook = new THREE.Vector3(), camPos = new THREE.Vector3(), parallax = new THREE.Vector2();
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer?.setSize(w, h);
}
new ResizeObserver(resize).observe(host);
resize();

function updateCamera(dt) {
  view.zoom = damp(view.zoom, view.zoomTarget, 3, dt);
  const tall = camera.aspect < .9;
  const a = tall ? CAM.tallWide : CAM.wide, b = tall ? CAM.tallClose : CAM.close;
  camPos.lerpVectors(a.pos, b.pos, view.zoom);
  camLook.lerpVectors(a.look, b.look, view.zoom);
  const fov = lerp(a.fov, b.fov, view.zoom);
  if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  parallax.x = damp(parallax.x, reduceMotion ? 0 : pointer.x, 2, dt);
  parallax.y = damp(parallax.y, reduceMotion ? 0 : pointer.y, 2, dt);
  camera.position.set(camPos.x + parallax.x * .25, camPos.y + parallax.y * .12, camPos.z);
  camera.lookAt(camLook);
}

function updateRoom(dt, t) {
  const night = pet.sleeping;
  sun.intensity = damp(sun.intensity, night ? .12 : 3.4, 3, dt);
  ambient.intensity = damp(ambient.intensity, night ? .75 : 2.3, 3, dt);
  rim.intensity = damp(rim.intensity, night ? .3 : 1.5, 3, dt);
  moon.intensity = damp(moon.intensity, night ? 1.6 : 0, 3, dt);
  lamp.intensity = damp(lamp.intensity, night ? 2.2 : 0, 3, dt);
  const pal = night ? NIGHT : DAY, k = 1 - Math.exp(-2.5 * dt);
  floorMat.color.lerp(pal.floor, k); wallMat.color.lerp(pal.wall, k); rugMat.color.lerp(pal.rug, k); glass.material.color.lerp(pal.glass, k);
  sunPatch.material.opacity = damp(sunPatch.material.opacity, night ? 0 : .3, 3, dt);

  // Feeding: kibble disappears bite by bite.
  if (brain.mode === 'feed') {
    const p = clamp((t - brain.modeStart - 1) / 2.8, 0, 1);
    kibbles.forEach((k, i) => k.visible = i >= Math.floor(p * kibbles.length));
  }
  // Brushing: three slow strokes along the back.
  const brushing = brain.mode === 'brush';
  brushTool.scale.setScalar(damp(brushTool.scale.x, brushing ? 1 : 0, 8, dt));
  if (brushTool.scale.x > .01) {
    const p = ((t - brain.modeStart) / 1.1) % 1, s = Math.sin(p * Math.PI);
    brushRig.position.set(.55 - s * .08, 1.45 + s * .12, lerp(.55, -.55, p));
    brushRig.rotation.set(-.3 + p * .6, 0, .5);
    if (Math.random() < dt * 2) burst('sparkle', 1);
  }
}

let last = performance.now();
function frame(now) {
  if (!renderer) return;
  const dt = Math.min(.1, (now - last) / 1000);
  last = now;
  clockNow = now / 1000;
  const t = clockNow;
  if (brain.mode !== 'idle' && brain.mode !== 'play' && t > brain.modeUntil) {
    brain.mode = 'idle';
    if (brain.modeUntil > 0) { express('joy', 1.4); hop(); }
    kibbles.forEach(k => k.visible = false);
    refresh();
  }
  if (t - view.lastDrag > 6 && !gesture) view.target = damp(view.target, Math.round(view.target / (Math.PI * 2)) * Math.PI * 2, .8, dt);
  view.angle = damp(view.angle, view.target, 6, dt);
  updateCamera(dt);
  updateRoom(dt, t);
  updatePlay(dt, t);
  if (ready) {
    updateKitten(dt, t);
    idleLife(t);
    const sp = $('#speech');
    const w = sp.offsetWidth, x = clamp(headScreen.x + 24, 12, host.clientWidth - w - 12), y = clamp(headScreen.y - 6, sp.offsetHeight + 74, host.clientHeight);
    sp.style.setProperty('--x', x.toFixed(1) + 'px');
    sp.style.setProperty('--y', y.toFixed(1) + 'px');
  }
  renderer.render(scene, camera);
}
// Handy for visual QA: open with ?debug to drive expressions from the console.
if (new URLSearchParams(location.search).has('debug')) window.kitten = {brain, express, act, yawn, slowBlink, meow, hop, view, get face() { return face; }};

renderer?.setAnimationLoop(now => { if (!document.hidden) frame(now); else last = now; });
