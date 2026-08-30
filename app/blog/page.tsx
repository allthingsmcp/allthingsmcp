import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BlogDirectory, type BlogSummary } from '@/components/blog-directory';
import { NewsletterPanel } from '@/components/newsletter-panel';
import type { BlogPostFrontmatter } from '@/lib/content-schema';
import { canonicalContentUrl, pagesByType } from '@/lib/content';

export default function BlogPage() {
  const pages = pagesByType('article');
  const posts: BlogSummary[] = pages.map((page) => {
    const data = page.data as BlogPostFrontmatter;
    return {
      title: data.title,
      description: data.description,
      topic: data.blogTopic,
      estimatedMinutes: data.estimatedMinutes ?? 0,
      publishedAt: data.publishedAt ?? data.updatedAt,
      href: canonicalContentUrl(page),
    };
  });
  const featured =
    posts.find((post) => post.title.includes('Production')) ?? posts[0];
  return (
    <main id="main-content" className="blog-page">
      <section className="shell publication-hero publication-hero--blog">
        <p className="eyebrow">Independent technical publication</p>
        <h1>The All Things MCP Blog</h1>
        <p>
          Architecture explainers, security analysis, production lessons, and
          perspective on how MCP is evolving.
        </p>
      </section>
      {featured && (
        <section className="shell featured-article">
          <div>
            <p className="eyebrow">Featured · {featured.topic}</p>
            <h2>{featured.title}</h2>
            <p>{featured.description}</p>
            <Link href={featured.href}>
              Read the feature <ArrowRight />
            </Link>
          </div>
          <div className="featured-article__signal" aria-hidden="true">
            <span>MCP</span>
            <i />
            <i />
            <i />
            <b>Analysis</b>
          </div>
        </section>
      )}
      <section className="shell blog-library">
        <div className="editorial-heading">
          <p className="eyebrow">Latest writing</p>
          <h2>Analysis for people building real systems.</h2>
        </div>
        <BlogDirectory posts={posts} />
      </section>
      <section className="shell recommended-reading">
        <p className="eyebrow">Recommended reading</p>
        <h2>Follow the system from protocol to production.</h2>
        <div>
          {posts.slice(0, 3).map((post, index) => (
            <Link href={post.href} key={post.href}>
              <span>0{index + 1}</span>
              <h3>{post.title}</h3>
              <ArrowRight />
            </Link>
          ))}
        </div>
      </section>
      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
