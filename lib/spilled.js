// The Church of the Savior on Spilled Blood: the architecture of a published model of the
// church (geometry only), with every photographic texture thrown away and each surface
// redrawn in code: gold-ground mosaics of ornament laid tessera by tessera (each tile tilted so it
// glints), cobalt mosaic vaults sown with gold, book-matched marbles and jaspers, brick. Lit like a
// church at night: candles low, chandeliers, haze. Only geometry comes from the file.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const URL = '/song/models/savior-on-spilled-blood/savior-on-spilled-blood.gltf';

// material name -> how it is drawn: kind (0 plain, 1 marble, 2 gold mosaic, 3 cobalt mosaic,
// 4 brick), base colour, vein colour (linear)
function look(name) {
  const n = name.toLowerCase();
  const K = (kind, base, vein = [0.3, 0.3, 0.3]) => ({ kind, base, vein });
  if (/brick/.test(n)) return K(4, [0.32, 0.1, 0.06]);
  if (/cobalt/.test(n)) return K(3, [0.02, 0.06, 0.32]);
  if (/gold mosaic|photographic|photo-atlas|apse episcopal/.test(n)) return K(2, [0.95, 0.66, 0.26]);
  if (/pink ochre/.test(n)) return K(1, [0.62, 0.36, 0.26], [0.85, 0.7, 0.6]);
  if (/grey green/.test(n)) return K(1, [0.2, 0.26, 0.22], [0.6, 0.66, 0.6]);
  if (/violet grey jasper/.test(n)) return K(1, [0.26, 0.2, 0.26], [0.5, 0.42, 0.5]);
  if (/rhodonite|pink veined/.test(n)) return K(1, [0.5, 0.18, 0.2], [0.85, 0.6, 0.6]);
  if (/yellow siena/.test(n)) return K(1, [0.62, 0.45, 0.18], [0.4, 0.26, 0.1]);
  if (/white grey|polished veined|cream/.test(n)) return K(1, [0.66, 0.64, 0.6], [0.35, 0.35, 0.38]);
  if (/black green|dark green/.test(n)) return K(1, [0.03, 0.07, 0.05], [0.4, 0.5, 0.45]);
  if (/pale green/.test(n)) return K(1, [0.3, 0.42, 0.34], [0.6, 0.7, 0.62]);
  if (/honey/.test(n)) return K(1, [0.6, 0.38, 0.14], [0.85, 0.65, 0.35]);
  if (/porphyry|rust red/.test(n)) return K(1, [0.28, 0.05, 0.05], [0.55, 0.3, 0.28]);
  if (/flagstone|cobbles/.test(n)) return K(1, [0.24, 0.23, 0.22], [0.12, 0.12, 0.12]);
  return null;
}

