// A dark sea at night in rain (scene 34). Low over long heaving swells under a low ceiling of cloud,
// a faint pale seam where the horizon is; far out, one small warm light (a lamp on a boat, too far to
// see the boat) rising and falling with the swell, its reflection a broken gold path on the water.
// Rain falls through everything and pocks the sea. The sea is shared in kind with s27 (after Genesis 8).
// Everything a pure function of uTime and the uniforms.
export const WHY_UNIFORMS = {
  uLamp: [60.0, 2.2, 420.0],   // the light far out (y above the local water)
  uLampK: 1.0,
  uRain: 1.0,
  uWind: 0.45,
};

export const WHY_GLSL = /* glsl */ `
uniform vec3 uLamp;
uniform float uLampK, uRain, uWind;
const vec3 LAMPC = vec3(1.0, 0.55, 0.2);

// ---------------- the sea ----------------
float seaH(vec2 p, int oct) {
  float t = uTime;
  float a = 0.5 + 0.8 * uWind;
  float h = 1.1 * a * sin(dot(p, vec2(0.045, 0.1)) - t * 0.7 + 1.2 * vnoise(p * 0.015));
  h += 0.7 * a * sin(dot(p, vec2(-0.08, 0.06)) - t * 0.85 + 1.5 * vnoise(p * 0.025 + 4.0));
  if (oct > 1) h += 0.2 * a * sin(dot(p, vec2(0.17, 0.13)) - t * 1.2 + 2.0 * vnoise(p * 0.05 + 9.0));
  if (oct > 2) h += 0.5 * a * (fbm(p * 0.1 + vec2(t * 0.1, -t * 0.08), 3) - 0.5);
  if (oct > 3) h += 0.1 * a * (fbm(p * 0.45 + vec2(-t * 0.25, t * 0.2), oct - 3) - 0.5);
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

// ---------------- sky: a low ceiling, a pale seam at the horizon ----------------
vec3 horizonC(vec3 rd) { return vec3(0.030, 0.036, 0.048) + vec3(0.012, 0.010, 0.008) * pow(sat(1.0 - abs(rd.x)), 4.0); }
vec3 nightCeiling(vec3 rd) {
  vec3 hz = horizonC(rd);
  float y = max(rd.y, 0.0);
  // the seam: a thin brighter band just over the horizon where the cloud lifts
  vec3 c = hz + vec3(0.07, 0.075, 0.085) * exp(-y * 40.0);
  if (rd.y < 0.003) return c;
  vec2 uv = rd.xz / (rd.y + 0.02);
  float n = fbm(uv * 0.18 + vec2(uTime * 0.02, uTime * 0.006), 6);
  float m = fbm(uv * 0.6 - vec2(uTime * 0.04, 0.0), 4);
  vec3 cl = mix(vec3(0.014, 0.017, 0.024), vec3(0.075, 0.082, 0.10), smoothstep(0.3, 0.8, n * 0.75 + m * 0.35));
  // the lamp warms the cloud base a little above it
  vec3 ld = normalize(uLamp - uCamPos);
  cl += LAMPC * 0.012 * pow(max(dot(normalize(vec3(rd.x, 0.0, rd.z)), normalize(vec3(ld.x, 0.0, ld.z))), 0.0), 60.0) * exp(-y * 12.0) * uLampK;
  c = mix(c, cl, smoothstep(0.0, 0.06, y));
  // a hidden moon far off to the right, a cold diffuse glow through the cloud
  vec3 gd = normalize(vec3(-0.55, 0.16, 1.0));
  float gg = max(dot(rd, gd), 0.0);
  c += vec3(0.07, 0.085, 0.115) * (pow(gg, 6.0) * 0.6 + pow(gg, 40.0) * 0.5) * (0.6 + 0.6 * smoothstep(0.3, 0.8, rd.y > 0.0 ? fbm(rd.xz / (rd.y + 0.02) * 0.18 + 2.0, 4) : 0.6));
  return c;
}

// ---------------- the lamp ----------------
// where the lamp is now: riding the swell
vec3 lampPos() { vec3 l = uLamp; l.y += seaH(l.xz, 3); return l; }
vec3 lampGlow(vec3 ro, vec3 rd, float depth, float stretch, float k) {
  vec3 c = lampPos();
  vec3 oc = c - ro;
  float t = dot(oc, rd);
  if (t <= 0.0 || t > depth + 4.0) return vec3(0);
  vec3 q = oc - rd * t;
  q.y /= stretch;
  float d = length(q) / (t * 0.0006 + 0.003);
  float fl = 0.88 + 0.12 * vnoise(vec2(uTime * 5.0, 2.0));
  // a hot core, a halo swollen by the rain in the air
  return LAMPC * fl * k * uLampK * (exp(-d * d * 0.12) * 18.0 + exp(-d * 0.18) * 2.0 + exp(-d * 0.02) * 0.3);
}

// ---------------- rain ----------------
// streaks on a few cylinders around the camera, falling and slanting with the wind
vec3 rain(vec3 ro, vec3 rd, float depth) {
  float acc = 0.0; vec3 warm = vec3(0);
  vec3 lp = lampPos();
  for (int i = 0; i < 4; i++) {
    float D = 2.5 * pow(2.1, float(i));
    if (D > depth) break;
    float az = atan(rd.x, rd.z);
    float el = rd.y / length(rd.xz);
    vec2 uv = vec2(az * D, el * D);
    uv.x += uv.y * 0.18;                                   // slant
    uv.y += uTime * (7.0 + float(i));                      // fall
    vec2 cell = vec2(0.05, 0.9) * (1.0 + float(i) * 0.15);
    vec2 id = floor(uv / cell);
    vec2 f = fract(uv / cell) - 0.5;
    float h = hash12(id + float(i) * 17.0);
    float off = (hash12(id + 3.1) - 0.5) * 0.6;
    float s = smoothstep(0.1, 0.0, abs(f.x - off)) * smoothstep(0.22, 0.0, abs(f.y - off * 0.4)) * step(0.55, h);
    float w = s * (0.22 / (1.0 + float(i) * 0.5));
    acc += w;
    // drops near the lamp's line of sight catch its light
    warm += LAMPC * w * 6.0 * pow(max(dot(rd, normalize(lp - ro)), 0.0), 20000.0 / (1.0 + float(i)));
  }
  return (vec3(0.13, 0.15, 0.19) * acc + warm) * uRain;
}

vec3 whyScene(vec3 ro, vec3 rd) {
  vec3 p;
  float t = seaMarch(ro, rd, p);
  vec3 c;
  float depth = 1e4;
  if (t < 1e3) {
    depth = t;
    vec3 n = seaNormal(p, t);
    // rain rings and wind chop roughen the surface near us
    // wind waves: short crossing crests, as analytic slopes; each fades once it is smaller than a pixel
    vec2 sl = vec2(0.0);
    vec2 wd = normalize(vec2(0.35, 1.0));
    float k = 0.9, A = 0.075;
    for (int i = 0; i < 7; i++) {
      vec2 d = rot(-0.7 + 1.4 * hash11(float(i) * 3.7)) * wd;
      float ph = dot(p.xz, d) * k - uTime * sqrt(9.8 * k) + 2.0 * vnoise(p.xz * k * 0.15 + float(i) * 5.0);
      float fade = exp(-pow(t * k * 0.0012, 2.0));
      sl += d * (A * k * cos(ph)) * fade;
      k *= 1.55; A *= 0.72;
    }
    // rain pocking the surface near us
    sl += (vec2(vnoise(p.xz * 9.0 + uTime * 4.0), vnoise(p.xz.yx * 9.0 - uTime * 4.0)) - 0.5) * 0.35 * uRain * exp(-t * 0.06);
    n = normalize(n + vec3(-sl.x, 0.0, -sl.y));
    vec3 r = reflect(rd, n); r.y = abs(r.y);
    float fr = 0.02 + 0.98 * pow(1.0 - sat(dot(n, -rd)), 5.0);
    vec3 refl = nightCeiling(r) * 1.4;
    refl += lampGlow(p, r, 1e4, 1.0, 1.0) * 3.0;
    vec3 deep = vec3(0.004, 0.007, 0.010);
    float thick = sat(p.y - seaH(p.xz, 2) + 0.5);
    c = mix(deep + vec3(0.004, 0.008, 0.009) * thick, refl, fr);
    // pale foam on the swell crests
    float foam = smoothstep(0.55, 0.9, p.y + 0.1 * uWind) * smoothstep(0.5, 0.9, vnoise(p.xz * 1.3 + uTime * 0.5));
    c = mix(c, vec3(0.05, 0.055, 0.065), foam * 0.5);
    // the lamp lights the water around it, very faintly
    vec3 L = lampPos() - p; float d2 = dot(L, L);
    c += LAMPC * uLampK * 2.0 * sat(dot(n, L * inversesqrt(d2))) / (4.0 + d2);
    c = mix(c, horizonC(rd), 1.0 - exp(-t * 0.003));
  } else c = nightCeiling(rd);
  c += lampGlow(ro, rd, depth, 1.0, 1.0);
  c += rain(ro, rd, depth);
  return c;
}
`;
