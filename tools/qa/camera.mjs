// Looking around and touching her, measured. Camera: zoom never has a dead
// stretch, your zoom is kept while following her, pinching in from the whole
// room goes to her and back out again, the whole-room view settles back after
// a look round, glide, twist. Touch: a tap on the floor calls her, and she
// takes a touch differently on her head, chin, tail and paws.
//   node tools/qa/camera.mjs        OUT=qa-out/camera (stills)
import {open} from './lib.mjs'; import fs from 'node:fs';
const OUT = process.env.OUT || 'qa-out/camera'; fs.mkdirSync(OUT, {recursive: true});
const {page, step, look, close} = await open({seed: 3, width: 390, height: 844});
// (On a phone the panel is a pull-up sheet over the bottom of the room: the
// checks' fingers pass through it, so a touch there can't open it and cover the room.)
await page.evaluate(() => { const s = document.querySelector('#sheet'); if (s) { s.style.pointerEvents = 'none'; s.style.visibility = 'hidden'; } kitten.sheetOpen?.(false); });
const box = await page.evaluate(() => { const r = document.querySelector('#scene, .scene').getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; });
const HOME = {focus: [0, .7, -.2], yaw: 0, pitch: .3, dist: 7};
const state = () => page.evaluate(() => { const v = kitten.view, c = kitten.camera; return {mode: v.mode, camY: +c.position.y.toFixed(2), yaw: v.yaw, goalDist: v.goal.dist, dist: c.position.distanceTo(v.focus), focus: v.focus.toArray().map(x => +x.toFixed(2))}; });
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
// (Pointing away from her: a pinch on her goes to her, which is another check.)
{ const hp = await screenOf(await page.evaluate(() => kitten.cat.root.position.toArray()));
  const cand = [[.3, .3], [.7, .3], [.3, .7], [.7, .7]].map(([a, b]) => [box.x + box.w * a, box.y + box.h * b]);
  const far = cand.sort((u, v) => Math.hypot(v[0] - hp[0], v[1] - hp[1]) - Math.hypot(u[0] - hp[0], u[1] - hp[1]))[0];
  await page.mouse.move(far[0], far[1]); }
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

// 4c. One finger drags the room like a map: the floor under the finger stays under it, and the view stays where you leave it.
await page.evaluate(() => document.querySelector('[data-cam="room"]').click()); await step(80);
const G = [0.4, 0, 1.2]; [x0, y0] = await screenOf(G);
await page.mouse.move(x0, y0); await page.mouse.down();
for (let i = 1; i <= 8; i++) { await page.mouse.move(x0 - i * 15, y0 - i * 3); await step(1); }
await page.waitForTimeout(150); await page.mouse.up(); await step(30);
const [gx, gy] = await screenOf(G), h1 = await state();
const off = Math.hypot(gx - (x0 - 120), gy - (y0 - 24));
await step(160); const h2 = await state(); await shot('4c-dragged-room');
line('drag moves about the room', off < 30 && Math.hypot(h2.focus[0] - h1.focus[0], h2.focus[2] - h1.focus[2]) < .05, `the floor point ended ${off.toFixed(0)} px from the finger; 8 s later the view had drifted ${Math.hypot(h2.focus[0] - h1.focus[0], h2.focus[2] - h1.focus[2]).toFixed(2)} m by itself`);

// 4d. Double tap on the floor: closer to that spot, and she stays put.
await look(HOME); await step(2);
[x0, y0] = await screenOf([1.2, 0, 1.0]); const q0 = await pos();
await page.mouse.move(x0, y0); for (let i = 0; i < 2; i++) { await page.mouse.down(); await page.mouse.up(); } await step(60);
const dd = await state(); const q1 = await pos(); await shot('4d-double-tap-floor');
line('double tap the floor, look closer', dd.dist < 4 && Math.hypot(dd.focus[0] - 1.2, dd.focus[2] - 1.0) < .6 && Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) < .3, `camera ${dd.dist.toFixed(1)} m from [${dd.focus}]; she moved ${Math.hypot(q1[0] - q0[0], q1[1] - q0[1]).toFixed(2)} m`);

const dbl = async (x, y) => { await page.mouse.move(x, y); for (let i = 0; i < 2; i++) { await page.mouse.down(); await page.mouse.up(); } await step(50); };
// 5. Double tap on her: a close-up that follows.
await look({...HOME, dist: 6}); await step(2);
const head = await page.evaluate(() => { const p = kitten.cat.root.position.clone(); p.y += .22; return p.toArray(); });
[x0, y0] = await screenOf(head); await dbl(x0, y0); await step(40); const k = await state(); await shot('5-double-tap-her');
line('double tap, her', k.mode === 'follow' && k.dist < 3, `mode ${k.mode}, ${k.dist.toFixed(2)} m`);

