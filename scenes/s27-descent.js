// 27 · "Not because she made / the One above, / but because God / came down in love."
// A storm over a dark sea. We look up first, at the heavy ceiling of cloud, where a break opens on
// "the One above"; on "but because God" a shaft of warm light starts down through it, reaching the
// water on "came down", and the sea warms outward from where it lands. The camera tilts down with
// the light, from the sky to the water.
import { grade, ease, drift, linesAt } from '/song/lib/look.js';
import { DESCENT_GLSL, DESCENT_UNIFORMS } from '/song/lib/x-s27-descent.js';
import { cameraPlane } from '/engine.js';

export const kind = 'shader';
const c01 = (x) => Math.min(1, Math.max(0, x));

export default (P) => {
  const [A, B, C, D] = linesAt(P.from - 0.6, 'Not because', 'the One above', 'but because God', 'came down');
  const tOne = B.words[1].start, tBut = C.words[0].start, tDown = D.words[1].start;
  const tilt = (t) => ease.inOut3(c01((t - (tBut - 0.6)) / (tDown + 0.6 - (tBut - 0.6))));
  const cam = (t) => {
    const p = c01((t - P.from) / (P.to - P.from)), k = tilt(t), d = drift(t, 0.05);
    const bob = 0.25 * Math.sin(t * 0.9) + 0.1 * Math.sin(t * 1.7 + 1.0);
    return { pos: [d[0], 11.0 + bob + d[1], -30 + 18 * p], target: [-20, 250 - 215 * k, 540], fov: 52, roll: 0.012 * Math.sin(t * 0.7) };
  };
  return {
    name: 's27-descent', from: P.from, to: P.to,
    frag: DESCENT_GLSL + /* glsl */ `
vec3 shade(vec2 fc) { vec3 ro; vec3 rd = camRay(fc, ro); return descentScene(ro, rd); }`,
    uniforms: { ...DESCENT_UNIFORMS },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    update(t, u) {
      u.uOpen.value = 0.12 + 0.88 * ease.out3(c01((t - (tOne - 1.4)) / 3.2));
      u.uShaft.value = ease.inOut3(c01((t - (tBut - 0.2)) / (tDown + 0.15 - (tBut - 0.2))));
      u.uWarm.value = ease.out3(c01((t - tDown + 0.1) / 2.4));
    },
    post(t) { return grade(t, { exposure: 1.2, bloom: 0.2, threshold: 0.95, contrast: 1.08, saturation: 0.95, grain: 0.022, vignette: 0.5, lift: [0.006, 0.006, 0.008] }); },
    finish(t) { return { grade: { shadows: [0.0, 0.012, 0.03], highlights: [1.0, 0.9, 0.74], amount: 0.45 } }; },
  };
};
