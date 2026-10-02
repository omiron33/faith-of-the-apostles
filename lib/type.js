// The words' voices and type helpers. Only lyric modules import this, so typography changes never
// re-render pictures. Each word is set by what it means: its colour, face and weight carry it.
import { ease, clamp01, clean } from '/song/lib/look.js';
export * from '/song/lib/look.js';

// the song's own font (the engine supplies EB Garamond and Inter Tight)
await (async () => {
  const buf = await fetch('/song/fonts/Anton-Regular.ttf').then((r) => { if (!r.ok) throw Error('font Anton'); return r.arrayBuffer(); });
  const f = new FontFace('Anton', buf); await f.load(); document.fonts.add(f);
})();
const ANTON = (px) => `400 ${px}px "Anton"`;

const GAR = (w, it = false) => (px) => `${it ? 'italic ' : ''}${w} ${px}px "EB Garamond"`;
const INTER = (w, it = false) => (px) => `${it ? 'italic ' : ''}${w} ${Math.round(px * 0.8)}px "Inter Tight"`;

export const VOICES = {
  // the small words of a shouted line: Anton, bone, tracked a little
  quiet: { words: [], color: '232, 226, 214', font: ANTON, caps: true, track: 0.06, scale: 0.62 },
  // the shout: heavy condensed capitals, bone white
  shout: { words: [], color: '242, 238, 230', font: ANTON, caps: true, track: 0.02, scale: 1.0 },
  // God: bone white capitals with the lantern's warmth around them
  divine: { words: ['god', 'lord', 'father', 'son', 'spirit', 'word', 'holy', 'mighty', 'immortal'], color: '255, 240, 214', glow: '255, 170, 80', font: ANTON, caps: true, track: 0.03, scale: 1.04 },
  // the faith carried: lantern amber, heavy
  faith: { words: ['faith', 'apostles', 'fathers', 'creed', 'councils', 'bishops', 'bishop', 'twelve', 'baptism', 'faithfully', 'ancient', 'received', 'handed', 'carried', 'guarding', 'one'], color: '255, 172, 72', glow: '255, 120, 30', font: ANTON, caps: true, track: 0.02, scale: 1.04 },
  // the flame and its light: amber italic serif
  flame: { words: ['flame', 'fire', 'burning', 'light', 'prayers', 'prayer', 'living', 'risen', 'complete'], color: '255, 178, 96', glow: '255, 120, 30', font: GAR(700, true), track: 0.0, scale: 1.14 },
  // the dark and the weight: cold, rain-grey
  ash: { words: ['death', 'grave', 'sorrow', 'suffering', 'shame', 'darkness', 'broken', 'blood', 'stone', 'stones', 'scars', 'wars', 'ruins', 'kings', 'wounds', 'alone', 'dark'], color: '170, 184, 204', font: ANTON, caps: true, track: 0.04, scale: 1.0 },
  // division: cold steel sans, tracked wide
  schism: { words: ['divide', 'distance', 'break', 'cracks', 'undone', 'tension', 'east', 'west', 'rome', 'shore', 'side', 'tongues', 'thrones', 'ten-fifty-four', 'climbed'], color: '150, 176, 210', font: INTER(800), caps: true, track: 0.14, scale: 0.98 },
  // the filioque: a cheap, wrong colour and a loud face that belongs nowhere else
  error: { words: ['fill-ee-oh-kway', 'filioque'], color: '255, 64, 104', font: INTER(900, true), caps: true, track: 0.02, scale: 1.2 },
  // mercy: a cry, rose-white italic serif
  mercy: { words: ['mercy', 'have', 'pardon', 'release', 'love', 'adored'], color: '255, 226, 214', glow: '255, 140, 110', font: GAR(700, true), track: 0.0, scale: 1.12 },
  // the Theotokos: cinnabar
  mother: { words: ['mary', 'theotokos', 'mother', 'bore'], color: '250, 130, 104', font: GAR(700, true), track: 0.01, scale: 1.12 },
};
const LEX = {};
for (const [k, c] of Object.entries(VOICES)) for (const w of c.words) LEX[w] = k;
export const PLAIN = { color: '238, 232, 222', font: (px, it) => `${it ? 'italic ' : ''}600 ${px}px "EB Garamond"`, track: -0.005, scale: 1 };

export const keyOf = (word) => clean(word).toLowerCase().replace(/[^a-z’'-]/g, '').replace(/[’']s$/, '');
export function voiceOf(word, override) {
  if (override) return VOICES[override] ?? PLAIN;
  return VOICES[LEX[keyOf(word)]] ?? PLAIN;
}
export const shown = (w, v) => { const s = clean(w).replace(/[;,.:—!?]+$/, '').replace(/^[“"]/, '').replace(/[”"]$/, ''); return v?.caps ? s.toUpperCase() : s; };

