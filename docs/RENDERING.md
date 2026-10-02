# Rendering

## Requirements

- Node.js 22 or newer.
- Google Chrome with WebGL2 and GPU acceleration. Set `CHROME` to its executable path when needed.
- FFmpeg with H.264 (`libx264`), AAC and FFV1 support.
- Dependencies installed with `npm ci`: Three.js 0.180.0 and playwright-core 1.55.0.

The bundled runtime is the photoreal scene renderer used for this film. It reads `film.json`; this is a different format from the general [Ark Engine](https://github.com/omiron33/ark-engine) project format. No model API, cloud account or language-model process is required to render.

## Commands

```sh
npm run validate
npm test
npm run assets
npm run still -- --scene s00-title --time 4 --samples 2
node tools/render.mjs scene --scene s00-title --from 4 --to 5 --draft
npm run render -- --draft
npm run render -- --out out/film.mp4
```

The title, Gothic nave and shader verse worlds can render without the church model. Three.js church scenes require the pinned package installed by `npm run assets`. The download includes the public model's attribution documents. An existing copy can be verified and installed with `npm run assets -- --source /path/to/model-package`.

The full-film command needs `media/song.wav`. The recording is unchanged in v3. Its SHA-256 is `a144606aa0b3073751a6232d0cfa857a22fd1a9e9f9736ecd56d63fef78ccef3`; its duration is 281.6 seconds, PCM 16-bit stereo at 48 kHz. The recording is distributed separately from the source.

## Output and caching

Still images go to `out/portable/stills/`. Final-quality scene files go to `out/portable/`; draft files go to `out/portable-draft/`. The complete film is `out/film.mp4`, or `out/film-draft.mp4` for a draft. All generated media and caches are ignored by Git.

The runner renders one scene at a time, composites its transparent lyric layer, then joins the scene files with the original recording. Cache keys cover renderer code, scene dependencies, timing, quality and the render interval. A successful cached scene is reused. The released film uses hard cuts; the portable runner deliberately rejects unimplemented transition types.

The reusable browser runtime and scene shaders are preserved from the production renderer. The portable orchestrator removes machine-specific dispatch and accepts ordinary CLI calls. Output may vary with the GPU, Chrome version and encoder; do not expect byte-identical exports across machines. The v3 media fingerprints identify the exact released files.

## GPU backend

The default backend is Metal on macOS, Chrome's platform default on Windows and Vulkan on Linux. `ARK_ANGLE=default` lets Chrome choose; `ARK_ANGLE` can also select another installed ANGLE backend. macOS is the verified rendering environment for this film. Other platforms require an appropriate Chrome installation and GPU driver.