const GLSL_FN = /* glsl */ `
varying vec3 vWP; varying vec3 vWN;
uniform int uKind; uniform vec3 uBase, uVein; uniform float uSeed, uTime2, uR;
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1, 0)), u.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), u.x), u.y); }
float fb(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03; a *= 0.5; } return s; }
// surface coordinates in metres: the plane the surface mostly faces
vec2 suv(vec3 p, vec3 n) { vec3 a = abs(n); return a.y > max(a.x, a.z) ? p.xz : a.x > a.z ? p.zy : p.xy; }
vec3 marbleC(vec2 p, vec3 base, vec3 vein) {
  float w = fb(p * 0.9 + uSeed) * 7.0;
  float v = 1.0 - abs(sin((p.x * 1.3 + p.y * 0.7) * 1.4 + w));
  float vv = smoothstep(0.97, 0.998, v) * (0.5 + 0.5 * fb(p * 5.0));
  vec3 c = base * (0.86 + 0.28 * fb(p * 2.3 + 7.0));
  return mix(c, vein, vv * 0.3);
}
// ornament for gold mosaic panels: evaluated at each tessera's centre
vec3 ornament(vec2 q, float seed) {
  vec3 gold = vec3(0.95, 0.66, 0.26), red = vec3(0.45, 0.04, 0.03), blue = vec3(0.03, 0.08, 0.38), green = vec3(0.04, 0.2, 0.1), white = vec3(0.75, 0.72, 0.64);
  vec2 P = vec2(1.1, 1.5);
  vec2 cell = floor(q / P), f = fract(q / P) - 0.5;
  float s = h12(cell + seed);
  vec2 a = abs(f) * P;
  vec3 c = gold;
  // panel border: a band of red with a white pearl line, then blue
  float edge = min(P.x * 0.5 - a.x, P.y * 0.5 - a.y);
  if (edge < 0.06) c = red;
  if (edge < 0.035 && fract((f.x + f.y) * 18.0) < 0.5) c = white;
  if (edge < 0.015) c = blue;
  // the panel's motif: a rosette, a cross in a ring, or a vine scroll
  vec2 m = f * P;
  float r = length(m), ang = atan(m.y, m.x);
  if (s < 0.4) {
    float pet = 0.18 + 0.12 * abs(cos(ang * 4.0));
    if (r < pet) c = mix(red, blue, step(0.1, r));
    if (r < 0.05) c = white;
    if (abs(r - 0.34) < 0.02) c = green;
  } else if (s < 0.75) {
    float arm = min(max(abs(m.x) - 0.05, abs(m.y) - 0.26), max(abs(m.x) - 0.2, abs(m.y - 0.07) - 0.045));
    if (arm < 0.0) c = red;
    if (abs(r - 0.36) < 0.025) c = blue;
  } else {
    float vine = abs(m.y - 0.16 * sin(m.x * 9.0 + seed)) - 0.018;
    if (vine < 0.0) c = green;
    vec2 lp = vec2(fract(m.x * 1.43) - 0.5, m.y - 0.16 * sin((floor(m.x * 1.43) + 0.5) / 1.43 * 9.0 + seed) - 0.08);
    if (length(lp * vec2(1.0, 1.6)) < 0.07) c = red;
  }
  return c;
}
`;

function procMaterial(THREE, mat, L, seed) {
  mat.map = null; mat.normalMap = null; mat.roughnessMap = null; mat.metalnessMap = null; mat.aoMap = null;
  mat.color = new THREE.Color(1, 1, 1);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uKind = { value: L.kind };
    sh.uniforms.uBase = { value: new THREE.Vector3(...L.base) };
    sh.uniforms.uVein = { value: new THREE.Vector3(...L.vein) };
    sh.uniforms.uSeed = { value: seed };
    sh.uniforms.uTime2 = { value: 0 };
    sh.uniforms.uR = { value: L.rough ?? 0.2 };
    sh.vertexShader = 'varying vec3 vWP; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = GLSL_FN + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 uv0 = suv(vWP, vWN);
        float tGrout = 0.0; vec2 tTilt = vec2(0.0); float tGold = 0.0;
        if (uKind == 1) diffuseColor.rgb = marbleC(uv0, uBase, uVein);
        else if (uKind == 4) {
          vec2 g = uv0 / vec2(0.25, 0.075); g.x += 0.5 * mod(floor(g.y), 2.0);
          vec2 f = fract(g);
          float mort = smoothstep(0.06, 0.0, min(min(f.x, 1.0 - f.x) * 0.25, min(f.y, 1.0 - f.y) * 0.075) - 0.006);
          diffuseColor.rgb = mix(uBase * (0.75 + 0.5 * h12(floor(g))), vec3(0.32, 0.3, 0.27), mort);
        } else if (uKind == 2 || uKind == 3) {
          float ts = 0.014;
          vec2 g = uv0 / ts; g.x += 0.5 * mod(floor(g.y), 2.0);
          vec2 id = floor(g), f = fract(g) - 0.5;
          vec2 e = abs(f) - 0.42;
          tGrout = smoothstep(-0.03, 0.03, max(e.x, e.y));
          vec2 cq = (id + 0.5) * ts;
          vec3 c;
          if (uKind == 2) c = ornament(cq, uSeed);
          else {
            vec2 sq = cq * 2.2; vec2 sid = floor(sq), sf = fract(sq) - 0.5;
            float star = step(length(sf) - 0.05 - 0.06 * pow(abs(cos(atan(sf.y, sf.x) * 4.0)), 8.0), 0.0);
            c = mix(uBase, vec3(0.95, 0.66, 0.26), star);
          }
          float hv = h12(id + uSeed);
          c *= 0.9 + 0.2 * hv;
          tGold = step(0.6, c.r) * step(c.b, 0.4);
          diffuseColor.rgb = mix(c, c * 0.6 + vec3(0.06, 0.045, 0.02), tGrout);
          tTilt = (h22(id + 3.1) - 0.5) * 0.12 * (1.0 - tGrout);
        }`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        if (uKind == 2 || uKind == 3) metalnessFactor = tGold * 0.9;
        if (uKind == 1) metalnessFactor = 0.0;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        if (uKind == 2 || uKind == 3) roughnessFactor = mix(0.5, 0.34, tGold);
        if (uKind == 1) roughnessFactor = uR + 0.08 * fb(uv0 * 4.0);
        if (uKind == 4) roughnessFactor = 0.85;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (uKind == 2 || uKind == 3) { vec3 tu = normalize(cross(normal, vec3(0.0, 1.0, 0.001))); vec3 tv = cross(normal, tu); normal = normalize(normal + tu * tTilt.x + tv * tTilt.y); }`);
  };
  mat.customProgramCacheKey = () => 'spilled-' + L.kind;
  mat.needsUpdate = true;
}

