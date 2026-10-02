// s28-tomb: "The Word took flesh. / The grave gave way. / And death itself / could not make Him stay."
// A rock-cut tomb in a garden at night, cold moonlight on pale limestone, the great round stone shut
// in its channel with only a thread of warm light round its rim. On "gave way" the stone rolls aside;
// light pours out of the low doorway and lays a bright path across the rock floor, and inside the
// grave clothes lie folded on the bench, the head cloth rolled up apart. On "could not make Him stay"
// the light floods out toward the camera until the night is full of it.
import { grade, ease, drift, linesAt, clamp01, spring } from '/song/lib/look.js';
import { TOMB_GLSL, TOMB_UNIFORMS } from '/song/lib/x-s28-tomb.js';

export const kind = 'shader';

export default (P) => {
  const [A, B, C, D] = linesAt(P.from - 0.6, 'The Word took flesh', 'The grave gave way', 'And death itself', 'could not make Him stay');
  const gave = B.words.find((w) => /^gave/i.test(w.w)).start;
  const stay = D.start;
  // the stone: a heavy start, rolling through "gave way", settling with a little rock back
  const roll = (t) => 2.15 * (ease.inOut3(clamp01((t - gave + 0.25) / 1.2)) + 0.03 * Math.sin(clamp01((t - gave - 0.95) / 0.6) * Math.PI));
  const glory = (t) => {
    const open = ease.inOut3(clamp01((t - gave + 0.1) / 1.0));
    const flood = ease.inOut3(clamp01((t - stay) / (P.to - stay)));
    return 0.6 + 7.4 * open + 30 * flood + 90 * ease.in2(clamp01((t - P.to + 1.0) / 1.0));
  };
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.01);
    return { pos: [-0.85 + 0.55 * p + d[0], 0.75 - 0.1 * p + d[1], -6.8 + 1.8 * p], target: [-0.3 + 0.26 * p, 1.65 - 0.1 * p, 0.0], fov: 42 };
  };
  return {
    name: 's28-tomb', from: P.from, to: P.to,
    frag: TOMB_GLSL + 'vec3 shade(vec2 fc) { return tomb(fc); }',
    uniforms: { ...TOMB_UNIFORMS, uAper: 0.008 },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uRoll.value = roll(t);
      u.uGlory.value = glory(t);
      u.uFlood.value = ease.inOut3(clamp01((t - stay) / (P.to - stay)));
      u.uFocus.value = Math.hypot(c.pos[0], c.pos[1] - 1, c.pos[2]);
    },
    post(t) {
      const f = ease.inOut3(clamp01((t - stay) / (P.to - stay)));
      return grade(t, { exposure: 1.9, bloom: 0.1 + 0.12 * f, threshold: 1.0, contrast: 1.0, lift: [0.0, 0.0, 0.0], saturation: 1.0, vignette: 0.5, grain: 0.022 });
    },
    finish(t) { return { grade: { shadows: [0.0, 0.004, 0.012], highlights: [1.0, 0.95, 0.85], amount: 0.4 } }; },
  };
};
