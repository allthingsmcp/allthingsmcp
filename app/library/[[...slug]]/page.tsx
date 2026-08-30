import { notFound, redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ContentMeta } from '@/components/content-meta';
import { getMDXComponents } from '@/components/mdx';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { canonicalContentUrl } from '@/lib/content';
import { source } from '@/lib/source';

export function generateStaticParams() {
  return source.generateParams();
}

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const production =
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');
  if (!slug?.length) {
    redirect('/guides');
  }
  const page = source.getPage(slug);
  if (!page) notFound();
  const data = page.data as typeof page.data & ContentFrontmatter;
  if (production && data.status === 'draft') notFound();
  if (
    data.contentType === 'guide' ||
    data.contentType === 'article' ||
    data.contentType.startsWith('spec-') ||
    data.contentType === 'glossary'
  ) {
    redirect(canonicalContentUrl(page));
  }
  const MDX = page.data.body;
  return (
    <main id="main-content">
      <div className="shell">
        <Breadcrumbs
          items={[
            { label: 'Library', href: '/library' },
            { label: data.title },
          ]}
        />
      </div>
      <div className="shell article-layout">
        <article className="article">
          <header>
            <p className="eyebrow">
              {data.section} · {data.contentType}
            </p>
            <h1>{data.title}</h1>
            <p className="article-deck">{data.description}</p>
            <ContentMeta data={data} path={`${slug.join('/')}.mdx`} />
          </header>
          <div className="prose">
            <MDX components={getMDXComponents()} />
          </div>
        </article>
        <aside className="article-toc">
          <p>On this page</p>
          {page.data.toc.map((item) => (
            <a href={item.url} key={item.url}>
              {item.title}
            </a>
          ))}
        </aside>
      </div>
    </main>
  );
}
