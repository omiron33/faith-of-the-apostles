// The words of s06-succession: two lines at a time high on the left, over the dark above the row,
// left-aligned so the eye reads across and then down the line of flames. "prayer", "bishop" and
// "fire" take their voices (flame italic, faith amber).
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 250, y: 470, px: 200, align: 'left', group: 2, gap: 1.28 });
});