function setFont(ctx, v, size, italic) {
  ctx.font = v === PLAIN ? PLAIN.font(size, italic) : v.font(size);
  ctx.fontVariantCaps = 'normal';
  ctx.letterSpacing = `${(v.track ?? 0) * size}px`;
}
// Advance of a word in its voice (word plus a space).
export function measure(ctx, word, px, { italic = false, voice } = {}) {
  const v = voiceOf(word, voice);
  const size = Math.round(px * v.scale);
  setFont(ctx, v, size, italic);
  const w = ctx.measureText(shown(word, v)).width;
  ctx.font = PLAIN.font(px, false); ctx.fontVariantCaps = 'normal'; ctx.letterSpacing = '0px';
  const extra = (v === PLAIN ? italic : /italic/.test(v.font(10))) ? size * 0.08 : 0;
  return w + ctx.measureText(' ').width * 1.1 + extra;
}
// Paint one word in its voice at (x, baseline y). alpha 0..1; glow adds the divine words' soft light.
export function paint(ctx, word, x, y, px, { alpha = 1, italic = false, voice, ink, glow = true } = {}) {
  const v = voiceOf(word, voice);
  const size = Math.round(px * v.scale);
  if (alpha > 0.002) {
    setFont(ctx, v, size, italic);
    if (glow && v.glow) { ctx.shadowColor = `rgba(${v.glow}, ${(0.55 * alpha).toFixed(3)})`; ctx.shadowBlur = size * 0.35; }
    ctx.fillStyle = `rgba(${ink ?? v.color}, ${Math.min(1, alpha).toFixed(3)})`;
    ctx.fillText(shown(word, v), x, y);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  }
  return measure(ctx, word, px, { italic, voice });
}
export function lineWidth(ctx, words, px, o = {}) {
  let w = 0;
  for (const x of words) w += measure(ctx, x.w ?? x, px, o);
  ctx.font = PLAIN.font(px, false);
  return w - ctx.measureText(' ').width * 1.1;
}

// A word's arrival: k eases 0..1 from just before its onset; fully set 0.1 s after it.
export function arrive(w, t, lead = 0.06, dur = 0.16) {
  const k = ease.out3(clamp01((t - w.start + lead) / dur));
  return { k, a: clamp01(k * 2.2) };
}
// fade-out helper: 1 until t0, 0 at t1
export const outFade = (t, t0, t1) => 1 - ease.inOut3(clamp01((t - t0) / (t1 - t0)));

// Set a line word by word: each word rises a little and settles on its sung onset.
// o: x, y, px, align ('left'|'center'|'right'), alpha, italic, rise, voice (force one voice)
export function setLine(ctx, line, t, o = {}) {
  let px = o.px ?? 200;
  const words = line.words ?? line;
  let total = lineWidth(ctx, words, px, o);
  // never run off the frame: shrink the line to fit inside a 200 px margin of the 3840 canvas
  const ax = o.x ?? 1920;
  const room = o.align === 'right' ? ax - 200 : o.align === 'left' ? 3640 - ax : 2 * Math.min(ax - 200, 3640 - ax);
  if (total > room) { px *= room / total; total = lineWidth(ctx, words, px, o); }
  let x = o.x ?? 1920;
  if (o.align === 'center' || !o.align) x -= total / 2; else if (o.align === 'right') x -= total;
  const laid = [];
  for (const w of words) {
    const st = arrive(w, t);
    const y = (o.y ?? 1080) + (1 - st.k) * (o.rise ?? px * 0.1);
    const adv = paint(ctx, w.w, x, y, px, { ...o, alpha: st.a * (o.alpha ?? 1) });
    laid.push({ w, x, adv, st });
    x += adv;
  }
  return { words: laid, width: total };
}

// Small tracked capitals in the annotation voice (a council, a year, a scripture reference).
export function note(ctx, text, x, y, { px = 44, alpha = 0.8, color = '236, 222, 196', align = 'left', track = 0.28 } = {}) {
  ctx.font = `500 ${px}px "Inter Tight"`;
  ctx.fontVariantCaps = 'normal';
  ctx.letterSpacing = `${px * track}px`;
  const w = ctx.measureText(text).width;
  ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
  ctx.fillText(text, align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y);
  ctx.letterSpacing = '0px';
  return w;
}

