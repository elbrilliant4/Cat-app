// Shell-textured fur. Each furry body part gets one instanced mesh that draws
// the part's geometry several times, each copy ("shell") pushed a little
// further out along the surface normal and combed in the direction the fur
// lies. A fragment shader keeps only the pixels that belong to a hair strand,
// so the stack of shells reads as a soft, thick coat. One draw call per part.
//
// Colouring is a seal-point pattern: white coat with chocolate points (face
// mask, ears, back, legs, tail), soft gradients and natural mottling.
import * as THREE from 'three';

const vertexHead = /* glsl */`
uniform float furLength;
uniform float furShells;
uniform vec3 furScale;
uniform vec3 furComb;
varying float vLayer;
varying vec2 vFurUv;
varying vec3 vFurPos;
`;

const fragmentHead = /* glsl */`
uniform float furDensity;
uniform vec3 furColor;
uniform vec3 furAccent;
uniform int furPattern;
uniform float furMix;
uniform float furGrad;
uniform vec4 furHoles[4];
varying float vLayer;
varying vec2 vFurUv;
varying vec3 vFurPos;
float furHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float furHash3(vec3 p) {
  p = fract(p * .3183099 + .1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float furNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(furHash3(i), furHash3(i + vec3(1, 0, 0)), f.x), mix(furHash3(i + vec3(0, 1, 0)), furHash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(furHash3(i + vec3(0, 0, 1)), furHash3(i + vec3(1, 0, 1)), f.x), mix(furHash3(i + vec3(0, 1, 1)), furHash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// How much of the dark point colour shows, in the part's own unit-sphere space.
float furPoint(vec3 p) {
  vec3 d = normalize(p);
  float mottle = (furNoise(p * 3.5) - 0.5) * 0.35 + (furNoise(p * 9.0) - 0.5) * 0.15;
  if (furPattern == 1) {
    // Face: dark mask around the eyes and over the crown and sides, a white
    // inverted-V blaze running up from the nose, white muzzle and cheeks.
    float mask = 0.0;
    for (int i = 0; i < 2; i++) mask = max(mask, smoothstep(furHoles[i].w - 0.33, furHoles[i].w - 0.06, dot(d, furHoles[i].xyz)));
    mask = max(mask, smoothstep(0.0, 0.4, d.y));
    mask = max(mask, smoothstep(0.35, -0.3, d.z));
    mask = max(mask, smoothstep(0.62, 0.9, abs(d.x)) * smoothstep(-0.35, 0.0, d.y));
    float w = 0.05 + 0.32 * clamp(0.25 - d.y, 0.0, 1.0);
    float blaze = (1.0 - smoothstep(w, w + 0.06, abs(d.x))) * smoothstep(0.42, 0.12, d.y) * smoothstep(0.35, 0.7, d.z);
    mask *= 1.0 - blaze;
    mask *= 1.0 - smoothstep(-0.12, -0.32, d.y) * smoothstep(0.1, 0.5, d.z) * (1.0 - smoothstep(0.55, 0.8, abs(d.x)));
    // A smoky chin.
    mask = max(mask, smoothstep(-0.55, -0.8, d.y) * smoothstep(0.2, 0.6, d.z) * 0.55);
    return clamp(mask + mottle * 0.5, 0.0, 1.0);
  }
  return clamp(furMix + furGrad * d.y + mottle, 0.0, 1.0);
}
`;

export class Fur {
  constructor() {
    this.parts = [];
  }

