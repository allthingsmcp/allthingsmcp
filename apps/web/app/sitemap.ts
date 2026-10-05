import type { MetadataRoute } from 'next';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { siteConfig } from '@/lib/config';
import { source } from '@/lib/source';

function absoluteUrl(pathname: string) {
  return new URL(pathname, siteConfig.siteUrl).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/guides'), changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/blog'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.5 },
    {
      url: absoluteUrl('/authors/gbadebo-bello'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: absoluteUrl('/independence'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: absoluteUrl('/contribute'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  const contentRoutes: MetadataRoute.Sitemap = source
    .getPages()
    .flatMap((page) => {
      const data = page.data as ContentFrontmatter;
      if (data.status !== 'published' || data.section === 'spec-watch') {
        return [];
      }

      let pathname: string | undefined;
      if (data.contentType === 'guide') {
        pathname = `/guides/${page.slugs.at(-1)}`;
      } else if (
        data.contentType === 'guide-step' &&
        data.guideSlug &&
        data.guideStepId
      ) {
        pathname = `/guides/${data.guideSlug}/${data.guideStepId}`;
      } else if (data.contentType === 'article') {
        pathname = `/blog/${page.slugs.at(-1)}`;
      }

      if (!pathname) return [];
      return [
        {
          url: absoluteUrl(pathname),
          lastModified: new Date(data.updatedAt),
          changeFrequency: 'monthly' as const,
          priority: data.contentType === 'guide' ? 0.8 : 0.7,
        },
      ];
    });

  return [...staticRoutes, ...contentRoutes];
}
