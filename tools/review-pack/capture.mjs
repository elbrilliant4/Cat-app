// Builds a review pack for one build of the site:
//   node tools/review-pack/capture.mjs <site dir> <output dir>
// Serves the site locally, renders it in headless Chromium and writes:
//   face-front/left/right/three.png   close-ups
//   eyes-open/half/closed.png         eyelids
//   idle.mp4, walk.mp4                short clips (needs ffmpeg)
//   halloween-*.png, halloween-bat-play.mp4   the Halloween decor
//   room-day.png, room-night.png      the room on a phone, day and evening
//   room-desktop.png                  the room on a wide screen
//   meow-*.wav, purr-*.wav            isolated sounds (and each recorded clip)
//   index.html                        the review page, labelled with the build
// Set PLAYWRIGHT_MODULE to use a Playwright install outside node_modules.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {readWav, analyse, loopThrice} from './audio-qa.mjs';

const [site, out] = process.argv.slice(2).map(p => path.resolve(p));
if (!site || !out) { console.error('usage: capture.mjs <site dir> <output dir>'); process.exit(1); }
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
fs.mkdirSync(out, {recursive: true});
const version = (() => { try { return JSON.parse(fs.readFileSync(path.join(site, 'version.json'), 'utf8')); } catch { return {build: 'local', commit: 'uncommitted', channel: 'local'}; } })();
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// Static server for the site.
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4'};
const server = http.createServer((req, res) => {
  const file = path.join(site, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
  if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

// The page is rewritten after every item, so if rendering is cut short (the
// workflow gives it a time budget) whatever is done still gets published.
const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL || undefined, timeout: 120000, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']});
const made = [];
const errors = [];
let finished = false;
async function page(url, viewport) {
  const p = await browser.newPage({viewport, deviceScaleFactor: 1});
  p.setDefaultTimeout(600000);
  p.on('pageerror', e => errors.push(`${url}: ${e.message}`));
  await p.goto(base + url);
  return p;
}
const ready = p => p.waitForFunction(() => document.title === 'ready', null, {timeout: 600000});

async function clip(p, name, fn, seconds, fps = 15) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), name));
  for (let i = 0; i < seconds * fps; i++) {
    await p.evaluate(([f, s]) => window[f](s), [fn, i / fps]);
    await p.screenshot({path: path.join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 90});
  }
  try {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(fps), '-i', path.join(dir, '%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', path.join(out, name + '.mp4')]);
    made.push(name + '.mp4');
  } catch (e) { errors.push(`${name}.mp4: ffmpeg failed (${e.message.split('\n')[0]})`); }
  fs.rmSync(dir, {recursive: true, force: true});
}

