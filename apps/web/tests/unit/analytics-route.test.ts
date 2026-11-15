import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const insert = vi.fn<(row: unknown) => Promise<{ error: null }>>(async () => ({
  error: null,
}));
const pending: Array<() => Promise<void> | void> = [];

vi.mock('next/server', () => ({
  after: (task: () => Promise<void> | void) => {
    pending.push(task);
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceSupabaseClient: () =>
    process.env.SUPABASE_SECRET_KEY ? { from: () => ({ insert }) } : null,
}));

const { POST } = await import('@/app/api/e/route');

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://www.allthingsmcp.com/api/e', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      origin: 'https://www.allthingsmcp.com',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'x-forwarded-for': '203.0.113.9',
      ...headers,
    },
  });
}

async function send(body: unknown, headers?: Record<string, string>) {
  const response = await POST(request(body, headers));
  for (const task of pending.splice(0)) await task();
  return response;
}

const pageview = { n: 'pageview', u: 'https://www.allthingsmcp.com/blog' };

beforeEach(() => {
  vi.stubEnv('ANALYTICS_SECRET', 'test-secret');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test');
  vi.stubEnv('ANALYTICS_HOSTNAMES', 'www.allthingsmcp.com');
});

afterEach(() => {
  vi.unstubAllEnvs();
  insert.mockClear();
});

describe('POST /api/e', () => {
  it('stores a valid page view after responding with 204', async () => {
    const response = await send(pageview);
    expect(response.status).toBe(204);
    expect(insert).toHaveBeenCalledOnce();
    expect(insert.mock.calls[0]![0]).toMatchObject({
      name: 'pageview',
      path: '/blog',
    });
  });

  it('answers 204 and stores nothing when not configured', async () => {
    vi.stubEnv('ANALYTICS_SECRET', '');
    expect((await send(pageview)).status).toBe(204);
    vi.stubEnv('ANALYTICS_SECRET', 'test-secret');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    expect((await send(pageview)).status).toBe(204);
    expect(insert).not.toHaveBeenCalled();
  });

  it('ignores invalid bodies, bots and other origins', async () => {
    await send('{not json');
    await send({ n: 'Bad Name', u: pageview.u });
    await send('x'.repeat(5000));
    await send(pageview, { 'user-agent': 'Googlebot/2.1' });
    await send(pageview, { origin: 'https://evil.example' });
    expect(insert).not.toHaveBeenCalled();
  });
});
