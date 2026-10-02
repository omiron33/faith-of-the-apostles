// The words of s15-shores. The first couplet stands centred in the dark sky above the strait. Then the
// division is laid out on the picture itself: "East on one shore" on the left, over the East's
// church; "West on the other side" on the right, the moon between them, over the West's, each on its own bank, so the
// eye has to cross the water to read them. "one" stays plain here (it is a count, not the faith).
import { linesAt, setLine, outFade, arrive, paint, measure } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

// a line with a few words forced to a voice ('plain' = the plain serif)
function lineWith(ctx, line, t, { x, y, px, align = 'left', alpha = 1, rise = 24, force = {} }) {
  const vo = (w) => force[w.w.toLowerCase().replace(/[^a-z]/g, '')];
  const adv = line.words.map((w) => measure(ctx, w.w, px, { voice: vo(w) }));
  const total = adv.reduce((a, b) => a + b, 0) - px * 0.25;
  let xx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  line.words.forEach((w, i) => {
    const st = arrive(w, t);
    paint(ctx, w.w, xx, y + (1 - st.k) * rise, px, { voice: vo(w), alpha: st.a * alpha });
    xx += adv[i];
  });
}

export default (P) => {
  const [A, B, E, W] = linesAt(P.from - 0.6, 'But distance', 'when brothers', 'East on one', 'West on the');
  return {
    textSize: [3840, 2160],
    shade: 0.42,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      const end = outFade(t, P.to - 0.25, P.to);
      const a1 = outFade(t, E.start - 0.35, E.start - 0.02);
      if (a1 > 0) {
        setLine(ctx, A, t, { x: 1920, y: 420, px: 200, align: 'center', alpha: a1, rise: 24 });
        setLine(ctx, B, t, { x: 1920, y: 680, px: 200, align: 'center', alpha: a1, rise: 24 });
      }
      if (t > E.start - 0.2) {
        lineWith(ctx, E, t, { x: 200, y: 600, px: 152, align: 'left', alpha: end, force: { one: 'plain' } });
        lineWith(ctx, W, t, { x: 3640, y: 600, px: 152, align: 'right', alpha: end });
      }
    },
  };
};
