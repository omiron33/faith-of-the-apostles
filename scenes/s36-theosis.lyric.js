// The words of s36-theosis: one line at a time, large, centred low under the glowing bar, the gaps
// between lines left to the fire. "light" takes the flame's italic. Only "drawn" of the last line
// falls inside this scene (the rest is sung after the cut), so it is set alone, centred, and grows
// very slowly while it rings, as if drawn up toward the light.
import { lyricModule, setLine, outFade, ease, clamp01 } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const [A, B, C] = lines;
  const Y = 1800, PX = 210;
  if (A && t < B.start + 0.02) setLine(ctx, A, t, { x: 1920, y: Y, px: PX, align: 'center', alpha: B ? outFade(t, B.start - 0.3, B.start + 0.02) : 1 });
  if (B && t >= B.start - 0.1 && t < C.start + 0.02) setLine(ctx, B, t, { x: 1920, y: Y, px: PX, align: 'center', alpha: outFade(t, C.start - 0.3, C.start + 0.02) });
  if (C && t >= C.start - 0.1) {
    const w = C.words[0];
    const g = 1 + 0.06 * ease.inOut3(clamp01((t - w.start) / (P.to - w.start)));
    ctx.save(); ctx.translate(1920, Y); ctx.scale(g, g);
    setLine(ctx, [w], t, { x: 0, y: 0, px: PX * 1.15, align: 'center', alpha: outFade(t, P.to - 0.2, P.to) });
    ctx.restore();
  }
});
