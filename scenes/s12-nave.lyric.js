// 12 · the road verse, two lines at a time, right, over the evening sky.
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 3580, y: 760, px: 200, align: 'right', group: 2, gap: 1.3 });
});
