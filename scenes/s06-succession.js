// s06-succession: "Hand upon shoulder, / prayer upon prayer, / bishop to bishop, / the fire stayed there."
// Apostolic succession as a row of beeswax tapers in a brass sand tray, running away into the dark.
// The near taper burns; on every sung word the next one is lit from the one before (a bead of fire
// drops from flame to wick, the new flame flares and settles), and from "fire" the light runs on down
// the row, faster and faster, until the whole line burns into the distance. The camera travels low
// beside the row, a little behind the front, and the focus follows the newest flame.
import { grade, ease, drift, linesAt, clamp01 } from '/song/lib/look.js';
import { SUCC_GLSL, SUCC_UNIFORMS, N_TAPERS, SP } from '/song/lib/x-s06-succession.js';
import { FINISH } from '/premium/finish.js';

export const kind = 'shader';

export default (P) => {
  const lines = linesAt(P.from - 0.6, 'Hand upon shoulder', 'prayer upon prayer', 'bishop to bishop', 'the fire stayed there');
  const words = lines.flatMap((l) => l.words);
  const fire = words.find((w) => /^fire/i.test(w.w)).start;
  // when each taper catches: the first is already burning; one per word up to "fire"; then a run
  const ign = [P.from - 20];
  for (const w of words) { if (w.start >= fire - 0.01) break; ign.push(w.start); }
  let tt = fire, dt = 0.17;
  while (ign.length < N_TAPERS) { ign.push(tt); tt += dt; dt *= 0.87; }
  while (ign.length < 32) ign.push(1e4);
  // the newest flame (for focus and the camera's lead)
  const front = (t) => {
    let k = 0; for (let i = 0; i < N_TAPERS; i++) if (ign[i] <= t) k = i;
    const a = ign[k], b = ign[k + 1] ?? a + 1;
    return k + clamp01((t - a) / Math.max(0.05, b - a)) * 0.6;
  };
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.004);
    const fz = Math.min(front(t), 22) * SP;
    const z = -0.42 + 0.55 * p + 0.25 * fz;
    return { pos: [0.2 - 0.03 * p + d[0], 0.36 + 0.03 * p + d[1], z], target: [-0.03, 0.26 - 0.02 * p, z + 1.4 + 0.8 * p], fov: 40 };
  };
  return {
    name: 's06-succession', from: P.from, to: P.to,
    frag: SUCC_GLSL + 'vec3 shade(vec2 fc) { return succession(fc); }',
    uniforms: { ...SUCC_UNIFORMS, uIgn: ign.slice(0, 32) },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      const fz = Math.min(front(t), 26) * SP;
      u.uFocus.value = Math.max(0.3, Math.hypot(c.pos[0], c.pos[1] - 0.3, fz - c.pos[2]));
    },
    post(t) { return grade(t, { exposure: 1.6, bloom: 0.07, threshold: 1.2, saturation: 0.97, vignette: 0.5, contrast: 1.0, lift: [0.0, 0.0, 0.0], grain: 0.02 }); },
    finish(t) { return { leak: { amount: 0.05, warm: [1.0, 0.55, 0.25], cool: [0.6, 0.3, 0.3], speed: 0.05 }, grade: { shadows: [0.0, 0.0, 0.0], highlights: [1.0, 0.93, 0.8], amount: 0.4 } }; },
  };
};
