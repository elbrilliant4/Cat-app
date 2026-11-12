// Pictures of the rig check (dist/rig-check.html) in headless Chromium.
//   node tools/qa/rig-shots.mjs <out dir> [--model=longhair] [--fur] [--size=900x700] pose:view ...
//   e.g. node tools/qa/rig-shots.mjs /tmp/shots --model=longhair --fur stand:side sit:front34 sit:face
// --watch=<file>: after the shots, stay open and run each new version of that
// file as page script (it may return a list of pose:view shots to take), so
// numbers can be tried without loading the model again (loading is slow in
// software WebGL).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../dist');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg'};
const args = process.argv.slice(2), opt = n => args.find(a => a.startsWith('--' + n))?.split('=')[1] ?? (args.includes('--' + n) ? true : null);
const [out, ...shots] = args.filter(a => !a.startsWith('--'));
const [width, height] = (opt('size') || '900x700').split('x').map(Number);
fs.mkdirSync(out, {recursive: true});

const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, {'content-type': TYPES[path.extname(f)] || 'application/octet-stream'});
  fs.createReadStream(f).pipe(r);
}).listen(0);
const {chromium} = await import('playwright').catch(() => import('/opt/node22/lib/node_modules/playwright/index.mjs'));
const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport: {width, height}});
page.setDefaultTimeout(3600000);
page.on('pageerror', e => console.log('pageerror', e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log(m.type(), m.text().slice(0, 600)); });
const t0 = Date.now();
await page.goto(`http://127.0.0.1:${srv.address().port}/rig-check.html?rig=2${opt('model') ? '&model=' + opt('model') : ''}`);
await page.waitForFunction(() => window.check?.ready);
console.log('loaded in', ((Date.now() - t0) / 1000).toFixed(0), 's');

async function take(list, tag = '') {
  let last;
  for (const s of list) {
    const [pose, view] = s.split(':');
    await page.evaluate(([pose, view, fur, same]) => { if (!same) check.pose(pose); check.fur(fur); check.view(view); check.render(); }, [pose, view, !!opt('fur'), pose === last]);
    last = pose;
    const file = path.join(out, `${tag}${pose}-${view}.png`);
    await page.screenshot({path: file});
    console.log(file);
  }
}
await take(shots);
const watch = opt('watch');
if (watch) {
  let seen = 0;
  for (;;) {
    await new Promise(r => setTimeout(r, 1000));
    if (!fs.existsSync(watch)) continue;
    const m = fs.statSync(watch).mtimeMs;
    if (m === seen) continue;
    seen = m;
    const code = fs.readFileSync(watch, 'utf8');
    if (code.trim() === 'quit') break;
    try {
      const r = await page.evaluate(code);
      if (r?.shots) await take(r.shots, r.tag || '');
      console.log('done', JSON.stringify(r)?.slice(0, 2000));
    } catch (e) { console.log('error', e.message); }
  }
}
await browser.close(); srv.close();
