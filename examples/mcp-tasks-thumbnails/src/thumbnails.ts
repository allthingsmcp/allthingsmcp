import { randomUUID } from 'node:crypto';
import { mkdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fixtureRoot, outputRoot, type ThumbnailInput } from './config.ts';
import { resizeImage } from './resize-image.ts';

export class BatchCancelled extends Error {}
export type OutputImage = {
  source: string;
  requestedWidth: number;
  width: number;
  height: number;
  path: string;
  bytes: number;
};
export type Manifest = { directory: string; images: OutputImage[] };
export type ThumbnailResult = {
  resultType: 'complete';
  content: { type: 'text'; text: string }[];
  isError?: boolean;
  structuredContent?: Manifest;
};
export type BatchOptions = {
  fixtures?: string;
  output?: string;
  demoDelayMs?: number;
  isCancelled?: () => Promise<boolean>;
  onProgress?: (completed: number, total: number) => Promise<void>;
};

export async function createThumbnails(
  input: ThumbnailInput,
  options: BatchOptions = {},
): Promise<ThumbnailResult> {
  const fixtures = await realpath(options.fixtures ?? fixtureRoot);
  const directory = path.join(options.output ?? outputRoot, randomUUID());
  await mkdir(directory, { recursive: true });
  const manifest: Manifest = { directory, images: [] };
  const total = input.images.length * input.widths.length;
  try {
    for (const name of input.images) {
      const source = await realpath(path.join(fixtures, name));
      if (path.dirname(source) !== fixtures)
        throw new Error('Image must stay inside the fixtures directory.');
      for (const width of input.widths) {
        if (await options.isCancelled?.()) throw new BatchCancelled();
        const filename = `${name}-${width}.webp`;
        const info = await resizeImage(
          source,
          path.join(directory, filename),
          width,
        );
        manifest.images.push({
          source: name,
          requestedWidth: width,
          width: info.width,
          height: info.height,
          path: filename,
          bytes: info.size,
        });
        await writeFile(
          path.join(directory, 'manifest.json'),
          JSON.stringify(manifest, null, 2) + '\n',
        );
        await options.onProgress?.(manifest.images.length, total);
        if (options.demoDelayMs) await delay(options.demoDelayMs);
      }
    }
    if (await options.isCancelled?.()) throw new BatchCancelled();
    return {
      resultType: 'complete',
      content: [
        {
          type: 'text',
          text: `Created ${manifest.images.length} thumbnails.\nOutput: ${directory}`,
        },
      ],
      structuredContent: manifest,
    };
  } catch (error) {
    if (error instanceof BatchCancelled) throw error;
    return {
      resultType: 'complete',
      isError: true,
      content: [
        {
          type: 'text',
          text: `Could not resize the batch: ${error instanceof Error ? error.message : String(error)}\nCompleted files, if any: ${directory}`,
        },
      ],
    };
  }
}
