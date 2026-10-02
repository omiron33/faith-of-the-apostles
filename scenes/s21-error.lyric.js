// The word itself, in its error voice, jittering in under the sign: loud, crooked, cheap.
import { lyricModule, paint, measure, arrive, outFade } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const w = lines[0].words[0];
  const st = arrive(w, t);
  if (st.a <= 0) return;
  const px = 300;
  const ww = measure(ctx, w.w, px);
  const j = Math.floor(t * 30);
  const dx = ((j * 7919) % 13 - 6) * 3 * (t - w.start < 0.6 ? 1 : 0.2);
  ctx.save(); ctx.translate(1920 + dx, 1820); ctx.rotate(-0.06);
  paint(ctx, w.w, -ww / 2, 0, px, { alpha: st.a * outFade(t, P.to - 0.15, P.to) });
  ctx.restore();
}, { shade: 0.45 });
