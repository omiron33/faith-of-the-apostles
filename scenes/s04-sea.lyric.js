// The words of s04-sea. The call, set high in the dark of the dawn sky over the lake, centred like a
// voice carried across water, clear of the amber band where the sun is coming: each word rises a
// little on its onset. TWELVE and FAITHFULLY take the lantern amber of the faith; the second line
// comes in beneath as the lanterns keep catching, the twelfth on "faithfully".
import { linesAt, setLine, outFade } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'He called the Twelve', 'said');
  return {
    textSize: [3840, 2160],
    shade: 0.32,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      const end = outFade(t, P.to - 0.3, P.to);
      setLine(ctx, L1, t, { x: 1920, y: 330, px: 176, align: 'center', alpha: end, rise: 26 });
      setLine(ctx, L2, t, { x: 1920, y: 580, px: 176, align: 'center', alpha: end, rise: 26 });
    },
  };
};
