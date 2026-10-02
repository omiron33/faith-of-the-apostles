// 05 · "They crossed the world with scars to show, / planting the Church wherever they'd go."
// A relief map of the Mediterranean on a table in candlelight: carved limestone lands, a hammered
// bronze sea. Lines of fire run out from Jerusalem along the apostles' roads; where each lands a
// small light kindles and a gilt dome rises. The camera starts low over Jerusalem and rises back to
// take in the whole sea as the last line reaches Rome on "go".
import { grade, ease, linesAt, drift, clamp, mix } from '/song/lib/look.js';
import { MAP_GLSL, MAP_UNIFORMS, ROUTES } from '/song/lib/x-s05-map.js';
import { cameraPlane } from '/engine.js';

export const kind = 'shader';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'They crossed', 'planting');
  const w = (L, re) => L.words.find((x) => re.test(x.w)).start;
  // [route index, launch, land]: ANTIOCH lands on "planting", ALEXANDRIA on "Church", ROME on "go"
  const plan = [
    [1, L1.words[0].start, w(L2, /^planting/)],
    [0, w(L1, /^crossed/), w(L2, /^the$/)],
    [2, w(L1, /^world/), w(L2, /^Church/)],
    [3, w(L1, /^with/), w(L2, /^Church/) + 0.35],
    [4, w(L1, /^scars/), w(L2, /^wherever/)],
    [5, w(L1, /^show/), w(L2, /^they/)],
    [6, w(L1, /^scars/) + 0.3, w(L2, /^go/)],
  ];
  const cam = (t) => {
    const p = ease.inOut3((t - P.from) / (P.to - P.from));
    const d = drift(t, 0.004);
    const pos = [mix(-2.0, -1.45, p), mix(0.34, 1.0, p), mix(-1.15, -2.0, p)];
    const target = [mix(-0.75, 0.0, p), 0.0, mix(-0.2, 0.1, p)];
    return { pos: pos.map((v, i) => v + (d[i] ?? 0)), target, fov: mix(38, 44, p) };
  };
  return {
    name: 's05-map', from: P.from, to: P.to,
    frag: MAP_GLSL + /* glsl */ `
vec3 shade(vec2 fc) { vec3 ro; vec3 rd = mapLens(fc, ro); int id; float th = mapMarch(ro, rd, id); return mapScene(ro, rd) + flames(ro, rd, th); }`,
    uniforms: { ...MAP_UNIFORMS },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    update(t, u, c) {
      for (const [i, a, b] of plan) {
        const x = clamp((t - a) / (b - a), 0, 1);
        const prog = x <= 0 ? 0 : 0.002 + 0.998 * (1 - (1 - x) ** 2);
        const rise = clamp((t - b) / 0.8, 0, 1);
        u['uR' + i].value.set(prog, ease.out3(rise), clamp((t - b) / 0.25, 0, 1));
      }
      const cc = cam(t);
      const dist = Math.hypot(cc.pos[0] - cc.target[0], cc.pos[1] - cc.target[1], cc.pos[2] - cc.target[2]);
      u.uFocus.value = dist * 0.8; u.uAper.value = 0.008;
    },
    post(t) { return grade(t, { exposure: 1.25, bloom: 0.18, threshold: 0.9, contrast: 1.06, saturation: 1.05, vignette: 0.55, grain: 0.025 }); },
    finish(t) { return { flare: { amount: 0.1, threshold: 1.2, tint: [1.0, 0.7, 0.4], length: 0.25 }, grade: { shadows: [0.03, 0.02, 0.02], highlights: [1.0, 0.92, 0.8], amount: 0.4 } }; },
  };
};
