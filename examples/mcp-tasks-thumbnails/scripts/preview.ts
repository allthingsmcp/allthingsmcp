import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';
import { fixtureRoot, projectRoot } from '../src/config.ts';
import { resizeImage } from '../src/resize-image.ts';

// A contact sheet made from the actual example outputs, not a mockup.
const temporary = await mkdtemp(path.join(tmpdir(), 'atm-preview-'));
try {
  const composites: OverlayOptions[] = [];
  const names = ['landscape', 'portrait', 'square'];
  const labels: string[] = [];
  for (const [index, name] of names.entries()) {
    const image = path.join(temporary, `${name}.webp`);
    const info = await resizeImage(
      path.join(fixtureRoot, `${name}.png`),
      image,
      320,
    );
    const left = 16 + index * 336;
    composites.push({ input: image, left, top: 48 });
    labels.push(
      `<text x="${left}" y="30">${name}.png</text><text x="${left}" y="486">${info.width} × ${info.height}</text>`,
    );
  }
  const text = `<svg width="1024" height="512"><g fill="#1b2430" font-family="sans-serif" font-size="24">${labels.join('')}</g></svg>`;
  composites.push({ input: Buffer.from(text), left: 0, top: 0 });
  const destination = path.resolve(
    projectRoot,
    '../../apps/web/public/images/guides',
  );
  await mkdir(destination, { recursive: true });
  await sharp({
    create: { width: 1024, height: 512, channels: 4, background: '#f4f4f1' },
  })
    .composite(composites)
    .png()
    .toFile(path.join(destination, 'mcp-tasks-thumbnails.png'));
  console.log('Generated the guide preview from three actual resized images.');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
