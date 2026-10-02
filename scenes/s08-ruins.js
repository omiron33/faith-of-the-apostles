// 08 · "Not dug from ruins, / not built anew— / what they received, / they carried through."
// A ruined colonnade in cold moonlight. A single lantern light, carried at walking height by no one
// we see, comes in through the right-hand row, crosses between the broken columns and goes on up the
// aisle into the dark, lighting each column's flank as it passes. The camera drifts after it.
import { grade, ease, drift, clamp, mix } from '/song/lib/look.js';
import { RUINS_GLSL, RUINS_UNIFORMS } from '/song/lib/x-s08-ruins.js';
import { cameraPlane } from '/engine.js';

export const kind = 'shader';

// the lantern's path: a smooth curve through these points over the scene
const PATH = [[4.4, 1.0], [3.3, 1.5], [2.0, 2.6], [1.0, 4.4], [0.45, 6.8], [0.2, 9.6], [0.1, 12.0]];
function lanternAt(u) {
  u = clamp(u, 0, 1) * (PATH.length - 1);
  const i = Math.min(PATH.length - 2, Math.floor(u)), f = u - i;
  const p0 = PATH[Math.max(0, i - 1)], p1 = PATH[i], p2 = PATH[i + 1], p3 = PATH[Math.min(PATH.length - 1, i + 2)];
  const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
}

export default (P) => {
  const dur = P.to - P.from;
  const lant = (t) => {
    const u = (t - P.from + 0.3) / (dur + 0.6);
    const [x, z] = lanternAt(u);
    const step = (t - P.from) * 2 * Math.PI * 0.95;          // the walker's pace
    const sway = 0.035 * Math.sin(step * 0.5 + 0.4);           // the lantern swings on its handle
    return [x + sway, 0.82 + 0.025 * Math.abs(Math.sin(step * 0.5)), z];
  };
  const cam = (t) => {
    const p = ease.inOut3((t - P.from) / dur);
    const d = drift(t, 0.01);
    return { pos: [mix(-0.9, -0.3, p) + d[0], mix(1.25, 1.45, p) + d[1], mix(-3.4, -1.6, p)], target: [mix(1.4, 0.4, p), mix(1.55, 1.9, p), mix(6.0, 12.0, p)], fov: 44 };
  };
  return {
    name: 's08-ruins', from: P.from, to: P.to,
    frag: RUINS_GLSL + /* glsl */ `
vec3 shade(vec2 fc) { vec3 ro; vec3 rd = ruinsLens(fc, ro); return ruinsScene(ro, rd); }`,
    uniforms: { ...RUINS_UNIFORMS, uAperR: 0.02 },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    update(t, u) {
      const L = lant(t);
      u.uLant.value.set(...L);
      const c = cam(t);
      u.uFocusR.value = Math.hypot(L[0] - c.pos[0], L[1] - c.pos[1], L[2] - c.pos[2]);
      u.uLantK.value = clamp((t - P.from + 0.2) / 0.5, 0, 1);
    },
    post(t) { return grade(t, { exposure: 1.75, bloom: 0.16, threshold: 0.85, contrast: 1.08, saturation: 0.95, vignette: 0.55, grain: 0.03, lift: [0.006, 0.008, 0.014] }); },
    finish(t) { return { flare: { amount: 0.18, threshold: 0.9, tint: [1.0, 0.72, 0.45], length: 0.35 }, grade: { shadows: [0.0, 0.02, 0.06], highlights: [1.0, 0.9, 0.78], amount: 0.45 } }; },
  };
};
