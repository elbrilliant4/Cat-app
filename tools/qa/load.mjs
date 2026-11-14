// Phase 18: how much the first open downloads on a phone, and the offline copy.
//   node tools/qa/load.mjs        (about 5 min; ONLY=bytes for the first part)
// Serves dist/ the way GitHub Pages does (text gzipped, files kept 10 minutes,
// "still the same?" answers, films in pieces) with a version.json of its own,
// so a new build can be published in the middle of the test.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url'; import zlib from 'node:zlib'; import crypto from 'node:crypto';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../dist');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json'};
const site = {build: 1, sw: true, down: false, log: [], mark: ''};
const srv = http.createServer((q, r) => {
  if (site.down) return q.socket.destroy();
  const name = decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html');
  if (name === '/version.json') { r.writeHead(200, {'content-type': 'application/json'}); return r.end(JSON.stringify({build: site.build, commit: 'test' + site.build, channel: 'preview', ...(site.sw ? {} : {sw: false})})); }
  const f = path.join(ROOT, name);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  let body = fs.readFileSync(f);
  // (A new build: the page and the styles both carry its mark.)
  if (name === '/index.html') body = Buffer.from(body.toString().replace('<body', `<body data-mark="${site.build}"`));
  if (name === '/style.css') body = Buffer.concat([body, Buffer.from(`\n/* mark ${site.build} */\n`)]);
  const etag = '"' + crypto.createHash('md5').update(body).digest('hex') + '"', head = {'content-type': TYPES[path.extname(f)] || 'application/octet-stream', etag, 'cache-control': 'max-age=600', 'accept-ranges': 'bytes'};
  if (q.headers['if-none-match'] === etag) { site.log.push({name, bytes: 0}); r.writeHead(304, head); return r.end(); }
  const range = /^bytes=(\d+)-(\d*)$/.exec(q.headers.range || '');
  if (range) { const a = +range[1], b = range[2] ? +range[2] : body.length - 1; site.log.push({name, bytes: b - a + 1}); r.writeHead(206, {...head, 'content-range': `bytes ${a}-${b}/${body.length}`}); return r.end(body.subarray(a, b + 1)); }
  if (/text|json|javascript|svg/.test(head['content-type']) && /gzip/.test(q.headers['accept-encoding'] || '')) { body = zlib.gzipSync(body); head['content-encoding'] = 'gzip'; }
  site.log.push({name, bytes: body.length});
  r.writeHead(200, head); r.end(body);
}).listen(0);
const base = `http://127.0.0.1:${srv.address().port}/`;
const chromium = await (async () => { try { return (await import('playwright')).chromium; } catch {} return (await import('/opt/node22/lib/node_modules/playwright/index.mjs')).chromium; })();
const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
let fails = 0;
const say = (ok, what) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what); if (!ok) fails++; };
const mb = n => (n / 1048576).toFixed(2) + ' MB';
const home = page => page.waitForFunction(() => document.querySelector('#loading')?.classList.contains('done'), null, {timeout: 900000});
const phone = () => browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true, deviceScaleFactor: 2});

