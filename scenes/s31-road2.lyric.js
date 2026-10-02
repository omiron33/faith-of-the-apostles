// 31 · the second chorus's road lines over the burning map, two at a time, low and centred.
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 1920, y: 1700, px: 200, align: 'center', group: 2, gap: 1.25 });
});
