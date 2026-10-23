// The new movement in the app: drives the repaired rig (rig v2) with the
// motion trial's approach, behind the same cat.update(dt, t, ctl) the app
// already calls, so the app's behaviour code doesn't change.
//
//  - Body poses (stand, sit, loaf, sleep, crouch, stretch, beg, belly, leap)
//    are targets for the pelvis, spine, chest, shoulder blades, head and
//    tail. Changing pose, each part moves on its own timing: settling down,
//    the hips lead and the chest follows; getting up, the chest leads.
//  - Paws are planted in the world. Walking is the four-beat walk, its
//    stride and rhythm following how fast she's actually moving; each paw
//    lands where the leg will be upright mid-stance. Standing, turning or
//    changing pose, a paw that's far from where that pose wants it takes a
//    small step there, one at a time (her shuffles back to sit, forward to
//    lie down). In the air the paws reach and tuck; riding the vacuum they
//    stay planted on it.
//  - Her support surface (floor, shelf, counter, sink, vacuum) is always the
//    height she's standing at: the body, paws and tail rest on it with the
//    soft contact (switched off mid-jump).
import * as THREE from 'three';
import {MotionRig, LEGS} from './motion.js';

const {clamp, smoothstep, lerp, damp} = THREE.MathUtils;
const smoother = k => (k = clamp(k, 0, 1), k * k * k * (k * (k * 6 - 15) + 10));
const PAWS = Object.keys(LEGS);
const PHASE = {LH: 0, LF: .25, RH: .5, RF: .75}; // four-beat walk
// Running, a gallop: the hind legs push off one just after the other, then
// the front legs land one after the other half a stride later.
const PHASE_RUN = {LH: 0, RH: .1, LF: .5, RF: .6};

// Pose targets, relative to her standing stance (pelvis offsets in her own
// frame; paw places relative to the standing ones; angles in radians).
const BASE = {y: 0, z: 0, x: 0, pitch: 0, roll: 0, yaw: 0, spine: 0, spineRoll: 0, spineYaw: 0, chest: 0, chestYaw: 0, scap: 0,
  fdz: 0, fdx: 0, lhx: 0, lhz: 0, rhx: 0, rhz: 0, hock: 0, wrist: 0, headPitch: 0, headYaw: 0, headRoll: 0,
  tailLift: -.55, tailCurl: .2, tailSide: 0, tailFloor: 0, tailR: .38};
