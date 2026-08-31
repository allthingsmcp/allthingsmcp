import { createSearchAPI } from 'fumadocs-core/search/server';
import type { ContentFrontmatter } from '@/lib/content-schema';
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
    .map((page) => {
      const data = page.data as ContentFrontmatter;
      const url =
        data.contentType === 'article'
          ? `/blog/${page.slugs.at(-1)}`
          : data.contentType === 'guide'
            ? `/guides/${page.slugs.at(-1)}`
            : data.contentType === 'guide-step' &&
                data.guideSlug &&
                data.guideStepId
              ? `/guides/${data.guideSlug}/${data.guideStepId}`
              : page.url;
      return {
        id: url,
        title: page.data.title,
        description: page.data.description,
        url,
        structuredData: page.data.structuredData,
      };
    }),
});
