// Stills of the kitchen (or the study) in a seasonal look, day and night,
// landscape like Orion's reference pictures.
//   DECOR=christmas node tools/qa/look.mjs      (OUT, W, H, ROOM=study, NIGHTS="0 1")
import {open} from './lib.mjs'; import fs from 'node:fs';
const OUT = process.env.OUT || 'qa-out/look', DECOR = process.env.DECOR || '', W = +(process.env.W || 1200), H = +(process.env.H || 800);
fs.mkdirSync(OUT, {recursive: true});
for (const night of (process.env.NIGHTS || '0 1').split(' ')) {
  const {page, step, close} = await open({seed: 1, kitchen: process.env.ROOM !== 'study', night: +night, flags: DECOR ? `&decor=${DECOR}` : '', width: W, height: H});
  if (DECOR) await page.evaluate(d => { document.querySelector('#decor-btn').click(); document.querySelector(`#decor-options [data-decor="${d}"]`)?.click(); }, DECOR);
  if (process.env.EVAL) await page.evaluate(process.env.EVAL);
  await step(40, 1 / 20);
  const f = `${OUT}/${DECOR || 'now'}-${process.env.ROOM || 'kitchen'}-${+night ? 'night' : 'day'}${process.env.TAG || ''}.png`;
  await page.screenshot({path: f}); console.log(f, await page.evaluate(() => ({room: kitten.room.decor, kitchen: kitten.kitchen.decor})));
  await close();
}
