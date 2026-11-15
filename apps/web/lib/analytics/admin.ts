import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type AnalyticsAdminState =
  | { status: 'unavailable' }
  | { status: 'signed-out' }
  | { status: 'forbidden' }
  | { status: 'admin'; email: string };

export function parseAdminEmails(value: string | undefined) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Decide access for a user against the allow-list. Pure, for tests. */
export function analyticsAdminState(
  user: Pick<User, 'email' | 'email_confirmed_at'> | null,
  allowList: Set<string>,
): AnalyticsAdminState {
  if (!allowList.size) return { status: 'unavailable' };
  if (!user) return { status: 'signed-out' };
  const email = user.email?.trim().toLowerCase();
  if (!email || !user.email_confirmed_at || !allowList.has(email))
    return { status: 'forbidden' };
  return { status: 'admin', email };
}

/** The signed-in user's access to /admin/analytics, verified with Supabase. */
export async function getAnalyticsAdmin(): Promise<AnalyticsAdminState> {
  const allowList = parseAdminEmails(process.env.ANALYTICS_ADMIN_EMAILS);
  const supabase = await createServerSupabaseClient();
  if (!supabase || !allowList.size) return { status: 'unavailable' };
  const { data } = await supabase.auth.getUser();
  return analyticsAdminState(data.user ?? null, allowList);
}
