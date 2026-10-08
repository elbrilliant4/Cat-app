import * as THREE from 'three';
import {fresh, advance, care, mood} from './pet-state.js';
import {DECORS, applyDecor} from './decor.js';
import {load as loadSave, store as storeSave, keepStorage, toCode, fromCode} from './save.js';
import {RealCat, EXPRESSIONS} from './real-cat.js';
import {Room} from './room.js';
import {Sounds} from './sound.js';

const $ = s => document.querySelector(s);
const {damp, clamp, lerp} = THREE.MathUtils;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = list => list[Math.floor(Math.random() * list.length)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = reduceMotion ? 0.35 : 1;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
// save.js keeps every player's cat through updates (see there).
let storage = null;
try { storage = localStorage; } catch {}
const loaded = storage ? loadSave(storage) : null;
let pet = loaded ? loaded.pet : fresh();
keepStorage();
let saveWarned = false;
function save() {
  try { storeSave(storage, pet); }
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
const ICON_TINT = {'i-drop': '--water', 'i-heart': '--love', 'i-bowl': '--food', 'i-brush': '--clean', 'i-yarn': '--happy', 'i-moon': '--energy', 'i-sparkle': '--accent', 'i-sun': '--energy'};

const NEEDS = [
  {key: 'food', label: 'Tummy', icon: 'i-bowl', tint: '--food'},
  {key: 'happiness', label: 'Joy', icon: 'i-heart', tint: '--happy'},
  {key: 'water', label: 'Water', icon: 'i-drop', tint: '--water'},
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

const MOOD_COLORS = {'Dreaming softly': '#8f9cff', 'A little hungry': '#f28c5b', 'A little thirsty': '#5b8def', 'Ready for a nap': '#e9ad2f', 'Needs a little brush': '#3fb3c9', 'Missing you': '#b48ad8', 'Feeling lovely': '#5cc489'};

function greeting() {
  const h = new Date().getHours();
  const part = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  if (pet.sleeping) return `${part}. ${pet.name} is fast asleep — shh.`;
  if (pet.food < 40) return `${part}. ${pet.name} keeps glancing at the bowl…`;
  if (pet.water < 40) return `${part}. ${pet.name} is eyeing the fountain.`;
  if (pet.happiness < 35) return `${part}. ${pet.name} missed you.`;
  return `${part}. ${pet.name} is so happy you’re here.`;
}

function refresh() {
  const m = mood(pet);
  $('#pet-name').textContent = pet.name;
  $('#mood-text').textContent = m;
  $('#mood').style.setProperty('--mood', MOOD_COLORS[m] || '#5cc489');
  // Calendar days: a kitten adopted last night is on day 2 this morning.
  const midnight = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  $('#age').textContent = 'Day ' + Math.max(1, Math.round((midnight(Date.now()) - midnight(pet.born)) / 86400000) + 1);
  $('#greeting').textContent = greeting();
  for (const n of NEEDS) {
    const v = Math.round(pet[n.key]), el = $('#ring-' + n.key);
    el.querySelector('.bar').style.strokeDashoffset = String(CIRC * (1 - v / 100));
    el.querySelector('strong').textContent = v + '%';
    el.setAttribute('aria-valuenow', v);
    el.classList.toggle('low', v < 35);
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
  document.querySelector('meta[name=theme-color]').content = pet.sleeping ? '#1c1612' : '#f7f1ea';
  for (const b of document.querySelectorAll('.dock [data-action]')) {
    const off = pet.sleeping && b.dataset.action !== 'sleep';
    b.setAttribute('aria-disabled', String(off));
    b.classList.toggle('active', brain.mode === b.dataset.action || (b.dataset.action === 'sleep' && pet.sleeping));
  }
  $('#care-tip').textContent = pet.sleeping ? 'Resting restores energy, even while you’re away.'
    : pet.food < 40 ? 'A tasty snack would be lovely.'
    : pet.water < 40 ? 'Tap the fountain to invite a drink.'
    : pet.energy < 35 ? 'A nap will put the bounce back.'
    : pet.cleanliness < 30 ? 'Time for a gentle brush.'
    : pet.happiness < 35 ? 'A cuddle or a game would help.'
    : 'All good. Just be here.';
  $('#sound').innerHTML = icon(pet.sound ? 'i-sound' : 'i-mute');
  $('#sound-on').checked = pet.sound;
  $('#vol-cat').value = pet.catVolume;
  $('#sound-panel').classList.toggle('muted', !pet.sound);
  $('#scene-hint').textContent = brain.mode === 'play' ? 'Steer the toy · hold it still near your kitten to tempt a pounce'
    : pet.sleeping ? 'Shh… tap Wake when it’s time to play'
    : matchMedia('(pointer: coarse)').matches ? `Stroke ${pet.name} to pet · drag to look around · pinch to zoom` : `Stroke ${pet.name} to pet · drag to look around · scroll to zoom · right-drag to move`;
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

// Speech bubble beside the kitten's head. She mostly speaks through what she
// does; words are kept for things you need to know (`important`) and the odd
// remark, at most one every 40 seconds or so.
let speechTimer, lastSay = -100;
function say(text, ms = 3600, important = false) {
  if (!important && (clockNow - lastSay < 40 || Math.random() > .4)) return;
  lastSay = clockNow;
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
// Sound (sound.js): recorded meows with a mouth that follows them, a purr,
// with one volume control (no background ambience).
// ---------------------------------------------------------------------------
const sounds = new Sounds();
sounds.enabled = pet.sound;
sounds.volume = {cat: pet.catVolume};
function meow(kind = 'meow', priority = 'reply') {
  const m = sounds.meow(kind, priority);
  if (!m) return false;
  // Subtle: a mew or meow parts the lips a little; a trill or a sleepy call
  // barely opens them (and purring, which doesn't come through here, keeps
  // the jaw closed).
  brain.mouthAnim = {start: clockNow, dur: m.dur + .08, env: m.env, rate: m.rate, peak: {mew: .36, meow: .45, chirp: .15, sleepy: .22}[kind] ?? .36};
  return true;
}
const purr = seconds => sounds.purr(seconds);
// Browsers only allow audio after a tap; start it on the first one anywhere.
document.addEventListener('pointerdown', () => { if (pet.sound) sounds.setEnabled(true); }, {capture: true});

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
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.prepend(renderer.domElement);
} catch (e) {
  $('#loading strong').textContent = 'Your browser couldn’t open the 3D room.';
  $('#load-progress').textContent = 'Try a browser with WebGL enabled.';
  console.error(e);
}

const ambient = new THREE.HemisphereLight(0xfff0dc, 0x8a6446, 1.5);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffdcae, 3.2);
sun.position.set(-3, 6, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left: -6, right: 6, top: 6, bottom: -6, far: 25});
sun.shadow.bias = -.0005;
sun.shadow.normalBias = .02;
scene.add(sun);
// Golden window light from behind-left gives Mochi a warm rim.
const rim = new THREE.DirectionalLight(0xffd29a, 1.8);
rim.position.set(-3, 4, -5);
scene.add(rim);
const moon = new THREE.DirectionalLight(0x9fb4ff, 0);
moon.position.set(-3, 4, -4);
scene.add(moon);
// A warm fill from the front so Mochi stays readable in the evening.
const fill = new THREE.DirectionalLight(0xffcf9a, 0);
fill.position.set(2, 3, 6);
scene.add(fill);

const mat = (color, roughness = .85) => new THREE.MeshStandardMaterial({color, roughness});
function mesh(geo, material, parent = scene) {
  const o = new THREE.Mesh(geo, material);
  o.castShadow = true; o.receiveShadow = true;
  parent.add(o);
  return o;
}
// The room: furniture, bowls, fountain and bed (room.js).
const room = new Room(scene, renderer, {mobile: matchMedia('(pointer: coarse)').matches});
const {bowl, kibbles, fountain, bed} = room;
applyDecor(room, pet.decor);

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

// ---------------------------------------------------------------------------
// Kitten
// ---------------------------------------------------------------------------
const cat = new RealCat();
scene.add(cat.root);
cat.root.add(brushRig);

// Soft contact shadow so the kitten feels grounded.
const shadowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(60,40,25,.4)'); grd.addColorStop(1, 'rgba(60,40,25,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const contact = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.2), new THREE.MeshBasicMaterial({map: shadowTex, transparent: true, depthWrite: false}));
contact.rotation.x = -Math.PI / 2; contact.position.y = .02;
cat.root.add(contact);

// Places in the room.
const HOME = new THREE.Vector3(0, 0, .3);
const RUG = {x: -.4, z: .3, rx: 1.55, rz: 1.2};
const toHome = new THREE.Vector3().subVectors(HOME, bowl.position).setY(0).normalize();
const EAT_SPOT = bowl.position.clone().addScaledVector(toHome, .95).setY(0);
const CUSHION_SPOT = new THREE.Vector3(bed.position.x, 0, bed.position.z);
const toFountain = new THREE.Vector3().subVectors(HOME, fountain.position).setY(0).normalize();
const DRINK_SPOT = fountain.position.clone().addScaledVector(toFountain, .88).setY(0);
// Places she jumps up to: the window sill (from her bed, just below it) and
// the club chair's seat. spot: where she sits; top: its height; base: where
// she jumps from and back down to; face: the way she sits there.
const PERCHES = (() => {
  const w = room.windowGroup, c = room.chair;
  w.updateMatrixWorld(true); c.updateMatrixWorld(true);
  return {
    sill: {spot: w.localToWorld(new THREE.Vector3(-.05, 0, room.sillDepth * .5)).setY(0), top: room.sillTop,
      base: new THREE.Vector3(bed.position.x, 0, bed.position.z - .3), face: Math.PI},
    chair: {spot: c.localToWorld(new THREE.Vector3(0, 0, .3)).setY(0), top: room.chairSeatTop,
      base: c.localToWorld(new THREE.Vector3(0, 0, 1.45)).setY(0), face: c.rotation.y},
  };
})();
const SUN_SPOT = new THREE.Vector3(room.sunPatch.position.x + .2, 0, room.sunPatch.position.z + .3);
function onRug(v) {
  const dx = (v.x - RUG.x) / RUG.rx, dz = (v.z - RUG.z) / RUG.rz, r = Math.hypot(dx, dz);
  if (r > 1) { v.x = RUG.x + dx / r * RUG.rx; v.z = RUG.z + dz / r * RUG.rz; }
  return v;
}
const randomRugPoint = () => onRug(new THREE.Vector3(rand(-1.4, 1.4), 0, rand(-.7, 1.2)));

let ready = false;
cat.load('./assets/mochi-ragdoll.glb', p => {
  if (!p.total) return;
  const pct = Math.round(p.loaded / p.total * 100);
  $('#load-fill').style.width = pct + '%';
  $('#load-progress').textContent = pct < 100 ? pct + '% · bringing your kitten home' : 'Fluffing the fur…';
}).then(() => {
  ready = true;
  host.classList.add('ready');
  $('#loading').classList.add('done');
  setTimeout(() => $('#loading').hidden = true, 900);
  greet(true);
}).catch(e => {
  $('#loading strong').textContent = 'Your kitten couldn’t load.';
  $('#load-progress').textContent = 'Please reload to try again.';
  console.error(e);
});

// ---------------------------------------------------------------------------
// Behaviour: what the kitten is doing, how it feels, where it looks
// ---------------------------------------------------------------------------
let clockNow = 0;
const brain = {
  mode: 'idle', modeStart: 0, modeUntil: 0,
  activity: 'sit', actStart: 0, actUntil: Infinity, after: null,
  pos: HOME.clone(), heading: 0, speed: 0, target: null, run: false, elevation: 0,
  override: null, overrideUntil: 0,
  face: {...EXPRESSIONS.content},
  blinkAt: -10, nextBlink: 1.5, blinkDouble: false, slowBlinkAt: -10,
  mouthAnim: null, rubUntil: 0, tailUpUntil: 0, chewUntil: 0, yawnAt: -10, hopAt: -10, kneadUntil: 0, strokeUntil: 0,
  gaze: new THREE.Vector3(0, 1.2, 4), headGaze: new THREE.Vector3(0, 1.2, 4), headWait: null, headMoving: false,
  bodyWait: null, bodyTurning: false, glance: null, glanceUntil: 0,
  head: {yaw: 0, pitch: 0, roll: 0}, look: {x: 0, y: 0},
  nextIdle: 6, nextShow: 10, nextZ: 0, nextTwitch: 3,
  pointerAt: -10, pointerWorld: new THREE.Vector3(),
  pounce: null, pounceReadyAt: 0, stillSince: 0, catches: 0, playEnd: 0,
  petTimes: [],
  perch: null, perchUntil: 0, jump: null, jumpFace: 0, nextBird: 45, birdSeen: false, bookKnocked: false, swatHit: 0,
};
if (pet.sleeping) { brain.activity = 'sleep'; brain.pos.copy(CUSHION_SPOT); brain.heading = .6; }

function express(name, seconds) { brain.override = name; brain.overrideUntil = clockNow + seconds; }
function hop() { if (!reduceMotion) brain.hopAt = clockNow; }
function slowBlink() { brain.slowBlinkAt = clockNow; }
function yawn() { brain.yawnAt = clockNow; }
function glanceAt(point, seconds) { brain.glance = point.clone(); brain.glanceUntil = clockNow + seconds; }
function twitchEar(side = Math.random() < .5 ? 0 : 1, strength = 1) { cat.twitchEar(side, strength); }

function setActivity(name, seconds = Infinity, after = null) {
  brain.activity = name;
  brain.actStart = clockNow;
  brain.actUntil = clockNow + seconds;
  brain.after = after;
}
function walkTo(point, then = null, run = false, anywhere = false) {
  // Mid-jump: go there once she lands. Up on a perch: hop down first.
  if (brain.jump) { brain.jump.then = () => walkTo(point, then, run, anywhere); return; }
  if (brain.perch) { jumpDown(() => walkTo(point, then, run, anywhere)); return; }
  brain.target = anywhere ? point.clone() : onRug(point.clone());
  brain.run = run;
  const dist = Math.hypot(brain.target.x - brain.pos.x, brain.target.z - brain.pos.z);
  setActivity('walk', 8 + dist / (run ? 1.2 : .45), then);
}
// Jumping: a crouch and a little wiggle while she sizes it up, then an arc to
// the new spot and height, and a soft landing.
const groundAt = p => Math.hypot(p.x - bed.position.x, p.z - bed.position.z) < room.bedRadius ? room.bedTop : 0;
function leap(to, toY, perch, then = null) {
  brain.target = null;
  brain.jumpFace = angleTo(brain.pos, to);
  glanceAt(new THREE.Vector3(to.x, toY + .3, to.z), 1.2);
  setActivity('prejump', reduceMotion ? .3 : .8, () => {
    const up = toY - brain.elevation;
    brain.jump = {from: brain.pos.clone(), fromY: brain.elevation, to: to.clone(), toY, perch, then, start: clockNow, dur: .5 + Math.abs(up) * .06, arc: .18 + Math.max(0, up) * .22};
    setActivity('jump');
  });
}
function jumpTo(name, then = null, stay = 40) {
  const P = PERCHES[name];
  if (brain.perch === name) { then?.(); return; }
  // Only jump from the take-off spot (a walk can end early if it ran out of
  // time); otherwise keep walking there, or give up after a few tries.
  const go = tries => walkTo(P.base, () => {
    if (Math.hypot(brain.pos.x - P.base.x, brain.pos.z - P.base.z) > .3) { if (tries < 3) go(tries + 1); else setActivity('sit'); return; }
    leap(P.spot, P.top, name, () => { brain.perchUntil = clockNow + stay; then ? then() : setActivity('sit'); });
  }, false, true);
  go(0);
}
function jumpDown(then = null) {
  const P = PERCHES[brain.perch];
  leap(P.base, groundAt(P.base), null, then);
}
function restingActivity() {
  if (pet.sleeping) return 'sleep';
  return pet.energy < 30 ? 'loaf' : 'sit';
}

function baseExpression() {
  if (pet.sleeping) return 'asleep';
  if (pet.energy < 35) return 'sleepy';
  if (pet.food < 40 || pet.water < 40) return 'hungry';
  if (pet.cleanliness < 40) return 'grumpy';
  if (pet.happiness < 45) return 'lonely';
  return 'content';
}
function currentExpression() {
  const a = brain.activity, since = clockNow - brain.actStart;
  if (clockNow < brain.overrideUntil) return brain.override;
  if (a === 'sleep' || a === 'catnap') return 'asleep';
  if (pet.sleeping) return 'sleepy';
  if (a === 'prejump') return 'curious';
  if (a === 'eat') return since < .5 ? 'curious' : 'yum';
  if (a === 'drink') return since < .5 ? 'curious' : 'bliss';
  if (a === 'groom') return 'groom';
  if (a === 'belly') return pet.bond >= 40 ? 'love' : 'joy';
  if (a === 'stretch') return 'sleepy';
  if (a === 'beg') return 'hungry';
  if (brain.mode === 'brush') return 'bliss';
  if (brain.mode === 'play' || brain.mode === 'solo') return 'excited';
  if (clockNow < brain.strokeUntil) return 'bliss';
  return baseExpression();
}

function greet(first = false) {
  if (!ready) return;
  if (pet.sleeping) { say(pick(['Zzz… dreaming of tiny adventures.', 'Zzz… mrrp… fish…']), 3800); return; }
  express('surprised', .6);
  setTimeout(() => { express('joy', 1.8); hop(); meow('mew'); burst('heart', 4); }, 600);
  const lines = pet.food < 40 ? ['You’re back! Is it… snack o’clock?'] : pet.happiness < 45 ? ['There you are! I missed you.'] : first ? ['Oh! Hi, you! Got a little time for me?', 'Mrrp! You came back!', 'Hello, my favourite human.'] : ['Welcome back!', 'Mrrp! There you are.'];
  setTimeout(() => say(pick(lines), 3600, first), 450);
  brain.tailUpUntil = clockNow + 4;
}

const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpV3 = new THREE.Vector3();
const angleTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function dampAngle(a, b, rate, dt) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * (1 - Math.exp(-rate * dt));
}

function updateCat(dt, t) {
  // --- Activity flow -------------------------------------------------------
  if (t > brain.actUntil) {
    const next = brain.after;
    brain.after = null;
    if (next) next(); else setActivity(restingActivity());
  }
  if (pet.sleeping && !['sleep', 'walk', 'prejump', 'jump', 'land'].includes(brain.activity)) setActivity('sleep');

  // --- Moving around ---------------------------------------------------------
  const a = brain.activity;
  let desiredHeading = null;
  const pc = brain.pounce;
  if (a === 'walk' && brain.target) {
    const dx = brain.target.x - brain.pos.x, dz = brain.target.z - brain.pos.z, dist = Math.hypot(dx, dz);
    desiredHeading = Math.atan2(dx, dz);
    const facing = Math.abs(Math.atan2(Math.sin(desiredHeading - brain.heading), Math.cos(desiredHeading - brain.heading)));
    const top = brain.run ? 2.1 : .65;
    brain.speed = damp(brain.speed, facing < .8 ? Math.min(top, dist * 2.5 + .2) : .15, 5, dt);
    if (dist < .06) {
      brain.speed = 0;
      brain.target = null;
      const next = brain.after;
      brain.after = null;
      if (next) next(); else setActivity(restingActivity());
    }
  } else if (!pc) {
    brain.speed = damp(brain.speed, 0, 8, dt);
  }
  const J = brain.jump;
  if (J) {
    const k = Math.min(1, (t - J.start) / J.dur), e = k * k * (3 - 2 * k);
    brain.pos.lerpVectors(J.from, J.to, e);
    brain.elevation = J.fromY + (J.toY - J.fromY) * e + 4 * J.arc * k * (1 - k);
    desiredHeading = angleTo(J.from, J.to);
    if (k >= 1) {
      brain.jump = null;
      brain.perch = J.perch;
      brain.elevation = J.toY;
      setActivity('land', .4, J.then);
    }
  }
  if (a === 'prejump') desiredHeading = brain.jumpFace;
  if (pc) {
    const p = (t - pc.start) / 1.3;
    if (p < .5) desiredHeading = angleTo(brain.pos, toy.position);
    else if (p < .82) { const k = (p - .5) / .32; brain.pos.lerpVectors(pc.from, pc.to, k * k * (3 - 2 * k)); if (!pc.caught && k > .7) catchToy(); }
    else if (p >= 1) brain.pounce = null;
  } else if (!J) {
    brain.pos.x += Math.sin(brain.heading) * brain.speed * dt;
    brain.pos.z += Math.cos(brain.heading) * brain.speed * dt;
  }
  if (a === 'eat') desiredHeading = angleTo(brain.pos, bowl.position);
  if (a === 'drink') desiredHeading = angleTo(brain.pos, fountain.position);
  if ((brain.mode === 'play' || brain.mode === 'solo') && !pc && !J && !['walk', 'prejump', 'land'].includes(a)) desiredHeading = angleTo(brain.pos, toy.position);
  if (a === 'swat' && brain.swatAt) desiredHeading = angleTo(brain.pos, brain.swatAt);
  // On a perch she keeps to the way it faces (it's narrow up there).
  if (brain.perch && !J && ['sit', 'loaf', 'catnap', 'groom', 'land'].includes(a)) desiredHeading = PERCHES[brain.perch].face;
  if (desiredHeading === null && (['belly', 'sleep', 'catnap'].includes(a) || brain.mode === 'brush')) desiredHeading = angleTo(brain.pos, camera.position) + (a === 'belly' ? -1.2 : brain.mode === 'brush' ? -1.1 : -.5);
  else if (desiredHeading === null && ['sit', 'loaf', 'beg'].includes(a)) {
    // Settled: the body only turns once the head has been turned well round
    // for a moment, and then just until she faces what she's watching.
    if (Math.abs(brain.head.yaw) > .42) brain.bodyWait ??= t + .6; else brain.bodyWait = null;
    if (brain.bodyWait !== null && t > brain.bodyWait) brain.bodyTurning = true;
    if (Math.abs(brain.head.yaw) < .1) brain.bodyTurning = false;
    if (brain.bodyTurning) desiredHeading = angleTo(brain.pos, brain.headGaze);
  }
  if (desiredHeading !== null) brain.heading = dampAngle(brain.heading, desiredHeading, a === 'walk' || pc || J ? 7 : a === 'prejump' ? 5 : 1.6, dt);
  if (!J) brain.elevation = damp(brain.elevation, brain.perch ? PERCHES[brain.perch].top : groundAt(brain.pos), 8, dt);
  cat.root.position.set(brain.pos.x, brain.elevation, brain.pos.z);
  cat.root.rotation.y = brain.heading;

  // --- Face ----------------------------------------------------------------
  const f = brain.face, ex = EXPRESSIONS[currentExpression()] || EXPRESSIONS.content;
  for (const k in ex) f[k] = damp(f[k], ex[k], k === 'mouth' ? 12 : 9, dt);
  const face = {...f};
  if (t > brain.nextBlink && !pet.sleeping) {
    brain.blinkAt = t;
    brain.blinkDouble = Math.random() < .2;
    brain.nextBlink = t + rand(2.2, 5.5);
  }
  const bp = (t - brain.blinkAt) / .16;
  let shut = bp < 0 ? 0 : bp < .45 ? bp / .45 : bp < 1 ? 1 - (bp - .45) / .55 : 0;
  if (brain.blinkDouble && bp >= 1.3 && bp < 2.3) { const b2 = bp - 1.3; shut = b2 < .45 ? b2 / .45 : 1 - (b2 - .45) / .55; }
  const sb = (t - brain.slowBlinkAt) / 2;
  if (sb >= 0 && sb < 1) { shut = Math.max(shut, Math.sin(Math.PI * Math.min(1, sb * 1.25)) ** .6); face.happy = 0; }
  face.open *= 1 - shut;
  const m = brain.mouthAnim;
  if (m) {
    const p = (t - m.start) / m.dur;
    if (p >= 1) brain.mouthAnim = null;
    else if (m.env) face.mouth = Math.max(face.mouth, (m.env[Math.min(m.env.length - 1, Math.floor((t - m.start) * m.rate))] || 0) * m.peak);
    else face.mouth = Math.max(face.mouth, Math.sin(Math.PI * p) ** .7 * m.peak);
  }
  if (brain.activity === 'drink' && t - brain.actStart > .6) { face.tongue = .5 + .5 * Math.sin(t * 13); face.mouth = Math.max(face.mouth, .12); }
  if (t < brain.chewUntil) face.mouth = Math.max(face.mouth, .15 + .25 * (.5 + .5 * Math.sin(t * 14)));
  const yp = (t - brain.yawnAt) / 2;
  let yawnPitch = 0;
  if (yp >= 0 && yp < 1) {
    const y = Math.sin(Math.PI * yp) ** 1.4;
    face.mouth = Math.max(face.mouth, y);
    face.open = Math.min(face.open, 1 - y);
    face.earBack += y * .4;
    yawnPitch = y * .35;
  }

  // --- Head and eyes -----------------------------------------------------------
  let gazeTarget;
  if (brain.mode === 'play') gazeTarget = toy.position;
  else if (a === 'eat') gazeTarget = tmpV2.copy(bowl.position).setY(0);
  else if (a === 'drink') gazeTarget = tmpV2.copy(fountain.position).setY(.2);
  else if (t - brain.pointerAt < 2.2) gazeTarget = brain.pointerWorld;
  else if (a === 'walk' && brain.target) gazeTarget = tmpV2.copy(brain.target).setY(.5);
  else if (brain.glance && t < brain.glanceUntil) gazeTarget = brain.glance;
  else gazeTarget = camera.position;
  // Eyes first: they jump to whatever caught her attention. The head
  // follows a beat later and more slowly; the body (above) last of all.
  const quick = brain.mode === 'play';
  brain.gaze.x = damp(brain.gaze.x, gazeTarget.x, 18, dt);
  brain.gaze.y = damp(brain.gaze.y, gazeTarget.y, 18, dt);
  brain.gaze.z = damp(brain.gaze.z, gazeTarget.z, 18, dt);
  cat.root.updateMatrixWorld(true);
  const eyeAt = cat.headCenter(tmpV3);
  const apart = tmpV.subVectors(brain.gaze, eyeAt).normalize().angleTo(tmpV2.subVectors(brain.headGaze, eyeAt).normalize());
  if (apart > .12 && !brain.headMoving) brain.headWait ??= t + (quick ? .05 : .2);
  if (brain.headWait !== null && t >= brain.headWait) { brain.headMoving = true; brain.headWait = null; }
  if (brain.headMoving) {
    const r = quick ? 9 : 3.4;
    brain.headGaze.x = damp(brain.headGaze.x, brain.gaze.x, r, dt);
    brain.headGaze.y = damp(brain.headGaze.y, brain.gaze.y, r, dt);
    brain.headGaze.z = damp(brain.headGaze.z, brain.gaze.z, r, dt);
    if (apart < .03) brain.headMoving = false;
  }
  const toLocal = p => cat.neck.worldToLocal(tmpV.copy(p)).sub(cat.head.position);
  let local = toLocal(brain.headGaze);
  const wantYaw = Math.atan2(local.x, Math.max(.12, local.z));
  const wantPitch = Math.atan2(local.y, Math.hypot(local.x, local.z));
  local = toLocal(brain.gaze);
  const eyeYaw = Math.atan2(local.x, Math.max(.12, local.z));
  const eyePitch = Math.atan2(local.y, Math.hypot(local.x, local.z));
  let yaw = clamp(wantYaw * .75, -.85, .85), pitch = clamp(wantPitch * .7, -.5, .45), roll = 0;
  const e = currentExpression();
  roll += Math.sin(t * .7) * .04 * motion;
  if (e === 'curious') roll += .28;
  if (e === 'bliss') { roll += .2; pitch += .15; }
  if (e === 'joy' || e === 'love') roll += Math.sin(t * 2.6) * .12;
  if (e === 'sleepy') { pitch -= .12; roll += .12; }
  if (e === 'lonely' || e === 'hungry') { pitch += .05; roll -= .1; }
  if (a === 'sleep' || a === 'catnap' || a === 'belly') { yaw = 0; pitch = 0; roll = 0; }
  if ((a === 'eat' || a === 'drink') && t - brain.actStart > .5) { yaw = 0; pitch = (a === 'drink' ? -.62 : -.75) + Math.sin(t * 7) * .05; }
  if (a === 'groom') { yaw = .35; pitch = -.3 + Math.sin(t * 5) * .1; roll = .2; }
  // Rubbing her cheek against your hand.
  if (t < brain.rubUntil && !['sleep', 'belly', 'eat', 'drink'].includes(a)) { const k = Math.min(1, (brain.rubUntil - t) * 2); roll += Math.sin(t * 6.5) * .28 * k; yaw += Math.sin(t * 3.2) * .12 * k; pitch += .08 * k; }
  pitch += yawnPitch;
  brain.head.yaw = damp(brain.head.yaw, yaw, brain.mode === 'play' ? 8 : 5, dt);
  brain.head.pitch = damp(brain.head.pitch, pitch, 5, dt);
  brain.head.roll = damp(brain.head.roll, roll, 4, dt);
  const sleepy = a === 'sleep' || a === 'catnap';
  brain.look.x = damp(brain.look.x, sleepy ? 0 : clamp((eyeYaw - brain.head.yaw) / .45, -1, 1), 22, dt);
  brain.look.y = damp(brain.look.y, sleepy ? 0 : clamp((eyePitch - brain.head.pitch) / .35, -1, 1), 22, dt);

  if (t > brain.nextTwitch) {
    brain.nextTwitch = t + rand(3, 8);
    twitchEar(undefined, pet.sleeping ? .6 : 1);
    if (Math.random() < .3) setTimeout(() => twitchEar(undefined, .7), 170);
  }

  // --- Body pose ---------------------------------------------------------------
  let pose = 'sit', walk = 0, wiggle = 0, lift = 0, poseRate = 6, tail = {amp: .25, speed: 1.4};
  if (a === 'walk' || brain.speed > .05) { pose = 'stand'; walk = brain.speed / .8; tail = {amp: .3, speed: 2.5}; }
  if (a === 'loaf') pose = 'loaf';
  if (a === 'sleep') { pose = 'sleep'; tail = {amp: .05, speed: .5}; }
  if (a === 'eat' || a === 'drink') { pose = 'crouch'; tail = {amp: .45, speed: 1.2}; }
  if (a === 'groom') pose = 'sit';
  if (a === 'belly') { pose = 'belly'; tail = {amp: .5, speed: 2}; }
  if (a === 'stretch') { pose = 'stretch'; poseRate = 3.5; }
  if (a === 'beg') { pose = 'beg'; tail = {amp: .4, speed: 2}; }
  if (brain.mode === 'brush') { pose = 'loaf'; tail = {amp: .5, speed: 1}; }
  if ((brain.mode === 'play' || brain.mode === 'solo') && a === 'play') { pose = 'crouch'; tail = {amp: .6, speed: 4}; }
  if (a === 'catnap') { pose = 'sleep'; tail = {amp: .05, speed: .5}; }
  if (a === 'prejump') { pose = 'crouch'; poseRate = 9; const w = (t - brain.actStart) / Math.max(.3, brain.actUntil - brain.actStart); wiggle = w > .45 ? .5 : 0; tail = {amp: .5, speed: 4}; }
  if (a === 'jump') { const k = J ? (t - J.start) / J.dur : 1; pose = k < .7 ? 'leap' : 'crouch'; poseRate = 14; tail = {amp: .1, speed: 1}; }
  if (a === 'land') { pose = 'crouch'; poseRate = 10; }
  let swat = 0;
  if (a === 'swat') { const q = (t - brain.actStart) / .45; swat = Math.max(0, Math.sin(Math.min(q, 1) * Math.PI)) * motion; tail = {amp: .5, speed: 4}; }
  // A bird at the window: quick tail flicks.
  if (brain.watching) tail = {amp: .45, speed: 6};
  if (pc) {
    const p = (t - pc.start) / 1.3;
    poseRate = 14;
    if (p < .5) { pose = 'crouch'; wiggle = Math.min(1, p / .15); tail = {amp: .8, speed: 6}; }
    else if (p < .82) { pose = 'leap'; lift = Math.sin((p - .5) / .32 * Math.PI) * .4; }
    else pose = 'crouch';
  }
  const hp = (t - brain.hopAt) / .55;
  if (hp >= 0 && hp < 1) lift = Math.max(lift, Math.sin(hp * Math.PI) * .22);
  if (e === 'joy' || e === 'love' || e === 'excited') tail = {amp: Math.max(tail.amp, .45), speed: Math.max(tail.speed, 3)};
  const knead = t < brain.kneadUntil || brain.mode === 'brush' || t < brain.strokeUntil || a === 'belly';

  cat.update(dt, t, {
    pose, poseRate, walk, wiggle: wiggle * motion, lift: lift * motion, knead, purr: knead && pet.sound,
    groom: a === 'groom', swat, head: brain.head, look: brain.look, face, tail,
    tailUp: t < brain.tailUpUntil && !['sleep', 'belly', 'loaf'].includes(a) ? 1 : 0,
  });

  // Screen anchor above the head for particles, and the face's rough
  // on-screen box (so the speech bubble can stay clear of it).
  const W = host.clientWidth, H = host.clientHeight;
  const top = cat.headTop(tmpV).project(camera);
  headScreen.x = (top.x * .5 + .5) * W;
  headScreen.y = (-top.y * .5 + .5) * H;
  const mid = cat.headCenter(tmpV).project(camera);
  const cx = (mid.x * .5 + .5) * W, cy = (-mid.y * .5 + .5) * H, r = Math.max(28, Math.abs(cy - headScreen.y) * 1.15);
  Object.assign(faceBox, {cx, cy, l: cx - r, r: cx + r, t: Math.min(headScreen.y, cy - r), b: cy + r * .9});
}
const faceBox = {cx: 0, cy: 0, l: 0, r: 0, t: 0, b: 0};

// Put the speech bubble above her head, or beside it when there's no room
// above; never over her face.
function placeSpeech() {
  const sp = $('#speech');
  if (!sp.classList.contains('show')) return;
  const w = sp.offsetWidth, h = sp.offsetHeight, W = host.clientWidth, H = host.clientHeight;
  const top = 78, right = W - 72, bottom = H - 130, f = faceBox;
  let x, y;
  if (f.t - 10 - h >= top) { x = clamp(f.cx - w * .3, 12, right - w); y = f.t - 10; }
  else if (f.r + 12 + w <= right) { x = f.r + 12; y = clamp(f.cy, top + h, bottom); }
  else if (f.l - 12 - w >= 12) { x = f.l - 12 - w; y = clamp(f.cy, top + h, bottom); }
  else { x = clamp(f.cx - w / 2, 12, right - w); y = clamp(f.b + 12 + h, top + h, bottom); }
  sp.style.setProperty('--x', x.toFixed(1) + 'px');
  sp.style.setProperty('--y', y.toFixed(1) + 'px');
}

// Little unprompted behaviours that make the kitten feel alive.
function idleLife(t) {
  if (pet.sleeping) {
    if (t > brain.nextZ) { brain.nextZ = t + rand(2.2, 3.4); burst('z', 1); }
    return;
  }
  watchBirds(t);
  if (brain.mode !== 'idle' || !['sit', 'loaf'].includes(brain.activity) || t < brain.nextIdle || t - brain.pointerAt < 2.5) return;
  brain.nextIdle = t + rand(4, 8);
  if (brain.perch) { perchLife(t); return; }
  const options = ['glance', 'twitch', 'tilt', 'wander', 'wander', 'groom', 'window', 'window', 'chair', 'sunbeam'];
  if (pet.energy > 35) options.push('solo', 'solo');
  if (pet.happiness > 60) options.push('slowBlink', 'zoomies');
  if (pet.energy < 55) options.push('yawn', 'loaf', 'stretch');
  if (pet.energy > 50) options.push('stretch');
  if (pet.food < 40) options.push('bowl', 'bowl');
  if (pet.water < 60) options.push('drink', 'drink', 'drink');
  if (pet.energy < 50) options.push('nap');
  if (pet.happiness > 50) options.push('meow');
  let choice = pick(options);
  // Something worth watching comes round often: soon after you open the
  // app, then every half a minute or so. A tired kitten picks the calm ones.
  if (t > brain.nextShow) {
    brain.nextShow = t + rand(25, 40);
    const shows = ['window', 'window', 'chair', 'sunbeam'];
    if (pet.energy > 35) shows.push('solo', 'solo', 'zoomies');
    choice = pick(shows);
  }
  if (choice === 'glance') glanceAt(new THREE.Vector3(rand(-3, 3), rand(.2, 2.4), rand(-.5, 2.5)), rand(1.2, 2.6));
  if (choice === 'twitch') { twitchEar(0); setTimeout(() => twitchEar(1), 140); }
  if (choice === 'tilt') express('curious', 1.8);
  if (choice === 'slowBlink') slowBlink();
  if (choice === 'yawn') { yawn(); if (Math.random() < .5) setTimeout(() => say(pick(['*yawn*… so cozy.', 'Mmm… nap soon?'])), 900); }
  if (choice === 'loaf') setActivity('loaf', rand(6, 11));
  if (choice === 'stretch') { setActivity('stretch', 1.9); setTimeout(yawn, 400); }
  if (choice === 'groom') setActivity('groom', rand(2.2, 3.5));
  if (choice === 'wander') walkTo(randomRugPoint(), () => setActivity(pick(['sit', 'sit', 'loaf']), rand(3, 7)));
  if (choice === 'zoomies') {
    say(pick(['Zoomies!!', 'Nyoom!']), 1600);
    express('excited', 3);
    walkTo(randomRugPoint(), () => walkTo(randomRugPoint(), () => walkTo(HOME, null, true), true), true);
  }
  if (choice === 'drink') act('drink', {auto: true});
  if (choice === 'nap') walkTo(CUSHION_SPOT, () => { setActivity('loaf', rand(8, 14)); setTimeout(slowBlink, 1500); }, false, true);
  if (choice === 'bowl') {
    walkTo(EAT_SPOT, () => { setActivity('beg', 3.5); meow('mew'); say(pick(['Is it snack o’clock?', 'This bowl looks very empty…'])); });
  }
  if (choice === 'meow') { meow(pick(['mew', 'chirp']), 'idle'); if (Math.random() < .5) say(pick(['Mrrp?', 'Mew!', 'I like it here. With you.'])); }
  if (choice === 'window') jumpTo('sill', () => { setActivity('sit'); brain.nextBird = clockNow + rand(2, 5); }, rand(20, 35));
  if (choice === 'chair') jumpTo('chair', () => {
    // Kneads the seat, turns, and settles in for a catnap.
    brain.kneadUntil = clockNow + 3;
    setActivity('loaf', 3.4, () => setActivity('catnap', rand(12, 22), () => { slowBlink(); setActivity('sit', 4); }));
  }, rand(25, 40));
  if (choice === 'sunbeam' && !pet.sleeping) walkTo(SUN_SPOT, () => {
    express('bliss', 2);
    setActivity('loaf', 2.5, () => setActivity('catnap', rand(10, 20), () => { yawn(); setActivity('sit', 3); }));
  }, false, true);
  if (choice === 'solo') startSolo();
}

// Up on a perch: mostly she stays a while, watching, washing, dozing,
// glancing back at you; then she hops down.
function perchLife(t) {
  if (t > brain.perchUntil) { jumpDown(() => setActivity(restingActivity(), rand(2, 5))); return; }
  const options = ['glance', 'twitch', 'slowBlink', 'groom', 'lookBack', 'loaf'];
  if (brain.perch === 'sill' && !brain.bookKnocked && !room.bookFall && t - brain.actStart > 6) options.push('book');
  const choice = pick(options);
  if (choice === 'glance') glanceAt(brain.perch === 'sill' ? room.glass.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(rand(-.9, .9), rand(-.6, .6), 0)) : new THREE.Vector3(rand(-3, 3), rand(.2, 2.4), rand(-.5, 2.5)), rand(1.5, 3));
  if (choice === 'twitch') twitchEar();
  if (choice === 'slowBlink') { glanceAt(camera.position, 2.2); slowBlink(); }
  if (choice === 'lookBack') { glanceAt(camera.position, rand(1.5, 2.5)); if (Math.random() < .3) meow('mew', 'idle'); }
  if (choice === 'groom') setActivity('groom', rand(2.2, 3.5), () => setActivity('sit'));
  if (choice === 'loaf') setActivity('loaf', rand(6, 12), () => setActivity('sit'));
  if (choice === 'book') knockBook();
}

