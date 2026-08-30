import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ContentMeta } from '@/components/content-meta';
import { getMDXComponents } from '@/components/mdx';
import type { BlogPostFrontmatter } from '@/lib/content-schema';
import { pageByTypeAndSlug, pagesByType } from '@/lib/content';

export function generateStaticParams() {
  return pagesByType('article').map((page) => ({ slug: page.slugs.at(-1) }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pageByTypeAndSlug(['article'], slug);
  if (!page) notFound();
  const data = page.data as typeof page.data & BlogPostFrontmatter;
  const MDX = page.data.body;
  return (
    <main id="main-content" className="blog-detail">
      <div className="shell">
        <Breadcrumbs
          items={[{ label: 'Blog', href: '/blog' }, { label: data.title }]}
        />
      </div>
      <div className="shell article-layout">
        <article className="article">
          <header>
            <p className="eyebrow">{data.blogTopic} · analysis</p>
            <h1>{data.title}</h1>
            <p className="article-deck">{data.description}</p>
            <ContentMeta data={data} path={`blog/${slug}.mdx`} />
          </header>
          <div className="prose">
            <MDX components={getMDXComponents()} />
          </div>
        </article>
        <aside className="article-toc">
          <p>In this article</p>
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
