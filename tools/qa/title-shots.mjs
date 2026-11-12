// Stills from the title's zoomies cinematic, at chosen moments on its story
// clock, to check each shot's framing. Time is stepped by hand.
// (CSS fades are only stepped at each still, so a still right after the
// flash is white: use title-clip.mjs to judge the fades.)
//   node tools/qa/title-shots.mjs      W=390 H=844 NIGHT=0 AT="0.5 0.9 1.6 ..." OUT=qa-out
import fs from 'node:fs';
import {open} from './lib.mjs';
const W = +process.env.W || 390, H = +process.env.H || 844, OUT = process.env.OUT || 'qa-out';
const AT = (process.env.AT || '0.5 0.9 1.6 2.2 2.8 3.3 3.7 4.2 4.9 5.5 5.9 6.2 6.7 7.0 7.3 7.9 8.6 10.5').split(/\s+/).map(Number);
fs.mkdirSync(OUT, {recursive: true});
const {page, step, close} = await open({seed: 7, night: +process.env.NIGHT || 0, flags: '&intro=full', width: W, height: H, quiet: false});
const anims = () => page.evaluate(() => {
  const seen = window.__anims ??= new Map(), now = __vt.now;
  for (const a of document.getAnimations()) {
    if (!seen.has(a)) seen.set(a, now - (a.currentTime || 0));
    const t = now - seen.get(a), end = a.effect.getComputedTiming().endTime;
    try { if (t >= end) a.finish(); else { a.pause(); a.currentTime = t; } } catch {}
  }
});
await step(4); await anims();
await page.screenshot({path: `${OUT}/shot-gate-${W}.png`});
await page.evaluate(() => document.getElementById('enter-mute').click());
await anims();
let T = 0;
for (const at of AT) {
  const n = Math.round((at - T) * 30); if (n > 0) { await step(n, 1 / 30); T += n / 30; } await anims();
  await page.screenshot({path: `${OUT}/shot-${at.toFixed(1)}-${W}.png`});
  console.log(at, JSON.stringify(await page.evaluate(() => ({stage: kitten.title.stage, shot: kitten.title.cine?.shot, a: kitten.brain.activity, p: kitten.brain.pos.toArray().map(x => +x.toFixed(2)), y: +kitten.brain.elevation.toFixed(2)}))));
}
await close();
