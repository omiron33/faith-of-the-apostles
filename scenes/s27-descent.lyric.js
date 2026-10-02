// The words of s27-descent. The first couplet, left-aligned, sits up in the dark of the storm cloud
// beside the break. The second follows the light down: "but because God" high in the frame, at the
// cloud, and "came down in love" low, on the warming water, the shaft between them carrying the eye
// from the one line to the other.
import { linesAt, setLine, outFade } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [A, B, C, D] = linesAt(P.from - 0.6, 'Not because', 'the One above', 'but because God', 'came down');
  return {
    textSize: [3840, 2160],
    shade: 0.42,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      const end = outFade(t, P.to - 0.15, P.to);
      const a1 = outFade(t, C.start - 0.3, C.start - 0.02);
      if (a1 > 0) {
        setLine(ctx, A, t, { x: 260, y: 1500, px: 190, align: 'left', alpha: a1, rise: 22 });
        setLine(ctx, B, t, { x: 260, y: 1750, px: 190, align: 'left', alpha: a1, rise: 22 });
      }
      if (t > C.start - 0.2) {
        setLine(ctx, C, t, { x: 1920, y: 440, px: 200, align: 'center', alpha: end, rise: 22 });
        setLine(ctx, D, t, { x: 1920, y: 1880, px: 200, align: 'center', alpha: end, rise: -22 });
      }
    },
  };
};
