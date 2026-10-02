// s36's world: iron in the fire, the Church Fathers' image of theosis (the iron does not cease to be
// iron, yet glows with the fire's own light). A blacksmith's forge in the dark: a bed of coals in a
// brick hearth, glowing and breathing; a square iron bar lies across them, its far end buried in the
// fire, its near end resting on the hearth's lip. uHeat (0..1) is how far it has come: cold black
// iron with a dull blue-grey sheen, then a dark cherry red creeping out of the coals along the bar,
// orange, yellow, and at last white, the bar shining like the fire itself. Sparks rise from the coals.
// Hearth top at y = 0, bar along +x (its fire end at x > 0). Everything is a pure function of uTime.
export const FORGE_UNIFORMS = {
  uHeat: 0.0, uBreath: 0.0, uFocus: 0.9, uAper: 0.01,
};

export const FORGE_GLSL = /* glsl */ `
uniform float uHeat, uBreath, uFocus, uAper;

const vec3 BAR0 = vec3(-0.62, 0.075, 0.0);   // the bar's near end
const vec3 BAR1 = vec3(0.34, 0.03, 0.02);   // its far end, buried in the coals
const float BH = 0.017;                   // half the bar's side

// the coal bed: a mound of lumps in a firepot, hottest at its centre
const vec3 POT = vec3(0.18, 0.0, 0.0);
float coalH(vec2 xz) {
  vec2 q = xz - POT.xz;
  return 0.075 * exp(-dot(q, q) * 7.0) - 0.03;
}
// lumps of coal: voronoi cells
vec3 coalCell(vec2 xz) {
  vec2 g = xz * 26.0;
  vec2 n = floor(g), f = fract(g);
  float md = 9.0; vec2 id = vec2(0); float md2 = 9.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(i, j), r = o + hash22(n + o) * 0.8 + 0.1 - f;
    float d = dot(r, r);
    if (d < md) { md2 = md; md = d; id = n + o; } else if (d < md2) md2 = d;
  }
  return vec3(sqrt(md), sqrt(md2) - sqrt(md), hash12(id));
}
float coalSD(vec3 p) {
  vec2 q = p.xz - POT.xz;
  if (dot(q, q) > 0.5 * 0.5) return 1e9;
  if (p.y > 0.08) return p.y - 0.07;
  vec3 c = coalCell(p.xz);
  // each lump a rounded plateau of its own height, the gaps between them deep
  float h = coalH(p.xz) + 0.016 * smoothstep(0.0, 0.32, c.y) * (0.5 + 0.7 * c.z) + 0.004 * vnoise(p.xz * 140.0);
  return (p.y - h) * 0.5;
}
// the hearth: a brick table with a round firepot sunk in it, the room dark beyond
float hearthSD(vec3 p) {
  float top = p.y + 0.0;
  float table = sdBox(p - vec3(0.0, -0.4, 0.0), vec3(1.2, 0.4, 0.75));
  float pot = length(p.xz - POT.xz) - 0.48;
  float d = max(table, -max(pot, -p.y - 0.06));
  return d;
}
// the bar: a square section, a little scaled, the near end cut square
float barSD(vec3 p) {
  vec3 a = BAR1 - BAR0; float L = length(a); vec3 ax = a / L;
  vec3 q = p - BAR0;
  float s = dot(q, ax);
  vec3 r = q - ax * s;
  // the bar's cross-section axes (no roll)
  vec3 up = normalize(vec3(0.0, 1.0, 0.0) - ax * ax.y);
  vec3 sd = cross(ax, up);
  vec2 cs = vec2(dot(r, sd), dot(r, up));
  float scale = 0.0006 * vnoise(vec2(s * 60.0, cs.x * 40.0 + cs.y * 40.0));
  vec3 b = vec3(abs(cs) - BH + 0.002, abs(s - L * 0.5) - L * 0.5);
  return length(max(b, 0.0)) + min(max(b.x, max(b.y, b.z)), 0.0) - 0.002 + scale;
}
float barS(vec3 p) { vec3 a = BAR1 - BAR0; return dot(p - BAR0, a) / dot(a, a); }   // 0 near end .. 1 fire end

float mapF(vec3 p, out int id) {
  float d = min(hearthSD(p), 0.85 - p.x); id = 0;
  float c = coalSD(p); if (c < d) { d = c; id = 1; }
  float b = barSD(p); if (b < d) { d = b; id = 2; }
  return d;
}
vec3 normF(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0006;
  int i;
  return normalize(e.xyy * mapF(p + e.xyy, i) + e.yyx * mapF(p + e.yyx, i) + e.yxy * mapF(p + e.yxy, i) + e.xxx * mapF(p + e.xxx, i));
}
float marchF(vec3 ro, vec3 rd, out int id) {
  float t = 0.02;
  for (int i = 0; i < 160; i++) {
    float d = mapF(ro + rd * t, id);
    if (abs(d) < 0.0002 * t + 0.00005) return t;
    t += d * 0.9;
    if (t > 8.0) break;
  }
  id = -1; return -1.0;
}

// the colour of hot iron by temperature (0 cold .. 1 white): blackbody-ish, in linear light
vec3 heatCol(float T) {
  T = sat(T);
  vec3 c = vec3(0.0);
  c += vec3(0.6, 0.03, 0.005) * smoothstep(0.12, 0.35, T);          // dull cherry
  c += vec3(2.4, 0.42, 0.04) * smoothstep(0.3, 0.6, T);             // bright orange
  c += vec3(4.0, 2.6, 0.7) * smoothstep(0.55, 0.85, T);             // yellow
  c += vec3(2.6, 2.4, 1.8) * smoothstep(0.82, 1.0, T);              // white
  return c;
}
// the bar's temperature along it: the fire end leads, the heat creeps out toward the near end
float barT(vec3 p) {
  float s = barS(p);
  float inFire = smoothstep(0.42, 0.62, s);                          // the part lying in the coals
  float front = 1.0 - uHeat * 1.35;                                   // the glow creeping out along the bar
  float reach = smoothstep(front - 0.3, front + 0.12, s);
  float T = uHeat * (0.5 + 0.5 * smoothstep(0.0, 0.62, s)) * reach;
  return max(T, inFire * min(1.0, uHeat * 1.5));
}
// coal glow at a point on the coal bed
vec3 coalGlow(vec3 p) {
  vec3 c = coalCell(p.xz);
  vec2 q = p.xz - POT.xz;
  float core = exp(-dot(q, q) * 14.0);
  // cracks between lumps glow brightest; lumps glow at their bases and crust over on top
  float crack = smoothstep(0.08, 0.0, c.y);
  float breath = 0.75 + 0.25 * sin(uTime * 1.3 + c.z * 6.0) + 0.35 * uBreath;
  float flick = 0.8 + 0.4 * vnoise(vec2(uTime * 2.0 + c.z * 30.0, c.z * 7.0));
  float T = core * (0.45 + 0.55 * crack) * breath * flick;
  return heatCol(0.25 + 0.6 * T) * (0.25 + 0.75 * crack) * core;
}

vec3 forgeLightPos() { return POT + vec3(0.0, 0.08, 0.0); }
vec3 forgeLight() { return vec3(1.0, 0.36, 0.08) * (0.55 + 0.25 * uBreath + 0.06 * sin(uTime * 7.3) + 0.05 * vnoise(vec2(uTime * 5.0, 1.0))); }

vec3 shadeF(vec3 p, vec3 n, vec3 rd, int id) {
  vec3 v = -rd;
  vec3 col = vec3(0);
  vec3 alb; float rough; float metal = 0.0; vec3 emit = vec3(0);
  if (id == 0) {
    // old firebrick and ash
    vec2 uv = abs(n.y) > 0.6 ? p.xz : (abs(n.x) > 0.6 ? p.zy : p.xy);
    if (p.x > 0.84) uv = p.zy;
    vec2 g = uv / vec2(0.23, 0.075); g.x += 0.5 * mod(floor(g.y), 2.0);
    vec2 f = fract(g);
    float joint = smoothstep(0.06, 0.0, min(min(f.x, 1.0 - f.x) * 0.23, min(f.y, 1.0 - f.y) * 0.075) - 0.003);
    alb = vec3(0.28, 0.13, 0.08) * (0.7 + 0.5 * hash12(floor(g))) * (0.7 + 0.4 * fbm(uv * 20.0, 3));
    alb = mix(alb, vec3(0.08, 0.07, 0.065), joint * 0.7);
    // grey ash drifted round the firepot
    float ash = smoothstep(0.75, 0.48, length(p.xz - POT.xz)) * smoothstep(0.3, 0.6, fbm(p.xz * 12.0, 3));
    alb = mix(alb, vec3(0.32, 0.31, 0.3), ash * step(0.5, n.y));
    rough = 0.9;
  } else if (id == 1) {
    vec3 c = coalCell(p.xz);
    alb = vec3(0.035, 0.032, 0.03) * (0.6 + 0.8 * c.z);
    rough = 0.6;
    // ash crust on the outer lumps
    float outer = smoothstep(0.18, 0.45, length(p.xz - POT.xz));
    alb = mix(alb, vec3(0.22, 0.21, 0.2), outer * smoothstep(0.4, 0.8, fbm(p.xz * 40.0, 2)));
    emit = coalGlow(p);
  } else {
    // iron: black mill scale, flaking to grey where it has been worked
    float s = barS(p);
    float scale = fbm(p.xz * vec2(30.0, 90.0) + p.y * 40.0, 3);
    alb = mix(vec3(0.05, 0.05, 0.055), vec3(0.22, 0.22, 0.23), smoothstep(0.55, 0.75, scale));
    rough = mix(0.45, 0.3, smoothstep(0.55, 0.75, scale));
    metal = 0.7;
    float T = barT(p);
    // the scale stays a shade cooler than the iron under it: the glow is mottled, never flat
    float mott = fbm(p.xz * vec2(70.0, 160.0) + p.y * 90.0, 3);
    float flake = smoothstep(0.62, 0.78, fbm(p.xz * vec2(120.0, 260.0) + p.y * 200.0, 3));
    emit = heatCol(T * (0.9 + 0.14 * mott) - 0.05 * smoothstep(0.55, 0.75, scale)) * 0.6 * (1.0 - 0.45 * flake);
    // the edges of the bar run a little cooler than its faces
    vec3 nb = abs(n); float edge = smoothstep(0.75, 0.6, max(nb.x, max(nb.y, nb.z)));
    emit *= 1.0 - 0.3 * edge;
    // a white-hot iron loses its scale and its reflections in its own light
    metal *= 1.0 - smoothstep(0.3, 0.7, T);
  }
  col += emit;
  // the coals' light
  vec3 lp = forgeLightPos();
  vec3 L = lp - p; float d2 = dot(L, L); float dl = sqrt(d2); L /= dl;
  float nl = sat(dot(n, L) * 0.8 + 0.2);
  vec3 f0 = mix(vec3(0.04), alb, metal);
  vec3 h = normalize(L + v); float a = max(0.03, rough * rough);
  float nh = sat(dot(n, h)); float dd = nh * nh * (a * a - 1.0) + 1.0;
  vec3 lc = forgeLight() * 0.09 / (0.01 + d2);
  col += (alb * (1.0 - metal) / PI + f0 * a * a / (PI * dd * dd) * 0.25) * lc * nl;
  // and the hot bar's own light on what is near it
  if (id != 2 && uHeat > 0.05) {
    vec3 a0 = BAR0, a1 = BAR1;
    vec3 pa = p - a0, ba = a1 - a0; float hh = sat(dot(pa, ba) / dot(ba, ba));
    float s0 = max(hh, 0.0);
    vec3 cp = a0 + ba * hh; vec3 Lb = cp - p; float db2 = dot(Lb, Lb); Lb *= inversesqrt(db2);
    vec3 bc = heatCol(barT(cp)) * 0.0012 / (0.004 + db2);
    col += alb * (1.0 - metal) / PI * bc * sat(dot(n, Lb));
  }
  // a dim cool fill from a doorway far off, so the dark keeps its shapes
  col += alb * vec3(0.012, 0.016, 0.026) * (0.5 + 0.5 * n.y);
  // the iron mirrors the coals
  if (id == 2) {
    vec3 r = reflect(rd, n);
    vec3 F = f0 + (1.0 - f0) * pow(1.0 - sat(dot(n, v)), 5.0);
    float down = sat(-r.y * 2.0 + 0.3);
    col += F * (forgeLight() * 0.5 * down + vec3(0.02, 0.025, 0.04) * sat(r.y)) * (1.0 - rough * 0.6);
  }
  return col;
}

// flames licking up off the coals: a thin sheet of fire volume, marched coarsely
vec3 coalFlames(vec3 ro, vec3 rd, float depth) {
  vec3 acc = vec3(0);
  float t0 = 0.0, t1 = depth;
  // only where the ray passes over the firepot, low
  vec3 oc = POT - ro; float tc = dot(oc, rd);
  float tA = max(tc - 0.5, 0.0), tB = min(tc + 0.5, depth);
  if (tB <= tA) return acc;
  const int N = 24;
  float dt = (tB - tA) / float(N);
  float j = hash12(gl_FragCoord.xy + uFrame * 1.7);
  for (int i = 0; i < N; i++) {
    vec3 q = ro + rd * (tA + (float(i) + j) * dt);
    vec2 r = q.xz - POT.xz;
    float y = q.y - coalH(q.xz) - 0.01;
    if (y < 0.0 || y > 0.12) continue;
    float core = exp(-dot(r, r) * 12.0);
    float n = fbm(vec3(q.x * 13.0, q.y * 9.0 - uTime * 2.6, q.z * 13.0), 3);
    float k = smoothstep(0.45, 0.8, n + 0.3 * core - y * 6.0) * core * (0.4 + 0.6 * uBreath + 0.3 * uHeat);
    acc += mix(vec3(1.0, 0.45, 0.08), vec3(0.2, 0.3, 1.0) * 0.4, smoothstep(0.012, 0.0, y)) * k;
  }
  return acc * dt * 9.0;
}

// sparks: short glowing streaks rising from the coals, each on its own looping life
vec3 sparks(vec3 ro, vec3 rd, float depth) {
  vec3 acc = vec3(0);
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    float life = 0.9 + 1.2 * hash11(fi * 3.7);
    float t0 = hash11(fi * 1.3) * 4.0;
    float age = mod(uTime + t0, life + 0.6 * hash11(fi * 9.1));
    if (age > life) continue;
    float cyc = floor((uTime + t0) / (life + 0.6 * hash11(fi * 9.1)));
    float seed = fi * 17.0 + cyc * 3.1;
    vec2 o = (hash22(vec2(seed, 1.0)) - 0.5) * 0.35;
    vec3 v0 = vec3((hash11(seed * 2.1) - 0.5) * 0.5, 0.7 + 0.9 * hash11(seed * 5.3), (hash11(seed * 7.7) - 0.5) * 0.3);
    vec3 P0 = POT + vec3(o.x, 0.03, o.y * 0.6);
    // rising, slowing, drifting on the heat
    vec3 pos = P0 + v0 * age - vec3(0.0, 0.25, 0.0) * age * age + vec3(0.06 * sin(age * 3.0 + seed), 0.0, 0.0);
    vec3 vel = v0 - vec3(0.0, 0.5, 0.0) * age;
    // the streak this frame (motion blur along the velocity)
    vec3 a = pos - vel * 0.012, b = pos + vel * 0.012;
    // distance from the ray to the segment
    vec3 ba = b - a, oa = ro - a;
    float bb = dot(ba, ba), rb = dot(rd, ba), ob = dot(oa, ba), ro2 = dot(oa, rd);
    float den = bb - rb * rb;
    float s = den > 1e-8 ? sat((ob - rb * ro2) / den) : 0.0;
    vec3 q = a + ba * s;
    float tq = dot(q - ro, rd);
    if (tq < 0.0 || tq > depth) continue;
    float d = length(ro + rd * tq - q);
    float k = (1.0 - age / life);
    float w = 0.0007 * tq;
    acc += heatCol(0.6 + 0.35 * k) * k * 0.35 * exp(-d * d / (w * w)) * (0.7 + 0.6 * uBreath);
  }
  return acc;
}

vec3 forge(vec2 fc) {
  vec3 ro; vec3 rd0 = camRay(fc, ro); vec3 ro0 = ro;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  vec3 rd = normalize(fp - ro);
  int id;
  float t = marchF(ro, rd, id);
  vec3 col; float depth = 20.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t;
    col = shadeF(p, normF(p), rd, id);
    depth = t;
  } else col = vec3(0.0);
  // heat shimmer and smoke over the coals, lit from below
  {
    vec3 lp = forgeLightPos();
    vec3 oc = lp - ro; float tc = clamp(dot(oc, rd), 0.0, depth);
    vec3 q = ro + rd * tc;
    float h = length(q - lp);
    float smoke = 0.5 + 0.8 * fbm(q * 4.0 - vec3(0.0, uTime * 0.6, 0.0), 3);
    col += forgeLight() * smoke * 0.012 / (0.02 + h * h) * smoothstep(-0.05, 0.1, q.y - lp.y + 0.1);
  }
  col += coalFlames(ro, rd, depth);
  col += sparks(ro0, rd0, depth);
  return col;
}
`;
