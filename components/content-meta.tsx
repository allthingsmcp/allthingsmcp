import {
  CalendarDays,
  Clock3,
  ExternalLink,
  PencilLine,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { AnalyticsLink } from '@/components/analytics-link';
import { isStale, type ContentFrontmatter } from '@/lib/content-schema';
import { siteConfig } from '@/lib/config';

export function ContentMeta({
  data,
  path,
  showAuthors = true,
}: {
  data: ContentFrontmatter;
  path: string;
  showAuthors?: boolean;
}) {
  const editUrl = `${siteConfig.githubRepo}/edit/main/content/${path}`;
  const reportUrl = `${siteConfig.githubRepo}/issues/new?template=content.yml&title=${encodeURIComponent(`Content: ${data.title}`)}`;
  return (
    <>
      <div className="content-meta">
        <span>
          <Clock3 />
          {data.estimatedMinutes
            ? `${data.estimatedMinutes} min`
            : data.contentType}
        </span>
        <span>
          <CalendarDays />
          Updated {data.updatedAt}
        </span>
        {data.specVersion && (
          <span>
            <ShieldCheck />
            Spec {data.specVersion}
          </span>
        )}
        {showAuthors && <span>By {data.authors.join(', ')}</span>}
      </div>
      {isStale(data.lastVerified) && (
        <div className="stale-warning">
          <TriangleAlert />
          This technical content has not been verified in the last 180 days.
        </div>
      )}
      <div className="page-actions">
        <AnalyticsLink href={editUrl} eventName="page_edit">
          <PencilLine />
          Edit this page on GitHub
        </AnalyticsLink>
        <AnalyticsLink href={reportUrl} eventName="contribution_cta">
          <ExternalLink />
          Report outdated content
        </AnalyticsLink>
      </div>
    </>
  );
}
