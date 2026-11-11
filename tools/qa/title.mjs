// Title screen. Full (the first launch of the day): the Enter buttons, the
// zoomies cinematic, her name, a tap leaves it; a tap skips the sequence and
// the room is tidy after; the second launch that day is the short one.
// Short: "wake her", a tap leaves it and the app is left usable. Phone and
// desktop, plus: already asleep (tiptoe in), reduced motion (no sequence),
// ?intro=0 and ?debug (both: no title). Needs `npm run dev` running.
//   node tools/qa/title.mjs      OUT=qa-out PORT=5173
import fs from 'node:fs';
async function chromium() {
  try { return (await import('playwright')).chromium; } catch {}
  return (await import('/opt/node22/lib/node_modules/playwright/index.mjs')).chromium;
}
const OUT = process.env.OUT || 'qa-out', BASE = `http://127.0.0.1:${process.env.PORT || 5173}/index.html`;
fs.mkdirSync(OUT, {recursive: true});
const browser = await (await chromium()).launch({args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
const PHONE = {viewport: {width: 390, height: 844}, deviceScaleFactor: 1, isMobile: true, hasTouch: true}, DESK = {viewport: {width: 1440, height: 900}};
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
  await page.screenshot({path: `${OUT}/title-${label}.png`, timeout: 120000});
  if (key) await page.keyboard.press(key); else await page.click('#title', {timeout: 120000, noWaitAfter: true});
  await page.waitForFunction(() => !document.documentElement.classList.contains('title'), null, {timeout: 60000});
  await page.waitForTimeout(3000);
  await page.screenshot({path: `${OUT}/title-${label}-after.png`, timeout: 120000});
};
const SAVE = 'pocket-kitten-companion-v1';
const tapOut = async page => {
  // (A tap in the first moment after her name comes in doesn't count: tap again.)
  for (let i = 0; i < 40 && await titleOn(page); i++) { await page.click('#title', {timeout: 120000, noWaitAfter: true}).catch(() => {}); await page.waitForTimeout(1500); }
};
await run('full: Enter, the sequence, her name, tap; then short the same day', '?night=0', PHONE, async page => {
  await page.waitForSelector('#title.gate', {timeout: 120000});
  await page.screenshot({path: `${OUT}/title-gate.png`, timeout: 120000});
  await page.click('#enter-mute', {timeout: 120000, noWaitAfter: true});
  await page.waitForSelector('#title.cine', {timeout: 60000});
  await page.waitForSelector('#title.reveal', {timeout: 1200000});
  if (await page.evaluate(k => JSON.parse(localStorage[k] || '{}').sound === true, SAVE)) throw new Error('sound was turned on');
  await page.waitForTimeout(4000);
  await page.screenshot({path: `${OUT}/title-live.png`, timeout: 120000});
  await tapOut(page);
  await page.goto(BASE + '?night=0');
  await page.waitForSelector('#title.lit', {timeout: 120000});
  if (await page.evaluate(() => document.getElementById('title').classList.contains('full'))) throw new Error('full again the same day');
  await through('second')(page);
});
await run('full: with sound, a tap skips, the room is tidy', '?debug&intro=full&night=0', PHONE, async page => {
  await page.waitForSelector('#title.gate', {timeout: 120000});
  const before = await page.evaluate(() => JSON.stringify(['name', 'bond', 'cuddles', 'sleeping', 'place'].map(k => kitten.pet[k])));
  await page.click('#enter-sound', {timeout: 120000, noWaitAfter: true});
  // (Into the vase shot, with slow motion on.)
  await page.waitForFunction(() => kitten.title.cine?.T > 5.4, null, {timeout: 1200000});
  await page.click('#title', {timeout: 120000, noWaitAfter: true});
  await page.waitForSelector('#title.reveal', {timeout: 60000});
  await page.waitForTimeout(3000);
  const st = await page.evaluate(() => { const b = kitten.brain, v = kitten.room.mantelVase, h = v.userData.home; return {stage: kitten.title.stage, at: Math.hypot(b.pos.x, b.pos.z - .3), y: b.elevation, perch: b.perch, jump: !!b.jump, vase: v.position.distanceTo(h.p) + Math.abs(v.rotation.x) + Math.abs(v.rotation.z), sound: kitten.pet.sound, pet: JSON.stringify(['name', 'bond', 'cuddles', 'sleeping', 'place'].map(k => kitten.pet[k])), ms: kitten.title.fx?.frameMs}; });
  console.log('  frame time on this machine (ms):', st.ms?.toFixed(0));
  if (st.stage !== 'live' || st.at > .05 || st.y > .05 || st.perch || st.jump) throw new Error('she is not sitting at home: ' + JSON.stringify(st));
  if (st.vase > .001) throw new Error('the vase is not back');
  if (!st.sound) throw new Error('sound was not turned on');
  if (st.pet !== before) throw new Error('her save changed');
  await tapOut(page);
  if (await page.evaluate(() => !!kitten.title.fx || kitten.camera.fov > 47)) throw new Error('title picture left on');
});
await run('phone, short', '?night=0&intro=short', PHONE, through('phone'));
await run('desktop, night, Enter key, short', '?night=1&intro=short', DESK, through('desk', 'Enter'));
await run('reduced motion: no sequence', '?night=0&intro=full', {...PHONE, reducedMotion: 'reduce'}, async page => {
  await page.waitForSelector('#title.lit', {timeout: 120000});
  if (await page.isVisible('#title-gate')) throw new Error('Enter buttons shown');
  await through('reduced')(page);
});
await run('already asleep: tiptoe in', '?night=1', PHONE, async page => {
  await page.addInitScript(() => { const k = 'pocket-kitten-companion-v1'; let v = {}; try { v = JSON.parse(localStorage[k]) || {}; } catch {} v.sleeping = true; v.updated = Date.now(); localStorage[k] = JSON.stringify(v); });
  await page.reload();
  await page.waitForSelector('#title.lit', {timeout: 120000});
  if (!/tiptoe/.test(await page.textContent('#title-go'))) throw new Error('no tiptoe label');
  await through('asleep')(page);
  if (await page.textContent('#mood-text') !== 'Dreaming softly') throw new Error('she woke up');
});
for (const q of ['?debug&intro=short&night=0'])
  await run('chime plays with sound on, ' + q, q, PHONE, async page => {
    await page.addInitScript(() => { const k = 'pocket-kitten-companion-v1'; let v = {}; try { v = JSON.parse(localStorage[k]) || {}; } catch {} v.sound = true; v.sleeping = false; v.updated = Date.now(); localStorage[k] = JSON.stringify(v); });
    await page.reload();
    await page.waitForSelector('#title.lit', {timeout: 120000});
    await page.click('#title', {timeout: 120000, noWaitAfter: true});
    await page.waitForFunction(() => window.kitten.chimed !== undefined, null, {timeout: 60000});
    if (!await page.evaluate(() => window.kitten.chimed)) throw new Error('chime did not play');
    await page.waitForFunction(() => !document.documentElement.classList.contains('title'), null, {timeout: 60000});
  });
for (const q of ['?intro=0', '?debug'])
  await run('no title with ' + q, q, PHONE, async page => { await page.waitForSelector('#loading.done', {state: 'attached', timeout: 120000}); if (await page.isVisible('#title')) throw new Error('title shown'); });
await browser.close();
process.exit(failed ? 1 : 0);
