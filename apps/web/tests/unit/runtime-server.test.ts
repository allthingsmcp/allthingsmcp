import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => null),
}));

import {
  fetchAnonymousGuideRuntime,
  fetchGuideRuntime,
  runtimeResponse,
  runtimeRoute,
} from '@/lib/runtime-server';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('runtime BFF error handling', () => {
  it('returns a retryable JSON error if the runtime is offline', async () => {
    vi.stubEnv('GUIDE_RUNTIME_URL', 'http://localhost:8787');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    );
    const response = await runtimeRoute(() =>
      fetchAnonymousGuideRuntime('/anonymous/workspaces', undefined),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      code: 'RUNTIME_UNAVAILABLE',
      error: expect.stringContaining('pnpm dev:runtime'),
    });
  });

  it('does not forward plaintext runtime crashes to the JSON-only UI', async () => {
    const response = await runtimeResponse(
      new Response('Internal Server Error', { status: 500 }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      code: 'RUNTIME_UNAVAILABLE',
    });
  });

  it('preserves structured quota errors and their traces', async () => {
    const body = {
      error: 'Daily quota exhausted',
      code: 'QUOTA_EXCEEDED',
      events: [],
    };
    const response = await runtimeResponse(
      Response.json(body, { status: 429 }),
    );
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(body);
  });

  it('forwards successful token revocation without constructing an illegal 204 body', async () => {
    const response = await runtimeResponse(new Response(null, { status: 204 }));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('returns a JSON error for signed-in controls when auth is unavailable', async () => {
    const response = await runtimeRoute(() =>
      fetchGuideRuntime('/v1/mcp-workspaces/weather/token'),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: 'Authentication is not configured.',
    });
  });
});
