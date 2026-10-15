// Mochi's kitchen: the second room she can explore, from Orion's approved
// design (an eclectic, collected open kitchen). Warm ivory plaster, pale
// limestone floor, tall black steel windows onto an olive garden, dark walnut
// lower cabinets under a cream stone counter, two brushed steel open shelves,
// a big rounded island in veined cream-and-brown stone with walnut-and-leather
// stools, and a sculptural brass mobile light. Through the opening on the
// right, a glimpse of the living room (to be explored later).
// Mochi's own corner: a canvas tent bed, her fountain and bowl, and a robot
// vacuum on its dock.
//
// Built the first time she visits. The things she'll play with (cups and
// plates on the shelves, the orchid, the plate of food, the vacuum) are kept
// as separate objects with their home positions, apart from the room itself.
// Same scale as the study: about 2.4 scene units per metre.
import * as THREE from 'three';
import {Room, rng, canvasTexture, drawNoise, drawLinen, drawWood, roundedBox, lathe} from './room.js';

const {damp} = THREE.MathUtils;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// The plan. Back wall at z = -4.2, window wall at x = -6, right wall at x = 7,
// with the opening to the living room in the back wall between x = 3.8 and 6.2.
const K = {
  back: -4.2, left: -6, right: 7, door: [3.8, 6.2], doorTop: 5.4, wallH: 9.5,
  counter: 2.2, counterFront: -2.72, shelf1: 4.1, shelf2: 5.5, shelfX: [-5.2, 3.4], shelfD: .62,
  island: {x0: -3.9, x1: 1.5, z0: -.55, z1: 1.95, top: 2.25},
  tent: {x: 4.75, z: .75, ry: -.45},
};
// Where she may walk: the open floor, keeping clear of the island.
const FLOOR = {x0: -5.3, x1: 6.3, z0: -2.3, z1: 4.3};
const KEEP_OUT = {x0: K.island.x0 - .5, x1: K.island.x1 + .5, z0: K.island.z0 - .5, z1: K.island.z1 + .5};

export class Kitchen {
  constructor(scene, room) {
    this.scene = scene;
    this.room = room;
    this.id = 'kitchen';
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.clickables = [];
    this.walls = [];
    // Things Mochi will play with, each remembering where it belongs.
    this.props = {cups: [], plates: [], glasses: []};
    this.build();
  }

  // The bird: the same visitor as in the study's window.
  startBird(t, kind) { return Room.prototype.startBird.call(this, t, kind); }
  birdWorld(v) { return Room.prototype.birdWorld.call(this, v); }

  mesh(geo, material, parent = this.group, {cast = true, receive = true} = {}) {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = cast; m.receiveShadow = receive;
    parent.add(m);
    return m;
  }
  box(w, h, d, x, y, z, material, parent = this.group, opts) {
    const m = this.mesh(new THREE.BoxGeometry(w, h, d), material, parent, opts);
    m.position.set(x, y, z);
    return m;
  }
  // A movable prop: remembers its home so it can be put back.
  prop(obj, list) {
    obj.userData.home = {p: obj.position.clone(), r: obj.rotation.clone(), parent: obj.parent};
    list?.push(obj);
    return obj;
  }

