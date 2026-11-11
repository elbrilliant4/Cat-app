// Tail check: lets her go about her day in the study or the kitchen (feeding,
// drinking, play, naps in her bed, jumps up to her perches, strolls) and
// reports how far each point along her tail went into the furniture. The
// furniture is read off the real meshes (boxes, and round things as
// cylinders), not the shapes the app's own tail check uses, so a negative
// number means the tail really went through something.
//   node tools/qa/tail.mjs            (ROOM=study, SEC=300, SEED=5, SHOTS=1, OUT=qa-out)
//   ROOM=kitchen node tools/qa/tail.mjs
// Prints the worst moment per piece of furniture, a log of every overlap
// deeper than the skin (-.03), and the share of frames with any overlap.
// A screenshot of each new worst moment goes to OUT/tail-<room>-<n>.png.
import fs from 'node:fs';
import {open} from './lib.mjs';
const ROOM = process.env.ROOM || 'study', SEC = +(process.env.SEC || 300), SEED = +(process.env.SEED || 5), SHOTS = process.env.SHOTS !== '0', OUT = process.env.OUT || 'qa-out';
const kitchen = ROOM === 'kitchen';
fs.mkdirSync(OUT, {recursive: true});
const {page, look, close} = await open({seed: SEED, kitchen, quiet: false});

