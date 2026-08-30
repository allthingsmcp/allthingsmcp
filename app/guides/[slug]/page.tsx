import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ContentMeta } from '@/components/content-meta';
import { GuideProgress } from '@/components/guide-progress';
import { getMDXComponents } from '@/components/mdx';
import type { GuideFrontmatter } from '@/lib/content-schema';
import { pageByTypeAndSlug, pagesByType } from '@/lib/content';

export function generateStaticParams() {
  return pagesByType('guide').map((page) => ({ slug: page.slugs.at(-1) }));
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pageByTypeAndSlug(['guide'], slug);
  if (!page) notFound();
  const data = page.data as typeof page.data & GuideFrontmatter;
  const MDX = page.data.body;
  return (
    <main id="main-content" className="guide-detail">
      <div className="shell">
        <Breadcrumbs
          items={[{ label: 'Guides', href: '/guides' }, { label: data.title }]}
        />
      </div>
      <div className="shell guide-detail__layout">
        <GuideProgress slug={slug} steps={data.steps} />
        <article className="article">
          <header>
            <p className="eyebrow">{data.guideCategory} guide</p>
            <h1>{data.title}</h1>
            <p className="article-deck">{data.outcome}</p>
            <ContentMeta data={data} path={`guides/${slug}.mdx`} />
          </header>
          <div className="prose">
            <MDX components={getMDXComponents()} />
          </div>
        </article>
      </div>
    </main>
  );
}
