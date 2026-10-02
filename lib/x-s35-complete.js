// s35's world: a clay cup made whole. A small earthenware tea bowl stands on an old waxed oak table,
// close; a beeswax candle burns just in front of it to the left and a few more glow far behind, out of
// focus. The cup was broken: its cracks run dark through the clay, and then molten gold runs into
// them from the lip down (kintsugi) and the mended seams catch the flame. uFill 0..1 is how far the
// gold has run; uGleam the light that runs through the whole mended cup on "complete".
// (Reworked from lib/_old/x-s35.js, which was never rendered: the candle sat behind the cup.)
// Everything is a pure function of uTime.
export const KINTSUGI_UNIFORMS = {
  uFill: 0.0, uGleam: 0.0, uFocus: 0.36, uAper: 0.0025, uCupRot: 0.0,
};

export const KINTSUGI_GLSL = /* glsl */ `
uniform float uFill, uGleam, uFocus, uAper, uCupRot;

const float CH = 0.072;                      // the cup's height
const vec3 CANDLE = vec3(0.12, 0.0, -0.06);   // the candle (base on the table), in front and to the left
const float CTOP = 0.115;                    // the candle's height
const float CR = 0.017;                      // the candle's radius

float sdCylY(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }

// the bowl's outer radius at height y: a foot, a rounded belly, a lip that turns up a little
float cupR(float y) {
  float u = clamp(y / CH, 0.0, 1.0);
  return 0.03 + 0.026 * sqrt(u) - 0.004 * u * u + 0.0015 * sin(u * 9.0) * u;
}
// the cup surface's own coordinates: around (metres of arc) and up
vec2 cupUV(vec3 p) {
  float a = atan(p.z, p.x) + uCupRot;
  return vec2(a * 0.05, p.y);
}
// the cracks: a few long wandering breaks (voronoi borders of large cells, warped)
float crackDist(vec2 uv) {
  vec2 w = uv * vec2(26.0, 30.0);
  w += vec2(fbm(uv * 70.0, 3), fbm(uv * 70.0 + 7.0, 3)) * 0.6;
  vec2 v = voronoiEdge(w);
  return v.x / 27.0;   // metres from the nearest break
}
// when the gold reaches this point (0 first, 1 last): it pours in at the lip and runs down
float fillOrder(vec2 uv) { return clamp(1.0 - uv.y / CH, 0.0, 1.0) * 0.82 + 0.18 * fbm(uv * 90.0, 2); }
float filledAt(vec2 uv) { float fo = fillOrder(uv); return smoothstep(fo - 0.005, fo + 0.02, uFill * 1.04); }

float cupSD(vec3 p, out float crack) {
  crack = 1.0;
  vec3 q = p;
  float bnd = sdCylY(q - vec3(0, CH * 0.5, 0), 0.064, CH * 0.5 + 0.008);
  if (bnd > 0.006) return bnd;
  float r = length(q.xz);
  float y = q.y;
  float outer = (r - cupR(y)) * 0.85;
  float inner = (r - cupR(y) + 0.0042) * 0.85;
  float d = max(outer, y - CH);
  d = max(d, -max(inner, 0.009 - y));     // hollow, with a thick floor
  d = max(d, -y + 0.004);
  // the foot ring
  float foot = max(abs(r - 0.024) - 0.0035, abs(y - 0.002) - 0.0025);
  d = min(d, foot);
  d = smax(d, y - CH, 0.002);
  // the breaks: open grooves that close as the gold fills them, then stand a hair proud
  vec2 uv = cupUV(q);
  float cd = crackDist(uv);
  crack = cd;
  float m = smoothstep(0.0013, 0.0, cd);
  d += m * mix(0.0009, -0.00045, filledAt(uv));
  return d;
}

float candleSD(vec3 p) {
  vec3 q = p - CANDLE;
  float body = sdCylY(q - vec3(0, CTOP * 0.5, 0), CR, CTOP * 0.5) - 0.0015;
  body = max(body, -(length(q - vec3(0, CTOP + 0.011, 0)) - 0.0135));
  // a drip down the side
  body = smin(body, sdCapsule(q, vec3(-0.012, CTOP - 0.004, -0.011), vec3(-0.0125, CTOP - 0.03, -0.0118), 0.0028), 0.003);
  float wick = sdCapsule(q, vec3(0, CTOP - 0.004, 0), vec3(0.0005, CTOP + 0.008, 0), 0.0007);
  return min(body, wick);
}
float mapK(vec3 p, out int id, out float crack) {
  float d = p.y; id = 0; crack = 1.0;
  float cr; float c = cupSD(p, cr);
  if (c < d) { d = c; id = 1; crack = cr; }
  float cn = candleSD(p);
  if (cn < d) { d = cn; id = 2; }
  return d;
}
vec3 normK(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0001;
  int i; float c;
  return normalize(e.xyy * mapK(p + e.xyy, i, c) + e.yyx * mapK(p + e.yyx, i, c) + e.yxy * mapK(p + e.yxy, i, c) + e.xxx * mapK(p + e.xxx, i, c));
}
float marchK(vec3 ro, vec3 rd, out int id, out float crack) {
  float t = 0.0;
  for (int i = 0; i < 160; i++) {
    float d = mapK(ro + rd * t, id, crack);
    if (abs(d) < 0.00003 + 0.00015 * t) return t;
    t += d * 0.85;
    if (t > 4.0) break;
  }
  id = -1; return -1.0;
}
float shadowK(vec3 ro, vec3 rd, float tmax) {
  float res = 1.0, t = 0.002; int id; float c;
  for (int i = 0; i < 40; i++) {
    float h = cupSD(ro + rd * t, c);   // the candle itself casts no shadow ring (its flame stands clear)
    res = min(res, 14.0 * h / t);
    t += clamp(h, 0.0015, 0.02);
    if (res < 0.003 || t > tmax) break;
  }
  return sat(res);
}

vec3 flameLightPos() { return CANDLE + vec3(0.0, CTOP + 0.024, 0.0); }
float flick() { return 0.9 + 0.1 * vnoise(vec2(uTime * 7.0, 2.0)) + 0.04 * sin(uTime * 13.0); }

// the room behind: near-black warm dark, a breath of warmth where the far candles are
vec3 backdrop(vec3 rd) {
  vec3 c = mix(vec3(0.006, 0.0035, 0.002), vec3(0.018, 0.010, 0.005), smoothstep(-0.1, 0.3, rd.y));
  c += vec3(0.04, 0.018, 0.007) * exp(-pow(length(rd.xy - vec2(-0.2, 0.1)), 2.0) * 8.0);
  return c;
}
vec3 envK(vec3 r) {
  vec3 c = backdrop(r) * 2.0 + vec3(0.05, 0.028, 0.012) * (0.5 + 0.5 * r.y);
  vec3 L = normalize(flameLightPos() - vec3(0.0, 0.04, 0.0));
  c += vec3(1.0, 0.62, 0.28) * 9.0 * pow(sat(dot(r, L)), 90.0) * flick();
  c += vec3(1.0, 0.55, 0.22) * 0.5 * pow(sat(dot(r, L)), 6.0);
  // the far candles as a warm band behind
  c += vec3(1.0, 0.6, 0.3) * 0.25 * pow(sat(dot(r, normalize(vec3(0.3, 0.25, 1.0)))), 8.0);
  return c;
}

// glow of molten gold by its age (0 = just arrived)
vec3 shadeK(vec3 p, vec3 n, vec3 rd, int id, float crack) {
  vec3 v = -rd;
  vec3 alb; float rough; float metal = 0.0; vec3 emit = vec3(0); float sss = 0.0;
  if (id == 0) {
    // old oak: long grain running across the frame, darker rings, worn and waxed
    float grain = fbm(vec2(p.x * 160.0 + fbm(p.xz * 9.0, 3) * 3.0, p.z * 5.0), 4);
    float ring = smoothstep(0.45, 0.9, fbm(vec2(p.x * 40.0 + p.z * 3.0, p.z * 2.0), 3));
    alb = mix(vec3(0.17, 0.11, 0.065), vec3(0.36, 0.25, 0.15), grain);
    alb *= 1.0 - 0.3 * ring;
    alb *= 0.85 + 0.25 * fbm(p.xz * 40.0, 3);
    rough = 0.55 + 0.25 * grain;
  } else if (id == 2) {
    // beeswax: honey, glowing through near the flame
    alb = vec3(0.82, 0.55, 0.22); rough = 0.45; sss = 1.0;
    float h = CANDLE.y + CTOP - p.y;
    emit = vec3(1.0, 0.5, 0.15) * (0.9 * exp(-max(h, 0.0) / 0.018) + 0.05) * flick();
    if (length(p.xz - CANDLE.xz) < 0.002 && p.y > CANDLE.y + CTOP - 0.005) { alb = vec3(0.02); emit = vec3(1.0, 0.35, 0.08) * 2.0 * smoothstep(CTOP, CTOP + 0.008, p.y - CANDLE.y); }
  } else {
    vec2 uv = cupUV(p);
    float r = length(p.xz);
    bool inside = r < cupR(p.y) - 0.0021 && p.y > 0.006 && p.y < CH - 0.0005;
    // earthenware: warm red-brown clay, a thin iron-brown glaze that breaks paler over the rims,
    // throwing rings round the body
    float rings = 0.5 + 0.5 * sin(p.y * 900.0 + fbm(uv * 40.0, 2) * 4.0);
    float lip = smoothstep(CH - 0.006, CH, p.y);
    alb = mix(vec3(0.34, 0.14, 0.07), vec3(0.48, 0.22, 0.11), fbm(uv * 150.0, 4));
    alb *= 0.9 + 0.12 * rings;
    alb = mix(alb, vec3(0.62, 0.42, 0.28), lip * 0.55);
    if (inside) alb = vec3(0.12, 0.05, 0.03);
    rough = 0.38 + 0.15 * fbm(uv * 300.0, 2);
    // the cracks: dark while open, then gold
    float m = smoothstep(0.00125, 0.00035, crack);
    float f = filledAt(uv);
    alb = mix(alb, vec3(0.012, 0.006, 0.004), m * (1.0 - f));
    if (m * f > 0.01) {
      float k = m * f;
      alb = mix(alb, vec3(1.0, 0.77, 0.36), k);
      metal = k; rough = mix(rough, 0.18, k);
      // molten at the running front, cooling behind it; the whole seam lights on the gleam
      float fo = fillOrder(uv);
      float age = uFill * 1.04 - fo;
      float molten = exp(-max(age, 0.0) * 9.0) * step(uFill, 0.995);
      float sweep = exp(-pow((p.y / CH) - (uGleam * 2.4 - 0.7), 2.0) * 10.0) * step(0.001, uGleam) * step(uGleam, 0.999);
      emit += vec3(1.0, 0.55, 0.18) * k * (1.2 * molten + 0.22 * uGleam + 0.9 * sweep);
    }
  }
  vec3 f0 = mix(vec3(0.04), alb, metal);
  vec3 col = emit;
  // the candle
  vec3 lp = flameLightPos();
  vec3 L = lp - p; float d2 = dot(L, L); float dl = sqrt(d2); L /= dl;
  float ndl = dot(n, L);
  float nl = sat(ndl);
  vec3 lc = vec3(1.0, 0.6, 0.3) * 0.24 * flick() / (0.0006 + d2);
  if (nl > 0.0) {
    vec3 h = normalize(L + v);
    float a = max(0.02, rough * rough);
    float nh = sat(dot(n, h));
    float a2 = a * a; float dd = nh * nh * (a2 - 1.0) + 1.0;
    float D = a2 / (PI * dd * dd);
    vec3 F = f0 + (1.0 - f0) * pow(1.0 - sat(dot(v, h)), 5.0);
    float sh = id == 2 ? 1.0 : shadowK(p + n * 0.0006, L, dl - 0.012);
    col += (alb * (1.0 - metal) / PI + F * D * 0.25) * lc * nl * sh;
  }
  if (sss > 0.0) col += alb * lc * 0.08 * sat(0.5 - 0.5 * ndl);
  // a warm rim from the far candles behind and to the right
  vec3 S = normalize(vec3(0.5, 0.35, 0.8));
  float rim = pow(1.0 - sat(dot(n, v)), 3.0) * sat(dot(n, S) * 0.7 + 0.3);
  col += (alb * (1.0 - metal) + f0) * vec3(1.0, 0.62, 0.32) * 0.35 * rim;
  col += alb * (1.0 - metal) * vec3(0.03, 0.02, 0.014) * (0.5 + 0.5 * n.y);
  // a faint fill from the far candles behind and to the right, so the shadow side keeps its form
  vec3 FL = normalize(vec3(-0.75, 0.45, -0.45));
  col += (alb * (1.0 - metal) / PI) * vec3(0.85, 0.6, 0.42) * 0.45 * sat(dot(n, FL));
  {
    vec3 hf = normalize(FL + v); float af = max(0.04, rough * rough); float nhf = sat(dot(n, hf));
    float df = nhf * nhf * (af * af - 1.0) + 1.0;
    col += f0 * vec3(0.85, 0.6, 0.42) * 0.6 * sat(dot(n, FL)) * af * af / (PI * df * df) * 0.25;
  }
  // reflections of the room
  vec3 r = reflect(rd, n);
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - sat(dot(n, v)), 5.0);
  col += envK(r) * F * (1.0 - rough * 0.75) * (id == 0 ? 0.35 : 1.0);
  return col;
}

// the candle's flame, drawn where the ray passes its axis
vec3 flameK(vec3 ro, vec3 rd, float depth) {
  vec3 b = CANDLE + vec3(0.0, CTOP + 0.003, 0.0);
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dot(b.xz - ro.xz, dxz) / dd;
  if (t <= 0.0 || t > depth + 0.01) return vec3(0);
  vec3 q = ro + rd * t - b;
  float hh = 0.042 * flick();
  float y = q.y / hh;
  float sw = (vnoise(vec2(uTime * 1.4, 3.0)) - 0.5) * 0.4 + 0.06 * sin(uTime * 10.0);
  vec2 rr = q.xz - normalize(vec2(-rd.z, rd.x) + 1e-5) * sw * hh * 0.25 * y * y;
  float x = length(rr) / (hh * 0.21);
  float yy = clamp(y, 0.0, 1.0);
  float prof = pow(yy, 0.5) * pow(1.0 - yy, 0.75) * 1.9 + 0.08;
  float inb = step(-0.3, y) * step(y, 1.4);
  float body = smoothstep(1.0, 0.55, x / prof) * smoothstep(-0.15, 0.08, y) * smoothstep(1.15, 0.85, y) * inb;
  float core = smoothstep(0.55, 0.15, x / prof) * smoothstep(0.0, 0.2, y) * smoothstep(0.75, 0.35, y) * inb;
  float root = smoothstep(0.9, 0.3, x / prof) * smoothstep(0.25, 0.0, y) * smoothstep(-0.25, 0.0, y) * inb;
  vec3 c = vec3(1.0, 0.42, 0.1) * body * 7.0 + vec3(1.0, 0.86, 0.6) * core * 22.0 + vec3(0.15, 0.3, 1.0) * root * 2.0;
  float r = length(vec2(length(q.xz), q.y - hh * 0.45));
  c += vec3(1.0, 0.5, 0.16) * (0.3 * exp(-r / (hh * 0.9)) + 0.03 * exp(-r / 0.1));
  return c;
}

// far candles, out of focus: soft discs with a brighter rim, drawn from the pinhole ray
vec3 bokehK(vec3 rd, float depth) {
  if (depth < 1.0) return vec3(0);
  vec3 acc = vec3(0);
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float z = 1.6 + 3.0 * hash11(fi * 1.9);
    vec3 pos = vec3(-2.2 + 0.4 * fi + 0.3 * hash11(fi * 3.1), 0.0 + 0.12 * z * hash11(fi * 7.7), z);
    vec3 dir = normalize(pos - uCamPos);
    float ang = acos(clamp(dot(rd, dir), -1.0, 1.0));
    float coc = 0.008 + 0.006 * z;
    float disc = smoothstep(coc, coc * 0.93, ang) * (0.8 + 0.35 * smoothstep(coc * 0.6, coc, ang));
    float fl = 0.85 + 0.15 * vnoise(vec2(uTime * 3.0, fi * 9.0));
    acc += vec3(1.0, 0.52, 0.2) * disc * (0.05 + 0.2 * pow(hash11(fi * 2.3), 2.0)) * fl;
  }
  return acc;
}

vec3 kintsugi(vec2 fc) {
  vec3 ro; vec3 rd0 = camRay(fc, ro);
  vec3 rd = rd0;
  // thin lens
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd * (uFocus / dot(rd, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float rr = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * rr * uAper;
  rd = normalize(fp - ro);
  int id; float crack;
  float t = marchK(ro, rd, id, crack);
  vec3 col; float depth = 10.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t;
    vec3 n = normK(p);
    col = shadeK(p, n, rd, id, crack);
    depth = t;
    if (id == 0) col = mix(col, backdrop(rd), smoothstep(0.35, 1.2, length(p.xz)));
  } else col = backdrop(rd);
  col += bokehK(rd0, depth);
  col += flameK(ro, rd, depth);
  // a breath of haze lit by the flame
  vec3 lp = flameLightPos();
  vec3 q = lp - ro; float tq = clamp(dot(q, rd), 0.0, depth);
  float dd = length(q - rd * tq);
  col += vec3(1.0, 0.5, 0.2) * 0.00002 / (0.00005 + dd * dd);
  return col;
}
`;
