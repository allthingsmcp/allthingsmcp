import { createHash, createHmac } from 'node:crypto';
import { z } from 'zod';

/** Event names: lowercase words joined by underscores. */
export const eventNamePattern = /^[a-z][a-z0-9_]{0,47}$/;
const propKeyPattern = /^[a-z][a-z0-9_]{0,31}$/;

const propValue = z.union([
  z.string().max(100),
  z.number().finite(),
  z.boolean(),
]);

/** What the browser sends. Short keys keep the beacon small. */
export const collectPayloadSchema = z.object({
  /** Event name; `pageview` for page views. */
  n: z.string().regex(eventNamePattern),
  /** The page URL (location.href). Only the path and UTM values are kept. */
  u: z.string().url().max(2048),
  /** document.referrer on the first page view of a visit. */
  r: z.string().max(2048).optional(),
  /** Viewport width, used when the user agent does not reveal the device. */
  w: z.number().int().min(0).max(20_000).optional(),
  /** Optional event properties. Never user-entered text. */
  p: z
    .record(z.string().regex(propKeyPattern), propValue)
    .refine((value) => Object.keys(value).length <= 10)
    .optional(),
});

export type CollectPayload = z.infer<typeof collectPayloadSchema>;

export type AnalyticsRow = {
  name: string;
  hostname: string;
  path: string;
  referrer: string | null;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  country: string | null;
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string | null;
  os: string | null;
  visitor: string;
  props: Record<string, string | number | boolean> | null;
};

const botPattern =
  /bot\b|bot\/|crawl|spider|slurp|scrap|bingpreview|facebookexternalhit|embedly|preview|whatsapp|telegram|discord|slack|headless|lighthouse|pagespeed|pingdom|uptime|monitor|checkly|datadog|curl\/|wget\/|python|httpx|aiohttp|axios\/|node-fetch|undici|go-http-client|java\/|okhttp|libwww|postman|insomnia/i;

export function isBot(userAgent: string) {
  return !userAgent.trim() || botPattern.test(userAgent);
}

const browsers: Array<[string, RegExp]> = [
  ['Edge', /Edg(?:e|A|iOS)?\//],
  ['Opera', /OPR\/|Opera/],
  ['Samsung Internet', /SamsungBrowser\//],
  ['Firefox', /Firefox\/|FxiOS\//],
  ['Chrome', /Chrome\/|CriOS\//],
  ['Safari', /Safari\//],
];

const systems: Array<[string, RegExp]> = [
  ['iOS', /iPhone|iPod|iPad/],
  ['Android', /Android/],
  ['ChromeOS', /CrOS/],
  ['Windows', /Windows/],
  ['macOS', /Macintosh|Mac OS X/],
  ['Linux', /Linux/],
];

export function parseUserAgent(userAgent: string, viewportWidth?: number) {
  const browser =
    browsers.find(([, test]) => test.test(userAgent))?.[0] ?? null;
  const os = systems.find(([, test]) => test.test(userAgent))?.[0] ?? null;
  let device: AnalyticsRow['device'];
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) device = 'tablet';
  else if (/Mobi|iPhone|iPod|Android/i.test(userAgent)) device = 'mobile';
  else if (
    viewportWidth !== undefined &&
    viewportWidth > 0 &&
    viewportWidth < 768
  )
    device = 'mobile';
  else device = 'desktop';
  return { browser, os, device };
}

function clean(value: string | null | undefined, max = 100) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function bareHost(host: string) {
  return host.toLowerCase().replace(/^www\./, '');
}

/** External referrer as origin + path (no query), or null for internal/none. */
export function normaliseReferrer(
  referrer: string | undefined,
  hostname: string,
) {
  if (!referrer) return { referrer: null, referrer_host: null };
  try {
    const url = new URL(referrer);
    if (!['http:', 'https:', 'android-app:'].includes(url.protocol))
      return { referrer: null, referrer_host: null };
    const host = bareHost(url.hostname);
    if (!host || host === bareHost(hostname))
      return { referrer: null, referrer_host: null };
    return {
      referrer: `${url.origin}${url.pathname}`.slice(0, 1024),
      referrer_host: host.slice(0, 253),
    };
  } catch {
    return { referrer: null, referrer_host: null };
  }
}

export function dailySalt(secret: string, now: Date) {
  return createHmac('sha256', secret)
    .update(now.toISOString().slice(0, 10))
    .digest('hex');
}

/** A visitor hash that changes every UTC day and cannot be reversed to an IP. */
export function visitorHash(input: {
  secret: string;
  now: Date;
  ip: string;
  userAgent: string;
  hostname: string;
}) {
  return createHash('sha256')
    .update(
      [
        dailySalt(input.secret, input.now),
        input.ip,
        input.userAgent,
        bareHost(input.hostname),
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 32);
}

export function clientIp(headers: Headers) {
  return (
    headers.get('x-real-ip')?.trim() ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function parseHostnames(value: string | undefined) {
  return new Set(
    (value ?? 'allthingsmcp.com,www.allthingsmcp.com')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Turn a validated payload and request headers into a row, or null when the
 * request should not be stored (bot, foreign origin, unknown host).
 */
export function buildRow(
  payload: CollectPayload,
  headers: Headers,
  options: { secret: string; hostnames: Set<string>; now?: Date },
): AnalyticsRow | null {
  const userAgent = headers.get('user-agent') ?? '';
  if (isBot(userAgent)) return null;

  const page = new URL(payload.u);
  const hostname = page.hostname.toLowerCase();
  if (!options.hostnames.has(hostname)) return null;

  const origin = headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).hostname.toLowerCase() !== hostname) return null;
    } catch {
      return null;
    }
  }

  const country = headers.get('x-vercel-ip-country')?.trim().toUpperCase();
  const params = page.searchParams;
  return {
    name: payload.n,
    hostname,
    // Only the path: query strings can contain search text or other input.
    path: (page.pathname || '/').slice(0, 1024),
    ...normaliseReferrer(payload.r, hostname),
    utm_source: clean(params.get('utm_source')),
    utm_medium: clean(params.get('utm_medium')),
    utm_campaign: clean(params.get('utm_campaign')),
    utm_term: clean(params.get('utm_term')),
    utm_content: clean(params.get('utm_content')),
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    ...parseUserAgent(userAgent, payload.w),
    visitor: visitorHash({
      secret: options.secret,
      now: options.now ?? new Date(),
      ip: clientIp(headers),
      userAgent,
      hostname,
    }),
    props: payload.p && Object.keys(payload.p).length ? payload.p : null,
  };
}
