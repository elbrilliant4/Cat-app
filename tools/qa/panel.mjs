// Stills of the panel under the room (needs, friendship, moments) on a phone.
// NIGHT=1 for the dark look, SLEEP=1 for her asleep, OUT (default qa-out/panel).
import {open} from './lib.mjs';
import fs from 'node:fs';
const OUT = process.env.OUT || 'qa-out/panel';
fs.mkdirSync(OUT, {recursive: true});
const night = +(process.env.NIGHT || 0);
const {page, step, close} = await open({width: 390, height: 844, night, flags: '&intro=0'});
await page.setViewportSize({width: 390, height: 844});
await page.evaluate(sleep => {
  const p = window.kitten && window.kitten.pet;
  if (!p) return;
  Object.assign(p, {food: 22, happiness: 97, water: 78, energy: 100, cleanliness: 96, cuddles: 5, bond: 8});
  const t = Date.now();
  p.journal = [
    {text: 'Tucked in for sweet little dreams.', icon: 'i-moon', time: t - 6e5},
    {text: '5 cuddles. One very happy cat.', icon: 'i-heart', time: t - 6.2e5},
    {text: 'Freshly brushed & feeling fabulous.', icon: 'i-brush', time: t - 6.4e5},
    {text: 'A little friendship begins.', icon: 'i-heart', time: t - 864e5 - 3600e3},
  ];
  if (sleep) p.sleeping = true;
}, !!+(process.env.SLEEP || 0));
await step(20);
await page.evaluate(() => { kitten.refresh(); kitten.renderJournal && kitten.renderJournal(); });
await page.waitForTimeout(1500);
const panel = await page.$('.panel');
await panel.screenshot({path: `${OUT}/panel${night ? '-night' : ''}.png`});
// (lib.mjs hides the dock for clean 3D shots; show it for this one.)
await page.evaluate(() => { document.documentElement.classList.remove('title', 'title-out'); document.querySelector('.dock').style.visibility = ''; });
await (await page.$('.stage')).screenshot({path: `${OUT}/stage${night ? '-night' : ''}.png`, timeout: 30000});
const errs = await page.evaluate(() => window.__errors || []);
console.log('saved', `${OUT}/panel${night ? '-night' : ''}.png`, errs.length ? errs : '');
await close();

// Taps: the Needs button opens the snack menu; Show all; the care guide.
{
  const {page, step, close} = await open({width: 390, height: 844});
  await page.evaluate(() => { const p = kitten.pet; p.food = 20; p.sleeping = false; const t = Date.now(); p.journal = Array.from({length: 9}, (_, i) => ({text: 'Moment ' + (i + 1), icon: 'i-heart', time: t - i * 6e5})); kitten.refresh(); kitten.renderJournal(); });
  await step(10);
  const rows = () => page.$$eval('#journal .moment', l => l.length);
  const before = await rows();
  const label = await page.textContent('#journal-more');
  await page.click('#journal-more');
  const after = await rows();
  console.log(before === 5 && after === 9 ? 'PASS' : 'FAIL', `show all: ${before} rows, "${label}", then ${after}`);
  const btn = await page.textContent('.need.hero .need-btn');
  await page.click('.need.hero .need-btn');
  await page.waitForTimeout(800);
  const open1 = await page.evaluate(() => document.querySelector('#feed-dialog').open);
  console.log(btn === 'Feed' && open1 ? 'PASS' : 'FAIL', `needs button "${btn}" opens the snack menu: ${open1}`);
  await page.evaluate(() => document.querySelector('#feed-dialog').close());
  await page.evaluate(() => { kitten.pet.food = 90; kitten.refresh(); });
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.need-btn')].every(b => b.hidden));
  const pill = await page.textContent('#needs-pill');
  console.log(hidden && pill === 'All good' ? 'PASS' : 'FAIL', `all fed: button hidden ${hidden}, pill "${pill}"`);
  await page.click('#log-switch');
  await page.waitForTimeout(400);
  await (await page.$('.log')).screenshot({path: `${OUT}/guide.png`});
  const vis = await page.evaluate(() => [document.querySelector('#journal-wrap').hidden, document.querySelector('#guide').hidden]);
  console.log(vis[0] && !vis[1] ? 'PASS' : 'FAIL', 'care guide tab shows the guide');
  await close();
}
