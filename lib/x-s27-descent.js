// Light breaking through a storm onto a dark sea (scene 27). A heavy slate ceiling of cloud over a
// heaving sea; a break opens in it (uOpen), a shaft of warm light comes down through the gap (uShaft:
// how far it has reached), and where it touches the water the sea warms and the warmth spreads (uWarm).
// The sea is adapted from Genesis 8's flood sea (lib/g8/sea.js). Everything a pure function of uTime
// and the uniforms.
export const DESCENT_UNIFORMS = {
  uOpen: 0.2,      // the break in the cloud, 0 closed .. 1 wide
  uShaft: 0.0,     // the shaft's reach, 0 at the cloud .. 1 on the water
  uWarm: 0.0,      // the warmth spreading over the sea from where the light lands
  uWind: 0.55,
};

export const DESCENT_GLSL = /* glsl */ `
uniform float uOpen, uShaft, uWarm, uWind;
const float CB = 240.0;                         // the cloud base (m)
const vec3 HOLE = vec3(-20.0, CB, 540.0);       // the break, overhead and ahead
const vec3 LAND = vec3(-30.0, 0.0, 230.0);      // where the light lands on the water
#define LDIR normalize(HOLE - LAND)
const vec3 GOLD = vec3(1.0, 0.68, 0.36);

// ---------------- the storm ceiling ----------------
float holeR() { return 15.0 + 115.0 * uOpen; }
// edge coordinate: <0 inside the break, >0 in the cloud
float holeE(vec2 xz) {
  vec2 d = (xz - HOLE.xz) * vec2(1.0, 0.7);
  return length(d) + 120.0 * (fbm(xz * 0.009 + 3.0, 5) - 0.5) + 30.0 * (fbm(xz * 0.04, 3) - 0.5) - holeR();
}
vec3 horizonCol(vec3 rd) {
  float s = pow(sat(dot(normalize(rd.xz), normalize(LAND.xz))), 20.0);
  return mix(vec3(0.085, 0.095, 0.11), vec3(0.2, 0.16, 0.12), s * (0.3 + 0.7 * uShaft));
}
vec3 stormSky(vec3 rd) {
  vec3 hz = horizonCol(rd);
  if (rd.y < 0.004) return hz;
  float t = (CB - 2.0) / rd.y;
  vec2 xz = rd.xz * t;
  // the underside of the cloud: heavy lumps lit only from the gap
  vec2 dr = vec2(uTime * 1.5, uTime * 0.6);
  float n1 = fbm(xz * 0.0035 + dr * 0.002, 6);
  float n2 = fbm(xz * 0.011 - dr * 0.004, 4);
  float lump = n1 * 0.7 + n2 * 0.3;
  vec3 c = mix(vec3(0.020, 0.023, 0.030), vec3(0.085, 0.092, 0.105), smoothstep(0.3, 0.8, lump));
  float e = holeE(xz);
  // the cloud near the break is lit from above and through its thinning edge
  float near = exp(-max(e, 0.0) / 260.0);
  float rim = exp(-pow(max(e, 0.0) / 45.0, 1.4));
  c += GOLD * near * 0.25 * smoothstep(0.35, 0.8, lump) * (0.4 + 0.6 * uOpen);
  c += vec3(1.0, 0.82, 0.6) * rim * 1.6 * smoothstep(0.25, 0.75, lump + 0.2) * (0.3 + 0.7 * uOpen);
  // through the break: the bright sky above the storm, with high cloud
  float open = smoothstep(8.0, -25.0, e);
  vec3 above = mix(vec3(3.2, 2.6, 1.9), vec3(1.6, 1.7, 1.9), smoothstep(-40.0, -200.0, e));
  above *= 0.85 + 0.3 * fbm(xz * 0.02 + 7.0, 3);
  c = mix(c, above, open);
  // distance: the ceiling fades into rain murk toward the horizon
  c = mix(c, hz, 1.0 - exp(-max(t - 300.0, 0.0) * 0.0009));
  return c;
}

// the cloud as a volume, for the primary rays: a slab from CB to CB + CH with the break cut through it
const float CH = 190.0;
float cloudD(vec3 p) {
  float h = (p.y - CB) / CH;
  vec3 q = p * vec3(0.0075, 0.011, 0.0075) + vec3(uTime * 0.015, 0.0, uTime * 0.006);
  float n = fbm(q, 5);
  n += 0.35 * (fbm(q * 3.3 + 11.0, 4) - 0.5);
  float prof = smoothstep(0.0, 0.25, h) * smoothstep(1.0, 0.55, h);
  float d = sat((n - 0.43 - 0.4 * (1.0 - prof)) * 8.0);
  // the break, wider toward the top, its walls ragged
  float e = holeE(p.xz) - 30.0 * h;
  d *= smoothstep(-10.0, 50.0, e);
  return d;
}
vec3 cloudVolume(vec3 ro, vec3 rd, vec3 bg) {
  if (rd.y < 0.012) return horizonCol(rd);
  float t0 = (CB - ro.y) / rd.y, t1 = min((CB + CH - ro.y) / rd.y, t0 + 1800.0);
  float dt = (t1 - t0) / 48.0;
  float j = hash12(gl_FragCoord.xy * 1.3 + uFrame * 3.1);
  float T = 1.0; vec3 acc = vec3(0);
  for (int i = 0; i < 48; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + j) * dt);
    float d = cloudD(p);
    if (d < 0.01) continue;
    float h = (p.y - CB) / CH;
    float e = max(holeE(p.xz) - 30.0 * h, 0.0);
    // lit from the break: strongest on the walls of the gap, a little higher up
    // the storm's own grey light from everywhere, brighter on the tops of the lumps
    vec3 L = vec3(0.30, 0.32, 0.37) * (0.2 + 1.4 * h) * (0.45 + 1.1 * (1.0 - d));
    L += vec3(1.0, 0.8, 0.58) * (3.5 * exp(-e / 22.0) * (1.0 - 0.7 * d) + 0.5 * exp(-e / 110.0) + 0.1 * exp(-e / 500.0)) * (0.1 + 0.9 * h) * (0.25 + 0.75 * uOpen);
    // self-shadowing toward the base: thick parts are darker underneath
    L *= mix(0.35, 1.0, sat(h * 1.4 + (1.0 - d) * 0.5));
    // fine texture in the light: wisps and knots on the cloud faces
    L *= 0.7 + 0.6 * vnoise(vec3(p.xz * 0.07, p.y * 0.05));
    float a = 1.0 - exp(-d * 0.035 * dt);
    acc += T * a * L;
    T *= 1.0 - a;
    if (T < 0.02) break;
  }
  vec3 c = acc + T * bg;
  return mix(c, horizonCol(rd), 1.0 - exp(-max(t0 - 400.0, 0.0) * 0.0009));
}
// the sky behind the volume: the bright high air through the break, dark elsewhere
vec3 aboveSky(vec3 ro, vec3 rd) {
  float t = (CB + CH - ro.y) / max(rd.y, 1e-3);
  vec2 xz = ro.xz + rd.xz * t;
  float e = holeE(xz) - 30.0;
  // the high sky: a sun just off the break's centre, thin bright cirrus
  vec3 sd = normalize(HOLE + vec3(25.0, 400.0, 60.0) - ro);
  float sg = max(dot(rd, sd), 0.0);
  vec3 hi = vec3(0.9, 0.95, 1.05) + vec3(1.0, 0.85, 0.6) * (pow(sg, 30.0) * 2.5 + pow(sg, 400.0) * 8.0);
  hi *= 0.8 + 0.45 * smoothstep(0.4, 0.75, fbm(xz * vec2(0.004, 0.012) + 7.0, 5));
  return hi;
}

// ---------------- the shaft ----------------
// the axis from the break down to the water; the light's front has reached y = (1 - uShaft) * CB
float shaftR(float y) { return mix(30.0 + 20.0 * uWarm, holeR() * 0.55, y / CB); }
vec3 shaftLight(vec3 ro, vec3 rd, float depth) {
  vec3 A = HOLE, B = LAND;
  float yFront = (1.0 - uShaft) * CB;
  // march across the slab of space around the axis
  vec3 acc = vec3(0);
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  vec2 mid = mix(A.xz, B.xz, 0.5);
  float tc = dot(mid - ro.xz, dxz) / dd;
  float w = 340.0 / sqrt(dd);
  float t0 = max(tc - w, 0.0), t1 = min(tc + w, depth);
  if (t1 <= t0) return acc;
  float dt = (t1 - t0) / 24.0;
  float j = hash12(gl_FragCoord.xy + uFrame * 7.0);
  for (int i = 0; i < 24; i++) {
    float t = t0 + (float(i) + j) * dt;
    vec3 p = ro + rd * t;
    if (p.y > CB || p.y < 0.0) continue;
    float k = (p.y - B.y) / (A.y - B.y);
    vec3 ax = mix(B, A, k);
    vec2 off = p.xz - ax.xz;
    float r = shaftR(p.y);
    float dens = exp(-dot(off, off) / (r * r));
    // streaks: brighter and darker bands around the axis, as light combed through the cloud edge
    float ang = atan(off.y, off.x);
    float st = fbm(vec2(ang * 5.0, p.y * 0.003 + uTime * 0.02), 4);
    dens *= 0.15 + 2.2 * st * st;
    // the front: soft, coming down
    dens *= smoothstep(yFront - 25.0, yFront + 25.0, p.y);
    acc += dens * dt;
  }
  return GOLD * acc * 0.0042 * (0.3 + 0.7 * uOpen);
}

// ---------------- the sea (after Genesis 8) ----------------
// a heaving sea: long rounded swells from two directions, chop and noise on top
float seaH(vec2 p, int oct) {
  float t = uTime;
  float a = 0.5 + 0.8 * uWind;
  float h = 0.55 * a * sin(dot(p, vec2(0.05, 0.11)) - t * 0.85 + 1.2 * vnoise(p * 0.02));
  h += 0.35 * a * sin(dot(p, vec2(-0.09, 0.07)) - t * 1.05 + 1.5 * vnoise(p * 0.03 + 4.0));
  if (oct > 1) h += 0.22 * a * sin(dot(p, vec2(0.21, 0.16)) - t * 1.5 + 2.0 * vnoise(p * 0.06 + 9.0));
  if (oct > 2) h += 0.30 * a * (fbm(p * 0.12 + vec2(t * 0.15, -t * 0.1), 3) - 0.5);
  if (oct > 3) h += 0.12 * a * (fbm(p * 0.5 + vec2(-t * 0.3, t * 0.25), oct - 3) - 0.5);
  return h;
}
float seaMarch(vec3 ro, vec3 rd, out vec3 hit) {
  if (rd.y >= 0.0) { hit = ro + rd * 1e4; return 1e4; }
  float tA = 0.0, hA = ro.y - seaH(ro.xz, 3), tB = 1e4, t = 0.0;
  bool found = false;
  for (int i = 0; i < 96; i++) {
    t = tA + max(0.03 + t * 0.02, hA * 0.6);
    vec3 p = ro + rd * t;
    float h = p.y - seaH(p.xz, 3);
    if (h < 0.0) { tB = t; found = true; break; }
    tA = t; hA = h;
    if (t > 1500.0) break;
  }
  if (!found) { hit = ro + rd * 1e4; return 1e4; }
  for (int i = 0; i < 7; i++) {
    float tm = 0.5 * (tA + tB);
    vec3 p = ro + rd * tm;
    if (p.y - seaH(p.xz, 3) < 0.0) tB = tm; else tA = tm;
  }
  hit = ro + rd * tB;
  return tB;
}
vec3 seaNormal(vec3 p, float dist) {
  float e = 0.01 + dist * 0.002;
  float h = seaH(p.xz, 6);
  return normalize(vec3(h - seaH(p.xz + vec2(e, 0), 6), e, h - seaH(p.xz + vec2(0, e), 6)));
}
// how much of the shaft's light reaches this point of the sea
float litHere(vec3 p) {
  float r = shaftR(0.0);
  vec2 o = p.xz - LAND.xz;
  return exp(-dot(o, o) / (r * r)) * smoothstep(0.85, 1.0, uShaft);
}
vec3 seaShade(vec3 ro, vec3 rd, float t, vec3 p) {
  vec3 n = seaNormal(p, t);
  // wind chop: short crossing crests as analytic slopes, each fading once smaller than a pixel
  vec2 sl = vec2(0.0);
  vec2 wd = normalize(vec2(0.35, 1.0));
  float k = 0.7, A = 0.09;
  for (int i = 0; i < 7; i++) {
    vec2 d = rot(-0.7 + 1.4 * hash11(float(i) * 3.7)) * wd;
    float ph = dot(p.xz, d) * k - uTime * sqrt(9.8 * k) + 2.0 * vnoise(p.xz * k * 0.15 + float(i) * 5.0);
    sl += d * (A * k * cos(ph)) * exp(-pow(t * k * 0.0012, 2.0));
    k *= 1.55; A *= 0.72;
  }
  n = normalize(n + vec3(-sl.x, 0.0, -sl.y));
  vec3 r = reflect(rd, n); r.y = abs(r.y);
  float fr = 0.02 + 0.98 * pow(1.0 - sat(dot(n, -rd)), 5.0);
  // the storm ceiling in the water: dark slate, with the break's glitter path toward us
  vec3 refl = mix(vec3(0.05, 0.055, 0.065), vec3(0.11, 0.12, 0.135), sat(r.y * 3.0)) * (0.8 + 0.4 * fbm(r.xz / (r.y + 0.1) * 2.0, 3));
  vec3 hd = normalize(HOLE + vec3(0.0, 60.0, 0.0) - p);
  float hg = max(dot(r, hd), 0.0);
  refl += vec3(1.0, 0.86, 0.66) * (pow(hg, 600.0) * 5.0 + pow(hg, 60.0) * 0.12) * (0.2 + 0.8 * uOpen);
  // the sea's body: cold slate, warming outward from where the light lands
  vec2 o = p.xz - LAND.xz;
  float wr = 40.0 + 300.0 * uWarm;
  float warm = exp(-dot(o, o) / (wr * wr)) * uWarm;
  vec3 deep = mix(vec3(0.010, 0.016, 0.022), vec3(0.075, 0.052, 0.03), warm);
  float lit = litHere(p);
  // light entering the water under the shaft: a green-gold glow through the wave bodies
  float thick = sat(p.y - seaH(p.xz, 2) + 0.5);
  vec3 body = deep + vec3(0.55, 0.42, 0.18) * lit * (0.25 + 0.6 * thick) + vec3(0.12, 0.07, 0.03) * warm * thick;
  vec3 c = mix(body, refl, fr);
  // the light itself on the water, scattered in the spray and the surface
  c += GOLD * lit * (0.35 + 0.5 * sat(n.y * 2.0 - 1.0)) * 0.8;
  // glitter where the light meets the waves
  float g = pow(sat(dot(r, LDIR)), 120.0);
  c += vec3(1.0, 0.8, 0.55) * g * 14.0 * (lit + 0.12 * warm);
  // whitecaps catching it
  float foam = smoothstep(0.32, 0.6, p.y + 0.15 * uWind) * smoothstep(0.45, 0.9, vnoise(p.xz * 1.5 + uTime * 0.7));
  c = mix(c, vec3(0.1, 0.11, 0.12) + GOLD * 1.3 * lit + GOLD * 0.15 * warm, foam * 0.55);
  // rain murk to the horizon
  c = mix(c, horizonCol(rd), 1.0 - exp(-t * 0.0022));
  return c;
}
vec3 descentScene(vec3 ro, vec3 rd) {
  vec3 p;
  float t = seaMarch(ro, rd, p);
  vec3 c = t < 1e3 ? seaShade(ro, rd, t, p) : cloudVolume(ro, rd, aboveSky(ro, rd));
  float depth = t < 1e3 ? t : (rd.y > 0.0 ? (CB - ro.y) / rd.y : 2000.0);
  c += shaftLight(ro, rd, depth);
  // the air around the shaft glows a little (light scattered in the rain)
  float s = pow(sat(dot(rd, normalize(mix(LAND, HOLE, 0.4) - ro))), 30.0);
  c += GOLD * s * 0.06 * uShaft;
  return c;
}
`;
