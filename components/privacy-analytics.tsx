'use client';

import Script from 'next/script';

export type AnalyticsEvent =
  | 'search_used'
  | 'newsletter_cta'
  | 'contribution_cta'
  | 'repository_outbound'
  | 'page_edit';

declare global {
  interface Window {
    va?: (command: 'event', payload: { name: AnalyticsEvent }) => void;
  }
}

export function trackPrivacySafeEvent(name: AnalyticsEvent) {
  window.va?.('event', { name });
}

export function PrivacyAnalytics() {
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === 'false'
  ) {
    return null;
  }
  return (
    <Script
      src="/_vercel/insights/script.js"
      strategy="afterInteractive"
      data-sdkn="all-things-mcp"
    />
  );
}
