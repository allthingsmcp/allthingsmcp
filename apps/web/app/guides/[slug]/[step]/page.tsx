import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentAuthors } from '@/components/content-authors';
import { ContentMeta } from '@/components/content-meta';
import { GuideStepExperience } from '@/components/guide-step-experience';
import { getMDXComponents } from '@/components/mdx';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { source } from '@/lib/source';
import { interactiveGuideIds } from '@/lib/interactive-guides';
import { socialCardMetadata } from '@/lib/social-card';
import { JsonLd, contentStructuredData } from '@/components/json-ld';
import { ContentShareMenu } from '@/components/content-share-menu';
import { formatContentMarkdown } from '@/lib/content-share';

function getGuide(slug: string) {
  return source.getPages().find((page) => {
    const data = page.data as ContentFrontmatter;
    return data.contentType === 'guide' && page.slugs.at(-1) === slug;
  });
}

function getStep(guideSlug: string, stepId: string) {
  return source.getPages().find((page) => {
    const data = page.data as ContentFrontmatter;
    return (
      data.contentType === 'guide-step' &&
      data.guideSlug === guideSlug &&
      data.guideStepId === stepId
    );
  });
}

export function generateStaticParams() {
  return source
    .getPages()
    .filter(
      (page) => (page.data as ContentFrontmatter).contentType === 'guide-step',
    )
    .map((page) => {
      const data = page.data as ContentFrontmatter;
      return { slug: data.guideSlug, step: data.guideStepId };
    });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}): Promise<Metadata> {
  const { slug, step } = await params;
  const page = getStep(slug, step);
  if (!page) return {};
  const guide = getGuide(slug);
  return {
    title: `${page.data.title} | ${guide?.data.title ?? 'MCP Guide'}`,
    description: page.data.description,
    alternates: { canonical: `/guides/${slug}/${step}` },
    ...(page.data.status === 'draft' || guide?.data.status === 'draft'
      ? { robots: { index: false, follow: false } }
      : {}),
    ...socialCardMetadata({
      title: page.data.title,
      description: page.data.description,
      kind: 'guide-step',
      slug: `${slug}/${step}`,
    }),
  };
}

export default async function GuideStepPage({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}) {
  const { slug, step } = await params;
  const guidePage = getGuide(slug);
  const stepPage = getStep(slug, step);
  if (!guidePage || !stepPage) notFound();

  const guide = guidePage.data as ContentFrontmatter;
  const data = stepPage.data as typeof stepPage.data & ContentFrontmatter;
  const production =
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');
  if (production && (guide.status === 'draft' || data.status === 'draft')) {
    notFound();
  }

  const activeStep = guide.guideSteps?.find((item) => item.id === step);
  if (
    !guide.guideSteps ||
    !activeStep ||
    !data.estimatedMinutes ||
    !data.specVersion
  ) {
    notFound();
  }

  const MDX = stepPage.data.body;
  const interactiveGuideId = interactiveGuideIds.find(
    (id) => id === guide.interactiveGuideId,
  );
  const pathname = `/guides/${slug}/${step}`;
  const markdown = formatContentMarkdown({
    data,
    pathname,
    body: await stepPage.data.getText('processed'),
    guide,
  });

  return (
    <main id="main-content" className="guide-step-page">
      {data.status === 'published' && guide.status === 'published' && (
        <JsonLd
          data={contentStructuredData({
            data,
            path: `/guides/${slug}/${step}`,
            breadcrumbs: [
              { name: 'Home', path: '/' },
              { name: 'Guides', path: '/guides' },
              { name: guide.title, path: `/guides/${slug}` },
              { name: data.title, path: `/guides/${slug}/${step}` },
            ],
          })}
        />
      )}
      <GuideStepExperience
        authors={<ContentAuthors names={data.authors} label="Step authors" />}
        share={
          <ContentShareMenu
            pathname={pathname}
            markdown={markdown}
            variant="inline"
          />
        }
        guideSlug={slug}
        guideTitle={guide.title}
        steps={guide.guideSteps}
        activeStep={activeStep}
        page={{
          title: data.title,
          description: data.description,
          estimatedMinutes: data.estimatedMinutes,
          updatedAt: data.updatedAt,
          specVersion: data.specVersion,
        }}
        interactiveGuideId={interactiveGuideId}
        actions={
          <ContentMeta
            data={data}
            path={`${stepPage.slugs.join('/')}.mdx`}
            pagePath={`/guides/${slug}/${step}`}
            showAuthors={false}
          />
        }
      >
        <MDX components={getMDXComponents()} />
      </GuideStepExperience>
    </main>
  );
}
