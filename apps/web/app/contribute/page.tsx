import {
  ArrowRight,
  FileText,
  GitPullRequest,
  MessageSquareText,
} from 'lucide-react';
import { AnalyticsLink } from '@/components/analytics-link';
import { InfoPage } from '@/components/info-page';
import { ContentCard } from '@/components/content-card';
import { siteConfig } from '@/lib/config';
import { source } from '@/lib/source';
import { contributorGuideSlugs } from '@/lib/site-data';
import type { ContentFrontmatter } from '@/lib/content-schema';

export default function ContributePage() {
  const guides = contributorGuideSlugs.flatMap((slug) => {
    const page = source.getPages().find((item) => item.slugs.at(-1) === slug);
    const data = page?.data as ContentFrontmatter | undefined;
    return data && data.status === 'published' ? [{ slug, data }] : [];
  });
  return (
    <InfoPage
      title="Contribute"
      description="Improve a guide, correct an error, add an ecosystem entry, or help build the platform."
    >
      <div className="contribute-grid">
        <article>
          <FileText />
          <h2>Edit content</h2>
          <p>
            Content is plain Markdown or reviewed MDX with validated
            frontmatter. Every published page links back to its source.
          </p>
        </article>
        <article>
          <GitPullRequest />
          <h2>Open a pull request</h2>
          <p>
            You do not need to propose a change first. Automated checks and
            maintainer review keep contributions consistent.
          </p>
        </article>
        <article>
          <MessageSquareText />
          <h2>Report a gap</h2>
          <p>
            Open a focused issue for outdated content, a missing topic, or a
            platform improvement.
          </p>
        </article>
      </div>
      {guides.length > 0 && (
        <>
          <h2>Contributor guides</h2>
          <div className="stack-list">
            {guides.map(({ slug, data }) => (
              <ContentCard
                key={slug}
                item={{
                  title: data.title,
                  description: data.description,
                  icon: 'code',
                  href: `/guides/${slug}`,
                  meta: [
                    data.guideSteps?.length &&
                      `${data.guideSteps.length} steps`,
                    data.estimatedMinutes && `${data.estimatedMinutes} min`,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                }}
              />
            ))}
          </div>
        </>
      )}
      <h2>Contribution flow</h2>
      <ol>
        <li>Fork the public repository and create a focused branch.</li>
        <li>Read the content contract and the nearby examples.</li>
        <li>Run validation and tests locally.</li>
        <li>Open a pull request and complete the license acknowledgment.</li>
        <li>Address editorial and technical review feedback.</li>
      </ol>
      <p>
        <AnalyticsLink
          className="text-link"
          href={siteConfig.githubRepo}
          eventName="repository_outbound"
        >
          Open the repository <ArrowRight />
        </AnalyticsLink>
      </p>
    </InfoPage>
  );
}
