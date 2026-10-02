// The words of s35-complete: a right-hand column beside the cup, two lines at a time, right-aligned.
// "pardon" and "release" in mercy's rose italic; "broken" cold; "complete" in the flame's gold italic.
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 3560, y: 760, px: 210, align: 'right', group: 2, gap: 1.3 });
});