await page.evaluate(kitchen => {
  const k = kitten, G = kitchen ? k.kitchen : k.room, V3 = k.cat.root.position.constructor;
  // Names by what a mesh belongs to, or else by the nearest known spot.
  const groups = kitchen
    ? [[G.island, 'island'], [G.counterGroup, 'counter'], [k.room.bowl, 'bowl'], [k.room.fountain, 'fountain'], ...G.walls.map(g => [g, 'wall'])]
    : [[G.chair, 'chair'], [G.fireplace, 'fireplace'], [G.windowGroup, 'window'], [G.oliveTree, 'olive tree'], [k.room.bowl, 'bowl'], [k.room.fountain, 'fountain'], ...G.wallGroups.map(g => [g, 'wall'])];
  const anchors = kitchen
    ? [['stool L', -3.0, 2.4], ['stool R', -1.85, 2.4], ['dock', 3.15, -2.62]]
    : [['side table', .55, -2.85], ['ivy pot', -4.0, -2.85]];
  const nameOf = (m, c) => {
    for (const [g, n] of groups) { let p = m; while (p) { if (p === g) return n; p = p.parent; } }
    let best = null, bd = 9;
    for (const [n, x, z] of anchors) { const d = Math.hypot(c.x - x, c.z - z); if (d < bd && d < .9) { bd = d; best = n; } }
    return best || 'wall';
  };
  // Her bed (or the tent) is measured as one shape below, and only while
  // she's out of it; the vacuum moves about (vacuum.mjs checks it).
  const skip = new Set(); for (const g of [G.bed, k.cat.root, G.vacuum, G.dog?.g].filter(Boolean)) g.traverse(o => skip.add(o));
  const shown = m => { for (let p = m; p; p = p.parent) if (!p.visible && p !== G.group) return false; return true; };
  const solids = [];
  G.group.updateMatrixWorld(true);
  G.group.traverse(m => {
    if (!m.isMesh || m.isInstancedMesh || skip.has(m) || !shown(m)) return;
    m.geometry.computeBoundingBox();
    const b = m.geometry.boundingBox, mn = new V3(Infinity, Infinity, Infinity), mx = new V3(-Infinity, -Infinity, -Infinity), p = new V3();
    for (let i = 0; i < 8; i++) { p.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(m.matrixWorld); mn.min(p); mx.max(p); }
    // Solid things only: not the floor, rugs and mats (flat), nor flat
    // panels standing up (pictures, the firebox's brick, the window glass:
    // a plane), nor anything she can't reach (over 3 m up).
    // (The rug and the hearth slab are lain on, not run into: under 8 cm.)
    if (mx.y < .08 || mx.y - mn.y < .03 || mn.y > 3 || /Plane|Ring|Circle/.test(m.geometry.type)) return;
    if (Math.min(mx.x - mn.x, mx.z - mn.z) < .015) return;
    const c = {x: (mn.x + mx.x) / 2, z: (mn.z + mx.z) / 2};
    // Upright round things (pots, the bowl, legs) are cylinders. Anything
    // else in a turned group (the armchair) is boxed in that group's own
    // frame, a turned box; the rest are boxes on the room's axes.
    const q = m.getWorldQuaternion(new m.quaternion.constructor()), upright = Math.abs(q.x) < .02 && Math.abs(q.z) < .02;
    const w = mx.x - mn.x, d = mx.z - mn.z, round = upright && /Cylinder|Lathe|Torus|Sphere|Dodecahedron/.test(m.geometry.type) && Math.min(w, d) > .7 * Math.max(w, d);
    const gq = m.parent.getWorldQuaternion(new m.quaternion.constructor()), yaw = Math.atan2(2 * (gq.w * gq.y + gq.x * gq.z), 1 - 2 * (gq.y * gq.y + gq.x * gq.x));
    if (!round && Math.abs(Math.sin(yaw * 2)) > .05) {
      const cs = Math.cos(yaw), sn = Math.sin(yaw);
      let a0 = Infinity, a1 = -Infinity, c0 = Infinity, c1 = -Infinity;
      for (let i = 0; i < 8; i++) {
        p.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(m.matrixWorld);
        const lx = cs * p.x - sn * p.z, lz = sn * p.x + cs * p.z;
        a0 = Math.min(a0, lx); a1 = Math.max(a1, lx); c0 = Math.min(c0, lz); c1 = Math.max(c1, lz);
      }
      const lx = (a0 + a1) / 2, lz = (c0 + c1) / 2;
      solids.push({name: nameOf(m, c), kind: 'rbox', x: cs * lx + sn * lz, z: -sn * lx + cs * lz, ry: yaw, hx: (a1 - a0) / 2, hz: (c1 - c0) / 2, y0: mn.y, y1: mx.y});
      return;
    }
    solids.push({name: nameOf(m, c), kind: round ? 'cyl' : 'box', x0: mn.x, x1: mx.x, y0: mn.y, y1: mx.y, z0: mn.z, z1: mx.z, cx: c.x, cz: c.z, r: Math.max(w, d) / 2});
  });
  // Her bed: the study's round bed (its rim, .45 high), or the tent's
  // footprint (poles to poles).
  const bed = G.bed, bedSolid = kitchen
    ? {name: 'tent', kind: 'rbox', x: bed.position.x, z: bed.position.z, ry: bed.rotation.y, hx: 1.32, hz: 1.02, y0: 0, y1: 1.9}
    : {name: 'bed', kind: 'cyl', cx: bed.position.x, cz: bed.position.z, r: G.bedR + .02, y0: 0, y1: .45};
  // Signed distance from a point to a solid (negative = inside), less a radius.
  const toSolid = (s, x, y, z, r) => {
    // (Resting on top of a thing counts as clear.)
    if (y < s.y0 - r || y > s.y1 + r - .01) return 9;
    if (s.kind === 'cyl') return Math.hypot(x - s.cx, z - s.cz) - s.r - r;
    let x0 = s.x0, x1 = s.x1, z0 = s.z0, z1 = s.z1;
    if (s.kind === 'rbox') {
      const dx = x - s.x, dz = z - s.z, c = Math.cos(s.ry), sn = Math.sin(s.ry);
      x = c * dx - sn * dz; z = sn * dx + c * dz; x0 = -s.hx; x1 = s.hx; z0 = -s.hz; z1 = s.hz;
    }
    const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1);
    return (dx > 0 || dz > 0 ? Math.hypot(dx, dz) : -Math.min(x - x0, x1 - x, z - z0, z1 - z)) - r;
  };
  const B = k.cat.bones, M = k.cat.motion.rig, tip = M.tailTip, P = new V3(), Q = new V3();
  const worst = {}, log = [];
  window.__qa = {solids: solids.concat(bedSolid), worst, log, frames: 0, hitFrames: 0, measure(t) {
    // (In bed as the app has it: over its cushion, or up off the floor
    // near it, stepping over the rim.)
    const br = k.brain, off = Math.hypot(br.pos.x - bed.position.x, br.pos.z - bed.position.z), inBed = off < G.bedRadius || (!br.perch && br.elevation > .05 && off < G.bedRadius + .6);
    // (In the sink she's inside the counter's outline: its basin isn't a mesh box.)
    const sink = kitchen && k.inSink?.();
    const list = inBed ? solids : solids.concat(bedSolid);
    this.frames++;
    let hit = false;
    const check = (name, x, y, z, r) => {
      for (const s of list) {
        if (sink && s.name === 'counter') continue;
        const d = toSolid(s, x, y, z, r);
        if (d >= .3) continue;
        const w = worst[s.name];
        if (!w || d < w.d) worst[s.name] = {solid: s.name, d, name, t, act: br.activity, perch: br.perch || '', mode: br.mode, px: br.pos.x, pz: br.pos.z, x, y, z};
        if (d < -.03) {
          hit = true;
          const last = log[log.length - 1];
          if (!last || last.solid !== s.name || t - last.t > 1) log.push({solid: s.name, name, d, t, act: br.activity, perch: br.perch || ''});
          else if (d < last.d) Object.assign(last, {d, name});
        }
      }
    };
    // Along each link (3 points a link) out to the tip.
    for (let i = 0; i < 8; i++) {
      B['tail' + i].getWorldPosition(P);
      if (i < 7) B['tail' + (i + 1)].getWorldPosition(Q); else B.tail7.localToWorld(Q.copy(tip));
      for (let j = 0; j < 3; j++) { const u = j / 3, r = M.tailR[i] * (1 - u) + M.tailR[i + 1] * u; check('tail' + i + (j ? '+' + j : ''), P.x + (Q.x - P.x) * u, P.y + (Q.y - P.y) * u, P.z + (Q.z - P.z) * u, r); }
    }
    B.tail7.localToWorld(Q.copy(tip)); check('tip', Q.x, Q.y, Q.z, M.tailR[8]);
    if (hit) this.hitFrames++;
  }};
}, kitchen);
const solids = await page.evaluate(() => __qa.solids.map(s => `${s.name} ${s.kind} ` + (s.kind === 'rbox' ? `at ${s.x.toFixed(2)},${s.z.toFixed(2)} ±${s.hx.toFixed(2)},${s.hz.toFixed(2)} turned ${s.ry.toFixed(2)}` : s.kind === 'cyl' ? `at ${s.cx.toFixed(2)},${s.cz.toFixed(2)} r ${s.r.toFixed(2)}` : `x ${s.x0.toFixed(2)}..${s.x1.toFixed(2)} z ${s.z0.toFixed(2)}..${s.z1.toFixed(2)}`) + ` y ${s.y0.toFixed(2)}..${s.y1.toFixed(2)}`));
console.log(`${solids.length} solids in the ${ROOM}:`); if (process.env.LIST) for (const s of solids) console.log('  ' + s);

