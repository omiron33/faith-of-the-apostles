// 23 · two lines at a time, upper left, clear of the lantern.
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 260, y: 640, px: 200, align: 'left', group: 2, gap: 1.3 });
});
