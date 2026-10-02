# Authoring scenes for The Faith of the Apostles

Read `docs/BRIEF.md` first (the idea, the filioque, palette, voices and the scene table). This file is
how to write a scene. Worked examples: `scenes/s10-faith.js` + `scenes/s10-faith.lyric.js` (the
church, the approved look), `scenes/s13-holy.js` (the dome), `scenes/s21-error.js` (baked text).

The bar: every scene must be photographic: photographic, warmly lit, deep but never murky, words sharp and big.

## Files

Each scene is two modules in `scenes/`:

- `<name>.js`: the picture. `export const kind = 'shader';` and a default export
  `(P) => ({ name, from: P.from, to: P.to, frag, uniforms, camera(t), update?(t, u), textPlane(t, cam),
  post(t), finish?(t) })`. `frag` is a library's GLSL followed by your own `vec3 shade(vec2 fc)`.
  The picture has **no lyric words** in it (baked inscriptions that belong to an object, like the
  Creed slab, are the exception; draw them with the scene's own `drawText` and `textSize`).
- `<name>.lyric.js`: the words, on their own layer. Default export `(P) => ({ textSize: [3840, 2160],
  shade, textPlane(t, cam), drawText(ctx, t) })`. Import from `/song/lib/type.js`.

Never use absolute song times. Everything is relative to `P.from` / `P.to` and to measured word and
line times from `linesAt(P.from - 0.6, 'first words of line', ...)` (lines are found in order from
that time; choruses repeat, so always pass a time just before your scene). `tools/params.mjs <scene>
--times` prints your window and lines. Cuts may move by a beat; keep working when they do.

Do not edit anything in `lib/` or other scenes. If you need a shared helper or new world, put it in
a new file `lib/x-<your scene>.js`. Do not touch the engine repository.

## The libraries

- `lib/church.js` (`CHURCH_GLSL`, `CHURCH_UNIFORMS`): the basilica. Nave along +z, apse chord at
  `uApseZ` (6 m), apse radius 3.6, conch springing at 5.2 m, floor y = 0, nave half width 4.9.
  Columns flank the apse (x = ±4.15, z = 5.55) and the nave. A brass candle stand at `uStand` with
  `uTapers` beeswax tapers, `uLit` of them lit (fractional = the newest catching). Five ruby oil
  lamps hang before the apse (`uLamps` brightness, 0 hides them). Window light `uSunDir`/`uSunCol`
  through three alabaster windows. `uP1`/`uP1c`, `uP2`/`uP2c` free point lights. Haze `uHaze`.
  Thin lens: `uFocus` (m), `uAper` (m, 0 = pin-sharp; 0.005 to 0.02 is cinematic). In `shade` call
  `vec3 rd = lensRay(fc, ro); vec3 c = church(ro, rd, depth);`. Add your own objects by putting
  `'#define CH_EXTRA\n'` before `CHURCH_GLSL` and defining after it
  `float extraObj(vec3 p, out int id)` (ids 50 and up) and `Mat extraMat(int id, vec3 p, vec3 n)`;
  helpers available: `sdBox sdCyl sdCapsule sdSphere sdEllipsoid sdRoundCone smin smax rot`,
  `marble(p2, base, veinCol, scale)`, `tess(uv, size)` (mosaic), `M(albedo, rough, metal)` with
  `.emit`, `fbm vnoise voronoiEdge hash*`. A candle flame anywhere: `flameAt(ro, rd, base, height,
  k, seed, depth)` returns its light; add it to the colour after `church()`.
- `lib/dome.js` (`DOME_GLSL`, `DOME_UNIFORMS`): the dome from below, analytic and cheap:
  `vec3 c = dome(ro, rd, depth);` with `camRay`.
- `lib/creed.js`: the Creed stele and the filioque plate (owned by s19 to s22).
- `lib/flame.js`: `candleFlame/flameField/fireSheet` volume densities if you march your own fire.
- `lib/look.js`: `grade(t, extra)` for `post`, `ease`, `spring(t, t0, dur, bounce)`, `drift(t, amt)`,
  `linesAt`, `project(cam, worldPoint)` (to pin words to objects), palette strings.
- `/premium/finish.js`: `FINISH.film | studio | night` presets for `finish(t)` (flare, light leak,
  split-tone grade, fade). Keep flares subtle (amount ≤ 0.2, threshold ≥ 1.0).
- Other worlds (sea, terrain, a map, a tomb, iron in a forge...) you write yourself in your own
  `lib/x-<scene>.js`, in the same spirit: raymarched, one strong light plus a soft fill, haze,
  photographic materials (stone with grain and veins, water with Fresnel and sky reflection, bronze
  with patina), every frame a pure function of `uTime`. Look at the Genesis 8 film's libraries for
  terrain, sea and sky (the Genesis 8 film's `lib/`) and copy what helps into your
  own file.

## The picture

- One idea per scene, shot beautifully, moving from the first frame (the camera drifts or pushes,
  flames flicker, light moves). Metaphor, not illustration.
- **No people, no faces, no bodies, no hands.** Where the lyric names people, show what they carried:
  the flame, lamps, books, thrones, veils.
- Never murky: lit by flames, lamps or window light, held in haze; no black voids; contrast with
  depth. Warm amber and gold is the home key; the schism verse (s15 to s18) goes cold blue-grey.
- Physical motion: springs and eased moves, holds then moves on the beat; nothing stops dead.
- **Keep it fast to render.** Test cost: a still at 16 samples should take under ~1.5 s (render.mjs
  prints ms). Bound expensive parts with boxes; loops over at most ~12 items.
- Everything a pure function of `t` (no Date, no Math.random); hash indices.

## The words

- Lyrics are the star: big, sharp, one obvious reading path, at most two lines at once. Each scene
  uses a **different** layout and idiom from its neighbours: vary size, position (top, bottom,
  left column, right column, centre, pinned to an object with `project()`), and entrance (rise,
  settle, light-up, carve-in, burn-in, letter-by-letter...).
- `lib/type.js`: `paint(ctx, word, x, y, px, { alpha, voice })` sets a word in its meaning's voice;
  `measure`, `lineWidth`, `setLine(ctx, line, t, { x, y, px, align })`, `inscribe(ctx, words, t,
  { x, y, small, big })` (the chorus style: small tracked capitals plus big voiced words),
  `arrive(w, t)` gives `{ k, a }` for a word settling on its onset, `note(ctx, text, x, y)` for a small
  tracked annotation (a council, a year, a scripture reference; never invented lyrics),
  `outFade(t, t0, t1)`.
- Every word appears on its measured onset (never early) and is fully set within 0.1 s. Words hold
  still for 8 frames after landing. A line fades when the next needs the space or at `P.to`.
- Keep words inside a 200 px margin of the 3840×2160 canvas, never overlapping each other.
- `shade` 0.35 to 0.6 is the soft dark backing behind words; use enough that light words read on
  bright gold.

## Test

From the engine's `photoreal` folder:

```
S=<path to this repository>
node $S/tools/params.mjs <scene> --times
node render.mjs stills --song $S --scene <scene> --params "$(node $S/tools/params.mjs <scene>)" --t <t1>,<t2> --samples 8 --out $S/out/dev
```

Then look at the PNGs with the Read tool. Check: lit and beautiful, words sharp and placed, the
scene differs from its neighbours. Keep test renders small (two or three times per call).