  build() {
    const M = this.materials = {
      floor: new THREE.MeshStandardMaterial({map: canvasTexture(1024, 1024, drawLimestone, {repeat: [7.5, 7.5]}), roughness: .55}),
      plaster: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, (g, w, h) => drawNoise(g, w, h, {base: '#efe3d0', blobs: [['rgba(255,250,240,.06)', 260, 20, 90], ['rgba(160,125,85,.035)', 220, 20, 80]], seed: 31}), {repeat: [3, 3]}), roughness: .95}),
      walnut: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, (g, w, h) => { g.translate(w, 0); g.rotate(Math.PI / 2); drawWood(g, w, h, {planks: 5, colors: ['#4b2e1c', '#563522', '#45291a', '#5c3b25'], seed: 41, grain: 40}); }), roughness: .5}),
      walnutDark: new THREE.MeshStandardMaterial({color: '#2b1a10', roughness: .7}),
      stone: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, drawBreccia), roughness: .3}),
      counter: new THREE.MeshStandardMaterial({map: canvasTexture(512, 512, drawCreamStone, {repeat: [.3, .3]}), roughness: .35}),
      steel: new THREE.MeshStandardMaterial({color: '#cfd0cc', metalness: .85, roughness: .32}),
      steelDark: new THREE.MeshStandardMaterial({color: '#8e8f8c', metalness: .8, roughness: .4}),
      iron: new THREE.MeshStandardMaterial({color: '#211e1b', metalness: .55, roughness: .45}),
      frame: new THREE.MeshStandardMaterial({color: '#1d1c1a', metalness: .3, roughness: .5}),
      brass: new THREE.MeshStandardMaterial({color: '#b58a3c', metalness: .85, roughness: .3}),
      ivory: new THREE.MeshStandardMaterial({color: '#efe7d8', roughness: .45}),
      cream: new THREE.MeshStandardMaterial({color: '#e2d6c2', roughness: .6}),
      clay: new THREE.MeshStandardMaterial({color: '#c9a98a', roughness: .8}),
      amber: new THREE.MeshStandardMaterial({color: '#c98634', transparent: true, opacity: .62, roughness: .12}),
      cobalt: new THREE.MeshPhysicalMaterial({color: '#1d3a9e', roughness: .18, clearcoat: .8}),
      canvas: new THREE.MeshStandardMaterial({map: canvasTexture(256, 256, (g, w, h) => drawLinen(g, w, h, {base: '#efe6d6', dark: .06, seed: 43}), {repeat: [2, 2]}), roughness: 1, side: THREE.DoubleSide}),
      olive: this.room.materials.oliveLinen,
      leather: this.room.materials.leather,
      jute: this.room.materials.jute,
      leaf: this.room.materials.leaf,
      shade: new THREE.MeshStandardMaterial({color: '#f3eadb', emissive: '#ffe2b0', emissiveIntensity: .3, roughness: .6, side: THREE.DoubleSide}),
    };
    // Large stone pieces: their UVs run in scene units, so stretch the pattern.
    M.stone.map.repeat.set(.22, .22);
    this.buildShell();
    this.buildWindows();
    this.buildLivingRoom();
    this.buildCounter();
    this.buildShelves();
    this.buildIsland();
    this.buildMobile();
    this.buildStools();
    this.buildTent();
    this.buildPainting();
    this.buildVacuum();
    this.buildSunPatch();
  }

  // Floor, plaster walls and the opening to the living room.
  buildShell() {
    const M = this.materials;
    const floor = this.mesh(new THREE.PlaneGeometry(60, 60), M.floor, this.group, {cast: false});
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.002;
    // A wall panel; it hides when the camera swings round behind it.
    const wall = (w, h, x, y, z, ry, parent = this.group) => {
      const m = this.mesh(new THREE.PlaneGeometry(w, h), M.plaster, parent, {cast: false});
      m.position.set(x, y, z); m.rotation.y = ry;
      this.walls.push(m);
      return m;
    };
    const [d0, d1] = K.door, H = K.wallH;
    wall(d0 - K.left, H, (K.left + d0) / 2, H / 2, K.back, 0);
    wall(d1 - d0, H - K.doorTop, (d0 + d1) / 2, (H + K.doorTop) / 2, K.back, 0);
    wall(K.right - d1, H, (d1 + K.right) / 2, H / 2, K.back, 0);
    wall(14, H, K.right, H / 2, 2.8, -Math.PI / 2);
    // The window wall: plaster round the tall window.
    const wz0 = -3.7, wz1 = 3.9, wy0 = 0, wy1 = 8.0;
    wall(wz0 - K.back, H, K.left, H / 2, (K.back + wz0) / 2, Math.PI / 2);
    wall(11.5 - wz1, H, K.left, H / 2, (wz1 + 11.5) / 2, Math.PI / 2);
    wall(wz1 - wz0, H - wy1, K.left, (H + wy1) / 2, (wz0 + wz1) / 2, Math.PI / 2);
    this.windowRect = {z0: wz0, z1: wz1, y0: wy0, y1: wy1};
    // Deep plaster reveals round the opening.
    const T = .45;
    const reveal = M.plaster.clone(); reveal.color.set('#d9cab2');
    for (const x of [d0, d1]) { const r = this.mesh(new THREE.PlaneGeometry(T, K.doorTop), reveal, this.group, {cast: false}); r.position.set(x, K.doorTop / 2, K.back - T / 2); r.rotation.y = x === d0 ? Math.PI / 2 : -Math.PI / 2; }
    const soffit = this.mesh(new THREE.PlaneGeometry(d1 - d0, T), reveal, this.group, {cast: false});
    soffit.position.set((d0 + d1) / 2, K.doorTop, K.back - T / 2); soffit.rotation.x = Math.PI / 2;
    // A slim limestone skirting.
    const skirt = new THREE.MeshStandardMaterial({color: '#d8ccb6', roughness: .6});
    this.box(d0 - K.left, .14, .04, (K.left + d0) / 2, .07, K.back + .02, skirt, this.group, {cast: false});
    this.box(.04, .14, 14, K.right - .02, .07, 2.8, skirt, this.group, {cast: false});
  }

  // Floor-to-ceiling black steel glazing with a pair of garden doors in the
  // middle, onto a terrace with olive trees in pots and, beyond the dunes,
  // the sea. The bird visits here too.
  buildWindows() {
    const M = this.materials, {z0, z1, y0, y1} = this.windowRect, x = K.left + .02;
    this.view = {day: canvasTexture(600, 640, (g, w, h) => drawTerrace(g, w, h, false)), night: canvasTexture(600, 640, (g, w, h) => drawTerrace(g, w, h, true))};
    this.glass = this.mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), new THREE.MeshBasicMaterial({map: this.view.day, toneMapped: false}), this.group, {cast: false, receive: false});
    this.glass.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2); this.glass.rotation.y = Math.PI / 2;
    const zc = (z0 + z1) / 2, H = y1 - y0, T = 6.5;
    const v = (w, y0b, y1b, z) => this.box(.12, y1b - y0b, w, x + .04, (y0b + y1b) / 2, z, M.frame, this.group, {cast: false});
    const hz = (w, y, za, zb) => this.box(.12, w, zb - za, x + .04, y, (za + zb) / 2, M.frame, this.group, {cast: false});
    // Four bays: fixed glass either side, two door leaves in the middle,
    // under a transom.
    const bay = (z1 - z0) / 4, a = z0 + bay, c = z1 - bay, b = zc;
    for (const z of [z0, z1]) v(.16, y0, y1, z);
    for (const z of [a, c]) v(.14, y0, y1, z);
    v(.1, y0, T, b);
    hz(.16, y1, z0, z1); hz(.12, y0 + .06, z0, z1); hz(.14, T, z0, z1);
    // Glazing bars: two columns in the side bays, one in each door leaf;
    // four rows below the transom, and four panes above it.
    for (const [za, zb, cols] of [[z0, a, 2], [a, b, 1], [b, c, 1], [c, z1, 2]]) {
      for (let i = 1; i < cols; i++) v(.05, y0, T, za + (zb - za) * i / cols);
      for (let j = 1; j < 4; j++) hz(.05, y0 + (T - y0) * j / 4, za, zb);
      v(.05, T, y1, (za + zb) / 2);
    }
    // Door handles: slim black levers at the meeting stiles.
    for (const s of [-1, 1]) { const h = this.box(.06, .05, .28, x + .14, 3.0, b + s * .2, M.frame, this.group, {cast: false}); h.rotation.x = .1; }
    // The bird's window: a frame of reference along the glass (x along it,
    // y up, z into the room), as in the study.
    const wg = new THREE.Group(); wg.position.set(x + .02, 0, zc); wg.rotation.y = Math.PI / 2; this.group.add(wg);
    this.windowGroup = wg;
    Room.prototype.buildBird.call(this, wg, z1 - z0 - 1.2, 2.0, 4.4);
    // Perched on a glazing bar at about Mochi's eye level from the counter.
    this.birdBox.mid = y0 + (T - y0) * 2 / 4 + .06;
  }

  // Through the opening: a glimpse of the living room (explorable later).
  buildLivingRoom() {
    const M = this.materials, g = new THREE.Group();
    this.livingRoom = g;
    this.group.add(g);
    const L = {x0: K.door[0], x1: 12.5, z0: -11, z1: K.back - .45};
    // A touch dimmer and warmer than the kitchen, so the opening reads as a
    // room beyond, out of the window light.
    const plaster = M.plaster.clone(); plaster.color.set('#cdbda4');
    const wall = (w, h, x, y, z, ry) => { const m = this.mesh(new THREE.PlaneGeometry(w, h), plaster, g, {cast: false}); m.position.set(x, y, z); m.rotation.y = ry; return m; };
    const dim = this.mesh(new THREE.PlaneGeometry(L.x1 - L.x0, L.z1 - L.z0 + .45), new THREE.MeshBasicMaterial({color: '#2a1d12', transparent: true, opacity: .2, depthWrite: false}), g, {cast: false, receive: false});
    dim.rotation.x = -Math.PI / 2; dim.position.set((L.x0 + L.x1) / 2, .006, (L.z0 + L.z1 + .45) / 2);
    wall(L.x1 - L.x0, K.wallH, (L.x0 + L.x1) / 2, K.wallH / 2, L.z0, 0);
    wall(L.z1 - L.z0, K.wallH, L.x0, K.wallH / 2, (L.z0 + L.z1) / 2, Math.PI / 2);
    wall(L.z1 - L.z0, K.wallH, L.x1, K.wallH / 2, (L.z0 + L.z1) / 2, -Math.PI / 2);
    // A tall window onto the garden, at the far end.
    const glass = this.mesh(new THREE.PlaneGeometry(2.4, 5.6), new THREE.MeshBasicMaterial({map: this.view.day, toneMapped: false}), g, {cast: false, receive: false});
    glass.position.set(10.2, 3.6, L.z0 + .02);
    this.livingGlass = glass;
    for (const dx of [-1.25, 1.25]) this.box(.1, 5.8, .12, 10.2 + dx, 3.6, L.z0 + .05, M.frame, g, {cast: false});
    for (const y of [.8, 6.4]) this.box(2.6, .1, .12, 10.2, y, L.z0 + .05, M.frame, g, {cast: false});
    // A deep, cream sofa against the far wall, with an olive cushion.
    const sofaMat = new THREE.MeshStandardMaterial({map: canvasTexture(256, 256, (c, w, h) => drawLinen(c, w, h, {base: '#ece4d6', dark: .05, seed: 47})), roughness: 1});
    const sofa = new THREE.Group(); sofa.position.set(6.6, 0, L.z0 + 1.1); g.add(sofa);
    this.mesh(roundedBox(4.6, .9, 2.0, .2), sofaMat, sofa).position.set(0, .55, 0);
    this.mesh(roundedBox(4.6, 1.2, .6, .25), sofaMat, sofa).position.set(0, 1.3, -.7);
    for (const s of [-1, 1]) this.mesh(roundedBox(.55, 1.15, 2.0, .25), sofaMat, sofa).position.set(s * 2.3, .85, 0);
    for (const s of [-1, 1]) this.mesh(roundedBox(1.9, .35, 1.4, .15), sofaMat, sofa).position.set(s * 1.0, 1.15, .1);
    const pillow = this.mesh(roundedBox(.9, .75, .25, .12), M.olive, sofa); pillow.position.set(-1.3, 1.55, -.3); pillow.rotation.z = .1;
    // Jute rug, a low walnut table with a bowl, a floor lamp and an olive tree.
    this.mesh(roundedBox(5.5, .03, 3.8, .01), M.jute, g, {cast: false}).position.set(6.8, .015, L.z0 + 3.4);
    const table = this.mesh(lathe([[0, 0], [.9, 0], [.9, .5], [.95, .52], [.95, .6], [0, .6]], 32), M.walnut, g);
    table.position.set(6.8, 0, L.z0 + 3.5);
    this.mesh(lathe([[0, 0], [.18, .02], [.3, .12], [.32, .16], [0, .16]], 24), M.cream, g).position.set(6.8, .6, L.z0 + 3.5);
    const lamp = new THREE.Group(); lamp.position.set(9.8, 0, L.z0 + 1.0); g.add(lamp);
    this.mesh(new THREE.CylinderGeometry(.03, .03, 3.6, 8), M.brass, lamp).position.y = 1.8;
    this.mesh(new THREE.CylinderGeometry(.28, .3, .04, 24), M.brass, lamp).position.y = .02;
    this.livingShade = this.mesh(lathe([[.18, 0], [.45, 0], [.3, .55], [.12, .55]], 24), M.shade, lamp, {cast: false});
    this.livingShade.position.y = 3.3;
    // A painting over the sofa: soft earthy bands.
    const art = this.mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshStandardMaterial({map: canvasTexture(256, 180, drawEarthBands), roughness: .9}), g, {cast: false});
    art.position.set(6.6, 4.4, L.z0 + .06);
    this.box(2.7, 1.9, .05, 6.6, 4.4, L.z0 + .01, M.walnutDark, g, {cast: false});
    const pot = this.mesh(lathe([[0, 0], [.4, 0], [.5, .7], [.46, .74], [0, .74]], 24), M.clay, g);
    pot.position.set(4.6, 0, L.z0 + .9);
    this.room.ivy(g, new THREE.Vector3(4.6, .72, L.z0 + .9), 10, 1.6, true);
  }

  // The back counter: walnut cabinets, a cream stone top, the sink with its
  // brass faucet, the range, and a stepping perch at the far left.
  buildCounter() {
    const M = this.materials, C = K.counter, zb = K.back, zf = K.counterFront, depth = zf - zb;
    const g = new THREE.Group(); this.group.add(g); this.counterGroup = g;
    const sections = [[-5.1, .3], [2.5, 3.6]];
    for (const [a, b] of sections) {
      this.box(b - a, C - .38, depth, (a + b) / 2, .2 + (C - .38) / 2, zb + depth / 2, M.walnut, g);
      this.box(b - a - .1, .2, depth - .12, (a + b) / 2, .1, zb + (depth - .12) / 2, M.walnutDark, g, {cast: false});
      // Door and drawer fronts with slim brass pulls.
      const n = Math.max(1, Math.round((b - a) / 1.1)), w = (b - a) / n;
      for (let i = 0; i < n; i++) {
        const cx = a + w * (i + .5);
        const drawer = this.mesh(roundedBox(w - .06, .5, .05, .01), M.walnut, g); drawer.position.set(cx, C - .48, zf + .02);
        const door = this.mesh(roundedBox(w - .06, C - .98, .05, .01), M.walnut, g); door.position.set(cx, .2 + (C - .98) / 2 + .02, zf + .02);
        this.box(.42, .03, .04, cx, C - .4, zf + .07, M.brass, g, {cast: false});
        this.box(.03, .4, .04, cx + (i % 2 ? -1 : 1) * (w / 2 - .15), 1.3, zf + .07, M.brass, g, {cast: false});
      }
    }
    // Stone top in pieces round the sink.
    const top = (a, b, z0 = zb, z1 = zf + .06) => this.box(b - a, .18, z1 - z0, (a + b) / 2, C - .09, (z0 + z1) / 2, M.counter, g);
    const sink = {x0: -2.85, x1: -1.35, z0: -3.85, z1: -3.05};
    top(-5.15, sink.x0); top(sink.x1, .3); top(2.5, 3.65);
    top(sink.x0, sink.x1, zb, sink.z0); top(sink.x0, sink.x1, sink.z1, zf + .06);
    // Brushed steel basin.
    const bw = sink.x1 - sink.x0, bd = sink.z1 - sink.z0, by = C - .45;
    this.box(bw, .02, bd, (sink.x0 + sink.x1) / 2, by, (sink.z0 + sink.z1) / 2, M.steelDark, g, {cast: false});
    for (const [w, d, x, z] of [[bw, .02, (sink.x0 + sink.x1) / 2, sink.z0], [bw, .02, (sink.x0 + sink.x1) / 2, sink.z1], [.02, bd, sink.x0, (sink.z0 + sink.z1) / 2], [.02, bd, sink.x1, (sink.z0 + sink.z1) / 2]]) this.box(w, .45, d, x, by + .22, z, M.steel, g, {cast: false});
    this.sink = {x: (sink.x0 + sink.x1) / 2, z: (sink.z0 + sink.z1) / 2, y: by};
    // Brass gooseneck faucet and lever.
    const fx = this.sink.x, fz = zb + .28;
    this.mesh(new THREE.CylinderGeometry(.06, .07, .1, 16), M.brass, g).position.set(fx, C + .05, fz);
    const neck = new THREE.CatmullRomCurve3([V(fx, C, fz), V(fx, C + .7, fz), V(fx, C + 1.0, fz + .15), V(fx, C + .95, fz + .45), V(fx, C + .7, fz + .55)]);
    this.mesh(new THREE.TubeGeometry(neck, 24, .035, 10), M.brass, g);
    this.faucetTip = V(fx, C + .68, fz + .55);
    const lever = this.mesh(new THREE.CylinderGeometry(.018, .018, .3, 8), M.brass, g); lever.position.set(fx + .14, C + .3, fz); lever.rotation.z = -1.1;
    // The range: brushed steel with black grates, knobs and an oven door.
    const rx0 = .3, rx1 = 2.5, rw = rx1 - rx0, rc = (rx0 + rx1) / 2;
    this.box(rw, C - .02, depth, rc, (C - .02) / 2, zb + depth / 2, M.steel, g);
    this.box(rw - .3, 1.05, .04, rc, .78, zf + .03, M.steelDark, g, {cast: false});
    const handle = this.mesh(new THREE.CylinderGeometry(.03, .03, rw - .5, 10), M.steel, g); handle.rotation.z = Math.PI / 2; handle.position.set(rc, 1.42, zf + .14);
    for (let i = 0; i < 6; i++) { const k = this.mesh(new THREE.CylinderGeometry(.06, .06, .07, 14), M.iron, g); k.rotation.x = Math.PI / 2; k.position.set(rx0 + .3 + i * (rw - .6) / 5, 1.82, zf + .05); }
    for (const [x, z] of [[rx0 + .55, -3.2], [rx1 - .55, -3.2], [rx0 + .55, -3.8], [rx1 - .55, -3.8]]) {
      this.box(.9, .05, .55, x, C + .02, z, M.iron, g, {cast: false});
      this.mesh(new THREE.CylinderGeometry(.12, .14, .05, 16), M.iron, g, {cast: false}).position.set(x, C + .05, z);
    }
    this.box(rw, .3, .06, rc, C + .15, zb + .03, M.steel, g, {cast: false});
    this.range = {x0: rx0, x1: rx1};
    // Brass pot filler on the wall above the range.
    const pf = new THREE.CatmullRomCurve3([V(rc, 3.4, zb + .02), V(rc, 3.4, zb + .25), V(rc + .5, 3.4, zb + .3)]);
    this.mesh(new THREE.TubeGeometry(pf, 10, .035, 8), M.brass, g);
    this.mesh(new THREE.CylinderGeometry(.03, .03, .2, 8), M.brass, g).position.set(rc + .5, 3.3, zb + .3);
    // Odds and ends on the counter, clear of her climbing route at the left
    // end: a crock of wooden spoons, a little olive in a pot, bottles, and a
    // brass mushroom lamp at the right.
    const crock = new THREE.Group(); crock.position.set(2.95, C, -3.75); g.add(crock);
    this.mesh(lathe([[0, 0], [.17, 0], [.18, .38], [.16, .4], [0, .4]], 20), M.cream, crock);
    for (let i = 0; i < 4; i++) { const s = this.mesh(new THREE.CylinderGeometry(.015, .02, .75, 6), M.walnut, crock); s.position.set((i - 1.5) * .05, .55, (i % 2) * .05); s.rotation.z = (i - 1.5) * .12; }
    const pot = this.mesh(lathe([[0, 0], [.14, 0], [.18, .25], [0, .25]], 20), M.clay, g); pot.position.set(-.55, C, -3.85);
    this.room.sprigs(g, new THREE.Vector3(-.55, C + .25, -3.85), 7, .6, {stem: '#66704a'});
    for (const [x, h, c] of [[2.65, .55, '#3e4a2c'], [2.75, .45, '#7a4a1e']]) this.mesh(lathe([[0, 0], [.07, 0], [.07, h * .7], [.03, h * .85], [.03, h], [0, h]], 14), new THREE.MeshStandardMaterial({color: c, roughness: .2}), g).position.set(x, C, -4.0);
    const lampG = new THREE.Group(); lampG.position.set(3.35, C, -3.9); g.add(lampG);
    this.mesh(lathe([[0, 0], [.13, 0], [.1, .05], [.03, .1], [.03, .55], [0, .55]], 16), M.brass, lampG);
    this.counterLamp = this.mesh(new THREE.SphereGeometry(.24, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.shade, lampG, {cast: false});
    this.counterLamp.position.y = .55;
    // Her steps: floating walnut blocks on the wall at the left end, rising
    // in a zig-zag with the counter and the shelves, so she can climb all
    // the way up: floor, step, counter, step, lower shelf, step, top shelf.
    this.steps = [1.15, 3.05, 4.85].map(top => {
      const st = this.box(.62, .14, .66, -5.6, top - .07, zb + .33, M.walnut, this.group);
      this.box(.06, .3, .5, -5.6, top - .29, zb + .27, M.walnutDark, this.group, {cast: false});
      return st;
    });
    this.step = this.steps[0];
    this.stepTops = [1.15, 3.05, 4.85];
  }

  // Two long brushed steel shelves, styled, with clear places to land.
  buildShelves() {
    const M = this.materials, [x0, x1] = K.shelfX, zc = K.back + K.shelfD / 2;
    this.shelves = [];
    for (const y of [K.shelf1, K.shelf2]) {
      const s = this.box(x1 - x0, .09, K.shelfD, (x0 + x1) / 2, y - .045, zc, M.steel);
      this.shelves.push(s);
      for (const bx of [x0 + .6, (x0 + x1) / 2, x1 - .6]) this.box(.04, .28, K.shelfD - .1, bx, y - .23, zc - .03, M.steel, this.group, {cast: false});
    }
    const S1 = K.shelf1, S2 = K.shelf2, z = zc + .02;
    // Separate, movable pieces.
    const cup = (x, y, zz, mat = M.ivory) => {
      const c = new THREE.Group(); c.position.set(x, y, zz); this.group.add(c);
      this.mesh(lathe([[0, 0], [.07, 0], [.09, .02], [.1, .16], [.095, .17], [0, .17]], 18), mat, c);
      const h = this.mesh(new THREE.TorusGeometry(.045, .012, 6, 12), mat, c); h.position.set(.11, .09, 0); h.rotation.y = Math.PI / 2;
      return this.prop(c, this.props.cups);
    };
    const plate = (x, y, zz, r = .26) => {
      const p = this.mesh(lathe([[0, 0], [r * .55, 0], [r, .03], [r * 1.02, .04], [0, .02]], 28), M.ivory, this.group);
      p.position.set(x, y, zz); return this.prop(p, this.props.plates);
    };
    const glass = (x, y, zz) => {
      const gl = this.mesh(lathe([[0, 0], [.075, 0], [.085, .22], [.08, .22], [.07, .01], [0, .01]], 16), M.amber, this.group, {cast: false});
      gl.position.set(x, y, zz); return this.prop(gl, this.props.glasses);
    };
    const bowl = (x, y, zz, r = .22, mat = M.cream) => { const b = this.mesh(lathe([[0, 0], [r * .5, 0], [r, r * .55], [r * .95, r * .56], [r * .45, r * .05], [0, r * .05]], 24), mat, this.group); b.position.set(x, y, zz); return b; };
    const frame = (x, y, zz, w, h, tint) => {
      const f = new THREE.Group(); f.position.set(x, y, zz - .1); f.rotation.x = -.08; this.group.add(f);
      this.mesh(roundedBox(w, h, .04, .01), M.walnutDark, f).position.y = h / 2;
      const pic = this.mesh(new THREE.PlaneGeometry(w * .78, h * .78), new THREE.MeshStandardMaterial({map: canvasTexture(64, 80, (g, cw, ch) => drawPhoto(g, cw, ch, tint)), roughness: .9}), f, {cast: false});
      pic.position.set(0, h / 2, .025);
    };
    // Lower shelf: landing room at the left; then plates, bowls, two cups,
    // a gap, amber glasses, a board, a framed photograph, a bowl.
    for (let i = 0; i < 5; i++) plate(-3.25, S1 + i * .045, z);
    bowl(-2.6, S1, z); bowl(-2.6, S1 + .1, z, .19);
    cup(-2.05, S1, z); cup(-1.75, S1, z + .05);
    for (const x of [.25, .48, .71]) glass(x, S1, z);
    const board = this.mesh(roundedBox(.5, .75, .05, .02), M.walnut, this.group); board.position.set(1.45, S1 + .37, K.back + .1); board.rotation.x = -.12;
    frame(2.3, S1, z + .1, .5, .62, '#c9b79a');
    bowl(3.0, S1, z, .24, M.clay);
    // Upper shelf: landing room at the left; a trailing plant, a print, the
    // cobalt vessel, plates, cups, books and another plant.
    const p1 = this.mesh(lathe([[0, 0], [.13, 0], [.16, .22], [0, .22]], 18), M.cream, this.group); p1.position.set(-3.25, S2, z);
    this.room.ivy(this.group, new THREE.Vector3(-3.25, S2 + .2, z), 6, .9, false);
    frame(-2.45, S2, z + .1, .55, .7, '#a9a291');
    const vessel = this.mesh(lathe([[0, 0], [.14, 0], [.28, .18], [.3, .34], [.2, .5], [.12, .56], [.13, .6], [0, .6]], 28), M.cobalt, this.group);
    vessel.position.set(-1.6, S2, z);
    for (let i = 0; i < 4; i++) plate(-.65, S2 + i * .045, z, .24);
    cup(.05, S2, z, M.cream); cup(.35, S2, z + .04, M.cream);
    const bookColors = ['#6b4a2e', '#cdbb98', '#3c4a3a', '#8a6a46', '#e3d8c3'];
    bookColors.forEach((c, i) => this.box(.08, .45 + (i % 3) * .05, .38, 1.4 + i * .09, S2 + .23 + (i % 3) * .025, z, new THREE.MeshStandardMaterial({color: c, roughness: .8})));
    const p2 = this.mesh(lathe([[0, 0], [.15, 0], [.18, .26], [0, .26]], 18), M.clay, this.group); p2.position.set(2.75, S2, z);
    this.room.ivy(this.group, new THREE.Vector3(2.75, S2 + .24, z), 7, 1.1, false);
  }

  // The island: a big, rounded block of veined stone with a walnut base
  // under the overhang where the stools tuck in. No sink on top.
  buildIsland() {
    const M = this.materials, I = K.island, w = I.x1 - I.x0, d = I.z1 - I.z0, cx = (I.x0 + I.x1) / 2, cz = (I.z0 + I.z1) / 2;
    const g = new THREE.Group(); this.group.add(g); this.island = g;
    const slab = (sw, sd, sh, r, x, y, z, mat) => {
      const m = this.mesh(roundedSlab(sw, sd, sh, r), mat, g);
      m.position.set(x, y, z);
      return m;
    };
    const topH = .2, baseH = I.top - topH;
    slab(w, d, topH, .35, cx, baseH, cz, M.stone);
    // Stone block at the right end (waterfall on front, end and back) and a
    // slim stone leg at the left end.
    slab(1.5, d, baseH, .35, I.x1 - .75, 0, cz, M.stone);
    slab(.24, d, baseH, .1, I.x0 + .12, 0, cz, M.stone);
    // Walnut base, set back under the front overhang.
    this.box(I.x1 - 1.5 - (I.x0 + .24), baseH, d - .75, (I.x0 + .24 + I.x1 - 1.5) / 2, baseH / 2, I.z0 + (d - .75) / 2 + .02, M.walnut, g);
    // A white orchid at the left end of the island, a small plate of food at
    // the right.
    this.orchid = this.buildOrchid(I.x0 + .7, I.top, I.z0 + .75);
    const plate = new THREE.Group(); plate.position.set(I.x1 - .65, I.top, cz + .25); this.group.add(plate);
    this.mesh(lathe([[0, 0], [.18, 0], [.32, .03], [.33, .045], [0, .025]], 28), M.ivory, plate);
    const fish = this.mesh(roundedBox(.34, .07, .16, .03), new THREE.MeshStandardMaterial({map: canvasTexture(64, 32, drawSalmon), roughness: .5}), plate);
    fish.position.set(-.02, .065, 0); fish.rotation.y = .3;
    const herb = this.mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshStandardMaterial({color: '#5f7a3a', roughness: .8}), plate); herb.position.set(.13, .06, .08); herb.scale.y = .5;
    this.foodPlate = this.prop(plate);
  }

  buildOrchid(x, y, z) {
    const M = this.materials, g = new THREE.Group(); g.position.set(x, y, z); this.group.add(g);
    // A rough stone bowl.
    this.mesh(lathe([[0, 0], [.22, 0], [.36, .12], [.38, .3], [.34, .34], [0, .3]], 28), M.stone, g);
    const leafMat = new THREE.MeshStandardMaterial({color: '#3f5a2a', roughness: .5, side: THREE.DoubleSide});
    for (let i = 0; i < 4; i++) {
      const lf = this.mesh(new THREE.SphereGeometry(.22, 12, 6), leafMat, g, {cast: false});
      lf.scale.set(1, .1, .42); lf.position.set(Math.cos(i * 1.6) * .18, .34, Math.sin(i * 1.6) * .18); lf.rotation.y = -i * 1.6; lf.rotation.z = .25;
    }
    const stemMat = new THREE.MeshStandardMaterial({color: '#4c5a2e', roughness: .7});
    const petal = new THREE.MeshStandardMaterial({map: canvasTexture(64, 64, drawOrchidFlower), alphaTest: .4, side: THREE.DoubleSide, roughness: .6});
    this.orchidStems = [];
    for (const [ang, h, lean] of [[.4, 1.25, .5], [2.6, 1.05, .45], [4.4, 1.35, .35]]) {
      const stem = new THREE.Group(); stem.position.set(0, .3, 0); stem.rotation.y = ang; g.add(stem);
      const pts = [V(0, 0, 0), V(0, h * .6, .05), V(.08, h * .95, lean * .5), V(.14, h, lean)];
      this.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .012, 6), stemMat, stem, {cast: false});
      const curve = new THREE.CatmullRomCurve3(pts);
      for (let k = 0; k < 5; k++) {
        const p = curve.getPointAt(.62 + k * .09);
        const f = this.mesh(new THREE.PlaneGeometry(.2, .2), petal, stem, {cast: false});
        f.position.copy(p).add(V(0, -.04, .05)); f.rotation.set(-.2, (k - 2) * .25, (k % 2 - .5) * .3);
      }
      this.orchidStems.push(stem);
    }
    return this.prop(g);
  }

  // The mobile light: slender dark arms, aged brass joints, ivory shades,
  // airy and asymmetric, hanging over the island.
  buildMobile() {
    const M = this.materials, g = new THREE.Group(); this.group.add(g); this.mobile = g;
    const ix = (K.island.x0 + K.island.x1) / 2, iz = (K.island.z0 + K.island.z1) / 2;
    const arm = (a, b, r = .018) => {
      const v = new THREE.Vector3().subVectors(b, a), m = this.mesh(new THREE.CylinderGeometry(r, r, v.length(), 8), M.iron, g, {cast: false});
      m.position.copy(a).addScaledVector(v, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), v.normalize());
    };
    const joint = p => this.mesh(new THREE.SphereGeometry(.06, 12, 8), M.brass, g, {cast: false}).position.copy(p);
    const shade = (p, s = 1, tilt = 0) => {
      const m = this.mesh(new THREE.SphereGeometry(.5, 24, 12), M.shade, g, {cast: false});
      m.scale.set(1.1 * s, .38 * s, .8 * s); m.position.copy(p); m.rotation.z = tilt;
      return m;
    };
    const top = V(ix, K.wallH, iz), P = V(ix, 8.4, iz);
    this.mesh(new THREE.CylinderGeometry(.15, .15, .05, 16), M.brass, g, {cast: false}).position.set(ix, K.wallH - .03, iz);
    arm(top, P, .02); joint(P);
    const A = V(ix - 2.3, 8.15, iz - .2), B = V(ix + 1.6, 8.6, iz + .3);
    arm(P, A); arm(P, B); joint(A); joint(B);
    // Left: a long drop to a big shade.
    const a1 = V(A.x, 7.05, A.z); arm(A, a1, .012); this.shades = [shade(a1, 1.15, .12)];
    // Right: an arm out to a brass counterweight disc, with a shade hung
    // from its middle, and a short arm up to a small shade.
    const C = V(B.x + 1.2, 8.35, B.z + .35); arm(B, C); joint(C);
    const disc = this.mesh(new THREE.CylinderGeometry(.22, .22, .03, 24), M.brass, g, {cast: false}); disc.position.copy(C).add(V(.15, -.2, 0)); disc.rotation.z = Math.PI / 2;
    const mid = V(B.x + .5, 8.5, B.z + .15); joint(mid);
    const b1 = V(mid.x, 7.35, mid.z); arm(mid, b1, .012); this.shades.push(shade(b1, .95, -.1));
    const D = V(ix - .7, 8.95, iz - .4); arm(P, D); joint(D);
    const d1 = V(D.x - .1, 8.0, D.z); arm(D, d1, .012); this.shades.push(shade(d1, .75, .2));
    this.lampSpot = V(ix, 6.4, iz);
  }

  // Two walnut stools with cognac leather seats and brass foot bars.
  buildStools() {
    const M = this.materials;
    for (const x of [-3.0, -1.85]) {
      const g = new THREE.Group(); g.position.set(x, 0, K.island.z1 + .45); this.group.add(g);
      const seat = this.mesh(new THREE.CylinderGeometry(.42, .36, .14, 28), M.leather, g); seat.position.y = 1.62; seat.scale.z = .85;
      for (const s of [-1, 1]) {
        const leg = this.mesh(roundedBox(.11, 1.56, .5, .04), M.walnut, g); leg.position.set(s * .26, .78, 0); leg.rotation.z = -s * .06;
      }
      const bar = this.mesh(new THREE.CylinderGeometry(.022, .022, .56, 8), M.brass, g); bar.rotation.z = Math.PI / 2; bar.position.set(0, .55, .16);
    }
  }

  // Mochi's tent bed: an ivory canvas A-frame on walnut poles, open at the
  // front and back, with an olive cushion big enough to turn and curl up on.
  buildTent() {
    const M = this.materials, T = K.tent, g = new THREE.Group();
    g.position.set(T.x, 0, T.z); g.rotation.y = T.ry; this.group.add(g);
    this.bed = g;
    const W = 1.0, D = .95, H = 1.75;
    for (const z of [-D, D]) for (const s of [-1, 1]) {
      const a = V(s * (W + .05), 0, z), b = V(-s * .1, H + .1, z), v = new THREE.Vector3().subVectors(b, a);
      const p = this.mesh(new THREE.CylinderGeometry(.03, .03, v.length(), 8), M.walnut, g);
      p.position.copy(a).addScaledVector(v, .5); p.quaternion.setFromUnitVectors(V(0, 1, 0), v.normalize());
    }
    const ridge = this.mesh(new THREE.CylinderGeometry(.03, .03, 2 * D + .2, 8), M.walnut, g); ridge.rotation.x = Math.PI / 2; ridge.position.y = H;
    for (const s of [-1, 1]) {
      const geo = new THREE.BufferGeometry();
      const verts = [s * W, 0, -D, s * W, 0, D, 0, H, D, 0, H, -D];
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
      this.mesh(geo, M.canvas, g);
    }
    // Closed at the back, open at the front.
    const back = new THREE.BufferGeometry();
    back.setAttribute('position', new THREE.Float32BufferAttribute([-W, 0, -D, W, 0, -D, 0, H, -D], 3));
    back.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, .5, 1], 2));
    back.computeVertexNormals();
    this.mesh(back, M.canvas, g);
    this.mesh(roundedBox(1.85, .16, 1.85, .07), M.olive, g).position.y = .08;
    this.bedTop = .16;
    this.bedRadius = .75;
  }

  // A round robot vacuum, parked on its discreet dock by the counter.
  buildVacuum() {
    const g = new THREE.Group(); g.position.set(3.15, 0, -2.0); this.group.add(g);
    const white = new THREE.MeshStandardMaterial({color: '#ecebe6', roughness: .35});
    const dark = new THREE.MeshStandardMaterial({color: '#2a2a2a', roughness: .4});
    this.mesh(new THREE.CylinderGeometry(.42, .42, .1, 32), white, g).position.y = .07;
    this.mesh(new THREE.CylinderGeometry(.43, .43, .02, 32), dark, g).position.y = .03;
    this.mesh(new THREE.CylinderGeometry(.13, .13, .04, 20), dark, g).position.set(0, .13, -.1);
    this.vacuumButton = this.mesh(new THREE.CylinderGeometry(.05, .05, .03, 16), new THREE.MeshStandardMaterial({color: '#3b3b3b', emissive: '#5fd38a', emissiveIntensity: .4}), g);
    this.vacuumButton.position.set(0, .13, .15);
    this.vacuum = this.prop(g);
    const dock = new THREE.Group(); dock.position.set(3.15, 0, -2.62); this.group.add(dock);
    this.mesh(roundedBox(.62, .34, .2, .05), dark, dock).position.y = .17;
    this.mesh(new THREE.BoxGeometry(.08, .03, .01), new THREE.MeshBasicMaterial({color: '#7be0a0'}), dock).position.set(0, .28, .105);
  }

  // Window light falling across the limestone.
  // On the right wall over her tent: Jan Davidsz de Heem, Vase of Flowers,
  // c. 1660 (National Gallery of Art, Washington; open access), in a dark
  // frame with a gilt liner, a little larger than life as in Orion's design.
  buildPainting() {
    const M = this.materials, W = 1.75, H = W * 69.6 / 56.5, F = .2, Ln = .04;
    const g = new THREE.Group(); g.position.set(K.right, 3.95, .35); g.rotation.y = -Math.PI / 2; this.group.add(g);
    const ebony = new THREE.MeshStandardMaterial({color: '#21150e', roughness: .45, metalness: .1});
    const gilt = new THREE.MeshStandardMaterial({color: '#9c7b45', roughness: .45, metalness: .7}); // antique gold
    const ow = W + 2 * (F + Ln), oh = H + 2 * (F + Ln);
    for (const [w, h, x, y] of [[ow, F, 0, (oh - F) / 2], [ow, F, 0, -(oh - F) / 2], [F, oh - 2 * F, (ow - F) / 2, 0], [F, oh - 2 * F, -(ow - F) / 2, 0]]) this.box(w, h, .14, x, y, .07, ebony, g);
    const iw = W + 2 * Ln, ih = H + 2 * Ln;
    for (const [w, h, x, y] of [[iw, Ln, 0, (ih - Ln) / 2], [iw, Ln, 0, -(ih - Ln) / 2], [Ln, ih - 2 * Ln, (iw - Ln) / 2, 0], [Ln, ih - 2 * Ln, -(iw - Ln) / 2, 0]]) this.box(w, h, .09, x, y, .045, gilt, g, {cast: false});
    const canvas = new THREE.MeshStandardMaterial({color: '#2a1d14', roughness: .55});
    new THREE.TextureLoader().load('./art/de-heem-vase-of-flowers.jpg', t => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      canvas.map = t; canvas.color.set('#ffffff'); canvas.needsUpdate = true;
    });
    this.mesh(new THREE.PlaneGeometry(W, H), canvas, g, {cast: false}).position.z = .03;
  }

  buildSunPatch() {
    const beam = canvasTexture(256, 256, (c, w, h) => { c.filter = 'blur(10px)'; c.fillStyle = 'rgba(255,214,150,1)'; for (let i = 0; i < 2; i++) for (let j = 0; j < 5; j++) c.fillRect(24 + i * 110, 14 + j * 46, 96, 38); });
    this.sunPatch = this.mesh(new THREE.PlaneGeometry(3.2, 6.4), new THREE.MeshBasicMaterial({map: beam, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false}), this.group, {cast: false, receive: false});
    this.sunPatch.rotation.set(-Math.PI / 2, 0, -.35);
    this.sunPatch.position.set(-4.0, .02, 1.2);
  }

  // Everything the app needs to know about the room's layout.
  layout() {
    const t = this.bed;
    t.updateMatrixWorld(true);
    const at = (x, z) => V(x, 0, z);
    return {
      home: at(-1.0, 3.1), toyHome: V(.2, .13, 3.3),
      bowl: {p: at(4.55, 2.6), ry: -.5}, fountain: {p: at(3.0, 1.55), ry: .3},
      sunSpot: at(-4.7, 2.6),
      // Where she sits to watch the bird at the garden doors.
      windowSpot: at(-5.0, .4),
      // Floor -> stepping perch -> back counter -> lower shelf -> upper
      // shelf, all at the left end, well away from the range.
      perches: {
        step: {spot: at(-5.6, -3.87), top: this.stepTops[0], base: at(-5.45, -2.45), face: 0},
        counter: {spot: at(-4.65, -3.35), top: K.counter, via: 'step', face: 0},
        stepMid: {spot: at(-5.6, -3.87), top: this.stepTops[1], via: 'counter', face: 0},
        shelf: {spot: at(-4.6, -3.9), top: K.shelf1, via: 'stepMid', face: 0},
        stepTop: {spot: at(-5.6, -3.87), top: this.stepTops[2], via: 'shelf', face: 0},
        shelfHigh: {spot: at(-4.65, -3.9), top: K.shelf2, via: 'stepTop', face: 0},
      },
      perchTargets: [['step', this.steps[0]], ['stepMid', this.steps[1]], ['stepTop', this.steps[2]], ['counter', this.counterGroup], ['shelf', this.shelves[0]], ['shelfHigh', this.shelves[1]]],
      // In the tent she lies along it, facing out of the open front.
      sleepHeading: 3.25, // curled up inside, her face toward the room (chosen from renders)
      limits: {dist: [1.1, 16], pitch: [.04, 1.25], x: [-5.6, 6.4], z: [-3.6, 4.6], y: [.08, 5.8]},
      camBox: {x: [-5.8, 6.8], y: [.2, 9.2], z: [-3.9, 18]},
      camSolids: [[-2.6, .7, 1.45, 2.3], [.2, .7, 1.45, 2.3], [K.tent.x, K.tent.z, 1.1, 1.8]],
    };
  }

  // What the Room view keeps in frame (see roomFrame in app.js).
  frame(wide) {
    const I = K.island;
    return {
      // Wide screens look a little toward the right wall and its painting.
      yaw: wide ? -.2 : 0,
      across: [[I.x0, 1.2, I.z1], [I.x1, 1.2, I.z1], [-3.3, .8, I.z1 + .8], [K.tent.x + .7, .9, K.tent.z], [3.0, .3, 1.55], [4.55, .1, 2.6], [-5.2, 4.2, -3.9], [3.4, 4.2, -3.9]]
        .concat(wide ? [[K.left, 4, this.windowRect.z0], [K.left, 1, this.windowRect.z1], [K.door[1], 3, K.back], [K.right, 5.3, -.75], [K.right, 2.6, 1.45]] : [[-5.55, 1.2, -3.9]]),
      bottom: [[I.x0, 0, I.z1 + .8], [I.x1, 0, I.z1 + .3], [4.55, 0, 3.0], [-1, 0, 3.4]],
      top: [[-5.2, 5.8, -3.9], [3.4, 5.8, -3.9], [-3.5, 7.4, .5], [.9, 7.6, 1.1]].concat(wide ? [[-1.2, 8.7, .7]] : []),
    };
  }

  // Walking: the open floor, kept clear of the island; a walk that would
  // cross the island goes round it, by the nearest corner(s).
  clampFloor(v) {
    v.x = Math.min(FLOOR.x1, Math.max(FLOOR.x0, v.x)); v.z = Math.min(FLOOR.z1, Math.max(FLOOR.z0, v.z));
    const R = KEEP_OUT;
    if (v.x > R.x0 && v.x < R.x1 && v.z > R.z0 && v.z < R.z1) {
      const opts = [[R.x0 - v.x, 0], [R.x1 - v.x, 0], [0, R.z0 - v.z], [0, R.z1 - v.z]].sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
      v.x += opts[0][0] * 1.02; v.z += opts[0][1] * 1.02;
      if (v.z < FLOOR.z0) v.z = R.z1 + .05;
    }
    return v;
  }
  randomFloorPoint() {
    const t = this.bed.position;
    for (let i = 0; i < 30; i++) {
      const v = V(-4.8 + Math.random() * 10.4, 0, -2.1 + Math.random() * 6.2);
      if (v.x > KEEP_OUT.x0 && v.x < KEEP_OUT.x1 && v.z > KEEP_OUT.z0 && v.z < KEEP_OUT.z1) continue;
      if (Math.hypot(v.x - t.x, v.z - t.z) < 1.5 || Math.hypot(v.x - 3.0, v.z - 1.55) < .95 || Math.hypot(v.x - 4.55, v.z - 2.6) < .8) continue;
      return v;
    }
    return V(-1, 0, 3.1);
  }
  route(from, to) {
    const R = KEEP_OUT;
    if (!segmentHitsRect(from, to, R)) return [to];
    const m = .2, c = [V(R.x0 - m, 0, R.z0 - m), V(R.x1 + m, 0, R.z0 - m), V(R.x1 + m, 0, R.z1 + m), V(R.x0 - m, 0, R.z1 + m)].map(p => this.clampFloor(p));
    const len = pts => pts.reduce((s, p, i) => s + (i ? p.distanceTo(pts[i - 1]) : p.distanceTo(from)), 0);
    let best = null;
    for (let i = 0; i < 4; i++) {
      if (!segmentHitsRect(from, c[i], R) && !segmentHitsRect(c[i], to, R)) { const p = [c[i], to]; if (!best || len(p) < len(best)) best = p; }
      for (const j of [(i + 1) % 4, (i + 3) % 4]) {
        if (!segmentHitsRect(from, c[i], R) && !segmentHitsRect(c[j], to, R)) { const p = [c[i], c[j], to]; if (!best || len(p) < len(best)) best = p; }
      }
    }
    return best || [to];
  }

  // Where the room's lamp light hangs (the study's lamp light moves here).
  activate(lamp) { lamp.position.copy(this.lampSpot); }

  update(dt, t, night, {camera = null, lamp = null} = {}) {
    if (camera) for (const w of this.walls) {
      const n = V(0, 0, 1).applyQuaternion(w.quaternion);
      w.visible = V(0, 0, 0).subVectors(camera.position, w.position).dot(n) > -.05;
    }
    if (lamp) lamp.intensity = damp(lamp.intensity, night ? 30 : 3, 3, dt);
    const e = damp(this.materials.shade.emissiveIntensity, night ? 2.6 : .3, 3, dt);
    this.materials.shade.emissiveIntensity = e;
    this.sunPatch.material.opacity = damp(this.sunPatch.material.opacity, night ? 0 : .3, 3, dt);
    const sky = night ? this.view.night : this.view.day;
    for (const gl of [this.glass, this.livingGlass]) if (gl.material.map !== sky) { gl.material.map = sky; gl.material.needsUpdate = true; }
    const R = this.room;
    if (this.scene.environment && R.envNight) {
      const env = night ? R.envNight : R.envDay;
      if (this.scene.environment !== env) this.scene.environment = env;
      this.scene.environmentIntensity = damp(this.scene.environmentIntensity, night ? .35 : .6, 3, dt);
    }
    Room.prototype.updateBird.call(this, t);
    // The orchid's stems sway, just a little.
    this.orchidStems.forEach((s, i) => { s.rotation.z = Math.sin(t * .8 + i * 2) * .025; });
  }
}

