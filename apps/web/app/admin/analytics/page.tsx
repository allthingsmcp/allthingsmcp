import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminSignIn } from '@/components/admin-analytics/client-controls';
import { AnalyticsDashboard } from '@/components/admin-analytics/dashboard';
import { getAnalyticsAdmin } from '@/lib/analytics/admin';
import { demoDashboard } from '@/lib/analytics/demo';
import {
  earliestEvent,
  loadDashboard,
  parseFilters,
  resolveRange,
  type SearchParams,
} from '@/lib/analytics/queries';
import { siteConfig } from '@/lib/config';
import { createServiceSupabaseClient } from '@/lib/supabase/admin';

const hostname = new URL(siteConfig.siteUrl).hostname;

export const metadata: Metadata = {
  title: 'Analytics',
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await getAnalyticsAdmin();
  if (admin.status === 'signed-out') return <AdminSignIn />;
  if (admin.status !== 'admin') notFound();

  const params = await searchParams;
  const filters = parseFilters(params);

  // Development only: draw the dashboard from generated sample data.
  if (process.env.NODE_ENV === 'development' && params.demo === '1') {
    const range = { ...resolveRange(params, new Date()), demo: true };
    return (
      <AnalyticsDashboard
        data={demoDashboard(range, filters)}
        range={range}
        filters={filters}
        hostname={hostname}
      />
    );
  }

  const client = createServiceSupabaseClient();
  if (!client) {
    return (
      <main id="main-content" className="shell analytics-gate">
        <h1>Analytics is not configured</h1>
        <p>
          Set <code>SUPABASE_SECRET_KEY</code> and apply the analytics migration
          to start collecting data.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p>
            <a href="/admin/analytics?demo=1">Preview with sample data</a>
          </p>
        )}
      </main>
    );
  }

  const range = resolveRange(params, new Date(), await earliestEvent(client));
  const data = await loadDashboard(client, range, filters);
  return (
    <AnalyticsDashboard
      data={data}
      range={range}
      filters={filters}
      hostname={hostname}
    />
  );
}
