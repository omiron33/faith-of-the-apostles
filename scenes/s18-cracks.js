// 18 · "Rome and the East / no longer one, / a thousand small cracks / finally undone."
// The plain of 17 seen from above: the crack has become a chasm and the two halves of the land are
// pulling apart, Rome on the left, the East on the right, the gap widening into an abyss with dust
// pouring off both lips. Lightning on the downbeats; on "undone" the halves lurch apart.
import { grade, ease, linesAt, drift, clamp, mix, spring, beats } from '/song/lib/look.js';
import { CHASM_GLSL, CHASM_UNIFORMS, flash } from '/song/lib/x-s18-cracks.js';
import { cameraPlane } from '/engine.js';

export const kind = 'shader';
const crackX = (z) => 0.9 * Math.sin(z * 0.11 + 0.3) + 0.35 * Math.sin(z * 0.37 + 2.0);

export default (P) => {
  const [L1, L2, L3, L4] = linesAt(P.from - 0.6, 'Rome and the East', 'no longer one', 'a thousand', 'finally undone');
  const tUndone = L4.words.at(-1).start;
  // downbeats: every fourth beat from the scene's first beat
  const bs = beats.filter((b) => b >= P.from - 0.05 && b < P.to);
  const down = bs.filter((_, i) => i % 4 === 0).filter((b) => b > P.from + 0.2);
  const bolts = [[0.35, 0.42, 0.21], [-0.4, 0.36, 0.73], [0.12, 0.45, 0.48], [-0.2, 0.4, 0.91]];
  const sep = (t) => mix(0.5, 6.5, ease.inOut3((t - P.from) / (P.to - P.from))) + 1.6 * spring(t, tUndone, 0.5, 0.35);
  // high over the line of the split, looking along it: both halves run away to the storm, the gap
  // between them widening; the camera drifts back and up as if from the force of it
  const cam = (t) => {
    const p = ease.inOut3((t - P.from) / (P.to - P.from));
    const d = drift(t, 0.02);
    const z = mix(-10.0, -12.5, p);
    const lurch = spring(t, tUndone, 0.3, 0.6) * Math.exp(-Math.max(0, t - tUndone) * 3);
    return { pos: [crackX(z) + 0.6 + d[0], mix(3.4, 4.6, p) + d[1] + 0.05 * lurch, z], target: [crackX(30) - 0.4, -1.5, 30], fov: 50, roll: 0.01 * Math.sin(t * 0.4) + 0.012 * lurch };
  };
  return {
    name: 's18-cracks', from: P.from, to: P.to,
    frag: CHASM_GLSL + /* glsl */ `
vec3 shade(vec2 fc) { vec3 ro; vec3 rd = stormLens(fc, ro); return chasmScene(ro, rd); }`,
    uniforms: { ...CHASM_UNIFORMS, uBolt: [...bolts[0]] },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    update(t, u) {
      u.uSep.value = sep(t);
      let f = 0, bi = 0;
      down.forEach((b, i) => { const v = flash(t, b, i === down.length - 1 ? 0.8 : 0.55); if (t >= b) bi = i; f += v; });
      f += flash(t, tUndone, 0.85);
      u.uFlash.value = f;
      const b = bolts[(t >= tUndone ? down.length : bi) % bolts.length];
      u.uBolt.value.set(...b);
      u.uSheet.value = 0.3 + 0.2 * Math.sin(t * 7.0) * Math.sin(t * 2.3);
    },
    post(t) {
      const f = (x) => { let v = flash(x, tUndone, 0.85); for (const b of down) v += flash(x, b, 0.6); return v; }; return grade(t, { exposure: 1.8 - 0.4 * Math.min(1, f(t)), bloom: 0.15, threshold: 0.9, contrast: 1.1, saturation: 1.0, vignette: 0.55, grain: 0.03, lift: [0.006, 0.007, 0.012] }); },
    finish(t) { return { flare: { amount: 0.15, threshold: 1.0, tint: [0.7, 0.8, 1.0], length: 0.4 }, grade: { shadows: [0.0, 0.02, 0.06], highlights: [0.95, 0.95, 1.0], amount: 0.5 } }; },
  };
};