// The review page.
const has = f => made.includes(f);
const missing = cap => `<figure class="missing"><div class="gap">${finished ? 'Not captured in this run' : 'Not captured: rendering ran out of time (or is still going)'}</div><figcaption>${cap}</figcaption></figure>`;
const img = (f, cap) => has(f) ? `<figure><a href="${f}"><img src="${f}" alt="${cap}" loading="lazy"></a><figcaption>${cap}</figcaption></figure>` : missing(cap);
const vid = (f, cap) => has(f) ? `<figure><video src="${f}" controls loop muted playsinline preload="metadata"></video><figcaption>${cap} · <a href="${f}">download</a></figcaption></figure>` : missing(cap);
const aud = (f, cap) => has(f) ? `<figure class="audio"><figcaption>${cap}</figcaption><audio src="${f}" controls preload="none"></audio><a href="${f}">download</a></figure>` : `<figure class="audio"><figcaption>${cap}</figcaption><p class="none">Not available in this build.</p></figure>`;
function writePage() {
  const when = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Mochi review · build ${version.build}</title>
<style>
:root { --bg: #f7f1ea; --ink: #2b211b; --muted: #7a6a5e; --card: #fffaf4; --line: #e6d9cb; --accent: #f07b4f; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #1d1713; --ink: #f3e8dd; --muted: #b39f8f; --card: #2a211b; --line: #3d3128; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, -apple-system, Segoe UI, sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { font-size: 26px; margin: 0 0 4px; } h2 { font-size: 18px; margin: 32px 0 12px; }
.meta { color: var(--muted); margin: 0; } .meta b { color: var(--ink); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.wide { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
figure { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
figure img, figure video { display: block; width: 100%; height: auto; background: #000; }
figcaption { padding: 8px 12px; font-size: 13px; font-weight: 650; color: var(--muted); }
figure.audio { padding: 4px 12px 12px; } figure.audio audio { width: 100%; } figure.audio a { font-size: 12px; color: var(--muted); }
.none { margin: 4px 0 0; font-size: 13px; color: var(--muted); }
.gap { aspect-ratio: 16 / 10; display: grid; place-items: center; padding: 16px; text-align: center; font-size: 13px; font-weight: 650; color: var(--accent); background: repeating-linear-gradient(135deg, transparent 0 10px, color-mix(in srgb, var(--line) 60%, transparent) 10px 20px); }
.notice { margin: 10px 0 0; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--accent); color: var(--ink); background: color-mix(in srgb, var(--accent) 10%, var(--card)); }
a { color: var(--accent); }
ul { padding-left: 18px; }
table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; display: block; overflow-x: auto; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--line); white-space: nowrap; }
th { color: var(--muted); font-weight: 650; }
</style></head><body><main>
<h1>Mochi review pack</h1>
<p class="meta"><b>Captures: build ${version.build}</b> · commit ${version.commit} · rendered ${when}</p>
<p class="meta" id="app-build" hidden></p>
<p class="notice" id="stale" hidden></p>
${finished ? '' : '<p class="notice"><b>This pack is incomplete:</b> rendering ran out of time or is still going. Missing items are marked below.</p>'}
<p class="meta">Every image and clip below was rendered from the capture build, which also shows in the app's top bar inside each picture. <a href="../">Open the preview app</a></p>
<h2>Face</h2>
<div class="grid">${img('face-front.png', 'Front')}${img('face-three.png', 'Three-quarter')}${img('face-left.png', 'Left side')}${img('face-right.png', 'Right side')}</div>
<h2>Eyes</h2>
<div class="grid">${img('eyes-open.png', 'Open')}${img('eyes-half.png', 'Half-closed')}${img('eyes-closed.png', 'Closed')}</div>
<h2>Motion</h2>
<div class="grid wide">${vid('idle.mp4', 'Idle, 5 s')}${vid('walk.mp4', 'Walking, 5 s')}</div>
<h2>Halloween in the Hamptons (preview decor)</h2>
<p class="meta">All from capture build ${version.build}. The evening is what the room looks like after Rest. The play clip is a time-lapse (one frame every 1.5 s of her playing on her own), because this test renderer is slow.</p>
<div class="grid">${img('halloween-day.png', 'Halloween, day')}${img('halloween-evening.png', 'Halloween, evening')}${img('halloween-pumpkins-day.png', 'Jack-o’-lanterns, day')}${img('halloween-pumpkins-evening.png', 'Jack-o’-lanterns, evening')}</div>
<div class="grid wide">${vid('halloween-bat-play.mp4', 'Playing with the felt bat (time-lapse)')}</div>
<h2>Room</h2>
<div class="grid">${img('room-day.png', 'Phone, day')}${img('room-night.png', 'Phone, evening')}${img('room-desktop.png', 'Wide screen, day')}</div>
<h2>Sound</h2>
<p class="meta">There's no background ambience any more; the fountain is silent. These samples are brought to the same peak level so they're easy to compare; the clips below are at their real levels.</p>
<div class="grid">${aud('meow-v1.wav', "Mochi's meow: the first version's meow")}${aud('purr.wav', "Mochi's purr: the recorded sleepy purr")}${aud('together.wav', 'Meow and purr together, at the levels the app plays them')}${aud('meow-v2.wav', 'For comparison: version 2 meow (mew, meow, chirp, sleepy)')}${aud('purr-synth.wav', 'For comparison: the old synthesized purr')}</div>
${clipRows.length ? `<h2>Recorded clips, one by one</h2>
<p class="meta">Exactly as the app plays them (before Mochi's volume and the small random pitch and level variation). Clips marked candidate play in the preview only.</p>
<div class="grid">${clipRows.map(c => `<figure class="audio"><figcaption>${c.file} · ${c.kind}${c.status === 'candidate' ? ' · candidate' : c.status === 'reference' ? ' · original, for comparison' : ''}${c.note ? `<br><span style="font-weight:500">${c.note}</span>` : ''}</figcaption><audio src="${c.name}" controls preload="none"></audio><a href="${c.name}">download</a>${c.looped ? `<figcaption>Loop seam check (three times through)</figcaption><audio src="${c.looped}" controls preload="none"></audio>` : ''}</figure>`).join('')}</div>
<table><thead><tr><th>Clip</th><th>Length</th><th>Peak</th><th>Clipped samples</th><th>Quietest 10% (background)</th><th>Loudest</th><th>Clicks found</th><th>Loop seam</th></tr></thead><tbody>
${clipRows.map(c => { const q = c.qa; return `<tr><td>${c.file}</td><td>${q.seconds} s</td><td>${q.peakDb} dBFS</td><td>${q.clippedSamples}</td><td>${c.kind === 'purr' ? 'n/a (continuous)' : q.noiseFloorDb + ' dBFS'}</td><td>${q.loudestDb} dBFS</td><td>${q.clicks.length ? q.clicks.join(', ') + ' s' : 'none'}</td><td>${q.loopSeam ? `step ${q.loopSeam.stepVsTypical}× a normal step, ${q.loopSeam.loudnessChangeDb} dB across it` : '—'}</td></tr>`; }).join('')}
</tbody></table>
<p class="meta">Clicks: sudden spikes far above their surroundings. Loop seam: the jump from the last sample back to the first, compared with an ordinary sample-to-sample step (about 1–3× is seamless), and the loudness either side of it.</p>` : ''}
${credits.length ? `<h2>Sound credits</h2><ul>${credits.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
${errors.length ? `<h2>Capture notes</h2><ul>${errors.map(e => `<li>${e.replace(/</g, '&lt;')}</li>`).join('')}</ul>` : ''}
</main>
<script>
// The preview app can be newer than these captures (a fresh pack renders for
// about 35 minutes after each release); say so plainly when it is.
fetch('../version.json', {cache: 'no-store'}).then(r => r.ok ? r.json() : null).then(app => {
  if (!app) return;
  const el = document.getElementById('app-build');
  el.innerHTML = '<b>Preview app: build ' + app.build + '</b> · commit ' + app.commit;
  el.hidden = false;
  if (String(app.build) !== ${JSON.stringify(String(version.build))}) {
    const n = document.getElementById('stale');
    n.innerHTML = '<b>These captures are from build ${version.build}; the preview app is build ' + app.build + '.</b> A new pack for build ' + app.build + ' is usually published within about 40 minutes of a release.';
    n.hidden = false;
  }
}).catch(() => {});
</script>
</body></html>
`);
}

// Each recorded clip on its own, exactly as the app plays it, with its
// measurements; loops also get a three-times-through copy to hear the seam.
const soundList = (() => { try { return JSON.parse(fs.readFileSync(path.join(site, 'assets/sounds/sounds.json'), 'utf8')).clips || []; } catch { return []; } })();
const clipRows = [];
for (const c of soundList) {
  try {
    const bytes = fs.readFileSync(path.join(site, 'assets/sounds', c.file)), wav = readWav(bytes), loop = c.kind === 'purr';
    const name = 'sound-' + c.file;
    fs.writeFileSync(path.join(out, name), bytes); made.push(name);
    let looped = null;
    if (loop) { looped = name.replace(/\.wav$/, '-x3.wav'); fs.writeFileSync(path.join(out, looped), loopThrice(bytes, wav)); made.push(looped); }
    clipRows.push({...c, name, looped, qa: analyse(wav, {loop})});
  } catch (e) { errors.push(`${c.file}: ${e.message}`); }
}
log('clips', clipRows.length);
const credits = (() => { try { return JSON.parse(fs.readFileSync(path.join(site, 'assets/sounds/sounds.json'), 'utf8')).credits || []; } catch { return []; } })();
writePage();

// Close-ups, eyes, sounds and walk from the review stage (one page load).
log('stage');
const stage = await page('review-stage.html', {width: 720, height: 720});
await ready(stage);
for (const [file, expr, view] of [['face-front', 'content', 'front'], ['face-three', 'content', 'three'], ['face-left', 'content', 'left'], ['face-right', 'content', 'right'], ['eyes-open', 'open', 'front'], ['eyes-half', 'half', 'front'], ['eyes-closed', 'closed', 'front']]) {
  await stage.evaluate(([e, v]) => window.shot(e, v), [expr, view]);
  await stage.screenshot({path: path.join(out, file + '.png')});
  made.push(file + '.png');
  log(file);
}
for (const [kind, seconds] of [['meow-v1', 6], ['together', 7], ['meow-v2', 8], ['purr', 6], ['purr-synth', 6]]) {
  const b64 = await stage.evaluate(([k, s]) => window.renderAudio(k, s), [kind, seconds]);
  if (b64) { fs.writeFileSync(path.join(out, kind + '.wav'), Buffer.from(b64, 'base64')); made.push(kind + '.wav'); }
  log(kind, b64 ? 'ok' : 'none');
}
writePage();

// The room, as people see it.
async function roomShot(viewport, file, night = false) {
  const p = await page('index.html?debug', viewport);
  await p.waitForFunction(() => document.querySelector('.scene.ready'), null, {timeout: 600000});
  await p.evaluate(night => {
    kitten.brain.nextIdle = 1e9;
    kitten.CAMERA_VIEWS.room();
    if (night) kitten.pet.sleeping = true;
  }, night);
  await p.waitForTimeout(night ? 9000 : 5000);
  await p.evaluate(() => document.querySelector('#speech').classList.remove('show'));
  await p.screenshot({path: path.join(out, file)});
  made.push(file);
  log(file);
  await p.close();
  writePage();
}
await roomShot({width: 390, height: 844}, 'room-day.png');
await roomShot({width: 390, height: 844}, 'room-night.png', true);
await roomShot({width: 1280, height: 800}, 'room-desktop.png');

// Halloween decor, for review: the room by day and in the evening, and both
// jack-o'-lanterns close up (day and evening). The felt-bat clip comes last.
{
  log('halloween');
  const p = await page('index.html?debug', {width: 1280, height: 800});
  await p.waitForFunction(() => document.querySelector('.scene.ready'), null, {timeout: 600000});
  await p.evaluate(async () => {
    const k = kitten, m = await import('./decor.js');
    k.brain.nextIdle = 1e9; k.brain.nextShow = 1e9; k.brain.nextBird = 1e9;
    m.applyDecor(k.room, 'halloween');
    k.CAMERA_VIEWS.room();
  });
  const shot = async (file, wait) => { await p.waitForTimeout(wait); await p.evaluate(() => document.querySelector('#speech').classList.remove('show')); await p.screenshot({path: path.join(out, file)}); made.push(file); log(file); writePage(); };
  // Close-ups of the pumpkins: hide the controls and aim at the sill's left.
  const pumpkins = on => p.evaluate(on => {
    const k = kitten, w = k.room.windowGroup, v = k.view;
    document.querySelectorAll('.hud, .dock, .scene-hint').forEach(e => e.style.visibility = on ? 'hidden' : '');
    if (!on) { k.CAMERA_VIEWS.room(); return; }
    Object.assign(v.goal, {yaw: .35, pitch: .12, dist: 2.1});
    v.goal.focus.copy(w.localToWorld(w.position.clone().set(-.95, k.room.sillTop + .16, .5)));
  }, on);
  await shot('halloween-day.png', 9000);
  await pumpkins(true); await shot('halloween-pumpkins-day.png', 7000);
  await p.evaluate(() => { kitten.pet.sleeping = true; });
  await shot('halloween-pumpkins-evening.png', 11000);
  await pumpkins(false); await shot('halloween-evening.png', 8000);
  await p.close();
}

// The clips take longest, so they come after the stills.
await stage.setViewportSize({width: 960, height: 540});
await stage.waitForTimeout(500);
await stage.evaluate(() => window.walkAt(0));
await clip(stage, 'walk', 'walkAt', 5);
log('walk');
await stage.close();
writePage();

const idle = await page('idle.html?record', {width: 720, height: 720});
await ready(idle);
await clip(idle, 'idle', 'renderAt', 5, 12);
log('idle');
await idle.close();
writePage();

// Felt bat play, last because it is the slowest: a time-lapse of her playing
// on her own with the Halloween felt bat, on a smaller page so each frame
// renders faster.
{
  const p = await page('index.html?debug', {width: 800, height: 500});
  await p.waitForFunction(() => document.querySelector('.scene.ready'), null, {timeout: 600000});
  await p.evaluate(async () => {
    const k = kitten, m = await import('./decor.js');
    k.brain.nextIdle = 1e9; k.brain.nextShow = 1e9; k.brain.nextBird = 1e9;
    m.applyDecor(k.room, 'halloween');
    k.pet.sleeping = false; k.pet.energy = 90;
    k.brain.pos.set(-.9, 0, .5); k.setActivity('sit');
    k.toyTarget.set(-.2, .13, .7);
    const v = k.view; Object.assign(v.goal, {yaw: .25, pitch: .42, dist: 4.1}); v.goal.focus.set(-.5, .3, .55);
    document.querySelectorAll('.hud, .dock, .scene-hint').forEach(e => e.style.visibility = 'hidden');
  });
  await p.waitForTimeout(8000);
  await p.evaluate(() => { kitten.startSolo(); kitten.brain.modeUntil = performance.now() / 1000 + 1e4; });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bat'));
  for (let i = 0; i < 24; i++) {
    await p.waitForTimeout(1500);
    await p.screenshot({path: path.join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 88});
  }
  try {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '5', '-i', path.join(dir, '%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', path.join(out, 'halloween-bat-play.mp4')]);
    made.push('halloween-bat-play.mp4');
  } catch (e) { errors.push(`halloween-bat-play.mp4: ffmpeg failed (${e.message.split('\n')[0]})`); }
  fs.rmSync(dir, {recursive: true, force: true});
  log('halloween-bat-play');
  await p.close();
}

await browser.close();
server.close();
finished = true;
writePage();
log('done', made.length, 'files', errors.length ? `${errors.length} notes` : '');
if (errors.length) console.log(errors.join('\n'));
