// The words of s18-cracks. "Rome and the East" is split across the chasm: ROME on the left half,
// "and the EAST" on the right, the gap between them widening with the land; "no longer one" sits
// centred beneath. Then the second pair takes the same place: "a thousand small cracks / finally
// undone", and UNDONE is pulled apart from the inside as the halves lurch.
import { lyricModule, setLine, outFade, ease, spring } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const [L1, L2, L3, L4] = lines;
  const px = 190, y1 = 430, y2 = 430 + px * 1.3;
  const gap = 70 + 330 * ease.inOut3((t - L1.start) / (P.to - L1.start));
  const aA = outFade(t, L3.start - 0.32, L3.start - 0.08) * (t >= L1.start - 0.1 ? 1 : 0);
  if (aA > 0) {
    setLine(ctx, L1.words.slice(0, 1), t, { x: 1920 - gap / 2, y: y1, px, align: 'right', alpha: aA, rise: 20 });
    setLine(ctx, L1.words.slice(1), t, { x: 1920 + gap / 2, y: y1, px, align: 'left', alpha: aA, rise: 20 });
    if (L2) setLine(ctx, L2, t, { x: 1920, y: y2, px, align: 'center', alpha: aA, rise: 20 });
  }
  const aB = outFade(t, P.to - 0.25, P.to) * (t >= L3.start - 0.1 ? 1 : 0);
  if (aB > 0) {
    setLine(ctx, L3, t, { x: 1920, y: y1, px, align: 'center', alpha: aB, rise: 20 });
    if (L4) {
      // "undone" comes apart down the middle: UN and DONE drift away from each other once it lands
      const u = L4.words.at(-1);
      const pull = 110 * spring(t, u.start + 0.12, 0.6, 0.25);
      setLine(ctx, L4.words.slice(0, -1), t, { x: 1920 - 20, y: y2, px, align: 'right', alpha: aB, rise: 20 });
      const x0 = 1920 + 20;
      setLine(ctx, [{ ...u, w: 'un' }], t, { x: x0, y: y2, px, align: 'left', alpha: aB, rise: 20, voice: 'schism' });
      ctx.font = `800 ${Math.round(px * 0.98 * 0.8)}px "Inter Tight"`;
      ctx.letterSpacing = `${0.14 * Math.round(px * 0.98)}px`;
      const wUn = ctx.measureText('UN').width;
      ctx.letterSpacing = '0px';
      setLine(ctx, [{ ...u, w: 'done' }], t, { x: x0 + wUn + pull, y: y2, px, align: 'left', alpha: aB, rise: 20, voice: 'schism' });
    }
  }
}, { shade: 0.5 });
