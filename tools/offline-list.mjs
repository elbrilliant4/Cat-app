// Writes dist/offline-files.json: the files the offline copy keeps (sw.js).
//   node tools/offline-list.mjs           write it
//   node tools/offline-list.mjs --check   fail when it is out of date (npm run check)
// "app": the page, its styles, every script reachable from app.js, and the
// pictures, sounds and toy models the app can ask for. "phone" and "web":
// her model for that kind of device. "film": the opening film.
// Not kept: the unpacked and earlier cat models, the test pages, big icons.
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const DIST = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../dist'), OUT = path.join(DIST, 'offline-files.json');
const code = new Set(), walk = f => {
  if (code.has(f)) return; code.add(f);
  const src = fs.readFileSync(path.join(DIST, f), 'utf8');
  for (const m of src.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    const to = m[1] === 'three' ? 'vendor/three.module.js' : m[1].startsWith('.') ? path.posix.join(path.posix.dirname(f), m[1]) : null;
    if (to && to.endsWith('.js') && fs.existsSync(path.join(DIST, to))) walk(to);
  }
};
walk('app.js');
const dir = (d, ok = () => true) => fs.readdirSync(path.join(DIST, d)).filter(f => fs.statSync(path.join(DIST, d, f)).isFile() && ok(f)).map(f => `${d}/${f}`);
const list = {
  app: ['index.html', 'privacy.html', 'style.css', 'manifest.webmanifest', ...[...code].sort(),
    ...dir('art'), ...dir('assets/icons/clay'), ...dir('assets/models'), ...dir('assets/sounds', f => !f.endsWith('.md')),
    ...['apple-touch-icon.png', 'favicon-32.png', 'icon-192.png', 'icon-512.png'].map(f => 'assets/icons/' + f), 'assets/title/pocket-kitten-logo.webp'],
  phone: ['assets/mochi-longhair-phone.glb'],
  web: ['assets/mochi-longhair-web.glb'],
  film: ['assets/title/mochi-opening-v4.mp4'],
};
for (const f of Object.values(list).flat()) if (!fs.existsSync(path.join(DIST, f))) { console.error('offline list: missing ' + f); process.exit(1); }
const text = JSON.stringify(list, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== text) { console.error('FAIL: dist/offline-files.json is out of date. Run: node tools/offline-list.mjs'); process.exit(1); }
  console.log(`PASS: offline file list is up to date (${list.app.length} files, plus her model and the film).`);
} else { fs.writeFileSync(OUT, text); console.log('wrote', OUT, list.app.length); }
