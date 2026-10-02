// 10 · first chorus: "THIS IS THE FAITH / OF THE APOSTLES."
// Inside the Church of the Savior on Spilled Blood at night: from the nave the camera pushes
// slowly toward the jasper canopy, every surface a mosaic, candle light warm on the piers, the
// chandelier burning before the sanctuary.
import { ease, drift, grade } from '/song/lib/look.js';
import { spilledBlood } from '/song/lib/spilled.js';
import { FINISH } from '/premium/finish.js';

export const kind = 'three';

const camOf = (P) => (t) => {
  const p = ease.inOut3((t - P.from) / (P.to - P.from));
  const d = drift(t, 0.02);
  const pos = [0.6 + d[0], 1.5 + 0.35 * p + d[1], -14 + 2.2 * p];
  const target = [0.0, 5.8 + 0.4 * p, 10];
  return { pos, target, fov: 56, focus: 16, aperture: 0.008 };
};

export default (P) => ({
  name: 's10-faith', from: P.from, to: P.to,
  async build(ctx) {
    const S = await spilledBlood(ctx, { fill: 4.5, envIntensity: 0.8, lamps: [[0, 9, 4, 1.3], [-6, 9, 0, 0.8], [6, 9, 0, 0.8], [0, 14, -6, 1.2], [-6, 6, -10, 0.5], [6, 6, -10, 0.5]] });
    return { scene: S.scene };
  },
  camera: camOf(P),
  post(t) { return grade(t, { exposure: 1.45, bloom: 0.12, threshold: 1.0, contrast: 1.04, vignette: 0.5, saturation: 1.05 }); },
  finish(t) { return { ...FINISH.film, leak: { amount: 0.08, warm: [1.0, 0.55, 0.25], cool: [0.5, 0.35, 0.8], speed: 0.05 } }; },
});
