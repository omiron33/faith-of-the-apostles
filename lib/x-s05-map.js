// A relief map of the Mediterranean (scene 05): the lands carved in honey limestone, the sea a
// hammered bronze plate dark with patina, set in a marble border on a table in candlelight. Lines of
// gold light run out from Jerusalem along the apostles' roads; where each lands, a small gilt dome
// rises. Map units: x = (longitude - 22) * 0.1 m, z = (latitude - 37) * 0.1 m, the plate at y = 0.
//
// Uniforms: uR0..uR6 = (progress 0..1, dome rise 0..1, light kindled 0..1) for route i.
export const ROUTES = [
  // name, lon, lat (the apostles' first sees and missions)
  ['SALAMIS', 33.9, 35.2],
  ['ANTIOCH', 36.2, 36.2],
  ['ALEXANDRIA', 29.9, 31.2],
  ['EPHESUS', 27.3, 37.9],
  ['THESSALONICA', 22.9, 40.6],
  ['CORINTH', 22.9, 37.9],
  ['ROME', 12.5, 41.9],
];
export const JERUSALEM = [35.2, 31.8];
export const toMap = (lon, lat, y = 0) => [(22 - lon) * 0.1, y, (lat - 37) * 0.1];   // east is -x, so the map reads right way round in the engine's camera

const vec = (a) => `vec2(${a[1].toFixed(2)}, ${a[2].toFixed(2)})`;

export const MAP_UNIFORMS = {
  uR0: [0, 0, 0], uR1: [0, 0, 0], uR2: [0, 0, 0], uR3: [0, 0, 0], uR4: [0, 0, 0], uR5: [0, 0, 0], uR6: [0, 0, 0],
  uFocus: 1.2, uAper: 0.0,
};

