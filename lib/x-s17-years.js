// The storm plain (scenes 17 and 18). Dry clay at night, cracked into curling plates, under a low
// storm deck; a band of cold light lies along the horizon under the clouds and rakes the plain. One
// great crack runs across it: in 17 it races toward the camera and widens; in 18 the two sides have
// torn apart into a chasm with layered walls, dust pouring off the lips. Lightning (a bolt in the sky
// that lights clouds and ground) on uFlash. Units: metres; the camera near z = 0 looking +z.
// Everything a pure function of uTime and the uniforms.
export const STORM_UNIFORMS = {
  uFront: 60.0,     // the crack exists beyond this z (it runs toward the camera as uFront falls)
  uW: 0.3,          // the crack's half-width where it is fully open
  uD: 1.0,          // its depth
  uSep: 0.0,        // 18: how far the two halves have pulled apart (texture moves with them)
  uFlash: 0.0,      // lightning brightness
  uBolt: [0.25, 0.42, 1.0],   // the bolt: azimuth (rad, + is screen-left), top elevation, seed
  uSheet: 0.0,      // distant flicker inside the clouds
  uDust: 0.0,       // 18: dust falling into the chasm
  uDeep: 3.0,       // how fast the light dies with depth into the crack (per metre)
  uAperS: 0.0, uFocusS: 10.0,
};

