// Phase 17b, fun that lasts, on a phone (390 x 844): the wish of the day
// (the button under her name, a tap says it, granting it is thanked and worth
// 5), friendship that slows after a day's care with the soft "more tomorrow"
// line, a save already at level 9 getting the later gifts one a day (yarn
// ball, fairy lights, ribbon collar and its colours, picture frame, gold
// tag), a photo hung over the fire and kept after a reload, and a night away
// leaving her hungry and thirsty. Stills to OUT (default qa-out/gifts).
// About 8 min.
import {open} from './lib.mjs';
import fs from 'node:fs';
const OUT = process.env.OUT || 'qa-out/gifts';
fs.mkdirSync(OUT, {recursive: true});
let fails = 0;
const ONLY = process.env.ONLY || '123'; // e.g. ONLY=3 runs the third part alone
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const show = page => page.evaluate(() => { document.documentElement.classList.remove('title', 'title-out'); document.querySelectorAll('.hud, .dock').forEach(e => e.style.visibility = ''); kitten.refresh(); kitten.sheetPeek(); });
const news = async page => { await page.waitForFunction(() => document.querySelector('#news-dialog').open, null, {timeout: 20000}).catch(() => {}); return page.evaluate(() => { const d = document.querySelector('#news-dialog'); return {open: d.open, title: d.querySelector('h2').textContent, rows: [...d.querySelectorAll('li strong')].map(e => e.textContent)}; }); };
// (The page's clock starts at 1.8e12: lib.mjs.)
const save = (o = {}) => [o => {
  const now = 1.8e12;
  localStorage.setItem('pocket-kitten-companion-v1', JSON.stringify({v: 2, name: 'Mochi', food: 90, water: 90, happiness: 90, energy: 80, cleanliness: 90, bond: 0, cuddles: 0, sleeping: false, born: now - 9 * 86400000, sound: false, taught: {ball: true, pet: true}, journal: [{text: 'A little friendship begins.', icon: '♡', time: now - 86400000}], ...o, updated: now - (o.hoursAgo || 0) * 3600000}));
}, o];
const state = page => page.evaluate(() => ({bond: kitten.pet.bond, day: kitten.pet.day, wish: document.querySelector('#wish').hidden ? null : document.querySelector('#wish-text').textContent, dayLine: !document.querySelector('#bond-day').hidden, first: kitten.pet.journal[0]?.text, toast: document.querySelector('.toast, #toast')?.textContent || ''}));

