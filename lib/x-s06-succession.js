// s06's world: apostolic succession. A long brass candle tray filled with sand runs away from the
// camera into the dark of a church; thin beeswax tapers stand in it in a row, each a hand's breadth
// from the next. One burns at the near end. Then, word by word, each taper is lit from the one before:
// a bead of fire leaves the burning flame and drops onto the next wick, which catches, flares and
// settles, so the flame travels away down the row, faster and faster, until the whole line burns into
// the distance. uIgn[i] is the song time taper i catches. Floor of the tray at y = 0, row along +z.
// Everything is a pure function of uTime.
export const N_TAPERS = 30;
export const SP = 0.13;          // spacing along the row (metres)

export const SUCC_UNIFORMS = {
  uIgn: new Array(32).fill(1e4),
  uFocus: 0.6, uAper: 0.0035,
};

export const SUCC_GLSL = /* glsl */ `
uniform float uIgn[32];
uniform float uFocus, uAper;
#define NT ${N_TAPERS}
const float SP = ${SP.toFixed(3)};
const float TR = 0.0055;          // taper radius

// per-taper variation
float tH(int i) { return 0.25 + 0.05 * hash11(float(i) * 3.7 + 1.0); }                       // height above the sand
vec2 tOff(int i) { return (vec2(hash11(float(i) * 5.1 + 2.0), hash11(float(i) * 9.3 + 4.0)) - 0.5) * vec2(0.022, 0.03); }
vec2 tLean(int i) { return (vec2(hash11(float(i) * 2.9 + 7.0), hash11(float(i) * 6.1 + 3.0)) - 0.5) * 0.06; }
vec3 tBase(int i) { vec2 o = tOff(i); return vec3(o.x, 0.0, float(i) * SP + o.y); }
vec3 tTop(int i) { vec3 b = tBase(i); float h = tH(i); return b + vec3(tLean(i).x * h, h, tLean(i).y * h); }
// how far taper i's flame has grown: 0 unlit, 1 burning, with a flare as it catches
float tLit(int i) { float x = uTime - uIgn[i]; return x < 0.0 ? 0.0 : 1.0 - exp(-x * 9.0) * cos(x * 14.0) * 0.9; }
float tFlare(int i) { float x = uTime - uIgn[i]; return x < 0.0 ? 0.0 : exp(-x * 5.0) * smoothstep(0.0, 0.04, x); }

float sdCylY(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }

// the tray: a long brass trough, sand to just under its lip
const float TW = 0.085, TL0 = -0.25, TL1 = ${(N_TAPERS * SP + 0.25).toFixed(3)};
float traySD(vec3 p, out int id) {
  float zc = (TL0 + TL1) * 0.5, zh = (TL1 - TL0) * 0.5;
  float outer = sdBox(p - vec3(0.0, -0.025, zc), vec3(TW, 0.03, zh)) - 0.004;
  float inner = sdBox(p - vec3(0.0, 0.02, zc), vec3(TW - 0.007, 0.04, zh - 0.007));
  float tray = max(outer, -inner);
  // a rolled lip along the edges
  float lip = length(vec2(abs(p.x) - TW, p.y - 0.006)) - 0.006;
  lip = max(lip, abs(p.z - zc) - zh);
  tray = min(tray, lip);
  // the sand, a little uneven, heaped round the tapers
  float sand = max(p.y + 0.012 - 0.003 * fbm(p.xz * 40.0, 3), max(abs(p.x) - TW + 0.006, abs(p.z - zc) - zh + 0.006));
  id = 1;
  if (sand < tray) { id = 2; return sand; }
  return tray;
}
float taperSD(vec3 p, out int which) {
  int k = int(clamp(floor(p.z / SP + 0.5), 0.0, float(NT - 1)));
  float d = 1e9; which = k;
  for (int j = -1; j <= 1; j++) {
    int i = k + j;
    if (i < 0 || i >= NT) continue;
    vec3 b = tBase(i), tp = tTop(i);
    vec3 a = b - vec3(0.0, 0.02, 0.0);
    float c = sdCapsule(p, a, tp - normalize(tp - b) * TR * 0.5, TR);
    // a thin dark wick standing out of the top
    vec3 dir = normalize(tp - b);
    float w = sdCapsule(p, tp, tp + dir * 0.009, 0.0007);
    float dd = min(c, w);
    if (dd < d) { d = dd; which = i; }
  }
  return d;
}
float mapS(vec3 p, out int id, out int which) {
  which = -1;
  float d = traySD(p, id);
  int w; float t = taperSD(p, w);
  if (t < d) { d = t; id = 3; which = w; }
  return d;
}
vec3 normS(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0002;
  int i, w;
  return normalize(e.xyy * mapS(p + e.xyy, i, w) + e.yyx * mapS(p + e.yyx, i, w) + e.yxy * mapS(p + e.yxy, i, w) + e.xxx * mapS(p + e.xxx, i, w));
}
float marchS(vec3 ro, vec3 rd, out int id, out int which) {
  float t = 0.02;
  for (int i = 0; i < 160; i++) {
    float d = mapS(ro + rd * t, id, which);
    if (abs(d) < 0.00012 * t + 0.00004) return t;
    t += d * 0.9;
    if (t > 8.0) break;
  }
  id = -1; return -1.0;
}

vec3 flamePos(int i) { return tTop(i) + vec3(0.0, 0.012 + 0.014 * tLit(i), 0.0); }
float flick(int i) { return 0.88 + 0.12 * vnoise(vec2(uTime * 8.0, float(i) * 13.0)); }
vec3 flameCol(int i) { return vec3(1.0, 0.55, 0.22) * (tLit(i) * flick(i) + 2.5 * tFlare(i)); }

// light from every burning taper (no shadows: thin tapers barely shade one another)
vec3 lightAll(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float metal, out vec3 specOut) {
  vec3 dif = vec3(0); specOut = vec3(0);
  vec3 f0 = mix(vec3(0.04), alb, metal);
  float a = max(0.03, rough * rough), a2 = a * a;
  int k = int(clamp(floor(p.z / SP + 0.5), 0.0, float(NT - 1)));
  for (int i = 0; i < NT; i++) {
    if (uTime < uIgn[i]) continue;
    vec3 L = flamePos(i) - p; float d2 = dot(L, L); L *= inversesqrt(d2);
    float nl = sat(dot(n, L));
    vec3 lc = flameCol(i) * 0.03 / (0.0004 + d2);
    dif += lc * nl;
    vec3 h = normalize(L + v); float nh = sat(dot(n, h));
    float dd = nh * nh * (a2 - 1.0) + 1.0;
    specOut += lc * nl * a2 / (PI * dd * dd) * 0.25;
  }
  specOut *= f0;
  return dif * alb * (1.0 - metal) / PI;
}

// one taper flame drawn where the ray passes its axis (after lib/gothic.js flameAt)
vec3 flameAtS(vec3 ro, vec3 rd, vec3 b, float h, float k, float flare, float seed, float depth) {
  if (k <= 0.001) return vec3(0);
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dd > 1e-6 ? dot(b.xz - ro.xz, dxz) / dd : 0.0;
  if (t <= 0.0 || t > depth + 0.01) return vec3(0);
  vec3 q = ro + rd * t - b;
  float hh = h * k * (0.9 + 0.2 * vnoise(vec2(uTime * 7.0 + seed, 1.0))) * (1.0 + 0.5 * flare);
  float y = q.y / hh;
  if (y < -0.4 || y > 1.5) return vec3(0);
  float sw = (vnoise(vec2(uTime * 1.7 + seed, 3.0)) - 0.5) * 0.5;
  vec2 rr = q.xz - normalize(vec2(-rd.z, rd.x) + 1e-5) * sw * hh * 0.25 * y * y;
  float x = length(rr) / (hh * 0.22);
  float yy = clamp(y, 0.0, 1.0);
  float prof = pow(yy, 0.5) * pow(1.0 - yy, 0.75) * 1.9 + 0.08;
  float body = smoothstep(1.0, 0.55, x / prof) * smoothstep(-0.15, 0.08, y) * smoothstep(1.15, 0.85, y);
  float core = smoothstep(0.55, 0.15, x / prof) * smoothstep(0.0, 0.2, y) * smoothstep(0.75, 0.35, y);
  float root = smoothstep(0.9, 0.3, x / prof) * smoothstep(0.25, 0.0, y) * smoothstep(-0.25, 0.0, y);
  vec3 c = vec3(1.0, 0.55, 0.22) * body * 6.0 + vec3(1.0, 0.88, 0.66) * core * 22.0 + vec3(0.15, 0.3, 1.0) * root * 1.5;
  return c * min(k, 1.2) * (1.0 + 1.5 * flare);
}

// far lamps of the church, out of focus: a few red and gold discs high in the dark behind
// and the gilding of the icons beyond, which wakes as more of the row burns (lit 0..1)
vec3 lampsBokeh(vec3 rd, float lit) {
  vec3 acc = vec3(0);
  for (int i = 0; i < 22; i++) {
    float fi = float(i);
    vec3 pos = vec3(-3.9 + 0.17 * fi + 0.5 * hash11(fi * 3.1), 0.1 + 1.5 * hash11(fi * 7.7), 8.0 + 4.0 * hash11(fi * 1.9));
    vec3 dir = normalize(pos - uCamPos);
    float ang = acos(clamp(dot(rd, dir), -1.0, 1.0));
    float coc = 0.012 + 0.008 * hash11(fi * 5.3);
    float disc = smoothstep(coc, coc * 0.9, ang);
    bool lamp = i < 5;
    vec3 tint = lamp ? vec3(0.9, 0.12, 0.06) : vec3(1.0, 0.68, 0.3);
    float k = lamp ? 0.06 : 0.05 * lit * lit * (0.4 + 0.6 * hash11(fi * 6.6));
    acc += tint * disc * k * (0.6 + 0.6 * hash11(fi * 2.3)) * (0.85 + 0.15 * vnoise(vec2(uTime * 2.0, fi * 9.0)));
  }
  return acc;
}

vec3 succession(vec2 fc) {
  vec3 ro; vec3 rd0 = camRay(fc, ro);
  // thin lens
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  vec3 rd = normalize(fp - ro);

  int id, which;
  float t = marchS(ro, rd, id, which);
  vec3 col = vec3(0.0); float depth = 50.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t, n = normS(p), v = -rd;
    depth = t;
    vec3 alb; float rough, metal = 0.0; vec3 emit = vec3(0);
    if (id == 1) {
      // brass, dark with age and wax, polished along the lip
      alb = vec3(0.62, 0.44, 0.2) * (0.6 + 0.4 * fbm(p.xz * vec2(30.0, 4.0), 3));
      rough = 0.28 + 0.2 * fbm(p.xz * 60.0, 2); metal = 1.0;
    } else if (id == 2) {
      // sand: grey-gold grains, wax spills here and there
      float g = hash12(floor(p.xz * 900.0));
      alb = vec3(0.42, 0.36, 0.27) * (0.7 + 0.5 * g) * (0.8 + 0.3 * fbm(p.xz * 25.0, 3));
      float spill = smoothstep(0.62, 0.7, fbm(p.xz * 18.0 + 3.0, 3));
      alb = mix(alb, vec3(0.75, 0.55, 0.25), spill * 0.7);
      rough = mix(0.95, 0.35, spill);
    } else {
      // beeswax: honey gold, soft, glowing through just under a burning flame
      vec3 tp = tTop(which);
      alb = vec3(0.8, 0.55, 0.2) * (0.9 + 0.1 * sin(p.y * 300.0 + float(which)));
      rough = 0.45;
      float below = tp.y - p.y;
      emit = vec3(1.0, 0.45, 0.12) * (0.6 * exp(-max(below, 0.0) / 0.012)) * (tLit(which) + 2.0 * tFlare(which)) * flick(which);
      if (below < 0.0) { alb = vec3(0.03); emit = vec3(1.0, 0.3, 0.05) * 1.5 * tLit(which) * smoothstep(0.0, 0.009, -below); }
    }
    vec3 spec;
    vec3 dif = lightAll(p, n, v, alb, rough, metal, spec);
    col = emit + dif + spec;
    // the wax glows a little through from the nearest flames (wrap)
    if (id == 3) { vec3 sp; col += lightAll(p, -n, v, alb, 1.0, 0.0, sp) * 0.25; }
    // brass reflects the row of flames
    if (id == 1) {
      vec3 rr = reflect(rd, n);
      vec3 acc = vec3(0);
      for (int i = 0; i < NT; i++) acc += flameAtS(p + n * 0.002, rr, flamePos(i) - vec3(0.0, 0.006, 0.0), 0.026, tLit(i), tFlare(i), float(i) * 7.1, 10.0);
      vec3 F = alb + (1.0 - alb) * pow(1.0 - sat(dot(n, v)), 5.0);
      col += acc * F * (1.0 - rough) * 0.8;
    }
    // the far end of the row falls away into the dark
    col *= exp(-max(p.z - 2.5, 0.0) * 0.12);
  } else {
    col = vec3(0.004, 0.003, 0.0025);
  }
  float lit = 0.0; for (int i = 0; i < NT; i++) lit += tLit(i);
  col += lampsBokeh(rd0, lit / float(NT)) * (t > 0.0 ? 0.0 : 1.0);
  // the flames and the glow they hang in the haze
  for (int i = 0; i < NT; i++) {
    float k = tLit(i);
    if (k <= 0.001) continue;
    vec3 c = flamePos(i);
    col += flameAtS(ro, rd, c - vec3(0.0, 0.006, 0.0), 0.026, k, tFlare(i), float(i) * 7.1, depth);
    vec3 oc = c - ro; float tc = dot(oc, rd); float h2 = max(dot(oc, oc) - tc * tc, 1e-6); float h = sqrt(h2);
    float g = (atan((min(depth, 50.0) - tc) / h) + atan(tc / h)) / h;
    col += vec3(1.0, 0.8, 0.62) * (tLit(i) + 2.5 * tFlare(i)) * g * 0.000015;
    // the soft glow a lens sees round a flame
    if (tc > 0.0 && tc < depth + 0.05) {
      vec3 gc = c + vec3(0.0, 0.008, 0.0); vec3 og = gc - ro; float tg = dot(og, rd); float hg = sqrt(max(dot(og, og) - tg * tg, 0.0));
      col += vec3(1.0, 0.66, 0.36) * (tLit(i) + 2.5 * tFlare(i)) * (0.45 * exp(-hg / 0.007) + 0.035 * exp(-hg / 0.035));
    }
  }
  // the bead of fire passing from one flame to the next wick, in the moment before it catches
  for (int i = 1; i < NT; i++) {
    float T = uIgn[i], d = min(0.2, (T - uIgn[i - 1]) * 0.75);
    float x = (uTime - (T - d)) / d;
    if (x < 0.0 || x > 1.0) continue;
    vec3 a = flamePos(i - 1) + vec3(0.0, 0.02, 0.0), b = tTop(i) + vec3(0.0, 0.008, 0.0);
    float e = x * x * (3.0 - 2.0 * x);
    vec3 sp = mix(a, b, e) + vec3(0.0, 0.03 * sin(PI * e), 0.0);
    vec3 oc = sp - ro; float tc = dot(oc, rd);
    if (tc > 0.0 && tc < depth) {
      float h2 = dot(oc, oc) - tc * tc;
      col += vec3(1.0, 0.6, 0.25) * (0.000002 / (0.0000008 + h2) + 0.00001 / (0.00003 + h2)) * (0.6 + 0.4 * x);
    }
  }
  return col;
}
`;
