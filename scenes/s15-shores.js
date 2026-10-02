// 15 · "But distance grows / when brothers divide. / East on one shore, / West on the other side."
// Night, low over black water, looking down a strait: the East's domed church on the left bank, the
// West's basilica dome on the right, both with candles in their windows, their light lying in long
// streaks on the water. A cold moon lays its path straight down the gap, and the gap widens as the
// camera falls slowly back.
import { grade, ease, drift, linesAt } from '/song/lib/look.js';
import { SHORES_GLSL, SHORES_UNIFORMS } from '/song/lib/x-s15-shores.js';
import { cameraPlane } from '/engine.js';
import { FINISH } from '/premium/finish.js';

export const kind = 'shader';

export default (P) => {
  const prog = (t) => ease.inOut3(Math.min(1, Math.max(0, (t - P.from) / (P.to - P.from))));
  const cam = (t) => {
    const p = prog(t), d = drift(t, 0.03);
    return { pos: [d[0], 2.6 + 0.6 * p + d[1], 30 - 40 * p], target: [0, 9.0, 320], fov: 40, roll: 0.004 * Math.sin(t * 0.5) };
  };
  const [, , E] = linesAt(P.from - 0.6, 'But distance', 'when brothers', 'East on one');
  return {
    name: 's15-shores', from: P.from, to: P.to,
    frag: SHORES_GLSL + /* glsl */ `
vec3 shade(vec2 fc) { vec3 ro; vec3 rd = camRay(fc, ro); return shoresScene(ro, rd); }`,
    uniforms: { ...SHORES_UNIFORMS },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    update(t, u) {
      // the strait opens through the scene, with a last push as "East" and "West" are named
      const p = prog(t), k = ease.inOut3(Math.min(1, Math.max(0, (t - E.start + 0.5) / 3.0)));
      u.uGap.value = 30 + 22 * p + 18 * k;
    },
    post(t) { return grade(t, { exposure: 1.25, bloom: 0.16, threshold: 0.9, contrast: 1.08, saturation: 0.85, lift: [0.004, 0.006, 0.012], gain: [0.96, 0.99, 1.04], vignette: 0.4, grain: 0.02 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.04], highlights: [1.0, 0.92, 0.8], amount: 0.4 } }; },
  };
};
