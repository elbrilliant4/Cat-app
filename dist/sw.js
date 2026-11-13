// The offline copy (phase 18). Keeps one whole build of the app on the phone
// and serves it from there, so a second open needs no signal.
//
// How a build gets here, and how the next one replaces it:
//   - The page (the script at the foot of index.html) reads version.json from
//     the network at every launch and tells this worker the build it found.
//   - "stage": every file in offline-files.json is fetched fresh into a cache
//     of its own, named after the build. Nothing is served from it yet.
//   - "launch": a fully staged build becomes the one served, and the page
//     loads itself again at once. Only ever at a launch, so a running app
//     never gets a mix of two builds.
// The state lives in the caches, not in this script: the worker can be
// stopped, restarted or replaced by a newer sw.js at any moment.
// version.json is never served from here. `?sw=off` on the page, or
// `"sw": false` in version.json, removes the worker and its caches.
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = `pk:${SCOPE}:`;            // (live and preview share an origin)
const META = PREFIX + 'meta', META_URL = SCOPE + '__offline-state';
const cacheOf = build => PREFIX + 'build:' + build;

let state = null;                          // {current, staged} (build names)
async function readState() {
  if (state) return state;
  const r = await (await caches.open(META)).match(META_URL);
  return state = r ? await r.json() : {current: null, staged: null};
}
async function writeState(s) {
  state = s;
  await (await caches.open(META)).put(META_URL, new Response(JSON.stringify(s), {headers: {'content-type': 'application/json'}}));
}
// Caches of builds that are neither served nor being staged.
async function tidy() {
  const s = await readState(), keep = new Set([META, s.current && cacheOf(s.current), s.staged && cacheOf(s.staged), staging && cacheOf(staging.build)]);
  for (const k of await caches.keys()) if (k.startsWith(PREFIX) && !keep.has(k)) await caches.delete(k);
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Fetch a whole build into its own cache. All or nothing.
let staging = null;                        // {build, done: Promise<boolean>}
function stage(build, kinds) {
  if (staging && staging.build === build) return staging.done;
  const done = (async () => {
    const s = await readState();
    if (s.current === build || s.staged === build) return true;
    const name = cacheOf(build);
    try {
      const list = await (await fetch(SCOPE + 'offline-files.json', {cache: 'no-store'})).json();
      const files = [...list.app, ...kinds.flatMap(k => list[k] || [])];
      await caches.delete(name);
      const cache = await caches.open(name);
      // (Six at a time. `no-cache` asks the server whether the phone's own
      // copy is still right, so a file already here is not sent twice.)
      let i = 0;
      const next = async () => {
        while (i < files.length) {
          const f = files[i++], r = await fetch(SCOPE + f, {cache: 'no-cache'});
          if (!r.ok || r.status !== 200) throw new Error(f + ' ' + r.status);
          await cache.put(SCOPE + f, r);
        }
      };
      await Promise.all(Array.from({length: 6}, next));
      // (A build published while this one was coming in: the files may be a mix.)
      const v = await (await fetch(SCOPE + 'version.json', {cache: 'no-store'})).json();
      if (`${v.build}:${v.commit}` !== build) throw new Error('build changed');
      await writeState({...(await readState()), staged: build});
      return true;
    } catch (err) {
      await caches.delete(name);
      return false;
    } finally { staging = null; }
  })();
  staging = {build, done};
  return done;
}
// A staged build becomes the one served.
async function launch() {
  const s = await readState();
  if (!s.staged) return {current: s.current, flipped: false};
  await writeState({current: s.staged, staged: null});
  await tidy();
  return {current: s.staged, flipped: true};
}

self.addEventListener('message', e => {
  const m = e.data || {}, reply = x => e.ports[0] && e.ports[0].postMessage(x);
  if (m.cmd === 'launch') e.waitUntil(launch().then(reply));
  else if (m.cmd === 'state') e.waitUntil(readState().then(reply));
  else if (m.cmd === 'stage') e.waitUntil(stage(m.build, m.kinds || []).then(ok => reply({ok})));
});

// A piece of a kept file (films are asked for in pieces).
async function slice(res, range) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(range), buf = await res.arrayBuffer(), size = buf.byteLength;
  if (!m || (m[1] === '' && m[2] === '')) return new Response(buf, {status: 200, headers: res.headers});
  let from = m[1] === '' ? size - +m[2] : +m[1], to = m[1] === '' || m[2] === '' ? size - 1 : Math.min(+m[2], size - 1);
  from = Math.max(0, from);
  if (from > to || from >= size) return new Response(null, {status: 416, headers: {'content-range': `bytes */${size}`}});
  const headers = new Headers(res.headers);
  headers.set('content-range', `bytes ${from}-${to}/${size}`);
  headers.set('content-length', String(to - from + 1));
  headers.set('accept-ranges', 'bytes');
  return new Response(buf.slice(from, to + 1), {status: 206, headers});
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(SCOPE)) return;
  let path = url.pathname.slice(SCOPE.length);
  if (path === '' && req.mode === 'navigate') path = 'index.html';
  // Never from the copy: the build number, this script, the file list, and
  // anything of another app under this address (the review pack; on the
  // live site, the preview).
  if (/^(version\.json|sw\.js|offline-files\.json)$/.test(path) || /^(review|preview)\//.test(path)) return;
  e.respondWith((async () => {
    try {
      const s = await readState();
      if (s.current) {
        const hit = await (await caches.open(cacheOf(s.current))).match(SCOPE + path);
        if (hit) return req.headers.has('range') ? slice(hit, req.headers.get('range')) : hit;
      }
    } catch {}
    return fetch(req);
  })());
});
