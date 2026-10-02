// 12 · "Ancient and living, / steady and true, / the road they walked / still carries us through."
// The old road in the last gold of the evening, the camera low on the worn stones moving on up it.
// Dusk on an old Roman road: worn basalt paving holding the afterglow, dry grass along the verges
// moving in the wind, the valley winding up toward a monastery on its hill with one window lit.
// The camera walks slowly up the road at a walker's eye height; on "prayers" the window warms.
import { grade, ease, linesAt, drift, clamp } from '/song/lib/look.js';
import { ROAD_GLSL, ROAD_UNIFORMS, roadX, MON } from '/song/lib/x-s02-road.js';
import { cameraPlane } from '/engine.js';
import { FINISH } from '/premium/finish.js';

export const kind = 'shader';
const roadY = (z) => 1.2 * Math.sin(z * 0.013 + 0.5) + 0.02 * z;

export default (P) => {
  const tPray = P.from;
  const cam = (t) => {
    const p = ease.inOut3((t - P.from) / (P.to - P.from));
    const z = 12.0 + 6.0 * p;
    const d = drift(t, 0.012);
    const x = roadX(z) + 0.35;
    return { pos: [x + d[0], roadY(z) + 0.55 + d[1], z], target: [MON[0] - 9 + 3 * p, 31 + 1.5 * p, MON[1]], fov: 31, roll: 0.004 };
  };
  return {
    name: 's12-nave', from: P.from, to: P.to,
    frag: ROAD_GLSL + /* glsl */ `
vec3 shade(vec2 fc) { vec3 ro; vec3 rd = roadLens(fc, ro); return roadScene(ro, rd); }`,
    uniforms: { ...ROAD_UNIFORMS, uAperR: 0.015, uFocusR: 200.0 },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    update(t, u) {
      u.uDusk.value = 0.2 + 0.25 * clamp((t - P.from) / (P.to - P.from), 0, 1);
      u.uWin.value = 1.1;
    },
    post(t) { return grade(t, { exposure: 1.15, bloom: 0.16, threshold: 0.9, contrast: 1.06, saturation: 1.02, vignette: 0.5, grain: 0.025 }); },
    finish(t) { return { flare: { amount: 0.12, threshold: 1.2, tint: [1.0, 0.7, 0.45], length: 0.3 }, grade: { shadows: [0.0, 0.02, 0.05], highlights: [1.0, 0.92, 0.8], amount: 0.45 } }; },
  };
};
