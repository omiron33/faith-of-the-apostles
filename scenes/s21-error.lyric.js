// The first sung "filioque": the Latin word rises into the dark nave on its onset, bathed in fire.
import { lyricModule, ease, clamp01, outFade } from '/song/lib/type.js';
import { fireText } from '/song/lib/firetext.js';
export default lyricModule((ctx, t, P, lines) => {
  const w = lines[0].words[0];
  const k = ease.out3(clamp01((t - w.start + 0.05) / 0.4));
  if (k <= 0) return;
  fireText(ctx, 'FILIOQUE', 1920, 1260 + 30 * (1 - k), t, { font: '700 380px "EB Garamond"', track: '50px', k: 0.4 + 0.8 * ease.out3(clamp01((t - w.start) / 1.2)), alpha: k * outFade(t, P.to - 0.15, P.to) });
}, { shade: 0 });
