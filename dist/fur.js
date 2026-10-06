// Shell-textured fur. Each furry body part gets one instanced mesh that draws
// the part's geometry several times, each copy ("shell") pushed a little
// further out along the surface normal. A fragment shader keeps only the
// pixels that belong to a hair strand, so the stack of shells reads as soft,
// thick fur. One draw call per part, whatever the shell count.
import * as THREE from 'three';

const vertexHead = /* glsl */`
uniform float furLength;
uniform float furShells;
uniform vec3 furScale;
varying float vLayer;
varying vec2 vFurUv;
varying vec3 vFurPos;
`;

const fragmentHead = /* glsl */`
uniform float furDensity;
uniform vec3 furColor;
uniform vec3 furAccent;
uniform int furPattern;
uniform vec4 furHoles[4];
uniform float furPhase;
varying float vLayer;
varying vec2 vFurUv;
varying vec3 vFurPos;
float furHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
// Colour markings in the part's own (unit sphere) space.
vec3 furPaint(vec3 p) {
  vec3 d = normalize(p);
  float accent = 0.0;
  if (furPattern == 1) {
    // Head: ginger cap and forehead stripes, warm mask around the eyes.
    float cap = smoothstep(0.35, 0.95, d.y) * 0.55;
    float stripes = smoothstep(0.35, 0.95, 0.5 + 0.5 * cos(d.x * 26.0)) * smoothstep(0.3, 0.6, d.y) * smoothstep(0.1, 0.6, d.z);
    float mask = 0.0;
    for (int i = 0; i < 2; i++) mask = max(mask, smoothstep(furHoles[i].w - 0.12, furHoles[i].w - 0.01, dot(d, furHoles[i].xyz)));
    accent = max(max(cap, stripes * 0.8), mask * 0.55);
    accent *= 1.0 - smoothstep(-0.05, -0.35, d.y);
  } else if (furPattern == 2) {
    // Back: a soft ginger saddle with faint tabby bands.
    float top = smoothstep(0.15, 0.85, d.y);
    accent = top * (0.45 + 0.4 * (0.5 + 0.5 * sin(d.z * 9.0 + furPhase)));
  } else if (furPattern == 3) {
    accent = 1.0;
  }
  return mix(furColor, furAccent, clamp(accent, 0.0, 1.0));
}
`;

const SHELL_GEOMETRIES = new WeakMap();

export class Fur {
  constructor() {
    this.parts = [];
  }

  /**
   * Grow fur on a mesh.
   * opts: {length, density, shells, color, accent, pattern, holes: [Vector3 dir, cosAngle][]}
   */
  add(mesh, opts = {}) {
    const shells = opts.shells ?? 14;
    const uniforms = {
      furLength: {value: opts.length ?? .05},
      furShells: {value: shells},
      furScale: {value: mesh.scale.clone()},
      furDensity: {value: (opts.density ?? 70) * 1.6},
      furColor: {value: new THREE.Color(opts.color ?? '#f2e4d2')},
      furAccent: {value: new THREE.Color(opts.accent ?? opts.color ?? '#d8955a')},
      furPattern: {value: opts.pattern ?? 0},
      furPhase: {value: opts.phase ?? 0},
      furHoles: {value: Array.from({length: 4}, (_, i) => {
        const h = opts.holes?.[i];
        return h ? new THREE.Vector4(h[0].x, h[0].y, h[0].z, h[1]) : new THREE.Vector4(0, 0, 0, 2);
      })},
    };
    const material = new THREE.MeshStandardMaterial({roughness: .95, metalness: 0});
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + vertexHead)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vLayer = (float(gl_InstanceID) + 1.0) / furShells;
          vFurUv = uv;
          vFurPos = position;
          vec3 furN = normalize(objectNormal / furScale);
          vec3 furOffset = furN * vLayer * furLength + vec3(0.0, -0.35 * vLayer * vLayer * furLength, 0.0);
          transformed += furOffset / furScale;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + fragmentHead)
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec2 furG = vFurUv * vec2(furDensity * 2.0, furDensity);
          vec2 furCell = floor(furG);
          vec2 furF = fract(furG) - 0.5 - (vec2(furHash(furCell + 7.1), furHash(furCell + 3.3)) - 0.5) * 0.45;
          float furH = mix(0.55, 1.0, furHash(furCell));
          vec3 furD = normalize(vFurPos);
          for (int i = 0; i < 4; i++) furH *= 1.0 - smoothstep(furHoles[i].w - 0.05, furHoles[i].w + 0.01, dot(furD, furHoles[i].xyz));
          if (vLayer > furH) discard;
          if (length(furF) > 0.6 * (1.0 - vLayer / furH) + 0.1) discard;
          diffuseColor.rgb = furPaint(vFurPos) * mix(0.8, 1.06, vLayer) * (0.95 + 0.1 * furHash(furCell + 1.7));`);
    };
    material.customProgramCacheKey = () => 'pocket-kitten-fur';

    let geo = SHELL_GEOMETRIES.get(mesh.geometry);
    if (!geo) { geo = mesh.geometry; SHELL_GEOMETRIES.set(mesh.geometry, geo); }
    const shell = new THREE.InstancedMesh(geo, material, shells);
    shell.frustumCulled = false;
    shell.castShadow = false;
    shell.receiveShadow = true;
    shell.raycast = () => {};
    // The shell inherits the part's transform by being its child, so it is
    // drawn at identity, and the fur shader undoes the part's scale itself.
    mesh.add(shell);
    // The undercoat: the solid part, slightly darker than the fur tips.
    mesh.material = mesh.material.clone();
    mesh.material.color = uniforms.furColor.value.clone().lerp(new THREE.Color('#9a7656'), .25);
    mesh.material.roughness = 1;
    this.parts.push({mesh, shell, uniforms});
    return uniforms;
  }
}
