// Stills of the kitchen (or the study) in a seasonal look, day and night,
// landscape like Orion's reference pictures.
//   DECOR=christmas node tools/qa/look.mjs      (OUT, W, H, ROOM=study, NIGHTS="0 1")
// CAMS='{"shelf":{"focus":[-1,5,-3.8],"yaw":0,"pitch":.1,"dist":7}}' takes those views
// too (just the 3D picture).
import {open} from './lib.mjs'; import fs from 'node:fs';
const OUT = process.env.OUT || 'qa-out/look', DECOR = process.env.DECOR || '', W = +(process.env.W || 1200), H = +(process.env.H || 800);
fs.mkdirSync(OUT, {recursive: true});
for (const night of (process.env.NIGHTS || '0 1').split(' ')) {
  const {page, step, look, close} = await open({seed: 1, kitchen: process.env.ROOM !== 'study', night: +night, flags: DECOR ? `&decor=${DECOR}` : '', width: W, height: H});
  if (DECOR) await page.evaluate(d => { document.querySelector('#decor-btn').click(); document.querySelector(`#decor-options [data-decor="${d}"]`)?.click(); }, DECOR);
  await page.waitForTimeout(800); // (the room is redressed a moment after the tap)
  if (process.env.EVAL) await page.evaluate(process.env.EVAL);
  await step(+(process.env.STEPS || 40), 1 / 20);
  const f = `${OUT}/${DECOR || 'now'}-${process.env.ROOM || 'kitchen'}-${+night ? 'night' : 'day'}${process.env.TAG || ''}.png`;
  await page.screenshot({path: f}); console.log(f, await page.evaluate(() => ({room: kitten.room.decor, kitchen: kitten.kitchen.decor, doing: kitten.brain.activity, perch: kitten.brain.perch, at: kitten.brain.pos.toArray().map(v => +v.toFixed(2))})));
  for (const [name, v] of Object.entries(JSON.parse(process.env.CAMS || '{}'))) { await look(v); await page.locator('canvas').first().screenshot({path: f.replace('.png', `-${name}.png`)}); }
  await close();
}