const POSES = {
  stand: {},
  // Low and ready: the chest drops between the shoulder blades, which ride up.
  crouch: {y: -.07, z: -.02, pitch: -.03, chest: -.06, scap: .03, hock: -.1, headPitch: -.04, tailLift: -.75, tailCurl: .05},
  // Sitting (from the trial): the body pivots back over the front paws, the
  // shoulder blades slide down the ribs so the front legs reach the floor,
  // the hocks lie along it and the tail wraps round.
  sit: {y: .225, z: -.15, pitch: .46, spine: .12, chest: .07, scap: -.075, fdz: -.14, hock: .4, tailLift: -1.2, tailCurl: .05, tailSide: .9, tailFloor: 1, tailR: .38, abs: true},
  // Lying on her belly, hips rolled a little to her right, hind legs folded
  // out to the sides, front paws ahead.
  loaf: {y: .245, z: -.02, x: -.03, pitch: .02, roll: .3, spine: -.03, spineRoll: -.2, chest: -.06, scap: .015, fdz: .14, lhx: .16, lhz: .16, rhx: -.2, rhz: .2, hock: .4, headPitch: -.06, tailLift: -1.1, tailSide: 1.6, tailFloor: 1, tailR: .42, abs: true},
  // Asleep: lying, curled a little, head down.
  sleep: {y: .24, z: -.02, x: -.03, pitch: .02, roll: .35, spine: -.03, spineRoll: -.2, spineYaw: .2, chest: -.08, chestYaw: .2, scap: .02, fdz: .12, lhx: .16, lhz: .16, rhx: -.2, rhz: .2, hock: .4, headPitch: -.32, headYaw: .3, headRoll: -.1, tailFloor: 1, tailR: .3, abs: true},
  // Front paws reaching far forward, chest low, hindquarters up.
  stretch: {y: -.02, z: .05, pitch: -.3, spine: -.06, chest: -.12, scap: .04, fdz: .24, headPitch: .12, tailLift: .35, tailCurl: .15},
  // Sitting up tall, front paws lifted.
  beg: {y: .225, z: -.17, pitch: .62, spine: .2, chest: .2, scap: -.05, fdz: -.1, hock: .4, headPitch: .1, tailFloor: 1, abs: true, frontFree: [.0, .12, .1]},
  // Rolled on to her back, paws in the air.
  belly: {y: .2, z: 0, roll: 1.45, spine: .05, headRoll: -1, headPitch: .1, tailLift: -.5, tailSide: .4, abs: true, allFree: true},
  // Draped over something round and high (the kitchen's pendant shade),
  // as cats do with chandeliers: belly on top, legs hanging down either
  // end, tail straight down, head resting forward and looking down.
  drape: {y: .13, z: 0, pitch: -.04, spine: .1, chest: -.2, scap: .07, headPitch: .55, tailLift: -1.5, tailCurl: .04, abs: true, allFree: true},
  // Mid-leap: stretched out, front paws reaching, hind legs trailing.
  leap: {y: .02, pitch: -.1, spine: -.04, chest: 0, fdz: .12, lhz: -.12, rhz: -.12, tailLift: -.2, tailCurl: -.05, allFree: true},
};
for (const k of Object.keys(POSES)) POSES[k] = {...BASE, ...POSES[k]};
const CH = Object.keys(BASE);
// How far a planted paw may be from where it belongs, forward or back and to
// the side, before its leg runs out of reach (in her own frame).
const LEASH = {x: .14, z: .26};
// How long each part takes when the pose changes, and how long it waits
// (going down to sit/lie: hips first, chest after; getting up: chest first).
const PART = c => /^(y|z|x|pitch|roll|yaw)$/.test(c) ? 'pelvis' : /^(spine|chest)/.test(c) ? 'chest' : c === 'scap' ? 'scap' : /^(fd|lh|rh|hock|wrist)/.test(c) ? 'paws' : /^head/.test(c) ? 'head' : 'tail';
const TIMING = {
  down: {pelvis: [0, .85], chest: [.25, .95], scap: [.15, .8], paws: [.1, .7], head: [0, .6], tail: [.55, 1.0]},
  up: {pelvis: [.12, .65], chest: [0, .55], scap: [0, .5], paws: [0, .4], head: [0, .45], tail: [0, .6]},
  quick: {pelvis: [0, .22], chest: [0, .25], scap: [0, .22], paws: [0, .2], head: [0, .2], tail: [0, .3]},
};
const _m = new THREE.Vector3();
const LOW = new Set(['sit', 'loaf', 'sleep', 'beg', 'belly', 'drape']);

export class MotionCat {
  constructor(cat) {
    this.cat = cat;
    this.rig = new MotionRig(cat, {sampleEvery: 7});
    this.rig.enableSoftFloor(0);
    const S = this.rig.stance;
    this.S = S;
    // Where each paw stands, from its own shoulder or hip (the sculpt is
    // posed unevenly, so each side is placed from its own joint): the front
    // paws a little in under the chest, the hind ones a little out from the
    // hips, so from in front, behind or three-quarters all four legs show
    // (in line, the far ones hide behind the near). Front legs upright, the
    // hind ones just behind the hip.
    const R = this.rig.restPos;
    this.home0 = {
      LF: new THREE.Vector3(R.shoulderL.x - .015, 0, S.frontZ - .07), RF: new THREE.Vector3(R.shoulderR.x + .015, 0, S.frontZ - .07),
      LH: new THREE.Vector3(R.hipL.x + .07, 0, S.hindZ + .02), RH: new THREE.Vector3(R.hipR.x - .07, 0, S.hindZ + .02),
    };
    this.h0 = S.hips.y - .005;
    this.ch = {...POSES.stand, y: this.h0};
    this.from = {...this.ch};
    this.poseName = 'stand'; this.poseAt = -1; this.timing = TIMING.quick;
    this.paws = Object.fromEntries(PAWS.map(k => [k, {pos: null, swing: null, free: false}]));
    this.phase = 0; this.walkW = 0; this.lastStep = -9;
    this.prev = null; this.vel = new THREE.Vector3(); this.yawRate = 0;
    this.br = 0;
    this.groomPaw = new THREE.Vector3();
  }

