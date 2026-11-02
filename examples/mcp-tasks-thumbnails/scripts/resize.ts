import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fixtureRoot, outputRoot } from '../src/config.ts';
import { resizeImage } from '../src/resize-image.ts';

await mkdir(path.join(outputRoot, 'first-image'), { recursive: true });
for (const width of [320, 640, 1280]) {
  const info = await resizeImage(
    path.join(fixtureRoot, 'landscape.png'),
    path.join(outputRoot, 'first-image', `${width}.webp`),
    width,
  );
  console.log(`${width}.webp: ${info.width} × ${info.height}`);
}
