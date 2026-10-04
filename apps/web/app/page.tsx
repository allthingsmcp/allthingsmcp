import type { Metadata } from 'next';
import { BlogPostCard, type BlogTopic } from '@/components/blog-post-card';
import { ContentCard } from '@/components/content-card';
import { GuidesOverviewVisual } from '@/components/guides-overview-visual';
import { NewsletterPanel } from '@/components/newsletter-panel';
import type { ContentFrontmatter } from '@/lib/content-schema';
import type { CardItem } from '@/lib/site-data';
import { source } from '@/lib/source';
import styles from './home.module.css';

export const metadata: Metadata = {
  title: { absolute: 'All Things MCP' },
  description:
    'Practical guides and independent analysis for MCP, its official extensions, and the ecosystem around it.',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

const startingGuide = 'build-a-minimal-mcp-server';

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function HomePage() {
  const production =
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');
  const content = source
    .getPages()
    .map((page) => ({
      data: page.data as ContentFrontmatter,
      slug: page.slugs.at(-1) ?? '',
    }))
    .filter(({ data }) => !production || data.status === 'published')
    .sort(
      (a, b) =>
        (b.data.publishedAt ?? b.data.updatedAt).localeCompare(
          a.data.publishedAt ?? a.data.updatedAt,
        ) || a.data.title.localeCompare(b.data.title),
    );

  const guides = content
    .filter(
      ({ data }) =>
        data.contentType === 'guide' &&
        ['learn', 'build', 'operate', 'security'].includes(data.section),
    )
    .sort(
      (a, b) =>
        Number(b.slug === startingGuide) - Number(a.slug === startingGuide),
    );
  const posts = content.filter(({ data }) => data.contentType === 'article');

  return (
    <main id="main-content" className={`shell ${styles.page}`}>
      <section className={styles.intro} aria-labelledby="home-title">
        <div className={styles.introCopy}>
          <p className="eyebrow">An independent field guide</p>
          <h1 id="home-title">
            Learn. Build. Ship with <span>MCP.</span>
          </h1>
          <p className={styles.description}>
            Practical guides and independent analysis for MCP and the ecosystem
            growing around it. Learn the protocol, build with official
            extensions, and understand the apps, infrastructure, security, and
            emerging standards shaping how agents interact with software.
          </p>
        </div>
        <GuidesOverviewVisual />
      </section>

      <section
        id="guides"
        className={styles.collection}
        aria-labelledby="guides-title"
      >
        <div className={styles.heading}>
          <h2 id="guides-title">Guides</h2>
          <p>Build something, one step at a time.</p>
        </div>
        {guides.length ? (
          <ul className={styles.guides}>
            {guides.map(({ data, slug }) => {
              const recommended =
                slug === startingGuide && data.status === 'published';
              const item: CardItem = {
                title: data.title,
                description: data.description,
                icon: 'code',
                href: `/guides/${slug}`,
                badge:
                  data.status === 'draft'
                    ? 'Draft preview'
                    : recommended
                      ? 'Start here'
                      : undefined,
                meta: [
                  data.guideSteps?.length && `${data.guideSteps.length} steps`,
                  data.estimatedMinutes && `${data.estimatedMinutes} min`,
                  data.difficulty && sentenceCase(data.difficulty),
                ]
                  .filter(Boolean)
                  .join(' · '),
              };
              return (
                <li
                  className={recommended ? styles.recommended : undefined}
                  key={slug}
                >
                  <ContentCard item={item} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.empty}>
            The first guides are being prepared. Get new guides in your inbox
            through the newsletter below.
          </p>
        )}
      </section>

      <section
        id="blog"
        className={styles.collection}
        aria-labelledby="blog-title"
      >
        <div className={styles.heading}>
          <h2 id="blog-title">From the blog</h2>
          <p>
            Understand the protocol, its extensions, and the ecosystem forming
            around it.
          </p>
        </div>
        {posts.length ? (
          <ul className={styles.posts}>
            {posts.map(({ data, slug }) => (
              <li key={slug}>
                <BlogPostCard
                  compactCover={false}
                  post={{
                    title: data.title,
                    description: data.description,
                    href: `/blog/${slug}`,
                    topic: data.blogTopic as BlogTopic,
                    authors: data.authors,
                    publishedAt: data.publishedAt,
                    updatedAt: data.updatedAt,
                    estimatedMinutes: data.estimatedMinutes,
                    status: data.status,
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>
            The first articles are being reviewed. Subscribe below to hear when
            they are published.
          </p>
        )}
      </section>

      <NewsletterPanel />
    </main>
  );
}
