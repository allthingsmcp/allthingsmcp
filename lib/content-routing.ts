import type { ContentFrontmatter } from '@/lib/content-schema';

export function canonicalPathFor(
  type: ContentFrontmatter['contentType'],
  slug: string,
  fallback = `/library/${slug}`,
) {
  if (type === 'guide') return `/guides/${slug}`;
  if (type === 'article') return `/blog/${slug}`;
  if (type.startsWith('spec-')) return `/spec-watch/${slug}`;
  if (type === 'glossary') return `/glossary/${slug}`;
  return fallback;
}
