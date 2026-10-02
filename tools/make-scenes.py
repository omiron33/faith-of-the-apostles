"""Write every scene module and its lyric module from the spec table below (the film's plan).
Each scene is one shot in one of the two worlds: 'sb' (Spilled Blood, Three.js) or 'g' (the Gothic
cathedral, raymarched). cam is JS for (p, t) => ({ pos, target, fov, ... }); lyric is JS for the
body of (ctx, t, P, lines) => {...}. Scenes listed in KEEP are hand-written and left alone."""
import os
KEEP = {'s21-error', 's22-reject', 's02-road', 's04-sea', 's05-map', 's06-succession', 's08-ruins', 's15-shores', 's17-years', 's18-cracks', 's27-descent', 's28-tomb', 's34-why', 's35-complete', 's36-theosis', 's31-road2', 's12-nave', 's23-held'}

def sb(cam, **o): return dict(world='sb', cam=cam, **o)
def g(cam, **o): return dict(world='g', cam=cam, **o)

V = "verse(ctx, t, P, lines, {%s});"
SPEC = {
  # intro: darkness, then the Gothic nave lit by one bank of votives kindling, title
  's00-title': g("({ pos: [0.8, 1.0 + 0.6 * p, 2.0 + 3.0 * p], target: [-0.6, 3.0 + 4.0 * p, 30], fov: 50 })",
                 uniforms="uVotive: [-3.1, 0.0, 9.2]", update="u.uMoonCol.value.set(...[4.6, 5.4, 7.2].map((v) => v * ease.inOut3(Math.min(1, Math.max(0, (t - 1.0) / 7.0)))));", drift="0.004",
                 exposure="2.6", post="({ fade: 0 })",
                 lyric="""const k = ease.out3(clamp01((t - 2.2) / 1.6)) * outFade(t, P.to - 0.6, P.to);
  if (k <= 0) return;
  note(ctx, 'THE', 1920, 860, { px: 70, align: 'center', alpha: 0.85 * k, track: 0.6 });
  shout(ctx, [{ w: 'FAITH', start: 2.4 }, ], t, { cx: 1920, y: 1240, big: 360, alpha: k });
  note(ctx, 'OF THE APOSTLES', 1920, 1420, { px: 90, align: 'center', alpha: 0.9 * k, track: 0.45, color: '255, 172, 72' });"""),
  # "Come and see" x2: from the dark west door into Spilled Blood
  's01-doors': sb("({ pos: [0.3, 1.6, -22 + 9 * p], target: [0, 5.5, 10], fov: 52 })", fillK="(t) => 0.25 + 0.75 * Math.min(1, Math.max(0, (t - 12) / 9))",
                  lyric=V % "x: 1920, y: 1700, px: 230, align: 'center', group: 1, italic: true"),
  's02-road': g("({ pos: [-1.6, 1.3, 6 + 5 * p], target: [1.5, 7.0, 40], fov: 46 })", uniforms="uVotive: [3.1, 0.0, 16.2]",
                lyric="verse(ctx, t, P, lines, { x: 3580, y: 1300, px: 230, align: 'right', group: 2, gap: 1.2 });"),
  's03-lamp': g("({ pos: [-2.2 + 0.25 * p, 1.05, 7.6 + 0.3 * p], target: [-3.1, 0.75, 9.3], fov: 34, focus: 1.9 })", uniforms="uVotive: [-3.1, 0.0, 9.2], uAperG: 0.03",
                lyric=V % "x: 3580, y: 820, px: 200, align: 'right', group: 2, gap: 1.25"),
  's04-sea': sb("({ pos: [-9, 2.0, -10 + 6 * p], target: [-9, 6, 8], fov: 58 })",
                lyric=V % "x: 1920, y: 1640, px: 175, align: 'center', group: 1"),
  's05-map': g("({ pos: [6.9, 1.4, 4 + 7 * p], target: [6.6, 3.5, 40], fov: 52 })", uniforms="uVotive: [5.9, 0.0, 16.0]",
               lyric=V % "x: 260, y: 1660, px: 165, align: 'left', group: 1"),
  's06-succession': sb("({ pos: [0, 13 - 1.5 * p, -12 + 1.5 * p], target: [0, 4 + 2 * p, 8], fov: 54 })",
                       lyric="verse(ctx, t, P, lines, { x: 260, y: 1500, px: 200, align: 'left', group: 2, gap: 1.25 });"),
  's07-kings': g("({ pos: [1.2, 1.1 + 0.5 * p, -2.0 + 4.5 * p], target: [-0.4, 6.5 + 0.8 * p, 30.0], fov: 52 })", uniforms="uVotive: [-3.1, 0.0, 9.2]",
                 lyric=V % "x: 260, y: 1500, px: 190, align: 'left', group: 2, gap: 1.35"),
  's08-ruins': g("({ pos: [0.0, 0.6 + 4.0 * p, 30 + 6 * p], target: [0.0, 9.0 + 4 * p, 62], fov: 50 })", uniforms="uVotive: [-3.1, 0.0, 9.2], uGlass: [0.5, 0.62, 1.0]",
                 lyric=V % "x: 1920, y: 1560, px: 200, align: 'center', group: 2, gap: 1.3"),
  's09-font': sb("({ pos: [0, 1.8 + 1.0 * p, 0.01], target: [0.0, 30, 0.02], fov: 70, roll: 0.5 * p })",
                 lyric="verse(ctx, t, P, lines, { x: 1920, y: 1180, px: 280, align: 'center', groups: [1, 1, 1, 2], gap: 1.2 });"),
  's10-faith': None,
  's11-fathers': sb("({ pos: [-2.5, 1.6 + 1.5 * p, -12 + 2 * p], target: [1.5, 7 + 2 * p, 10], fov: 50 })",
                    lyric="shout(ctx, lines[0].words, t, { cx: 1920, y: 1060, big: 360, alpha: outFade(t, P.to - 0.2, P.to) });\n  shout(ctx, lines[1].words, t, { cx: 1920, y: 1620, big: 360, alpha: outFade(t, P.to - 0.2, P.to) });"),
  's12-nave': sb("({ pos: [-9 + 4 * p, 1.6, -9 + 9 * p], target: [-2 + 4 * p, 5, 12], fov: 56 })",
                 lyric=V % "x: 3580, y: 1500, px: 190, align: 'right', group: 2, gap: 1.3"),
  's13-holy': sb("({ pos: [0, 2.0, 0.01], target: [0.0, 30, 0.02], fov: 74, roll: 1.2 * p })", fill="5.5",
                 lyric="verse(ctx, t, P, lines, { x: 1920, y: 1180, px: 290, align: 'center', group: 1 });"),
  's14-mighty': sb("({ pos: [3.0 * Math.cos(2.2 + 0.8 * p), 2.4, 6.5 + 3.0 * Math.sin(2.2 + 0.8 * p)], target: [0, 4.5, 8], fov: 50 })",
                   lyric="verse(ctx, t, P, lines.slice(0, 3), { x: 260, y: 860, px: 210, align: 'left', group: 3, gap: 1.3 });\n  verse(ctx, t, P, lines.slice(3), { x: 1920, y: 1880, px: 240, align: 'center', group: 1 });"),
  # the schism: cold moonlight only, the votives out
  's15-shores': g("({ pos: [3.6, 2.2, 20 - 6 * p], target: [-3.6, 3.0, 4 - 6 * p], fov: 48 })", uniforms="uVotiveOn: 0, uMoonCol: [5.5, 6.6, 9.0], uAmb: [0.1, 0.12, 0.18]",
                  lyric=V % "x: 3580, y: 1520, px: 190, align: 'right', group: 2, gap: 1.3", post="({ saturation: 0.75 })"),
  's16-thrones': g("({ pos: [0.0, 11.0 - 2 * p, 4 + 4 * p], target: [0.0, 0.0, 14 + 4 * p], fov: 50 })", uniforms="uVotiveOn: 0, uMoonCol: [5.5, 6.6, 9.0], uAmb: [0.1, 0.12, 0.18]",
                   lyric=V % "x: 1920, y: 1480, px: 210, align: 'center', group: 2, gap: 1.3", post="({ saturation: 0.75 })"),
  's17-years': g("({ pos: [-3.6, 1.5, 30 - 8 * p], target: [3.0, 6.0, 4], fov: 50 })", uniforms="uVotiveOn: 0, uMoonCol: [5.5, 6.6, 9.0], uAmb: [0.1, 0.12, 0.18]",
                 flash="lightning(t, lines[3].words.find((w) => /ten/i.test(w.w)).start)",
                 lyric=V % "x: 260, y: 1520, px: 190, align: 'left', group: 2, gap: 1.3" + """
  const y0 = 800, y1 = 1054; const k = clamp01((t - P.from) / (lines[3].words.at(-1).end - P.from));
  note(ctx, 'A.D. ' + Math.round(y0 + (y1 - y0) * ease.inOut3(k)), 3580, 420, { px: 64, align: 'right', alpha: 0.85, color: '196, 214, 232' });""",
                 post="({ saturation: 0.75 })"),
  's18-cracks': g("({ pos: [0.0, 1.0, 44 - 10 * p], target: [0.0, 12.0, 10], fov: 56, roll: 0.03 })", uniforms="uVotiveOn: 0, uMoonCol: [5.5, 6.6, 9.0], uAmb: [0.1, 0.12, 0.18]",
                  flash="lightning(t, lines[0].start) + lightning(t, lines[2].start, 0.7)",
                  lyric=V % "x: 1920, y: 1560, px: 200, align: 'center', group: 2, gap: 1.3", post="({ saturation: 0.75 })"),
  's19-slab': g("({ pos: [2.6, 1.2, 4.0 + 3 * p], target: [-3.1, 0.9, 9.2], fov: 42, focus: 6.5 })", uniforms="uVotive: [-3.1, 0.0, 9.2], uAperG: 0.02",
                lyric=V % "x: 3580, y: 900, px: 200, align: 'right', group: 2, gap: 1.3"),
  's20-edge': g("({ pos: [-2.55, 0.95 + 0.05 * p, 8.5 + 0.2 * p], target: [-3.0, 0.82, 9.35], fov: 30, focus: 0.95 })", uniforms="uVotive: [-3.1, 0.0, 9.2], uAperG: 0.025, uMoonCol: [3.0, 3.6, 5.0]",
                lyric=V % "x: 3580, y: 1560, px: 190, align: 'right', group: 2, gap: 1.3"),
  # after the rejection: the faith held, back in Spilled Blood
  's23-held': sb("({ pos: [0, 6 - 2 * p, -9 + 3 * p], target: [0, 9 - 2 * p, 10], fov: 56 })",
                 lyric=V % "x: 260, y: 1500, px: 190, align: 'left', group: 2, gap: 1.3"),
  's24-trinity': sb("({ pos: [0, 13 - 0.8 * p, -12 + 0.8 * p], target: [0, 5 + 1.5 * p, 8], fov: 46 })",
                    lyric=V % "x: 1920, y: 1640, px: 210, align: 'center', group: 2, gap: 1.25"),
  's25-councils': sb("({ pos: [-9 + 0.5 * p, 2, -10 + 9 * p], target: [-9 + 4 * p, 7, 8], fov: 54 })",
                     lyric=V % "x: 3580, y: 1420, px: 190, align: 'right', group: 2, gap: 1.3"),
  's26-theotokos': sb("({ pos: [0, 1.6 + 1.5 * p, 2 + 2 * p], target: [0, 9 + 2 * p, 14], fov: 50 })",
                      lyric=V % "x: 260, y: 1560, px: 200, align: 'left', group: 2, gap: 1.3"),
  's27-descent': sb("({ pos: [0, 12 - 9 * p, 0.01], target: [0.0, -10, 0.02 + 12 * p], fov: 66 })", fillK="(t) => 1.0 + 0.6 * Math.sin(Math.min(1, Math.max(0, (t - P.from) / (P.to - P.from))) * Math.PI)",
                    lyric=V % "x: 1920, y: 1700, px: 200, align: 'center', group: 2, gap: 1.2"),
  's28-tomb': sb("({ pos: [0, 1.6, 2 + 1.5 * p], target: [0, 3 + 4 * p, 14], fov: 52 })", fillK="(t) => 0.6 + 1.2 * Math.max(0, Math.min(1, (t - lines[1].start) / 2.0))",
                 lyric=V % "x: 3580, y: 1480, px: 200, align: 'right', group: 2, gap: 1.3"),
  's29-faith2': sb("({ pos: [0, 13 - 2 * p, -12 + 3 * p], target: [0, 4 + 3 * p, 8], fov: 56 })", fill="5.5",
                   lyric="shout(ctx, lines[0].words, t, { cx: 1920, y: 1100, big: 400, alpha: outFade(t, P.to - 0.2, P.to) });\n  shout(ctx, lines[1].words, t, { cx: 1920, y: 1700, big: 380, alpha: outFade(t, P.to - 0.2, P.to) });"),
  's30-fathers2': sb("({ pos: [2.5, 1.6, -13 + 2 * p], target: [-1.5, 6, 10], fov: 50 })", fill="5.5",
                     lyric="shout(ctx, lines[0].words, t, { cx: 960, y: 1500, big: 360, alpha: outFade(t, P.to - 0.2, P.to) });\n  shout(ctx, lines[1].words, t, { cx: 2900, y: 1500, big: 330, alpha: outFade(t, P.to - 0.2, P.to) });"),
  's31-road2': sb("({ pos: [9 - 4 * p, 1.6, -10 + 9 * p], target: [2 - 4 * p, 5, 12], fov: 56 })", fill="5.0",
                  lyric=V % "x: 260, y: 1500, px: 190, align: 'left', group: 2, gap: 1.3"),
  's32-holy2': sb("({ pos: [4.0 * Math.sin(0.6 + 1.2 * p), 9.5, 4 - 4.0 * Math.cos(0.6 + 1.2 * p)], target: [0, 9.5, 4], fov: 60 })", fill="6.0",
                  lyric="verse(ctx, t, P, lines, { x: 1920, y: 1180, px: 290, align: 'center', group: 1 });"),
  's33-mercy': sb("({ pos: [0, 12.5 - 0.6 * p, -11 + 0.6 * p], target: [0, 6, 8], fov: 44 })", fill="5.0",
                  lyric="verse(ctx, t, P, lines, { x: 1920, y: 1500, px: 300, align: 'center', group: 1 });"),
  # the slow verse: back into the dark, then light breaking through
  's34-why': g("({ pos: [-6.8, 1.4, 6 + 6 * p], target: [-6.6, 3.0, 40], fov: 48 })", uniforms="uVotive: [-5.9, 0.0, 16.0], uMoonCol: [3.5, 4.2, 5.6]",
               lyric=V % "x: 3580, y: 1460, px: 200, align: 'right', group: 2, gap: 1.3, italic: true"),
  's35-complete': g("({ pos: [0.6, 1.4 + 2 * p, 10 + 14 * p], target: [0.0, 8.0, 62], fov: 50 })", uniforms="uVotive: [-3.1, 0.0, 9.2]",
                    update="const k = Math.min(1, Math.max(0, (t - P.from) / (P.to - P.from))); u.uMoonCol.value.set(4.6 + 6 * k, 5.4 + 2.5 * k, 7.2 - 3.5 * k); u.uGlass.value.set(0.35 + 1.4 * k, 0.48 + 0.6 * k, 0.8 - 0.2 * k);",
                    lyric=V % "x: 1920, y: 1640, px: 200, align: 'center', group: 2, gap: 1.25"),
  's36-theosis': sb("({ pos: [0, 1.6 + 3.5 * p, -14 + 10 * p], target: [0, 6 + 6 * p, 10], fov: 56 })", fillK="(t) => 0.15 + 1.25 * Math.min(1, Math.max(0, (t - P.from) / 6.0))", fill="5.5",
                    lyric=V % "x: 1920, y: 1620, px: 230, align: 'center', group: 1"),
  's37-end': sb("({ pos: [0, 13 - 3 * p, -12 + 5 * p], target: [0, 4 + 2 * p, 8], fov: 52 })", fill="5.0",
                finish="({ fade: Math.min(1, Math.max(0, (t - (P.to - 1.8)) / 1.6)) })",
                lyric="const tail = lyrics.words.filter((w) => w.start >= P.from - 0.05 && w.start < P.from + 3);\n  if (tail.length) setLine(ctx, tail, t, { x: 1920, y: 1800, px: 250, align: 'center', alpha: outFade(t, P.from + 4.2, P.from + 4.8) });\n  const k = ease.out3(clamp01((t - P.from - 5.0) / 1.5)) * outFade(t, P.to - 1.6, P.to - 0.4);\n  if (k > 0) { note(ctx, 'THE', 1920, 860, { px: 70, align: 'center', alpha: 0.85 * k, track: 0.6 }); shout(ctx, [{ w: 'FAITH', start: P.from + 5.2 }], t, { cx: 1920, y: 1240, big: 360, alpha: k }); note(ctx, 'OF THE APOSTLES', 1920, 1420, { px: 90, align: 'center', alpha: 0.9 * k, track: 0.45, color: '255, 172, 72' }); }"),
}

