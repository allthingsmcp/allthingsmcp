import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuideOverviewExperience } from '@/components/guide-overview-experience';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { source } from '@/lib/source';

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

  return (
    <main id="main-content" className="guide-overview-page">
      <GuideOverviewExperience
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
