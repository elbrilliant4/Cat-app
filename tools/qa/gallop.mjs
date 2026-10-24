// Gallop check: a run of dashes across the study rug; for each leg, how
// often it's stretched past its reach while she's running (looks dragged),
// how much of the time each paw is up, and how often both hind paws are up
// at once (a bunny hop, not a gallop).
//   node tools/qa/gallop.mjs          (DASHES=12, SEED=777, FLAGS)
import {open} from './lib.mjs';
const {page, step, close} = await open({seed: +(process.env.SEED || 777), flags: process.env.FLAGS || ''});
await page.evaluate(() => {
  const m = kitten.cat.motion, u = m.update.bind(m); window.R = {};
  m.update = (dt, t, ctl) => {
    u(dt, t, ctl);
    if ((m.runW || 0) < .5) return;
    const up = k => !!m.paws[k].swing;
    R.n = (R.n || 0) + 1; if (up('LH') && up('RH')) R.both = (R.both || 0) + 1;
    for (const k of ['LF', 'RF', 'LH', 'RH']) {
      if (m.paws[k].free) continue;
      const short = m.rig.legs[k].reachShort || 0, r = R[k] ??= {n: 0, over: 0, max: 0};
      r.n++; if (up(k)) r.up = (r.up || 0) + 1; if (short > .02) r.over++; r.max = Math.max(r.max, short);
    }
  };
  kitten.cat.update = (dt, t, ctl) => m.update(dt, t, ctl);
});
for (let i = 0; i < +(process.env.DASHES || 12); i++) {
  await page.evaluate(() => { kitten.brain.mode = 'idle'; kitten.dash(); });
  for (let j = 0; j < 20; j++) { await step(10); if (await page.evaluate(() => kitten.brain.activity !== 'walk')) break; }
  await step(20);
}
console.log('leg  frames running  stretched>2cm  worst   paw up');
console.log(await page.evaluate(() => ['LF', 'RF', 'LH', 'RH'].filter(k => R[k]).map(k => { const r = R[k];
  return `${k}   ${String(r.n).padStart(6)}  ${(100 * r.over / r.n).toFixed(1).padStart(12)}%  ${(r.max * 100).toFixed(1).padStart(5)}cm  ${(100 * (r.up || 0) / r.n).toFixed(0).padStart(5)}%`; }).join('\n')
  + `\nboth hind paws up: ${(100 * (R.both || 0) / R.n).toFixed(0)}% of running frames`));
await close();
