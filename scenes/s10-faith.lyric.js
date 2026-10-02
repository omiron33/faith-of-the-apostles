// The words of s10-faith: the chorus as a shout, centred low over the floor: "THIS IS THE" small
// above FAITH, huge and amber, slamming in on its beat; then "OF THE" over APOSTLES.
import { linesAt, paint, measure, arrive, outFade } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

function row(ctx, words, t, cx, y, small, big, alpha) {
  const isSmall = (w) => /^(this|is|the|of)$/i.test(w.w);
  const smalls = words.filter(isSmall), bigs = words.filter((w) => !isSmall(w));
  let sw = 0; for (const w of smalls) sw += measure(ctx, w.w, small, { voice: 'quiet' });
  let x = cx - sw / 2;
  for (const w of smalls) { const st = arrive(w, t); paint(ctx, w.w, x, y - big * 0.97, small, { alpha: st.a * alpha, voice: 'quiet' }); x += measure(ctx, w.w, small, { voice: 'quiet' }); }
  for (const w of bigs) {
    const st = arrive(w, t, 0.04, 0.12);
    const bw = measure(ctx, w.w, big);
    const sc = 1 + 0.08 * (1 - st.k);
    ctx.save(); ctx.translate(cx, y); ctx.scale(sc, sc);
    paint(ctx, w.w, -bw / 2, 0, big, { alpha: st.a * alpha });
    ctx.restore();
  }
}

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'THIS IS THE FAITH', 'OF THE APOSTLES');
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      const a = outFade(t, P.to - 0.2, P.to);
      // FAITH on the left pier, APOSTLES on the right: the sanctuary stays clear between them
      row(ctx, L1.words, t, 820, 1500, 130, 380, a);
      row(ctx, L2.words, t, 2980, 1500, 130, 300, a);
    },
  };
};
