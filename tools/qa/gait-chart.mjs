// Footfall chart of a straight walk (RUN=1: a run) at the app's own speed:
// per stride, which paws are down at each 1/40 of it (# down, . swing, e a
// catch-up step), plus cadence, stretch, track width, body bob and sway.
//   node tools/qa/gait-chart.mjs     (FLAGS='&gait=long' etc., SEED=777)
import {open} from './lib.mjs';
const {page, step, close} = await open({seed: +(process.env.SEED || 777), flags: process.env.FLAGS || ''});
console.log(await page.evaluate(() => {
  const m = kitten.cat.motion, R = m.rig.restPos, S = m.S, r = kitten.cat.root;
  const d = (a, b) => R[a].distanceTo(R[b]);
  return `root scale ${r.scale.x.toFixed(3)}  hips y ${S.hips.y.toFixed(3)} hip joint y ${R.hipL.y.toFixed(3)} shoulder joint y ${R.shoulderL.y.toFixed(3)}  hipL-hipR ${(R.hipL.x - R.hipR.x).toFixed(3)}  shoulderL-R ${(R.shoulderL.x - R.shoulderR.x).toFixed(3)}  frontZ ${S.frontZ.toFixed(3)} hindZ ${S.hindZ.toFixed(3)} (body length ${(S.frontZ - S.hindZ).toFixed(3)})  home0: ${Object.entries(m.home0).map(([k, v]) => k + ' x' + v.x.toFixed(3) + ' z' + v.z.toFixed(3)).join(', ')}  legs: ${Object.entries(m.rig.legs).map(([k, L]) => k + ' ' + (L.la + L.lb).toFixed(3)).join(' ')}`;
}));
await page.evaluate(run => {
  const B = kitten.brain, V = kitten.cat.root.position.constructor;
  B.mode = 'idle'; B.pos.set(-3, 0, .4); B.heading = Math.PI / 2;
  kitten.walkTo(new V(7, 0, .4), () => kitten.setActivity('sit', 1e9), run, true);
}, !!process.env.RUN);
await step(40);
const L = [];
for (let i = 0; i < 300; i++) {
  await step(1, 1 / 60);
  L.push(await page.evaluate(() => {
    const m = kitten.cat.motion, r = kitten.cat.root, y0 = r.position.y, b = kitten.cat.bones, V = r.position.constructor;
    const hips = r.worldToLocal(b.hips.getWorldPosition(new V())), head = r.worldToLocal(b.head.getWorldPosition(new V()));
    return {phase: m.phase, speed: m.vel.length(), act: kitten.brain.activity, down: ['LF','RF','LH','RH'].filter(k => m.paws[k].pos.y - y0 <= 1e-4 && !m.paws[k].swing), early: ['LF','RF','LH','RH'].filter(k => m.paws[k].swing?.early), hipsX: hips.x, headX: head.x, hipsY: hips.y, headY: head.y, short: Object.fromEntries(['LF','RF','LH','RH'].map(k => [k, m.rig.legs[k].reachShort || 0])), px: Object.fromEntries(['LF','RF','LH','RH'].map(k => [k, r.worldToLocal(m.paws[k].pos.clone()).x]))};
  }));
}
await close();
const w = L.filter(l => l.act === 'walk');
// Chart: rows = paws, columns = phase bins; one stride at a time.
let strides = [], cur = [];
for (let i = 1; i < w.length; i++) { if (w[i].phase < w[i - 1].phase) { strides.push(cur); cur = []; } cur.push(w[i]); }
console.log(`speed ${(w.reduce((a, l) => a + l.speed, 0) / w.length).toFixed(2)}  strides ${strides.length}  hips sway +-${((Math.max(...w.map(l => l.hipsX)) - Math.min(...w.map(l => l.hipsX))) / 2 * 100).toFixed(1)}cm  head sway +-${((Math.max(...w.map(l => l.headX)) - Math.min(...w.map(l => l.headX))) / 2 * 100).toFixed(1)}cm  hips bob ${((Math.max(...w.map(l => l.hipsY)) - Math.min(...w.map(l => l.hipsY))) * 100).toFixed(1)}cm head bob ${((Math.max(...w.map(l => l.headY)) - Math.min(...w.map(l => l.headY))) * 100).toFixed(1)}cm`);
console.log('strides/s', (strides.length / (w.length / 60)).toFixed(2), 'stretched worst', ['LF','RF','LH','RH'].map(k => k + ' ' + (Math.max(...w.map(l => l.short[k])) * 100).toFixed(1) + 'cm').join(' '), 'planted x', ['LF','RF','LH','RH'].map(k => k + ' ' + (w.filter(l => l.down.includes(k)).reduce((a, l) => a + l.px[k], 0) / w.filter(l => l.down.includes(k)).length * 100).toFixed(1)).join(' '));
for (const s of strides.slice(1, 3)) {
  console.log('phase  0         .25       .5        .75       1');
  for (const k of ['LH', 'LF', 'RH', 'RF']) {
    let row = '';
    for (let b = 0; b < 40; b++) { const f = s.filter(l => Math.floor(l.phase * 40) === b); row += !f.length ? ' ' : f.every(l => l.down.includes(k)) ? '#' : f.some(l => l.down.includes(k)) ? '+' : f.some(l => l.early.includes(k)) ? 'e' : '.'; }
    console.log(`${k}     ${row}`);
  }
  console.log('');
}
