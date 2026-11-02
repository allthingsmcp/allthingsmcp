import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const fixtureRoot = path.join(projectRoot, 'fixtures');
export const outputRoot = path.join(projectRoot, 'output');
export const taskRoot = path.join(projectRoot, '.tasks');
export const protocolVersion = '2026-07-28';
export const tasksExtension = 'io.modelcontextprotocol/tasks';
export const imageNames = [
  'landscape.png',
  'portrait.png',
  'square.png',
  'blue.png',
  'orange.png',
  'green.png',
];
export const thumbnailInput = z.object({
  images: z
    .array(z.string().regex(/^[a-zA-Z0-9_-]+\.(png|jpe?g)$/))
    .min(1)
    .max(20)
    .refine(
      (items) => new Set(items).size === items.length,
      'Choose each image once.',
    )
    .default(imageNames),
  widths: z
    .array(z.number().int().min(16).max(2048))
    .min(1)
    .max(4)
    .refine(
      (items) => new Set(items).size === items.length,
      'Choose each width once.',
    )
    .default([320, 640, 1280]),
});
export type ThumbnailInput = z.infer<typeof thumbnailInput>;
export const sampleInput = thumbnailInput.parse({});
