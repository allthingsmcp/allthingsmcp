import { authors } from 'collections/server';
import { brandAssets } from '@/lib/brand';
import { siteConfig } from '@/lib/config';
import type { ContentFrontmatter } from '@/lib/content-schema';

const absoluteUrl = (path: string) =>
  new URL(path, siteConfig.siteUrl).toString();

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}

export function siteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': absoluteUrl('/#organization'),
        name: siteConfig.name,
        url: absoluteUrl('/'),
        logo: absoluteUrl(brandAssets.avatar),
        description: siteConfig.description,
      },
      {
        '@type': 'WebSite',
        '@id': absoluteUrl('/#website'),
        name: siteConfig.name,
        url: absoluteUrl('/'),
        description: siteConfig.description,
        publisher: { '@id': absoluteUrl('/#organization') },
      },
    ],
  };
}

export function contentStructuredData({
  data,
  path,
  breadcrumbs,
  type = 'Article',
}: {
  data: ContentFrontmatter;
  path: string;
  breadcrumbs: { name: string; path: string }[];
  type?: 'Article' | 'BlogPosting';
}) {
  const url = absoluteUrl(path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumbs`,
        itemListElement: breadcrumbs.map(({ name, path }, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name,
          item: absoluteUrl(path),
        })),
      },
      {
        '@type': type,
        '@id': `${url}#article`,
        mainEntityOfPage: url,
        headline: data.title,
        description: data.description,
        datePublished: data.publishedAt,
        dateModified: data.updatedAt,
        author: data.authors.map((name) => {
          const profile = authors.find((item) => item.name === name);
          return {
            '@type':
              profile?.name === 'All Things MCP Editors'
                ? 'Organization'
                : 'Person',
            name,
            ...(profile?.url?.endsWith('/authors/gbadebo-bello')
              ? { '@id': `${profile.url}#person` }
              : {}),
            ...(profile?.url || profile?.website
              ? { url: profile.url ?? profile.website }
              : {}),
          };
        }),
        publisher: { '@id': absoluteUrl('/#organization') },
        isPartOf: { '@id': absoluteUrl('/#website') },
        breadcrumb: { '@id': `${url}#breadcrumbs` },
      },
    ],
  };
}
