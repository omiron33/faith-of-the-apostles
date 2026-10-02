// s35-complete: "Not only pardon. / Not only release. / He came to make / the broken complete."
// A cracked earthenware cup on an old oak table by one beeswax candle. Its breaks run dark through
// the glaze; line by line molten gold runs into them from the lip down (kintsugi), until on
// "complete" the last seam closes and the whole mended cup catches the flame. The camera eases in
// low and close; the cup turns a little so the light rakes across the seams.
import { grade, ease, drift, linesAt, clamp01 } from '/song/lib/look.js';
import { KINTSUGI_GLSL, KINTSUGI_UNIFORMS } from '/song/lib/x-s35-complete.js';
import { FINISH } from '/premium/finish.js';

export const kind = 'shader';

export default (P) => {
  const [A, B, C, D] = linesAt(P.from - 0.6, 'Not only pardon', 'Not only release', 'He came to make', 'the broken complete');
  const done = D.words.at(-1).start;   // "complete"
  // the gold's run: a stage per line, each easing in from the line's first word
  const stages = [[A.start, 0.0, 0.24], [B.start, 0.24, 0.5], [C.start, 0.5, 0.74], [D.start, 0.74, 1.0]];
  const fill = (t) => {
    let f = 0;
    for (const [t0, a, b] of stages) if (t >= t0 - 0.1) f = a + (b - a) * ease.inOut3(clamp01((t - t0 + 0.1) / (t0 === D.start ? done + 0.15 - t0 : 1.5)));
    return f;
  };
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.0012);
    return { pos: [-0.085 + 0.03 * p + d[0], 0.105 - 0.012 * p + d[1], -0.35 + 0.06 * p], target: [-0.062 + 0.008 * p, 0.04, 0.0], fov: 31 };
  };
  return {
    name: 's35-complete', from: P.from, to: P.to,
    frag: KINTSUGI_GLSL + 'vec3 shade(vec2 fc) { return kintsugi(fc); }',
    uniforms: { ...KINTSUGI_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uFill.value = fill(t);
      u.uGleam.value = ease.inOut3(clamp01((t - done + 0.1) / 1.1));   // a light runs up through the mended cup, then it stays lit
      u.uCupRot.value = 0.25 * (t - P.from) / (P.to - P.from);
      u.uFocus.value = Math.hypot(c.pos[0], c.pos[1] - 0.04, c.pos[2] + 0.04);
    },
    post(t) { return grade(t, { exposure: 1.5 + 0.2 * ease.inOut3(clamp01((t - done) / 1.2)), bloom: 0.14, threshold: 0.9, vignette: 0.55, contrast: 1.0, lift: [0.004, 0.003, 0.002], grain: 0.022 }); },
    finish(t) { return { leak: { amount: 0.06, warm: [1.0, 0.55, 0.25], cool: [0.6, 0.35, 0.3], speed: 0.05 }, grade: { shadows: [0.004, 0.002, 0.0], highlights: [1.0, 0.92, 0.78], amount: 0.4 } }; },
  };
};
