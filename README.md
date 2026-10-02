# The Faith of the Apostles

Scenes for a lyric film of *The Faith of the Apostles*, an Orthodox confession of the faith handed
down from the Apostles. Every frame is drawn in code: raymarched GPU shaders and one Three.js
interior whose surfaces are all procedural, rendered at 1920×1080 and 60 fps with many jittered
sub-frames averaged per frame (motion blur, anti-aliasing, depth of field) and one film finish.

The renderer is a separate lyric film engine (not public). This repository holds only what belongs
to this song:

- `scenes/`: one picture module and one lyric module per scene; `film.json` lists them in order.
  `tools/make-scenes.py` writes the scenes that are shots in the two churches from one table.
- `lib/`: the worlds. `gothic.js` (a Gothic cathedral in darkness, moonlight and votives),
  `spilled.js` (the Church of the Savior on Spilled Blood: only the building's geometry is loaded;
  every surface, mosaic, marble and brick, is redrawn in code), `neon.js` (the filioque),
  and one `x-<scene>.js` per verse world: the old road, the Sea of Galilee, the map of the
  Apostles' journeys, the ruins, the cracked earth of 1054, the two shores, the descent of light,
  the night sea, the tapers of succession, the empty tomb, the mended cup and the forge.
- `lib/type.js`: the lyric voices (each word set by what it means) and layouts.
- `data/lyrics.json`: every word with its sung start and end, force-aligned to the recording, plus
  measured beats.
- `docs/`: the brief and the authoring guide.

The filioque is shown as what the Orthodox Church holds it to be: an addition to the Creed, here a
cheap neon sign planted in the nave, knocked down by lightning, the Creed's own words standing:
"who proceeds from the Father" (John 15:26; Constantinople, 381).

The church interior's geometry comes from a separately published model of the Church of the
Savior on Spilled Blood; it is not included here (`models/` is not committed).

Fonts: EB Garamond and Inter Tight (supplied by the engine) and Anton (`fonts/`, OFL).
