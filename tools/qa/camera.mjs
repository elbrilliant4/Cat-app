// Looking around and touching her, measured. Camera: zoom never has a dead
// stretch, your zoom is kept while following her, pinching in from the whole
// room goes to her and back out again, the whole-room view settles back after
// a look round, glide, twist. Touch: a tap on the floor calls her, and she
// takes a touch differently on her head, chin, tail and paws.
//   node tools/qa/camera.mjs        OUT=qa-out/camera (stills)
import {open} from './lib.mjs'; import fs from 'node:fs';
const OUT = process.env.OUT || 'qa-out/camera'; fs.mkdirSync(OUT, {recursive: true});
const {page, step, look, close} = await open({seed: 3, width: 390, height: 844});
const box = await page.evaluate(() => { const r = document.querySelector('#scene, .scene').getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; });
const HOME = {focus: [0, .7, -.2], yaw: 0, pitch: .3, dist: 7};
const state = () => page.evaluate(() => { const v = kitten.view, c = kitten.camera; return {mode: v.mode, yaw: v.yaw, goalDist: v.goal.dist, dist: c.position.distanceTo(v.focus), focus: v.focus.toArray().map(x => +x.toFixed(2))}; });
const screenOf = w => page.evaluate(w => { const c = kitten.camera; c.updateMatrixWorld(); const p = new (c.position.constructor)(...w).project(c), r = document.querySelector('.scene').getBoundingClientRect(); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height]; }, w);
const wheel = async (n, dy) => { for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await step(3); } };
const shot = n => page.screenshot({path: `${OUT}/${n}.png`});
const line = (name, ok, text) => console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: ${text}`);

// 1. Zoom to the pointer: a spot on the rug, off-centre, stays under the mouse.
await look(HOME); await step(2);
const W = [1.4, 0, .9];
let [x0, y0] = await screenOf(W);
await page.mouse.move(x0, y0); await shot('1a-before-zoom');
const before = await state();
await wheel(8, -120); await step(30);
let [x1, y1] = await screenOf(W); const after = await state(); await shot('1b-zoomed-at-pointer');
const drift = Math.hypot(x1 - x0, y1 - y0);
line('zoom to pointer', drift < 30 && after.dist < before.dist * .6, `spot moved ${drift.toFixed(0)} px on screen while zooming ${before.dist.toFixed(1)} m to ${after.dist.toFixed(1)} m`);

// 2. No dead stretch: zoom far out (into the walls), then three notches in.
// (Seen from the side, where the wall is a few metres behind the camera.)
await look({...HOME, yaw: 1.4}); await step(2); await page.mouse.move(box.x + box.w / 2, box.y + box.h / 2);
await wheel(40, 200); await step(30);
const out = await state();
await wheel(3, -120); await step(30);
const back = await state();
line('no dead stretch', out.dist - back.dist > .3, `zoomed out to ${out.dist.toFixed(2)} m (asked for ${out.goalDist.toFixed(2)}); three notches in moved the camera ${(out.dist - back.dist).toFixed(2)} m`);

// 3. Following her keeps your zoom.
await page.evaluate(() => document.querySelector('[data-cam="follow"]').click()); await step(40);
const c = await page.evaluate(() => { const p = kitten.cat.root.position.clone(); p.y += .25; return p.toArray(); });
const [cx, cy] = await screenOf(c); await page.mouse.move(cx, cy);
await wheel(6, -120); await step(30);
const f1 = await state(); await step(260); const f2 = await state(); await shot('3-follow-close');
line('follow keeps zoom', Math.abs(f2.dist - f1.dist) < .15 && f2.mode === 'follow', `${f1.dist.toFixed(2)} m after zooming in, ${f2.dist.toFixed(2)} m 13 s later (${f2.mode})`);

// 3b. Squeezed against a wall, closer than the nearest zoom: zooming in leaves the view where it is.
await look({focus: [-3.9, .5, 0], yaw: -1.57, pitch: .3, dist: 3}); await step(10);
await page.mouse.move(box.x + box.w * .3, box.y + box.h * .3);
await wheel(3, -120); await step(10); const q = await page.evaluate(() => kitten.view.goal.focus.toArray());
line('zoom when squeezed', Math.hypot(q[0] + 3.9, q[1] - .5, q[2]) < .3, `focus now [${q.map(x => x.toFixed(2))}] (was [-3.9, .5, 0])`);

// 4. A tap on the floor calls her there.
await look(HOME); await step(2);
const SPOT = [-1.0, 0, .8];
[x0, y0] = await screenOf(SPOT);
const pos = () => page.evaluate(() => [kitten.brain.pos.x, kitten.brain.pos.z]);
const p0 = await pos();
await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.up(); await step(8); await shot('4-tap-floor');
await step(240); const p1 = await pos(); await shot('4b-she-came');
line('tap the floor, she comes', Math.hypot(p1[0] - SPOT[0], p1[1] - SPOT[2]) < .5, `she was ${Math.hypot(p0[0] - SPOT[0], p0[1] - SPOT[2]).toFixed(1)} m from the spot, now ${Math.hypot(p1[0] - SPOT[0], p1[1] - SPOT[2]).toFixed(2)} m`);

// 4c. The whole-room view: a look round, then it settles back by itself.
await page.evaluate(() => document.querySelector('[data-cam="room"]').click()); await step(80);
const h0 = await state();
await page.mouse.move(box.x + 100, box.y + 300); await page.mouse.down();
for (let i = 1; i <= 5; i++) await page.mouse.move(box.x + 100 + i * 16, box.y + 300);
await page.waitForTimeout(150); await page.mouse.up(); await step(6);
const h1 = await state(); await step(160); const h2 = await state();
line('room view settles back', h1.mode === 'room' && Math.abs(h1.yaw - h0.yaw) > .2 && Math.abs(h2.yaw - h0.yaw) < .03, `turned ${((h1.yaw - h0.yaw) * 57.3).toFixed(0)}°, 8 s later ${((h2.yaw - h0.yaw) * 57.3).toFixed(1)}° off (${h2.mode})`);

const dbl = async (x, y) => { await page.mouse.move(x, y); for (let i = 0; i < 2; i++) { await page.mouse.down(); await page.mouse.up(); } await step(50); };
// 5. Double tap on her: a close-up that follows.
await look({...HOME, dist: 6}); await step(2);
const head = await page.evaluate(() => { const p = kitten.cat.root.position.clone(); p.y += .22; return p.toArray(); });
[x0, y0] = await screenOf(head); await dbl(x0, y0); await step(40); const k = await state(); await shot('5-double-tap-her');
line('double tap, her', k.mode === 'follow' && k.dist < 3, `mode ${k.mode}, ${k.dist.toFixed(2)} m`);

// 6. Flick: the view glides on after the finger lifts.
await look(HOME); await step(2);
await page.mouse.move(box.x + 80, box.y + 300); await page.mouse.down();
for (let i = 1; i <= 6; i++) await page.mouse.move(box.x + 80 + i * 30, box.y + 300);
const g0 = await page.evaluate(() => kitten.view.goal.yaw); await page.mouse.up();
await step(30); const g1 = await page.evaluate(() => kitten.view.goal.yaw);
line('glide after a flick', Math.abs(g1 - g0) > .1, `turned ${(Math.abs(g1 - g0) * 57.3).toFixed(0)}° more after letting go`);

// 6b. Touching her: by where it lands.
await look(HOME); await step(2);
for (let i = 0; i < 20 && await page.evaluate(() => !!kitten.brain.jump || !!kitten.brain.perch || kitten.brain.activity === 'walk'); i++) await step(40);
await page.evaluate(() => { kitten.setActivity('sit'); kitten.brain.target = null; }); await step(30);
const cat0 = await page.evaluate(() => kitten.cat.root.position.toArray());
await look({focus: [cat0[0], .55, cat0[2]], yaw: 1.5, pitch: .2, dist: 3.4}); await step(4);
// (Where each part is right now: a pat on the head lifts her tail.)
const spot = part => page.evaluate(part => { const c = kitten.cat, v = new (c.root.position.constructor)(); if (part === 'head') { c.headTop(v); v.y -= .1; } else c.bones[part].getWorldPosition(v); return v.toArray(); }, part);
const feel = async part => { await step(60); const [x, y] = await screenOf(await spot(part)); const zone = await page.evaluate(([x, y]) => kitten.zoneUnder(x, y), [x, y]); const b0 = await page.evaluate(() => kitten.pet.bond); await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.up(); await step(2); const r = await page.evaluate(() => ({bond: kitten.pet.bond, face: kitten.brain.overrideUntil > kitten.clock ? kitten.brain.override : 'none (' + kitten.brain.activity + ', ' + kitten.brain.mode + ')'})); return {zone, gain: r.bond - b0, face: r.face}; };
const th = await feel('head'); await shot('9a-head');
line('head: welcome', th.zone === 'head' && th.gain > 0 && ['joy', 'love', 'bliss'].includes(th.face), `zone ${th.zone}, friendship +${th.gain}, face ${th.face}`);
const tt = await feel('tail5'); await shot('9b-tail');
line('tail: not for touching', tt.zone === 'tail' && tt.gain === 0 && tt.face === 'grumpy', `zone ${tt.zone}, friendship +${tt.gain}, face ${tt.face}`);
const tp = await feel('wristL');
line('paws: not for touching', tp.zone === 'paws' && tp.gain === 0 && tp.face === 'surprised', `zone ${tp.zone}, friendship +${tp.gain}, face ${tp.face}`);

// 7. Two fingers: pinch keeps the spot between them; twisting turns the view.
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setTouchEmulationEnabled', {enabled: true, maxTouchPoints: 5});
const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: pts.map(([x, y], id) => ({x, y, id}))});
await look(HOME); await step(2);
const P = [-1.2, 0, .6]; [x0, y0] = await screenOf(P);
const s0 = await state();
await touch('touchStart', [[x0 - 30, y0], [x0 + 30, y0]]);
for (let i = 1; i <= 10; i++) { await touch('touchMove', [[x0 - 30 - i * 8, y0], [x0 + 30 + i * 8, y0]]); await step(2); }
await touch('touchEnd', []); await step(30);
[x1, y1] = await screenOf(P); const s1 = await state(); await shot('7-pinch');
line('pinch at the fingers', Math.hypot(x1 - x0, y1 - y0) < 30 && s1.dist < s0.dist * .6, `spot moved ${Math.hypot(x1 - x0, y1 - y0).toFixed(0)} px while pinching ${s0.dist.toFixed(1)} m to ${s1.dist.toFixed(1)} m`);
// (Pinching while following her keeps following; from the whole-room view a small pinch is a small move.)
await page.evaluate(() => document.querySelector('[data-cam="follow"]').click()); await step(60);
await touch('touchStart', [[150, 400], [240, 400]]);
for (let i = 1; i <= 5; i++) { await touch('touchMove', [[150 - i * 4, 400], [240 + i * 4, 400 + i]]); await step(2); }
await touch('touchEnd', []); await step(10); const pf = await state();
line('pinch while following', pf.mode === 'follow', `mode ${pf.mode}, ${pf.dist.toFixed(2)} m`);
// (The bed view: a pinch keeps it on the bed; a view of your own is not reachable by touch.)
await page.evaluate(() => document.querySelector('[data-cam="bed"]').click()); await step(60);
await touch('touchStart', [[150, 400], [240, 400]]);
for (let i = 1; i <= 5; i++) { await touch('touchMove', [[150 - i * 5, 400], [240 + i * 5, 410]]); await step(2); }
await touch('touchEnd', []); await step(10); const sp = await state();
line('pinch in the bed view', sp.mode === 'spot', `mode ${sp.mode}, ${sp.dist.toFixed(2)} m`);
// (From the whole room, pinching in goes to her; pinching out far gives the room back.)
await page.evaluate(() => document.querySelector('[data-cam="room"]').click()); await step(80); const r0 = await state();
const pinchBy = async (a, b) => { await touch('touchStart', [[195 - a, 400], [195 + a, 400]]); for (let i = 1; i <= 8; i++) { await touch('touchMove', [[195 - a - (b - a) * i / 8, 400], [195 + a + (b - a) * i / 8, 400]]); await step(2); } await touch('touchEnd', []); await step(60); };
await pinchBy(40, 110); const r1 = await state();
const cc = await page.evaluate(() => { const p = kitten.cat.root.position.clone(); p.y += .3; return p.toArray(); });
const [ccx, ccy] = await screenOf(cc); await shot('7c-pinched-in-from-room');
line('pinch in from the room goes to her', r1.mode === 'follow' && r1.dist < 6 && Math.abs(ccx - (box.x + box.w / 2)) < 90, `${r0.mode} at ${r0.dist.toFixed(1)} m to ${r1.mode} at ${r1.dist.toFixed(1)} m; she is ${Math.abs(ccx - (box.x + box.w / 2)).toFixed(0)} px from the middle`);
await pinchBy(130, 30); await pinchBy(130, 30); const r2 = await state();
line('pinch out gives the room back', r2.mode === 'room', `mode ${r2.mode} at ${r2.dist.toFixed(1)} m`);
await look(HOME); await step(2);
const mx = box.x + box.w / 2, my = box.y + box.h / 2, R = 90;
const pair = a => [[mx - Math.cos(a) * R, my - Math.sin(a) * R], [mx + Math.cos(a) * R, my + Math.sin(a) * R]];
await touch('touchStart', pair(0));
for (let i = 1; i <= 12; i++) { await touch('touchMove', pair(i * .05)); await step(2); }
await touch('touchEnd', []); await step(30);
const t1 = await state();
line('twist turns the view', Math.abs(t1.yaw) > .25 && Math.abs(t1.dist - 7) < .5, `turned ${(t1.yaw * 57.3).toFixed(0)}° for a 34° twist; distance ${t1.dist.toFixed(2)} m`);

await close();
