import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Network,
  Rocket,
  ShieldCheck,
} from 'lucide-react';

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

export const topicLabels: Record<BlogTopic, string> = {
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

export function BlogPostMeta({ post }: { post: BlogPostSummary }) {
  const date = post.publishedAt ?? post.updatedAt;

  return (
    <div className="blog-post-meta">
      <time dateTime={date}>
        {post.publishedAt ? 'Published' : 'Updated'} {formatDate(date)}
      </time>
      {post.estimatedMinutes && <span>{post.estimatedMinutes} min read</span>}
      {post.status === 'draft' && <b>Draft preview</b>}
    </div>
  );
}

export function BlogCover({
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

export function BlogPostCard({
  post,
  compactCover = true,
}: {
  post: BlogPostSummary;
  compactCover?: boolean;
}) {
  return (
    <Link className="blog-post-card" href={post.href}>
      <BlogCover topic={post.topic} compact={compactCover} />
      <span>{topicLabels[post.topic]}</span>
      <h3>{post.title}</h3>
      <p>{post.description}</p>
      <BlogPostMeta post={post} />
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
