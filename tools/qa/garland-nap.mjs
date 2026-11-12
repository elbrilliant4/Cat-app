// Christmas: she goes up to the top shelf and naps by the garland. Steps
// until she's asleep, reports where and which way she lies, takes stills.
//   node tools/qa/garland-nap.mjs      (OUT, NIGHT=1)
import {open} from './lib.mjs'; import fs from 'node:fs';
const OUT = process.env.OUT || 'qa-out/look'; fs.mkdirSync(OUT, {recursive: true});
const {page, step, look, close} = await open({seed: 1, kitchen: true, night: +(process.env.NIGHT || 0), flags: '&decor=christmas', width: 1200, height: 800});
await page.evaluate(() => { document.querySelector('#decor-btn').click(); document.querySelector('#decor-options [data-decor="christmas"]').click(); });
await page.waitForTimeout(800);
await step(20); await page.evaluate(() => kitten.garlandNap());
let s = 0, st;
for (; s < 120; s++) { await step(20); st = await page.evaluate(() => ({doing: kitten.brain.activity, perch: kitten.brain.perch, at: kitten.brain.pos.toArray().map(v => +v.toFixed(2)), heading: +kitten.brain.heading.toFixed(2)})); if (st.doing === 'catnap') break; }
await step(80);
st = await page.evaluate(() => ({doing: kitten.brain.activity, perch: kitten.brain.perch, at: kitten.brain.pos.toArray().map(v => +v.toFixed(2)), heading: +kitten.brain.heading.toFixed(2)}));
console.log(st.doing === 'catnap' && st.perch === 'shelfHigh' ? 'PASS' : 'FAIL', `asleep after ${s + 1} s:`, JSON.stringify(st));
for (const [name, v] of Object.entries({front: {focus: [.6, 5.6, -3.6], yaw: .2, pitch: .08, dist: 4.2}, above: {focus: [.6, 5.6, -3.6], yaw: .5, pitch: .7, dist: 4}})) { await look(v); await page.locator('canvas').first().screenshot({path: `${OUT}/garland-nap-${name}.png`}); }
await close();
