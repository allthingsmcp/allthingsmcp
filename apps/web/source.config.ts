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
    // Must match the file name, e.g. `jane-doe` for `jane-doe.yaml`.
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase slug'),
    name: z.string().min(1),
    // People get a public profile page at /authors/[slug]; organizations do not.
    kind: z.enum(['person', 'organization']).default('person'),
    affiliation: z.string().min(1).optional(),
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
