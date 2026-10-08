// Room decors: seasonal looks for Mochi's room. The furniture, its size and
// position, and so every path Mochi walks or jumps, stay exactly the same; a
// decor only recolours materials, changes the view from the window and adds
// props where they're out of her way.
//
// Thanksgiving in the Hamptons (from Orion's reference and prop sheet):
// oatmeal wool rug with faded sage stripes and a flax border; flax-linen cat
// bed with olive piping and a fluffy ivory lining; cream cable-knit throw;
// linen cushion with sage stripes; dunes and the sea out of the window; and
// the ten props: ivory and apricot pumpkins, a sage gourd, a pear bowl, oak
// branches, an oak-leaf garland, the knit throw, the linen cushion, a brass
// lantern with a candle and a pinecone basket.
import * as THREE from 'three';
import {rng, canvasTexture, drawLinen, drawNoise, roundedBox, lathe} from './room.js';

export const DECORS = {
  classic: {name: 'Classic study', note: 'Plaid, leather and greenery'},
  thanksgiving: {name: 'Thanksgiving in the Hamptons', note: 'Oatmeal, sage and candlelight'},
  halloween: {name: 'Halloween in the Hamptons', note: 'Jack-o’-lanterns, paper bats and a felt bat'},
};

export function applyDecor(room, name) {
  if (!DECORS[name]) name = 'classic';
  const M = room.materials;
  // What the classic room looks like, kept so it can come back.
  room.decorOriginal ??= {
    rugMap: M.rug.map, rugColor: M.rug.color.clone(), rugEdge: room.rugEdge.color.clone(),
    bedMap: M.plaidBed.map, sherpaMap: M.sherpa.map, throwMap: M.plaidThrow.map, fringe: room.fringeMat.color.clone(),
    pillowMap: M.pillow.map, view: {...room.view},
  };
  const O = room.decorOriginal;
  for (const g of Object.values(room.decorProps || {})) g.forEach(o => o.visible = false);
  room.candleLight = null; room.pumpkinGlow = null; room.altToy = null;
  if (name === 'classic') {
    M.rug.map = O.rugMap; M.rug.color.copy(O.rugColor); room.rugEdge.color.copy(O.rugEdge);
    M.plaidBed.map = O.bedMap; M.sherpa.map = O.sherpaMap; M.plaidThrow.map = O.throwMap; room.fringeMat.color.copy(O.fringe);
    M.pillow.map = O.pillowMap;
    for (const m of [M.rug, M.plaidBed, M.plaidThrow]) m.normalMap = null;
    room.view = {...O.view};
    room.sillSprigs.visible = true;
  } else {
    // Thanksgiving and Halloween share the autumn room: oatmeal rug, flax
    // bed, knit throw, the sill runner, oak branches and the brass lantern.
    const T = room.decorTextures ??= thanksgivingTextures();
    const halloween = name === 'halloween';
    M.rug.map = T.rug; M.rug.color.set('#cfc3ab'); room.rugEdge.color.set('#b9a27b');
    M.plaidBed.map = T.flax; M.sherpa.map = T.fluff; M.plaidThrow.map = T.knit; room.fringeMat.color.set('#e4d8c1');
    M.rug.normalMap = T.rugWeave; M.rug.normalScale.set(1, 1);
    M.plaidBed.normalMap = T.linenWeave; M.plaidBed.normalScale.set(1, 1);
    M.plaidThrow.normalMap = T.knitRelief; M.plaidThrow.normalScale.set(1.4, 1.4);
    if (halloween) {
      T.ghost ??= canvasTexture(256, 256, drawGhostCushion);
      T.ghost.offset.set(.5, .5);
      T.viewDusk ??= canvasTexture(256, 320, (g, w, h) => drawHamptons(g, w, h, 'dusk'));
    }
    M.pillow.map = halloween ? T.ghost : T.cushion;
    room.view = {day: T.viewDay, night: halloween ? T.viewDusk : T.viewNight};
    room.sillSprigs.visible = false;
    room.decorProps ??= {};
    if (!room.decorProps.shared) Object.assign(room.decorProps, buildAutumn(room, T));
    if (halloween) room.decorProps.halloween ??= buildHalloween(room);
    // Show just this decor's pieces (newly built ones start out visible).
    for (const [part, objs] of Object.entries(room.decorProps)) objs.forEach(o => o.visible = part === 'shared' || part === name);
    room.candleLight = room.thanksgivingCandle;
    if (halloween) { room.pumpkinGlow = room.halloweenGlow; room.altToy = room.feltBat; }
  }
  for (const m of [M.rug, M.plaidBed, M.sherpa, M.plaidThrow, M.pillow]) m.needsUpdate = true;
  room.glass.material.needsUpdate = true;
  room.decor = name;
}

