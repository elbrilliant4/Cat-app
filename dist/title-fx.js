// The title screen's picture: glow (bloom), sun shafts through the study
// window, dust in the light, a soft vignette and a little grain. Used only
// while the title is up; dispose() gives the plain renderer back.
import * as THREE from 'three';
import {EffectComposer} from './vendor/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './vendor/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from './vendor/postprocessing/ShaderPass.js';
import {OutputPass} from './vendor/postprocessing/OutputPass.js';

const DAY = new THREE.Color(0xffd9a0), NIGHT = new THREE.Color(0x9fb4ff);

// Vignette, grain and a touch of warmth, in one small pass.
const GradeShader = {
  uniforms: {tDiffuse: {value: null}, time: {value: 0}, vignette: {value: .55}, grain: {value: .035}},
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, vignette, grain; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + time * 7.13) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - .5;
      c.rgb *= mix(1., smoothstep(.95, .25, length(d * vec2(1., 1.15))), vignette);
      c.rgb *= vec3(1.03, 1., .96);
      c.rgb += (hash(gl_FragCoord.xy) - .5) * grain;
      gl_FragColor = c;
    }`,
};

export class TitleFx {
  // win: the window's glass {x, z, w, y0, y1}; patch: the sunlight on the
  // floor (room.sunPatch); night: moonlight in place of sun.
  constructor(renderer, scene, camera, {parent = scene, win, patch, night = false, mobile = false}) {
    this.renderer = renderer; this.scene = scene; this.camera = camera; this.parent = parent;
    this.ratio = Math.min(renderer.getPixelRatio(), mobile ? 1.5 : 2);
    const size = renderer.getSize(new THREE.Vector2());
    // (No smoothed edges on phones: an iPhone drew only some blocks of a
    // smoothed picture of this kind and left the rest black.)
    const target = new THREE.WebGLRenderTarget(size.x * this.ratio, size.y * this.ratio, {type: THREE.HalfFloatType, samples: mobile ? 0 : 4});
    const c = this.composer = new EffectComposer(renderer, target);
    c.setPixelRatio(this.ratio);
    c.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), .34, .7, .95);
    c.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    c.addPass(this.grade);
    c.addPass(new OutputPass());
    c.setSize(size.x, size.y);
    // (Kept for the slow-phone step in render(): until the room is next
    // resized nothing else has told us our size, and stepping down to a
    // smaller picture without it left only a strip of the picture drawn.)
    this.w = size.x; this.h = size.y;

    // Sun shafts: thin sheets of light fanned from the window down to the
    // sunlight on the floor.
    const P = (px, py) => new THREE.Vector3(patch.position.x + px * Math.cos(patch.rotation.z) - py * Math.sin(patch.rotation.z), .06, patch.position.z - (px * Math.sin(patch.rotation.z) + py * Math.cos(patch.rotation.z)));
    const pos = [], uv = [], idx = [], N = 9;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1) - .5, x = win.x + u * win.w * .92;
      const A = new THREE.Vector3(x, win.y1, win.z), B = new THREE.Vector3(x, win.y0, win.z), C = P(u * 2.5, -1.6), D = P(u * 2.5, 1.6);
      const o = pos.length / 3;
      for (const [p, a, b] of [[A, 0, 1], [B, 0, 0], [D, 1, 0], [C, 1, 1]]) { pos.push(p.x, p.y, p.z); uv.push(a, b); }
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    this.shaftMat = new THREE.ShaderMaterial({
      uniforms: {color: {value: DAY.clone()}, strength: {value: 0}, time: {value: 0}},
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `
        uniform vec3 color; uniform float strength, time; varying vec2 vUv;
        void main() {
          // Bright at the glass, gone by the floor; soft at the sheet's edges; the window's bars leave gaps.
          float along = pow(1. - vUv.x, 1.4) * smoothstep(0., .06, vUv.x);
          float across = smoothstep(0., .12, vUv.y) * smoothstep(1., .88, vUv.y);
          float bars = .6 + .4 * smoothstep(.06, .2, abs(fract(vUv.y * 3.) - .5));
          float shimmer = .9 + .1 * sin(time * .6 + vUv.y * 9.);
          gl_FragColor = vec4(color * along * across * bars * shimmer * strength, 1.);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    });
    this.shafts = new THREE.Mesh(g, this.shaftMat);
    this.shafts.renderOrder = 5; this.shafts.frustumCulled = false;
    parent.add(this.shafts);

    // Dust motes drifting in the light (moved in the shader: no work per frame).
    const M = mobile ? 140 : 220, dp = [], seed = [];
    for (let i = 0; i < M; i++) {
      // Most of them in the shafts, the rest about the room.
      if (i < M * .65) {
        const k = Math.random(), u = Math.random() - .5, v = Math.random();
        const top = new THREE.Vector3(win.x + u * win.w, THREE.MathUtils.lerp(win.y0, win.y1, v), win.z), low = P(u * 2.5, THREE.MathUtils.lerp(1.6, -1.6, v));
        top.lerp(low, k); dp.push(top.x, top.y + .05, top.z);
      } else dp.push(THREE.MathUtils.randFloat(-3.6, 3.8), THREE.MathUtils.randFloat(.2, 3.6), THREE.MathUtils.randFloat(-2.6, 3));
      seed.push(Math.random(), Math.random(), Math.random());
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
    dg.setAttribute('seed', new THREE.Float32BufferAttribute(seed, 3));
    this.dustMat = new THREE.ShaderMaterial({
      uniforms: {color: {value: DAY.clone()}, strength: {value: 0}, time: {value: 0}, scale: {value: size.y * this.ratio}},
      vertexShader: `
        attribute vec3 seed; uniform float time, scale; varying float vA;
        void main() {
          vec3 p = position;
          float t = time * (.25 + seed.x * .35);
          p += vec3(sin(t + seed.y * 6.28) * .22, sin(t * .7 + seed.z * 6.28) * .18 + mod(time * .02 * (seed.x + .3), .4), cos(t * .8 + seed.x * 6.28) * .22);
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (.012 + seed.z * .02) * scale / max(.3, -mv.z);
          vA = (.45 + .55 * sin(time * (1.2 + seed.y * 2.) + seed.x * 20.)) * smoothstep(.25, .9, -mv.z);
        }`,
      fragmentShader: `
        uniform vec3 color; uniform float strength; varying float vA;
        void main() { float d = length(gl_PointCoord - .5); gl_FragColor = vec4(color * smoothstep(.5, .05, d) * vA * strength, 1.); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    this.dust = new THREE.Points(dg, this.dustMat);
    this.dust.renderOrder = 6; this.dust.frustumCulled = false;
    parent.add(this.dust);

    this.night = night; this.level = 0; this.slow = 0; this.frames = 0; this.ms = 0; this.lastAt = 0; this.w = size.x; this.h = size.y;
    this.setNight(night, true);
  }
  setNight(night, now = false) {
    this.night = night;
    this.goal = {shaft: night ? .12 : .45, dust: night ? .5 : 1.1, bloom: night ? .5 : .34};
    if (now) { this.shaftMat.uniforms.strength.value = this.goal.shaft; this.dustMat.uniforms.strength.value = this.goal.dust; }
  }
  setSize(w, h) {
    this.w = w; this.h = h;
    this.composer.setSize(w, h);
    this.dustMat.uniforms.scale.value = h * this.ratio;
  }
  // The average frame time so far (ms), for the QA run.
  get frameMs() { return this.frames ? this.ms / this.frames : 0; }
  render(dt, t) {
    const d = THREE.MathUtils.damp, k = this.night ? NIGHT : DAY;
    for (const m of [this.shaftMat, this.dustMat]) { m.uniforms.time.value = t; m.uniforms.color.value.lerp(k, 1 - Math.exp(-3 * dt)); }
    this.shaftMat.uniforms.strength.value = d(this.shaftMat.uniforms.strength.value, this.goal.shaft, 3, dt);
    this.dustMat.uniforms.strength.value = d(this.dustMat.uniforms.strength.value, this.goal.dust, 3, dt);
    this.bloom.strength = this.goal.bloom;
    this.grade.uniforms.time.value = t % 100;
    this.composer.render(dt);
    // A slow phone: first a smaller picture, then no glow. (Measured on
    // real time, over a run of frames, not on one slow frame.)
    const now = performance.now(), took = now - this.lastAt;
    this.lastAt = now;
    if (took > 0 && took < 500) {
      this.frames++; this.ms += took;
      this.slow = took > 40 ? this.slow + 1 : Math.max(0, this.slow - 1);
      if (this.slow > 24 && this.level < 2 && !this.fixed) {
        this.level++; this.slow = 0;
        if (this.level === 1) { this.ratio = 1; this.composer.setPixelRatio(1); this.setSize(this.w, this.h); }
        else this.bloom.enabled = false;
      }
    }
  }
  dispose() {
    this.parent.remove(this.shafts, this.dust);
    for (const o of [this.shafts.geometry, this.shaftMat, this.dust.geometry, this.dustMat, this.bloom, this.grade, this.composer]) o.dispose?.();
    this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose();
  }
}
