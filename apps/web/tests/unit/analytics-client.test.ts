// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Client = typeof import('@/lib/analytics/client');
let client: Client;
const beacon = vi.fn<(url: string, body: Blob) => boolean>(() => true);

function readBlob(blob: Blob) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
}

async function sent() {
  return Promise.all(
    beacon.mock.calls.map(async ([, body]) => JSON.parse(await readBlob(body))),
  );
}

beforeEach(async () => {
  vi.resetModules();
  client = await import('@/lib/analytics/client');
  Object.defineProperty(navigator, 'sendBeacon', {
    value: beacon,
    configurable: true,
  });
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    value: false,
    configurable: true,
  });
  window.localStorage.clear();
  window.history.replaceState(null, '', '/guides?utm_source=newsletter');
  Object.defineProperty(document, 'referrer', {
    value: 'https://news.ycombinator.com/',
    configurable: true,
  });
});

afterEach(() => {
  beacon.mockClear();
});

describe('first-party analytics client', () => {
  it('sends nothing until enabled', () => {
    client.sendAnalytics('pageview');
    expect(beacon).not.toHaveBeenCalled();
  });

  it('sends the referrer only with the first page view', async () => {
    client.enableFirstPartyAnalytics();
    client.sendAnalytics('pageview');
    client.sendAnalytics('pageview');
    client.sendAnalytics('search_used', { surface: 'header' });
    const [first, second, event] = await sent();
    expect(beacon.mock.calls[0]![0]).toBe('/api/e');
    expect(first).toMatchObject({
      n: 'pageview',
      u: 'http://localhost:3000/guides?utm_source=newsletter',
      r: 'https://news.ycombinator.com/',
    });
    expect(second.r).toBeUndefined();
    expect(event).toMatchObject({ n: 'search_used', p: { surface: 'header' } });
  });

  it('skips admin pages, privacy signals and ignored browsers', () => {
    client.enableFirstPartyAnalytics();
    window.history.replaceState(null, '', '/admin/analytics');
    client.sendAnalytics('pageview');
    window.history.replaceState(null, '', '/');
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: true,
      configurable: true,
    });
    client.sendAnalytics('pageview');
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: false,
      configurable: true,
    });
    client.setBrowserIgnored(true);
    client.sendAnalytics('pageview');
    expect(beacon).not.toHaveBeenCalled();
    client.setBrowserIgnored(false);
    expect(client.ignorePreference()).toBe('0');
    client.sendAnalytics('pageview');
    expect(beacon).toHaveBeenCalledOnce();
  });
});
