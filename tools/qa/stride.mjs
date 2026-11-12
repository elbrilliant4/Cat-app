// The run, measured through a straight sprint: how often she strides, how
// far the head and the hips bob, how much the back bends, how much of the
// time all four paws are off the floor, leg stretch. With SHEET=1 also a
// sheet of side-view stills through one stride (OUT, default
// qa-out/stride.png; needs ffmpeg).
//   node tools/qa/stride.mjs      (RUN=2.6, SEED=777, FLAGS, SHEET=1, N=12, FROM="-2.6 .8", TO="2.6 .8")
import {open} from './lib.mjs';
import fs from 'node:fs'; import path from 'node:path'; import {execFileSync} from 'node:child_process';
const RUN = process.env.RUN ? +process.env.RUN : null, SHEET = !!process.env.SHEET, N = +(process.env.N || 12);
const OUT = path.resolve(process.env.OUT || 'qa-out/stride.png'), DIR = OUT + '.frames';
const FROM = (process.env.FROM || '-2.6 .8').split(' ').map(Number), TO = (process.env.TO || '2.6 .8').split(' ').map(Number);
const {page, step, close} = await open({seed: +(process.env.SEED || 777), flags: process.env.FLAGS || '', width: 480, height: 420});
await page.evaluate(([from, to, run]) => {
  const V = kitten.cat.root.position.constructor, B = kitten.brain, m = kitten.cat.motion, u = m.update.bind(m), bones = kitten.cat.bones;
  B.mode = 'idle'; B.pos.set(from[0], 0, from[1]); B.heading = Math.atan2(to[0] - from[0], to[1] - from[1]);
  window.R = []; const p = new V(), q = new V();
  m.update = (dt, t, ctl) => {
    u(dt, t, ctl);
    kitten.cat.root.updateMatrixWorld(true);
    const y = b => bones[b].getWorldPosition(p).y;
    // (The back's bend: how far the middle of the back stands above the line from hips to chest.)
    R.push({t, speed: B.speed, phase: m.phase, runW: m.runW || 0, trotW: m.trotW || 0, head: y('head'), hips: y('hips'), chest: y('chest'),
      nose: Math.asin(new V(0, 0, 1).applyQuaternion(bones.head.getWorldQuaternion(new kitten.cat.root.quaternion.constructor())).y),
      len: bones.chest.getWorldPosition(p).distanceTo(bones.hips.getWorldPosition(q)),
      up: ['LF', 'RF', 'LH', 'RH'].map(k => m.paws[k].swing ? 1 : 0).join(''), short: Math.max(...['LF', 'RF', 'LH', 'RH'].map(k => m.rig.legs[k].reachShort || 0))});
  };
  kitten.cat.update = (dt, t, ctl) => m.update(dt, t, ctl);
  window.go = () => kitten.walkTo(new V(to[0], 0, to[1]), () => kitten.setActivity('sit', 1e9), run ?? kitten.DASH ?? 2.6, true);
}, [FROM, TO, RUN]);
await step(110);
await page.evaluate(() => { R.length = 0; go(); });
const cam = () => page.evaluate(() => { const w = kitten.view, B = kitten.brain, r = kitten.cat.root; w.mode = 'free';
  for (const o of [w, w.goal]) { o.focus.set(r.position.x, .05, r.position.z); Object.assign(o, {yaw: B.heading - Math.PI / 2, pitch: .04, dist: 3.6}); } w.cut = 0; w.lift = 0; });
// Run at 60 frames a second until she's at full speed, then (SHEET) N stills through one stride.
let shots = 0;
if (SHEET) { fs.rmSync(DIR, {recursive: true, force: true}); fs.mkdirSync(DIR, {recursive: true}); }
for (let i = 0; i < 400; i++) {
  const s = await page.evaluate(() => { const r = R[R.length - 1] || {}, m = kitten.cat.motion; return {a: kitten.brain.activity, runW: r.runW, speed: r.speed, n: R.length}; });
  if (s.a !== 'walk') break;
  if (SHEET && shots < N && s.n > +(process.env.AFTER || 36)) {
    // (One stride in N stills: the stride's length in frames from the last few.)
    const per = await page.evaluate(() => { const a = R.slice(-8); let d = 0; for (let i = 1; i < a.length; i++) d += ((a[i].phase - a[i - 1].phase) % 1 + 1) % 1; return d / (a.length - 1); });
    const k = Math.max(1, Math.round(1 / per / N));
    await cam(); await step(k, 1 / 60);
    await page.screenshot({path: `${DIR}/${String(shots++).padStart(3, '0')}.png`});
  } else await step(2, 1 / 60);
}
const out = await page.evaluate(() => {
  const top0 = Math.max(...R.map(r => r.speed)), g = R.filter(r => r.runW > .9 && r.speed > .97 * top0), all = R.filter(r => r.speed > .3);
  if (g.length < 4) return `too few gallop frames (${g.length} of ${all.length} moving)`;
  const rng = k => (Math.max(...g.map(r => r[k])) - Math.min(...g.map(r => r[k]))) * 100;
  let turns = 0; for (let i = 1; i < g.length; i++) turns += ((g[i].phase - g[i - 1].phase) % 1 + 1) % 1;
  const secs = g[g.length - 1].t - g[0].t, top = Math.max(...R.map(r => r.speed));
  const first = R.find(r => r.runW > .9), gal = R.filter(r => r.runW > .9), t0 = R[0].t;
  return [`top speed ${top.toFixed(2)}; galloping ${(100 * gal.length / all.length).toFixed(0)}% of the run, from ${(first.t - t0).toFixed(2)} s after setting off; trotting ${(100 * all.filter(r => r.trotW > .5 && r.runW < .5).length / all.length).toFixed(0)}%`,
    `at full speed (${g.length} frames): strides a second ${(turns / secs).toFixed(2)}, stride length ${(g.reduce((s, r) => s + r.speed, 0) / g.length * secs / turns).toFixed(2)}`,
    `bob: head ${rng('head').toFixed(1)} cm, hips ${rng('hips').toFixed(1)} cm, chest ${rng('chest').toFixed(1)} cm; nose tilt ${(rng('nose') / 100 * 57.3).toFixed(1)} deg`,
    `back: hips to chest ${(Math.min(...g.map(r => r.len)) * 100).toFixed(1)} to ${(Math.max(...g.map(r => r.len)) * 100).toFixed(1)} cm`,
    `all four paws up ${(100 * g.filter(r => r.up === '1111').length / g.length).toFixed(0)}%, both hind up ${(100 * g.filter(r => r.up.endsWith('11')).length / g.length).toFixed(0)}%, both front up ${(100 * g.filter(r => r.up.startsWith('11')).length / g.length).toFixed(0)}%`,
    `leg stretched >2cm ${(100 * g.filter(r => r.short > .02).length / g.length).toFixed(1)}% of gallop frames, worst ${(Math.max(...g.map(r => r.short)) * 100).toFixed(1)} cm (whole run: ${(100 * all.filter(r => r.short > .02).length / all.length).toFixed(1)}%, ${(Math.max(...all.map(r => r.short)) * 100).toFixed(1)} cm)`].join('\n');
});
console.log(out);
await close();
if (SHEET && shots) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${DIR}/%03d.png`, '-vf', `tile=${Math.min(4, shots)}x${Math.ceil(shots / 4)}`, '-frames:v', '1', OUT]);
  fs.rmSync(DIR, {recursive: true, force: true}); console.log('wrote', OUT);
}
