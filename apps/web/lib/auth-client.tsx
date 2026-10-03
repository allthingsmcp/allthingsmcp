'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/config';

type AuthSession = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type AuthSessionContextValue = {
  data: AuthSession | null;
  isPending: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function toAuthSession(session: Session | null): AuthSession | null {
  if (!session) return null;
  const user: User = session.user;
  return {
    user: {
      id: user.id,
      name:
        user.user_metadata.full_name ??
        user.user_metadata.name ??
        user.email?.split('@')[0] ??
        'ATM reader',
      email: user.email ?? '',
      image:
        user.user_metadata.avatar_url ?? user.user_metadata.picture ?? null,
    },
  };
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createBrowserSupabaseClient(), []);
  const [data, setData] = useState<AuthSession | null>(null);
  const [isPending, setPending] = useState(Boolean(client));

  useEffect(() => {
    if (!client) return;
    let active = true;

    void client.auth
      .getSession()
      .then((result: { data: { session: Session | null } }) => {
        if (!active) return;
        setData(toAuthSession(result.data.session));
        setPending(false);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!active) return;
        setData(toAuthSession(session));
        setPending(false);
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  return (
    <AuthSessionContext.Provider value={{ data, isPending }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

function useSession() {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error('useSession requires AuthSessionProvider.');
  return context;
}

async function signInWithGitHub({
  callbackURL,
  newsletterOptIn,
}: {
  provider: 'github';
  callbackURL: string;
  newsletterOptIn?: boolean;
}) {
  const client = createBrowserSupabaseClient();
  if (!client) return { error: new Error('Authentication is not configured.') };

  const callback = new URL('/auth/callback', window.location.origin);
  const requestedReturn = new URL(callbackURL, window.location.origin);
  callback.searchParams.set(
    'next',
    `${requestedReturn.pathname}${requestedReturn.search}${requestedReturn.hash}`,
  );
  callback.searchParams.set('newsletter', newsletterOptIn ? '1' : '0');

  const { error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: callback.toString() },
  });
  return { error };
}

async function signOut() {
  const client = createBrowserSupabaseClient();
  if (!client) return { error: new Error('Authentication is not configured.') };
  const { error } = await client.auth.signOut();
  return { error };
}

export const authEnabled = supabaseConfigured;
export const authClient = {
  useSession,
  signIn: { social: signInWithGitHub },
  signOut,
};
