import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for server code only (route handlers and
 * server components). `SUPABASE_SECRET_KEY` is not a NEXT_PUBLIC variable, so
 * it is never bundled for the browser. Returns null when not configured.
 */
let serviceClient: SupabaseClient | undefined;

export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  serviceClient ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