// Does the segment a-b (on the floor) cross the rectangle R?
function segmentHitsRect(a, b, R) {
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dz = b.z - a.z;
  for (const [p, q] of [[-dx, a.x - R.x0], [dx, R.x1 - a.x], [-dz, a.z - R.z0], [dz, R.z1 - a.z]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
    else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 < t1;
}

// A slab with rounded corners in plan (w along x, d along z), h tall,
// sitting on y = 0, with softly eased edges.
function roundedSlab(w, d, h, r) {
  const s = new THREE.Shape(), x = -w / 2, z = -d / 2;
  r = Math.min(r, w / 2 - .01, d / 2 - .01);
  s.moveTo(x + r, z); s.lineTo(x + w - r, z); s.quadraticCurveTo(x + w, z, x + w, z + r);
  s.lineTo(x + w, z + d - r); s.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
  s.lineTo(x + r, z + d); s.quadraticCurveTo(x, z + d, x, z + d - r);
  s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z);
  const b = Math.min(.03, h / 4);
  const geo = new THREE.ExtrudeGeometry(s, {depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 10});
  geo.rotateX(Math.PI / 2);
  geo.translate(0, h - b, 0);
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// Textures
// ---------------------------------------------------------------------------
// Pale limestone: large tiles in slightly different beiges, with fossil
// flecks, faint veins and fine joints.
function drawLimestone(g, w, h) {
  const r = rng(201), n = 4, tw = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = ['#dacdb6', '#d5c7ae', '#ded2bd', '#d2c4ab'][Math.floor(r() * 4)];
    g.fillRect(i * tw, j * tw, tw, tw);
    for (let k = 0; k < 220; k++) { g.fillStyle = `rgba(${r() < .5 ? '150,128,100' : '250,245,232'},${r() * .22})`; g.fillRect(i * tw + r() * tw, j * tw + r() * tw, 1 + r() * 3, 1 + r() * 2); }
    g.strokeStyle = 'rgba(165,145,115,.18)'; g.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) { g.beginPath(); let x = i * tw + r() * tw, y = j * tw + r() * tw; g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (r() - .5) * 50; y += (r() - .2) * 40; g.lineTo(x, y); } g.stroke(); }
  }
  g.strokeStyle = 'rgba(140,120,95,.35)'; g.lineWidth = 2;
  for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * tw, 0); g.lineTo(i * tw, h); g.moveTo(0, i * tw); g.lineTo(w, i * tw); g.stroke(); }
}

