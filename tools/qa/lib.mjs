// Shared helpers for the QA scripts: serve dist/, open the app in headless
// Chromium (software WebGL), wait for Mochi, and step time by hand.
//   import {open} from './lib.mjs';
//   const {page, step, close} = await open({seed: 7, kitchen: true});
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../dist');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json'};

async function chromium() {
  try { return (await import('playwright')).chromium; } catch {}
  return (await import('/opt/node22/lib/node_modules/playwright/index.mjs')).chromium;
}

export async function open({seed = null, kitchen = false, night = 0, flags = '', width = 420, height = 760, quiet = true} = {}) {
  const srv = http.createServer((q, r) => {
    let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (f.endsWith('/')) f += 'index.html';
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, {'content-type': TYPES[path.extname(f)] || 'application/octet-stream'});
    fs.createReadStream(f).pipe(r);
  }).listen(0);
  const port = srv.address().port;
  const browser = await (await chromium()).launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport: {width, height}});
  page.setDefaultTimeout(3600000);
  page.on('pageerror', e => console.log('pageerror', e.message));
  // Same random choices every run, so before/after numbers are comparable.
  if (seed !== null) await page.addInitScript(s => { let x = s; Math.random = () => (x = (x * 16807) % 2147483647) / 2147483647; }, seed);
  await page.goto(`http://127.0.0.1:${port}/index.html?debug&frames&night=${night}${flags}`);
  await page.waitForFunction(() => window.kitten && kitten.cat.ready && kitten.cat.motion && kitten.kitchen, null, {timeout: 900000});
  await page.evaluate(([k, quiet]) => {
    if (k) kitten.goTo('kitchen');
    if (quiet) Object.assign(kitten.brain, {nextIdle: 1e9, nextShow: 1e9, nextBird: 1e9, nextVacuum: 1e9, vacInit: true});
    document.querySelectorAll('.hud, .dock, .scene-hint, #speech').forEach(e => e.style.visibility = 'hidden');
  }, [kitchen, quiet]);
  // Advance n frames of 1/20 s (drawing only the last one).
  const step = (n = 1, dt = 1 / 20) => page.evaluate(([n, dt]) => kitten.step(dt, n, false), [n, dt]);
  // Put the camera somewhere and draw: {focus: [x,y,z], yaw, pitch, dist}.
  const look = v => page.evaluate(v => { const w = kitten.view; w.mode = 'free'; for (const o of [w, w.goal]) { o.focus.set(...v.focus); Object.assign(o, {yaw: v.yaw, pitch: v.pitch, dist: v.dist}); } w.cut = 0; w.lift = 0; kitten.step(1 / 60, 1, true); }, v);
  const close = async () => { await browser.close(); srv.close(); };
  return {page, step, look, close};
}
