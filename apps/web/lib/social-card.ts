import type { Metadata } from 'next';

export type SocialCardKind = 'article' | 'guide' | 'guide-step';

export function socialCardUrl(kind: SocialCardKind, slug: string) {
  const search = new URLSearchParams({ kind, slug });
  return `/api/social-card/v2?${search.toString()}`;
}

export function socialCardMetadata({
  title,
  description,
  kind,
  slug,
}: {
  title: string;
  description: string;
  kind: SocialCardKind;
  slug: string;
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = {
    url: socialCardUrl(kind, slug),
    width: 1200,
    height: 630,
    alt: `${title} — All Things MCP`,
  };

  return {
    openGraph: {
      title,
      description,
      siteName: 'All Things MCP',
      type: kind === 'article' ? 'article' : 'website',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}
