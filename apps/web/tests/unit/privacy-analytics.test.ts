import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackPrivacySafeEvent } from '@/components/privacy-analytics';
import { siteConfig } from '@/lib/config';

describe('privacy-safe analytics', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the configured GA4 property', () => {
    expect(siteConfig.googleAnalyticsId).toBe('G-G6ZS6SHP49');
  });

  it('sends event names without user-entered data', () => {
    const va = vi.fn();
    const gtag = vi.fn();
    vi.stubGlobal('window', { va, gtag });

    trackPrivacySafeEvent('newsletter_cta');

    expect(va).toHaveBeenCalledWith('event', { name: 'newsletter_cta' });
    expect(gtag).toHaveBeenCalledWith('event', 'newsletter_cta');
  });
});