// The top book on the sill: she pats at it, twice, and the third pat sends it
// over the edge. Then a look down at it, and an innocent look at you.
function knockBook() {
  brain.bookKnocked = true;
  const book = room.bookWorld(new THREE.Vector3());
  const pats = [0, .9, 1.8];
  glanceAt(book, 3.5);
  pats.forEach((d, i) => setTimeout(() => {
    if (brain.perch !== 'sill' || brain.jump) return;
    brain.swatAt = book;
    setActivity('swat', .45, () => setActivity('sit'));
    if (i === pats.length - 1) setTimeout(() => {
      if (!room.knockBook(clockNow)) return;
      setTimeout(() => {
        glanceAt(room.bookWorld(new THREE.Vector3()), 1.8);
        setTimeout(() => { glanceAt(camera.position, 2.5); express('curious', 2); if (Math.random() < .5) say(pick(['…it fell.', 'Oops.', 'It was like that when I got here.']), 2600); }, 1800);
      }, 700);
    }, 220);
  }, d * 1000));
}

// Birds at the window, in daytime. Up on the sill she gets them often; from
// the floor now and then one catches her eye and she may go up to watch.
function watchBirds(t) {
  if (pet.sleeping || !ready) { brain.watching = false; host.classList.remove('bird'); return; }
  const onSill = brain.perch === 'sill' && !brain.jump;
  if (!room.birdRun && t > brain.nextBird && brain.mode === 'idle') {
    if (onSill || (Math.random() < .25 && ['sit', 'loaf'].includes(brain.activity) && !brain.perch)) {
      const d = room.startBird(t);
      brain.birdSeen = false;
      brain.nextBird = t + d + (onSill ? rand(6, 16) : rand(60, 150));
    } else brain.nextBird = t + rand(20, 50);
  }
  const at = room.birdWorld(tmpV3);
  host.classList.toggle('bird', !!at);
  brain.watching = !!at && brain.mode === 'idle' && ['sit', 'loaf', 'groom'].includes(brain.activity);
  if (!brain.watching) return;
  brain.glance = (brain.glance || new THREE.Vector3()).copy(at);
  brain.glanceUntil = t + .4;
  if (!brain.birdSeen) {
    brain.birdSeen = true;
    twitchEar(0, 1.2); setTimeout(() => twitchEar(1, 1.2), 120);
    express('curious', 1.5);
    if (brain.activity !== 'sit') setActivity('sit');
    if (onSill && Math.random() < .6) setTimeout(() => meow('chirp', 'idle'), 600);
    // From the floor: sometimes she goes up for a better look.
    if (!onSill && Math.random() < .5) setTimeout(() => { if (brain.mode === 'idle' && !brain.perch && !pet.sleeping) jumpTo('sill', () => { setActivity('sit'); brain.nextBird = clockNow + rand(3, 8); }, rand(30, 50)); }, 1500);
  }
}

