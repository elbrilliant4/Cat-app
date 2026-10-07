// Mochi's room: a cozy, classic study built in 3D from simple shapes and
// textures drawn in code (no photos are used). Warm oak floor, panelled
// wainscoting, a tall window with linen curtains, an olive-and-navy plaid
// rug, a tufted leather club chair with a plaid throw, side table and brass
// lamp, botanical print, bookcase, plaid cat bed with a plush lining, an
// ivory food bowl and an olive ceramic water fountain.
//
// Scale: about 2.4 scene units per metre, matching Mochi.
import * as THREE from 'three';

const {damp} = THREE.MathUtils;
const V2 = (x, y) => new THREE.Vector2(x, y);

function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

let maxAniso = 4;
const _n = new THREE.Vector3(), _d = new THREE.Vector3();
function canvasTexture(w, h, draw, {repeat = [1, 1], color = true} = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = maxAniso;
  return t;
}

// ---------------------------------------------------------------------------
// Textures
// ---------------------------------------------------------------------------
function drawWood(g, w, h, {planks = 8, colors, seed = 1, grain = 46}) {
  const r = rng(seed), ph = h / planks;
  for (let i = 0; i < planks; i++) {
    let x = -r() * 400;
    while (x < w) {
      const len = 380 + r() * 520;
      const c = colors[Math.floor(r() * colors.length)];
      g.fillStyle = c;
      g.fillRect(x, i * ph, len, ph);
      g.save();
      g.beginPath(); g.rect(x, i * ph, len, ph); g.clip();
      // Soft colour drift along the board.
      const drift = g.createLinearGradient(x, 0, x + len, 0);
      drift.addColorStop(0, `rgba(255,220,170,${r() * .08})`);
      drift.addColorStop(.5, `rgba(60,25,5,${r() * .1})`);
      drift.addColorStop(1, `rgba(255,220,170,${r() * .08})`);
      g.fillStyle = drift; g.fillRect(x, i * ph, len, ph);
      for (let k = 0; k < grain; k++) {
        const y0 = i * ph + r() * ph, amp = 1 + r() * 4, f = .004 + r() * .01, ph0 = r() * 6;
        g.strokeStyle = r() < .75 ? `rgba(55,25,8,${.05 + r() * .12})` : `rgba(255,215,160,${.04 + r() * .06})`;
        g.lineWidth = .6 + r() * 2.2;
        g.beginPath();
        for (let xx = x; xx <= x + len; xx += 12) g.lineTo(xx, y0 + Math.sin(xx * f + ph0) * amp);
        g.stroke();
      }
      if (r() < .45) {
        const kx = x + r() * len, ky = i * ph + ph * (.3 + r() * .4), kr = 6 + r() * 10;
        const kg = g.createRadialGradient(kx, ky, 1, kx, ky, kr * 2.2);
        kg.addColorStop(0, 'rgba(40,18,5,.75)'); kg.addColorStop(.4, 'rgba(70,32,10,.35)'); kg.addColorStop(1, 'rgba(70,32,10,0)');
        g.fillStyle = kg;
        g.beginPath(); g.ellipse(kx, ky, kr * 2.2, kr, 0, 0, Math.PI * 2); g.fill();
      }
      g.restore();
      g.fillStyle = 'rgba(30,14,4,.55)';
      g.fillRect(x, i * ph, 2, ph);
      x += len;
    }
    g.fillStyle = 'rgba(30,14,4,.6)';
    g.fillRect(0, i * ph, w, 2);
  }
}

function drawPlaid(g, w, h, {base, stripes, seed = 3}) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (const dir of [0, 1]) {
    g.globalAlpha = .62;
    let p = 0;
    for (const [c, s] of stripes) {
      g.fillStyle = c;
      if (dir) g.fillRect(p, 0, s, h); else g.fillRect(0, p, w, s);
      p += s;
    }
  }
  g.globalAlpha = 1;
  // Twill weave and wool fuzz.
  const r = rng(seed);
  g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1;
  for (let d = -h; d < w; d += 3) { g.beginPath(); g.moveTo(d, 0); g.lineTo(d + h, h); g.stroke(); }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < .5 ? 'rgba(255,245,220,.06)' : 'rgba(0,0,0,.07)';
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1);
  }
}

function drawNoise(g, w, h, {base, blobs, seed = 5}) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (const [color, count, min, max] of blobs) {
    g.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const s = min + r() * (max - min);
      g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (.5 + r() * .8), r() * 3, 0, Math.PI * 2); g.fill();
    }
  }
}

function drawLeather(g, w, h) {
  drawNoise(g, w, h, {base: '#4f2a17', blobs: [['rgba(130,78,42,.09)', 900, 8, 40], ['rgba(50,20,6,.08)', 900, 6, 34], ['rgba(190,120,60,.05)', 400, 20, 70]], seed: 9});
  const r = rng(11);
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = r() < .7 ? 'rgba(40,15,4,.18)' : 'rgba(220,160,100,.1)';
    g.lineWidth = .5 + r() * 1.2;
    let x = r() * w, y = r() * h;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (r() - .5) * 26; y += (r() - .5) * 26; g.lineTo(x, y); }
    g.stroke();
  }
}

function drawLinen(g, w, h, {base, seed = 7, dark = .07}) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(0,0,0,${r() * dark})`; g.fillRect(0, y, w, 1); }
  for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(255,255,255,${r() * dark})`; g.fillRect(x, 0, 1, h); }
  for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(80,60,30,.08)'; g.fillRect(r() * w, r() * h, 10 + r() * 40, 1.5); }
}

function drawSherpa(g, w, h) {
  drawNoise(g, w, h, {base: '#d6c7aa', blobs: [['rgba(120,100,70,.35)', 5000, 2, 4.5], ['rgba(248,240,225,.6)', 6000, 1.5, 4]], seed: 13});
}

