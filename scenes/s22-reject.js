// 22 · the hard silence, the breath, and the echoed "FILL-EE-OH-KWAY".
// Rejected. In the silence the sign stutters. On the echo lightning floods the windows; the sign
// sparks, dies and topples backward onto the stone, and the camera walks past it toward the
// votives, which burn on. A quiet note: the Creed's own words, nothing added.
import { gothicShot, lightning } from '/song/lib/shots.js';
import { linesIn, ease } from '/song/lib/type.js';
import { NEON_GLSL, NEON_UNIFORMS, neonText, neonLightPos } from '/song/lib/neon.js';
export const kind = 'shader';
export default (P) => {
  const lines = linesIn(P);
  const echo = lines[0].start;
  const lp = neonLightPos();
  return gothicShot(P, {
    name: 's22-reject',
    cam: (p, t) => {
      const k = ease.inOut3(Math.min(1, Math.max(0, (t - echo - 1.0) / 4.5)));
      return { pos: [1.2 - 3.0 * k, 1.7 - 0.4 * k, 7.4 + 1.2 * k], target: [0.4 - 3.4 * k, 2.3 - 1.6 * k, 14 - 4.6 * k], fov: 46 };
    },
    ease: (x) => x,
    extra: NEON_GLSL, textSize: [3840, 2160], drawText: neonText,
    uniforms: { ...NEON_UNIFORMS, uVotive: [-3.1, 0.0, 9.2], uP1: lp, uP1c: [0, 0, 0] },
    flash: (t) => lightning(t, echo + 0.05, 1.2),
    update: (t, u) => {
      let on;
      if (t < echo) on = (Math.sin(t * 41) * Math.sin(t * 13) > -0.2 ? 0.7 : 0.08);
      else on = Math.max(0, 1.3 - (t - echo) / 0.25);
      u.uNeon.value = on;
      u.uP1c.value.set(9 * on, 0.8 * on, 3.4 * on);
      u.uTopple.value = ease.in2(Math.min(1, Math.max(0, (t - echo - 0.35) / 0.9)));
      u.uSignOn.value = 1;
    },
  });
};