if (ONLY.includes('1')) { // 1. The wish, and friendship over a day.
  const {page, step, close} = await open({width: 390, height: 844, flags: '&intro=0', seed: 3, init: save()});
  await show(page);
  await step(80);
  let s = await state(page);
  const w = await page.evaluate(() => { const w = kitten.wishNow(); return {id: w.id, label: w.label, want: w.want}; });
  ok(s.wish === `Wish: ${w.label}`, `her wish is under her name (“${s.wish}”)`);
  const box = await page.evaluate(() => { const r = document.querySelector('#wish').getBoundingClientRect(), n = document.querySelector('.nameplate').getBoundingClientRect(), c = document.querySelector('.cam-buttons').getBoundingClientRect(); return {h: r.height, w: r.width, below: r.top >= n.bottom, clear: r.right <= c.left}; });
  ok(box.h >= 44 && box.below && box.clear, `the wish button is 44 points tall or more, under her name, clear of the view buttons (${Math.round(box.w)} x ${Math.round(box.h)})`);
  await page.evaluate(() => document.querySelector('#speech').style.visibility = '');
  await page.click('#wish');
  await page.waitForTimeout(500);
  s = await page.evaluate(() => ({speech: document.querySelector('#speech-text').textContent}));
  ok(s.speech === w.want, `a tap and she says it (“${s.speech}”)`);
  await page.screenshot({path: `${OUT}/1-wish.png`});
  // Ten strokes count in full; forty more add 4; the wrong care does not grant the wish.
  s = await page.evaluate(id => { for (let i = 0; i < 10; i++) { kitten.act('pet', {zone: id === 'chin' || id === 'back' ? 'head' : 'head', quiet: true}); kitten.brain.content = 0; kitten.cat && (window.__lp = 0); kitten.step(1, 1); } return {bond: kitten.pet.bond, n: kitten.pet.day.n.pet}; }, w.id);
  const strokeWish = ['fuss'].includes(w.id) ? 5 : 0;
  ok(s.n === 10 && s.bond === 10 + strokeWish, `ten strokes: ${s.bond} friendship`);
  s = await page.evaluate(() => { for (let i = 0; i < 40; i++) { kitten.act('pet', {quiet: true}); kitten.step(1, 1); } return {bond: kitten.pet.bond, n: kitten.pet.day.n.pet, cuddles: kitten.pet.cuddles}; });
  ok(s.n === 50 && Math.abs(s.bond - (14 + strokeWish)) < 1e-9 && s.cuddles === 50, `forty more strokes add 4, and all 50 are counted as cuddles (${s.bond})`);
  // Grant the wish through the save's own day (whatever today's is), with the care it asks for.
  s = await page.evaluate(() => { const d = kitten.pet.day; d.wish = 'brush'; delete d.wishDone; kitten.refresh(); return document.querySelector('#wish-text').textContent; });
  ok(s === 'Wish: a brush', 'the wish for this test: a brush');
  const before = (await state(page)).bond;
  await page.click('.dock [data-action="brush"]');
  await step(70);
  s = await state(page);
  ok(Math.abs(s.bond - (before + 3 + 5)) < 1e-9 && s.day.wishDone === true, `a brush grants it: 3 for the brush and 5 for the wish (${before} to ${s.bond})`);
  ok(s.wish === null, 'the wish button goes once it is granted');
  ok((await page.evaluate(() => kitten.pet.journal.some(j => j.text === 'Mochi wished for a brush and came out fluffy.'))), 'it is in Moments');
  await page.screenshot({path: `${OUT}/2-wish-granted.png`});
  await step(120);
  // The rest of the day's care, then the soft line.
  s = await page.evaluate(() => { const p = kitten.pet; for (let i = 0; i < 6; i++) { p.energy = 90; kitten.act('brush'); kitten.brain.mode = 'idle'; } for (let i = 0; i < 3; i++) { p.energy = 90; p.day.n.play = (p.day.n.play || 0) + 1; } kitten.refresh(); return {bond: p.bond, line: !document.querySelector('#bond-day').hidden, text: document.querySelector('#bond-day').textContent}; });
  ok(s.line && s.text === 'A lovely day together. More tomorrow.', `once stroke, brush and play have all counted: “${s.text}”`);
  ok(s.bond < 30, `a long sitting of strokes and brushes ends at ${s.bond} friendship, short of level 3 (40)`);
  await step(40);
  await page.evaluate(() => { document.querySelector('#news-dialog').close(); document.body.classList.add('sheet-open'); kitten.refresh(); });
  await page.waitForTimeout(900);
  await page.screenshot({path: `${OUT}/3-more-tomorrow.png`});
  s = await page.evaluate(() => { const r = document.querySelector('.bond-card').getBoundingClientRect(), g = document.querySelector('#bond-day').getBoundingClientRect(); return {h: Math.round(r.height), inside: g.bottom <= r.bottom + 1 && g.height > 8}; });
  ok(s.h > 110 && s.inside, `the friendship card keeps its height with the new line inside it (${s.h}px)`);
  await close();
}