// Breccia, as in the design: big, rounded cream fragments packed together,
// with a web of fine brown and gold veins along the joins, a soft shadow at
// each fragment's edge, and the odd darker fragment. (Cells around scattered
// points, wobbled so the joins wander; it tiles.)
export function drawBreccia(g, w, h) {
  const r = rng(211), N = 46, seeds = [];
  for (let i = 0; i < N; i++) seeds.push({x: r() * w, y: r() * h, v: .5 + r() * 1.6, c: r() < .05 ? [190, 178, 168] : [[240, 232, 218], [236, 226, 210], [244, 238, 226], [230, 219, 202]][Math.floor(r() * 4)]});
  const img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const wx = x + Math.sin(y * .045) * 9 + Math.sin(y * .011 + 1) * 14, wy = y + Math.sin(x * .05) * 8 + Math.sin(x * .013 + 2) * 12;
    let d1 = 1e9, d2 = 1e9, k1 = 0, k2 = 0;
    for (let i = 0; i < N; i++) {
      let dx = Math.abs(wx - seeds[i].x), dy = Math.abs(wy - seeds[i].y);
      if (dx > w / 2) dx = w - dx; if (dy > h / 2) dy = h - dy;
      const dd = dx * dx + dy * dy;
      if (dd < d1) { d2 = d1; k2 = k1; d1 = dd; k1 = i; } else if (dd < d2) { d2 = dd; k2 = i; }
    }
    const edge = Math.sqrt(d2) - Math.sqrt(d1), c = seeds[k1].c, o = (y * w + x) * 4;
    let R = c[0], G = c[1], B = c[2];
    const shade = Math.min(1, edge / 22);
    R *= .9 + .1 * shade; G *= .89 + .11 * shade; B *= .86 + .14 * shade;
    // Each join has its own vein width.
    const vw = (seeds[k1].v + seeds[k2].v) * .45;
    if (edge < vw) { const t = edge / vw; R = 128 + 40 * t; G = 98 + 32 * t; B = 70 + 22 * t; }
    else if (edge < vw * 3) { const t = (edge - vw) / (vw * 2); R = R * t + 196 * (1 - t); G = G * t + 162 * (1 - t); B = B * t + 118 * (1 - t); }
    d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // Fine grain and a few hairline veins across the fragments.
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = `rgba(140,110,80,${.12 + r() * .18})`; g.lineWidth = .6 + r();
    g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - .5) * 40; y += (r() - .5) * 40; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() < .5 ? '120,95,70' : '255,250,242'},${r() * .18})`; g.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5); }
}

// The back counter: a quieter cream stone with soft veining.
function drawCreamStone(g, w, h) {
  const r = rng(221);
  g.fillStyle = '#e8ddcb'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(170,140,105,${.08 + r() * .14})`; g.lineWidth = 1 + r() * 3;
    g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y);
    for (let s = 0; s < 6; s++) { x += (r() - .3) * 80; y += (r() - .5) * 40; g.lineTo(x, y); }
    g.stroke();
  }
}

