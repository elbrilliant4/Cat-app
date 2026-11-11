// A true-speed clip of the title screen: her asleep, the tap, the wake-up
// and the screen shrinking to the app. Time is stepped by hand (the page's
// own fades and the shrink are stepped with it), so a slow machine still
// gives a smooth clip. Writes OUT (default qa-out/title.mp4; needs ffmpeg).
//   node tools/qa/title-clip.mjs      W=390 H=844 NIGHT=0 BEFORE=2.5 AFTER=7
import fs from 'node:fs'; import {execFileSync} from 'node:child_process';
import {open} from './lib.mjs';
const W = +process.env.W || 390, H = +process.env.H || 844, FPS = 20;
const OUT = process.env.OUT || 'qa-out/title.mp4', DIR = OUT.replace(/\.mp4$/, '-frames');
fs.rmSync(DIR, {recursive: true, force: true}); fs.mkdirSync(DIR, {recursive: true});
const {page, step, close} = await open({seed: 7, night: +process.env.NIGHT || 0, flags: '&intro=1', width: W, height: H, quiet: false});
await page.evaluate(() => document.querySelectorAll('.hud, .dock, .scene-hint, #speech').forEach(e => e.style.visibility = ''));
// The page's CSS animations and transitions, held to the stepped clock.
const anims = () => page.evaluate(() => {
  const seen = window.__anims ??= new Map(), now = __vt.now;
  for (const a of document.getAnimations()) {
    if (!seen.has(a)) { seen.set(a, now - (a.currentTime || 0)); }
    const t = now - seen.get(a), end = a.effect.getComputedTiming().endTime;
    try { if (t >= end) a.finish(); else { a.pause(); a.currentTime = t; } } catch {}
  }
});
let n = 0;
const shoot = async seconds => { for (let i = 0; i < seconds * FPS; i++) { await step(1); await anims(); await page.screenshot({path: `${DIR}/${String(n++).padStart(4, '0')}.png`}); } };
await shoot(+process.env.BEFORE || 2.5);
await page.evaluate(() => document.getElementById('title').click());
await shoot(+process.env.AFTER || 7);
await close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${DIR}/%04d.png`, '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', OUT]);
fs.rmSync(DIR, {recursive: true, force: true});
console.log('wrote', OUT, n, 'frames');