if (ONLY.includes('2')) { // 2. A save already at level 9: the later gifts one a day, and each one seen.
  const {page, step, look, close} = await open({width: 390, height: 844, flags: '&intro=0', seed: 3, night: 1, init: save({bond: 1200, gifts: ['mouse', 'fish', 'bowl']})});
  await show(page);
  let d = await news(page);
  ok(d.open && d.rows.join() === 'A ball of yarn', `the first later gift only (${d.rows})`);
  await page.waitForTimeout(600);
  await page.screenshot({path: `${OUT}/4-gift-yarn.png`});
  await page.click('#news-ok');
  await step(60);
  let s = await page.evaluate(() => ({open: document.querySelector('#news-dialog').open, line: document.querySelector('#bond-gift').textContent, collar: !!kitten.cat.collar?.visible, fairy: !!kitten.room.fairy, frame: !!kitten.room.photoFrame, giftDay: kitten.pet.giftDay}));
  ok(!s.open && s.line === 'Mochi has another gift for you tomorrow', `no second gift the same day; the card says “${s.line}”`);
  ok(!s.collar && !s.fairy && !s.frame, 'nothing she has not been given yet is in the room or on her');
  await page.click('.dock [data-action="play"]');
  s = await page.evaluate(() => [...document.querySelectorAll('#toy-options strong')].map(e => e.textContent));
  ok(s.join() === 'Pink ball,Felt mouse,Fabric fish,Ball of yarn', `the yarn ball is in the basket (${s})`);
  await page.waitForTimeout(500);
  await page.screenshot({path: `${OUT}/5-basket.png`});
  await page.click('[data-toy="yarn"]');
  await page.waitForFunction(() => kitten.giftToy, null, {timeout: 30000}).catch(() => {});
  await step(30);
  s = await page.evaluate(() => ({mode: kitten.brain.mode, yarn: !!kitten.giftToy?.visible, ball: kitten.toy.visible}));
  ok(s.mode === 'play' && s.yarn && !s.ball, 'picking it starts a game with the yarn ball');
  await look({focus: await page.evaluate(() => [kitten.toy.position.x, .1, kitten.toy.position.z]), yaw: .3, pitch: .35, dist: 2.2});
  await page.screenshot({path: `${OUT}/6-yarn.png`});
  await page.evaluate(() => { kitten.endPlay(true); kitten.CAMERA_VIEWS.room(); });
  await step(60);
  // The next days: one gift each.
  for (const [id, name] of [['lights', 'Fairy lights for the study'], ['collar', 'A ribbon collar'], ['frame', 'A picture frame for the study'], ['tag', 'A gold tag with her name']]) {
    await page.evaluate(() => { kitten.pet.giftDay = 'yesterday'; kitten.brain.mode = 'idle'; kitten.refresh(); });
    await step(40);
    d = await news(page);
    ok(d.open && d.rows.join() === name, `the next day: ${d.rows}`);
    await page.click('#news-ok').catch(() => {});
    await step(20);
  }
  s = await page.evaluate(() => ({line: document.querySelector('#bond-gift').hidden, collar: !!kitten.cat.collar?.visible, tag: !!kitten.cat.collar?.userData.tag.visible, fairy: !!kitten.room.fairy?.g.visible, frame: !!kitten.room.photoFrame?.g.visible, gifts: kitten.pet.gifts.length, pos: kitten.brain.pos.toArray()}));
  ok(s.gifts === 8 && s.line, 'all eight gifts given; the card promises nothing more');
  ok(s.collar && s.tag && s.fairy && s.frame, 'she wears the collar and tag; the lights and the frame are up');
  await look({focus: [4.2, 2.9, 1.1], yaw: -1.2, pitch: .1, dist: 6});
  await step(2);
  await page.screenshot({path: `${OUT}/7-lights-night.png`});
  await page.evaluate(() => kitten.setNight(false));
  await step(80);
  const onHer = async () => { const p = await page.evaluate(() => { kitten.setActivity('sit'); return kitten.cat.bones.head.getWorldPosition(kitten.brain.pos.clone()).toArray(); }); await look({focus: [p[0], p[1] - .15, p[2]], yaw: await page.evaluate(() => kitten.cat.root.rotation.y), pitch: .1, dist: 2.3}); await step(2); };
  await onHer();
  await page.screenshot({path: `${OUT}/8-collar.png`});
  // The ribbon's colour, in the name card.
  await page.click('#rename');
  s = await page.evaluate(() => ({shown: !document.querySelector('#ribbons').hidden, n: document.querySelectorAll('#ribbon-options button').length, size: document.querySelector('#ribbon-options button').getBoundingClientRect().width}));
  ok(s.shown && s.n === 6 && s.size >= 44, `the name card offers six ribbon colours, each ${s.size} points`);
  await page.click('[data-ribbon="teal"]');
  await page.waitForTimeout(500);
  await page.screenshot({path: `${OUT}/9-ribbons.png`});
  s = await page.evaluate(() => ({collar: kitten.pet.collar, color: '#' + kitten.cat.collar.userData.band.material.color.getHexString(), pressed: document.querySelector('[data-ribbon="teal"]').getAttribute('aria-pressed')}));
  ok(s.collar === 'teal' && s.color === '#2f8f8c' && s.pressed === 'true', `teal is picked and she wears it (${s.color})`);
  await page.click('#close-name');
  await onHer();
  await page.screenshot({path: `${OUT}/10-collar-teal.png`});
  // A photo, hung over the fire.
  await page.evaluate(() => kitten.CAMERA_VIEWS.follow?.());
  await step(40);
  await page.click('#photo-btn');
  await page.waitForFunction(() => document.querySelector('#photo-dialog').open, null, {timeout: 30000}).catch(() => {});
  s = await page.evaluate(() => ({hang: !document.querySelector('#photo-hang').hidden}));
  ok(s.hang, 'the photo card offers "Hang it on the wall"');
  await page.click('#photo-hang');
  await page.waitForTimeout(500);
  await page.screenshot({path: `${OUT}/11-hang.png`});
  s = await page.evaluate(() => { const url = localStorage.getItem('pocket-kitten-companion-v1-frame') || ''; return {kb: Math.round(url.length / 1024), jpeg: url.startsWith('data:image/jpeg;base64,'), text: document.querySelector('#photo-hang').textContent, inSave: /data:image/.test(localStorage.getItem('pocket-kitten-companion-v1')), has: !!kitten.room.photoFrame.image}; });
  ok(s.jpeg && s.kb > 5 && s.kb < 200 && !s.inSave && s.has, `the picture is kept on the phone beside the save, not in it (${s.kb} KB)`);
  await page.evaluate(() => document.querySelector('#photo-dialog').close());
  await look({focus: [4.4, 3.8, 1.1], yaw: -1.35, pitch: .05, dist: 3.4});
  await step(2);
  await page.screenshot({path: `${OUT}/12-frame.png`});
  await close();
}

if (ONLY.includes('3')) { // 3. Left overnight: she asks for you. A gift toy picked before is kept.
  const {page, step, close} = await open({width: 390, height: 844, flags: '&intro=0', seed: 3, init: save({hoursAgo: 10, bond: 50})});
  await show(page);
  // (The away card, then her gifts: closed without waiting on either.)
  for (let i = 0; i < 3; i++) { await page.waitForTimeout(1500); await page.evaluate(() => { const d = document.querySelector('#news-dialog'); if (d.open) d.close(); }); await step(30); }
  const s = await page.evaluate(() => ({pill: document.querySelector('#needs-pill').textContent, mood: document.querySelector('#mood-text').textContent, food: Math.round(kitten.pet.food), water: Math.round(kitten.pet.water), joy: Math.round(kitten.pet.happiness), bond: kitten.pet.bond}));
  ok(s.pill === '2 need you' && s.food === 35 && s.water === 30, `ten hours away: ${s.pill} (tummy ${s.food}%, water ${s.water}%, joy ${s.joy}%), “${s.mood}”`);
  ok(s.bond === 50, 'friendship did not drop');
  await page.screenshot({path: `${OUT}/13-overnight.png`});
  await close();
}
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
