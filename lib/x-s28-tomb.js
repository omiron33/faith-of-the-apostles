// s28's world: the tomb in the garden, at night. A pale limestone cliff with a low square doorway cut
// into a dressed face; a great round stone stands in a channel cut in the rock floor before it. Cold
// moonlight rakes the rock. Inside, a chamber with a bench along its right wall, and on the bench the
// grave clothes lying folded, the cloth for the head rolled up apart by itself (John 20:5-7).
// uRoll (metres) is how far the stone has rolled to the side; uGlory the light within the tomb, which
// leaks round the stone's rim while it is shut, pours out through the doorway when it opens, and
// floods toward the camera at the end. Facade plane z = 0 facing -z, ground y = 0.
// Everything is a pure function of uTime.
export const TOMB_UNIFORMS = {
  uRoll: 0.0, uGlory: 0.2, uFlood: 0.0, uFocus: 7.0, uAper: 0.02,
};

export const TOMB_GLSL = /* glsl */ `
uniform float uRoll, uGlory, uFlood, uFocus, uAper;

const vec2 DOOR = vec2(0.46, 1.32);        // doorway half width, height
const float SR = 1.02;                    // the stone's radius
const float SZ = -0.40;                   // the stone's mid-plane
const float ST = 0.17;                    // its half thickness
const vec3 GLORY = vec3(-0.15, 1.75, 2.35);  // where the light within stands (hidden above the lintel)

vec3 stoneC() { return vec3(-uRoll, SR - 0.1, SZ); }

float sdCylZ(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }

// the cliff's top edge
float cliffTop(float x) { return 3.0 + 0.2 * sin(x * 0.9 + 1.0) + 0.35 * vnoise(vec2(x * 0.9, 2.0)) + 0.9 * smoothstep(2.5, 7.0, abs(x - 0.3)); }

float rockSD(vec3 p) {
  // a quarried cliff: a broad face cut back in a few planes and ledges, weathered soft at the edges;
  // the tomb's own face dressed flat round the door
  float n = vnoise(p.xy * vec2(0.6, 0.9)) * 0.6 + vnoise(p.xy * 2.1 + 3.0) * 0.18 + vnoise(p * 6.0) * 0.035;
  float planes = 0.08 * sin(p.x * 0.8 + 1.0) - 0.06 * smoothstep(2.2, 2.6, abs(p.x)) + 0.04 * sin(p.y * 2.3 + 0.7 * sin(p.x));
  float dressed = smoothstep(2.4, 1.5, abs(p.x));
  float face = (planes + mix(0.2 * n - 0.1, 0.006 * vnoise(p.xy * 14.0), dressed) - p.z) * 0.85;
  face = smax(face, p.y - cliffTop(p.x) - 0.25 * n, 0.25);
  // the chamber and the passage into it
  float pass = sdBox(p - vec3(0.0, DOOR.y * 0.5, 0.4), vec3(DOOR.x, DOOR.y * 0.5, 0.55));
  float room = sdBox(p - vec3(0.0, 1.05, 1.95), vec3(1.45, 1.05, 1.3)) - 0.05;
  float cut = min(pass, room);
  float bench = sdBox(p - vec3(0.1, 0.33, 2.85), vec3(1.3, 0.33, 0.38)) - 0.02;
  return min(max(face, -cut), bench);
}
float groundSD(vec3 p) {
  float h = 0.06 * vnoise(p.xz * 1.3) + 0.02 * vnoise(p.xz * 5.0) + 0.006 * vnoise(p.xz * 23.0);
  float d = p.y - h;
  // the channel the stone rolls in
  float ch = max(abs(p.z - SZ) - ST - 0.05, -p.y - 0.12);
  ch = max(ch, abs(p.x + 1.3) - 2.8);
  return max(d, -ch);
}
float stoneSD(vec3 p) {
  vec3 q = p - stoneC();
  q.xy = rot(-uRoll / SR) * q.xy;     // it turns as it rolls
  float d = sdCylZ(q, SR - 0.05, ST - 0.05) - 0.05;
  d += 0.004 * vnoise(q * 6.0) + 0.015 * vnoise(q * 2.3);
  return d;
}
// the grave clothes: a long folded sheet, and the head cloth rolled up apart
float linenSD(vec3 p) {
  vec3 q = p - vec3(0.25, 0.7, 2.82);
  float fold = 0.012 * sin(q.x * 26.0 + 1.3 * sin(q.z * 9.0)) * smoothstep(0.3, 0.0, abs(q.z) - 0.1);
  float sheet = sdBox(q - vec3(0.0, 0.035 + fold, 0.0), vec3(0.6, 0.03, 0.22)) - 0.025;
  sheet = smin(sheet, sdBox(q - vec3(-0.15, 0.085, 0.02), vec3(0.3, 0.02, 0.18)) - 0.02, 0.04);
  vec3 r = p - vec3(-0.75, 0.74, 2.8);
  float roll = sdCapsule(r, vec3(0.0, 0.0, -0.13), vec3(0.0, 0.0, 0.13), 0.07) + 0.006 * sin(atan(r.y, r.x) * 7.0);
  return min(sheet, roll);
}

// the garden: dark shrubs along the top of the cliff
float bushSD(vec3 p) {
  if (p.y < 2.4 || p.z > 3.5) return 1e9;
  float cell = 0.9;
  float k = floor(p.x / cell + 0.5);
  float d = 1e9;
  for (int j = -1; j <= 1; j++) {
    float x = (k + float(j)) * cell + (hash11(k + float(j)) - 0.5) * 0.5;
    float r = 0.28 + 0.4 * hash11((k + float(j)) * 7.3) * smoothstep(1.0, 3.0, abs(x));
    vec3 c = vec3(x, cliffTop(x) + r * 0.45, 0.6 + 0.8 * hash11((k + float(j)) * 3.1));
    d = min(d, length(p - c) - r);
  }
  return d + 0.12 * vnoise(p * 7.0) + 0.05 * vnoise(p * 19.0);
}
float mapT(vec3 p, out int id) {
  float d = groundSD(p); id = 0;
  float bu = bushSD(p) * 0.7; if (bu < d) { d = bu; id = 4; }
  float r = rockSD(p); if (r < d) { d = r; id = 1; }
  float s = stoneSD(p); if (s < d) { d = s; id = 2; }
  if (p.z > 0.5) { float l = linenSD(p); if (l < d) { d = l; id = 3; } }
  return d;
}
vec3 normT(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.0015 + 0.0004 * t);
  int i;
  return normalize(e.xyy * mapT(p + e.xyy, i) + e.yyx * mapT(p + e.yyx, i) + e.yxy * mapT(p + e.yxy, i) + e.xxx * mapT(p + e.xxx, i));
}
float marchT(vec3 ro, vec3 rd, out int id) {
  float t = 0.05;
  for (int i = 0; i < 200; i++) {
    float d = mapT(ro + rd * t, id);
    if (abs(d) < 0.0006 * t) return t;
    t += d * 0.8;
    if (t > 60.0) break;
  }
  id = -1; return -1.0;
}
float shadowT(vec3 ro, vec3 rd, float tmax) {
  float res = 1.0, t = 0.03; int id;
  for (int i = 0; i < 40; i++) {
    float h = mapT(ro + rd * t, id);
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.04, 0.6);
    if (res < 0.003 || t > tmax) break;
  }
  return sat(res);
}

// how much of the light within reaches q: it must pass out through the doorway and miss the stone
float gloryVis(vec3 q) {
  if (q.z > -0.02) {
    // inside the passage or the chamber is lit; the rock face round the door is not
    bool inPass = abs(q.x) < DOOR.x + 0.03 && q.y < DOOR.y + 0.03;
    bool inRoom = q.z > 0.6 && abs(q.x) < 1.55 && q.y < 2.2;
    if (q.z > 0.0) return (inPass || inRoom) ? 1.0 : 0.0;
  }
  vec3 L = GLORY;
  vec3 d = L - q;
  // through the doorway plane z = 0
  float s = -q.z / d.z;
  vec3 a = q + d * s;
  float pen = 0.03 + 0.08 * (1.0 - s);
  float door = smoothstep(pen, -pen, max(abs(a.x) - DOOR.x, max(a.y - DOOR.y, -a.y)));
  // past the stone (its two faces)
  vec3 c = stoneC();
  float blk = 0.0;
  for (int k = 0; k < 2; k++) {
    float zz = SZ + (k == 0 ? -ST : ST);
    if (q.z < zz) {
      float s2 = (zz - q.z) / d.z;
      vec3 b = q + d * s2;
      blk = max(blk, smoothstep(0.02 + 0.05 * (1.0 - s2), -0.02, length(b.xy - c.xy) - SR));
    }
  }
  return door * (1.0 - blk);
}
// is the doorway point D seen from q, past the stone?
float gloryVisFrom(vec3 q, vec3 L) {
  vec3 d = L - q; vec3 c = stoneC(); float blk = 0.0;
  for (int k = 0; k < 2; k++) {
    float zz = SZ + (k == 0 ? -ST : ST);
    if (q.z < zz) { float s2 = (zz - q.z) / d.z; vec3 b = q + d * s2; blk = max(blk, smoothstep(0.15, -0.15, length(b.xy - c.xy) - SR)); }
  }
  return 1.0 - blk;
}
vec3 gloryCol() { return vec3(1.0, 0.86, 0.62) * uGlory; }

vec3 moonDir() { return normalize(vec3(-0.9, 0.45, -0.2)); }   // toward the moon: low, off to the side, raking the face
vec3 moonCol() { return vec3(0.6, 0.68, 0.9) * 2.6; }

vec3 skyT(vec3 rd) {
  float h = max(rd.y, 0.0);
  vec3 c = mix(vec3(0.03, 0.045, 0.09), vec3(0.008, 0.012, 0.03), pow(h, 0.6));
  c += vec3(0.25, 0.3, 0.45) * 0.12 * exp(-length(rd - moonDir()) * 2.5);
  // thin cloud, moonlit at its edges
  float cl = fbm(rd.xz / max(rd.y, 0.05) * 0.8 + vec2(uTime * 0.01, 0.0), 4);
  c = mix(c, vec3(0.06, 0.07, 0.1) * (0.6 + 0.8 * exp(-length(rd - moonDir()) * 2.0)), smoothstep(0.5, 0.8, cl) * 0.6 * smoothstep(0.0, 0.2, rd.y));
  // stars
  vec3 sd = rd * 220.0;
  vec3 cell = floor(sd); vec3 f = fract(sd) - 0.5;
  float hs = hash13(cell);
  if (hs > 0.985) { float tw = 0.7 + 0.3 * sin(uTime * (2.0 + hs * 5.0) + hs * 40.0); c += vec3(0.9, 0.92, 1.0) * smoothstep(0.25, 0.0, length(f)) * (hs - 0.985) * 120.0 * tw * smoothstep(0.0, 0.15, rd.y); }
  return c;
}

vec3 shadeT(vec3 p, vec3 n, vec3 rd, int id) {
  vec3 alb; float rough = 0.9;
  if (id == 0) {
    // the rock floor and dust, a few pebbles
    float g = vnoise(p.xz * 3.0) * 0.6 + vnoise(p.xz * 17.0) * 0.4;
    alb = mix(vec3(0.3, 0.27, 0.23), vec3(0.44, 0.4, 0.34), g);
    alb *= 0.8 + 0.3 * step(0.88, hash12(floor(p.xz * 40.0)));
  } else if (id == 1) {
    // limestone: pale and warm, streaked where rain runs down, dark lichen in the rough rock
    float g = fbm(p * 2.2, 4);
    alb = mix(vec3(0.46, 0.42, 0.35), vec3(0.66, 0.61, 0.51), g);
    float streak = fbm(vec2(p.x * 4.0, p.y * 0.35 + p.z), 3);
    alb *= 1.0 - 0.35 * smoothstep(0.45, 0.75, streak);
    float lichen = smoothstep(0.55, 0.7, fbm(p * 3.3 + 5.0, 4)) * (1.0 - smoothstep(2.2, 3.2, 3.4 - abs(p.x) + 2.0 * step(2.6, p.y)));
    alb = mix(alb, vec3(0.22, 0.21, 0.17), lichen * 0.35);
    alb *= mix(vec3(1.0), vec3(1.12, 0.98, 0.8), smoothstep(0.4, 0.7, fbm(p * 0.7 + 9.0, 3)));   // ochre iron stains
    // fine chisel marks on the dressed face
    alb *= 1.0 - 0.08 * smoothstep(0.3, 0.0, abs(fract(p.x * 9.0 + p.y * 3.0 + 2.0 * vnoise(p.xy * 3.0)) - 0.5)) * smoothstep(3.0, 2.0, abs(p.x));
    if (p.z > 0.1) alb = vec3(0.62, 0.56, 0.46) * (0.85 + 0.25 * g);
  } else if (id == 2) {
    vec3 q = p - stoneC(); q.xy = rot(-uRoll / SR) * q.xy;
    float g = fbm(q * 9.0, 3);
    alb = mix(vec3(0.47, 0.44, 0.38), vec3(0.54, 0.5, 0.43), g);
    // its face is tooled in rings round the centre
    alb *= 0.94 + 0.06 * sin(length(q.xy) * 18.0 + 2.0 * vnoise(q.xy * 4.0));
    alb *= 1.0 - 0.08 * smoothstep(0.55, 0.8, fbm(q * 1.7 + 3.0, 3));
  } else if (id == 4) {
    alb = vec3(0.05, 0.065, 0.04) * (0.7 + 0.6 * vnoise(p.xy * 20.0));
  } else {
    // linen
    alb = vec3(0.86, 0.82, 0.74); rough = 0.8;
  }
  vec3 col = vec3(0);
  // moonlight
  vec3 M = moonDir();
  float nl = sat(dot(n, M));
  if (nl > 0.0 && p.z < 0.4) col += alb / PI * moonCol() * nl * shadowT(p + n * 0.02, M, 12.0);
  // the light within
  vec3 L = GLORY - p; float d2 = dot(L, L); L *= inversesqrt(d2);
  float gl = sat(dot(n, L));
  if (gl > 0.0) {
    float v = gloryVis(p + n * 0.01);
    // inside, the bench and linen catch the light; the room's walls bounce it about
    col += alb / PI * gloryCol() * 1.6 * gl * v / (0.3 + d2);
  }
  // bounce inside the chamber (the passage and room walls only)
  if (p.z > 0.02 && p.y < 2.3 && abs(p.x) < 1.6 && (abs(p.x) < DOOR.x + 0.05 || p.z > 0.85)) col += alb * gloryCol() * 0.012 * smoothstep(0.0, 1.0, p.z);
  // while the stone is shut, light leaks out round its rim onto the rock behind it
  if (id == 1 && p.z < 0.1) {
    vec3 c = stoneC();
    float rr = length(p.xy - c.xy);
    float shut = 1.0 - smoothstep(0.05, 0.5, uRoll);
    col += alb * vec3(1.0, 0.72, 0.4) * uGlory * 0.5 * shut * exp(-max(rr - SR + 0.02, 0.0) / 0.12) * step(SR - 0.06, rr);
  }
  // the spill: the lit doorway as a soft area light on everything before it
  if (p.z < 0.0) {
    vec3 D = vec3(0.0, 0.62, 0.0);
    vec3 Ld = D - p; float dd2 = dot(Ld, Ld); Ld *= inversesqrt(dd2);
    float emit = sat(-Ld.z);   // the door shines out along -z
    col += alb / PI * gloryCol() * 2.4 * sat(dot(n, Ld)) * emit * emit / (0.3 + dd2) * gloryVisFrom(p + n * 0.02, D);
  }
  // sky fill
  col += alb * vec3(0.022, 0.028, 0.05) * (0.5 + 0.5 * n.y);
  col += alb * vec3(0.03, 0.03, 0.035) * sat(-n.y * 0.5 + 0.3);   // moonlight bounced off the ground
  return col;
}

vec3 tomb(vec2 fc) {
  vec3 ro; vec3 rd0 = camRay(fc, ro);
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  vec3 rd = normalize(fp - ro);

  int id;
  float t = marchT(ro, rd, id);
  vec3 col; float depth;
  if (t > 0.0) {
    vec3 p = ro + rd * t, n = normT(p, t);
    if (id == 1) {   // fine grain the march need not see
      vec3 b = vec3(vnoise(p.zyx * 5.3 + 1.0), vnoise(p.yxz * 5.3 + 7.1), vnoise(p * 5.3 + 3.7)) - 0.5;
      vec3 b2 = vec3(vnoise(p * 31.0), vnoise(p * 31.0 + 7.1), vnoise(p * 31.0 + 3.7)) - 0.5;
      n = normalize(n + (b * 0.06 + b2 * 0.04) * smoothstep(12.0, 4.0, t));
    }
    col = shadeT(p, n, rd, id);
    depth = t;
  } else { col = skyT(rd); depth = 80.0; }
  // the air: moonlit night haze, and the shafts of the light within pouring out of the door
  {
    float tm = min(depth, 24.0);
    const int NS = 40;
    float dt = tm / float(NS);
    float jj = hash12(gl_FragCoord.xy + uFrame * 3.1 + uJitter * 50.0);
    vec3 acc = vec3(0);
    for (int i = 0; i < NS; i++) {
      vec3 q = ro + rd * (float(i) + jj) * dt;
      if (q.z > 0.0 && (abs(q.x) > 1.5 || q.y > 2.2)) continue;   // inside the rock
      vec3 L = GLORY - q; float d2 = dot(L, L);
      float ph = 0.6 + 2.2 * pow(sat(dot(rd, -L * inversesqrt(d2))), 6.0);
      // drifting mist: the light shows as shafts and veils, not a flat fog
      float mist = 0.35 + 1.3 * smoothstep(0.35, 0.75, fbm(q * vec3(1.3, 2.2, 1.3) + vec3(uTime * 0.12, -uTime * 0.05, 0.0), 2));
      acc += gloryCol() * gloryVis(q) * ph * mist / (0.4 + d2);
    }
    float hz = 0.05 + 0.09 * uFlood;
    // the leak round the stone's rim hangs in the air as a thin ring
    {
      vec3 c = stoneC(); float tz = (SZ + ST + 0.05 - ro.z) / rd.z;
      if (tz > 0.0 && tz < depth) { vec3 q = ro + rd * tz; float rr = length(q.xy - c.xy); col += vec3(1.0, 0.7, 0.38) * uGlory * 0.35 * (1.0 - smoothstep(0.05, 0.5, uRoll)) * exp(-abs(rr - SR - 0.02) / 0.03) * step(-0.02, q.y); }
    }
    col = col * exp(-tm * 0.01) + acc * dt * hz + vec3(0.012, 0.016, 0.03) * (1.0 - exp(-tm * 0.02));
  }
  return col;
}
`;