// ---------------------------------------------------------------------------
// Care actions
// ---------------------------------------------------------------------------
function setMode(mode, seconds = Infinity) {
  brain.mode = mode;
  brain.modeStart = clockNow;
  brain.modeUntil = clockNow + seconds;
  host.classList.toggle('playing', mode === 'play');
  refresh();
}
function finishMode() {
  if (brain.mode === 'idle') return;
  brain.mode = 'idle';
  express('joy', 1.4);
  hop();
  refresh();
}

let lastPet = -10;
function act(a, opts = {}) {
  advance(pet);
  if (!ready && a !== 'sleep') { toast('Your kitten is still settling in. One moment.'); return false; }
  if (brain.mode === 'play' && a !== 'sleep' && a !== 'pet') { toast('Playtime is in progress. Move the toy around!'); return false; }
  if ((brain.mode === 'feed' || brain.mode === 'brush' || brain.mode === 'drink') && a !== 'sleep' && a !== 'pet') { if (!opts.auto) toast('One thing at a time — almost done!'); return false; }
  if (a === 'pet' && clockNow - lastPet < .9) return false;
  if (pet.sleeping && a === 'pet') {
    twitchEar(undefined, .8);
    say(pick(['Mmm… five more minutes.', 'Zzz… *happy mumble*']), 2600);
    return false;
  }
  const before = {...pet};
  const r = care(pet, a, opts.snack);
  if (!r.ok) {
    if (opts.auto) return false;
    if (a === 'drink') { glanceAt(fountain.position, 1.5); say('Not thirsty right now, thanks!', 2600, true); return false; }
    toast(r.message);
    if (a === 'feed') { twitchEar(); say('I’m stuffed, thank you!', 3600, true); }
    if (a === 'play') { yawn(); say('Too sleepy to play…', 3600, true); }
    return false;
  }
  showDeltas(before);
  const t = clockNow;
  brain.nextIdle = t + 9;
  if (a === 'feed') {
    const name = {kibble: 'crunchy kibble', salmon: 'salmon bites', chicken: 'chicken morsels'}[opts.snack] || 'crunchy kibble';
    kibbles.forEach(k => k.visible = true);
    setMode('feed');
    brain.tailUpUntil = t + 5;
    meow('chirp');
    express('excited', 1);
    say(pick([`${name[0].toUpperCase() + name.slice(1)}?! Best. Human. Ever.`, `Mmm, ${name}! You know the way to my heart.`]));
    walkTo(EAT_SPOT, () => {
      setActivity('eat', 3.8, () => {
        kibbles.forEach(k => k.visible = false);
        burst('sparkle', 5);
        setActivity('groom', 2.4, () => { finishMode(); setActivity('sit'); });
      });
      brain.chewUntil = clockNow + 3.6;
    }, true);
    moment(`A happy tummy, thanks to ${name}.`, 'i-bowl');
  } else if (a === 'drink') {
    setMode('drink');
    if (!opts.auto) { say(pick(['Ooh, fresh water!', 'Sip sip sip…', 'Mrrp! Water time.']), 2600); moment('A refreshing drink from the fountain.', 'i-drop'); }
    walkTo(DRINK_SPOT, () => {
      setActivity('drink', 3.4, () => setActivity('groom', 1.6, () => { finishMode(); setActivity('sit'); }));
    }, false, true);
  } else if (a === 'brush') {
    setMode('brush', 4);
    setActivity('loaf', 4);
    purr(3.6);
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
      say('Zzz… time for a cozy nap.');
      walkTo(CUSHION_SPOT, () => setActivity('sleep'), false, true);
      moment('Tucked in for sweet little dreams.', 'i-moon');
    } else {
      setActivity('stretch', 2.2, () => walkTo(HOME, () => { express('joy', 1.4); hop(); meow('mew'); setActivity('sit'); }));
      setTimeout(yawn, 300);
      say('Good morning, my favourite human.');
      moment('Hello again, sleepyhead.', 'i-sun');
    }
  } else if (a === 'pet') {
    lastPet = t;
    // Stop wandering to enjoy the attention.
    if (brain.mode === 'idle' && brain.activity === 'walk') { brain.target = null; brain.after = null; setActivity('sit'); }
    brain.petTimes = brain.petTimes.filter(x => t - x < 12).concat(t);
    const rollOver = brain.petTimes.length >= 3 && ['sit', 'loaf'].includes(brain.activity) && brain.mode === 'idle';
    if (rollOver) {
      brain.petTimes = [];
      setActivity('belly', 5, () => { setActivity('sit'); hop(); });
      say(pick(['Belly rubs?! Just this once…', 'You may pet the floof.', 'Purrrr… I trust you.']), 3200);
      burst('heart', 7);
    } else {
      express(opts.stroke ? 'bliss' : pet.bond >= 100 && Math.random() < .4 ? 'love' : 'joy', 2.2);
      brain.rubUntil = t + (opts.stroke ? 1.2 : 1.8);
      brain.tailUpUntil = t + 2.5;
      if (!opts.stroke && brain.activity !== 'belly') hop();
      burst('heart', opts.stroke ? 3 : 5, opts.at || headScreen);
      if (!opts.quiet) say(pick(['I like it here. Especially with you.', 'More of that, please.', 'You have excellent petting skills.', 'Purrrr…', 'Right behind the ears. Perfect.']), 3000);
    }
    brain.kneadUntil = t + 2.4;
    purr(2.2);
    if (pet.bond >= 15 && Math.random() < .45) setTimeout(slowBlink, 2400);
    if (pet.cuddles % 5 === 0) moment(`${pet.cuddles} cuddles. One very happy cat.`, 'i-heart');
  }
  refresh();
  save();
  return true;
}

