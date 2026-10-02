import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'data/model-manifest.json'), 'utf8'));
const sourceIndex = process.argv.indexOf('--source');
const source = sourceIndex < 0 ? null : process.argv[sourceIndex + 1];
if (sourceIndex >= 0 && !source) throw Error('--source needs the local model-package directory');
const destination = path.join(root, manifest.destination);
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
let downloaded = 0;

for (const [name, expected] of Object.entries(manifest.files)) {
  const target = path.resolve(destination, name);
  if (!target.startsWith(destination + path.sep)) throw Error(`Invalid asset path: ${name}`);
  const current = await fs.readFile(target).catch(() => null);
  if (current?.length === expected.byteLength && sha256(current) === expected.sha256) continue;
  let bytes;
  if (source) bytes = await fs.readFile(path.join(source, name));
  else {
    const response = await fetch(new URL(name, manifest.baseUrl), { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw Error(`Asset download failed (${response.status}): ${name}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (bytes.length !== expected.byteLength || sha256(bytes) !== expected.sha256) throw Error(`Asset integrity check failed: ${name}`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
  downloaded++;
}
console.log(`Model package verified: ${Object.keys(manifest.files).length} files (${downloaded} installed).`);
