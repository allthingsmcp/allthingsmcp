import {
  defineCollections,
  defineConfig,
  defineDocs,
} from 'fumadocs-mdx/config';
import { z } from 'zod';
import { contentSchema } from './lib/content-schema';

export const docs = defineDocs({
  dir: 'content',
  docs: {
    schema: contentSchema,
    postprocess: { includeProcessedMarkdown: true },
  },
});

export const authors = defineCollections({
  type: 'meta',
  dir: 'content/authors',
  schema: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    bio: z.string().min(20),
    url: z.string().url().optional(),
  }),
});

export default defineConfig();
