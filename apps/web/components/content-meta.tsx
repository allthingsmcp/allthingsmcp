import {
  CalendarDays,
  Clock3,
  ExternalLink,
  PencilLine,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AnalyticsLink } from '@/components/analytics-link';
import { isStale, type ContentFrontmatter } from '@/lib/content-schema';
import { siteConfig } from '@/lib/config';

export function ContentMeta({
  data,
  path,
  pagePath,
  showAuthors = true,
  share,
}: {
  data: ContentFrontmatter;
  path: string;
  pagePath: string;
  showAuthors?: boolean;
  share?: ReactNode;
}) {
  const editUrl = `${siteConfig.githubRepo}/edit/main/content/${path}`;
  const pageUrl = new URL(pagePath, siteConfig.siteUrl).toString();
  const reportUrl = new URL(`${siteConfig.githubRepo}/issues/new`);
  reportUrl.searchParams.set('template', 'content.yml');
  reportUrl.searchParams.set('title', `Content: ${data.title}`);
  reportUrl.searchParams.set('page', pageUrl);
  reportUrl.searchParams.set('issue', 'This content is outdated because...');
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
        <AnalyticsLink href={reportUrl.toString()} eventName="contribution_cta">
          <ExternalLink />
          Report outdated content
        </AnalyticsLink>
        {share}
      </div>
    </>
  );
}
