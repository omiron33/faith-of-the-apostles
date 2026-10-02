// 34 · "But why did He come? / Why take our frame? / Why step into sorrow, / suffering and shame?"
// The slower, melodic verse. Night, rain, low over a heaving dark sea under a low ceiling of cloud;
// far out one small warm light rides the swell, its broken reflection the only warmth in the frame.
// We drift toward it, rising and falling with the sea, as the questions are asked.
import { grade, ease, drift } from '/song/lib/look.js';
import { WHY_GLSL, WHY_UNIFORMS } from '/song/lib/x-s34-why.js';
import { cameraPlane } from '/engine.js';

export const kind = 'shader';

export default (P) => {
  const cam = (t) => {
    const p = ease.inOut3(Math.min(1, Math.max(0, (t - P.from) / (P.to - P.from))));
    const d = drift(t, 0.04);
    const heave = 0.35 * Math.sin(t * 0.62 + 0.4) + 0.12 * Math.sin(t * 1.1 + 2.0);
    return { pos: [d[0] + 2 * p, 4.2 + heave + d[1], 20 * p], target: [18, -38 + 3 * heave, 480], fov: 44, roll: 0.02 * Math.sin(t * 0.55 + 1.0) };
  };
  return {
    name: 's34-why', from: P.from, to: P.to,
    frag: WHY_GLSL + /* glsl */ `
vec3 shade(vec2 fc) { vec3 ro; vec3 rd = camRay(fc, ro); return whyScene(ro, rd); }`,
    uniforms: { ...WHY_UNIFORMS },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    post(t) { return grade(t, { exposure: 1.9, bloom: 0.18, threshold: 0.8, contrast: 1.06, saturation: 0.9, grain: 0.025, vignette: 0.5, lift: [0.006, 0.008, 0.012], gain: [0.98, 1.0, 1.03] }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.88, 0.72], amount: 0.4 } }; },
  };
};
