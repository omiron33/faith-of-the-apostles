// 31 · the second chorus's road lines, two at a time, low left over the darkening valley.
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 260, y: 1560, px: 200, align: 'left', group: 2, gap: 1.3 });
});
