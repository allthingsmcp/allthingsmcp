import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function safeReturnPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/guides';
}

function returnUrl(url: URL, status?: 'failed' | 'unavailable') {
  const target = new URL('/auth/return', url.origin);
  const legacyNext = url.searchParams.get('next');
  if (legacyNext) target.searchParams.set('next', safeReturnPath(legacyNext));
  if (status) target.searchParams.set('auth', status);
  return target;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const supabase = await createServerSupabaseClient();

  if (!code || !supabase) {
    return NextResponse.redirect(returnUrl(url, 'unavailable'));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(returnUrl(url, 'failed'));
  }

  return NextResponse.redirect(returnUrl(url));
}
