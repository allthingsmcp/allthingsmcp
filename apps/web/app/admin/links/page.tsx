import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminSignIn } from '@/components/admin-analytics/client-controls';
import { LinkBuilder } from '@/components/admin-analytics/link-builder';
import sitemap from '@/app/sitemap';
import { getAnalyticsAdmin } from '@/lib/analytics/admin';
import { parseHostnames } from '@/lib/analytics/collect';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Campaign links',
  robots: { index: false, follow: false },
};

export default async function CampaignLinksPage() {
  const admin = await getAnalyticsAdmin();
  if (admin.status === 'signed-out') return <AdminSignIn />;
  if (admin.status !== 'admin') notFound();

  const pages = [
    ...new Set(sitemap().map((entry) => new URL(entry.url).pathname)),
  ].sort();
  const hosts = [
    ...parseHostnames(process.env.ANALYTICS_HOSTNAMES),
    new URL(siteConfig.siteUrl).hostname,
  ];

  return (
    <main id="main-content" className="shell analytics-page">
      <header className="analytics-header">
        <div className="analytics-header__title">
          <h1>Campaign links</h1>
          <p className="analytics-header__meta">
            Tag the links you share, then see how each one performed.
          </p>
        </div>
        <Link className="button button--secondary" href="/admin/analytics">
          Back to analytics
        </Link>
      </header>
      <LinkBuilder
        siteUrl={siteConfig.siteUrl}
        siteHosts={[...new Set(hosts)]}
        pages={pages}
      />
    </main>
  );
}
