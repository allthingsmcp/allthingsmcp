import { SignJWT } from 'jose';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const issuer = 'all-things-mcp-web';
const audience = 'all-things-mcp-guide-runtime';

export class AuthenticationRequiredError extends Error {}
export class RuntimeConfigurationError extends Error {}

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
  const runtimeUrl = process.env.GUIDE_RUNTIME_URL;
  if (!runtimeUrl) {
    throw new RuntimeConfigurationError('Guide Runtime is not configured.');
  }

  const token = await createRuntimeToken();
  return fetch(new URL(path, runtimeUrl), {
    ...init,
    cache: 'no-store',
    headers: {
      ...init.headers,
      authorization: `Bearer ${token}`,
    },
  });
}