// An inscription row: small words in tracked bone capitals, words with a voice large in that voice,
// all on one baseline and centred on x. Each word settles on its onset.
export function inscribe(ctx, words, t, { x = 1920, y = 1080, small = 120, big = 280, alpha = 1, rise } = {}) {
  const isBig = (w) => voiceOf(w.w) !== PLAIN;
  const sz = (w) => (isBig(w) ? big : small);
  const o = (w) => (isBig(w) ? {} : { voice: 'quiet' });
  let total = 0;
  const adv = words.map((w) => measure(ctx, w.w, sz(w), o(w)) + (isBig(w) ? 0 : small * 0.25));
  total = adv.reduce((s, v) => s + v, 0) - small * 0.5;
  let xx = x - total / 2;
  words.forEach((w, i) => {
    const st = arrive(w, t);
    const yy = y + (1 - st.k) * (rise ?? sz(w) * 0.08);
    paint(ctx, w.w, xx, yy, sz(w), { ...o(w), alpha: st.a * alpha });
    xx += adv[i];
  });
}

// ---------------- layouts ----------------
import lyricsAll from '/timing.js';
// the scene's lines: those sung inside its window
export function linesIn(P) {
  return lyricsAll.lines.filter((l) => l.start >= P.from - 0.6 && l.start < P.to - 0.1)
    .map((l) => ({ ...l, words: lyricsAll.words.filter((w) => w.start >= l.start - 0.05 && w.end <= l.end + 0.05) }));
}
// lines shown in groups (pairs by default): each group's rows at y, y + gap·px, ...; a group clears
// as the next group begins, the last at P.to. x/align place the block.
export function verse(ctx, t, P, lines, { x = 260, y = 1500, px = 190, gap = 1.3, align = 'left', group = 2, groups, italic = false, voice, rise } = {}) {
  // groups: explicit sizes, e.g. [1, 1, 1, 2]; otherwise every group has `group` lines
  const starts = [];
  if (groups) { let i = 0; for (const n of groups) { starts.push([i, n]); i += n; } }
  else for (let i = 0; i < lines.length; i += group) starts.push([i, group]);
  for (const [g, n] of starts) {
    const grp = lines.slice(g, g + n);
    if (!grp.length) continue;
    const next = lines[g + n];
    const a = (next ? outFade(t, next.start - 0.25, next.start + 0.02) : outFade(t, P.to - 0.2, P.to)) * (t >= grp[0].start - 0.1 ? 1 : 0);
    if (a <= 0) continue;
    grp.forEach((l, i) => setLine(ctx, l, t, { x, y: y + i * px * gap, px, align, alpha: a, italic, voice, rise }));
  }
}
// one line at a time, large
export function single(ctx, t, P, lines, o = {}) { verse(ctx, t, P, lines, { group: 1, ...o }); }
// the chorus shout: small words above, the voiced words huge, slamming in on their beat
export function shout(ctx, words, t, { cx = 1920, y = 1500, small = 130, big = 380, alpha = 1 } = {}) {
  const isSmall = (w) => voiceOf(w.w) === PLAIN || /^(this|is|the|of|on|us)$/i.test(shown(w.w));
  const smalls = words.filter(isSmall), bigs = words.filter((w) => !isSmall(w));
  let sw = 0; for (const w of smalls) sw += measure(ctx, w.w, small, { voice: 'quiet' });
  let x = cx - sw / 2;
  for (const w of smalls) { const st = arrive(w, t); paint(ctx, w.w, x, y - big * 0.97, small, { alpha: st.a * alpha, voice: 'quiet' }); x += measure(ctx, w.w, small, { voice: 'quiet' }); }
  let bw = 0; for (const w of bigs) bw += measure(ctx, w.w, big);
  let bx = cx - bw / 2;
  for (const w of bigs) {
    const st = arrive(w, t, 0.04, 0.12);
    const ww = measure(ctx, w.w, big);
    const sc = 1 + 0.08 * (1 - st.k);
    ctx.save(); ctx.translate(bx + ww / 2, y); ctx.scale(sc, sc);
    paint(ctx, w.w, -ww / 2, 0, big, { alpha: st.a * alpha });
    ctx.restore();
    bx += ww;
  }
}
// a lyric module from a draw function (ctx, t, P, lines)
export const lyricModule = (draw, { shade = 0.5 } = {}) => (P) => {
  const lines = linesIn(P);
  return {
    textSize: [3840, 2160], shade,
    textPlane(t, cam) { return cameraPlaneCompat(cam); },
    drawText(ctx, t) { draw(ctx, t, P, lines); },
  };
};
import { cameraPlane as cameraPlaneCompat0 } from '/engine.js';
const cameraPlaneCompat = (cam) => cameraPlaneCompat0(cam, { width: 1, dist: 1, aspect: 16 / 9 });
