// Words on fire, for the lyric layer: the letters glow like embers with charred cores, and flames
// rise off their tops and edges, flickering. Deterministic: every flame is a function of time.
const caches = new Map();
const fract = (x) => x - Math.floor(x);
const h = (i, k = 0) => fract(Math.sin(i * 127.1 + k * 311.7) * 43758.5453);

// the word as a mask, and the points along its upper edges where flames take hold
function prep(text, font, track) {
  const key = text + '|' + font + '|' + track;
  if (caches.has(key)) return caches.get(key);
  const c = document.createElement('canvas');
  let g = c.getContext('2d');
  g.font = font; g.letterSpacing = track;
  const w = Math.ceil(g.measureText(text).width) + 40;
  const px = parseFloat(font.match(/(\d+)px/)[1]);
  const H = Math.ceil(px * 1.4);
  c.width = w; c.height = H; g = c.getContext('2d');
  g.font = font; g.letterSpacing = track; g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff'; g.fillText(text, 20, H * 0.82);
  const d = g.getImageData(0, 0, w, H).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < H && d[(y * w + x) * 4 + 3] > 128;
  const pts = [];
  const step = Math.max(3, Math.round(px / 40));
  for (let x = 0; x < w; x += step) for (let y = 1; y < H; y += step) {
    if (on(x, y) && !on(x, y - step)) pts.push([x, y, 1]);          // a top edge: big flames
    else if (on(x, y) && (!on(x - step, y) || !on(x + step, y)) && (x * 7 + y) % 3 === 0) pts.push([x, y, 0.25]);   // a side edge
  }
  const out = { c, w, H, px, pts, baseY: H * 0.82 };
  caches.set(key, out);
  return out;
}

// draw text centred at (cx, baseline y) on fire. k: how much fire (0..1+); alpha: overall.
export function fireText(ctx, text, cx, y, t, { font = '700 300px "EB Garamond"', track = '20px', k = 1, alpha = 1, ember = 1 } = {}) {
  const P = prep(text, font, track);
  const x0 = cx - P.w / 2, y0 = y - P.baseY;
  if (alpha <= 0.002) return { x0, y0, w: P.w, h: P.H };
  ctx.save();
  ctx.globalAlpha = alpha;
  // the letters: ember-hot rims, charred cores
  const tint = document.createElement('canvas'); tint.width = P.w; tint.height = P.H;
  const tg = tint.getContext('2d');
  tg.drawImage(P.c, 0, 0);
  tg.globalCompositeOperation = 'source-in';
  const gr = tg.createLinearGradient(0, P.baseY - P.px * 0.75, 0, P.baseY);
  const f = 0.85 + 0.15 * Math.sin(t * 9.0) * Math.sin(t * 5.3);
  gr.addColorStop(0, `rgb(255, ${Math.round(200 * f)}, ${Math.round(110 * f)})`);
  gr.addColorStop(0.5, `rgb(${Math.round(235 * ember)}, ${Math.round(95 * ember)}, 25)`);
  gr.addColorStop(1, `rgb(${Math.round(120 * ember)}, 30, 12)`);
  tg.fillStyle = gr; tg.fillRect(0, 0, P.w, P.H);
  // the flames
  ctx.globalCompositeOperation = 'lighter';
  const n = P.pts.length;
  for (let i = 0; i < n; i++) {
    const [px, py, big] = P.pts[i];
    if (h(i, 3) > 0.55 * Math.min(1, k) + 0.2) continue;
    for (let j = 0; j < 2; j++) {
      const life = fract(t * (0.9 + 0.8 * h(i, j)) + h(i, j + 7));
      const rise = P.px * 0.04 + life * P.px * (0.4 + 0.5 * h(i, 5)) * big * k;
      const sway = Math.sin(t * 6 + i * 0.7 + j) * P.px * 0.04 * life;
      const r = P.px * (0.07 + 0.06 * h(i, 9)) * (1 - life) * (0.6 + 0.4 * big) * Math.min(1.4, k);
      if (r < 1) continue;
      const fx = x0 + px + sway, fy = y0 + py - rise;
      const a = (1 - life) * 0.55;
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r * 2.2);
      g.addColorStop(0, `rgba(255, ${Math.round(230 - 120 * life)}, ${Math.round(150 - 140 * life)}, ${a})`);
      g.addColorStop(0.45, `rgba(255, ${Math.round(120 - 70 * life)}, 20, ${a * 0.55})`);
      g.addColorStop(1, 'rgba(160, 20, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(fx, fy - r * 0.6, r * 0.9, r * 2.2, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  // the letters over the flames: a charred outline, then the ember face
  ctx.shadowColor = 'rgba(20, 6, 2, 0.95)'; ctx.shadowBlur = P.px * 0.06;
  ctx.drawImage(tint, x0, y0);
  ctx.shadowColor = `rgba(255, 110, 20, ${0.7 * Math.min(1, k)})`; ctx.shadowBlur = P.px * 0.2;
  ctx.drawImage(tint, x0, y0);
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'lighter';
  // sparks
  for (let i = 0; i < 40 * k; i++) {
    const life = fract(t * 0.5 + h(i, 21));
    const [px, py] = P.pts[Math.floor(h(i, 22) * n)] ?? [P.w / 2, P.baseY];
    const sx = x0 + px + (h(i, 23) - 0.5) * P.px * 0.8 * life, sy = y0 + py - life * P.px * 1.4;
    ctx.fillStyle = `rgba(255, ${Math.round(200 - 100 * life)}, 80, ${(1 - life) * 0.9})`;
    ctx.fillRect(sx, sy, 4, 4);
  }
  ctx.restore();
  return { x0, y0, w: P.w, h: P.H };
}
