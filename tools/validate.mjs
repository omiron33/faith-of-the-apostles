import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateFilm(film, root) {
  const errors = [];
  if (!Array.isArray(film.scenes) || !film.scenes.length) return ['film.scenes must be a nonempty array'];
  const names = new Set();
  for (let i = 0; i < film.scenes.length; i++) {
    const scene = film.scenes[i];
    if (!/^[a-z0-9-]+$/i.test(scene.scene)) errors.push(`Invalid scene name at index ${i}`);
    if (names.has(scene.id)) errors.push(`Duplicate scene ID: ${scene.id}`);
    names.add(scene.id);
    if (!Number.isFinite(scene.from) || !Number.isFinite(scene.to) || scene.to <= scene.from) errors.push(`Invalid scene interval: ${scene.id}`);
    const start = i ? film.scenes[i - 1].to : 0;
    if (Math.abs(scene.from - start) > 1e-6) errors.push(`Gap or overlap before scene ${scene.id}`);
    if (scene.transition) errors.push(`This film runner supports hard cuts only: ${scene.id}`);
    if (root && !fs.existsSync(path.join(root, 'scenes', `${scene.scene}.js`))) errors.push(`Missing picture module: ${scene.scene}`);
  }
  return errors;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const film = JSON.parse(fs.readFileSync(path.join(root, 'film.json'), 'utf8'));
  const errors = validateFilm(film, root);
  const lyrics = JSON.parse(fs.readFileSync(path.join(root, 'data/lyrics.json'), 'utf8'));
  const end = film.scenes.at(-1).to;
  if (lyrics.words.some((word) => !Number.isFinite(word.start) || !Number.isFinite(word.end) || word.end < word.start || word.start < 0 || word.end > end + 0.1)) errors.push('Invalid lyric word timing');
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`Valid film: ${film.scenes.length} scenes, ${end}s, ${lyrics.words.length} timed words.`);
}
