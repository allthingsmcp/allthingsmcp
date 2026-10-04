import {
  defineCollections,
  defineConfig,
  defineDocs,
} from 'fumadocs-mdx/config';
import { z } from 'zod';
import { contentSchema } from './lib/content-schema';

const authorLink = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), 'Use an HTTP or HTTPS URL')
  .optional();

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
    image: z.string().startsWith('/'),
    github: authorLink,
    linkedin: authorLink,
    x: authorLink,
    website: authorLink,
    url: authorLink,
  }),
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      addLanguageClass: true,
      engine: 'oniguruma',
      langAlias: {
        mdx: 'tsx',
      },
      langs: ['tsx'],
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
