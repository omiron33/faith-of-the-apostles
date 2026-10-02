// The film's shared look: palette, the grade, timing helpers and camera helpers.
// Scene (picture) modules import this; anything here is part of every picture.
import { keys, ease, wordState, smartQuotes, clamp01 } from '/engine.js';
import lyrics from '/timing.js';

// sRGB 0..255 strings for Canvas, and linear triples for shaders
export const BONE = '246, 238, 222';      // beeswax white
export const GOLD = '238, 190, 92';       // mosaic gold, the faith
export const FLAME = '255, 158, 72';      // the one flame, the only colour that glows
export const LAPIS = '38, 70, 150';       // the vault
export const CINNABAR = '178, 38, 30';    // the Theotokos' maphorion, martyrs
export const ERROR = '255, 40, 92';       // the filioque: a cheap, wrong colour that belongs nowhere else

const lin = (c) => Math.pow(c / 255, 2.2);
export const rgb = (s, k = 1) => s.split(',').map((v) => lin(+v) * k);

// The grade. Warm candlelight, deep but never black.
export function grade(t, extra = {}) {
  return {
    saturation: 1.04, contrast: 1.05,
    lift: [0.014, 0.010, 0.008], gain: [1.03, 0.99, 0.94],
    grain: 0.03, vignette: 0.45, ca: 0.25,
    bloom: 0.09, threshold: 1.1,
    ...extra,
  };
}

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const mix = (a, b, k) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * k) : a + (b - a) * k);

// An underdamped spring from 0 to 1 over `dur` seconds after t0 (a hit that settles, no dead stop).
export function spring(t, t0, dur = 0.5, bounce = 0.35) {
  const x = (t - t0) / dur;
  if (x <= 0) return 0;
  if (x >= 3) return 1;
  const w = 9.0, z = 1 - bounce;
  return 1 - Math.exp(-z * w * x * 0.9) * Math.cos(w * x * (1 - z * 0.3));
}

const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();
// Lines (by their opening words, in order) at or after song time `after`. Repeated lines (the
// choruses) are found in order, so pass a time just before the scene.
export function linesAt(after, ...prefixes) {
  let from = after;
  return prefixes.map((p) => {
    const l = lyrics.lines.find((l) => l.start >= from && norm(l.text).startsWith(norm(p)));
    if (!l) throw Error('no line after ' + after + ': ' + p);
    from = l.start + 0.01;
    return { ...l, words: lyrics.words.filter((w) => w.start >= l.start - 0.05 && w.end <= l.end + 0.05) };
  });
}
export const linesFrom = (...p) => linesAt(0, ...p);

export const beats = (lyrics.beats ?? []);
export function nextBeat(t) { return beats.find((b) => b >= t) ?? t; }

export const clean = (s) => smartQuotes(s).replace(/[“”"]/g, '');

export { keys, ease, clamp01, wordState, smartQuotes, lyrics };

// Project a world point through a camera to text-canvas pixels (canvas W×H spanning the frame).
export function project(cam, p, W = 3840, H = 2160) {
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const nrm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const ww = nrm(sub(cam.target, cam.pos));
  const roll = cam.roll ?? 0;
  const uu = nrm(cross(ww, [Math.sin(roll), Math.cos(roll), 0])), vv = cross(uu, ww);
  const d = sub(p, cam.pos);
  const z = dot(d, ww);
  const f = 1 / Math.tan(((cam.fov ?? 40) * Math.PI) / 360);
  const x = (dot(d, uu) / z) * f, y = (dot(d, vv) / z) * f;
  return { x: W / 2 + x * (H / 2), y: H / 2 - y * (H / 2), z };
}

// A slow handheld drift, a pure function of t (metres / radians).
export function drift(t, amt = 0.01) {
  return [amt * (Math.sin(t * 0.61) + 0.5 * Math.sin(t * 1.73 + 1.1)), amt * 0.6 * (Math.sin(t * 0.47 + 2.0) + 0.5 * Math.sin(t * 1.31)), 0];
}
