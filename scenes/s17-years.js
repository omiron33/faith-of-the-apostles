// 17 · "And year by year, / the tension climbed, / until the break / in ten-fifty-four arrived."
// Night on a dry clay plain under a storm deck, a band of cold light along the horizon. A crack runs
// out of the distance straight at the camera, widening as the years climb; on "ten-fifty-four" the
// sky splits with a bolt, the crack reaches us and tears open.
import { grade, ease, linesAt, drift, clamp, mix, spring, keys } from '/song/lib/look.js';
import { STORM_GLSL, STORM_UNIFORMS, flash } from '/song/lib/x-s17-years.js';
import { cameraPlane } from '/engine.js';

export const kind = 'shader';
const crackX = (z) => 0.9 * Math.sin(z * 0.11 + 0.3) + 0.35 * Math.sin(z * 0.37 + 2.0);

export default (P) => {
  const [L1, L2, L3, L4] = linesAt(P.from - 0.6, 'And year by year', 'the tension', 'until the break', 'in ten-fifty-four');
  const tBreak = L4.words.find((w) => /ten/i.test(w.w)).start;
  const cam = (t) => {
    const p = ease.inOut3((t - P.from) / (P.to - P.from));
    const d = drift(t, 0.008);
    const hit = spring(t, tBreak, 0.35, 0.6) * Math.exp(-Math.max(0, t - tBreak) * 2.5);   // the jolt
    const z = mix(-2.6, -1.8, p);
    return { pos: [crackX(z) + 0.55 + d[0], 0.62 - 0.05 * p + d[1] - 0.03 * hit, z], target: [crackX(25) - 0.6, 1.6 + 0.4 * p, 30], fov: 52, roll: 0.01 * hit };
  };
  return {
    name: 's17-years', from: P.from, to: P.to,
    frag: STORM_GLSL + /* glsl */ `
vec3 shade(vec2 fc) { vec3 ro; vec3 rd = stormLens(fc, ro); float dp; return stormScene(ro, rd, dp); }`,
    uniforms: { ...STORM_UNIFORMS, uBolt: [-0.12, 0.4, 0.37], uD: 1.4, uAperS: 0.006, uFocusS: 9 },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    update(t, u) {
      // the crack's front runs in from the horizon, faster and faster, reaching us on the break
      const x = clamp((t - (P.from - 0.3)) / (tBreak - (P.from - 0.3)), 0, 1);
      u.uFront.value = mix(45, -1.5, Math.pow(x, 1.35));
      u.uW.value = mix(0.1, 0.25, x) + 0.3 * spring(t, tBreak, 0.45, 0.3);
      u.uFlash.value = flash(t, tBreak, 1.0) + flash(t, tBreak + 0.55, 0.45);
      u.uSheet.value = flash(t, L2.words[1].start, 0.5) + flash(t, L3.words[0].start, 0.35) + flash(t, L1.words[1].start, 0.25);
    },
    post(t) { const f = flash(t, tBreak, 1.0); return grade(t, { exposure: 1.95 - 0.6 * Math.min(1, f), bloom: 0.15 + 0.1 * Math.min(1, f), threshold: 0.9, contrast: 1.1, saturation: 1.0, vignette: 0.55, grain: 0.03, lift: [0.006, 0.007, 0.012] }); },
    finish(t) { return { flare: { amount: 0.15, threshold: 1.0, tint: [0.7, 0.8, 1.0], length: 0.4 }, grade: { shadows: [0.0, 0.02, 0.06], highlights: [0.95, 0.95, 1.0], amount: 0.5 } }; },
  };
};
