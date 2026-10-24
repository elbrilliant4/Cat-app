// Short clip of her legs, the camera following from the side, for checking
// by eye. Writes OUT (default qa-out/<scene>.mp4; needs ffmpeg).
//   SCENE=walk|gallop|bed|shelf node tools/qa/clip.mjs     (SEED=777, SEC=6)
// Old build vs new: run it from each checkout, then put the two side by side:
//   ffmpeg -i old.mp4 -i new.mp4 -filter_complex hstack both.mp4
import {open} from './lib.mjs';
import fs from 'node:fs'; import path from 'node:path'; import {execFileSync} from 'node:child_process';
const SCENE = process.env.SCENE || 'gallop', SEC = +(process.env.SEC || 6);
const OUT = path.resolve(process.env.OUT || `qa-out/${SCENE}.mp4`), DIR = OUT + '.frames';
fs.rmSync(DIR, {recursive: true, force: true}); fs.mkdirSync(DIR, {recursive: true});
const {page, step, close} = await open({seed: +(process.env.SEED || 777), width: 480, height: 360, kitchen: SCENE === 'shelf'});
const settle = async (until, n = 60) => { for (let i = 0; i < n; i++) { await step(10); if (await page.evaluate(until)) return; } };
// Set the scene up (not recorded).
if (SCENE === 'bed') {
  await page.evaluate(() => { const b = kitten.place.bed.position; kitten.brain.mode = 'idle'; kitten.walkTo(new kitten.cat.root.position.constructor(b.x + 1.4, 0, b.z + .3), () => kitten.setActivity('sit', 1e9), false, true); });
  await settle(() => kitten.brain.activity === 'sit');
} else if (SCENE === 'shelf') {
  await page.evaluate(() => { kitten.brain.mode = 'idle'; kitten.jumpTo('shelf', () => kitten.setActivity('sit', 1e9), 1e9); });
  await settle(() => kitten.brain.perch === 'shelf' && !kitten.brain.jump);
}
await step(20);
// Go.
await page.evaluate(scene => {
  kitten.brain.mode = 'idle';
  if (scene === 'gallop') kitten.dash();
  if (scene === 'bed') { const b = kitten.place.bed.position; kitten.walkTo(new kitten.cat.root.position.constructor(b.x, 0, b.z), () => kitten.setActivity('sit', 1e9), false, true); }
  if (scene === 'shelf') kitten.stroll();
  // (An ordinary walk, a couple of metres across the room.)
  if (scene === 'walk') { const p = kitten.brain.pos; kitten.walkTo(new kitten.cat.root.position.constructor(p.x > 0 ? p.x - 2.4 : p.x + 2.4, 0, p.z), () => kitten.setActivity('sit', 1e9), false, true); }
}, SCENE);
for (let i = 0; i < SEC * 20; i++) {
  // Camera beside her, at her height, a little behind.
  await page.evaluate(() => {
    const w = kitten.view, B = kitten.brain, r = kitten.cat.root;
    w.mode = 'free';
    for (const o of [w, w.goal]) { o.focus.set(r.position.x, r.position.y + .2, r.position.z); Object.assign(o, {yaw: B.heading + Math.PI / 2 + .3, pitch: .08, dist: 3.2}); }
    w.cut = 0; w.lift = 0;
  });
  await step(1);
  await page.screenshot({path: `${DIR}/${String(i).padStart(4, '0')}.png`});
}
await close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '20', '-i', `${DIR}/%04d.png`, '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', OUT]);
fs.rmSync(DIR, {recursive: true, force: true});
console.log('wrote', OUT);
