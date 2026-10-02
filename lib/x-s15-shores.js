// Two shores at night (scene 15). Low over black water, looking down a widening strait: on the left
// bank the East, a cross-in-square church crowned with a drum and dome and four small domes, its windows
// warm with candles; on the right bank the West, a long basilica under one tall ribbed dome and lantern.
// A cold moon behind thin cloud lays its path straight down the gap between them. uGap pulls the shores
// apart. Everything a pure function of uTime and the uniforms.
// Screen-right is world -x (camRay's basis); the code works in s = -x so "right" reads as right.
export const SHORES_UNIFORMS = {
  uGap: 40.0,                     // half-width of the strait at the churches (m)
  uMoon: [0.0, 0.075, 1.0],       // moon direction
  uLightK: 1.0,                   // the churches' windows
};

export const SHORES_GLSL = /* glsl */ `
uniform float uGap, uLightK;
uniform vec3 uMoon;
#define MOON normalize(uMoon)
const vec3 MOONC = vec3(0.55, 0.68, 1.0);
const vec3 CANDLE = vec3(1.0, 0.56, 0.22);

// ---------------- sky ----------------
float cl2(vec2 uv) { return fbm(uv * 1.7 - vec2(uTime * 0.02, 0.0), 4); }
vec3 nightSky(vec3 rd) {
  float y = max(rd.y, 0.0);
  vec3 c = mix(vec3(0.030, 0.042, 0.075), vec3(0.006, 0.010, 0.026), smoothstep(0.0, 0.5, y));
  float md = max(dot(rd, MOON), 0.0);
  // thin cloud drifting over the moon, lit at its edges
  vec2 uv = rd.xz / (rd.y + 0.1);
  float cl = fbm(uv * 0.55 + vec2(uTime * 0.012, 0.0), 6);
  float dens = smoothstep(0.4, 0.75, cl) * smoothstep(0.0, 0.08, rd.y);
  vec3 halo = MOONC * (pow(md, 40.0) * 0.18 + pow(md, 600.0) * 1.0 + pow(md, 6.0) * 0.03);
  c += halo * (1.0 - 0.5 * dens);
  vec3 cc = mix(vec3(0.010, 0.013, 0.022), MOONC * 0.3, pow(md, 8.0) * 0.25 + pow(md, 40.0) * 0.7 + 0.03);
  cc *= 0.7 + 0.6 * smoothstep(0.4, 0.9, cl2(uv));
  c = mix(c, cc, dens * 0.85);
  // the moon itself, softened by the cloud
  c += vec3(1.6, 1.75, 2.0) * smoothstep(0.99985, 0.99993, md) * (1.0 - 0.6 * dens) * 3.0;
  // a few stars where the cloud is thin
  vec2 sp = rd.xz / (rd.y + 0.3) * 260.0;
  vec2 ci = floor(sp); float h = hash12(ci);
  float st = step(0.985, h) * smoothstep(0.35, 0.05, length(fract(sp) - 0.5)) * (1.0 - dens) * smoothstep(0.04, 0.2, rd.y);
  c += vec3(0.7, 0.8, 1.0) * st * 0.35 * hash12(ci + 3.0);
  return c;
}

// ---------------- the shores ----------------
// s: screen-right coordinate (= -x). The strait runs down z; its edge on either side is at |s| = edge(z).
float edgeS(float z, float side) { return uGap + (z - 240.0) * 0.32 + 9.0 * sin(z * 0.021 + side * 2.0) + 4.0 * sin(z * 0.07 + side); }
float landH(vec2 xz) {
  float s = -xz.x, z = xz.y;
  float side = sign(s);
  float d = abs(s) - edgeS(z, side);                         // >0 on the land
  d = min(d, z - 150.0);                                     // the near ends of the two banks
  float h = smoothstep(-1.0, 40.0, d) * 9.0 + smoothstep(30.0, 220.0, d) * (14.0 + 20.0 * fbm(vec2(z * 0.006, side * 7.0 + s * 0.004), 4));
  h += 2.5 * fbm(xz * 0.03, 3) * smoothstep(0.0, 30.0, d);
  return h - 1.0;
}
float landMarch(vec3 ro, vec3 rd, float tmax) {
  float t = 20.0;
  for (int i = 0; i < 90; i++) {
    vec3 p = ro + rd * t;
    float h = p.y - landH(p.xz);
    if (h < 0.003 * t) return t;
    t += max(h * 0.6, 0.012 * t);
    if (t > tmax) break;
  }
  return -1.0;
}
vec3 landNormal(vec3 p, float t) {
  float e = 0.1 + t * 0.004; float h = landH(p.xz);
  return normalize(vec3(h - landH(p.xz + vec2(e, 0)), e, h - landH(p.xz + vec2(0, e))));
}

// ---------------- the two churches ----------------
// East: on the left bank (s < 0). West: on the right bank (s > 0).
vec3 eastPos() { float z = 330.0; float s = -edgeS(z, -1.0) - 34.0; vec3 p = vec3(-s, 0.0, z); p.y = landH(p.xz) - 0.5; return p; }
vec3 westPos() { float z = 370.0; float s = edgeS(z, 1.0) + 40.0; vec3 p = vec3(-s, 0.0, z); p.y = landH(p.xz) - 0.5; return p; }
float sdCylY(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float eastSD(vec3 q) {
  float d = sdBox(q - vec3(0, 7, 0), vec3(13, 7, 13));
  d = min(d, sdBox(q - vec3(0, 9, 0), vec3(15.5, 5, 6)));                        // the cross arms
  d = min(d, sdBox(q - vec3(0, 9, 0), vec3(6, 5, 15.5)));
  d = min(d, sdBox(q - vec3(0, 3, 16.5), vec3(6, 3, 4)));                       // apse block toward us
  d = min(d, sdCylY(q - vec3(0, 17.5, 0), 6.0, 3.5));                           // drum
  d = min(d, length(q - vec3(0, 21.0, 0)) - 6.2);                               // dome
  vec3 c = vec3(abs(q.x) - 9.5, q.y, abs(q.z) - 9.5);
  d = min(d, sdCylY(c - vec3(0, 15.5, 0), 2.6, 1.6));
  d = min(d, length(c - vec3(0, 17.0, 0)) - 2.7);
  d = min(d, sdBox(q - vec3(0, 28.6, 0), vec3(0.18, 1.4, 0.18)));                // cross
  d = min(d, sdBox(q - vec3(0, 29.0, 0), vec3(0.8, 0.16, 0.18)));
  return d;
}
float westSD(vec3 q) {
  float d = sdBox(q - vec3(0, 9, 0), vec3(11, 9, 34));                           // nave
  d = min(d, sdBox(q - vec3(0, 9, -12), vec3(26, 9, 9)));                        // transepts
  d = min(d, sdBox(q - vec3(0, 12, 34), vec3(16, 12, 2.5)));                     // facade toward us
  d = min(d, sdCylY(q - vec3(0, 24.0, -12), 10.0, 6.0));                         // drum
  vec3 dq = q - vec3(0, 30.0, -12); dq.y *= 0.82;
  d = min(d, max(length(dq) - 10.2, -dq.y));                                     // tall dome
  d = min(d, sdCylY(q - vec3(0, 41.5, -12), 1.6, 2.4));                          // lantern
  d = min(d, sdBox(q - vec3(0, 45.5, -12), vec3(0.16, 1.4, 0.16)));
  vec3 t = vec3(abs(q.x) - 13.5, q.y, q.z - 34.0);                               // two short bell towers
  d = min(d, sdBox(t - vec3(0, 16, 0), vec3(3, 16, 3)));
  return d;
}
float churchSD(vec3 p, out int id) {
  vec3 e = eastPos(), w = westPos();
  vec3 qe = p - e; qe.xz = rot(0.15) * qe.xz;
  vec3 qw = p - w; qw.xz = rot(-0.2) * qw.xz;
  float de = eastSD(qe), dw = westSD(qw);
  id = de < dw ? 1 : 2;
  return min(de, dw);
}
float churchMarch(vec3 ro, vec3 rd, float tmax, out int id) {
  float t = 120.0;
  // bounding slab: only rays near the two buildings march
  for (int i = 0; i < 90; i++) {
    vec3 p = ro + rd * t;
    float d = churchSD(p, id);
    if (d < 0.0015 * t) return t;
    t += d;
    if (t > tmax) break;
  }
  id = 0; return -1.0;
}
vec3 churchNormal(vec3 p) {
  int i; vec2 e = vec2(0.05, 0.0);
  return normalize(vec3(churchSD(p + e.xyy, i) - churchSD(p - e.xyy, i), churchSD(p + e.yxy, i) - churchSD(p - e.yxy, i), churchSD(p + e.yyx, i) - churchSD(p - e.yyx, i)));
}

// the lights: windows and doors as small sources (also used for their streaks in the water)
vec3 lightPos(int i, out vec3 col) {
  col = CANDLE;
  vec3 e = eastPos(), w = westPos();
  mat2 re = rot(-0.15), rw = rot(0.2);
  if (i < 6) {          // East: drum windows facing us, a door, two nave windows
    vec3 o;
    if (i < 3) o = vec3(-3.4 + 3.4 * float(i), 17.5, 6.0 - abs(float(i) - 1.0) * 1.2);
    else if (i == 3) o = vec3(0.0, 2.2, 20.5);
    else o = vec3(i == 4 ? -9.0 : 9.0, 9.0, 13.2);
    o.xz = re * o.xz;
    return e + o;
  }
  int j = i - 6;        // West: the lantern, the facade door, drum windows, a facade window; a little colder
  col = vec3(1.0, 0.72, 0.45);
  vec3 o;
  if (j == 0) o = vec3(0.0, 41.5, -10.2);
  else if (j == 1) o = vec3(0.0, 3.0, 36.6);
  else if (j < 5) o = vec3(-6.0 + 6.0 * float(j - 2), 24.0, -12.0 + 10.0 - abs(float(j - 3)) * 2.0);
  else o = vec3(0.0, 15.0, 36.6);
  o.xz = rw * o.xz;
  return w + o;
}
#define NLIGHTS 12
vec3 lightGlow(vec3 ro, vec3 rd, float depth, float stretch, float k) {
  vec3 acc = vec3(0);
  for (int i = 0; i < NLIGHTS; i++) {
    vec3 col; vec3 c = lightPos(i, col);
    vec3 oc = c - ro;
    float t = dot(oc, rd);
    if (t <= 0.0 || t > depth + 6.0) continue;
    vec3 q = oc - rd * t;
    q.y /= stretch;
    float d = length(q) / (t * 0.0006 + 0.002);
    float fl = 0.85 + 0.15 * vnoise(vec2(uTime * 4.0, float(i) * 5.0));
    acc += col * fl * (exp(-d * d * 0.12) * 5.0 + exp(-d * 0.25) * 0.8 + exp(-d * 0.03) * 0.1);
  }
  return acc * k * uLightK;
}

// lit windows: tall round-headed openings in a row on each face, in the building's own frame
float windows(vec3 q, vec3 n, float y0, float y1, float pitch, float w) {
  float u = abs(n.x) > abs(n.z) ? q.z : q.x;
  float cell = fract(u / pitch) - 0.5;
  float x = abs(cell) * pitch;
  float top = y1 - w;
  float inside = step(x, w) * step(y0, q.y) * step(q.y, top + sqrt(max(w * w - x * x, 0.0)));
  return inside * step(abs(n.y), 0.3);
}
vec3 shadeChurch(vec3 p, vec3 rd, int id) {
  vec3 n = churchNormal(p);
  vec3 base = id == 1 ? eastPos() : westPos();
  vec3 q = p - base; q.xz = rot(id == 1 ? 0.15 : -0.2) * q.xz;
  vec3 nq = n; nq.xz = rot(id == 1 ? 0.15 : -0.2) * nq.xz;
  vec3 alb = id == 1 ? vec3(0.62, 0.52, 0.40) : vec3(0.60, 0.58, 0.55);
  alb *= 0.75 + 0.35 * fbm(q.xz * 0.4 + q.y * 0.5, 3);
  // stone courses
  alb *= 0.9 + 0.1 * smoothstep(0.0, 0.1, abs(fract(q.y * 1.2) - 0.5));
  vec3 c = alb * (MOONC * 0.10 * sat(dot(n, MOON) * 0.8 + 0.2) + vec3(0.01, 0.013, 0.022) * (0.6 + 0.4 * n.y));
  // floodlight from the ground in front: warm gold on the East, a paler sodium-white on the West
  vec3 fc = id == 1 ? vec3(1.0, 0.58, 0.24) : vec3(0.95, 0.78, 0.6);
  float face = sat(dot(n, normalize(vec3(-base.x * 0.002, 0.35, -1.0))) * 0.85 + 0.15);
  float hgt = id == 1 ? 30.0 : 46.0;
  float fall = 0.08 + 0.92 * exp(-q.y / (hgt * 0.35));
  float dome = id == 1 ? smoothstep(16.0, 19.0, q.y) : smoothstep(22.0, 26.0, q.y);
  c += alb * fc * face * fall * 0.75 * uLightK;
  c += alb * fc * dome * face * (id == 1 ? 0.22 : 0.35) * uLightK;
  // gilt domes catch it brighter
  if (id == 1 && q.y > 15.0 && length(vec2(abs(q.x) - (abs(q.x) > 6.0 ? 9.5 : 0.0), abs(q.z) - (abs(q.z) > 6.0 ? 9.5 : 0.0))) < 7.0) {
    c = mix(c, vec3(1.0, 0.66, 0.26) * (face * 0.7 + 0.05) * uLightK + MOONC * 0.2 * pow(sat(dot(reflect(rd, n), MOON)), 8.0), 0.85);
  }
  // candles in the windows
  float win = 0.0;
  if (id == 1) win = max(windows(q, nq, 6.0, 10.0, 5.0, 0.45), windows(q, nq, 16.2, 19.2, 2.4, 0.35));
  else win = max(windows(q, nq, 6.0, 12.0, 7.0, 0.7), windows(q, nq, 21.5, 26.0, 3.2, 0.45));
  float flick = 0.8 + 0.2 * vnoise(q.xz * 0.5 + uTime * 2.0);
  c = mix(c, CANDLE * 1.6 * flick * uLightK, win * 0.9);
  return c;
}
vec3 shadeLand(vec3 p, vec3 rd, float t) {
  vec3 n = landNormal(p, t);
  vec3 alb = mix(vec3(0.10, 0.10, 0.09), vec3(0.06, 0.07, 0.05), fbm(p.xz * 0.05, 3));
  vec3 c = alb * (MOONC * 0.2 * sat(dot(n, MOON) * 0.7 + 0.3) + vec3(0.01, 0.014, 0.024));
  for (int i = 0; i < NLIGHTS; i += 3) { vec3 col; vec3 L = lightPos(i, col) - p; float d2 = dot(L, L); c += alb * col * uLightK * 30.0 * sat(dot(n, L * inversesqrt(d2))) / (30.0 + d2); }
  return c;
}
// a distant atmosphere: cold, a little brighter toward the moon
vec3 airCol(vec3 rd) { return mix(vec3(0.016, 0.022, 0.04), MOONC * 0.09, pow(max(dot(rd, MOON), 0.0), 6.0)); }

// what a ray above the water sees (land, churches, sky), and how far
vec3 above(vec3 ro, vec3 rd, out float depth, bool cheap) {
  depth = 1e4;
  vec3 c = nightSky(rd);
  if (rd.y > 0.2) return c;
  float tl = landMarch(ro, rd, 900.0);
  int id; float tc = churchMarch(ro, rd, tl > 0.0 ? tl : 900.0, id);
  if (tc > 0.0) { depth = tc; c = shadeChurch(ro + rd * tc, rd, id); }
  else if (tl > 0.0) { depth = tl; c = cheap ? vec3(0.006, 0.007, 0.011) : shadeLand(ro + rd * tl, rd, tl); }
  if (depth < 1e4) {
    vec3 hp = ro + rd * depth;
    c = mix(c, airCol(rd), 1.0 - exp(-depth * 0.0035));
    // a low bank of mist lying along the shores
    c = mix(c, airCol(rd) * 1.6 + vec3(0.01, 0.012, 0.02), 0.75 * exp(-max(hp.y, 0.0) / 9.0) * smoothstep(100.0, 300.0, depth));
  }
  return c;
}
float waterH(vec2 p) {
  float t = uTime;
  float h = 0.05 * sin(dot(p, vec2(0.15, 0.6)) - t * 0.8) + 0.03 * sin(dot(p, vec2(-0.5, 0.75)) * 1.4 - t * 1.1);
  h += 0.02 * (vnoise(p * 1.2 + vec2(t * 0.3, t * 0.2)) - 0.5) + 0.008 * (vnoise(p * 4.0 - vec2(0.0, t * 0.6)) - 0.5);
  return h;
}
vec3 waterNormal(vec2 p, float dist) {
  float e = 0.03 + dist * 0.004; float h = waterH(p);
  return normalize(vec3(h - waterH(p + vec2(e, 0)), e, h - waterH(p + vec2(0, e))));
}
vec3 shoresScene(vec3 ro, vec3 rd) {
  float tw = rd.y < 0.0 ? ro.y / -rd.y : 1e5;
  float depth;
  if (tw > 1e4) { vec3 c = above(ro, rd, depth, false); return c + lightGlow(ro, rd, depth, 1.0, 1.0); }
  vec3 p = ro + rd * tw;
  if (landH(p.xz) > 0.0) { vec3 c = above(ro, rd, depth, false); return c + lightGlow(ro, rd, depth, 1.0, 1.0); }
  vec3 n = waterNormal(p.xz, tw);
  // capillary ripples break the moon's path into glints
  vec2 rq = p.xz * vec2(2.2, 0.9);
  vec3 fine = vec3(vnoise(rq * 3.0 + vec2(uTime * 0.9, 0.0)) - 0.5, 0.0, vnoise(rq * 3.0 + vec2(5.0, -uTime * 0.7)) - 0.5) + 0.5 * vec3(vnoise(rq * 9.0 - uTime) - 0.5, 0.0, vnoise(rq * 9.0 + 3.0 + uTime) - 0.5);
  n = normalize(n + fine * 0.22 * exp(-tw * 0.004));
  vec3 r = reflect(rd, n); r.y = abs(r.y) + 0.002;
  float fr = 0.02 + 0.98 * pow(1.0 - sat(dot(n, -rd)), 5.0);
  float dr; vec3 rc = above(p, r, dr, true);
  rc += lightGlow(p, r, dr, 9.0, 0.9);
  vec3 c = mix(vec3(0.004, 0.007, 0.012), rc, fr);
  // the moon's glitter path down the strait
  c += MOONC * pow(sat(dot(r, MOON)), 900.0) * 40.0 * fr;
  c += MOONC * pow(sat(dot(r, MOON)), 90.0) * 0.12 * fr;
  c = mix(c, airCol(rd), 1.0 - exp(-tw * 0.0028));
  // a breath of cold mist on the water
  c += vec3(0.012, 0.018, 0.032) * (1.0 - exp(-tw * 0.004)) * (0.6 + 0.4 * fbm(p.xz * 0.02 + vec2(uTime * 0.05, 0.0), 3));
  return c;
}
`;
