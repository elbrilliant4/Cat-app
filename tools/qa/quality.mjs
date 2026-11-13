// Phase 18: the quality step-down and the `?fps` readout, on a phone-sized
// screen. The test machine draws in software, far slower than any phone, so
// the app must step down by itself, one level at a time, to level 3, and
// remember it; `?q=0` must hold the full picture. Stills to OUT. About 3 min.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../dist'), OUT = process.env.OUT || 'qa-out/quality';
fs.mkdirSync(OUT, {recursive: true});
const srv = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, {'content-type': {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json'}[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r);
}).listen(0);
const base = `http://127.0.0.1:${srv.address().port}/`;
const chromium = await (async () => { try { return (await import('playwright')).chromium; } catch {} return (await import('/opt/node22/lib/node_modules/playwright/index.mjs')).chromium; })();
const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
let fails = 0; const say = (ok, what) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what); if (!ok) fails++; };
const ctx = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true, deviceScaleFactor: 2});
const page = await ctx.newPage(); page.setDefaultTimeout(900000);
page.on('pageerror', e => say(false, 'page error: ' + e.message));
const chip = () => page.evaluate(() => document.querySelector('#fps-chip')?.textContent || '');
const level = async () => +((/quality (\d)/.exec(await chip()) || [])[1] ?? -1);
const home = () => page.waitForFunction(() => document.querySelector('#loading')?.classList.contains('done'));

await page.goto(base + '?intro=0&fps&q=0'); await home();
await page.waitForFunction(() => /quality 0/.test(document.querySelector('#fps-chip')?.textContent || ''));
await page.waitForTimeout(20000);
let c = await chip(); console.log('   ' + c.replace('\n', ' | '));
say(/^[\d.]+ fps/.test(c) && / 780x\d+ · fur 9$/.test(c), 'the readout shows frames a second, a full-sharpness picture (780 wide) and 9 fur layers');
say(await level() === 0, '?q=0 holds the full picture however slow the machine');
await page.screenshot({path: `${OUT}/q0.png`});

const seen = [];
await page.goto(base + '?intro=0&fps'); await home();
for (let i = 0; i < 240 && seen.at(-1) !== 3; i++) { await page.waitForTimeout(500); const l = await level(); if (l >= 0 && l !== seen.at(-1)) seen.push(l); }
c = await chip(); console.log('   ' + c.replace('\n', ' | ') + '   levels seen: ' + seen.join(' '));
say(seen.join('') === '0123' || seen.join('') === '123', 'a slow machine steps down one level at a time to 3');
say(/ 390x\d+ · fur 6$/.test(c), 'level 3: a plain-sharpness picture (390 wide) and 6 fur layers');
say(await page.evaluate(() => JSON.parse(localStorage.getItem('pk-quality') || '{}').level) === 3, 'the level is remembered');
await page.screenshot({path: `${OUT}/q3.png`});
await page.goto(base + '?intro=0&fps'); await home();
await page.waitForFunction(() => /quality 3/.test(document.querySelector('#fps-chip')?.textContent || ''), null, {timeout: 60000});
say(true, 'the next launch starts at the remembered level');
await browser.close(); srv.close();
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
