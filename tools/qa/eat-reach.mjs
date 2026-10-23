// Eating and drinking check: does her mouth reach the kibble, the
// fountain's water, the salmon and the faucet's trickle? Prints distances
// and saves screenshots to OUT (default ./qa-out).
//   node tools/qa/eat-reach.mjs
import fs from 'node:fs';
import {open} from './lib.mjs';
const OUT = process.env.OUT || 'qa-out'; fs.mkdirSync(OUT, {recursive: true});
const {page, step, look, close} = await open({seed: 3});
const mouth = () => page.evaluate(() => { const k = kitten, V = k.camera.position.constructor, m = k.cat.bones.jaw.localToWorld(new V(0, -.015, .14)), e = k.brain.eatAt;
  const bowl = k.room.bowl.position, f = k.room.fountain.position;
  return {a: k.brain.activity, m: m.toArray(), toBowl: Math.hypot(m.x - bowl.x, m.z - bowl.z), toFountain: Math.hypot(m.x - f.x, m.z - f.z), toTarget: e ? Math.hypot(m.x - e.x, m.z - e.z) : null}; });
async function check(name, start, activity, report) {
  await page.evaluate(start);
  for (let i = 0; i < 400; i++) {
    await step(5);
    const s = await mouth();
    if (s.a !== activity) continue;
    await step(30);
    const s2 = await mouth();
    console.log(name.padEnd(9), report(s2));
    const h = await page.evaluate(() => kitten.cat.root.rotation.y);
    await look({focus: s2.m, yaw: h + Math.PI / 2, pitch: .15, dist: 1.6});
    await page.screenshot({path: `${OUT}/${name}.png`});
    return;
  }
  console.log(name.padEnd(9), 'never started', JSON.stringify(await mouth()));
}
const f2 = v => v.toFixed(2);
await check('bowl', () => { kitten.pet.food = 20; kitten.act('feed'); }, 'eat', s => `mouth height ${f2(s.m[1])} m (kibble ~0.12), ${f2(s.toBowl)} m from bowl centre (kibble within 0.17)`);
await step(200);
await check('fountain', () => { kitten.brain.mode = 'idle'; kitten.pet.water = 20; kitten.act('drink'); }, 'drink', s => `mouth height ${f2(s.m[1])} m (water 0.21), ${f2(s.toFountain)} m from centre (water 0.19-0.40)`);
await page.evaluate(() => { kitten.goTo('kitchen'); Object.assign(kitten.brain, {mode: 'idle', perch: null, elevation: 0}); kitten.brain.pos.set(.3, 0, -1.6); kitten.setActivity('sit'); });
await check('salmon', () => { kitten.pet.food = 50; kitten.stealSalmon(); }, 'eat', s => `mouth ${f2(s.toTarget)} m from the fish centre`);
await step(300);
await page.evaluate(() => { Object.assign(kitten.brain, {mode: 'idle', perch: null, elevation: 0}); kitten.brain.pos.set(-4.9, 0, -1.8); kitten.setActivity('sit'); });
await check('faucet', () => { kitten.pet.water = 50; kitten.drinkFaucet(); }, 'drink', s => `mouth ${f2(s.toTarget)} m from the trickle (sideways)`);
await close();
