// The words of s28-tomb: one line at a time, centred high over the night sky above the tomb, large.
// "Word" is God's own voice; "grave" and "death" cold ash; "stay" plain, the last word held.
import { lyricModule, single } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  single(ctx, t, P, lines, { x: 1920, y: 470, px: 230, align: 'center' });
});