export async function spilledBlood({ THREE, renderer }, o = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.0, 0.0, 0.0);
  const draco = new DRACOLoader();
  draco.setDecoderPath('/node_modules/three/examples/jsm/libs/draco/');
  const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  const gltf = await loader.loadAsync(URL);
  const root = gltf.scene;
  let seed = 0;
  const done = new Set();
  root.traverse((m) => {
    if (!m.isMesh || done.has(m.material)) return;
    const mat = m.material; done.add(mat);
    const L = look(mat.name);
    const isFloor = /floor|inlay|medallion|pavement|flagstone|cobbles/i.test(mat.name);
    if (L && isFloor) { L.rough = 0.7; L.base = L.base.map((v) => v * 0.55); L.vein = L.vein.map((v) => v * 0.55); }
    if (L) procMaterial(THREE, mat, L, (seed++ * 7.31) % 97);
    else { mat.map = null; }
    mat.emissiveMap = null;
    mat.envMapIntensity = isFloor ? 0.12 : (o.envIntensity ?? 0.6);
    if (isFloor) mat.specularIntensity = 0.25;
    if (/glazing|glass recess/i.test(mat.name)) { mat.color = new THREE.Color(0.01, 0.012, 0.02); mat.emissive = new THREE.Color(0.006, 0.009, 0.02); mat.emissiveIntensity = 1.0; mat.transmission = 0; mat.transparent = false; mat.opacity = 1; }
    if (/wax candle/i.test(mat.name)) { mat.emissive = new THREE.Color(1.0, 0.55, 0.2); mat.emissiveIntensity = 6; }
  });
  scene.add(root);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = o.envIntensity ?? 0.25;
  const hemi = new THREE.HemisphereLight(0xffcf94, 0x3a2410, o.fill ?? 3.0);   // only candle warmth
  scene.add(hemi);
  const lamps = [];
  for (const [x, y, z, k] of o.lamps ?? [[0, 9, 4, 1], [-6, 9, 0, 0.7], [6, 9, 0, 0.7], [0, 14, -6, 1.0]]) {
    const l = new THREE.PointLight(0xffa955, 120 * k * (o.candle ?? 1), 0, 2);
    l.position.set(x, y, z); scene.add(l); lamps.push(l);
  }
  const box = new THREE.Box3().setFromObject(root);
  return { scene, root, box, hemi, lamps };
}
