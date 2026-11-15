'use client';

import { Analytics } from '@vercel/analytics/next';
import { sendAnalytics, type AnalyticsProps } from '@/lib/analytics/client';

export type AnalyticsEvent =
  | 'search_used'
  | 'newsletter_cta'
  | 'contribution_cta'
  | 'repository_outbound'
  | 'page_edit';

/**
 * Sends a named event to Vercel Analytics and to first-party analytics.
 * Props must be fixed values chosen in code, never user-entered text.
 */
export function trackPrivacySafeEvent(
  name: AnalyticsEvent,
  props?: AnalyticsProps,
) {
  window.va?.('event', { name });
  sendAnalytics(name, props);
}

export function PrivacyAnalytics() {
  return process.env.NODE_ENV === 'production' ? <Analytics /> : null;
}