  /**
   * Grow fur on a mesh.
   * opts: {length, density, shells, color (base coat), accent (point colour),
   *        mix (how much point colour), grad (extra point colour toward +y),
   *        pattern (1 = face), comb (object-space direction the fur lies),
   *        holes: [Vector3 dir, cosAngle][] — bare spots for eyes, nose, mouth}
   */
  add(mesh, opts = {}) {
    const shells = opts.shells ?? 16;
    const uniforms = {
      furLength: {value: opts.length ?? .05},
      furShells: {value: shells},
      furScale: {value: mesh.scale.clone()},
      furComb: {value: (opts.comb ?? new THREE.Vector3(0, -.4, -1)).clone().normalize()},
      furDensity: {value: (opts.density ?? 70) * 2.2},
      furColor: {value: new THREE.Color(opts.color ?? '#f7f3ee')},
      furAccent: {value: new THREE.Color(opts.accent ?? '#5b3c2b')},
      furPattern: {value: opts.pattern ?? 0},
      furMix: {value: opts.mix ?? 0},
      furGrad: {value: opts.grad ?? 0},
      furHoles: {value: Array.from({length: 4}, (_, i) => {
        const h = opts.holes?.[i];
        return h ? new THREE.Vector4(h[0].x, h[0].y, h[0].z, h[1]) : new THREE.Vector4(0, 0, 0, 2);
      })},
    };
    const material = new THREE.MeshStandardMaterial({roughness: .92, metalness: 0});
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + vertexHead)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vLayer = (float(gl_InstanceID) + 1.0) / furShells;
          vFurUv = uv;
          vFurPos = position;
          vec3 furN = normalize(objectNormal / furScale);
          // Strands rise from the skin, then bend the way the coat is combed.
          vec3 furOffset = furN * vLayer * furLength + furComb * (vLayer * vLayer * furLength * 0.75);
          transformed += furOffset / furScale;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + fragmentHead)
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec2 furG = vFurUv * vec2(furDensity * 2.0, furDensity);
          vec2 furCell = floor(furG);
          float furSeed = furHash(furCell);
          vec2 furF = fract(furG) - 0.5 - (vec2(furHash(furCell + 7.1), furHash(furCell + 3.3)) - 0.5) * 0.5;
          float furH = mix(0.45, 1.0, furSeed);
          vec3 furD = normalize(vFurPos);
          for (int i = 0; i < 4; i++) {
            if (furHoles[i].w > 1.0) continue;
            float holeAngle = acos(clamp(dot(furD, furHoles[i].xyz), -1.0, 1.0));
            float holeRadius = acos(furHoles[i].w);
            furH *= smoothstep(holeRadius * 0.82, holeRadius * 1.12 + 0.01, holeAngle);
          }
          if (vLayer > furH) discard;
          if (length(furF) > 0.62 * (1.0 - vLayer / furH) + 0.08) discard;
          float point = furPoint(vFurPos);
          vec3 furCol = mix(furColor, furAccent, point);
          // Every hair is a little different; roots sit in shadow, tips catch light.
          furCol *= 0.9 + 0.2 * furHash(furCell + 1.7);
          furCol = mix(furCol, furCol * vec3(1.06, 1.0, 0.95), furHash(furCell + 9.2) * 0.5);
          furCol *= mix(0.48, 1.08, pow(vLayer, 0.7));
          diffuseColor.rgb = furCol;`);
    };
    material.customProgramCacheKey = () => 'pocket-kitten-fur';

    const shell = new THREE.InstancedMesh(mesh.geometry, material, shells);
    shell.frustumCulled = false;
    shell.castShadow = false;
    shell.receiveShadow = true;
    shell.raycast = () => {};
    // The shell is the part's child, so it moves with it; the fur shader
    // undoes the part's scale itself.
    mesh.add(shell);
    // The undercoat: the solid part in a darker version of its coat colour.
    const base = new THREE.Color(opts.color ?? '#f7f3ee').lerp(new THREE.Color(opts.accent ?? '#5b3c2b'), Math.min(1, (opts.mix ?? 0) + (opts.pattern === 1 ? .5 : 0)));
    mesh.material = mesh.material.clone();
    mesh.material.color = base.multiplyScalar(.6);
    mesh.material.roughness = 1;
    this.parts.push({mesh, shell, uniforms});
    return uniforms;
  }
}