// 1. The first open on a phone: bytes and requests until she is home.
{
  const ctx = await phone(), page = await ctx.newPage(); page.setDefaultTimeout(900000);
  page.on('pageerror', e => say(false, 'page error: ' + e.message));
  // (Only what the page itself asked for: on this slow test machine the
  // offline copy, which starts once she is home, is in before we can look.)
  const asked = new Set();
  page.on('request', q => { if (!q.serviceWorker()) asked.add(new URL(q.url()).pathname.replace(/\/$/, '/index.html')); });
  await page.goto(base); await home(page);
  const seen = new Set(), first = site.log.filter(x => asked.has(x.name) && !seen.has(x.name) && seen.add(x.name)), total = first.reduce((s, x) => s + x.bytes, 0);
  console.log(`first open on a phone: ${mb(total)} in ${first.length} requests`);
  for (const x of first.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 6)) console.log(`   ${mb(x.bytes)}  ${x.name}`);
  say(total < 6 * 1048576, `the first open is under 6 MB (${mb(total)})`);
  say(first.some(x => x.name.endsWith('mochi-longhair-phone.glb')) && !first.some(x => /mochi-longhair-(hq|web)\.glb/.test(x.name)), 'a phone gets the phone copy of her model');
  say(!first.some(x => x.name.endsWith('.mp4')), 'the film is not fetched before she is home (it comes in behind the Enter screen)');
  if (process.env.ONLY === 'bytes') { await browser.close(); srv.close(); process.exit(fails ? 1 : 0); }

  // 2. The offline copy comes in behind the app, and then the app opens with the server gone.
  await page.waitForFunction(() => window.__offline?.build === '1:test1', null, {timeout: 300000});
  const all = site.log.reduce((s, x) => s + x.bytes, 0);
  console.log(`with the offline copy (film, toys, sounds): ${mb(all)} in all`);
  await page.evaluate(() => { const k = Object.keys(localStorage).find(k => /pocket|kitten|pk-save|mochi/i.test(k) && k !== 'pk-build'); window.__k = k; });
  const saveBefore = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => k !== 'pk-build').map(([k, v]) => [k, v.length])));
  site.down = true;
  await page.reload(); await home(page);
  say(true, 'with the server gone, the app opens and she comes home');
  say(await page.evaluate(() => document.body.dataset.mark) === '1', 'offline, the page is build 1');
  const saveAfter = await page.evaluate(() => Object.entries(localStorage).filter(([k]) => k !== 'pk-build').map(([k]) => k).length);
  say(saveAfter >= JSON.parse(saveBefore).length && saveAfter > 0, `the save is still there offline (${saveAfter} entries)`);
  const film = await page.evaluate(async () => { const r = await fetch('./assets/title/mochi-opening-v4.mp4', {headers: {range: 'bytes=100-1099'}}); return {status: r.status, n: (await r.arrayBuffer()).byteLength, cr: r.headers.get('content-range')}; });
  say(film.status === 206 && film.n === 1000, `offline, a piece of the film comes from the copy (${film.status}, ${film.n} bytes, ${film.cr})`);
  const toy = await page.evaluate(() => fetch('./assets/models/felt-mouse.glb').then(r => r.ok, () => false));
  say(toy, 'offline, a toy she has not used yet is there');
  const stray = await page.evaluate(() => fetch('./assets/mochi-longhair-hq.glb').then(r => r.ok, () => false));
  say(!stray, 'the unpacked 8.9 MB model is not kept');

  // 3. A new build. While she is being played with: nothing changes. Next open: all of it, at once.
  site.down = false; site.build = 2; site.log.length = 0;
  await page.goto(base + '?intro=0'); await home(page);
  await page.waitForFunction(() => window.__offline?.staged === '2:test2', null, {timeout: 300000});
  const marks = () => page.evaluate(async () => ({page: document.body.dataset.mark, css: (/mark (\d+)/.exec(await (await fetch('./style.css')).text()) || [])[1]}));
  let m = await marks();
  say(m.page === '1' && m.css === '1', `a new build is out, the app in use stays whole on the old one (page ${m.page}, styles ${m.css})`);
  const fetched = site.log.reduce((s, x) => s + x.bytes, 0);
  console.log(`   the new build cost ${mb(fetched)} (only what changed is sent again)`);
  await page.goto(base + '?intro=0'); await page.waitForFunction(() => document.body.dataset.mark === '2', null, {timeout: 120000}); await home(page);
  m = await marks();
  say(m.page === '2' && m.css === '2', `the next open is the new build, page and styles together (page ${m.page}, styles ${m.css})`);
  // An app left open (a home-screen app is woken, not launched). Coming back
  // to it puts a build that is already in to use: one load, no title. With
  // nothing in yet, coming back looks for a new build (at most once a
  // minute), fetches it behind the app, and the return after that uses it.
  const back = () => page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); });
  site.build = 3;
  let swaps = 0; page.on('load', () => swaps++);
  await page.waitForTimeout(62000);
  await back();
  await page.waitForFunction(() => window.__offline?.staged === '3:test3', null, {timeout: 300000});
  m = await marks();
  say(swaps === 0 && m.page === '2', `left open, a new build comes in behind the app and nothing reloads yet (page ${m.page}, ${swaps} loads)`);
  await page.evaluate(() => history.replaceState(null, '', './'));
  await back();
  await page.waitForFunction(() => document.body?.dataset.mark === '3', null, {timeout: 120000}); await home(page);
  m = await marks();
  say(m.page === '3' && m.css === '3' && swaps === 1, `coming back to the app puts it to use, page and styles together, in one load (page ${m.page}, styles ${m.css}, ${swaps} load)`);
  say(await page.evaluate(() => !document.documentElement.classList.contains('title') && sessionStorage.getItem('pk-swap') === null), 'that load shows no title screen, and only that one');
  await back(); await page.waitForTimeout(3000);
  say(swaps === 1, `coming back again with nothing new does not reload (${swaps} load)`);
  // On the title screen the new build is put to use in the same open.
  site.build = 4;
  await page.goto(base); await page.waitForFunction(() => document.body.dataset.mark === '4', null, {timeout: 300000});
  m = await marks();
  say(m.page === '4' && m.css === '4', 'on the title screen, a new build comes in during the same open');
  const names = await page.evaluate(() => caches.keys());
  say(names.filter(n => n.includes(':build:')).length === 1, `old copies are thrown away (${names.join(', ')})`);

  // 4. The off switch.
  site.sw = false;
  await page.goto(base + '?intro=0'); await home(page);
  await page.waitForFunction(async () => !(await navigator.serviceWorker.getRegistrations()).length && !(await caches.keys()).length, null, {timeout: 60000});
  say(true, '"sw": false in version.json removes the offline copy');
  site.sw = true;
  await page.goto(base + '?intro=0&sw=off'); await home(page);
  await page.waitForTimeout(3000);
  say(await page.evaluate(async () => !(await navigator.serviceWorker.getRegistrations()).length), '?sw=off leaves no offline copy');
  await ctx.close();
}
// 5. A player from before the offline copy (the phone remembers an older
// build, no worker yet), in the middle of playing: no sudden reload; the
// copy waits and the next open uses it.
{
  site.build = 7; site.sw = true;
  const ctx = await phone(), page = await ctx.newPage(); page.setDefaultTimeout(900000);
  await page.addInitScript(() => { if (!localStorage.getItem('pk-build')) localStorage.setItem('pk-build', '5:old'); });
  let loads = 0; page.on('load', () => loads++);
  await page.goto(base + '?intro=0'); await home(page);
  await page.waitForFunction(() => window.__offline?.staged === '7:test7', null, {timeout: 300000});
  await page.waitForTimeout(3000);
  say(loads === 1, `an earlier player in the middle of playing is not reloaded (${loads} load)`);
  site.down = true;
  await page.goto(base + '?intro=0').catch(() => {}); await home(page);
  say(await page.evaluate(() => document.body.dataset.mark) === '7', 'and their next open comes from the offline copy');
  site.down = false;
  await ctx.close();
}
await browser.close(); srv.close();
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
