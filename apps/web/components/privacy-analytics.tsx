'use client';

import Script from 'next/script';
import { siteConfig } from '@/lib/config';

export type AnalyticsEvent =
  | 'search_used'
  | 'newsletter_cta'
  | 'contribution_cta'
  | 'repository_outbound'
  | 'page_edit';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    va?: (command: 'event', payload: { name: AnalyticsEvent }) => void;
  }
}

export function trackPrivacySafeEvent(name: AnalyticsEvent) {
  window.va?.('event', { name });
  window.gtag?.('event', name);
}

export function PrivacyAnalytics() {
  if (process.env.NODE_ENV !== 'production') return null;

  const vercelEnabled = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS !== 'false';
  const googleAnalyticsId = siteConfig.googleAnalyticsId;
  if (!vercelEnabled && !googleAnalyticsId) return null;

  const serializedGoogleAnalyticsId = JSON.stringify(googleAnalyticsId);

  return (
    <>
      {vercelEnabled && (
        <Script
          src="/_vercel/insights/script.js"
          strategy="afterInteractive"
          data-sdkn="all-things-mcp"
        />
      )}
      {googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', ${serializedGoogleAnalyticsId});`}
          </Script>
        </>
      )}
    </>
  );
}
