import { SignJWT } from 'jose';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const issuer = 'all-things-mcp-web';
const audience = 'all-things-mcp-guide-runtime';

export class AuthenticationRequiredError extends Error {}
export class RuntimeConfigurationError extends Error {}
export class RuntimeUnavailableError extends Error {}

export function runtimeErrorResponse(error: unknown): Response {
  if (error instanceof AuthenticationRequiredError) {
    return Response.json(
      { error: error.message, code: 'AUTHENTICATION_REQUIRED' },
      { status: 401 },
    );
  }
  if (
    error instanceof RuntimeConfigurationError ||
    error instanceof RuntimeUnavailableError
  ) {
    return Response.json(
      { error: error.message, code: 'RUNTIME_UNAVAILABLE' },
      { status: 503 },
    );
  }
  console.error(
    'Guide Runtime request failed.',
    error instanceof Error ? error.name : 'Unknown error',
  );
  return Response.json(
    {
      error: 'Unable to complete the workspace request. Please retry.',
      code: 'WORKSPACE_REQUEST_FAILED',
    },
    { status: 500 },
  );
}

export async function runtimeRoute(operation: () => Promise<Response>) {
  try {
    return await operation();
  } catch (error) {
    return runtimeErrorResponse(error);
  }
}

export async function runtimeResponse(response: Response) {
  if (response.status === 204 || response.status === 205)
    return new Response(null, { status: response.status });
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    return Response.json(
      {
        error:
          'Guide Runtime could not complete the request. Check its database connection and restart the runtime.',
        code: 'RUNTIME_UNAVAILABLE',
      },
      { status: 503 },
    );
  }
  return Response.json(body, { status: response.status });
}

async function requestRuntime(path: string, init: RequestInit) {
  const runtimeUrl = process.env.GUIDE_RUNTIME_URL;
  if (!runtimeUrl)
    throw new RuntimeConfigurationError('Guide Runtime is not configured.');
  let url: URL;
  try {
    url = new URL(path, runtimeUrl);
  } catch {
    throw new RuntimeConfigurationError(
      'GUIDE_RUNTIME_URL must be a complete HTTP URL.',
    );
  }
  try {
    return await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(20_000),
    });
  } catch {
    throw new RuntimeUnavailableError(
      'Guide Runtime is unavailable. Start it with pnpm dev:runtime and retry.',
    );
  }
}

async function createRuntimeToken() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new RuntimeConfigurationError('Authentication is not configured.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthenticationRequiredError('Sign in is required.');
  }

  const sharedSecret = process.env.GUIDE_RUNTIME_SHARED_SECRET;
  if (!sharedSecret) {
    throw new RuntimeConfigurationError('Guide Runtime is not configured.');
  }

  return new SignJWT({
    name:
      user.user_metadata.full_name ??
      user.user_metadata.name ??
      user.email ??
      'ATM reader',
    email: user.email ?? '',
    image: user.user_metadata.avatar_url ?? user.user_metadata.picture ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('60s')
    .sign(new TextEncoder().encode(sharedSecret));
}

export async function fetchGuideRuntime(path: string, init: RequestInit = {}) {
  const token = await createRuntimeToken();
  return requestRuntime(path, {
    ...init,
    headers: {
      ...init.headers,
      authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchAnonymousGuideRuntime(
  path: string,
  credential: string | undefined,
  init: RequestInit = {},
) {
  return requestRuntime(path, {
    ...init,
    headers: {
      ...init.headers,
      ...(credential ? { authorization: `Bearer ${credential}` } : {}),
    },
  });
}

export async function currentRuntimeUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
