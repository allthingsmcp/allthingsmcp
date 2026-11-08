import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fixtureRoot, imageNames, outputRoot } from '../src/config.ts';
import type { Manifest } from '../src/thumbnails.ts';

assert.equal(process.versions.node.split('.')[0], '24', 'Use Node 24.');
if (process.argv.includes('--output')) {
  const dirs = await Promise.all(
    (await readdir(outputRoot, { withFileTypes: true }))
      .filter((item) => item.isDirectory() && item.name !== 'first-image')
      .map(async (item) => ({
        path: path.join(outputRoot, item.name),
        time: (await stat(path.join(outputRoot, item.name))).mtimeMs,
      })),
  );
  dirs.sort((a, b) => b.time - a.time);
  assert(dirs[0], 'Run a batch first.');
  const manifest = JSON.parse(
    await readFile(path.join(dirs[0].path, 'manifest.json'), 'utf8'),
  ) as Manifest;
  for (const entry of manifest.images) {
    const info = await sharp(path.join(dirs[0].path, entry.path)).metadata();
    assert.equal(info.width, entry.width);
    assert.equal(info.height, entry.height);
    assert.equal(info.format, 'webp');
  }
  console.log(
    `Verified ${manifest.images.length} WebP files against manifest.json.`,
  );
} else {
  for (const name of imageNames)
    assert((await sharp(path.join(fixtureRoot, name)).metadata()).width);
  console.log(
    `Node ${process.versions.node}; Sharp ${sharp.versions.sharp}; 6 images verified.`,
  );
}
