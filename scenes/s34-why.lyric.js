// The words of s34-why. The questions, slow and large, set as two couplets right-aligned on the
// right of the frame, up in the dark under the cloud, opposite the one small light on the left so the
// eye goes from the light to the question. Each word settles slowly with a long soft rise; the first
// couplet gives way to the second as "Why step into sorrow" begins.
import { linesAt, setLine, outFade } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const L = linesAt(P.from - 0.6, 'But why did He come', 'Why take our frame', 'Why step into sorrow', 'suffering and shame');
  const X = 3560, Y = [560, 820], px = 205;
  const slow = (l) => ({ ...l, words: l.words.map((w) => ({ ...w, start: w.start + 0.04 })) });
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      const end = outFade(t, P.to - 0.25, P.to);
      const swap = L[2].words[0].start;
      const a1 = outFade(t, swap - 0.35, swap - 0.02) * end;
      if (a1 > 0) {
        setLine(ctx, slow(L[0]), t, { x: X, y: Y[0], px, align: 'right', alpha: a1, rise: 40 });
        setLine(ctx, slow(L[1]), t, { x: X, y: Y[1], px, align: 'right', alpha: a1, rise: 40 });
      }
      if (t > swap - 0.2) {
        setLine(ctx, slow(L[2]), t, { x: X, y: Y[0], px, align: 'right', alpha: end, rise: 40 });
        setLine(ctx, slow(L[3]), t, { x: X, y: Y[1], px, align: 'right', alpha: end, rise: 40 });
      }
    },
  };
};
