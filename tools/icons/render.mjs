// Renders Meshy models (GLB) as soft clay icons, 256 px PNG with no ground.
// node tools/icons/render.mjs <glb dir> <out dir>   (list and colours below)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [GLB, OUT] = process.argv.slice(2);
const DIST = path.resolve('dist'), HERE = path.resolve('tools/icons');
const ICONS = JSON.parse(process.env.ICONS || 'null') || [
  {name: 'bowl', color: '#f28c5b', color2: '#a8603a', split: .78},
  {name: 'heart', color: '#f2689a', yaw: -.25, pitch: .1},
  {name: 'drop', color: '#5b8def', yaw: -.3, pitch: .1},
  {name: 'bolt', color: '#f2b53a', yaw: -.3, pitch: .05},
  {name: 'sparkle', color: '#3fb3c9', yaw: -.3, pitch: .1},
  {name: 'paw', color: '#e2557a', yaw: 0, pitch: 1.1},
];
const types = {'.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary'};
const srv = http.createServer((q, s) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const f = u.startsWith('/vendor/') ? path.join(DIST, u) : u.startsWith('/glb/') ? path.join(path.resolve(GLB), u.slice(5)) : path.join(HERE, u);
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}); s.end(d); });
}).listen(0);
let chromium; try { ({chromium} = await import('playwright')); } catch { ({chromium} = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const b = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const p = await b.newPage({viewport: {width: 256, height: 256}});
p.on('pageerror', e => console.log('page error', e.message));
await p.goto(`http://127.0.0.1:${srv.address().port}/clay.html`);
await p.waitForFunction(() => window.ready);
fs.mkdirSync(OUT, {recursive: true});
for (const ic of ICONS) {
  const data = await p.evaluate(o => renderIcon(o), {...ic, url: `/glb/${ic.name}.glb`});
  fs.writeFileSync(path.join(OUT, ic.name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
  console.log('rendered', ic.name);
}
await b.close(); srv.close();
