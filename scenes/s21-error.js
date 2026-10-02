// 21 · the first "filioque".
// The Gothic nave in near-darkness, only the moon through the clerestory; the votives are out. The
// camera pushes slowly and heavily down the nave toward the great window. The word stands over it
// (on its own layer), cold and carved: something set on top of the Creed.
import { gothicShot } from '/song/lib/shots.js';
import { linesIn } from '/song/lib/type.js';
export const kind = 'shader';
export default (P) => {
  const lines = linesIn(P);
  return gothicShot(P, {
    name: 's21-error',
    cam: (p, t) => ({ pos: [0.0, 1.5 + 0.6 * p, 14 + 6 * p], target: [0.0, 8.5, 62], fov: 46 }),
    uniforms: { uVotiveOn: 0, uMoonCol: [3.8, 4.4, 6.0], uAmb: [0.08, 0.09, 0.13] },
    post: (t) => ({ saturation: 0.7, exposure: 2.3 }),
  });
};
