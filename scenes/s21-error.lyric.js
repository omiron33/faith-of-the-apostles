// The first sung "filioque": the word itself in carved stone capitals, heavy and cold, rising
// slowly into place over the nave on its onset. No phonetics: the Latin word.
import { lyricModule, ease, clamp01 } from '/song/lib/type.js';
import { drawWord } from '/song/lib/shatter.js';
export default lyricModule((ctx, t, P, lines) => {
  const w = lines[0].words[0];
  const k = ease.out3(clamp01((t - w.start + 0.05) / 0.5));
  if (k <= 0) return;
  drawWord(ctx, t, { cx: 1920, cy: 1080 + 40 * (1 - k), alpha: k, scale: 0.96 + 0.04 * k });
}, { shade: 0.55 });
