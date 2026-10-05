import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentAuthors } from '@/components/content-authors';
import { GuideOverviewExperience } from '@/components/guide-overview-experience';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { socialCardMetadata } from '@/lib/social-card';
import { source } from '@/lib/source';
import { JsonLd, contentStructuredData } from '@/components/json-ld';
import { getMDXComponents } from '@/components/mdx';

function getGuide(slug: string) {
  return source.getPages().find((page) => {
    const data = page.data as ContentFrontmatter;
    return data.contentType === 'guide' && page.slugs.at(-1) === slug;
  });
}

export function generateStaticParams() {
  return source
    .getPages()
    .filter((page) => (page.data as ContentFrontmatter).contentType === 'guide')
    .map((page) => ({ slug: page.slugs.at(-1) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getGuide(slug);
  if (!page) return {};
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: `/guides/${slug}` },
    ...(page.data.status === 'draft'
      ? { robots: { index: false, follow: false } }
      : {}),
    ...socialCardMetadata({
      title: page.data.title,
      description: page.data.description,
      kind: 'guide',
      slug,
    }),
  };
}

export default async function GuideOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getGuide(slug);
  if (!page) notFound();
  const data = page.data as ContentFrontmatter;
  const production =
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');

  if (production && data.status === 'draft') notFound();
  if (
    !data.outcome ||
    !data.guideSteps ||
    !data.difficulty ||
    !data.estimatedMinutes
  ) {
    notFound();
  }
  const MDX = page.data.body;
  return (
    <main id="main-content" className="guide-overview-page">
      {data.status === 'published' && (
        <JsonLd
          data={contentStructuredData({
            data,
            path: `/guides/${slug}`,
            breadcrumbs: [
              { name: 'Home', path: '/' },
              { name: 'Guides', path: '/guides' },
              { name: data.title, path: `/guides/${slug}` },
            ],
          })}
        />
      )}
      <GuideOverviewExperience
        authors={<ContentAuthors names={data.authors} label="Guide authors" />}
        introduction={<MDX components={getMDXComponents()} />}
        guide={{
          slug,
          title: data.title,
          description: data.description,
          outcome: data.outcome,
          difficulty: data.difficulty,
          estimatedMinutes: data.estimatedMinutes,
          updatedAt: data.updatedAt,
          steps: data.guideSteps,
          prerequisites: data.prerequisites ?? [],
          resources: data.guideResources ?? [],
          interactiveGuideId: data.interactiveGuideId,
        }}
      />
    </main>
  );
}