export const MAP_GLSL = /* glsl */ `
float sdCyl(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
uniform vec3 uR0, uR1, uR2, uR3, uR4, uR5, uR6;
uniform float uFocus, uAper;
const vec2 JER = vec2(${JERUSALEM[0]}, ${JERUSALEM[1]});
vec2 routeEnd(int i) {
  ${ROUTES.map((r, i) => `if (i == ${i}) return ${vec(r)};`).join('\n  ')}
  return JER;
}
vec3 routeState(int i) {
  if (i == 0) return uR0; if (i == 1) return uR1; if (i == 2) return uR2; if (i == 3) return uR3;
  if (i == 4) return uR4; if (i == 5) return uR5; return uR6;
}
vec2 toLL(vec2 xz) { return vec2(22.0 - xz.x * 10.0, xz.y * 10.0 + 37.0); }
vec2 toXZ(vec2 ll) { return vec2((22.0 - ll.x) * 0.1, (ll.y - 37.0) * 0.1); }

float sdEll(vec2 p, vec2 c, vec2 r) { vec2 q = (p - c) / r; return (length(q) - 1.0) * min(r.x, r.y); }
float sdSeg(vec2 p, vec2 a, vec2 b, float r) { vec2 pa = p - a, ba = b - a; float h = sat(dot(pa, ba) / dot(ba, ba)); return length(pa - ba * h) - r; }
// signed distance in degrees to the sea (negative = water)
float seaSD(vec2 ll) {
  float k = 0.9;
  float d = sdEll(ll, vec2(4.5, 39.0), vec2(6.0, 2.4));                 // the western basin
  d = smin(d, sdEll(ll, vec2(5.0, 42.2), vec2(3.4, 1.1)), k);         // the gulf of Lion
  d = smin(d, sdSeg(ll, vec2(-6.5, 36.0), vec2(-1.0, 36.6), 0.55), k); // Alboran, the straits
  d = smin(d, sdEll(ll, vec2(12.0, 40.0), vec2(2.4, 2.3)), k);        // the Tyrrhenian
  d = smin(d, sdEll(ll, vec2(9.0, 43.6), vec2(1.4, 0.7)), k);         // Ligurian
  d = smin(d, sdEll(ll, vec2(18.0, 34.6), vec2(6.6, 2.7)), k);        // the central sea
  d = smin(d, sdEll(ll, vec2(18.5, 31.8), vec2(3.4, 1.2)), k);        // Sidra
  d = smin(d, sdSeg(ll, vec2(12.6, 45.2), vec2(19.0, 40.6), 1.1), k);  // the Adriatic
  d = smin(d, sdSeg(ll, vec2(19.0, 40.6), vec2(19.8, 37.0), 1.1), k);  // the Ionian
  d = smin(d, sdEll(ll, vec2(25.0, 38.6), vec2(1.9, 2.4)), k);        // the Aegean
  d = smin(d, sdEll(ll, vec2(24.5, 34.6), vec2(3.0, 1.5)), k);        // south of Crete
  d = smin(d, sdEll(ll, vec2(30.4, 33.8), vec2(5.4, 2.3)), k);        // the Levantine sea
  d = smin(d, sdSeg(ll, vec2(26.4, 40.2), vec2(29.1, 41.1), 0.35), 0.3); // Marmara
  d = smin(d, sdEll(ll, vec2(34.5, 43.3), vec2(6.6, 1.9)), k);        // the Black Sea
  // islands
  float isl = sdEll(ll, vec2(14.1, 37.5), vec2(1.4, 0.55));            // Sicily
  isl = min(isl, sdEll(ll, vec2(9.0, 40.0), vec2(0.5, 1.0)));          // Sardinia
  isl = min(isl, sdEll(ll, vec2(9.1, 42.2), vec2(0.33, 0.55)));        // Corsica
  isl = min(isl, sdEll(ll, vec2(24.9, 35.25), vec2(1.5, 0.28)));       // Crete
  isl = min(isl, sdEll(ll, vec2(33.2, 35.1), vec2(1.1, 0.33)));        // Cyprus
  isl = min(isl, sdEll(ll, vec2(2.9, 39.6), vec2(0.6, 0.28)));         // Majorca
  isl = min(isl, sdEll(ll, vec2(25.3, 37.2), vec2(0.25, 0.2)));        // the Cyclades, a few
  isl = min(isl, sdEll(ll, vec2(26.2, 38.4), vec2(0.3, 0.25)));
  d = max(d, -isl);
  // a living coastline
  d += 0.35 * (fbm(ll * 0.9, 3) - 0.5) + 0.12 * (vnoise(ll * 4.0) - 0.5);
  return d;
}
// the carved relief (metres): coastal plains, mountain ranges, carved strata
float landH(vec2 ll, float sd, int oct) {
  if (sd < 0.0) return -0.004 - 0.0015 * sat(-sd * 0.5);
  float c = smoothstep(0.0, 1.4, sd);
  float r = fbm(ll * 0.5, oct);
  float ridge = 1.0 - abs(2.0 * fbm(ll * 0.8 + 3.0, oct) - 1.0);
  float mtn = 0.0;
  mtn += exp(-pow(length((ll - vec2(9.5, 46.2)) / vec2(4.5, 0.9)), 2.0));     // the Alps
  mtn += 0.7 * exp(-pow(sdSeg(ll, vec2(9.5, 44.2), vec2(16.5, 39.0), 0.0) / 0.7, 2.0));  // Apennines
  mtn += 0.8 * exp(-pow(sdSeg(ll, vec2(28.0, 37.2), vec2(37.0, 37.6), 0.0) / 1.0, 2.0)); // Taurus
  mtn += 0.7 * exp(-pow(sdSeg(ll, vec2(-5.0, 33.0), vec2(9.0, 35.5), 0.0) / 1.2, 2.0));  // Atlas
  mtn += 0.6 * exp(-pow(sdSeg(ll, vec2(19.5, 42.5), vec2(22.0, 38.0), 0.0) / 0.9, 2.0)); // Pindus
  mtn += 0.5 * exp(-pow(sdSeg(ll, vec2(35.5, 31.0), vec2(36.5, 35.5), 0.0) / 0.6, 2.0)); // Lebanon
  float h = c * (0.006 + 0.01 * r) + c * mtn * (0.014 + 0.012 * ridge);
  // the desert south: flatter, smoother
  h *= mix(1.0, 0.45, smoothstep(33.0, 30.5, ll.y));
  // carved in terraces, like a contour model: flat steps with a chiselled riser
  const float STEP = 0.0048;
  float k = h / STEP, fk = fract(k);
  h = STEP * (floor(k) + smoothstep(0.35, 1.0, fk)) + 0.0003 * (fbm(ll * 6.0, 2) - 0.5);
  return h;
}

// ---------------- routes ----------------
vec2 routeAt(int i, float f) {
  vec2 a = JER, b = routeEnd(i);
  vec2 m = (a + b) * 0.5;
  vec2 d = b - a;
  vec2 c = m + vec2(-d.y, d.x) * 0.18 * (b.x < a.x ? -1.0 : 1.0) + vec2(0.0, 0.6);
  return mix(mix(a, c, f), mix(c, b, f), f);
}
// distance (deg) from ll to the drawn part of route i; f returns the position along it
float routeDist(vec2 ll, int i, out float fAt) {
  vec3 st = routeState(i);
  fAt = 0.0;
  if (st.x <= 0.0) return 1e3;
  float best = 1e3;
  vec2 prev = routeAt(i, 0.0);
  const int N = 14;
  for (int k = 1; k <= N; k++) {
    float f1 = min(float(k) / float(N), st.x);
    vec2 cur = routeAt(i, f1);
    vec2 pa = ll - prev, ba = cur - prev;
    float h = sat(dot(pa, ba) / max(dot(ba, ba), 1e-6));
    float dd = length(pa - ba * h);
    if (dd < best) { best = dd; fAt = mix(float(k - 1) / float(N), f1, h); }
    prev = cur;
    if (f1 >= st.x) break;
  }
  return best;
}

// ---------------- domes ----------------
float domeSD(vec3 p, int i) {
  vec3 st = routeState(i);
  if (st.y <= 0.0) return 1e3;
  vec2 xz = toXZ(routeEnd(i));
  vec3 q = p - vec3(xz.x, 0.0, xz.y);
  float bnd = length(q) - 0.06;
  if (bnd > 0.02) return bnd;
  float k = st.y;
  float s = 0.75 + 0.25 * k;
  q.y -= (k - 1.0) * 0.045;             // rises out of the plate
  q /= s;
  float base = sdBox(q - vec3(0, 0.006, 0), vec3(0.016, 0.006, 0.016)) - 0.001;
  float drum = sdCyl(q - vec3(0, 0.017, 0), 0.0105, 0.006);
  float dome = max(length(q - vec3(0, 0.022, 0)) - 0.0105, 0.022 - q.y);
  float cross1 = sdBox(q - vec3(0, 0.0365, 0), vec3(0.0006, 0.0035, 0.0006));
  float cross2 = sdBox(q - vec3(0, 0.0375, 0), vec3(0.0022, 0.0006, 0.0006));
  float d = min(min(base, drum), min(dome, min(cross1, cross2)));
  return max(d * s, -p.y - 0.001);
}

// the plate: lands and sea inside a raised marble frame, on a dark walnut table
const vec2 PLC = vec2(-0.1, 0.3), PLH = vec2(2.75, 1.05);
float mapSD(vec3 p, out int id) {
  vec2 e = abs(p.xz - PLC) - PLH;
  float fr = max(e.x, e.y);
  id = 0;
  float d;
  if (fr < 0.0) {
    vec2 ll = toLL(p.xz);
    float sd = seaSD(ll);
    float h = landH(ll, sd, 4);
    d = (p.y - h) * 0.7;
    id = sd < 0.0 ? 1 : 0;
  } else d = 1e3;
  // the frame: a moulded marble band 0.1 wide, 0.035 high; beyond it the table at y = -0.02
  float band = max(fr - 0.1, -fr);
  float frame = max(band, p.y - 0.035 + 0.01 * smoothstep(0.02, 0.08, fr));
  if (frame < d) { d = frame; id = 2; }
  float table = p.y + 0.02;
  if (table < d) { d = table; id = 3; }
  for (int i = 0; i < 7; i++) { float dd = domeSD(p, i); if (dd < d) { d = dd; id = 10 + i; } }
  return d;
}
float mapMarch(vec3 ro, vec3 rd, out int id) {
  float t = 0.0;
  if (ro.y > 0.09) t = (ro.y - 0.09) / max(-rd.y, 1e-3);
  for (int i = 0; i < 160; i++) {
    float d = mapSD(ro + rd * t, id);
    if (d < 0.00012 * t + 0.00004) return t;
    t += d;
    if (t > 14.0) break;
  }
  id = -1; return -1.0;
}
vec3 mapNormal(vec3 p, float t) {
  vec2 e = vec2(0.0012 + 0.0004 * t, 0.0); int i;
  return normalize(vec3(mapSD(p + e.xyy, i) - mapSD(p - e.xyy, i), mapSD(p + e.yxy, i) - mapSD(p - e.yxy, i), mapSD(p + e.yyx, i) - mapSD(p - e.yyx, i)));
}
float mapShadow(vec3 ro, vec3 rd, float maxT) {
  float res = 1.0, t = 0.003; int id;
  for (int i = 0; i < 32; i++) {
    float h = mapSD(ro + rd * t, id);
    res = min(res, 14.0 * h / t);
    t += clamp(h, 0.003, 0.06);
    if (res < 0.01 || t > maxT) break;
  }
  return sat(res);
}
// hammered dents: the vector from the nearest hammer blow's centre (map metres)
vec2 dent(vec2 x, out float r) {
  vec2 n = floor(x), f = fract(x); float md = 8.0; vec2 mr = vec2(0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(i, j), o = hash22(n + g), rr = g + o - f; float dd = dot(rr, rr);
    if (dd < md) { md = dd; mr = rr; }
  }
  r = sqrt(md);
  return mr;
}

// the fire of the routes at a map point: a bright flickering line, its head a flare; once it has
// landed it cools to a steady gold seam
vec3 routeGlow(vec2 ll, out float core) {
  vec3 acc = vec3(0); core = 0.0;
  for (int i = 0; i < 7; i++) {
    vec3 st = routeState(i);
    if (st.x <= 0.0) continue;
    float f; float d = routeDist(ll, i, f);
    if (d > 3.0) continue;
    float landed = st.z;
    float head = exp(-pow((st.x - f) * 16.0, 2.0)) * (1.0 - landed);
    float flick = 0.75 + 0.5 * vnoise(vec2(f * 60.0 - uTime * 9.0, float(i) * 7.0));
    float w = mix(0.075, 0.045, landed);
    float line = smoothstep(w, w * 0.3, d);
    core = max(core, line);
    float fire = mix(flick * (1.0 + 2.5 * smoothstep(0.35, 0.0, st.x - f)), 0.75, landed);
    vec3 fc = mix(vec3(1.0, 0.42, 0.1), vec3(1.0, 0.7, 0.35), line);
    acc += fc * (line * 2.6 * fire + exp(-d * 6.0) * 0.16 * fire) + vec3(1.0, 0.6, 0.25) * head * (line * 14.0 + exp(-d * 4.0) * 1.2);
  }
  return acc;
}
// the lights kindled where each route lands
vec3 kindled(vec3 p, vec3 n, out vec3 direct) {
  vec3 acc = vec3(0); direct = vec3(0);
  for (int i = 0; i < 7; i++) {
    vec3 st = routeState(i);
    if (st.z <= 0.0) continue;
    vec2 xz = toXZ(routeEnd(i));
    vec3 lp = vec3(xz.x, 0.045 * st.y + 0.012, xz.y);
    vec3 dl = lp - p; float r2 = dot(dl, dl);
    float k = st.z * (0.85 + 0.15 * sin(uTime * 11.0 + float(i) * 2.0) * sin(uTime * 6.3 + float(i)));
    acc += vec3(1.0, 0.55, 0.2) * k * 0.0035 * sat(dot(n, dl * inversesqrt(r2)) * 0.8 + 0.2) / (r2 + 0.0004);
  }
  return acc;
}

const vec3 KEYP = vec3(1.6, 2.4, 3.4);     // the candle stand beyond the north edge (lon east is -x)
vec3 mapScene(vec3 ro, vec3 rd) {
  int id;
  float t = mapMarch(ro, rd, id);
  vec3 bg = vec3(0.012, 0.008, 0.006);
  if (t < 0.0) return bg;
  vec3 p = ro + rd * t, n = mapNormal(p, t);
  vec2 ll = toLL(p.xz);
  vec3 alb; float rough = 0.6, metal = 0.0;
  if (id == 0) {
    // honey limestone, carved: strata lines, chisel grain
    alb = mix(vec3(0.66, 0.57, 0.44), vec3(0.84, 0.76, 0.62), fbm(ll * 1.5, 4));
    alb *= 0.86 + 0.14 * smoothstep(0.3, 0.7, fract(p.y * 260.0));
    alb = mix(alb, vec3(0.82, 0.68, 0.48), smoothstep(33.5, 30.0, ll.y) * 0.4);   // the desert paler
    alb *= 0.9 + 0.1 * vnoise(p.xz * 400.0);
    rough = 0.75;
  } else if (id == 1) {
    // the hammered bronze sea: round dents, verdigris in the deep water, polished gold in the shallows
    float r; vec2 dv = dent(p.xz * 130.0, r);
    n = normalize(n + vec3(dv.x, 0.0, dv.y) * 0.22 * smoothstep(5.0, 1.0, t));
    float sd = seaSD(ll);
    float pat = smoothstep(0.4, 0.75, fbm(ll * 0.8 + 11.0, 4)) * smoothstep(-0.2, -1.5, sd);
    alb = mix(vec3(0.62, 0.36, 0.16), vec3(0.1, 0.22, 0.19), 0.25 + pat * 0.75);
    metal = 1.0 - pat * 0.85;
    rough = mix(0.2, 0.6, pat) + 0.08 * smoothstep(0.3, 0.5, r);
    // engraved wave lines
    float wv = sin(ll.y * 9.0 + 1.2 * sin(ll.x * 1.4));
    alb *= 0.8 + 0.2 * smoothstep(0.92, 0.98, wv);
    // a darker line where the bronze meets the stone
    alb *= 0.6 + 0.4 * smoothstep(-0.05, -0.35, sd);
  } else if (id == 2) {
    vec2 q = p.xz * 3.0;
    alb = mix(vec3(0.62, 0.58, 0.52), vec3(0.32, 0.29, 0.27), smoothstep(0.96, 0.995, 1.0 - abs(sin(q.x * 1.3 + q.y * 0.7 + 6.0 * fbm(q, 4)))));
    rough = 0.3;
  } else if (id == 3) {
    // dark walnut: long grain
    float g = fbm(vec2(p.x * 2.0, p.z * 40.0 + 3.0 * fbm(p.xz * 1.5, 3)), 4);
    alb = mix(vec3(0.05, 0.028, 0.016), vec3(0.12, 0.07, 0.04), g);
    rough = 0.35;
  } else {
    alb = vec3(1.0, 0.74, 0.36); metal = 1.0; rough = 0.25;   // gilt domes
  }
  vec3 v = -rd;
  vec3 Ld = KEYP - p; float dist = length(Ld); vec3 L = Ld / dist;
  float nl = sat(dot(n, L));
  float sh = nl > 0.0 ? mapShadow(p + n * 0.0015, L, 1.2) : 0.0;
  vec3 h = normalize(L + v);
  vec3 f0 = mix(vec3(0.04), alb, metal);
  float a = max(0.03, rough * rough);
  float nh = sat(dot(n, h));
  float D = a * a / (PI * pow(nh * nh * (a * a - 1.0) + 1.0, 2.0));
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - sat(dot(v, h)), 5.0);
  // a candle cluster: warm, falling off across the table into the dark
  vec3 key = vec3(2.6, 1.6, 0.8) * 13.0 / (dist * dist);
  vec3 col = (alb * (1.0 - metal) / PI * 3.0 + F * D * 0.3) * key * nl * sh;
  // the room: a dim warm fill, darker away from the table's centre
  float pool = exp(-dot(p.xz - vec2(-0.1, 0.1), p.xz - vec2(-0.1, 0.1)) * 0.18);
  col += alb * (1.0 - metal * 0.7) * vec3(0.05, 0.035, 0.025) * (0.6 + 0.4 * n.y) * pool;
  // the metal mirrors the dark room with the candles' glow in it
  vec3 r = reflect(rd, n);
  vec3 env = mix(vec3(0.02, 0.012, 0.008), vec3(1.6, 0.95, 0.45), pow(sat(dot(r, normalize(KEYP - p))), 6.0));
  col += env * (f0 + (1.0 - f0) * pow(1.0 - sat(dot(n, v)), 5.0)) * metal * (1.0 - rough * 0.6) * pool;
  // the routes: fire on the plate, and the light it throws
  if (id <= 2 || id >= 10) {
    float core;
    vec3 g = routeGlow(ll, core);
    col = col * (1.0 - 0.6 * core) + g * (id >= 10 ? 0.25 : 1.0) * (id == 1 ? 1.3 : 1.0);
    vec3 dk; col += alb * kindled(p, n, dk) * (1.0 + metal);
    // Jerusalem, a steady point of light
    float dj = length(ll - JER);
    col += vec3(1.0, 0.68, 0.32) * (smoothstep(0.14, 0.05, dj) * 5.0 + exp(-dj * 3.0) * 0.25);
  }
  return col;
}
// the kindled lights themselves, small flames seen in the air above the plate
vec3 flames(vec3 ro, vec3 rd, float tHit) {
  vec3 acc = vec3(0);
  for (int i = 0; i < 7; i++) {
    vec3 st = routeState(i);
    if (st.z <= 0.0) continue;
    vec2 xz = toXZ(routeEnd(i));
    vec3 lp = vec3(xz.x, 0.045 * st.y + 0.014, xz.y);
    float tl = dot(lp - ro, rd);
    if (tl < 0.0 || (tHit > 0.0 && tl > tHit + 0.01)) continue;
    float d = length(ro + rd * tl - lp) / tl;
    acc += vec3(1.0, 0.62, 0.28) * st.z * (exp(-d * d * 3e5) * 9.0 + exp(-d * 160.0) * 0.4);
  }
  return acc;
}
vec3 mapLens(vec2 fc, out vec3 ro) {
  vec3 rd = camRay(fc, ro);
  if (uAper <= 0.0) return rd;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd * (uFocus / dot(rd, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  return normalize(fp - ro);
}
`;
