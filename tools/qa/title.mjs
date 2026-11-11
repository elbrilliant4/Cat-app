// Title screen: loads, shows "wake her", a tap leaves it and the app is left
// usable. Phone and desktop, plus: already asleep (tiptoe in), reduced
// motion, ?intro=0 and ?debug (both: no title). Needs `npm run dev` running.
//   node tools/qa/title.mjs      OUT=qa-out PORT=5173
import fs from 'node:fs';
async function chromium() {
  try { return (await import('playwright')).chromium; } catch {}
  return (await import('/opt/node22/lib/node_modules/playwright/index.mjs')).chromium;
}
const OUT = process.env.OUT || 'qa-out', BASE = `http://127.0.0.1:${process.env.PORT || 5173}/index.html`;
fs.mkdirSync(OUT, {recursive: true});
const browser = await (await chromium()).launch({args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
const PHONE = {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true}, DESK = {viewport: {width: 1440, height: 900}};
const titleOn = page => page.evaluate(() => document.documentElement.classList.contains('title'));
let failed = 0;
async function run(name, query, opts, body) {
  const ctx = await browser.newContext(opts), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(BASE + query);
    await body(page);
    const stuck = await page.evaluate(() => document.querySelectorAll('[inert]').length + (document.querySelector('.stage').getAttribute('style') ? 1 : 0));
    if (await titleOn(page)) throw new Error('title still up');
    if (stuck) throw new Error('page left locked');
    if (errors.length) throw new Error('page errors: ' + errors.join(' | '));
    console.log('PASS', name);
  } catch (e) { failed++; console.log('FAIL', name, e.message); }
  await ctx.close();
}
const through = (label, key) => async page => {
  await page.waitForSelector('#title.lit', {timeout: 120000});
  await page.waitForTimeout(3000);
  await page.screenshot({path: `${OUT}/title-${label}.png`});
  if (key) await page.keyboard.press(key); else await page.click('#title', {timeout: 120000, noWaitAfter: true});
  await page.waitForFunction(() => !document.documentElement.classList.contains('title'), null, {timeout: 60000});
  await page.waitForTimeout(3000);
  await page.screenshot({path: `${OUT}/title-${label}-after.png`});
};
await run('phone', '?night=0', PHONE, through('phone'));
await run('desktop, night, Enter key', '?night=1', DESK, through('desk', 'Enter'));
await run('reduced motion', '?night=0', {...PHONE, reducedMotion: 'reduce'}, through('reduced'));
await run('already asleep: tiptoe in', '?night=1', PHONE, async page => {
  await page.addInitScript(() => { const k = 'pocket-kitten-companion-v1'; let v = {}; try { v = JSON.parse(localStorage[k]) || {}; } catch {} v.sleeping = true; v.updated = Date.now(); localStorage[k] = JSON.stringify(v); });
  await page.reload();
  await page.waitForSelector('#title.lit', {timeout: 120000});
  if (!/tiptoe/.test(await page.textContent('#title-go'))) throw new Error('no tiptoe label');
  await through('asleep')(page);
  if (await page.textContent('#mood-text') !== 'Dreaming softly') throw new Error('she woke up');
});
for (const q of ['?intro=0', '?debug'])
  await run('no title with ' + q, q, PHONE, async page => { await page.waitForSelector('#loading.done', {state: 'attached', timeout: 120000}); if (await page.isVisible('#title')) throw new Error('title shown'); });
await browser.close();
process.exit(failed ? 1 : 0);
