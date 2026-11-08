import type { Context } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';

/**
 * Resolve the client address used for rate limiting.
 *
 * `X-Forwarded-For` is client-controlled unless a trusted proxy overwrites or
 * appends to it, so it is ignored by default. Set `TRUSTED_PROXY_COUNT` to the
 * number of proxies you operate in front of the runtime (for example 1 behind a
 * single load balancer) to read the entry those proxies appended.
 */
export function resolveClientIp(
  context: Context,
  trustedProxyCount = parseTrustedProxyCount(process.env.TRUSTED_PROXY_COUNT),
): string {
  if (trustedProxyCount > 0) {
    const hops = (context.req.header('x-forwarded-for') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const forwarded = hops[hops.length - trustedProxyCount];
    if (forwarded) return forwarded;
  }

  try {
    return getConnInfo(context).remote.address ?? 'unknown';
  } catch {
    // No socket information, for example when the app is called in tests.
    return 'unknown';
  }
}

export function parseTrustedProxyCount(value: string | undefined): number {
  const count = Number(value ?? 0);
  return Number.isInteger(count) && count > 0 ? count : 0;
}
