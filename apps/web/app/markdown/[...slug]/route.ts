import { source } from '@/lib/source';
import { siteConfig } from '@/lib/config';
import { formatContentMarkdown } from '@/lib/content-share';
import type { ContentFrontmatter } from '@/lib/content-schema';

function contentPath(slugs: string[]) {
  if (slugs.length === 2 && slugs[0] === 'blog') return `/blog/${slugs[1]}`;
  if (slugs.length === 2 && slugs[0] === 'guides') {
    return `/guides/${slugs[1]}`;
  }
  if (slugs.length === 3 && slugs[0] === 'guides') {
    return `/guides/${slugs[1]}/${slugs[2]}`;
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const pathname = contentPath(slug);
  if (!pathname) return new Response('Not found', { status: 404 });
  const production =
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');

  const page = source.getPages().find((candidate) => {
    const data = candidate.data as ContentFrontmatter;
    if (production && data.status !== 'published') return false;
    if (slug[0] === 'blog') {
      return (
        data.contentType === 'article' && candidate.slugs.at(-1) === slug[1]
      );
    }
    if (slug.length === 2) {
      return data.contentType === 'guide' && candidate.slugs.at(-1) === slug[1];
    }
    return (
      data.contentType === 'guide-step' &&
      data.guideSlug === slug[1] &&
      data.guideStepId === slug[2]
    );
  });
  if (!page) return new Response('Not found', { status: 404 });

  const data = page.data as ContentFrontmatter;
  const guide =
    data.contentType === 'guide-step'
      ? (source.getPages().find((candidate) => {
          const item = candidate.data as ContentFrontmatter;
          return (
            item.contentType === 'guide' &&
            (!production || item.status === 'published') &&
            candidate.slugs.at(-1) === data.guideSlug
          );
        })?.data as ContentFrontmatter | undefined)
      : undefined;
  if (data.contentType === 'guide-step' && !guide) {
    return new Response('Not found', { status: 404 });
  }

  const markdown = formatContentMarkdown({
    data,
    pathname,
    body: await page.data.getText('processed'),
    guide,
  });
  const canonical = new URL(pathname, siteConfig.siteUrl).toString();

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${slug.at(-1)}.md"`,
      'X-Robots-Tag': 'noindex, follow',
      Link: `<${canonical}>; rel="canonical"`,
    },
  });
}
