// 22 · the hard silence, the breath, the second "filioque" — and it breaks.
// The same dark nave. In the silence the camera holds, barely moving. On the second sung word
// lightning floods the windows and the frame jolts as the word shatters; then the stillness after,
// and the votives come back, warm, one bank of light in the dark: the Creed as it was given.
import { gothicShot, lightning } from '/song/lib/shots.js';
import { linesIn, ease, spring } from '/song/lib/type.js';
export const kind = 'shader';
export default (P) => {
  const lines = linesIn(P);
  const tb = lines[0].start + 0.12;
  return gothicShot(P, {
    name: 's22-reject',
    ease: (x) => x,
    cam: (p, t) => {
      const sh = t > tb ? Math.exp(-(t - tb) * 5) * 0.06 : 0;
      const j = Math.sin(t * 61) * sh, k = Math.cos(t * 47) * sh;
      const back = ease.inOut3((t - tb - 1.0) / 5.0);
      return { pos: [j, 2.1 + k - 0.6 * back, 20 - 7 * back], target: [0.0, 8.5 - 3.5 * back, 62], fov: 46 + 4 * back };
    },
    uniforms: { uVotive: [-3.1, 0.0, 9.2], uVotiveOn: 0, uMoonCol: [3.8, 4.4, 6.0], uAmb: [0.08, 0.09, 0.13] },
    flash: (t) => lightning(t, tb - 0.02, 1.3),
    update: (t, u) => { u.uVotiveOn.value = t > tb + 2.4 ? 1 : 0; },
    post: (t) => ({ saturation: 0.7 + 0.25 * ease.inOut3((t - tb - 2.4) / 2.0), exposure: 2.3 + 0.3 * ease.inOut3((t - tb - 2.4) / 2.0) }),
  });
};