// Every 20 s something to do: her bowl, her fountain, play, a nap in her
// bed, a jump up to a perch, a stroll (and her own ideas in between).
const tasks = kitchen
  ? ['feed', 'drink', 'play', 'sleep', 'perch', 'perch', 'stroll', 'idle']
  : ['feed', 'drink', 'play', 'sleep', 'perch', 'perch', 'perch', 'stroll'];
const tick = () => page.evaluate(() => {
  const r = kitten.renderer, render = r.render; __vt.on = true;
  try { for (let i = 0; i < 20; i++) { r.render = i === 19 ? render : () => {}; kitten.step(1 / 20, 1); __vt.tick(50); __qa.measure(__vt.now / 1000); } } finally { r.render = render; }
  return Object.values(__qa.worst).filter(w => w.d < -.03).map(w => `${w.solid}|${w.d.toFixed(2)}`);
});
let seen = new Set(), shots = 0;
for (let s = 0; s < SEC; s++) {
  if (s % 20 === 0) await page.evaluate(task => {
    const k = kitten, b = k.brain;
    if (k.pet.sleeping) { k.act('sleep'); return; } // (wake from the last nap first)
    if (b.mode !== 'idle' || b.jump) return;
    if (task === 'perch') { const names = Object.keys(k.PERCHES).filter(n => !['vacuum', 'pendant', 'salmon'].includes(n)); const n = names[Math.floor(Math.random() * names.length)]; if (b.perch) k.jumpDown?.(); else k.jumpTo(n); }
    else if (task === 'stroll') { if (b.perch) k.jumpDown?.(); else k.stroll?.(); }
    else if (task !== 'idle') { if (b.perch) k.jumpDown?.(); else k.act(task); }
  }, tasks[Math.floor(s / 20) % tasks.length]);
  const worse = await tick();
  for (const w of worse) {
    const key = w.split('|')[0];
    if (seen.has(w)) continue;
    // (A picture only when it's a new piece of furniture or much worse.)
    const prev = [...seen].filter(x => x.startsWith(key + '|')).map(x => +x.split('|')[1]);
    seen.add(w);
    if (!SHOTS || shots >= 8 || (prev.length && Math.min(...prev) - +w.split('|')[1] < .03)) continue;
    shots++;
    // (From the open front of the room, looking down at her and her tail.)
    const [x, y, z] = await page.evaluate(k => { const w = __qa.worst[k]; return [w.x, w.y, w.z]; }, key);
    await look({focus: [x, y, z], yaw: 0, pitch: .7, dist: 2.6});
    await page.screenshot({path: `${OUT}/tail-${ROOM}-${shots}.png`});
    console.log(`  ${s}s: ${w}  → ${OUT}/tail-${ROOM}-${shots}.png`);
  }
}
const {worst, log, frames, hitFrames} = await page.evaluate(() => ({worst: Object.values(__qa.worst), log: __qa.log, frames: __qa.frames, hitFrames: __qa.hitFrames}));
console.log(`\n${ROOM}, ${SEC} s (seed ${SEED}): tail into furniture (deeper than -.03) in ${hitFrames} of ${frames} frames (${(100 * hitFrames / frames).toFixed(1)}%).`);
console.log('Closest approach of the tail per piece of furniture, metres (negative = into it):');
for (const w of worst.sort((a, b) => a.d - b.d)) console.log(`  ${w.solid.padEnd(11)} ${w.d.toFixed(3).padStart(7)}  (${w.name} at ${w.t.toFixed(1)} s, she ${w.act} (${w.mode})${w.perch ? ' on ' + w.perch : ''} at ${w.px.toFixed(2)},${w.pz.toFixed(2)})`);
console.log(`\n${log.length} overlap(s):`);
for (const e of log) console.log(`  ${e.t.toFixed(1).padStart(6)} s  ${e.solid.padEnd(11)} ${e.name.padEnd(8)} ${e.d.toFixed(3)}  ${e.act}${e.perch ? ' on ' + e.perch : ''}`);
await close();
