// How smooth she moves, as numbers: she sits, walks across the room and sits
// down, runs back and sits, jumps to the mantel and down. Each frame (1/60 s,
// nothing drawn, so it is quick) the head, chest and hips are read; a jolt
// shows as a spike in how fast their speed or their turning changes.
// Prints, per part of the trip and per body part: the worst and the usual
// (95th percentile) change of speed (m/s2) and of turning (rad/s2), and the
// frames over the limits (POP, POPA), with what she was doing.
//   FLAGS='&mochi=longhair' node tools/qa/smooth.mjs     (SEED=7, OUT=file.json for every frame)
import {open} from './lib.mjs';
import fs from 'node:fs';
const POP = +(process.env.POP || 30), POPA = +(process.env.POPA || 250);
const {page, close} = await open({seed: +(process.env.SEED || 7), flags: (process.env.FLAGS || '') + '&intro=0'});
const frames = await page.evaluate(() => {
  const V = kitten.cat.root.position.constructor, Q = kitten.cat.root.quaternion.constructor, B = kitten.cat.bones;
  const r = kitten.renderer, render = r.render, dt = 1 / 60, out = [];
  __vt.on = true; r.render = () => {};
  const p0 = kitten.brain.pos.clone(), far = new V(p0.x > 0 ? p0.x - 2.4 : p0.x + 2.4, 0, p0.z);
  const run = (part, n) => {
    for (let i = 0; i < n; i++) {
      kitten.step(dt, 1); __vt.tick(dt * 1000);
      const f = {part, act: kitten.brain.activity, speed: +kitten.brain.speed.toFixed(3), air: !!kitten.brain.jump};
      for (const k of ['head', 'chest', 'hips']) { const p = B[k].getWorldPosition(new V()), q = B[k].getWorldQuaternion(new Q()); f[k] = [p.x, p.y, p.z, q.x, q.y, q.z, q.w]; }
      out.push(f);
    }
  };
  kitten.brain.mode = 'idle'; kitten.setActivity('sit', 1e9);
  run('settle', 120); out.length = 0;
  run('sit', 60);
  kitten.walkTo(far, () => kitten.setActivity('sit', 1e9), false, true); run('walk and sit down', 420);
  kitten.walkTo(new V(p0.x, 0, p0.z), () => kitten.setActivity('sit', 1e9), true, true); run('run and sit down', 360);
  kitten.jumpTo('mantel', () => kitten.setActivity('sit', .8, () => kitten.jumpDown(() => kitten.setActivity('sit', 1e9))), 1e9); run('jump up and down', 600);
  r.render = render;
  return out;
});
await close();
if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(frames));
const dt = 1 / 60, parts = [...new Set(frames.map(f => f.part))];
const pct = (a, p) => a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : 0;
const ang = (a, b) => { const d = Math.abs(a[3] * b[3] + a[4] * b[4] + a[5] * b[5] + a[6] * b[6]); return 2 * Math.acos(Math.min(1, d)); };
const pops = [];
for (const part of parts) {
  console.log(part);
  for (const k of ['head', 'chest', 'hips']) {
    const acc = [], aacc = [];
    for (let i = 2; i < frames.length; i++) {
      const a = frames[i - 2], b = frames[i - 1], c = frames[i];
      if (c.part !== part || a.part !== part) continue;
      const A = Math.hypot(...[0, 1, 2].map(j => c[k][j] - 2 * b[k][j] + a[k][j])) / dt / dt;
      const W = Math.abs(ang(b[k], c[k]) - ang(a[k], b[k])) / dt / dt;
      acc.push(A); aacc.push(W);
      if (A > POP || W > POPA) pops.push(`  frame ${i} (${(i * dt).toFixed(2)}s) ${part}: ${k} ${A.toFixed(0)} m/s2, ${W.toFixed(0)} rad/s2, doing ${c.act}${c.air ? ' (in the air)' : ''}, speed ${c.speed}`);
    }
    console.log(`  ${k.padEnd(5)} speed change: worst ${Math.max(0, ...acc).toFixed(1)} usual ${pct(acc, .95).toFixed(1)} m/s2   turning change: worst ${Math.max(0, ...aacc).toFixed(0)} usual ${pct(aacc, .95).toFixed(0)} rad/s2   over the limit: ${acc.filter(x => x > POP).length + aacc.filter(x => x > POPA).length} frames`);
  }
}
console.log(`jolts (over ${POP} m/s2 or ${POPA} rad/s2): ${pops.length}`);
console.log(pops.slice(0, 40).join('\n'));
