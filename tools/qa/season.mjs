// Seasonal decor check: pick Halloween (offered under ?decor=halloween), then
// come back without the flag out of season: the room should be Thanksgiving
// and Halloween not offered. (Runs on today's date: in October both stay.)
//   node tools/qa/season.mjs
import {open} from './lib.mjs';
const {page, close} = await open({seed: 1, flags: '&decor=halloween'});
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.evaluate(() => { document.querySelector('#decor-btn').click(); document.querySelector('#decor-options [data-decor="halloween"]').click(); });
await page.waitForTimeout(1500);
console.log('picked:', await page.evaluate(() => ({saved: kitten.pet.decor, room: kitten.room.decor})));
const url = page.url().replace('&decor=halloween', '');
await page.goto(url);
await page.waitForFunction(() => window.kitten && kitten.cat.ready, null, {timeout: 600000});
await page.waitForTimeout(2000);
console.log('back in November, no flag:', await page.evaluate(() => { document.querySelector('#decor-btn').click(); return {saved: kitten.pet.decor, room: kitten.room.decor, offered: [...document.querySelectorAll('#decor-options [data-decor]')].map(b => b.dataset.decor)}; }));
console.log('page errors:', errs.length);
await close();
