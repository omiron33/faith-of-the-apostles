// The chasm (scene 18): the storm plain of scene 17 (lib/x-s17-years.js) torn into two halves that
// pull apart, the gap between them an abyss with layered walls. Dust pours off both lips in thin
// falling sheets and hangs in the gap, lit by the band of light and by each flash.
import { STORM_GLSL, STORM_UNIFORMS, flash } from '/song/lib/x-s17-years.js';
export { flash };
export const CHASM_UNIFORMS = { ...STORM_UNIFORMS, uFront: -50.0, uW: 0.12, uD: 45.0, uDeep: 0.16, uDust: 1.0 };

export const CHASM_GLSL = STORM_GLSL + /* glsl */ `
// falling dust in the gap: sheets close to each wall, streaked downward, drifting
vec3 chasmDust(vec3 ro, vec3 rd, float tHit) {
  if (uDust <= 0.0) return vec3(0);
  // the slab of air between the lips, from the ground plane down 25 m
  float t0 = rd.y < 0.0 ? max(0.0, (0.3 - ro.y) / rd.y) : 0.0;
  float t1 = min(tHit, rd.y < 0.0 ? (-25.0 - ro.y) / rd.y : 80.0);
  t1 = min(t1, t0 + 40.0);
  if (t1 <= t0) return vec3(0);
  const int N = 20;
  float dt = (t1 - t0) / float(N);
  float j = hash12(gl_FragCoord.xy + uJitter * 97.0);
  vec3 acc = vec3(0); float T = 1.0;
  for (int i = 0; i < N; i++) {
    float t = t0 + (float(i) + j) * dt;
    vec3 p = ro + rd * t;
    float cx = crackX(p.z);
    float half_ = crackW(p.z) + uSep * 0.5;
    float dx = p.x - cx;
    float wallD = half_ - abs(dx);                 // distance in from the nearest wall
    if (wallD < 0.0 || p.y > 0.2) continue;
    // sheets pouring off the lips: dense near the wall, streaks falling at ~4 m/s, accelerating
    float fall = p.y + uTime * 4.0 + 0.04 * p.y * p.y;
    float streak = fbm(vec2(p.z * 9.0 + sign(dx) * 7.0, fall * 0.25), 3);
    float sheet = exp(-wallD * 5.0) * smoothstep(0.45, 0.68, streak) * smoothstep(0.3, 0.6, vnoise(vec2(p.z * 2.5 + sign(dx) * 3.0, 1.0))) * smoothstep(-14.0, -1.0, p.y);
    // a general haze of dust in the gap, thicker below
    float haze = 0.006 + 0.004 * smoothstep(-2.0, -15.0, p.y);
    float dens = (sheet * 0.9 + haze) * uDust;
    vec3 L = (vec3(0.8, 0.74, 0.66) * 0.5 * exp(-max(-p.y, 0.0) * 0.2) + FLASHC * uFlash * 0.7) + vec3(0.02, 0.022, 0.03);
    float a = 1.0 - exp(-dens * dt);
    acc += T * a * L;
    T *= 1.0 - a;
  }
  return acc;
}
vec3 chasmScene(vec3 ro, vec3 rd) {
  float depth;
  vec3 c = stormScene(ro, rd, depth);
  return c + chasmDust(ro, rd, depth);
}
`;
