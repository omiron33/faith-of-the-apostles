// The old road at dusk (scene 02). A Roman road of worn polygonal basalt, polished by centuries of
// feet, winds up a dry valley toward a monastery on a far hill: a church with a bell tower and a small
// dome, cypresses round it, one window lit. The sun has just gone behind the hills ahead; the road
// takes the afterglow like a ribbon, dry grass along both verges moves in the wind with its tips lit
// from behind. Units: metres, the camera near z = 0 looking +z. Everything a pure function of uTime.
const roadXJs = (z) => 7.0 * Math.sin(z * 0.03 - 0.5) + 9.0 * Math.sin(z * 0.0075 + 0.6) - 7.0 * Math.sin(-0.5) - 9.0 * Math.sin(0.6);
export const roadX = roadXJs;
export const MON_Z = 260;
export const MON = [roadXJs(MON_Z) + 17, MON_Z];

export const ROAD_UNIFORMS = {
  uDusk: 0.0,     // 0 afterglow .. 1 deeper dusk (stars come out)
  uWin: 1.0,      // the window's light
  uAperR: 0.0, uFocusR: 30.0,
};

export const ROAD_GLSL = /* glsl */ `
uniform float uDusk, uWin, uAperR, uFocusR;
const vec2 MONXZ = vec2(${MON[0].toFixed(3)}, ${MON[1].toFixed(3)});
vec3 MONP;
vec3 winPos() { vec2 w = rot(0.55) * vec2(1.2, -10.0); return MONP + vec3(w.x, 5.6, w.y); }
#define GLOW normalize(vec3(-0.22, 0.0, 1.0))
float sdCylY(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }

float roadX(float z) { return 7.0 * sin(z * 0.03 - 0.5) + 9.0 * sin(z * 0.0075 + 0.6) - 7.0 * sin(-0.5) - 9.0 * sin(0.6); }
float roadY(float z) { return 1.2 * sin(z * 0.013 + 0.5) + 0.02 * z; }

// ---------------- sky ----------------
vec3 skyCol(vec3 rd) {
  float y = rd.y;
  vec3 fl = normalize(vec3(rd.x, 0.0, rd.z));
  float s = sat(dot(fl, GLOW));
  float g = pow(s, 3.0), g2 = pow(s, 12.0);
  vec3 hor = mix(vec3(0.30, 0.20, 0.30), vec3(1.55, 0.62, 0.24), g);
  hor = mix(hor, vec3(2.3, 1.05, 0.38), g2);
  vec3 mid = mix(vec3(0.16, 0.16, 0.30), vec3(0.62, 0.42, 0.42), g);
  vec3 top = vec3(0.035, 0.06, 0.15);
  vec3 c = mix(hor, mid, smoothstep(-0.02, 0.10, y));
  c = mix(c, top, smoothstep(0.06, 0.55, y));
  c *= 1.0 - 0.45 * uDusk * smoothstep(0.0, 0.5, y);
  // long thin clouds, lit from below by the gone sun
  vec2 uv = rd.xz / (max(y, 0.0) + 0.05);
  float cl = fbm(uv * vec2(0.05, 0.22) + vec2(uTime * 0.006, 0.0), 5);
  float dens = smoothstep(0.5, 0.78, cl) * smoothstep(0.015, 0.08, y) * smoothstep(0.5, 0.12, y);
  vec3 cc = mix(vec3(0.20, 0.13, 0.20), vec3(1.9, 0.75, 0.42), g * smoothstep(0.32, 0.04, y));
  c = mix(c, cc, dens * 0.85);
  // high cirrus holding the last pink
  float ci = fbm(uv * vec2(0.012, 0.05) + vec2(-uTime * 0.002, 3.0), 5);
  float cd = smoothstep(0.5, 0.85, ci) * smoothstep(0.12, 0.3, y) * smoothstep(0.95, 0.4, y);
  c = mix(c, mix(vec3(0.5, 0.28, 0.36), vec3(1.2, 0.55, 0.4), g) * (1.0 - 0.5 * uDusk), cd * 0.6);
  // stars and the evening star
  if (y > 0.1) {
    vec3 q = rd * 260.0; vec3 id = floor(q);
    float h = hash13(id);
    float st = smoothstep(0.9965, 1.0, h) * smoothstep(0.12, 0.4, y) * (1.0 - dens);
    c += vec3(0.8, 0.85, 1.0) * st * (0.3 + 1.2 * uDusk) * smoothstep(0.45, 0.0, length(fract(q) - 0.5));
  }
  vec3 venus = normalize(vec3(-0.42, 0.16, 1.0));
  c += vec3(1.0, 0.95, 0.85) * pow(max(dot(rd, venus), 0.0), 60000.0) * 40.0;
  return c;
}
// the far ranges, flat silhouettes in the haze beyond the valley
vec3 farRanges(vec3 rd, vec3 c) {
  float az = atan(rd.x, rd.z);
  float r1 = 0.035 + 0.03 * fbm(vec2(az * 4.0, 2.0), 5) + 0.008 * fbm(vec2(az * 25.0, 5.0), 3);
  float r2 = 0.012 + 0.022 * fbm(vec2(az * 7.0 + 3.0, 7.0), 5) + 0.005 * fbm(vec2(az * 40.0, 1.0), 3);
  vec3 fl = normalize(vec3(rd.x, 0.0, rd.z));
  float s = pow(sat(dot(fl, GLOW)), 4.0);
  vec3 h1 = mix(vec3(0.16, 0.12, 0.2), vec3(0.85, 0.42, 0.26), s);
  vec3 h2 = mix(vec3(0.10, 0.08, 0.14), vec3(0.5, 0.26, 0.2), s);
  c = mix(c, h1, smoothstep(r1 + 0.0012, r1 - 0.0012, rd.y));
  c = mix(c, h2, smoothstep(r2 + 0.0012, r2 - 0.0012, rd.y));
  return c;
}
vec3 fogCol(vec3 rd) {
  vec3 fl = normalize(vec3(rd.x, 0.0, rd.z));
  float s = sat(dot(fl, GLOW));
  return mix(vec3(0.12, 0.10, 0.18), vec3(1.0, 0.48, 0.25), pow(s, 6.0)) * (1.0 - 0.3 * uDusk);
}

// ---------------- terrain ----------------
float terrain(vec2 p, int oct) {
  float dx = p.x - roadX(p.y);
  float ad = abs(dx);
  float valley = smoothstep(3.5, 90.0, ad);
  float n = fbm(p * 0.009 + vec2(3.1, 1.7), oct);
  float rr = 1.0 - abs(2.0 * fbm(p * 0.03 + vec2(7.0, 2.0), min(oct, 3)) - 1.0);
  float hills = (70.0 * n * n + 9.0 * rr * rr) * valley + 12.0 * valley * valley;
  float h = roadY(p.y) + hills;
  // the verge: soft unevenness off the road, a low bank
  h += smoothstep(2.3, 5.0, ad) * (0.25 + 0.6 * fbm(p * 0.25, 2));
  // the monastery hill
  vec2 d = p - MONXZ;
  h += 30.0 * exp(-dot(d, d) / (2.0 * 48.0 * 48.0));
  return h;
}
// the road's crown and its stones (shading only)
vec2 stoneCell;
float stoneH(vec2 ruv) {
  vec2 w = ruv * vec2(2.6, 2.3) + 0.12 * vec2(vnoise(ruv * 3.0), vnoise(ruv * 3.0 + 7.0));
  vec2 v = voronoiEdge(w);
  stoneCell = v;
  return sqrt(smoothstep(0.0, 0.25, v.x)) * (0.8 + 0.2 * hash12(vec2(v.y, 3.0))) + 0.15 * (vnoise(ruv * 6.0) - 0.5);
}

// ---------------- grass ----------------
float WINDT;
float grassAmt(vec2 p, float ad) {
  float verge = smoothstep(2.15, 2.7, ad);
  float patchy = smoothstep(0.3, 0.7, fbm(p * 0.5 + 9.0, 3));
  return verge * (0.2 + 0.8 * patchy);
}
vec2 windAt(vec2 p) {
  float g = 0.55 + 0.45 * sin(WINDT * 1.3 - p.y * 0.12 - p.x * 0.05 + 2.0 * fbm(p * 0.05 + vec2(0.0, -WINDT * 0.5), 2));
  float f = sin(WINDT * 4.1 + p.x * 1.7 + p.y * 1.1) * 0.25;
  return vec2(-0.55, 0.45) * (g + f);
}
// is p inside a blade? returns blade height fraction (0 = none)
float bladeLayer(vec3 p, float gy, float H, float sc, float a, float seed) {
  float h01 = (p.y - gy) / H;
  if (h01 <= 0.0 || h01 >= 1.0) return 0.0;
  vec2 w = windAt(p.xz) * h01 * h01 * 0.22 * H;
  vec2 q = rot(a) * (p.xz - w) / sc;
  vec2 c = floor(q), f = fract(q) - 0.5;
  vec2 hh = hash22(c + seed);
  float bh = 0.45 + 0.55 * hh.x;
  if (h01 > bh) return 0.0;
  vec2 o = (hh - 0.5) * 0.5;
  // blades lean a little in their own direction too
  o += (hash22(c + seed + 3.7) - 0.5) * 0.6 * (h01 / bh) * (h01 / bh);
  float wdt = 0.16 * (1.0 - pow(h01 / bh, 1.6)) + 0.02;
  return length(f - o) < wdt ? h01 / bh : 0.0;
}
float grassHit(vec3 p, float gy, float amt) {
  float H = 0.85 * amt * (0.35 + 0.65 * fbm(p.xz * 1.1, 2));
  if (p.y - gy > H) return 0.0;
  float b = bladeLayer(p, gy, H, 0.045, 0.3, 1.0);
  if (b == 0.0) b = bladeLayer(p, gy, H * 0.85, 0.038, 1.4, 7.0);
  return b;
}

// ---------------- the monastery ----------------
float monSD(vec3 p, out int part) {
  vec3 q = p - MONP;
  q.xz = rot(-0.55) * q.xz;
  part = 0;
  // the church: nave with a gabled roof
  vec3 n = q - vec3(0.0, 0.0, 0.0);
  float nave = sdBox(n - vec3(0.0, 2.5, 0.0), vec3(4.2, 6.0, 10.0));
  float roof = max(sdBox(n - vec3(0.0, 9.0, 0.0), vec3(4.6, 2.6, 10.3)), (abs(n.x) * 0.62 + (n.y - 11.4)));
  float d = min(nave, roof);
  // the bell tower at the west end
  vec3 tq = q - vec3(-2.6, 0.0, -11.5);
  float tw = sdBox(tq - vec3(0.0, 6.0, 0.0), vec3(2.1, 10.0, 2.1));
  vec3 bq = tq - vec3(0.0, 14.0, 0.0);
  tw = max(tw, -sdBox(vec3(abs(bq.x), bq.y, abs(bq.z)) - vec3(0.0, 0.0, 0.0), vec3(0.8, 1.3, 3.0)));
  tw = max(tw, -sdBox(vec3(abs(bq.x), bq.y, abs(bq.z)), vec3(3.0, 1.3, 0.8)));
  float pyr = max(sdBox(tq - vec3(0.0, 17.5, 0.0), vec3(2.3, 1.6, 2.3)), (max(abs(tq.x), abs(tq.z)) * 1.4 + (tq.y - 19.8)));
  tw = min(tw, pyr);
  tw = min(tw, sdBox(tq - vec3(0.0, 20.4, 0.0), vec3(0.06, 0.8, 0.06)));
  tw = min(tw, sdBox(tq - vec3(0.0, 20.6, 0.0), vec3(0.4, 0.06, 0.06)));
  if (tw < d) { d = tw; part = 1; }
  // the dome over the crossing
  vec3 dq = q - vec3(0.0, 0.0, 4.0);
  float drum = sdCylY(dq - vec3(0.0, 12.2, 0.0), 2.9, 1.6);
  float dome = max(length(dq - vec3(0.0, 13.6, 0.0)) - 3.0, 13.6 - dq.y);
  float dd = min(min(drum, dome), sdBox(dq - vec3(0.0, 17.2, 0.0), vec3(0.06, 0.7, 0.06)));
  if (dd < d) { d = dd; part = 2; }
  // the range of cells and the enclosure wall
  float cells = sdBox(q - vec3(10.0, -2.0, 2.0), vec3(5.0, 7.5, 12.0));
  cells = min(cells, max(sdBox(q - vec3(10.0, 6.0, 2.0), vec3(5.4, 1.6, 12.3)), abs(q.x - 10.0) * 0.5 + q.y - 7.2));
  if (cells < d) { d = cells; part = 3; }
  // cypresses
  float cy = 1e3;
  for (int i = 0; i < 5; i++) {
    vec2 o = vec2(16.0 + 2.6 * float(i) + 1.2 * sin(float(i) * 3.1), -14.0 + 6.0 * float(i) + 2.0 * hash11(float(i) + 0.3));
    if (i == 4) o = vec2(-9.5, 9.0);
    float ht = 12.0 + 6.0 * hash11(float(i) * 1.7);
    vec3 cq = q - vec3(o.x, -1.0, o.y);
    float yy = sat(cq.y / ht);
    float r = 1.7 * sqrt(max(0.0, yy * (1.0 - yy))) * (1.0 - 0.55 * yy) + 0.1 * (vnoise(cq * 1.8) - 0.5);
    cy = min(cy, max(length(cq.xz) - r, abs(cq.y - ht * 0.5) - ht * 0.5) * 0.7);
  }
  if (cy < d) { d = cy; part = 4; }
  return d;
}

// ---------------- march ----------------
// returns t; kind: 0 ground, 1 grass, 2 monastery, -1 sky
float marchRoad(vec3 ro, vec3 rd, out int kind, out float gb, out int part) {
  float t = 0.05; kind = -1; gb = 0.0; part = 0;
  for (int i = 0; i < 240; i++) {
    vec3 p = ro + rd * t;
    float gy = terrain(p.xz, t < 60.0 ? 4 : 3);
    float h = p.y - gy;
    float dm = 1e3;
    vec2 dmn = p.xz - MONXZ;
    if (dot(dmn, dmn) < 45.0 * 45.0) { int pp; dm = monSD(p, pp); if (dm < 0.0006 * t) { kind = 2; part = pp; return t; } }
    if (h < 0.0015 * t) { kind = 0; return t; }
    float st = 0.45 * h;
    if (t < 18.0 && h < 0.85) {
      float ad = abs(p.x - roadX(p.z));
      float amt = grassAmt(p.xz, ad);
      if (amt > 0.02) {
        float b = grassHit(p, gy, amt);
        if (b > 0.0) { kind = 1; gb = b; return t; }
        st = min(st, 0.012 + 0.007 * t);
      }
    }
    st = min(st, dm);
    t += max(st, 0.0022 * t + 0.003);
    if (t > 900.0 || (p.y > 72.0 && rd.y > 0.0)) return -1.0;
  }
  kind = 0; return t;
}

vec3 roadScene(vec3 ro, vec3 rd) {
  WINDT = uTime;
  MONP = vec3(MONXZ.x, terrain(MONXZ, 6) - 0.3, MONXZ.y);
  int kind, part; float gb;
  float t = marchRoad(ro, rd, kind, gb, part);
  vec3 sky = farRanges(rd, skyCol(rd));
  if (kind < 0) {
    // the window's glow in the air
    vec3 wp = winPos();
    float a = acos(clamp(dot(rd, normalize(wp - ro)), -1.0, 1.0));
    return sky + vec3(1.0, 0.55, 0.22) * uWin * exp(-a * 260.0) * 0.6;
  }
  vec3 p = ro + rd * t;
  vec3 fl = normalize(vec3(rd.x, 0.0, rd.z));
  vec3 col;
  // the sky's light on a surface with normal n: deep blue from above, the afterglow from ahead
  #define SKYLIGHT(n) (vec3(0.07, 0.09, 0.17) * (0.55 + 0.45 * (n).y) * (1.0 - 0.4 * uDusk) + vec3(1.1, 0.5, 0.22) * pow(sat(dot((n), GLOW) * 0.8 + 0.2), 2.0) * 0.4 * (1.0 - 0.45 * uDusk))
  if (kind == 2) {
    vec2 e = vec2(0.01, 0.0); int pp;
    vec3 n = normalize(vec3(monSD(p + e.xyy, pp) - monSD(p - e.xyy, pp), monSD(p + e.yxy, pp) - monSD(p - e.yxy, pp), monSD(p + e.yyx, pp) - monSD(p - e.yyx, pp)));
    vec3 alb = part == 4 ? vec3(0.03, 0.045, 0.03) : vec3(0.42, 0.36, 0.3) * (0.8 + 0.2 * vnoise(p.xy * 2.0));
    col = alb * SKYLIGHT(n) * 0.9;
    // the one lit window, in the west front of the nave, facing us
    vec3 q = p - MONP; q.xz = rot(-0.55) * q.xz;
    if (part == 0 && q.z < -9.8) {
      vec2 w = vec2(q.x - 1.2, q.y - 5.2);
      float arch = max(abs(w.x) - 0.55, w.y > 0.6 ? length(vec2(w.x, w.y - 0.6)) - 0.55 : abs(w.y + 0.3) - 0.9);
      float lit = smoothstep(0.05, -0.05, arch);
      float bars = 1.0 - 0.7 * smoothstep(0.05, 0.0, abs(w.x)) * lit;
      col = mix(col, vec3(9.0, 4.6, 1.6) * uWin * bars * (0.85 + 0.15 * sin(uTime * 7.0) * sin(uTime * 3.3)), lit);
      col += vec3(1.0, 0.5, 0.18) * uWin * 0.08 * exp(-length(w) * 1.5);
    }
  } else if (kind == 1) {
    // dry grass: straw, darker at its roots, lit through from the afterglow behind
    float hv = hash12(floor(p.xz * 22.0));
    vec3 alb = mix(vec3(0.36, 0.28, 0.15), vec3(0.52, 0.42, 0.24), hv);
    alb = mix(alb, vec3(0.2, 0.2, 0.1), 0.35 * fbm(p.xz * 0.5, 2));
    float ao = 0.25 + 0.75 * gb;
    col = alb * vec3(0.07, 0.08, 0.13) * ao * 1.3;
    float back = pow(sat(dot(rd, GLOW) * 0.5 + 0.5), 5.0);
    col += alb * vec3(1.5, 0.7, 0.3) * back * pow(gb, 3.0) * 1.5;
    col += vec3(1.0, 0.55, 0.28) * pow(sat(dot(fl, GLOW)), 10.0) * pow(gb, 3.0) * 0.5;
  } else {
    float dx = p.x - roadX(p.z);
    float ad = abs(dx);
    float e = max(0.02, 0.002 * t);
    float h0 = terrain(p.xz, 7);
    vec3 n = normalize(vec3(h0 - terrain(p.xz + vec2(e, 0.0), 7), e, h0 - terrain(p.xz + vec2(0.0, e), 7)));
    float onRoad = smoothstep(2.25, 2.0, ad);
    vec3 alb = mix(vec3(0.2, 0.16, 0.11), vec3(0.3, 0.25, 0.16), fbm(p.xz * 0.8, 3));
    // distant grass on the hills: straw-coloured, streaky
    float gr = smoothstep(2.3, 3.0, ad);
    alb = mix(alb, mix(vec3(0.3, 0.24, 0.13), vec3(0.42, 0.34, 0.2), vnoise(p.xz * vec2(3.0, 0.6))), gr * 0.8);
    alb = mix(alb, vec3(0.08, 0.09, 0.05), smoothstep(0.55, 0.8, fbm(p.xz * 0.05, 3)) * gr * 0.7);  // scrub
    vec2 bv = voronoiEdge(p.xz * 0.35);
    float bush = smoothstep(0.22, 0.1, length(fract(p.xz * 0.35) - hash22(floor(p.xz * 0.35)))) * step(0.8, hash12(floor(p.xz * 0.35) + 4.0));
    alb = mix(alb, vec3(0.03, 0.035, 0.02), bush * gr * smoothstep(20.0, 60.0, t));
    float rock = smoothstep(0.62, 0.72, fbm(p.xz * 0.08 + 4.0, 4)) * gr;
    alb = mix(alb, vec3(0.32, 0.28, 0.24), rock * 0.7);
    float spec = 0.0; float rough = 0.9;
    if (onRoad > 0.0 && t < 140.0) {
      vec2 ruv = vec2(dx, p.z);
      float s0 = stoneH(ruv); vec2 cell = stoneCell;
      float es = 0.012 + 0.0015 * t;
      float sx = stoneH(ruv + vec2(es, 0.0)), sz = stoneH(ruv + vec2(0.0, es));
      float k = 0.012 * smoothstep(40.0, 4.0, t) + 0.002;
      vec3 sn = normalize(vec3((s0 - sx) / es * k, 1.0, (s0 - sz) / es * k));
      // the camber of the road
      sn = normalize(sn + vec3(-dx * 0.03, 0.0, 0.0));
      float gap = 1.0 - smoothstep(0.0, 0.035, cell.x);
      vec3 stone = mix(vec3(0.09, 0.085, 0.08), vec3(0.2, 0.18, 0.16), hash12(vec2(cell.y, 1.0)));
      stone *= 0.75 + 0.25 * fbm(ruv * 9.0, 3);
      stone = mix(stone, vec3(0.38, 0.36, 0.26), smoothstep(0.62, 0.8, fbm(ruv * 4.0 + cell.y * 9.0, 3)) * 0.5);  // lichen
      vec3 dirt = vec3(0.05, 0.04, 0.028);
      vec3 ra = mix(stone, dirt, gap);
      // the kerb stones, larger and paler
      float kerb = smoothstep(1.75, 1.95, ad) * onRoad;
      ra = mix(ra, ra * 1.25, kerb);
      alb = mix(alb, ra, onRoad);
      n = normalize(mix(n, sn, onRoad));
      // worn smooth on top: the polish that catches the sky; a little rougher toward the kerbs
      rough = mix(rough, mix(0.22, 0.45, smoothstep(0.6, 1.8, ad)) + 0.4 * gap, onRoad);
      spec = onRoad * (1.0 - gap);
    }
    col = alb * SKYLIGHT(n);
    if (spec > 0.0) {
      vec3 r = reflect(rd, n);
      float fr = 0.04 + 0.96 * pow(1.0 - sat(dot(n, -rd)), 5.0);
      vec3 rs = skyCol(normalize(vec3(r.x, max(r.y, 0.0) + rough * rough * 0.1, r.z)));
      fr = min(fr, 0.35);
      col += rs * fr * spec * (1.0 - rough * 0.7) * 0.9 * (0.6 + 0.4 * vnoise(p.xz * 3.0)) * smoothstep(160.0, 40.0, t);
    }
    // the window's faint light on its own hill
  }
  // air: layered haze, warm toward the glow
  float fogK = (1.0 - exp(-t * 0.0024)) * mix(1.0, 0.6, sat((p.y - ro.y) / 40.0));
  col = mix(col, fogCol(rd), fogK * 0.9);
  // the window's glow in the air
  if (t > 150.0) {
    vec3 wp = winPos();
    float a = acos(clamp(dot(rd, normalize(wp - ro)), -1.0, 1.0));
    col += vec3(1.0, 0.55, 0.22) * uWin * exp(-a * 260.0) * 0.6;
  }
  return col;
}
vec3 roadLens(vec2 fc, out vec3 ro) {
  vec3 rd = camRay(fc, ro);
  if (uAperR <= 0.0) return rd;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd * (uFocusR / dot(rd, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAperR;
  return normalize(fp - ro);
}
`;
