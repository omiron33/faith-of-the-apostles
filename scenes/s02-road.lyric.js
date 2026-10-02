// The words of s02-road: two short lines set big and plain at the lower left, over the dark verge,
// stacked like an inscription: OLD ROADS. waits, and OLD PRAYERS. lands beneath it in the lantern's
// amber italic (prayers carries the flame voice).
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 300, y: 1540, px: 250, align: 'left', group: 2, gap: 1.12, rise: 30 });
}, { shade: 0.5 });
