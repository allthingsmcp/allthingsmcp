import { createSearchAPI } from 'fumadocs-core/search/server';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { canonicalContentUrl } from '@/lib/content';
import { source } from '@/lib/source';

const production =
  process.env.VERCEL_ENV === 'production' ||
  (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');

export const { GET } = createSearchAPI('advanced', {
  language: 'english',
  indexes: source
    .getPages()
    .filter(
      (page) =>
        !production ||
        (page.data as { status?: string }).status === 'published',
    )
    .filter((page) =>
      [
        'guide',
        'article',
        'spec-release',
        'spec-proposal',
        'glossary',
      ].includes((page.data as ContentFrontmatter).contentType),
    )
    .map((page) => ({
      id: canonicalContentUrl(page),
      title: page.data.title,
      description: page.data.description,
      url: canonicalContentUrl(page),
      structuredData: page.data.structuredData,
    })),
});