export const STORM_GLSL = /* glsl */ `
uniform float uFront, uW, uD, uSep, uFlash, uSheet, uDust, uAperS, uFocusS, uDeep;
uniform vec3 uBolt;
#define BREAK normalize(vec3(-0.35, 0.05, 1.0))
const vec3 BREAKC = vec3(0.72, 0.76, 0.9);
const vec3 FLASHC = vec3(0.8, 0.88, 1.0);

float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash11(i), hash11(i + 1.0), f); }
float fbm1(float x) { return 0.5 * n1(x) + 0.25 * n1(x * 2.1 + 3.0) + 0.125 * n1(x * 4.3 + 7.0) + 0.0625 * n1(x * 8.7 + 1.0); }

// ---------------- the crack ----------------
float crackX(float z) { return 0.9 * sin(z * 0.11 + 0.3) + 0.35 * sin(z * 0.37 + 2.0) + 0.25 * (fbm1(z * 1.3) - 0.5); }
// half-width at z, and the two jagged edges (left offset, right offset)
float crackW(float z) {
  float open = smoothstep(uFront, uFront + 2.5, z) * (0.4 + 0.6 * smoothstep(uFront, uFront + 20.0, z));
  return uW * open * smoothstep(120.0, 70.0, z);
}
vec2 jag(float z, float w) {
  float s = 0.18 * min(w, 0.6) + 0.05 * step(0.001, w);
  return vec2((fbm1(z * 3.1 + 11.0) - 0.5) * 2.0 * s + (n1(z * 17.0) - 0.5) * 0.04, (fbm1(z * 2.9 + 37.0) - 0.5) * 2.0 * s + (n1(z * 15.0 + 5.0) - 0.5) * 0.04);
}
// the plates of dried clay: distance to the nearest small crack, and the plate id
vec2 plates(vec2 q) {
  vec2 w = q + 0.15 * vec2(vnoise(q * 1.7), vnoise(q * 1.7 + 9.0));
  return voronoiEdge(w * 2.2);
}
float DETAILK = 1.0;
float SIDE;   // -1 left of the crack, +1 right (texture coordinates move apart with uSep)
float ground(vec2 p, bool detail, out float inCrack) {
  float cx = crackX(p.y);
  float dx = p.x - cx;
  SIDE = dx < 0.0 ? -1.0 : 1.0;
  float w = crackW(p.y);
  vec2 j = jag(p.y, w);
  float wl = w + uSep * 0.5 + j.x, wr = w + uSep * 0.5 + j.y;
  float into = min(dx + wl, wr - dx);    // > 0 inside the crack
  inCrack = into;
  vec2 tq = p - vec2(-SIDE * uSep * 0.5, 0.0);
  float h = 0.06 * (fbm(tq * 0.15, 3) - 0.5) + 0.03 * fbm(tq * 0.6, 2);
  // the lips sag toward the crack a little
  h -= 0.05 * smoothstep(0.6, 0.0, -into) * step(0.001, w + uSep);
  if (detail) {
    vec2 pl = plates(tq);
    h += DETAILK * 0.008 * smoothstep(0.0, 0.025, pl.x) - 0.004 * hash12(vec2(pl.y, 3.0)) + 0.003 * smoothstep(0.2, 0.04, pl.x) * smoothstep(0.0, 0.03, pl.x) + 0.0015 * vnoise(tq * 40.0);
  }
  if (into > -0.02 && w + uSep > 0.0005) {
    float D = uD * min(1.0, (w + uSep * 0.5) * 4.0);
    // near-vertical walls, a little broken, the floor lost in the dark
    float k = smoothstep(-0.02, 0.05 + 0.03 * n1(p.y * 9.0), into);
    h -= D * k;
  }
  return h;
}

// ---------------- sky ----------------
float boltDist(vec3 rd, float seed, float az0, float elTop, out float elOut) {
  float el = asin(clamp(rd.y, -1.0, 1.0));
  float az = atan(rd.x, rd.z);
  elOut = el;
  if (el > elTop || el < -0.02) return 1e3;
  float u = (elTop - el) / elTop;
  float a = az0 + 0.05 * (fbm1(u * 6.0 + seed * 13.0) - 0.5) + 0.016 * (fbm1(u * 30.0 + seed * 7.0) - 0.5) + 0.03 * u * (seed - 0.5);
  float d = abs(az - a) * cos(el);
  // a branch
  if (u > 0.3 && u < 0.75) {
    float ub = (u - 0.3) / 0.45;
    float ab = a + ub * 0.06 * sign(seed - 0.4) + 0.01 * (fbm1(ub * 20.0 + seed) - 0.5);
    d = min(d, abs(az - ab) * cos(el) + 0.0008 * ub);
  }
  return d;
}
vec3 stormSky(vec3 rd) {
  float y = rd.y;
  float az = atan(rd.x, rd.z);
  // the band of cold light under the deck
  vec3 fl = normalize(vec3(rd.x, 0.0, rd.z));
  float s = sat(dot(fl, BREAK));
  float band = smoothstep(0.05, 0.0, y) * (0.45 + 0.55 * pow(s, 3.0));
  vec3 c = mix(vec3(0.03, 0.035, 0.05), BREAKC * 0.75, band);
  c = mix(c, vec3(0.012, 0.014, 0.022), smoothstep(0.02, 0.5, y));
  // the storm deck: heavy, rolling, warped; lit on the edges that face the band of light
  vec2 uv = rd.xz / (max(y, 0.0) + 0.05) * 0.16 + vec2(uTime * 0.012, uTime * 0.004);
  vec2 wq = vec2(fbm(uv * 1.3, 4), fbm(uv * 1.3 + 5.2, 4));
  float cl = fbm(uv + 0.9 * wq, 6);
  float clL = fbm(uv + 0.9 * wq - BREAK.xz * 0.06, 5);
  float lit = sat((cl - clL) * 7.0 + 0.35);
  float dens = smoothstep(0.3, 0.6, cl) * smoothstep(0.008, 0.06, y);
  float belly = smoothstep(0.5, 0.78, cl);
  vec3 cc = mix(vec3(0.06, 0.065, 0.085), vec3(0.018, 0.02, 0.028), belly);
  cc += BREAKC * (0.55 * lit * (1.0 - belly) + 0.1) * (0.35 + 0.65 * pow(s, 2.0)) * smoothstep(0.55, 0.03, y);
  c = mix(c, cc, dens);
  // lightning inside the clouds: the bolt's own glow, and sheet flicker far off
  float el;
  float bd = boltDist(rd, uBolt.z, uBolt.x, uBolt.y, el);
  float ang = length(vec2((az - uBolt.x) * cos(el), el - uBolt.y * 0.95));
  float inner = exp(-ang * 4.0) * (0.4 + 0.6 * cl) * smoothstep(0.02, 0.15, y);
  c += FLASHC * uFlash * (inner * 1.6 + 0.12 * dens + 0.06);
  float sheetAt = exp(-pow((az + 0.6) * 1.5, 2.0)) * smoothstep(0.02, 0.2, y) * cl;
  c += FLASHC * uSheet * sheetAt * 0.7;
  // the bolt itself
  if (uFlash > 0.02 && bd < 0.05) {
    float core = exp(-bd * bd * 2.5e6) * 30.0 + exp(-bd * 600.0) * 1.5 + exp(-bd * 90.0) * 0.25;
    c += FLASHC * core * uFlash * smoothstep(-0.02, 0.01, el);
  }
  return c;
}

// ---------------- the plain ----------------
float stormMarch(vec3 ro, vec3 rd, out float inCrack) {
  float t = 0.05, lastSt = 0.0;
  inCrack = -1.0;
  for (int i = 0; i < 260; i++) {
    vec3 p = ro + rd * t;
    float ic;
    float h = ground(p.xz, false, ic);
    float d = p.y - h;
    if (d < 0.001 * t) {
      // refine: a long step can carry the ray through a crack wall; bisect back to the surface
      if (d < -0.01) {
        float ta = t - lastSt, tb = t;
        for (int k = 0; k < 8; k++) {
          float tm = 0.5 * (ta + tb);
          vec3 pm = ro + rd * tm;
          float icm;
          if (pm.y - ground(pm.xz, false, icm) < 0.0) { tb = tm; ic = icm; } else ta = tm;
        }
        t = tb;
      }
      inCrack = ic; return t;
    }
    float st = d * 0.5;
    if (ic > -0.3 && p.y < 0.08 && uW + uSep > 0.001) st = min(st, max(0.02, 0.25 * (crackW(p.z) + uSep * 0.5)));
    lastSt = max(st, 0.003 * t);
    t += lastSt;
    if (t > 400.0 || (p.y > 4.0 && rd.y > 0.0)) break;
  }
  if (ro.y + rd.y * t < 0.0) { inCrack = 1.0; return t; }
  return -1.0;
}

vec3 stormScene(vec3 ro, vec3 rd, out float depth) {
  float ic;
  float t = stormMarch(ro, rd, ic);
  vec3 sky = stormSky(rd);
  depth = 400.0;
  if (t < 0.0) return sky;
  depth = t;
  vec3 p = ro + rd * t;
  float e = max(0.004, 0.0015 * t);
  float d0, d1;
  DETAILK = smoothstep(22.0, 4.0, t);
  float h0 = ground(p.xz, true, d0);
  float side = SIDE;
  vec3 n = normalize(vec3(h0 - ground(p.xz + vec2(e, 0.0), true, d1), e, h0 - ground(p.xz + vec2(0.0, e), true, d1)));
  SIDE = side;
  vec2 tq = p.xz - vec2(-SIDE * uSep * 0.5, 0.0);
  vec2 pl = plates(tq);
  // clay: ochre-grey, paler on the plate tops, dark in the small cracks
  vec3 alb = mix(vec3(0.30, 0.25, 0.19), vec3(0.46, 0.4, 0.31), fbm(tq * 0.8, 3));
  alb *= 0.85 + 0.3 * hash12(vec2(pl.y, 1.0)) * 0.5;
  alb *= 0.8 + 0.4 * fbm(tq * 9.0, 3);
  alb *= 0.7 + 0.6 * fbm(tq * 0.06 + 3.0, 4);                                   // broad tonal patches
  alb = mix(alb, vec3(0.62, 0.6, 0.55), smoothstep(0.62, 0.8, fbm(tq * 0.18 + 9.0, 4)) * 0.35);   // salt
  alb = mix(alb, vec3(0.05, 0.04, 0.03), smoothstep(0.022, 0.0, pl.x) * smoothstep(26.0, 4.0, t));
  float below = -p.y;   // depth into the crack
  // the crack walls: layered strata with ledges and runnels, darker with depth
  if (below > 0.08) {
    float yy = p.y + 0.4 * fbm(p.xz * 0.3, 2);
    float strata = fbm(vec2(yy * 1.6, p.z * 0.08), 4);
    float band = smoothstep(0.3, 0.7, fract(yy * 0.7 + 0.4 * strata));
    alb = mix(vec3(0.16, 0.13, 0.1), vec3(0.46, 0.38, 0.28), strata) * (0.55 + 0.45 * band);
    alb *= 0.8 + 0.2 * vnoise(vec2(p.z * 1.2, yy * 0.15));
    // rough rock: a 3D bump, ledges where the bands change
    vec3 bp = vec3(p.x * 2.0, yy * 2.5, p.z * 2.0);
    vec3 bump = vec3(fbm(bp, 3) - 0.5, 0.0, fbm(bp + 7.0, 3) - 0.5);
    float ledge = smoothstep(0.08, 0.0, abs(fract(yy * 0.7 + 0.4 * strata) - 0.3));
    n = normalize(vec3(-SIDE, 0.0, 0.0) + bump * 0.9 + vec3(0.0, 0.9 * ledge, 0.0));
  }
  float aoK = exp(-max(below, 0.0) * uDeep);
  // the lips of the crack catch the light: a pale broken rim
  float lip = smoothstep(-0.12, -0.01, ic) * smoothstep(0.05, -0.01, ic) * step(0.0005, crackW(p.z) + uSep) * step(-0.03, p.y);
  alb = mix(alb, alb * 1.6 + 0.04, lip * 0.7);
  // raking cold light from the band on the horizon
  vec3 Lb = normalize(vec3(BREAK.x, 0.22, BREAK.z));
  float nb = sat(dot(n, Lb));
  vec3 col = alb * BREAKC * nb * 1.1 * aoK;
  col += alb * vec3(0.07, 0.08, 0.11) * (0.5 + 0.5 * n.y) * aoK;        // the dark sky's fill
  // the flash: light from the bolt's direction, very bright, hard
  vec3 Lf = normalize(vec3(sin(uBolt.x), 0.45, cos(uBolt.x)));
  float nf = sat(dot(n, Lf));
  col += alb * FLASHC * uFlash * (nf * 2.2 + 0.35) * mix(aoK, 1.0, 0.25);
  col += alb * FLASHC * uSheet * 0.12 * (0.5 + 0.5 * n.y);
  // a faint sheen where the light grazes the plates
  col += BREAKC * pow(sat(dot(reflect(rd, n), Lb)), 20.0) * 0.08 * aoK;
  // dust in the air: thin, lifting toward the horizon
  float fog = 1.0 - exp(-t * 0.012);
  vec3 fogC = mix(vec3(0.03, 0.035, 0.05), BREAKC * 0.45, pow(sat(dot(normalize(vec3(rd.x, 0.0, rd.z)), BREAK)), 3.0) * 0.6) + FLASHC * uFlash * 0.15;
  fogC *= exp(-max(below, 0.0) * 0.15);
  col = mix(col, fogC, fog * 0.85);
  return col;
}
vec3 stormLens(vec2 fc, out vec3 ro) {
  vec3 rd = camRay(fc, ro);
  if (uAperS <= 0.0) return rd;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd * (uFocusS / dot(rd, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAperS;
  return normalize(fp - ro);
}
`;

// a double flash starting at t0 (shape as the film's own lightning)
export const flash = (t, t0, k = 1) => { const x = t - t0; return x < 0 ? 0 : k * (0.9 * Math.exp(-x * 9) + (x > 0.18 ? 0.55 * Math.exp(-(x - 0.18) * 7) : 0)); };
