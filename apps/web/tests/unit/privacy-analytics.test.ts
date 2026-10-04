// @vitest-environment jsdom
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PrivacyAnalytics,
  trackPrivacySafeEvent,
} from '@/components/privacy-analytics';

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => createElement('script', { 'data-vercel-analytics': true }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  delete window.va;
});

describe('privacy-safe analytics', () => {
  it('loads Vercel Analytics in production without a consent prompt', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(createElement(PrivacyAnalytics));

    expect(document.querySelector('[data-vercel-analytics]')).not.toBeNull();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.querySelector('#google-analytics')).toBeNull();
  });

  it('does not load deployment analytics during local development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(createElement(PrivacyAnalytics));

    expect(document.querySelector('[data-vercel-analytics]')).toBeNull();
  });

  it('sends named events without user-entered data', () => {
    const va = vi.fn();
    window.va = va;

    trackPrivacySafeEvent('newsletter_cta');

    expect(va).toHaveBeenCalledWith('event', { name: 'newsletter_cta' });
  });
});
