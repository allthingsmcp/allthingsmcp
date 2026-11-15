import { describe, expect, it } from 'vitest';
import {
  buildRow,
  collectPayloadSchema,
  isBot,
  normaliseReferrer,
  parseHostnames,
  parseUserAgent,
  visitorHash,
} from '@/lib/analytics/collect';

const chromeMac =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const safariIphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const edgeWindows =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0';
const chromeAndroid =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const firefoxLinux =
  'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0';
const ipad =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const options = {
  secret: 'test-secret',
  hostnames: parseHostnames('www.allthingsmcp.com,allthingsmcp.com'),
  now: new Date('2026-11-15T12:00:00Z'),
};

function headers(extra: Record<string, string> = {}) {
  return new Headers({
    'user-agent': chromeMac,
    origin: 'https://www.allthingsmcp.com',
    'x-forwarded-for': '203.0.113.9',
    'x-vercel-ip-country': 'ng',
    ...extra,
  });
}

describe('user agent parsing', () => {
  it.each([
    [chromeMac, 'Chrome', 'macOS', 'desktop'],
    [safariIphone, 'Safari', 'iOS', 'mobile'],
    [edgeWindows, 'Edge', 'Windows', 'desktop'],
    [chromeAndroid, 'Chrome', 'Android', 'mobile'],
    [firefoxLinux, 'Firefox', 'Linux', 'desktop'],
    [ipad, 'Safari', 'iOS', 'tablet'],
  ])('reads %s', (agent, browser, os, device) => {
    expect(parseUserAgent(agent)).toEqual({ browser, os, device });
  });

  it('uses the viewport width when the agent looks like a desktop', () => {
    expect(parseUserAgent(chromeMac, 390).device).toBe('mobile');
  });

  it('recognises bots and empty agents', () => {
    expect(isBot('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true);
    expect(isBot('Mozilla/5.0 HeadlessChrome/131.0.0.0')).toBe(true);
    expect(isBot('curl/8.7.1')).toBe(true);
    expect(isBot('')).toBe(true);
    expect(isBot(chromeMac)).toBe(false);
  });
});

describe('referrers', () => {
  it('keeps external origin and path, without the query', () => {
    expect(
      normaliseReferrer(
        'https://www.google.com/search?q=mcp',
        'www.allthingsmcp.com',
      ),
    ).toEqual({
      referrer: 'https://www.google.com/search',
      referrer_host: 'google.com',
    });
  });

  it('treats internal, missing and invalid referrers as none', () => {
    const none = { referrer: null, referrer_host: null };
    expect(
      normaliseReferrer(
        'https://allthingsmcp.com/blog',
        'www.allthingsmcp.com',
      ),
    ).toEqual(none);
    expect(normaliseReferrer(undefined, 'www.allthingsmcp.com')).toEqual(none);
    expect(normaliseReferrer('not a url', 'www.allthingsmcp.com')).toEqual(
      none,
    );
  });
});

describe('visitor hash', () => {
  const base = {
    secret: 's',
    ip: '203.0.113.9',
    userAgent: chromeMac,
    hostname: 'www.allthingsmcp.com',
  };

  it('is stable within a UTC day and changes the next day', () => {
    const morning = visitorHash({
      ...base,
      now: new Date('2026-11-15T01:00Z'),
    });
    const evening = visitorHash({
      ...base,
      now: new Date('2026-11-15T23:00Z'),
    });
    const tomorrow = visitorHash({
      ...base,
      now: new Date('2026-11-16T01:00Z'),
    });
    expect(morning).toBe(evening);
    expect(morning).not.toBe(tomorrow);
    expect(morning).toMatch(/^[0-9a-f]{32}$/);
  });

  it('differs between visitors and treats www and apex as one site', () => {
    const now = new Date('2026-11-15T01:00Z');
    const a = visitorHash({ ...base, now });
    expect(visitorHash({ ...base, now, ip: '203.0.113.10' })).not.toBe(a);
    expect(visitorHash({ ...base, now, hostname: 'allthingsmcp.com' })).toBe(a);
  });
});

describe('payloads and rows', () => {
  it('validates event names and props', () => {
    const page = 'https://www.allthingsmcp.com/';
    expect(
      collectPayloadSchema.safeParse({ n: 'pageview', u: page }).success,
    ).toBe(true);
    expect(
      collectPayloadSchema.safeParse({ n: 'Page View', u: page }).success,
    ).toBe(false);
    const tooMany = Object.fromEntries(
      Array.from({ length: 11 }, (_, index) => [`k${index}`, 1]),
    );
    expect(
      collectPayloadSchema.safeParse({ n: 'search_used', u: page, p: tooMany })
        .success,
    ).toBe(false);
    expect(
      collectPayloadSchema.safeParse({
        n: 'search_used',
        u: page,
        p: { surface: 'x'.repeat(101) },
      }).success,
    ).toBe(false);
  });

  it('stores the path without the query, plus UTM values and country', () => {
    const row = buildRow(
      {
        n: 'pageview',
        u: 'https://www.allthingsmcp.com/guides?q=secret&utm_source=newsletter&utm_campaign=launch',
        r: 'https://news.ycombinator.com/item?id=1',
      },
      headers(),
      options,
    );
    expect(row).toMatchObject({
      name: 'pageview',
      hostname: 'www.allthingsmcp.com',
      path: '/guides',
      referrer_host: 'news.ycombinator.com',
      referrer: 'https://news.ycombinator.com/item',
      utm_source: 'newsletter',
      utm_campaign: 'launch',
      utm_medium: null,
      country: 'NG',
      browser: 'Chrome',
      os: 'macOS',
      device: 'desktop',
      props: null,
    });
    expect(JSON.stringify(row)).not.toContain('secret');
    expect(JSON.stringify(row)).not.toContain('203.0.113.9');
  });

  it('drops bots, unknown hosts and mismatched origins', () => {
    const payload = { n: 'pageview', u: 'https://www.allthingsmcp.com/' };
    expect(
      buildRow(payload, headers({ 'user-agent': 'Googlebot/2.1' }), options),
    ).toBeNull();
    expect(
      buildRow(
        { n: 'pageview', u: 'https://evil.example/' },
        headers({ origin: 'https://evil.example' }),
        options,
      ),
    ).toBeNull();
    expect(
      buildRow(payload, headers({ origin: 'https://evil.example' }), options),
    ).toBeNull();
  });
});
