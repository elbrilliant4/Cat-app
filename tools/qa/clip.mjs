// Short clip of her legs, the camera following from the side, for checking
// by eye. Writes OUT (default qa-out/<scene>.mp4; needs ffmpeg).
//   SCENE=walk|turn|run|gallop|sprint|swat|bed|shelf|jump node tools/qa/clip.mjs     (SEED=777, SEC=6, FPS=20)
// (sprint: flat out across the room and back, seen from the side; a gallop
// strides 3 or 4 times a second, so film it at FPS=30 or more.)
// Old build vs new: run it from each checkout, then put the two side by side:
//   ffmpeg -i old.mp4 -i new.mp4 -filter_complex hstack both.mp4
import {open} from './lib.mjs';
import fs from 'node:fs'; import path from 'node:path'; import {execFileSync} from 'node:child_process';
const SCENE = process.env.SCENE || 'gallop', SEC = +(process.env.SEC || 6), FPS = +(process.env.FPS || 20);
const OUT = path.resolve(process.env.OUT || `qa-out/${SCENE}.mp4`), DIR = OUT + '.frames';
fs.rmSync(DIR, {recursive: true, force: true}); fs.mkdirSync(DIR, {recursive: true});
const {page, step, close} = await open({seed: +(process.env.SEED || 777), width: 480, height: SCENE === 'swat' ? 420 : 360, kitchen: SCENE === 'shelf'});
const settle = async (until, n = 60) => { for (let i = 0; i < n; i++) { await step(10); if (await page.evaluate(until)) return; } };
// Set the scene up (not recorded).
if (SCENE === 'bed') {
  await page.evaluate(() => { const b = kitten.place.bed.position; kitten.brain.mode = 'idle'; kitten.walkTo(new kitten.cat.root.position.constructor(b.x + 1.4, 0, b.z + .3), () => kitten.setActivity('sit', 1e9), false, true); });
  await settle(() => kitten.brain.activity === 'sit');
} else if (SCENE === 'shelf') {
  await page.evaluate(() => { kitten.brain.mode = 'idle'; kitten.jumpTo('shelf', () => kitten.setActivity('sit', 1e9), 1e9); });
  await settle(() => kitten.brain.perch === 'shelf' && !kitten.brain.jump);
} else if (SCENE === 'swat') {
  // (Sitting on the rug with the ball just ahead of her right paw.)
  await page.evaluate(() => { const B = kitten.brain; B.mode = 'idle'; kitten.setActivity('sit', 1e9);
    window.spot = d => new kitten.cat.root.position.constructor(B.pos.x + Math.sin(B.heading) * d - Math.cos(B.heading) * -.06, .1, B.pos.z + Math.cos(B.heading) * d + Math.sin(B.heading) * -.06); });
  await step(70);
  await page.evaluate(() => { kitten.toyTarget.copy(spot(.66)); kitten.toy.position.copy(kitten.toyTarget); });
} else if (SCENE === 'jump') {
  // (At the take-off spot in front of the hearth first.)
  await page.evaluate(() => { kitten.brain.mode = 'idle'; kitten.walkTo(kitten.PERCHES.mantel.base, () => kitten.setActivity('sit', 1e9), false, true); });
  await settle(() => kitten.brain.activity === 'sit');
}
if (SCENE === 'sprint') await page.evaluate(() => { const B = kitten.brain; B.mode = 'idle'; B.pos.set(-2.6, 0, .8); B.heading = Math.PI / 2; });
await step(SCENE === 'sprint' ? 110 : 20);
// Go.
await page.evaluate(scene => {
  kitten.brain.mode = 'idle';
  // (Three pats at the ball; each sends it a little further and it's put back.)
  if (scene === 'swat') { const B = kitten.brain, pat = n => { kitten.toyTarget.copy(spot(.66)); B.swatAt = spot(.66).setY(.2); setTimeout(() => kitten.toyTarget.copy(spot(.95)), 220);
    kitten.setActivity('swat', kitten.SWAT ?? .45, () => kitten.setActivity('sit', n ? .55 : 1e9, () => pat(n - 1))); }; kitten.setActivity('sit', .4, () => pat(2)); }
  if (scene === 'gallop') kitten.dash();

  if (scene === 'sprint') { const V = kitten.cat.root.position.constructor, go = (x, then) => kitten.walkTo(new V(x, 0, .8), then, 2.6, true); go(2.6, () => go(-2.6, () => kitten.setActivity('sit', 1e9))); }
  if (scene === 'bed') { const b = kitten.place.bed.position; kitten.walkTo(new kitten.cat.root.position.constructor(b.x, 0, b.z), () => kitten.setActivity('sit', 1e9), false, true); }
  if (scene === 'shelf') kitten.stroll();
  // (Up to the mantel and down again, seen from the middle of the room.)
  if (scene === 'jump') kitten.jumpTo('mantel', () => kitten.setActivity('sit', .8, () => kitten.jumpDown(() => kitten.setActivity('sit', 1e9))), 1e9);
  // (An ordinary walk, a couple of metres across the room; a turn: about
  // round, to a point behind her.)
  if (scene === 'turn') { const p = kitten.brain.pos, h = kitten.brain.heading; kitten.walkTo(new kitten.cat.root.position.constructor(p.x - Math.sin(h) * 1.2 + Math.cos(h) * .4, 0, p.z - Math.cos(h) * 1.2 - Math.sin(h) * .4), () => kitten.setActivity('sit', 1e9), false, true); }
  // (A run: the same trip at a run; builds without the dash have this too.)
  if (scene === 'walk' || scene === 'run') { const p = kitten.brain.pos; kitten.walkTo(new kitten.cat.root.position.constructor(p.x > 0 ? p.x - 2.4 : p.x + 2.4, 0, p.z), () => kitten.setActivity('sit', 1e9), scene === 'run', true); }
}, SCENE);
for (let i = 0; i < SEC * FPS; i++) {
  // Camera beside her, at her height, a little behind.
  await page.evaluate(scene => {
    const w = kitten.view, B = kitten.brain, r = kitten.cat.root;
    w.mode = 'free';
    if (scene === 'swat') { for (const o of [w, w.goal]) { o.focus.set(r.position.x + Math.sin(B.heading) * .3, .3, r.position.z + Math.cos(B.heading) * .3); Object.assign(o, {yaw: B.heading - 1.0, pitch: .12, dist: 3.3}); } w.cut = 0; w.lift = 0; return; }
    if (scene === 'sprint') { for (const o of [w, w.goal]) { o.focus.set(r.position.x, .05, r.position.z); Object.assign(o, {yaw: 0, pitch: .04, dist: 3.6}); } w.cut = 0; w.lift = 0; return; }
    if (scene === 'jump') { for (const o of [w, w.goal]) { o.focus.set(3.3, 1.75, .8); Object.assign(o, {yaw: 0, pitch: .05, dist: 9.5}); } w.cut = 0; w.lift = 0; return; }
    for (const o of [w, w.goal]) { o.focus.set(r.position.x, r.position.y + .2, r.position.z); Object.assign(o, {yaw: B.heading + Math.PI / 2 + .3, pitch: .08, dist: 3.2}); }
    w.cut = 0; w.lift = 0;
  }, SCENE);
  await step(1, 1 / FPS);
  await page.screenshot({path: `${DIR}/${String(i).padStart(4, '0')}.png`});
}
await close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${DIR}/%04d.png`, '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', OUT]);
fs.rmSync(DIR, {recursive: true, force: true});
console.log('wrote', OUT);
