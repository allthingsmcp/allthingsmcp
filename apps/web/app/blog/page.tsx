import type { Metadata } from 'next';
import {
  BlogIndex,
  type BlogPostSummary,
  type BlogTopic,
} from '@/components/blog-index';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { source } from '@/lib/source';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Technical explainers, architecture deep dives, and independent analysis of MCP.',
};

const editorialOrder = [
  'what-is-mcp',
  'mcp-architecture',
  'mcp-authorization-explained',
  'mcp-in-production',
];

export default function BlogPage() {
  const production =
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');
  const posts = source
    .getPages()
    .filter((page) => {
      const data = page.data as ContentFrontmatter;
      return (
        data.contentType === 'article' &&
        (!production || data.status === 'published')
      );
    })
    .map((page) => {
      const data = page.data as ContentFrontmatter;
      const slug = page.slugs.at(-1) ?? '';
      return {
        title: data.title,
        description: data.description,
        topic: data.blogTopic as BlogTopic,
        authors: data.authors,
        publishedAt: data.publishedAt,
        updatedAt: data.updatedAt,
        estimatedMinutes: data.estimatedMinutes,
        status: data.status,
        href: `/blog/${slug}`,
        slug,
      };
    })
    .sort(
      (a, b) => editorialOrder.indexOf(a.slug) - editorialOrder.indexOf(b.slug),
    )
    .map((post): BlogPostSummary => ({
      title: post.title,
      description: post.description,
      topic: post.topic,
      authors: post.authors,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      estimatedMinutes: post.estimatedMinutes,
      status: post.status,
      href: post.href,
    }));

  return (
    <main id="main-content">
      <section className="shell blog-hero">
        <div>
          <h1>Blog</h1>
          <p>
            Technical explainers, architecture deep dives, and independent
            analysis of MCP.
          </p>
        </div>
      </section>
      <BlogIndex posts={posts} />
    </main>
  );
}
