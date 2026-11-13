// Phase 08, the phone sheet: stills (resting, open, asleep at night) and
// checks: no page scroll, the top need's button on screen, a swipe up opens
// it, a swipe down on the grip closes it, a tap on the room closes it, the
// dock sits above the resting sheet. OUT (default qa-out/sheet).
import {open} from './lib.mjs';
import fs from 'node:fs';
const OUT = process.env.OUT || 'qa-out/sheet';
fs.mkdirSync(OUT, {recursive: true});
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m);
async function start(night, sleep) {
  const s = await open({width: 390, height: 844, night, flags: '&intro=0'});
  await s.page.evaluate(sl => {
    document.documentElement.classList.remove('title', 'title-out');
    document.querySelectorAll('.hud, .dock').forEach(e => e.style.visibility = '');
    const p = kitten.pet;
    Object.assign(p, {food: 22, happiness: 96, water: 77, energy: 100, cleanliness: 94, sleeping: sl});
    kitten.refresh(); kitten.sheetPeek();
  }, sleep);
  await s.step(30);
  await s.page.waitForTimeout(900);
  return s;
}
const drag = async (page, x, y0, y1) => {
  await page.mouse.move(x, y0); await page.mouse.down();
  for (let i = 1; i <= 8; i++) { await page.mouse.move(x, y0 + (y1 - y0) * i / 8); await page.waitForTimeout(16); }
  await page.mouse.up(); await page.waitForTimeout(800);
};
const isOpen = page => page.evaluate(() => document.body.classList.contains('sheet-open'));
{
  const {page, step, close} = await start(0, false);
  await page.screenshot({path: `${OUT}/resting.png`});
  const m = await page.evaluate(() => {
    const b = document.querySelector('.need.hero .need-btn').getBoundingClientRect();
    const d = document.querySelector('.dock').getBoundingClientRect(), s = document.querySelector('#sheet').getBoundingClientRect();
    return {scroll: document.scrollingElement.scrollHeight - innerHeight, btn: [b.top, b.bottom, b.width], dockBottom: d.bottom, sheetTop: s.top, peek: getComputedStyle(document.documentElement).getPropertyValue('--peek-px')};
  });
  ok(m.scroll <= 0, `page does not scroll (extra ${m.scroll}px)`);
  ok(m.btn[2] > 0 && m.btn[0] > 0 && m.btn[1] < 844, `top need's button on screen (${m.btn.map(Math.round)})`);
  ok(m.dockBottom <= m.sheetTop + 1, `dock above the resting sheet (dock ${Math.round(m.dockBottom)}, sheet ${Math.round(m.sheetTop)}, peek ${m.peek})`);
  const top = m.sheetTop;
  await drag(page, 200, top + 160, top - 260);
  ok(await isOpen(page), 'a swipe up on the resting sheet opens it');
  await page.screenshot({path: `${OUT}/open.png`});
  const g = await page.evaluate(() => { const r = document.querySelector('#sheet-grip').getBoundingClientRect(); return r.top + r.height / 2; });
  await drag(page, 200, g, g + 420);
  ok(!(await isOpen(page)), 'a swipe down on the grip closes it');
  await page.click('#sheet-grip'); await page.waitForTimeout(800);
  ok(await isOpen(page), 'a tap on the grip opens it');
  await page.mouse.click(200, 30); await page.waitForTimeout(800);
  ok(!(await isOpen(page)), 'a tap on the room above closes it');
  // Open, scrolled down, a need changes: the resting height must survive.
  await page.click('#sheet-grip'); await page.waitForTimeout(700);
  await page.evaluate(() => { document.querySelector('#sheet').scrollTop = 400; kitten.pet.food = 90; kitten.pet.water = 20; kitten.refresh(); });
  await page.waitForTimeout(500);
  await page.mouse.click(200, 30); await page.waitForTimeout(900);
  const pk = await page.evaluate(() => { const s = document.querySelector('#sheet').getBoundingClientRect(), d = document.querySelector('.dock').getBoundingClientRect(); return {top: s.top, dock: d.bottom}; });
  ok(pk.top > 400 && pk.top < 700 && pk.dock <= pk.top + 1, `resting height kept after a change while scrolled (sheet top ${Math.round(pk.top)}, dock ${Math.round(pk.dock)})`);
  const inert = await page.evaluate(() => ['.bond-card', '.log', '#sheet footer'].every(q => document.querySelector(q).inert));
  ok(inert, 'resting: friendship, moments and footer are out of keyboard reach');
  await page.evaluate(() => { kitten.pet.food = 22; kitten.pet.water = 77; kitten.refresh(); });
  await page.waitForTimeout(600);
  // A message shows above the sheet (it ignores touches, so compare layers).
  await page.evaluate(() => { kitten.pet.sleeping = true; kitten.refresh(); document.querySelector('.dock [data-action="feed"]').click(); });
  await step(20); await page.waitForTimeout(700);
  const t = await page.evaluate(() => { const el = document.querySelector('.toast'), r = el.getBoundingClientRect(), sh = document.querySelector('#sheet').getBoundingClientRect(); const z = +getComputedStyle(el).zIndex > +getComputedStyle(document.querySelector('#sheet')).zIndex; kitten.pet.sleeping = false; kitten.refresh(); return {text: el.textContent, top: el.classList.contains('visible') && (z || r.bottom <= sh.top)}; });
  ok(t.top, `a message shows on top ("${t.text}")`);
  await step(240);
  await page.click('.need.hero .need-btn'); await page.waitForTimeout(700);
  ok(await page.evaluate(() => document.querySelector('#feed-dialog').open), 'Feed on the resting sheet opens the snack menu');
  await close();
}
{
  const {page, close} = await start(1, true);
  await page.screenshot({path: `${OUT}/asleep-night.png`});
  await close();
}
{
  // Turned sideways: no sheet, the old layout.
  const s = await open({width: 667, height: 375, flags: '&intro=0'});
  await s.step(10);
  const fixed = await s.page.evaluate(() => getComputedStyle(document.querySelector('#sheet')).position);
  ok(fixed !== 'fixed', `phone turned sideways keeps the page layout (sheet position ${fixed})`);
  await s.close();
}