// Out of the window: a stone terrace with olive trees in terracotta pots,
// a low wall, then dune grass and the sea under a soft sky; at night, a blue
// dusk with the moon on the water.
function drawTerrace(g, w, h, night) {
  const r = rng(night ? 231 : 233);
  const sky = g.createLinearGradient(0, 0, 0, h * .42);
  if (night) { sky.addColorStop(0, '#16203a'); sky.addColorStop(1, '#3a4766'); }
  else { sky.addColorStop(0, '#c9d6dd'); sky.addColorStop(1, '#efe9db'); }
  g.fillStyle = sky; g.fillRect(0, 0, w, h * .42);
  g.filter = 'blur(8px)';
  for (let i = 0; i < 14; i++) { g.fillStyle = night ? 'rgba(70,80,110,.35)' : 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(r() * w, r() * h * .3, 40 + r() * 60, 8 + r() * 12, 0, 0, 7); g.fill(); }
  g.filter = 'none';
  if (night) { const m = g.createRadialGradient(w * .7, h * .14, 0, w * .7, h * .14, 26); m.addColorStop(0, 'rgba(255,248,226,1)'); m.addColorStop(.35, 'rgba(255,244,215,.9)'); m.addColorStop(.42, 'rgba(255,240,210,.2)'); m.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = m; g.fillRect(0, 0, w, h * .4); }
  // The sea, with a glint.
  const sea = g.createLinearGradient(0, h * .4, 0, h * .48);
  if (night) { sea.addColorStop(0, '#1d2a44'); sea.addColorStop(1, '#162034'); } else { sea.addColorStop(0, '#7890a0'); sea.addColorStop(1, '#5e7481'); }
  g.fillStyle = sea; g.fillRect(0, h * .4, w, h * .09);
  g.fillStyle = night ? 'rgba(220,228,250,.45)' : 'rgba(240,244,244,.5)';
  for (let i = 0; i < 30; i++) g.fillRect(r() * w, h * (.41 + r() * .06), 8 + r() * 22, 1.2);
  // Dunes and grass.
  g.fillStyle = night ? '#2b2a27' : '#cfb47e';
  g.beginPath(); g.moveTo(0, h * .5); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * (.48 + Math.sin(x * .02) * .012 + r() * .008)); g.lineTo(w, h * .62); g.lineTo(0, h * .62); g.closePath(); g.fill();
  g.strokeStyle = night ? 'rgba(40,40,36,.8)' : 'rgba(160,130,70,.7)'; g.lineWidth = 1.2;
  for (let i = 0; i < 160; i++) { const x = r() * w, y = h * (.5 + r() * .1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 8, y - 8 - r() * 10); g.stroke(); }
  // The terrace: a low limestone wall, then pale paving.
  g.fillStyle = night ? '#35322e' : '#d8c9ad'; g.fillRect(0, h * .6, w, h * .06);
  g.fillStyle = night ? 'rgba(20,20,20,.25)' : 'rgba(150,130,100,.25)';
  for (let x = 0; x < w; x += 46) g.fillRect(x, h * .6, 2, h * .06);
  g.fillStyle = night ? '#2a2724' : '#e2d6c0'; g.fillRect(0, h * .66, w, h * .34);
  g.strokeStyle = night ? 'rgba(10,10,10,.2)' : 'rgba(160,140,110,.25)'; g.lineWidth = 1.5;
  for (let y = h * .72; y < h; y += h * .07) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  // Olive trees in terracotta pots, either side.
  for (const [x, s] of [[.12, 1], [.88, .9], [.42, .6]]) {
    const px = w * x, base = h * (.86 - (1 - s) * .12), ph = 70 * s, pw = 54 * s;
    g.fillStyle = night ? '#6b6a62' : '#7b7464'; g.fillRect(px - 3 * s, base - ph - 150 * s, 6 * s, 150 * s);
    g.filter = 'blur(3px)';
    for (let k = 0; k < 16; k++) { g.fillStyle = night ? `rgba(36,44,46,${.8 + r() * .2})` : ['rgba(118,132,98,.8)', 'rgba(150,160,128,.75)', 'rgba(96,110,82,.8)'][k % 3]; g.beginPath(); g.ellipse(px + (r() - .5) * 120 * s, base - ph - 150 * s - r() * 70 * s, (28 + r() * 26) * s, (18 + r() * 14) * s, 0, 0, 7); g.fill(); }
    g.filter = 'none';
    g.fillStyle = night ? '#4a3329' : '#c27b52';
    g.beginPath(); g.moveTo(px - pw, base - ph); g.lineTo(px + pw, base - ph); g.lineTo(px + pw * .75, base); g.lineTo(px - pw * .75, base); g.closePath(); g.fill();
    g.fillStyle = night ? 'rgba(0,0,0,.2)' : 'rgba(255,230,200,.2)'; g.fillRect(px - pw, base - ph, pw * 2, 6 * s);
  }
  if (night) for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,205,130,.85)'; g.beginPath(); g.arc(w * (.2 + r() * .6), h * .63, 2.5, 0, 7); g.fill(); }
}

