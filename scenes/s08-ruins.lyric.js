// The words of s08-ruins: one line at a time, centred low in the frame on the dark paving, the way a
// voice speaks in a quiet place. Each line clears just before the next is sung (no overlap). RUINS is
// the cold ash voice; RECEIVED and CARRIED take the lantern's amber as the light passes.
import { lyricModule, setLine, outFade } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  lines.forEach((l, i) => {
    const next = lines[i + 1];
    const a = (next ? outFade(t, next.start - 0.32, next.start - 0.08) : outFade(t, P.to - 0.3, P.to)) * (t >= l.start - 0.1 ? 1 : 0);
    if (a > 0) setLine(ctx, l, t, { x: 1920, y: 1720, px: 220, align: 'center', alpha: a, rise: 26 });
  });
}, { shade: 0.5 });
