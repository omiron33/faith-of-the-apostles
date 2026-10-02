// 21 · "FILL-EE-OH-KWAY."
// The error. In the dark nave, on the sung word, a cheap neon sign buzzes on in the middle of the
// aisle, crooked on two steel legs, its magenta glare garish and wrong against the stone. It
// stutters; the frame tears in bands for a few frames. Ugly on purpose.
import { gothicShot } from '/song/lib/shots.js';
import { linesIn, spring } from '/song/lib/type.js';
import { NEON_GLSL, NEON_UNIFORMS, neonText, neonLightPos } from '/song/lib/neon.js';
export const kind = 'shader';
export default (P) => {
  const lines = linesIn(P);
  const t0 = lines[0].start;
  const lp = neonLightPos();
  return gothicShot(P, {
    name: 's21-error',
    cam: (p, t) => ({ pos: [1.2, 1.7, 7.4 - 0.4 * spring(t, t0, 0.3)], target: [0.4, 2.3, 14], fov: 46 }),
    extra: NEON_GLSL, textSize: [3840, 2160], drawText: neonText,
    uniforms: { ...NEON_UNIFORMS, uVotive: [-3.1, 0.0, 9.2], uP1: lp, uP1c: [0, 0, 0] },
    update: (t, u) => {
      const on = t < t0 ? 0 : (0.75 + 0.25 * Math.min(1, (t - t0) / 0.4)) * ((t - t0) % 0.37 < 0.03 ? 0.2 : 1);
      u.uNeon.value = on;
      u.uP1c.value.set(9 * on, 0.8 * on, 3.4 * on);
    },
    post: (t) => ({ saturation: 1.05 }),
  });
};
