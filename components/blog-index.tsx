'use client';

import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Network,
  Rocket,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { NewsletterPanel } from '@/components/newsletter-panel';

export type BlogTopic =
  | 'concepts'
  | 'architecture'
  | 'security'
  | 'production'
  | 'ecosystem'
  | 'opinion';

export type BlogPostSummary = {
  title: string;
  description: string;
  topic: BlogTopic;
  authors: string[];
  publishedAt?: string;
  updatedAt: string;
  estimatedMinutes?: number;
  status: 'draft' | 'published';
  href: string;
};

const topicLabels: Record<BlogTopic, string> = {
  concepts: 'Concepts',
  architecture: 'Architecture',
  security: 'Security',
  production: 'Production',
  ecosystem: 'Ecosystem',
  opinion: 'Opinion',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function PostMeta({ post }: { post: BlogPostSummary }) {
  return (
    <div className="blog-post-meta">
      <span>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
      {post.estimatedMinutes && <span>{post.estimatedMinutes} min read</span>}
      {post.status === 'draft' && <b>Draft preview</b>}
    </div>
  );
}

function BlogCover({
  topic,
  compact = false,
}: {
  topic: BlogTopic;
  compact?: boolean;
}) {
  const icons = {
    concepts: FileText,
    architecture: Network,
    security: ShieldCheck,
    production: Rocket,
    ecosystem: Network,
    opinion: FileText,
  };
  const CoverIcon = icons[topic];
  return (
    <div
      className={[
        'blog-cover',
        `blog-cover--${topic}`,
        compact && 'blog-cover--compact',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <span />
      <div>
        <CoverIcon />
        <b>MCP</b>
      </div>
      <span />
    </div>
  );
}

export function BlogIndex({ posts }: { posts: BlogPostSummary[] }) {
  const [activeTopic, setActiveTopic] = useState<'all' | BlogTopic>('all');
  const availableTopics = useMemo(
    () => Array.from(new Set(posts.map((post) => post.topic))),
    [posts],
  );
  const postsForTopic =
    activeTopic === 'all'
      ? posts
      : posts.filter((post) => post.topic === activeTopic);
  const featured = postsForTopic[0];
  const visiblePosts = postsForTopic.slice(1);

  if (!posts.length) {
    return (
      <section className="shell blog-empty-state">
        <p className="eyebrow">Editorial work in progress</p>
        <h2>The first posts are being reviewed</h2>
        <p>
          Technical drafts stay out of production until their claims and
          specification references have passed review.
        </p>
        <Link href="/contribute">Contribute an article</Link>
      </section>
    );
  }

  return (
    <div className="shell blog-layout">
      <div className="blog-main">
        {featured && (
          <Link className="blog-feature" href={featured.href}>
            <BlogCover topic={featured.topic} />
            <div className="blog-feature__copy">
              <span>Featured · {topicLabels[featured.topic]}</span>
              <h2>{featured.title}</h2>
              <p>{featured.description}</p>
              <div className="blog-feature__footer">
                <div>
                  <strong>{featured.authors[0]}</strong>
                  <PostMeta post={featured} />
                </div>
                <b>
                  Read article <ArrowRight aria-hidden="true" />
                </b>
              </div>
            </div>
          </Link>
        )}

        <div className="blog-topic-filters" aria-label="Filter blog posts">
          <button
            className={activeTopic === 'all' ? 'is-active' : ''}
            aria-pressed={activeTopic === 'all'}
            onClick={() => setActiveTopic('all')}
          >
            All
          </button>
          {availableTopics.map((topic) => (
            <button
              className={activeTopic === topic ? 'is-active' : ''}
              aria-pressed={activeTopic === topic}
              onClick={() => setActiveTopic(topic)}
              key={topic}
            >
              {topicLabels[topic]}
            </button>
          ))}
        </div>

        <section aria-labelledby="latest-posts-title">
          <div className="blog-section-heading">
            <div>
              <p className="eyebrow">
                {activeTopic === 'all'
                  ? `${posts.length} posts`
                  : topicLabels[activeTopic]}
              </p>
              <h2 id="latest-posts-title">
                {activeTopic === 'all'
                  ? 'Latest posts'
                  : `${topicLabels[activeTopic]} posts`}
              </h2>
            </div>
          </div>
          {visiblePosts.length ? (
            <div className="blog-post-grid" aria-live="polite">
              {visiblePosts.map((post) => (
                <Link
                  className="blog-post-card"
                  href={post.href}
                  key={post.href}
                >
                  <BlogCover topic={post.topic} compact />
                  <span>{topicLabels[post.topic]}</span>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                  <PostMeta post={post} />
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="blog-filter-empty" aria-live="polite">
              <h3>
                No additional {topicLabels[activeTopic as BlogTopic]} posts yet
              </h3>
              <p>More articles in this topic are in the editorial pipeline.</p>
              <button onClick={() => setActiveTopic('all')}>
                View all posts
              </button>
            </div>
          )}
        </section>
      </div>

      <aside className="blog-sidebar">
        <section
          className="editors-picks"
          aria-labelledby="editors-picks-title"
        >
          <p className="eyebrow">Start here</p>
          <h2 id="editors-picks-title">Editor&apos;s picks</h2>
          <div>
            {posts.slice(0, 3).map((post) => (
              <Link href={post.href} key={post.href}>
                <BlogCover topic={post.topic} compact />
                <span>
                  <strong>{post.title}</strong>
                  <PostMeta post={post} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <NewsletterPanel compact />
      </aside>
    </div>
  );
}
