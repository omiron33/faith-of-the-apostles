// The Sea of Galilee at dawn (scene 04). From inside a fishing boat: its stem post and gunwales
// running forward, a net heaped on the thwart and hanging over the side; still water to a pale
// beach where twelve lanterns kindle one by one; the hills beyond in layered dawn haze, the sky
// amber at the horizon, lapis above. Everything a pure function of uTime.
export const SEA_UNIFORMS = {
  uLit: 0.0,                       // how many lanterns burn (fractional = the newest catching)
  uSunDir: [-0.3, 0.04, 1.0],     // the sun, just over the eastern hills
  uBob: 0.0,                       // the boat's gentle roll (radians)
};

export const SEA_GLSL = /* glsl */ `
uniform float uLit, uBob;
uniform vec3 uSunDir;
#define SUN normalize(uSunDir)

// ---------------- sky ----------------
vec3 skyBase(vec3 rd, float disc) {
  float y = rd.y;
  float s = sat(dot(normalize(vec3(rd.x, 0.0, rd.z)), normalize(vec3(SUN.x, 0.0, SUN.z))));
  // blue hour breaking: a hot amber band on the horizon toward the sun, cobalt overhead
  vec3 hor = mix(vec3(0.42, 0.30, 0.42), vec3(1.9, 0.85, 0.32), pow(s, 6.0));
  vec3 mid = mix(vec3(0.16, 0.17, 0.34), vec3(0.85, 0.42, 0.30), pow(s, 5.0));
  vec3 top = vec3(0.025, 0.05, 0.16);
  vec3 c = mix(hor, mid, smoothstep(0.0, 0.1, y));
  c = mix(c, top, smoothstep(0.05, 0.32, y));
  // long thin dawn clouds, their bellies lit from below
  vec2 uv = rd.xz / (rd.y + 0.06);
  float cl = fbm(uv * vec2(0.08, 0.5) + vec2(uTime * 0.004, 0.0), 5);
  float dens = smoothstep(0.5, 0.78, cl) * smoothstep(0.03, 0.1, y) * smoothstep(0.55, 0.15, y);
  vec3 cc = mix(vec3(1.6, 0.6, 0.32), vec3(0.16, 0.12, 0.22), smoothstep(0.06, 0.32, y));
  cc = mix(cc, vec3(2.4, 1.1, 0.5), pow(s, 10.0) * smoothstep(0.3, 0.06, y));
  c = mix(c, cc, dens * 0.85);
  float sd = max(dot(rd, SUN), 0.0);
  c += vec3(1.0, 0.55, 0.22) * (pow(sd, 12.0) * 0.3 + pow(sd, 60.0) * 1.2) + vec3(1.0, 0.85, 0.6) * pow(sd, 2000.0) * 30.0 * disc;
  return c;
}
vec3 sky(vec3 rd) { return skyBase(rd, 1.0); }
// the colour of the air between us and the hills: violet in shade, gold toward the sun
vec3 hazeCol(vec3 rd) {
  float s = sat(dot(normalize(vec3(rd.x, 0.0, rd.z)), normalize(vec3(SUN.x, 0.0, SUN.z))));
  return mix(vec3(0.20, 0.20, 0.34), vec3(1.25, 0.62, 0.32), pow(s, 6.0)) * 0.9;
}

// ---------------- land: the beach and the hills ----------------
float shoreZ(float x) { return 27.0 + 2.0 * sin(x * 0.09 + 1.0) + 0.1 * x; }
float landH(vec2 p) {
  float zs = shoreZ(p.x);
  float d = p.y - zs;
  float h = d * 0.06 - 0.25;                                   // the beach rising out of the water
  h += smoothstep(4.0, 30.0, d) * (2.0 + 4.0 * fbm(p * 0.03, 3));   // low rises behind the beach
  // the hills across the lake: a long ridge, a plateau edge, layered
  float r1 = smoothstep(40.0, 120.0, d) * (6.0 + 8.0 * fbm(vec2(p.x * 0.012, 3.0), 4));
  float r2 = smoothstep(120.0, 260.0, d) * (9.0 + 16.0 * fbm(vec2(p.x * 0.006, 9.0), 4));
  h += r1 + r2;
  h += 0.6 * fbm(p * 0.25, 3) * smoothstep(2.0, 12.0, d);
  return h;
}
float landMarch(vec3 ro, vec3 rd, float tmax) {
  float t = 1.0;
  for (int i = 0; i < 110; i++) {
    vec3 p = ro + rd * t;
    float h = p.y - landH(p.xz);
    if (h < 0.002 * t) return t;
    t += max(h * 0.55, 0.02 * t);
    if (t > tmax) break;
  }
  return -1.0;
}
vec3 landNormal(vec3 p, float t) {
  float e = 0.05 + t * 0.004;
  float h = landH(p.xz);
  return normalize(vec3(h - landH(p.xz + vec2(e, 0)), e, h - landH(p.xz + vec2(0, e))));
}

// ---------------- the lanterns ----------------
vec3 lanternPos(int i) {
  float f = float(i);
  float x = 15.5 - f * 2.75 + 0.5 * sin(f * 2.1);
  float zz = shoreZ(x) + 1.6 + 0.4 * sin(f * 1.3);
  return vec3(x, landH(vec2(x, zz)) + 0.95, zz);
}
float lanternK(int i) { return sat(uLit - float(i)); }
float lanternFlick(int i) { return 0.85 + 0.15 * vnoise(vec2(uTime * 5.0, float(i) * 7.0)); }
// the lanterns seen along a ray: a warm core, a soft halo in the dawn mist
vec3 lanterns(vec3 ro, vec3 rd, float depth, float stretch) {
  vec3 acc = vec3(0);
  for (int i = 0; i < 12; i++) {
    float k = lanternK(i);
    if (k <= 0.0) continue;
    vec3 c = lanternPos(i);
    vec3 oc = c - ro;
    float t = dot(oc, rd);
    if (t <= 0.0 || t > depth + 0.5) continue;
    vec3 q = oc - rd * t;
    q.y /= stretch;                      // reflections smear vertically
    float d = length(q) / (t * 0.0007 + 0.006);
    float ign = k * (1.0 + 0.8 * exp(-pow((k - 0.35) * 5.0, 2.0)));   // a flare as it catches
    acc += vec3(1.0, 0.62, 0.28) * ign * lanternFlick(i) * (exp(-d * d * 0.08) * 9.0 + exp(-d * 0.16) * 1.6 + exp(-d * 0.03) * 0.3);
  }
  return acc;
}
vec3 lanternLight(vec3 p, vec3 n) {
  vec3 acc = vec3(0);
  for (int i = 0; i < 12; i++) {
    float k = lanternK(i);
    if (k <= 0.0) continue;
    vec3 L = lanternPos(i) - p; float d2 = dot(L, L);
    acc += vec3(1.0, 0.58, 0.25) * k * sat(dot(n, L * inversesqrt(d2)) * 0.8 + 0.2) * 1.4 / (0.3 + d2);
  }
  return acc;
}

// ---------------- the boat ----------------
// boat space: bow toward +z, keel at y = -0.45, the water at y = 0 (world); the camera sits aft
vec3 boatLocal(vec3 p) {
  vec3 q = p - vec3(0.12, 0.0, 0.0);
  q.xy = rot(uBob) * q.xy;
  return q;
}
float beam(float z) { return 0.92 * (1.0 - pow(sat(z / 2.6), 2.4)) + 0.015; }
float sheer(float z) { return 0.32 + 0.42 * pow(sat(z / 2.6), 2.0); }
float boatSD(vec3 q, out int id) {
  id = 20;
  float b = sdBox(q - vec3(0.0, 0.2, 0.0), vec3(1.1, 1.2, 3.4));
  if (b > 0.2) return b;
  float B = beam(q.z);
  float sy = sqrt(sat((q.y + 0.45) / 0.75));
  float outer = (abs(q.x) - B * (0.3 + 0.7 * sy)) * 0.7;
  outer = max(outer, -0.45 - q.y);
  outer = max(outer, q.z - 2.62);
  float shell = max(abs(outer) - 0.035, q.y - sheer(q.z));
  float d = shell;
  // the gunwale: a thicker rail along the top edge
  float rail = length(vec2(abs(q.x) - B * 0.99 + 0.01, q.y - sheer(q.z) + 0.02)) - 0.045;
  rail = max(rail, q.z - 2.62);
  if (rail < d) { d = rail; id = 21; }
  // the stem post rising at the bow, curving up and forward
  float sz = 2.55 + 0.12 * sat((q.y - 0.3) / 0.8);
  float stem = sdBox(vec3(q.x, q.y - 0.35, q.z - sz), vec3(0.05, 0.62, 0.07)) - 0.015;
  if (stem < d) { d = stem; id = 21; }
  // a thwart across the boat
  float th = sdBox(q - vec3(0.0, 0.12, 0.9), vec3(B * 0.98 - 0.02, 0.035, 0.16)) - 0.008;
  if (th < d) { d = th; id = 22; }
  // the floor boards
  float fl = max(abs(q.y + 0.28) - 0.02, abs(q.x) - B * 0.55);
  fl = max(fl, q.z - 2.0);
  if (fl < d) { d = fl; id = 22; }
  // the net heaped on the thwart, sagging to the floor
  vec3 nq = q - vec3(-0.25, 0.12, 0.95);
  float heap = sdEllipsoid(nq, vec3(0.55, 0.22, 0.42));
  heap = smin(heap, sdEllipsoid(q - vec3(-0.55, 0.3, 1.35), vec3(0.3, 0.13, 0.5)), 0.15);
  if (heap < 0.1) heap += 0.06 * (fbm(q * 6.0, 4) - 0.5);
  if (heap < d) { d = heap; id = 23; }
  // the net hanging over the port side into the water, a mesh with open holes
  float xs = -beam(q.z) - 0.05 - 0.03 * sin(q.z * 7.0 + q.y * 3.0) - 0.08 * sat(-q.y);
  float sheet = abs(q.x - xs) - 0.008;
  sheet = max(sheet, max(q.y - sheer(q.z) + 0.03, -0.25 - q.y));
  sheet = max(sheet, abs(q.z - 1.3) - 0.75 + 0.15 * sin(q.y * 4.0));
  vec2 g = abs(fract(vec2(q.z, q.y) * 14.0) - 0.5);
  float hole = (0.39 - max(g.x, g.y)) / 14.0;
  float net = max(sheet, -hole);
  if (net < d) { d = net; id = 23; }
  // cork floats along the hanging net's top
  vec3 fq = vec3(q.x - beam(q.z) * -1.0 + 0.07, q.y - sheer(q.z) + 0.06, q.z);
  fq.z = mod(fq.z - 0.65, 0.3) - 0.15;
  float flo = length(fq * vec3(1.0, 1.4, 1.0)) - 0.045;
  flo = max(flo, abs(q.z - 1.3) - 0.72);
  if (flo < d) { d = flo; id = 24; }
  return d;
}
float boatMap(vec3 p, out int id) { return boatSD(boatLocal(p), id); }
float boatMarch(vec3 ro, vec3 rd, float tmax, out int id) {
  float t = 0.05;
  for (int i = 0; i < 120; i++) {
    float d = boatMap(ro + rd * t, id);
    if (d < 0.0004 * t + 0.0002) return t;
    t += d * 0.8;
    if (t > tmax) break;
  }
  id = -1; return -1.0;
}
vec3 boatNormal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0008; int i;
  return normalize(e.xyy * boatMap(p + e.xyy, i) + e.yyx * boatMap(p + e.yyx, i) + e.yxy * boatMap(p + e.yxy, i) + e.xxx * boatMap(p + e.xxx, i));
}
float boatAO(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0; int id;
  for (int i = 1; i <= 4; i++) { float h = 0.04 * float(i); o += (h - boatMap(p + n * h, id)) * s; s *= 0.7; }
  return sat(1.0 - 2.5 * o);
}
vec3 boatAlb(int id, vec3 q, out float rough) {
  rough = 0.75;
  // planks: strakes along the hull, weathered pitch-dark cedar with pale salt
  float strake = fract((q.y + 0.45) * 7.0 + 0.3 * sin(q.z * 0.8));
  vec3 wood = mix(vec3(0.20, 0.12, 0.07), vec3(0.34, 0.22, 0.13), fbm(vec2(q.z * 1.5, q.y * 20.0), 4));
  wood *= 0.8 + 0.3 * fbm(vec2(q.z * 0.6 + 4.0, floor((q.y + 0.45) * 7.0) * 3.1), 3);
  if (id == 20) wood *= mix(0.55, 1.0, smoothstep(0.0, 0.06, strake) * smoothstep(1.0, 0.94, strake));
  if (id == 21) { wood = mix(vec3(0.36, 0.25, 0.15), vec3(0.5, 0.38, 0.24), fbm(q.xz * 20.0, 3)); rough = 0.55; }
  if (id == 22) { float bd = fract(q.x * 6.0); wood = mix(vec3(0.3, 0.2, 0.12), vec3(0.42, 0.3, 0.18), fbm(vec2(q.x * 30.0, q.z * 3.0), 3)) * mix(0.6, 1.0, smoothstep(0.0, 0.05, bd)); }
  if (id == 23) {
    vec2 m = abs(fract(vec2(q.x + q.y * 0.6, q.z - q.y * 0.4) * 34.0 + 0.4 * vec2(fbm(q.xz * 5.0, 2), fbm(q.zx * 5.0 + 3.0, 2))) - 0.5);
    float cord = smoothstep(0.4, 0.47, max(m.x, m.y));
    wood = mix(vec3(0.10, 0.08, 0.06), mix(vec3(0.26, 0.21, 0.15), vec3(0.36, 0.3, 0.22), fbm(q.xz * 30.0, 2)), cord * 0.85);
    rough = 0.9;
  }
  if (id == 24) { wood = vec3(0.55, 0.36, 0.18); rough = 0.6; }
  // salt along the waterline
  wood = mix(wood, vec3(0.5, 0.48, 0.44), 0.35 * smoothstep(0.08, 0.0, abs(q.y - 0.02)) * fbm(q.xz * 12.0, 3));
  return wood;
}

// ---------------- water ----------------
float waterH(vec2 p) {
  float t = uTime;
  float h = 0.012 * sin(dot(p, vec2(0.25, 0.9)) * 1.1 - t * 0.9) + 0.006 * sin(dot(p, vec2(-0.6, 0.8)) * 2.3 - t * 1.4);
  h += 0.004 * (vnoise(p * 2.5 + vec2(t * 0.25, t * 0.15)) - 0.5);
  h += 0.0015 * (vnoise(p * 9.0 - vec2(0.0, t * 0.5)) - 0.5);
  return h;
}
vec3 waterNormal(vec2 p, float dist) {
  float e = 0.02 + dist * 0.004;
  float h = waterH(p);
  vec3 n = normalize(vec3(h - waterH(p + vec2(e, 0)), e, h - waterH(p + vec2(0, e))));
  // catspaws: patches of breeze roughen the mirror
  float cp = smoothstep(0.55, 0.8, fbm(p * 0.05 + vec2(uTime * 0.02, 0.0), 3));
  n = normalize(n + vec3(vnoise(p * 6.0 + uTime) - 0.5, 0.0, vnoise(p * 6.0 + 9.0 - uTime) - 0.5) * cp * 0.12);
  return n;
}

// light on the land, dimmed by depth into haze
vec3 shadeLand(vec3 ro, vec3 rd, float t) {
  vec3 p = ro + rd * t, n = landNormal(p, t);
  float d = p.z - shoreZ(p.x);
  vec3 sand = vec3(0.55, 0.46, 0.36);
  vec3 grass = vec3(0.16, 0.16, 0.1);
  vec3 alb = mix(sand, grass, smoothstep(3.0, 10.0, d) * (0.6 + 0.4 * fbm(p.xz * 0.2, 3)));
  alb = mix(alb, vec3(0.2, 0.18, 0.16), smoothstep(0.4, 0.8, fbm(p.xz * 0.6, 3)) * smoothstep(3.0, 8.0, d) * 0.6);
  // the sun is behind the hills: everything faces us in shade, lit by the sky and its rim
  vec3 c = alb * (vec3(0.12, 0.14, 0.26) * (0.5 + 0.5 * n.y) + hazeCol(normalize(vec3(n.x, 0.1, n.z))) * 0.08);
  c += alb * vec3(1.0, 0.6, 0.3) * sat(dot(n, SUN)) * 0.8;
  if (d < 12.0) c += alb * lanternLight(p, n);
  // wet sand at the water's edge mirrors the sky
  float wet = smoothstep(1.5, 0.0, d);
  c = mix(c, sky(reflect(rd, vec3(0, 1, 0))) * 0.35, wet * 0.5);
  float fog = 1.0 - exp(-max(t - 20.0, 0.0) * 0.0045);
  return mix(c, hazeCol(rd), fog);
}
vec3 farView(vec3 ro, vec3 rd, out float depth) {
  depth = 1e4;
  if (rd.y > 0.25) return sky(rd);
  float t = landMarch(ro, rd, 700.0);
  if (t > 0.0) { depth = t; return shadeLand(ro, rd, t); }
  return sky(rd);
}

vec3 seaScene(vec3 ro, vec3 rd) {
  // the boat
  int bid;
  float tb = boatMarch(ro, rd, 8.0, bid);
  // the water plane
  float tw = rd.y < 0.0 ? (ro.y - 0.0) / -rd.y : 1e5;
  float tl;
  vec3 col;
  if (tb > 0.0 && tb < tw) {
    vec3 p = ro + rd * tb, n = boatNormal(p);
    vec3 q = boatLocal(p);
    float rough; vec3 alb = boatAlb(bid, q, rough);
    float ao = boatAO(p, n);
    // light: the dawn sky over us, the bright water below throwing light up, the sun's rim
    vec3 amb = mix(vec3(0.5, 0.42, 0.45), vec3(0.42, 0.44, 0.62), sat(n.y)) * (0.55 + 0.45 * n.y);
    amb += vec3(1.0, 0.62, 0.38) * 0.35 * sat(-n.y + 0.2);
    amb += sky(normalize(vec3(n.x, 0.06, n.z))) * 0.35 * sat(n.z + 0.3);
    col = alb * amb * ao;
    float sl = sat(dot(n, SUN));
    col += alb * vec3(1.4, 0.82, 0.45) * sl * 1.6;
    vec3 h = normalize(SUN - rd);
    col += vec3(1.0, 0.7, 0.4) * pow(sat(dot(n, h)), 30.0) * (1.0 - rough) * 0.8 * sl;
    col += vec3(1.0, 0.75, 0.5) * pow(1.0 - sat(dot(n, -rd)), 4.0) * 0.25 * (1.0 - rough) * ao;
    col = mix(col, vec3(0.62, 0.48, 0.42), 1.0 - exp(-tb * 0.01));
    return col;
  }
  if (tw < 1e4) {
    vec3 p = ro + rd * tw;
    float fz = landH(p.xz);
    if (fz > 0.0) {
      float t = landMarch(ro, rd, 700.0);
      if (t > 0.0) return shadeLand(ro, rd, t) + lanterns(ro, rd, t, 1.0);
    }
    vec3 n = waterNormal(p.xz, tw);
    vec3 r = reflect(rd, n); r.y = abs(r.y);
    float fr = 0.02 + 0.98 * pow(1.0 - sat(dot(n, -rd)), 5.0);
    float dr;
    vec3 rc = farView(p + vec3(0, 0.01, 0), r, dr);
    rc += lanterns(p, r, dr, 6.0) * 0.8;
    // the boat's own reflection: a dark shape in the mirror
    int rb; float trb = boatMarch(p + vec3(0, 0.01, 0), r, 5.0, rb);
    if (trb > 0.0) rc = vec3(0.12, 0.08, 0.07);
    vec3 deep = vec3(0.04, 0.07, 0.08);
    col = mix(deep, rc, fr);
    // the mist lying on the water, brighter toward the sun
    float mist = 1.0 - exp(-tw * 0.008);
    col = mix(col, hazeCol(rd) * 0.7, mist * 0.45);
    col += lanterns(ro, rd, tw, 1.0);
    return col;
  }
  float d;
  col = farView(ro, rd, d);
  col += lanterns(ro, rd, d, 1.0);
  return col;
}
`;