// Play: steer the toy; the kitten chases it, wiggles and pounces.
const PLAY_SECONDS = 25;
function startPlay() {
  setMode('play', PLAY_SECONDS);
  setActivity('play');
  brain.playEnd = clockNow + PLAY_SECONDS;
  brain.catches = 0;
  brain.stillSince = clockNow;
  brain.pounceReadyAt = clockNow + 1.2;
  toyTarget.set(brain.pos.x + rand(-.6, .6), .13, Math.min(1.9, brain.pos.z + 1.3));
  $('#play-meter').hidden = false;
  $('#play-score').textContent = '0 catches';
  express('surprised', .4);
  meow('chirp');
  say('Catch me if you can! Steer the toy around.', 3600, true);
}
// Solo play: when she's in the mood, she bats the ball around the rug by
// herself, chasing it, swatting it and now and then pouncing.
function startSolo() {
  setMode('solo', rand(14, 24));
  setActivity('play');
  brain.stillSince = clockNow;
  brain.pounceReadyAt = clockNow + 1.5;
  express('excited', 1);
}
function endPlay(silent = false) {
  if (brain.mode !== 'play') return;
  brain.mode = 'idle';
  brain.pounce = null;
  host.classList.remove('playing');
  $('#play-meter').hidden = true;
  toyTarget.copy(TOY_HOME);
  setActivity('sit');
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
  if (brain.mode === 'play') {
    brain.catches++;
    $('#play-score').textContent = `${brain.catches} catch${brain.catches === 1 ? '' : 'es'}`;
    burst('sparkle', 4, toyScreen());
    meow('chirp');
  } else if (Math.random() < .3) meow('chirp', 'idle');
  // The toy squirts away from the paws.
  const a = rand(0, Math.PI * 2);
  toyTarget.copy(onRug(new THREE.Vector3(toy.position.x + Math.sin(a) * 1.3, .13, toy.position.z + Math.cos(a) * 1.1))).setY(.13);
  brain.stillSince = clockNow + 1;
  setTimeout(() => express('joy', 1), 300);
}
function toyScreen() {
  const p = toy.position.clone().project(camera);
  return {x: (p.x * .5 + .5) * host.clientWidth, y: (-p.y * .5 + .5) * host.clientHeight};
}
function updatePlay(dt, t) {
  const playing = brain.mode === 'play', solo = brain.mode === 'solo';
  toy.position.x = damp(toy.position.x, toyTarget.x, playing ? 10 : 4, dt);
  toy.position.z = damp(toy.position.z, toyTarget.z, playing ? 10 : 4, dt);
  toyVel.subVectors(toy.position, toyLast).divideScalar(Math.max(dt, 1e-3));
  toyLast.copy(toy.position);
  toy.rotation.x += toyVel.z * dt / .12;
  toy.rotation.z -= toyVel.x * dt / .12;
  if (!playing && !solo) return;
  if (playing) {
    const remaining = brain.playEnd - t;
    $('#play-fill').style.transform = `scaleX(${clamp(remaining / PLAY_SECONDS, 0, 1)})`;
    if (remaining <= 0) { endPlay(); return; }
  } else if (t > brain.modeUntil && !brain.pounce) {
    brain.mode = 'idle';
    setActivity('sit', rand(3, 6));
    if (Math.random() < .5) setTimeout(() => { glanceAt(camera.position, 2); slowBlink(); }, 800);
    return;
  }
  if (brain.jump) return;
  if (toyVel.length() > .35) brain.stillSince = t;
  // A swat lands: the ball rolls off away from her paw.
  if (brain.swatHit && t > brain.swatHit) {
    brain.swatHit = 0;
    const a = brain.heading + rand(-.6, .6), d = rand(.7, 1.4);
    toyTarget.copy(onRug(new THREE.Vector3(toy.position.x + Math.sin(a) * d, .13, toy.position.z + Math.cos(a) * d))).setY(.13);
    brain.stillSince = t + .8;
  }
  if (brain.pounce || brain.activity === 'swat') return;
  const dx = toy.position.x - brain.pos.x, dz = toy.position.z - brain.pos.z, dist = Math.hypot(dx, dz);
  if (solo) {
    // Up close to the ball, then mostly swats, sometimes a pounce.
    if (dist > .85) {
      if (brain.activity !== 'walk' || !brain.target || brain.target.distanceTo(toy.position) > .9) walkTo(new THREE.Vector3(toy.position.x - dx / dist * .6, 0, toy.position.z - dz / dist * .6), () => setActivity('play'), dist > 2.2);
      return;
    }
    if (brain.activity === 'walk') setActivity('play');
    if (brain.activity !== 'play' || t < brain.pounceReadyAt || t - brain.stillSince < .5) return;
    if (Math.random() < .7) {
      brain.swatAt = toy.position.clone();
      setActivity('swat', .45, () => setActivity('play'));
      brain.swatHit = t + .22;
    } else {
      brain.pounce = {start: t, from: brain.pos.clone(), to: onRug(new THREE.Vector3(toy.position.x - dx / dist * .5, 0, toy.position.z - dz / dist * .5)), caught: false};
      express('excited', 1.4);
    }
    brain.pounceReadyAt = t + rand(1.4, 2.8);
    return;
  }
  if (dist > 1.35) {
    // Chase: run to a spot just short of the toy.
    if (brain.activity !== 'walk' || !brain.target || brain.target.distanceTo(toy.position) > 1.2) {
      walkTo(new THREE.Vector3(toy.position.x - dx / dist * .95, 0, toy.position.z - dz / dist * .95), () => setActivity('play'), true);
    }
    return;
  }
  if (brain.activity === 'walk' && dist < 1.1) setActivity('play');
  const still = t - brain.stillSince;
  if (brain.activity === 'play' && t > brain.pounceReadyAt && (still > .7 || (toyVel.length() > 2.5 && Math.random() < dt * 1.5))) {
    const to = new THREE.Vector3(toy.position.x - dx / dist * .55, 0, toy.position.z - dz / dist * .55);
    brain.pounce = {start: t, from: brain.pos.clone(), to: onRug(to), caught: false};
    brain.pounceReadyAt = t + 2;
    express('excited', 1.4);
  }
}

