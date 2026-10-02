// The echo of the word, smaller, failing with the sign; then the note: the Creed as given.
import { lyricModule, paint, measure, arrive, outFade, note, ease, clamp01 } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const w = lines[0].words[0];
  const st = arrive(w, t);
  const a = st.a * outFade(t, w.start + 0.35, w.start + 0.75);
  if (a > 0) {
    const px = 220, ww = measure(ctx, w.w, px);
    const j = Math.floor(t * 30);
    ctx.save(); ctx.translate(1920 + ((j * 7919) % 13 - 6) * 6, 1820); ctx.rotate(0.05);
    paint(ctx, w.w, -ww / 2, 0, px, { alpha: a * (j % 3 === 0 ? 0.4 : 1) });
    ctx.restore();
  }
  const k = ease.out3(clamp01((t - w.start - 2.2) / 1.2)) * outFade(t, P.to - 0.3, P.to);
  if (k > 0) {
    note(ctx, 'WHO PROCEEDS FROM THE FATHER', 1920, 1720, { px: 78, align: 'center', alpha: 0.95 * k, color: '255, 214, 160', track: 0.3 });
    note(ctx, 'JOHN 15:26   ·   CONSTANTINOPLE 381   ·   NOTHING ADDED', 1920, 1840, { px: 44, align: 'center', alpha: 0.8 * k });
  }
}, { shade: 0.5 });