// ---------------------------------------------------------------------------
// Textures
// ---------------------------------------------------------------------------
function thanksgivingTextures() {
  return {
    // The rug's UVs cover 1/2.4 of a texture tile, so this repeat makes one
    // drawing span the whole rug.
    rug: canvasTexture(1024, 1024, drawOatmealRug, {repeat: [2.4, 2.4]}),
    flax: canvasTexture(256, 256, (g, w, h) => drawLinen(g, w, h, {base: '#c4b28d', dark: .1, seed: 21}), {repeat: [6, 1]}),
    fluff: canvasTexture(512, 512, (g, w, h) => drawNoise(g, w, h, {base: '#efe7d8', blobs: [['rgba(170,150,120,.22)', 5000, 2, 4.5], ['rgba(255,252,244,.7)', 6000, 1.5, 4]], seed: 23}), {repeat: [3, 3]}),
    knit: canvasTexture(512, 512, drawCableKnit, {repeat: [1.6, 1.6]}),
    cushion: canvasTexture(256, 256, drawStripedLinen),
    runner: canvasTexture(512, 128, drawRunner),
    viewDay: canvasTexture(256, 320, (g, w, h) => drawHamptons(g, w, h, false)),
    viewNight: canvasTexture(256, 320, (g, w, h) => drawHamptons(g, w, h, true)),
    oak: canvasTexture(128, 128, drawOakLeaf),
    // Weave relief, as small tiling normal maps (light on phones): basket
    // weave on the rug, linen on the bed, raised cables on the throw.
    rugWeave: normalMap(128, drawBasketWeave, {repeat: [19.2, 19.2], strength: 2.2}),
    linenWeave: normalMap(128, drawLinenHeight, {repeat: [12, 2.5], strength: 2.6}),
    knitRelief: normalMap(256, drawCableHeight, {repeat: [1.6, 1.6], strength: 4}),
    gourd: canvasTexture(256, 256, (g, w, h) => drawNoise(g, w, h, {base: '#8e9b72', blobs: [['rgba(210,200,140,.35)', 260, 2, 7], ['rgba(70,90,60,.25)', 160, 3, 10]], seed: 27})),
  };
}

// A tiling normal map from a grey height drawing (brighter = higher).
function normalMap(size, drawHeight, {repeat = [1, 1], strength = 2} = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, size, size);
  drawHeight(g, size, size);
  const src = g.getImageData(0, 0, size, size).data, out = g.createImageData(size, size);
  const H = (x, y) => src[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * size + x) * 4;
    out.data[i] = (-dx / l * .5 + .5) * 255; out.data[i + 1] = (dy / l * .5 + .5) * 255; out.data[i + 2] = (1 / l * .5 + .5) * 255; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  return t;
}

// Basket weave: blocks of three strands, alternating across and along.
function drawBasketWeave(g, w, h) {
  const n = 8, cell = w / n, strand = cell / 3;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const across = (i + j) % 2 === 0;
    for (let k = 0; k < 3; k++) {
      const x = i * cell + (across ? 0 : k * strand), y = j * cell + (across ? k * strand : 0);
      const sw = across ? cell : strand, sh = across ? strand : cell;
      const grd = across ? g.createLinearGradient(0, y, 0, y + sh) : g.createLinearGradient(x, 0, x + sw, 0);
      grd.addColorStop(0, '#202020'); grd.addColorStop(.5, '#d8d8d8'); grd.addColorStop(1, '#202020');
      g.fillStyle = grd; g.fillRect(x, y, sw, sh);
    }
  }
}

// Linen: fine crossing threads of uneven thickness.
function drawLinenHeight(g, w, h) {
  const r = rng(47);
  for (let y = 0; y < h; y += 4) { g.fillStyle = `rgba(255,255,255,${.35 + r() * .4})`; g.fillRect(0, y, w, 2); }
  g.globalCompositeOperation = 'lighter';
  for (let x = 0; x < w; x += 4) { g.fillStyle = `rgba(255,255,255,${.2 + r() * .3})`; g.fillRect(x, 0, 2, h); }
  g.globalCompositeOperation = 'source-over';
}

// Cables: the same lobes as the knit's colour, raised in the middle.
function drawCableHeight(g, w, h) {
  const cols = 6, cw = w / cols;
  for (let c = 0; c < cols; c++) {
    const x = c * cw;
    for (let y = -cw * .5; y < h; y += cw * .55) {
      for (const s of [0, 1]) {
        const cx = x + cw * (.36 + s * .3), cy = y + s * cw * .27;
        g.save(); g.translate(cx, cy); g.rotate(s ? -.6 : .6); g.scale(1, cw * .3 / (cw * .19));
        const grd = g.createRadialGradient(0, 0, 0, 0, 0, cw * .19);
        grd.addColorStop(0, '#ffffff'); grd.addColorStop(.7, '#909090'); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(0, 0, cw * .19, 0, Math.PI * 2); g.fill();
        g.restore();
      }
    }
  }
}

