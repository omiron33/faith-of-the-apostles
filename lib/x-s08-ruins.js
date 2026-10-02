// A ruined colonnade under the moon (scene 08). Two rows of fluted columns run away from us across a
// paved terrace; most are broken off at different heights, a few still carry a fragment of the
// architrave, drums lie where they fell, grass grows through the slabs. Cold moonlight from high on
// the left, a low mist on the ground. One warm light, a lantern carried at walking height (no one is
// seen carrying it), passes between the columns and on into the dark: it lights their flanks, throws
// their shadows, and glows in the mist. Units: metres. Everything a pure function of uTime + uniforms.
export const RUINS_UNIFORMS = {
  uLant: [1.6, 0.85, 1.5],   // the lantern's position (scenes drive it)
  uLantK: 1.0,               // its brightness
  uAperR: 0.0, uFocusR: 8.0,
};

export const RUINS_GLSL = /* glsl */ `
uniform vec3 uLant;
uniform float uLantK, uAperR, uFocusR;
#define MOON normalize(vec3(0.75, 0.5, -0.05))
const vec3 MOONC = vec3(0.55, 0.68, 1.0);
const vec3 LANTC = vec3(1.0, 0.56, 0.22);

float sdCylY(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float sdCylX(vec3 p, float r, float h) { return sdCylY(p.yxz, r, h); }

// ---------------- the colonnade ----------------
const float ROWX = 2.6, PITCH = 2.7;
// per column: height (0 = only its base), whether it keeps its capital
vec2 colInfo(float row, float k) {
  float h = hash12(vec2(k * 1.7 + row * 13.1, row + 2.0));
  float ht = mix(1.2, 5.6, h);
  if (h < 0.18) ht = 0.0;
  bool whole = hash12(vec2(k, row * 7.0 + 1.0)) > 0.72 || (k == 3.0 && row > 0.0) || (k == 4.0 && row > 0.0);
  if (whole) ht = 6.2;
  return vec2(ht, whole ? 1.0 : 0.0);
}
int MATID;
bool CHEAP = false;
float column(vec3 q, float row, float k) {
  float bd = sdBox(q - vec3(0.0, 3.4, 0.0), vec3(0.68, 3.5, 0.68));
  if (bd > 0.25) return bd;
  vec2 ci = colInfo(row, k);
  // the base: a square plinth and a torus-ish moulding
  float d = sdBox(q - vec3(0.0, 0.18, 0.0), vec3(0.62, 0.18, 0.62)) - 0.01 + (CHEAP ? 0.0 : 0.015 * vnoise(q * 6.0));
  d = min(d, sdCylY(q - vec3(0.0, 0.42, 0.0), 0.55, 0.08) - 0.02);
  if (ci.x <= 0.0) return d;
  // the fluted shaft, tapering, in drums
  float y = q.y;
  float th = atan(q.z, q.x);
  float R = 0.47 - 0.035 * sat(y / 6.0);
  float fl = 0.018 * pow(0.5 + 0.5 * cos(th * 20.0), 0.7);
  float shaft = length(q.xz) - R + fl;
  float top = ci.x;
  float cut = y - top;
  if (ci.y < 0.5) {
    // broken: a jagged slanted fracture
    cut = y - top - 0.35 * dot(normalize(vec2(hash11(k + row), 0.6)), q.xz) - 0.18 * (fbm(q.xz * 4.0 + k, 3) - 0.5) - 0.03 * vnoise(vec2(th * 1.5, k + y));
  }
  shaft = max(shaft, max(cut, 0.5 - y));
  // the joints between drums
  float jn = abs(fract(y / 1.05 + hash11(k + row * 3.0)) - 0.5) * 1.05;
  shaft += 0.006 * smoothstep(0.02, 0.0, abs(jn - 0.52)) ;
  // chips and weather
  if (!CHEAP) shaft += 0.006 * (vnoise(q * 11.0) - 0.5) + 0.004 * vnoise(q * 31.0);
  d = min(d, shaft * 0.8);
  if (ci.y > 0.5) {
    // the capital: echinus and abacus
    vec3 c = q - vec3(0.0, top, 0.0);
    float ech = sdCylY(c - vec3(0.0, 0.14, 0.0), 0.5 + 0.12 * sat(c.y / 0.28), 0.14);
    float aba = sdBox(c - vec3(0.0, 0.36, 0.0), vec3(0.64, 0.09, 0.64));
    d = min(d, min(ech, aba) - 0.005);
  }
  return d;
}
float ruins(vec3 p) {
  MATID = 0;
  // the ground: a paved terrace at y = 0 (slab relief comes in the shading)
  float out0 = smoothstep(4.3, 6.5, abs(p.x)) + smoothstep(27.0, 30.0, p.z);
  float d = p.y + sat(out0) * (0.25 * fbm(p.xz * 0.3, 3) - 0.05);
  // the stylobate: a long step under each row
  for (int r = 0; r < 2; r++) {
    float row = float(r);
    float sx = r == 0 ? -ROWX : ROWX;
    vec3 q = p - vec3(sx, 0.0, 0.0);
    float step1 = sdBox(q - vec3(0.0, 0.08, 20.0), vec3(1.1, 0.16, 30.0));
    step1 = max(step1, -(p.z + 1.5 + 2.0 * row));     // the near end is broken away
    if (step1 < d) { d = step1; MATID = 1; }
    // the columns, repeated along z
    float k = clamp(floor(q.z / PITCH + 0.5), 0.0, 9.0);
    vec3 cq = q - vec3(0.0, 0.16, k * PITCH);
    float c = column(cq, row, k);
    if (c < d) { d = c; MATID = 2; }
  }
  // the architrave fragment on the right row's whole columns (k = 3, 4)
  vec3 aq = p - vec3(ROWX, 6.95, 3.5 * PITCH);
  float arch = sdBox(aq, vec3(0.6, 0.45, 1.75 + 0.6 * PITCH * 0.5));
  if (arch < 0.3) arch = max(arch, aq.z - 0.9 - 0.4 * fbm(aq.xy * 3.0, 3)) + 0.02 * vnoise(aq * 5.0);
  if (arch < d) { d = arch; MATID = 2; }
  // fallen drums
  vec3 f1 = p - vec3(-0.9, 0.42, 7.0); f1.xz = rot(0.9) * f1.xz;
  vec3 f2 = p - vec3(-1.3, 0.4, 12.6); f2.xz = rot(-0.4) * f2.xz;
  vec3 f3 = p - vec3(-1.4, 0.38, 3.2); f3.xz = rot(2.2) * f3.xz; f3.xy = rot(0.25) * f3.xy;
  float fd = min(sdCylX(f1, 0.44, 0.52), min(sdCylX(f2, 0.42, 0.5), sdCylX(f3, 0.42, 0.55)));
  if (fd < 0.2 && !CHEAP) {
    // fluted, chipped drums
    vec3 fq = sdCylX(f1, 0.44, 0.52) < 0.2 ? f1 : (sdCylX(f2, 0.42, 0.5) < 0.2 ? f2 : f3);
    float th = atan(fq.z, fq.y);
    fd += 0.016 * pow(0.5 + 0.5 * cos(th * 20.0), 0.7) + 0.012 * (vnoise(fq * 9.0) - 0.5) + 0.04 * smoothstep(0.6, 0.85, vnoise(fq * 2.5 + 3.0));
  }
  if (fd < d) { d = fd; MATID = 2; }
  return d;
}
float march(vec3 ro, vec3 rd, float tmax) {
  float t = 0.05;
  for (int i = 0; i < 180; i++) {
    float d = ruins(ro + rd * t);
    if (d < 0.0006 * t) return t;
    t += d;
    if (t > tmax) break;
  }
  return -1.0;
}
vec3 nrm(vec3 p) {
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(ruins(p + e.xyy) - ruins(p - e.xyy), ruins(p + e.yxy) - ruins(p - e.yxy), ruins(p + e.yyx) - ruins(p - e.yyx)));
}
float softShadow(vec3 ro, vec3 rd, float tmax, float k) {
  float res = 1.0, t = 0.02;
  CHEAP = true;
  for (int i = 0; i < 40; i++) {
    float h = ruins(ro + rd * t);
    res = min(res, k * h / t);
    t += clamp(h, 0.02, 0.5);
    if (res < 0.005 || t > tmax) break;
  }
  CHEAP = false;
  return sat(res);
}
float ao(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0;
  CHEAP = true;
  for (int i = 1; i <= 3; i++) { float h = 0.1 * float(i); o += (h - ruins(p + n * h)) * s; s *= 0.6; }
  CHEAP = false;
  return sat(1.0 - 1.6 * o);
}

// ---------------- the night sky ----------------
vec3 nightSky(vec3 rd) {
  float y = rd.y;
  vec3 c = mix(vec3(0.05, 0.075, 0.13), vec3(0.012, 0.02, 0.045), smoothstep(0.0, 0.6, y));
  float m = max(dot(rd, MOON), 0.0);
  c += MOONC * (pow(m, 12.0) * 0.18 + pow(m, 200.0) * 0.5);
  c += vec3(1.4, 1.5, 1.6) * smoothstep(0.99985, 0.9999, m) * 20.0;    // the moon's disc
  // clouds catching the moon
  vec2 uv = rd.xz / (max(y, 0.0) + 0.1);
  float cl = fbm(uv * 0.35 + vec2(uTime * 0.01, 0.0), 5);
  float dens = smoothstep(0.48, 0.8, cl) * smoothstep(0.0, 0.2, y);
  vec3 cc = mix(vec3(0.05, 0.06, 0.09), vec3(0.4, 0.46, 0.6), pow(m, 6.0) + 0.15);
  c = mix(c, cc, dens * 0.8);
  vec3 q = rd * 300.0; vec3 id = floor(q);
  float st = smoothstep(0.997, 1.0, hash13(id)) * smoothstep(0.05, 0.3, y) * (1.0 - dens);
  c += vec3(0.8, 0.85, 1.0) * st * smoothstep(0.3, 0.0, length(fract(q) - 0.5)) * 0.6;
  // far hills, a dark line
  float az = atan(rd.x, rd.z);
  float r = 0.03 + 0.03 * fbm(vec2(az * 3.0, 1.0), 4);
  c = mix(c, vec3(0.012, 0.016, 0.026), smoothstep(r + 0.002, r - 0.002, y));
  return c;
}

// ---------------- shading ----------------
vec3 ruinsScene(vec3 ro, vec3 rd) {
  float t = march(ro, rd, 60.0);
  vec3 col;
  float tEnd = t < 0.0 ? 60.0 : t;
  if (t < 0.0) col = nightSky(rd);
  else {
    vec3 p = ro + rd * t;
    int mid = MATID;
    vec3 n = nrm(p);
    vec3 alb;
    float rough = 0.8;
    if (mid == 0) {
      // the paving: big worn slabs, grass and moss in the joints
      vec2 g = p.xz * vec2(0.9, 0.75);
      vec2 cell = floor(g + vec2(0.5 * step(1.0, mod(floor(g.y), 2.0)), 0.0));
      vec2 f = fract(g + vec2(0.5 * step(1.0, mod(floor(g.y), 2.0)), 0.0));
      float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
      float joint = smoothstep(0.03 + 0.03 * vnoise(p.xz * 4.0), 0.0, edge);
      float hv = hash12(cell);
      alb = mix(vec3(0.42, 0.4, 0.37), vec3(0.6, 0.58, 0.53), hv) * (0.75 + 0.25 * fbm(p.xz * 3.0, 4));
      float missing = step(0.82, hash12(cell + 9.0));   // lost slabs: earth and grass
      float grass = max(joint, missing) * (0.6 + 0.4 * fbm(p.xz * 6.0, 3));
      alb = mix(alb, mix(vec3(0.06, 0.07, 0.035), vec3(0.14, 0.15, 0.07), fbm(p.xz * 9.0, 3)), grass);
      n = normalize(n + vec3(fbm(p.xz * 5.0, 3) - 0.5, 0.0, fbm(p.xz * 5.0 + 3.0, 3) - 0.5) * 0.15 + vec3(hash12(cell + 1.0) - 0.5, 0.0, hash12(cell + 2.0) - 0.5) * 0.12);
      alb *= 1.0 - 0.3 * smoothstep(0.6, 0.85, fbm(p.xz * 0.6 + 4.0, 3));   // damp patches
      // beyond the terrace: rough ground, dry grass and scrub
      float outside = sat(smoothstep(4.0, 5.2, abs(p.x) + 0.6 * fbm(p.xz * 0.7, 3)) + smoothstep(26.0, 29.0, p.z));
      vec3 earth = mix(vec3(0.1, 0.1, 0.07), vec3(0.22, 0.21, 0.15), fbm(p.xz * 2.0, 4));
      alb = mix(alb, earth, outside);
    } else {
      // marble gone grey and warm with age: streaks of weathering run down from the breaks
      alb = mix(vec3(0.62, 0.6, 0.56), vec3(0.78, 0.75, 0.68), fbm(p.xz * 2.0 + p.y * 0.3, 4));
      alb *= 0.8 + 0.2 * fbm(vec2(atan(p.z, p.x) * 6.0, p.y * 0.4) + p.xz, 4);
      alb = mix(alb, vec3(0.3, 0.3, 0.24), smoothstep(0.55, 0.8, fbm(p * 2.5, 4)) * 0.5);   // lichen
      alb *= 1.0 - 0.25 * smoothstep(0.6, 0.0, p.y);
      rough = 0.6;
    }
    float occ = ao(p, n);
    // the moon
    float ml = sat(dot(n, MOON));
    float msh = ml > 0.0 ? softShadow(p + n * 0.01, MOON, 30.0, 12.0) : 0.0;
    col = alb * MOONC * ml * msh * 0.55;
    col += alb * vec3(0.05, 0.07, 0.12) * occ * (0.5 + 0.5 * n.y);       // the night sky's fill
    // the lantern
    vec3 ld = uLant - p; float dl = length(ld); ld /= dl;
    float ll = sat(dot(n, ld));
    float lsh = ll > 0.0 ? softShadow(p + n * 0.01, ld, dl - 0.1, 16.0) : 0.0;
    float flick = 0.92 + 0.08 * sin(uTime * 13.0) * sin(uTime * 7.3 + 1.0);
    vec3 lant = LANTC * uLantK * flick * 1.1 / (dl * dl + 0.05);
    col += alb * lant * ll * lsh;
    vec3 h = normalize(ld - rd);
    col += lant * pow(sat(dot(n, h)), 30.0) * 0.12 * ll * lsh * (1.0 - rough);
  }
  // ground mist: thick near the paving, thin above; lit by the moon and the lantern
  float fogH = 0.9;
  float k = 0.09 * (0.6 + 0.8 * fbm(vec2(atan(rd.x, rd.z) * 6.0, uTime * 0.05), 3));
  float dens = k * exp(-max(ro.y, 0.0) / fogH);
  float fogAmt = 1.0 - exp(-dens * tEnd * (rd.y < 0.0 ? 1.0 : exp(-rd.y * tEnd * 0.4)) );
  vec3 fogC = vec3(0.07, 0.09, 0.14) + MOONC * 0.04 * pow(max(dot(rd, MOON), 0.0), 3.0);
  col = mix(col, fogC, sat(fogAmt));
  // the lantern's glow in the air (single scattering from a point light, closed form)
  vec3 lo = uLant - ro;
  float tc = dot(lo, rd);
  float hd = length(lo - rd * tc);
  hd = max(hd, 0.02);
  float te = tEnd;
  float glow = (atan((te - tc) / hd) - atan(-tc / hd)) / hd;
  float flick = 0.92 + 0.08 * sin(uTime * 13.0) * sin(uTime * 7.3 + 1.0);
  col += LANTC * uLantK * flick * glow * 0.032;
  // the flame itself, a small hot core (only when nothing stands in front of it)
  if (tc > 0.0 && tc < te) {
    float a = hd / tc;
    col += vec3(1.0, 0.75, 0.45) * uLantK * flick * (exp(-a * a * 9e4) * 30.0 + exp(-a * 400.0) * 0.8);
  }
  return col;
}
vec3 ruinsLens(vec2 fc, out vec3 ro) {
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