// 6. Flick: the view glides on after the finger lifts (in the room it slides; round her it circles).
await look(HOME); await step(2);
await page.mouse.move(box.x + 80, box.y + 300); await page.mouse.down();
for (let i = 1; i <= 6; i++) await page.mouse.move(box.x + 80 + i * 30, box.y + 300);
const g0 = await page.evaluate(() => kitten.view.goal.focus.toArray()); await page.mouse.up();
await step(30); const g1 = await page.evaluate(() => kitten.view.goal.focus.toArray());
line('glide after a flick', Math.hypot(g1[0] - g0[0], g1[2] - g0[2]) > .15, `slid ${Math.hypot(g1[0] - g0[0], g1[2] - g0[2]).toFixed(2)} m more after letting go`);

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
// (Coming closer tilts the view down to her level; further out looks down over the room.)
await page.evaluate(() => document.querySelector('[data-cam="follow"]').click()); await step(80);
const tp0 = await page.evaluate(() => kitten.view.goal.pitch);
await touch('touchStart', [[150, 400], [240, 400]]);
for (let i = 1; i <= 8; i++) { await touch('touchMove', [[150 - i * 10, 400], [240 + i * 10, 400]]); await step(2); }
await touch('touchEnd', []); await step(30);
const tp1 = await page.evaluate(() => kitten.view.goal.pitch);
line('closer looks lower', tp1 < tp0 - .05, `tilt ${tp0.toFixed(2)} to ${tp1.toFixed(2)} as the view came closer`);
// (From the whole room, pinching in goes to her; pinching out far gives the room back.)
await page.evaluate(() => document.querySelector('[data-cam="room"]').click()); await step(80); const r0 = await state();
const pinchBy = async (a, b) => { await touch('touchStart', [[195 - a, 400], [195 + a, 400]]); for (let i = 1; i <= 8; i++) { await touch('touchMove', [[195 - a - (b - a) * i / 8, 400], [195 + a + (b - a) * i / 8, 400]]); await step(2); } await touch('touchEnd', []); await step(60); };
await pinchBy(40, 110); const r1 = await state();
const cc = await page.evaluate(() => { const p = kitten.cat.root.position.clone(); p.y += .3; return p.toArray(); });
const [ccx] = await screenOf(cc); await shot('7c-pinched-in-from-room');
const herAt = await screenOf(await page.evaluate(() => kitten.cat.root.position.toArray()));
const onHer = Math.hypot(herAt[0] - 195, herAt[1] - 400) < 60;
line('pinch in from the room goes where the fingers are', onHer ? r1.mode === 'follow' : r1.mode === 'free' && r1.dist < r0.dist * .7, `fingers ${onHer ? 'on her' : 'on the floor'}: ${r0.mode} at ${r0.dist.toFixed(1)} m to ${r1.mode} at ${r1.dist.toFixed(1)} m`);
// (Pinching in on her from the whole room: her view. She is set in the open
// middle first: earlier checks walked her about, maybe under the care bar.)
await page.evaluate(() => { kitten.brain.perch = null; kitten.brain.jump = null; kitten.brain.pos.set(0, 0, .3); kitten.cat.root.position.set(0, 0, .3); kitten.brain.mode = 'idle'; });
// (Long enough for the view to finish gliding back from wherever it was.)
await page.evaluate(() => document.querySelector('[data-cam="room"]').click()); await step(240);
{ const [hx, hy] = await screenOf(await page.evaluate(() => { const p = kitten.cat.root.position.clone(); p.y += .2; return p.toArray(); }));
  const rm = (await state()).mode;
  await touch('touchStart', [[hx - 40, hy], [hx + 40, hy]]); for (let i = 1; i <= 8; i++) { await touch('touchMove', [[hx - 40 - i * 9, hy], [hx + 40 + i * 9, hy]]); await step(2); } await touch('touchEnd', []); await step(60);
  const rh = await state(); line('pinch in on her goes to her', rh.mode === 'follow', `from ${rm}, fingers at ${hx.toFixed(0)}, ${hy.toFixed(0)}: mode ${rh.mode} at ${rh.dist.toFixed(1)} m`); }
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
// (Twisting on and on never backs the camera into a wall: it stops at the edge, at full distance.)
await look(HOME); await step(2);
for (let k = 0; k < 3; k++) { await touch('touchStart', pair(0)); for (let i = 1; i <= 16; i++) { await touch('touchMove', pair(i * .1)); await step(2); } await touch('touchEnd', []); await step(10); }
await step(30); const t2 = await state(); await shot('7d-twist-to-the-edge');
line('turning stops before a wall', t2.dist > 7 * .9, `after three big twists: turned ${(t2.yaw * 57.3).toFixed(0)}°, camera ${t2.dist.toFixed(2)} m from the spot (asked 7)`);

// 10. Watch (the room fills the screen): the whole room, with her in the picture, not a wall.
await page.evaluate(() => document.querySelector('#watch-btn').click()); await page.waitForTimeout(400); await step(80);
const w = await state(); const wc = await screenOf(await page.evaluate(() => kitten.cat.root.position.toArray())); await shot('10-watch');
const vh = await page.evaluate(() => innerHeight);
line('watch shows the room', w.mode === 'room' && w.dist > 8 && w.focus[1] < 3.5 && wc[1] > vh * .2 && wc[1] < vh * .9, `camera ${w.dist.toFixed(1)} m back, looking at height ${w.focus[1]} m; she is ${(wc[1] / vh * 100).toFixed(0)}% of the way down the screen`);
await close();
