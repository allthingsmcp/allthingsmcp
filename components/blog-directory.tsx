'use client';

import Link from 'next/link';
import { ArrowRight, Clock3 } from 'lucide-react';
import { useState } from 'react';
import type { BlogTopic } from '@/lib/content-schema';

export type BlogSummary = {
  title: string;
  description: string;
  topic: BlogTopic;
  estimatedMinutes: number;
  publishedAt: string;
  href: string;
};

const topics: Array<'all' | BlogTopic> = [
  'all',
  'concepts',
  'architecture',
  'security',
  'production',
  'ecosystem',
  'opinion',
];

export function BlogDirectory({ posts }: { posts: BlogSummary[] }) {
  const [topic, setTopic] = useState<'all' | BlogTopic>('all');
  const visible =
    topic === 'all' ? posts : posts.filter((post) => post.topic === topic);
  return (
    <>
      <div className="blog-filters" aria-label="Filter Blog posts by topic">
        {topics.map((item) => (
          <button
            type="button"
            aria-pressed={topic === item}
            onClick={() => setTopic(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="blog-list" aria-live="polite">
        {visible.length ? (
          visible.map((post) => (
            <Link href={post.href} key={post.href}>
              <div>
                <span>{post.topic}</span>
                <span>{post.publishedAt}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <div className="blog-card__meta">
                <span>
                  <Clock3 /> {post.estimatedMinutes} min read
                </span>
                <b>
                  Read article <ArrowRight />
                </b>
              </div>
            </Link>
          ))
        ) : (
          <div className="blog-empty">
            <h3>No published posts in this topic yet.</h3>
            <p>
              Choose another topic or subscribe for the next editorial release.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
