// Shot factories: every scene is one of the two worlds with its own camera and light. A scene
// module does `export const kind = ...; export default (P) => spilledShot(P, {...})`.
//   spilledShot: the Church of the Savior on Spilled Blood (lib/spilled.js), Three.js
//   gothicShot:  the Gothic cathedral in darkness (lib/gothic.js), raymarched
// cam(p, t) gets the scene's eased progress p (0..1) and song time t and returns
// { pos, target, fov, roll?, focus?, aperture? }.
import { grade, ease, drift } from '/song/lib/look.js';
import { spilledBlood } from '/song/lib/spilled.js';
import { GOTHIC_GLSL, GOTHIC_UNIFORMS } from '/song/lib/gothic.js';
import { cameraPlane } from '/engine.js';
import { FINISH } from '/premium/finish.js';

const progress = (P, t, e = ease.inOut3) => e(Math.min(1, Math.max(0, (t - P.from) / (P.to - P.from))));

export function spilledShot(P, o) {
  const cam = (t) => { const c = o.cam(progress(P, t, o.ease), t); const d = drift(t, o.drift ?? 0.015); return { ...c, pos: c.pos.map((v, i) => v + (d[i] ?? 0)) }; };
  let S;
  return {
    name: o.name, from: P.from, to: P.to,
    async build(ctx) {
      S = await spilledBlood(ctx, { fill: o.fill ?? 4.5, envIntensity: o.env ?? 0.8, candle: o.candle ?? 1, lamps: o.lamps ?? [[0, 9, 4, 1.3], [-6, 9, 0, 0.8], [6, 9, 0, 0.8], [0, 14, -6, 1.2], [-6, 6, -10, 0.5], [6, 6, -10, 0.5]] });
      return { scene: S.scene };
    },
    camera: cam,
    update(t, ctx) {
      // candles flicker together a little
      const f = 1 + 0.04 * Math.sin(t * 13.1) + 0.03 * Math.sin(t * 7.7 + 1.3);
      if (S) {
        S.lamps.forEach((l, i) => { l.userData.k ??= l.intensity; l.intensity = l.userData.k * f * (o.lampK ? o.lampK(t, i) : 1); });
        S.hemi.intensity = (o.fill ?? 4.5) * (o.fillK ? o.fillK(t) : 1);
      }
      o.update?.(t, S, ctx);
    },
    post(t) { return grade(t, { exposure: o.exposure ?? 1.45, bloom: 0.12, threshold: 1.0, contrast: 1.05, vignette: 0.5, saturation: 1.05, ...(o.post?.(t) ?? {}) }); },
    finish(t) { return { ...FINISH.film, leak: { amount: 0.07, warm: [1.0, 0.55, 0.25], cool: [0.5, 0.35, 0.8], speed: 0.05 }, ...(o.finish?.(t) ?? {}) }; },
  };
}

export function gothicShot(P, o) {
  const cam = (t) => { const c = o.cam(progress(P, t, o.ease), t); const d = drift(t, o.drift ?? 0.012); return { ...c, pos: c.pos.map((v, i) => v + (d[i] ?? 0)) }; };
  return {
    name: o.name, from: P.from, to: P.to,
    textSize: o.textSize,
    frag: (o.extra ? '#define G_EXTRA\n' + (o.extraDecl ?? '') : '') + GOTHIC_GLSL + (o.extra ?? '') + /* glsl */ `
vec3 shade(vec2 fc) { vec3 ro; vec3 rd = gothicLens(fc, ro); float depth; vec3 c = gothic(ro, rd, depth); ${o.after ?? ''} return c; }`,
    uniforms: { ...GOTHIC_UNIFORMS, uHaze: 0.035, ...(o.uniforms ?? {}) },
    camera: cam,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText: o.drawText,
    update(t, u) {
      const c = cam(t);
      if (c.focus) u.uFocusG.value = c.focus;
      if (o.flash) u.uFlashG.value = o.flash(t);
      o.update?.(t, u, c);
    },
    post(t) { return grade(t, { exposure: o.exposure ?? 2.6, bloom: 0.12, saturation: 0.95, lift: [0.003, 0.004, 0.007], vignette: 0.55, ...(o.post?.(t) ?? {}) }); },
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.04], highlights: [1.0, 0.95, 0.88], amount: 0.4 }, ...(o.finish?.(t) ?? {}) }; },
  };
}

// lightning: a double flash starting at t0
export const lightning = (t, t0, k = 1) => { const x = t - t0; return x < 0 ? 0 : k * (0.9 * Math.exp(-x * 9) + (x > 0.18 ? 0.55 * Math.exp(-(x - 0.18) * 7) : 0)); };
