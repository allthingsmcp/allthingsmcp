import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fixtureRoot, imageNames } from '../src/config.ts';

await mkdir(fixtureRoot, { recursive: true });
const colors = [
  '#1c70b8',
  '#b65329',
  '#28734b',
  '#3149a8',
  '#cf6a22',
  '#417c4f',
];
for (const [index, name] of imageNames.entries()) {
  const width = 1600;
  const height = index === 0 ? 1000 : index === 1 ? 2000 : 1600;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${colors[index]}"/><circle cx="800" cy="${height / 2}" r="330" fill="#fff"/><path d="M250 ${height - 200} L800 200 L1350 ${height - 200} Z" fill="#f3c969" opacity=".8"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(fixtureRoot, name));
}
await writeFile(
  path.join(fixtureRoot, 'broken.png'),
  'This is deliberately not an image.',
);
console.log('Ready: 6 sample images and 1 deliberate error fixture.');