// ---------------------------------------------------------------------------
// Input: stroke the kitten, drag to orbit, steer the toy, look at the pointer
// ---------------------------------------------------------------------------
// Camera: an orbit around a focus point. Everything is eased toward `goal`.
//   one finger / left mouse  orbit        pinch / wheel           zoom
//   two fingers / right drag pan          buttons                 whole room, follow Mochi, food, water, bed
const view = {
  focus: new THREE.Vector3(0, .7, -.2), yaw: 0, pitch: .3, dist: 7,
  goal: {focus: new THREE.Vector3(0, .7, -.2), yaw: 0, pitch: .3, dist: 7},
  mode: 'room', lastDrag: -10, zoomedAt: -100,
};
const LIMITS = {dist: [1.1, 13], pitch: [.04, 1.25], x: [-4.1, 4.1], z: [-2.9, 3.8], y: [.08, 2.4]};
const pointer = new THREE.Vector2(), ray = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.13);
const gazePlane = new THREE.Plane();
let gesture = null;
const touches = new Map();
let pinch = null;

function setPointer(e) {
  const r = host.getBoundingClientRect();
  pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(pointer, camera);
  return r;
}
function hitsCat() { return ready && ray.intersectObjects(cat.meshes, false).length > 0; }
function hitsFountain() { return ready && ray.intersectObjects(room.clickables, false).length > 0; }
function trackPointer(e) {
  const r = setPointer(e);
  brain.pointerAt = clockNow;
  gazePlane.setFromNormalAndCoplanarPoint(tmpV.subVectors(camera.position, cat.root.position).setY(0).normalize(), tmpV2.copy(cat.root.position).setY(1).add(tmpV.multiplyScalar(1.2)));
  ray.ray.intersectPlane(gazePlane, brain.pointerWorld);
  if (brain.mode === 'play') {
    const hit = new THREE.Vector3();
    if (ray.ray.intersectPlane(groundPlane, hit)) toyTarget.copy(onRug(hit.setY(0))).setY(.13);
  }
  return r;
}

