// The Gothic cathedral in darkness: a long nave of clustered piers and pointed arcades under a
// ribbed vault, lancet windows letting in cold moonlight that hangs in the haze in long shafts,
// worn stone floor, a bank of votive candles the only warm light. Nave along +z, floor y = 0.
// Everything is a pure function of uTime.
export const GOTHIC_UNIFORMS = {
  uMoonDir: [-0.42, -0.82, 0.38],   // moonlight travelling into the nave (through the left clerestory)
  uMoonCol: [4.6, 5.4, 7.2],
  uGlass: [0.35, 0.48, 0.8],         // the windows' own glow
  uHaze: 0.05, uHazeCol: [0.012, 0.016, 0.026],
  uAmb: [0.16, 0.18, 0.25],
  uExpo: 1.0,
  uVotive: [1.6, 0.0, 10.0],         // the votive stand (centre of its front edge)
  uVotiveOn: 1.0,
  uP1: [0, -100, 0], uP1c: [0, 0, 0],
  uFocusG: 6.0, uAperG: 0.0,
  uFlashG: 0.0,                      // lightning outside the windows
  uEndZ: 62.0,                       // the end wall with its great window
};

export const GOTHIC_GLSL = /* glsl */ `
uniform float uEndZ, uHaze, uExpo, uVotiveOn, uFocusG, uAperG, uFlashG;
uniform vec3 uMoonDir, uMoonCol, uGlass, uHazeCol, uAmb, uVotive, uP1, uP1c;

struct Mat { vec3 alb; float rough; float metal; vec3 emit; };
Mat M(vec3 a, float r, float m) { Mat x; x.alb = a; x.rough = r; x.metal = m; x.emit = vec3(0); return x; }
#ifdef G_EXTRA
float extraObj(vec3 p, out int id);
Mat extraMat(int id, vec3 p, vec3 n);
#endif
float sdCyl(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }

const float GW = 4.6;     // nave half width (pier centres)
const float GB = 5.0;     // bay length
const float GS = 13.0;    // vault springing
const float GT = 0.7;     // arcade wall thickness
const float GA = 4.4;     // aisle width

// pointed arch: is (u = distance from the arch's axis, v = height above its springing) under an arch
// of half span a and radius r?  returns signed distance (negative inside the opening)
float pointed(float u, float v, float a, float r) {
  if (v < 0.0) return abs(u) - a;
  float c = r - a;                      // the arcs' centres sit at -c and +c
  return length(vec2(abs(u) + c, v)) - r;
}
// the nave vault's height above the floor at x
float vaultY(float x) { float r = GW * 1.55; float c = r - GW; return GS + sqrt(max(r * r - (abs(x) + c) * (abs(x) + c), 0.0)); }

// lancet window in a wall: local (u across, v up from its sill), half width a, sill-to-spring h
float lancet(float u, float v, float a, float h) { return v < h ? max(abs(u) - a, -v) : pointed(u, v - h, a, a * 1.7); }

float airSD(vec3 p) {
  float x = abs(p.x);
  float zz = mod(p.z, GB) - GB * 0.5;
  // the nave
  float nave = max(max(x - GW + GT * 0.5, -p.y), p.y - vaultY(x));
  // the aisles (lower, flat-topped for simplicity, lost in shadow)
  float aisle = max(max(abs(x - GW - GA * 0.5) - GA * 0.5 + 0.2, -p.y), p.y - 8.5);
  // arcade openings through the wall between piers
  float arc = max(pointed(zz, p.y - 6.2, GB * 0.5 - 0.75, (GB * 0.5 - 0.75) * 1.6), abs(x - GW) - GT);
  // clerestory windows (recesses in the nave wall above the arcade, glass at their back)
  float cl = max(lancet(zz, p.y - 15.0 + 4.6, 0.75, 2.6), abs(x - GW - 0.05) - GT * 0.5 - 0.2);
  // aisle windows in the outer wall
  float aw = max(lancet(zz, p.y - 2.4, 0.8, 3.0), abs(x - GW - GA) - 0.35);
  float air = min(min(nave, aisle), min(min(arc, cl), aw));
  air = max(air, p.z - uEndZ);
  // the great window in the end wall: a tall lancet with a rose above it
  float gw = max(lancet(p.x, p.y - 3.0, 2.6, 8.0), abs(p.z - uEndZ - 0.4) - 0.45);
  return min(air, gw);
}
// a clustered pier: a core with eight shafts, a moulded base and a foliage capital ring
float pier(vec3 p) {
  float x = abs(p.x);
  float k = floor(p.z / GB + 0.5);
  vec3 q = vec3(x - GW, p.y, p.z - k * GB);
  if (length(q.xz) > 1.4) return length(q.xz) - 1.2;
  float core = length(q.xz) - 0.55;
  float sh = 1e9;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    vec2 c = vec2(cos(a), sin(a)) * (i % 2 == 0 ? 0.62 : 0.5);
    sh = min(sh, length(q.xz - c) - (i % 2 == 0 ? 0.17 : 0.12));
  }
  float d = smin(core, sh, 0.05);
  // the shafts facing the nave run on up to the vault as wall shafts
  float tall = max(length(q.xz - vec2(-0.62, 0.0)) - 0.17, q.y - GS - 1.0);
  d = q.y < 6.2 ? d : min(max(d, q.y - 6.4), tall);
  float base = max(length(q.xz) - 0.95 + 0.12 * smoothstep(0.0, 0.6, q.y), q.y - 0.7);
  float cap = max(length(q.xz) - 0.85, abs(q.y - 6.25) - 0.22);
  return min(min(d, base), cap);
}
// the vault's ribs: transverse and diagonal, hanging just below the vault surface
float ribs(vec3 p) {
  float x = abs(p.x);
  if (p.y < GS - 0.3 || x > GW) return 1e9;
  float zz = mod(p.z, GB) - GB * 0.5;
  float vy = vaultY(x);
  float dy = p.y - (vy - 0.22);
  float tr = length(vec2(dy, abs(p.z - floor(p.z / GB + 0.5) * GB))) - 0.2;
  float dg = length(vec2(dy, abs(abs(zz) - (GB * 0.5) * (1.0 - x / GW)) * 0.8)) - 0.16;
  float ridge = length(vec2(dy, p.x)) - 0.14;
  return min(min(tr, dg), ridge);
}
// the votive stand: a low iron rack of small glass cups (flames drawn separately)
float votive(vec3 p) {
  if (uVotiveOn < 0.5) return 1e9;
  vec3 q = p - uVotive;
  float b = sdBox(q - vec3(0.0, 0.5, 0.25), vec3(0.85, 0.5, 0.3));
  if (b > 0.2) return b;
  float frame = sdBox(q - vec3(0.0, 0.45, 0.25), vec3(0.8, 0.45, 0.28)) - 0.01;
  frame = max(frame, -sdBox(q - vec3(0.0, 0.4, 0.25), vec3(0.76, 0.42, 0.32)));
  float tiers = min(sdBox(q - vec3(0.0, 0.62, 0.1), vec3(0.8, 0.02, 0.12)), sdBox(q - vec3(0.0, 0.82, 0.38), vec3(0.8, 0.02, 0.12)));
  return min(frame, tiers);
}
vec3 votivePos(int i) {
  float row = i < 9 ? 0.0 : 1.0;
  float k = mod(float(i), 9.0);
  return uVotive + vec3(-0.7 + k * 0.175, 0.67 + row * 0.2, 0.1 + row * 0.28);
}

float mapObj(vec3 p, out int id) {
  float d = -airSD(p); id = 1;
  float fl = p.y; if (fl < d) { d = fl; id = 0; }
  float pr = pier(p); if (pr < d) { d = pr; id = 2; }
  float rb = ribs(p); if (rb < d) { d = rb; id = 2; }
  float v = votive(p); if (v < d) { d = v; id = 3; }
#ifdef G_EXTRA
  int eid; float e = extraObj(p, eid); if (e < d) { d = e; id = eid; }
#endif
  return d;
}

vec3 calcNormal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.001;
  int i;
  return normalize(e.xyy * mapObj(p + e.xyy, i) + e.yyx * mapObj(p + e.yyx, i) + e.yxy * mapObj(p + e.yxy, i) + e.xxx * mapObj(p + e.xxx, i));
}
float march(vec3 ro, vec3 rd, float tmax, out int id) {
  float t = 0.01;
  for (int i = 0; i < 220; i++) {
    float d = mapObj(ro + rd * t, id);
    if (abs(d) < 0.0004 * t) return t;
    t += d * 0.8;
    if (t > tmax) break;
  }
  id = -1; return -1.0;
}
float softShadow(vec3 ro, vec3 rd, float tmax, float k) {
  float res = 1.0, t = 0.03; int id;
  for (int i = 0; i < 48; i++) {
    float h = mapObj(ro + rd * t, id);
    res = min(res, k * h / t);
    t += clamp(h, 0.03, 0.6);
    if (res < 0.003 || t > tmax) break;
  }
  return sat(res);
}
float calcAO(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0; int id;
  for (int i = 1; i <= 5; i++) { float h = 0.08 * float(i); o += (h - mapObj(p + n * h, id)) * s; s *= 0.7; }
  return sat(1.0 - 1.6 * o);
}

// stone: limestone blocks with mortar joints, weathered and stained
vec3 stone(vec3 p, vec3 n) {
  vec2 uv = abs(n.x) > 0.6 ? p.zy : abs(n.z) > 0.6 ? p.xy : p.xz;
  vec2 blk = vec2(0.62, 0.32);
  vec2 g = uv / blk; g.x += 0.5 * mod(floor(g.y), 2.0);
  vec2 f = fract(g), id = floor(g);
  float joint = smoothstep(0.012, 0.0, min(min(f.x, 1.0 - f.x) * blk.x, min(f.y, 1.0 - f.y) * blk.y) - 0.002);
  vec3 c = vec3(0.42, 0.39, 0.35) * (0.88 + 0.16 * hash12(id)) * (0.75 + 0.5 * fbm(uv * 3.0, 4));
  c *= 1.0 - 0.35 * smoothstep(0.4, 0.8, fbm(vec2(uv.x * 2.0, uv.y * 0.4) + 3.0, 4));   // soot and damp
  return mix(c, c * 0.55, joint);
}
// the window glass: leaded lancets with a quatrefoil, deep blue with a little red, moonlit
vec3 glass(vec2 uv) {
  vec2 cell = floor(uv * vec2(5.0, 4.0));
  float lead = smoothstep(0.06, 0.0, min(abs(fract(uv.x * 5.0) - 0.5), abs(fract(uv.y * 4.0) - 0.5)) - 0.44);
  float hue = hash12(cell);
  vec3 c = hue < 0.6 ? vec3(0.1, 0.2, 0.75) : hue < 0.8 ? vec3(0.65, 0.08, 0.1) : vec3(0.75, 0.6, 0.2);
  c *= 0.5 + 0.8 * fbm(uv * 9.0, 3);
  float mull = smoothstep(0.03, 0.0, abs(uv.x) - 0.0);
  return c * (1.0 - 0.92 * max(lead, mull));
}

Mat material(int id, vec3 p, inout vec3 n) {
  if (id == 0) {
    // floor: big worn flagstones, slightly polished where feet have gone, a ledger slab here and there
    vec2 g = p.xz / vec2(1.2, 0.9); vec2 f = fract(g), cid = floor(g);
    float joint = smoothstep(0.03, 0.0, min(min(f.x, 1.0 - f.x) * 1.2, min(f.y, 1.0 - f.y) * 0.9) - 0.003);
    vec3 c = vec3(0.3, 0.29, 0.27) * (0.7 + 0.4 * hash12(cid)) * (0.8 + 0.3 * fbm(p.xz * 4.0, 4));
    float worn = smoothstep(2.5, 0.5, abs(p.x));
    Mat m = M(mix(c, c * 0.3, joint), mix(0.65, 0.22, worn) + 0.1 * fbm(p.xz * 9.0, 2), 0.0);
    return m;
  }
  if (id == 1) {
    float x = abs(p.x);
    float zz = mod(p.z, GB) - GB * 0.5;
    // glass at the back of the clerestory and aisle windows
    if (p.z > uEndZ + 0.7) {
      Mat m = M(vec3(0), 0.5, 0.0);
      vec2 uv = vec2(p.x / 2.6, (p.y - 3.0) / 8.0);
      vec3 g = glass(uv * vec2(2.0, 3.0));
      // the rose in the head of the window
      vec2 rq = vec2(p.x, p.y - 13.4);
      float rr = length(rq);
      if (rr < 2.2) { float pet = 0.5 + 0.5 * cos(atan(rq.y, rq.x) * 12.0); g = mix(vec3(0.75, 0.1, 0.12), vec3(0.15, 0.3, 0.9), step(0.5, fract(rr * 1.6))) * (0.4 + 0.8 * pet) * (1.0 - 0.9 * smoothstep(0.05, 0.0, abs(fract(rr * 1.6) - 0.5) - 0.45)); }
      m.emit = g * uGlass * 2.2 * (1.0 + 3.0 * uFlashG);
      return m;
    }
    if (x > GW + GT * 0.5 + 0.15 && p.y > 10.0 && p.y < 15.0 + 1.5 && abs(zz) < 0.8) {
      Mat m = M(vec3(0), 0.5, 0.0);
      m.emit = glass(vec2(zz / 0.75, (p.y - 10.4) / 3.0)) * uGlass * (1.0 + 4.0 * uFlashG);
      return m;
    }
    if (x > GW + GA - 0.2 && p.y > 2.4 && p.y < 7.5 && abs(zz) < 0.85) {
      Mat m = M(vec3(0), 0.5, 0.0);
      m.emit = glass(vec2(zz / 0.8, (p.y - 2.4) / 3.0)) * uGlass * 0.6 * (1.0 + 4.0 * uFlashG);
      return m;
    }
    return M(stone(p, n), 0.85, 0.0);
  }
  if (id == 2) return M(stone(p, n) * 1.05, 0.75, 0.0);
  if (id == 3) return M(vec3(0.03), 0.5, 1.0);   // black iron
#ifdef G_EXTRA
  return extraMat(id, p, n);
#endif
  return M(vec3(0.5), 0.5, 0.0);
}

// moonlight reaching p through the left clerestory windows: trace back along the moon to the
// window plane (x = -(GW + GT/2 + 0.2)) and test the lancet in that bay
float moonLight(vec3 p) {
  vec3 S = normalize(uMoonDir);
  if (abs(S.x) < 1e-3) return 0.0;
  float sx = -sign(S.x);                         // the side the light comes in from
  float wx = sx * (GW - GT * 0.5);               // the inner face of the wall
  float t = (wx - p.x) / -S.x;                   // back along the light to the window plane
  if (t <= 0.0) return 0.0;
  vec3 h = p - S * t;
  float zz = mod(h.z, GB) - GB * 0.5;
  float win = lancet(zz, h.y - 15.0 + 4.6, 0.75, 2.6);
  // the tracery: the moonlight comes through in the window's own pattern
  float bars = smoothstep(0.02, 0.06, abs(zz)) * (0.7 + 0.3 * step(0.4, fract((h.y - 10.4) * 1.33)));
  float pen = 0.02 + t * 0.012;
  return smoothstep(pen, -pen, win) * bars;
}

// distance back along the moonlight to the window plane (shadow rays stop short of the glass)
float moonDist(vec3 p) {
  vec3 S = normalize(uMoonDir);
  float wx = -sign(S.x) * (GW - GT * 0.5);
  return (wx - p.x) / -S.x;
}
vec3 votiveLight() { return vec3(1.0, 0.5, 0.18) * 5.0 * uVotiveOn; }
vec3 votiveCentre() { return uVotive + vec3(0.0, 0.85, 0.25); }

float D_GGX(float nh, float a) { float a2 = a * a; float d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
vec3 pointL(vec3 p, vec3 n, vec3 v, Mat m, vec3 lp, vec3 lc, bool sh) {
  vec3 L = lp - p; float d2 = dot(L, L); float dl = sqrt(d2); L /= dl;
  float nl = sat(dot(n, L)); if (nl <= 0.0) return vec3(0);
  vec3 h = normalize(L + v);
  vec3 f0 = mix(vec3(0.04), m.alb, m.metal);
  vec3 spec = f0 * D_GGX(sat(dot(n, h)), max(0.03, m.rough * m.rough)) * 0.25;
  float s = sh ? softShadow(p + n * 0.01, L, dl - 0.1, 12.0) : 1.0;
  return (m.alb * (1.0 - m.metal) / PI + spec) * lc * nl * s / (0.05 + d2);
}
vec3 shadeG(vec3 p, vec3 n, vec3 rd, Mat m, float ao, bool full) {
  vec3 v = -rd;
  vec3 col = m.emit;
  vec3 S = -normalize(uMoonDir);
  float nl = sat(dot(n, S));
  float ml = nl > 0.0 ? moonLight(p) : 0.0;
  if (ml > 0.0) {
    float sh = full ? softShadow(p + n * 0.01, S, moonDist(p) - 0.15, 20.0) : 1.0;
    vec3 h = normalize(S + v);
    vec3 f0 = mix(vec3(0.04), m.alb, m.metal);
    col += (m.alb * (1.0 - m.metal) / PI + f0 * D_GGX(sat(dot(n, h)), max(0.03, m.rough * m.rough)) * 0.25) * uMoonCol * nl * ml * sh;
  }
  col += pointL(p, n, v, m, votiveCentre(), votiveLight(), full);
  col += pointL(p, n, v, m, uP1, uP1c, false);
  col += m.alb * uAmb * (0.6 + 0.4 * n.y) * ao;
  col += m.alb * vec3(0.3, 0.38, 0.6) * uFlashG * 0.25 * ao;
  return col;
}

// one candle flame along a ray (a teardrop where the ray passes its axis)
vec3 flameAt(vec3 ro, vec3 rd, vec3 b, float h, float k, float seed, float depth) {
  if (k <= 0.0) return vec3(0);
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dd > 1e-6 ? dot(b.xz - ro.xz, dxz) / dd : 0.0;
  if (t <= 0.0 || t > depth + 0.05) return vec3(0);
  vec3 q = ro + rd * t - b;
  float hh = h * k * (0.9 + 0.2 * vnoise(vec2(uTime * 7.0 + seed, 1.0)));
  float y = q.y / hh;
  if (y < -0.3 || y > 1.4) return vec3(0);
  float sw = (vnoise(vec2(uTime * 1.7 + seed, 3.0)) - 0.5) * 0.5;
  vec2 rr = q.xz - normalize(vec2(-rd.z, rd.x) + 1e-5) * sw * hh * 0.25 * y * y;
  float x = length(rr) / (hh * 0.21);
  float yy = clamp(y, 0.0, 1.0);
  float prof = pow(yy, 0.5) * pow(1.0 - yy, 0.75) * 1.9 + 0.08;
  float body = smoothstep(1.0, 0.55, x / prof) * smoothstep(-0.15, 0.08, y) * smoothstep(1.15, 0.85, y);
  float core = smoothstep(0.55, 0.15, x / prof) * smoothstep(0.0, 0.2, y) * smoothstep(0.75, 0.35, y);
  vec3 c = vec3(1.0, 0.42, 0.1) * body * 7.0 + vec3(1.0, 0.86, 0.6) * core * 22.0;
  float g = exp(-length(vec2(length(q.xz), q.y - hh * 0.45)) / (hh * 1.2));
  c += vec3(1.0, 0.5, 0.16) * g * 0.4;
  return c * k;
}
vec3 votives(vec3 ro, vec3 rd, float depth) {
  vec3 acc = vec3(0);
  if (uVotiveOn < 0.5) return acc;
  for (int i = 0; i < 18; i++) {
    vec3 b = votivePos(i);
    acc += flameAt(ro, rd, b + vec3(0, 0.05, 0), 0.035, 1.0, float(i) * 7.1, depth);
    // the red glass cup round each flame
    vec2 dxz = rd.xz; float t = dot(b.xz - ro.xz, dxz) / max(dot(dxz, dxz), 1e-6);
    if (t > 0.0 && t < depth + 0.05) {
      vec3 q = ro + rd * t - b;
      float cup = smoothstep(0.04, 0.035, length(q.xz)) * smoothstep(0.0, 0.01, q.y) * smoothstep(0.075, 0.065, q.y);
      acc += vec3(0.9, 0.12, 0.05) * cup * 1.4;
    }
  }
  return acc;
}

vec3 gothicLens(vec2 fc, out vec3 ro) {
  vec3 rd = camRay(fc, ro);
  if (uAperG <= 0.0) return rd;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd * (uFocusG / dot(rd, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAperG;
  return normalize(fp - ro);
}

vec3 gothic(vec3 ro, vec3 rd, out float depth) {
  int id;
  float t = march(ro, rd, 120.0, id);
  vec3 col;
  if (t > 0.0) {
    vec3 p = ro + rd * t, n = calcNormal(p);
    Mat m = material(id, p, n);
    float ao = calcAO(p, n);
    col = shadeG(p, n, rd, m, ao, true);
    depth = t;
    if (id == 0) {
      // the worn floor mirrors a little: windows and flames smear across it
      vec3 r = reflect(rd, n);
      vec3 jit = (hash33(p * 733.0 + uFrame * 0.61 + vec3(uJitter, 1.0)) - 0.5) * 2.0;
      r = normalize(r + jit * m.rough * m.rough * 0.8);
      int rid; float rt = march(p + n * 0.01, r, 60.0, rid);
      vec3 rc = vec3(0);
      if (rt > 0.0) { vec3 rp = p + r * rt; vec3 rn = calcNormal(rp); Mat rm = material(rid, rp, rn); rc = shadeG(rp, rn, r, rm, 1.0, false); }
      rc += votives(p + n * 0.01, r, rt > 0.0 ? rt : 60.0) * 0.6;
      float fr = 0.04 + 0.96 * pow(1.0 - sat(dot(n, -rd)), 5.0);
      col += rc * fr * (1.0 - m.rough) * 1.5;
    }
  } else { col = vec3(0.0); depth = 1e3; }
  // haze: moon shafts and the votives' glow, marched with a jittered start
  {
    float tm = min(depth, 60.0);
    const int N = 40;
    float dt = tm / float(N);
    float j = hash12(gl_FragCoord.xy + uFrame * 3.1 + uJitter * 50.0);
    vec3 sc = vec3(0);
    vec3 S = normalize(uMoonDir);
    float g = 0.5 + 0.8 * pow(sat(dot(rd, -S)), 4.0);
    vec3 vc = votiveCentre();
    for (int i = 0; i < N; i++) {
      vec3 q = ro + rd * (float(i) + j) * dt;
      sc += uMoonCol * moonLight(q) * g;
      vec3 dl = vc - q; sc += votiveLight() * 0.03 / (0.05 + dot(dl, dl));
    }
    float hz = 1.0 - exp(-tm * uHaze);
    col = col * (1.0 - hz * 0.6) + sc * dt * uHaze * 0.16 + uHazeCol * hz;
  }
  col += votives(ro, rd, depth);
  return col * uExpo;
}
`;