function drawBotanical(g, w, h) {
  const r = rng(21);
  g.fillStyle = '#efe5cf'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(150,110,60,${r() * .05})`; g.beginPath(); g.arc(r() * w, r() * h, 4 + r() * 30, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(120,95,60,.5)'; g.lineWidth = 2; g.strokeRect(28, 28, w - 56, h - 56);
  const cx = w / 2;
  g.strokeStyle = '#5c6a39'; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx, h - 90); g.bezierCurveTo(cx - 10, h * .6, cx + 12, h * .4, cx, h * .26); g.stroke();
  const leaf = (x, y, a, s) => {
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = '#6f7d44'; g.beginPath(); g.ellipse(s * .55, 0, s * .6, s * .24, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(40,50,20,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 1.1, 0); g.stroke();
    for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(s * k * .18, 0); g.lineTo(s * k * .18 + s * .12, -s * .16); g.moveTo(s * k * .18, 0); g.lineTo(s * k * .18 + s * .12, s * .16); g.stroke(); }
    g.restore();
  };
  for (let i = 0; i < 6; i++) { const y = h - 140 - i * 52; leaf(cx, y, -.5 - r() * .4, 70 + r() * 30); leaf(cx, y - 20, Math.PI + .5 + r() * .4, 70 + r() * 30); }
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 62;
    const x = cx + Math.cos(a) * d, y = h * .2 + Math.sin(a) * d * .7;
    g.fillStyle = '#f3ecd8'; g.beginPath(); g.arc(x, y, 7 + r() * 4, 0, 7); g.fill();
    g.strokeStyle = 'rgba(110,90,55,.6)'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#9a7a45'; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill();
  }
  g.fillStyle = 'rgba(80,60,35,.55)'; g.fillRect(cx - 70, h - 60, 140, 4); g.fillRect(cx - 40, h - 48, 80, 3);
}

function drawSky(g, w, h, night) {
  const r = rng(night ? 31 : 29);
  const sky = g.createLinearGradient(0, 0, 0, h);
  if (night) { sky.addColorStop(0, '#0d1730'); sky.addColorStop(.6, '#1d2c52'); sky.addColorStop(1, '#2a3960'); }
  else { sky.addColorStop(0, '#dfe9ee'); sky.addColorStop(.55, '#f6ecd2'); sky.addColorStop(1, '#f2dcae'); }
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  if (!night) {
    const sun = g.createRadialGradient(w * .2, h * .25, 4, w * .2, h * .25, w * .9);
    sun.addColorStop(0, 'rgba(255,248,220,.95)'); sun.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = sun; g.fillRect(0, 0, w, h);
  }
  const greens = night ? ['#0a1220', '#0f1a2b', '#132036'] : ['#7d9658', '#a5b777', '#5f7b45', '#c3c98e'];
  g.filter = 'blur(6px)';
  for (let i = 0; i < 70; i++) {
    g.fillStyle = greens[Math.floor(r() * greens.length)];
    g.globalAlpha = night ? .9 : .55 + r() * .4;
    g.beginPath(); g.arc(r() * w, h * (.35 + r() * .65), 14 + r() * 40, 0, 7); g.fill();
  }
  g.filter = 'none'; g.globalAlpha = 1;
  if (night) for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(255,200,120,.8)'; g.beginPath(); g.arc(r() * w, h * (.6 + r() * .3), 1.5 + r() * 2, 0, 7); g.fill(); }
}

function drawLeaf(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.translate(w / 2, h * .92);
  const pts = [[0, 0], [-.18, -.12], [-.46, -.3], [-.3, -.42], [-.36, -.62], [-.12, -.6], [0, -.95], [.12, -.6], [.36, -.62], [.3, -.42], [.46, -.3], [.18, -.12]];
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo : g.moveTo).call(g, x * w, y * h));
  g.closePath();
  const grd = g.createLinearGradient(0, -h * .9, 0, 0);
  grd.addColorStop(0, '#5f7d3a'); grd.addColorStop(1, '#2f4a22');
  g.fillStyle = grd; g.fill();
  g.strokeStyle = 'rgba(210,225,170,.55)'; g.lineWidth = 2;
  for (const [x, y] of [[0, -.9], [-.38, -.55], [.38, -.55], [-.4, -.3], [.4, -.3]]) { g.beginPath(); g.moveTo(0, 0); g.lineTo(x * w * .85, y * h * .85); g.stroke(); }
}

function drawJute(g, w, h) {
  g.fillStyle = '#b89565'; g.fillRect(0, 0, w, h);
  const r = rng(41);
  for (let rad = 4; rad < w / 2; rad += 9) {
    for (let a = 0; a < Math.PI * 2; a += .09) {
      g.fillStyle = r() < .5 ? 'rgba(90,60,25,.35)' : 'rgba(235,205,150,.35)';
      g.save(); g.translate(w / 2 + Math.cos(a) * rad, h / 2 + Math.sin(a) * rad); g.rotate(a + .8);
      g.fillRect(-4, -2, 8, 4); g.restore();
    }
  }
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------
function roundedBox(w, h, d, r, seg = 3, corner = .2) {
  const s = new THREE.Shape(), x = -(w / 2 - r), y = -(h / 2 - r), W = w - 2 * r, H = h - 2 * r, c = Math.min(W, H) * corner;
  s.moveTo(x + c, y); s.lineTo(x + W - c, y); s.quadraticCurveTo(x + W, y, x + W, y + c);
  s.lineTo(x + W, y + H - c); s.quadraticCurveTo(x + W, y + H, x + W - c, y + H);
  s.lineTo(x + c, y + H); s.quadraticCurveTo(x, y + H, x, y + H - c);
  s.lineTo(x, y + c); s.quadraticCurveTo(x, y, x + c, y);
  const g = new THREE.ExtrudeGeometry(s, {depth: Math.max(.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: seg, curveSegments: 6});
  g.center();
  g.computeVertexNormals();
  return g;
}
const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([x, y]) => V2(x, y)), seg);
function turnedLeg(height, radius = .07) {
  const p = [[0, 0], [.75, 0], [1, .05], [.9, .12], [.55, .18], [.6, .3], [.8, .38], [.55, .48], [.5, .7], [.62, .8], [.62, 1], [0, 1]];
  return lathe(p.map(([x, y]) => [x * radius, y * height]), 20);
}

export class Room {
  constructor(scene, renderer, {mobile = false} = {}) {
    if (renderer) maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.mobile = mobile;
    this.clickables = [];
    this.build();
    if (renderer) this.buildEnvironment(renderer);
  }

  mesh(geo, material, parent = this.group, {cast = true, receive = true} = {}) {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = cast; m.receiveShadow = receive;
    parent.add(m);
    return m;
  }

  build() {
    const M = this.materials = {
      floor: new THREE.MeshStandardMaterial({map: canvasTexture(1024, 1024, (g, w, h) => drawWood(g, w, h, {colors: ['#8e5a30', '#9a6436', '#85512b', '#a36b3b', '#7c4a26', '#94602f'], seed: 2}), {repeat: [5, 5]}), roughness: .48}),
      panel: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, (g, w, h) => { g.translate(w, 0); g.rotate(Math.PI / 2); drawWood(g, w, h, {planks: 4, colors: ['#6e4024', '#774628', '#68391f', '#7d4b2a'], seed: 4, grain: 34}); }, {repeat: [1, 1]}), roughness: .55}),
      darkWood: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, (g, w, h) => drawWood(g, w, h, {planks: 4, colors: ['#4f2c17', '#583219', '#4a2914'], seed: 6, grain: 30})), roughness: .5}),
      plaster: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, (g, w, h) => drawNoise(g, w, h, {base: '#ecdcbf', blobs: [['rgba(255,250,235,.05)', 260, 20, 90], ['rgba(150,110,60,.035)', 220, 20, 80]]}), {repeat: [3, 2]}), roughness: .95}),
      trim: new THREE.MeshStandardMaterial({color: '#6a3e22', roughness: .5}),
      window: new THREE.MeshStandardMaterial({color: '#f3ead8', roughness: .6}),
      rug: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, (g, w, h) => drawPlaid(g, w, h, {base: '#3f472b', stripes: [['#1e2536', 110], ['#3f472b', 34], ['#a8987a', 3], ['#3f472b', 36], ['#28324a', 70], ['#3f472b', 60], ['#a8987a', 3], ['#3f472b', 27], ['#1e2536', 40], ['#4d5436', 40], ['#9c8c6c', 2], ['#4d5436', 87]]}), {repeat: [1, 1]}), roughness: 1, color: '#d8d0c0'}),
      plaidBed: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, (g, w, h) => drawPlaid(g, w, h, {base: '#5a6b38', stripes: [['#1f2a45', 110], ['#5a6b38', 30], ['#e6dcc0', 6], ['#5a6b38', 60], ['#7d4a2a', 3], ['#5a6b38', 50], ['#1f2a45', 60], ['#4b5a30', 60], ['#e6dcc0', 4], ['#4b5a30', 129]], seed: 8}), {repeat: [6, 1]}), roughness: .95}),
      plaidThrow: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, (g, w, h) => drawPlaid(g, w, h, {base: '#3b4a33', stripes: [['#222c40', 120], ['#3b4a33', 40], ['#b9a77c', 5], ['#3b4a33', 80], ['#4f5a3a', 90], ['#b9a77c', 3], ['#222c40', 70], ['#3b4a33', 104]], seed: 10}), {repeat: [1.6, 1.6]}), roughness: 1, side: THREE.DoubleSide}),
      leather: new THREE.MeshPhysicalMaterial({map: canvasTexture(512, 512, drawLeather, {repeat: [1.4, 1.4]}), roughness: .48, clearcoat: .35, clearcoatRoughness: .45}),
      sherpa: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, drawSherpa, {repeat: [3, 3]}), roughness: 1}),
      linen: new THREE.MeshStandardMaterial({map: canvasTexture(256, 256, (g, w, h) => drawLinen(g, w, h, {base: '#e7dcc6'}), {repeat: [2, 6]}), roughness: 1, side: THREE.DoubleSide}),
      pillow: new THREE.MeshStandardMaterial({map: canvasTexture(256, 256, (g, w, h) => drawLinen(g, w, h, {base: '#d9ccb1', dark: .1})), roughness: 1}),
      oliveLinen: new THREE.MeshStandardMaterial({map: canvasTexture(256, 256, (g, w, h) => drawLinen(g, w, h, {base: '#66703f', dark: .12})), roughness: 1}),
      jute: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, drawJute), roughness: 1}),
      brass: new THREE.MeshStandardMaterial({color: '#b58a3c', metalness: .85, roughness: .32}),
      ivory: new THREE.MeshPhysicalMaterial({color: '#efe7d6', roughness: .3, clearcoat: .9, clearcoatRoughness: .12}),
      clay: new THREE.MeshStandardMaterial({color: '#c6a27a', roughness: .95}),
      olive: new THREE.MeshPhysicalMaterial({color: '#5e6b35', roughness: .32, clearcoat: 1, clearcoatRoughness: .1}),
      oliveStripe: new THREE.MeshPhysicalMaterial({color: '#4e5a2a', roughness: .3, clearcoat: .8}),
      white: new THREE.MeshPhysicalMaterial({color: '#f1ece2', roughness: .35, clearcoat: .6}),
      leaf: new THREE.MeshStandardMaterial({map: canvasTexture(128, 128, drawLeaf), alphaTest: .45, side: THREE.DoubleSide, roughness: .7}),
      frame: new THREE.MeshStandardMaterial({color: '#8a6a3a', metalness: .45, roughness: .45}),
      print: new THREE.MeshStandardMaterial({map: canvasTexture(512, 640, drawBotanical), roughness: .9}),
    };
    M.leaf.map.repeat.set(1, 1);

    this.buildShell();
    this.buildWindow();
    this.buildRug();
    this.buildChair();
    this.buildSideTable();
    this.buildPrint();
    this.buildBookcase();
    this.buildBed();
    this.buildBowl();
    this.buildFountain();
    this.buildPlants();
  }

  // Floor, walls, wainscoting.
  buildShell() {
    const M = this.materials;
    const floor = this.mesh(new THREE.PlaneGeometry(40, 40), M.floor, this.group, {cast: false});
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.002;
    floor.material.map.repeat.set(10, 10);

    const W = {back: -3.4, left: -4.6, right: 4.6}, H = 8, WAIN = 1.55;
    this.walls = W;
    const wall = (len, x, z, ry) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z); g.rotation.y = ry;
      this.group.add(g);
      const up = this.mesh(new THREE.PlaneGeometry(len, H - WAIN), M.plaster, g, {cast: false});
      up.position.y = WAIN + (H - WAIN) / 2;
      // Wainscot: a backing board, raised panels, chair rail and skirting.
      const back = this.mesh(new THREE.PlaneGeometry(len, WAIN), M.panel, g, {cast: false});
      back.position.y = WAIN / 2;
      const n = Math.max(1, Math.round(len / 1.5)), pw = len / n;
      for (let i = 0; i < n; i++) {
        const p = this.mesh(roundedBox(pw - .32, WAIN - .58, .06, .02, 2, .03), M.panel, g, {cast: false});
        p.position.set(-len / 2 + pw * (i + .5), WAIN / 2 + .05, .03);
      }
      const rail = this.mesh(new THREE.BoxGeometry(len, .1, .1), M.trim, g, {cast: false});
      rail.position.set(0, WAIN, .05);
      const cap = this.mesh(new THREE.BoxGeometry(len, .04, .14), M.trim, g, {cast: false});
      cap.position.set(0, WAIN + .06, .06);
      const skirt = this.mesh(new THREE.BoxGeometry(len, .22, .08), M.trim, g, {cast: false});
      skirt.position.set(0, .11, .04);
      return g;
    };
    // Kept so a wall the camera swings behind can be hidden (dollhouse style).
    this.wallGroups = [wall(9.2, 0, W.back, 0), wall(12, W.left, 2.6, Math.PI / 2), wall(12, W.right, 2.6, -Math.PI / 2)];
  }

  buildWindow() {
    const M = this.materials, z = this.walls.back;
    const g = new THREE.Group();
    g.position.set(-2.35, 0, z);
    this.group.add(g);
    const W = 2.3, bottom = 1.62, top = 4.5, cy = (bottom + top) / 2, h = top - bottom;
    this.skyDay = canvasTexture(256, 320, (c, w, hh) => drawSky(c, w, hh, false));
    this.skyNight = canvasTexture(256, 320, (c, w, hh) => drawSky(c, w, hh, true));
    this.glass = this.mesh(new THREE.PlaneGeometry(W, h), new THREE.MeshBasicMaterial({map: this.skyDay, toneMapped: false}), g, {cast: false, receive: false});
    this.glass.position.set(0, cy, .01);
    // Frame, sashes and muntins.
    const bar = (w, hh, x, y, d = .1, mat = M.window) => { const b = this.mesh(new THREE.BoxGeometry(w, hh, d), mat, g); b.position.set(x, y, .06); return b; };
    bar(W + .3, .16, 0, top + .08); bar(.16, h + .3, -W / 2 - .08, cy); bar(.16, h + .3, W / 2 + .08, cy);
    bar(W, .07, 0, cy); bar(.06, h, 0, cy);
    for (const y of [bottom + h * .25, top - h * .25]) bar(W, .04, 0, y, .06);
    for (const x of [-W / 4, W / 4]) bar(.04, h, x, cy, .06);
    // Deep sill on top of the wainscot.
    const sill = this.mesh(roundedBox(W + .6, .1, .42, .03), M.trim, g);
    sill.position.set(0, bottom - .03, .2);
    // On the sill: a white pitcher with greenery, and a few books.
    const pitcher = this.mesh(lathe([[0, 0], [.13, 0], [.15, .05], [.16, .2], [.13, .32], [.1, .38], [.12, .42], [0, .42]], 28), M.white, g);
    pitcher.position.set(-.75, bottom + .02, .22);
    const handle = this.mesh(new THREE.TorusGeometry(.08, .018, 8, 20, Math.PI), M.white, g);
    handle.position.set(-.6, bottom + .25, .22); handle.rotation.z = -Math.PI / 2;
    this.sprigs(g, new THREE.Vector3(-.75, bottom + .4, .22), 9, .55);
    const bookColors = ['#3f4b33', '#6b2c22', '#283652', '#8b6b3e'];
    bookColors.forEach((c, i) => {
      const b = this.mesh(new THREE.BoxGeometry(.5 - i * .04, .07, .34), new THREE.MeshStandardMaterial({color: c, roughness: .8}), g);
      b.position.set(.62, bottom + .05 + i * .07, .2); b.rotation.y = (i % 2 - .5) * .15;
    });
    // Linen curtains on a brass rod.
    const rod = this.mesh(new THREE.CylinderGeometry(.03, .03, W + 1.8, 12), M.brass, g);
    rod.rotation.z = Math.PI / 2; rod.position.set(0, top + .45, .22);
    for (const s of [-1, 1]) {
      const fin = this.mesh(new THREE.SphereGeometry(.06, 12, 10), M.brass, g);
      fin.position.set(s * (W / 2 + .9), top + .45, .22);
      const cg = new THREE.PlaneGeometry(.85, top + .4, 28, 1), p = cg.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i);
        const flare = .6 + .4 * (1 - (y + (top + .4) / 2) / (top + .4));
        p.setX(i, x * flare);
        p.setZ(i, Math.sin(x * 22) * .045 + Math.sin(x * 9 + 1) * .03);
      }
      cg.computeVertexNormals();
      const curtain = this.mesh(cg, M.linen, g, {cast: false});
      curtain.position.set(s * (W / 2 + .45), (top + .4) / 2 + .02, .3);
    }
    // Sunlight from the window falls across the floor in pane-shaped patches.
    const beam = canvasTexture(256, 256, (c, w, hh) => {
      c.filter = 'blur(10px)';
      c.fillStyle = 'rgba(255,214,150,1)';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) c.fillRect(20 + i * 56, 20 + j * 56, 46, 46);
    });
    this.sunPatch = this.mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshBasicMaterial({map: beam, transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false}), this.group, {cast: false, receive: false});
    this.sunPatch.rotation.set(-Math.PI / 2, 0, .45);
    this.sunPatch.position.set(-1.05, .006, -1.25);
  }

  buildRug() {
    const M = this.materials;
    const RW = 3.7, RD = 3.0, RX = -.4, RZ = .3;
    const rug = this.mesh(roundedBox(RW, .035, RD, .012, 1, .02), M.rug, this.group, {cast: false});
    rug.position.set(RX, .018, RZ);
    const uv = rug.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4);
    const edge = new THREE.MeshStandardMaterial({color: '#3a3f2a', roughness: 1});
    for (const [w, d, x, z] of [[RW + .06, .06, RX, RZ - RD / 2], [RW + .06, .06, RX, RZ + RD / 2], [.06, RD + .06, RX - RW / 2, RZ], [.06, RD + .06, RX + RW / 2, RZ]]) {
      const b = this.mesh(new THREE.BoxGeometry(w, .04, d), edge, this.group, {cast: false});
      b.position.set(x, .02, z);
    }
  }

  // Tufted leather club chair with rolled arms, nailhead trim and a plaid throw.
  buildChair() {
    const M = this.materials, g = new THREE.Group();
    g.position.set(2.45, 0, -2.0); g.rotation.y = -.55;
    this.group.add(g);
    const legH = .3;
    for (const [x, z] of [[-.85, -.7], [.85, -.7], [-.85, .78], [.85, .78]]) {
      const l = this.mesh(turnedLeg(legH, .085), M.darkWood, g);
      l.position.set(x, 0, z);
    }
    const base = this.mesh(roundedBox(2.1, .55, 1.85, .07), M.leather, g);
    base.position.set(0, legH + .27, 0);
    const seat = this.mesh(roundedBox(1.42, .3, 1.42, .12), M.leather, g);
    seat.position.set(0, legH + .62, .14);
    const back = this.mesh(roundedBox(2.1, 1.25, .42, .1), M.leather, g);
    back.position.set(0, legH + .55 + .6, -.72); back.rotation.x = -.1;
    const backRoll = this.mesh(new THREE.CylinderGeometry(.2, .2, 2.12, 24), M.leather, g);
    backRoll.rotation.z = Math.PI / 2; backRoll.position.set(0, legH + 1.72, -.78);
    for (const s of [-1, 1]) {
      const arm = this.mesh(roundedBox(.34, .55, 1.65, .06), M.leather, g);
      arm.position.set(s * .88, legH + .82, .05);
      const roll = this.mesh(new THREE.CylinderGeometry(.21, .21, 1.68, 24), M.leather, g);
      roll.rotation.x = Math.PI / 2; roll.position.set(s * .93, legH + 1.12, .07);
      const scroll = this.mesh(new THREE.CylinderGeometry(.215, .215, .04, 24), M.leather, g);
      scroll.rotation.x = Math.PI / 2; scroll.position.set(s * .93, legH + 1.12, .92);
    }
    // Brass nailheads along the arm fronts and the base.
    const nails = new THREE.InstancedMesh(new THREE.SphereGeometry(.018, 8, 6), M.brass, 120);
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (const s of [-1, 1]) for (let a = 0; a < Math.PI * 2 && n < 120; a += .22) m4.makeTranslation(s * .93 + Math.cos(a) * .17, legH + 1.12 + Math.sin(a) * .17, .945), nails.setMatrixAt(n++, m4);
    for (let x = -1.0; x <= 1.0 && n < 120; x += .075) m4.makeTranslation(x, legH + .1, .93), nails.setMatrixAt(n++, m4);
    nails.count = n;
    g.add(nails);
    // Tufting: shallow buttons on the back.
    const tufts = new THREE.InstancedMesh(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshStandardMaterial({color: '#4a2410', roughness: .5}), 40);
    n = 0;
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - row % 2; i++) {
      m4.makeTranslation(-.75 + i * .3 + (row % 2) * .15, legH + .9 + row * .28, -.49 + row * -.03);
      tufts.setMatrixAt(n++, m4);
    }
    tufts.count = n;
    g.add(tufts);
    // Cushion pillow.
    const pillow = this.mesh(roundedBox(.95, .75, .24, .1), M.pillow, g);
    pillow.position.set(-.25, legH + 1.1, -.45); pillow.rotation.set(-.25, .1, .12);
    // Plaid throw draped over the right arm.
    const tw = 1.0, tl = 2.3, tg = new THREE.PlaneGeometry(tw, tl, 12, 40), tp = tg.attributes.position;
    const path = v => {
      // Up the inside of the arm, over the roll, down the outside.
      const s = v * tl;
      if (s < .55) return [.62 + s * .45, legH + .62 + s * .9, 0];
      if (s < 1.15) { const a = (s - .55) / .6 * Math.PI; return [.93 - Math.cos(a) * .24, legH + 1.12 + Math.sin(a) * .26, 0]; }
      return [1.17 + (s - 1.15) * .05, legH + 1.12 - (s - 1.15) * .95, 0];
    };
    for (let i = 0; i < tp.count; i++) {
      const u = tp.getX(i), v = .5 - tp.getY(i) / tl;
      const [x, y] = path(v);
      const fold = Math.sin(u * 9 + v * 3) * .03 * (v > .5 ? 1 : .3);
      tp.setXYZ(i, x + fold, y, .1 + u + Math.sin(v * 12) * .02);
    }
    tg.computeVertexNormals();
    const throwBlanket = this.mesh(tg, M.plaidThrow, g);
    const fringe = new THREE.InstancedMesh(new THREE.BoxGeometry(.008, .1, .008), new THREE.MeshStandardMaterial({color: '#3a4630', roughness: 1}), 40);
    const [fx, fy] = path(1);
    for (let i = 0; i < 40; i++) { m4.makeTranslation(fx, fy - .05, .1 - tw / 2 + i * tw / 39); fringe.setMatrixAt(i, m4); }
    g.add(fringe);
    this.chair = g;
  }

  buildSideTable() {
    const M = this.materials, g = new THREE.Group();
    g.position.set(.55, 0, -2.85);
    this.group.add(g);
    const H = 1.35;
    const top = this.mesh(roundedBox(1.05, .07, 1.05, .02), M.darkWood, g);
    top.position.y = H;
    const apron = this.mesh(new THREE.BoxGeometry(.92, .2, .92), M.darkWood, g);
    apron.position.y = H - .14;
    const knob = this.mesh(new THREE.SphereGeometry(.03, 10, 8), M.brass, g);
    knob.position.set(0, H - .14, .47);
    for (const [x, z] of [[-.42, -.42], [.42, -.42], [-.42, .42], [.42, .42]]) {
      const l = this.mesh(turnedLeg(H - .2, .06), M.darkWood, g);
      l.position.set(x, 0, z);
    }
    const shelf = this.mesh(new THREE.BoxGeometry(.9, .04, .9), M.darkWood, g);
    shelf.position.y = .32;
    // Brass lamp with a pleated shade.
    const lampBase = this.mesh(lathe([[0, 0], [.2, 0], [.21, .03], [.14, .07], [.17, .16], [.12, .3], [.05, .36], [.04, .4], [0, .4]], 28), M.brass, g);
    lampBase.position.set(-.1, H + .035, -.1);
    const stem = this.mesh(new THREE.CylinderGeometry(.022, .022, .62, 10), M.brass, g);
    stem.position.set(-.1, H + .7, -.1);
    const shade = new THREE.CylinderGeometry(.27, .44, .55, 72, 1, true), sp = shade.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), z = sp.getZ(i), a = Math.atan2(z, x), k = 1 + Math.abs(Math.sin(a * 18)) * .035;
      sp.setX(i, x * k); sp.setZ(i, z * k);
    }
    shade.computeVertexNormals();
    this.shadeMat = new THREE.MeshStandardMaterial({color: '#f2e6cc', emissive: '#ffc777', emissiveIntensity: .4, roughness: .9, side: THREE.DoubleSide});
    const sh = this.mesh(shade, this.shadeMat, g, {cast: false});
    sh.position.set(-.1, H + 1.1, -.1);
    this.lamp = new THREE.PointLight(0xffb66b, 0, 14, 1.6);
    this.lamp.position.set(g.position.x - .1, H + 1.05, g.position.z - .1);
    this.group.add(this.lamp);
    // Books and a little vase of dried flowers.
    ['#2f3f2c', '#6a2b20'].forEach((c, i) => {
      const b = this.mesh(new THREE.BoxGeometry(.42, .07, .3), new THREE.MeshStandardMaterial({color: c, roughness: .8}), g);
      b.position.set(.22, H + .07 + i * .07, .22); b.rotation.y = .2 * i;
    });
    const vase = this.mesh(lathe([[0, 0], [.08, 0], [.11, .08], [.1, .16], [.06, .22], [.07, .26], [0, .26]], 24), M.white, g);
    vase.position.set(.3, H + .035, -.2);
    this.sprigs(g, new THREE.Vector3(.3, H + .28, -.2), 8, .4);
  }

  buildPrint() {
    const M = this.materials, z = this.walls.back;
    const g = new THREE.Group();
    g.position.set(2.0, 3.25, z + .04);
    this.group.add(g);
    const frame = this.mesh(roundedBox(1.15, 1.42, .07, .02), M.frame, g);
    frame.position.z = .03;
    const art = this.mesh(new THREE.PlaneGeometry(.98, 1.25), M.print, g, {cast: false});
    art.position.z = .075;
  }

  buildBookcase() {
    const M = this.materials, g = new THREE.Group();
    g.position.set(this.walls.right - .32, 0, -1.25); g.rotation.y = -Math.PI / 2;
    this.bookcase = g;
    this.group.add(g);
    const W = 1.9, H = 4.2, D = .6;
    const box = (w, h, d, x, y, z) => { const b = this.mesh(new THREE.BoxGeometry(w, h, d), M.darkWood, g); b.position.set(x, y, z); return b; };
    box(.08, H, D, -W / 2, H / 2, 0); box(.08, H, D, W / 2, H / 2, 0); box(W + .16, .1, D + .06, 0, H, 0); box(W, .2, D, 0, .1, 0);
    box(W, H, .03, 0, H / 2, -D / 2 + .015);
    const shelves = [.2, 1.25, 2.2, 3.15];
    shelves.forEach(y => box(W, .05, D - .04, 0, y + .02, 0));
    // Lower cabinet doors.
    for (const s of [-1, 1]) {
      const d = this.mesh(roundedBox(W / 2 - .08, 1.0, .04, .015), M.darkWood, g);
      d.position.set(s * W / 4, .73, D / 2 - .02);
      const k = this.mesh(new THREE.SphereGeometry(.03, 10, 8), M.brass, g);
      k.position.set(s * .1, .8, D / 2 + .02);
    }
    // Books, one instanced draw.
    const r = rng(51), colors = ['#2f4a35', '#6b2a20', '#253450', '#8a6a3c', '#3c3a2a', '#5a4a30', '#1f2a3a'].map(c => new THREE.Color(c));
    const books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({roughness: .75}), 90);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let n = 0;
    for (const y of shelves.slice(1)) {
      let x = -W / 2 + .1;
      while (x < W / 2 - .2 && n < 90) {
        const t = .05 + r() * .06, h = .5 + r() * .3, lean = r() < .08 ? .25 : 0;
        if (r() < .1 && x > -W / 2 + .4) { x += .25; continue; }
        q.setFromEuler(e.set(0, 0, lean));
        m4.compose(new THREE.Vector3(x + t / 2, y + .05 + h / 2, -.02), q, new THREE.Vector3(t, h, .42 + r() * .08));
        books.setMatrixAt(n, m4); books.setColorAt(n, colors[Math.floor(r() * colors.length)]);
        x += t + .005; n++;
      }
    }
    books.count = n;
    books.castShadow = true;
    g.add(books);
    const vase = this.mesh(lathe([[0, 0], [.1, 0], [.15, .12], [.13, .26], [.08, .32], [.09, .36], [0, .36]], 24), M.white, g);
    vase.position.set(.55, H + .05, .05);
    const pot = this.mesh(lathe([[0, 0], [.15, 0], [.18, .22], [0, .22]], 24), M.clay, g);
    pot.position.set(-.5, H + .05, .05);
    this.ivy(g, new THREE.Vector3(-.5, H + .26, .05), 7, 1.6);
  }

  // Plaid cat bed with a plush lining and a lower front to step in.
  buildBed() {
    const M = this.materials, g = new THREE.Group();
    g.position.set(-2.35, 0, -1.75); g.rotation.y = .7;
    this.group.add(g);
    const R = .92;
    const dip = (geo) => {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(x, z);
        const front = Math.pow(Math.max(0, Math.cos(a)), 3);
        if (y > .16) p.setY(i, .16 + (y - .16) * (1 - .55 * front));
      }
      geo.computeVertexNormals();
      return geo;
    };
    const shell = this.mesh(dip(lathe([[R - .02, 0], [R, .04], [R + .02, .2], [R, .36], [R - .06, .43], [R - .14, .45]], 64)), M.plaidBed, g);
    const lining = this.mesh(dip(lathe([[R - .14, .45], [R - .24, .42], [R - .28, .3], [R - .3, .14], [R - .32, .1]], 64)), M.sherpa, g);
    const cushion = this.mesh(new THREE.SphereGeometry(R - .28, 40, 16), M.sherpa, g);
    cushion.scale.y = .2; cushion.position.y = .1;
    const floorDisc = this.mesh(new THREE.CircleGeometry(R, 48), M.plaidBed, g, {cast: false});
    floorDisc.rotation.x = -Math.PI / 2; floorDisc.position.y = .004;
    this.bed = g;
    this.bedTop = .17;
    this.bedRadius = R - .3;
  }

  // Ivory ceramic food bowl with an olive band, on an olive linen mat.
  buildBowl() {
    const M = this.materials, g = new THREE.Group();
    g.position.set(1.9, 0, 1.1);
    this.group.add(g);
    const mat = this.mesh(new THREE.BoxGeometry(.95, .012, .95), M.oliveLinen, g, {cast: false});
    mat.position.y = .006; mat.rotation.y = .15;
    const y0 = .012;
    const bowl = this.mesh(lathe([[0, .03], [.2, .03], [.235, .03], [.26, .045], [.27, .08], [.27, .13], [.262, .145], [.25, .14], [.24, .1], [.225, .06], [0, .055]], 48), M.ivory, g);
    bowl.position.y = y0;
    const foot = this.mesh(lathe([[0, 0], [.24, 0], [.255, .015], [.262, .04], [0, .04]], 48), M.clay, g);
    foot.position.y = y0;
    const band = this.mesh(new THREE.TorusGeometry(.272, .006, 6, 64), M.oliveStripe, g);
    band.rotation.x = Math.PI / 2; band.position.y = y0 + .115;
    this.kibbles = [];
    const kib = [new THREE.MeshStandardMaterial({color: '#8a5a2c', roughness: .8}), new THREE.MeshStandardMaterial({color: '#a87339', roughness: .8}), new THREE.MeshStandardMaterial({color: '#6f4520', roughness: .8})];
    const kg = new THREE.DodecahedronGeometry(.028, 0);
    for (let i = 0; i < 22; i++) {
      const k = this.mesh(kg, kib[i % 3], g, {cast: false});
      const a = i * 2.4, rr = .17 * Math.sqrt((i + 1) / 22);
      k.position.set(Math.cos(a) * rr, y0 + .075 + (i % 4) * .01, Math.sin(a) * rr);
      k.rotation.set(i, i * 2, i * 3);
      k.scale.set(1, .7, 1);
      k.visible = false;
      this.kibbles.push(k);
    }
    this.bowl = g;
  }

  // Olive ceramic fountain: domed spout, bubbling top and rippling water.
  buildFountain() {
    const M = this.materials, g = new THREE.Group();
    g.position.set(2.45, 0, -.15);
    this.group.add(g);
    const jute = this.mesh(new THREE.CircleGeometry(.68, 48), M.jute, g, {cast: false});
    jute.rotation.x = -Math.PI / 2; jute.position.y = .006;
    const R = .44, y0 = .01;
    const body = this.mesh(lathe([[0, .04], [R - .04, .04], [R - .01, .05], [R, .1], [R, .2], [R - .015, .222], [R - .04, .215], [R - .05, .17], [0, .17]], 64), M.olive, g);
    body.position.y = y0;
    const foot = this.mesh(lathe([[0, 0], [R - .05, 0], [R - .03, .015], [R - .02, .045], [0, .045]], 64), M.clay, g);
    foot.position.y = y0;
    const dome = lathe([[0, .3], [.06, .295], [.12, .27], [.16, .22], [.18, .17], [.185, .15]], 64), dp = dome.attributes.position;
    for (let i = 0; i < dp.count; i++) {
      const x = dp.getX(i), z = dp.getZ(i), a = Math.atan2(z, x), k = 1 + Math.abs(Math.sin(a * 14)) * .02 * (dp.getY(i) < .26 ? 1 : 0);
      dp.setX(i, x * k); dp.setZ(i, z * k);
    }
    dome.computeVertexNormals();
    this.mesh(dome, M.olive, g).position.y = y0;
    // Rippling water surface (vertices animated each frame).
    const water = new THREE.RingGeometry(.19, R - .04, 64, 10);
    water.rotateX(-Math.PI / 2);
    this.waterGeo = water;
    this.waterBase = Float32Array.from(water.attributes.position.array);
    const waterMat = new THREE.MeshPhysicalMaterial({color: '#dfe9e2', roughness: .03, metalness: .1, transparent: true, opacity: .5, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 2});
    this.water = this.mesh(water, waterMat, g, {cast: false});
    this.water.position.y = y0 + .2;
    // Water sheeting over the dome, and the bubbling spout.
    const film = new THREE.MeshPhysicalMaterial({color: '#dfe8dc', transparent: true, opacity: .3, roughness: .02, clearcoat: 1, depthWrite: false});
    const sheet = this.mesh(lathe([[0, .305], [.065, .3], [.125, .275], [.165, .224], [.186, .172], [.192, .2]].slice(0, 5), 64), film, g, {cast: false});
    sheet.position.y = y0 + .004;
    this.bubble = this.mesh(new THREE.SphereGeometry(.045, 20, 14), new THREE.MeshPhysicalMaterial({color: '#ffffff', transparent: true, opacity: .45, roughness: 0, clearcoat: 1}), g, {cast: false});
    this.bubble.position.y = y0 + .32;
    this.fountain = g;
    this.ripple = 1;
    this.clickables.push(body, this.water, this.bubble);
  }

  buildPlants() {
    const M = this.materials;
    // Woven basket with trailing ivy beside the fountain.
    const g = new THREE.Group();
    g.position.set(3.55, 0, -.75);
    this.group.add(g);
    const basket = this.mesh(lathe([[0, 0], [.26, 0], [.32, .5], [.3, .52], [0, .52]], 32), M.jute, g);
    this.ivy(g, new THREE.Vector3(0, .5, 0), 9, 1.0, true);
    // A tall leafy plant in the far corner by the window.
    const g2 = new THREE.Group();
    g2.position.set(-4.0, 0, -2.85);
    this.group.add(g2);
    this.mesh(lathe([[0, 0], [.28, 0], [.34, .62], [.3, .64], [0, .64]], 32), M.white, g2);
    this.ivy(g2, new THREE.Vector3(0, .62, 0), 12, 1.6, true);
  }

  // Leafy sprigs in a vase.
  sprigs(parent, at, count, height) {
    const r = rng(61 + count), leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(.09, .13), this.materials.leaf, count * 9);
    const stems = new THREE.MeshStandardMaterial({color: '#5c6a3a', roughness: .8});
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let n = 0;
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2, tilt = .2 + r() * .5, h = height * (.6 + r() * .5);
      const dir = new THREE.Vector3(Math.cos(a) * Math.sin(tilt), Math.cos(tilt), Math.sin(a) * Math.sin(tilt));
      const stem = this.mesh(new THREE.CylinderGeometry(.006, .008, h, 4), stems, parent, {cast: false});
      stem.position.copy(at).addScaledVector(dir, h / 2);
      stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      for (let k = 0; k < 9; k++) {
        const p = at.clone().addScaledVector(dir, h * (.25 + k * .085));
        q.setFromEuler(e.set(r() * 1.2 - .6, r() * 6.3, (k % 2 ? 1 : -1) * (.8 + r() * .4)));
        m4.compose(p, q, new THREE.Vector3(1, 1, 1).multiplyScalar(.7 + r() * .5));
        leaves.setMatrixAt(n++, m4);
      }
    }
    leaves.count = n;
    parent.add(leaves);
  }

  // Trailing ivy vines.
  ivy(parent, at, vines, length, upright = false) {
    const r = rng(71 + vines), leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(.16, .16), this.materials.leaf, vines * 16);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let n = 0;
    for (let v = 0; v < vines; v++) {
      const a = r() * Math.PI * 2;
      const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      for (let k = 0; k < 16; k++) {
        const t = k / 15;
        const p = at.clone()
          .addScaledVector(out, .1 + t * (upright ? .35 : .3))
          .add(new THREE.Vector3(0, upright ? (t < .4 ? t * length * .6 : (.4 * length * .6) - (t - .4) * length * .8) : -t * length, 0));
        p.x += Math.sin(t * 9 + v) * .04; p.z += Math.cos(t * 7 + v) * .04;
        q.setFromEuler(e.set(r() * 1.4 - .7, a + r() - .5, r() * 6.3));
        m4.compose(p, q, new THREE.Vector3(1, 1, 1).multiplyScalar(.6 + r() * .6 - t * .2));
        leaves.setMatrixAt(n++, m4);
      }
    }
    leaves.count = n;
    leaves.castShadow = true;
    parent.add(leaves);
  }

  // Soft reflections for ceramic, leather, brass and Mochi's eyes.
  buildEnvironment(renderer) {
    const pm = new THREE.PMREMGenerator(renderer);
    const make = night => {
      const s = new THREE.Scene();
      const sphere = new THREE.SphereGeometry(10, 32, 16), c = [];
      const p = sphere.attributes.position;
      const floorC = new THREE.Color(night ? '#2a1a10' : '#6b4527'), wallC = new THREE.Color(night ? '#4a3524' : '#e7d3b2'), ceilC = new THREE.Color(night ? '#2a2018' : '#f6ecdc');
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i) / 10, col = y < -.1 ? floorC : y < .55 ? wallC : ceilC;
        c.push(col.r, col.g, col.b);
      }
      sphere.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
      s.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide})));
      const win = new THREE.Mesh(new THREE.PlaneGeometry(5, 6), new THREE.MeshBasicMaterial({color: night ? new THREE.Color(.12, .18, .35) : new THREE.Color(3, 2.7, 2.2)}));
      win.position.set(-3, 2.5, -9); s.add(win);
      const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(.8, 16, 12), new THREE.MeshBasicMaterial({color: new THREE.Color(night ? 6 : 1.5, night ? 4 : 1, night ? 2 : .5)}));
      lampGlow.position.set(3, 3, -8); s.add(lampGlow);
      return pm.fromScene(s, .04).texture;
    };
    this.envDay = make(false);
    this.envNight = make(true);
    this.scene.environment = this.envDay;
    this.scene.environmentIntensity = .55;
    pm.dispose();
  }

  update(dt, t, night, {drinking = false, camera = null} = {}) {
    if (camera) {
      for (const w of this.wallGroups) {
        // A wall faces into the room along its local +z.
        _n.set(0, 0, 1).applyQuaternion(w.quaternion);
        w.visible = _d.subVectors(camera.position, w.position).dot(_n) > .05;
      }
      // Furniture standing against a hidden wall goes with it.
      if (this.bookcase) this.bookcase.visible = this.wallGroups[2].visible;
    }
    const k = night ? 1 : 0;
    this.lamp.intensity = damp(this.lamp.intensity, night ? 26 : 2.5, 3, dt);
    this.shadeMat.emissiveIntensity = damp(this.shadeMat.emissiveIntensity, night ? 2.2 : .45, 3, dt);
    this.sunPatch.material.opacity = damp(this.sunPatch.material.opacity, night ? 0 : .32, 3, dt);
    const sky = night ? this.skyNight : this.skyDay;
    if (this.glass.material.map !== sky) { this.glass.material.map = sky; this.glass.material.needsUpdate = true; }
    if (this.scene.environment && this.envNight) {
      const env = night ? this.envNight : this.envDay;
      if (this.scene.environment !== env) this.scene.environment = env;
      this.scene.environmentIntensity = damp(this.scene.environmentIntensity, night ? .35 : .55, 3, dt);
    }
    // Fountain ripples: gentle rings from the spout, livelier while Mochi drinks.
    this.ripple = damp(this.ripple, drinking ? 3 : 1, 4, dt);
    const p = this.waterGeo.attributes.position, b = this.waterBase;
    for (let i = 0; i < p.count; i++) {
      const x = b[i * 3], z = b[i * 3 + 2], r = Math.hypot(x, z);
      p.setY(i, (Math.sin(r * 70 - t * 7) * .0025 + Math.sin(x * 40 + t * 5) * Math.cos(z * 37 - t * 4) * .001 * this.ripple) * this.ripple);
    }
    p.needsUpdate = true;
    this.waterGeo.computeVertexNormals();
    const s = 1 + Math.sin(t * 9) * .08 + Math.sin(t * 23) * .04;
    this.bubble.scale.set(s, 1 / s, s);
    return k;
  }
}
