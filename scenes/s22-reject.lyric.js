// The second "filioque": the word stands again; a crack runs through it in the breath before it
// is sung, and on the word it shatters and falls away. After the silence, the Creed's own words.
import { lyricModule, note, outFade, ease, clamp01 } from '/song/lib/type.js';
import { drawWord } from '/song/lib/shatter.js';
export default lyricModule((ctx, t, P, lines) => {
  const w = lines[0].words[0];
  const tb = w.start + 0.12;
  const a = ease.out3(clamp01((t - P.from) / 0.8));
  drawWord(ctx, t, { cx: 1920, cy: 1080, alpha: a, tc0: w.start - 0.9, tb });
  const k = ease.out3(clamp01((t - tb - 2.6) / 1.4)) * outFade(t, P.to - 0.3, P.to);
  if (k > 0) {
    note(ctx, 'WHO PROCEEDS FROM THE FATHER', 1920, 1500, { px: 86, align: 'center', alpha: 0.95 * k, color: '255, 214, 160', track: 0.3 });
    note(ctx, 'JOHN 15:26   ·   CONSTANTINOPLE 381', 1920, 1620, { px: 46, align: 'center', alpha: 0.8 * k });
  }
}, { shade: 0.55 });
