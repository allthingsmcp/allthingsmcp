'use client';

import { Analytics } from '@vercel/analytics/next';

export type AnalyticsEvent =
  | 'search_used'
  | 'newsletter_cta'
  | 'contribution_cta'
  | 'repository_outbound'
  | 'page_edit';

export function trackPrivacySafeEvent(name: AnalyticsEvent) {
  window.va?.('event', { name });
}

export function PrivacyAnalytics() {
  return process.env.NODE_ENV === 'production' ? <Analytics /> : null;
}
