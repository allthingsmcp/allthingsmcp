import { createSearchAPI } from 'fumadocs-core/search/server';
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
    .map((page) => ({
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      structuredData: page.data.structuredData,
    })),
});
