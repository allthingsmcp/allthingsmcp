import type { ContentFrontmatter } from '@/lib/content-schema';
import { canonicalPathFor } from '@/lib/content-routing';
import { source } from '@/lib/source';

export type ContentPage = ReturnType<typeof source.getPages>[number];

export function isProduction() {
  return (
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production')
  );
}

export function isVisiblePage(page: ContentPage) {
  return (
    !isProduction() || (page.data as ContentFrontmatter).status === 'published'
  );
}

export function canonicalContentUrl(page: ContentPage) {
  const data = page.data as ContentFrontmatter;
  const slug = page.slugs.at(-1) ?? '';
  return canonicalPathFor(data.contentType, slug, page.url);
}

export function pagesByType(...types: ContentFrontmatter['contentType'][]) {
  return source
    .getPages()
    .filter(isVisiblePage)
    .filter((page) =>
      types.includes((page.data as ContentFrontmatter).contentType),
    );
}

export function pageByTypeAndSlug(
  types: ContentFrontmatter['contentType'][],
  slug: string,
) {
  return pagesByType(...types).find((page) => page.slugs.at(-1) === slug);
}
