import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ContentMeta } from '@/components/content-meta';
import { getMDXComponents } from '@/components/mdx';
import type { ContentFrontmatter } from '@/lib/content-schema';
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
    const pages = source
      .getPages()
      .filter(
        (page) =>
          !production ||
          (page.data as { status?: string }).status === 'published',
      );
    return (
      <main id="main-content">
        <div className="shell">
          <Breadcrumbs items={[{ label: 'Library' }]} />
        </div>
        <section className="shell directory-hero">
          <p className="eyebrow">Library</p>
          <h1>The MCP field guide</h1>
          <p>
            Guides, tutorials, lessons, terms, releases, projects, and
            tools—authored in Git and reviewed in public.
          </p>
        </section>
        <section className="section-block section-block--tight">
          <div className="shell library-list">
            {pages.map((page) => (
              <Link href={page.url} key={page.url}>
                <span>
                  {(page.data as { contentType?: string }).contentType ??
                    'Page'}
                </span>
                <h2>{page.data.title}</h2>
                <p>{page.data.description}</p>
                <ArrowRight />
              </Link>
            ))}
          </div>
        </section>
      </main>
    );
  }
  const page = source.getPage(slug);
  if (!page) notFound();
  const data = page.data as typeof page.data & ContentFrontmatter;
  if (production && data.status === 'draft') notFound();
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
