// Controlled walk clip for A/B: an empty floor (everything but the floor
// hidden), a straight walk at her walking speed, a fixed side camera moving
// along with her, recording from the moment her left hind paw starts its
// stance. Run it once per build or flag; same seed, so only the change differs.
//   FLAGS='&hindlift=0.8' OUT=qa-out/b.mp4 node tools/qa/ab-walk.mjs   (SEC=2, SEED=777)
// Writes OUT (60 fps) and OUT.json: each frame's gait phase and paw heights.
import {open} from './lib.mjs';
import fs from 'node:fs'; import path from 'node:path'; import {execFileSync} from 'node:child_process';
const ONLY = process.env.ONLY?.split(',').map(Number); // (just these frames, kept as PNGs)
const SEC = +(process.env.SEC || 2), OUT = path.resolve(process.env.OUT || 'qa-out/ab.mp4'), DIR = OUT + '.frames';
if (!process.env.ONLY) fs.rmSync(DIR, {recursive: true, force: true});
fs.mkdirSync(DIR, {recursive: true});
const {page, step, close} = await open({seed: +(process.env.SEED || 777), width: 640, height: 400, flags: process.env.FLAGS || ''});
await page.evaluate(() => {
  // (Every mesh but the study floor and her own, every frame: the app shows
  // and hides rooms and toys itself.)
  const scene = kitten.cat.root.parent, cat = new Set(); kitten.cat.root.traverse(o => cat.add(o));
  window.__bare = () => scene.traverse(o => { if ((o.isMesh || o.isSprite || o.isPoints) && !cat.has(o) && !(o.parent === kitten.room.group && o.geometry?.type === 'PlaneGeometry' && o.geometry.parameters.width === 40)) o.visible = false; });
  kitten.toy.traverse(o => { if (o.material) o.material.visible = false; }); // (the app shows the toy each frame)
  const B = kitten.brain, V = kitten.cat.root.position.constructor;
  Object.assign(B, {mode: 'idle'}); B.pos.set(-2.2, 0, .4); B.heading = Math.PI / 2;
  kitten.walkTo(new V(3, 0, .4), () => kitten.setActivity('sit', 1e9), false, true);
});
const cam = () => page.evaluate(() => {
  const w = kitten.view, r = kitten.cat.root;
  w.mode = 'free';
  for (const o of [w, w.goal]) { o.focus.set(r.position.x, .22, .4); Object.assign(o, {yaw: Math.PI, pitch: .04, dist: 4}); }
  w.cut = 0; w.lift = 0;
  __bare();
});
// Up to speed, then on to the start of a stride.
await step(30);
for (let i = 0; i < 200; i++) {
  const p = await page.evaluate(() => kitten.cat.motion.phase);
  await step(1, 1 / 60);
  if (await page.evaluate(p0 => kitten.cat.motion.phase < p0, p)) break;
}
const log = [];
let good = 0;
for (let i = 0; i < SEC * 60; i++) {
  await cam(); await step(1, 1 / 60);
  log.push(await page.evaluate(() => {
    const m = kitten.cat.motion, y = kitten.cat.root.position.y, h = k => +(m.paws[k].pos.y - y).toFixed(4);
    return {phase: +m.phase.toFixed(4), speed: +m.vel.length().toFixed(3), x: +kitten.cat.root.position.x.toFixed(3), LF: h('LF'), RF: h('RF'), LH: h('LH'), RH: h('RH'), act: kitten.brain.activity};
  }));
  if (ONLY && !ONLY.includes(i)) continue;
  // (Now and then the canvas comes back blank: drawn again and retaken.)
  const file = `${DIR}/${String(i).padStart(4, '0')}.png`;
  for (let k = 0; k < 4; k++) {
    if (k) await page.evaluate(() => kitten.renderer.render(kitten.cat.root.parent, kitten.camera));
    await page.locator('canvas').first().screenshot({path: file});
    const size = fs.statSync(file).size;
    if (size > Math.max(.6 * good, 30000)) { good = size; break; }
  }
}
await close();
if (ONLY) { console.log('frames in', DIR); process.exit(0); }
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '60', '-i', `${DIR}/%04d.png`, '-pix_fmt', 'yuv420p', OUT]);
fs.writeFileSync(OUT + '.json', JSON.stringify(log));
if (!process.env.KEEP) fs.rmSync(DIR, {recursive: true, force: true});
console.log('wrote', OUT);
