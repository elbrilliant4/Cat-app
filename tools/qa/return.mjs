// Phase 17, reasons to come back, on a phone (390 x 844): a save left nine
// hours ago shows "While you were away" and then her gifts; the friendship
// card names the next gift; her name is on her bowl; Play opens the toy
// basket and the felt mouse takes the ball's place; the photo button gives a
// picture that is not blank; a new player sees none of the cards.
// Stills to OUT (default qa-out/return). About 5 min.
import {open} from './lib.mjs';
import fs from 'node:fs';
const OUT = process.env.OUT || 'qa-out/return';
fs.mkdirSync(OUT, {recursive: true});
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', m); };
const show = page => page.evaluate(() => { document.documentElement.classList.remove('title', 'title-out'); document.querySelectorAll('.hud, .dock').forEach(e => e.style.visibility = ''); kitten.refresh(); kitten.sheetPeek(); });
const dialog = (page, id) => page.evaluate(id => { const d = document.querySelector(id); return {open: d.open, eyebrow: d.querySelector('.eyebrow')?.textContent, title: d.querySelector('h2')?.textContent, rows: [...d.querySelectorAll('li strong, [data-toy] strong')].map(e => e.textContent)}; }, id);
// (The page's clock starts at 1.8e12: lib.mjs.)
const save = (hoursAgo, bond) => [([h, bond]) => {
  const now = 1.8e12, t = now - h * 3600000;
  localStorage.setItem('pocket-kitten-companion-v1', JSON.stringify({v: 2, name: 'Mochi', food: 82, water: 85, happiness: 88, energy: 78, cleanliness: 92, bond, cuddles: 12, sleeping: false, born: now - 9 * 86400000, updated: t, sound: false, taught: {ball: true, pet: true}, journal: [{text: 'A little friendship begins.', icon: 'i-heart', time: now - 9 * 86400000}]}));
}, [hoursAgo, bond]];