function setCamMode(mode) {
  view.mode = mode;
  for (const b of document.querySelectorAll('[data-cam]')) b.setAttribute('aria-pressed', String(b.dataset.cam === mode));
}
function clampGoal() {
  const g = view.goal;
  g.dist = clamp(g.dist, ...LIMITS.dist);
  g.pitch = clamp(g.pitch, ...LIMITS.pitch);
  g.focus.x = clamp(g.focus.x, ...LIMITS.x);
  g.focus.y = clamp(g.focus.y, ...LIMITS.y);
  g.focus.z = clamp(g.focus.z, ...LIMITS.z);
}
function orbit(dx, dy) {
  view.goal.yaw -= dx * .008;
  view.goal.pitch += dy * .006;
  view.lastDrag = clockNow;
  if (view.mode === 'room' || view.mode === 'spot') setCamMode('free');
  clampGoal();
}
function pan(dx, dy) {
  const k = view.goal.dist * .0016, yaw = view.goal.yaw;
  view.goal.focus.x += (-dx * Math.cos(yaw) - dy * Math.sin(yaw) * .6) * k;
  view.goal.focus.z += (dx * Math.sin(yaw) - dy * Math.cos(yaw) * .6) * k;
  view.goal.focus.y += dy * k * .5;
  view.lastDrag = clockNow;
  setCamMode('free');
  clampGoal();
}
function zoomBy(f) {
  view.goal.dist *= f;
  view.lastDrag = view.zoomedAt = clockNow;
  clampGoal();
}