function drawOrchidFlower(g, w, h) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  g.fillStyle = '#fbf8f3';
  for (const [a, rx, ry] of [[-Math.PI / 2, 12, 20], [Math.PI / 6, 12, 20], [Math.PI * 5 / 6, 12, 20], [-Math.PI / 6, 15, 13], [-Math.PI * 5 / 6, 15, 13]]) {
    g.beginPath(); g.ellipse(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, rx, ry, a + Math.PI / 2, 0, 7); g.fill();
  }
  g.fillStyle = '#e9d36a'; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill();
  g.fillStyle = '#c84a7a'; g.beginPath(); g.ellipse(cx, cy + 6, 4, 3, 0, 0, 7); g.fill();
}

function drawSalmon(g, w, h) {
  g.fillStyle = '#ea8f6b'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,235,220,.8)'; g.lineWidth = 2;
  for (let x = 4; x < w; x += 8) { g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + 4, h / 2, x, h); g.stroke(); }
}

function drawPhoto(g, w, h, tint) {
  g.fillStyle = '#f2ece2'; g.fillRect(0, 0, w, h);
  g.fillStyle = tint; g.fillRect(6, 6, w - 12, h - 12);
  g.fillStyle = 'rgba(60,50,40,.35)'; g.beginPath(); g.ellipse(w / 2, h * .62, 9, 18, 0, 0, 7); g.fill();
}

function drawEarthBands(g, w, h) {
  const r = rng(241);
  for (const [y, c] of [[0, '#d9c7a6'], [.35, '#b88a5c'], [.6, '#e4d6bc'], [.8, '#8a6a4a']]) { g.fillStyle = c; g.fillRect(0, y * h, w, h); }
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(255,250,240,${r() * .15})`; g.fillRect(r() * w, r() * h, 8 + r() * 30, 2); }
}