HEAD = "// {name}: generated by tools/make-scenes.py from the plan in docs/BRIEF.md.\n"
for name, s in SPEC.items():
    if s is None or name in KEEP: continue
    if s['world'] == 'sb':
        opts = [f"name: '{name}'", f"cam: (p, t) => {s['cam']}"]
        if 'fill' in s: opts.append(f"fill: {s['fill']}")
        if 'fillK' in s: opts.append(f"fillK: {s['fillK']}")
        for k in ('post', 'finish'):
            if k in s: opts.append(f"{k}: (t) => {s[k]}")
        body = f"""import {{ spilledShot }} from '/song/lib/shots.js';
import {{ linesIn }} from '/song/lib/type.js';
export const kind = 'three';
export default (P) => {{ const lines = linesIn(P); return spilledShot(P, {{ {', '.join(opts)} }}); }};
"""
    else:
        opts = [f"name: '{name}'", f"cam: (p, t) => {s['cam']}"]
        if 'uniforms' in s: opts.append(f"uniforms: {{ {s['uniforms']} }}")
        if 'flash' in s: opts.append(f"flash: (t) => {s['flash']}")
        if 'update' in s: opts.append(f"update: (t, u) => {{ {s['update']} }}")
        if 'exposure' in s: opts.append(f"exposure: {s['exposure']}")
        if 'drift' in s: opts.append(f"drift: {s['drift']}")
        if 'post' in s: opts.append(f"post: (t) => {s['post']}")
        body = f"""import {{ gothicShot, lightning }} from '/song/lib/shots.js';
import {{ linesIn, ease }} from '/song/lib/type.js';
export const kind = 'shader';
export default (P) => {{ const lines = linesIn(P); return gothicShot(P, {{ {', '.join(opts)} }}); }};
"""
    open(f'scenes/{name}.js', 'w').write(HEAD.format(name=name) + body)
    lyr = f"""import {{ lyricModule, verse, single, shout, note, outFade, ease, clamp01, setLine, lyrics }} from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {{
  {s['lyric']}
}});
"""
    open(f'scenes/{name}.lyric.js', 'w').write(HEAD.format(name=name) + lyr)
print('written', len([1 for n, s in SPEC.items() if s and n not in KEEP]))