  // Where a paw belongs now (her own frame), for the pose's current blend.
  homeLocal(k, out = new THREE.Vector3()) {
    const c = this.ch, h = this.home0[k];
    out.copy(h);
    if (k[1] === 'F') { out.z += c.fdz; out.x += c.fdx * (k[0] === 'L' ? 1 : -1); }
    else if (k === 'LH') { out.x += c.lhx; out.z += c.lhz; }
    else { out.x += c.rhx; out.z += c.rhz; }
    return out;
  }

  update(dt, t, ctl) {
    dt = Math.min(dt, .1);
    const cat = this.cat, root = cat.root, rig = this.rig;
    root.updateMatrixWorld(true);
    const rootPos = root.getWorldPosition(new THREE.Vector3()), heading = root.rotation.y;
    // How she's moving (from where the app has put her).
    if (this.prev && dt > 0) {
      const v = rootPos.clone().sub(this.prev.pos).divideScalar(dt);
      this.vel.lerp(v.setY(0), 1 - Math.exp(-12 * dt));
      let dy = heading - this.prev.heading; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      this.yawRate = lerp(this.yawRate, dy / dt, 1 - Math.exp(-10 * dt));
    }
    // (A teleport, e.g. changing rooms: up or down, or across, in one go.)
    const jumped = this.prev && ctl.air < 0 && (Math.abs(rootPos.y - this.prev.pos.y) > .5 || Math.hypot(rootPos.x - this.prev.pos.x, rootPos.z - this.prev.pos.z) > .45);
    this.prev = {pos: rootPos.clone(), heading};
    if (jumped) for (const k of PAWS) this.paws[k].pos = null;
    const speed = this.vel.length();
    const air = ctl.air >= 0 || (ctl.lift || 0) > .03;
    const riding = !!ctl.riding;

    // --- Pose channels ------------------------------------------------------
    let name = POSES[ctl.pose] ? ctl.pose : 'stand';
    if (ctl.air >= 0 || (ctl.lift || 0) > .1) name = 'leap';
    if (name !== this.poseName) {
      const goingDown = LOW.has(name) && !LOW.has(this.poseName);
      const goingUp = !LOW.has(name) && LOW.has(this.poseName);
      this.timing = goingDown ? TIMING.down : goingUp ? TIMING.up : TIMING.quick;
      if ((ctl.poseRate ?? 6) >= 9 && !goingDown && !goingUp) this.timing = TIMING.quick;
      this.from = {...this.ch}; this.poseName = name; this.poseAt = t;
    }
    const P = POSES[name];
    for (const c of CH) {
      const [delay, dur] = this.timing[PART(c)];
      const k = smoother((t - this.poseAt - delay) / dur);
      // (Pelvis height is kept as an actual height: the resting poses give
      // theirs directly, the others relative to her standing height.)
      let target = c === 'y' && !P.abs ? this.h0 + P.y : P[c];
      // Crouched but on the move (chasing a toy): she runs nearly upright;
      // the low crouch is for stalking, standing still or creeping.
      if (name === 'crouch' && this.walkW > 0) target = lerp(target, c === 'y' ? this.h0 + POSES.stand.y : POSES.stand[c], this.walkW * .85);
      this.ch[c] = lerp(this.from[c], target, k);
    }
    const c = this.ch;

    // --- Walk ------------------------------------------------------------------
    // (Turning counts too: her paws, a body's length apart, travel round as
    // she turns, so a turn on the spot is stepped round, not slid.)
    const gait = speed + Math.abs(this.yawRate) * .3;
    const walking = !air && !riding && gait > .05;
    this.walkW = damp(this.walkW, walking && speed > .05 ? 1 : 0, walking ? 6 : 4, dt);
    // (Short enough that a planted paw stays within its leg's reach for the
    // whole of its stance: quicker steps, not longer ones, as she speeds up.)
    // Fast, she gallops: longer bounds, each paw down for a shorter time.
    const runW = smoother(clamp((speed - 1.0) / .5, 0, 1));
    this.runW = runW;
    const stride = lerp(clamp(.3 + .3 * gait, .36, .8), clamp(.45 + .25 * gait, .8, 1.05), runW); // metres-equivalent per cycle at her size
    const duty = lerp(clamp(.64 - .1 * (gait - .62), .42, .66), .36, runW);
    if (walking) this.phase = (this.phase + gait * dt / stride) % 1;
    const cycle = stride / Math.max(gait, .05);
    // Each paw: planted, swinging, or free.
    const fwdW = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    const sw = {};
    for (const k of PAWS) {
      const pw = this.paws[k], front = k[1] === 'F';
      const home = this.homeLocal(k);
      const homeW = root.localToWorld(home.clone());
      const freePose = P.allFree || (P.frontFree && front) || air;
      if (pw.pos === null || riding) { pw.pos = homeW.clone(); pw.swing = null; }
      pw.free = false; sw[k] = 0;
      if (freePose) {
        pw.free = true; pw.swing = null;
        pw.pos.copy(homeW);
        continue;
      }
      if (walking || pw.swing?.gait) {
        const p = ((this.phase - lerp(PHASE[k], PHASE_RUN[k], runW)) % 1 + 1) % 1;
        const inSwing = walking && p >= duty;
        if (inSwing && !pw.swing) {
          pw.swing = {gait: true, from: pw.pos.clone(), t0: t};
        }
        // A planted paw left too far behind (or beside) takes its step now,
        // a quick one, rather than being dragged until its turn comes.
        if (walking && !pw.swing && !PAWS.some(q => q !== k && this.paws[q].swing?.early)) {
          const lp = root.worldToLocal(_m.copy(pw.pos));
          if (Math.hypot((lp.x - home.x) / LEASH.x, (lp.z - home.z) / LEASH.z) > .65) pw.swing = {gait: true, early: true, from: pw.pos.clone(), t0: t};
        }
        if (pw.swing?.gait) {
          const early = pw.swing.early;
          const u = early ? Math.min(1, (t - pw.swing.t0) / .18) : walking ? (p - duty) / (1 - duty) : Math.min(1, pw.swing.u + dt / .15);
          if (early ? u >= 1 : !walking && u >= 1 || walking && !inSwing) {
            // Down: where the leg will be upright mid-stance.
            pw.pos.copy(pw.swing.to || pw.pos).setY(rootPos.y); pw.swing = null;
          } else {
            const ahead = early ? (1 - u) * .2 + duty * cycle * .3 : (1 - u) * (1 - duty) * cycle + duty * cycle / 2;
            const yaw = heading + this.yawRate * ahead;
            const local = home.clone().add(new THREE.Vector3(0, 0, front ? -.05 : 0));
            const to = rootPos.clone().addScaledVector(this.vel, walking ? ahead : 0)
              .add(local.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)).setY(rootPos.y);
            pw.swing.to = to; pw.swing.u = u;
            const e = smoother(clamp((u - .05) / .9, 0, 1));
            pw.pos.copy(pw.swing.from).lerp(to, e);
            const H = (front ? .07 : .06) * clamp(pw.swing.from.distanceTo(to) / .5, .45, 1) * (1 + runW * .5);
            pw.pos.y = rootPos.y + H * Math.pow(Math.sin(Math.PI * Math.pow(u, .8)), 1.3);
            pw.pitch = front ? -1.1 * Math.sin(Math.PI * clamp(u * 1.25, 0, 1)) * (1 - u) : -.7 * Math.sin(Math.PI * clamp(u * 1.3, 0, 1)) * (1 - u);
            sw[k] = Math.sin(Math.PI * u);
            continue;
          }
        }
        pw.pitch = 0;
        continue;
      }
      // Standing, turning or changing pose: a corrective step when a paw is
      // well away from where it belongs (one paw at a time).
      if (pw.swing) {
        const u = Math.min(1, (t - pw.swing.t0) / pw.swing.dur);
        pw.pos.copy(pw.swing.from).lerp(homeW.setY(rootPos.y), smoother(u));
        pw.pos.y = rootPos.y + pw.swing.h * Math.sin(Math.PI * u);
        pw.pitch = -.5 * Math.sin(Math.PI * u);
        sw[k] = Math.sin(Math.PI * u);
        if (u >= 1) { pw.swing = null; pw.pos.y = rootPos.y; }
        continue;
      }
      pw.pos.y = rootPos.y;
      pw.pitch = 0;
      // (Off to the side shows more than off forward or back.)
      const offL = root.worldToLocal(pw.pos.clone()).sub(home), off = Math.hypot(offL.x / .55, offL.z);
      if (off > .055 && t - this.lastStep > .14 && !PAWS.some(q => this.paws[q].swing && !this.paws[q].swing.gait)) {
        this.lastStep = t;
        pw.swing = {from: pw.pos.clone(), t0: t, dur: clamp(.18 + off * .5, .2, .4), h: clamp(.02 + off * .12, .025, .05)};
      }
    }

