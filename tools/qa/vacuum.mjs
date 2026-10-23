// Vacuum check: runs the kitchen robot vacuum (with and without her riding)
// and reports how close it, and she, came to the island and stools.
//   node tools/qa/vacuum.mjs          (SEC=400, SEED=5)
import {open} from './lib.mjs';
const {page, step, close} = await open({seed: +(process.env.SEED || 5), kitchen: true, quiet: false});
// Island + stools (the walking keep-out), from kitchen.js K.island and KEEP_OUT.
const R = {x0: -4.45, x1: 2.05, z0: -1.1, z1: 3.0};
const outside = (x, z) => Math.max(R.x0 - x, x - R.x1, R.z0 - z, z - R.z1); // negative = inside
let worst = {free: 9, ride: 9, cat: 9}, rideSec = 0;
for (let s = 0; s < +(process.env.SEC || 400); s++) {
  if (s % 25 === 0) await page.evaluate(() => { const k = kitten; if (k.kitchen.vac.state === 'docked') k.kitchen.startVacuum(performance.now() / 1000); if (Math.random() < .6 && k.brain.mode === 'idle' && k.brain.perch !== 'vacuum') k.vacuumRide(); });
  await step(20);
  const st = await page.evaluate(() => { const v = kitten.kitchen.vacuum.position, B = kitten.brain, hips = kitten.cat.bones.hips.getWorldPosition(v.clone()); return {x: v.x, z: v.z, ride: B.perch === 'vacuum', hx: hips.x, hz: hips.z, floor: !B.perch && B.elevation < .05}; });
  const o = outside(st.x, st.z);
  if (st.ride) { rideSec++; worst.ride = Math.min(worst.ride, o); } else worst.free = Math.min(worst.free, o);
  if (st.ride || st.floor) worst.cat = Math.min(worst.cat, outside(st.hx, st.hz));
}
console.log('closest to the island/stools box in metres (negative = went through):');
console.log(`  vacuum alone ${worst.free.toFixed(2)}  vacuum with her riding ${worst.ride.toFixed(2)}  her hips ${worst.cat.toFixed(2)}  (seconds riding: ${rideSec})`);
await close();