function drawOatmealRug(g, w, h) {
  // Oatmeal wool in a fine basket weave.
  g.fillStyle = '#d8cbb3'; g.fillRect(0, 0, w, h);
  const r = rng(41);
  // Basket weave, 64 blocks across, lined up with the rug's relief map
  // (rugWeave: 8 tiles of 8 blocks).
  const cell = w / 64, strand = cell / 3;
  for (let i = 0; i < 64; i++) for (let j = 0; j < 64; j++) {
    const across = (i + j) % 2 === 0;
    for (let k = 0; k < 3; k++) {
      const x = i * cell + (across ? 0 : k * strand), y = j * cell + (across ? k * strand : 0);
      g.fillStyle = `rgba(255,248,232,${.1 + r() * .08})`;
      g.fillRect(x + (across ? 1 : .5), y + (across ? .5 : 1), across ? cell - 2 : strand - 1, across ? strand - 1 : cell - 2);
      g.fillStyle = 'rgba(110,90,60,.12)';
      if (across) g.fillRect(x, y + strand - 1, cell, 1); else g.fillRect(x + strand - 1, y, 1, cell);
    }
  }
  // Faded sage stripes running the length of the rug, in two pairs.
  const stripe = (u, width, a) => { g.fillStyle = `rgba(150,163,128,${a})`; g.fillRect(u * w, 0, width * w, h); };
  for (const base of [.2, .74]) { stripe(base, .045, .85); stripe(base + .065, .014, .75); }
  stripe(.08, .01, .45); stripe(.91, .01, .45);
  for (let i = 0; i < 16000; i++) { g.fillStyle = r() < .5 ? 'rgba(255,250,238,.1)' : 'rgba(90,70,40,.08)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
}

function drawCableKnit(g, w, h) {
  g.fillStyle = '#e6dac3'; g.fillRect(0, 0, w, h);
  const r = rng(43), cols = 6, cw = w / cols;
  for (let c = 0; c < cols; c++) {
    const x = c * cw;
    // Purl ridge between cables.
    g.fillStyle = 'rgba(120,100,70,.18)'; g.fillRect(x, 0, cw * .12, h);
    // A two-strand cable: crossing lobes down the column.
    for (let y = -cw * .5; y < h; y += cw * .55) {
      for (const s of [0, 1]) {
        const cx = x + cw * (.36 + s * .3), cy = y + s * cw * .27;
        const grd = g.createLinearGradient(cx - cw * .2, cy, cx + cw * .2, cy);
        grd.addColorStop(0, 'rgba(140,118,86,.5)'); grd.addColorStop(.5, 'rgba(255,251,242,.5)'); grd.addColorStop(1, 'rgba(140,118,86,.45)');
        g.fillStyle = grd;
        g.beginPath(); g.ellipse(cx, cy, cw * .19, cw * .3, s ? -.6 : .6, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(120,100,70,.25)'; g.lineWidth = 1.5; g.stroke();
      }
    }
  }
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < .5 ? 'rgba(255,250,240,.12)' : 'rgba(100,80,50,.1)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
}

function drawStripedLinen(g, w, h) {
  drawLinen(g, w, h, {base: '#dccfb4', dark: .1, seed: 29});
  g.fillStyle = 'rgba(122,138,98,.75)';
  for (const u of [.16, .26, .7, .8]) g.fillRect(u * w, 0, w * (u === .16 || u === .8 ? .045 : .018), h);
}

function drawRunner(g, w, h) {
  drawLinen(g, w, h, {base: '#e8dfcb', dark: .08, seed: 31});
  g.fillStyle = 'rgba(122,138,98,.8)';
  for (const u of [.05, .085, .9, .935]) g.fillRect(u * w, 0, w * .018, h);
}

// The view: grey-blue sky, the sea, and golden dune grass with a few
// russet shrubs. At night, a deep blue dusk with a sliver of moonlight.
function drawHamptons(g, w, h, night) {
  const r = rng(night ? 51 : 53), dusk = night === 'dusk';
  const sky = g.createLinearGradient(0, 0, 0, h * .45);
  // Halloween's evening: blue dusk with a last pink glow and the moon up.
  if (dusk) { sky.addColorStop(0, '#2c3c5e'); sky.addColorStop(.55, '#455d7a'); sky.addColorStop(.85, '#8e7491'); sky.addColorStop(1, '#d69c86'); }
  else if (night) { sky.addColorStop(0, '#121a30'); sky.addColorStop(1, '#2b3654'); }
  else { sky.addColorStop(0, '#b9c2c7'); sky.addColorStop(1, '#e6e2d8'); }
  g.fillStyle = sky; g.fillRect(0, 0, w, h * .46);
  g.filter = 'blur(8px)';
  for (let i = 0; i < 18; i++) {
    g.fillStyle = night ? 'rgba(60,70,100,.35)' : (r() < .5 ? 'rgba(255,255,255,.5)' : 'rgba(150,160,168,.35)');
    g.beginPath(); g.ellipse(r() * w, r() * h * .32, 30 + r() * 50, 8 + r() * 14, 0, 0, 7); g.fill();
  }
  g.filter = 'none';
  if (dusk) {
    const moon = g.createRadialGradient(w * .78, h * .1, 0, w * .78, h * .1, 22);
    moon.addColorStop(0, 'rgba(255,248,226,1)'); moon.addColorStop(.3, 'rgba(255,244,215,.95)'); moon.addColorStop(.36, 'rgba(255,240,210,.25)'); moon.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = moon; g.fillRect(0, 0, w, h * .3);
  }
  // Sea.
  const sea = g.createLinearGradient(0, h * .44, 0, h * .53);
  if (night) { sea.addColorStop(0, '#1b2840'); sea.addColorStop(1, '#141d2e'); }
  else { sea.addColorStop(0, '#6f8593'); sea.addColorStop(1, '#5a6f7b'); }
  g.fillStyle = sea; g.fillRect(0, h * .44, w, h * .1);
  g.fillStyle = night ? 'rgba(200,210,235,.35)' : 'rgba(235,240,240,.45)';
  for (let i = 0; i < 26; i++) g.fillRect(r() * w, h * (.45 + r() * .07), 6 + r() * 18, 1);
  if (night) { g.fillStyle = 'rgba(230,235,255,.5)'; g.fillRect(w * .62, h * .455, 14, 2); g.fillRect(w * .6, h * .475, 22, 1.5); }
  // Dunes.
  const dune = g.createLinearGradient(0, h * .52, 0, h);
  if (night) { dune.addColorStop(0, '#2c2c2a'); dune.addColorStop(1, '#1a1814'); }
  else { dune.addColorStop(0, '#cdb27a'); dune.addColorStop(1, '#a8834a'); }
  g.fillStyle = dune;
  g.beginPath(); g.moveTo(0, h * .56);
  for (let x = 0; x <= w; x += 16) g.lineTo(x, h * (.53 + Math.sin(x * .03) * .015 + r() * .01));
  g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
  // Shrubs and grass.
  for (let i = 0; i < 12; i++) {
    g.fillStyle = night ? 'rgba(40,34,26,.9)' : ['#b8733a', '#c98f4a', '#8e6a3a'][i % 3];
    g.beginPath(); g.ellipse(r() * w, h * (.6 + r() * .3), 14 + r() * 22, 8 + r() * 10, 0, 0, 7); g.fill();
  }
  for (let i = 0; i < 700; i++) {
    const x = r() * w, y = h * (.55 + r() * .45), len = 8 + r() * 22;
    g.strokeStyle = night ? 'rgba(70,64,50,.6)' : (r() < .5 ? 'rgba(232,206,140,.7)' : 'rgba(150,115,60,.6)');
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 8, y - len); g.stroke();
  }
}

// An oak leaf: lobed outline, ochre to russet with a little olive.
function drawOakLeaf(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.translate(w / 2, h * .95);
  g.beginPath(); g.moveTo(0, 0);
  const lobes = 4;
  for (const side of [-1, 1]) {
    for (let i = 0; i <= lobes; i++) {
      const y = -h * (.12 + i * .2), out = (i === lobes ? .08 : .22 + .08 * Math.sin(i * 1.3)) * w;
      g.quadraticCurveTo(side * out * 1.25, y + h * .06, side * out, y);
      g.quadraticCurveTo(side * out * .35, y - h * .04, side * w * .08, y - h * .08);
    }
    g.lineTo(0, -h * .92);
    if (side < 0) g.moveTo(0, 0);
  }
  const grd = g.createLinearGradient(0, -h * .9, 0, 0);
  grd.addColorStop(0, '#c8892f'); grd.addColorStop(.6, '#b56a2a'); grd.addColorStop(1, '#7d6a32');
  g.fillStyle = grd; g.fill();
  g.strokeStyle = 'rgba(90,50,20,.6)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -h * .88); g.stroke();
}

// Ghost cushion: flax linen with a little ivory felt ghost appliqué.
// (Drawn round the centre; the cushion's texture offset puts it mid-front.)
function drawGhostCushion(g, w, h) {
  drawLinen(g, w, h, {base: '#cbb998', dark: .1, seed: 33});
  g.save(); g.translate(w / 2, h / 2 + 6);
  g.beginPath();
  g.moveTo(-34, 40); g.lineTo(-34, -6); g.bezierCurveTo(-34, -50, 34, -50, 34, -6); g.lineTo(34, 40);
  for (let i = 0; i < 4; i++) { const x = 34 - i * 17; g.quadraticCurveTo(x - 8.5, 52, x - 17, 40); }
  g.closePath();
  g.fillStyle = '#efe5d2'; g.fill();
  g.setLineDash([3, 3]); g.strokeStyle = 'rgba(150,130,100,.7)'; g.lineWidth = 1.5; g.stroke(); g.setLineDash([]);
  g.fillStyle = '#38332f';
  for (const x of [-11, 11]) { g.beginPath(); g.ellipse(x, -8, 3.5, 5, 0, 0, Math.PI * 2); g.fill(); }
  g.restore();
}

// A paper bat silhouette (charcoal), on a transparent background.
function drawPaperBat(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.translate(w / 2, h / 2);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(0, -h * .12);
  g.quadraticCurveTo(w * .18, -h * .42, w * .48, -h * .3);
  for (let i = 0; i < 3; i++) { const x = w * (.48 - i * .14); g.quadraticCurveTo(x - w * .05, h * (.02 + i * .02), x - w * .14, h * (.06 + (i === 2 ? .1 : 0))); }
  g.quadraticCurveTo(w * .03, h * .3, 0, h * .32);
  g.quadraticCurveTo(-w * .03, h * .3, -w * .06, h * .16);
  for (let i = 0; i < 3; i++) { const x = -w * (.06 + i * .14); g.quadraticCurveTo(x - w * .09, h * (.02 + i * .02), x - w * .14, h * (i === 2 ? -.3 : .02)); }
  g.quadraticCurveTo(-w * .18, -h * .42, 0, -h * .12);
  g.fill();
  // Ears.
  g.beginPath(); g.moveTo(-w * .04, -h * .1); g.lineTo(-w * .02, -h * .3); g.lineTo(0, -h * .12); g.lineTo(w * .02, -h * .3); g.lineTo(w * .04, -h * .1); g.fill();
}

// A jack-o'-lantern's skin (colour) and its glowing carved face (emissive).
// The face sits at u = .25, which on a sphere faces +z (into the room).
function drawJack(g, w, h, {base, sleepy, glow}) {
  g.fillStyle = glow ? '#000' : base; g.fillRect(0, 0, w, h);
  if (!glow) { const r = rng(sleepy ? 57 : 59); for (let i = 0; i < 900; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * w, r() * h, 2, 2); } }
  const cx = w * .25, cy = h * .47, ink = glow ? '#ffffff' : '#4a2a12';
  g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round';
  if (sleepy) {
    g.lineWidth = 3.5;
    for (const dx of [-13, 13]) { g.beginPath(); g.arc(cx + dx, cy - 9, 7, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
    g.beginPath(); g.moveTo(cx, cy - 1); g.lineTo(cx - 3.5, cy + 5); g.lineTo(cx + 3.5, cy + 5); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - 13, cy + 11); g.quadraticCurveTo(cx, cy + 22, cx + 13, cy + 11); g.quadraticCurveTo(cx, cy + 17, cx - 13, cy + 11); g.fill();
  } else {
    for (const dx of [-14, 14]) { g.beginPath(); g.ellipse(cx + dx, cy - 9, 6, 7, 0, 0, Math.PI * 2); g.fill(); }
    g.beginPath(); g.moveTo(cx, cy - 3); g.lineTo(cx - 5, cy + 5); g.lineTo(cx + 5, cy + 5); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - 22, cy + 9); g.quadraticCurveTo(cx, cy + 30, cx + 22, cy + 9); g.quadraticCurveTo(cx, cy + 20, cx - 22, cy + 9); g.fill();
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
// Autumn pieces: "shared" by Thanksgiving and Halloween (sill runner, oak
// branches in the pitcher, brass lantern, bed piping) and Thanksgiving's own.
function buildAutumn(room, T) {
  const M = room.materials, out = {shared: [], thanksgiving: []};
  let made = out.shared;
  const add = (obj, parent) => { parent.add(obj); made.push(obj); return obj; };
  const mesh = (geo, mat, parent, opts) => { const m = room.mesh(geo, mat, parent, opts); made.push(m); return m; };
  const r = rng(71);
  const stemMat = new THREE.MeshStandardMaterial({color: '#6b4a2a', roughness: .8});
  const oakMat = new THREE.MeshStandardMaterial({map: T.oak, alphaTest: .45, side: THREE.DoubleSide, roughness: .75});
  const stoneware = new THREE.MeshStandardMaterial({color: '#ece3d0', roughness: .75});

  // --- On the window sill: a striped runner, pumpkins, oak branches in the
  // pitcher and a bowl of pears. The middle stays clear for Mochi.
  const w = room.windowGroup, top = room.sillTop, D = room.sillDepth;
  const runnerMat = new THREE.MeshStandardMaterial({map: T.runner, roughness: 1, side: THREE.DoubleSide});
  const runner = mesh(new THREE.BoxGeometry(2.3, .012, D * .62), runnerMat, w, {cast: false});
  runner.position.set(0, top + .004, D * .58);
  const drape = mesh(new THREE.PlaneGeometry(2.3, .3), runnerMat, w, {cast: false});
  drape.position.set(0, top - .14, D + .012);
  room.sprigs(add(new THREE.Group(), w), new THREE.Vector3(-.75, top + .4, .22), 8, .95, {leaf: oakMat, stem: '#6a4a2c', size: 1.55, seed: 91});
  made = out.thanksgiving;
  const pumpkin = (x, z, rad, height, color) => {
    const body = mesh(pumpkinGeometry(rad, height), new THREE.MeshStandardMaterial({color, roughness: .62}), w);
    body.position.set(x, top + height, z);
    mesh(pumpkinStem(rad), stemMat, w).position.set(x + rad * .05, top + height * 2 + rad * .15, z);
  };
  pumpkin(-1.13, .34, .17, .14, '#efe6d2');
  pumpkin(-.93, .64, .11, .085, '#e0995e');
  pumpkin(-.58, .62, .08, .065, '#efe6d2');
  const bowl = mesh(lathe([[0, 0], [.1, 0], [.15, .04], [.17, .1], [.165, .105], [.14, .055], [0, .045]], 32), stoneware, w);
  bowl.position.set(1.12, top + .005, .24);
  const pearMat = new THREE.MeshStandardMaterial({color: '#c0ae48', roughness: .55});
  const pear = (x, y, z, s, tilt) => {
    const p = mesh(lathe([[0, 0], [.05, .005], [.065, .04], [.055, .08], [.03, .11], [.022, .14], [.012, .155], [0, .16]].map(([a, b]) => [a * s, b * s]), 24), pearMat, w);
    p.position.set(x, y, z); p.rotation.z = tilt;
    const st = mesh(new THREE.CylinderGeometry(.004, .006, .04 * s, 5), new THREE.MeshStandardMaterial({color: '#5a3e22'}), w);
    st.position.set(x - Math.sin(tilt) * .17 * s, y + .17 * s, z); st.rotation.z = tilt - .3;
  };
  pear(1.08, top + .06, .21, 1.25, .15); pear(1.18, top + .06, .27, 1.15, -.2); pear(1.12, top + .07, .14, 1.1, .05);

  // --- An oak-leaf garland draped over the botanical print.
  const pg = room.printGroup, path = [];
  for (let i = 0; i <= 40; i++) {
    const k = i / 40;
    if (k < .25) path.push([-.62, -.2 + k / .25 * .9]);          // up the left side
    else if (k < .75) { const q = (k - .25) / .5; path.push([-.62 + q * 1.24, .74 - Math.sin(q * Math.PI) * .06]); } // across the top
    else path.push([.62, .7 - (k - .75) / .25 * .8]);            // down the right
  }
  const garland = new THREE.InstancedMesh(new THREE.PlaneGeometry(.21, .21), oakMat, 220);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 220; i++) {
    const [x, y] = path[Math.floor(r() * path.length)];
    q.setFromEuler(e.set((r() - .5) * .8, (r() - .5) * .8, r() * Math.PI * 2));
    m4.compose(new THREE.Vector3(x + (r() - .5) * .12, y + (r() - .5) * .12, .1 + r() * .04), q, new THREE.Vector3(1, 1, 1).multiplyScalar(.75 + r() * .5));
    garland.setMatrixAt(i, m4);
  }
  add(garland, pg);

  // --- Brass lantern with a candle on the side table; a sage gourd on the
  // shelf below.
  made = out.shared;
  const st = room.sideTable, H = room.sideTableTop;
  const lantern = add(new THREE.Group(), st);
  lantern.position.set(.3, H, .2);
  mesh(roundedBox(.2, .03, .2, .01), M.brass, lantern).position.y = .015;
  for (const [x, z] of [[-.085, -.085], [.085, -.085], [-.085, .085], [.085, .085]]) mesh(new THREE.BoxGeometry(.016, .3, .016), M.brass, lantern).position.set(x, .18, z);
  const glass = new THREE.MeshStandardMaterial({color: '#fff6e0', transparent: true, opacity: .18, roughness: .05, depthWrite: false});
  mesh(new THREE.BoxGeometry(.17, .28, .17), glass, lantern, {cast: false}).position.y = .18;
  mesh(lathe([[0, 0], [.12, 0], [.1, .04], [.05, .09], [.02, .1], [0, .1]], 24), M.brass, lantern).position.y = .33;
  const ring = mesh(new THREE.TorusGeometry(.035, .008, 6, 16), M.brass, lantern); ring.position.y = .46;
  mesh(new THREE.CylinderGeometry(.035, .035, .1, 16), new THREE.MeshStandardMaterial({color: '#f3ead6', roughness: .6}), lantern).position.y = .08;
  const flame = mesh(new THREE.ConeGeometry(.012, .04, 8), new THREE.MeshBasicMaterial({color: '#ffcf70'}), lantern, {cast: false});
  flame.position.y = .155;
  // The candle's glow is a soft additive halo, not a light: adding a light
  // makes the phone rebuild the shading of everything in the room (a
  // freeze of several seconds on an iPhone).
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: canvasTexture(64, 64, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,200,120,1)'); grd.addColorStop(.35, 'rgba(255,170,80,.45)'); grd.addColorStop(1, 'rgba(255,150,60,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }), color: '#ffffff', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .3}));
  halo.scale.setScalar(.7);
  halo.position.y = .17;
  add(halo, lantern);
  room.thanksgivingCandle = halo;
  room.thanksgivingFlame = flame;
  made = out.thanksgiving;
  const gourd = mesh(lathe([[0, 0], [.06, .005], [.11, .05], [.12, .1], [.09, .17], [.05, .22], [.045, .28], [.035, .32], [0, .33]], 28), new THREE.MeshStandardMaterial({map: T.gourd, roughness: .5}), st);
  gourd.position.set(.15, .34, .05); gourd.rotation.z = .08;
  mesh(new THREE.CylinderGeometry(.008, .012, .07, 6), new THREE.MeshStandardMaterial({color: '#5a3e22'}), st).position.set(.15, .7, .05);

  // --- Pinecone basket on the floor beside the fountain.
  const bg = add(new THREE.Group(), room.group);
  bg.position.set(3.4, 0, .45);
  mesh(lathe([[0, 0], [.27, 0], [.31, .05], [.33, .28], [.31, .3], [0, .3]], 32), M.jute, bg);
  for (const s of [-1, 1]) { const h = mesh(new THREE.TorusGeometry(.07, .018, 6, 14, Math.PI), M.jute, bg); h.position.set(s * .3, .3, 0); h.rotation.y = Math.PI / 2; }
  const coneMat = new THREE.MeshStandardMaterial({color: '#6d4a2c', roughness: .9});
  for (let i = 0; i < 7; i++) {
    const geo = new THREE.ConeGeometry(.07, .17, 10, 5), p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const y = p.getY(k), s = 1 + .18 * Math.sin(y * 70); p.setX(k, p.getX(k) * s); p.setZ(k, p.getZ(k) * s); }
    geo.computeVertexNormals();
    const c = mesh(geo, coneMat, bg);
    const a = i / 7 * Math.PI * 2;
    c.position.set(Math.cos(a) * .16 * (i ? 1 : 0), .32 + (i ? 0 : .06), Math.sin(a) * .16 * (i ? 1 : 0));
    c.rotation.set(Math.PI / 2 + (r() - .5) * .8, r() * 6, (r() - .5) * .8);
  }

  // --- Olive piping round the bed's rim (following its lower front) and
  // its base.
  made = out.shared;
  const R = room.bedR, olive = new THREE.MeshStandardMaterial({color: '#6c7444', roughness: .8}), rim = [];
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * Math.PI * 2, rr = R - .1, x = rr * Math.sin(a), z = rr * Math.cos(a);
    const front = Math.pow(Math.max(0, Math.cos(a)), 3);
    rim.push(new THREE.Vector3(x, .16 + (.452 - .16) * (1 - .55 * front), z));
  }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 128, .022, 8, true), olive, room.bed);
  const foot = mesh(new THREE.TorusGeometry(R + .012, .02, 8, 64), olive, room.bed);
  foot.rotation.x = Math.PI / 2; foot.position.y = .025;

  // --- One oak leaf blown onto the rug.
  made = out.thanksgiving;
  const leaf = mesh(new THREE.PlaneGeometry(.2, .2), oakMat, room.group, {cast: false});
  leaf.rotation.set(-Math.PI / 2, 0, .9);
  leaf.position.set(.95, .041, 1.15);
  room.rugLeaf = leaf;
  return out;
}