// Ready-made views. Tall (phone) screens stand back a little further.
const tallScreen = () => camera.aspect < .9;
function lookAtSpot(pos, {dist = 2.6, pitch = .42, y = .25} = {}) {
  // View the spot from the open middle of the room, so walls stay behind it.
  const yaw = Math.atan2(.3 - pos.x, 3.2 - pos.z);
  Object.assign(view.goal, {yaw, pitch, dist: dist * (tallScreen() ? 1.35 : 1)});
  view.goal.focus.set(pos.x, y, pos.z);
  setCamMode('spot');
  clampGoal();
}
const CAMERA_VIEWS = {
  room() {
    // Pull back (and aim a little higher) on tall screens so the whole room
    // fits across; a phone in Watch mode is the tallest.
    const tall = clamp(.85 / Math.max(.3, host.clientWidth / Math.max(1, host.clientHeight)), 1, 2.2);
    Object.assign(view.goal, {yaw: 0, pitch: .3, dist: 7.4 * tall});
    view.goal.focus.set(0, .75 + (tall - 1) * .45, -.1);
    setCamMode('room');
  },
  follow() {
    Object.assign(view.goal, {dist: ready ? clamp(fitDistance(framing(false).radius), 2.6, 6) : tallScreen() ? 4.2 : 3.4, pitch: .26});
    view.goal.yaw = Math.atan2(camera.position.x - brain.pos.x, camera.position.z - brain.pos.z);
    setCamMode('follow');
  },
  food: () => lookAtSpot(bowl.position, {y: .15}),
  water: () => lookAtSpot(fountain.position, {y: .2}),
  bed: () => lookAtSpot(bed.position, {dist: 3, y: .3}),
};
for (const b of document.querySelectorAll('[data-cam]')) b.addEventListener('click', () => CAMERA_VIEWS[b.dataset.cam]());

host.addEventListener('contextmenu', e => e.preventDefault());
host.addEventListener('wheel', e => {
  e.preventDefault();
  zoomBy(Math.exp(e.deltaY * (e.ctrlKey ? .01 : .0012)));
}, {passive: false});

host.addEventListener('pointerdown', e => {
  if (e.target.closest('button, .hud, .dock, dialog')) return;
  host.setPointerCapture(e.pointerId);
  touches.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (touches.size === 2) {
    // A second finger: switch from stroking/orbiting to pinch and pan.
    gesture = null;
    host.classList.remove('stroking', 'dragging');
    const [p1, p2] = [...touches.values()];
    pinch = {d: Math.hypot(p1.x - p2.x, p1.y - p2.y), mx: (p1.x + p2.x) / 2, my: (p1.y + p2.y) / 2};
    return;
  }
  if (touches.size > 2) return;
  const r = trackPointer(e);
  const panning = e.button === 2 || e.shiftKey;
  const onCat = !panning && brain.mode !== 'play' && hitsCat();
  const onFountain = !panning && !onCat && brain.mode !== 'play' && hitsFountain();
  gesture = {x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false, onCat, onFountain, panning, stroke: 0, rect: r};
  if (onCat) host.classList.add('stroking');
});
host.addEventListener('pointermove', e => {
  if (e.target.closest('.hud, .dock')) return;
  if (touches.has(e.pointerId)) touches.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (pinch && touches.size >= 2) {
    const [p1, p2] = [...touches.values()];
    const d = Math.hypot(p1.x - p2.x, p1.y - p2.y), mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    if (d > 10 && pinch.d > 10) zoomBy(pinch.d / d);
    pan(mx - pinch.mx, my - pinch.my);
    pinch = {d, mx, my};
    return;
  }
  trackPointer(e);
  if (!gesture) {
    if (e.pointerType === 'mouse') host.classList.toggle('over-cat', brain.mode !== 'play' && (hitsCat() || hitsFountain()));
    return;
  }
  const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
  const sx = e.clientX - gesture.lastX, sy = e.clientY - gesture.lastY;
  if (Math.abs(dx) + Math.abs(dy) > 8) gesture.moved = true;
  if (gesture.onCat) {
    const step = Math.hypot(sx, sy);
    gesture.stroke += step;
    if (!pet.sleeping && step > 1) brain.strokeUntil = clockNow + .5;
    if (gesture.stroke > 240) {
      gesture.stroke = 0;
      act('pet', {stroke: true, quiet: clockNow - lastPet < 6, at: {x: e.clientX - gesture.rect.left, y: e.clientY - gesture.rect.top}});
    }
  } else if (gesture.panning) {
    pan(sx, sy);
    host.classList.add('dragging');
  } else if (brain.mode !== 'play' && gesture.moved) {
    orbit(sx, sy);
    host.classList.add('dragging');
  }
  gesture.lastX = e.clientX; gesture.lastY = e.clientY;
});
function endGesture(e) {
  touches.delete(e.pointerId);
  if (touches.size < 2) pinch = null;
  if (gesture && !gesture.moved && gesture.onFountain) {
    if (pet.sleeping) toast('Shh… wake your kitten first.');
    else act('drink');
  }
  if (gesture && !gesture.moved && gesture.onCat) act('pet', {at: {x: e.clientX - gesture.rect.left, y: e.clientY - gesture.rect.top}});
  gesture = null;
  host.classList.remove('stroking', 'dragging');
}
host.addEventListener('pointerup', endGesture);
host.addEventListener('pointercancel', e => { touches.delete(e.pointerId); pinch = null; gesture = null; host.classList.remove('stroking', 'dragging'); });
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
// Watch mode: the room fills the screen (real full screen where the browser
// allows it; on an iPhone the home-screen app is already edge to edge).
function setWatch(on) {
  document.body.classList.toggle('watch', on);
  $('#watch-btn').setAttribute('aria-pressed', String(on));
  $('#watch-btn span').textContent = on ? 'Exit' : 'Watch';
  try {
    if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  } catch {}
  // Once the layout has changed size.
  setTimeout(() => CAMERA_VIEWS.room(), 80);
}
$('#watch-btn').onclick = () => setWatch(!document.body.classList.contains('watch'));
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('watch')) setWatch(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('watch')) setWatch(false); });

// Room decor: the furniture stays put, only the look changes (decor.js).
const DECOR_SWATCHES = {classic: ['#3f472b', '#1e2536', '#5a3a22', '#e6dcc0'], thanksgiving: ['#d8cbb3', '#96a380', '#e0995e', '#b58a3c']};
function renderDecor() {
  $('#decor-options').innerHTML = Object.entries(DECORS).map(([id, d]) => `<button type="button" data-decor="${id}" aria-pressed="${room.decor === id}" style="--tint:var(--accent)"><span class="decor-swatch">${DECOR_SWATCHES[id].map(c => `<i style="background:${c}"></i>`).join('')}</span><strong>${d.name}</strong><small>${d.note}</small></button>`).join('');
}
$('#decor-btn').onclick = () => { renderDecor(); $('#decor-dialog').showModal(); };
$('#decor-options').addEventListener('click', e => {
  const b = e.target.closest('[data-decor]');
  if (!b) return;
  const id = b.dataset.decor;
  $('#decor-dialog').close();
  if (room.decor === id) return;
  // Let the menu close and the note show before the room is redressed.
  toast('Decorating…');
  setTimeout(() => {
    applyDecor(room, id);
    pet.decor = id;
    save();
    toast(`${DECORS[id].name}`);
  }, 120);
  if (ready && !pet.sleeping) { express('curious', 1.6); glanceAt(new THREE.Vector3(rand(-2, 2), 1.4, -2.5), 2); }
});

// Backup codes (save.js): copy one out, or bring a kitten in from one.
$('#open-backup').onclick = () => {
  $('#name-dialog').close();
  $('#backup-code').value = toCode(pet);
  $('#restore-code').value = '';
  document.querySelectorAll('.pet-name-slot').forEach(el => el.textContent = pet.name);
  $('#share-backup').hidden = !navigator.share;
  $('#backup-dialog').showModal();
};
$('#close-backup').onclick = () => $('#backup-dialog').close();
$('#copy-backup').onclick = async () => {
  const code = $('#backup-code');
  try { await navigator.clipboard.writeText(code.value); toast('Backup code copied. Keep it somewhere safe.'); }
  catch { code.focus(); code.select(); toast('Select the code and copy it.'); }
};
$('#share-backup').onclick = () => navigator.share({title: `${pet.name}'s backup code`, text: $('#backup-code').value}).catch(() => {});
$('#backup-form').onsubmit = e => {
  e.preventDefault();
  const incoming = fromCode($('#restore-code').value);
  if (!incoming) { toast('That doesn’t look like a backup code. Paste the whole code, starting with MOCHI1.'); return; }
  if (!confirm(`Bring ${incoming.name} home? This replaces ${pet.name} on this device.`)) return;
  // In place: other parts of the app hold on to this object.
  for (const key of Object.keys(pet)) delete pet[key];
  Object.assign(pet, incoming);
  save();
  refresh(); renderJournal();
  $('#backup-dialog').close();
  toast(`Welcome home, ${pet.name}`);
  if (ready && !pet.sleeping) { express('joy', 1.6); meow('mew'); }
};
$('#name-form').onsubmit = e => {
  e.preventDefault();
  const name = $('#name-input').value.trim();
  if (!name) return;
  pet.name = name.slice(0, 24);
  moment('A name to love: ' + pet.name + '.', 'i-heart');
  refresh();
  $('#name-dialog').close();
  toast('Hello, ' + pet.name);
  if (ready && !pet.sleeping) { express('joy', 1.6); hop(); meow('mew'); say(`${pet.name}? I love it!`, 3600, true); }
};
// Sound panel: an on/off switch and Mochi's volume.
function toggleSoundPanel(open = $('#sound-panel').hidden) {
  $('#sound-panel').hidden = !open;
  $('#sound').setAttribute('aria-expanded', String(open));
}
$('#sound').onclick = () => toggleSoundPanel();
document.addEventListener('pointerdown', e => { if (!e.target.closest('.sound-wrap')) toggleSoundPanel(false); });
$('#sound-on').onchange = e => {
  pet.sound = e.target.checked;
  sounds.setEnabled(pet.sound);
  refresh(); save();
  if (pet.sound) { meow('mew'); twitchEar(0); twitchEar(1); }
};
for (const [id, kind, key] of [['#vol-cat', 'cat', 'catVolume']]) {
  $(id).oninput = e => { pet[key] = +e.target.value; sounds.setVolume(kind, pet[key]); };
  $(id).onchange = () => { save(); if (kind === 'cat' && pet.sound) meow('mew'); };
}
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

