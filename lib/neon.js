// The filioque: a cheap neon sign planted crooked in the middle of the cathedral's nave, on two
// thin steel legs, its tubes spelling the word in a loud magenta italic. Ugly on purpose. Used by
// s21 (it buzzes on) and s22 (lightning, it sputters out, topples and is gone).
// Gothic extra (gothicShot({ extra: NEON_GLSL, uniforms: NEON_UNIFORMS, textSize, drawText: neonText })).
export const SIGN = { c: [0.4, 2.4, 13.0], hw: 1.5, hh: 0.45, tilt: -0.13 };
export const NEON_UNIFORMS = { uNeon: 0, uTopple: 0, uSignOn: 1 };
export function neonText(ctx) {
  ctx.clearRect(0, 0, 3840, 2160);
  ctx.font = 'italic 900 330px "Inter Tight"'; ctx.letterSpacing = '6px';
  const s = 'FILIOQUE';
  const w = ctx.measureText(s).width;
  ctx.fillStyle = '#fff';
  ctx.fillText(s, 1920 - w / 2, 1180);
  ctx.letterSpacing = '0px';
}
export const NEON_GLSL = /* glsl */ `
uniform float uNeon, uTopple, uSignOn;
const vec3 SG_C = vec3(${SIGN.c.join(', ')});
vec3 signLocal(vec3 p) {
  vec3 q = p - vec3(SG_C.x, 0.0, SG_C.z);
  // topple: it falls backward from its feet
  q.yz = rot(-1.45 * uTopple * uTopple) * q.yz;
  q.y -= SG_C.y;
  q.xy = rot(-(${SIGN.tilt})) * q.xy;
  return q;
}
float extraObj(vec3 p, out int id) {
  id = 60;
  if (uSignOn < 0.5) return 1e9;
  vec3 q = signLocal(p);
  float b = sdBox(q, vec3(${SIGN.hw}, ${SIGN.hh}, 0.05)) - 0.01;
  float legs = min(sdBox(q - vec3(-${SIGN.hw * 0.7}, -${SIGN.hh} - 1.0, 0.0), vec3(0.03, 1.0, 0.03)), sdBox(q - vec3(${SIGN.hw * 0.7}, -${SIGN.hh} - 1.0, 0.0), vec3(0.03, 1.0, 0.03)));
  if (legs < b) { id = 61; return legs; }
  return b;
}
Mat extraMat(int id, vec3 p, vec3 n) {
  if (id == 61) return M(vec3(0.5), 0.35, 1.0);
  vec3 q = signLocal(p);
  Mat m = M(vec3(0.02), 0.2, 0.0);
  if (abs(q.x) > ${SIGN.hw} - 0.04 || abs(q.y) > ${SIGN.hh} - 0.04) return M(vec3(0.85), 0.15, 1.0);
  if (q.z < -0.04) {
    vec2 tuv = vec2(0.5 - q.x / (2.0 * ${SIGN.hw}) * 0.5, 0.518 + q.y / (2.0 * ${SIGN.hh}) * 0.267);
    float core = smoothstep(0.4, 0.8, texture(uText, tuv).a);
    float glow = texture(uTextShade, tuv).a;
    float fl = uNeon * (0.8 + 0.2 * step(0.3, hash11(floor(uTime * 23.0))));
    m.emit = (vec3(1.0, 0.55, 0.85) * core * 6.0 + vec3(1.0, 0.06, 0.4) * glow * 1.5) * fl;
  }
  return m;
}
`;
export const neonLightPos = () => [SIGN.c[0], SIGN.c[1], SIGN.c[2] - 0.8];
