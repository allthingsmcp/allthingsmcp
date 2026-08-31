import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  GuidesExplorer,
  type GuideDirectoryItem,
} from '@/components/guides-explorer';
import { GuidesOverviewVisual } from '@/components/guides-overview-visual';
import { NewsletterPanel } from '@/components/newsletter-panel';
import { Button } from '@/components/ui/button';
import type { ContentFrontmatter } from '@/lib/content-schema';
import { source } from '@/lib/source';

export const metadata: Metadata = {
  title: 'MCP Guides',
  description:
    'Practical guides for learning, building, operating, and securing MCP systems.',
};

export default function GuidesPage() {
  const production =
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');

  const guides = source
    .getPages()
    .filter((page) => {
      const data = page.data as ContentFrontmatter;
      return (
        data.contentType === 'guide' &&
        ['learn', 'build', 'operate', 'security'].includes(data.section) &&
        (!production || data.status === 'published')
      );
    })
    .map((page) => {
      const data = page.data as ContentFrontmatter;
      return {
        title: data.title,
        description: data.description,
        category: data.section,
        difficulty: data.difficulty,
        estimatedMinutes: data.estimatedMinutes,
        contentType: data.contentType,
        steps: data.guideSteps?.length,
        href: `/guides/${page.slugs.at(-1)}`,
      } as GuideDirectoryItem;
    })
    .sort((a, b) => {
      const categoryOrder = ['learn', 'build', 'operate', 'security'];
      return (
        categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) ||
        a.title.localeCompare(b.title)
      );
    });

  return (
    <main id="main-content">
      <section className="shell guides-hero">
        <div className="guides-hero__copy">
          <p className="eyebrow">Guides</p>
          <h1>MCP Guides</h1>
          <p>
            Practical guides to help you learn MCP, build capable systems,
            operate in production, and secure your implementations.
          </p>
          <div className="button-row">
            <Button href="#all-guides">
              Browse all guides <ArrowRight aria-hidden="true" />
            </Button>
            <Button href="/contribute" variant="secondary">
              Contribute a guide
            </Button>
          </div>
          <p className="guides-hero__note">
            Every technical guide records its specification version and latest
            verification date.{' '}
            <Link href="/contribute">Contribute on GitHub</Link>.
          </p>
        </div>
        <GuidesOverviewVisual />
      </section>

      <GuidesExplorer guides={guides} />

      <div className="shell">
        <NewsletterPanel />
      </div>
    </main>
  );
}
