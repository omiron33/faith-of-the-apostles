# Scene architecture

The film is deterministic: each frame depends on the scene parameters and song time. `film.json` defines 38 contiguous intervals. Each scene has a picture module and a separate lyric module, so typography can be changed without replacing its world.

## Picture modules

Shader scenes export `kind = 'shader'` and a default factory receiving scene parameters. The result provides `from`, `to`, GLSL `frag`, uniforms, a camera function and optional update, text-plane and finishing functions. Three.js scenes export `kind = 'three'` and return their world through the premium runtime contract.

`lib/gothic.js` draws the Gothic nave. `lib/spilled.js` loads the public church geometry and replaces its surfaces with procedural materials. `lib/shots.js` defines church camera shots. The `lib/x-*.js` files provide individual verse worlds, including the road, sea, map, succession candles, schism, tomb and forge. `lib/shatter.js` supplies the carved-word treatment used in v2.

## Lyric modules

Each `scenes/<name>.lyric.js` exports a factory for a transparent text layer. `lib/type.js` contains the typography helpers; `lib/look.js` exposes timing, easing, colors and projection. `data/lyrics.json` provides measured sung-word and line intervals. Words use these measured times rather than estimated beat positions.

The lyric canvas is 3840 × 2160 and is composited into the 1920 × 1080 output. Rendering keeps text separate from the picture until the final composite. The film-wide lyric backing is configured in `film.json`.

Inspect a scene's parameters and lines with:

```sh
node tools/params.mjs s10-faith --times
```

Create a still or bounded clip with:

```sh
npm run still -- --scene s10-faith --time 86 --samples 2
node tools/render.mjs scene --scene s10-faith --from 85 --to 86 --draft
```

The portable runner supports the hard cuts present in this film. It rejects transition definitions rather than silently rendering them incorrectly.

## Optional analysis tools

The released timing data is sufficient for rendering. `tools/analyze.py` measures the recording with NumPy; `tools/transcribe.py` uses the separately installed Whisper package. These utilities are optional and do not run as part of installation or rendering. `tools/timing.py` and `tools/make-scenes.py` preserve the scene-construction tools used for this project; running them can regenerate authored data or scene files, so use a separate branch when experimenting.
