// s36-theosis: "Made in His image, / called toward His light, / drawn from the darkness,"
// Iron in the fire, the Fathers' image of theosis: a black square bar lies in a forge's coals. On
// each line the bellows breathe (the coals flare, sparks rise) and the heat climbs and creeps out
// along the bar: dull cherry on "image", orange to yellow through "called toward His light", and on
// "drawn" the iron goes white and shines like the fire itself, still unmistakably iron. The camera
// lies low beside the bar and drifts slowly along it toward the fire.
import { grade, ease, drift, linesAt, clamp01 } from '/song/lib/look.js';
import { FORGE_GLSL, FORGE_UNIFORMS } from '/song/lib/x-s36-theosis.js';

export const kind = 'shader';

export default (P) => {
  const [A, B, C] = linesAt(P.from - 0.6, 'Made in His image', 'called toward His light', 'drawn from the darkness');
  const drawn = C.start;
  const heat = (t) => {
    const k = [[P.from - 0.2, 0.0], [A.start + 0.3, 0.06], [B.start - 0.2, 0.3], [B.end + 0.3, 0.62], [drawn - 0.1, 0.72], [drawn + 1.3, 1.0]];
    if (t <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (t < k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * ease.inOut3((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
    return 1.0;
  };
  // the bellows: a breath on each line's first word
  const breath = (t) => [A.start, B.start, drawn].reduce((s, t0) => s + (t < t0 - 0.15 ? 0 : Math.exp(-(t - t0 + 0.15) * 1.6) * clamp01((t - t0 + 0.15) / 0.3)), 0);
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.003);
    return { pos: [-0.62 + 0.1 * p + d[0], 0.34 - 0.06 * p + d[1], 0.78 - 0.14 * p], target: [0.0 + 0.05 * p, 0.02, 0.0], fov: 36 };
  };
  return {
    name: 's36-theosis', from: P.from, to: P.to,
    frag: FORGE_GLSL + 'vec3 shade(vec2 fc) { return forge(fc); }',
    uniforms: { ...FORGE_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uHeat.value = heat(t);
      u.uBreath.value = breath(t);
      u.uFocus.value = Math.hypot(c.pos[0] - 0.05, c.pos[1] - 0.05, c.pos[2] - 0.01);
    },
    post(t) { return grade(t, { exposure: 1.5, bloom: 0.14, threshold: 1.0, contrast: 1.0, lift: [0, 0, 0], vignette: 0.5, grain: 0.022 }); },
    finish(t) { return { leak: { amount: 0.06, warm: [1.0, 0.45, 0.15], cool: [0.5, 0.25, 0.2], speed: 0.06 }, grade: { shadows: [0.0, 0.002, 0.008], highlights: [1.0, 0.93, 0.8], amount: 0.35 } }; },
  };
};
