import { Mail } from 'lucide-react';
import { AnalyticsLink } from '@/components/analytics-link';
import { siteConfig } from '@/lib/config';

export function NewsletterPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={
        compact
          ? 'newsletter-panel newsletter-panel--compact'
          : 'newsletter-panel'
      }
      id="newsletter"
      aria-labelledby="newsletter-title"
    >
      <div className="newsletter-icon">
        <Mail aria-hidden="true" />
      </div>
      <div className="newsletter-copy">
        <h2 id="newsletter-title">Stay up to date with MCP</h2>
        <p>
          Get independent guides, specification updates, and ecosystem notes in
          your inbox.
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
