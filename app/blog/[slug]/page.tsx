import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ContentMeta } from '@/components/content-meta';
import { getMDXComponents } from '@/components/mdx';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { source } from '@/lib/source';

function getPost(slug: string) {
  return source.getPages().find((page) => {
    const data = page.data as ContentFrontmatter;
    return data.contentType === 'article' && page.slugs.at(-1) === slug;
  });
}

export function generateStaticParams() {
  return source
    .getPages()
    .filter(
      (page) => (page.data as ContentFrontmatter).contentType === 'article',
    )
    .map((page) => ({ slug: page.slugs.at(-1) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPost(slug);
  if (!page) return {};
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPost(slug);
  if (!page) notFound();
  const data = page.data as typeof page.data & ContentFrontmatter;
  const production =
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');
  if (production && data.status === 'draft') notFound();
  const MDX = page.data.body;

  return (
    <main id="main-content">
      <div className="shell">
        <Breadcrumbs
          items={[{ label: 'Blog', href: '/blog' }, { label: data.title }]}
        />
      </div>
      <div className="shell article-layout blog-article-layout">
        <article className="article blog-article">
          <header>
            <p className="eyebrow">{data.blogTopic} · Blog</p>
            <h1>{data.title}</h1>
            <p className="article-deck">{data.description}</p>
            <ContentMeta data={data} path={`${page.slugs.join('/')}.mdx`} />
            {data.substackUrl && (
              <Link className="text-link" href={data.substackUrl}>
                Read the Substack edition <ExternalLink aria-hidden="true" />
              </Link>
            )}
          </header>
          <div className="prose">
            <MDX components={getMDXComponents()} />
          </div>
          <Link className="blog-back-link" href="/blog">
            <ArrowLeft aria-hidden="true" /> Back to the blog
          </Link>
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
