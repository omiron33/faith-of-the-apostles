// The words of s17-years: set high at the left against the storm deck, two lines at a time; TENSION,
// CLIMBED, BREAK and TEN-FIFTY-FOUR in the schism voice's cold steel. Beneath, at the right edge, a
// small annotation counts the years from A.D. 800, quickening line by line until it lands on 1054
// exactly as the year is sung.
import { lyricModule, setLine, outFade, note, linesAt, ease, clamp01 } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const groups = [[0, 1], [2, 3]];
  groups.forEach(([a, b], g) => {
    const next = lines[groups[g + 1]?.[0]];
    const al = (next ? outFade(t, next.start - 0.32, next.start - 0.08) : outFade(t, P.to - 0.3, P.to)) * (t >= lines[a].start - 0.1 ? 1 : 0);
    if (al <= 0) return;
    setLine(ctx, lines[a], t, { x: 250, y: 470, px: 175, align: 'left', alpha: al, rise: 22 });
    if (lines[b]) setLine(ctx, lines[b], t, { x: 250, y: 470 + 175 * 1.3, px: 175, align: 'left', alpha: al, rise: 22 });
  });
  // the year counter: 800 on the first line, 900 on the second, 1000 on the third, 1054 on the year
  const ks = [[lines[0].start, 800], [lines[1].start, 900], [lines[2].start, 1000], [lines[3].words.find((w) => /ten/i.test(w.w)).start, 1054]];
  let y = 800;
  for (let i = 1; i < ks.length; i++) if (t >= ks[i - 1][0]) y = t >= ks[i][0] ? ks[i][1] : ks[i - 1][1] + (ks[i][1] - ks[i - 1][1]) * ((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]));
  const k = clamp01((t - lines[0].start + 0.3) / 0.4) * outFade(t, P.to - 0.3, P.to);
  const landed = t >= ks[3][0];
  if (k > 0) {
    note(ctx, 'A.D.', 3590, 1905, { px: 44, align: 'right', alpha: 0.7 * k, color: '200, 214, 236' });
    note(ctx, String(Math.floor(y)), 3590, 2010, { px: landed ? 92 : 80, align: 'right', alpha: (landed ? 1 : 0.85) * k, color: landed ? '236, 242, 255' : '200, 214, 236', track: 0.12 });
  }
}, { shade: 0.5 });