{
  const {page, step, look, close} = await open({width: 390, height: 844, flags: '&intro=0', init: save(9, 120)});
  await show(page);
  await page.waitForFunction(() => document.querySelector('#news-dialog').open, null, {timeout: 20000}).catch(() => {});
  let d = await dialog(page, '#news-dialog');
  ok(d.open && d.title === 'While you were away', `nine hours away: the card shows (“${d.title}”)`);
  ok(d.eyebrow === 'Away 9 hours', `it says how long (${d.eyebrow})`);
  ok(d.rows.length === 3 && d.rows.every(Boolean), `three things she did: ${d.rows.join(' | ')}`);
  await page.waitForTimeout(700);
  await page.screenshot({path: `${OUT}/1-away.png`});
  await page.click('#news-ok');
  let s = await page.evaluate(() => ({open: document.querySelector('#news-dialog').open, first: kitten.pet.journal[0].text, away: kitten.pet.away, saved: JSON.parse(localStorage.getItem('pocket-kitten-companion-v1')).away}));
  ok(!s.open, 'one tap closes it');
  ok(s.first.startsWith('While you were away: ') && !s.away && !s.saved, `it is in Moments and not kept for next time (“${s.first}”)`);
  await page.waitForFunction(() => document.querySelector('#news-dialog').open, null, {timeout: 20000}).catch(() => {});
  d = await dialog(page, '#news-dialog');
  ok(d.open && d.title === 'Mochi has 3 gifts for you' && d.rows.length === 3, `a save already at level 4 gets its gifts at once (“${d.title}”: ${d.rows.join(' | ')})`);
  await page.waitForTimeout(700);
  await page.screenshot({path: `${OUT}/2-gifts.png`});
  await page.click('#news-ok');
  await page.waitForTimeout(900);
  s = await page.evaluate(() => ({open: document.querySelector('#news-dialog').open, gifts: kitten.pet.gifts, giftLine: document.querySelector('#bond-gift').textContent, label: kitten.room.bowl.userData.label?.visible, journal: kitten.pet.journal[0].text}));
  ok(!s.open && s.gifts.length === 3, `gifts are marked as seen and no card comes back (${s.gifts})`);
  ok(s.giftLine === 'Level 5 gift: a ball of yarn', `the friendship card names the next gift (“${s.giftLine}”)`);
  ok(s.label === true, 'her name is on her bowl');
  await step(10);
  await look({focus: [2.05, .12, 1.45], yaw: 0, pitch: .32, dist: 1.5});
  await page.screenshot({path: `${OUT}/3-bowl.png`});
  await page.evaluate(() => kitten.CAMERA_VIEWS.room());
  await step(40);

  // The friendship card names the next gift; reaching the level gives it.
  s = await page.evaluate(() => { const p = kitten.pet; p.bond = 14; p.gifts = []; kitten.refresh(); return {line: document.querySelector('#bond-gift').textContent, hidden: document.querySelector('#bond-gift').hidden, label: kitten.room.bowl.userData.label.visible}; });
  ok(!s.hidden && s.line === 'Level 2 gift: a felt mouse', `at level 1 the card names the next gift (“${s.line}”)`);
  ok(s.label === false, 'no name on the bowl before level 4');
  await page.evaluate(() => { for (let i = 0; i < 4; i++) kitten.pet.journal.unshift({text: 'A happy tummy, thanks to you.', icon: 'i-bowl', time: Date.now()}); kitten.renderJournal(); document.body.classList.add('sheet-open'); });
  await page.waitForTimeout(900);
  await page.screenshot({path: `${OUT}/4-friendship-card.png`});
  s = await page.evaluate(() => { const r = document.querySelector('.bond-card').getBoundingClientRect(), g = document.querySelector('#bond-gift').getBoundingClientRect(), sh = document.querySelector('#sheet'); return {h: Math.round(r.height), inside: g.bottom <= r.bottom + 1 && g.height > 0, scrolls: sh.scrollHeight > sh.clientHeight}; });
  ok(s.h > 110 && s.inside, `the friendship card keeps its height in the open sheet, the gift line inside it (${s.h}px, sheet scrolls: ${s.scrolls})`);
  await page.evaluate(() => document.body.classList.remove('sheet-open'));
  await page.evaluate(() => { kitten.pet.bond = 16; kitten.refresh(); });
  await step(40);
  await page.waitForFunction(() => document.querySelector('#news-dialog').open, null, {timeout: 20000}).catch(() => {});
  d = await dialog(page, '#news-dialog');
  ok(d.open && d.title === 'Mochi has a gift for you' && d.rows.join() === 'A felt mouse', `reaching level 2 gives the felt mouse (“${d.title}”: ${d.rows})`);
  await page.click('#news-ok');
  await page.evaluate(() => { kitten.pet.bond = 120; kitten.refresh(); });
  await step(40);
  await page.waitForFunction(() => document.querySelector('#news-dialog').open, null, {timeout: 20000}).catch(() => {});
  await page.click('#news-ok').catch(() => {});
  await page.waitForTimeout(700);

  // The toy basket.
  await page.click('.dock [data-action="play"]');
  d = await dialog(page, '#toy-dialog');
  ok(d.open && d.rows.join() === 'Pink ball,Felt mouse,Fabric fish', `Play opens the toy basket (${d.rows})`);
  await page.waitForTimeout(700);
  await page.screenshot({path: `${OUT}/5-toys.png`});
  await page.click('[data-toy="mouse"]');
  await page.waitForFunction(() => kitten.giftToy, null, {timeout: 30000}).catch(() => {});
  await step(30);
  s = await page.evaluate(() => ({open: document.querySelector('#toy-dialog').open, mode: kitten.brain.mode, toy: kitten.pet.toy, ball: kitten.toy.visible, mouse: !!kitten.giftToy && kitten.giftToy.visible, at: kitten.giftToy && kitten.giftToy.position.distanceTo(kitten.toy.position.clone().setY(0))}));
  ok(!s.open && s.mode === 'play' && s.toy === 'mouse', `picking the mouse starts a game (${s.mode})`);
  ok(s.mouse && !s.ball && s.at < .01, 'the felt mouse is where the ball would be, and the ball is put away');
  await look({focus: await page.evaluate(() => [kitten.toy.position.x, .1, kitten.toy.position.z]), yaw: .3, pitch: .35, dist: 2.2});
  await page.screenshot({path: `${OUT}/6-mouse.png`});
  await page.evaluate(() => { kitten.endPlay(true); kitten.CAMERA_VIEWS.room(); });
  await step(60);

  // The photo.
  await page.click('#photo-btn');
  await page.waitForFunction(() => kitten.photo, null, {timeout: 30000}).catch(() => {});
  s = await page.evaluate(async () => {
    const img = document.querySelector('#photo-img'); await img.decode();
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, 64, 64);
    const px = g.getImageData(0, 0, 64, 64).data; let lo = 255, hi = 0;
    for (let i = 0; i < px.length; i += 4) { const v = (px[i] + px[i + 1] + px[i + 2]) / 3; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const b64 = await fetch(img.src).then(r => r.blob()).then(b => new Promise(d => { const f = new FileReader(); f.onload = () => d(f.result.split(',')[1]); f.readAsDataURL(b); }));
    const a = document.querySelector('#photo-save'), cv = kitten.renderer.domElement;
    return {...kitten.photo, open: document.querySelector('#photo-dialog').open, range: hi - lo, save: a.download, href: a.href.slice(0, 5), canvasH: cv.height, canvasW: cv.width, photos: kitten.pet.photos, journal: kitten.pet.journal[0].text, b64};
  });
  ok(s.open && s.bytes > 15000 && s.range > 60, `the photo is a real picture (${s.w} x ${s.h}, ${Math.round(s.bytes / 1024)} KB, light to dark ${Math.round(s.range)})`);
  ok(s.w === s.canvasW && s.h < s.canvasH && s.h > s.canvasH * .5, `on a phone it stops above the care buttons (${s.h} of ${s.canvasH})`);
  ok(s.save === s.name && /^Mochi-\d{4}-\d\d-\d\d\.jpg$/.test(s.save) && s.href === 'blob:', `Save photo downloads it (${s.save})`);
  ok(s.photos === 1 && s.journal === 'The first photo of Mochi.', 'the first photo is a Moment');
  fs.writeFileSync(`${OUT}/7-photo.jpg`, Buffer.from(s.b64, 'base64'));
  await page.waitForTimeout(700);
  await page.screenshot({path: `${OUT}/8-photo-card.png`});
  await close();
}
{
  // A new player: no cards, the next gift on the friendship card.
  const {page, close} = await open({width: 390, height: 844, flags: '&intro=0'});
  await show(page);
  await page.waitForTimeout(4500);
  const s = await page.evaluate(() => ({open: !!document.querySelector('dialog[open]'), line: document.querySelector('#bond-gift').textContent, away: kitten.pet.away, news: kitten.news.length}));
  ok(!s.open && !s.away && !s.news, 'a new player gets no card');
  ok(s.line === 'Level 2 gift: a felt mouse', `and sees the first gift to work towards (“${s.line}”)`);
  await close();
}
{
  // Ten minutes away: no card.
  const {page, close} = await open({width: 390, height: 844, flags: '&intro=0', init: save(10 / 60, 5)});
  await show(page);
  await page.waitForTimeout(4500);
  const s = await page.evaluate(() => ({open: !!document.querySelector('dialog[open]'), away: kitten.pet.away}));
  ok(!s.open && !s.away, 'ten minutes away: no card');
  await close();
}
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
