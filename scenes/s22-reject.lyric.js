// The hard silence and the second "filioque". In the silence the Creed's own line stands alone,
// lit gold: WHO PROCEEDS FROM THE FATHER. On the second sung word the addition is set against it,
// AND THE SON, wreathed in fire: the clause that divided the Church and set it burning.
import { lyricModule, note, outFade, ease, clamp01 } from '/song/lib/type.js';
import { fireText } from '/song/lib/firetext.js';
export default lyricModule((ctx, t, P, lines) => {
  const w = lines[0].words[0];
  const a1 = ease.out3(clamp01((t - P.from - 0.3) / 1.2));
  const out = outFade(t, P.to - 0.3, P.to);
  if (a1 > 0) {
    ctx.save();
    ctx.font = '600 150px "EB Garamond"'; ctx.letterSpacing = '22px';
    const s = 'WHO PROCEEDS FROM THE FATHER';
    const wd = ctx.measureText(s).width;
    ctx.shadowColor = `rgba(255, 170, 70, ${0.8 * a1})`; ctx.shadowBlur = 40;
    ctx.fillStyle = `rgba(255, 216, 156, ${a1 * out})`;
    ctx.fillText(s, 1920 - wd / 2, 860);
    ctx.restore();
    note(ctx, 'JOHN 15:26   ·   CONSTANTINOPLE 381', 1920, 980, { px: 44, align: 'center', alpha: 0.75 * a1 * out });
  }
  // the addition, wreathed in fire, slamming in on the sung word and burning harder
  const k = ease.out3(clamp01((t - w.start + 0.05) / 0.3));
  if (k > 0) {
    const fire = 0.5 + 1.0 * ease.inOut3(clamp01((t - w.start) / 3.0));
    fireText(ctx, 'AND THE SON', 1920, 1380 + 40 * (1 - k), t, { font: '700 260px "EB Garamond"', track: '36px', k: fire, alpha: k * out, ember: 1 });
  }
}, { shade: 0 });
