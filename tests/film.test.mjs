import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateFilm } from '../tools/validate.mjs';

const film = JSON.parse(fs.readFileSync(new URL('../film.json', import.meta.url)));
test('released film covers the full recording with contiguous scene boundaries', () => {
  assert.deepEqual(validateFilm(film), []);
  assert.equal(film.scenes.at(-1).to, 281.6);
});
test('gaps, duplicate IDs and unsupported transitions are rejected', () => {
  const bad = structuredClone(film);
  bad.scenes[1].from += 0.1;
  bad.scenes[1].id = bad.scenes[0].id;
  bad.scenes[1].transition = { type: 'fade' };
  const errors = validateFilm(bad);
  assert(errors.some((error) => error.includes('Gap')));
  assert(errors.some((error) => error.includes('Duplicate')));
  assert(errors.some((error) => error.includes('hard cuts')));
});
