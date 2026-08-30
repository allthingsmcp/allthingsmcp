import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { getMDXComponents } from '@/components/mdx';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { pageByTypeAndSlug, pagesByType } from '@/lib/content';

export function generateStaticParams() {
  return pagesByType('glossary').map((page) => ({ slug: page.slugs.at(-1) }));
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pageByTypeAndSlug(['glossary'], slug);
  if (!page) notFound();
  const data = page.data as typeof page.data & ContentFrontmatter;
  const MDX = page.data.body;
  return (
    <main id="main-content">
      <div className="shell">
        <Breadcrumbs
          items={[
            { label: 'Glossary', href: '/glossary' },
            { label: data.title },
          ]}
        />
      </div>
      <article className="shell info-page">
        <header>
          <p className="eyebrow">{data.glossaryCategory} term</p>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
        </header>
        <div className="info-prose">
          <MDX components={getMDXComponents()} />
        </div>
      </article>
    </main>
  );
}
