// 04 · "He called the Twelve beside the sea, / said "Follow Me, and follow faithfully.""
// The Sea of Galilee at dawn, from inside a fishing boat: its stem post points across still water to
// the beach, where twelve lanterns kindle one by one (the twelfth on "faithfully"), each doubled in
// the mirror of the lake. The boat rocks gently; the camera eases forward over the bow.
import { grade, ease, linesAt, drift } from '/song/lib/look.js';
import { SEA_GLSL, SEA_UNIFORMS } from '/song/lib/x-s04-sea.js';
import { cameraPlane } from '/engine.js';
import { FINISH } from '/premium/finish.js';

export const kind = 'shader';

export function seaCamera(P) {
  return (t) => {
    const p = ease.inOut3((t - P.from) / (P.to - P.from));
    const d = drift(t, 0.01);
    const bob = 0.012 * Math.sin(t * 1.1);
    return { pos: [0.1 + d[0], 1.2 + 0.08 * p + bob + d[1], -1.5 + 0.55 * p], target: [-0.6, 0.45 + 0.12 * p, 40], fov: 44, roll: 0.008 * Math.sin(t * 0.9) };
  };
}

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'He called the Twelve', 'said');
  const t0 = L1.words[0].start, t12 = L2.words.at(-1).start;
  const cam = seaCamera(P);
  return {
    name: 's04-sea', from: P.from, to: P.to,
    frag: SEA_GLSL + /* glsl */ `
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  return seaScene(ro, rd);
}`,
    uniforms: { ...SEA_UNIFORMS },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    update(t, u) {
      // lantern i catches at an even step from the first word to "faithfully"
      const step = (t12 - t0) / 11;
      const x = (t - t0 + 0.05) / step;
      u.uLit.value = Math.max(0, Math.min(12, Math.floor(x) + ease.out3((x - Math.floor(x)) / 0.35) + (x >= 0 ? 0 : -1)));
      if (x < 0) u.uLit.value = 0;
      u.uBob.value = 0.012 * Math.sin(t * 1.1 + 0.4);
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.14, contrast: 1.05, grain: 0.02, vignette: 0.5 }); },
    finish(t) { return { ...FINISH.film, leak: { amount: 0.1, warm: [1.0, 0.6, 0.3], cool: [0.5, 0.4, 0.8], speed: 0.05 } }; },
  };
};
