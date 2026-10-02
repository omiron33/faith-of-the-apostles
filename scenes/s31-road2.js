// 31 · "Ancient and living, / steady and true, / the road they walked / still carries us through."
// The map again in the second chorus: every road the Apostles walked burning, every church lit;
// the camera sweeps low across the whole sea from Rome to Jerusalem.
// A relief map of the Mediterranean on a table in candlelight: carved limestone lands, a hammered
// bronze sea. Lines of fire run out from Jerusalem along the apostles' roads; where each lands a
// small light kindles and a gilt dome rises. The camera starts low over Jerusalem and rises back to
// take in the whole sea as the last line reaches Rome on "go".
import { grade, ease, linesAt, drift, clamp, mix } from '/song/lib/look.js';
import { MAP_GLSL, MAP_UNIFORMS, ROUTES } from '/song/lib/x-s05-map.js';
import { cameraPlane } from '/engine.js';

export const kind = 'shader';

export default (P) => {
  const plan = [0, 1, 2, 3, 4, 5, 6].map((i) => [i, P.from - 3, P.from - 1]);
  const cam = (t) => {
    const p = ease.inOut3((t - P.from) / (P.to - P.from));
    const d = drift(t, 0.004);
    const pos = [mix(1.6, -1.4, p), mix(0.55, 0.42, p), mix(-1.6, -1.3, p)];
    const target = [mix(0.6, -0.7, p), 0.0, mix(0.0, -0.1, p)];
    return { pos: pos.map((v, i) => v + (d[i] ?? 0)), target, fov: mix(38, 44, p) };
  };
  return {
    name: 's31-road2', from: P.from, to: P.to,
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