// Build label: version.json is written by the site's deploy workflow (build
// number = commits on the branch, plus the commit itself). Preview builds
// show it at the top so reviewers can match what they see to a review pack.
fetch('./version.json', {cache: 'no-store'}).then(r => r.ok ? r.json() : null).then(v => {
  if (!v) return;
  const text = `${v.channel === 'preview' ? 'Preview' : 'Version'} build ${v.build} · ${v.commit}`;
  $('#build-label').textContent = text;
  if (v.channel === 'preview') { $('#build-chip').innerHTML = `Preview<span class="long"> · build</span> ${v.build}`; $('#build-chip').hidden = false; $('#review-link').hidden = false; }
}).catch(() => {});

// ---------------------------------------------------------------------------
// Camera & frame loop
// ---------------------------------------------------------------------------
const camOffset = new THREE.Vector3();
// The space Mochi takes up right now (head, hips, tail, paws), and the toy
// too while playing, as a centre and radius.
const frameBox = new THREE.Box3(), framePt = new THREE.Vector3(), frameOut = {center: new THREE.Vector3(), radius: 1};
function framing(withToy) {
  frameBox.makeEmpty();
  frameBox.expandByPoint(cat.headTop(framePt));
  for (const b of ['hips', 'tail4', 'tail7', 'wristR', 'wristL', 'hockR', 'hockL']) frameBox.expandByPoint(cat.bones[b].getWorldPosition(framePt));
  if (withToy) frameBox.expandByPoint(toy.position);
  frameBox.getCenter(frameOut.center);
  frameOut.center.y = clamp(frameOut.center.y, .3, 1);
  frameOut.radius = frameBox.getSize(framePt).length() / 2 + .15;
  return frameOut;
}
// Camera distance that fits a sphere of this radius on screen.
function fitDistance(radius) {
  const half = THREE.MathUtils.degToRad(camera.fov / 2), halfH = Math.atan(Math.tan(half) * camera.aspect);
  return radius / Math.sin(Math.min(half, halfH)) * 1.05;
}
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  camera.aspect = w / h;
  camera.fov = w / h < .9 ? 46 : 40;
  camera.updateProjectionMatrix();
  renderer?.setSize(w, h);
}
new ResizeObserver(resize).observe(host);
resize();
CAMERA_VIEWS.room();
view.focus.copy(view.goal.focus);
Object.assign(view, {yaw: view.goal.yaw, pitch: view.goal.pitch, dist: view.goal.dist});

// Room bounds for the camera itself: it may stand back past the open front,
// but never behind the back or side walls.
const CAM_BOX = {x: [-4.3, 3.75], y: [.2, 6.5], z: [-3.1, 16]};
// Tall furniture the camera must not end up inside: [x, z, radius, height].
const CAM_SOLIDS = [[2.45, -2.0, 1.3, 2.3], [.55, -2.85, .75, 2.6], [4.0, -1.25, .75, 4.4], [-2.35, -1.75, 1.0, .55]];
function updateCamera(dt) {
  const g = view.goal, following = view.mode === 'follow' && ready;
  let distGoal = g.dist;
  if (following) {
    // Keep Mochi (and, while playing, the toy) comfortably in frame. The
    // camera only re-centres once she has moved a little way off, eases
    // there gently, and backs off when cat and toy are far apart. Turning
    // and zoom stay yours: this never changes the angle, and your zoom is
    // the closest it will go.
    const playing = brain.mode === 'play';
    const frame = framing(playing);
    if (frame.center.distanceTo(g.focus) > (playing ? .2 : .3)) g.focus.copy(frame.center);
    clampGoal();
    // Your own zoom wins for a while after you pinch or scroll.
    if (clockNow - view.zoomedAt > 8) distGoal = Math.max(g.dist, fitDistance(frame.radius));
  }
  const r = following ? 2.2 : 5;
  view.focus.x = damp(view.focus.x, g.focus.x, r, dt);
  view.focus.y = damp(view.focus.y, g.focus.y, r, dt);
  view.focus.z = damp(view.focus.z, g.focus.z, r, dt);
  view.yaw = damp(view.yaw, g.yaw, 8, dt);
  view.pitch = damp(view.pitch, g.pitch, 8, dt);
  view.dist = damp(view.dist, distGoal, following && distGoal > g.dist ? 1.6 : 7, dt);
  camOffset.set(Math.sin(view.yaw) * Math.cos(view.pitch), Math.sin(view.pitch), Math.cos(view.yaw) * Math.cos(view.pitch));
  // Spring arm: if the camera would leave the room, shorten the arm instead.
  let d = view.dist;
  for (const [k, [lo, hi]] of Object.entries(CAM_BOX)) {
    const o = camOffset[k], f = view.focus[k];
    if (o > 1e-4 && f + o * d > hi) d = Math.min(d, (hi - f) / o);
    if (o < -1e-4 && f + o * d < lo) d = Math.min(d, (lo - f) / o);
  }
  // Keep furniture from coming between the camera and what it looks at:
  // stop the arm just in front of the first tall piece in the way.
  const fx = view.focus.x, fz = view.focus.z, ox = camOffset.x, oz = camOffset.z, hz = Math.hypot(ox, oz);
  if (hz > 1e-4) for (const [cx, cz, r, h] of CAM_SOLIDS) {
    const px = fx - cx, pz = fz - cz;
    if (px * px + pz * pz < r * r) continue; // looking at the piece itself
    const a2 = ox * ox + oz * oz, b2 = 2 * (px * ox + pz * oz), c2 = px * px + pz * pz - r * r, disc = b2 * b2 - 4 * a2 * c2;
    if (disc < 0) continue;
    const tHit = (-b2 - Math.sqrt(disc)) / (2 * a2);
    if (tHit > 0 && tHit < d && view.focus.y + camOffset.y * tHit < h) d = tHit - .15;
  }
  camera.position.copy(view.focus).addScaledVector(camOffset, Math.max(.6, d));
  camera.lookAt(view.focus);
}

function updateRoom(dt, t) {
  const night = pet.sleeping;
  sun.intensity = damp(sun.intensity, night ? .05 : 3.2, 3, dt);
  ambient.intensity = damp(ambient.intensity, night ? .35 : 1.5, 3, dt);
  rim.intensity = damp(rim.intensity, night ? 0 : 1.8, 3, dt);
  moon.intensity = damp(moon.intensity, night ? .45 : 0, 3, dt);
  fill.intensity = damp(fill.intensity, night ? .7 : 0, 3, dt);
  room.update(dt, t, night, {drinking: brain.activity === 'drink', camera});

  // Feeding: kibble disappears bite by bite.
  if (brain.activity === 'eat') {
    const p = clamp((t - brain.actStart - .5) / 3, 0, 1);
    kibbles.forEach((k, i) => k.visible = i >= Math.floor(p * kibbles.length));
  }
  // Brushing: slow strokes along the back.
  const brushing = brain.mode === 'brush';
  brushTool.scale.setScalar(damp(brushTool.scale.x, brushing ? 1.2 : 0, 8, dt));
  if (brushTool.scale.x > .01) {
    const p = ((t - brain.modeStart) / 1.1) % 1, s = Math.sin(p * Math.PI);
    brushRig.position.set(.2, .7 + s * .1, lerp(.3, -.5, p));
    brushRig.rotation.set(0, Math.PI / 2, .35);
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
  if (brain.mode === 'brush' && t > brain.modeUntil) finishMode();
  // Her own catnaps restore a little energy (about 1 a minute).
  if (ready && brain.activity === 'catnap') pet.energy = Math.min(100, pet.energy + dt / 60);
  updatePlay(dt, t);
  if (ready) updateCat(dt, t);
  updateCamera(dt);
  updateRoom(dt, t);
  if (ready) {
    idleLife(t);
    placeSpeech();
  }
  renderer.render(scene, camera);
}

// Handy for visual QA: open with ?debug to drive the kitten from the console.
if (new URLSearchParams(location.search).has('debug')) window.kitten = {brain, cat, express, act, yawn, slowBlink, meow, hop, view, setActivity, walkTo, jumpTo, jumpDown, startSolo, knockBook, room, PERCHES, SUN_SPOT, renderer, orbit, pan, zoomBy, toy, toyTarget, sounds, pet, say, CAMERA_VIEWS, camera};

renderer?.setAnimationLoop(now => { if (!document.hidden) frame(now); else last = now; });
