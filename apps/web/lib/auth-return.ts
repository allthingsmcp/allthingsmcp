export const pendingAuthReturnKey = 'atm-auth-return';
export const authScrollRestoreKey = 'atm-auth-scroll-restore';

export type AuthReturnState = {
  path: string;
  scrollY: number;
  createdAt: number;
};

const returnStateLifetime = 15 * 60 * 1000;

export function authCallbackOrigin(currentOrigin: string) {
  const origin = new URL(currentOrigin);

  // Supabase currently authorizes the apex production callback while the site
  // itself canonicalizes to www. The platform redirect preserves the OAuth
  // code, and returning to www keeps access to the original sessionStorage.
  if (origin.hostname === 'www.allthingsmcp.com') {
    origin.hostname = 'allthingsmcp.com';
  }

  return origin.origin;
}

export function recoverOAuthCallbackUrl(url: URL) {
  const code = url.pathname === '/' ? url.searchParams.get('code') : null;
  if (!code) return null;

  const callback = new URL('/auth/callback', url.origin);
  callback.searchParams.set('code', code);
  return callback;
}

export function safeAuthReturnPath(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;

  try {
    const base = new URL('https://all-things-mcp.invalid');
    const resolved = new URL(value, base);
    if (resolved.origin !== base.origin) return null;

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return null;
  }
}

export function parseAuthReturnState(
  value: string | null,
  now = Date.now(),
): AuthReturnState | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<AuthReturnState>;
    const path = safeAuthReturnPath(parsed.path);
    if (
      !path ||
      typeof parsed.scrollY !== 'number' ||
      !Number.isFinite(parsed.scrollY) ||
      parsed.scrollY < 0 ||
      typeof parsed.createdAt !== 'number' ||
      now - parsed.createdAt > returnStateLifetime ||
      parsed.createdAt > now + 60_000
    ) {
      return null;
    }

    return { path, scrollY: parsed.scrollY, createdAt: parsed.createdAt };
  } catch {
    return null;
  }
}
