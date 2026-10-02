// The words of s05-map: set high and centred over the map like a cartouche, one line at a time,
// the second replacing the first as the lines of fire land.
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 1920, y: 330, px: 170, align: 'center', group: 1, rise: 24 });
}, { shade: 0.55 });
