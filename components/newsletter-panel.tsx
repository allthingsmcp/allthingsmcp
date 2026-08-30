import { Mail } from 'lucide-react';
import { AnalyticsLink } from '@/components/analytics-link';
import { siteConfig } from '@/lib/config';

export function NewsletterPanel({
  compact = false,
  dark = false,
}: {
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <section
      className={[
        'newsletter-panel',
        compact && 'newsletter-panel--compact',
        dark && 'newsletter-panel--dark',
      ]
        .filter(Boolean)
        .join(' ')}
      id="newsletter"
      aria-labelledby="newsletter-title"
    >
      <div className="newsletter-icon">
        <Mail aria-hidden="true" />
      </div>
      <div className="newsletter-copy">
        <h2 id="newsletter-title">
          {dark
            ? "MCP moves fast. We'll help you keep up."
            : 'Stay up to date with MCP'}
        </h2>
        <p>
          Get new guides, technical analysis, and important specification
          changes delivered to your inbox.
        </p>
      </div>
      <div className="newsletter-form">
        {siteConfig.substackEmbedUrl ? (
          <iframe
            title="Subscribe to All Things MCP"
            src={siteConfig.substackEmbedUrl}
            loading="lazy"
          />
        ) : (
          <AnalyticsLink
            className="button button--primary"
            href={siteConfig.substackUrl}
            eventName="newsletter_cta"
          >
            Subscribe on Substack
          </AnalyticsLink>
        )}
        <small>No spam. Unsubscribe anytime.</small>
      </div>
    </section>
  );
}
