// The filioque, broken: the word set once into its own canvas, cut into jagged shards
// (a jittered grid, each cell two triangles), which crack, then fall away under gravity, turning.
// Deterministic: everything is a function of time since the break.
const rnd = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

let cache = null;
// the word in carved stone capitals: a lit face, a dark undercut, a faint inner bevel
export function wordCanvas(word = 'FILIOQUE', px = 420) {
  if (cache && cache.word === word && cache.px === px) return cache;
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `700 ${px}px "EB Garamond"`; g.letterSpacing = `${px * 0.16}px`;
  const w = Math.ceil(g.measureText(word).width + px * 0.4), h = Math.ceil(px * 1.3);
  c.width = w; c.height = h;
  g.font = `700 ${px}px "EB Garamond"`; g.letterSpacing = `${px * 0.16}px`;
  g.textBaseline = 'alphabetic';
  const y = h * 0.82, x = px * 0.2;
  g.fillStyle = 'rgba(10, 8, 8, 0.9)'; g.fillText(word, x + px * 0.02, y + px * 0.03);   // undercut shadow
  const grad = g.createLinearGradient(0, y - px * 0.75, 0, y);
  grad.addColorStop(0, '#d8d2c8'); grad.addColorStop(0.55, '#a9a196'); grad.addColorStop(1, '#6f685f');
  g.fillStyle = grad; g.fillText(word, x, y);
  // grain in the stone
  const id = g.getImageData(0, 0, w, h); const r = rnd(7);
  for (let i = 0; i < id.data.length; i += 4) { const k = 0.86 + 0.22 * r(); id.data[i] *= k; id.data[i + 1] *= k; id.data[i + 2] *= k; }
  g.putImageData(id, 0, 0);
  cache = { word, px, canvas: c, w, h, shards: makeShards(w, h), crack: makeCrack(w, h) };
  return cache;
}
function makeShards(w, h) {
  const r = rnd(1054), nx = 12, ny = 3;
  const P = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const edge = i === 0 || j === 0 || i === nx || j === ny;
    P.push([(i / nx) * w + (edge ? 0 : (r() - 0.5) * w / nx * 0.8), (j / ny) * h + (edge ? 0 : (r() - 0.5) * h / ny * 0.8)]);
  }
  const at = (i, j) => P[j * (nx + 1) + i];
  const S = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    const tris = r() < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
    for (const t of tris) {
      const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
      S.push({ poly: t, cx, cy, vx: (cx / w - 0.5) * 900 + (r() - 0.5) * 500, vy: -250 - 500 * r(), spin: (r() - 0.5) * 6, delay: 0.02 * Math.abs(cx / w - 0.5) * 6 + 0.04 * r() });
    }
  }
  return S;
}
function makeCrack(w, h) {
  const r = rnd(381); const pts = [[w * 0.5, 0]]; let x = w * 0.5;
  for (let y = h / 10; y <= h; y += h / 10) { x += (r() - 0.5) * w * 0.08; pts.push([x, y]); }
  const branches = [];
  for (let k = 0; k < 6; k++) { const s = pts[1 + Math.floor(r() * 8)]; let bx = s[0], by = s[1]; const dir = r() < 0.5 ? -1 : 1; const b = [[bx, by]];
    for (let n = 0; n < 7; n++) { bx += dir * w * (0.03 + 0.05 * r()); by += (r() - 0.5) * h * 0.25; b.push([bx, by]); } branches.push(b); }
  return { main: pts, branches };
}
// draw the word centred at (cx, cy): alpha before the break; crack grows over [tc0, tb]; shatters at tb
export function drawWord(ctx, t, { cx = 1920, cy = 1080, alpha = 1, tc0 = Infinity, tb = Infinity, word = 'FILIOQUE', px = 420, scale = 1 } = {}) {
  const W = wordCanvas(word, px);
  const x0 = cx - W.w * scale / 2, y0 = cy - W.h * scale * 0.62;
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha = alpha;
  if (t < tb) {
    ctx.drawImage(W.canvas, x0, y0, W.w * scale, W.h * scale);
    const k = Math.min(1, Math.max(0, (t - tc0) / Math.max(0.01, tb - tc0)));
    if (k > 0) {
      ctx.strokeStyle = 'rgba(8, 6, 6, 0.95)'; ctx.lineWidth = 6 * scale;
      const line = (pts, f) => { const n = Math.max(2, Math.floor(pts.length * f)); ctx.beginPath(); pts.slice(0, n).forEach((p, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x0 + p[0] * scale, y0 + p[1] * scale)); ctx.stroke(); };
      line(W.crack.main, k);
      ctx.lineWidth = 3.5 * scale;
      W.crack.branches.forEach((b) => line(b, Math.max(0, k * 1.6 - 0.6)));
    }
  } else {
    const u = t - tb;
    for (const s of W.shards) {
      const v = Math.max(0, u - s.delay);
      const dx = s.vx * v, dy = s.vy * v + 0.5 * 2600 * v * v, a = s.spin * v;
      const fade = Math.max(0, 1 - v / 1.6);
      if (fade <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha * fade;
      ctx.translate(x0 + (s.cx + dx) * scale, y0 + (s.cy + dy) * scale); ctx.rotate(a); ctx.translate(-x0 - s.cx * scale, -y0 - s.cy * scale);
      ctx.beginPath(); s.poly.forEach((p, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x0 + p[0] * scale, y0 + p[1] * scale)); ctx.closePath(); ctx.clip();
      ctx.drawImage(W.canvas, x0, y0, W.w * scale, W.h * scale);
      ctx.restore();
    }
    // dust where it broke
    const dust = Math.max(0, 1 - u / 1.2);
    if (dust > 0) { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W.w * scale * 0.6); g.addColorStop(0, `rgba(190, 180, 168, ${0.25 * dust})`); g.addColorStop(1, 'rgba(190,180,168,0)'); ctx.fillStyle = g; ctx.fillRect(cx - W.w * scale, cy - W.h * scale, W.w * scale * 2, W.h * scale * 2); }
  }
  ctx.restore();
}