    // A paw never trails further than its leg can reach: when she's moved
    // faster than she can step (a pounce, a dash, a hop between perches),
    // the planted paw comes along at the end of its leg instead of staying
    // behind and pulling the leg out of sight; standing, it steps at once.
    for (const k of PAWS) {
      const pw = this.paws[k];
      if (pw.free) continue;
      const home = this.homeLocal(k), loc = root.worldToLocal(pw.pos.clone());
      const dx = loc.x - home.x, dz = loc.z - home.z, e = Math.hypot(dx / LEASH.x, dz / LEASH.z);
      if (e <= 1) continue;
      loc.x = home.x + dx / e; loc.z = home.z + dz / e;
      const y = pw.pos.y;
      pw.pos.copy(root.localToWorld(loc)).setY(y);
      if (pw.swing?.from) pw.swing.from.copy(pw.pos);
      if (!walking && !pw.swing) { pw.swing = {from: pw.pos.clone(), t0: t, dur: .22, h: .04}; this.lastStep = t; }
    }

    // --- State for the rig -------------------------------------------------------
    const S = this.S, ww = this.walkW;
    const low = POSES[name].abs;
    // Carried a touch lower while walking, dipping as each hind leg swings.
    // Galloping, she bounds: up off the hind legs, the back flexing as the
    // legs gather under her and stretching out as they reach.
    const rw = this.runW || 0, gph = Math.PI * 2 * this.phase;
    const pelY = c.y - .02 * ww - .006 * ((sw.LH || 0) + (sw.RH || 0)) * ww * (1 - rw) + rw * (.045 * Math.sin(gph - .6) - .01);
    const settled = c.y < this.h0 - .1; // resting on her body (sitting, lying)
    const swayH = .012 * ((sw.RH || 0) - (sw.LH || 0)) * ww;
    const pelvis = {pos: new THREE.Vector3(S.hips.x + c.x + swayH, pelY, S.hips.z + c.z), yaw: c.yaw + .03 * ((sw.RH || 0) - (sw.LH || 0)) * ww + (ctl.wiggle || 0) * Math.sin(t * 20) * .14,
      pitch: c.pitch + rw * .12 * Math.sin(gph), roll: c.roll + .045 * ((sw.RH || 0) - (sw.LH || 0)) * ww * (1 - rw)};
    const chestRoll = .03 * ((sw.RF || 0) - (sw.LF || 0)) * ww;
    // Air: the body follows the arc (nose up rising, down falling).
    if (ctl.air >= 0) { const k = ctl.air, up = ctl.airUp ?? 1; pelvis.pitch += (up > 0 ? .3 : -.25) * Math.cos(Math.PI * k); }
    const paws = {};
    for (const k of PAWS) {
      const pw = this.paws[k];
      const local = root.worldToLocal(pw.pos.clone());
      let pitch = pw.pitch || 0;
      if (k[1] === 'H') pitch += c.hock;
      // Knead: front paws press in turn; groom: left paw up to her face; swat: right paw reaches.
      if (ctl.knead && k[1] === 'F' && !air) local.y += Math.max(0, Math.sin(t * 5.5 + (k === 'LF' ? Math.PI : 0))) * .035;
      let free = pw.free;
      if (ctl.groom && k === 'LF') {
        // Washing: the paw comes right up to her mouth (wherever her head is),
        // its back to her tongue, rising a little with each lick.
        const mouth = root.worldToLocal(this.cat.bones.jaw.localToWorld(_m.set(0, -.015, .14))).clone();
        free = true;
        local.copy(this.groomPaw.lerp(mouth.add(_m.set(.01, -.075 + Math.max(0, Math.sin(t * 7)) * .02, -.035)), 1 - Math.exp(-10 * dt)));
        pitch = -1.6;
      } else if (k === 'LF') this.groomPaw.copy(local);
      if (ctl.swat > .02 && k === 'RF') { free = true; local.lerp(new THREE.Vector3(S.mid - .05, .42, S.frontZ + .3), ctl.swat); pitch = lerp(pitch, -.6, ctl.swat); }
      if (P.frontFree && k[1] === 'F') { free = true; local.add(new THREE.Vector3(...P.frontFree)); pitch = -1; }
      if (air) { local.y += k[1] === 'F' ? .12 : .08; pitch = k[1] === 'F' ? -.3 : -.6; }
      if (name === 'drape') { local.y -= k[1] === 'F' ? .34 : .36; local.z += k[1] === 'F' ? .2 : -.16; pitch = k[1] === 'F' ? .7 : 1; }
      paws[k] = {pos: local, pitch, yaw: 0, free};
    }
    // Shoulder blades swing with their legs and lift over a supporting leg.
    const scapFor = k => {
      const local = paws[k].pos, rel = local.z - this.home0[k].z;
      return {angle: ww * clamp(rel * .9, -.25, .25), lift: c.scap + ww * .01 * (1 - (sw[k] || 0))};
    };
    // Breathing: slower and deeper asleep.
    const sleeping = name === 'sleep';
    this.br += dt * (sleeping ? .3 : speed > .3 ? .8 : .45);
    const ph = this.br % 1;
    const breath = (ph < .4 ? -Math.cos(Math.PI * ph / .4) : Math.cos(Math.PI * (ph - .4) / .6)) * (sleeping ? .02 : .012)
      + (ctl.purr ? Math.sin(t * 55) * .004 : 0);
    const head = ctl.head || {yaw: 0, pitch: 0, roll: 0};
    const tl = ctl.tail || {amp: .25, speed: 1.4};
    const state = {
      pelvis,
      spine: {yaw: c.spineYaw - .5 * pelvis.yaw * ww + .02 * ((sw.LF || 0) - (sw.RF || 0)) * ww - (ctl.wiggle || 0) * Math.sin(t * 20) * .08, pitch: c.spine - rw * .14 * Math.sin(gph), roll: c.spineRoll + chestRoll * .5},
      chest: {yaw: c.chestYaw, pitch: c.chest - .035 * ww - rw * (.06 + .08 * Math.sin(gph + 1.2)), roll: chestRoll * .5},
      head: {yaw: head.yaw + c.headYaw, pitch: head.pitch + c.headPitch, roll: (head.roll || 0) + c.headRoll},
      neckShare: .5,
      scap: {L: scapFor('LF'), R: scapFor('RF')},
      paws,
      tail: {lift: c.tailLift, curl: c.tailCurl, side: c.tailSide, up: ctl.tailUp || 0, amp: tl.amp, speed: tl.speed,
        floor: air ? 0 : c.tailFloor, wrap: 1, radius: c.tailR, bounds: ctl.tailBounds},
      breathe: breath, face: ctl.face, look: ctl.look,
    };
    // Soft contact on her support surface (not mid-air).
    // (Nothing to stand on under her paws when she's in the air or hanging.)
    const unsupported = air || name === 'drape';
    rig.floorU.floorY.value = unsupported ? -1e3 : rootPos.y;
    // (Contact whenever she's not walking or in the air: resting, crouching,
    // landing on a cushion. Walking, her legs carry her clear of it.)
    rig.apply(state, dt, t, {contact: !unsupported && (low || settled || c.tailFloor > .05 || this.walkW < .5)});
  }
}
