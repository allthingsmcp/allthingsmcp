import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { parseTrustedProxyCount, resolveClientIp } from '../src/client-ip.js';

async function resolve(headers: Record<string, string>, trusted: number) {
  let result = '';
  const app = new Hono();
  app.get('/', (context) => {
    result = resolveClientIp(context, trusted);
    return context.text('ok');
  });
  await app.request('/', { headers });
  return result;
}

describe('resolveClientIp', () => {
  it('ignores X-Forwarded-For when no proxy is trusted', async () => {
    expect(await resolve({ 'x-forwarded-for': '1.2.3.4' }, 0)).toBe('unknown');
  });

  it('reads the entry appended by the last trusted proxy', async () => {
    expect(
      await resolve({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }, 1),
    ).toBe('203.0.113.9');
    expect(
      await resolve({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9, 10.0.0.1' }, 2),
    ).toBe('203.0.113.9');
  });

  it('falls back when the header is missing', async () => {
    expect(await resolve({}, 1)).toBe('unknown');
  });

  it('parses the env value defensively', () => {
    expect(parseTrustedProxyCount(undefined)).toBe(0);
    expect(parseTrustedProxyCount('abc')).toBe(0);
    expect(parseTrustedProxyCount('-1')).toBe(0);
    expect(parseTrustedProxyCount('2')).toBe(2);
  });
});