function pumpkinGeometry(rad, height) {
  const geo = new THREE.SphereGeometry(rad, 40, 24), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), a = Math.atan2(vz, vx);
    const rib = 1 - .08 * Math.pow(Math.abs(Math.sin(a * 4)), .6) * (1 - Math.abs(vy / rad));
    const squash = vy > 0 ? 1 - .25 * Math.pow(Math.max(0, 1 - Math.hypot(vx, vz) / rad), 2) : 1;
    p.setXYZ(i, vx * rib, vy * (height / rad) * squash, vz * rib);
  }
  geo.computeVertexNormals();
  return geo;
}
const pumpkinStem = rad => { const g = new THREE.CylinderGeometry(rad * .07, rad * .1, rad * .5, 8); g.rotateZ(-.25); return g; };

// Halloween's own pieces: two glowing jack-o'-lanterns on the left of the
// sill, three paper bats on the window and the felt bat toy (it stands in
// for the ball; app.js moves it). The ghost cushion is the chair cushion's
// texture.
function buildHalloween(room) {
  const made = [], w = room.windowGroup, top = room.sillTop;
  const mesh = (geo, mat, parent, opts) => { const m = room.mesh(geo, mat, parent, opts); made.push(m); return m; };
  const stemMat = new THREE.MeshStandardMaterial({color: '#5d4a28', roughness: .8});
  room.halloweenGlow = [];
  const jack = (x, z, rad, height, base, sleepy, turn) => {
    const opts = {base, sleepy};
    const mat = new THREE.MeshStandardMaterial({
      map: canvasTexture(256, 128, (g, cw, ch) => drawJack(g, cw, ch, opts)),
      emissiveMap: canvasTexture(256, 128, (g, cw, ch) => drawJack(g, cw, ch, {...opts, glow: true})),
      emissive: '#ffad4a', emissiveIntensity: .6, roughness: .7,
    });
    const body = mesh(pumpkinGeometry(rad, height), mat, w);
    body.position.set(x, top + height, z); body.rotation.y = turn;
    mesh(pumpkinStem(rad), stemMat, w).position.set(x + rad * .05, top + height * 2 + rad * .15, z);
    room.halloweenGlow.push(mat);
  };
  jack(-1.17, .4, .25, .2, '#d98b45', false, -.15);
  jack(-.78, .64, .18, .14, '#efe5d2', true, .1);
  // Paper bats taped to the glass, upper right.
  const batMat = new THREE.MeshStandardMaterial({map: canvasTexture(128, 64, drawPaperBat), color: '#38332f', alphaTest: .5, side: THREE.DoubleSide, roughness: 1});
  const glassBottom = top - .02, h = 2.88;
  for (const [x, y, size, rot] of [[.36, .5, .45, .12], [.74, .44, .36, -.18], [.52, .35, .3, .05]]) {
    const b = mesh(new THREE.PlaneGeometry(size, size / 2), batMat, w, {cast: false, receive: false});
    b.position.set(x, glassBottom + h * y, .035); b.rotation.z = rot;
  }
  // The felt bat toy: a round charcoal felt body, little ears and scalloped
  // wings, about 14 cm across.
  const felt = new THREE.MeshStandardMaterial({map: canvasTexture(128, 128, (g, cw, ch) => drawNoise(g, cw, ch, {base: '#46403a', blobs: [['rgba(255,255,255,.06)', 900, 1, 2.5], ['rgba(0,0,0,.12)', 900, 1, 2.5]], seed: 61})), roughness: 1, side: THREE.DoubleSide});
  const bat = new THREE.Group();
  room.group.add(bat); made.push(bat);
  const body = room.mesh(new THREE.SphereGeometry(.075, 20, 14), felt, bat);
  body.position.y = .075; body.scale.set(1, .95, .9);
  for (const sx of [-1, 1]) {
    const ear = room.mesh(new THREE.ConeGeometry(.022, .05, 8), felt, bat);
    ear.position.set(sx * .035, .145, 0); ear.rotation.z = -sx * .25;
    const wing = new THREE.Shape();
    wing.moveTo(0, 0); wing.quadraticCurveTo(.06, .07, .13, .06);
    for (let i = 0; i < 3; i++) { const x = .13 - i * .045; wing.quadraticCurveTo(x - .015, .015, x - .045, i === 2 ? -.02 : .02); }
    wing.lineTo(0, -.03); wing.closePath();
    const wm = room.mesh(new THREE.ShapeGeometry(wing, 6), felt, bat);
    wm.position.set(sx * .055, .085, -.01); wm.scale.x = sx; wm.rotation.y = sx * .35;
    const eye = room.mesh(new THREE.SphereGeometry(.009, 8, 6), new THREE.MeshStandardMaterial({color: '#0d0b0a', roughness: .2}), bat);
    eye.position.set(sx * .024, .088, .066);
  }
  bat.visible = false;
  room.feltBat = bat;
  return made;
}
